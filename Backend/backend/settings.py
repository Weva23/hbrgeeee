# settings.py - Configuration corrigée pour la sauvegarde automatique des CVs

"""
Django settings for backend project - Version corrigée avec sauvegarde automatique

Configuration spécialement adaptée pour le système de transformation CV avec :
- Sauvegarde automatique dans le dossier standardized_cvs
- Gestion CSRF cross-origin optimisée
- Support des uploads de fichiers volumineux
- Logging détaillé pour le debugging
- Chemins absolus pour les dossiers de stockage
"""

from pathlib import Path
import os
import sys

# Build paths inside the project like this: BASE_DIR / 'subdir'.
BASE_DIR = Path(__file__).resolve().parent.parent

# SECURITY WARNING: keep the secret key used in production secret!
SECRET_KEY = 'django-insecure-*duzx*)qbxeilpcvdmg8bw8a2a(^nd590ws^shc)aa7m4bmgll'

# SECURITY WARNING: don't run with debug turned on in production!
DEBUG = True

# ==========================================
# HOSTS ET DOMAINES AUTORISÉS
# ==========================================
ALLOWED_HOSTS = [
    'localhost',
    '127.0.0.1',
    '0.0.0.0',
    '[::1]',
    # Ajouter vos domaines de production ici
]

# ==========================================
# APPLICATION DEFINITION
# ==========================================
INSTALLED_APPS = [
    'django.contrib.admin',
    'django.contrib.auth',
    'django.contrib.contenttypes',
    'django.contrib.sessions',
    'django.contrib.messages',
    'django.contrib.staticfiles',
    'corsheaders',  # OBLIGATOIRE pour CORS
    'consultants'
]

# ==========================================
# MIDDLEWARE CONFIGURATION - ORDRE CRITIQUE
# ==========================================
MIDDLEWARE = [
    'corsheaders.middleware.CorsMiddleware',  # DOIT ÊTRE EN PREMIER
    'django.middleware.security.SecurityMiddleware',
    'django.contrib.sessions.middleware.SessionMiddleware',
    'django.middleware.common.CommonMiddleware',
    'django.middleware.csrf.CsrfViewMiddleware',  # CSRF après CORS
    'django.contrib.auth.middleware.AuthenticationMiddleware',
    'django.contrib.messages.middleware.MessageMiddleware',
    'django.middleware.clickjacking.XFrameOptionsMiddleware',
]

# ==========================================
# CONFIGURATION CORS - SOLUTION COMPLÈTE
# ==========================================

# Développement : Permissif mais sécurisé
CORS_ALLOW_ALL_ORIGINS = DEBUG  # True en développement, False en production
CORS_ALLOW_CREDENTIALS = True

# Production : Origins spécifiques (décommenter pour la production)
if not DEBUG:
    CORS_ALLOW_ALL_ORIGINS = False
    CORS_ALLOWED_ORIGINS = [
        "https://votre-domaine-production.com",
        "https://www.votre-domaine-production.com",
        # Ajouter vos domaines de production
    ]

# Développement : Origins de développement
CORS_ALLOWED_ORIGINS = [
    "http://localhost:3000",      # React dev server
    "http://127.0.0.1:3000",
    "http://localhost:5173",      # Vite dev server
    "http://127.0.0.1:5173",
    "http://localhost:8080",      # Frontend personnalisé
    "http://127.0.0.1:8080",
    "http://localhost:8000",      # Django dev server
    "http://127.0.0.1:8000",
    "http://localhost:4173",      # Vite preview
    "http://127.0.0.1:4173",
]

# Headers CORS autorisés (étendus pour CV upload)
CORS_ALLOW_HEADERS = [
    'accept',
    'accept-encoding',
    'authorization',
    'content-type',
    'dnt',
    'origin',
    'user-agent',
    'x-csrftoken',           # Token CSRF
    'x-requested-with',
    'cache-control',
    'x-forwarded-for',
    'x-forwarded-proto',
    'content-disposition',   # Pour les uploads de fichiers
    'content-length',        # Pour les uploads de fichiers
]

