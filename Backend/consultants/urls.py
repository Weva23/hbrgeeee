from django.urls import path
from django.conf import settings
from django.conf.urls.static import static
from . import views

urlpatterns = [
    # ==========================================
    # APPELS D'OFFRES - Endpoints principaux
    # ==========================================
    
    # PRINCIPAL ENDPOINT utilisé par le frontend AppelsOffres.tsx
    path('appels/', views.admin_appels_offres, name='appels-list'),
    
    # Détails d'un appel d'offre
    path('appels/<int:pk>/', views.appel_offre_detail, name='appel-detail-public'),
    path('admin/appels/<int:pk>/', views.admin_appel_offre_detail, name='admin-appel-detail'),
    path('admin/appels/', views.admin_appels_offres, name='admin-appels-list'),
    
    # Critères d'évaluation
    path('appels/<int:appel_id>/criteres/', views.appel_offre_criteres, name='appel-criteres'),
    path('criteres/<int:critere_id>/', views.critere_detail, name='critere-detail'),
    
    # Statistiques et enrichissement
    path('appels-stats/', views.appels_offres_stats, name='appels-offres-stats'),
    path('appels/bulk-enrich/', views.bulk_enrich_appels_offres, name='bulk-enrich-appels'),
    
    # ==========================================
    # DASHBOARD ET STATISTIQUES
    # ==========================================
    
    # Dashboard stats (utilisé par le frontend admin)
    path('dashboard-stats/', views.dashboard_stats, name='dashboard-stats'),
    
    # ==========================================
    # MATCHING ET VALIDATION - CORRECTIONS 404
    # ==========================================
    
    # 🔥 ENDPOINTS CORRIGÉS POUR LE MATCHING
    path('matching/offer/<int:appel_offre_id>/', views.matching_for_offer_updated, name='matching-for-offer'),
    path('admin/matching/<int:appel_offre_id>/', views.matching_for_offer_updated, name='admin-matching-detail'),
    path('matching/<int:appel_offre_id>/', views.matching_for_offer_updated, name='matching-detail'),
    path('matching/offer-updated/<int:appel_offre_id>/', views.matching_for_offer_updated, name='matching-for-offer-updated'),
    
    # Validation des matchings
    path('matching/validate/<int:match_id>/', views.validate_match, name='validate-match'),
    
    # Matches validés
    path('validated-matches/', views.validated_matches, name='validated-matches'),
    path('validated-matches-updated/', views.validated_matches_updated, name='validated-matches-updated'),
    
    # ==========================================
    # CONSULTANTS - Administration - CORRECTIONS 404
    # ==========================================
    
    # Login administrateur
    path('admin/login/', views.admin_login, name='admin-login'),
    
    # 🔥 GESTION DES CONSULTANTS CORRIGÉE
    path('admin/consultants/', views.admin_consultants_corrected, name='admin-consultants'),
    path('admin/consultants-fixed/', views.admin_consultants_fixed, name='admin-consultants-fixed'),
    
    # 🔥 CONSULTANTS EN ATTENTE (endpoint principal corrigé)
    path('admin/consultants/pending/', views.get_pending_consultants_safe, name='admin-consultants-pending'),
    path('admin/pending-consultants/', views.get_pending_consultants_safe, name='admin-pending-consultants'),
    path('admin/pending-consultants-fixed/', views.admin_pending_consultants_fixed, name='admin-pending-consultants-fixed'),
    path('consultants/pending/', views.get_consultants_pending, name='consultants-pending'),
    path('consultants/all/', views.get_all_consultants, name='consultants-all'),
    
    # Détails et validation des consultants
    path('admin/consultants/<int:pk>/', views.admin_consultant_detail, name='admin-consultant-detail'),
    path('admin/consultants/validate/<int:pk>/', views.admin_validate_consultant, name='admin-validate-consultant'),
    path('admin/consultants/<int:pk>/delete/', views.admin_consultant_detail_delete, name='admin-consultant-delete'),
    # UNE SEULE route qui gère GET, PUT et DELETE

    
    # ==========================================
    # CONSULTANTS - Interface consultant - 🔥 CORRIGÉ
    # ==========================================
    
    # Authentification consultant
    path('consultant/login/', views.consultant_login, name='consultant-login'),
    path('consultant/register/', views.consultant_register_corrected, name='consultant-register'),
    
    # 🔥 PROFIL ET DONNÉES CONSULTANT (endpoints principaux corrigés)
    path('consultant/<int:consultant_id>/data/', views.consultant_data, name='consultant-data'),
    path('consultant/<int:consultant_id>/update-profile/', views.update_consultant_profile, name='update-consultant-profile'),
    
    # 🔥 MISSIONS ET NOTIFICATIONS (endpoints corrigés)
    path('consultant/<int:consultant_id>/missions/', views.consultant_missions, name='consultant-missions'),
    path('consultant/<int:consultant_id>/notifications/', views.consultant_notifications, name='consultant-notifications'),
    path('consultant/<int:consultant_id>/matches/', views.consultant_matches, name='consultant-matches'),
    
    # ==========================================
    # COMPÉTENCES - 🔥 SECTION CORRIGÉE
    # ==========================================
    
    # Gestion des compétences par consultant
    path('consultant-competences/<int:consultant_id>/', views.consultant_competences, name='consultant-competences'),
    path('consultant-competences/<int:consultant_id>/add/', views.add_consultant_competence, name='add-consultant-competence'),
    path('consultant-competences/<int:consultant_id>/<int:competence_id>/', views.delete_consultant_competence, name='delete-consultant-competence'),
    
    # 🔥 EXTRACTION AUTOMATIQUE DES COMPÉTENCES (endpoint corrigé)
    path('consultant/<int:consultant_id>/extract-skills/', views.extract_consultant_competences, name='extract-consultant-competences'),
    
    # 🔥 ANALYSE D'EXPERTISE (nouveaux endpoints)
    path('consultant/<int:consultant_id>/expertise-analysis/', views.get_consultant_expertise_analysis, name='get-consultant-expertise-analysis'),
    path('consultant/<int:consultant_id>/update-expertise/', views.update_consultant_expertise_info, name='update-consultant-expertise-info'),
    
    # Domaines et compétences (référentiels)
    path('domains/', views.get_all_domains, name='get-all-domains'),
    path('domains/<str:domain>/competences/', views.get_competences_by_domain, name='get-competences-by-domain'),
    
    # ==========================================
    # NOTIFICATIONS - 🔥 CORRIGÉ
    # ==========================================
    
    path('notifications/<int:notification_id>/read/', views.mark_notification_read, name='mark-notification-read'),
    
    # ==========================================
    # CV RICHAT - Système complet - 🔥 CORRIGÉ
    # ==========================================
    
    # 🔥 VÉRIFICATION ET STATUT DES CV (endpoints corrigés)
    path('consultant/<int:consultant_id>/check-cv/', views.check_richat_cv_status, name='check-richat-cv-status'),
    path('consultant/<int:consultant_id>/check-standardized-cv/', views.check_standardized_cv, name='check-standardized-cv'),
    
    # 🔥 TÉLÉCHARGEMENT DES CV (endpoints corrigés)
    path('consultant/<int:consultant_id>/download-cv/', views.download_richat_cv, name='download-richat-cv'),
    path('consultant/<int:consultant_id>/download-standardized-cv/', views.download_standardized_cv, name='download-standardized-cv'),
    path('consultant/<int:consultant_id>/download-richat-cv/<str:filename>/', views.download_specific_richat_cv, name='download-specific-richat-cv'),
    
    # 🔥 GÉNÉRATION ET VALIDATION DES CV RICHAT (nouveaux endpoints)
    path('consultant/<int:consultant_id>/generate-richat-cv/', views.generate_richat_cv_complete, name='generate-richat-cv-complete'),
    path('consultant/<int:consultant_id>/validate-richat-cv/', views.validate_richat_cv, name='validate-richat-cv'),
    
    # Templates et listing des CV
    path('consultant/<int:consultant_id>/richat-cv-template/', views.get_richat_cv_template, name='get-richat-cv-template'),
    path('consultant/<int:consultant_id>/richat-cvs/', views.list_richat_cvs, name='list-richat-cvs'),
    
    # Traitement des CV (upload et traitement)
    path('process-cv/', views.process_cv, name='process-cv'),
    
    # ==========================================
    # GED - Gestion Électronique des Documents
    # ==========================================
    
    # Documents principaux
    path('documents/', views.documents_list, name='documents-list'),
    path('documents/<int:pk>/', views.document_detail, name='document-detail'),
    path('documents/<int:pk>/download/', views.document_download, name='document-download'),
    
    # Documents par appel d'offre
    path('documents/appel-offre/<int:appel_offre_id>/', views.documents_by_appel_offre, name='documents-by-appel-offre'),
    
    # Versions des documents
    path('documents/<int:document_id>/versions/', views.document_versions, name='document-versions'),
    
    # Catégories de documents
    path('document-categories/', views.document_categories, name='document-categories'),
    path('document-categories/<int:pk>/', views.document_category_detail, name='document-category-detail'),
    
    # Statistiques et maintenance
    path('document-stats/', views.document_stats, name='document-stats'),
    path('documents/cleanup-missing/', views.cleanup_missing_files, name='cleanup-missing-files'),
    
    # ==========================================
    # API PUBLIQUES
    # ==========================================
    
    path('consultants/', views.api_public_consultants, name='api-public-consultants'),
    path('get-csrf-token/', views.get_csrf_token, name='get-csrf-token'),
    
    # ==========================================
    # UTILITAIRES ET MAINTENANCE
    # ==========================================
    
    # Nettoyage des données
    path('cleanup/orphaned-users/', views.cleanup_orphaned_users, name='cleanup-orphaned-users'),
    
    # ==========================================
    # DEBUG ET DÉVELOPPEMENT - 🔥 AMÉLIORÉ
    # ==========================================
    
    # 🔥 ENDPOINTS DE DÉBOGAGE AMÉLIORÉS (uniquement en mode DEBUG)
    path('debug/consultant/<int:consultant_id>/missions/', views.debug_consultant_missions, name='debug-consultant-missions'),
    path('debug/matchings/', views.debug_matching_status, name='debug-matchings'),
    path('debug/matchings/consultant/<int:consultant_id>/', views.debug_matching_status, name='debug-matchings-consultant'),
    path('debug/skills-match/<int:consultant_id>/<int:appel_offre_id>/', views.debug_skills_match, name='debug-skills-match'),
    path('debug/database-structure/', views.debug_database_structure, name='debug-database-structure'),
    
    # 🔥 NOUVEAU: Debug pour les missions spécifiquement
    path('debug/missions/consultant/<int:consultant_id>/', views.debug_consultant_missions, name='debug-missions-consultant'),
    
    # ==========================================
    # ENDPOINTS ALTERNATIFS ET COMPATIBILITÉ
    # ==========================================
    
    # Versions alternatives des fonctions principales pour tests
    path('matching/offer-updated/<int:appel_offre_id>/', views.matching_for_offer_updated, name='matching-for-offer-updated-alt'),
]

