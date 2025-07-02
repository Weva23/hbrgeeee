# views_cv_storage.py - Gestionnaire complet pour les CVs standardisés
import os
import json
import shutil
from pathlib import Path
from datetime import datetime, timedelta
from typing import Dict, List, Optional
import logging

from django.conf import settings
from django.http import JsonResponse, HttpResponse, Http404
from django.views.decorators.csrf import csrf_exempt
from django.views.decorators.http import require_http_methods
from django.core.paginator import Paginator
from django.utils.timezone import now

logger = logging.getLogger(__name__)

class CVStorageManager:
    """Gestionnaire pour le stockage et la gestion des CVs standardisés"""
    
    def __init__(self):
        self.setup_storage_directories()
    
    def setup_storage_directories(self):
        """Créer les répertoires de stockage nécessaires"""
        try:
            # Dossier principal des CVs standardisés
            self.cv_dir = Path(settings.MEDIA_ROOT) / 'standardized_cvs'
            self.cv_dir.mkdir(parents=True, exist_ok=True)
            
            # Dossier des métadonnées
            self.metadata_dir = self.cv_dir / 'metadata'
            self.metadata_dir.mkdir(exist_ok=True)
            
            # Dossier d'archives (anciens CVs)
            self.archive_dir = self.cv_dir / 'archive'
            self.archive_dir.mkdir(exist_ok=True)
            
            # Dossier des logs spécifiques
            self.logs_dir = self.cv_dir / 'logs'
            self.logs_dir.mkdir(exist_ok=True)
            
            logger.info(f"✅ Dossiers de stockage CV initialisés dans: {self.cv_dir}")
            
        except Exception as e:
            logger.error(f"❌ Erreur création dossiers de stockage: {e}")
            # Fallback
            self.cv_dir = Path.cwd() / 'media' / 'standardized_cvs'
            self.cv_dir.mkdir(parents=True, exist_ok=True)
            self.metadata_dir = self.cv_dir / 'metadata'
            self.metadata_dir.mkdir(exist_ok=True)
    
    def list_cv_files(self, consultant_id: str = None) -> List[Dict]:
        """Lister les fichiers CV avec métadonnées"""
        try:
            cv_files = []
            
            # Chercher les fichiers PDF dans le dossier
            pattern = "*.pdf"
            if consultant_id:
                pattern = f"*{consultant_id}*.pdf"
            
            for cv_file in self.cv_dir.glob(pattern):
                if cv_file.is_file() and cv_file.name.startswith('CV_Richat_'):
                    # Rechercher métadonnées correspondantes
                    metadata = self.get_metadata_for_file(cv_file.name)
                    
                    file_info = {
                        'filename': cv_file.name,
                        'filepath': str(cv_file),
                        'file_size': cv_file.stat().st_size,
                        'created_at': datetime.fromtimestamp(cv_file.stat().st_mtime).isoformat(),
                        'file_url': f"/media/standardized_cvs/{cv_file.name}",
                        'consultant_id': metadata.get('consultant_id', 'unknown'),
                        'consultant_name': metadata.get('consultant_name', 'Unknown'),
                        'quality_score': metadata.get('quality_score', 0),
                        'compliance_score': metadata.get('format_compliance_score', 0),
                        'format_detected': metadata.get('format_detected', 'unknown'),
                        'processing_method': metadata.get('processing_method', 'unknown'),
                        'original_filename': metadata.get('original_filename', 'unknown'),
                        'file_hash': metadata.get('file_hash', ''),
                        'richat_features': metadata.get('richat_features', {}),
                        'extracted_data_summary': metadata.get('extracted_data_summary', {})
                    }
                    cv_files.append(file_info)
            
            # Trier par date de création (plus récent en premier)
            cv_files.sort(key=lambda x: x['created_at'], reverse=True)
            
            logger.info(f"📋 Listage CV: {len(cv_files)} fichiers trouvés pour consultant_id={consultant_id or 'all'}")
            return cv_files
            
        except Exception as e:
            logger.error(f"❌ Erreur listage CVs: {e}")
            return []
    
    def get_metadata_for_file(self, filename: str) -> Dict:
        """Récupérer les métadonnées pour un fichier CV"""
        try:
            # Construire le nom du fichier de métadonnées
            base_name = filename.replace('CV_Richat_', '').replace('.pdf', '')
            metadata_pattern = f"metadata_*{base_name}*.json"
            
            for metadata_file in self.metadata_dir.glob(metadata_pattern):
                with open(metadata_file, 'r', encoding='utf-8') as f:
                    return json.load(f)
            
            # Si pas de métadonnées trouvées, retourner un dictionnaire vide
            return {}
            
        except Exception as e:
            logger.warning(f"⚠️ Erreur lecture métadonnées pour {filename}: {e}")
            return {}
    
    def get_cv_file(self, consultant_id: str, filename: str = None) -> Optional[Path]:
        """Récupérer un fichier CV spécifique"""
        try:
            if filename:
                # Fichier spécifique demandé
                filepath = self.cv_dir / filename
                if filepath.exists() and filepath.is_file():
                    return filepath
            else:
                # Récupérer le CV le plus récent pour ce consultant
                cv_files = self.list_cv_files(consultant_id)
                if cv_files:
                    latest_cv = cv_files[0]  # Le plus récent
                    return Path(latest_cv['filepath'])
            
            return None
            
        except Exception as e:
            logger.error(f"❌ Erreur récupération CV pour {consultant_id}: {e}")
            return None
    
    def archive_old_cvs(self, consultant_id: str, keep_latest: int = 3) -> Dict:
        """Archiver les anciens CVs en gardant seulement les plus récents"""
        try:
            cv_files = self.list_cv_files(consultant_id)
            
            if len(cv_files) <= keep_latest:
                return {
                    'success': True,
                    'message': f'Aucun archivage nécessaire (seulement {len(cv_files)} fichiers)',
                    'archived_count': 0
                }
            
            # Fichiers à archiver
            files_to_archive = cv_files[keep_latest:]
            archived_count = 0
            
            for file_info in files_to_archive:
                src_path = Path(file_info['filepath'])
                dst_path = self.archive_dir / src_path.name
                
                # Déplacer le fichier
                shutil.move(str(src_path), str(dst_path))
                
                # Déplacer les métadonnées si elles existent
                metadata_file = self.metadata_dir / f"metadata_{src_path.stem.replace('CV_Richat_', '')}.json"
                if metadata_file.exists():
                    metadata_dst = self.archive_dir / metadata_file.name
                    shutil.move(str(metadata_file), str(metadata_dst))
                
                archived_count += 1
            
            logger.info(f"📦 Archivage terminé: {archived_count} fichiers archivés pour {consultant_id}")
            
            return {
                'success': True,
                'message': f'{archived_count} anciens CVs archivés avec succès',
                'archived_count': archived_count,
                'remaining_count': len(cv_files) - archived_count
            }
            
        except Exception as e:
            logger.error(f"❌ Erreur archivage CVs: {e}")
            return {
                'success': False,
                'error': str(e),
                'archived_count': 0
            }
    
    def cleanup_old_files(self, days_old: int = 30) -> Dict:
        """Nettoyer les fichiers anciens du dossier principal"""
        try:
            cutoff_date = datetime.now() - timedelta(days=days_old)
            cleaned_files = []
            
            for cv_file in self.cv_dir.glob("CV_Richat_*.pdf"):
                file_mtime = datetime.fromtimestamp(cv_file.stat().st_mtime)
                
                if file_mtime < cutoff_date:
                    # Déplacer vers archive
                    dst_path = self.archive_dir / cv_file.name
                    shutil.move(str(cv_file), str(dst_path))
                    cleaned_files.append(cv_file.name)
            
            logger.info(f"🧹 Nettoyage terminé: {len(cleaned_files)} fichiers anciens archivés")
            
            return {
                'success': True,
                'message': f'{len(cleaned_files)} fichiers anciens nettoyés',
                'cleaned_files': cleaned_files,
                'cutoff_date': cutoff_date.isoformat()
            }
            
        except Exception as e:
            logger.error(f"❌ Erreur nettoyage: {e}")
            return {
                'success': False,
                'error': str(e),
                'cleaned_files': []
            }
    
    def get_storage_stats(self) -> Dict:
        """Obtenir les statistiques de stockage"""
        try:
            # Compter les fichiers
            cv_files = list(self.cv_dir.glob("CV_Richat_*.pdf"))
            archived_files = list(self.archive_dir.glob("CV_Richat_*.pdf"))
            metadata_files = list(self.metadata_dir.glob("metadata_*.json"))
            
            # Calculer les tailles
            cv_size = sum(f.stat().st_size for f in cv_files)
            archive_size = sum(f.stat().st_size for f in archived_files)
            metadata_size = sum(f.stat().st_size for f in metadata_files)
            
            # Consultants uniques
            consultants = set()
            for cv_file in cv_files:
                metadata = self.get_metadata_for_file(cv_file.name)
                if metadata.get('consultant_id'):
                    consultants.add(metadata['consultant_id'])
            
            # Moyennes de qualité
            quality_scores = []
            compliance_scores = []
            for cv_file in cv_files:
                metadata = self.get_metadata_for_file(cv_file.name)
                if metadata.get('quality_score'):
                    quality_scores.append(metadata['quality_score'])
                if metadata.get('format_compliance_score'):
                    compliance_scores.append(metadata['format_compliance_score'])
            
            avg_quality = sum(quality_scores) / len(quality_scores) if quality_scores else 0
            avg_compliance = sum(compliance_scores) / len(compliance_scores) if compliance_scores else 0
            
            return {
                'success': True,
                'storage_path': str(self.cv_dir),
                'total_cv_files': len(cv_files),
                'archived_files': len(archived_files),
                'metadata_files': len(metadata_files),
                'unique_consultants': len(consultants),
                'total_size_mb': round((cv_size + archive_size + metadata_size) / (1024 * 1024), 2),
                'cv_size_mb': round(cv_size / (1024 * 1024), 2),
                'archive_size_mb': round(archive_size / (1024 * 1024), 2),
                'metadata_size_mb': round(metadata_size / (1024 * 1024), 2),
                'average_quality_score': round(avg_quality, 1),
                'average_compliance_score': round(avg_compliance, 1),
                'disk_usage': {
                    'free_space_gb': round(shutil.disk_usage(self.cv_dir).free / (1024**3), 2),
                    'total_space_gb': round(shutil.disk_usage(self.cv_dir).total / (1024**3), 2)
                }
            }
            
        except Exception as e:
            logger.error(f"❌ Erreur statistiques stockage: {e}")
            return {
                'success': False,
                'error': str(e)
            }