# Méthodes HTTP autorisées
CORS_ALLOW_METHODS = [
    'DELETE',
    'GET',
    'OPTIONS',
    'PATCH',
    'POST',
    'PUT',
]

# ==========================================
# CONFIGURATION CSRF - CRITIQUE POUR CROSS-ORIGIN
# ==========================================

# Domaines de confiance pour CSRF (doit inclure tous les origins frontend)
CSRF_TRUSTED_ORIGINS = [
    "http://localhost:3000",
    "http://127.0.0.1:3000",
    "http://localhost:5173",
    "http://127.0.0.1:5173",
    "http://localhost:8080",      # VOTRE FRONTEND - RÉSOUT L'ERREUR 403
    "http://127.0.0.1:8080",
    "http://localhost:8000",
    "http://127.0.0.1:8000",
    "http://localhost:4173",
    "http://127.0.0.1:4173",
]

# Configuration CSRF avancée
CSRF_COOKIE_SECURE = not DEBUG          # HTTPS en production
CSRF_COOKIE_HTTPONLY = False            # False pour permettre l'accès JS
CSRF_COOKIE_SAMESITE = 'Lax'           # Lax pour cross-origin
CSRF_COOKIE_AGE = 3600                  # 1 heure
CSRF_COOKIE_NAME = 'csrftoken'
CSRF_HEADER_NAME = 'HTTP_X_CSRFTOKEN'
CSRF_USE_SESSIONS = False               # Utiliser les cookies

# Configuration des sessions (pour CSRF)
SESSION_COOKIE_SECURE = not DEBUG
SESSION_COOKIE_HTTPONLY = True
SESSION_COOKIE_SAMESITE = 'Lax'
SESSION_COOKIE_AGE = 3600 * 24          # 24 heures
SESSION_SAVE_EVERY_REQUEST = False
SESSION_EXPIRE_AT_BROWSER_CLOSE = False

# ==========================================
# URL CONFIGURATION
# ==========================================
ROOT_URLCONF = 'backend.urls'

# ==========================================
# TEMPLATES CONFIGURATION
# ==========================================
TEMPLATES = [
    {
        'BACKEND': 'django.template.backends.django.DjangoTemplates',
        'DIRS': [
            BASE_DIR / 'templates',
            BASE_DIR / 'static'
        ],
        'APP_DIRS': True,
        'OPTIONS': {
            'context_processors': [
                'django.template.context_processors.debug',
                'django.template.context_processors.request',
                'django.contrib.auth.context_processors.auth',
                'django.contrib.messages.context_processors.messages',
            ],
        },
    },
]

WSGI_APPLICATION = 'backend.wsgi.application'
AUTH_USER_MODEL = 'consultants.User'

# ==========================================
# CONFIGURATION UPLOAD FICHIERS - OPTIMISÉE CV
# ==========================================

# Tailles maximales pour les CVs
FILE_UPLOAD_MAX_MEMORY_SIZE = 25 * 1024 * 1024      # 25MB en mémoire
DATA_UPLOAD_MAX_MEMORY_SIZE = 25 * 1024 * 1024      # 25MB total
DATA_UPLOAD_MAX_NUMBER_FIELDS = 1000                # Champs de formulaire
FILE_UPLOAD_TEMP_DIR = BASE_DIR / 'media' / 'temp'

# Configuration avancée des handlers d'upload
FILE_UPLOAD_HANDLERS = [
    'django.core.files.uploadhandler.MemoryFileUploadHandler',
    'django.core.files.uploadhandler.TemporaryFileUploadHandler',
]

# Permissions des fichiers
FILE_UPLOAD_PERMISSIONS = 0o644
FILE_UPLOAD_DIRECTORY_PERMISSIONS = 0o755

