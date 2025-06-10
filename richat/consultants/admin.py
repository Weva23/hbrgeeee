from django.contrib import admin
from .models import Consultant, Competence, AppelOffre, MatchingResult, CriteresEvaluation, Notification

# ... autres modèles ...

# Dans admin.py, assurez-vous que le modèle est bien enregistré
@admin.register(Notification)
class NotificationAdmin(admin.ModelAdmin):
    list_display = ('consultant', 'type', 'title', 'is_read', 'created_at')
    list_filter = ('is_read', 'type')
    search_fields = ('title', 'content', 'consultant__nom', 'consultant__prenom')