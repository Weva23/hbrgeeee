from rest_framework import status
from rest_framework.decorators import api_view, parser_classes, renderer_classes
from rest_framework.parsers import MultiPartParser, FormParser, JSONParser
from rest_framework.renderers import JSONRenderer
from rest_framework.response import Response
from django.shortcuts import get_object_or_404
from django.views.decorators.csrf import csrf_exempt
from django.core.files.storage import default_storage
from django.db import transaction
from django.db.models import Q
from django.http import FileResponse
import mimetypes
from functools import lru_cache
import hashlib
import threading
from django.core.mail import send_mail
from django.conf import settings
from django.contrib.auth.tokens import default_token_generator
from django.utils.http import urlsafe_base64_encode, urlsafe_base64_decode
from django.utils.encoding import force_bytes, force_str
from .models import Consultant, Competence, AppelOffre, User, CriteresEvaluation, MatchingResult, Notification
from .models import DocumentGED, DocumentCategory, DocumentVersion, DocumentAccess, Document 
from .serializers import ConsultantSerializer, CompetenceSerializer, AppelOffreSerializer, CriteresEvaluationSerializer
from .serializers import DocumentGEDSerializer, DocumentCategorySerializer
from .email_service import send_registration_email, send_validation_email
from .competences_data import ALL_SKILLS, DIGITAL_TELECOM_SKILLS, FINANCE_BANKING_SKILLS, ENERGY_TRANSITION_SKILLS, \
    INDUSTRY_MINING_SKILLS
import fitz  # PyMuPDF
from PIL import Image, ImageEnhance
import pytesseract
import spacy
import os
import re
from dotenv import load_dotenv
from django.utils.timezone import now
from decimal import Decimal
from datetime import datetime
import logging

# Configurer le logging
logger = logging.getLogger(__name__)

# Chargement des variables d'environnement
load_dotenv()

# Chargement du modèle NLP
try:
    nlp = spacy.load("en_core_web_sm")
except Exception as e:
    logger.error(f"Erreur lors du chargement du modèle spaCy: {e}")
    nlp = None


@api_view(['POST'])
def cleanup_orphaned_users(request):
    """Nettoie les utilisateurs qui n'ont plus de consultants associés"""
    try:
        # Récupérer tous les IDs des utilisateurs associés à des consultants
        consultant_user_ids = set(Consultant.objects.values_list('user_id', flat=True))

        # Récupérer tous les utilisateurs avec le rôle CONSULTANT qui ne sont pas associés à un consultant
        orphaned_users = User.objects.filter(role='CONSULTANT').exclude(id__in=consultant_user_ids)

        count = orphaned_users.count()
        orphaned_users.delete()

        return Response({"message": f"{count} utilisateurs orphelins supprimés avec succès"})
    except Exception as e:
        return Response({"error": f"Erreur lors du nettoyage des utilisateurs: {str(e)}"}, status=500)


@api_view(['GET'])
def api_public_consultants(request):
    """Récupère la liste des consultants disponibles publiquement"""
    consultants = Consultant.objects.all()
    serializer = ConsultantSerializer(consultants, many=True)
    return Response(serializer.data)


@api_view(['GET', 'POST'])
def admin_consultants(request):
    """Liste ou crée des consultants (accès admin)"""
    try:
        # Récupère seulement les consultants validés
        if request.method == 'GET':
            consultants = Consultant.objects.filter(is_validated=True)
            serializer = ConsultantSerializer(consultants, many=True)
            return Response({"success": True, "data": serializer.data})

        if request.method == 'POST':
            serializer = ConsultantSerializer(data=request.data)
            if serializer.is_valid():
                serializer.save()
                return Response(serializer.data, status=status.HTTP_201_CREATED)
            return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)
    except Exception as e:
        logger.error(f"Erreur lors de la récupération des consultants: {str(e)}")
        return Response({"success": False, "error": str(e)}, status=500)


# Remplacez la fonction admin_consultant_detail dans votre fichier views.py

@api_view(['PUT', 'DELETE'])
def admin_consultant_detail(request, pk):
    """Modifie ou supprime un consultant spécifique (accès admin)"""
    try:
        consultant = get_object_or_404(Consultant, pk=pk)

        if request.method == 'PUT':
            # Code existant pour PUT...
            serializer = ConsultantSerializer(consultant, data=request.data, partial=True)
            if serializer.is_valid():
                serializer.save()
                return Response(serializer.data)
            return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)

        if request.method == 'DELETE':
            try:
                # Récupérer l'utilisateur associé avant de supprimer le consultant
                user = consultant.user
                user_id = None
                user_email = None

                if user:
                    user_id = user.id
                    user_email = user.email
                    logger.info(f"Utilisateur associé trouvé: ID={user_id}, Email={user_email}")

                # Supprimer explicitement les entités liées dans cet ordre
                # 1. Notifications
                try:
                    from .models import Notification
                    notifications = Notification.objects.filter(consultant=consultant)
                    if notifications.exists():
                        count = notifications.count()
                        notifications.delete()
                        logger.info(f"{count} notifications liées au consultant ID={pk} supprimées")
                except Exception as notif_error:
                    logger.warning(f"Erreur lors de la suppression des notifications: {str(notif_error)}")

                # 2. Matchings
                matchings = MatchingResult.objects.filter(consultant=consultant)
                if matchings.exists():
                    count = matchings.count()
                    matchings.delete()
                    logger.info(f"{count} matchings liés au consultant ID={pk} supprimés")
                
                # 3. Compétences
                competences = Competence.objects.filter(consultant=consultant)
                if competences.exists():
                    count = competences.count()
                    competences.delete()
                    logger.info(f"{count} compétences liées au consultant ID={pk} supprimées")
                
                # 4. Documents GED - mettre à NULL la clé étrangère de consultant
                doc_ged = DocumentGED.objects.filter(consultant=consultant)
                if doc_ged.exists():
                    count = doc_ged.count()
                    # Mettre à jour chaque document en définissant consultant à NULL
                    doc_ged.update(consultant=None)
                    logger.info(f"{count} documents GED liés au consultant ID={pk} mis à jour")
                
                # 5. Documents réguliers
                documents = Document.objects.filter(consultant=consultant)
                if documents.exists():
                    count = documents.count()
                    documents.delete()
                    logger.info(f"{count} documents liés au consultant ID={pk} supprimés")
                
                # 6. Le consultant lui-même
                consultant.delete()
                logger.info(f"Consultant ID={pk} supprimé")
                
                # 7. L'utilisateur en dernier
                if user:
                    user.delete()
                    logger.info(f"Utilisateur ID={user_id} supprimé")

                return Response(status=status.HTTP_204_NO_CONTENT)
            except Exception as e:
                logger.error(f"Erreur lors de la suppression: {str(e)}")
                return Response({"error": f"Erreur: {str(e)}"}, status=500)
    except Exception as e:
        logger.error(f"Erreur lors de l'accès au consultant ID={pk}: {str(e)}")
        return Response({"error": str(e)}, status=404)
    """Modifie ou supprime un consultant spécifique (accès admin)"""
    try:
        consultant = get_object_or_404(Consultant, pk=pk)

        if request.method == 'PUT':
            # Code existant pour PUT...
            return Response(serializer.data)

        if request.method == 'DELETE':
            try:
                # Récupérer l'utilisateur associé avant de supprimer le consultant
                user = consultant.user
                user_id = None
                user_email = None

                if user:
                    user_id = user.id
                    user_email = user.email
                    logger.info(f"Utilisateur associé trouvé: ID={user_id}, Email={user_email}")

                # Supprimer explicitement les entités liées dans cet ordre
                # 1. Notifications
                try:
                    from .models import Notification
                    notifications = Notification.objects.filter(consultant=consultant)
                    if notifications.exists():
                        count = notifications.count()
                        notifications.delete()
                        logger.info(f"{count} notifications liées au consultant ID={pk} supprimées")
                except Exception as notif_error:
                    logger.warning(f"Erreur lors de la suppression des notifications: {str(notif_error)}")

                # 2. Matchings
                MatchingResult.objects.filter(consultant=consultant).delete()
                
                # 3. Compétences
                Competence.objects.filter(consultant=consultant).delete()
                
                # 4. Documents GED
                DocumentGED.objects.filter(consultant=consultant).set_null()
                
                # 5. Documents
                Document.objects.filter(consultant=consultant).delete()
                
                # 6. Le consultant lui-même
                consultant.delete()
                
                # 7. L'utilisateur en dernier
                if user:
                    user.delete()

                return Response(status=status.HTTP_204_NO_CONTENT)
            except Exception as e:
                logger.error(f"Erreur lors de la suppression: {str(e)}")
                return Response({"error": f"Erreur: {str(e)}"}, status=500)
    except Exception as e:
        logger.error(f"Erreur lors de l'accès au consultant ID={pk}: {str(e)}")
        return Response({"error": str(e)}, status=404)
    """Modifie ou supprime un consultant spécifique (accès admin)"""
    try:
        consultant = get_object_or_404(Consultant, pk=pk)

        if request.method == 'PUT':
            serializer = ConsultantSerializer(consultant, data=request.data, partial=True)
            if serializer.is_valid():
                serializer.save()
                return Response(serializer.data)
            return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)

        if request.method == 'DELETE':
            try:
                # Récupérer l'utilisateur associé avant de supprimer le consultant
                user = consultant.user
                user_id = None
                user_email = None

                if user:
                    user_id = user.id
                    user_email = user.email
                    logger.info(f"Utilisateur associé trouvé: ID={user_id}, Email={user_email}")

                # 1. Supprimer d'abord les notifications liées au consultant
                from .models import Notification  # Import ici pour éviter les problèmes d'import circulaire
                notifications = Notification.objects.filter(consultant=consultant)
                if notifications.exists():
                    count = notifications.count()
                    notifications.delete()
                    logger.info(f"{count} notifications liées au consultant ID={pk} supprimées")

                # 2. Supprimer les matchings liés au consultant
                matchings = MatchingResult.objects.filter(consultant=consultant)
                if matchings.exists():
                    count = matchings.count()
                    matchings.delete()
                    logger.info(f"{count} matchings liés au consultant ID={pk} supprimés")

                # 3. Supprimer les compétences liées au consultant
                competences = Competence.objects.filter(consultant=consultant)
                if competences.exists():
                    count = competences.count()
                    competences.delete()
                    logger.info(f"{count} compétences liées au consultant ID={pk} supprimées")

                # 4. Supprimer le consultant lui-même
                consultant.delete()
                logger.info(f"Consultant ID={pk} supprimé")

                # 5. Si un utilisateur est associé, le supprimer en dernier
                if user:
                    user.delete()
                    logger.info(f"Utilisateur ID={user_id} supprimé")

                return Response(status=status.HTTP_204_NO_CONTENT)
            except Exception as e:
                logger.error(f"Erreur lors de la suppression du consultant ID={pk}: {str(e)}")
                return Response({"error": f"Erreur lors de la suppression: {str(e)}"}, status=status.HTTP_500_INTERNAL_SERVER_ERROR)
    except Exception as e:
        logger.error(f"Erreur lors de l'accès au consultant ID={pk}: {str(e)}")
        return Response({"error": str(e)}, status=status.HTTP_404_NOT_FOUND)
@api_view(['GET'])
def consultant_competences(request, consultant_id):
    """Récupère les compétences d'un consultant spécifique"""
    consultant = get_object_or_404(Consultant, id=consultant_id)
    competences = Competence.objects.filter(consultant=consultant)
    serializer = CompetenceSerializer(competences, many=True)
    return Response(serializer.data)


@api_view(['POST'])
def add_consultant_competence(request, consultant_id):
    """Ajoute une compétence à un consultant"""
    try:
        consultant = get_object_or_404(Consultant, id=consultant_id)
        nom_competence = request.data.get('nom_competence')
        niveau = request.data.get('niveau', 1)

        if not nom_competence:
            return Response({"error": "Nom de compétence requis"}, status=400)

        # Vérifier si la compétence existe déjà
        if Competence.objects.filter(consultant=consultant, nom_competence__iexact=nom_competence).exists():
            return Response({"error": "Cette compétence existe déjà pour ce consultant"}, status=400)

        # Créer la compétence
        competence = Competence.objects.create(
            consultant=consultant,
            nom_competence=nom_competence,
            niveau=niveau
        )

        # Mise à jour du niveau d'expertise
        nb = Competence.objects.filter(consultant=consultant).count()
        consultant.expertise = "Expert" if nb >= 10 else "Intermédiaire" if nb >= 5 else "Débutant"
        consultant.save()

        return Response(CompetenceSerializer(competence).data, status=201)
    except Exception as e:
        return Response({"error": str(e)}, status=500)


@api_view(['DELETE'])
def delete_consultant_competence(request, consultant_id, competence_id):
    """Supprime une compétence d'un consultant"""
    try:
        consultant = get_object_or_404(Consultant, id=consultant_id)
        competence = get_object_or_404(Competence, id=competence_id, consultant=consultant)

        competence.delete()

        # Mise à jour du niveau d'expertise
        nb = Competence.objects.filter(consultant=consultant).count()
        consultant.expertise = "Expert" if nb >= 10 else "Intermédiaire" if nb >= 5 else "Débutant"
        consultant.save()

        return Response(status=204)
    except Exception as e:
        return Response({"error": str(e)}, status=500)


@api_view(['GET'])
def get_competences_by_domain(request, domain):
    """Récupère toutes les compétences d'un domaine spécifique"""
    if domain not in ALL_SKILLS:
        return Response({"error": "Domaine invalide"}, status=400)

    competences = ALL_SKILLS[domain]
    return Response({"domain": domain, "competences": competences})


@api_view(['GET'])
def get_all_domains(request):
    """Récupère la liste des domaines avec un échantillon de compétences"""
    domains = []
    for domain, skills in ALL_SKILLS.items():
        # Récupérer les 5 premières compétences comme exemple
        sample_skills = skills[:5]
        domains.append({
            "code": domain,
            "name": dict(Consultant.SPECIALITES_CHOICES)[domain],
            "sample_skills": sample_skills
        })

    return Response({"domains": domains})


@api_view(['GET'])
def dashboard_stats(request):
    """Récupère les statistiques pour le tableau de bord admin"""
    # Vérifier l'authentification admin (à implémenter)

    consultants_count = Consultant.objects.count()
    appels_total = AppelOffre.objects.count()
    offres_actives = AppelOffre.objects.filter(statut="En_cours").count()
    offres_expirees = AppelOffre.objects.filter(date_fin__lt=now().date()).count()

    derniers_consultants = Consultant.objects.order_by('-created_at')[:3]
    derniers_appels = AppelOffre.objects.order_by('-date_debut')[:3]

    data = {
        "consultants_count": consultants_count,
        "appels_total": appels_total,
        "offres_actives": offres_actives,
        "offres_expirees": offres_expirees,
        "derniers_consultants": [
            {
                "nom": f"{c.nom} {c.prenom}",
                "specialite": c.specialite,
                "date": c.created_at.strftime('%d/%m/%Y')
            } for c in derniers_consultants
        ],
        "derniers_appels": [
            {
                "title": a.nom_projet,
                "client": a.client,
                "date": a.date_debut.strftime('%d/%m/%Y')
            } for a in derniers_appels
        ]
    }
    return Response(data)


@api_view(['GET', 'POST'])
def admin_appels_offres(request):
    """Liste ou crée des appels d'offres (accès admin)"""
    # Vérifier l'authentification admin (à implémenter)

    if request.method == 'GET':
        appels = AppelOffre.objects.all()
        serializer = AppelOffreSerializer(appels, many=True)
        return Response(serializer.data)

    if request.method == 'POST':
        serializer = AppelOffreSerializer(data=request.data)
        if serializer.is_valid():
            serializer.save()
            return Response(serializer.data, status=status.HTTP_201_CREATED)
        return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)


@api_view(['PUT', 'DELETE'])
def admin_appel_offre_detail(request, pk):
    """Modifie ou supprime un appel d'offre spécifique (accès admin)"""
    # Vérifier l'authentification admin (à implémenter)

    appel = get_object_or_404(AppelOffre, pk=pk)

    if request.method == 'PUT':
        serializer = AppelOffreSerializer(appel, data=request.data, partial=True)
        if serializer.is_valid():
            serializer.save()
            return Response(serializer.data)
        return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)

    if request.method == 'DELETE':
        appel.delete()
        return Response(status=status.HTTP_204_NO_CONTENT)


def extract_competences(cv_text):
    """
    Extrait les compétences à partir du texte d'un CV en utilisant les listes prédéfinies par domaine
    """
    if not cv_text or not isinstance(cv_text, str):
        return [], 'DIGITAL'

    # Normalisation du texte pour la recherche
    cv_text_lower = cv_text.lower()

    # Comptage des mots-clés par domaine pour déterminer le domaine principal
    domain_scores = {
        'DIGITAL': 0,
        'FINANCE': 0,
        'ENERGIE': 0,
        'INDUSTRIE': 0
    }

    # Chercher les compétences dans le texte
    found_skills = set()

    for domain, skills in ALL_SKILLS.items():
        for skill in skills:
            skill_lower = skill.lower()
            # Vérification plus flexible - si le terme est présent
            if skill_lower in cv_text_lower:
                found_skills.add(skill)
                domain_scores[domain] += 1

    # Déterminer le domaine principal
    primary_domain = max(domain_scores.items(), key=lambda x: x[1])[0] if any(domain_scores.values()) else 'DIGITAL'

    # S'il y a peu de compétences trouvées, chercher des termes partiels
    if len(found_skills) < 5:
        # Extraction de termes techniques (minimum 4 caractères)
        tech_words = set()
        for word in re.findall(r'\b([A-Za-z]{4,}[+]?)\b', cv_text):
            if word.lower() not in ['avec', 'pour', 'dans', 'cette', 'votre', 'notre', 'leur']:
                tech_words.add(word.capitalize())

        # Ajouter quelques termes techniques détectés
        found_skills.update(list(tech_words)[:10])

    return sorted(list(found_skills)), primary_domain