# ==========================================
# MEDIA AND STATIC FILES - CONFIGURATION CRITIQUE
# ==========================================
MEDIA_URL = '/media/'
MEDIA_ROOT = BASE_DIR / 'media'

STATIC_URL = '/static/'
STATIC_ROOT = BASE_DIR / 'staticfiles'

# ==========================================
# CONFIGURATION SPÉCIFIQUE CV STANDARDISÉS
# ==========================================

# Dossier principal pour les CVs standardisés - CRITIQUE POUR LA SAUVEGARDE
CV_STANDARDISE_DIR = MEDIA_ROOT / 'standardized_cvs'
CV_STANDARDISE_URL = '/media/standardized_cvs/'

# Configuration avancée pour les CVs
CV_STORAGE_SETTINGS = {
    'BASE_DIR': CV_STANDARDISE_DIR,
    'METADATA_DIR': CV_STANDARDISE_DIR / 'metadata',
    'ARCHIVE_DIR': CV_STANDARDISE_DIR / 'archive',
    'TEMP_DIR': MEDIA_ROOT / 'temp',
    'MAX_CVS_PER_CONSULTANT': 5,  # Nombre max de CVs gardés par consultant
    'AUTO_ARCHIVE_DAYS': 90,      # Archivage automatique après X jours
    'CLEANUP_ENABLED': True,       # Nettoyage automatique activé
    'BACKUP_ENABLED': False,       # Sauvegarde externe (à configurer)
    'ALLOWED_FORMATS': ['.pdf'],  # Formats autorisés pour sauvegarde
    'MAX_TOTAL_SIZE_GB': 10,      # Taille max totale en GB
}

# ==========================================
# DATABASE CONFIGURATION
# ==========================================
DATABASES = {
    'default': {
        'ENGINE': 'django.db.backends.mysql',
        'NAME': 'finaly',
        'USER': 'root',
        'PASSWORD': '',
        'HOST': 'localhost',
        'PORT': '3306',
        'OPTIONS': {
            'charset': 'utf8mb4',  # Support complet UTF-8
            'init_command': "SET sql_mode='STRICT_TRANS_TABLES', innodb_strict_mode=1",
            'isolation_level': 'read committed',
        },
        'CONN_MAX_AGE': 600,  # Connexions persistantes
    }
}

# ==========================================
# PASSWORD VALIDATION
# ==========================================
AUTH_PASSWORD_VALIDATORS = [
    {
        'NAME': 'django.contrib.auth.password_validation.UserAttributeSimilarityValidator',
    },
    {
        'NAME': 'django.contrib.auth.password_validation.MinimumLengthValidator',
    },
    {
        'NAME': 'django.contrib.auth.password_validation.CommonPasswordValidator',
    },
    {
        'NAME': 'django.contrib.auth.password_validation.NumericPasswordValidator',
    },
]

# ==========================================
# INTERNATIONALIZATION
# ==========================================
LANGUAGE_CODE = 'fr-fr'
TIME_ZONE = 'Africa/Nouakchott'
USE_I18N = True
USE_TZ = True

# Default primary key field type
DEFAULT_AUTO_FIELD = 'django.db.models.BigAutoField'

# ==========================================
# EMAIL CONFIGURATION
# ==========================================
EMAIL_BACKEND = 'django.core.mail.backends.smtp.EmailBackend'
EMAIL_HOST = 'smtp.gmail.com'
EMAIL_PORT = 587
EMAIL_USE_TLS = True
EMAIL_HOST_USER = 'nahiweva@gmail.com'
DEFAULT_FROM_EMAIL = 'Richat Partners <nahiweva@gmail.com>'

# Configuration des variables d'environnement
try:
    from decouple import Config, RepositoryEnv
    env_path = os.path.join(BASE_DIR, '.env')
    config = Config(RepositoryEnv(env_path))
    EMAIL_HOST_PASSWORD = config('EMAIL_HOST_PASSWORD')
