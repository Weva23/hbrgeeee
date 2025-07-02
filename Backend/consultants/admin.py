# admin.py - Configuration admin corrigée avec tous les modèles

from django.contrib import admin
from django.utils.html import format_html
from django.urls import reverse
from django.utils.safestring import mark_safe
from .models import (
    User, Consultant, AppelOffre, Competence, MatchingResult, 
    CriteresEvaluation, Mission, ParticipationMission, Notification,
    Document, DocumentGED, DocumentCategory, DocumentVersion, DocumentAccess,
    Projet,CVRichatGenerated
)

# Configuration pour le modèle User
@admin.register(User)
class UserAdmin(admin.ModelAdmin):
    list_display = ['username', 'email', 'role', 'nom', 'is_active', 'date_joined']
    list_filter = ['role', 'is_active', 'is_staff']
    search_fields = ['username', 'email', 'nom', 'first_name', 'last_name']
    readonly_fields = ['date_joined', 'last_login']
    
    fieldsets = (
        (None, {
            'fields': ('username', 'password')
        }),
        ('Informations personnelles', {
            'fields': ('first_name', 'last_name', 'nom', 'email')
        }),
        ('Permissions', {
            'fields': ('role', 'is_active', 'is_staff', 'is_superuser', 'groups', 'user_permissions')
        }),
        ('Dates importantes', {
            'fields': ('last_login', 'date_joined')
        }),
    )

# Configuration pour le modèle Consultant
@admin.register(Consultant)
class ConsultantAdmin(admin.ModelAdmin):
    list_display = [
        'nom_complet', 'email', 'domaine_principal', 'expertise', 
        'expertise_score', 'statut_badge', 'validation_badge', 'created_at'
    ]
    list_filter = [
        'domaine_principal', 'expertise', 'statut', 'is_validated', 
        'formation_niveau', 'leadership_experience', 'international_experience'
    ]
    search_fields = ['nom', 'prenom', 'email', 'specialite', 'skills']
    readonly_fields = ['expertise_score', 'created_at', 'updated_at', 'full_name']
    date_hierarchy = 'created_at'
    
    fieldsets = (
        ('Informations personnelles', {
            'fields': (
                ('prenom', 'nom'), 
                'email', 
                ('telephone', 'pays', 'ville')
            )
        }),
        ('Champs alias (compatibilité)', {
            'fields': (
                ('firstName', 'lastName'),
                ('phone', 'country', 'city')
            ),
            'classes': ('collapse',)
        }),
        ('Disponibilité', {
            'fields': (
                ('date_debut_dispo', 'date_fin_dispo'),
                ('startAvailability', 'endAvailability')
            )
        }),
        ('Expertise professionnelle', {
            'fields': (
                'domaine_principal',
                'specialite',
                'expertise',
                'expertise_score',
                'skills'
            )
        }),
        ('Évaluation détaillée', {
            'fields': (
                'annees_experience',
                'formation_niveau',
                'certifications_count',
                'projets_realises',
                ('leadership_experience', 'international_experience')
            )
        }),
        ('Statut et validation', {
            'fields': (
                'statut',
                'is_validated'
            )
        }),
        ('Fichiers', {
            'fields': (
                'cv',
                'cvFilename',
                'standardizedCvFilename',
                'photo',
                'profileImage'
            )
        }),
        ('Métadonnées', {
            'fields': ('created_at', 'updated_at'),
            'classes': ('collapse',)
        })
    )
    
    actions = ['valider_consultants', 'invalider_consultants', 'activer_consultants', 'calculer_expertise']
    
    def nom_complet(self, obj):
        return f"{obj.prenom} {obj.nom}"
    nom_complet.short_description = "Nom complet"
    
    def statut_badge(self, obj):
        colors = {
            'Actif': 'success',
            'Inactif': 'secondary',
            'En_attente': 'warning',
            'Suspendu': 'danger'
        }
        color = colors.get(obj.statut, 'secondary')
        return format_html(
            '<span class="badge badge-{}">{}</span>',
            color, obj.statut
        )
    statut_badge.short_description = "Statut"
    
    def validation_badge(self, obj):
        if obj.is_validated:
            return format_html('<span class="badge badge-success">✓ Validé</span>')
        else:
            return format_html('<span class="badge badge-warning">⏳ En attente</span>')
    validation_badge.short_description = "Validation"
    
    def valider_consultants(self, request, queryset):
        updated = queryset.update(is_validated=True, statut='Actif')
        self.message_user(request, f"{updated} consultant(s) validé(s)")
    valider_consultants.short_description = "Valider les consultants sélectionnés"
    
    def invalider_consultants(self, request, queryset):
        updated = queryset.update(is_validated=False, statut='En_attente')
        self.message_user(request, f"{updated} consultant(s) invalidé(s)")
    invalider_consultants.short_description = "Invalider les consultants sélectionnés"
    
    def activer_consultants(self, request, queryset):
        updated = queryset.update(statut='Actif')
        self.message_user(request, f"{updated} consultant(s) activé(s)")
    activer_consultants.short_description = "Activer les consultants sélectionnés"
    
    def calculer_expertise(self, request, queryset):
        updated = 0
        for consultant in queryset:
            if consultant.update_expertise_level():
                updated += 1
        self.message_user(request, f"Expertise recalculée pour {updated} consultant(s)")
    calculer_expertise.short_description = "Recalculer l'expertise"

