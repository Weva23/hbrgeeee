# models.py - Version corrigée avec tous les champs nécessaires

from django.db import models
from django.contrib.auth.models import AbstractUser
from django.utils import timezone
import os
import logging

logger = logging.getLogger(__name__)

class User(AbstractUser):
    ROLE_CHOICES = [
        ('ADMIN', 'Administrateur'),
        ('CONSULTANT', 'Consultant'),
    ]
    
    role = models.CharField(max_length=20, choices=ROLE_CHOICES, default='CONSULTANT')
    nom = models.CharField(max_length=100, blank=True, null=True)
    
    created_at = models.DateTimeField(default=timezone.now)
    updated_at = models.DateTimeField(auto_now=True)

    def __str__(self):
        return f"{self.username} ({self.role})"


class Consultant(models.Model):
    SPECIALITES_CHOICES = [
        ('DIGITAL', 'Digital et Télécoms'),
        ('FINANCE', 'Secteur bancaire et financier'),
        ('ENERGIE', 'Transition énergétique'),
        ('INDUSTRIE', 'Industrie et Mines'),
    ]
    
    EXPERTISE_CHOICES = [
        ('Débutant', 'Débutant (0-2 ans)'),
        ('Intermédiaire', 'Intermédiaire (3-7 ans)'),
        ('Expert', 'Expert (8+ ans)'),
        ('Senior', 'Senior Expert (15+ ans)')
    ]
    
    STATUT_CHOICES = [
        ('Actif', 'Actif'),
        ('Inactif', 'Inactif'),
        ('En_attente', 'En attente'),
        ('Suspendu', 'Suspendu'),
    ]
    
    # Relation avec User
    user = models.OneToOneField(User, on_delete=models.CASCADE, related_name='consultant_profile', null=True, blank=True)
    
    # Informations personnelles
    nom = models.CharField(max_length=100)
    prenom = models.CharField(max_length=100)
    email = models.EmailField(max_length=191, unique=True)
    telephone = models.CharField(max_length=20)
    pays = models.CharField(max_length=100)
    ville = models.CharField(max_length=100, blank=True, null=True)
    
    # Disponibilité
    date_debut_dispo = models.DateField()
    date_fin_dispo = models.DateField()
    
    # Champs pour compatibilité avec le frontend (noms alternatifs)
    startAvailability = models.DateField(null=True, blank=True)  # Alias pour date_debut_dispo
    endAvailability = models.DateField(null=True, blank=True)   # Alias pour date_fin_dispo
    firstName = models.CharField(max_length=100, blank=True, null=True)  # Alias pour prenom
    lastName = models.CharField(max_length=100, blank=True, null=True)   # Alias pour nom
    phone = models.CharField(max_length=20, blank=True, null=True)       # Alias pour telephone
    country = models.CharField(max_length=100, blank=True, null=True)    # Alias pour pays
    city = models.CharField(max_length=100, blank=True, null=True)       # Alias pour ville
    
    # Expertises et compétences
    domaine_principal = models.CharField(max_length=20, choices=SPECIALITES_CHOICES, default='DIGITAL')
    specialite = models.CharField(max_length=255, blank=True, null=True)
    expertise = models.CharField(max_length=20, choices=EXPERTISE_CHOICES, default='Débutant')
    skills = models.TextField(blank=True, null=True, help_text="Compétences séparées par des virgules")
    
    # Champs d'expertise détaillés
    annees_experience = models.IntegerField(default=0, help_text="Années d'expérience professionnelle totale")
    formation_niveau = models.CharField(max_length=50, choices=[
        ('BAC', 'Baccalauréat'),
        ('BAC+2', 'BTS/DUT/DEUG'),
        ('BAC+3', 'Licence/Bachelor'),
        ('BAC+4', 'Maîtrise'),
        ('BAC+5', 'Master/Ingénieur'),
        ('BAC+8', 'Doctorat/PhD'),
    ], default='BAC+3')
    
    certifications_count = models.IntegerField(default=0, help_text="Nombre de certifications professionnelles")
    projets_realises = models.IntegerField(default=0, help_text="Nombre de projets significatifs réalisés")
    leadership_experience = models.BooleanField(default=False, help_text="Expérience en leadership/management")
    international_experience = models.BooleanField(default=False, help_text="Expérience internationale")
    expertise_score = models.IntegerField(null=True, blank=True, help_text="Score d'expertise calculé (0-100)")
    
    # Statut et validation
    statut = models.CharField(max_length=20, choices=STATUT_CHOICES, default='En_attente')
    is_validated = models.BooleanField(default=False, help_text="Consultant validé par l'admin")
    
    # Fichiers
    cv = models.FileField(upload_to='consultants/cvs/', null=True, blank=True)
    cvFilename = models.CharField(max_length=255, blank=True, null=True)  # Nom original du CV
    standardizedCvFilename = models.CharField(max_length=255, blank=True, null=True)  # CV Richat
    photo = models.ImageField(upload_to='consultants/photos/', null=True, blank=True)
    profileImage = models.CharField(max_length=500, blank=True, null=True)  # URL de l'image de profil
    
    # Métadonnées
    created_at = models.DateTimeField(default=timezone.now)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        ordering = ['-created_at']
        verbose_name = "Consultant"
        verbose_name_plural = "Consultants"
        indexes = [
            models.Index(fields=['email']),
            models.Index(fields=['statut']),
            models.Index(fields=['is_validated']),
            models.Index(fields=['domaine_principal']),
            models.Index(fields=['expertise']),
        ]

    def __str__(self):
        return f"{self.prenom} {self.nom} ({self.email})"

    def save(self, *args, **kwargs):
        # Synchroniser les champs alternatifs avec les champs principaux
        if not self.firstName and self.prenom:
            self.firstName = self.prenom
        if not self.lastName and self.nom:
            self.lastName = self.nom
        if not self.phone and self.telephone:
            self.phone = self.telephone
        if not self.country and self.pays:
            self.country = self.pays
        if not self.city and self.ville:
            self.city = self.ville
        if not self.startAvailability and self.date_debut_dispo:
            self.startAvailability = self.date_debut_dispo
        if not self.endAvailability and self.date_fin_dispo:
            self.endAvailability = self.date_fin_dispo
            
        # Synchroniser dans l'autre sens aussi
        if self.firstName and not self.prenom:
            self.prenom = self.firstName
        if self.lastName and not self.nom:
            self.nom = self.lastName
        if self.phone and not self.telephone:
            self.telephone = self.phone
        if self.country and not self.pays:
            self.pays = self.country
        if self.city and not self.ville:
            self.ville = self.city
        if self.startAvailability and not self.date_debut_dispo:
            self.date_debut_dispo = self.startAvailability
        if self.endAvailability and not self.date_fin_dispo:
            self.date_fin_dispo = self.endAvailability

        # Sauvegarder le nom du fichier CV si un CV est uploadé
        if self.cv and not self.cvFilename:
            self.cvFilename = self.cv.name.split('/')[-1]

        # Auto-calcul du niveau d'expertise lors de la sauvegarde
        if self.pk:  # Seulement pour les objets existants
            old_expertise = self.expertise
            calculated_expertise = self.calculate_expertise_level()
            
            # Mise à jour automatique si différent
            if old_expertise != calculated_expertise:
                self.expertise = calculated_expertise
                
        # Calculer le score d'expertise
        if not self.expertise_score:
            self.expertise_score = self._calculate_total_expertise_score()
        
        super().save(*args, **kwargs)

    def calculate_expertise_level(self):
        """
        Calcule le niveau d'expertise basé sur plusieurs critères
        selon les standards professionnels internationaux
        """
        score = 0
        
        # 1. Critère principal : Années d'expérience (40% du score)
        experience_score = self._calculate_experience_score()
        score += experience_score * 0.4
        
        # 2. Niveau de formation (25% du score)
        education_score = self._calculate_education_score()
        score += education_score * 0.25
        
        # 3. Compétences et certifications (20% du score)
        skills_score = self._calculate_skills_score()
        score += skills_score * 0.2
        
        # 4. Facteurs qualitatifs (15% du score)
        qualitative_score = self._calculate_qualitative_score()
        score += qualitative_score * 0.15
        
        # Convertir le score en niveau d'expertise
        return self._score_to_expertise_level(score)
    
    def _calculate_experience_score(self):
        """Score basé sur les années d'expérience"""
        if self.annees_experience >= 15:
            return 100  # Senior Expert
        elif self.annees_experience >= 8:
            return 85   # Expert
        elif self.annees_experience >= 3:
            return 60   # Intermédiaire
        elif self.annees_experience >= 1:
            return 35   # Débutant avec expérience
        else:
            return 10   # Débutant
    
    def _calculate_education_score(self):
        """Score basé sur le niveau de formation"""
        education_mapping = {
            'BAC': 20,
            'BAC+2': 35,
            'BAC+3': 50,
            'BAC+4': 65,
            'BAC+5': 80,
            'BAC+8': 100
        }
        return education_mapping.get(self.formation_niveau, 50)
    
    def _calculate_skills_score(self):
        """Score basé sur les compétences et certifications"""
        # Nombre de compétences avec pondération par niveau
        try:
            competences = Competence.objects.filter(consultant=self)
            
            # Score basé sur la qualité des compétences (niveau moyen)
            if competences.exists():
                avg_skill_level = competences.aggregate(
                    avg_level=models.Avg('niveau')
                )['avg_level'] or 1
                
                competence_score = min(100, (avg_skill_level / 5) * 80)  # Max 80 points
            else:
                competence_score = 0
        except:
            competence_score = 0
        
        # Bonus pour les certifications (max 20 points)
        certification_bonus = min(20, self.certifications_count * 5)
        
        return competence_score + certification_bonus
    
    def _calculate_qualitative_score(self):
        """Score basé sur les facteurs qualitatifs"""
        score = 0
        
        # Bonus pour les projets réalisés
        if self.projets_realises >= 10:
            score += 40
        elif self.projets_realises >= 5:
            score += 25
        elif self.projets_realises >= 2:
            score += 15
        
        # Bonus pour l'expérience en leadership
        if self.leadership_experience:
            score += 30
        
        # Bonus pour l'expérience internationale
        if self.international_experience:
            score += 30
        
        return min(100, score)
    
    def _calculate_total_expertise_score(self):
        """Calcule le score total d'expertise"""
        experience_score = self._calculate_experience_score()
        education_score = self._calculate_education_score()
        skills_score = self._calculate_skills_score()
        qualitative_score = self._calculate_qualitative_score()
        
        total_score = (experience_score * 0.4 + 
                      education_score * 0.25 + 
                      skills_score * 0.2 + 
                      qualitative_score * 0.15)
        
        return round(total_score, 1)
    
    def _score_to_expertise_level(self, score):
        """Convertit le score numérique en niveau d'expertise"""
        if score >= 85:
            return 'Senior'
        elif score >= 70:
            return 'Expert'
        elif score >= 45:
            return 'Intermédiaire'
        else:
            return 'Débutant'
    
    def update_expertise_level(self):
        """Met à jour automatiquement le niveau d'expertise"""
        new_level = self.calculate_expertise_level()
        new_score = self._calculate_total_expertise_score()
        
        changed = False
        if self.expertise != new_level:
            old_level = self.expertise
            self.expertise = new_level
            changed = True
            logger.info(f"Expertise mise à jour pour {self.nom} {self.prenom}: {old_level} → {new_level}")
        
        if self.expertise_score != new_score:
            self.expertise_score = new_score
            changed = True
            
        if changed:
            self.save(update_fields=['expertise', 'expertise_score'])
            
        return changed
    
    def get_expertise_details(self):
        """Retourne les détails du calcul d'expertise pour transparence"""
        experience_score = self._calculate_experience_score()
        education_score = self._calculate_education_score()
        skills_score = self._calculate_skills_score()
        qualitative_score = self._calculate_qualitative_score()
        
        total_score = (experience_score * 0.4 + 
                      education_score * 0.25 + 
                      skills_score * 0.2 + 
                      qualitative_score * 0.15)
        
        return {
            'niveau_calcule': self._score_to_expertise_level(total_score),
            'score_total': round(total_score, 1),
            'details': {
                'experience': {
                    'score': experience_score,
                    'poids': '40%',
                    'contribution': round(experience_score * 0.4, 1)
                },
                'formation': {
                    'score': education_score,
                    'poids': '25%',
                    'contribution': round(education_score * 0.25, 1)
                },
                'competences': {
                    'score': skills_score,
                    'poids': '20%',
                    'contribution': round(skills_score * 0.2, 1)
                },
                'qualitatif': {
                    'score': qualitative_score,
                    'poids': '15%',
                    'contribution': round(qualitative_score * 0.15, 1)
                }
            },
            'recommandations': self._get_improvement_recommendations()
        }
    
    def _get_improvement_recommendations(self):
        """Suggestions pour améliorer le niveau d'expertise"""
        recommendations = []
        
        if self.annees_experience < 3:
            recommendations.append("Acquérir plus d'expérience professionnelle")
        
        if self.formation_niveau in ['BAC', 'BAC+2']:
            recommendations.append("Envisager une formation supérieure")
        
        if self.certifications_count == 0:
            recommendations.append("Obtenir des certifications professionnelles")
        
        if self.projets_realises < 5:
            recommendations.append("Participer à plus de projets significatifs")
        
        if not self.leadership_experience:
            recommendations.append("Développer une expérience en leadership")
        
        return recommendations

    @property
    def full_name(self):
        """Retourne le nom complet"""
        return f"{self.prenom} {self.nom}"
    
    @property
    def is_available(self):
        """Vérifie si le consultant est disponible aujourd'hui"""
        today = timezone.now().date()
        return (self.date_debut_dispo <= today <= self.date_fin_dispo and 
                self.statut == 'Actif' and 
                self.is_validated)