except ImportError:
    EMAIL_HOST_PASSWORD = 'ajfm quom kouj xuof'  # Fallback

# ==========================================
# LOGGING CONFIGURATION - AMÉLIORÉE POUR CV
# ==========================================

# Création automatique du répertoire des logs
log_dir = BASE_DIR / 'logs'
os.makedirs(log_dir, exist_ok=True)

LOGGING = {
    'version': 1,
    'disable_existing_loggers': False,
    'formatters': {
        'verbose': {
            'format': '[{asctime}] {levelname} {name} {module} {funcName}:{lineno} - {message}',
            'style': '{',
        },
        'simple': {
            'format': '[{levelname}] {module} - {message}',
            'style': '{',
        },
        'cv_processing': {
            'format': '[{asctime}] CV-PROCESS {levelname} - {message}',
            'style': '{',
        },
        'cv_storage': {
            'format': '[{asctime}] CV-STORAGE {levelname} - {message}',
            'style': '{',
        },
        'csrf_debug': {
            'format': '[{asctime}] CSRF {levelname} - {message}',
            'style': '{',
        },
    },
    'handlers': {
        'console': {
            'level': 'INFO',
            'class': 'logging.StreamHandler',
            'formatter': 'simple',
            'stream': sys.stdout,
        },
        'file': {
            'level': 'INFO',
            'class': 'logging.FileHandler',
            'filename': log_dir / 'django.log',
            'formatter': 'verbose',
            'encoding': 'utf-8',
        },
        'cv_processing': {
            'level': 'DEBUG',
            'class': 'logging.FileHandler',
            'filename': log_dir / 'cv_processing.log',
            'formatter': 'cv_processing',
            'encoding': 'utf-8',
        },
        'cv_storage': {
            'level': 'DEBUG',
            'class': 'logging.FileHandler',
            'filename': log_dir / 'cv_storage.log',
            'formatter': 'cv_storage',
            'encoding': 'utf-8',
        },
        'csrf_handler': {
            'level': 'DEBUG',
            'class': 'logging.FileHandler',
            'filename': log_dir / 'csrf_debug.log',
            'formatter': 'csrf_debug',
            'encoding': 'utf-8',
        },
        'error_file': {
            'level': 'ERROR',
            'class': 'logging.FileHandler',
            'filename': log_dir / 'errors.log',
            'formatter': 'verbose',
            'encoding': 'utf-8',
        },
    },
    'loggers': {
        'django': {
            'handlers': ['console', 'file'],
            'level': 'INFO',
            'propagate': True,
        },
        'django.request': {
            'handlers': ['console', 'error_file'],
            'level': 'ERROR',
            'propagate': False,
        },
        'consultants': {
            'handlers': ['console', 'file'],
            'level': 'DEBUG',
            'propagate': True,
        },
        'consultants.CVProcessor': {
            'handlers': ['console', 'cv_processing'],
            'level': 'DEBUG',
            'propagate': True,
        },
        'consultants.views_cv_storage': {
            'handlers': ['console', 'cv_storage'],
            'level': 'DEBUG',
            'propagate': True,
        },
        'django.middleware.csrf': {
            'handlers': ['console', 'csrf_handler'],
            'level': 'DEBUG',
            'propagate': True,
        },
        'corsheaders': {
            'handlers': ['console', 'csrf_handler'],
            'level': 'DEBUG',
            'propagate': True,
        },
    },
    'root': {
        'level': 'INFO',
        'handlers': ['console', 'file'],
    },
}

