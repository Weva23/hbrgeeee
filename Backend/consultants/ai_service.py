import spacy
import re
import json
import openai
import Levenshtein
from django.core.cache import cache
from .competences_data import ALL_SKILLS


class AIService:
    """Service d'intelligence artificielle pour l'analyse des offres et des consultants"""

    def __init__(self):
        try:
            self.nlp = spacy.load("fr_core_news_md")
        except:
            self.nlp = None
            print("Modèle spaCy non disponible")

    def analyze_offer(self, appel_offre):
        """Analyse complète d'un appel d'offre"""
        cache_key = f"ai_analysis_{appel_offre.id}"
        cached = cache.get(cache_key)

        if cached:
            return cached

        # Fusion des analyses de base et avancée
        basic_analysis = self.basic_analyze_description(appel_offre.description)
        advanced_analysis = self.openai_analyze_description(appel_offre.description)

        # Combinaison des résultats
        result = {
            'keywords': basic_analysis.get('keywords', []),
            'entities': basic_analysis.get('entities', []),
            'domaine_principal': advanced_analysis.get('domaine_principal', basic_analysis.get('domaine_principal')),
            'competences_requises': advanced_analysis.get('competences_requises', [])
        }

        # Mise en cache pour 24h
        cache.set(cache_key, result, 86400)

        return result

    # Autres méthodes d'analyse...