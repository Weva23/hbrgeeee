#!/usr/bin/env python3
"""
Script d'initialisation pour le système de traitement CV
À exécuter après l'installation des dépendances
"""

import os
import sys
import django
from pathlib import Path

def setup_django():
    """Configuration de Django"""
    try:
        # Ajouter le chemin du projet
        project_path = Path(__file__).parent
        sys.path.append(str(project_path))
        
        # Configurer Django
        os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'backend.settings')
        django.setup()
        
        print("✓ Django configuré avec succès")
        return True
    except Exception as e:
        print(f"✗ Erreur de configuration Django: {e}")
        return False

def create_directories():
    """Créer les répertoires nécessaires"""
    try:
        from django.conf import settings
        
        directories = [
            settings.MEDIA_ROOT,
            settings.MEDIA_ROOT / 'standardized_cvs',
            settings.MEDIA_ROOT / 'cv',
            settings.MEDIA_ROOT / 'temp',
            settings.BASE_DIR / 'logs',
        ]
        
        for directory in directories:
            try:
                os.makedirs(directory, exist_ok=True)
                print(f"✓ Répertoire créé: {directory}")
            except Exception as e:
                print(f"✗ Erreur création répertoire {directory}: {e}")
                return False
        
        return True
    except Exception as e:
        print(f"✗ Erreur lors de la création des répertoires: {e}")
        return False

def test_dependencies():
    """Tester les dépendances"""
    dependencies = [
        ('Django', 'django'),
        ('Django REST Framework', 'rest_framework'),
        ('CORS Headers', 'corsheaders'),
        ('PyMuPDF', 'fitz'),
        ('python-docx', 'docx'),
        ('ReportLab', 'reportlab'),
        ('Pillow', 'PIL'),
        ('python-decouple', 'decouple'),
    ]
    
    missing_deps = []
    
    for package_name, import_name in dependencies:
        try:
            __import__(import_name)
            print(f"✓ {package_name}")
        except ImportError:
            print(f"✗ {package_name} - MANQUANT")
            missing_deps.append(package_name)
    
    if missing_deps:
        print("\nDépendances manquantes:")
        print("Exécutez: pip install -r requirements.txt")
        return False
    
    return True

def test_cv_processor():
    """Tester le processeur CV"""
    try:
        from consultants.CVProcessor import CVProcessor
        from django.core.files.base import ContentFile
        
        # Test basique
        test_content = b"Test CV content"
        content_file = ContentFile(test_content, name='test.pdf')
        
        processor = CVProcessor(content_file)
        print("✓ CVProcessor importé et instancié avec succès")
        return True
        
    except ImportError as e:
        print(f"✗ Erreur d'import CVProcessor: {e}")
        print("Assurez-vous que le fichier CVProcessor.py existe dans consultants/")
        return False
    except Exception as e:
        print(f"✗ Erreur CVProcessor: {e}")
        return False

def run_migrations():
    """Exécuter les migrations"""
    try:
        import subprocess
        
        print("Création des migrations...")
        result1 = subprocess.run([sys.executable, 'manage.py', 'makemigrations'], 
                                capture_output=True, text=True)
        
        print("Exécution des migrations...")
        result2 = subprocess.run([sys.executable, 'manage.py', 'migrate'], 
                                capture_output=True, text=True)
        
        if result1.returncode == 0 and result2.returncode == 0:
            print("✓ Migrations exécutées avec succès")
            return True
        else:
            print(f"✗ Erreur migrations: {result1.stderr} {result2.stderr}")
            return False
        
    except Exception as e:
        print(f"✗ Erreur lors des migrations: {e}")
        return False

