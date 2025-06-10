# models.py - Version corrigée pour la GED avec gestion d'erreurs

from django.db import models
from django.contrib.auth.models import AbstractUser
from django.conf import settings
import logging
import os

# Configurer le logging
logger = logging.getLogger(__name__)


class User(AbstractUser):
    ROLES = (
        ('ADMIN', 'Administrateur'),
        ('CONSULTANT', 'Consultant'),
    )
    role = models.CharField(max_length=20, choices=ROLES, default='CONSULTANT')
    nom = models.CharField(max_length=100)

    def __str__(self):
        return f"{self.nom} ({self.role})"


class Consultant(models.Model):
    user = models.OneToOneField(settings.AUTH_USER_MODEL, on_delete=models.CASCADE, related_name="consultant_profile")
    nom = models.CharField(max_length=50)
    prenom = models.CharField(max_length=50)
    email = models.EmailField(max_length=255)
    telephone = models.CharField(max_length=20)
    pays = models.CharField(max_length=50)
    ville = models.CharField(max_length=50)
    date_debut_dispo = models.DateField()
    date_fin_dispo = models.DateField()
    cv = models.FileField(upload_to="cv/", null=True, blank=True)
    expertise = models.CharField(max_length=50, default="Débutant")
    is_validated = models.BooleanField(default=False, verbose_name="Validé par l'admin")

    # Choix pour le domaine principal
    SPECIALITES_CHOICES = [
        ('DIGITAL', 'Digital et Télécoms'),
        ('FINANCE', 'Secteur bancaire et financier'),
        ('ENERGIE', 'Transition énergétique'),
        ('INDUSTRIE', 'Industrie et Mines'),
    ]

    domaine_principal = models.CharField(
        max_length=20,
        choices=SPECIALITES_CHOICES,
        default='DIGITAL',
        verbose_name="Domaine principal"
    )

    specialite = models.CharField(max_length=100, default="", verbose_name="Sous-domaine")
    status = models.CharField(max_length=20, default="Actif")
    created_at = models.DateTimeField(auto_now_add=True)

    def __str__(self):
        return f"{self.nom} {self.prenom}"

    def save(self, *args, **kwargs):
        if self.user and not self.email:
            self.email = self.user.email
        super().save(*args, **kwargs)


class AppelOffre(models.Model):
    nom_projet = models.CharField(max_length=255)
    client = models.CharField(max_length=255)
    description = models.TextField()
    budget = models.DecimalField(max_digits=12, decimal_places=2)
    date_debut = models.DateField()
    date_fin = models.DateField()

    STATUT_CHOICES = [
        ('A_venir', 'À venir'),
        ('En_cours', 'En cours'),
        ('Termine', 'Terminé'),
    ]
    statut = models.CharField(max_length=20, choices=STATUT_CHOICES)

    def __str__(self):
        return f"{self.nom_projet} - {self.client}"


class Competence(models.Model):
    consultant = models.ForeignKey(Consultant, on_delete=models.CASCADE, related_name="competences")
    nom_competence = models.CharField(max_length=191)
    niveau = models.IntegerField()

    def __str__(self):
        return f"{self.nom_competence} ({self.niveau})"

    class Meta:
        unique_together = ('consultant', 'nom_competence')


class MatchingResult(models.Model):
    appel_offre = models.ForeignKey(AppelOffre, on_delete=models.CASCADE, related_name="matchings")
    consultant = models.ForeignKey(Consultant, on_delete=models.CASCADE, related_name="matchings")
    score = models.DecimalField(max_digits=5, decimal_places=2)
    is_validated = models.BooleanField(default=False)
    created_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        unique_together = ('appel_offre', 'consultant')
        ordering = ['-score']

    def __str__(self):
        return f"Match: {self.consultant.nom} - {self.appel_offre.nom_projet} ({self.score}%)"

    def update_validation_status(self, status, save=True):
        self.is_validated = status
        if save:
            self.save()
        action = "validé" if status else "invalidé"
        logger.info(
            f"Matching {self.id} {action} pour le consultant {self.consultant.id} et l'appel d'offre {self.appel_offre.id}")
        return self.is_validated


