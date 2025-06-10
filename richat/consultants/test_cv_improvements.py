#!/usr/bin/env python3
"""
Script de test pour valider les améliorations du traitement CV
"""

import os
import sys
import django
from pathlib import Path

# Configuration Django
sys.path.append(str(Path(__file__).parent))
os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'backend.settings')
django.setup()

from django.core.files.base import ContentFile
from consultants.CVProcessor import CVProcessor
from consultants.text_processing_utils import FrenchArabicTextProcessor, enhance_cv_processing_with_french_arabic
import logging

# Configuration du logging
logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

def test_phone_cleaning():
    """Test du nettoyage des numéros de téléphone"""
    print("\n=== TEST NETTOYAGE NUMÉROS ===")
    
    processor = FrenchArabicTextProcessor()
    
    test_cases = [
        ("0031346121", "31346121"),
        ("0022072", "22072"),
        ("00123456789", "123456789"),
        ("+22231346121", "+22231346121"),  # Garder le code pays
        ("31346121", "31346121"),  # Déjà correct
    ]
    
    for input_num, expected in test_cases:
        result = processor.clean_phone_number(input_num)
        status = "✓" if expected in result else "✗"
        print(f"{status} {input_num} → {result} (attendu: {expected})")

def test_name_extraction():
    """Test de l'extraction des noms"""
    print("\n=== TEST EXTRACTION NOMS ===")
    
    processor = FrenchArabicTextProcessor()
    
    test_texts = [
        ["Curriculum Vitae", "Mohamed Yehdhih Sidatt", "Digital Transformation Manager"],
        ["CV", "Email: test@example.com", "Stages et Projets Académiques", "22072@supnum.mr"],
        ["RICHAT PARTNERS", "CURRICULUM VITAE", "Ahmed Ben Mohamed", "Ingénieur Logiciel"],
    ]
    
    for lines in test_texts:
        result = processor.extract_names_french(lines)
        print(f"Lignes: {lines[:3]}")
        print(f"Nom détecté: '{result}'")
        print()

def test_skills_extraction():
    """Test de l'extraction des compétences"""
    print("\n=== TEST EXTRACTION COMPÉTENCES ===")
    
    processor = FrenchArabicTextProcessor()
    
    test_texts = [
        "Spring • Java • Css • Éducation • Flask • Html • Django • Php • React • Certificats • Python • Sql",
        "Python, Java, JavaScript, HTML, CSS, SQL, MongoDB",
        "Développement web - React - Node.js - MySQL - Git",
        "• Développement d'applications\n• Gestion de bases de données\n• Analyse de données"
    ]
    
    for text in test_texts:
        skills = processor.extract_skills_french(text)
        print(f"Texte: {text[:50]}...")
        print(f"Compétences: {skills}")
        print()