class AppelOffre(models.Model):
    STATUT_CHOICES = [
        ('A_venir', 'À venir'),
        ('En_cours', 'En cours'),
        ('Termine', 'Terminé'),
    ]
    
    nom_projet = models.CharField(max_length=200)
    client = models.CharField(max_length=100)
    description = models.TextField()
    budget = models.DecimalField(max_digits=15, decimal_places=2)
    date_debut = models.DateField()
    date_fin = models.DateField()
    statut = models.CharField(max_length=20, choices=STATUT_CHOICES, default='A_venir')
    
    created_at = models.DateTimeField(default=timezone.now)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        verbose_name = "Appel d'offre"
        verbose_name_plural = "Appels d'offres"
        ordering = ['-created_at']

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


class Mission(models.Model):
    appel_offre = models.ForeignKey(AppelOffre, on_delete=models.CASCADE, related_name="missions")
    consultant = models.ForeignKey(Consultant, on_delete=models.CASCADE, related_name="missions")
    nom_projet = models.CharField(max_length=200, blank=True, null=True)  # Ajouté pour compatibilité
    client = models.CharField(max_length=100, blank=True, null=True)      # Ajouté pour compatibilité
    description = models.TextField(blank=True, null=True)                 # Ajouté pour compatibilité
    titre = models.CharField(max_length=255)
    date_debut = models.DateField()
    date_fin = models.DateField()
    statut = models.CharField(max_length=20)
    score = models.DecimalField(max_digits=5, decimal_places=2, default=0)  # Score du consultant sur cette mission
    date_validation = models.DateTimeField(auto_now_add=True)               # Date de validation de la mission

    def __str__(self):
        return self.titre

    def save(self, *args, **kwargs):
        # Synchroniser avec l'appel d'offre
        if self.appel_offre and not self.nom_projet:
            self.nom_projet = self.appel_offre.nom_projet
        if self.appel_offre and not self.client:
            self.client = self.appel_offre.client
        if self.appel_offre and not self.description:
            self.description = self.appel_offre.description
        super().save(*args, **kwargs)


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


