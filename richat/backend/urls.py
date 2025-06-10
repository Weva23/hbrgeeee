from django.contrib import admin
from django.urls import path, include
from django.conf import settings
from django.conf.urls.static import static
from django.views.generic import TemplateView

urlpatterns = [
    path('admin/', admin.site.urls),
    path('api/', include('consultants.urls')),

    # Route pour la réinitialisation de mot de passe (frontend)
    # Cette route capturera l'URL complète que React Router traitera ensuite
    path('reset-password/<str:uid>/<str:token>/',
         TemplateView.as_view(template_name='index.html'),
         name='password_reset_confirm'),

    # Route générique pour les autres pages frontend
    path('', TemplateView.as_view(template_name='index.html'), name='home'),
]

# Servir les fichiers media en développement
if settings.DEBUG:
    urlpatterns += static(settings.MEDIA_URL, document_root=settings.MEDIA_ROOT)