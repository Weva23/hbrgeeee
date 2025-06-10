import React, { useState, useRef } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { 
  Upload, 
  FileText, 
  Download, 
  Check, 
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
  Eye,
  Settings,
  BarChart3
} from 'lucide-react';

interface ExtractedData {
  personal_info: {
    full_name?: string;
    title?: string;
    email?: string;
    phone?: string;
    birth_date?: string;
    nationality?: string;
    residence?: string;
  };
  professional_summary?: string;
  education: Array<{
    institution?: string;
    period?: string;
    degree?: string;
    description?: string;
  }>;
  experience: Array<{
    company?: string;
    position?: string;
    period?: string;
    location?: string;
    description?: string[];
  }>;
  skills: string[];
  languages: Array<{
    language?: string;
    level?: string;
  }>;
  certifications: string[];
}

interface ProcessingStats {
  text_length: number;
  personal_info_fields: number;
  skills_count: number;
  experience_count: number;
  education_count: number;
  languages_count: number;
  certifications_count: number;
  has_professional_summary: boolean;
}

const ImprovedCVProcessor = () => {
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [isProcessing, setIsProcessing] = useState(false);
  const [processingStep, setProcessingStep] = useState('');
  const [progress, setProgress] = useState(0);
  const [extractedData, setExtractedData] = useState<ExtractedData | null>(null);
  const [processingStats, setProcessingStats] = useState<ProcessingStats | null>(null);
  const [generatedCvUrl, setGeneratedCvUrl] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [showDiagnosis, setShowDiagnosis] = useState(false);
  const [diagnosisData, setDiagnosisData] = useState<any>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleFileSelect = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file) {
      setSelectedFile(file);
      setExtractedData(null);
      setError(null);
      setGeneratedCvUrl(null);
      setProgress(0);
    }
  };

  const processCV = async () => {
    if (!selectedFile) return;

    setIsProcessing(true);
    setError(null);
    setProgress(0);

    try {
      const formData = new FormData();
      formData.append('cv', selectedFile);
      formData.append('consultant_id', Date.now().toString());

      // Simulation du progrès
      const progressInterval = setInterval(() => {
        setProgress(prev => {
          if (prev >= 90) {
            clearInterval(progressInterval);
            return 90;
          }
          return prev + 10;
        });
      }, 500);

      setProcessingStep('Extraction du texte...');
      
      const response = await fetch('http://127.0.0.1:8000/api/consultant/process-cv-enhanced/', {
        method: 'POST',
        body: formData,
      });

      const data = await response.json();
      clearInterval(progressInterval);
      setProgress(100);

      if (!response.ok) {
        throw new Error(data.error || 'Erreur lors du traitement');
      }

      if (data.success) {
        setExtractedData(data.extracted_data);
        setProcessingStats(data.stats);
        setGeneratedCvUrl(data.cv_url);
        setProcessingStep('Traitement terminé avec succès !');
      } else {
        throw new Error(data.message || 'Erreur lors du traitement');
      }

    } catch (err) {
      console.error('Erreur:', err);
      setError(err instanceof Error ? err.message : 'Erreur inconnue');
      setProcessingStep('Erreur lors du traitement');
    } finally {
      setIsProcessing(false);
    }
  };

  const runDiagnosis = async () => {
    if (!selectedFile) return;

    setShowDiagnosis(true);
    
    try {
      const formData = new FormData();
      formData.append('cv', selectedFile);

      const response = await fetch('http://127.0.0.1:8000/api/consultant/diagnose-cv/', {
        method: 'POST',
        body: formData,
      });

      const data = await response.json();
      setDiagnosisData(data);

    } catch (err) {
      console.error('Erreur diagnostic:', err);
    }
  };

  const getQualityScore = () => {
    if (!processingStats) return 0;
    
    let score = 0;
    
    // Informations personnelles (40%)
    if (extractedData?.personal_info?.full_name) score += 15;
    if (extractedData?.personal_info?.email) score += 10;
    if (extractedData?.personal_info?.phone) score += 10;
    if (extractedData?.personal_info?.title) score += 5;
    
    // Compétences (25%)
    score += Math.min(25, processingStats.skills_count * 2);
    
    // Expérience (20%)
    score += Math.min(20, processingStats.experience_count * 5);
    
    // Éducation (10%)
    score += Math.min(10, processingStats.education_count * 3);
    
    // Langues (5%)
    score += Math.min(5, processingStats.languages_count);
    
    return Math.min(100, score);
  };

  const getQualityColor = (score: number) => {
    if (score >= 80) return 'text-green-600 bg-green-100';
    if (score >= 60) return 'text-blue-600 bg-blue-100';
    if (score >= 40) return 'text-yellow-600 bg-yellow-100';
    return 'text-red-600 bg-red-100';
  };

  return (
    <div className="max-w-6xl mx-auto p-6 space-y-6">
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <FileText className="h-6 w-6 text-blue-600" />
            Processeur CV Amélioré - Extraction Française/Arabe
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-6">
          
          {/* Zone de téléchargement */}
          <div className="border-2 border-dashed border-gray-300 rounded-lg p-8 text-center">
            <input
              ref={fileInputRef}
              type="file"
              accept=".pdf,.doc,.docx"
              onChange={handleFileSelect}
              className="hidden"
            />
            
            {!selectedFile ? (
              <div className="space-y-4">
                <Upload className="h-12 w-12 text-gray-400 mx-auto" />
                <div>
                  <p className="text-lg font-medium">Télécharger un CV</p>
                  <p className="text-gray-500">PDF, DOC ou DOCX (max 20MB)</p>
                </div>
                <Button 
                  onClick={() => fileInputRef.current?.click()}
                  className="bg-blue-600 hover:bg-blue-700"
                >
                  Choisir un fichier
                </Button>
              </div>
            ) : (
              <div className="space-y-4">
                <FileText className="h-12 w-12 text-green-600 mx-auto" />
                <div>
                  <p className="font-medium">{selectedFile.name}</p>
                  <p className="text-gray-500">{(selectedFile.size / 1024 / 1024).toFixed(2)} MB</p>
                </div>
                <div className="flex gap-2 justify-center">
                  <Button 
                    onClick={processCV}
                    disabled={isProcessing}
                    className="bg-green-600 hover:bg-green-700"
                  >
                    {isProcessing ? (
                      <>
                        <RefreshCw className="h-4 w-4 mr-2 animate-spin" />
                        Traitement...
                      </>
                    ) : (
                      <>
                        <CheckCircle className="h-4 w-4 mr-2" />
                        Traiter le CV
                      </>
                    )}
                  </Button>
                  
                  <Button 
                    variant="outline"
                    onClick={runDiagnosis}
                    disabled={isProcessing}
                  >
                    <Settings className="h-4 w-4 mr-2" />
                    Diagnostic
                  </Button>
                  
                  <Button 
                    variant="outline"
                    onClick={() => {
                      setSelectedFile(null);
                      setExtractedData(null);
                      setError(null);
                      setGeneratedCvUrl(null);
                    }}
                  >
                    Nouveau fichier
                  </Button>
                </div>
              </div>
            )}
          </div>

          {/* Barre de progression */}
          {isProcessing && (
            <div className="space-y-2">
              <div className="flex justify-between text-sm">
                <span>{processingStep}</span>
                <span>{progress}%</span>
              </div>
              <Progress value={progress} className="h-3" />
            </div>
          )}

          {/* Erreur */}
          {error && (
            <Alert variant="destructive">
              <AlertCircle className="h-4 w-4" />
              <AlertTitle>Erreur de traitement</AlertTitle>
              <AlertDescription>{error}</AlertDescription>
            </Alert>
          )}

          {/* Statistiques de qualité */}
          {processingStats && (
            <Card className="bg-gradient-to-r from-blue-50 to-green-50">
              <CardHeader>
                <CardTitle className="flex items-center justify-between">
                  <span className="flex items-center gap-2">
                    <BarChart3 className="h-5 w-5" />
                    Qualité d'extraction
                  </span>
                  <Badge className={`px-3 py-1 ${getQualityColor(getQualityScore())}`}>
                    Score: {getQualityScore()}%
                  </Badge>
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                  <div className="text-center">
                    <div className="text-2xl font-bold text-blue-600">{processingStats.text_length}</div>
                    <div className="text-sm text-gray-600">Caractères extraits</div>
                  </div>
                  <div className="text-center">
                    <div className="text-2xl font-bold text-green-600">{processingStats.skills_count}</div>
                    <div className="text-sm text-gray-600">Compétences</div>
                  </div>
                  <div className="text-center">
                    <div className="text-2xl font-bold text-purple-600">{processingStats.experience_count}</div>
                    <div className="text-sm text-gray-600">Expériences</div>
                  </div>
                  <div className="text-center">
                    <div className="text-2xl font-bold text-orange-600">{processingStats.education_count}</div>
                    <div className="text-sm text-gray-600">Formations</div>
                  </div>
                </div>
              </CardContent>
            </Card>
          )}

          {/* Données extraites */}
          {extractedData && (
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              
              {/* Informations personnelles */}
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <User className="h-5 w-5" />
                    Informations personnelles
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  {extractedData.personal_info.full_name && (
                    <div className="flex items-center gap-2">
                      <User className="h-4 w-4 text-gray-500" />
                      <span className="font-medium">{extractedData.personal_info.full_name}</span>
                    </div>
                  )}
                  
                  {extractedData.personal_info.title && (
                    <div className="flex items-center gap-2">
                      <Award className="h-4 w-4 text-gray-500" />
                      <span>{extractedData.personal_info.title}</span>
                    </div>
                  )}
                  
                  {extractedData.personal_info.email && (
                    <div className="flex items-center gap-2">
                      <Mail className="h-4 w-4 text-gray-500" />
                      <span>{extractedData.personal_info.email}</span>
                    </div>
                  )}
                  
                  {extractedData.personal_info.phone && (
                    <div className="flex items-center gap-2">
                      <Phone className="h-4 w-4 text-gray-500" />
                      <span>{extractedData.personal_info.phone}</span>
                    </div>
                  )}
                  
                  {(extractedData.personal_info.nationality || extractedData.personal_info.residence) && (
                    <div className="flex items-center gap-2">
                      <MapPin className="h-4 w-4 text-gray-500" />
                      <span>
                        {extractedData.personal_info.nationality}
                        {extractedData.personal_info.nationality && extractedData.personal_info.residence && ' - '}
                        {extractedData.personal_info.residence}
                      </span>
                    </div>
                  )}
                </CardContent>
              </Card>

              {/* Compétences */}
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <CheckCircle className="h-5 w-5" />
                    Compétences extraites ({extractedData.skills.length})
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="flex flex-wrap gap-2">
                    {extractedData.skills.slice(0, 15).map((skill, index) => (
                      <Badge key={index} variant="secondary" className="text-xs">
                        {skill}
                      </Badge>
                    ))}
                    {extractedData.skills.length > 15 && (
                      <Badge variant="outline" className="text-xs">
                        +{extractedData.skills.length - 15} autres
                      </Badge>
                    )}
                  </div>
                </CardContent>
              </Card>

              {/* Expérience professionnelle */}
              {extractedData.experience.length > 0 && (
                <Card className="lg:col-span-2">
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                      <Briefcase className="h-5 w-5" />
                      Expérience professionnelle ({extractedData.experience.length})
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-4">
                      {extractedData.experience.slice(0, 3).map((exp, index) => (
                        <div key={index} className="border-l-4 border-blue-500 pl-4 space-y-1">
                          <div className="flex flex-wrap items-center gap-2">
                            {exp.position && (
                              <span className="font-medium text-blue-600">{exp.position}</span>
                            )}
                            {exp.company && (
                              <span className="text-gray-600">chez {exp.company}</span>
                            )}
                          </div>
                          <div className="flex items-center gap-4 text-sm text-gray-500">
                            {exp.period && (
                              <span className="flex items-center gap-1">
                                <Calendar className="h-3 w-3" />
                                {exp.period}
                              </span>
                            )}
                            {exp.location && (
                              <span className="flex items-center gap-1">
                                <MapPin className="h-3 w-3" />
                                {exp.location}
                              </span>
                            )}
                          </div>
                          {Array.isArray(exp.description) && exp.description.length > 0 && (
                            <p className="text-sm text-gray-700 line-clamp-2">
                              {exp.description.slice(0, 2).join(' • ')}
                            </p>
                          )}
                        </div>
                      ))}
                      {extractedData.experience.length > 3 && (
                        <p className="text-sm text-gray-500 text-center">
                          +{extractedData.experience.length - 3} autres expériences
                        </p>
                      )}
                    </div>
                  </CardContent>
                </Card>
              )}

              {/* Formation */}
              {extractedData.education.length > 0 && (
                <Card>
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                      <GraduationCap className="h-5 w-5" />
                      Formation ({extractedData.education.length})
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-3">
                      {extractedData.education.slice(0, 3).map((edu, index) => (
                        <div key={index} className="space-y-1">
                          {edu.degree && (
                            <div className="font-medium text-green-600">{edu.degree}</div>
                          )}
                          {edu.institution && (
                            <div className="text-gray-700">{edu.institution}</div>
                          )}
                          {edu.period && (
                            <div className="text-sm text-gray-500">{edu.period}</div>
                          )}
                        </div>
                      ))}
                    </div>
                  </CardContent>
                </Card>
              )}

              {/* Langues */}
              {extractedData.languages.length > 0 && (
                <Card>
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                      <Languages className="h-5 w-5" />
                      Langues ({extractedData.languages.length})
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-2">
                      {extractedData.languages.map((lang, index) => (
                        <div key={index} className="flex justify-between items-center">
                          <span className="font-medium">{lang.language}</span>
                          <Badge variant="outline" className="text-xs">
                            {lang.level}
                          </Badge>
                        </div>
                      ))}
                    </div>
                  </CardContent>
                </Card>
              )}

              {/* Certifications */}
              {extractedData.certifications.length > 0 && (
                <Card className="lg:col-span-2">
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                      <Award className="h-5 w-5" />
                      Certifications ({extractedData.certifications.length})
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
                      {extractedData.certifications.map((cert, index) => (
                        <div key={index} className="text-sm p-2 bg-gray-50 rounded border-l-4 border-yellow-500">
                          {cert}
                        </div>
                      ))}
                    </div>
                  </CardContent>
                </Card>
              )}

              {/* Résumé professionnel */}
              {extractedData.professional_summary && (
                <Card className="lg:col-span-2">
                  <CardHeader>
                    <CardTitle>Résumé professionnel</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <p className="text-gray-700 leading-relaxed">
                      {extractedData.professional_summary}
                    </p>
                  </CardContent>
                </Card>
              )}
            </div>
          )}

          {/* CV généré */}
          {generatedCvUrl && (
            <Card className="bg-gradient-to-r from-green-50 to-blue-50 border-green-200">
              <CardHeader>
                <CardTitle className="flex items-center justify-between">
                  <span className="flex items-center gap-2">
                    <CheckCircle className="h-6 w-6 text-green-600" />
                    CV Richat généré avec succès
                  </span>
                  <Badge className="bg-green-100 text-green-800">
                    Format Richat v2.1
                  </Badge>
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="flex gap-4">
                  <Button 
                    onClick={() => window.open(generatedCvUrl, '_blank')}
                    className="bg-green-600 hover:bg-green-700"
                  >
                    <Eye className="h-4 w-4 mr-2" />
                    Aperçu
                  </Button>
                  
                  <Button 
                    variant="outline"
                    onClick={() => {
                      const link = document.createElement('a');
                      link.href = generatedCvUrl;
                      link.download = `CV_Richat_${extractedData?.personal_info?.full_name?.replace(/\s+/g, '_') || 'consultant'}.pdf`;
                      link.click();
                    }}
                  >
                    <Download className="h-4 w-4 mr-2" />
                    Télécharger
                  </Button>
                </div>
                
                <div className="mt-4 p-4 bg-white rounded-lg border">
                  <h4 className="font-medium text-green-800 mb-2">
                    Améliorations apportées :
                  </h4>
                  <ul className="text-sm text-green-700 space-y-1">
                    <li>✓ Extraction améliorée pour texte français/arabe</li>
                    <li>✓ Reconnaissance contextuelle des sections</li>
                    <li>✓ Format standardisé Richat professionnel</li>
                    <li>✓ Validation et nettoyage des données</li>
                    <li>✓ Structure optimisée pour les processus RH</li>
                  </ul>
                </div>
              </CardContent>
            </Card>
          )}

          {/* Diagnostic détaillé */}
          {showDiagnosis && diagnosisData && (
            <Card className="border-yellow-200">
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Settings className="h-5 w-5 text-yellow-600" />
                  Diagnostic d'extraction
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  
                  {/* Statut général */}
                  <div className="flex items-center justify-between p-3 bg-gray-50 rounded">
                    <span>Statut d'extraction</span>
                    <Badge variant={diagnosisData.success ? "default" : "destructive"}>
                      {diagnosisData.success ? "Succès" : "Échec"}
                    </Badge>
                  </div>

                  {/* Métriques de qualité */}
                  {diagnosisData.quality_metrics && (
                    <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
                      <div className="text-center p-3 bg-blue-50 rounded">
                        <div className="font-medium text-blue-800">Nom</div>
                        <div className={`text-sm ${diagnosisData.quality_metrics.has_name ? 'text-green-600' : 'text-red-600'}`}>
                          {diagnosisData.quality_metrics.has_name ? '✓ Trouvé' : '✗ Manquant'}
                        </div>
                      </div>
                      
                      <div className="text-center p-3 bg-green-50 rounded">
                        <div className="font-medium text-green-800">Email</div>
                        <div className={`text-sm ${diagnosisData.quality_metrics.has_email ? 'text-green-600' : 'text-red-600'}`}>
                          {diagnosisData.quality_metrics.has_email ? '✓ Trouvé' : '✗ Manquant'}
                        </div>
                      </div>
                      
                      <div className="text-center p-3 bg-purple-50 rounded">
                        <div className="font-medium text-purple-800">Téléphone</div>
                        <div className={`text-sm ${diagnosisData.quality_metrics.has_phone ? 'text-green-600' : 'text-red-600'}`}>
                          {diagnosisData.quality_metrics.has_phone ? '✓ Trouvé' : '✗ Manquant'}
                        </div>
                      </div>
                      
                      <div className="text-center p-3 bg-yellow-50 rounded">
                        <div className="font-medium text-yellow-800">Compétences</div>
                        <div className="text-sm text-yellow-700">
                          {diagnosisData.quality_metrics.skills_found || 0} trouvées
                        </div>
                      </div>
                      
                      <div className="text-center p-3 bg-indigo-50 rounded">
                        <div className="font-medium text-indigo-800">Expériences</div>
                        <div className="text-sm text-indigo-700">
                          {diagnosisData.quality_metrics.experience_entries || 0} entrées
                        </div>
                      </div>
                      
                      <div className="text-center p-3 bg-pink-50 rounded">
                        <div className="font-medium text-pink-800">Formations</div>
                        <div className="text-sm text-pink-700">
                          {diagnosisData.quality_metrics.education_entries || 0} entrées
                        </div>
                      </div>
                    </div>
                  )}

                  {/* Aperçu du texte extrait */}
                  {diagnosisData.text_extraction?.text_preview && (
                    <div className="space-y-2">
                      <h4 className="font-medium">Aperçu du texte extrait :</h4>
                      <div className="p-3 bg-gray-100 rounded text-sm font-mono max-h-32 overflow-y-auto">
                        {diagnosisData.text_extraction.text_preview}
                      </div>
                      <p className="text-xs text-gray-500">
                        Longueur totale : {diagnosisData.text_extraction?.text_length || 0} caractères
                      </p>
                    </div>
                  )}

                  <Button 
                    variant="outline" 
                    onClick={() => setShowDiagnosis(false)}
                    className="w-full"
                  >
                    Fermer le diagnostic
                  </Button>
                </div>
              </CardContent>
            </Card>
          )}
        </CardContent>
      </Card>
    </div>
  );
};

export default ImprovedCVProcessor;