class CriteresEvaluation(models.Model):
    appel_offre = models.ForeignKey(AppelOffre, on_delete=models.CASCADE, related_name="criteres")
    nom_critere = models.CharField(max_length=255)
    poids = models.DecimalField(max_digits=5, decimal_places=2)

    def __str__(self):
        return self.nom_critere


class Mission(models.Model):
    appel_offre = models.ForeignKey(AppelOffre, on_delete=models.CASCADE, related_name="missions")
    titre = models.CharField(max_length=255)
    date_debut = models.DateField()
    date_fin = models.DateField()
    statut = models.CharField(max_length=20)

    def __str__(self):
        return self.titre


class ParticipationMission(models.Model):
    mission = models.ForeignKey(Mission, on_delete=models.CASCADE, related_name="participants")
    consultant = models.ForeignKey(Consultant, on_delete=models.CASCADE, related_name="missions")
    role = models.CharField(max_length=50)
    evaluation = models.IntegerField()

    def __str__(self):
        return f"{self.consultant} - {self.role}"


class Document(models.Model):
    consultant = models.ForeignKey(Consultant, on_delete=models.CASCADE, related_name="documents")
    type_document = models.CharField(max_length=20)
    fichier = models.FileField(upload_to="documents/", null=True, blank=True)
    date_upload = models.DateTimeField(auto_now_add=True)

    def __str__(self):
        return self.fichier.name


class Projet(models.Model):
    nom = models.CharField(max_length=255)
    responsable = models.CharField(max_length=100)

    def __str__(self):
        return self.nom


class SuiviProjet(models.Model):
    projet = models.ForeignKey(Projet, on_delete=models.CASCADE, related_name="suivi")
    mission = models.ForeignKey(Mission, on_delete=models.CASCADE, related_name="suivi_projet")
    avancement = models.DecimalField(max_digits=5, decimal_places=2)
    date_maj = models.DateTimeField(auto_now=True)

    def __str__(self):
        return f"Suivi {self.projet} - {self.avancement}%"


class Notification(models.Model):
    """Modèle pour stocker les notifications dans l'application"""
    NOTIFICATION_TYPES = (
        ('MATCH_VALID', 'Validation de matching'),
        ('NEW_OFFER', 'Nouvelle offre'),
        ('SYSTEM', 'Notification système'),
        ('MATCH_SUGGEST', 'Suggestion de matching'),
        ('ADMIN_INFO', 'Information administrative'),
    )
    
    consultant = models.ForeignKey(Consultant, on_delete=models.CASCADE, related_name="notifications")
    type = models.CharField(max_length=20, choices=NOTIFICATION_TYPES, default='SYSTEM')
    title = models.CharField(max_length=255)
    content = models.TextField()
    is_read = models.BooleanField(default=False)
    created_at = models.DateTimeField(auto_now_add=True)
    related_appel = models.ForeignKey(AppelOffre, on_delete=models.SET_NULL, null=True, blank=True, related_name="notifications")
    related_match = models.ForeignKey(MatchingResult, on_delete=models.SET_NULL, null=True, blank=True)
    
    class Meta:
        ordering = ['-created_at']

    def __str__(self):
        return f"{self.title} ({self.consultant.nom} {self.consultant.prenom})"


class DocumentCategory(models.Model):
    name = models.CharField(max_length=100)
    description = models.TextField(blank=True, null=True)

    def __str__(self):
        return self.name

    class Meta:
        verbose_name_plural = "Document Categories"