# Autres modèles (Document, DocumentGED, etc.) restent inchangés...
class Document(models.Model):
    consultant = models.ForeignKey(Consultant, on_delete=models.CASCADE, related_name="documents")
    type_document = models.CharField(max_length=20)
    fichier = models.FileField(upload_to="documents/", null=True, blank=True)
    date_upload = models.DateTimeField(auto_now_add=True)

    def __str__(self):
        return self.fichier.name if self.fichier else "Document sans fichier"


class CriteresEvaluation(models.Model):
    """Modèle pour les critères d'évaluation des appels d'offres"""
    appel_offre = models.ForeignKey(AppelOffre, on_delete=models.CASCADE, related_name="criteres")
    nom_critere = models.CharField(max_length=255)
    poids = models.DecimalField(max_digits=5, decimal_places=2)
    description = models.TextField(blank=True, null=True)
    
    class Meta:
        verbose_name = "Critère d'évaluation"
        verbose_name_plural = "Critères d'évaluation"
        unique_together = ('appel_offre', 'nom_critere')

    def __str__(self):
        return f"{self.nom_critere} ({self.poids}%)"


class Projet(models.Model):
    """Modèle pour les projets"""
    nom = models.CharField(max_length=255)
    description = models.TextField(blank=True, null=True)
    responsable = models.CharField(max_length=100)
    date_debut = models.DateField(null=True, blank=True)
    date_fin = models.DateField(null=True, blank=True)
    budget = models.DecimalField(max_digits=15, decimal_places=2, null=True, blank=True)
    statut = models.CharField(max_length=50, default='En cours')
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        ordering = ['-created_at']
        verbose_name = "Projet"
        verbose_name_plural = "Projets"

    def __str__(self):
        return self.nom