# Instance globale du gestionnaire
cv_storage = CVStorageManager()


# ENDPOINTS HTTP POUR LA GESTION DES CVS

@csrf_exempt
@require_http_methods(["GET"])
def list_cv_standardises(request, consultant_id: str = None):
    """Lister les CVs standardisés avec pagination"""
    try:
        # Headers CORS
        response_headers = {
            'Access-Control-Allow-Origin': '*',
            'Access-Control-Allow-Methods': 'GET, OPTIONS',
            'Access-Control-Allow-Headers': 'Content-Type, Authorization'
        }
        
        # Gestion preflight
        if request.method == 'OPTIONS':
            response = JsonResponse({'status': 'ok'})
            for key, value in response_headers.items():
                response[key] = value
            return response
        
        # Paramètres de pagination
        page = int(request.GET.get('page', 1))
        per_page = int(request.GET.get('per_page', 20))
        
        # Récupérer les CVs
        cv_files = cv_storage.list_cv_files(consultant_id)
        
        # Pagination
        paginator = Paginator(cv_files, per_page)
        page_obj = paginator.get_page(page)
        
        response_data = {
            'success': True,
            'cv_files': list(page_obj),
            'pagination': {
                'current_page': page,
                'total_pages': paginator.num_pages,
                'total_count': paginator.count,
                'per_page': per_page,
                'has_next': page_obj.has_next(),
                'has_previous': page_obj.has_previous()
            },
            'consultant_id': consultant_id,
            'storage_path': str(cv_storage.cv_dir)
        }
        
        response = JsonResponse(response_data)
        for key, value in response_headers.items():
            response[key] = value
        
        return response
        
    except Exception as e:
        logger.error(f"❌ Erreur listage CVs: {e}")
        response_data = {
            'success': False,
            'error': str(e),
            'cv_files': []
        }
        response = JsonResponse(response_data, status=500)
        
        response_headers = {
            'Access-Control-Allow-Origin': '*',
            'Access-Control-Allow-Methods': 'GET, OPTIONS',
            'Access-Control-Allow-Headers': 'Content-Type, Authorization'
        }
        for key, value in response_headers.items():
            response[key] = value
        
        return response


