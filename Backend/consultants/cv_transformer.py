import os
import fitz  # PyMuPDF
from PIL import Image, ImageEnhance
import pytesseract
import spacy
import re
from datetime import datetime
from reportlab.lib.pagesizes import A4
from reportlab.platypus import SimpleDocTemplate, Paragraph, Spacer, Table, TableStyle, Image as RLImage
from reportlab.lib.styles import getSampleStyleSheet, ParagraphStyle
from reportlab.lib.units import inch, cm
from reportlab.lib.colors import black, blue, gray
from reportlab.lib.enums import TA_CENTER, TA_LEFT, TA_JUSTIFY
from django.core.files.base import ContentFile
import logging

logger = logging.getLogger(__name__)

class CVTransformer:
    """Service pour transformer un CV en modèle Richat standardisé"""
    
    def __init__(self):
        try:
            self.nlp = spacy.load("fr_core_news_sm")
        except OSError:
            try:
                self.nlp = spacy.load("en_core_web_sm")
            except OSError:
                logger.warning("Modèle spaCy non trouvé. Fonctionnalités NLP limitées.")
                self.nlp = None
    
    def extract_text_from_cv(self, file_path):
        """Extrait le texte d'un fichier CV (PDF, DOC, DOCX)"""
        try:
            if file_path.lower().endswith('.pdf'):
                return self._extract_from_pdf(file_path)
            elif file_path.lower().endswith(('.doc', '.docx')):
                return self._extract_from_doc(file_path)
            else:
                raise ValueError("Format de fichier non supporté")
        except Exception as e:
            logger.error(f"Erreur lors de l'extraction du texte : {e}")
            return ""
    
    def _extract_from_pdf(self, file_path):
        """Extrait le texte d'un PDF"""
        try:
            doc = fitz.open(file_path)
            text = ""
            for page in doc:
                page_text = page.get_text("text")
                if page_text.strip():
                    text += page_text + "\n"
                else:
                    # Si pas de texte, utiliser OCR
                    pix = page.get_pixmap(dpi=300)
                    img = Image.frombytes("RGB", [pix.width, pix.height], pix.samples)
                    img = img.convert("L")
                    img = ImageEnhance.Contrast(img).enhance(3.0)
                    img = ImageEnhance.Sharpness(img).enhance(2.0)
                    text += pytesseract.image_to_string(img, lang="fra+eng") + "\n"
            return text
        except Exception as e:
            logger.error(f"Erreur extraction PDF : {e}")
            return ""
    
    def _extract_from_doc(self, file_path):
        """Extrait le texte d'un fichier DOC/DOCX"""
        try:
            import python_docx2txt
            return python_docx2txt.process(file_path)
        except ImportError:
            logger.error("python-docx2txt non installé")
            return ""
        except Exception as e:
            logger.error(f"Erreur extraction DOC : {e}")
            return ""
    
    def parse_cv_content(self, text, consultant_data):
        """Parse le contenu du CV et extrait les informations structurées"""
        parsed_data = {
            'personal_info': self._extract_personal_info(text, consultant_data),
            'education': self._extract_education(text),
            'experience': self._extract_experience(text),
            'skills': self._extract_skills(text),
            'languages': self._extract_languages(text),
            'certifications': self._extract_certifications(text),
            'projects': self._extract_projects(text)
        }
        return parsed_data
    
    def _extract_personal_info(self, text, consultant_data):
        """Extrait les informations personnelles"""
        # Utiliser les données du consultant comme base
        info = {
            'nom': consultant_data.get('nom', ''),
            'prenom': consultant_data.get('prenom', ''),
            'email': consultant_data.get('email', ''),
            'telephone': consultant_data.get('telephone', ''),
            'pays': consultant_data.get('pays', ''),
            'ville': consultant_data.get('ville', ''),
            'date_naissance': '',
            'nationalite': '',
            'adresse': ''
        }
        
        # Compléter avec les informations du CV si manquantes
        lines = text.split('\n')
        for line in lines[:20]:  # Chercher dans les 20 premières lignes
            line = line.strip()
            
            # Date de naissance
            date_match = re.search(r'(\d{1,2}[/-]\d{1,2}[/-]\d{4})', line)
            if date_match and not info['date_naissance']:
                info['date_naissance'] = date_match.group(1)
            
            # Adresse (lignes contenant rue, avenue, etc.)
            if any(word in line.lower() for word in ['rue', 'avenue', 'boulevard', 'bp']) and not info['adresse']:
                info['adresse'] = line
        
        return info
    
    def _extract_education(self, text):
        """Extrait la formation/éducation"""
        education = []
        
        # Mots-clés pour identifier les sections formation
        education_keywords = [
            'formation', 'éducation', 'diplôme', 'études', 'université', 'école',
            'education', 'degree', 'university', 'school', 'master', 'licence',
            'baccalauréat', 'doctorat', 'phd'
        ]
        
        lines = text.split('\n')
        in_education_section = False
        current_education = {}
        
        for i, line in enumerate(lines):
            line = line.strip()
            if not line:
                continue
            
            # Détecter le début de la section formation
            if any(keyword in line.lower() for keyword in education_keywords) and len(line) < 50:
                in_education_section = True
                continue
            
            # Détecter la fin de la section (nouvelle section)
            if in_education_section and re.match(r'^[A-Z][^a-z]*$', line) and len(line) < 30:
                if current_education:
                    education.append(current_education)
                    current_education = {}
                in_education_section = False
                continue
            
            if in_education_section:
                # Extraire année
                year_match = re.search(r'(20\d{2}|19\d{2})', line)
                if year_match:
                    current_education['annee'] = year_match.group(1)
                
                # Extraire diplôme et établissement
                if 'diplome' not in current_education and line:
                    current_education['diplome'] = line
                elif 'etablissement' not in current_education and line:
                    current_education['etablissement'] = line
        
        if current_education:
            education.append(current_education)
        
        return education
    
    def _extract_experience(self, text):
        """Extrait l'expérience professionnelle"""
        experiences = []
        
        experience_keywords = [
            'expérience', 'experience', 'emploi', 'poste', 'travail', 'carrière',
            'professional', 'work', 'job', 'career'
        ]
        
        lines = text.split('\n')
        in_experience_section = False
        current_exp = {}
        
        for line in lines:
            line = line.strip()
            if not line:
                continue
            
            # Détecter section expérience
            if any(keyword in line.lower() for keyword in experience_keywords) and len(line) < 50:
                in_experience_section = True
                continue
            
            # Détecter fin de section
            if in_experience_section and re.match(r'^[A-Z][^a-z]*$', line) and len(line) < 30:
                if current_exp:
                    experiences.append(current_exp)
                    current_exp = {}
                in_experience_section = False
                continue
            
            if in_experience_section:
                # Extraire période
                period_match = re.search(r'(20\d{2}|19\d{2})\s*[-–]\s*(20\d{2}|présent|actuel)', line, re.IGNORECASE)
                if period_match:
                    current_exp['periode'] = period_match.group(0)
                
                # Extraire poste et entreprise
                if 'poste' not in current_exp and line and not re.search(r'\d{4}', line):
                    current_exp['poste'] = line
                elif 'entreprise' not in current_exp and line and not re.search(r'\d{4}', line):
                    current_exp['entreprise'] = line
        
        if current_exp:
            experiences.append(current_exp)
        
        return experiences
    
    def _extract_skills(self, text):
        """Extrait les compétences"""
        skills = []
        
        skills_keywords = [
            'compétences', 'skills', 'technologies', 'outils', 'logiciels',
            'langages', 'frameworks', 'expertise'
        ]
        
        lines = text.split('\n')
        in_skills_section = False
        
        for line in lines:
            line = line.strip()
            if not line:
                continue
            
            # Détecter section compétences
            if any(keyword in line.lower() for keyword in skills_keywords) and len(line) < 50:
                in_skills_section = True
                continue
            
            # Détecter fin de section
            if in_skills_section and re.match(r'^[A-Z][^a-z]*$', line) and len(line) < 30:
                in_skills_section = False
                continue
            
            if in_skills_section:
                # Extraire compétences (séparées par virgules, points, etc.)
                if any(sep in line for sep in [',', '•', '-', '*']):
                    line_skills = re.split(r'[,•\-*]', line)
                    for skill in line_skills:
                        skill = skill.strip()
                        if skill and len(skill) > 2:
                            skills.append(skill)
                elif len(line) > 2:
                    skills.append(line)
        
        return list(set(skills))  # Supprimer les doublons
    
    def _extract_languages(self, text):
        """Extrait les langues"""
        languages = []
        language_keywords = ['langues', 'languages', 'langue', 'language']
        
        # Liste des langues courantes
        common_languages = [
            'français', 'anglais', 'espagnol', 'allemand', 'italien', 'portugais',
            'arabe', 'chinois', 'japonais', 'russe', 'néerlandais', 'suédois',
            'french', 'english', 'spanish', 'german', 'italian', 'portuguese',
            'arabic', 'chinese', 'japanese', 'russian', 'dutch', 'swedish'
        ]
        
        lines = text.split('\n')
        in_language_section = False
        
        for line in lines:
            line = line.strip().lower()
            if not line:
                continue
            
            # Détecter section langues
            if any(keyword in line for keyword in language_keywords) and len(line) < 50:
                in_language_section = True
                continue
            
            if in_language_section:
                # Chercher langues connues
                for lang in common_languages:
                    if lang in line:
                        # Extraire niveau si présent
                        level_match = re.search(rf'{lang}.*?(débutant|intermédiaire|avancé|courant|natif|beginner|intermediate|advanced|fluent|native)', line)
                        if level_match:
                            languages.append(f"{lang.capitalize()} - {level_match.group(1).capitalize()}")
                        else:
                            languages.append(lang.capitalize())
        
        return list(set(languages))
    
    def _extract_certifications(self, text):
        """Extrait les certifications"""
        certifications = []
        cert_keywords = ['certification', 'certificat', 'diplôme', 'formation', 'certificate']
        
        lines = text.split('\n')
        for line in lines:
            line = line.strip()
            # Chercher lignes contenant des certifications
            if any(keyword in line.lower() for keyword in cert_keywords):
                if re.search(r'(20\d{2}|19\d{2})', line):  # Avec année
                    certifications.append(line)
        
        return certifications
    
    def _extract_projects(self, text):
        """Extrait les projets"""
        projects = []
        project_keywords = ['projet', 'project', 'réalisation', 'achievement']
        
        lines = text.split('\n')
        in_project_section = False
        
        for line in lines:
            line = line.strip()
            if any(keyword in line.lower() for keyword in project_keywords) and len(line) < 50:
                in_project_section = True
                continue
            
            if in_project_section and line:
                projects.append(line)
        
        return projects
    
    def generate_richat_cv(self, parsed_data, consultant_data, output_path):
        """Génère un CV au format Richat standardisé"""
        try:
            # Créer le document PDF
            doc = SimpleDocTemplate(
                output_path,
                pagesize=A4,
                rightMargin=2*cm,
                leftMargin=2*cm,
                topMargin=2*cm,
                bottomMargin=2*cm
            )
            
            # Styles
            styles = getSampleStyleSheet()
            
            # Style personnalisé pour Richat
            title_style = ParagraphStyle(
                'RichatTitle',
                parent=styles['Heading1'],
                fontSize=18,
                spaceAfter=30,
                textColor=blue,
                alignment=TA_CENTER
            )
            
            header_style = ParagraphStyle(
                'RichatHeader',
                parent=styles['Heading2'],
                fontSize=14,
                spaceAfter=12,
                textColor=blue,
                borderWidth=1,
                borderColor=blue,
                borderPadding=5
            )
            
            content_style = ParagraphStyle(
                'RichatContent',
                parent=styles['Normal'],
                fontSize=10,
                spaceAfter=6,
                alignment=TA_JUSTIFY
            )
            
            # Contenu du CV
            story = []
            
            # En-tête Richat
            logo_path = "static/images/richat_logo.png"  # À adapter selon votre structure
            if os.path.exists(logo_path):
                logo = RLImage(logo_path, width=2*inch, height=1*inch)
                story.append(logo)
                story.append(Spacer(1, 12))
            
            # Titre
            personal_info = parsed_data['personal_info']
            title = f"CURRICULUM VITAE (CV)"
            story.append(Paragraph(title, title_style))
            story.append(Spacer(1, 12))
            
            # Informations personnelles dans un tableau
            personal_data = [
                ['Titre', 'Mr/Mme'],
                ['Nom de l\'expert', f"{personal_info.get('prenom', '')} {personal_info.get('nom', '')}"],
                ['Date de naissance', personal_info.get('date_naissance', 'Non spécifiée')],
                ['Pays de citoyenneté/résidence', f"{personal_info.get('ville', '')}, {personal_info.get('pays', '')}"],
                ['Email', personal_info.get('email', '')],
                ['Téléphone', personal_info.get('telephone', '')]
            ]
            
            personal_table = Table(personal_data, colWidths=[4*cm, 10*cm])
            personal_table.setStyle(TableStyle([
                ('BACKGROUND', (0, 0), (0, -1), gray),
                ('TEXTCOLOR', (0, 0), (0, -1), black),
                ('ALIGN', (0, 0), (-1, -1), 'LEFT'),
                ('FONTNAME', (0, 0), (-1, -1), 'Helvetica'),
                ('FONTSIZE', (0, 0), (-1, -1), 10),
                ('BOTTOMPADING', (0, 0), (-1, -1), 12),
                ('GRID', (0, 0), (-1, -1), 1, black)
            ]))
            
            story.append(personal_table)
            story.append(Spacer(1, 20))
            
            # Profil/Résumé
            story.append(Paragraph("Résumé du Profil", header_style))
            profile_text = f"Expert en {consultant_data.get('domaine_principal', '')} avec une spécialisation en {consultant_data.get('specialite', '')}. "
            profile_text += "Professionnel expérimenté avec une solide expertise dans les domaines techniques et une capacité démontrée à mener des projets complexes."
            story.append(Paragraph(profile_text, content_style))
            story.append(Spacer(1, 15))
            
            # Formation
            if parsed_data['education']:
                story.append(Paragraph("Éducation", header_style))
                education_data = [['École/Université', 'Période', 'Diplôme obtenu']]
                for edu in parsed_data['education']:
                    education_data.append([
                        edu.get('etablissement', ''),
                        edu.get('annee', ''),
                        edu.get('diplome', '')
                    ])
                
                edu_table = Table(education_data, colWidths=[5*cm, 3*cm, 6*cm])
                edu_table.setStyle(TableStyle([
                    ('BACKGROUND', (0, 0), (-1, 0), gray),
                    ('TEXTCOLOR', (0, 0), (-1, 0), black),
                    ('ALIGN', (0, 0), (-1, -1), 'LEFT'),
                    ('FONTNAME', (0, 0), (-1, -1), 'Helvetica'),
                    ('FONTSIZE', (0, 0), (-1, -1), 9),
                    ('BOTTOMPADING', (0, 0), (-1, -1), 12),
                    ('GRID', (0, 0), (-1, -1), 1, black)
                ]))
                
                story.append(edu_table)
                story.append(Spacer(1, 15))
            
            # Expérience professionnelle
            if parsed_data['experience']:
                story.append(Paragraph("Expérience professionnelle", header_style))
                exp_data = [['Période', 'Poste/Entreprise', 'Responsabilités']]
                for exp in parsed_data['experience']:
                    exp_data.append([
                        exp.get('periode', ''),
                        f"{exp.get('poste', '')} - {exp.get('entreprise', '')}",
                        "Principales responsabilités et réalisations dans le cadre de cette fonction."
                    ])
                
                exp_table = Table(exp_data, colWidths=[3*cm, 5*cm, 6*cm])
                exp_table.setStyle(TableStyle([
                    ('BACKGROUND', (0, 0), (-1, 0), gray),
                    ('TEXTCOLOR', (0, 0), (-1, 0), black),
                    ('ALIGN', (0, 0), (-1, -1), 'LEFT'),
                    ('FONTNAME', (0, 0), (-1, -1), 'Helvetica'),
                    ('FONTSIZE', (0, 0), (-1, -1), 9),
                    ('BOTTOMPADING', (0, 0), (-1, -1), 12),
                    ('GRID', (0, 0), (-1, -1), 1, black),
                    ('VALIGN', (0, 0), (-1, -1), 'TOP')
                ]))
                
                story.append(exp_table)
                story.append(Spacer(1, 15))
            
            # Compétences
            if parsed_data['skills']:
                story.append(Paragraph("Compétences techniques", header_style))
                skills_text = ", ".join(parsed_data['skills'][:15])  # Limiter à 15 compétences
                story.append(Paragraph(skills_text, content_style))
                story.append(Spacer(1, 15))
            
            # Langues
            if parsed_data['languages']:
                story.append(Paragraph("Langues", header_style))
                lang_data = [['Langue', 'Niveau']]
                for lang in parsed_data['languages']:
                    if ' - ' in lang:
                        language, level = lang.split(' - ', 1)
                    else:
                        language, level = lang, 'Non spécifié'
                    lang_data.append([language, level])
                
                lang_table = Table(lang_data, colWidths=[7*cm, 7*cm])
                lang_table.setStyle(TableStyle([
                    ('BACKGROUND', (0, 0), (-1, 0), gray),
                    ('TEXTCOLOR', (0, 0), (-1, 0), black),
                    ('ALIGN', (0, 0), (-1, -1), 'LEFT'),
                    ('FONTNAME', (0, 0), (-1, -1), 'Helvetica'),
                    ('FONTSIZE', (0, 0), (-1, -1), 10),
                    ('BOTTOMPADING', (0, 0), (-1, -1), 12),
                    ('GRID', (0, 0), (-1, -1), 1, black)
                ]))
                
                story.append(lang_table)
                story.append(Spacer(1, 15))
            
            # Certifications
            if parsed_data['certifications']:
                story.append(Paragraph("Certifications", header_style))
                for cert in parsed_data['certifications']:
                    story.append(Paragraph(f"• {cert}", content_style))
                story.append(Spacer(1, 15))
            
            # Pied de page Richat
            footer_text = f"CV généré automatiquement par Richat Partners - {datetime.now().strftime('%d/%m/%Y')}"
            footer_style = ParagraphStyle(
                'Footer',
                parent=styles['Normal'],
                fontSize=8,
                textColor=gray,
                alignment=TA_CENTER
            )
            story.append(Spacer(1, 30))
            story.append(Paragraph(footer_text, footer_style))
            
            # Construire le PDF
            doc.build(story)
            logger.info(f"CV Richat généré avec succès : {output_path}")
            return True
            
        except Exception as e:
            logger.error(f"Erreur lors de la génération du CV Richat : {e}")
            return False
    
    def transform_cv_to_richat_format(self, original_cv_path, consultant_data):
        """Méthode principale pour transformer un CV en format Richat"""
        try:
            # 1. Extraire le texte du CV original
            logger.info("Extraction du texte du CV...")
            text = self.extract_text_from_cv(original_cv_path)
            
            if not text:
                logger.warning("Aucun texte extrait du CV")
                return None
            
            # 2. Parser le contenu
            logger.info("Analyse du contenu du CV...")
            parsed_data = self.parse_cv_content(text, consultant_data)
            
            # 3. Générer le CV Richat
            timestamp = datetime.now().strftime("%Y%m%d_%H%M%S")
            output_filename = f"cv_richat_{consultant_data.get('nom', 'consultant')}_{timestamp}.pdf"
            output_path = os.path.join('media', 'cv_richat', output_filename)
            
            # Créer le dossier s'il n'existe pas
            os.makedirs(os.path.dirname(output_path), exist_ok=True)
            
            logger.info("Génération du CV au format Richat...")
            success = self.generate_richat_cv(parsed_data, consultant_data, output_path)
            
            if success:
                return output_path
            else:
                return None
                
        except Exception as e:
            logger.error(f"Erreur lors de la transformation du CV : {e}")
            return None