class ParticipationMission(models.Model):
    """Modèle pour la participation des consultants aux missions"""
    mission = models.ForeignKey(Mission, on_delete=models.CASCADE, related_name="participants")
    consultant = models.ForeignKey(Consultant, on_delete=models.CASCADE, related_name="participations")
    role = models.CharField(max_length=50)
    evaluation = models.IntegerField(null=True, blank=True, help_text="Note sur 10")
    commentaires = models.TextField(blank=True, null=True)
    date_debut = models.DateField(null=True, blank=True)
    date_fin = models.DateField(null=True, blank=True)
    
    class Meta:
        unique_together = ('mission', 'consultant')
        verbose_name = "Participation à une mission"
        verbose_name_plural = "Participations aux missions"

    def __str__(self):
        return f"{self.consultant} - {self.role} ({self.mission})"



class DocumentCategory(models.Model):
    """Catégories de documents pour la GED"""
    name = models.CharField(max_length=100)
    description = models.TextField(blank=True, null=True)
    color = models.CharField(max_length=7, default='#007bff', help_text="Couleur hexadécimale")
    icon = models.CharField(max_length=50, blank=True, null=True, help_text="Nom de l'icône")
    created_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        verbose_name = "Catégorie de document"
        verbose_name_plural = "Catégories de documents"
        ordering = ['name']

    def __str__(self):
        return self.name