# Configuration pour le modèle AppelOffre
@admin.register(AppelOffre)
class AppelOffreAdmin(admin.ModelAdmin):
    list_display = ['nom_projet', 'client', 'budget', 'date_debut', 'date_fin', 'statut_badge', 'created_at']
    list_filter = ['statut', 'date_debut', 'date_fin']
    search_fields = ['nom_projet', 'client', 'description']
    date_hierarchy = 'created_at'
    readonly_fields = ['created_at', 'updated_at']
    
    fieldsets = (
        ('Informations du projet', {
            'fields': ('nom_projet', 'client', 'description')
        }),
        ('Aspects financiers', {
            'fields': ('budget',)
        }),
        ('Planning', {
            'fields': (('date_debut', 'date_fin'), 'statut')
        }),
        ('Métadonnées', {
            'fields': ('created_at', 'updated_at'),
            'classes': ('collapse',)
        })
    )
    
    def statut_badge(self, obj):
        colors = {
            'A_venir': 'info',
            'En_cours': 'primary',
            'Termine': 'success'
        }
        color = colors.get(obj.statut, 'secondary')
        return format_html(
            '<span class="badge badge-{}">{}</span>',
            color, obj.get_statut_display()
        )
    statut_badge.short_description = "Statut"

# Configuration pour le modèle Competence
@admin.register(Competence)
class CompetenceAdmin(admin.ModelAdmin):
    list_display = ['consultant', 'nom_competence', 'niveau_badge', 'consultant_domaine']
    list_filter = ['niveau', 'consultant__domaine_principal']
    search_fields = ['nom_competence', 'consultant__nom', 'consultant__prenom']
    autocomplete_fields = ['consultant']
    
    def niveau_badge(self, obj):
        colors = ['danger', 'warning', 'info', 'primary', 'success']
        color = colors[min(obj.niveau - 1, 4)] if obj.niveau > 0 else 'secondary'
        return format_html(
            '<span class="badge badge-{}">{}/5</span>',
            color, obj.niveau
        )
    niveau_badge.short_description = "Niveau"
    
    def consultant_domaine(self, obj):
        return obj.consultant.domaine_principal
    consultant_domaine.short_description = "Domaine"

# Configuration pour le modèle MatchingResult
@admin.register(MatchingResult)
class MatchingResultAdmin(admin.ModelAdmin):
    list_display = [
        'consultant', 'appel_offre', 'score_badge', 'validation_badge', 'created_at'
    ]
    list_filter = ['is_validated', 'created_at', 'consultant__domaine_principal']
    search_fields = [
        'consultant__nom', 'consultant__prenom', 
        'appel_offre__nom_projet', 'appel_offre__client'
    ]
    readonly_fields = ['created_at']
    date_hierarchy = 'created_at'
    
    def score_badge(self, obj):
        score = float(obj.score)
        if score >= 80:
            color = 'success'
        elif score >= 60:
            color = 'primary'
        elif score >= 40:
            color = 'warning'
        else:
            color = 'danger'
        
        return format_html(
            '<span class="badge badge-{}">{:.1f}%</span>',
            color, score
        )
    score_badge.short_description = "Score"
    
    def validation_badge(self, obj):
        if obj.is_validated:
            return format_html('<span class="badge badge-success">✓ Validé</span>')
        else:
            return format_html('<span class="badge badge-secondary">⏳ En attente</span>')
    validation_badge.short_description = "Validation"