@csrf_exempt
@require_http_methods(["GET"])
def get_cv_standardise(request, consultant_id: str, filename: str = None):
    """Télécharger un CV standardisé spécifique"""
    try:
        # Récupérer le fichier CV
        cv_file_path = cv_storage.get_cv_file(consultant_id, filename)
        
        if not cv_file_path or not cv_file_path.exists():
            raise Http404(f"CV non trouvé pour consultant {consultant_id}")
        
        # Préparer la réponse de téléchargement
        with open(cv_file_path, 'rb') as f:
            response = HttpResponse(f.read(), content_type='application/pdf')
            response['Content-Disposition'] = f'attachment; filename="{cv_file_path.name}"'
            response['Content-Length'] = cv_file_path.stat().st_size
            
            # Headers CORS
            response['Access-Control-Allow-Origin'] = '*'
            response['Access-Control-Expose-Headers'] = 'Content-Disposition, Content-Length'
            
            return response
        
    except Http404:
        raise
    except Exception as e:
        logger.error(f"❌ Erreur téléchargement CV: {e}")
        return JsonResponse({
            'success': False,
            'error': str(e)
        }, status=500)


@csrf_exempt
@require_http_methods(["GET"])
def get_cv_metadata(request, consultant_id: str, filename: str = None):
    """Récupérer les métadonnées d'un CV"""
    try:
        response_headers = {
            'Access-Control-Allow-Origin': '*',
            'Access-Control-Allow-Methods': 'GET, OPTIONS',
            'Access-Control-Allow-Headers': 'Content-Type, Authorization'
        }
        
        if request.method == 'OPTIONS':
            response = JsonResponse({'status': 'ok'})
            for key, value in response_headers.items():
                response[key] = value
            return response
        
        # Récupérer le fichier CV
        cv_file_path = cv_storage.get_cv_file(consultant_id, filename)
        
        if not cv_file_path:
            response_data = {
                'success': False,
                'error': f'CV non trouvé pour consultant {consultant_id}'
            }
            response = JsonResponse(response_data, status=404)
            for key, value in response_headers.items():
                response[key] = value
            return response
        
        # Récupérer les métadonnées
        metadata = cv_storage.get_metadata_for_file(cv_file_path.name)
        
        response_data = {
            'success': True,
            'consultant_id': consultant_id,
            'filename': cv_file_path.name,
            'metadata': metadata,
            'file_info': {
                'size': cv_file_path.stat().st_size,
                'created_at': datetime.fromtimestamp(cv_file_path.stat().st_mtime).isoformat(),
                'path': str(cv_file_path)
            }
        }
        
        response = JsonResponse(response_data)
        for key, value in response_headers.items():
            response[key] = value
        
        return response
        
    except Exception as e:
        logger.error(f"❌ Erreur métadonnées CV: {e}")
        response_data = {
            'success': False,
            'error': str(e)
        }
        response = JsonResponse(response_data, status=500)
        
        response_headers = {
            'Access-Control-Allow-Origin': '*',
            'Access-Control-Allow-Methods': 'GET, OPTIONS',
            'Access-Control-Allow-Headers': 'Content-Type, Authorization'
        }
        for key, value in response_headers.items():
            response[key] = value
        
        return response