def extract_competences_from_cv(file_path):
    """
    Extrait les compétences à partir d'un fichier CV (PDF)
    """
    logger.info(f"Extraction depuis le fichier: {file_path}")
    try:
        # Vérifier si le fichier existe
        if not os.path.exists(file_path):
            logger.error(f"Erreur: Le fichier {file_path} n'existe pas")
            return [], 'DIGITAL'

        # Tentative d'extraction de texte à partir du PDF
        try:
            doc = fitz.open(file_path)
            text = "\n".join([page.get_text("text") for page in doc])
            logger.info(f"Texte extrait du PDF ({len(text)} caractères)")

            # Si le PDF n'a pas de texte, utiliser OCR
            if not text.strip():
                logger.info("Pas de texte extrait, tentative OCR...")
                text = ""
                for page in doc:
                    pix = page.get_pixmap(dpi=300)
                    img = Image.frombytes("RGB", [pix.width, pix.height], pix.samples)
                    img = img.convert("L")
                    img = ImageEnhance.Contrast(img).enhance(3.0)
                    img = ImageEnhance.Sharpness(img).enhance(2.0)
                    text += pytesseract.image_to_string(img, lang="eng+fra")
                logger.info(f"Texte extrait par OCR ({len(text)} caractères)")
        except Exception as e:
            logger.error(f"Erreur lors de l'extraction du PDF: {e}")
            return [], 'DIGITAL'

        # Extraction des compétences à partir du texte
        competences, primary_domain = extract_competences(text)
        logger.info(f"Compétences extraites: {competences}")
        logger.info(f"Domaine principal détecté: {primary_domain}")
        return competences, primary_domain
    except Exception as e:
        logger.error(f"Erreur globale d'extraction: {e}")
        return [], 'DIGITAL'


def extract_and_save_competences_async(file_path, consultant):
    """
    Fonction asynchrone pour extraire les compétences d'un CV et les sauvegarder
    """
    try:
        logger.info(f"Début d'extraction des compétences pour {consultant.nom} depuis {file_path}")

        # Extraction des compétences
        competences, primary_domain = extract_competences_from_cv(file_path)
        logger.info(f"Compétences trouvées pour {consultant.nom}: {competences}")
        logger.info(f"Domaine principal détecté: {primary_domain}")

        # Mettre à jour le domaine principal si détecté
        if primary_domain:
            consultant.domaine_principal = primary_domain
            consultant.save()
            logger.info(f"Domaine principal mis à jour pour {consultant.nom}: {primary_domain}")

        # Enregistrement des compétences
        added_names = set()
        for nom in competences:
            nom_clean = nom.strip().strip(":,.\u2022°").title()

            if nom_clean.lower() in added_names:
                continue

            if not Competence.objects.filter(nom_competence__iexact=nom_clean, consultant=consultant).exists():
                Competence.objects.create(
                    consultant=consultant,
                    nom_competence=nom_clean,
                    niveau=1
                )
                added_names.add(nom_clean.lower())
                logger.info(f"Compétence ajoutée pour {consultant.nom}: {nom_clean}")

        # Mise à jour du niveau d'expertise
        nb = Competence.objects.filter(consultant=consultant).count()
        consultant.expertise = "Expert" if nb >= 10 else "Intermédiaire" if nb >= 5 else "Débutant"
        consultant.save()

        logger.info(f"Extraction terminée pour {consultant.nom} - {len(added_names)} compétences ajoutées")
    except Exception as e:
        logger.error(f"Erreur complète lors de l'extraction pour {consultant.nom}: {e}")


@api_view(['POST'])
@parser_classes([MultiPartParser, FormParser])
def consultant_register(request):
    """
    Enregistre un nouveau consultant
    """
    try:
        logger.info("Données reçues pour l'inscription:", request.data)
        email = request.data.get('email')
        nom = request.data.get('nom') or 'Consultant'
        prenom = request.data.get('prenom') or ''
        password = request.data.get('password') or 'consultant123'
        domaine_principal = request.data.get('domaine_principal') or 'DIGITAL'

        # Vérifier si un utilisateur avec cet email existe
        existing_user = User.objects.filter(username=email).first()

        # Si l'utilisateur existe, vérifier s'il est associé à un consultant actif
        if existing_user:
            # Vérifier si l'utilisateur est associé à un consultant
            has_consultant = Consultant.objects.filter(user=existing_user).exists()

            if has_consultant:
                return Response({"error": "Utilisateur existe déjà."}, status=400)
            else:
                # L'utilisateur existe mais n'a pas de consultant associé
                # Nous allons le supprimer pour permettre la réinscription
                logger.info(f"Suppression de l'utilisateur orphelin: {existing_user.username}")
                existing_user.delete()

        with transaction.atomic():
            # Création de l'utilisateur
            user = User.objects.create_user(
                username=email,
                email=email,
                password=password,
                nom=nom,
                role='CONSULTANT'
            )
            logger.info(f"Utilisateur créé: {user.username} (ID: {user.id})")

            # Préparation des données consultant
            data = request.data.copy()
            data['user'] = user.id
            data['prenom'] = prenom

            # S'assurer que l'email est défini
            if 'email' not in data or not data['email']:
                data['email'] = email

            # Assurer que le domaine principal est défini
            if 'domaine_principal' not in data or not data['domaine_principal']:
                data['domaine_principal'] = domaine_principal

            # Création du consultant
            serializer = ConsultantSerializer(data=data)
            if serializer.is_valid():
                consultant = serializer.save()
                # Définir le consultant comme non validé par défaut
                consultant.is_validated = False
                consultant.save()

                logger.info(f"Consultant créé: {consultant.nom} {consultant.prenom} (ID: {consultant.id})")

                # Calculer statut actif/inactif
                dispo_debut = request.data.get('date_debut_dispo')
                dispo_fin = request.data.get('date_fin_dispo')
                from datetime import datetime
                now = datetime.now().date()

                if dispo_debut and dispo_fin:
                    d1 = datetime.strptime(dispo_debut, "%Y-%m-%d").date()
                    d2 = datetime.strptime(dispo_fin, "%Y-%m-%d").date()
                    consultant.status = "Actif" if d1 <= now <= d2 else "Inactif"
                    consultant.save()

                # Gestion du fichier CV
                cv_file = request.FILES.get('cv')
                if cv_file:
                    logger.info(f"CV reçu: {cv_file.name}")
                    path = default_storage.save(f"cvs/{cv_file.name}", cv_file)
                    file_path = default_storage.path(path)
                    logger.info(f"CV enregistré à: {file_path}")

                    # Extraire compétences en arrière-plan
                    thread = threading.Thread(
                        target=extract_and_save_competences_async,
                        args=(file_path, consultant)
                    )
                    thread.daemon = True
                    thread.start()
                    logger.info(f"Thread d'extraction démarré pour {consultant.nom}")

                # Compétences manuelles si fournies
                competences_str = request.data.get('competences')
                if competences_str:
                    competences = [c.strip() for c in competences_str.split(',') if c.strip()]
                    for comp in competences:
                        if not Competence.objects.filter(consultant=consultant, nom_competence__iexact=comp).exists():
                            Competence.objects.create(
                                consultant=consultant,
                                nom_competence=comp,
                                niveau=2
                            )
                    logger.info(f"{len(competences)} compétences manuelles ajoutées")

                # Envoi d'email de confirmation
                try:
                    # Vérifier que les données de l'email sont correctes
                    logger.info(f"Tentative d'envoi d'email à {consultant.email}")

                    # Vérifier la configuration des emails dans settings.py
                    email_host = getattr(settings, 'EMAIL_HOST', None)
                    email_port = getattr(settings, 'EMAIL_PORT', None)
                    default_from = getattr(settings, 'DEFAULT_FROM_EMAIL', None)

                    logger.info(f"Configuration email: HOST={email_host}, PORT={email_port}, FROM={default_from}")

                    # Envoi de l'email avec gestion d'erreur améliorée
                    email_sent = send_registration_email(consultant)
                    if email_sent:
                        logger.info(f"Email de confirmation envoyé avec succès à {consultant.email}")
                    else:
                        logger.warning(f"Échec de l'envoi d'email à {consultant.email}, mais l'inscription est réussie")
                except Exception as e:
                    logger.error(f"Erreur lors de l'envoi de l'email de confirmation: {str(e)}")

                # Retour réussi avec l'ID consultant
                logger.info(f"Inscription réussie pour {consultant.nom} (ID: {consultant.id})")
                return Response({
                    "message": "Consultant créé avec succès. Votre compte est en attente de validation par un administrateur.",
                    "consultant_id": consultant.id,
                    "is_validated": False
                }, status=201)

            # Erreur de validation
            logger.error(f"Erreur de validation: {serializer.errors}")
            return Response(serializer.errors, status=400)

    except Exception as e:
        logger.error(f"Erreur lors de l'inscription: {str(e)}")
        return Response({"error": str(e)}, status=500)


@api_view(['POST'])
def consultant_login(request):
    """
    Connecte un consultant existant
    """
    logger.info("Tentative de connexion consultant:", request.data)

    email = request.data.get('email')
    password = request.data.get('password')

    if not email or not password:
        logger.warning(f"Email ou mot de passe manquant: email={email}, password={'*' if password else 'None'}")
        return Response({"error": "Email et mot de passe requis"}, status=400)

    try:
        # Recherche de l'utilisateur par email
        user = User.objects.get(username=email)
        logger.info(f"Utilisateur trouvé: {user.username} (ID: {user.id})")

        # Vérification du mot de passe
        if not user.check_password(password):
            logger.warning(f"Mot de passe incorrect pour {email}")
            return Response({"error": "Mot de passe incorrect"}, status=400)

        # Vérification que l'utilisateur est bien un consultant
        if not hasattr(user, 'consultant_profile'):
            logger.warning(f"L'utilisateur {email} n'est pas un consultant")
            # Vérifier si un consultant existe pour cet utilisateur
            consultants = Consultant.objects.filter(user=user)
            if consultants.exists():
                consultant = consultants.first()
                logger.info(f"Consultant trouvé manuellement: {consultant.nom} (ID: {consultant.id})")

                # Vérifier si le consultant est validé
                if not consultant.is_validated:
                    return Response({
                        "error": "Votre compte est en attente de validation par un administrateur",
                        "is_validated": False
                    }, status=403)

                return Response({
                    "consultant_id": consultant.id,
                    "is_validated": True
                })
            else:
                return Response({"error": "Ce compte n'est pas un consultant"}, status=400)

        # Récupération du consultant associé
        consultant = user.consultant_profile

        # Vérifier si le consultant est validé
        if not consultant.is_validated:
            return Response({
                "error": "Votre compte est en attente de validation par un administrateur",
                "is_validated": False
            }, status=403)

        # Connexion réussie
        logger.info(f"Connexion réussie pour {email} - ID consultant: {consultant.id}")
        return Response({
            "consultant_id": consultant.id,
            "is_validated": True
        })

    except User.DoesNotExist:
        logger.warning(f"Utilisateur non trouvé: {email}")
        return Response({"error": "Email incorrect"}, status=404)
    except Exception as e:
        logger.error(f"Erreur inattendue lors de la connexion: {e}")
        # Tentative de récupération du consultant par email
        try:
            consultant = Consultant.objects.filter(email=email).first()
            if consultant:
                logger.info(f"Consultant trouvé par email: {consultant.nom} (ID: {consultant.id})")
                if consultant.user and consultant.user.check_password(password):
                    # Vérifier si le consultant est validé
                    if not consultant.is_validated:
                        return Response({
                            "error": "Votre compte est en attente de validation par un administrateur",
                            "is_validated": False
                        }, status=403)

                    return Response({
                        "consultant_id": consultant.id,
                        "is_validated": True
                    })
        except Exception:
            pass

        return Response({"error": "Erreur lors de la connexion"}, status=500)


from decimal import Decimal
import logging
import re
import numpy as np
from sklearn.feature_extraction.text import TfidfVectorizer
from sklearn.metrics.pairwise import cosine_similarity
from datetime import datetime, timedelta

# Configurer le logging
logger = logging.getLogger(__name__)

# Cache des scores calculés (en mémoire durant l'exécution)
_score_cache = {}

def get_cache_key(consultant_id, appel_offre_id):
    """
    Crée une clé de cache unique pour un consultant et un appel d'offre
    """
    return f"{consultant_id}_{appel_offre_id}"

def calculate_date_match_score(consultant, appel_offre):
    """
    Calcule un score basé sur la disponibilité du consultant par rapport aux dates du projet
    Version améliorée avec prise en compte de la flexibilité des dates
    """
    try:
        # Vérifier si le résultat est en cache
        cache_key = f"date_{get_cache_key(consultant.id, appel_offre.id)}"
        if cache_key in _score_cache:
            logger.info(f"Score de date trouvé en cache pour consultant {consultant.id} et AO {appel_offre.id}")
            return _score_cache[cache_key]
            
        # Vérifier que toutes les dates sont bien définies
        if not consultant.date_debut_dispo or not consultant.date_fin_dispo or not appel_offre.date_debut or not appel_offre.date_fin:
            logger.warning(f"Dates manquantes - consultant {consultant.id} ou appel d'offre {appel_offre.id}")
            return 0
            
        # Convertir les dates en objets datetime pour comparaison
        consultant_start = consultant.date_debut_dispo
        consultant_end = consultant.date_fin_dispo
        project_start = appel_offre.date_debut
        project_end = appel_offre.date_fin

        # Cas où il n'y a pas de chevauchement
        if consultant_end < project_start or consultant_start > project_end:
            # Vérifier la proximité des dates (flexibilité)
            # Si le consultant est disponible un peu avant ou après le projet, on donne un score partiel
            buffer_days = 30  # Jours de tolérance
            
            if consultant_end < project_start:
                days_gap = (project_start - consultant_end).days
                if days_gap <= buffer_days:
                    # Score partiel basé sur la proximité
                    score = max(0, 30 * (1 - days_gap / buffer_days))
                    _score_cache[cache_key] = score
                    return score
            else:  # consultant_start > project_end
                days_gap = (consultant_start - project_end).days
                if days_gap <= buffer_days:
                    # Score partiel basé sur la proximité
                    score = max(0, 30 * (1 - days_gap / buffer_days))
                    _score_cache[cache_key] = score
                    return score
            _score_cache[cache_key] = 0
            return 0

        # Cas où la disponibilité du consultant couvre entièrement le projet
        if consultant_start <= project_start and consultant_end >= project_end:
            # Bonus pour disponibilité complète
            buffer_days_before = (project_start - consultant_start).days
            buffer_days_after = (consultant_end - project_end).days
            
            # Si le consultant a aussi une marge avant et après (plus de flexibilité), bonus supplémentaire
            flexibility_bonus = min(10, (buffer_days_before + buffer_days_after) / 10)
            score = min(100, 100 + flexibility_bonus)
            _score_cache[cache_key] = score
            return score

        # Calcul du chevauchement partiel
        total_project_days = (project_end - project_start).days + 1
        if total_project_days <= 0:
            _score_cache[cache_key] = 0
            return 0  # Éviter division par zéro

        overlap_start = max(consultant_start, project_start)
        overlap_end = min(consultant_end, project_end)
        overlap_days = (overlap_end - overlap_start).days + 1

        # Calculer le pourcentage de chevauchement avec une fonction non-linéaire
        # Favorise fortement les correspondances de date élevées (>80%)
        coverage_percentage = (overlap_days / total_project_days) * 100
        
        if coverage_percentage >= 80:
            # Bonus pour une couverture presque complète
            adjusted_score = 90 + (coverage_percentage - 80) / 2
        else:
            # Pénalisation plus forte pour les couvertures faibles
            adjusted_score = coverage_percentage * (0.8 + 0.2 * (coverage_percentage / 100))

        score = min(100, adjusted_score)
        _score_cache[cache_key] = score
        return score
    except Exception as e:
        logger.error(f"Erreur lors du calcul du score de date: {str(e)}")
        return 0

