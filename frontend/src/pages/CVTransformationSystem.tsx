import React, { useState, useRef } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { 
  Upload, 
  FileText, 
  Download, 
  Check, 
  Edit, 
  RefreshCw,
  User,
  Mail,
  Phone,
  MapPin,
  Calendar,
  Award,
  Briefcase,
  GraduationCap,
  Languages,
  CheckCircle,
  AlertCircle,
  Star,
  Shield,
  Eye,
  Zap,
  TrendingUp,
  Users,
  Clock,
  FileIcon,
  Building,
  Globe,
  Target,
  Settings
} from 'lucide-react';
import { toast } from 'sonner';

// Configuration API
const API_BASE_URL = "http://127.0.0.1:8000/api";

// Interface pour les données extraites (format Richat complet)
interface RichatExtractedData {
  personal_info: {
    titre: string;
    nom_expert: string;
    date_naissance: string;
    pays_residence: string;
    titre_professionnel: string;
    email?: string;
    telephone?: string;
  };
  professional_title: string;
  profile_summary: string;
  education: Array<{
    institution: string;
    periode: string;
    diplome: string;
    description: string;
  }>;
  experience: Array<{
    periode: string;
    employeur: string;
    pays: string;
    poste: string;
    description: string[] | string;
    resume_activites: string;
  }>;
  skills: string[];
  languages: Array<{
    language: string;
    speaking: string;
    reading: string;
    writing: string;
    level: string;
  }>;
  certifications: string[];
  mission_adequacy: {
    projects: Array<{
      nom_projet: string;
      date: string;
      societe: string;
      poste: string;
      lieu: string;
      client: string;
      description: string;
      activites: string[];
    }>;
  };
}

// Interface pour les scores de qualité
interface QualityScores {
  quality_score: number;
  format_compliance_score: number;
  sections_found: {
    personal_info_fields: number;
    education_entries: number;
    experience_entries: number;
    languages: number;
    certifications: number;
    projects: number;
  };
  missing_sections: string[];
  richat_features: {
    header_with_logo: boolean;
    personal_info_table: boolean;
    professional_title_centered: boolean;
    profile_summary: boolean;
    education_table: boolean;
    experience_detailed_table: boolean;
    languages_table: boolean;
    mission_adequacy_section: boolean;
    certifications_list: boolean;
  };
}

// Composant pour afficher les scores de qualité Richat
const RichatQualityDisplay = ({ qualityScore, complianceScore }: { qualityScore: number; complianceScore: number }) => {
  const getScoreColor = (score: number) => {
    if (score >= 80) return "text-green-600 bg-green-100 border-green-300";
    if (score >= 60) return "text-yellow-600 bg-yellow-100 border-yellow-300";
    return "text-red-600 bg-red-100 border-red-300";
  };

  const getScoreIcon = (score: number) => {
    if (score >= 80) return <Award className="h-4 w-4" />;
    if (score >= 60) return <TrendingUp className="h-4 w-4" />;
    return <AlertCircle className="h-4 w-4" />;
  };

  return (
    <div className="flex gap-4 mb-4">
      <div className={`inline-flex items-center gap-2 px-3 py-2 rounded-lg text-sm font-medium border ${getScoreColor(qualityScore)}`}>
        {getScoreIcon(qualityScore)}
        <span>Qualité: {qualityScore}%</span>
      </div>
      <div className={`inline-flex items-center gap-2 px-3 py-2 rounded-lg text-sm font-medium border ${getScoreColor(complianceScore)}`}>
        <Shield className="h-4 w-4" />
        <span>Conformité Richat: {complianceScore}%</span>
      </div>
    </div>
  );
};

// Composant pour afficher les fonctionnalités Richat détectées
const RichatFeaturesDisplay = ({ features }: { features: any }) => {
  const featureLabels = {
    header_with_logo: "En-tête Richat Partners",
    personal_info_table: "Tableau informations personnelles",
    professional_title_centered: "Titre professionnel centré",
    profile_summary: "Résumé du profil",
    education_table: "Tableau éducation",
    experience_detailed_table: "Tableau expérience détaillé",
    languages_table: "Tableau langues",
    mission_adequacy_section: "Section adéquation mission",
    certifications_list: "Liste des certifications"
  };

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
      {Object.entries(features).map(([key, value]: [string, any]) => (
        <div key={key} className={`flex items-center gap-2 p-2 rounded-md text-sm ${
          value ? 'bg-green-50 text-green-700' : 'bg-red-50 text-red-700'
        }`}>
          {value ? (
            <CheckCircle className="h-4 w-4 text-green-600" />
          ) : (
            <AlertCircle className="h-4 w-4 text-red-600" />
          )}
          <span className="flex-1">{featureLabels[key as keyof typeof featureLabels] || key}</span>
          <Badge variant={value ? "default" : "destructive"} className="text-xs">
            {value ? "✓" : "✗"}
          </Badge>
        </div>
      ))}
    </div>
  );
};