@csrf_exempt
@require_http_methods(["POST"])
def cleanup_cv_standardises(request):
    """Nettoyer les anciens CVs"""
    try:
        response_headers = {
            'Access-Control-Allow-Origin': '*',
            'Access-Control-Allow-Methods': 'POST, OPTIONS',
            'Access-Control-Allow-Headers': 'Content-Type, Authorization'
        }
        
        if request.method == 'OPTIONS':
            response = JsonResponse({'status': 'ok'})
            for key, value in response_headers.items():
                response[key] = value
            return response
        
        # Paramètres de nettoyage
        days_old = int(request.POST.get('days_old', 30))
        consultant_id = request.POST.get('consultant_id')
        
        if consultant_id:
            # Archiver pour un consultant spécifique
            result = cv_storage.archive_old_cvs(consultant_id)
        else:
            # Nettoyage général
            result = cv_storage.cleanup_old_files(days_old)
        
        response = JsonResponse(result)
        for key, value in response_headers.items():
            response[key] = value
        
        return response
        
    except Exception as e:
        logger.error(f"❌ Erreur nettoyage CVs: {e}")
        response_data = {
            'success': False,
            'error': str(e)
        }
        response = JsonResponse(response_data, status=500)
        
        response_headers = {
            'Access-Control-Allow-Origin': '*',
            'Access-Control-Allow-Methods': 'POST, OPTIONS',
            'Access-Control-Allow-Headers': 'Content-Type, Authorization'
        }
        for key, value in response_headers.items():
            response[key] = value
        
        return response