# Configuration pour le modèle CriteresEvaluation
@admin.register(CriteresEvaluation)
class CriteresEvaluationAdmin(admin.ModelAdmin):
    list_display = ['nom_critere', 'appel_offre', 'poids', 'description_courte']
    list_filter = ['appel_offre']
    search_fields = ['nom_critere', 'description', 'appel_offre__nom_projet']
    
    def description_courte(self, obj):
        if obj.description:
            return obj.description[:50] + "..." if len(obj.description) > 50 else obj.description
        return "-"
    description_courte.short_description = "Description"

# Configuration pour le modèle Mission
@admin.register(Mission)
class MissionAdmin(admin.ModelAdmin):
    list_display = ['titre', 'consultant', 'appel_offre', 'score_badge', 'date_debut', 'date_fin', 'statut']
    list_filter = ['statut', 'date_debut', 'date_fin']
    search_fields = ['titre', 'consultant__nom', 'consultant__prenom', 'appel_offre__nom_projet']
    date_hierarchy = 'date_validation'
    
    def score_badge(self, obj):
        if obj.score:
            score = float(obj.score)
            if score >= 80:
                color = 'success'
            elif score >= 60:
                color = 'primary'
            elif score >= 40:
                color = 'warning'
            else:
                color = 'danger'
            
            return format_html(
                '<span class="badge badge-{}">{:.1f}%</span>',
                color, score
            )
        return "-"
    score_badge.short_description = "Score"

# Configuration pour le modèle Notification
@admin.register(Notification)
class NotificationAdmin(admin.ModelAdmin):
    list_display = ['title', 'consultant', 'type_badge', 'read_badge', 'created_at']
    list_filter = ['type', 'is_read', 'created_at']
    search_fields = ['title', 'content', 'consultant__nom', 'consultant__prenom']
    readonly_fields = ['created_at']
    date_hierarchy = 'created_at'
    
    def type_badge(self, obj):
        colors = {
            'MATCH_VALID': 'success',
            'NEW_OFFER': 'primary',
            'SYSTEM': 'info',
            'MATCH_SUGGEST': 'warning',
            'ADMIN_INFO': 'secondary'
        }
        color = colors.get(obj.type, 'secondary')
        return format_html(
            '<span class="badge badge-{}">{}</span>',
            color, obj.get_type_display()
        )
    type_badge.short_description = "Type"
    
    def read_badge(self, obj):
        if obj.is_read:
            return format_html('<span class="badge badge-success">✓ Lu</span>')
        else:
            return format_html('<span class="badge badge-warning">📬 Non lu</span>')
    read_badge.short_description = "Statut de lecture"

# Configuration pour le modèle Document
@admin.register(Document)
class DocumentAdmin(admin.ModelAdmin):
    list_display = ['fichier_name', 'consultant', 'type_document', 'date_upload']
    list_filter = ['type_document', 'date_upload']
    search_fields = ['consultant__nom', 'consultant__prenom', 'type_document']
    
    def fichier_name(self, obj):
        if obj.fichier:
            return obj.fichier.name.split('/')[-1]
        return "Aucun fichier"
    fichier_name.short_description = "Fichier"

# Configuration pour les modèles GED
@admin.register(DocumentCategory)
class DocumentCategoryAdmin(admin.ModelAdmin):
    list_display = ['name', 'description', 'color_preview', 'icon']
    search_fields = ['name', 'description']
    
    def color_preview(self, obj):
        return format_html(
            '<div style="width: 20px; height: 20px; background-color: {}; border: 1px solid #ccc;"></div>',
            obj.color
        )
    color_preview.short_description = "Couleur"