def create_test_cv():
    """Créer un CV de test pour les tests"""
    try:
        from reportlab.pagesizes import letter
        from reportlab.platypus import SimpleDocTemplate, Paragraph
        from reportlab.lib.styles import getSampleStyleSheet
        from django.conf import settings
        
        test_cv_path = settings.MEDIA_ROOT / 'temp' / 'test_cv.pdf'
        
        doc = SimpleDocTemplate(str(test_cv_path), pagesize=letter)
        styles = getSampleStyleSheet()
        
        # Contenu du CV de test
        story = []
        story.append(Paragraph("John Doe", styles['Title']))
        story.append(Paragraph("Développeur Full Stack", styles['Heading1']))
        story.append(Paragraph("Email: john.doe@example.com", styles['Normal']))
        story.append(Paragraph("Téléphone: +33 1 23 45 67 89", styles['Normal']))
        story.append(Paragraph("Compétences: Python, Django, React, JavaScript, SQL", styles['Normal']))
        story.append(Paragraph("Expérience: 5 ans en développement web", styles['Normal']))
        
        doc.build(story)
        print(f"✓ CV de test créé: {test_cv_path}")
        return True
        
    except Exception as e:
        print(f"✗ Erreur création CV de test: {e}")
        return False

def test_basic_functionality():
    """Test de base du traitement CV"""
    try:
        from consultants.CVProcessor import CVProcessor
        from django.core.files.base import ContentFile
        from django.conf import settings
        
        # Utiliser le CV de test créé
        test_cv_path = settings.MEDIA_ROOT / 'temp' / 'test_cv.pdf'
        
        if test_cv_path.exists():
            with open(test_cv_path, 'rb') as f:
                content = f.read()
            
            content_file = ContentFile(content, name='test_cv.pdf')
            processor = CVProcessor(content_file)
            
            # Test d'extraction
            if processor.extract_text():
                print("✓ Extraction de texte réussie")
                
                # Test d'analyse
                if processor.parse_cv():
                    print("✓ Analyse du CV réussie")
                    
                    # Test de génération
                    try:
                        pdf_data = processor.generate_richat_cv()
                        print(f"✓ Génération CV Richat réussie ({len(pdf_data)} bytes)")
                        return True
                    except Exception as gen_error:
                        print(f"✗ Erreur génération: {gen_error}")
                        return False
                else:
                    print("✗ Échec de l'analyse du CV")
                    return False
            else:
                print("✗ Échec de l'extraction de texte")
                return False
        else:
            print("✗ CV de test non trouvé")
            return False
            
    except Exception as e:
        print(f"✗ Erreur test fonctionnalité: {e}")
        return False

def main():
    """Fonction principale"""
    print("INITIALISATION DU SYSTÈME DE TRAITEMENT CV")
    print("=" * 50)
    
    steps = [
        ("Test des dépendances", test_dependencies),
        ("Configuration Django", setup_django),
        ("Création des répertoires", create_directories),
        ("Exécution des migrations", run_migrations),
        ("Test du processeur CV", test_cv_processor),
        ("Création d'un CV de test", create_test_cv),
        ("Test de fonctionnalité de base", test_basic_functionality),
    ]
    
    success_count = 0
    total_steps = len(steps)
    
    for step_name, step_function in steps:
        print(f"\n{step_name}...")
        if step_function():
            success_count += 1
        else:
            print(f"⚠ Échec de l'étape: {step_name}")
    
    print("\n" + "=" * 50)
    print(f"INITIALISATION TERMINÉE: {success_count}/{total_steps} étapes réussies")
    
    if success_count == total_steps:
        print("✅ Système prêt à fonctionner!")
        print("\nProchaines étapes:")
        print("1. Démarrer le serveur: python manage.py runserver")
        print("2. Tester l'upload d'un CV via l'interface")
        print("3. Vérifier les logs dans le répertoire logs/")
    else:
        print("⚠ Certaines étapes ont échoué. Vérifiez les erreurs ci-dessus.")
        print("\nActions recommandées:")
        print("1. Installer les dépendances: pip install -r requirements.txt")
        print("2. Vérifier la configuration de la base de données")
        print("3. Relancer ce script")

if __name__ == "__main__":
    main()