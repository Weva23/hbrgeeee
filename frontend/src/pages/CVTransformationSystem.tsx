import React, { useState, useRef } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Progress } from '@/components/ui/progress';
import { Badge } from '@/components/ui/badge';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { 
  FileTextIcon, 
  UploadIcon, 
  CheckCircleIcon, 
  XIcon, 
  AlertCircleIcon,
  RefreshCwIcon,
  Award,
  TrendingUp,
  Star,
  Eye,
  Download,
  Zap,
  Shield,
  FileIcon,
  Clock,
  Users,
  InfoIcon
} from 'lucide-react';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog';
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from '@/components/ui/tooltip';

// Configuration API
const API_BASE_URL = "http://127.0.0.1:8000/api";

// Interfaces
interface ProcessingStats {
  text_length?: number;
  personal_info_found?: number;
  experience_entries?: number;
  education_entries?: number;
  skills_found?: number;
  languages_found?: number;
  extraction_method?: string;
}

interface ExtractedData {
  personal_info: {
    nom_expert?: string;
    email?: string;
    telephone?: string;
    titre?: string;
    pays_residence?: string;
  };
  professional_title?: string;
  profile_summary?: string;
  skills: string[];
  experience: string[];
  education: any[];
  languages: Array<{
    language: string;
    level: string;
  }>;
  certifications: string[];
  confidence_scores?: Record<string, number>;
}

interface ProcessingResponse {
  success: boolean;
  extracted_data?: ExtractedData;
  quality_score?: number;
  format_compliance_score?: number;
  cv_url?: string;
  recommendations?: string[];
  stats?: ProcessingStats;
  error?: string;
  warnings?: string[];
}

interface CVTransformationSystemProps {
  onSuccess?: (data: ProcessingResponse) => void;
  onError?: (error: string) => void;
  onFileSelected?: (file: File) => void; // Prop manquante ajoutée
  disabled?: boolean;
  showPreview?: boolean;
}

// Composant pour afficher le score de qualité
const QualityScoreDisplay = ({ score }: { score: number }) => {
  const getScoreColor = (score: number) => {
    if (score >= 80) return "text-green-600 bg-green-100 border-green-300";
    if (score >= 60) return "text-yellow-600 bg-yellow-100 border-yellow-300";
    return "text-red-600 bg-red-100 border-red-300";
  };

  const getScoreIcon = (score: number) => {
    if (score >= 80) return <Award className="h-4 w-4" />;
    if (score >= 60) return <TrendingUp className="h-4 w-4" />;
    return <AlertCircleIcon className="h-4 w-4" />;
  };

  const getScoreLabel = (score: number) => {
    if (score >= 80) return "Excellent";
    if (score >= 60) return "Bon";
    if (score >= 40) return "Moyen";
    return "À améliorer";
  };

  return (
    <div className={`inline-flex items-center gap-2 px-3 py-1 rounded-full text-sm font-medium border ${getScoreColor(score)}`}>
      {getScoreIcon(score)}
      <span>Score: {score}% - {getScoreLabel(score)}</span>
    </div>
  );
};

// Composant pour afficher les recommandations
const RecommendationsDisplay = ({ recommendations }: { recommendations: string[] }) => {
  if (!recommendations || recommendations.length === 0) return null;

  return (
    <Alert className="bg-amber-50 border-amber-200">
      <InfoIcon className="h-4 w-4 text-amber-600" />
      <AlertTitle className="text-amber-800">Recommandations d'amélioration</AlertTitle>
      <AlertDescription>
        <ul className="text-sm text-amber-700 space-y-1 mt-2">
          {recommendations.map((rec, index) => (
            <li key={index} className="flex items-start gap-2">
              <span className="text-amber-500 mt-0.5">•</span>
              <span>{rec}</span>
            </li>
          ))}
        </ul>
      </AlertDescription>
    </Alert>
  );
};

