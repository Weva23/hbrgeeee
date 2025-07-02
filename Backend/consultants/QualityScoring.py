# QualityScoring.py - Système de scoring qualité amélioré pour CVs Richat

from dataclasses import dataclass
from typing import Dict, List, Optional
from enum import Enum
import re
import logging

logger = logging.getLogger(__name__)

class FieldValidationLevel(Enum):
    """Niveaux de validation des champs"""
    INVALID = 0
    LOW = 1
    MEDIUM = 2
    HIGH = 3
    EXCELLENT = 4

@dataclass
class FieldScore:
    """Score détaillé pour un champ"""
    field_name: str
    raw_value: str
    validated_value: str
    confidence: float
    validation_level: FieldValidationLevel
    penalty_reasons: List[str]
    bonus_reasons: List[str]
    weight: float = 1.0

class RichatQualityScorer:
    """Système de scoring qualité pour CVs Richat"""
    
    def __init__(self):
        self.field_weights = {
            # Informations personnelles (40% du score total)
            'nom_expert': 15.0,
            'email': 10.0,
            'telephone': 8.0,
            'date_naissance': 7.0,
            
            # Contenu professionnel (40% du score total)
            'experience': 20.0,
            'education': 10.0,
            'skills': 10.0,
            
            # Conformité Richat (20% du score total)
            'richat_structure': 10.0,
            'profile_summary': 5.0,
            'languages': 5.0
        }
        
        self.penalty_weights = {
            'generic_content': -15,
            'missing_critical_info': -20,
            'invalid_format': -10,
            'duplicate_entries': -5,
            'low_confidence': -8
        }
        
        self.bonus_weights = {
            'high_personalization': 10,
            'complete_richat_format': 15,
            'validated_all_fields': 10,
            'rich_content': 8,
            'consistent_formatting': 5,
            'multilingual_content': 3
        }
    
    def validate_personal_info_field(self, field_name: str, value: str) -> FieldScore:
        """Valider un champ d'information personnelle"""
        penalty_reasons = []
        bonus_reasons = []
        confidence = 0.0
        validation_level = FieldValidationLevel.INVALID
        validated_value = value.strip() if value else ""
        
        if field_name == "nom_expert":
            return self._validate_nom_expert(value)
        elif field_name == "email":
            return self._validate_email(value)
        elif field_name == "telephone":
            return self._validate_telephone(value)
        elif field_name == "date_naissance":
            return self._validate_date_naissance(value)
        elif field_name == "pays_residence":
            return self._validate_pays_residence(value)
        
        return FieldScore(
            field_name=field_name,
            raw_value=value,
            validated_value=validated_value,
            confidence=confidence,
            validation_level=validation_level,
            penalty_reasons=penalty_reasons,
            bonus_reasons=bonus_reasons,
            weight=self.field_weights.get(field_name, 1.0)
        )
    
    def _validate_nom_expert(self, value: str) -> FieldScore:
        """Validation spécialisée pour le nom de l'expert"""
        penalty_reasons = []
        bonus_reasons = []
        confidence = 0.0
        validation_level = FieldValidationLevel.INVALID
        validated_value = value.strip() if value else ""
        
        if not validated_value:
            penalty_reasons.append("Nom manquant")
            confidence = 0.0
        else:
            # Vérifications de qualité
            
            # 1. Détection de contenu générique
            generic_patterns = [
                r'expert', r'consultant', r'curriculum', r'vitae', r'richat', 
                r'partners', r'nom', r'prenom', r'à compléter', r'à préciser',
                r'monsieur', r'madame', r'mr', r'mme'
            ]
            
            is_generic = any(re.search(pattern, validated_value.lower()) for pattern in generic_patterns)
            if is_generic:
                penalty_reasons.append("Contenu générique détecté")
                confidence = max(0.0, confidence - 0.4)
            else:
                bonus_reasons.append("Contenu spécifique")
                confidence += 0.3
            
            # 2. Validation du format
            if re.match(r'^[A-Za-zÀ-ÿ\u0600-\u06FF\s\-\'\.]+, validated_value):
                bonus_reasons.append("Format de nom valide")
                confidence += 0.2
            else:
                penalty_reasons.append("Caractères invalides dans le nom")
                confidence = max(0.0, confidence - 0.3)
            
            # 3. Vérification de la structure (prénom + nom)
            words = validated_value.split()
            if len(words) >= 2:
                bonus_reasons.append("Nom complet (prénom + nom)")
                confidence += 0.3
                
                # Bonus pour noms mauritaniens typiques
                if any(word.lower() in ['mohamed', 'ahmed', 'fatima', 'aisha', 'omar', 'ali'] 
                       for word in words):
                    bonus_reasons.append("Nom mauritanien authentique")
                    confidence += 0.1
            elif len(words) == 1:
                penalty_reasons.append("Nom incomplet (un seul mot)")
                confidence = max(0.0, confidence - 0.2)
            
            # 4. Vérification de la longueur
            if 3 <= len(validated_value) <= 50:
                confidence += 0.1
            else:
                penalty_reasons.append("Longueur de nom inappropriée")
                confidence = max(0.0, confidence - 0.2)
            
            # 5. Détection de format tout en majuscules (problématique)
            if validated_value.isupper() and len(validated_value) > 10:
                penalty_reasons.append("Format tout majuscules détecté")
                confidence = max(0.0, confidence - 0.1)
                # Correction automatique
                validated_value = validated_value.title()
                bonus_reasons.append("Format corrigé automatiquement")
        
        # Déterminer le niveau de validation
        if confidence >= 0.9:
            validation_level = FieldValidationLevel.EXCELLENT
        elif confidence >= 0.7:
            validation_level = FieldValidationLevel.HIGH
        elif confidence >= 0.5:
            validation_level = FieldValidationLevel.MEDIUM
        elif confidence >= 0.3:
            validation_level = FieldValidationLevel.LOW
        else:
            validation_level = FieldValidationLevel.INVALID
        
        return FieldScore(
            field_name="nom_expert",
            raw_value=value,
            validated_value=validated_value,
            confidence=confidence,
            validation_level=validation_level,
            penalty_reasons=penalty_reasons,
            bonus_reasons=bonus_reasons,
            weight=self.field_weights["nom_expert"]
        )
    
    def _validate_email(self, value: str) -> FieldScore:
        """Validation de l'email"""
        penalty_reasons = []
        bonus_reasons = []
        confidence = 0.0
        validation_level = FieldValidationLevel.INVALID
        validated_value = value.strip().lower() if value else ""
        
        if not validated_value:
            penalty_reasons.append("Email manquant")
        else:
            # Pattern email strict
            email_pattern = r'^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}
            
            if re.match(email_pattern, validated_value):
                confidence = 0.9
                bonus_reasons.append("Format email valide")
                validation_level = FieldValidationLevel.EXCELLENT
                
                # Bonus pour domaines mauritaniens/africains
                if any(domain in validated_value for domain in ['supnum.mr', '.mr', 'univ-nkc.mr']):
                    bonus_reasons.append("Domaine mauritanien")
                    confidence += 0.05
                
                # Vérification de cohérence (pas d'email générique)
                generic_emails = ['test@', 'example@', 'user@', 'admin@']
                if any(generic in validated_value for generic in generic_emails):
                    penalty_reasons.append("Email générique détecté")
                    confidence = max(0.0, confidence - 0.3)
            else:
                penalty_reasons.append("Format email invalide")
                validation_level = FieldValidationLevel.INVALID
        
        return FieldScore(
            field_name="email",
            raw_value=value,
            validated_value=validated_value,
            confidence=confidence,
            validation_level=validation_level,
            penalty_reasons=penalty_reasons,
            bonus_reasons=bonus_reasons,
            weight=self.field_weights["email"]
        )
    
    def _validate_telephone(self, value: str) -> FieldScore:
        """Validation du téléphone mauritanien"""
        penalty_reasons = []
        bonus_reasons = []
        confidence = 0.0
        validation_level = FieldValidationLevel.INVALID
        validated_value = value.strip() if value else ""
        
        if not validated_value:
            penalty_reasons.append("Téléphone manquant")
        else:
            # Nettoyer le numéro
            clean_phone = re.sub(r'[^\d]', '', validated_value)
            
            # Supprimer préfixes internationaux mauritaniens
            if clean_phone.startswith('00222'):
                clean_phone = clean_phone[5:]
            elif clean_phone.startswith('222'):
                clean_phone = clean_phone[3:]
            
            # Validation longueur et format mauritanien
            if len(clean_phone) == 8 and clean_phone.isdigit():
                # Vérifier que ça commence par 2, 3, ou 4 (préfixes mauritaniens mobiles)
                if clean_phone[0] in ['2', '3', '4']:
                    confidence = 0.95
                    validation_level = FieldValidationLevel.EXCELLENT
                    # Formatter proprement
                    validated_value = f"{clean_phone[0:2]} {clean_phone[2:4]} {clean_phone[4:6]} {clean_phone[6:8]}"
                    bonus_reasons.append("Format mauritanien valide")
                else:
                    confidence = 0.7
                    validation_level = FieldValidationLevel.HIGH
                    validated_value = f"{clean_phone[0:2]} {clean_phone[2:4]} {clean_phone[4:6]} {clean_phone[6:8]}"
                    penalty_reasons.append("Préfixe mauritanien inhabituel")
            elif len(clean_phone) > 8:
                penalty_reasons.append("Numéro trop long")
                confidence = 0.3
                validation_level = FieldValidationLevel.LOW
            elif len(clean_phone) < 8:
                penalty_reasons.append("Numéro trop court")
                confidence = 0.2
                validation_level = FieldValidationLevel.LOW
            else:
                penalty_reasons.append("Format de numéro invalide")
        
        return FieldScore(
            field_name="telephone",
            raw_value=value,
            validated_value=validated_value,
            confidence=confidence,
            validation_level=validation_level,
            penalty_reasons=penalty_reasons,
            bonus_reasons=bonus_reasons,
            weight=self.field_weights["telephone"]
        )
    
    def _validate_date_naissance(self, value: str) -> FieldScore:
        """Validation de la date de naissance"""
        penalty_reasons = []
        bonus_reasons = []
        confidence = 0.0
        validation_level = FieldValidationLevel.INVALID
        validated_value = value.strip() if value else ""
        
        if not validated_value:
            penalty_reasons.append("Date de naissance manquante")
        else:
            # Patterns de dates supportés
            date_patterns = [
                (r'^(\d{2})[-/](\d{2})[-/](\d{4}), 'DD-MM-YYYY'),  # 02-01-1978
                (r'^(\d{4})[-/](\d{2})[-/](\d{2}), 'YYYY-MM-DD'),  # 1978-01-02
                (r'^(\d{1,2})\s+(\w+)\s+(\d{4}), 'DD Month YYYY') # 2 janvier 1978
            ]
            
            date_found = False
            for pattern, format_name in date_patterns:
                match = re.match(pattern, validated_value)
                if match:
                    date_found = True
                    bonus_reasons.append(f"Format {format_name} reconnu")
                    
                    # Extraire l'année pour validation
                    if format_name == 'DD-MM-YYYY':
                        year = int(match.group(3))
                    elif format_name == 'YYYY-MM-DD':
                        year = int(match.group(1))
                    else:  # DD Month YYYY
                        year = int(match.group(3))
                    
                    # Validation de l'année (plausible pour un consultant)
                    current_year = 2024
                    age = current_year - year
                    
                    if 20 <= age <= 70:  # Âge raisonnable pour un consultant
                        confidence = 0.9
                        validation_level = FieldValidationLevel.EXCELLENT
                        bonus_reasons.append(f"Âge cohérent ({age} ans)")
                    elif 18 <= age <= 80:
                        confidence = 0.7
                        validation_level = FieldValidationLevel.HIGH
                        penalty_reasons.append("Âge en bordure de plausibilité")
                    else:
                        confidence = 0.3
                        validation_level = FieldValidationLevel.LOW
                        penalty_reasons.append("Âge non plausible")
                    
                    break
            
            if not date_found:
                penalty_reasons.append("Format de date non reconnu")
                confidence = 0.1
        
        return FieldScore(
            field_name="date_naissance",
            raw_value=value,
            validated_value=validated_value,
            confidence=confidence,
            validation_level=validation_level,
            penalty_reasons=penalty_reasons,
            bonus_reasons=bonus_reasons,
            weight=self.field_weights["date_naissance"]
        )
    
    def _validate_pays_residence(self, value: str) -> FieldScore:
        """Validation du pays de résidence"""
        penalty_reasons = []
        bonus_reasons = []
        confidence = 0.0
        validation_level = FieldValidationLevel.INVALID
        validated_value = value.strip() if value else ""
        
        if not validated_value:
            penalty_reasons.append("Pays de résidence manquant")
        else:
            # Pays/régions attendus pour consultants Richat
            preferred_countries = ['mauritanie', 'sénégal', 'mali', 'maroc', 'tunisia']
            other_valid_countries = ['france', 'canada', 'emirates', 'qatar', 'saudi']
            
            value_lower = validated_value.lower()
            
            if any(country in value_lower for country in preferred_countries):
                confidence = 0.9
                validation_level = FieldValidationLevel.EXCELLENT
                bonus_reasons.append("Pays prioritaire Richat")
            elif any(country in value_lower for country in other_valid_countries):
                confidence = 0.7
                validation_level = FieldValidationLevel.HIGH
                bonus_reasons.append("Pays valide")
            elif len(validated_value) > 2:
                confidence = 0.5
                validation_level = FieldValidationLevel.MEDIUM
                bonus_reasons.append("Pays spécifié")
            else:
                penalty_reasons.append("Pays non spécifique")
                confidence = 0.2
        
        return FieldScore(
            field_name="pays_residence",
            raw_value=value,
            validated_value=validated_value,
            confidence=confidence,
            validation_level=validation_level,
            penalty_reasons=penalty_reasons,
            bonus_reasons=bonus_reasons,
            weight=self.field_weights.get("pays_residence", 3.0)
        )
    
    def validate_content_sections(self, extracted_data: Dict) -> Dict[str, FieldScore]:
        """Valider les sections de contenu"""
        section_scores = {}
        
        # Validation expérience
        experience = extracted_data.get('experience', [])
        section_scores['experience'] = self._validate_experience_section(experience)
        
        # Validation éducation
        education = extracted_data.get('education', [])
        section_scores['education'] = self._validate_education_section(education)
        
        # Validation compétences
        skills = extracted_data.get('skills', [])
        section_scores['skills'] = self._validate_skills_section(skills)
        
        # Validation langues
        languages = extracted_data.get('languages', [])
        section_scores['languages'] = self._validate_languages_section(languages)
        
        # Validation résumé profil
        profile_summary = extracted_data.get('profile_summary', '')
        section_scores['profile_summary'] = self._validate_profile_summary(profile_summary)
        
        return section_scores
    
    def _validate_experience_section(self, experience: List[Dict]) -> FieldScore:
        """Valider la section expérience"""
        penalty_reasons = []
        bonus_reasons = []
        confidence = 0.0
        validation_level = FieldValidationLevel.INVALID
        
        if not experience:
            penalty_reasons.append("Aucune expérience professionnelle")
        else:
            # Compter les expériences non génériques
            valid_experiences = 0
            total_experiences = len(experience)
            
            for exp in experience:
                is_generic = self._is_generic_experience(exp)
                if not is_generic:
                    valid_experiences += 1
                else:
                    penalty_reasons.append("Expérience générique détectée")
            
            if valid_experiences > 0:
                confidence = min(0.9, (valid_experiences / total_experiences) * 0.8 + 0.1)
                
                if valid_experiences >= 3:
                    bonus_reasons.append(f"{valid_experiences} expériences détaillées")
                    validation_level = FieldValidationLevel.EXCELLENT
                elif valid_experiences >= 2:
                    bonus_reasons.append(f"{valid_experiences} expériences valides")
                    validation_level = FieldValidationLevel.HIGH
                else:
                    validation_level = FieldValidationLevel.MEDIUM
            else:
                penalty_reasons.append("Toutes les expériences sont génériques")
                confidence = 0.2
                validation_level = FieldValidationLevel.LOW
        
        return FieldScore(
            field_name="experience",
            raw_value=str(len(experience)),
            validated_value=f"{len(experience)} entrées",
            confidence=confidence,
            validation_level=validation_level,
            penalty_reasons=penalty_reasons,
            bonus_reasons=bonus_reasons,
            weight=self.field_weights["experience"]
        )
    
    def _is_generic_experience(self, exp: Dict) -> bool:
        """Vérifier si une expérience est générique"""
        generic_indicators = [
            'projet personnel', 'développeur/consultant', 'consultant',
            'à préciser', 'à compléter', 'développement d\'applications',
            'projets techniques'
        ]
        
        exp_text = ' '.join(str(v).lower() for v in exp.values())
        return any(indicator in exp_text for indicator in generic_indicators)
    
    def _validate_skills_section(self, skills: List[str]) -> FieldScore:
        """Valider la section compétences"""
        penalty_reasons = []
        bonus_reasons = []
        confidence = 0.0
        validation_level = FieldValidationLevel.INVALID
        
        if not skills:
            penalty_reasons.append("Aucune compétence listée")
        else:
            # Catégoriser les compétences
            tech_skills = self._count_tech_skills(skills)
            soft_skills = self._count_soft_skills(skills)
            domain_skills = self._count_domain_skills(skills)
            
            total_quality_skills = tech_skills + soft_skills + domain_skills
            
            if total_quality_skills >= 8:
                confidence = 0.9
                validation_level = FieldValidationLevel.EXCELLENT
                bonus_reasons.append(f"{total_quality_skills} compétences de qualité")
            elif total_quality_skills >= 5:
                confidence = 0.7
                validation_level = FieldValidationLevel.HIGH
                bonus_reasons.append(f"{total_quality_skills} compétences identifiées")
            elif total_quality_skills >= 3:
                confidence = 0.5
                validation_level = FieldValidationLevel.MEDIUM
            else:
                confidence = 0.3
                validation_level = FieldValidationLevel.LOW
                penalty_reasons.append("Peu de compétences spécialisées")
        
        return FieldScore(
            field_name="skills",
            raw_value=str(len(skills)),
            validated_value=f"{len(skills)} compétences",
            confidence=confidence,
            validation_level=validation_level,
            penalty_reasons=penalty_reasons,
            bonus_reasons=bonus_reasons,
            weight=self.field_weights["skills"]
        )
    
    def _count_tech_skills(self, skills: List[str]) -> int:
        """Compter les compétences techniques"""
        tech_keywords = [
            'python', 'java', 'javascript', 'php', 'sql', 'html', 'css',
            'react', 'django', 'flutter', 'mongodb', 'mysql', 'oracle',
            'linux', 'git', 'docker', 'kubernetes'
        ]
        return sum(1 for skill in skills 
                  if any(tech in skill.lower() for tech in tech_keywords))
    
    def _count_soft_skills(self, skills: List[str]) -> int:
        """Compter les compétences soft"""
        soft_keywords = [
            'management', 'leadership', 'communication', 'team', 'project',
            'analysis', 'problem solving', 'négociation', 'formation'
        ]
        return sum(1 for skill in skills 
                  if any(soft in skill.lower() for soft in soft_keywords))
    
    def _count_domain_skills(self, skills: List[str]) -> int:
        """Compter les compétences métier"""
        domain_keywords = [
            'finance', 'banking', 'accounting', 'audit', 'risk',
            'business intelligence', 'data analysis', 'erp', 'crm'
        ]
        return sum(1 for skill in skills 
                  if any(domain in skill.lower() for domain in domain_keywords))
    
    def calculate_overall_quality_score(self, personal_scores: Dict[str, FieldScore], 
                                      content_scores: Dict[str, FieldScore]) -> Dict:
        """Calculer le score de qualité global"""
        
        # Scores pondérés par section
        personal_weighted_score = 0.0
        personal_total_weight = 0.0
        
        content_weighted_score = 0.0
        content_total_weight = 0.0
        
        # Calculer scores personnels
        for field_name, score in personal_scores.items():
            weighted_contribution = score.confidence * score.weight
            personal_weighted_score += weighted_contribution
            personal_total_weight += score.weight
        
        # Calculer scores de contenu
        for field_name, score in content_scores.items():
            weighted_contribution = score.confidence * score.weight
            content_weighted_score += weighted_contribution
            content_total_weight += score.weight
        
        # Normaliser les scores
        personal_avg = (personal_weighted_score / personal_total_weight) if personal_total_weight > 0 else 0
        content_avg = (content_weighted_score / content_total_weight) if content_total_weight > 0 else 0
        
        # Score global (60% contenu, 40% personnel)
        overall_score = int((content_avg * 0.6 + personal_avg * 0.4) * 100)
        
        # Collecter toutes les pénalités et bonus
        all_penalties = []
        all_bonuses = []
        
        for score in list(personal_scores.values()) + list(content_scores.values()):
            all_penalties.extend(score.penalty_reasons)
            all_bonuses.extend(score.bonus_reasons)
        
        # Appliquer pénalités globales
        penalty_adjustment = 0
        for penalty in set(all_penalties):  # Éviter doublons
            if 'générique' in penalty.lower():
                penalty_adjustment += self.penalty_weights['generic_content']
            elif 'manquant' in penalty.lower():
                penalty_adjustment += self.penalty_weights['missing_critical_info']
            elif 'invalide' in penalty.lower():
                penalty_adjustment += self.penalty_weights['invalid_format']
        
        # Appliquer bonus globaux
        bonus_adjustment = 0
        if len([b for b in all_bonuses if 'spécifique' in b.lower()]) >= 3:
            bonus_adjustment += self.bonus_weights['high_personalization']
        
        if len([b for b in all_bonuses if 'valide' in b.lower()]) >= 5:
            bonus_adjustment += self.bonus_weights['validated_all_fields']
        
        # Score final ajusté
        final_score = max(0, min(100, overall_score + penalty_adjustment + bonus_adjustment))
        
        return {
            'overall_score': final_score,
            'personal_score': int(personal_avg * 100),
            'content_score': int(content_avg * 100),
            'penalty_adjustment': penalty_adjustment,
            'bonus_adjustment': bonus_adjustment,
            'penalties': list(set(all_penalties)),
            'bonuses': list(set(all_bonuses)),
            'score_breakdown': {
                'personal_weighted': personal_weighted_score,
                'content_weighted': content_weighted_score,
                'total_weight': personal_total_weight + content_total_weight
            }
        }

# Test du système de scoring
def test_quality_scorer():
    """Test du système de scoring qualité"""
    scorer = RichatQualityScorer()
    
    # Test données réelles problématiques
    test_data = {
        'personal_info': {
            'nom_expert': 'AICHETOU CHEIKHNA',  # Problème: tout en majuscules
            'email': '22056@supnum.mr',         # Bon
            'telephone': '38 31 78 51',         # Bon format mauritanien
            'date_naissance': '',               # Problème: manquant
            'pays_residence': ''                # Problème: manquant
        },
        'experience': [
            {
                'employeur': 'Projet Personnel',      # Problème: générique
                'poste': 'Développeur/Consultant',   # Problème: générique
                'description': 'Développement d\'applications et projets techniques'  # Générique
            }
        ],
        'skills': ['PHP', 'Python', 'HTML', 'MySQL', 'MongoDB', 'Flutter', 'Django', 'React'],
        'profile_summary': 'Consultant professionnel avec expertise dans son domaine.'  # Générique
    }
    
    # Validation des champs personnels
    personal_scores = {}
    for field_name, value in test_data['personal_info'].items():
        personal_scores[field_name] = scorer.validate_personal_info_field(field_name, value)
    
    # Validation du contenu
    content_scores = scorer.validate_content_sections(test_data)
    
    # Calcul du score global
    quality_results = scorer.calculate_overall_quality_score(personal_scores, content_scores)
    
    return {
        'personal_scores': personal_scores,
        'content_scores': content_scores,
        'quality_results': quality_results
    }

if __name__ == "__main__":
    print("=== SYSTÈME DE SCORING QUALITÉ RICHAT ===")
    results = test_quality_scorer()
    
    print(f"\n📊 RÉSULTATS DU TEST:")
    print(f"Score global: {results['quality_results']['overall_score']}%")
    print(f"Score personnel: {results['quality_results']['personal_score']}%")
    print(f"Score contenu: {results['quality_results']['content_score']}%")
    
    print(f"\n❌ PÉNALITÉS DÉTECTÉES:")
    for penalty in results['quality_results']['penalties']:
        print(f"  • {penalty}")
    
    print(f"\n✅ BONUS ACCORDÉS:")
    for bonus in results['quality_results']['bonuses']:
        print(f"  • {bonus}")
    
    print(f"\n🔍 DÉTAIL PAR CHAMP:")
    for field_name, score in results['personal_scores'].items():
        print(f"  {field_name}: {score.confidence:.2f} ({score.validation_level.name})")
        if score.penalty_reasons:
            print(f"    Pénalités: {', '.join(score.penalty_reasons)}")
        if score.bonus_reasons:
            print(f"    Bonus: {', '.join(score.bonus_reasons)}")