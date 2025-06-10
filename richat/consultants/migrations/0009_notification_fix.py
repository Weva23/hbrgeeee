# migrations/0009_notification_fix.py

from django.db import migrations

class Migration(migrations.Migration):
    dependencies = [
        ('consultants', '0008_alter_notification_type'),  # Ajustez selon votre dernière migration
    ]

    operations = [
        # Nous allons utiliser des opérations SQL brutes pour plus de sécurité
        migrations.RunSQL(
            "CREATE TABLE IF NOT EXISTS consultants_notification ("
            "id INT AUTO_INCREMENT PRIMARY KEY, "
            "type VARCHAR(20) NOT NULL, "
            "title VARCHAR(255) NOT NULL, "
            "content LONGTEXT NOT NULL, "
            "is_read BOOLEAN NOT NULL, "
            "created_at DATETIME(6) NOT NULL, "
            "consultant_id INT NOT NULL, "
            "related_appel_id INT NULL, "
            "related_match_id INT NULL, "
            "FOREIGN KEY (consultant_id) REFERENCES consultants_consultant(id), "
            "FOREIGN KEY (related_appel_id) REFERENCES consultants_appeloffre(id) ON DELETE SET NULL, "
            "FOREIGN KEY (related_match_id) REFERENCES consultants_matchingresult(id) ON DELETE SET NULL"
            ")",
            "DROP TABLE IF EXISTS consultants_notification"
        ),
    ]