// Composant principal
const CVTransformationSystem: React.FC<CVTransformationSystemProps> = ({
  onSuccess,
  onError,
  onFileSelected, // Prop ajoutée
  disabled = false,
  showPreview = true
}) => {
  const [cvFile, setCvFile] = useState<File | null>(null);
  const [isProcessing, setIsProcessing] = useState(false);
  const [uploadProgress, setUploadProgress] = useState(0);
  const [extractedData, setExtractedData] = useState<ExtractedData | null>(null);
  const [processingStats, setProcessingStats] = useState<ProcessingStats | null>(null);
  const [qualityScore, setQualityScore] = useState<number | null>(null);
  const [recommendations, setRecommendations] = useState<string[]>([]);
  const [cvError, setCvError] = useState<string | null>(null);
  const [standardizedCvUrl, setStandardizedCvUrl] = useState<string | null>(null);
  const [transformationComplete, setTransformationComplete] = useState(false);
  const [isDragging, setIsDragging] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Fonction de traitement et transformation du CV
  const processAndTransformCV = async (file: File) => {
    setIsProcessing(true);
    setCvError(null);
    setUploadProgress(0);
    setTransformationComplete(false);
    setRecommendations([]);
    
    const progressInterval = setInterval(() => {
      setUploadProgress(prev => {
        if (prev >= 85) {
          clearInterval(progressInterval);
          return 85;
        }
        return prev + Math.random() * 15 + 5;
      });
    }, 800);
    
    try {
      // Validation côté client
      const maxSize = 25 * 1024 * 1024; // 25MB
      if (file.size > maxSize) {
        throw new Error("Le fichier est trop volumineux. La taille maximale autorisée est de 25MB.");
      }
      
      const allowedTypes = [
        'application/pdf', 
        'application/vnd.openxmlformats-officedocument.wordprocessingml.document', 
        'application/msword',
        'text/plain'
      ];
      const fileExtension = file.name.toLowerCase().split('.').pop();
      const allowedExtensions = ['pdf', 'docx', 'doc', 'txt'];
      
      if (!allowedTypes.includes(file.type) && !allowedExtensions.includes(fileExtension || '')) {
        throw new Error("Format de fichier non supporté. Veuillez télécharger un fichier PDF, DOC, DOCX ou TXT.");
      }
      
      if (file.size === 0) {
        throw new Error("Le fichier sélectionné est vide. Veuillez choisir un autre fichier.");
      }

      console.log("Début traitement CV:", {
        nom: file.name,
        taille: `${(file.size / 1024 / 1024).toFixed(2)} MB`,
        type: file.type,
        extension: fileExtension,
        timestamp: new Date().toISOString()
      });
      
      const formData = new FormData();
      formData.append("cv", file);
      formData.append("consultant_id", `temp_${Date.now()}`);
      formData.append("frontend_version", "2.0");
      
      console.log("Envoi vers:", `${API_BASE_URL}/consultant/process-cv/`);
      
      const response = await fetch(`${API_BASE_URL}/consultant/process-cv/`, {
        method: "POST",
        body: formData,
        headers: {
          'X-Requested-With': 'XMLHttpRequest',
        },
        credentials: 'include',
      });
      
      console.log("Statut de la réponse:", response.status);
      
      let responseData: ProcessingResponse;
      try {
        const responseText = await response.text();
        console.log("Réponse brute (premiers 500 chars):", responseText.substring(0, 500));
        
        if (responseText.trim()) {
          responseData = JSON.parse(responseText);
        } else {
          throw new Error("Réponse vide du serveur");
        }
      } catch (jsonError) {
        console.error("Erreur parsing JSON:", jsonError);
        throw new Error("Erreur de communication avec le serveur - réponse invalide");
      }
      
      console.log("Données de réponse complètes:", responseData);
      
      if (!response.ok) {
        if (response.status === 403) {
          throw new Error("Erreur de sécurité. Veuillez rafraîchir la page et réessayer.");
        } else if (response.status === 413) {
          throw new Error("Fichier trop volumineux pour le serveur.");
        } else if (response.status >= 500) {
          throw new Error("Erreur du serveur. Veuillez réessayer plus tard.");
        }
        
        const errorMessage = responseData?.error || `Erreur HTTP ${response.status}`;
        throw new Error(errorMessage);
      }
      
      if (responseData.success) {
        // Stocker toutes les données extraites
        setExtractedData(responseData.extracted_data || null);
        setProcessingStats(responseData.stats || null);
        setQualityScore(responseData.quality_score || null);
        setRecommendations(responseData.recommendations || []);
        
        if (responseData.cv_url) {
          setStandardizedCvUrl(responseData.cv_url);
          setTransformationComplete(true);
        }
        
        // Callback de succès
        if (onSuccess) {
          onSuccess(responseData);
        }
        
        console.log("Traitement terminé avec succès");
      } else {
        throw new Error(responseData.error || "Erreur lors du traitement du CV");
      }
    } catch (error) {
      console.error("Erreur lors de la transformation:", error);
      
      let errorMessage = "Erreur lors de la transformation du CV au format Richat";
      
      if (error instanceof Error) {
        errorMessage = error.message;
      } else if (typeof error === 'string') {
        errorMessage = error;
      }
      
      // Messages d'erreur contextuels
      if (errorMessage.includes("NetworkError") || errorMessage.includes("Failed to fetch")) {
        errorMessage = "Problème de connexion. Vérifiez votre connexion internet et réessayez.";
      } else if (errorMessage.includes("timeout")) {
        errorMessage = "Le traitement prend trop de temps. Essayez avec un fichier plus petit ou réessayez plus tard.";
      }
      
      setCvError(errorMessage);
      
      // Callback d'erreur
      if (onError) {
        onError(errorMessage);
      }
    } finally {
      clearInterval(progressInterval);
      setUploadProgress(100);
      setTimeout(() => {
        setIsProcessing(false);
      }, 1000);
    }
  };

  // Gestion du drag & drop
  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(true);
  };

  const handleDragLeave = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
  };

  const handleDrop = async (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
    
    const files = Array.from(e.dataTransfer.files);
    if (files.length > 0) {
      const file = files[0];
      await handleFileSelection(file);
    }
  };

  // Fonction unifiée pour la sélection de fichier
  const handleFileSelection = async (file: File) => {
    console.log("Fichier sélectionné:", {
      name: file.name,
      size: `${(file.size / 1024 / 1024).toFixed(2)} MB`,
      type: file.type,
      lastModified: new Date(file.lastModified).toISOString()
    });
    
    // Réinitialiser l'état
    setCvError(null);
    setUploadProgress(0);
    setStandardizedCvUrl(null);
    setExtractedData(null);
    setProcessingStats(null);
    setQualityScore(null);
    setRecommendations([]);
    setTransformationComplete(false);
    
    // Validation du fichier côté client
    const extension = file.name.split('.').pop()?.toLowerCase();
    const allowedExtensions = ['pdf', 'doc', 'docx', 'txt'];
    
    if (!extension || !allowedExtensions.includes(extension)) {
      const errorMsg = "Format de fichier non supporté. Veuillez télécharger un fichier PDF, DOC, DOCX ou TXT.";
      setCvError(errorMsg);
      return;
    }
    
    const maxSize = 25 * 1024 * 1024; // 25MB
    if (file.size > maxSize) {
      const errorMsg = "Le fichier est trop volumineux. La taille maximale autorisée est de 25MB.";
      setCvError(errorMsg);
      return;
    }
    
    if (file.size === 0) {
      const errorMsg = "Le fichier sélectionné est vide. Veuillez choisir un autre fichier.";
      setCvError(errorMsg);
      return;
    }
    
    setCvFile(file);
    
    // Notifier le parent que le fichier a été sélectionné
    if (onFileSelected) {
      onFileSelected(file);
    }
    
    // Traiter et transformer le CV automatiquement
    if (!disabled) {
      await processAndTransformCV(file);
    }
  };

  // Gestion du changement de fichier
  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      await handleFileSelection(e.target.files[0]);
    }
  };

  // Suppression du CV
  const handleRemoveCv = () => {
    setCvFile(null);
    setExtractedData(null);
    setProcessingStats(null);
    setQualityScore(null);
    setRecommendations([]);
    setCvError(null);
    setStandardizedCvUrl(null);
    setUploadProgress(0);
    setTransformationComplete(false);
    
    // Réinitialiser l'input file
    if (fileInputRef.current) {
      fileInputRef.current.value = "";
    }

    // Notifier le parent que le fichier a été supprimé
    if (onFileSelected) {
      onFileSelected(null as any); // Type assertion temporaire pour null
    }
  };

  // Fonction pour prévisualiser le CV Richat
  const previewRichatCV = () => {
    if (standardizedCvUrl) {
      window.open(standardizedCvUrl, '_blank', 'width=800,height=900,scrollbars=yes');
    }
  };

  return (
    <div className="space-y-4">
      <Card className="border-2 border-dashed border-blue-300 bg-gradient-to-br from-blue-50 to-green-50">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Zap className="h-5 w-5 text-blue-600" />
            Système de Transformation CV Richat
          </CardTitle>
          <CardDescription>
            Transformez automatiquement votre CV au format professionnel Richat Partners
          </CardDescription>
        </CardHeader>
        
        <CardContent>
          {!cvFile ? (
            <div 
              className={`text-center py-8 transition-all duration-200 rounded-lg ${
                isDragging ? 'bg-blue-100 border-blue-400 border-2 border-dashed' : 'hover:bg-blue-50'
              }`}
              onDragOver={handleDragOver}
              onDragLeave={handleDragLeave}
              onDrop={handleDrop}
            >
              <div className="flex flex-col items-center gap-4">
                <div className="relative">
                  <UploadIcon className={`h-12 w-12 ${isDragging ? 'text-blue-600' : 'text-blue-500'} transition-colors`} />
                  {isDragging && (
                    <div className="absolute -inset-2 border-2 border-blue-400 rounded-full animate-pulse"></div>
                  )}
                </div>
                
                <div>
                  <h4 className="text-lg font-medium text-gray-900 mb-2">
                    {isDragging ? 'Déposez votre CV ici' : 'Téléchargez votre CV'}
                  </h4>
                  <p className="text-sm text-gray-600 mb-4">
                    Glissez-déposez votre fichier ou cliquez pour sélectionner
                  </p>
                  
                  <Button 
                    type="button" 
                    variant="outline" 
                    onClick={() => fileInputRef.current?.click()}
                    className="bg-white border-blue-300 text-blue-600 hover:bg-blue-50"
                    disabled={isProcessing || disabled}
                  >
                    <UploadIcon className="h-4 w-4 mr-2" />
                    {isProcessing ? "Traitement en cours..." : "Choisir un fichier"}
                  </Button>
                </div>
              </div>
              
              <Input 
                type="file" 
                accept=".pdf,.doc,.docx,.txt" 
                onChange={handleFileChange}
                ref={fileInputRef}
                className="hidden"
                disabled={disabled}
              />
              
              <div className="mt-4 text-xs text-gray-500">
                <p>Formats supportés: PDF, DOC, DOCX, TXT</p>
                <p>Taille maximale: 25MB</p>
              </div>
            </div>
          ) : (
            <div className="space-y-4">
              {/* Fichier sélectionné */}
              <div className="flex items-center justify-between bg-white p-4 rounded-lg border border-blue-200 shadow-sm">
                <div className="flex items-center gap-3">
                  <FileTextIcon className="h-8 w-8 text-blue-600" />
                  <div>
                    <p className="font-medium text-gray-900">{cvFile.name}</p>
                    <div className="flex items-center gap-4 text-sm text-gray-500">
                      <span>{(cvFile.size / 1024 / 1024).toFixed(2)} MB</span>
                      {qualityScore !== null && (
                        <QualityScoreDisplay score={qualityScore} />
                      )}
                    </div>
                  </div>
                </div>
                
                <div className="flex items-center gap-2">
                  {transformationComplete && (
                    <TooltipProvider>
                      <Tooltip>
                        <TooltipTrigger>
                          <Badge variant="secondary" className="bg-green-100 text-green-800 border-green-300">
                            <CheckCircleIcon className="h-3 w-3 mr-1" />
                            Transformé
                          </Badge>
                        </TooltipTrigger>
                        <TooltipContent>
                          <p>CV transformé au format Richat avec succès</p>
                        </TooltipContent>
                      </Tooltip>
                    </TooltipProvider>
                  )}
                  
                  <Button 
                    type="button" 
                    variant="ghost" 
                    size="sm" 
                    onClick={handleRemoveCv}
                    className="h-8 w-8 p-0 hover:bg-red-50 text-red-500"
                    disabled={disabled}
                  >
                    <XIcon className="h-4 w-4" />
                  </Button>
                </div>
              </div>

              {/* Progression du traitement */}
              {isProcessing && (
                <div className="space-y-3">
                  <div className="flex justify-between items-center">
                    <div className="flex items-center gap-2">
                      <RefreshCwIcon className="h-4 w-4 animate-spin text-blue-600" />
                      <span className="text-sm text-blue-800 font-medium">
                        Transformation au format Richat en cours...
                      </span>
                    </div>
                    <span className="text-sm font-medium text-gray-600">{uploadProgress}%</span>
                  </div>
                  
                  <Progress value={uploadProgress} className="h-3 bg-gray-200" />
                  
                  <div className="grid grid-cols-2 gap-2 text-xs text-blue-700">
                    <div className="flex items-center gap-1">
                      <CheckCircleIcon className="h-3 w-3" />
                      <span>Extraction des données</span>
                    </div>
                    <div className="flex items-center gap-1">
                      <CheckCircleIcon className="h-3 w-3" />
                      <span>Analyse des compétences</span>
                    </div>
                    <div className="flex items-center gap-1">
                      <CheckCircleIcon className="h-3 w-3" />
                      <span>Calcul du score qualité</span>
                    </div>
                    <div className="flex items-center gap-1">
                      <CheckCircleIcon className="h-3 w-3" />
                      <span>Génération format Richat</span>
                    </div>
                  </div>
                </div>
              )}

              {/* Erreur de traitement */}
              {cvError && (
                <Alert variant="destructive">
                  <AlertCircleIcon className="h-4 w-4" />
                  <AlertTitle>Erreur de transformation</AlertTitle>
                  <AlertDescription>
                    {cvError}
                    <Button 
                      variant="outline" 
                      size="sm" 
                      onClick={() => processAndTransformCV(cvFile)}
                      className="mt-2 ml-0"
                      disabled={isProcessing || disabled}
                    >
                      <RefreshCwIcon className="h-3 w-3 mr-1" />
                      Réessayer
                    </Button>
                  </AlertDescription>
                </Alert>
              )}

              {/* Aperçu des données extraites */}
              {extractedData && showPreview && (
                <div className="bg-green-50 p-4 rounded-lg border border-green-200">
                  <div className="flex justify-between items-center mb-3">
                    <h4 className="font-medium text-green-800 flex items-center gap-2">
                      <CheckCircleIcon className="h-4 w-4" />
                      Données extraites automatiquement
                    </h4>
                    {qualityScore !== null && (
                      <QualityScoreDisplay score={qualityScore} />
                    )}
                  </div>
                  
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-3 text-sm text-green-700">
                    {extractedData.personal_info?.nom_expert && (
                      <div className="flex items-center gap-2">
                        <Users className="h-3 w-3" />
                        <span>Nom: {extractedData.personal_info.nom_expert}</span>
                      </div>
                    )}
                    {extractedData.personal_info?.email && (
                      <div className="flex items-center gap-2">
                        <InfoIcon className="h-3 w-3" />
                        <span>Email: {extractedData.personal_info.email}</span>
                      </div>
                    )}
                    {extractedData.personal_info?.telephone && (
                      <div className="flex items-center gap-2">
                        <InfoIcon className="h-3 w-3" />
                        <span>Téléphone: {extractedData.personal_info.telephone}</span>
                      </div>
                    )}
                    {extractedData.skills?.length > 0 && (
                      <div className="flex items-center gap-2">
                        <Star className="h-3 w-3" />
                        <span>Compétences: {extractedData.skills.length} identifiées</span>
                      </div>
                    )}
                    {extractedData.experience?.length > 0 && (
                      <div className="flex items-center gap-2">
                        <TrendingUp className="h-3 w-3" />
                        <span>Expériences: {extractedData.experience.length} identifiées</span>
                      </div>
                    )}
                    {extractedData.education?.length > 0 && (
                      <div className="flex items-center gap-2">
                        <Award className="h-3 w-3" />
                        <span>Formation: {extractedData.education.length} entrées</span>
                      </div>
                    )}
                  </div>
                  
                  {/* Compétences détaillées */}
                  {extractedData.skills?.length > 0 && (
                    <div className="mt-3 pt-3 border-t border-green-200">
                      <p className="text-xs font-medium text-green-800 mb-2">Compétences détectées:</p>
                      <div className="flex flex-wrap gap-1">
                        {extractedData.skills.slice(0, 8).map((skill, index) => (
                          <Badge key={index} variant="outline" className="text-xs bg-white border-green-300 text-green-700">
                            {skill}
                          </Badge>
                        ))}
                        {extractedData.skills.length > 8 && (
                          <Badge variant="outline" className="text-xs bg-white border-green-300 text-green-700">
                            +{extractedData.skills.length - 8} autres
                          </Badge>
                        )}
                      </div>
                    </div>
                  )}
                  
                  {/* Statistiques détaillées */}
                  {processingStats && (
                    <div className="mt-3 pt-3 border-t border-green-200">
                      <div className="text-xs text-green-600 grid grid-cols-2 gap-2">
                        <span>Méthode: {processingStats.extraction_method}</span>
                        <span>Texte: {processingStats.text_length} caractères</span>
                        <span>Infos perso: {processingStats.personal_info_found}/5</span>
                        <span>Sections: {processingStats.experience_entries}</span>
                      </div>
                    </div>
                  )}
                </div>
              )}

              {/* Recommandations */}
              {recommendations.length > 0 && (
                <RecommendationsDisplay recommendations={recommendations} />
              )}

              {/* CV Richat généré */}
              {standardizedCvUrl && transformationComplete && (
                <div className="bg-blue-50 p-4 rounded-lg border border-blue-200">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <div className="relative">
                        <FileIcon className="h-8 w-8 text-blue-600" />
                        <div className="absolute -top-1 -right-1 bg-green-500 rounded-full p-0.5">
                          <CheckCircleIcon className="h-3 w-3 text-white" />
                        </div>
                      </div>
                      <div>
                        <p className="font-medium text-blue-800">CV Richat Partners généré</p>
                        <p className="text-sm text-blue-600">
                          Format standardisé prêt pour candidatures
                          {qualityScore !== null && (
                            <span className="ml-2">• Qualité: {qualityScore}%</span>
                          )}
                        </p>
                      </div>
                    </div>
                    
                    <div className="flex gap-2">
                      <TooltipProvider>
                        <Tooltip>
                          <TooltipTrigger asChild>
                            <Button 
                              type="button" 
                              variant="outline" 
                              size="sm"
                              onClick={previewRichatCV}
                              className="text-blue-600 border-blue-300 hover:bg-blue-50"
                            >
                              <Eye className="h-4 w-4 mr-1" />
                              Aperçu
                            </Button>
                          </TooltipTrigger>
                          <TooltipContent>
                            <p>Prévisualiser le CV au format Richat</p>
                          </TooltipContent>
                        </Tooltip>
                      </TooltipProvider>
                    </div>
                  </div>
                </div>
              )}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Informations sur le système */}
      <Alert className="border-blue-200 bg-blue-50">
        <Shield className="h-4 w-4 text-blue-600" />
        <AlertTitle className="text-blue-900">Système de transformation CV avancé</AlertTitle>
        <AlertDescription className="text-blue-800">
          <div className="space-y-2">
            <p>Votre CV sera automatiquement analysé par notre IA avancée :</p>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-2 text-sm">
              <div className="flex items-center gap-2">
                <CheckCircleIcon className="h-3 w-3 text-green-600" />
                <span>Extraction intelligente des informations</span>
              </div>
              <div className="flex items-center gap-2">
                <CheckCircleIcon className="h-3 w-3 text-green-600" />
                <span>Reconnaissance des compétences techniques</span>
              </div>
              <div className="flex items-center gap-2">
                <CheckCircleIcon className="h-3 w-3 text-green-600" />
                <span>Structuration de l'expérience</span>
              </div>
              <div className="flex items-center gap-2">
                <CheckCircleIcon className="h-3 w-3 text-green-600" />
                <span>Score de qualité personnalisé</span>
              </div>
              <div className="flex items-center gap-2">
                <CheckCircleIcon className="h-3 w-3 text-green-600" />
                <span>Format professionnel Richat</span>
              </div>
              <div className="flex items-center gap-2">
                <CheckCircleIcon className="h-3 w-3 text-green-600" />
                <span>Recommandations d'amélioration</span>
              </div>
            </div>
          </div>
        </AlertDescription>
      </Alert>
    </div>
  );
};

export default CVTransformationSystem;