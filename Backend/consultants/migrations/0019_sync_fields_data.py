# consultants/migrations/0019_sync_fields_data.py
# Migration pour synchroniser les données entre les champs existants et nouveaux

from django.db import migrations


def sync_consultant_fields(apps, schema_editor):
    """
    Synchronise les données entre les champs existants et les nouveaux champs alias
    """
    Consultant = apps.get_model('consultants', 'Consultant')
    
    for consultant in Consultant.objects.all():
        # Synchroniser les champs de nom
        if consultant.prenom and not consultant.firstName:
            consultant.firstName = consultant.prenom
        if consultant.nom and not consultant.lastName:
            consultant.lastName = consultant.nom
            
        # Synchroniser les champs de contact
        if consultant.telephone and not consultant.phone:
            consultant.phone = consultant.telephone
            
        # Synchroniser les champs de localisation
        if consultant.pays and not consultant.country:
            consultant.country = consultant.pays
        if consultant.ville and not consultant.city:
            consultant.city = consultant.ville
            
        # Synchroniser les champs de disponibilité
        if consultant.date_debut_dispo and not consultant.startAvailability:
            consultant.startAvailability = consultant.date_debut_dispo
        if consultant.date_fin_dispo and not consultant.endAvailability:
            consultant.endAvailability = consultant.date_fin_dispo
            
        # Sauvegarder le nom du fichier CV si un CV existe
        if consultant.cv and not consultant.cvFilename:
            consultant.cvFilename = consultant.cv.name.split('/')[-1] if consultant.cv.name else None
            
        consultant.save()


def reverse_sync_consultant_fields(apps, schema_editor):
    """
    Fonction de retour - ne fait rien car on ne veut pas perdre les données
    """
    pass


class Migration(migrations.Migration):

    dependencies = [
        ('consultants', '0001_initial'),
    ]

    operations = [
        migrations.RunPython(
            sync_consultant_fields,
            reverse_sync_consultant_fields,
        ),
    ]