class DocumentGED(models.Model):
    """Modèle pour la Gestion Électronique de Documents"""
    
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

    class Meta:
        ordering = ['-upload_date']
        verbose_name = "Document GED"
        verbose_name_plural = "Documents GED"

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
                    self.last_file_check = timezone.now()
                    self.save(update_fields=['file_exists', 'last_file_check'])
                    return "Fichier manquant"
            else:
                return "Aucun fichier"
        except Exception as e:
            logger.error(f"Erreur lors du calcul de la taille du fichier pour le document {self.id}: {str(e)}")
            self.file_exists = False
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
                    self.last_file_check = timezone.now()
                    self.save(update_fields=['file_exists', 'last_file_check'])
                
                return exists
            return False
        except Exception as e:
            logger.error(f"Erreur lors de la vérification du fichier pour le document {self.id}: {str(e)}")
            return False


class DocumentVersion(models.Model):
    """Versions des documents"""
    document = models.ForeignKey(DocumentGED, on_delete=models.CASCADE, related_name="versions")
    version_number = models.CharField(max_length=20)
    file = models.FileField(upload_to="ged/versions/")
    comments = models.TextField(blank=True, null=True)
    created_by = models.ForeignKey(User, on_delete=models.SET_NULL, null=True)
    created_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        ordering = ['-created_at']
        unique_together = ('document', 'version_number')

    def __str__(self):
        return f"{self.document.title} - v{self.version_number}"


class DocumentAccess(models.Model):
    """Logs d'accès aux documents"""
    document = models.ForeignKey(DocumentGED, on_delete=models.CASCADE, related_name="accesses")
    user = models.ForeignKey(User, on_delete=models.CASCADE)
    access_time = models.DateTimeField(auto_now_add=True)
    action = models.CharField(max_length=20, choices=(
        ('VIEW', 'Consultation'),
        ('DOWNLOAD', 'Téléchargement'),
        ('EDIT', 'Modification'),
        ('DELETE', 'Suppression'),
    ))
    ip_address = models.GenericIPAddressField(null=True, blank=True)
    user_agent = models.TextField(blank=True, null=True)

    class Meta:
        ordering = ['-access_time']

    def __str__(self):
        return f"{self.user.username} - {self.action} - {self.document.title}"


class CVRichatGenerated(models.Model):
    """
    Modèle pour sauvegarder les métadonnées des CV Richat générés
    """
    consultant = models.ForeignKey(
        'Consultant', 
        on_delete=models.CASCADE, 
        related_name='richat_cvs',
        verbose_name="Consultant"
    )
    
    filename = models.CharField(
        max_length=255,
        verbose_name="Nom du fichier"
    )
    
    cv_data = models.TextField(
        help_text="Données JSON utilisées pour générer le CV",
        verbose_name="Données CV"
    )
    
    generated_at = models.DateTimeField(
        auto_now_add=True,
        verbose_name="Date de génération"
    )
    
    file_size = models.IntegerField(
        null=True, 
        blank=True,
        verbose_name="Taille du fichier (bytes)"
    )
    
    is_active = models.BooleanField(
        default=True,
        verbose_name="Actif"
    )
    
    download_count = models.IntegerField(
        default=0,
        verbose_name="Nombre de téléchargements"
    )
    
    last_downloaded = models.DateTimeField(
        null=True,
        blank=True,
        verbose_name="Dernier téléchargement"
    )
    
    class Meta:
        ordering = ['-generated_at']
        verbose_name = "CV Richat Généré"
        verbose_name_plural = "CV Richat Générés"
    
    def __str__(self):
        return f"CV Richat - {self.consultant.nom} {self.consultant.prenom} - {self.generated_at.strftime('%Y-%m-%d %H:%M')}"