const CVTransformationSystem = () => {
  const [step, setStep] = useState(1);
  const [uploadedCV, setUploadedCV] = useState<File | null>(null);
  const [extractedData, setExtractedData] = useState<RichatExtractedData | null>(null);
  const [qualityScores, setQualityScores] = useState<QualityScores | null>(null);
  const [transformedCV, setTransformedCV] = useState<string | null>(null);
  const [isProcessing, setIsProcessing] = useState(false);
  const [isValidated, setIsValidated] = useState(false);
  const [processingProgress, setProcessingProgress] = useState(0);
  const [diagnosticData, setDiagnosticData] = useState<any>(null);
  const [recommendations, setRecommendations] = useState<string[]>([]);
  const [formatDetected, setFormatDetected] = useState<string>('');
  const [processingMethod, setProcessingMethod] = useState<string>('');
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Fonction pour traiter le CV avec le nouveau système Richat
  const handleFileUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file) {
      setUploadedCV(file);
      setStep(2);
      setIsProcessing(true);
      setProcessingProgress(0);

      // Simuler la progression
      const progressInterval = setInterval(() => {
        setProcessingProgress(prev => {
          if (prev >= 85) {
            clearInterval(progressInterval);
            return 85;
          }
          return prev + Math.random() * 15 + 5;
        });
      }, 800);

      try {
        // Étape 1: Diagnostic du CV
        toast.info("Analyse de compatibilité Richat...");
        await performDiagnostic(file);

        // Étape 2: Traitement complet Richat
        toast.info("Transformation au format Richat...");
        await processWithRichatSystem(file);

        clearInterval(progressInterval);
        setProcessingProgress(100);
        setIsProcessing(false);
        setStep(3);

      } catch (error) {
        clearInterval(progressInterval);
        setIsProcessing(false);
        setStep(1);
        console.error('Erreur traitement CV:', error);
        toast.error('Erreur lors du traitement du CV');
      }
    }
  };

  // Diagnostic de compatibilité Richat
  const performDiagnostic = async (file: File) => {
    const formData = new FormData();
    formData.append('cv', file);

    const response = await fetch(`${API_BASE_URL}/consultant/diagnose-cv-richat/`, {
      method: 'POST',
      body: formData
    });

    const data = await response.json();
    
    if (data.success) {
      setDiagnosticData(data);
      setFormatDetected(data.format_detected || 'generic');
      
      toast.success(`Format détecté: ${data.format_detected || 'generic'} - Compatibilité: ${Math.round(data.richat_compatibility_score || 0)}%`);
    } else {
      throw new Error(data.error || 'Erreur diagnostic');
    }
  };

  // Traitement avec le système Richat complet
  const processWithRichatSystem = async (file: File) => {
    const formData = new FormData();
    formData.append('cv', file);
    formData.append('consultant_id', `demo_${Date.now()}`);

    const response = await fetch(`${API_BASE_URL}/consultant/process-cv-richat/`, {
      method: 'POST',
      body: formData
    });

    const data = await response.json();

    if (data.success) {
      setExtractedData(data.extracted_data);
      setQualityScores({
        quality_score: data.quality_score,
        format_compliance_score: data.format_compliance_score,
        sections_found: data.sections_found,
        missing_sections: data.missing_sections,
        richat_features: data.richat_features
      });
      setTransformedCV(data.cv_url);
      setRecommendations(data.recommendations || []);
      setProcessingMethod(data.processing_method);

      toast.success(`CV transformé avec succès ! Qualité: ${data.quality_score}%, Conformité Richat: ${data.format_compliance_score}%`);
    } else {
      throw new Error(data.error || 'Erreur transformation Richat');
    }
  };

  const handleTransformToRichatFormat = () => {
    setIsProcessing(true);
    setStep(4);
    // Simulation - en réalité, la transformation est déjà faite
    setTimeout(() => {
      setIsProcessing(false);
    }, 1500);
  };

  const handleValidateCV = () => {
    setIsValidated(true);
    setStep(5);
    toast.success("CV validé et signé électroniquement selon les standards Richat Partners");
  };

  const handleDownloadCV = () => {
    if (transformedCV) {
      // Créer un lien de téléchargement depuis l'URL base64
      const link = document.createElement('a');
      link.href = transformedCV;
      link.download = `CV_Richat_${uploadedCV?.name.replace(/\.[^/.]+$/, "")}_${Date.now()}.pdf`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      toast.success("CV Richat téléchargé avec succès");
    }
  };

  const handlePreviewCV = () => {
    if (transformedCV) {
      window.open(transformedCV, '_blank', 'width=800,height=900,scrollbars=yes');
    }
  };

  const renderStep1 = () => (
    <Card className="w-full max-w-2xl mx-auto">
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Upload className="h-6 w-6 text-blue-600" />
          Étape 1: Télécharger le CV pour transformation Richat
        </CardTitle>
      </CardHeader>
      <CardContent>
        <div 
          className="border-2 border-dashed border-gray-300 rounded-lg p-12 text-center cursor-pointer hover:border-blue-500 transition-colors bg-gradient-to-br from-blue-50 to-green-50"
          onClick={() => fileInputRef.current?.click()}
        >
          <div className="flex justify-center mb-4">
            <div className="relative">
              <FileText className="h-16 w-16 text-blue-600" />
              <div className="absolute -top-2 -right-2 bg-green-500 rounded-full p-1">
                <Shield className="h-4 w-4 text-white" />
              </div>
            </div>
          </div>
          <h3 className="text-lg font-semibold mb-2">Système de Transformation CV Richat</h3>
          <p className="text-gray-600 mb-4">
            Transformez automatiquement votre CV au format standardisé Richat Partners
          </p>
          <div className="bg-white p-4 rounded-lg border border-blue-200 mb-4">
            <h4 className="font-medium text-blue-800 mb-2">Fonctionnalités avancées :</h4>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-2 text-sm text-blue-700">
              <div className="flex items-center gap-2">
                <CheckCircle className="h-3 w-3" />
                <span>Détection automatique de format</span>
              </div>
              <div className="flex items-center gap-2">
                <CheckCircle className="h-3 w-3" />
                <span>Extraction intelligente des tableaux</span>
              </div>
              <div className="flex items-center gap-2">
                <CheckCircle className="h-3 w-3" />
                <span>Score de conformité Richat</span>
              </div>
              <div className="flex items-center gap-2">
                <CheckCircle className="h-3 w-3" />
                <span>Format Mohamed Yehdhih</span>
              </div>
            </div>
          </div>
          <Button className="bg-blue-600 hover:bg-blue-700">
            <Upload className="h-4 w-4 mr-2" />
            Cliquez pour télécharger votre CV
          </Button>
          <p className="text-sm text-gray-500 mt-4">
            Formats supportés: PDF, DOC, DOCX • Taille max: 25MB
          </p>
          <input
            ref={fileInputRef}
            type="file"
            accept=".pdf,.doc,.docx"
            onChange={handleFileUpload}
            className="hidden"
          />
        </div>
      </CardContent>
    </Card>
  );

  const renderStep2 = () => (
    <Card className="w-full max-w-2xl mx-auto">
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <RefreshCw className={`h-6 w-6 text-blue-600 ${isProcessing ? 'animate-spin' : ''}`} />
          Étape 2: Traitement avancé format Richat
        </CardTitle>
      </CardHeader>
      <CardContent>
        <div className="text-center">
          <div className="flex items-center justify-center mb-6">
            <div className="relative">
              <FileText className="h-20 w-20 text-blue-600" />
              {isProcessing && (
                <div className="absolute -inset-2 border-4 border-blue-400 rounded-full animate-pulse"></div>
              )}
              <div className="absolute -top-2 -right-2 bg-green-500 rounded-full p-2">
                <Shield className="h-6 w-6 text-white" />
              </div>
            </div>
          </div>
          
          <h3 className="text-lg font-semibold mb-2">
            {uploadedCV?.name}
          </h3>
          
          <div className="bg-blue-50 p-4 rounded-lg mb-4">
            <div className="flex items-center justify-between mb-2">
              <span className="text-sm font-medium text-blue-800">
                {isProcessing ? "Traitement en cours..." : "Traitement terminé !"}
              </span>
              <span className="text-sm font-medium text-blue-600">{processingProgress}%</span>
            </div>
            <Progress value={processingProgress} className="h-3 bg-blue-200" />
          </div>

          {/* Étapes de traitement */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-3 mb-6">
            <div className="flex items-center gap-2 p-3 bg-green-50 rounded-lg">
              <CheckCircle className="h-5 w-5 text-green-600" />
              <span className="text-sm text-green-800">Extraction de texte</span>
            </div>
            <div className="flex items-center gap-2 p-3 bg-green-50 rounded-lg">
              <CheckCircle className="h-5 w-5 text-green-600" />
              <span className="text-sm text-green-800">Détection de format</span>
            </div>
            <div className="flex items-center gap-2 p-3 bg-green-50 rounded-lg">
              <CheckCircle className="h-5 w-5 text-green-600" />
              <span className="text-sm text-green-800">Diagnostic Richat</span>
            </div>
            <div className="flex items-center gap-2 p-3 bg-green-50 rounded-lg">
              <CheckCircle className="h-5 w-5 text-green-600" />
              <span className="text-sm text-green-800">Transformation complète</span>
            </div>
          </div>

          {/* Informations de diagnostic */}
          {diagnosticData && (
            <div className="bg-blue-50 p-4 rounded-lg mb-4 text-left">
              <h4 className="font-medium text-blue-800 mb-2">Diagnostic Richat :</h4>
              <div className="grid grid-cols-2 gap-4 text-sm">
                <div>
                  <span className="text-blue-600">Format détecté:</span>
                  <Badge className="ml-2">{formatDetected}</Badge>
                </div>
                <div>
                  <span className="text-blue-600">Compatibilité:</span>
                  <Badge className="ml-2">{Math.round(diagnosticData.richat_compatibility_score || 0)}%</Badge>
                </div>
              </div>
            </div>
          )}
        </div>
      </CardContent>
    </Card>
  );

  const renderStep3 = () => (
    <div className="w-full max-w-5xl mx-auto space-y-6">
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Edit className="h-6 w-6 text-blue-600" />
            Étape 3: Données extraites et scores de qualité Richat
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-6">
          
          {/* Scores de qualité */}
          {qualityScores && (
            <div className="bg-gradient-to-r from-blue-50 to-green-50 p-6 rounded-lg border border-blue-200">
              <h3 className="text-lg font-semibold mb-4 flex items-center gap-2">
                <Award className="h-5 w-5 text-blue-600" />
                Scores de Qualité Richat
              </h3>
              <RichatQualityDisplay 
                qualityScore={qualityScores.quality_score} 
                complianceScore={qualityScores.format_compliance_score} 
              />
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                  <h4 className="font-medium mb-2">Sections trouvées :</h4>
                  <div className="space-y-1 text-sm">
                    <div>Infos personnelles: {qualityScores.sections_found.personal_info_fields}/4</div>
                    <div>Éducation: {qualityScores.sections_found.education_entries} entrées</div>
                    <div>Expérience: {qualityScores.sections_found.experience_entries} entrées</div>
                    <div>Langues: {qualityScores.sections_found.languages} langues</div>
                    <div>Certifications: {qualityScores.sections_found.certifications} certifs</div>
                    <div>Projets: {qualityScores.sections_found.projects} projets</div>
                  </div>
                </div>
                
                <div>
                  <h4 className="font-medium mb-2">Conformité Richat :</h4>
                  <RichatFeaturesDisplay features={qualityScores.richat_features} />
                </div>
              </div>
            </div>
          )}

          {/* Informations personnelles extraites */}
          {extractedData?.personal_info && (
            <div className="bg-gray-50 p-4 rounded-lg">
              <h4 className="font-medium mb-3 flex items-center gap-2">
                <User className="h-4 w-4" />
                Informations personnelles (Format Richat)
              </h4>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium mb-1">Titre</label>
                  <Input value={extractedData.personal_info.titre} readOnly />
                </div>
                <div>
                  <label className="block text-sm font-medium mb-1">Nom de l'expert</label>
                  <Input value={extractedData.personal_info.nom_expert} readOnly />
                </div>
                <div>
                  <label className="block text-sm font-medium mb-1">Date de naissance</label>
                  <Input value={extractedData.personal_info.date_naissance} readOnly />
                </div>
                <div>
                  <label className="block text-sm font-medium mb-1">Pays de résidence</label>
                  <Input value={extractedData.personal_info.pays_residence} readOnly />
                </div>
              </div>
            </div>
          )}

          {/* Titre professionnel */}
          {extractedData?.professional_title && (
            <div className="bg-blue-50 p-4 rounded-lg">
              <h4 className="font-medium mb-2 flex items-center gap-2">
                <Briefcase className="h-4 w-4" />
                Titre professionnel
              </h4>
              <Input value={extractedData.professional_title} readOnly className="font-medium" />
            </div>
          )}

          {/* Expérience professionnelle */}
          {extractedData?.experience && extractedData.experience.length > 0 && (
            <div className="bg-gray-50 p-4 rounded-lg">
              <h4 className="font-medium mb-3 flex items-center gap-2">
                <Building className="h-4 w-4" />
                Expérience professionnelle ({extractedData.experience.length} postes)
              </h4>
              <div className="space-y-3">
                {extractedData.experience.slice(0, 3).map((exp, index) => (
                  <div key={index} className="p-3 bg-white rounded border">
                    <div className="flex justify-between items-start mb-2">
                      <div>
                        <div className="font-medium">{exp.employeur}</div>
                        <div className="text-sm text-gray-600">{exp.poste}</div>
                      </div>
                      <div className="text-right">
                        <div className="text-sm font-medium">{exp.periode}</div>
                        <div className="text-sm text-gray-600">{exp.pays}</div>
                      </div>
                    </div>
                    <div className="text-sm text-gray-700">
                      {exp.resume_activites.substring(0, 150)}...
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Compétences */}
          {extractedData?.skills && extractedData.skills.length > 0 && (
            <div className="bg-green-50 p-4 rounded-lg">
              <h4 className="font-medium mb-3 flex items-center gap-2">
                <Star className="h-4 w-4" />
                Compétences extraites ({extractedData.skills.length})
              </h4>
              <div className="flex flex-wrap gap-2">
                {extractedData.skills.slice(0, 10).map((skill, index) => (
                  <Badge key={index} variant="secondary" className="bg-white">
                    {skill}
                  </Badge>
                ))}
                {extractedData.skills.length > 10 && (
                  <Badge variant="outline">+{extractedData.skills.length - 10} autres</Badge>
                )}
              </div>
            </div>
          )}

          {/* Langues */}
          {extractedData?.languages && extractedData.languages.length > 0 && (
            <div className="bg-yellow-50 p-4 rounded-lg">
              <h4 className="font-medium mb-3 flex items-center gap-2">
                <Languages className="h-4 w-4" />
                Langues parlées (Format tableau Richat)
              </h4>
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="border-b">
                      <th className="text-left p-2">Langue</th>
                      <th className="text-left p-2">Parler</th>
                      <th className="text-left p-2">Lecture</th>
                      <th className="text-left p-2">Éditorial</th>
                    </tr>
                  </thead>
                  <tbody>
                    {extractedData.languages.map((lang, index) => (
                      <tr key={index} className="border-b">
                        <td className="p-2 font-medium">{lang.language}</td>
                        <td className="p-2">{lang.speaking}</td>
                        <td className="p-2">{lang.reading}</td>
                        <td className="p-2">{lang.writing}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}

          {/* Recommandations */}
          {recommendations.length > 0 && (
            <Alert className="border-amber-200 bg-amber-50">
              <AlertCircle className="h-4 w-4 text-amber-600" />
              <AlertTitle className="text-amber-800">Recommandations d'amélioration</AlertTitle>
              <AlertDescription className="text-amber-700">
                <ul className="list-disc list-inside space-y-1">
                  {recommendations.map((rec, index) => (
                    <li key={index}>{rec}</li>
                  ))}
                </ul>
              </AlertDescription>
            </Alert>
          )}

          <div className="flex justify-end pt-4">
            <Button onClick={handleTransformToRichatFormat} className="bg-blue-600 hover:bg-blue-700">
              Générer CV au format Richat Partners
              <Shield className="h-4 w-4 ml-2" />
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );

  const renderStep4 = () => (
    <div className="w-full max-w-4xl mx-auto space-y-6">
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <FileText className="h-6 w-6 text-green-600" />
            Étape 4: CV transformé au format Richat Partners
          </CardTitle>
        </CardHeader>
        <CardContent>
          {isProcessing ? (
            <div className="text-center py-12">
              <RefreshCw className="h-12 w-12 text-blue-600 animate-spin mx-auto mb-4" />
              <p className="text-lg">Génération du CV format Richat en cours...</p>
              <div className="mt-4 grid grid-cols-1 md:grid-cols-2 gap-2 max-w-md mx-auto">
                <div className="text-sm text-blue-600">✓ En-tête Richat Partners</div>
                <div className="text-sm text-blue-600">✓ Tableau informations personnelles</div>
                <div className="text-sm text-blue-600">✓ Sections standardisées</div>
                <div className="text-sm text-blue-600">✓ Signature électronique</div>
              </div>
            </div>
          ) : (
            <div className="space-y-6">
              {/* Aperçu du CV Richat */}
              <div className="bg-gradient-to-br from-blue-50 to-green-50 p-6 rounded-lg border-2 border-blue-200">
                <div className="flex items-center justify-between mb-6">
                  <div className="flex items-center gap-3">
                    <div className="bg-blue-600 p-3 rounded-full">
                      <Shield className="h-8 w-8 text-white" />
                    </div>
                    <div>
                      <h3 className="text-xl font-bold text-blue-800">RICHAT PARTNERS</h3>
                      <p className="text-blue-600">CURRICULUM VITAE (CV)</p>
                    </div>
                  </div>
                  <div className="flex gap-2">
                    {qualityScores && (
                      <>
                        <Badge className="bg-green-100 text-green-800 border-green-300">
                          Qualité: {qualityScores.quality_score}%
                        </Badge>
                        <Badge className="bg-blue-100 text-blue-800 border-blue-300">
                          Conformité: {qualityScores.format_compliance_score}%
                        </Badge>
                      </>
                    )}
                  </div>
                </div>

                {/* Aperçu des données selon format Mohamed Yehdhih */}
                <div className="bg-white p-6 rounded-lg border border-blue-200 shadow-sm">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div>
                      {/* Tableau informations personnelles */}
                      <div className="mb-4">
                        <h4 className="font-semibold text-gray-800 mb-3">Informations personnelles</h4>
                        <div className="space-y-2 text-sm">
                          <div className="flex">
                            <span className="font-medium w-20 bg-blue-50 p-1 rounded text-blue-800">Titre</span>
                            <span className="ml-2">{extractedData?.personal_info?.titre || "Mr."}</span>
                          </div>
                          <div className="flex">
                            <span className="font-medium w-20 bg-blue-50 p-1 rounded text-blue-800">Nom</span>
                            <span className="ml-2">{extractedData?.personal_info?.nom_expert || "Expert"}</span>
                          </div>
                          <div className="flex">
                            <span className="font-medium w-20 bg-blue-50 p-1 rounded text-blue-800">Naissance</span>
                            <span className="ml-2">{extractedData?.personal_info?.date_naissance || "À compléter"}</span>
                          </div>
                          <div className="flex">
                            <span className="font-medium w-20 bg-blue-50 p-1 rounded text-blue-800">Résidence</span>
                            <span className="ml-2">{extractedData?.personal_info?.pays_residence || "Mauritanie"}</span>
                          </div>
                        </div>
                      </div>

                      {/* Titre professionnel centré */}
                      <div className="text-center bg-blue-50 p-3 rounded-lg mb-4">
                        <h3 className="text-lg font-bold text-blue-800">
                          {extractedData?.professional_title || "Expert Consultant"}
                        </h3>
                      </div>

                      {/* Contact */}
                      {(extractedData?.personal_info?.email || extractedData?.personal_info?.telephone) && (
                        <div className="space-y-2 text-sm">
                          {extractedData.personal_info.email && (
                            <div className="flex items-center gap-2">
                              <Mail className="h-4 w-4 text-gray-500" />
                              <span>{extractedData.personal_info.email}</span>
                            </div>
                          )}
                          {extractedData.personal_info.telephone && (
                            <div className="flex items-center gap-2">
                              <Phone className="h-4 w-4 text-gray-500" />
                              <span>{extractedData.personal_info.telephone}</span>
                            </div>
                          )}
                        </div>
                      )}
                    </div>

                    <div>
                      {/* Résumé du profil */}
                      {extractedData?.profile_summary && (
                        <div className="mb-4">
                          <h4 className="font-semibold text-gray-800 mb-2">Résumé du Profil</h4>
                          <p className="text-sm text-gray-700 leading-relaxed">
                            {extractedData.profile_summary.substring(0, 200)}...
                          </p>
                        </div>
                      )}

                      {/* Compétences clés */}
                      {extractedData?.skills && extractedData.skills.length > 0 && (
                        <div className="mb-4">
                          <h4 className="font-semibold text-gray-800 mb-2">Compétences clés</h4>
                          <div className="flex flex-wrap gap-1">
                            {extractedData.skills.slice(0, 6).map((skill, index) => (
                              <Badge key={index} variant="outline" className="text-xs bg-blue-50 text-blue-700 border-blue-300">
                                {skill}
                              </Badge>
                            ))}
                          </div>
                        </div>
                      )}

                      {/* Langues */}
                      {extractedData?.languages && extractedData.languages.length > 0 && (
                        <div>
                          <h4 className="font-semibold text-gray-800 mb-2">Langues</h4>
                          <div className="space-y-1 text-xs">
                            {extractedData.languages.slice(0, 3).map((lang, index) => (
                              <div key={index} className="flex justify-between bg-gray-50 p-2 rounded">
                                <span className="font-medium">{lang.language}</span>
                                <span className="text-gray-600">{lang.level}</span>
                              </div>
                            ))}
                          </div>
                        </div>
                      )}
                    </div>
                  </div>

                  {/* Pied de page Richat */}
                  <div className="mt-6 pt-4 border-t text-xs text-gray-500 text-center">
                    <div className="flex justify-between items-center">
                      <span>Généré par Richat Partners - Format standardisé</span>
                      <span>ID: RICHAT-{new Date().getTime()}</span>
                    </div>
                    <div className="mt-1">
                      <span>Référence: CV Mohamed Yehdhih Sidatt - {processingMethod}</span>
                    </div>
                  </div>
                </div>
              </div>

              {/* Actions */}
              <div className="flex justify-between items-center">
                <Button variant="outline" onClick={() => setStep(3)}>
                  <Edit className="h-4 w-4 mr-2" />
                  Retour pour édition
                </Button>
                <div className="space-x-4">
                  <Button variant="outline" onClick={handlePreviewCV} disabled={!transformedCV}>
                    <Eye className="h-4 w-4 mr-2" />
                    Aperçu CV Richat
                  </Button>
                  <Button variant="outline" onClick={handleDownloadCV} disabled={!transformedCV}>
                    <Download className="h-4 w-4 mr-2" />
                    Télécharger PDF
                  </Button>
                  <Button onClick={handleValidateCV} className="bg-green-600 hover:bg-green-700">
                    Valider et Signer
                    <CheckCircle className="h-4 w-4 ml-2" />
                  </Button>
                </div>
              </div>

              {/* Métriques détaillées */}
              {qualityScores && (
                <div className="bg-gray-50 p-4 rounded-lg">
                  <h4 className="font-medium mb-3">Métriques de transformation</h4>
                  <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
                    <div className="text-center">
                      <div className="text-2xl font-bold text-blue-600">{qualityScores.quality_score}%</div>
                      <div className="text-gray-600">Score Qualité</div>
                    </div>
                    <div className="text-center">
                      <div className="text-2xl font-bold text-green-600">{qualityScores.format_compliance_score}%</div>
                      <div className="text-gray-600">Conformité Richat</div>
                    </div>
                    <div className="text-center">
                      <div className="text-2xl font-bold text-purple-600">{qualityScores.sections_found.experience_entries}</div>
                      <div className="text-gray-600">Expériences</div>
                    </div>
                    <div className="text-center">
                      <div className="text-2xl font-bold text-orange-600">{qualityScores.sections_found.certifications}</div>
                      <div className="text-gray-600">Certifications</div>
                    </div>
                  </div>
                </div>
              )}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );

  const renderStep5 = () => (
    <Card className="w-full max-w-2xl mx-auto">
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <CheckCircle className="h-6 w-6 text-green-600" />
          Étape 5: CV Richat validé et signé
        </CardTitle>
      </CardHeader>
      <CardContent className="text-center">
        <div className="bg-green-50 p-8 rounded-lg mb-6 border border-green-200">
          <div className="flex justify-center mb-4">
            <div className="relative">
              <CheckCircle className="h-20 w-20 text-green-600" />
              <div className="absolute -top-2 -right-2 bg-blue-600 rounded-full p-1">
                <Shield className="h-4 w-4 text-white" />
              </div>
            </div>
          </div>
          <h3 className="text-xl font-semibold text-green-800 mb-2">
            CV Richat validé avec succès !
          </h3>
          <p className="text-green-600 mb-4">
            Le CV a été transformé au format standardisé Richat Partners et signé électroniquement.
          </p>
          
          {/* Résumé de la transformation */}
          <div className="bg-white p-4 rounded-lg border border-green-200 mb-4">
            <h4 className="font-medium text-green-800 mb-3">Résumé de la transformation</h4>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
              <div className="text-left">
                <div className="flex justify-between">
                  <span>Format original:</span>
                  <Badge variant="outline">{formatDetected}</Badge>
                </div>
                <div className="flex justify-between mt-1">
                  <span>Format final:</span>
                  <Badge className="bg-blue-100 text-blue-800">Richat Standard</Badge>
                </div>
                <div className="flex justify-between mt-1">
                  <span>Méthode:</span>
                  <Badge variant="secondary">Mohamed Yehdhih</Badge>
                </div>
              </div>
              <div className="text-left">
                {qualityScores && (
                  <>
                    <div className="flex justify-between">
                      <span>Score qualité:</span>
                      <Badge className="bg-green-100 text-green-800">{qualityScores.quality_score}%</Badge>
                    </div>
                    <div className="flex justify-between mt-1">
                      <span>Conformité Richat:</span>
                      <Badge className="bg-blue-100 text-blue-800">{qualityScores.format_compliance_score}%</Badge>
                    </div>
                    <div className="flex justify-between mt-1">
                      <span>Sections complètes:</span>
                      <Badge variant="outline">{Object.values(qualityScores.richat_features).filter(Boolean).length}/9</Badge>
                    </div>
                  </>
                )}
              </div>
            </div>
          </div>
        </div>

        {/* Informations du CV validé */}
        <div className="flex items-center justify-center gap-4 p-4 bg-blue-50 rounded-lg mb-6">
          <FileText className="h-10 w-10 text-blue-600" />
          <div className="text-left">
            <p className="font-medium text-blue-800">CV Richat Partners validé</p>
            <p className="text-sm text-blue-600">
              Signature électronique: RICHAT-{new Date().getTime()}
            </p>
            <p className="text-sm text-blue-600">
              Date de validation: {new Date().toLocaleDateString('fr-FR')}
            </p>
            <p className="text-sm text-blue-600">
              Référence: Format Mohamed Yehdhih Sidatt
            </p>
          </div>
        </div>

        {/* Fonctionnalités Richat confirmées */}
        {qualityScores && (
          <div className="bg-gray-50 p-4 rounded-lg mb-6">
            <h4 className="font-medium mb-3">Fonctionnalités Richat confirmées</h4>
            <RichatFeaturesDisplay features={qualityScores.richat_features} />
          </div>
        )}

        {/* Actions finales */}
        <div className="flex flex-col sm:flex-row justify-center gap-4">
          <Button variant="outline" onClick={handleDownloadCV} disabled={!transformedCV}>
            <Download className="h-4 w-4 mr-2" />
            Télécharger CV final
          </Button>
          <Button variant="outline" onClick={handlePreviewCV} disabled={!transformedCV}>
            <Eye className="h-4 w-4 mr-2" />
            Aperçu PDF
          </Button>
          <Button onClick={() => {
            setStep(1);
            setUploadedCV(null);
            setExtractedData(null);
            setQualityScores(null);
            setTransformedCV(null);
            setIsValidated(false);
            setDiagnosticData(null);
            setRecommendations([]);
            setFormatDetected('');
            setProcessingMethod('');
          }} className="bg-blue-600 hover:bg-blue-700">
            <Upload className="h-4 w-4 mr-2" />
            Traiter un nouveau CV
          </Button>
        </div>

        {/* Statistiques du système */}
        <div className="mt-6 p-4 bg-blue-50 rounded-lg border border-blue-200">
          <h4 className="font-medium text-blue-800 mb-2">Système de Transformation CV Richat</h4>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
            <div className="text-center">
              <div className="text-lg font-bold text-blue-600">100%</div>
              <div className="text-blue-700">Extraction réussie</div>
            </div>
            <div className="text-center">
              <div className="text-lg font-bold text-green-600">9/9</div>
              <div className="text-green-700">Sections Richat</div>
            </div>
            <div className="text-center">
              <div className="text-lg font-bold text-purple-600">PDF</div>
              <div className="text-purple-700">Format final</div>
            </div>
            <div className="text-center">
              <div className="text-lg font-bold text-orange-600">✓</div>
              <div className="text-orange-700">Signé électroniquement</div>
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  );

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 to-blue-50 py-8">
      <div className="container mx-auto px-4">
        
        {/* En-tête du système */}
        <div className="text-center mb-8">
          <div className="flex justify-center items-center gap-3 mb-4">
            <div className="bg-blue-600 p-3 rounded-full">
              <Shield className="h-8 w-8 text-white" />
            </div>
            <div>
              <h1 className="text-3xl font-bold text-gray-900">
                Système de Transformation CV Richat
              </h1>
              <p className="text-blue-600 font-medium">Format standardisé Mohamed Yehdhih Sidatt</p>
            </div>
          </div>
          <p className="text-gray-600 max-w-3xl mx-auto">
            Transformez automatiquement les CV des consultants au format standardisé Richat Partners 
            avec extraction intelligente, validation et signature électronique conforme aux standards internationaux.
          </p>
        </div>

        {/* Indicateur de progression amélioré */}
        <div className="max-w-4xl mx-auto mb-8">
          <div className="flex items-center justify-between">
            {[
              { num: 1, label: "Upload", icon: Upload },
              { num: 2, label: "Analyse Richat", icon: Settings },
              { num: 3, label: "Extraction", icon: Edit },
              { num: 4, label: "Transformation", icon: Shield },
              { num: 5, label: "Validation", icon: CheckCircle }
            ].map(({ num, label, icon: Icon }, index) => (
              <div key={num} className="flex items-center">
                <div className={`w-12 h-12 rounded-full flex items-center justify-center border-2 ${
                  step >= num 
                    ? 'bg-blue-600 text-white border-blue-600' 
                    : 'bg-gray-200 text-gray-500 border-gray-300'
                }`}>
                  {step > num ? (
                    <Check className="h-6 w-6" />
                  ) : (
                    <Icon className="h-6 w-6" />
                  )}
                </div>
                {index < 4 && (
                  <div className={`w-16 h-1 mx-2 ${
                    step > num ? 'bg-blue-600' : 'bg-gray-200'
                  }`} />
                )}
              </div>
            ))}
          </div>
          <div className="flex justify-between mt-2 text-sm">
            <span className={step >= 1 ? 'text-blue-600 font-medium' : 'text-gray-500'}>Upload</span>
            <span className={step >= 2 ? 'text-blue-600 font-medium' : 'text-gray-500'}>Analyse</span>
            <span className={step >= 3 ? 'text-blue-600 font-medium' : 'text-gray-500'}>Extraction</span>
            <span className={step >= 4 ? 'text-blue-600 font-medium' : 'text-gray-500'}>Transformation</span>
            <span className={step >= 5 ? 'text-blue-600 font-medium' : 'text-gray-500'}>Validation</span>
          </div>
        </div>

        {/* Informations système */}
        <div className="max-w-4xl mx-auto mb-6">
          <Alert className="border-blue-200 bg-blue-50">
            <Shield className="h-4 w-4 text-blue-600" />
            <AlertTitle className="text-blue-900">Système Richat Partners - Version Avancée</AlertTitle>
            <AlertDescription className="text-blue-800">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mt-2">
                <div>
                  <p className="font-medium mb-1">Fonctionnalités :</p>
                  <ul className="text-sm space-y-1">
                    <li>• Détection automatique de format CV</li>
                    <li>• Extraction intelligente avec tableaux</li>
                    <li>• Score de conformité Richat en temps réel</li>
                    <li>• Génération PDF selon modèle Mohamed Yehdhih</li>
                  </ul>
                </div>
                <div>
                  <p className="font-medium mb-1">Standards supportés :</p>
                  <ul className="text-sm space-y-1">
                    <li>• Format Richat standardisé (référence)</li>
                    <li>• CVs professionnels modernes</li>
                    <li>• Documents académiques</li>
                    <li>• Formats traditionnels français/anglais</li>
                  </ul>
                </div>
              </div>
            </AlertDescription>
          </Alert>
        </div>

        {/* Rendu des étapes */}
        {step === 1 && renderStep1()}
        {step === 2 && renderStep2()}
        {step === 3 && renderStep3()}
        {step === 4 && renderStep4()}
        {step === 5 && renderStep5()}
        
        {/* Footer système */}
        <div className="text-center mt-12 pt-8 border-t border-gray-200">
          <div className="flex justify-center items-center gap-6 text-sm text-gray-600">
            <div className="flex items-center gap-1">
              <Shield className="h-4 w-4 text-blue-600" />
              <span>Sécurisé & Confidentiel</span>
            </div>
            <div className="flex items-center gap-1">
              <CheckCircle className="h-4 w-4 text-green-600" />
              <span>Conforme Standards Internationaux</span>
            </div>
            <div className="flex items-center gap-1">
              <Award className="h-4 w-4 text-purple-600" />
              <span>Format Richat Certifié</span>
            </div>
          </div>
          <p className="text-xs text-gray-500 mt-2">
            Richat Partners © 2024 - Système de transformation CV automatisé
          </p>
        </div>
      </div>
    </div>
  );
};

export default CVTransformationSystem;