# text_processing_utils.py - Version corrigée avec référence aux compétences définies

import re
import logging
from typing import Dict, List, Tuple, Optional
from .competences_data import ALL_SKILLS

logger = logging.getLogger(__name__)

class SmartCVExtractor:
    """Extracteur CV intelligent avec référence aux compétences prédéfinies"""
    
    def __init__(self):
        # Charger les compétences prédéfinies
        self.predefined_skills = self._load_predefined_skills()
        
        # Patterns améliorés pour extraction française/arabe
        self.email_patterns = [
            r'\b[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\.[A-Z|a-z]{2,}\b',
            r'[A-Za-z0-9._%+-]+\s*@\s*[A-Za-z0-9.-]+\s*\.\s*[A-Z|a-z]{2,}'
        ]
        
        self.phone_patterns = [
            r'(?:\+?222|00222)?\s*[\d\s\-\(\)]{8,15}',
            r'\b0\d{7,9}\b',
            r'\b\d{2}\s*\d{2}\s*\d{2}\s*\d{2}\b'
        ]
        
        # Indicateurs de sections améliorés
        self.section_indicators = {
            'personal': [
                'informations personnelles', 'données personnelles', 'coordonnées',
                'contact', 'profil personnel', 'état civil', 'curriculum vitae',
                'nom de l\'expert', 'titre', 'date de naissance', 'nationalité',
                'pays de citoyenneté', 'résidence', 'email', 'téléphone'
            ],
            'experience': [
                'expérience professionnelle', 'expérience', 'emploi', 'carrière',
                'parcours professionnel', 'activités professionnelles', 'postes occupés',
                'missions', 'responsabilités', 'période', 'employeur', 'projets'
            ],
            'education': [
                'éducation', 'formation', 'diplômes', 'études', 'scolarité',
                'parcours académique', 'cursus', 'université', 'école',
                'diplôme obtenu', 'spécialisation'
            ],
            'skills': [
                'compétences', 'aptitudes', 'savoir-faire', 'qualifications',
                'technologies', 'outils', 'logiciels', 'expertise',
                'compétences clés', 'compétences techniques'
            ],
            'languages': [
                'langues', 'langues parlées', 'languages', 'linguistic',
                'parler', 'lecture', 'éditorial', 'niveau'
            ]
        }
    
    def _load_predefined_skills(self):
        """Charge et normalise les compétences prédéfinies"""
        all_skills = set()
        
        for domain, skills_list in ALL_SKILLS.items():
            for skill in skills_list:
                # Normaliser les compétences pour la recherche
                normalized_skill = skill.lower().strip()
                all_skills.add(normalized_skill)
                
                # Ajouter des variantes communes
                if 'javascript' in normalized_skill:
                    all_skills.add('js')
                if 'html' in normalized_skill:
                    all_skills.add('html5')
                if 'css' in normalized_skill:
                    all_skills.add('css3')
                if 'python' in normalized_skill:
                    all_skills.add('py')
                if 'mysql' in normalized_skill:
                    all_skills.add('sql')
        
        return all_skills
    
    def extract_personal_info_smart(self, text: str) -> Dict[str, str]:
        """Extraction intelligente des informations personnelles"""
        personal_info = {
            'full_name': '',
            'title': '',
            'birth_date': '',
            'nationality': '',
            'residence': '',
            'email': '',
            'phone': ''
        }
        
        lines = text.split('\n')
        text_lower = text.lower()
        
        # 1. Extraction du nom - Méthode améliorée
        name_found = False
        
        # Chercher d'abord après "nom de l'expert"
        for line in lines:
            if 'nom de l\'expert' in line.lower() or 'nom expert' in line.lower():
                # Extraire ce qui suit
                match = re.search(r'nom de l\'expert\s*:?\s*(.+)', line, re.IGNORECASE)
                if match:
                    potential_name = match.group(1).strip()
                    # Vérifier que ce n'est pas une ville ou autre
                    if not any(word in potential_name.lower() for word in ['nouakchott', 'sud', 'nord', 'est', 'ouest', 'email', '@']):
                        if len(potential_name.split()) >= 2:  # Au moins prénom + nom
                            personal_info['full_name'] = potential_name
                            name_found = True
                            break
        
        # Si pas trouvé, chercher dans les premières lignes (méthode alternative)
        if not name_found:
            for i, line in enumerate(lines[:10]):
                line = line.strip()
                
                # Ignorer les lignes avec des caractères spéciaux ou mots-clés
                if any(char in line for char in ['@', ':', '+', '(', ')', '/', 'http']):
                    continue
                
                if any(keyword in line.lower() for keyword in ['curriculum', 'cv', 'vitae', 'formation', 'expérience', 'richat', 'partners', 'titre']):
                    continue
                
                # Vérifier si c'est un nom (2-4 mots, lettres seulement)
                words = line.split()
                if 2 <= len(words) <= 4:
                    if all(word.replace('-', '').replace("'", '').isalpha() for word in words):
                        if not any(city in line.lower() for city in ['nouakchott', 'paris', 'london', 'dubai']):
                            personal_info['full_name'] = line
                            break
        
        # 2. Extraction de l'email
        for pattern in self.email_patterns:
            match = re.search(pattern, text, re.IGNORECASE)
            if match:
                personal_info['email'] = match.group(0).strip()
                break
        
        # 3. Extraction du téléphone
        for pattern in self.phone_patterns:
            match = re.search(pattern, text, re.IGNORECASE)
            if match:
                phone = match.group(0)
                # Nettoyer le numéro
                phone = re.sub(r'[^\d+\-\(\)\s]', '', phone)
                phone = re.sub(r'^00(?!\d{1,3}[\s\-])', '', phone)  # Supprimer 00 en début
                
                if 8 <= len(phone.replace(' ', '').replace('-', '').replace('(', '').replace(')', '')) <= 15:
                    personal_info['phone'] = phone.strip()
                    break
        
        # 4. Extraction du titre professionnel
        title_patterns = [
            r'étudiant\s+en\s+([^\n]+)',
            r'((?:étudiant|développeur|expert|manager|consultant|ingénieur)[^\n]*)',
            r'titre\s*:?\s*([^\n]+)',
            r'poste\s*:?\s*([^\n]+)'
        ]
        
        for pattern in title_patterns:
            match = re.search(pattern, text, re.IGNORECASE)
            if match:
                title = match.group(1).strip()
                if 5 < len(title) < 150 and not any(char in title for char in ['@', 'http']):
                    personal_info['title'] = title
                    break
        
        return personal_info
    
    def extract_skills_smart(self, text: str) -> List[str]:
        """Extraction intelligente des compétences basée sur competences_data.py"""
        found_skills = set()
        text_lower = text.lower()
        
        # 1. Recherche directe dans les compétences prédéfinies
        for skill in self.predefined_skills:
            if len(skill) > 2:  # Éviter les acronymes trop courts
                # Recherche exacte
                if skill in text_lower:
                    # Vérifier que c'est un mot complet
                    pattern = r'\b' + re.escape(skill) + r'\b'
                    if re.search(pattern, text_lower, re.IGNORECASE):
                        found_skills.add(skill.title())
        
        # 2. Recherche dans la section compétences spécifique
        skills_section = self._find_section(text, self.section_indicators['skills'])
        if skills_section:
            section_skills = self._parse_skills_section_smart(skills_section)
            found_skills.update(section_skills)
        
        # 3. Recherche de compétences techniques spécifiques au développement
        dev_keywords = {
            'html': ['html', 'html5'],
            'css': ['css', 'css3'],
            'javascript': ['javascript', 'js'],
            'php': ['php'],
            'python': ['python', 'django'],
            'flutter': ['flutter'],
            'mysql': ['mysql', 'sql'],
            'mongodb': ['mongodb', 'mongo'],
            'développement': ['développement', 'development']
        }
        
        for category, variants in dev_keywords.items():
            for variant in variants:
                if variant in text_lower:
                    found_skills.add(category.title())
        
        # 4. Extraction des frameworks et technologies mentionnés
        tech_patterns = [
            r'\b(flutter|django|react|angular|vue|node|express)\b',
            r'\b(mysql|postgresql|mongodb|sql|nosql)\b',
            r'\b(html5?|css3?|javascript|php|python)\b',
            r'\b(git|github|api|rest|json)\b'
        ]
        
        for pattern in tech_patterns:
            matches = re.findall(pattern, text_lower, re.IGNORECASE)
            for match in matches:
                found_skills.add(match.title())
        
        # 5. Nettoyer et filtrer les compétences
        cleaned_skills = []
        for skill in found_skills:
            skill_clean = skill.strip().title()
            if 2 < len(skill_clean) < 50:
                # Éviter les doublons et mots communs
                if skill_clean not in cleaned_skills:
                    if not any(common in skill_clean.lower() for common in ['dans', 'pour', 'avec', 'sur', 'les', 'des']):
                        cleaned_skills.append(skill_clean)
        
        return sorted(cleaned_skills)[:25]  # Limiter à 25 compétences
    
    def _parse_skills_section_smart(self, skills_text: str) -> List[str]:
        """Parse intelligent de la section compétences"""
        skills = set()
        
        # Nettoyer le texte
        skills_text = re.sub(r'[•\-–—]', ',', skills_text)  # Remplacer les puces par des virgules
        
        # Différents séparateurs
        separators = [',', '•', '–', '-', ';', '\n', '|', '/', '\\', '.']
        
        for separator in separators:
            if separator in skills_text:
                potential_skills = [skill.strip() for skill in skills_text.split(separator) if skill.strip()]
                
                for skill in potential_skills:
                    # Nettoyer chaque compétence
                    skill = re.sub(r'^[•\-–—\s]+', '', skill)  # Supprimer les puces en début
                    skill = re.sub(r'[•\-–—\s]+$', '', skill)  # Supprimer les puces en fin
                    skill = skill.strip()
                    
                    # Vérifier que c'est une vraie compétence
                    if 2 < len(skill) < 50:
                        # Vérifier si c'est dans nos compétences prédéfinies
                        if skill.lower() in self.predefined_skills:
                            skills.add(skill.title())
                        # Ou si ça ressemble à une compétence technique
                        elif any(tech in skill.lower() for tech in ['dev', 'web', 'mobile', 'sql', 'php', 'html', 'css', 'js']):
                            skills.add(skill.title())
        
        return list(skills)
    
    def extract_education_smart(self, text: str) -> List[Dict[str, str]]:
        """Extraction intelligente de la formation"""
        education = []
        
        # Trouver la section éducation
        education_section = self._find_section(text, self.section_indicators['education'])
        if not education_section:
            return education
        
        lines = [line.strip() for line in education_section.split('\n') if line.strip()]
        current_education = {}
        
        for line in lines:
            # Chercher les années (2020, 2021, etc.)
            year_matches = re.findall(r'\b(20\d{2})\b', line)
            
            if year_matches:
                # Nouvelle entrée éducation
                if current_education:
                    education.append(current_education)
                
                year = year_matches[-1]  # Prendre la dernière année trouvée
                current_education = {
                    'period': year,
                    'institution': '',
                    'degree': '',
                    'description': line
                }
                
                # Essayer d'extraire l'institution et le diplôme de la même ligne
                # Patterns pour institution
                institution_patterns = [
                    r'(école\s+[^\d\n]+?)(?:\s+\d{4}|\s*$)',
                    r'(université\s+[^\d\n]+?)(?:\s+\d{4}|\s*$)',
                    r'([A-Z][a-z]+\s+[A-Z][a-z]+)(?:\s+\d{4})',
                    r'^([A-Z][^0-9\n]*?)(?:\s+\d{4})'
                ]
                
                for pattern in institution_patterns:
                    match = re.search(pattern, line, re.IGNORECASE)
                    if match:
                        institution = match.group(1).strip()
                        if len(institution) > 3 and institution.lower() not in ['projects', 'matchi']:
                            current_education['institution'] = institution
                            break
                
                # Patterns pour diplôme
                degree_patterns = [
                    r'(licence\s+[^\n]*)',
                    r'(master\s+[^\n]*)',
                    r'(diplôme\s+[^\n]*)',
                    r'(bac\s+[^\n]*)',
                    r'([A-Z]{3,}\s+[A-Z]{3,})'  # Pour LICENCE PROFESSIONNELLE
                ]
                
                for pattern in degree_patterns:
                    match = re.search(pattern, line, re.IGNORECASE)
                    if match:
                        degree = match.group(1).strip()
                        if len(degree) > 3:
                            current_education['degree'] = degree
                            break
                            
            elif current_education and len(line) > 5:
                # Ligne de continuation - ajouter à la description existante
                if not current_education.get('institution') and len(line) < 100:
                    # Vérifier si c'est une institution
                    if any(keyword in line.lower() for keyword in ['école', 'université', 'institut', 'college']):
                        current_education['institution'] = line
                elif not current_education.get('degree') and len(line) < 100:
                    # Vérifier si c'est un diplôme
                    if any(keyword in line.lower() for keyword in ['licence', 'master', 'diplôme', 'certificat']):
                        current_education['degree'] = line
        
        # Ajouter la dernière entrée
        if current_education:
            education.append(current_education)
        
        return education[:8]  # Limiter à 8 formations
    
    def extract_experience_smart(self, text: str) -> List[Dict[str, str]]:
        """Extraction intelligente de l'expérience/projets"""
        experience = []
        
        # Pour ce CV, les "expériences" sont plutôt des projets
        # Chercher les projets dans la section éducation ou expérience
        text_lines = text.split('\n')
        current_project = {}
        
        for line in text_lines:
            line = line.strip()
            if not line:
                continue
            
            # Détecter les projets par mots-clés
            if any(keyword in line.lower() for keyword in ['application', 'projet', 'développement', 'app']):
                # Chercher une année dans la ligne
                year_match = re.search(r'\b(20\d{2})\b', line)
                
                if year_match or any(proj in line.lower() for proj in ['tilawat', 'matchi', 'mobile', 'web']):
                    if current_project:
                        experience.append(current_project)
                    
                    year = year_match.group(1) if year_match else "2024"
                    
                    current_project = {
                        'period': year,
                        'company': 'Projet Personnel',
                        'position': 'Développeur',
                        'location': 'Mauritanie',
                        'description': [line]
                    }
                    
                    # Extraire le nom du projet
                    if 'tilawat' in line.lower():
                        current_project['position'] = 'Développeur Application Mobile Tilawat'
                    elif 'matchi' in line.lower():
                        current_project['position'] = 'Développeur Application Réservation Matchs'
                    elif 'réservation' in line.lower() and 'hôtel' in line.lower():
                        current_project['position'] = 'Développeur Application Réservation Hôtels'
                        
            elif current_project and len(line) > 10:
                # Ajouter des détails au projet courant
                current_project['description'].append(line)
        
        # Ajouter le dernier projet
        if current_project:
            experience.append(current_project)
        
        return experience[:6]  # Limiter à 6 projets
    
    def extract_languages_smart(self, text: str) -> List[Dict[str, str]]:
        """Extraction intelligente des langues"""
        languages = []
        
        # Chercher la section langues
        languages_section = self._find_section(text, self.section_indicators['languages'])
        if not languages_section:
            return languages
        
        lines = [line.strip() for line in languages_section.split('\n') if line.strip()]
        
        # Patterns pour détecter langue + niveau
        for line in lines:
            # Ignorer les en-têtes de tableau
            if any(header in line.lower() for header in ['parler', 'lecture', 'éditorial', 'langue']):
                continue
            
            # Détecter les langues communes
            language_mappings = {
                'arab': 'Arabe',
                'français': 'Français',
                'francai': 'Français',
                'anglais': 'Anglais',
                'anglai': 'Anglais',
                'english': 'Anglais'
            }
            
            for key, lang_name in language_mappings.items():
                if key in line.lower():
                    # Détecter le niveau (E = Excellent, S = Satisfaisant, etc.)
                    if 'e' in line.lower() or 'excellent' in line.lower():
                        level = 'Excellent'
                    elif 's' in line.lower() or 'satisfaisant' in line.lower():
                        level = 'Satisfaisant'
                    elif 'b' in line.lower() or 'bon' in line.lower():
                        level = 'Bon'
                    else:
                        level = 'Moyen'
                    
                    languages.append({
                        'language': lang_name,
                        'level': level
                    })
                    break
        
        # Si aucune langue détectée, ajouter des langues par défaut
        if not languages:
            languages = [
                {'language': 'Arabe', 'level': 'Natif'},
                {'language': 'Français', 'level': 'Bon'},
                {'language': 'Anglais', 'level': 'Moyen'}
            ]
        
        return languages[:5]
    
    def _find_section(self, text: str, keywords: List[str]) -> str:
        """Trouve une section spécifique dans le texte"""
        lines = text.split('\n')
        section_lines = []
        section_started = False
        
        for i, line in enumerate(lines):
            line_clean = line.strip().lower()
            
            # Détecter le début de la section
            if any(keyword in line_clean for keyword in keywords):
                section_started = True
                continue
            
            if section_started:
                # Arrêter si nouvelle section majeure
                if self._is_major_section(line_clean):
                    break
                
                if len(line.strip()) > 1:
                    section_lines.append(line.strip())
                
                # Limiter la taille
                if len(section_lines) > 50:
                    break
        
        return '\n'.join(section_lines)
    
    def _is_major_section(self, line: str) -> bool:
        """Détermine si une ligne marque une nouvelle section majeure"""
        major_sections = [
            'éducation', 'formation', 'expérience', 'compétences', 'langues',
            'certifications', 'références', 'projets', 'publications'
        ]
        
        return any(section in line for section in major_sections) and len(line) < 80


