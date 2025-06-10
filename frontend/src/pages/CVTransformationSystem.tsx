import React, { useState, useRef } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Badge } from '@/components/ui/badge';
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
  AlertCircle
} from 'lucide-react';

const CVTransformationSystem = () => {
  const [step, setStep] = useState(1);
  const [uploadedCV, setUploadedCV] = useState(null);
  const [extractedData, setExtractedData] = useState(null);
  const [transformedCV, setTransformedCV] = useState(null);
  const [isProcessing, setIsProcessing] = useState(false);
  const [isValidated, setIsValidated] = useState(false);
  const fileInputRef = useRef(null);

  // Simulation des données extraites du CV
  const simulateDataExtraction = (file) => {
    return {
      personalInfo: {
        nom: "Amadou Tidjane Dieng",
        prenom: "Amadou Tidjane",
        titre: "Expert Postal",
        dateNaissance: "02-01-1978",
        nationalite: "Mauritanienne",
        residence: "Kaedi, Mauritanie",
        email: "amadou.dieng@example.com",
        telephone: "+222 XX XX XX XX"
      },
      education: [
        {
          institution: "Ecole Multinationale Supérieure des Postes - Abidjan",
          periode: "1993",
          diplome: "Administrateur des Postes et Services Financiers"
        },
        {
          institution: "Université de Nouakchott",
          periode: "2014",
          diplome: "Licence en Droit Privé"
        },
        {
          institution: "Université de Nouakchott",
          periode: "2021",
          diplome: "Master 2 en Droit Privé, Option Droit des Affaires"
        }
      ],
      experience: [
        {
          entreprise: "Office des Postes et Télécommunications",
          poste: "Directeur régional de la Poste",
          periode: "Décembre 1993 – Mars 2022",
          lieu: "Mauritanie",
          description: "Gestion et développement des services postaux dans la région du Hodh El Charghi"
        },
        {
          entreprise: "Ministère de l'Intérieur",
          poste: "Inspecteur de l'Administration Territoriale",
          periode: "Depuis fin 2023",
          lieu: "Mauritanie",
          description: "Inspection des services administratifs déconcentrés"
        }
      ],
      competences: [
        "Gestion postale",
        "Services financiers postaux",
        "Adressage postal",
        "Administration territoriale",
        "Inspection et audit",
        "Gestion de projet",
        "Droit des affaires"
      ],
      langues: [
        { langue: "Français", niveau: "Excellent" },
        { langue: "Anglais", niveau: "Moyen" },
        { langue: "Arabe", niveau: "Natif" }
      ],
      certifications: [
        "Formation UPU sur la norme ISO19160 – 2020",
        "Atelier régional sur l'implémentation d'un système national d'adressage – Abidjan, 2019"
      ]
    };
  };

const handleFileUpload = async (event) => {
  const file = event.target.files[0];
  if (file) {
    setUploadedCV(file);
    setStep(2);
    setIsProcessing(true);

    const formData = new FormData();
    formData.append('cv', file);
    formData.append('consultant_id', '123'); // ou ID réel

    try {
      const response = await fetch('/api/cv/process/', {
        method: 'POST',
        body: formData
      });

      const data = await response.json();

      if (response.ok) {
        setExtractedData({
          personalInfo: {
            nom: data.extracted_data.personal_info.full_name?.split(' ').slice(-1).join(' '),
            prenom: data.extracted_data.personal_info.full_name?.split(' ').slice(0, -1).join(' '),
            titre: data.extracted_data.personal_info.title,
            email: data.extracted_data.personal_info.email,
            telephone: data.extracted_data.personal_info.phone,
            residence: data.extracted_data.personal_info.address
          },
          competences: data.extracted_data.skills,
          langues: data.extracted_data.languages.map(l => ({ langue: l, niveau: "Moyen" }))
        });
        setStep(3);
      } else {
        alert(data.error || 'Erreur lors du traitement du CV');
        setStep(1);
      }
    } catch (error) {
      alert('Erreur réseau : ' + error.message);
    }

    setIsProcessing(false);
  }
};


  const handleTransformToRichatFormat = () => {
    setIsProcessing(true);
    
    // Simulation de la transformation
    setTimeout(() => {
      setTransformedCV({
        ...extractedData,
        richatTemplate: true,
        generatedDate: new Date().toLocaleDateString('fr-FR'),
        templateVersion: "v2.0",
        richatStamp: "RICHAT-CV-" + Date.now()
      });
      setIsProcessing(false);
      setStep(4);
    }, 1500);
  };

  const handleValidateCV = () => {
    setIsValidated(true);
    setStep(5);
  };

  const renderStep1 = () => (
    <Card className="w-full max-w-2xl mx-auto">
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Upload className="h-6 w-6 text-blue-600" />
          Étape 1: Télécharger le CV original
        </CardTitle>
      </CardHeader>
      <CardContent>
        <div 
          className="border-2 border-dashed border-gray-300 rounded-lg p-12 text-center cursor-pointer hover:border-blue-500 transition-colors"
          onClick={() => fileInputRef.current?.click()}
        >
          <FileText className="h-12 w-12 text-gray-400 mx-auto mb-4" />
          <p className="text-lg font-medium mb-2">Cliquez pour télécharger votre CV</p>
          <p className="text-gray-500">Formats acceptés: PDF, DOC, DOCX</p>
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
          Étape 2: Extraction automatique des données
        </CardTitle>
      </CardHeader>
      <CardContent>
        <div className="text-center">
          <div className="flex items-center justify-center mb-4">
            <div className="relative">
              <FileText className="h-16 w-16 text-blue-600" />
              {isProcessing && (
                <RefreshCw className="h-8 w-8 text-green-600 animate-spin absolute -top-2 -right-2" />
              )}
            </div>
          </div>
          <h3 className="text-lg font-semibold mb-2">
            {uploadedCV?.name}
          </h3>
          <p className="text-gray-600 mb-4">
            {isProcessing 
              ? "Extraction des informations en cours..." 
              : "Extraction terminée avec succès!"}
          </p>
          <div className="w-full bg-gray-200 rounded-full h-2">
            <div 
              className={`bg-blue-600 h-2 rounded-full transition-all duration-2000 ${
                isProcessing ? 'w-3/4' : 'w-full'
              }`}
            />
          </div>
        </div>
      </CardContent>
    </Card>
  );

  const renderStep3 = () => (
    <div className="w-full max-w-4xl mx-auto space-y-6">
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Edit className="h-6 w-6 text-blue-600" />
            Étape 3: Vérification et édition des données extraites
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-6">
          {/* Informations personnelles */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium mb-1">Nom</label>
              <Input value={extractedData?.personalInfo?.nom || ''} readOnly />
            </div>
            <div>
              <label className="block text-sm font-medium mb-1">Prénom</label>
              <Input value={extractedData?.personalInfo?.prenom || ''} readOnly />
            </div>
            <div>
              <label className="block text-sm font-medium mb-1">Email</label>
              <Input value={extractedData?.personalInfo?.email || ''} readOnly />
            </div>
            <div>
              <label className="block text-sm font-medium mb-1">Téléphone</label>
              <Input value={extractedData?.personalInfo?.telephone || ''} readOnly />
            </div>
          </div>

          {/* Compétences */}
          <div>
            <label className="block text-sm font-medium mb-2">Compétences extraites</label>
            <div className="flex flex-wrap gap-2">
              {extractedData?.competences?.map((skill, index) => (
                <Badge key={index} variant="secondary">
                  {skill}
                </Badge>
              ))}
            </div>
          </div>

          {/* Langues */}
          <div>
            <label className="block text-sm font-medium mb-2">Langues</label>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              {extractedData?.langues?.map((lang, index) => (
                <div key={index} className="flex items-center justify-between p-2 border rounded">
                  <span>{lang.langue}</span>
                  <Badge variant="outline">{lang.niveau}</Badge>
                </div>
              ))}
            </div>
          </div>

          <div className="flex justify-end pt-4">
            <Button onClick={handleTransformToRichatFormat} className="bg-blue-600 hover:bg-blue-700">
              Transformer au format Richat
              <RefreshCw className="h-4 w-4 ml-2" />
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
            Étape 4: CV transformé au format Richat
          </CardTitle>
        </CardHeader>
        <CardContent>
          {isProcessing ? (
            <div className="text-center py-12">
              <RefreshCw className="h-12 w-12 text-blue-600 animate-spin mx-auto mb-4" />
              <p className="text-lg">Transformation en cours...</p>
            </div>
          ) : (
            <div className="space-y-6">
              {/* Preview du CV Richat */}
              <div className="bg-gray-50 p-6 rounded-lg border">
                <div className="flex items-center justify-between mb-4">
                  <img 
                    src="/api/placeholder/120/40" 
                    alt="Logo Richat" 
                    className="h-10"
                  />
                  <Badge className="bg-green-100 text-green-800">
                    Format Richat v2.0
                  </Badge>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div>
                    <h3 className="text-xl font-bold mb-2">
                      {transformedCV?.personalInfo?.nom}
                    </h3>
                    <p className="text-lg text-gray-600 mb-4">
                      {transformedCV?.personalInfo?.titre}
                    </p>
                    
                    <div className="space-y-2 text-sm">
                      <div className="flex items-center gap-2">
                        <Mail className="h-4 w-4 text-gray-500" />
                        {transformedCV?.personalInfo?.email}
                      </div>
                      <div className="flex items-center gap-2">
                        <Phone className="h-4 w-4 text-gray-500" />
                        {transformedCV?.personalInfo?.telephone}
                      </div>
                      <div className="flex items-center gap-2">
                        <MapPin className="h-4 w-4 text-gray-500" />
                        {transformedCV?.personalInfo?.residence}
                      </div>
                    </div>
                  </div>

                  <div>
                    <h4 className="font-semibold mb-2">Compétences clés</h4>
                    <div className="flex flex-wrap gap-1">
                      {transformedCV?.competences?.slice(0, 5).map((skill, index) => (
                        <Badge key={index} variant="outline" className="text-xs">
                          {skill}
                        </Badge>
                      ))}
                    </div>
                  </div>
                </div>

                <div className="mt-6 pt-4 border-t text-xs text-gray-500">
                  <div className="flex justify-between">
                    <span>Généré le: {transformedCV?.generatedDate}</span>
                    <span>ID: {transformedCV?.richatStamp}</span>
                  </div>
                </div>
              </div>

              <div className="flex justify-between">
                <Button variant="outline" onClick={() => setStep(3)}>
                  Retour pour édition
                </Button>
                <div className="space-x-4">
                  <Button variant="outline">
                    <Download className="h-4 w-4 mr-2" />
                    Télécharger CV Richat
                  </Button>
                  <Button onClick={handleValidateCV} className="bg-green-600 hover:bg-green-700">
                    Valider et Signer
                    <Check className="h-4 w-4 ml-2" />
                  </Button>
                </div>
              </div>
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
          Étape 5: CV validé et signé
        </CardTitle>
      </CardHeader>
      <CardContent className="text-center">
        <div className="bg-green-50 p-8 rounded-lg mb-6">
          <CheckCircle className="h-16 w-16 text-green-600 mx-auto mb-4" />
          <h3 className="text-xl font-semibold text-green-800 mb-2">
            CV validé avec succès !
          </h3>
          <p className="text-green-600">
            Le CV a été transformé au format Richat et signé électroniquement.
          </p>
        </div>

        <div className="space-y-4">
          <div className="flex items-center justify-center gap-4 p-4 bg-gray-50 rounded-lg">
            <FileText className="h-8 w-8 text-blue-600" />
            <div className="text-left">
              <p className="font-medium">CV Richat validé</p>
              <p className="text-sm text-gray-600">
                Signature électronique: {transformedCV?.richatStamp}
              </p>
              <p className="text-sm text-gray-600">
                Date de validation: {new Date().toLocaleDateString('fr-FR')}
              </p>
            </div>
          </div>

          <div className="flex justify-center space-x-4">
            <Button variant="outline">
              <Download className="h-4 w-4 mr-2" />
              Télécharger CV final
            </Button>
            <Button onClick={() => {
              setStep(1);
              setUploadedCV(null);
              setExtractedData(null);
              setTransformedCV(null);
              setIsValidated(false);
            }}>
              Traiter un nouveau CV
            </Button>
          </div>
        </div>
      </CardContent>
    </Card>
  );

  return (
    <div className="min-h-screen bg-gray-50 py-8">
      <div className="container mx-auto px-4">
        <div className="text-center mb-8">
          <h1 className="text-3xl font-bold text-gray-900 mb-4">
            Système de Transformation CV Richat
          </h1>
          <p className="text-gray-600 max-w-2xl mx-auto">
            Transformez automatiquement les CV des consultants au format standardisé Richat 
            avec validation et signature électronique.
          </p>
        </div>

        {/* Progress indicator */}
        <div className="max-w-4xl mx-auto mb-8">
          <div className="flex items-center justify-between">
            {[1, 2, 3, 4, 5].map((stepNum) => (
              <div key={stepNum} className="flex items-center">
                <div className={`w-10 h-10 rounded-full flex items-center justify-center ${
                  step >= stepNum 
                    ? 'bg-blue-600 text-white' 
                    : 'bg-gray-200 text-gray-500'
                }`}>
                  {step > stepNum ? (
                    <Check className="h-5 w-5" />
                  ) : (
                    stepNum
                  )}
                </div>
                {stepNum < 5 && (
                  <div className={`w-16 h-1 mx-2 ${
                    step > stepNum ? 'bg-blue-600' : 'bg-gray-200'
                  }`} />
                )}
              </div>
            ))}
          </div>
          <div className="flex justify-between mt-2 text-sm">
            <span>Upload</span>
            <span>Extraction</span>
            <span>Édition</span>
            <span>Transformation</span>
            <span>Validation</span>
          </div>
        </div>

        {/* Render current step */}
        {step === 1 && renderStep1()}
        {step === 2 && renderStep2()}
        {step === 3 && renderStep3()}
        {step === 4 && renderStep4()}
        {step === 5 && renderStep5()}
      </div>
    </div>
  );
};

export default CVTransformationSystem;