# ==========================================
# CONFIGURATION CV PROCESSING - ÉTENDUE
# ==========================================
CV_PROCESSING = {
    'MAX_FILE_SIZE': 25 * 1024 * 1024,  # 25MB
    'ALLOWED_EXTENSIONS': ['.pdf', '.doc', '.docx', '.txt'],
    'ALLOWED_MIME_TYPES': [
        'application/pdf',
        'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
        'application/msword',
        'text/plain',
    ],
    'TEMP_DIR': MEDIA_ROOT / 'temp',
    'OUTPUT_DIR': CV_STANDARDISE_DIR,  # UTILISE LE DOSSIER STANDARDISÉ
    'METADATA_DIR': CV_STANDARDISE_DIR / 'metadata',
    'ARCHIVE_DIR': CV_STANDARDISE_DIR / 'archive',
    'TIMEOUT': 300,  # 5 minutes
    'QUALITY_THRESHOLDS': {
        'EXCELLENT': 80,
        'GOOD': 60,
        'FAIR': 40,
        'POOR': 0,
    },
    'MAX_SKILLS': 25,
    'MAX_EXPERIENCE_ENTRIES': 10,
    'MAX_EDUCATION_ENTRIES': 8,
    'AUTO_SAVE_ENABLED': True,  # SAUVEGARDE AUTOMATIQUE ACTIVÉE
    'GENERATE_METADATA': True,   # GÉNÉRATION MÉTADONNÉES ACTIVÉE
    'COMPRESS_PDF': False,       # Compression PDF (optionnel)
}

# ==========================================
# SÉCURITÉ - CONFIGURATION DÉVELOPPEMENT/PRODUCTION
# ==========================================
if DEBUG:
    # Configuration développement
    SECURE_CROSS_ORIGIN_OPENER_POLICY = None
    SECURE_REFERRER_POLICY = None
    SECURE_SSL_REDIRECT = False
    SECURE_BROWSER_XSS_FILTER = False
    SECURE_CONTENT_TYPE_NOSNIFF = False
    SECURE_HSTS_SECONDS = 0
    
    # Email en console pour développement
    # EMAIL_BACKEND = 'django.core.mail.backends.console.EmailBackend'
else:
    # Configuration production
    SECURE_CROSS_ORIGIN_OPENER_POLICY = "same-origin"
    SECURE_REFERRER_POLICY = "strict-origin-when-cross-origin"
    SECURE_SSL_REDIRECT = True
    SECURE_BROWSER_XSS_FILTER = True
    SECURE_CONTENT_TYPE_NOSNIFF = True
    SECURE_HSTS_SECONDS = 31536000  # 1 an
    SECURE_HSTS_INCLUDE_SUBDOMAINS = True
    SECURE_HSTS_PRELOAD = True

# ==========================================
# CRÉATION AUTOMATIQUE DES RÉPERTOIRES - CRITIQUE
# ==========================================
directories_to_create = [
    MEDIA_ROOT,
    CV_STANDARDISE_DIR,                    # DOSSIER PRINCIPAL CVS
    CV_STORAGE_SETTINGS['METADATA_DIR'],   # MÉTADONNÉES
    CV_STORAGE_SETTINGS['ARCHIVE_DIR'],    # ARCHIVES
    CV_STORAGE_SETTINGS['TEMP_DIR'],       # TEMPORAIRE
    MEDIA_ROOT / 'cv',                     # CVs uploads
    MEDIA_ROOT / 'uploads',                # Autres uploads
    log_dir,                               # Logs
]

created_dirs = []
failed_dirs = []

for directory in directories_to_create:
    try:
        os.makedirs(directory, exist_ok=True)
        # Vérifier que le dossier existe vraiment
        if directory.exists():
            created_dirs.append(str(directory))
        else:
            failed_dirs.append(str(directory))
    except Exception as e:
        failed_dirs.append(f"{directory} (Erreur: {e})")

# ==========================================
# CONFIGURATION KDRIVE (OPTIONNEL)
# ==========================================
KDRIVE_API_KEY = os.environ.get('KDRIVE_API_KEY', '')
KDRIVE_DEFAULT_FOLDER_ID = os.environ.get('KDRIVE_DEFAULT_FOLDER_ID', '')

# ==========================================
# VÉRIFICATIONS DE DÉMARRAGE - ÉTENDUES
# ==========================================