@admin.register(DocumentGED)
class DocumentGEDAdmin(admin.ModelAdmin):
    list_display = [
        'title', 'document_type_badge', 'folder_type_badge', 
        'category', 'file_size_display', 'file_status', 'upload_date'
    ]
    list_filter = [
        'document_type', 'folder_type', 'category', 
        'is_public', 'file_exists', 'upload_date'
    ]
    search_fields = ['title', 'description', 'tags']
    readonly_fields = ['upload_date', 'modified_date', 'file_exists', 'last_file_check']
    date_hierarchy = 'upload_date'
    
    fieldsets = (
        ('Informations du document', {
            'fields': ('title', 'description', 'document_type', 'folder_type')
        }),
        ('Fichier', {
            'fields': ('file', 'file_type', 'file_exists', 'last_file_check')
        }),
        ('Classification', {
            'fields': ('category', 'tags', 'version', 'is_public')
        }),
        ('Relations', {
            'fields': ('consultant', 'appel_offre', 'mission', 'projet')
        }),
        ('Métadonnées', {
            'fields': ('created_by', 'upload_date', 'modified_date'),
            'classes': ('collapse',)
        })
    )
    
    actions = ['check_file_existence', 'make_public', 'make_private']
    
    def document_type_badge(self, obj):
        colors = {
            'APPEL_OFFRE': 'primary',
            'ETUDE': 'info',
            'RAPPORT': 'success',
            'CV': 'warning',
            'METHODOLOGIE': 'secondary',
            'CONTRAT': 'danger',
            'AUTRE': 'dark'
        }
        color = colors.get(obj.document_type, 'secondary')
        return format_html(
            '<span class="badge badge-{}">{}</span>',
            color, obj.get_document_type_display()
        )
    document_type_badge.short_description = "Type"
    
    def folder_type_badge(self, obj):
        colors = {
            'AO_ADMIN': 'info',
            'AO_TECHNIQUE': 'primary',
            'AO_FINANCE': 'success',
            'AMI_CONTEXTE': 'warning',
            'AMI_OUTREACH': 'secondary',
            'GENERAL': 'dark'
        }
        color = colors.get(obj.folder_type, 'secondary')
        return format_html(
            '<span class="badge badge-{}">{}</span>',
            color, obj.get_folder_type_display()
        )
    folder_type_badge.short_description = "Dossier"
    
    def file_size_display(self, obj):
        return obj.file_size()
    file_size_display.short_description = "Taille"
    
    def file_status(self, obj):
        if obj.file_exists:
            return format_html('<span class="badge badge-success">✓ Existant</span>')
        else:
            return format_html('<span class="badge badge-danger">✗ Manquant</span>')
    file_status.short_description = "Statut fichier"
    
    def check_file_existence(self, request, queryset):
        checked = 0
        for doc in queryset:
            doc.check_file_exists()
            checked += 1
        self.message_user(request, f"Vérification effectuée pour {checked} document(s)")
    check_file_existence.short_description = "Vérifier l'existence des fichiers"
    
    def make_public(self, request, queryset):
        updated = queryset.update(is_public=True)
        self.message_user(request, f"{updated} document(s) rendu(s) public(s)")
    make_public.short_description = "Rendre public"
    
    def make_private(self, request, queryset):
        updated = queryset.update(is_public=False)
        self.message_user(request, f"{updated} document(s) rendu(s) privé(s)")
    make_private.short_description = "Rendre privé"

@admin.register(DocumentVersion)
class DocumentVersionAdmin(admin.ModelAdmin):
    list_display = ['document', 'version_number', 'created_by', 'created_at']
    list_filter = ['created_at']
    search_fields = ['document__title', 'version_number', 'comments']
    readonly_fields = ['created_at']

@admin.register(DocumentAccess)
class DocumentAccessAdmin(admin.ModelAdmin):
    list_display = ['document', 'user', 'action_badge', 'access_time', 'ip_address']
    list_filter = ['action', 'access_time']
    search_fields = ['document__title', 'user__username']
    readonly_fields = ['access_time']
    date_hierarchy = 'access_time'
    
    def action_badge(self, obj):
        colors = {
            'VIEW': 'info',
            'DOWNLOAD': 'primary',
            'EDIT': 'warning',
            'DELETE': 'danger'
        }
        color = colors.get(obj.action, 'secondary')
        return format_html(
            '<span class="badge badge-{}">{}</span>',
            color, obj.get_action_display()
        )
    action_badge.short_description = "Action"