# ==========================================
# CONFIGURATION DES FICHIERS MÉDIA
# ==========================================

# Servir les fichiers média en développement
if settings.DEBUG:
    urlpatterns += static(settings.MEDIA_URL, document_root=settings.MEDIA_ROOT)
    urlpatterns += static(settings.STATIC_URL, document_root=settings.STATIC_ROOT)

# ==========================================
# 🔥 ROUTES DE DÉBOGAGE SUPPLÉMENTAIRES (DEBUG uniquement)
# ==========================================

if settings.DEBUG:
    # Routes pour tester les endpoints de missions
    urlpatterns += [
        # Test direct des missions
        path('test/missions/<int:consultant_id>/', views.consultant_missions, name='test-missions'),
        
        # Test de la structure de la base
        path('test/db-structure/', views.debug_database_structure, name='test-db-structure'),
        
        # Test des matchings
        path('test/matchings/<int:appel_offre_id>/', views.matching_for_offer_updated, name='test-matchings'),
    ]
    
    print("🔧 Mode DEBUG activé - Routes de débogage ajoutées")
    print("📍 Routes principales:")
    print("   - /api/consultant/{id}/missions/ - Récupérer les missions")
    print("   - /api/consultant/{id}/data/ - Données du consultant")
    print("   - /api/consultant/{id}/notifications/ - Notifications")
    print("   - /api/debug/consultant/{id}/missions/ - Debug missions")
else:
    print("🚀 Mode PRODUCTION - Routes de débogage désactivées")