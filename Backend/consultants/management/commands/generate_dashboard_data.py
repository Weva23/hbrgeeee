from django.core.management.base import BaseCommand
from django.utils.timezone import now
from django.db import transaction
from django.utils import timezone
from decimal import Decimal
import random
import datetime

# Importation de vos modèles - ajustez selon votre structure
from your_app.models import (
    Consultant, AppelOffre, MatchingResult, Competence, 
    User, DocumentGED, DocumentCategory
)

class Command(BaseCommand):
    help = "Génère des données réelles pour le dashboard"

    def handle(self, *args, **kwargs):
        self.stdout.write(self.style.SUCCESS('Début de la génération des données...'))
        
        try:
            with transaction.atomic():
                # 1. Mise à jour des domaines principaux pour les appels d'offres
                self.update_appel_offre_domains()
                
                # 2. Attribution de statuts aux consultants
                self.update_consultants_status()
                
                # 3. Attribution de niveaux d'expertise aux consultants
                self.update_consultants_expertise()
                
                # 4. Génération de matchings validés pour le dashboard
                self.generate_validated_matchings()
                
                # 5. Création de quelques catégories de documents
                self.create_document_categories()
                
                # 6. Création de quelques documents pour la GED
                self.create_documents()
                
                self.stdout.write(self.style.SUCCESS('Génération des données terminée avec succès!'))
        except Exception as e:
            self.stdout.write(self.style.ERROR(f'Erreur lors de la génération des données: {str(e)}'))
            raise

    def update_appel_offre_domains(self):
        """Attribue un domaine principal à chaque appel d'offre"""
        self.stdout.write('Mise à jour des domaines principaux des appels d\'offres...')
        
        # Liste des domaines disponibles (à adapter selon votre modèle)
        domains = ['DIGITAL', 'FINANCE', 'ENERGIE', 'INDUSTRIE']
        
        # Parcourir tous les appels d'offres
        appels = AppelOffre.objects.all()
        updated_count = 0
        
        for appel in appels:
            if not appel.domaine_principal:
                # Attribuer un domaine aléatoire
                appel.domaine_principal = random.choice(domains)
                appel.save()
                updated_count += 1
        
        if not appels.exists():
            # Créer quelques appels d'offres si aucun n'existe
            self.create_sample_appels_offres()
            
        self.stdout.write(f'{updated_count} appels d\'offres mis à jour')

    def update_consultants_status(self):
        """Attribue un statut à chaque consultant (actif/inactif)"""
        self.stdout.write('Mise à jour des statuts des consultants...')
        
        consultants = Consultant.objects.all()
        updated_count = 0
        
        for consultant in consultants:
            if not consultant.status:
                # 65% actifs, 35% inactifs
                consultant.status = random.choices(
                    ["Actif", "Inactif"], 
                    weights=[65, 35], 
                    k=1
                )[0]
                consultant.save()
                updated_count += 1
                
        if not consultants.exists():
            # Créer quelques consultants si aucun n'existe
            self.create_sample_consultants()
            
        self.stdout.write(f'{updated_count} consultants mis à jour')

    def update_consultants_expertise(self):
        """Attribue un niveau d'expertise à chaque consultant"""
        self.stdout.write('Mise à jour des niveaux d\'expertise des consultants...')
        
        consultants = Consultant.objects.all()
        updated_count = 0
        
        for consultant in consultants:
            if not consultant.expertise:
                # Débutant: 30%, Intermédiaire: 45%, Expert: 25%
                consultant.expertise = random.choices(
                    ["Débutant", "Intermédiaire", "Expert"], 
                    weights=[30, 45, 25], 
                    k=1
                )[0]
                consultant.save()
                updated_count += 1
                
                # Si le consultant n'a pas de compétences, en générer quelques-unes
                if Competence.objects.filter(consultant=consultant).count() == 0:
                    self.generate_competences_for_consultant(consultant)
        
        self.stdout.write(f'{updated_count} niveaux d\'expertise mis à jour')

    def generate_validated_matchings(self):
        """Génère des matchings validés pour avoir des données réelles"""
        self.stdout.write('Génération de matchings validés...')
        
        # Vérifier combien de matchings validés existent déjà
        existing_validated = MatchingResult.objects.filter(is_validated=True).count()
        
        # Si on a déjà au moins 40 matchings validés, on ne fait rien
        if existing_validated >= 40:
            self.stdout.write(f'Il y a déjà {existing_validated} matchings validés. Aucun ajout nécessaire.')
            return
        
        # Sinon, on génère les matchings manquants pour atteindre 42
        to_generate = 42 - existing_validated
        self.stdout.write(f'Génération de {to_generate} nouveaux matchings validés...')
        
        # Récupérer consultants et appels d'offres
        consultants = list(Consultant.objects.filter(is_validated=True))
        appels = list(AppelOffre.objects.all())
        
        if not consultants or not appels:
            self.stdout.write(self.style.WARNING('Pas assez de consultants ou d\'appels d\'offres pour générer des matchings'))
            return
        
        # Générer les matchings manquants
        created_count = 0
        for _ in range(to_generate):
            consultant = random.choice(consultants)
            appel = random.choice(appels)
            
            # Vérifier si ce matching existe déjà
            if not MatchingResult.objects.filter(consultant=consultant, appel_offre=appel).exists():
                # Créer un nouveau matching avec un score aléatoire entre 60 et 95
                score = Decimal(random.randint(60, 95))
                
                # Créer le matching avec date de création dans les 6 derniers mois
                days_ago = random.randint(0, 180)
                created_at = timezone.now() - datetime.timedelta(days=days_ago)
                
                matching = MatchingResult.objects.create(
                    consultant=consultant,
                    appel_offre=appel,
                    score=score,
                    is_validated=True,
                )
                
                # Mise à jour manuelle de la date de création
                matching.created_at = created_at
                matching.save(update_fields=['created_at'])
                
                created_count += 1
                
        self.stdout.write(f'{created_count} nouveaux matchings validés créés')

    def create_document_categories(self):
        """Crée des catégories de documents pour la GED"""
        categories = [
            "Contrats", "CV", "Rapports", "Factures", 
            "Documentation technique", "Présentations"
        ]
        
        created_count = 0
        for cat_name in categories:
            if not DocumentCategory.objects.filter(name=cat_name).exists():
                DocumentCategory.objects.create(name=cat_name)
                created_count += 1
                
        self.stdout.write(f'{created_count} catégories de documents créées')

    def create_documents(self):
        """Crée des documents fictifs pour la GED"""
        # Vérifier combien de documents existent déjà
        existing_docs = DocumentGED.objects.count()
        
        # Si on a déjà au moins 120 documents, on ne fait rien
        if existing_docs >= 120:
            self.stdout.write(f'Il y a déjà {existing_docs} documents. Aucun ajout nécessaire.')
            return
            
        # Sinon, on génère les documents manquants pour atteindre 124
        to_generate = 124 - existing_docs
        self.stdout.write(f'Génération de {to_generate} nouveaux documents...')
        
        # Récupérer les catégories et les appels d'offres
        categories = list(DocumentCategory.objects.all())
        appels = list(AppelOffre.objects.all())
        
        if not categories:
            self.stdout.write(self.style.WARNING('Pas de catégories pour générer des documents'))
            return
            
        # Types de documents
        doc_types = ["CV", "CONTRAT", "RAPPORT", "FACTURE", "AUTRE"]
        folder_types = ["CONSULTANT", "PROJET", "ADMINISTRATIF", "FINANCIER"]
        
        # Générer les documents manquants
        created_count = 0
        for i in range(to_generate):
            title = f"Document_{i+1}"
            description = f"Description du document {i+1}"
            
            doc = DocumentGED.objects.create(
                title=title,
                description=description,
                document_type=random.choice(doc_types),
                folder_type=random.choice(folder_types),
                category=random.choice(categories) if categories else None,
                appel_offre=random.choice(appels) if appels and random.random() > 0.5 else None,
                tags=f"tag1,tag2,tag{i+1}"
            )
            
            # Date d'upload aléatoire dans les 6 derniers mois
            days_ago = random.randint(0, 180)
            upload_date = timezone.now() - datetime.timedelta(days=days_ago)
            doc.upload_date = upload_date
            doc.save(update_fields=['upload_date'])
            
            created_count += 1
            
        self.stdout.write(f'{created_count} nouveaux documents créés')

    def create_sample_appels_offres(self):
        """Crée des appels d'offres échantillons si aucun n'existe"""
        self.stdout.write('Création d\'appels d\'offres échantillons...')
        
        # Liste des domaines disponibles
        domains = ['DIGITAL', 'FINANCE', 'ENERGIE', 'INDUSTRIE']
        
        # Noms des projets et clients fictifs
        projets = [
            "Refonte SI", "Migration Cloud", "Développement App Mobile",
            "Audit Sécurité", "Implémentation ERP", "Transformation Digitale",
            "Analyse de données", "Développement Backend", "Intelligence Artificielle"
        ]
        
        clients = [
            "TechCorp", "FinancePro", "EnergySolutions", "IndustrieGroup",
            "BanqueDigitale", "AssurTech", "PharmaLab", "LogisticExpress"
        ]
        
        # Créer 10 appels d'offres
        created_count = 0
        for i in range(10):
            # Date de début aléatoire dans les 6 derniers mois
            days_ago_start = random.randint(30, 180)
            date_debut = timezone.now().date() - datetime.timedelta(days=days_ago_start)
            
            # Date de fin entre 30 et 180 jours après la date de début
            project_duration = random.randint(30, 180)
            date_fin = date_debut + datetime.timedelta(days=project_duration)
            
            # Statut basé sur les dates
            if date_fin < timezone.now().date():
                statut = "Termine"
            else:
                statut = "En_cours"
            
            # Création de l'appel d'offre
            AppelOffre.objects.create(
                nom_projet=random.choice(projets) + f" {i+1}",
                description=f"Description du projet {i+1} avec des détails techniques et fonctionnels",
                client=random.choice(clients),
                date_debut=date_debut,
                date_fin=date_fin,
                statut=statut,
                domaine_principal=random.choice(domains)
            )
            created_count += 1
            
        self.stdout.write(f'{created_count} appels d\'offres créés')

    def create_sample_consultants(self):
        """Crée des consultants échantillons si aucun n'existe"""
        self.stdout.write('Création de consultants échantillons...')
        
        # Noms et prénoms fictifs
        noms = ["Dupont", "Martin", "Dubois", "Thomas", "Robert", "Richard", "Petit", "Durand"]
        prenoms = ["Jean", "Marie", "Pierre", "Sophie", "Michel", "Isabelle", "David", "Anne"]
        
        # Domaines de spécialité
        domaines = ['DIGITAL', 'FINANCE', 'ENERGIE', 'INDUSTRIE']
        
        # Créer 15 consultants
        created_count = 0
        for i in range(15):
            # Créer d'abord un utilisateur
            email = f"consultant{i+1}@example.com"
            user = User.objects.create_user(
                username=email,
                email=email,
                password="password123",
                nom=random.choice(noms),
                role='CONSULTANT'
            )
            
            # Date de création aléatoire dans les 6 derniers mois
            days_ago = random.randint(0, 180)
            created_at = timezone.now() - datetime.timedelta(days=days_ago)
            
            # Dates de disponibilité
            today = timezone.now().date()
            date_debut_dispo = today - datetime.timedelta(days=random.randint(0, 30))
            date_fin_dispo = today + datetime.timedelta(days=random.randint(30, 180))
            
            # Création du consultant
            consultant = Consultant.objects.create(
                user=user,
                nom=user.nom,
                prenom=random.choice(prenoms),
                email=email,
                telephone=f"06{random.randint(10000000, 99999999)}",
                pays="France",
                ville=random.choice(["Paris", "Lyon", "Marseille", "Bordeaux", "Lille"]),
                date_debut_dispo=date_debut_dispo,
                date_fin_dispo=date_fin_dispo,
                domaine_principal=random.choice(domaines),
                specialite=random.choice(domaines),
                expertise=random.choice(["Débutant", "Intermédiaire", "Expert"]),
                status=random.choice(["Actif", "Inactif"]),
                is_validated=True
            )
            
            # Mise à jour manuelle de la date de création
            consultant.created_at = created_at
            consultant.save(update_fields=['created_at'])
            
            # Génération de compétences pour ce consultant
            self.generate_competences_for_consultant(consultant)
            
            created_count += 1
            
        self.stdout.write(f'{created_count} consultants créés')

    def generate_competences_for_consultant(self, consultant):
        """Génère des compétences pour un consultant en fonction de son domaine"""
        # Compétences par domaine
        competences_by_domain = {
            'DIGITAL': [
                "Python", "JavaScript", "React", "Angular", "Node.js", "Django", 
                "AWS", "Azure", "DevOps", "Docker", "Kubernetes", "CI/CD", 
                "Machine Learning", "Data Science", "Big Data", "Hadoop"
            ],
            'FINANCE': [
                "Analyse financière", "Comptabilité", "Audit", "Contrôle de gestion",
                "Finance d'entreprise", "Gestion de trésorerie", "Fiscalité", 
                "SAP Finance", "Oracle Financials", "Excel avancé", "Power BI"
            ],
            'ENERGIE': [
                "Énergies renouvelables", "Réseaux électriques", "Smart Grid",
                "Efficacité énergétique", "Transition énergétique", "Gestion de projet énergétique",
                "Audit énergétique", "Photovoltaïque", "Éolien", "Biomasse"
            ],
            'INDUSTRIE': [
                "Lean Manufacturing", "Six Sigma", "Gestion de production",
                "Supply Chain", "Logistique", "Maintenance industrielle",
                "Automatisation", "Robotique", "IoT industriel", "SAP MM"
            ]
        }
        
        # Compétences générales qui peuvent s'appliquer à tous les domaines
        general_skills = [
            "Gestion de projet", "Communication", "Travail d'équipe",
            "Anglais professionnel", "Microsoft Office", "Analyse de données",
            "Management d'équipe", "Résolution de problèmes"
        ]
        
        # Récupérer le domaine du consultant
        domain = consultant.domaine_principal or 'DIGITAL'
        
        # Déterminer le nombre de compétences à générer selon le niveau d'expertise
        if consultant.expertise == "Expert":
            num_skills = random.randint(10, 15)
        elif consultant.expertise == "Intermédiaire":
            num_skills = random.randint(5, 9)
        else:  # Débutant
            num_skills = random.randint(2, 4)
        
        # Sélectionner des compétences spécifiques au domaine
        domain_specific_skills = competences_by_domain.get(domain, competences_by_domain['DIGITAL'])
        selected_domain_skills = random.sample(domain_specific_skills, min(len(domain_specific_skills), num_skills - 2))
        
        # Ajouter quelques compétences générales
        selected_general_skills = random.sample(general_skills, min(len(general_skills), 2))
        
        # Combiner et mélanger les compétences
        all_skills = selected_domain_skills + selected_general_skills
        random.shuffle(all_skills)
        
        # Créer les compétences pour le consultant
        for skill in all_skills:
            # Niveau de compétence entre 1 et 5
            if consultant.expertise == "Expert":
                niveau = random.randint(3, 5)
            elif consultant.expertise == "Intermédiaire":
                niveau = random.randint(2, 4)
            else:  # Débutant
                niveau = random.randint(1, 3)
                
            # Créer la compétence
            if not Competence.objects.filter(consultant=consultant, nom_competence=skill).exists():
                Competence.objects.create(
                    consultant=consultant,
                    nom_competence=skill,
                    niveau=niveau
                )