def get_competence_similarity(comp1, comp2):
    """
    Calcule la similarité entre deux compétences en utilisant une approche de similarité lexicale
    Version améliorée avec meilleure correspondance des synonymes et acronymes
    """
    try:
        # Normalisation
        comp1 = comp1.lower().strip()
        comp2 = comp2.lower().strip()
        
        # Correspondance exacte
        if comp1 == comp2:
            return 1.0
        
        # Dictionnaire d'acronymes et leur forme développée
        acronyms = {
            "js": "javascript",
            "ts": "typescript",
            "py": "python",
            "react": "reactjs",
            "vue": "vuejs",
            "angular": "angularjs",
            "node": "nodejs",
            "aws": "amazon web services",
            "gcp": "google cloud platform",
            "azure": "microsoft azure",
            "ml": "machine learning",
            "ai": "artificial intelligence",
            "oop": "object oriented programming",
            "db": "database",
            "ui": "user interface",
            "ux": "user experience",
            "spa": "single page application",
        }
        
        # Développer les acronymes si présents
        for acronym, expanded in acronyms.items():
            if comp1 == acronym:
                comp1 = expanded
            if comp2 == acronym:
                comp2 = expanded
        
        # Si l'une contient l'autre entièrement
        if comp1 in comp2 or comp2 in comp1:
            # Plus le ratio de longueur est élevé, plus la similarité est élevée
            ratio = min(len(comp1), len(comp2)) / max(len(comp1), len(comp2))
            return 0.85 * ratio
        
        # Pour les technos avec version (ex: "Java 8" et "Java")
        base_comp1 = re.sub(r'\s+\d+(\.\d+)*', '', comp1)
        base_comp2 = re.sub(r'\s+\d+(\.\d+)*', '', comp2)
        
        if base_comp1 == base_comp2:
            return 0.95
        
        # Tokens communs (amélioré pour gérer les mots composés)
        tokens1 = set(re.findall(r'\b\w+\b', comp1))
        tokens2 = set(re.findall(r'\b\w+\b', comp2))
        
        if not tokens1 or not tokens2:
            return 0
            
        common_tokens = tokens1.intersection(tokens2)
        
        if common_tokens:
            jaccard = len(common_tokens) / len(tokens1.union(tokens2))
            return 0.7 * jaccard
        
        # Similarité de Levenshtein pour les petites différences d'orthographe
        # Calculer la distance de Levenshtein
        def levenshtein(s1, s2):
            if len(s1) < len(s2):
                return levenshtein(s2, s1)
            if len(s2) == 0:
                return len(s1)
            
            previous_row = range(len(s2) + 1)
            for i, c1 in enumerate(s1):
                current_row = [i + 1]
                for j, c2 in enumerate(s2):
                    insertions = previous_row[j + 1] + 1
                    deletions = current_row[j] + 1
                    substitutions = previous_row[j] + (c1 != c2)
                    current_row.append(min(insertions, deletions, substitutions))
                previous_row = current_row
            
            return previous_row[-1]
        
        # Si les chaînes sont proches
        if min(len(comp1), len(comp2)) > 3:
            distance = levenshtein(comp1, comp2)
            max_length = max(len(comp1), len(comp2))
            if distance <= 2 and max_length > 4:  # Tolérance plus forte pour les mots plus longs
                return 0.7 * (1 - distance / max_length)
            elif distance <= 1 and max_length <= 4:  # Tolérance plus faible pour les mots courts
                return 0.6 * (1 - distance / max_length)
            
        return 0
    except Exception as e:
        logger.error(f"Erreur dans get_competence_similarity: {str(e)}")
        return 0


    """
    Calcule la similarité entre deux compétences en utilisant une approche de similarité lexicale
    """
    comp1 = comp1.lower()
    comp2 = comp2.lower()
    
    # Correspondance exacte
    if comp1 == comp2:
        return 1.0
    
    # Si l'une contient l'autre entièrement
    if comp1 in comp2 or comp2 in comp1:
        # Plus le ratio de longueur est élevé, plus la similarité est élevée
        ratio = min(len(comp1), len(comp2)) / max(len(comp1), len(comp2))
        return 0.8 * ratio
    
    # Pour les technos avec version (ex: "Java 8" et "Java")
    base_comp1 = re.sub(r'\s+\d+(\.\d+)*', '', comp1)
    base_comp2 = re.sub(r'\s+\d+(\.\d+)*', '', comp2)
    
    if base_comp1 == base_comp2:
        return 0.9
    
    # Tokens communs
    tokens1 = set(re.findall(r'\b\w+\b', comp1))
    tokens2 = set(re.findall(r'\b\w+\b', comp2))
    
    if not tokens1 or not tokens2:
        return 0
        
    common_tokens = tokens1.intersection(tokens2)
    
    if common_tokens:
        jaccard = len(common_tokens) / len(tokens1.union(tokens2))
        return 0.6 * jaccard
    
    return 0


def build_competence_mapping():
    """
    Construit une table de correspondance entre compétences liées
    pour les technologies similaires ou associées
    """
    # Définir des groupes de technologies reliées avec une valeur de similarité
    related_technologies = {
        # Langages frontend
        "javascript": ["typescript", "ecmascript", "js", "react", "angular", "vue.js", "node.js", "jquery", "ajax"],
        "html": ["html5", "css", "css3", "sass", "less", "bootstrap", "tailwind"],
        "css": ["html", "html5", "sass", "less", "bootstrap", "tailwind"],
        
        # Langages backend
        "python": ["django", "flask", "fastapi", "python3", "pandas", "numpy", "scikit-learn", "pytorch", "tensorflow"],
        "java": ["spring", "spring boot", "j2ee", "java ee", "hibernate", "jsp", "servlet", "maven", "gradle"],
        "c#": [".net", "asp.net", "mvc", "entity framework", "linq", "visual studio", "xamarin"],
        "php": ["laravel", "symfony", "wordpress", "drupal", "magento", "php7", "php8"],
        
        # Bases de données
        "sql": ["mysql", "postgresql", "oracle", "sql server", "sqlite", "mariadb", "transact-sql", "pl/sql"],
        "nosql": ["mongodb", "couchdb", "redis", "cassandra", "firebase", "dynamodb", "elasticsearch"],
        
        # DevOps & Cloud
        "devops": ["ci/cd", "jenkins", "gitlab ci", "github actions", "docker", "kubernetes", "ansible", "terraform"],
        "aws": ["amazon web services", "ec2", "s3", "lambda", "cloud"],
        "azure": ["microsoft azure", "cloud", "azure devops", "azure functions"],
        "gcp": ["google cloud platform", "cloud", "google cloud"],
        
        # Domaines spécifiques - Finance
        "finance": ["comptabilité", "audit", "contrôle de gestion", "trésorerie", "ifrs", "consolidation"],
        "trading": ["marchés financiers", "forex", "bourse", "options", "futures", "dérivés"],
        
        # Domaines spécifiques - Énergie
        "énergie": ["renouvelable", "solaire", "éolien", "hydrogène", "photovoltaïque", "transition énergétique"],
        "pétrole": ["gaz", "hydrocarbures", "exploration", "production", "raffinage"],
        
        # Domaines spécifiques - Industrie
        "industrie 4.0": ["automatisation", "iot industriel", "robotique", "smart factory", "usine intelligente"],
        "métallurgie": ["sidérurgie", "aluminium", "acier", "fonderie", "forge"]
    }
    
    # Construire la matrice de correspondance dans les deux sens
    competence_map = {}
    
    for key, related in related_technologies.items():
        if key not in competence_map:
            competence_map[key] = {}
            
        for rel in related:
            if rel not in competence_map:
                competence_map[rel] = {}
            
            # Définir une valeur de similarité entre 0.5 et 0.8 selon la proximité
            similarity = 0.7  # Valeur par défaut
            
            # Relations fortement liées (même famille de technologie)
            if (key == "javascript" and rel in ["typescript", "ecmascript", "js"]) or \
               (key == "html" and rel == "html5") or \
               (key == "python" and rel == "python3") or \
               (key == "sql" and rel in ["mysql", "postgresql", "oracle"]):
                similarity = 0.9
            # Relations moyennement liées (technologies utilisées ensemble)
            elif (key == "javascript" and rel in ["react", "angular", "vue.js"]) or \
                 (key == "html" and rel == "css") or \
                 (key == "python" and rel in ["django", "flask", "pandas"]):
                similarity = 0.7
            # Relations faiblement liées (même écosystème mais différentes)
            else:
                similarity = 0.5
                
            competence_map[key][rel] = similarity
            competence_map[rel][key] = similarity
    
    return competence_map


# Construction anticipée de la matrice de correspondance
COMPETENCE_SIMILARITY_MAP = build_competence_mapping()
def calculate_skills_match_score(consultant, appel_offre):
    """
    Calcule un score basé sur les compétences du consultant par rapport aux critères du projet
    Version améliorée avec:
    1. Cache pour éviter les recalculs
    2. Poids du domaine réduit (15%)
    3. Score d'expertise ajouté (15%)
    4. Analyse sémantique améliorée (70%)
    """
    try:
        # Vérifier si le résultat est en cache
        cache_key = get_cache_key(consultant.id, appel_offre.id)
        if cache_key in _score_cache:
            logger.info(f"Score trouvé en cache pour consultant {consultant.id} et AO {appel_offre.id}")
            return _score_cache[cache_key]
        
        # Récupérer les compétences du consultant avec leurs niveaux
        consultant_skills = list(
            Competence.objects.filter(consultant=consultant).values_list('nom_competence', 'niveau')
        )
        
        # Créer un dictionnaire pour un accès plus facile
        skills_dict = {skill_name.lower(): niveau for skill_name, niveau in consultant_skills}
        
        # Si le consultant n'a pas de compétences, retourner un score faible
        if not consultant_skills:
            logger.warning(f"Le consultant {consultant.id} n'a aucune compétence définie")
            _score_cache[cache_key] = 10
            return 10

        # --- 1. SCORE DE DOMAINE (15% max) ---
        domain_score = 0
        description_lower = appel_offre.description.lower() if appel_offre.description else ""
        
        # Détecter le domaine principal de l'appel d'offre
        # Utilisons une fonction simple, mais elle pourrait être remplacée par une détection plus complexe
        def detect_main_domain(appel_offre):
            domain_scores = {
                'DIGITAL': 0,
                'FINANCE': 0,
                'ENERGIE': 0,
                'INDUSTRIE': 0
            }
            
            # Compter les occurrences de mots-clés par domaine
            if appel_offre.description:
                desc_lower = appel_offre.description.lower()
                # Exemples de mots-clés par domaine (simplifiés)
                domain_keywords = {
                    'DIGITAL': ['digital', 'web', 'application', 'logiciel', 'site', 'mobile', 'développement', 'informatique'],
                    'FINANCE': ['finance', 'banque', 'comptabilité', 'budget', 'investissement', 'audit', 'fiscal'],
                    'ENERGIE': ['énergie', 'électricité', 'renouvelable', 'solaire', 'pétrole', 'gaz', 'transition'],
                    'INDUSTRIE': ['industrie', 'usine', 'production', 'mécanique', 'fabrication', 'maintenance']
                }
                
                for domain, keywords in domain_keywords.items():
                    for keyword in keywords:
                        if keyword in desc_lower:
                            domain_scores[domain] += 1
            
            # Retourner le domaine avec le score le plus élevé
            return max(domain_scores.items(), key=lambda x: x[1])[0] if any(domain_scores.values()) else 'DIGITAL'
        
        ao_domain = detect_main_domain(appel_offre)
        
        if consultant.domaine_principal == ao_domain:
            domain_score = 15  # Correspondance parfaite (15% max)
            logger.info(f"Correspondance parfaite de domaine: {ao_domain} pour consultant {consultant.id}")
        else:
            # Correspondance partielle, moins pénalisante qu'avant
            domain_score = 10  # Score de base pour autres domaines (10%)
            logger.info(f"Domaine différent: {consultant.domaine_principal} vs {ao_domain} pour consultant {consultant.id}")
        
        # --- 2. SCORE D'EXPERTISE (15% max) ---
        expertise_score = 0
        if consultant.expertise == "Expert":
            expertise_score = 15
        elif consultant.expertise == "Intermédiaire":
            expertise_score = 10
        else:  # Débutant
            expertise_score = 5
        
        # --- 3. SCORE DE COMPÉTENCES (70% max) ---
        skills_score = 0
        
        # Utilisation des critères explicites si disponibles
        project_criteria = CriteresEvaluation.objects.filter(appel_offre=appel_offre)
        
        if project_criteria.exists():
            logger.info(f"Utilisation des critères définis pour l'appel d'offre {appel_offre.id}")
            
            # Calcul du score avec pondération des critères
            total_weight = float(sum(float(criteria.poids) for criteria in project_criteria))
            weighted_score = 0
            
            if total_weight > 0:
                for criteria in project_criteria:
                    normalized_weight = float(float(criteria.poids) / total_weight) * 70.0  # 70% max
                    keyword = criteria.nom_critere.lower()
                    
                    # Chercher la meilleure correspondance dans les compétences du consultant
                    best_match_score = 0
                    best_match_skill = None
                    
                    for skill_name, niveau in skills_dict.items():
                        # Utiliser la fonction améliorée de similarité
                        match_score = get_competence_similarity(keyword, skill_name)
                        
                        # Ajuster par le niveau d'expertise
                        if match_score > 0:
                            match_score *= (0.7 + 0.3 * (niveau / 5))  # Moins de pénalité pour niveau faible
                            
                            if match_score > best_match_score:
                                best_match_score = match_score
                                best_match_skill = skill_name
                    
                    weighted_score += normalized_weight * best_match_score
                
                skills_score = min(70, weighted_score)  # 70% max
        else:
            # Analyse basée sur les compétences extraites de la description
            logger.info(f"Pas de critères définis, utilisation de l'analyse de description pour l'AO {appel_offre.id}")
            
            # Extraire des mots-clés significatifs de la description
            if appel_offre.description:
                # Utiliser TF-IDF pour extraire les termes importants
                try:
                    # Document 1: Description de l'appel d'offre
                    # Document 2: Compétences du consultant
                    doc1 = appel_offre.description.lower()
                    doc2 = " ".join(skill_name.lower() for skill_name in skills_dict.keys())
                    
                    # Corpus pour TF-IDF
                    corpus = [doc1, doc2]
                    
                    # Vectorisation TF-IDF
                    vectorizer = TfidfVectorizer(
                        max_features=50,
                        stop_words=['le', 'la', 'les', 'un', 'une', 'des', 'et', 'ou', 'pour', 'dans', 'sur', 'avec'],
                        ngram_range=(1, 2)  # Prise en compte des bi-grammes
                    )
                    tfidf_matrix = vectorizer.fit_transform(corpus)
                    
                    # Calcul de la similarité cosinus
                    cosine_sim = cosine_similarity(tfidf_matrix[0:1], tfidf_matrix[1:2])[0][0]
                    
                    # Conversion en score sur 70 points max
                    tfidf_score = min(70, cosine_sim * 100)
                    
                    logger.info(f"Score TF-IDF: {tfidf_score:.2f}% pour consultant {consultant.id}")
                    skills_score = tfidf_score
                except Exception as e:
                    logger.error(f"Erreur lors du calcul TF-IDF: {str(e)}")
                    # Utiliser une méthode alternative
                    skills_score = 35  # Score moyen
            else:
                # Pas de description, score moyen
                skills_score = 35
        
        # --- 4. CALCUL DU SCORE FINAL ---
        # Combinaison des 3 composantes: domaine (15%), expertise (15%), compétences (70%)
        final_score = domain_score + expertise_score + skills_score
        
        # Si le score est supérieur à 50, appliquer un bonus pour favoriser les bons matchs
        if final_score > 50:
            final_score = final_score * 1.15
            final_score = min(100, final_score)  # Plafond à 100%
        
        # Ajustement pour favoriser les valeurs extrêmes
        def sigmoid_adjustment(score):
            if score <= 0:
                return 0
            return 100 / (1 + np.exp(-0.08 * (score - 50)))
        
        adjusted_score = sigmoid_adjustment(final_score)
        
        # Enregistrement dans le cache
        _score_cache[cache_key] = adjusted_score
        
        logger.info(f"Score final ajusté: {final_score:.2f}% -> {adjusted_score:.2f}% pour consultant {consultant.id}")
        return adjusted_score
        
    except Exception as e:
        logger.error(f"Erreur lors du calcul du score de compétences: {str(e)}")
        return 20  # Score par défaut
    
    """
    Calcule un score basé sur les compétences du consultant par rapport aux critères du projet
    Version améliorée avec priorité aux compétences techniques prédéfinies
    """
    try:
        # Récupérer les compétences du consultant avec leurs niveaux
        consultant_skills = list(
            Competence.objects.filter(consultant=consultant).values_list('nom_competence', 'niveau')
        )
        
        # Créer un dictionnaire pour un accès plus facile
        skills_dict = {skill_name.lower(): niveau for skill_name, niveau in consultant_skills}
        
        # Si le consultant n'a pas de compétences, retourner un score faible
        if not consultant_skills:
            logger.warning(f"Le consultant {consultant.id} n'a aucune compétence définie")
            return 10

        # --- 1. ANALYSE DU DOMAINE ---
        description_lower = appel_offre.description.lower() if appel_offre.description else ""
        
        # Détecter le domaine principal de l'appel d'offre en utilisant les compétences prédéfinies
        domain_scores = {
            'DIGITAL': 0,
            'FINANCE': 0,
            'ENERGIE': 0,
            'INDUSTRIE': 0
        }
        
        # Pour chaque domaine, compter les occurrences de compétences dans la description
        domain_matches = {}
        for domain, skills_list in ALL_SKILLS.items():
            domain_matches[domain] = []
            for skill in skills_list:
                skill_lower = skill.lower()
                if skill_lower in description_lower:
                    domain_scores[domain] += 1
                    domain_matches[domain].append(skill)
        
        # Pondérer les scores par le nombre total de compétences dans chaque domaine
        weighted_domain_scores = {}
        for domain, score in domain_scores.items():
            total_skills = len(ALL_SKILLS[domain])
            if total_skills > 0:
                weighted_domain_scores[domain] = (score / total_skills) * 100
            else:
                weighted_domain_scores[domain] = 0
        
        # Déterminer le domaine principal
        ao_domain = max(weighted_domain_scores.items(), key=lambda x: x[1])[0]
        logger.info(f"Domaine principal de l'appel d'offre: {ao_domain}")
        
        # --- 2. SCORE DE CORRESPONDANCE DE DOMAINE (25%) ---
        domain_match_score = 0
        if consultant.domaine_principal == ao_domain:
            domain_match_score = 25  # Correspondance parfaite
            logger.info(f"Correspondance parfaite de domaine: {ao_domain} pour consultant {consultant.id}")
        elif weighted_domain_scores[consultant.domaine_principal] > 0:
            # Correspondance partielle basée sur le ratio des scores
            relative_score = weighted_domain_scores[consultant.domaine_principal] / max(weighted_domain_scores.values())
            domain_match_score = min(20, 25 * relative_score)
            logger.info(f"Correspondance partielle de domaine: {consultant.domaine_principal} ({domain_match_score:.1f}%) pour consultant {consultant.id}")
        
        # --- 3. EXPLOITATION DES CRITÈRES EXPLICITES SI DISPONIBLES ---
        project_criteria = CriteresEvaluation.objects.filter(appel_offre=appel_offre)
        skill_match_score = 0
        
        if project_criteria.exists():
            logger.info(f"Utilisation des critères définis pour l'appel d'offre {appel_offre.id}")
            
            # Calcul du score avec pondération des critères (75% max)
            total_weight = float(sum(float(criteria.poids) for criteria in project_criteria))
            weighted_score = 0
            
            if total_weight > 0:
                for criteria in project_criteria:
                    normalized_weight = float(float(criteria.poids) / total_weight) * 75.0
                    keyword = criteria.nom_critere.lower()
                    
                    # Chercher la meilleure correspondance dans les compétences du consultant
                    best_match_score = 0
                    best_match_skill = None
                    
                    for skill_name, niveau in skills_dict.items():
                        # Correspondance exacte
                        if keyword == skill_name:
                            match_score = 1.0
                        # Correspondance partielle
                        elif keyword in skill_name or skill_name in keyword:
                            match_score = 0.8
                        # Utiliser la fonction de similarité
                        else:
                            match_score = get_competence_similarity(keyword, skill_name)
                        
                        # Ajuster par le niveau d'expertise
                        if match_score > 0:
                            match_score *= (0.6 + 0.4 * (niveau / 5))
                            
                            if match_score > best_match_score:
                                best_match_score = match_score
                                best_match_skill = skill_name
                    
                    weighted_score += normalized_weight * best_match_score
                
                skill_match_score = weighted_score
        
        # --- 4. ANALYSE BASÉE SUR LES COMPÉTENCES PRÉDÉFINIES ---
        else:
            logger.info(f"Pas de critères définis, utilisation de l'analyse de description pour l'appel d'offre {appel_offre.id}")
            
            # Récupérer les compétences spécifiques au domaine détecté
            domain_specific_skills = [skill.lower() for skill in ALL_SKILLS.get(ao_domain, [])]
            
            # 1. Extraire les compétences techniques mentionnées dans la description
            mentioned_skills = []
            for skill in ALL_SKILLS[ao_domain]:
                skill_lower = skill.lower()
                if skill_lower in description_lower:
                    mentioned_skills.append(skill_lower)
            
            # Si peu de compétences techniques identifiées, utiliser des termes plus généraux
            if len(mentioned_skills) < 5:
                # Extraire tous les mots significatifs (4+ caractères)
                stop_words = {'dans', 'pour', 'avec', 'cette', 'votre', 'notre', 'leur', 'vous', 
                              'nous', 'être', 'avoir', 'les', 'des', 'une', 'sur'}
                
                words = re.findall(r'\b(\w{4,})\b', description_lower)
                general_terms = [word for word in words if word not in stop_words and not word.isdigit()]
                mentioned_skills.extend(general_terms)
            
            # Dédupliquer la liste
            mentioned_skills = list(set(mentioned_skills))
            
            # 2. Utiliser TF-IDF pour comparer les compétences du consultant avec celles mentionnées
            if len(mentioned_skills) >= 3:
                try:
                    # Préparation des documents pour TF-IDF
                    # Document 1: Compétences mentionnées dans l'appel d'offre
                    # Document 2: Compétences du consultant
                    doc1 = " ".join(mentioned_skills)
                    doc2 = " ".join(skill_name.lower() for skill_name in skills_dict.keys())
                    
                    # Corpus pour TF-IDF
                    corpus = [doc1, doc2]
                    
                    # Vectorisation TF-IDF
                    vectorizer = TfidfVectorizer()
                    tfidf_matrix = vectorizer.fit_transform(corpus)
                    
                    # Calcul de la similarité cosinus
                    cosine_sim = cosine_similarity(tfidf_matrix[0:1], tfidf_matrix[1:2])[0][0]
                    
                    # Conversion en score sur 75 points max
                    tfidf_score = min(75, cosine_sim * 100)
                    
                    logger.info(f"Score TF-IDF: {tfidf_score:.2f}% pour consultant {consultant.id}")
                    skill_match_score = tfidf_score
                    
                except Exception as e:
                    logger.error(f"Erreur lors du calcul TF-IDF: {str(e)}")
                    # Utiliser une méthode alternative en cas d'échec
                    skill_match_score = calculate_alternative_score(mentioned_skills, skills_dict)
            else:
                # Méthode alternative pour peu de compétences
                skill_match_score = calculate_alternative_score(mentioned_skills, skills_dict)
        
        # --- 5. CALCUL DU SCORE FINAL ---
        # Combiner score de domaine (25%) et score de compétences (75%)
        final_score = min(100, domain_match_score + skill_match_score)
        
        # Appliquer une fonction sigmoïde pour favoriser les scores extrêmes
        if final_score > 0:
            # Utiliser numpy pour le calcul de la sigmoïde
            sigmoid = lambda x: 100 / (1 + np.exp(-0.08 * (x - 50)))
            adjusted_score = sigmoid(final_score)
            logger.info(f"Score final ajusté: {final_score:.2f}% -> {adjusted_score:.2f}% pour consultant {consultant.id}")
            return adjusted_score
        
        logger.info(f"Score final pour consultant {consultant.id}: {final_score}% (domaine: {domain_match_score}%, compétences: {skill_match_score}%)")
        return final_score
        
    except Exception as e:
        logger.error(f"Erreur lors du calcul du score de compétences: {str(e)}")
        return 20  # Score par défaut