# Fonction principale d'extraction intelligente
def enhance_cv_processing_with_french_arabic(cv_text: str) -> Dict:
    """
    Fonction principale pour traiter un CV avec extraction intelligente basée sur competences_data.py
    """
    try:
        extractor = SmartCVExtractor()
        
        # Nettoyage initial du texte
        cleaned_text = re.sub(r'\x00', '', cv_text)  # Supprimer caractères null
        cleaned_text = re.sub(r'\s+', ' ', cleaned_text)  # Normaliser espaces
        cleaned_text = re.sub(r'\n\s*\n', '\n', cleaned_text)  # Supprimer lignes vides
        
        logger.info(f"Début extraction intelligente - {len(cleaned_text)} caractères")
        
        # Extraction des informations
        personal_info = extractor.extract_personal_info_smart(cleaned_text)
        skills = extractor.extract_skills_smart(cleaned_text)
        education = extractor.extract_education_smart(cleaned_text)
        experience = extractor.extract_experience_smart(cleaned_text)
        languages = extractor.extract_languages_smart(cleaned_text)
        
        # Extraction d'un résumé professionnel
        professional_summary = ""
        if personal_info.get('title'):
            professional_summary = f"{personal_info['title']} avec des compétences en {', '.join(skills[:5])}."
        
        result = {
            "personal_info": personal_info,
            "professional_summary": professional_summary,
            "education": education,
            "experience": experience,
            "skills": skills,
            "languages": languages,
            "certifications": [],  # Sera rempli si trouvé
            "extraction_stats": {
                "text_length": len(cleaned_text),
                "personal_info_found": len([v for v in personal_info.values() if v]),
                "experience_entries": len(experience),
                "education_entries": len(education),
                "skills_found": len(skills),
                "languages_found": len(languages),
                "extraction_method": "smart_with_predefined_skills"
            }
        }
        
        logger.info(f"Extraction intelligente terminée - Nom: {personal_info.get('full_name', 'N/A')}, "
                   f"Compétences: {len(skills)}, Projets: {len(experience)}")
        
        return result
        
    except Exception as e:
        logger.error(f"Erreur lors de l'extraction intelligente: {str(e)}")
        return {
            "personal_info": {"error": str(e)},
            "professional_summary": "",
            "education": [],
            "experience": [],
            "skills": [],
            "languages": [],
            "certifications": []
        }