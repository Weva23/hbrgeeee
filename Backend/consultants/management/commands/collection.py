import os
import sys
import re
import pandas as pd
from datetime import datetime, timedelta
from dateutil import parser
from pathlib import Path
from django.conf import settings
from django.core.management.base import BaseCommand
from django.utils import timezone
from django.db import models
from consultants.models import AppelOffre


class Command(BaseCommand):
    help = "Collection des appels d'offres depuis les fichiers XLSX générés par le scraping"

    def __init__(self, *args, **kwargs):
        super().__init__(*args, **kwargs)
        
        # Dossier contenant les fichiers XLSX
        self.SCRAPED_DATA_DIR = Path(settings.BASE_DIR).parent / 'Backend' / 'scraped_data'
        
        # Liste des fichiers à traiter
        self.FICHIERS = [
            self.SCRAPED_DATA_DIR / 'betaconseils.xlsx',
            self.SCRAPED_DATA_DIR / 'snim_offres.xlsx',
            self.SCRAPED_DATA_DIR / 'WARDIP_FINAL_COMPLET.xlsx',
            self.SCRAPED_DATA_DIR / 'somelec.xlsx',
            self.SCRAPED_DATA_DIR / 'MTNIMA_FINAL_COMPLET.xlsx',
            self.SCRAPED_DATA_DIR / 'marchespublics_mauritanie.xlsx',
            self.SCRAPED_DATA_DIR / 'rimtic.xlsx',
        ]

        # Dictionnaire de conversion des mois français
        self.MOIS_FR_EN = {
            'janvier': 'January', 'février': 'February', 'mars': 'March',
            'avril': 'April', 'mai': 'May', 'juin': 'June',
            'juillet': 'July', 'août': 'August', 'septembre': 'September',
            'octobre': 'October', 'novembre': 'November', 'décembre': 'December',
            'janv.': 'January', 'févr.': 'February', 'avr.': 'April',
            'juil.': 'July', 'sept.': 'September', 'oct.': 'October',
            'nov.': 'November', 'déc.': 'December'
        }

    def handle(self, *args, **options):
        self.stdout.write("🚀 Début de la collection des appels d'offres depuis les fichiers XLSX...")
        
        # Vérifier que le dossier existe
        if not self.SCRAPED_DATA_DIR.exists():
            self.stdout.write(f"❌ Dossier non trouvé: {self.SCRAPED_DATA_DIR}")
            self.stdout.write("💡 Exécutez d'abord le scraping pour générer les fichiers XLSX")
            return
        
        # Charger et valider les fichiers
        dfs = self.load_and_validate_files()
        if not dfs:
            self.stdout.write("❌ Aucun fichier valide trouvé")
            return

        # Combiner tous les DataFrames
        df_final = self.process_data(pd.concat(dfs, ignore_index=True))
        
        # Importer les données
        self.import_data_using_django_orm(df_final)

    def load_and_validate_files(self):
        """Charge et valide tous les fichiers XLSX disponibles"""
        dfs = []
        files_found = 0
        
        for file_path in self.FICHIERS:
            try:
                if not file_path.exists():
                    self.stdout.write(f"⚠️ Fichier non trouvé: {file_path.name}")
                    continue

                files_found += 1
                self.stdout.write(f"📂 Chargement de {file_path.name}...")
                
                # Lire le fichier Excel
                df = pd.read_excel(file_path, engine='openpyxl')
                
                if df.empty:
                    self.stdout.write(f"⚠️ Fichier vide: {file_path.name}")
                    continue

                # Préparer le DataFrame
                df = self.prepare_dataframe(df, file_path.name)
                dfs.append(df)
                
                self.stdout.write(f"✅ {file_path.name} chargé: {len(df)} lignes")

            except Exception as e:
                self.stdout.write(f"❌ Erreur avec {file_path.name}: {str(e)}")
                continue

        if files_found == 0:
            self.stdout.write("❌ Aucun fichier XLSX trouvé dans le dossier scraped_data")
            self.stdout.write("💡 Exécutez d'abord: python manage.py scraping")
            return None
            
        return dfs if dfs else None

    def prepare_dataframe(self, df, filename):
        """Prépare et nettoie le DataFrame"""
        
        # Afficher les colonnes disponibles pour diagnostic
        self.stdout.write(f"   Colonnes dans {filename}: {list(df.columns)}")
        
        # Mapping flexible des colonnes
        column_mapping = {
            # Variations du titre
            'titre': 'titre',
            'Titre': 'titre', 
            'TITRE': 'titre',
            'Title': 'titre',
            
            # Variations de la date de publication
            'date_de_publication': 'date_de_publication',
            'Date publication': 'date_de_publication',
            'Date de publication': 'date_de_publication',
            'DATE_DE_PUBLICATION': 'date_de_publication',
            'Publication Date': 'date_de_publication',
            
            # Variations du client
            'client': 'client',
            'Client': 'client',
            'CLIENT': 'client',
            'Organisme': 'client',
            'Organisation': 'client',
            
            # Variations du type
            'type_d_appel_d_offre': 'type_d_appel_d_offre',
            'Type': 'type_d_appel_d_offre',
            'TYPE': 'type_d_appel_d_offre',
            'Type d\'appel d\'offre': 'type_d_appel_d_offre',
            'Category': 'type_d_appel_d_offre',
            
            # Variations de la date limite
            'date_limite': 'date_limite',
            'Date limite': 'date_limite',
            'Date Limite': 'date_limite',
            'DATE_LIMITE': 'date_limite',
            'Deadline': 'date_limite',
            'Date de clôture': 'date_limite',
            
            # Variations des documents
            'documents': 'documents',
            'Documents': 'documents',
            'DOCUMENTS': 'documents',
            'Fichiers': 'documents',
            'Files': 'documents',
            
            # Variations du lien
            'lien_site': 'lien_site',
            'Lien': 'lien_site',
            'LIEN_SITE': 'lien_site',
            'URL': 'lien_site',
            'Link': 'lien_site',
            
            # Variations de la description
            'description': 'description',
            'Description': 'description',
            'DESCRIPTION': 'description',
            'Details': 'description',
            
            # Variations des critères d'évaluation
            'critere_evaluation': 'critere_evaluation',
            'Critère évaluation': 'critere_evaluation',
            'Critères évaluation': 'critere_evaluation',
            'Criteres evaluation': 'critere_evaluation',
            'CRITERE_EVALUATION': 'critere_evaluation',
        }

        # Renommer les colonnes selon le mapping
        df = df.rename(columns=column_mapping)

        # Parser les dates
        for date_col in ['date_de_publication', 'date_limite']:
            if date_col in df.columns:
                df[date_col] = df[date_col].apply(self.parse_date)

        return df

    def parse_date(self, val):
        """Parse une date dans différents formats"""
        if pd.isna(val) or val is None:
            return None

        try:
            # Si c'est déjà un datetime
            if isinstance(val, (pd.Timestamp, datetime)):
                return val.date()

            text = str(val).strip()
            
            # Ignorer les valeurs N/A
            if text.upper() in ['N/A', 'NA', 'NULL', '', 'NAN']:
                return None

            # Nettoyer le texte
            text = re.sub(r'à\s*\d{1,2}:\d{2}', '', text)

            # Remplacer les mois français
            for fr, en in self.MOIS_FR_EN.items():
                text = re.sub(fr, en, text, flags=re.IGNORECASE)

            # Différents formats de date
            if re.match(r'^\d{1,2}/\d{1,2}/\d{4}$', text):
                return datetime.strptime(text, '%d/%m/%Y').date()

            if re.match(r'^\d{4}-\d{2}-\d{2}$', text):
                return datetime.strptime(text, '%Y-%m-%d').date()

            if re.match(r'^\d{1,2}-\d{1,2}-\d{4}$', text):
                return datetime.strptime(text, '%d-%m-%Y').date()

            try:
                return datetime.strptime(text, "%B %d, %Y").date()
            except:
                pass

            # Utiliser dateutil comme dernier recours
            return parser.parse(text, dayfirst=True).date()

        except Exception:
            self.stdout.write(f"⚠️ Impossible de parser la date: {val}")
            return None

    def process_data(self, df):
        """Nettoie et prépare les données pour l'importation"""
        
        self.stdout.write(f"📊 Traitement de {len(df)} lignes au total...")
        
        # S'assurer que les colonnes requises existent
        required_cols = [
            'titre', 'date_de_publication', 'client', 'type_d_appel_d_offre', 
            'date_limite', 'documents', 'lien_site', 'description', 'critere_evaluation'
        ]
        
        for col in required_cols:
            if col not in df.columns:
                df[col] = None

        # Nettoyer les données
        df = df.where(pd.notnull(df), None)
        
        # Nettoyer le titre (obligatoire)
        if 'titre' in df.columns:
            df['titre'] = df['titre'].astype(str).str.strip()
            # Supprimer les lignes sans titre valide
            df = df[~df['titre'].isin(['nan', 'None', '', 'N/A'])]
            df = df[df['titre'].str.len() > 5]  # Titre minimum 5 caractères

        # Nettoyer les champs texte
        text_fields = ['client', 'type_d_appel_d_offre', 'description', 'critere_evaluation', 'documents']
        for field in text_fields:
            if field in df.columns:
                df[field] = df[field].astype(str)
                df[field] = df[field].replace(['nan', 'N/A', 'NA', 'null', 'None'], None)
                df[field] = df[field].apply(
                    lambda x: x.strip() if isinstance(x, str) and x.strip() != '' else None
                )

        # Nettoyer les URLs
        if 'lien_site' in df.columns:
            df['lien_site'] = df['lien_site'].apply(self.clean_url)

        self.stdout.write(f"✅ Données nettoyées: {len(df)} lignes valides")
        return df

    def clean_url(self, url):
        """Nettoie et valide les URLs"""
        if pd.isna(url) or url is None:
            return None
        
        url_str = str(url).strip()
        if url_str.upper() in ['N/A', 'NA', 'NULL', '', 'NAN']:
            return None
            
        # Tronquer si trop long (max 500 caractères)
        if len(url_str) > 500:
            url_str = url_str[:497] + "..."
            
        return url_str

    def import_data_using_django_orm(self, df):
        """Importe les données via l'ORM Django"""
        
        self.stdout.write("📥 Début de l'importation des données...")
        
        success = skipped = errors = 0
        
        try:
            # Traiter chaque ligne
            for index, row in df.iterrows():
                try:
                    titre = row.get('titre')
                    if not titre or str(titre).strip() == '':
                        skipped += 1
                        continue

                    # Vérifier si l'appel d'offre existe déjà
                    filters = models.Q(titre=titre)
                    lien_site = row.get('lien_site')
                    if lien_site:
                        filters |= models.Q(lien_site=lien_site)

                    existing_ao = AppelOffre.objects.filter(filters).first()

                    if existing_ao:
                        self.stdout.write(f"⏭️ Existe déjà: {titre[:50]}...")
                        skipped += 1
                        continue

                    # Créer un nouvel appel d'offre
                    ao = AppelOffre.objects.create(
                        titre=titre,
                        date_de_publication=row.get('date_de_publication'),
                        date_limite=row.get('date_limite'),
                        client=row.get('client'),
                        type_d_appel_d_offre=row.get('type_d_appel_d_offre'),
                        description=row.get('description'),
                        critere_evaluation=row.get('critere_evaluation'),
                        documents=row.get('documents'),
                        lien_site=lien_site
                    )
                    
                    success += 1
                    self.stdout.write(f"✅ #{success}: {titre[:50]}...")
                    
                    # Afficher les détails périodiquement
                    if success % 10 == 0:
                        self.stdout.write(f"📊 Progression: {success} créés, {skipped} ignorés")

                except Exception as e:
                    errors += 1
                    self.stdout.write(f"⚠️ Erreur ligne {index}: {str(e)}")
                    continue

            # Résultats finaux
            self.stdout.write("=" * 60)
            self.stdout.write("🎉 COLLECTION TERMINÉE!")
            self.stdout.write("=" * 60)
            self.stdout.write(f"✅ Appels d'offres créés: {success}")
            self.stdout.write(f"⏭️ Doublons ignorés: {skipped}")
            self.stdout.write(f"❌ Erreurs: {errors}")
            self.stdout.write(f"📊 Total traité: {success + skipped + errors}")
            self.stdout.write("=" * 60)

            if success > 0:
                self.stdout.write("🎯 Données collectées avec succès!")
                self.stdout.write("💡 Vous pouvez maintenant consulter les appels d'offres dans l'admin Django")

        except Exception as e:
            self.stdout.write(f"❌ Erreur globale d'importation: {str(e)}")
            import traceback
            traceback.print_exc()

    def add_arguments(self, parser):
        """Arguments optionnels pour la commande"""
        parser.add_argument(
            '--file',
            type=str,
            help='Traiter un fichier spécifique (nom du fichier sans extension)'
        )
        parser.add_argument(
            '--dry-run',
            action='store_true',
            help='Simulation sans insertion en base'
        )