def clear_score_cache():
    """
    Vide le cache des scores calculés
    À utiliser quand les données des consultants ou appels d'offre changent
    """
    global _score_cache
    _score_cache = {}
    logger.info("Cache des scores vidé")
def calculate_alternative_score(mentioned_skills, consultant_skills_dict):
    """
    Méthode alternative de calcul du score quand TF-IDF ne peut pas être utilisé
    Basée sur la correspondance directe des compétences
    """
    try:
        if not mentioned_skills:
            return 37.5  # Score neutre (50% de 75 points max)
        
        matched_count = 0
        matched_skills = set()
        
        # Pour chaque compétence mentionnée, chercher une correspondance
        for keyword in mentioned_skills:
            best_match_score = 0
            best_match_skill = None
            
            for skill_name, niveau in consultant_skills_dict.items():
                # Correspondance exacte
                if keyword == skill_name:
                    match_score = 1.0
                # Correspondance partielle
                elif keyword in skill_name or skill_name in keyword:
                    match_score = 0.8
                # Utiliser la fonction de similarité
                else:
                    match_score = get_competence_similarity(keyword, skill_name)
                
                # Ajuster par le niveau d'expertise
                if match_score > 0:
                    match_score *= (0.6 + 0.4 * (niveau / 5))
                    
                    if match_score > best_match_score:
                        best_match_score = match_score
                        best_match_skill = skill_name
            
            # Si une correspondance a été trouvée
            if best_match_score > 0:
                matched_count += best_match_score
                matched_skills.add(best_match_skill)
        
        # Calculer le score final (75 points max)
        match_ratio = matched_count / len(mentioned_skills)
        skill_match_score = min(75, 75 * match_ratio)
        
        # Log des compétences correspondantes
        logger.info(f"Score par analyse de mots-clés: {skill_match_score:.2f}%")
        logger.debug(f"Mots-clés correspondants: {matched_skills}")
        
        return skill_match_score
        
    except Exception as e:
        logger.error(f"Erreur dans le calcul alternatif: {str(e)}")
        return 37.5  # Score neutre
def generate_matching_for_offer(appel_offre_id):
    """
    Génère des matchings pour un appel d'offre spécifique
    Version révisée pour résoudre le problème des scores uniformes
    """
    try:
        # Récupérer l'appel d'offre
        try:
            appel_offre = AppelOffre.objects.get(id=appel_offre_id)
        except AppelOffre.DoesNotExist:
            logger.error(f"Appel d'offre avec ID {appel_offre_id} introuvable")
            return {
                'success': False,
                'error': f"Appel d'offre avec ID {appel_offre_id} introuvable"
            }

        # Vérifier dates et description
        if appel_offre.date_debut is None or appel_offre.date_fin is None:
            logger.error(f"Dates manquantes pour l'appel d'offre {appel_offre_id}")
            return {
                'success': False,
                'error': "Les dates de début et/ou de fin de l'appel d'offre sont manquantes"
            }
        
        # Récupérer les consultants validés
        consultants = Consultant.objects.filter(
            is_validated=True
        ).exclude(
            date_debut_dispo=None
        ).exclude(
            date_fin_dispo=None
        )
        
        if not consultants.exists():
            logger.warning(f"Aucun consultant disponible pour le matching de l'appel d'offre {appel_offre_id}")
            return {
                'success': False,
                'error': "Aucun consultant disponible pour le matching"
            }
        
        # Vider les anciens matchings pour cet appel d'offre
        MatchingResult.objects.filter(appel_offre=appel_offre).delete()
        logger.info(f"Anciens matchings supprimés pour l'appel d'offre {appel_offre_id}")
        
        # Vidage du cache pour garantir des calculs de score frais
        clear_score_cache()
        logger.info("Cache des scores vidé")
        
        results = []
        score_stats = {"min": 100, "max": 0, "total": 0}
        
        # Calculer les scores pour chaque consultant
        for consultant in consultants:
            try:
                # Calculer les scores individuellement pour chaque consultant
                date_score = calculate_date_match_score(consultant, appel_offre)
                logger.info(f"Score de date pour {consultant.id} ({consultant.nom}): {date_score}")
                
                skills_score = calculate_skills_match_score(consultant, appel_offre)
                logger.info(f"Score de compétences pour {consultant.id} ({consultant.nom}): {skills_score}")
                
                # Pondération: 40% date, 60% compétences 
                final_score = (date_score * 0.4) + (skills_score * 0.6)
                final_score = min(100, final_score)  # Cap à 100%
                
                # Mettre à jour les statistiques
                score_stats["min"] = min(score_stats["min"], final_score)
                score_stats["max"] = max(score_stats["max"], final_score)
                score_stats["total"] += final_score
                
                logger.info(f"Score final pour {consultant.id} ({consultant.nom}): {final_score}")
                
                # Enregistrer le résultat avec précision décimale
                matching = MatchingResult.objects.create(
                    consultant=consultant,
                    appel_offre=appel_offre,
                    score=Decimal(str(final_score)),  # Conversion explicite en Decimal
                    is_validated=False
                )
                
                # Ajouter à la liste de résultats avec conversion explicite en float pour JSON
                results.append({
                    'id': matching.id,
                    'consultant_id': consultant.id,
                    'consultant_name': f"{consultant.prenom} {consultant.nom}",
                    'consultant_expertise': consultant.expertise or "Débutant",
                    'email': consultant.email,
                    'domaine_principal': consultant.domaine_principal,
                    'specialite': consultant.specialite or "",
                    'top_skills': get_top_skills(consultant),
                    'date_match_score': float(date_score),  # Conversion explicite en float
                    'skills_match_score': float(skills_score),  # Conversion explicite en float
                    'score': float(final_score),  # Conversion explicite en float
                    'is_validated': False
                })
                
            except Exception as e:
                logger.error(f"Erreur lors du calcul pour le consultant {consultant.id}: {str(e)}")
                continue
        
        # Calculer les statistiques finales
        if results:
            score_stats["avg"] = score_stats["total"] / len(results)
            score_stats["count"] = len(results)
            logger.info(f"Statistiques des scores: min={score_stats['min']:.2f}, "
                       f"max={score_stats['max']:.2f}, avg={score_stats['avg']:.2f}, "
                       f"count={score_stats['count']}")
            
            # Vérifier si tous les scores sont identiques (problème potentiel)
            scores = [r['score'] for r in results]
            unique_scores = set(scores)
            if len(unique_scores) == 1:
                logger.warning(f"ATTENTION: Tous les consultants ont le même score: {scores[0]}")
                
                # Réinitialiser le cache et recalculer manuellement un échantillon
                clear_score_cache()
                test_consultant = consultants.first()
                if test_consultant:
                    test_date_score = calculate_date_match_score(test_consultant, appel_offre)
                    test_skills_score = calculate_skills_match_score(test_consultant, appel_offre)
                    logger.info(f"Test recalcul après reset du cache - Consultant: {test_consultant.nom}, "
                               f"Date: {test_date_score}, Skills: {test_skills_score}")
        else:
            logger.warning("Aucun matching généré!")
        
        # Trier les résultats par score décroissant
        sorted_results = sorted(results, key=lambda x: x['score'], reverse=True)
        
        return {
            'success': True,
            'matches': sorted_results,
            'stats': score_stats
        }
        
    except Exception as e:
        logger.error(f"Erreur lors de la génération des matchings: {str(e)}")
        return {
            'success': False,
            'error': str(e)
        }
    """
    Génère des matchings pour un appel d'offre spécifique
    Version améliorée avec extraction intelligente des critères et mise en cache
    """
    try:
        # Récupérer l'appel d'offre
        try:
            appel_offre = AppelOffre.objects.get(id=appel_offre_id)
        except AppelOffre.DoesNotExist:
            logger.error(f"Appel d'offre avec ID {appel_offre_id} introuvable")
            return {
                'success': False,
                'error': f"Appel d'offre avec ID {appel_offre_id} introuvable"
            }

        # Vérifier dates et description
        if appel_offre.date_debut is None or appel_offre.date_fin is None:
            logger.error(f"Dates manquantes pour l'appel d'offre {appel_offre_id}")
            return {
                'success': False,
                'error': "Les dates de début et/ou de fin de l'appel d'offre sont manquantes"
            }
        
        # Récupérer les consultants validés
        consultants = Consultant.objects.filter(
            is_validated=True
        ).exclude(
            date_debut_dispo=None
        ).exclude(
            date_fin_dispo=None
        )
        
        # Vider les anciens matchings pour cet appel d'offre
        MatchingResult.objects.filter(appel_offre=appel_offre).delete()
        
        results = []
        
        # Calculer les scores pour chaque consultant
        for consultant in consultants:
            try:
                # Calculer les scores (maintenant avec cache)
                date_score = calculate_date_match_score(consultant, appel_offre)
                skills_score = calculate_skills_match_score(consultant, appel_offre)
                
                # Pondération: 40% date, 60% compétences 
                final_score = (date_score * 0.4) + (skills_score * 0.6)
                final_score = min(100, final_score)  # Cap à 100%
                
                # Enregistrer le résultat
                matching = MatchingResult.objects.create(
                    consultant=consultant,
                    appel_offre=appel_offre,
                    score=Decimal(str(final_score)),
                    is_validated=False
                )
                
                # Ajouter à la liste de résultats
                results.append({
                    'id': matching.id,
                    'consultant_id': consultant.id,
                    'consultant_name': f"{consultant.prenom} {consultant.nom}",
                    'consultant_expertise': consultant.expertise or "Débutant",
                    'email': consultant.email,
                    'domaine_principal': consultant.domaine_principal,
                    'specialite': consultant.specialite or "",
                    'top_skills': get_top_skills(consultant),
                    'date_match_score': date_score,
                    'skills_match_score': skills_score,
                    'score': float(final_score),
                    'is_validated': False
                })
                
            except Exception as e:
                logger.error(f"Erreur lors du calcul pour le consultant {consultant.id}: {str(e)}")
                continue
        
        # Trier les résultats par score décroissant
        sorted_results = sorted(results, key=lambda x: x['score'], reverse=True)
        
        return {
            'success': True,
            'matches': sorted_results
        }
        
    except Exception as e:
        logger.error(f"Erreur lors de la génération des matchings: {str(e)}")
        return {
            'success': False,
            'error': str(e)
        }
    """
    Génère des matchings pour un appel d'offre spécifique
    Version améliorée avec extraction intelligente des critères
    """
    try:
        # Récupérer l'appel d'offre
        try:
            appel_offre = AppelOffre.objects.get(id=appel_offre_id)
        except AppelOffre.DoesNotExist:
            logger.error(f"Appel d'offre avec ID {appel_offre_id} introuvable")
            return {
                'success': False,
                'error': f"Appel d'offre avec ID {appel_offre_id} introuvable"
            }

        # Vérifier dates et description
        if appel_offre.date_debut is None or appel_offre.date_fin is None:
            logger.error(f"Dates manquantes pour l'appel d'offre {appel_offre_id}")
            return {
                'success': False,
                'error': "Les dates de début et/ou de fin de l'appel d'offre sont manquantes"
            }
        
        # Déterminer le domaine principal de l'appel d'offre
        description = appel_offre.description.lower() if appel_offre.description else ""
        
        if not description:
            logger.warning(f"Description manquante pour l'appel d'offre {appel_offre_id}")
            
        # Compter les occurrences de compétences par domaine
        domain_scores = {
            'DIGITAL': 0,
            'FINANCE': 0,
            'ENERGIE': 0,
            'INDUSTRIE': 0
        }
        
        domain_matches = {}
        for domain, skills_list in ALL_SKILLS.items():
            domain_matches[domain] = []
            for skill in skills_list:
                skill_lower = skill.lower()
                if description and skill_lower in description:
                    domain_scores[domain] += 1
                    domain_matches[domain].append(skill)
                    
        # Normaliser les scores par domaine
        weighted_domain_scores = {}
        for domain, score in domain_scores.items():
            total_skills = len(ALL_SKILLS[domain])
            if total_skills > 0:
                weighted_domain_scores[domain] = float(score) / float(total_skills) * 100.0
            else:
                weighted_domain_scores[domain] = 0
                
        # Déterminer le domaine principal
        if any(weighted_domain_scores.values()):
            domain_items = sorted(weighted_domain_scores.items(), key=lambda x: x[1], reverse=True)
            ao_domain = domain_items[0][0]
            logger.info(f"Domaine principal détecté pour l'appel d'offre {appel_offre_id}: {ao_domain}")
            
            # Extraire les compétences mentionnées dans ce domaine pour créer des critères
            if not CriteresEvaluation.objects.filter(appel_offre=appel_offre).exists():
                # Récupérer les compétences détectées dans la description
                detected_skills = domain_matches.get(ao_domain, [])
                
                # Si peu de compétences détectées, chercher dans les autres domaines
                if len(detected_skills) < 3:
                    for domain, matches in domain_matches.items():
                        if domain != ao_domain:
                            detected_skills.extend(matches)
                            
                    # Limiter à 10 compétences maximum
                    detected_skills = detected_skills[:10]
                
                # S'il y a des compétences détectées, créer des critères d'évaluation
                if detected_skills:
                    # Distribuer les poids également
                    weight_per_criteria = Decimal(100.0 / float(len(detected_skills)))
                    
                    # Créer les critères
                    for skill in detected_skills:
                        CriteresEvaluation.objects.create(
                            appel_offre=appel_offre,
                            nom_critere=skill,
                            poids=weight_per_criteria
                        )
                    logger.info(f"Critères créés automatiquement pour l'appel d'offre {appel_offre_id}: {detected_skills}")
        
        # Suite du code pour le matching...
        # (récupération des consultants, calcul des scores, etc.)
        
        # Récupérer les consultants validés
        consultants = Consultant.objects.filter(
            is_validated=True
        ).exclude(
            date_debut_dispo=None
        ).exclude(
            date_fin_dispo=None
        )
        
        # Code existant pour le calcul des matchings...
        
        return {
            'success': True,
            'matches': sorted_results
        }
        
    except Exception as e:
        logger.error(f"Erreur lors de la génération des matchings: {str(e)}")
        return {
            'success': False,
            'error': str(e)
        }