class DocumentGED(models.Model):
    # Types de documents
    DOCUMENT_TYPES = (
        ('APPEL_OFFRE', 'Document d\'appel d\'offre'),
        ('ETUDE', 'Étude'),
        ('RAPPORT', 'Rapport de mission'),
        ('CV', 'CV consultant'),
        ('METHODOLOGIE', 'Méthodologie'),
        ('CONTRAT', 'Contrat'),
        ('AUTRE', 'Autre'),
    )

    # Types de dossiers différenciés par entité
    FOLDER_TYPES = (
        # Dossiers pour Appels d'Offres (A.O)
        ('AO_ADMIN', 'Dossier administratif (A.O)'),
        ('AO_TECHNIQUE', 'Dossier technique (A.O)'),
        ('AO_FINANCE', 'Dossier financier (A.O)'),
        
        # Dossiers pour AMI (Appel à Manifestation d'Intérêt)
        ('AMI_CONTEXTE', 'Contexte (A.M.I)'),
        ('AMI_OUTREACH', 'Outreach (A.M.I)'),
        
        # Dossier général
        ('GENERAL', 'Général'),
    )

    def get_upload_path(instance, filename):
        """Méthode pour gérer le chemin de stockage dynamique basé sur le type de dossier"""
        base_path = "ged/documents/"

        # Si document lié à un appel d'offre
        if instance.appel_offre:
            ao_id = instance.appel_offre.id
            
            # Mapping des types de dossiers vers les noms de dossiers
            folder_mapping = {
                'AO_ADMIN': 'admin',
                'AO_TECHNIQUE': 'technique', 
                'AO_FINANCE': 'finance',
                'AMI_CONTEXTE': 'contexte',
                'AMI_OUTREACH': 'outreach',
                'GENERAL': 'general'
            }
            
            folder = folder_mapping.get(instance.folder_type, 'general')
            return f"{base_path}appels_offres/{ao_id}/{folder}/{filename}"

        # Si document lié à une mission
        elif instance.mission:
            mission_id = instance.mission.id
            folder_mapping = {
                'AO_ADMIN': 'admin',
                'AO_TECHNIQUE': 'technique', 
                'AO_FINANCE': 'finance',
                'AMI_CONTEXTE': 'contexte',
                'AMI_OUTREACH': 'outreach',
                'GENERAL': 'general'
            }
            folder = folder_mapping.get(instance.folder_type, 'general')
            return f"{base_path}missions/{mission_id}/{folder}/{filename}"

        # Si document lié à un consultant (CV, etc.)
        elif instance.consultant:
            consultant_id = instance.consultant.id
            return f"{base_path}consultants/{consultant_id}/{filename}"

        # Fallback - documents généraux
        return f"{base_path}general/{filename}"

    title = models.CharField(max_length=255)
    description = models.TextField(blank=True, null=True)
    file = models.FileField(upload_to=get_upload_path)
    file_type = models.CharField(max_length=10, blank=True, null=True)
    document_type = models.CharField(max_length=20, choices=DOCUMENT_TYPES)
    folder_type = models.CharField(max_length=20, choices=FOLDER_TYPES, default='GENERAL')
    category = models.ForeignKey(DocumentCategory, on_delete=models.SET_NULL, null=True, blank=True,
                                 related_name="documents")

    consultant = models.ForeignKey(Consultant, on_delete=models.SET_NULL, null=True, blank=True,
                                   related_name="ged_documents")
    appel_offre = models.ForeignKey(AppelOffre, on_delete=models.SET_NULL, null=True, blank=True,
                                    related_name="ged_documents")
    mission = models.ForeignKey(Mission, on_delete=models.SET_NULL, null=True, blank=True, related_name="ged_documents")
    projet = models.ForeignKey(Projet, on_delete=models.SET_NULL, null=True, blank=True, related_name="ged_documents")

    version = models.CharField(max_length=20, blank=True, null=True)
    tags = models.CharField(max_length=255, blank=True, null=True)
    created_by = models.ForeignKey(User, on_delete=models.SET_NULL, null=True, related_name="created_documents")
    upload_date = models.DateTimeField(auto_now_add=True)
    modified_date = models.DateTimeField(auto_now=True)
    is_public = models.BooleanField(default=False)
    
    # Nouveau champ pour indiquer si le fichier existe physiquement
    file_exists = models.BooleanField(default=True)
    # Champ pour stocker la dernière vérification du fichier
    last_file_check = models.DateTimeField(null=True, blank=True)

    def __str__(self):
        return self.title

    def file_size(self):
        """Méthode améliorée pour obtenir la taille du fichier avec gestion d'erreurs"""
        try:
            if self.file and self.file.name:
                # Vérifier si le fichier existe physiquement
                file_path = self.file.path
                if os.path.exists(file_path):
                    size_bytes = self.file.size
                    self.file_exists = True
                    self.save(update_fields=['file_exists'])
                    
                    if size_bytes < 1024 * 1024:
                        return f"{size_bytes / 1024:.1f} Ko"
                    else:
                        return f"{size_bytes / (1024 * 1024):.1f} Mo"
                else:
                    # Marquer le fichier comme manquant
                    logger.warning(f"Fichier manquant pour le document {self.id}: {file_path}")
                    self.file_exists = False
                    from django.utils import timezone
                    self.last_file_check = timezone.now()
                    self.save(update_fields=['file_exists', 'last_file_check'])
                    return "Fichier manquant"
            else:
                return "Aucun fichier"
        except Exception as e:
            logger.error(f"Erreur lors du calcul de la taille du fichier pour le document {self.id}: {str(e)}")
            self.file_exists = False
            from django.utils import timezone
            self.last_file_check = timezone.now()
            self.save(update_fields=['file_exists', 'last_file_check'])
            return "Erreur"

    def get_file_extension(self):
        """Obtenir l'extension du fichier"""
        try:
            if self.file and self.file.name:
                filename = self.file.name
                return filename.split('.')[-1].lower() if '.' in filename else ''
            return ''
        except Exception:
            return ''

    def save(self, *args, **kwargs):
        """Méthode save améliorée"""
        # Définir le type de fichier automatiquement si non défini
        if not self.file_type and self.file:
            self.file_type = self.get_file_extension()
        
        # Vérifier l'existence du fichier lors de la sauvegarde
        if self.file and self.file.name:
            try:
                file_path = self.file.path
                self.file_exists = os.path.exists(file_path)
            except Exception:
                self.file_exists = False
        
        super().save(*args, **kwargs)

    def check_file_exists(self):
        """Méthode pour vérifier explicitement si le fichier existe"""
        try:
            if self.file and self.file.name:
                file_path = self.file.path
                exists = os.path.exists(file_path)
                
                if self.file_exists != exists:
                    self.file_exists = exists
                    from django.utils import timezone
                    self.last_file_check = timezone.now()
                    self.save(update_fields=['file_exists', 'last_file_check'])
                
                return exists
            return False
        except Exception as e:
            logger.error(f"Erreur lors de la vérification du fichier pour le document {self.id}: {str(e)}")
            return False

    @classmethod
    def get_folder_types_for_ao(cls):
        """Retourne les types de dossiers pour les appels d'offres"""
        return [
            ('AO_ADMIN', 'Dossier administratif'),
            ('AO_TECHNIQUE', 'Dossier technique'),
            ('AO_FINANCE', 'Dossier financier'),
        ]
    
    @classmethod
    def get_folder_types_for_ami(cls):
        """Retourne les types de dossiers pour les AMI"""
        return [
            ('AMI_CONTEXTE', 'Contexte'),
            ('AMI_OUTREACH', 'Outreach'),
        ]
    
    @classmethod
    def get_all_folder_types(cls):
        """Retourne tous les types de dossiers"""
        return cls.FOLDER_TYPES


class DocumentVersion(models.Model):
    document = models.ForeignKey(DocumentGED, on_delete=models.CASCADE, related_name="versions")
    version_number = models.CharField(max_length=20)
    file = models.FileField(upload_to="ged/versions/")
    comments = models.TextField(blank=True, null=True)
    created_by = models.ForeignKey(User, on_delete=models.SET_NULL, null=True)
    created_at = models.DateTimeField(auto_now_add=True)

    def __str__(self):
        return f"{self.document.title} - v{self.version_number}"


class DocumentAccess(models.Model):
    document = models.ForeignKey(DocumentGED, on_delete=models.CASCADE, related_name="accesses")
    user = models.ForeignKey(User, on_delete=models.CASCADE)
    access_time = models.DateTimeField(auto_now_add=True)
    action = models.CharField(max_length=20, choices=(
        ('VIEW', 'Consultation'),
        ('DOWNLOAD', 'Téléchargement'),
        ('EDIT', 'Modification'),
        ('DELETE', 'Suppression'),
    ))

    def __str__(self):
        return f"{self.user.username} - {self.action} - {self.document.title}"