# Fonction utilitaire pour utiliser le service
def transform_consultant_cv_to_richat(consultant, cv_file_path):
    """
    Transforme le CV d'un consultant en format Richat
    
    Args:
        consultant: Instance du modèle Consultant
        cv_file_path: Chemin vers le fichier CV original
    
    Returns:
        str: Chemin vers le CV transformé ou None si erreur
    """
    try:
        transformer = CVTransformer()
        
        # Préparer les données du consultant
        consultant_data = {
            'nom': consultant.nom,
            'prenom': consultant.prenom,
            'email': consultant.email,
            'telephone': consultant.telephone,
            'pays': consultant.pays,
            'ville': consultant.ville,
            'domaine_principal': consultant.domaine_principal,
            'specialite': consultant.specialite,
        }
        
        # Transformer le CV
        richat_cv_path = transformer.transform_cv_to_richat_format(cv_file_path, consultant_data)
        
        if richat_cv_path:
            logger.info(f"CV transformé avec succès pour {consultant.nom} {consultant.prenom}")
            return richat_cv_path
        else:
            logger.error(f"Échec de la transformation du CV pour {consultant.nom} {consultant.prenom}")
            return None
            
    except Exception as e:
        logger.error(f"Erreur lors de la transformation du CV : {e}")
        return None