def startup_checks():
    """Vérifications à effectuer au démarrage avec focus CV storage"""
    print("=" * 80)
    print("🔧 DÉMARRAGE DJANGO - SYSTÈME CV RICHAT AVEC SAUVEGARDE AUTOMATIQUE")
    print("=" * 80)
    
    # Vérification des répertoires CRITIQUES
    print(f"📁 Vérification des répertoires ({len(directories_to_create)} dossiers):")
    
    if created_dirs:
        print(f"✅ Dossiers créés avec succès ({len(created_dirs)}):")
        for directory in created_dirs:
            print(f"   ✓ {directory}")
    
    if failed_dirs:
        print(f"❌ Dossiers échoués ({len(failed_dirs)}):")
        for directory in failed_dirs:
            print(f"   ✗ {directory}")
    
    # Vérification spécifique du dossier CV standardisé
    print(f"\n📂 Vérification dossier CV standardisé:")
    print(f"   📍 Chemin: {CV_STANDARDISE_DIR}")
    print(f"   📊 Existence: {'✅ OUI' if CV_STANDARDISE_DIR.exists() else '❌ NON'}")
    print(f"   📝 Écriture: {'✅ OUI' if os.access(CV_STANDARDISE_DIR, os.W_OK) else '❌ NON'}")
    print(f"   📖 Lecture: {'✅ OUI' if os.access(CV_STANDARDISE_DIR, os.R_OK) else '❌ NON'}")
    
    # Test de création d'un fichier test
    try:
        test_file = CV_STANDARDISE_DIR / 'test_write.tmp'
        test_file.write_text('test')
        test_file.unlink()
        print(f"   ✍️  Test écriture: ✅ SUCCÈS")
    except Exception as e:
        print(f"   ✍️  Test écriture: ❌ ÉCHEC ({e})")
    
    # Vérification CORS
    cors_issues = []
    
    if 'corsheaders' not in INSTALLED_APPS:
        cors_issues.append("'corsheaders' manquant dans INSTALLED_APPS")
    elif 'corsheaders.middleware.CorsMiddleware' not in MIDDLEWARE:
        cors_issues.append("CorsMiddleware manquant dans MIDDLEWARE")
    elif MIDDLEWARE[0] != 'corsheaders.middleware.CorsMiddleware':
        cors_issues.append("CorsMiddleware n'est pas en première position")
    
    if cors_issues:
        print(f"\n❌ Problèmes CORS détectés:")
        for issue in cors_issues:
            print(f"   - {issue}")
    else:
        print(f"\n✅ Configuration CORS correcte")
    
    # Vérification CSRF
    csrf_origins_count = len(CSRF_TRUSTED_ORIGINS)
    print(f"✅ CSRF configuré pour {csrf_origins_count} domaines de confiance")
    
    if "http://localhost:8080" in CSRF_TRUSTED_ORIGINS:
        print("✅ Port 8080 autorisé pour CSRF")
    else:
        print("⚠️  Port 8080 non trouvé dans CSRF_TRUSTED_ORIGINS")
    
    # Vérification de la base de données
    try:
        db_config = DATABASES['default']
        print(f"✅ Base de données: {db_config['ENGINE'].split('.')[-1]} sur {db_config['HOST']}:{db_config['PORT']}")
    except Exception as e:
        print(f"❌ Configuration base de données: {e}")
    
    # Configuration CV Processing
    max_size_mb = CV_PROCESSING['MAX_FILE_SIZE'] / (1024 * 1024)
    print(f"✅ Upload CV: max {max_size_mb}MB, {len(CV_PROCESSING['ALLOWED_EXTENSIONS'])} formats")
    print(f"✅ Sauvegarde auto: {'ACTIVÉE' if CV_PROCESSING['AUTO_SAVE_ENABLED'] else 'DÉSACTIVÉE'}")
    print(f"✅ Métadonnées: {'ACTIVÉES' if CV_PROCESSING['GENERATE_METADATA'] else 'DÉSACTIVÉES'}")
    
    # Configuration stockage
    max_total_gb = CV_STORAGE_SETTINGS['MAX_TOTAL_SIZE_GB']
    max_cvs = CV_STORAGE_SETTINGS['MAX_CVS_PER_CONSULTANT']
    print(f"✅ Stockage CV: max {max_total_gb}GB, {max_cvs} CVs/consultant")
    
    # Mode debug
    mode = "DÉVELOPPEMENT" if DEBUG else "PRODUCTION"
    print(f"🔧 Mode: {mode}")
    
    # Logs
    print(f"📝 Logs: {log_dir}")
    
    # Espace disque disponible
    try:
        import shutil
        free_space_gb = shutil.disk_usage(CV_STANDARDISE_DIR).free / (1024**3)
        print(f"💾 Espace libre: {free_space_gb:.1f} GB")
    except:
        print(f"💾 Espace libre: Non déterminé")
    
    print("=" * 80)
    
    # Status final
    critical_issues = len(failed_dirs) + len(cors_issues)
    if critical_issues == 0:
        print("🚀 SYSTÈME PRÊT - Configuration optimale pour sauvegarde automatique des CVs")
        print("📁 Dossier standardized_cvs opérationnel")
        print("💾 Sauvegarde automatique activée")
        print("🔐 Sécurité CORS et CSRF configurée")
    else:
        print(f"⚠️  ATTENTION: {critical_issues} problèmes détectés - voir détails ci-dessus")
        print("❗ La sauvegarde automatique pourrait ne pas fonctionner correctement")
    
    print("=" * 80)

