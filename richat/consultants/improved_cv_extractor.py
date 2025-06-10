# improved_cv_extractor.py - Version corrigée pour extraction précise

import re
import logging
from typing import Dict, List, Tuple, Optional
from .competences_data import ALL_SKILLS

logger = logging.getLogger(__name__)

class ImprovedCVExtractor:
    """Extracteur CV amélioré avec meilleure compréhension du texte français/arabe"""
    
    def __init__(self):
        # Charger les compétences prédéfinies
        self.predefined_skills = self._load_predefined_skills()
        
        # Patterns améliorés pour extraction française/arabe
        self.email_patterns = [
            r'\b[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\.[A-Z|a-z]{2,}\b',
            r'[A-Za-z0-9._%+-]+\s*@\s*[A-Za-z0-9.-]+\s*\.\s*[A-Z|a-z]{2,}'
        ]
        
        self.phone_patterns = [
            r'(?:\+?222|00\s*222)?\s*[\d\s\-\(\)]{8,15}',
            r'\b0\d{7,9}\b',
            r'\b\d{2}\s*\d{2}\s*\d{2}\s*\d{2}\b',
            r'00\s*222\s*\d{2}\s*\d{2}\s*\d{2}'
        ]
        
        # Indicateurs de sections améliorés avec variations
        self.section_indicators = {
            'personal': [
                'nom de l\'expert', 'nom expert', 'informations personnelles', 
                'données personnelles', 'coordonnées', 'contact', 'profil personnel', 
                'état civil', 'curriculum vitae', 'cv', 'titre', 'date de naissance', 
                'nationalité', 'pays de citoyenneté', 'résidence', 'email', 'téléphone'
            ],
            'education': [
                'éducation', 'formation', 'diplômes', 'études', 'scolarité',
                'parcours académique', 'cursus', 'université', 'école',
                'diplôme obtenu', 'spécialisation', 'nom école', 'période d\'étude'
            ],
            'experience': [
                'expérience professionnelle', 'expérience', 'emploi', 'carrière',
                'parcours professionnel', 'activités professionnelles', 'postes occupés',
                'missions', 'responsabilités', 'période', 'employeur', 'projets',
                'nom de l\'employeur', 'titre professionnel'
            ],
            'skills': [
                'compétences', 'aptitudes', 'savoir-faire', 'qualifications',
                'technologies', 'outils', 'logiciels', 'expertise',
                'compétences clés', 'compétences techniques'
            ],
            'languages': [
                'langues', 'langues parlées', 'languages', 'linguistic',
                'parler', 'lecture', 'éditorial', 'niveau'
            ],
            'profile': [
                'résumé du profil', 'profil professionnel', 'résumé professionnel',
                'profile summary', 'summary', 'objectif professionnel', 'à propos'
            ]
        }
    
    def _load_predefined_skills(self):
        """Charge et normalise les compétences prédéfinies"""
        all_skills = set()
        
        for domain, skills_list in ALL_SKILLS.items():
            for skill in skills_list:
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
    
    def extract_personal_info_improved(self, text: str) -> Dict[str, str]:
        """Extraction améliorée des informations personnelles"""
        personal_info = {
            'full_name': '',
            'title': '',
            'birth_date': '',
            'nationality': '',
            'residence': '',
            'email': '',
            'phone': ''
        }
        
        lines = [line.strip() for line in text.split('\n') if line.strip()]
        text_lower = text.lower()
        
        # 1. Extraction du nom - Méthode améliorée
        name_found = False
        
        # Méthode 1: Chercher après "nom de l'expert"
        for i, line in enumerate(lines):
            if 'nom de l\'expert' in line.lower() or 'nom expert' in line.lower():
                # Le nom peut être sur la même ligne ou la ligne suivante
                potential_names = []
                
                # Chercher sur la même ligne
                match = re.search(r'nom de l\'expert\s*:?\s*(.+)', line, re.IGNORECASE)
                if match:
                    potential_names.append(match.group(1).strip())
                
                # Chercher sur la ligne suivante
                if i + 1 < len(lines):
                    next_line = lines[i + 1].strip()
                    if next_line and not any(kw in next_line.lower() for kw in ['email', 'téléphone', 'pays', '@', '+']):
                        potential_names.append(next_line)
                
                # Valider le nom trouvé
                for name in potential_names:
                    if self._is_valid_name(name):
                        personal_info['full_name'] = name
                        name_found = True
                        break
                
                if name_found:
                    break
        
        # Méthode 2: Si pas trouvé avec "nom de l'expert", chercher autrement
        if not name_found:
            for i, line in enumerate(lines[:15]):  # Regarder dans les 15 premières lignes
                line_clean = line.strip()
                
                # Ignorer les lignes avec des mots-clés non-noms
                if any(keyword in line_clean.lower() for keyword in [
                    'curriculum', 'cv', 'vitae', 'richat', 'partners', 
                    'email', 'téléphone', 'date', '@', '+', 'http'
                ]):
                    continue
                
                # Vérifier si c'est un nom potentiel
                if self._is_valid_name(line_clean):
                    # Vérifier que ce n'est pas un titre professionnel
                    if not self._is_professional_title(line_clean):
                        personal_info['full_name'] = line_clean
                        name_found = True
                        break
        
        # 2. Extraction de l'email
        for pattern in self.email_patterns:
            match = re.search(pattern, text, re.IGNORECASE)
            if match:
                email = match.group(0).strip()
                if '@' in email and '.' in email.split('@')[1]:
                    personal_info['email'] = email
                    break
        
        # 3. Extraction du téléphone avec nettoyage amélioré
        for pattern in self.phone_patterns:
            matches = re.findall(pattern, text, re.IGNORECASE)
            for match in matches:
                phone = self._clean_phone_number(match)
                if phone and len(phone.replace(' ', '').replace('-', '')) >= 8:
                    personal_info['phone'] = phone
                    break
            if personal_info['phone']:
                break
        
        # 4. Extraction du titre professionnel
        title_patterns = [
            r'étudiant\s+en\s+(.+?)(?:\n|$)',
            r'((?:étudiant|développeur|expert|manager|consultant|ingénieur|directeur|responsable)[^\n]{0,100})',
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
        
        # 5. Extraction de la résidence/pays
        residence_patterns = [
            r'pays de citoyenneté[/\s]*résidence\s*:?\s*([^\n]+)',
            r'résidence\s*:?\s*([^\n]+)',
            r'pays\s*:?\s*([^\n]+)',
            r'lieu\s*:?\s*([^\n]+)'
        ]
        
        for pattern in residence_patterns:
            match = re.search(pattern, text, re.IGNORECASE)
            if match:
                residence = match.group(1).strip()
                if len(residence) > 2 and 'non spécifié' not in residence.lower():
                    personal_info['residence'] = residence
                    break
        
        # 6. Extraction de la date de naissance
        birth_patterns = [
            r'date de naissance\s*:?\s*([0-9\-/\.]+)',
            r'né[e]?\s+le\s+([0-9\-/\.]+)',
            r'birth\s*date\s*:?\s*([0-9\-/\.]+)'
        ]
        
        for pattern in birth_patterns:
            match = re.search(pattern, text, re.IGNORECASE)
            if match:
                birth_date = match.group(1).strip()
                personal_info['birth_date'] = birth_date
                break
        
        return personal_info
    
    def _is_valid_name(self, text: str) -> bool:
        """Vérifie si un texte ressemble à un nom valide"""
        if not text or len(text) < 3:
            return False
        
        # Doit contenir au moins 2 mots
        words = text.split()
        if len(words) < 2:
            return False
        
        # Chaque mot doit être principalement alphabétique
        for word in words:
            if not re.match(r'^[A-Za-zÀ-ÿ\u0600-\u06FF\s\-\'\.]+$', word):
                return False
        
        # Ne doit pas contenir certains mots-clés
        forbidden_words = [
            'sud', 'nord', 'est', 'ouest', 'ville', 'pays', 'email', 
            'téléphone', 'curriculum', 'vitae', 'richat', 'partners'
        ]
        
        for word in forbidden_words:
            if word in text.lower():
                return False
        
        return True
    
    def _is_professional_title(self, text: str) -> bool:
        """Vérifie si un texte est un titre professionnel plutôt qu'un nom"""
        title_keywords = [
            'étudiant', 'développeur', 'expert', 'manager', 'consultant',
            'ingénieur', 'directeur', 'responsable', 'analyste', 'chef'
        ]
        
        text_lower = text.lower()
        return any(keyword in text_lower for keyword in title_keywords)
    
    def _clean_phone_number(self, phone: str) -> str:
        """Nettoie un numéro de téléphone"""
        # Supprimer les caractères non numériques sauf + et espaces
        phone = re.sub(r'[^\d\+\s\-\(\)]', '', phone)
        
        # Supprimer les 00 en début si pas suivi d'un code pays valide
        phone = re.sub(r'^00(?!222)', '', phone)
        
        # Nettoyer les espaces multiples
        phone = re.sub(r'\s+', ' ', phone).strip()
        
        return phone
    
    def extract_professional_summary(self, text: str) -> str:
        """Extrait le résumé professionnel"""
        # Chercher la section résumé du profil
        summary_section = self._find_section(text, self.section_indicators['profile'])
        
        if summary_section:
            # Nettoyer et retourner les premières phrases
            sentences = summary_section.split('.')
            summary_sentences = []
            
            for sentence in sentences[:3]:  # Prendre max 3 phrases
                sentence = sentence.strip()
                if len(sentence) > 20:  # Ignorer les phrases trop courtes
                    summary_sentences.append(sentence)
            
            if summary_sentences:
                return '. '.join(summary_sentences) + '.'
        
        # Si pas de section dédiée, créer un résumé basé sur les infos trouvées
        return ""
    
    def extract_education_improved(self, text: str) -> List[Dict[str, str]]:
        """Extraction améliorée de la formation"""
        education = []
        
        # Trouver la section éducation
        education_section = self._find_section_improved(text, self.section_indicators['education'])
        if not education_section:
            return education
        
        # Analyser la section éducation ligne par ligne
        lines = [line.strip() for line in education_section.split('\n') if line.strip()]
        
        # Chercher les tableaux d'éducation
        if self._has_education_table(education_section):
            education = self._parse_education_table(education_section)
        else:
            education = self._parse_education_list(lines)
        
        return education[:8]  # Limiter à 8 formations
    
    def _has_education_table(self, text: str) -> bool:
        """Vérifie s'il y a un tableau d'éducation"""
        headers = ['nom école', 'université', 'période', 'diplôme', 'spécialisation']
        return any(header in text.lower() for header in headers)
    
    def _parse_education_table(self, text: str) -> List[Dict[str, str]]:
        """Parse un tableau d'éducation"""
        education = []
        lines = [line.strip() for line in text.split('\n') if line.strip()]
        
        current_education = {}
        for line in lines:
            # Ignorer les en-têtes de tableau
            if any(header in line.lower() for header in ['nom école', 'période', 'diplôme']):
                continue
            
            # Détecter une nouvelle entrée par la présence d'une année
            year_matches = re.findall(r'\b(20\d{2}|19\d{2})\b', line)
            
            if year_matches:
                # Sauvegarder l'entrée précédente
                if current_education:
                    education.append(current_education)
                
                # Nouvelle entrée
                current_education = {
                    'period': year_matches[-1],
                    'institution': '',
                    'degree': '',
                    'description': line
                }
                
                # Extraire institution et diplôme de la même ligne
                self._extract_institution_and_degree(line, current_education)
                
        # Ajouter la dernière entrée
        if current_education:
            education.append(current_education)
        
        return education
    
    def _extract_institution_and_degree(self, line: str, education_entry: Dict[str, str]):
        """Extrait l'institution et le diplôme d'une ligne"""
        # Patterns pour institutions
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
                if len(institution) > 3:
                    education_entry['institution'] = institution
                    break
        
        # Patterns pour diplômes
        degree_patterns = [
            r'(licence\s+[^\n]*)',
            r'(master\s+[^\n]*)',
            r'(diplôme\s+[^\n]*)',
            r'(bac\s+[^\n]*)',
            r'(maitrise\s+[^\n]*)',
            r'(mba\s+[^\n]*)'
        ]
        
        for pattern in degree_patterns:
            match = re.search(pattern, line, re.IGNORECASE)
            if match:
                degree = match.group(1).strip()
                if len(degree) > 3:
                    education_entry['degree'] = degree
                    break
    
    def extract_experience_improved(self, text: str) -> List[Dict[str, str]]:
        """Extraction améliorée de l'expérience professionnelle"""
        experience = []
        
        # Trouver la section expérience
        experience_section = self._find_section_improved(text, self.section_indicators['experience'])
        
        if experience_section:
            # Analyser les entrées d'expérience
            experience = self._parse_experience_entries(experience_section)
        else:
            # Chercher les projets comme expérience alternative
            project_experience = self._extract_projects_as_experience(text)
            experience.extend(project_experience)
        
        return experience[:6]  # Limiter à 6 expériences
    
    def _parse_experience_entries(self, text: str) -> List[Dict[str, str]]:
        """Parse les entrées d'expérience professionnelle"""
        experience = []
        lines = [line.strip() for line in text.split('\n') if line.strip()]
        
        current_exp = {}
        for line in lines:
            # Détecter une nouvelle expérience par période ou entreprise
            period_match = re.search(r'(\d{4}[\s\-–à]+\d{4}|\d{4}\s*[–\-à]\s*\w+|\w+\s+\d{4})', line)
            
            if period_match or any(keyword in line.lower() for keyword in ['employeur', 'entreprise', 'société']):
                # Sauvegarder l'expérience précédente
                if current_exp:
                    experience.append(current_exp)
                
                # Nouvelle expérience
                current_exp = {
                    'period': period_match.group(1) if period_match else '',
                    'company': '',
                    'position': '',
                    'location': '',
                    'description': [line]
                }
                
                # Extraire les détails de la ligne
                self._extract_experience_details(line, current_exp)
                
            elif current_exp and len(line) > 10:
                # Ajouter à la description
                current_exp['description'].append(line)
        
        # Ajouter la dernière expérience
        if current_exp:
            experience.append(current_exp)
        
        return experience
    
    def _extract_experience_details(self, line: str, exp_entry: Dict[str, str]):
        """Extrait les détails d'une ligne d'expérience"""
        # Chercher l'entreprise
        company_patterns = [
            r'employeur[:\s]*([^\n,]+)',
            r'entreprise[:\s]*([^\n,]+)',
            r'société[:\s]*([^\n,]+)'
        ]
        
        for pattern in company_patterns:
            match = re.search(pattern, line, re.IGNORECASE)
            if match:
                exp_entry['company'] = match.group(1).strip()
                break
        
        # Chercher le poste
        position_patterns = [
            r'titre professionnel[:\s]*([^\n,]+)',
            r'poste[:\s]*([^\n,]+)',
            r'responsable\s+([^\n,]+)',
            r'(directeur|manager|expert|consultant)\s+([^\n,]+)'
        ]
        
        for pattern in position_patterns:
            match = re.search(pattern, line, re.IGNORECASE)
            if match:
                position = match.group(1) if match.lastindex == 1 else f"{match.group(1)} {match.group(2)}"
                exp_entry['position'] = position.strip()
                break
        
        # Chercher le lieu
        location_patterns = [
            r'(émirats?\s*[–\-]?\s*arabes?\s*unis?)',
            r'(mauritanie?)',
            r'pays[:\s]*([^\n,]+)'
        ]
        
        for pattern in location_patterns:
            match = re.search(pattern, line, re.IGNORECASE)
            if match:
                exp_entry['location'] = match.group(1).strip()
                break
    
    def _find_section_improved(self, text: str, keywords: List[str]) -> str:
        """Trouve une section spécifique dans le texte avec une meilleure logique"""
        lines = text.split('\n')
        section_lines = []
        section_started = False
        section_start_index = -1
        
        for i, line in enumerate(lines):
            line_clean = line.strip().lower()
            
            # Détecter le début de la section
            if any(keyword in line_clean for keyword in keywords):
                section_started = True
                section_start_index = i
                continue
            
            if section_started:
                # Arrêter si nouvelle section majeure détectée
                if self._is_major_section_start(line_clean, keywords):
                    break
                
                # Ajouter la ligne si elle contient du contenu
                if len(line.strip()) > 1:
                    section_lines.append(line.strip())
                
                # Limiter la taille de la section
                if len(section_lines) > 100:
                    break
        
        return '\n'.join(section_lines)
    
    def _is_major_section_start(self, line: str, current_keywords: List[str]) -> bool:
        """Détermine si une ligne marque le début d'une nouvelle section majeure"""
        major_sections = [
            'éducation', 'formation', 'expérience professionnelle', 'compétences', 
            'langues', 'certifications', 'références', 'projets', 'publications',
            'adhésion', 'adéquation'
        ]
        
        # Vérifier si c'est une section différente de celle en cours
        for section in major_sections:
            if section in line and len(line) < 80:
                # Vérifier que ce n'est pas la section courante
                if not any(keyword in line for keyword in current_keywords):
                    return True
        
        return False

# Fonction principale d'extraction améliorée
def enhanced_cv_processing_with_better_extraction(cv_text: str) -> Dict:
    """
    Fonction principale pour traiter un CV avec extraction très améliorée
    """
    try:
        extractor = ImprovedCVExtractor()
        
        # Nettoyage initial du texte
        cleaned_text = re.sub(r'\x00', '', cv_text)
        cleaned_text = re.sub(r'\s+', ' ', cleaned_text)
        cleaned_text = re.sub(r'\n\s*\n', '\n', cleaned_text)
        
        logger.info(f"Début extraction améliorée - {len(cleaned_text)} caractères")
        
        # Extraction des informations avec méthodes améliorées
        personal_info = extractor.extract_personal_info_improved(cleaned_text)
        professional_summary = extractor.extract_professional_summary(cleaned_text)
        education = extractor.extract_education_improved(cleaned_text)
        experience = extractor.extract_experience_improved(cleaned_text)
        skills = extractor.extract_skills_smart(cleaned_text)
        languages = extractor.extract_languages_smart(cleaned_text)
        
        # Génération automatique du résumé professionnel si vide
        if not professional_summary and personal_info.get('title'):
            professional_summary = f"Professionnel {personal_info['title']}"
            if skills:
                professional_summary += f" avec expertise en {', '.join(skills[:3])}"
            professional_summary += "."
        
        result = {
            "personal_info": personal_info,
            "professional_summary": professional_summary,
            "education": education,
            "experience": experience,
            "skills": skills,
            "languages": languages,
            "certifications": [],  # Sera rempli par extraction spécifique
            "extraction_stats": {
                "text_length": len(cleaned_text),
                "personal_info_found": len([v for v in personal_info.values() if v]),
                "experience_entries": len(experience),
                "education_entries": len(education),
                "skills_found": len(skills),
                "languages_found": len(languages),
                "has_professional_summary": bool(professional_summary),
                "extraction_method": "enhanced_with_improved_parsing"
            }
        }
        
        logger.info(f"Extraction améliorée terminée - Nom: {personal_info.get('full_name', 'N/A')}, "
                   f"Titre: {personal_info.get('title', 'N/A')}, "
                   f"Compétences: {len(skills)}, Expériences: {len(experience)}")
        
        return result
        
    except Exception as e:
        logger.error(f"Erreur lors de l'extraction améliorée: {str(e)}")
        return {
            "personal_info": {"error": str(e)},
            "professional_summary": "",
            "education": [],
            "experience": [],
            "skills": [],
            "languages": [],
            "certifications": []
        }