@api_view(['GET', 'POST'])

def matching_for_offer(request, appel_offre_id):
    """
    Endpoint pour générer ou récupérer des matchings pour un appel d'offre
    Version révisée pour résoudre le problème d'affichage des scores
    """
    # Journal d'activité pour le débogage
    logger.info(f"Requête {request.method} reçue pour appel d'offre ID {appel_offre_id}")
    
    # Convertir appel_offre_id en entier pour s'assurer qu'il est du bon type
    try:
        appel_offre_id = int(appel_offre_id)
    except ValueError:
        return Response({
            'success': False,
            'error': f"ID d'appel d'offre invalide: {appel_offre_id}"
        }, status=400)

    if request.method == 'GET':
        # Récupérer les matchings existants
        try:
            # Journaliser l'appel
            logger.info(f"Récupération des matchings pour l'appel d'offre {appel_offre_id}")

            # Vérifier que l'appel d'offre existe
            try:
                AppelOffre.objects.get(id=appel_offre_id)
            except AppelOffre.DoesNotExist:
                return Response({
                    'success': False,
                    'error': f"Appel d'offre avec ID {appel_offre_id} introuvable"
                }, status=404)

            # Récupérer tous les matchings pour cet appel d'offre
            matches = MatchingResult.objects.filter(
                appel_offre_id=appel_offre_id
            ).order_by('-score')

            # Log du nombre de matchings trouvés
            logger.info(f"{matches.count()} matchings trouvés pour l'appel d'offre {appel_offre_id}")

            # Si aucun matching n'existe, renvoyer un tableau vide mais avec succès
            if not matches.exists():
                return Response({
                    'success': True,
                    'matches': []
                })

            result = []
            for match in matches:
                consultant = match.consultant

                # Récupérer les top compétences
                top_skills = Competence.objects.filter(consultant=consultant).order_by('-niveau')[:5]
                skills_list = [skill.nom_competence for skill in top_skills]

                # Calculer les scores détaillés pour l'affichage
                try:
                    date_score = calculate_date_match_score(consultant, match.appel_offre)
                    skills_score = calculate_skills_match_score(consultant, match.appel_offre)
                    # Vérifier que le score stocké est cohérent avec le score calculé
                    calculated_score = (date_score * 0.4) + (skills_score * 0.6)
                    stored_score = float(match.score)
                    
                    # Loguer les valeurs pour débogage
                    logger.info(f"Consultant {consultant.id} - {consultant.nom}: Score stocké: {stored_score}, "
                                f"Score calculé: {calculated_score}, Date score: {date_score}, Skills score: {skills_score}")
                                
                    # Si l'écart est important, mettre à jour le score stocké
                    if abs(calculated_score - stored_score) > 5:
                        logger.warning(f"Différence importante entre score stocké et calculé pour consultant {consultant.id}")
                        # Optionnel: mettre à jour le score dans la base de données
                        match.score = Decimal(str(calculated_score))
                        match.save(update_fields=['score'])
                        stored_score = calculated_score
                        
                except Exception as e:
                    logger.error(f"Erreur lors du calcul des scores détaillés: {str(e)}")
                    date_score = 0
                    skills_score = 0
                    stored_score = float(match.score)

                # S'assurer que le score est bien un nombre flottant
                if isinstance(stored_score, Decimal):
                    stored_score = float(stored_score)
                elif isinstance(stored_score, str):
                    try:
                        stored_score = float(stored_score)
                    except ValueError:
                        stored_score = 0
                
                # Vérifier que le score est dans la plage [0, 100]
                stored_score = max(0, min(100, stored_score))

                # Ajouter les informations du matching
                result.append({
                    'id': match.id,
                    'consultant_id': consultant.id,
                    'consultant_name': f"{consultant.prenom} {consultant.nom}",
                    'consultant_expertise': consultant.expertise or "Débutant",
                    'email': consultant.email,
                    'domaine_principal': consultant.domaine_principal,
                    'specialite': consultant.specialite or "",
                    'top_skills': skills_list,
                    'date_match_score': round(date_score, 1),
                    'skills_match_score': round(skills_score, 1),
                    'score': stored_score,  # Utiliser le score vérifié
                    'is_validated': match.is_validated
                })

            # Trier les résultats par score décroissant
            sorted_result = sorted(result, key=lambda x: x['score'], reverse=True)
            
            # Log final pour vérifier les scores envoyés au frontend
            for i, match_data in enumerate(sorted_result[:5]):  # Afficher les 5 premiers pour ne pas surcharger les logs
                logger.info(f"Match {i+1}: Consultant {match_data['consultant_name']}, "
                            f"Score: {match_data['score']}, Type: {type(match_data['score'])}")

            return Response({
                'success': True,
                'matches': sorted_result
            })
        except Exception as e:
            logger.error(f"Erreur lors de la récupération des matchings: {str(e)}")
            return Response({
                'success': False,
                'error': f"Erreur lors de la récupération des matchings: {str(e)}"
            }, status=500)

    elif request.method == 'POST':
        # Générer de nouveaux matchings
        try:
            logger.info(f"Génération de nouveaux matchings pour l'appel d'offre {appel_offre_id}")
            
            # Vider le cache des scores avant de calculer de nouveaux matchings
            clear_score_cache()
            logger.info("Cache des scores vidé avant génération de nouveaux matchings")
            
            result = generate_matching_for_offer(appel_offre_id)

            # Vérifier si le résultat est valide
            if not isinstance(result, dict):
                logger.error(f"La fonction generate_matching_for_offer a retourné un type inattendu: {type(result)}")
                return Response({
                    'success': False,
                    'error': "Erreur interne: format de résultat invalide"
                }, status=500)

            # Si succès, mais pas de matchings, retourner un message plus clair
            if result.get('success') and not result.get('matches', []):
                return Response({
                    'success': False,
                    'error': "Aucun consultant disponible pour le matching"
                }, status=404)
                
            # Vérification et débogage des scores générés
            if result.get('success') and result.get('matches'):
                for i, match in enumerate(result['matches'][:5]):  # Afficher les 5 premiers
                    logger.info(f"Match généré {i+1}: Consultant {match['consultant_name']}, "
                                f"Score: {match['score']}, Date: {match['date_match_score']}, "
                                f"Skills: {match['skills_match_score']}")
                
                # Vérifier que les scores sont uniques
                scores = [match['score'] for match in result['matches']]
                unique_scores = set(scores)
                if len(unique_scores) == 1:
                    logger.warning(f"ATTENTION: Tous les consultants ont le même score: {list(unique_scores)[0]}")
                else:
                    logger.info(f"Variété de scores générés: min={min(scores)}, max={max(scores)}, "
                                f"unique_count={len(unique_scores)}")

            return Response(result)
        except Exception as e:
            logger.error(f"Exception lors de la génération des matchings: {str(e)}")
            return Response({
                'success': False,
                'error': f"Erreur lors de la génération des matchings: {str(e)}"
            }, status=500)
    else:
        # Cette partie ne devrait pas être atteinte grâce au décorateur @api_view
        logger.warning(f"Méthode non autorisée: {request.method}")
        return Response({
            'success': False,
            'error': f"Méthode {request.method} non supportée"
        }, status=405)

def create_notification(consultant, notification_type, title, content, appel_offre=None, match=None):
    """
    Crée une notification dans le système
    """
    try:
        notification = Notification.objects.create(
            consultant=consultant,
            type=notification_type,
            title=title,
            content=content,
            related_appel=appel_offre,
            related_match=match
        )
        logger.info(f"Notification créée pour {consultant.nom} {consultant.prenom}: {title}")
        return notification
    except Exception as e:
        logger.error(f"Erreur lors de la création de la notification: {str(e)}")
        return None


@api_view(['GET'])
def consultant_notifications(request, consultant_id):
    """
    Récupère les notifications d'un consultant
    """
    try:
        consultant = get_object_or_404(Consultant, id=consultant_id)

        # Récupérer toutes les notifications
        notifications = Notification.objects.filter(consultant=consultant).order_by('-created_at')

        # Formater pour l'API
        results = []
        for notif in notifications:
            results.append({
                'id': notif.id,
                'type': notif.type,
                'title': notif.title,
                'content': notif.content,
                'is_read': notif.is_read,
                'created_at': notif.created_at,
                'appel_offre_id': notif.related_appel.id if notif.related_appel else None,
                'appel_offre_nom': notif.related_appel.nom_projet if notif.related_appel else None,
                'match_id': notif.related_match.id if notif.related_match else None
            })

        # Compter les notifications non lues
        unread_count = notifications.filter(is_read=False).count()

        return Response({
            'success': True,
            'notifications': results,
            'unread_count': unread_count
        })
    except Exception as e:
        logger.error(f"Erreur lors de la récupération des notifications: {str(e)}")
        return Response({
            'success': False,
            'error': str(e)
        }, status=500)


@api_view(['PUT'])
def mark_notification_read(request, notification_id):
    """
    Marque une notification comme lue
    """
    try:
        notification = get_object_or_404(Notification, id=notification_id)
        notification.is_read = True
        notification.save()

        return Response({
            'success': True,
            'message': 'Notification marquée comme lue'
        })
    except Exception as e:
        logger.error(f"Erreur lors du marquage de la notification: {str(e)}")
        return Response({
            'success': False,
            'error': str(e)
        }, status=500)


@api_view(['PUT'])
def validate_match(request, match_id):
    """
    Endpoint pour valider ou invalider un matching
    Version corrigée avec meilleure gestion des erreurs
    """
    try:
        # Récupérer le matching par son ID
        try:
            match = MatchingResult.objects.get(id=match_id)
        except MatchingResult.DoesNotExist:
            return Response({
                'success': False,
                'error': 'Matching non trouvé'
            }, status=404)
            
        # Récupérer consultant et appel d'offre avec gestion d'erreur
        try:
            consultant = match.consultant
            appel_offre = match.appel_offre
        except Exception as e:
            logger.error(f"Erreur lors de la récupération des relations: {str(e)}")
            return Response({
                'success': False,
                'error': 'Erreur lors de la récupération des données associées'
            }, status=500)

        # Vérifier si on passe de non validé à validé pour envoyer une notification
        was_validated = match.is_validated

        # Inverser l'état de validation
        match.is_validated = not match.is_validated
        match.save()

        notification_status = None
        
        # Si le match vient d'être validé, envoyer une notification
        if not was_validated and match.is_validated:
            # Création de la notification avec bloc try/except séparé
            try:
                title = f"Mission confirmée : {appel_offre.nom_projet}"
                content = f"Votre profil a été sélectionné pour la mission '{appel_offre.nom_projet}' chez {appel_offre.client}. Consultez les détails dans la section 'Mes Missions'."

                # Utiliser create_notification avec gestion d'erreur
                try:
                    notification = create_notification(
                        consultant=consultant,
                        notification_type="MATCH_VALID",
                        title=title,
                        content=content,
                        appel_offre=appel_offre,
                        match=match
                    )
                    
                    if notification:
                        logger.info(f"Notification de validation créée pour {consultant.nom} {consultant.prenom}")
                        notification_status = "Notification envoyée au consultant"
                except Exception as notif_error:
                    logger.error(f"Erreur lors de la création de la notification: {str(notif_error)}")
                    notification_status = "Erreur lors de la création de la notification"
                
                # Email dans un bloc séparé
                try:
                    # Import dans un bloc try pour éviter des erreurs d'import
                    from .email_service import send_mission_notification
                    
                    # Lancer l'envoi d'email dans un thread
                    thread = threading.Thread(
                        target=send_mission_notification,
                        args=(consultant, appel_offre)
                    )
                    thread.daemon = True
                    thread.start()
                    
                    if not notification_status:
                        notification_status = "Email de notification envoyé au consultant"
                except Exception as email_error:
                    logger.error(f"Erreur lors de l'envoi d'email: {str(email_error)}")
                    if not notification_status:
                        notification_status = "Notification enregistrée mais erreur lors de l'envoi d'email"
            except Exception as global_notif_error:
                logger.error(f"Erreur générale lors du processus de notification: {str(global_notif_error)}")
                notification_status = "Erreur lors du processus de notification"

        return Response({
            'success': True,
            'is_validated': match.is_validated,
            'message': f"Statut de validation mis à jour avec succès: {'validé' if match.is_validated else 'non validé'}",
            'notification': notification_status
        })

    except Exception as e:
        logger.error(f"Erreur lors de la validation du matching {match_id}: {str(e)}")
        return Response({
            'success': False,
            'error': f"Erreur lors de la validation: {str(e)}"
        }, status=500)


@api_view(['GET'])
def consultant_matches(request, consultant_id):
    """
    Endpoint pour récupérer les meilleurs matchings pour un consultant
    """
    limit = int(request.query_params.get('limit', 5))

    try:
        matchings = MatchingResult.objects.filter(
            consultant_id=consultant_id
        ).order_by('-score')[:limit]

        results = []
        for matching in matchings:
            results.append({
                'id': matching.id,
                'appel_offre_id': matching.appel_offre.id,
                'appel_offre_name': matching.appel_offre.nom_projet,
                'client': matching.appel_offre.client,
                'date_debut': matching.appel_offre.date_debut,
                'date_fin': matching.appel_offre.date_fin,
                'score': matching.score,
                'is_validated': matching.is_validated
            })

        return Response({
            'success': True,
            'matches': results
        })

    except Exception as e:
        logger.error(f"Erreur lors de la récupération des matchings pour le consultant {consultant_id}: {str(e)}")
        return Response({
            'success': False,
            'error': str(e)
        }, status=500)


@api_view(['POST'])
def admin_login(request):
    """
    Connecte un administrateur existant
    """
    username = request.data.get('username')
    password = request.data.get('password')

    logger.info(f"Tentative de connexion admin: {username}")

    try:
        user = User.objects.get(username=username)

        if not user.check_password(password):
            return Response({"error": "Mot de passe incorrect"}, status=400)

        if user.role != 'ADMIN':
            return Response({"error": "Ce compte n'est pas un administrateur"}, status=403)

        return Response({
            "admin_id": user.id,
            "username": user.username,
            "role": user.role
        })
    except User.DoesNotExist:
        return Response({"error": "Utilisateur non trouvé"}, status=404)
    except Exception as e:
        logger.error(f"Erreur lors de la connexion admin: {e}")
        return Response({"error": "Une erreur s'est produite lors de la connexion"}, status=500)