@csrf_exempt
@require_http_methods(["GET"])
def cv_storage_stats(request):
    """Statistiques du stockage CV"""
    try:
        response_headers = {
            'Access-Control-Allow-Origin': '*',
            'Access-Control-Allow-Methods': 'GET, OPTIONS',
            'Access-Control-Allow-Headers': 'Content-Type, Authorization'
        }
        
        if request.method == 'OPTIONS':
            response = JsonResponse({'status': 'ok'})
            for key, value in response_headers.items():
                response[key] = value
            return response
        
        # Récupérer les statistiques
        stats = cv_storage.get_storage_stats()
        
        response = JsonResponse(stats)
        for key, value in response_headers.items():
            response[key] = value
        
        return response
        
    except Exception as e:
        logger.error(f"❌ Erreur statistiques stockage: {e}")
        response_data = {
            'success': False,
            'error': str(e)
        }
        response = JsonResponse(response_data, status=500)
        
        response_headers = {
            'Access-Control-Allow-Origin': '*',
            'Access-Control-Allow-Methods': 'GET, OPTIONS',
            'Access-Control-Allow-Headers': 'Content-Type, Authorization'
        }
        for key, value in response_headers.items():
            response[key] = value
        
        return response


@csrf_exempt
@require_http_methods(["GET"])
def validate_cv_against_richat_standard(request, consultant_id: str, filename: str = None):
    """Valider un CV contre les standards Richat"""
    try:
        response_headers = {
            'Access-Control-Allow-Origin': '*',
            'Access-Control-Allow-Methods': 'GET, OPTIONS',
            'Access-Control-Allow-Headers': 'Content-Type, Authorization'
        }
        
        if request.method == 'OPTIONS':
            response = JsonResponse({'status': 'ok'})
            for key, value in response_headers.items():
                response[key] = value
            return response
        
        # Récupérer le CV et ses métadonnées
        cv_file_path = cv_storage.get_cv_file(consultant_id, filename)
        
        if not cv_file_path:
            response_data = {
                'success': False,
                'error': f'CV non trouvé pour consultant {consultant_id}'
            }
            response = JsonResponse(response_data, status=404)
            for key, value in response_headers.items():
                response[key] = value
            return response
        
        metadata = cv_storage.get_metadata_for_file(cv_file_path.name)
        
        # Validation contre standards Richat
        richat_features = metadata.get('richat_features', {})
        quality_score = metadata.get('quality_score', 0)
        compliance_score = metadata.get('format_compliance_score', 0)
        
        # Critères de validation Richat
        validation_criteria = {
            'has_richat_header': richat_features.get('header_with_logo', False),
            'has_personal_info_table': richat_features.get('personal_info_table', False),
            'has_professional_title': richat_features.get('professional_title_centered', False),
            'has_education_table': richat_features.get('education_table', False),
            'has_experience_table': richat_features.get('experience_detailed_table', False),
            'has_languages_table': richat_features.get('languages_table', False),
            'has_mission_adequacy': richat_features.get('mission_adequacy_section', False),
            'quality_above_60': quality_score >= 60,
            'compliance_above_70': compliance_score >= 70
        }
        
        # Score de conformité global
        conformity_score = (sum(validation_criteria.values()) / len(validation_criteria)) * 100
        
        # Déterminer le statut
        if conformity_score >= 90:
            status = "EXCELLENT_RICHAT_COMPLIANCE"
            status_message = "CV parfaitement conforme aux standards Richat"
        elif conformity_score >= 75:
            status = "GOOD_RICHAT_COMPLIANCE"
            status_message = "CV conforme aux standards Richat avec améliorations mineures"
        elif conformity_score >= 50:
            status = "PARTIAL_RICHAT_COMPLIANCE"
            status_message = "CV partiellement conforme - améliorations nécessaires"
        else:
            status = "NON_RICHAT_COMPLIANT"
            status_message = "CV non conforme aux standards Richat"
        
        # Recommandations d'amélioration
        recommendations = []
        if not validation_criteria['has_richat_header']:
            recommendations.append("Ajouter l'en-tête 'RICHAT PARTNERS - CURRICULUM VITAE (CV)'")
        if not validation_criteria['has_personal_info_table']:
            recommendations.append("Structurer les informations personnelles en tableau format Richat")
        if not validation_criteria['has_languages_table']:
            recommendations.append("Ajouter le tableau des langues (Parler/Lecture/Éditorial)")
        if not validation_criteria['has_mission_adequacy']:
            recommendations.append("Inclure la section 'Adéquation à la mission' avec projets référencés")
        if not validation_criteria['quality_above_60']:
            recommendations.append("Améliorer la qualité du contenu (score actuel: " + str(quality_score) + "%)")
        if not validation_criteria['compliance_above_70']:
            recommendations.append("Améliorer la conformité au format (score actuel: " + str(compliance_score) + "%)")
        
        response_data = {
            'success': True,
            'consultant_id': consultant_id,
            'filename': cv_file_path.name,
            'validation_result': {
                'status': status,
                'status_message': status_message,
                'conformity_score': round(conformity_score, 1),
                'validation_criteria': validation_criteria,
                'quality_score': quality_score,
                'compliance_score': compliance_score,
                'richat_features': richat_features,
                'recommendations': recommendations,
                'is_richat_compliant': conformity_score >= 75,
                'validation_date': datetime.now().isoformat(),
                'format_reference': "Mohamed Yehdhih Sidatt"
            }
        }
        
        response = JsonResponse(response_data)
        for key, value in response_headers.items():
            response[key] = value
        
        return response
        
    except Exception as e:
        logger.error(f"❌ Erreur validation CV: {e}")
        response_data = {
            'success': False,
            'error': str(e)
        }
        response = JsonResponse(response_data, status=500)
        
        response_headers = {
            'Access-Control-Allow-Origin': '*',
            'Access-Control-Allow-Methods': 'GET, OPTIONS',
            'Access-Control-Allow-Headers': 'Content-Type, Authorization'
        }
        for key, value in response_headers.items():
            response[key] = value
        
        return response


# LOG DE DÉMARRAGE
logger.info("📁 Système de stockage CV Richat initialisé")
logger.info(f"📂 Dossier principal: {cv_storage.cv_dir}")
logger.info(f"🗃️ Dossier métadonnées: {cv_storage.metadata_dir}")
logger.info(f"📦 Dossier archives: {cv_storage.archive_dir}")
logger.info("✅ Tous les endpoints de gestion CV disponibles")