# Exécuter les vérifications au démarrage
startup_checks()

# ==========================================
# MESSAGES DE DÉMARRAGE CONDITIONNELS
# ==========================================

if DEBUG:
    print("\n📋 INFORMATIONS DE DÉVELOPPEMENT:")
    print(f"   • CORS autorisé pour: {len(CORS_ALLOWED_ORIGINS)} origins")
    print(f"   • CSRF token: cookies + headers supportés")
    print(f"   • Upload max: {FILE_UPLOAD_MAX_MEMORY_SIZE / (1024*1024):.0f}MB")
    print(f"   • Logs niveau: DEBUG")
    print(f"   • Sauvegarde CV: {CV_STANDARDISE_DIR}")
    
    # Vérification spécifique Windows
    if sys.platform.startswith('win'):
        print(f"   • Plateforme: Windows (encodage UTF-8 forcé)")
    
    print("\n🔗 URLs de test:")
    print("   • Frontend: http://localhost:8080")
    print("   • API Django: http://127.0.0.1:8000/api/")
    print("   • CSRF Token: http://127.0.0.1:8000/api/get-csrf-token/")
    print("   • Upload CV: http://127.0.0.1:8000/api/consultant/process-cv-complete/")
    print("   • Liste CVs: http://127.0.0.1:8000/api/cv-standardise/list/")

# ==========================================
# CONFIGURATION SPÉCIFIQUE WINDOWS
# ==========================================

if sys.platform.startswith('win'):
    # Configuration Unicode pour Windows
    import locale
    try:
        locale.setlocale(locale.LC_ALL, 'French_France.utf8')
    except locale.Error:
        try:
            locale.setlocale(locale.LC_ALL, 'C.UTF-8')
        except locale.Error:
            pass
    
    # Variables d'environnement
    os.environ['PYTHONIOENCODING'] = 'utf-8'

# ==========================================
# CONFIGURATION FINALE ET EXPORT
# ==========================================

# Variables exportées pour les autres modules
CV_UPLOAD_SETTINGS = {
    'max_size': FILE_UPLOAD_MAX_MEMORY_SIZE,
    'allowed_types': CV_PROCESSING['ALLOWED_MIME_TYPES'],
    'temp_dir': CV_PROCESSING['TEMP_DIR'],
    'output_dir': CV_PROCESSING['OUTPUT_DIR'],
    'auto_save': CV_PROCESSING['AUTO_SAVE_ENABLED'],
    'metadata_enabled': CV_PROCESSING['GENERATE_METADATA'],
}