@api_view(['GET'])
def appel_offre_detail(request, pk):
    """
    Récupère les détails d'un appel d'offre spécifique
    """
    try:
        appel = get_object_or_404(AppelOffre, id=pk)
        serializer = AppelOffreSerializer(appel)
        return Response(serializer.data)
    except Exception as e:
        logger.error(f"Erreur lors de la récupération des détails de l'appel d'offre {pk}: {str(e)}")
        return Response({"error": str(e)}, status=500)


@api_view(['GET', 'PUT', 'DELETE'])
def admin_appel_offre_detail(request, pk):
    """
    Récupère, modifie ou supprime un appel d'offre spécifique
    """
    appel = get_object_or_404(AppelOffre, pk=pk)

    if request.method == 'GET':
        serializer = AppelOffreSerializer(appel)
        return Response(serializer.data)

    if request.method == 'PUT':
        serializer = AppelOffreSerializer(appel, data=request.data, partial=True)
        if serializer.is_valid():
            serializer.save()
            return Response(serializer.data)
        return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)

    if request.method == 'DELETE':
        appel.delete()
        return Response(status=status.HTTP_204_NO_CONTENT)


@api_view(['GET', 'POST', 'DELETE'])
def appel_offre_criteres(request, appel_id):
    """
    Gère les critères d'un appel d'offre
    """
    appel = get_object_or_404(AppelOffre, id=appel_id)

    if request.method == 'GET':
        criteres = CriteresEvaluation.objects.filter(appel_offre=appel)
        serializer = CriteresEvaluationSerializer(criteres, many=True)
        return Response(serializer.data)

    elif request.method == 'POST':
        data = request.data.copy()
        data['appel_offre'] = appel_id
        serializer = CriteresEvaluationSerializer(data=data)
        if serializer.is_valid():
            serializer.save()
            return Response(serializer.data, status=201)
        return Response(serializer.errors, status=400)

    elif request.method == 'DELETE':
        # Supprimer tous les critères de cet appel d'offre
        CriteresEvaluation.objects.filter(appel_offre=appel).delete()
        return Response(status=204)


@api_view(['GET'])
def validated_matches(request):
    """
    Récupère la liste des matchings validés
    """
    try:
        matches = MatchingResult.objects.filter(is_validated=True).select_related('consultant', 'appel_offre')

        data = []
        for match in matches:
            data.append({
                'id': match.id,
                'consultant_id': match.consultant.id,
                'consultant_name': f"{match.consultant.prenom} {match.consultant.nom}",
                'appel_offre_id': match.appel_offre.id,
                'appel_offre_name': match.appel_offre.nom_projet,
                'client': match.appel_offre.client,
                'score': match.score,
                'date_validation': match.created_at,
                'domaine_principal': match.consultant.domaine_principal
            })

        return Response(data)
    except Exception as e:
        logger.error(f"Erreur dans validated_matches: {str(e)}")
        return Response({"error": str(e)}, status=500)


@api_view(['GET'])
def consultant_data(request, consultant_id):
    """
    Récupère les données d'un consultant
    """
    try:
        consultant = get_object_or_404(Consultant, id=consultant_id)
        logger.info(
            f"Récupération des données pour consultant ID {consultant_id}: {consultant.nom} {consultant.prenom}")

        # Récupération des compétences
        competences = Competence.objects.filter(consultant=consultant)
        competences_list = [c.nom_competence for c in competences]
        logger.info(f"Compétences trouvées: {competences_list}")

        # Réponse avec les données du consultant
        return Response({
            "firstName": consultant.prenom,
            "lastName": consultant.nom,
            "email": consultant.user.email if hasattr(consultant, 'user') and consultant.user else consultant.email,
            "phone": consultant.telephone,
            "country": consultant.pays,
            "city": consultant.ville,
            "startAvailability": consultant.date_debut_dispo,
            "endAvailability": consultant.date_fin_dispo,
            "skills": ", ".join(competences_list),
            "expertise": consultant.expertise,
            "domaine_principal": consultant.domaine_principal,
            "specialite": consultant.specialite,
            "cvFilename": consultant.cv.name.split('/')[-1] if consultant.cv else None
        })

    except Exception as e:
        logger.error(f"Erreur récupération consultant {consultant_id}: {e}")
        return Response({"error": f"Erreur lors de la récupération des données: {str(e)}"}, status=500)


@api_view(['GET'])
@renderer_classes([JSONRenderer])
def admin_pending_consultants(request):
    """
    Récupère la liste des consultants en attente de validation
    """
    try:
        # Récupère seulement les consultants non validés
        consultants = Consultant.objects.filter(is_validated=False)
        serializer = ConsultantSerializer(consultants, many=True)
        return Response({"success": True, "data": serializer.data})
    except Exception as e:
        logger.error(f"Erreur lors de la récupération des consultants en attente: {str(e)}")
        return Response({"success": False, "error": str(e)}, status=500)


@api_view(['PUT'])
def admin_validate_consultant(request, pk):
    """
    Valide un consultant
    """
    try:
        consultant = get_object_or_404(Consultant, pk=pk)

        # Changer le statut de validation
        consultant.is_validated = True
        consultant.save()

        # Envoi d'un email au consultant pour l'informer que son compte a été validé
        try:
            # Envoi d'email de confirmation de validation
            send_validation_email(consultant)
            logger.info(f"Email de validation envoyé à {consultant.email}")
        except Exception as e:
            logger.error(f"Erreur lors de l'envoi de l'email de validation: {str(e)}")

        return Response({
            "success": True,
            "message": f"Consultant {consultant.prenom} {consultant.nom} validé avec succès"
        })
    except Exception as e:
        logger.error(f"Erreur lors de la validation du consultant {pk}: {str(e)}")
        return Response({
            "success": False,
            "error": str(e)
        }, status=500)


@api_view(['GET'])
def consultant_missions(request, consultant_id):
    """
    Récupère les missions validées pour un consultant spécifique
    """
    try:
        # Vérifier que le consultant existe
        consultant = get_object_or_404(Consultant, id=consultant_id)

        # Log pour débogage
        logger.info(
            f"Récupération des missions pour le consultant ID={consultant_id} ({consultant.prenom} {consultant.nom})")

        # Récupérer tous les matchings validés pour ce consultant
        validated_matches = MatchingResult.objects.filter(
            consultant=consultant,
            is_validated=True
        ).select_related('appel_offre')

        # Log du nombre de matchings trouvés
        logger.info(f"Nombre de matchings validés trouvés: {validated_matches.count()}")

        # Formater les données pour le frontend
        missions = []
        for match in validated_matches:
            appel_offre = match.appel_offre
            logger.info(f"Matching ID={match.id} validé trouvé pour l'appel d'offre {appel_offre.nom_projet}")

            missions.append({
                'id': match.id,
                'appel_offre_id': appel_offre.id,
                'nom_projet': appel_offre.nom_projet,
                'client': appel_offre.client,
                'description': appel_offre.description,
                'date_debut': appel_offre.date_debut,
                'date_fin': appel_offre.date_fin,
                'score': float(match.score),
                'date_validation': match.created_at
            })

        logger.info(f"Total de {len(missions)} missions formatées pour le consultant {consultant_id}")

        return Response({
            "success": True,
            "missions": missions
        })
    except Exception as e:
        logger.error(f"Erreur lors de la récupération des missions du consultant {consultant_id}: {str(e)}")
        return Response({
            "success": False,
            "error": str(e)
        }, status=500)


@api_view(['GET'])
def debug_consultant_missions(request, consultant_id):
    """Endpoint de débogage pour diagnostiquer le problème de missions du consultant"""
    try:
        consultant = get_object_or_404(Consultant, id=consultant_id)

        # Récupérer tous les matchings pour ce consultant (validés ou non)
        all_matches = MatchingResult.objects.filter(consultant=consultant)

        # Formater les données pour le débogage
        result = {
            "consultant_info": {
                "id": consultant.id,
                "nom": consultant.nom,
                "prenom": consultant.prenom,
                "email": consultant.email
            },
            "all_matchings": [],
            "validated_matchings": []
        }

        for match in all_matches:
            match_data = {
                "id": match.id,
                "appel_offre_id": match.appel_offre.id,
                "appel_offre_name": match.appel_offre.nom_projet,
                "client": match.appel_offre.client,
                "is_validated": match.is_validated,
                "score": float(match.score),
                "created_at": match.created_at
            }
            result["all_matchings"].append(match_data)

            if match.is_validated:
                result["validated_matchings"].append(match_data)

        # Ajouter des logs détaillés
        logger.info(f"Debug consultant missions - Consultant ID: {consultant_id}")
        logger.info(f"Nombre total de matchings: {len(result['all_matchings'])}")
        logger.info(f"Nombre de matchings validés: {len(result['validated_matchings'])}")

        return Response(result)
    except Exception as e:
        logger.error(f"Erreur dans debug_consultant_missions: {str(e)}")
        return Response({"error": str(e)}, status=500)


@api_view(['GET'])
def debug_matching_status(request, consultant_id=None, appel_offre_id=None):
    """
    Endpoint de débogage pour vérifier l'état des matchings
    Accessible uniquement en mode DEBUG
    """
    if not settings.DEBUG:
        return Response({"error": "Endpoint disponible uniquement en mode DEBUG"}, status=403)

    try:
        filters = {}
        if consultant_id:
            filters['consultant_id'] = consultant_id
        if appel_offre_id:
            filters['appel_offre_id'] = appel_offre_id

        matchings = MatchingResult.objects.filter(**filters)

        results = []
        for match in matchings:
            results.append({
                'id': match.id,
                'consultant_id': match.consultant.id,
                'consultant_nom': f"{match.consultant.prenom} {match.consultant.nom}",
                'appel_offre_id': match.appel_offre.id,
                'appel_offre_nom': match.appel_offre.nom_projet,
                'score': float(match.score),
                'is_validated': match.is_validated,
                'created_at': match.created_at
            })

        return Response({
            'success': True,
            'count': len(results),
            'matchings': results
        })
    except Exception as e:
        return Response({
            'success': False,
            'error': str(e)
        }, status=500)


# Gestion des documents GED
# views.py - Section GED corrigée avec gestion des erreurs

import os
import logging
from django.db.models import Q
from django.http import FileResponse, JsonResponse
from django.shortcuts import get_object_or_404
from rest_framework import status
from rest_framework.decorators import api_view, parser_classes
from rest_framework.parsers import MultiPartParser, FormParser, JSONParser
from rest_framework.response import Response
from django.core.files.storage import default_storage
from django.utils import timezone
import mimetypes

from .models import (
    DocumentGED, DocumentCategory, DocumentVersion, DocumentAccess,
    AppelOffre, Consultant, Mission, Projet
)
from .serializers import DocumentGEDSerializer, DocumentCategorySerializer

logger = logging.getLogger(__name__)


@api_view(['GET', 'POST'])
@parser_classes([MultiPartParser, FormParser, JSONParser])
def documents_list(request):
    """
    Liste tous les documents ou crée un nouveau document
    Version corrigée avec gestion des erreurs de fichiers manquants
    """
    if request.method == 'GET':
        try:
            # Récupérer les paramètres de filtre
            document_type = request.query_params.get('document_type')
            category_id = request.query_params.get('category_id')
            search = request.query_params.get('search')
            folder_type = request.query_params.get('folder_type')
            appel_offre_id = request.query_params.get('appel_offre_id')

            # Construire la requête
            documents = DocumentGED.objects.all()

            # Appliquer les filtres
            if document_type and document_type not in ['null', 'tous', '']:
                documents = documents.filter(document_type=document_type)

            if category_id and category_id not in ['null', 'tous', '']:
                documents = documents.filter(category_id=category_id)

            if folder_type and folder_type not in ['null', 'tous', '']:
                documents = documents.filter(folder_type=folder_type)

            if appel_offre_id and appel_offre_id not in ['null', 'tous', '']:
                documents = documents.filter(appel_offre_id=appel_offre_id)

            if search:
                documents = documents.filter(
                    Q(title__icontains=search) |
                    Q(description__icontains=search) |
                    Q(tags__icontains=search)
                )

            # Ordonner par date de modification décroissante
            documents = documents.order_by('-modified_date')

            # Vérifier l'existence des fichiers et filtrer ceux qui sont corrompus
            valid_documents = []
            for doc in documents:
                try:
                    # Vérifier l'existence du fichier
                    if doc.file and doc.file.name:
                        file_exists = doc.check_file_exists()
                        if file_exists or not doc.file_exists:
                            # Inclure le document même si le fichier est manquant
                            # pour permettre à l'utilisateur de voir l'erreur
                            valid_documents.append(doc)
                    else:
                        # Document sans fichier
                        valid_documents.append(doc)
                except Exception as e:
                    logger.error(f"Erreur lors de la vérification du document {doc.id}: {str(e)}")
                    # Inclure quand même le document pour permettre la gestion de l'erreur
                    valid_documents.append(doc)

            # Sérialiser et retourner les résultats
            serializer = DocumentGEDSerializer(valid_documents, many=True)
            return Response(serializer.data)

        except Exception as e:
            logger.error(f"Erreur lors de la récupération des documents: {str(e)}")
            return Response({
                'error': 'Erreur lors de la récupération des documents',
                'detail': str(e)
            }, status=500)

    elif request.method == 'POST':
        try:
            # Créer un nouveau document
            serializer = DocumentGEDSerializer(data=request.data)
            if serializer.is_valid():
                # Vérifier si l'utilisateur est authentifié
                if request.user.is_authenticated:
                    document = serializer.save(created_by=request.user)
                else:
                    document = serializer.save(created_by=None)

                # Enregistrer l'accès au document
                if request.user.is_authenticated:
                    DocumentAccess.objects.create(
                        document=document,
                        user=request.user,
                        action='EDIT'
                    )

                return Response(serializer.data, status=status.HTTP_201_CREATED)
            return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)
        except Exception as e:
            logger.error(f"Erreur lors de la création du document: {str(e)}")
            return Response({
                'error': 'Erreur lors de la création du document',
                'detail': str(e)
            }, status=500)


@api_view(['GET'])
def documents_by_appel_offre(request, appel_offre_id):
    """
    Récupère les documents liés à un appel d'offre, organisés par type de dossier
    Version corrigée avec les nouveaux types de dossiers
    """
    try:
        # Vérifier que l'appel d'offre existe
        appel_offre = get_object_or_404(AppelOffre, id=appel_offre_id)

        # Récupérer tous les documents de cet appel d'offre
        documents = DocumentGED.objects.filter(appel_offre=appel_offre)

        # Organiser les documents par type de dossier
        result = {}
        
        # Définir les types de dossiers selon le contexte
        # Pour les appels d'offres (A.O)
        ao_folder_types = [
            ('AO_ADMIN', 'Dossier administratif'),
            ('AO_TECHNIQUE', 'Dossier technique'),
            ('AO_FINANCE', 'Dossier financier'),
        ]
        
        # Pour les AMI
        ami_folder_types = [
            ('AMI_CONTEXTE', 'Contexte'),
            ('AMI_OUTREACH', 'Outreach'),
        ]
        
        # Dossier général
        general_folder_types = [
            ('GENERAL', 'Général'),
        ]
        
        # Combiner tous les types
        all_folder_types = ao_folder_types + ami_folder_types + general_folder_types
        
        for folder_type, folder_label in all_folder_types:
            docs = documents.filter(folder_type=folder_type)
            
            # Vérifier l'existence des fichiers pour chaque document
            valid_docs = []
            for doc in docs:
                try:
                    doc.check_file_exists()
                    valid_docs.append(doc)
                except Exception as e:
                    logger.warning(f"Erreur lors de la vérification du document {doc.id}: {str(e)}")
                    valid_docs.append(doc)  # Inclure quand même pour afficher l'erreur
            
            if valid_docs:
                result[folder_type] = {
                    'label': folder_label,
                    'documents': DocumentGEDSerializer(valid_docs, many=True).data
                }

        return Response({
            'appel_offre': {
                'id': appel_offre.id,
                'nom': appel_offre.nom_projet,
                'client': appel_offre.client
            },
            'documents_by_folder': result
        })
    except Exception as e:
        logger.error(f"Erreur lors de la récupération des documents par appel d'offre: {str(e)}")
        return Response({
            'error': 'Erreur lors de la récupération des documents',
            'detail': str(e)
        }, status=500)