# Configuration pour le modèle Projet
@admin.register(Projet)
class ProjetAdmin(admin.ModelAdmin):
    list_display = ['nom', 'responsable', 'date_debut', 'date_fin', 'budget', 'statut_badge']
    list_filter = ['statut', 'date_debut', 'date_fin']
    search_fields = ['nom', 'description', 'responsable']
    readonly_fields = ['created_at', 'updated_at']
    date_hierarchy = 'created_at'
    
    def statut_badge(self, obj):
        colors = {
            'En cours': 'primary',
            'Terminé': 'success',
            'En attente': 'warning',
            'Annulé': 'danger'
        }
        color = colors.get(obj.statut, 'secondary')
        return format_html(
            '<span class="badge badge-{}">{}</span>',
            color, obj.statut
        )
    statut_badge.short_description = "Statut"

@admin.register(ParticipationMission)
class ParticipationMissionAdmin(admin.ModelAdmin):
    list_display = ['consultant', 'mission', 'role', 'evaluation_badge', 'date_debut', 'date_fin']
    list_filter = ['role', 'evaluation', 'date_debut']
    search_fields = ['consultant__nom', 'consultant__prenom', 'mission__titre', 'role']
    
    def evaluation_badge(self, obj):
        if obj.evaluation:
            if obj.evaluation >= 8:
                color = 'success'
            elif obj.evaluation >= 6:
                color = 'primary'
            elif obj.evaluation >= 4:
                color = 'warning'
            else:
                color = 'danger'
            
            return format_html(
                '<span class="badge badge-{}">{}/10</span>',
                color, obj.evaluation
            )
        return "-"
    evaluation_badge.short_description = "Évaluation"

# @admin.register(SuiviProjet)
# class SuiviProjetAdmin(admin.ModelAdmin):
#     list_display = ['projet', 'mission', 'avancement_badge', 'responsable_maj', 'date_maj']
#     list_filter = ['date_maj']
#     search_fields = ['projet__nom', 'mission__titre', 'responsable_maj', 'commentaire']
#     readonly_fields = ['date_maj']
    
#     def avancement_badge(self, obj):
#         avancement = float(obj.avancement)
#         if avancement >= 90:
#             color = 'success'
#         elif avancement >= 70:
#             color = 'primary'
#         elif avancement >= 50:
#             color = 'info'
#         elif avancement >= 30:
#             color = 'warning'
#         else:
#             color = 'danger'
        
#         return format_html(
#             '<span class="badge badge-{}">{:.1f}%</span>',
#             color, avancement
#         )
#     avancement_badge.short_description = "Avancement"

@admin.register(CVRichatGenerated)
class CVRichatGeneratedAdmin(admin.ModelAdmin):
    list_display = [
        'consultant', 'filename', 'file_size_mb_display', 
        'download_count', 'is_active', 'generated_at'
    ]
    list_filter = ['is_active', 'generated_at']
    search_fields = ['consultant__nom', 'consultant__prenom', 'filename']
    readonly_fields = ['generated_at', 'download_count', 'last_downloaded']
    date_hierarchy = 'generated_at'
    
    def file_size_mb_display(self, obj):
        if obj.file_size_mb:
            return f"{obj.file_size_mb} MB"
        return "-"
    file_size_mb_display.short_description = "Taille (MB)"

# Personnalisation de l'interface admin
admin.site.site_header = "Administration Richat Partners"
admin.site.site_title = "Richat Admin"
admin.site.index_title = "Tableau de bord administrateur"

# Ajouter du CSS personnalisé pour les badges
admin.site.add_css = """
<style>
.badge {
    padding: 0.25em 0.4em;
    font-size: 75%;
    font-weight: 700;
    line-height: 1;
    text-align: center;
    white-space: nowrap;
    vertical-align: baseline;
    border-radius: 0.25rem;
}
.badge-primary { background-color: #007bff; color: white; }
.badge-secondary { background-color: #6c757d; color: white; }
.badge-success { background-color: #28a745; color: white; }
.badge-danger { background-color: #dc3545; color: white; }
.badge-warning { background-color: #ffc107; color: black; }
.badge-info { background-color: #17a2b8; color: white; }
.badge-dark { background-color: #343a40; color: white; }
</style>
"""