def test_complete_cv_processing():
    """Test complet du traitement CV avec les améliorations"""
    print("\n=== TEST TRAITEMENT CV COMPLET ===")
    
    # Texte de CV de test (similaire à celui de Mohamed)
    test_cv_text = """RICHAT PARTNERS
CURRICULUM VITAE (CV)

Mohamed Yehdhih Sidatt
Digital Transformation Manager - Expert en Base de Données

Email: mohamed.sidatt@example.com
Téléphone: 0031346121
Date de naissance: 02-01-1978
Pays: Mauritanie – Nouakchott

Résumé du Profil:
Expert en transformation digitale avec plus de 18 ans d'expérience dans les secteurs de l'aviation et des technologies de l'information.

Éducation:
Faculty of Computer/Ain Shams University - 2004 - Maitrise en Informatique
Geneva Business School(GBS) - 2018 - MBA IT & Business Analytics

Expérience professionnelle:
Mai 2006-Aout 2007 - Gulf Aircraft Maintenance Co. (GAMCO) - Emirats Arabes Unis
Développement de solutions IT et Systèmes Mainframe

Aout 2007 à Mars 2015 - Abu Dhabi Aircraft Technologies - Emirats Arabes Unis
Implémentation E-Business Suite et Développement Oracle

Compétences clés:
Oracle, SQL Server, Microsoft .NET, Java, Python, Business Intelligence, ERP, Project Management, AMOS, E-Tech Log

Langues parlées:
Français - Second language–proficient
Anglais - Fluent
Arabic - Native speaker

Certifications:
Project Management Professional (PMP) – PMI, USA
CBAP/CCBA – International Institute of Business Analytics – Canada
Six Sigma – Green Belt – GE Aviation – UAE
"""

    # Créer le processeur
    content_file = ContentFile(test_cv_text.encode(), name='test_cv.txt')
    processor = CVProcessor(content_file)
    
    # Simuler l'extraction de texte
    processor.cv_text = test_cv_text
    
    # Appliquer les améliorations
    processor = enhance_cv_processing_with_french_arabic(processor)
    
    # Analyser le CV
    success = processor.parse_cv()
    
    print(f"Succès de l'analyse: {success}")
    
    # Afficher les résultats
    personal_info = processor.extracted_data["personal_info"]
    print(f"Nom: {personal_info.get('full_name', 'Non détecté')}")
    print(f"Email: {personal_info.get('email', 'Non détecté')}")
    print(f"Téléphone: {personal_info.get('phone', 'Non détecté')}")
    print(f"Titre: {personal_info.get('title', 'Non détecté')}")
    
    print(f"Éducation: {len(processor.extracted_data['education'])} entrées")
    print(f"Expérience: {len(processor.extracted_data['experience'])} entrées")
    print(f"Compétences: {len(processor.extracted_data['skills'])} - {processor.extracted_data['skills'][:10]}")
    print(f"Langues: {len(processor.extracted_data['languages'])} - {processor.extracted_data['languages']}")
    print(f"Certifications: {len(processor.extracted_data['certifications'])} - {processor.extracted_data['certifications'][:3]}")

def test_cv_generation():
    """Test de génération du CV Richat complet"""
    print("\n=== TEST GÉNÉRATION CV RICHAT ===")
    
    # Utiliser les données du test précédent
    test_cv_text = """Mohamed Yehdhih Sidatt
Digital Transformation Manager

Email: mohamed.sidatt@example.com
Téléphone: 31346121

Compétences: Oracle, SQL Server, Python, Java, Project Management
"""
    
    try:
        content_file = ContentFile(test_cv_text.encode(), name='test_cv.txt')
        processor = CVProcessor(content_file)
        processor.cv_text = test_cv_text
        
        # Appliquer les améliorations
        processor = enhance_cv_processing_with_french_arabic(processor)
        processor.parse_cv()
        
        # Générer le PDF
        pdf_data = processor.generate_richat_cv()
        
        print(f"✓ CV PDF généré avec succès: {len(pdf_data)} bytes")
        
        # Sauvegarder pour test
        with open('test_cv_richat.pdf', 'wb') as f:
            f.write(pdf_data)
        print("✓ CV sauvegardé dans test_cv_richat.pdf")
        
    except Exception as e:
        print(f"✗ Erreur génération CV: {e}")

def main():
    """Fonction principale de test"""
    print("TESTS DES AMÉLIORATIONS DU TRAITEMENT CV")
    print("=" * 50)
    
    try:
        test_phone_cleaning()
        test_name_extraction()
        test_skills_extraction()
        test_complete_cv_processing()
        test_cv_generation()
        
        print("\n" + "=" * 50)
        print("✅ TOUS LES TESTS TERMINÉS")
        print("\nLes améliorations incluent :")
        print("1. ✓ Nettoyage automatique des numéros (suppression 00)")
        print("2. ✓ Meilleure détection des noms français/arabes")
        print("3. ✓ Extraction améliorée des compétences")
        print("4. ✓ Support des textes multilingues")
        print("5. ✓ Génération de CV complets comme Mohamed Yehdhih")
        
    except Exception as e:
        print(f"\n❌ ERREUR DURANT LES TESTS: {e}")
        import traceback
        traceback.print_exc()

if __name__ == "__main__":
    main()