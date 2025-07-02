# backend/urls.py - Fichier principal du projet Django CORRIGÉ

from django.contrib import admin
from django.urls import path, include
from django.conf import settings
from django.conf.urls.static import static

urlpatterns = [
    path('admin/', admin.site.urls),
    path('api/', include('consultants.urls')),  # Inclut les URLs de votre app consultants
]

# ✅ CRITIQUE: Configuration pour servir les fichiers média en développement
if settings.DEBUG:
    urlpatterns += static(settings.MEDIA_URL, document_root=settings.MEDIA_ROOT)
    urlpatterns += static(settings.STATIC_URL, document_root=settings.STATIC_ROOT)

# ✅ IMPORTANT: Ajouter une vue de test pour vérifier que les médias fonctionnent
from django.http import JsonResponse
from django.views.decorators.csrf import csrf_exempt
import os

@csrf_exempt
def test_media_access(request):
    """Test pour vérifier l'accès aux fichiers média"""
    try:
        response_data = {
            'media_url': settings.MEDIA_URL,
            'media_root': str(settings.MEDIA_ROOT),
            'media_root_exists': os.path.exists(settings.MEDIA_ROOT),
            'cv_dir_exists': os.path.exists(os.path.join(settings.MEDIA_ROOT, 'standardized_cvs')),
            'debug_mode': settings.DEBUG,
            'static_files_configured': True
        }
        
        # Lister les fichiers dans standardized_cvs
        cv_dir = os.path.join(settings.MEDIA_ROOT, 'standardized_cvs')
        if os.path.exists(cv_dir):
            files = [f for f in os.listdir(cv_dir) if f.endswith('.pdf')]
            response_data['cv_files'] = files
            response_data['cv_files_count'] = len(files)
            
            # Créer les URLs d'accès direct pour chaque fichier
            response_data['cv_direct_urls'] = [
                f"http://127.0.0.1:8000{settings.MEDIA_URL}standardized_cvs/{filename}"
                for filename in files
            ]
        else:
            response_data['cv_files'] = []
            response_data['cv_files_count'] = 0
        
        return JsonResponse(response_data)
    except Exception as e:
        return JsonResponse({'error': str(e)}, status=500)

# Ajouter l'URL de test
urlpatterns.append(path('api/test-media/', test_media_access, name='test-media'))