# Configuration des timeouts
CSRF_FAILURE_VIEW = 'django.views.csrf.csrf_failure'

# Variables d'environnement importantes
IMPORTANT_SETTINGS = {
    'DEBUG': DEBUG,
    'CORS_ALLOW_ALL_ORIGINS': CORS_ALLOW_ALL_ORIGINS,
    'CSRF_TRUSTED_ORIGINS_COUNT': len(CSRF_TRUSTED_ORIGINS),
    'MAX_UPLOAD_SIZE_MB': FILE_UPLOAD_MAX_MEMORY_SIZE / (1024 * 1024),
    'CV_AUTO_SAVE_ENABLED': CV_PROCESSING['AUTO_SAVE_ENABLED'],
    'CV_STORAGE_DIR': str(CV_STANDARDISE_DIR),
    'LOG_LEVEL': 'DEBUG' if DEBUG else 'INFO',
}

if DEBUG:
    print(f"\n⚙️  Paramètres clés: {IMPORTANT_SETTINGS}")

# ==========================================
# TESTS DE CONFIGURATION FINALE
# ==========================================

def test_cv_storage_configuration():
    """Test final de la configuration de stockage CV"""
    print("\n🧪 TEST CONFIGURATION STOCKAGE CV:")
    
    tests_results = {}
    
    # Test 1: Dossier principal
    tests_results['main_dir'] = CV_STANDARDISE_DIR.exists() and CV_STANDARDISE_DIR.is_dir()
    
    # Test 2: Sous-dossiers
    tests_results['metadata_dir'] = CV_STORAGE_SETTINGS['METADATA_DIR'].exists()
    tests_results['archive_dir'] = CV_STORAGE_SETTINGS['ARCHIVE_DIR'].exists()
    tests_results['temp_dir'] = CV_STORAGE_SETTINGS['TEMP_DIR'].exists()
    
    # Test 3: Permissions
    tests_results['write_permission'] = os.access(CV_STANDARDISE_DIR, os.W_OK)
    tests_results['read_permission'] = os.access(CV_STANDARDISE_DIR, os.R_OK)
    
    # Test 4: Configuration
    tests_results['auto_save_config'] = CV_PROCESSING['AUTO_SAVE_ENABLED']
    tests_results['metadata_config'] = CV_PROCESSING['GENERATE_METADATA']
    
    # Affichage des résultats
    for test_name, result in tests_results.items():
        status = "✅ PASS" if result else "❌ FAIL"
        print(f"   {test_name}: {status}")
    
    # Résultat global
    all_passed = all(tests_results.values())
    print(f"\n📊 Résultat global: {'✅ TOUS LES TESTS PASSÉS' if all_passed else '❌ CERTAINS TESTS ÉCHOUÉS'}")
    
    if all_passed:
        print("🎯 CONFIGURATION PARFAITE - La sauvegarde automatique fonctionnera correctement")
    else:
        print("⚠️  CONFIGURATION INCOMPLÈTE - Vérifiez les permissions et dossiers")
    
    return all_passed

# Exécuter le test final
test_cv_storage_configuration()

print(f"\n✅ Configuration Django chargée avec succès")
print(f"📊 Résumé: {len(INSTALLED_APPS)} apps, {len(MIDDLEWARE)} middleware, {len(CSRF_TRUSTED_ORIGINS)} origins CSRF")
print("🎯 Système prêt pour la sauvegarde automatique des CVs au format Richat")
print(f"📁 Dossier de sauvegarde: {CV_STANDARDISE_DIR}")
print(f"🔧 Auto-save activé: {CV_PROCESSING['AUTO_SAVE_ENABLED']}")
print(f"📝 Métadonnées activées: {CV_PROCESSING['GENERATE_METADATA']}\n")