@api_view(['GET', 'PUT', 'DELETE'])
@parser_classes([MultiPartParser, FormParser])
def document_detail(request, pk):
    """
    Récupère, modifie ou supprime un document spécifique
    Version corrigée avec gestion des erreurs
    """
    try:
        document = get_object_or_404(DocumentGED, pk=pk)
    except Exception as e:
        return Response({
            'error': 'Document non trouvé',
            'detail': str(e)
        }, status=404)

    if request.method == 'GET':
        try:
            # Vérifier l'existence du fichier
            document.check_file_exists()
            
            # Enregistrer l'accès au document
            if request.user.is_authenticated:
                DocumentAccess.objects.create(
                    document=document,
                    user=request.user,
                    action='VIEW'
                )

            serializer = DocumentGEDSerializer(document)
            return Response(serializer.data)
        except Exception as e:
            logger.error(f"Erreur lors de la récupération du document {pk}: {str(e)}")
            return Response({
                'error': 'Erreur lors de la récupération du document',
                'detail': str(e)
            }, status=500)

    elif request.method == 'PUT':
        try:
            # Mettre à jour le document
            serializer = DocumentGEDSerializer(document, data=request.data, partial=True)
            if serializer.is_valid():
                updated_doc = serializer.save()

                # Si un nouveau fichier est envoyé, créer une nouvelle version
                if 'file' in request.FILES:
                    from datetime import datetime
                    version_number = f"{datetime.now().strftime('%Y%m%d')}-{document.versions.count() + 1}"

                    if request.user.is_authenticated:
                        DocumentVersion.objects.create(
                            document=document,
                            version_number=version_number,
                            file=document.file,  # Ancien fichier
                            comments=f"Version créée lors de la mise à jour du {datetime.now().strftime('%d/%m/%Y')}",
                            created_by=request.user
                        )
                    else:
                        DocumentVersion.objects.create(
                            document=document,
                            version_number=version_number,
                            file=document.file,  # Ancien fichier
                            comments=f"Version créée lors de la mise à jour du {datetime.now().strftime('%d/%m/%Y')}",
                            created_by=None
                        )

                # Enregistrer l'accès au document
                if request.user.is_authenticated:
                    DocumentAccess.objects.create(
                        document=document,
                        user=request.user,
                        action='EDIT'
                    )

                return Response(serializer.data)
            return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)
        except Exception as e:
            logger.error(f"Erreur lors de la mise à jour du document {pk}: {str(e)}")
            return Response({
                'error': 'Erreur lors de la mise à jour du document',
                'detail': str(e)
            }, status=500)

    elif request.method == 'DELETE':
        try:
            # Enregistrer l'accès avant la suppression
            if request.user.is_authenticated:
                DocumentAccess.objects.create(
                    document=document,
                    user=request.user,
                    action='DELETE'
                )

            # Supprimer le fichier physique s'il existe
            try:
                if document.file and document.file.name:
                    file_path = document.file.path
                    if os.path.exists(file_path):
                        os.remove(file_path)
                        logger.info(f"Fichier supprimé: {file_path}")
            except Exception as file_error:
                logger.warning(f"Erreur lors de la suppression du fichier physique: {str(file_error)}")

            # Supprimer le document de la base de données
            document.delete()
            return Response(status=status.HTTP_204_NO_CONTENT)
        except Exception as e:
            logger.error(f"Erreur lors de la suppression du document {pk}: {str(e)}")
            return Response({
                'error': 'Erreur lors de la suppression du document',
                'detail': str(e)
            }, status=500)


@api_view(['GET'])
def document_download(request, pk):
    """
    Télécharge un document avec gestion des erreurs
    """
    try:
        document = get_object_or_404(DocumentGED, pk=pk)

        # Vérifier que le fichier existe
        if not document.file or not document.file.name:
            return Response({
                'error': 'Aucun fichier associé à ce document'
            }, status=404)

        # Vérifier l'existence physique du fichier
        try:
            file_path = document.file.path
            if not os.path.exists(file_path):
                logger.error(f"Fichier physique manquant: {file_path}")
                document.file_exists = False
                document.last_file_check = timezone.now()
                document.save(update_fields=['file_exists', 'last_file_check'])
                
                return Response({
                    'error': 'Le fichier physique est manquant sur le serveur',
                    'file_path': file_path
                }, status=404)
        except Exception as path_error:
            logger.error(f"Erreur lors de l'accès au chemin du fichier: {str(path_error)}")
            return Response({
                'error': 'Erreur lors de l\'accès au fichier',
                'detail': str(path_error)
            }, status=500)

        # Enregistrer l'accès au document
        if request.user.is_authenticated:
            DocumentAccess.objects.create(
                document=document,
                user=request.user,
                action='DOWNLOAD'
            )

        # Préparer le téléchargement
        file_name = os.path.basename(file_path)

        # Déterminer le type MIME
        content_type, encoding = mimetypes.guess_type(file_path)
        content_type = content_type or 'application/octet-stream'

        # Retourner le fichier
        try:
            response = FileResponse(open(file_path, 'rb'), content_type=content_type)
            response['Content-Disposition'] = f'attachment; filename="{file_name}"'
            
            # Marquer le fichier comme existant
            document.file_exists = True
            document.save(update_fields=['file_exists'])
            
            return response
        except Exception as download_error:
            logger.error(f"Erreur lors du téléchargement: {str(download_error)}")
            return Response({
                'error': 'Erreur lors du téléchargement du fichier',
                'detail': str(download_error)
            }, status=500)

    except Exception as e:
        logger.error(f"Erreur générale lors du téléchargement du document {pk}: {str(e)}")
        return Response({
            'error': 'Erreur lors du téléchargement',
            'detail': str(e)
        }, status=500)


@api_view(['GET', 'POST'])
def document_categories(request):
    """
    Liste ou crée des catégories de documents
    """
    try:
        if request.method == 'GET':
            categories = DocumentCategory.objects.all().order_by('name')
            serializer = DocumentCategorySerializer(categories, many=True)
            return Response(serializer.data)

        elif request.method == 'POST':
            serializer = DocumentCategorySerializer(data=request.data)
            if serializer.is_valid():
                serializer.save()
                return Response(serializer.data, status=status.HTTP_201_CREATED)
            return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)
    except Exception as e:
        logger.error(f"Erreur dans document_categories: {str(e)}")
        return Response({
            'error': 'Erreur lors de la gestion des catégories',
            'detail': str(e)
        }, status=500)


@api_view(['PUT', 'DELETE'])
def document_category_detail(request, pk):
    """
    Modifie ou supprime une catégorie
    """
    try:
        category = get_object_or_404(DocumentCategory, pk=pk)

        if request.method == 'PUT':
            serializer = DocumentCategorySerializer(category, data=request.data)
            if serializer.is_valid():
                serializer.save()
                return Response(serializer.data)
            return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)

        elif request.method == 'DELETE':
            category.delete()
            return Response(status=status.HTTP_204_NO_CONTENT)
    except Exception as e:
        logger.error(f"Erreur dans document_category_detail: {str(e)}")
        return Response({
            'error': 'Erreur lors de la gestion de la catégorie',
            'detail': str(e)
        }, status=500)


@api_view(['GET'])
def document_versions(request, document_id):
    """
    Récupère les versions d'un document
    """
    try:
        document = get_object_or_404(DocumentGED, pk=document_id)
        versions = document.versions.all().order_by('-created_at')

        data = []
        for version in versions:
            data.append({
                'id': version.id,
                'version_number': version.version_number,
                'created_by': version.created_by.username if version.created_by else "Inconnu",
                'created_at': version.created_at,
                'comments': version.comments,
                'file_url': request.build_absolute_uri(version.file.url) if version.file else None
            })

        return Response(data)
    except Exception as e:
        logger.error(f"Erreur lors de la récupération des versions: {str(e)}")
        return Response({
            'error': 'Erreur lors de la récupération des versions',
            'detail': str(e)
        }, status=500)


@api_view(['GET'])
def document_stats(request):
    """
    Statistiques sur les documents dans la GED
    """
    try:
        total_documents = DocumentGED.objects.count()
        documents_by_type = {}

        for doc_type, label in DocumentGED.DOCUMENT_TYPES:
            count = DocumentGED.objects.filter(document_type=doc_type).count()
            documents_by_type[doc_type] = {
                'label': label,
                'count': count
            }

        recent_documents = DocumentGED.objects.order_by('-upload_date')[:5]
        
        # Vérifier l'existence des fichiers pour les documents récents
        valid_recent_docs = []
        for doc in recent_documents:
            try:
                doc.check_file_exists()
                valid_recent_docs.append(doc)
            except Exception as e:
                logger.warning(f"Erreur lors de la vérification du document récent {doc.id}: {str(e)}")
                valid_recent_docs.append(doc)  # Inclure quand même
        
        recent_docs_data = DocumentGEDSerializer(valid_recent_docs, many=True).data

        return Response({
            'total_documents': total_documents,
            'documents_by_type': documents_by_type,
            'recent_documents': recent_docs_data
        })
    except Exception as e:
        logger.error(f"Erreur lors de la récupération des statistiques: {str(e)}")
        return Response({
            'error': 'Erreur lors de la récupération des statistiques',
            'detail': str(e)
        }, status=500)


@api_view(['POST'])
def cleanup_missing_files(request):
    """
    Endpoint utilitaire pour nettoyer les documents avec des fichiers manquants
    """
    try:
        if not request.user.is_authenticated or not request.user.is_staff:
            return Response({
                'error': 'Permission refusée'
            }, status=403)

        missing_files = []
        fixed_documents = []
        
        documents = DocumentGED.objects.all()
        
        for doc in documents:
            try:
                if doc.file and doc.file.name:
                    file_path = doc.file.path
                    if not os.path.exists(file_path):
                        missing_files.append({
                            'id': doc.id,
                            'title': doc.title,
                            'file_path': file_path
                        })
                        
                        # Marquer comme manquant
                        doc.file_exists = False
                        doc.last_file_check = timezone.now()
                        doc.save(update_fields=['file_exists', 'last_file_check'])
                        fixed_documents.append(doc.id)
                    else:
                        # Marquer comme existant
                        if not doc.file_exists:
                            doc.file_exists = True
                            doc.save(update_fields=['file_exists'])
                            fixed_documents.append(doc.id)
            except Exception as e:
                logger.error(f"Erreur lors de la vérification du document {doc.id}: {str(e)}")

        return Response({
            'success': True,
            'missing_files_count': len(missing_files),
            'missing_files': missing_files,
            'fixed_documents': fixed_documents
        })
    except Exception as e:
        logger.error(f"Erreur lors du nettoyage: {str(e)}")
        return Response({
            'error': 'Erreur lors du nettoyage',
            'detail': str(e)
        }, status=500)
    """
    Statistiques sur les documents dans la GED
    """
    total_documents = DocumentGED.objects.count()
    documents_by_type = {}

    for doc_type, label in DocumentGED.DOCUMENT_TYPES:
        count = DocumentGED.objects.filter(document_type=doc_type).count()
        documents_by_type[doc_type] = {
            'label': label,
            'count': count
        }

    recent_documents = DocumentGED.objects.order_by('-upload_date')[:5]
    recent_docs_data = DocumentGEDSerializer(recent_documents, many=True).data

    return Response({
        'total_documents': total_documents,
        'documents_by_type': documents_by_type,
        'recent_documents': recent_docs_data
    })
    
# Ajoutez cette fonction de débogage
def analyze_matching_performance():
    """
    Analyse la performance des algorithmes de matching
    en comparant les prédictions avec les validations manuelles.
    Cette fonction peut être exécutée périodiquement pour ajuster les paramètres.
    """
    try:
        # Récupérer tous les matchings avec leurs statuts de validation
        matchings = MatchingResult.objects.all()
        
        # Séparer les matchings validés et non validés
        validated = matchings.filter(is_validated=True)
        non_validated = matchings.filter(is_validated=False)
        
        # Si pas assez de données pour l'analyse, sortir
        if validated.count() < 5:
            logger.info("Pas assez de matchings validés pour analyser la performance")
            return {
                'success': False,
                'message': "Données insuffisantes pour l'analyse"
            }
        
        # Analyse des scores moyens
        avg_validated_score = validated.aggregate(models.Avg('score'))['score__avg']
        avg_non_validated_score = non_validated.aggregate(models.Avg('score'))['score__avg']
        
        # Récupérer les appels d'offre avec au moins un matching validé
        appels_with_validated = AppelOffre.objects.filter(
            matchings__is_validated=True
        ).distinct()
        
        performance_by_domain = {}
        performance_by_expertise = {}
        
        # Analyse par domaine
        for domain, _ in Consultant.SPECIALITES_CHOICES:
            domain_validated = validated.filter(consultant__domaine_principal=domain).count()
            domain_total = matchings.filter(consultant__domaine_principal=domain).count()
            
            if domain_total > 0:
                domain_ratio = domain_validated / domain_total
                performance_by_domain[domain] = {
                    'validated': domain_validated,
                    'total': domain_total,
                    'ratio': domain_ratio
                }
        
        # Analyse par niveau d'expertise
        expertise_levels = ['Débutant', 'Intermédiaire', 'Expert']
        for level in expertise_levels:
            level_validated = validated.filter(consultant__expertise=level).count()
            level_total = matchings.filter(consultant__expertise=level).count()
            
            if level_total > 0:
                level_ratio = level_validated / level_total
                performance_by_expertise[level] = {
                    'validated': level_validated,
                    'total': level_total,
                    'ratio': level_ratio
                }
        
        # Analyse détaillée des matchings validés vs. non validés
        detailed_analysis = []
        
        for appel in appels_with_validated:
            appel_validated = validated.filter(appel_offre=appel)
            appel_non_validated = non_validated.filter(appel_offre=appel)
            
            # Score moyen des validés pour cet appel
            avg_score_validated = appel_validated.aggregate(models.Avg('score'))['score__avg'] or 0
            
            # Comparer les compétences des consultants validés vs. non validés
            validated_consultants = Consultant.objects.filter(id__in=appel_validated.values_list('consultant_id', flat=True))
            non_validated_consultants = Consultant.objects.filter(id__in=appel_non_validated.values_list('consultant_id', flat=True))
            
            # Compétences communes chez les validés
            common_skills = {}
            
            for consultant in validated_consultants:
                skills = Competence.objects.filter(consultant=consultant).values_list('nom_competence', flat=True)
                for skill in skills:
                    skill_lower = skill.lower()
                    if skill_lower in common_skills:
                        common_skills[skill_lower] += 1
                    else:
                        common_skills[skill_lower] = 1
            
            # Trouver les compétences les plus fréquentes chez les validés
            top_skills = sorted(common_skills.items(), key=lambda x: x[1], reverse=True)[:5]
            
            detailed_analysis.append({
                'appel_offre_id': appel.id,
                'appel_offre_name': appel.nom_projet,
                'validated_count': appel_validated.count(),
                'non_validated_count': appel_non_validated.count(),
                'avg_score_validated': avg_score_validated,
                'top_skills': [skill for skill, count in top_skills]
            })
        
        # Recommandations basées sur l'analyse
        recommendations = []
        
        # Si l'écart entre les scores validés et non validés est faible
        if avg_validated_score and avg_non_validated_score:
            score_diff = avg_validated_score - avg_non_validated_score
            
            if score_diff < 10:
                recommendations.append(
                    "L'écart entre les scores des matchings validés et non validés est faible. "
                    "Il est recommandé d'ajuster les pondérations de l'algorithme de matching."
                )
        
        # Recommandations par domaine
        for domain, perf in performance_by_domain.items():
            if perf['ratio'] < 0.2 and perf['total'] > 10:
                domain_name = dict(Consultant.SPECIALITES_CHOICES)[domain]
                recommendations.append(
                    f"Faible taux de validation pour le domaine {domain_name} ({perf['ratio']*100:.1f}%). "
                    "Les critères spécifiques à ce domaine pourraient nécessiter une révision."
                )
        
        # Recommandations par expertise
        for level, perf in performance_by_expertise.items():
            if perf['ratio'] < 0.2 and perf['total'] > 10:
                recommendations.append(
                    f"Faible taux de validation pour les consultants de niveau {level} ({perf['ratio']*100:.1f}%). "
                    "Ajustez potentiellement l'impact du niveau d'expertise dans le calcul du score."
                )
        
        result = {
            'success': True,
            'stats': {
                'total_matchings': matchings.count(),
                'validated_matchings': validated.count(),
                'validation_rate': validated.count() / matchings.count() if matchings.count() > 0 else 0,
                'avg_validated_score': avg_validated_score,
                'avg_non_validated_score': avg_non_validated_score
            },
            'performance_by_domain': performance_by_domain,
            'performance_by_expertise': performance_by_expertise,
            'detailed_analysis': detailed_analysis,
            'recommendations': recommendations
        }
        
        logger.info(f"Analyse de performance du matching complétée: {len(recommendations)} recommandations générées")
        return result
    except Exception as e:
        logger.error(f"Erreur lors de l'analyse de performance: {str(e)}")
        return {
            'success': False,
            'error': str(e)
        }
def analyze_matching_performance():
    """
    Analyse la performance des algorithmes de matching
    en comparant les prédictions avec les validations manuelles.
    Cette fonction peut être exécutée périodiquement pour ajuster les paramètres.
    """
    try:
        # Récupérer tous les matchings avec leurs statuts de validation
        matchings = MatchingResult.objects.all()
        
        # Séparer les matchings validés et non validés
        validated = matchings.filter(is_validated=True)
        non_validated = matchings.filter(is_validated=False)
        
        # Si pas assez de données pour l'analyse, sortir
        if validated.count() < 5:
            logger.info("Pas assez de matchings validés pour analyser la performance")
            return {
                'success': False,
                'message': "Données insuffisantes pour l'analyse"
            }
        
        # Analyse des scores moyens
        avg_validated_score = validated.aggregate(models.Avg('score'))['score__avg']
        avg_non_validated_score = non_validated.aggregate(models.Avg('score'))['score__avg']
        
        # Récupérer les appels d'offre avec au moins un matching validé
        appels_with_validated = AppelOffre.objects.filter(
            matchings__is_validated=True
        ).distinct()
        
        performance_by_domain = {}
        performance_by_expertise = {}
        
        # Analyse par domaine
        for domain, _ in Consultant.SPECIALITES_CHOICES:
            domain_validated = validated.filter(consultant__domaine_principal=domain).count()
            domain_total = matchings.filter(consultant__domaine_principal=domain).count()
            
            if domain_total > 0:
                domain_ratio = domain_validated / domain_total
                performance_by_domain[domain] = {
                    'validated': domain_validated,
                    'total': domain_total,
                    'ratio': domain_ratio
                }
        
        # Analyse par niveau d'expertise
        expertise_levels = ['Débutant', 'Intermédiaire', 'Expert']
        for level in expertise_levels:
            level_validated = validated.filter(consultant__expertise=level).count()
            level_total = matchings.filter(consultant__expertise=level).count()
            
            if level_total > 0:
                level_ratio = level_validated / level_total
                performance_by_expertise[level] = {
                    'validated': level_validated,
                    'total': level_total,
                    'ratio': level_ratio
                }
        
        # Analyse détaillée des matchings validés vs. non validés
        detailed_analysis = []
        
        for appel in appels_with_validated:
            appel_validated = validated.filter(appel_offre=appel)
            appel_non_validated = non_validated.filter(appel_offre=appel)
            
            # Score moyen des validés pour cet appel
            avg_score_validated = appel_validated.aggregate(models.Avg('score'))['score__avg'] or 0
            
            # Comparer les compétences des consultants validés vs. non validés
            validated_consultants = Consultant.objects.filter(id__in=appel_validated.values_list('consultant_id', flat=True))
            non_validated_consultants = Consultant.objects.filter(id__in=appel_non_validated.values_list('consultant_id', flat=True))
            
            # Compétences communes chez les validés
            common_skills = {}
            
            for consultant in validated_consultants:
                skills = Competence.objects.filter(consultant=consultant).values_list('nom_competence', flat=True)
                for skill in skills:
                    skill_lower = skill.lower()
                    if skill_lower in common_skills:
                        common_skills[skill_lower] += 1
                    else:
                        common_skills[skill_lower] = 1
            
            # Trouver les compétences les plus fréquentes chez les validés
            top_skills = sorted(common_skills.items(), key=lambda x: x[1], reverse=True)[:5]
            
            detailed_analysis.append({
                'appel_offre_id': appel.id,
                'appel_offre_name': appel.nom_projet,
                'validated_count': appel_validated.count(),
                'non_validated_count': appel_non_validated.count(),
                'avg_score_validated': avg_score_validated,
                'top_skills': [skill for skill, count in top_skills]
            })
        
        # Recommandations basées sur l'analyse
        recommendations = []
        
        # Si l'écart entre les scores validés et non validés est faible
        if avg_validated_score and avg_non_validated_score:
            score_diff = avg_validated_score - avg_non_validated_score
            
            if score_diff < 10:
                recommendations.append(
                    "L'écart entre les scores des matchings validés et non validés est faible. "
                    "Il est recommandé d'ajuster les pondérations de l'algorithme de matching."
                )
        
        # Recommandations par domaine
        for domain, perf in performance_by_domain.items():
            if perf['ratio'] < 0.2 and perf['total'] > 10:
                domain_name = dict(Consultant.SPECIALITES_CHOICES)[domain]
                recommendations.append(
                    f"Faible taux de validation pour le domaine {domain_name} ({perf['ratio']*100:.1f}%). "
                    "Les critères spécifiques à ce domaine pourraient nécessiter une révision."
                )
        
        # Recommandations par expertise
        for level, perf in performance_by_expertise.items():
            if perf['ratio'] < 0.2 and perf['total'] > 10:
                recommendations.append(
                    f"Faible taux de validation pour les consultants de niveau {level} ({perf['ratio']*100:.1f}%). "
                    "Ajustez potentiellement l'impact du niveau d'expertise dans le calcul du score."
                )
        
        result = {
            'success': True,
            'stats': {
                'total_matchings': matchings.count(),
                'validated_matchings': validated.count(),
                'validation_rate': validated.count() / matchings.count() if matchings.count() > 0 else 0,
                'avg_validated_score': avg_validated_score,
                'avg_non_validated_score': avg_non_validated_score
            },
            'performance_by_domain': performance_by_domain,
            'performance_by_expertise': performance_by_expertise,
            'detailed_analysis': detailed_analysis,
            'recommendations': recommendations
        }
        
        logger.info(f"Analyse de performance du matching complétée: {len(recommendations)} recommandations générées")
        return result
    except Exception as e:
        logger.error(f"Erreur lors de l'analyse de performance: {str(e)}")
        return {
            'success': False,
            'error': str(e)
        }
@api_view(['GET'])
def debug_skills_match(request, consultant_id, appel_offre_id):
    """
    Endpoint de débogage pour analyser le calcul du score des compétences
    """
    try:
        consultant = get_object_or_404(Consultant, id=consultant_id)
        appel_offre = get_object_or_404(AppelOffre, id=appel_offre_id)
        
        # Récupérer les compétences du consultant
        consultant_skills = list(
            Competence.objects.filter(consultant=consultant).values_list('nom_competence', 'niveau')
        )
        
        # Extraire des mots-clés de la description
        description_lower = appel_offre.description.lower() if appel_offre.description else ""
        words = re.findall(r'\b(\w{4,})\b', description_lower)
        stop_words = {'dans', 'pour', 'avec', 'cette', 'votre', 'notre', 'leur', 'vous', 'nous', 'être', 'avoir'}
        keywords = [word for word in words if word not in stop_words and not word.isdigit()]
        
        # Vérifier les compétences par domaine
        domain_scores = {}
        domain_matches = {}
        for domain, skills_list in ALL_SKILLS.items():
            domain_scores[domain] = 0
            domain_matches[domain] = []
            
            for skill in skills_list:
                skill_lower = skill.lower()
                if skill_lower in description_lower:
                    domain_scores[domain] += 1
                    domain_matches[domain].append(skill)
        
        # Calculer le score
        date_score = calculate_date_match_score(consultant, appel_offre)
        skills_score = calculate_skills_match_score(consultant, appel_offre)
        global_score = (date_score * 0.4) + (skills_score * 0.6)
        
        return Response({
            'consultant_skills': consultant_skills,
            'appel_offre_keywords': keywords,
            'domain_scores': domain_scores,
            'domain_matches': domain_matches,
            'date_score': date_score,
            'skills_score': skills_score,
            'global_score': global_score,
            'description_length': len(description_lower)
        })
    except Exception as e:
        logger.error(f"Erreur lors du débogage des compétences: {str(e)}")
        return Response({'error': str(e)}, status=500)
    
    
def calculate_enhanced_match_score(consultant, appel_offre):
    """
    Version améliorée du calcul de score de matching avec:
    - Poids du domaine principal réduit (15% au lieu de 25%)
    - Prise en compte de l'expertise (15%)
    - Analyse sémantique améliorée pour les compétences (70%)
    """
    # Score du domaine (15%)
    domain_score = calculate_domain_match_score(consultant, appel_offre)
    
    # Score d'expertise (15%)
    expertise_score = calculate_expertise_score(consultant)
    
    # Score de compétences (70%)
    skills_score = calculate_enhanced_skills_score(consultant, appel_offre)
    
    # Score final combiné
    combined_score = (domain_score * 0.15) + (expertise_score * 0.15) + (skills_score * 0.70)
    
    # Ajustement sigmoïde pour favoriser les scores élevés
    adjusted_score = sigmoid_adjustment(combined_score)
    
    return adjusted_score
def calculate_semantic_skills_score(consultant, appel_offre):
    """
    Analyse sémantique améliorée pour les compétences
    """
    # Importer spaCy pour l'analyse sémantique
    try:
        import spacy
        nlp = spacy.load("fr_core_news_md")  # Modèle français moyen
    except:
        # Fallback si spaCy n'est pas disponible
        return calculate_alternative_skills_score(consultant, appel_offre)
    
    # Créer des documents spaCy pour analyse sémantique
    # Récupérer compétences du consultant
    consultant_skills = list(
        Competence.objects.filter(consultant=consultant).values_list('nom_competence', flat=True)
    )
    
    # Récupérer compétences demandées dans l'appel d'offre
    ao_skills = []
    
    # D'abord via les critères explicites s'ils existent
    criteria = CriteresEvaluation.objects.filter(appel_offre=appel_offre)
    if criteria.exists():
        ao_skills = [c.nom_critere for c in criteria]
    else:
        # Sinon extraire des mots-clés de la description
        if appel_offre.description:
            doc = nlp(appel_offre.description)
            # Extraire les noms et adjectifs significatifs
            ao_skills = [token.text for token in doc if token.pos_ in ["NOUN", "ADJ"] and len(token.text) > 3]
            
    # Calculer les similarités entre les ensembles de compétences
    max_similarities = []
    
    for ao_skill in ao_skills:
        ao_doc = nlp(ao_skill.lower())
        best_similarity = 0
        
        for consultant_skill in consultant_skills:
            cons_doc = nlp(consultant_skill.lower())
            # Calculer la similarité sémantique
            similarity = ao_doc.similarity(cons_doc)
            best_similarity = max(best_similarity, similarity)
            
        max_similarities.append(best_similarity)
    
    # Si aucune compétence trouvée, score moyen
    if not max_similarities:
        return 35
        
    # Calculer le score moyen des meilleures correspondances
    avg_similarity = sum(max_similarities) / len(max_similarities)
    
    # Convertir en score sur 70
    final_score = avg_similarity * 70
    
    return final_score

def get_top_skills(consultant, limit=5):
    """
    Récupère les compétences principales d'un consultant
    """
    try:
        top_skills = Competence.objects.filter(consultant=consultant).order_by('-niveau')[:limit]
        return [skill.nom_competence for skill in top_skills]
    except Exception as e:
        logger.error(f"Erreur lors de la récupération des compétences: {str(e)}")
        return []
    
@api_view(['PUT'])
def update_consultant_profile(request, consultant_id):
    """
    Met à jour le profil d'un consultant
    """
    try:
        consultant = get_object_or_404(Consultant, id=consultant_id)
        
        # Extraire les données du profil
        data = request.data
        
        # Mettre à jour les champs
        if 'firstName' in data:
            consultant.prenom = data['firstName']
        if 'lastName' in data:
            consultant.nom = data['lastName']
        if 'email' in data:
            consultant.email = data['email']
            # Mettre à jour l'email de l'utilisateur si présent
            if consultant.user:
                consultant.user.email = data['email']
                consultant.user.username = data['email']  # Si username = email
                consultant.user.save()
        if 'phone' in data:
            consultant.telephone = data['phone']
        if 'country' in data:
            consultant.pays = data['country']
        if 'city' in data:
            consultant.ville = data['city']
        if 'startAvailability' in data and data['startAvailability']:
            consultant.date_debut_dispo = data['startAvailability']
        if 'endAvailability' in data and data['endAvailability']:
            consultant.date_fin_dispo = data['endAvailability']
            
        # Sauvegarder les modifications
        consultant.save()
        
        # Renvoyer les données mises à jour
        return Response({
            "firstName": consultant.prenom,
            "lastName": consultant.nom,
            "email": consultant.email,
            "phone": consultant.telephone,
            "country": consultant.pays,
            "city": consultant.ville,
            "startAvailability": consultant.date_debut_dispo,
            "endAvailability": consultant.date_fin_dispo,
            "expertise": consultant.expertise,
            "domaine_principal": consultant.domaine_principal,
            "specialite": consultant.specialite
        })
    except Exception as e:
        logger.error(f"Erreur lors de la mise à jour du profil consultant {consultant_id}: {str(e)}")
        return Response({"error": str(e)}, status=500)
            
            



@api_view(['GET'])
def download_standardized_cv(request, consultant_id):
    """
    Endpoint pour télécharger le CV standardisé d'un consultant
    """
    try:
        # Chemin du répertoire standardized_cvs
        standardized_dir = os.path.join(settings.MEDIA_ROOT, "standardized_cvs")
        
        # Créer le répertoire s'il n'existe pas
        os.makedirs(standardized_dir, exist_ok=True)
        
        # Chercher le CV standardisé le plus récent pour ce consultant
        pattern = f"standardized_cv_{consultant_id}_*.pdf"
        
        try:
            files = default_storage.listdir("standardized_cvs")[1]  # [1] pour les fichiers
        except Exception as e:
            logger.error(f"Erreur lors de la lecture du répertoire: {str(e)}")
            # Vérifier si le répertoire existe, sinon le créer
            os.makedirs(os.path.join(settings.MEDIA_ROOT, "standardized_cvs"), exist_ok=True)
            files = []
        
        matching_files = [f for f in files if f.startswith(f"standardized_cv_{consultant_id}_")]
        
        if not matching_files:
            return Response({"error": "Aucun CV standardisé trouvé pour ce consultant"}, 
                          status=status.HTTP_404_NOT_FOUND)
        
        # Trier par date de création (plus récent en premier)
        matching_files.sort(reverse=True)
        latest_cv = matching_files[0]
        
        # Chemin complet du fichier
        file_path = os.path.join(standardized_dir, latest_cv)
        
        # Vérifier que le fichier existe
        if not os.path.exists(file_path):
            logger.error(f"Fichier introuvable: {file_path}")
            return Response({"error": "Fichier CV standardisé introuvable sur le serveur"}, 
                          status=status.HTTP_404_NOT_FOUND)
        
        # Ouvrir et lire le fichier
        try:
            with open(file_path, 'rb') as f:
                file_data = f.read()
        except Exception as e:
            logger.error(f"Erreur lors de la lecture du fichier: {str(e)}")
            return Response({"error": f"Erreur lors de l'accès au fichier: {str(e)}"}, 
                          status=status.HTTP_500_INTERNAL_SERVER_ERROR)
        
        # Renvoyer le fichier
        response = HttpResponse(file_data, content_type='application/pdf')
        response['Content-Disposition'] = f'attachment; filename="CV_Standardisé_{consultant_id}.pdf"'
        
        return response
        
    except Exception as e:
        logger.error(f"Erreur lors du téléchargement du CV standardisé: {str(e)}")
        return Response({"error": f"Erreur lors du téléchargement du CV standardisé: {str(e)}"}, 
                      status=status.HTTP_500_INTERNAL_SERVER_ERROR)


@api_view(['GET'])
def check_standardized_cv(request, consultant_id):
    """
    Endpoint pour vérifier si un CV standardisé existe pour un consultant
    """
    try:
        # Chemin du répertoire standardized_cvs
        standardized_dir = os.path.join(settings.MEDIA_ROOT, "standardized_cvs")
        
        # Créer le répertoire s'il n'existe pas
        os.makedirs(standardized_dir, exist_ok=True)
        
        # Chercher tous les CV standardisés pour ce consultant
        pattern = f"standardized_cv_{consultant_id}_*.pdf"
        matching_files = []
        
        # Vérifier si le répertoire existe et liste les fichiers
        try:
            files = default_storage.listdir("standardized_cvs")[1]  # [1] pour les fichiers
            matching_files = [f for f in files if f.startswith(f"standardized_cv_{consultant_id}_")]
        except Exception as e:
            logger.error(f"Erreur lors de la lecture du répertoire: {str(e)}")
            matching_files = []
        
        if not matching_files:
            return Response({"available": False, "message": "Aucun CV standardisé trouvé"})
        
        # Trier par date de création (plus récent en premier)
        matching_files.sort(reverse=True)
        latest_cv = matching_files[0]
        
        # Chemin complet du fichier
        file_path = os.path.join(standardized_dir, latest_cv)
        
        # Vérifier que le fichier existe
        if not os.path.exists(file_path):
            return Response({"available": False, "message": "Fichier CV standardisé introuvable"})
        
        return Response({
            "available": True,
            "filename": latest_cv,
            "created_at": datetime.fromtimestamp(os.path.getctime(file_path)).strftime('%Y-%m-%d %H:%M:%S')
        })
        
    except Exception as e:
        logger.error(f"Erreur lors de la vérification du CV standardisé: {str(e)}")
        return Response({"available": False, "error": str(e)}, status=status.HTTP_500_INTERNAL_SERVER_ERROR)
    
    
@api_view(['POST'])
@parser_classes([MultiPartParser, FormParser])
def process_cv(request):
    try:
        cv_file = request.FILES.get('cv')
        if not cv_file:
            return Response({"error": "Aucun fichier fourni"}, status=400)

        consultant_id = request.data.get('consultant_id', 'temp')
        processor = CVProcessor(cv_file)

        if not processor.extract_text():
            return Response({"error": "Erreur lors de l'extraction du texte du CV"}, status=400)

        processor.parse_cv()
        pdf_data = processor.generate_richat_cv()  # ✅ C'est la bonne méthode

        # Enregistrement du fichier PDF
        timestamp = datetime.now().strftime("%Y%m%d%H%M%S")
        filename = f"standardized_cv_{consultant_id}_{timestamp}.pdf"
        path = default_storage.save(f"standardized_cvs/{filename}", ContentFile(pdf_data))
        url = default_storage.url(path)

        return Response({
            "success": True,
            "cv_url": url,
            "filename": filename,
            "extracted_data": processor.extracted_data
        })
    except Exception as e:
        return Response({"error": str(e)}, status=500)
