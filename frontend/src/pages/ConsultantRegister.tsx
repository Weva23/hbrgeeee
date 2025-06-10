import React, { useState, useRef, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import {
  Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle
} from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { toast } from "sonner";
import {
  Form, FormControl, FormField, FormItem, FormLabel, FormMessage, FormDescription
} from "@/components/ui/form";
import { 
  Select, 
  SelectContent, 
  SelectItem, 
  SelectTrigger, 
  SelectValue 
} from "@/components/ui/select";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { 
  InfoIcon, 
  FileTextIcon, 
  UploadIcon, 
  CheckCircleIcon, 
  XIcon, 
  AlertCircleIcon, 
  ExternalLinkIcon, 
  FileIcon, 
  RefreshCwIcon, 
  Shield,
  Star,
  TrendingUp,
  Users,
  Award,
  Clock,
  Download,
  Eye,
  Zap
} from "lucide-react";
import { Progress } from "@/components/ui/progress";
import { Checkbox } from "@/components/ui/checkbox";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";

// Configuration de l'API
const API_BASE_URL = "http://127.0.0.1:8000/api";

// Schéma de validation du formulaire
const formSchema = z.object({
  firstName: z.string()
    .min(2, "Le prénom doit contenir au moins 2 caractères")
    .max(50, "Le prénom ne peut pas dépasser 50 caractères")
    .regex(/^[A-Za-zÀ-ÿ\u0600-\u06FF\s\-'\.]+$/, "Le prénom contient des caractères invalides"),
  lastName: z.string()
    .min(2, "Le nom doit contenir au moins 2 caractères")
    .max(50, "Le nom ne peut pas dépasser 50 caractères")
    .regex(/^[A-Za-zÀ-ÿ\u0600-\u06FF\s\-'\.]+$/, "Le nom contient des caractères invalides"),
  email: z.string()
    .email("Format d'email invalide")
    .min(1, "L'email est requis"),
  phone: z.string()
    .min(8, "Le numéro de téléphone doit contenir au moins 8 caractères")
    .max(20, "Le numéro de téléphone est trop long")
    .regex(/^[\d\s\-\+\(\)]+$/, "Le numéro contient des caractères invalides"),
  country: z.string()
    .min(2, "Le pays doit contenir au moins 2 caractères")
    .max(100, "Le nom du pays est trop long"),
  city: z.string()
    .min(2, "La ville doit contenir au moins 2 caractères")
    .max(100, "Le nom de la ville est trop long"),
  startAvailability: z.string()
    .min(1, "Date de début requise")
    .refine((date) => new Date(date) >= new Date(), "La date doit être dans le futur"),
  endAvailability: z.string()
    .min(1, "Date de fin requise"),
  password: z.string()
    .min(8, "Le mot de passe doit contenir au moins 8 caractères")
    .max(128, "Le mot de passe est trop long")
    .regex(/^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)/, "Le mot de passe doit contenir au moins une minuscule, une majuscule et un chiffre"),
  confirmPassword: z.string()
    .min(1, "La confirmation du mot de passe est requise"),
  domainePrincipal: z.string()
    .min(1, "Domaine requis"),
  specialite: z.string()
    .min(2, "Sous-domaine requis")
    .max(200, "La spécialité est trop longue"),
  competences: z.string()
    .optional(),
  privacyAccepted: z.boolean()
    .refine((val) => val === true, {
      message: "Vous devez accepter la politique de confidentialité pour continuer"
    }),
}).refine((data) => data.password === data.confirmPassword, {
  message: "Les mots de passe ne correspondent pas",
  path: ["confirmPassword"],
}).refine((data) => new Date(data.endAvailability) > new Date(data.startAvailability), {
  message: "La date de fin doit être postérieure à la date de début",
  path: ["endAvailability"],
});

type FormValues = z.infer<typeof formSchema>;

// Interface pour les données extraites du CV
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
    description?: string[] | string;
  }>;
  skills: string[];
  languages: Array<{
    language?: string;
    level?: string;
  }>;
  certifications: string[];
}

// Interface pour les stats de traitement
interface ProcessingStats {
  text_length?: number;
  personal_info_found?: number;
  experience_entries?: number;
  education_entries?: number;
  skills_found?: number;
  languages_found?: number;
  extraction_method?: string;
}

// Interface pour les recommandations
interface Recommendations {
  message: string;
  type: 'info' | 'warning' | 'error' | 'success';
}

// Composant pour la politique de confidentialité
const PrivacyPolicyDialog = () => (
  <Dialog>
    <DialogTrigger asChild>
      <Button variant="link" className="h-auto p-0 text-blue-600 underline">
        Politique de confidentialité complète
        <ExternalLinkIcon className="ml-1 h-3 w-3" />
      </Button>
    </DialogTrigger>
    <DialogContent className="max-w-4xl max-h-[80vh] overflow-y-auto">
      <DialogHeader>
        <DialogTitle className="flex items-center gap-2">
          <Shield className="h-5 w-5 text-blue-600" />
          Politique de confidentialité – Recrutement
        </DialogTitle>
        <DialogDescription>
          Conditions de traitement de vos données personnelles par Richat Partners
        </DialogDescription>
      </DialogHeader>
      <div className="space-y-6 text-sm">
        <div className="bg-blue-50 p-4 rounded-lg border border-blue-200">
          <h3 className="font-semibold text-base mb-2 text-blue-800">1. Responsable du traitement</h3>
          <p className="text-blue-700">Richat Partners, en sa qualité de responsable du traitement, collecte et traite vos données personnelles dans le cadre de ses procédures de recrutement et de transformation automatique des CVs.</p>
        </div>
        
        <div>
          <h3 className="font-semibold text-base mb-2">2. Données collectées</h3>
          <p>Nous collectons les informations que vous fournissez volontairement :</p>
          <ul className="list-disc list-inside ml-4 mt-2 space-y-1">
            <li>Informations personnelles (nom, prénom, email, téléphone)</li>
            <li>Documents professionnels (CV, lettres de motivation)</li>
            <li>Données extraites automatiquement de votre CV</li>
            <li>Compétences, expériences et formations</li>
            <li>Scores de qualité et métriques d'analyse</li>
          </ul>
        </div>

        <div>
          <h3 className="font-semibold text-base mb-2">3. Finalité du traitement</h3>
          <p>Vos données sont utilisées exclusivement pour :</p>
          <ul className="list-disc list-inside ml-4 mt-2 space-y-1">
            <li>L'évaluation et l'amélioration de votre candidature</li>
            <li>La transformation automatique au format Richat standardisé</li>
            <li>L'analyse et le calcul du score de qualité de votre profil</li>
            <li>La gestion de notre base de talents et consultants</li>
            <li>La mise en relation avec des opportunités professionnelles</li>
            <li>L'amélioration de nos algorithmes d'extraction</li>
          </ul>
        </div>

        <div>
          <h3 className="font-semibold text-base mb-2">4. Traitement automatisé</h3>
          <p>Votre CV fera l'objet d'un traitement automatisé incluant :</p>
          <ul className="list-disc list-inside ml-4 mt-2 space-y-1">
            <li>Extraction automatique des informations personnelles</li>
            <li>Reconnaissance et catégorisation des compétences</li>
            <li>Analyse de l'expérience professionnelle</li>
            <li>Calcul d'un score de qualité personnalisé</li>
            <li>Génération d'un CV au format standardisé Richat</li>
          </ul>
        </div>

        <div>
          <h3 className="font-semibold text-base mb-2">5. Durée de conservation</h3>
          <p>Vos données sont conservées pendant 2 ans à compter de la date de soumission de votre CV, sauf demande contraire de votre part. Les CVs transformés au format Richat sont conservés pour faciliter vos futures candidatures.</p>
        </div>

        <div>
          <h3 className="font-semibold text-base mb-2">6. Destinataires</h3>
          <p>Seuls les collaborateurs habilités de Richat Partners ont accès à vos données. Les CVs transformés peuvent être partagés avec nos clients partenaires dans le cadre de missions spécifiques, avec votre consentement.</p>
        </div>

        <div>
          <h3 className="font-semibold text-base mb-2">7. Vos droits</h3>
          <p>Conformément au RGPD, vous disposez des droits suivants :</p>
          <ul className="list-disc list-inside ml-4 mt-2 space-y-1">
            <li>Droit d'accès à vos données personnelles</li>
            <li>Droit de rectification des données inexactes</li>
            <li>Droit de suppression de vos données</li>
            <li>Droit d'opposition au traitement</li>
            <li>Droit à la portabilité de vos données</li>
            <li>Droit de limitation du traitement</li>
          </ul>
          <p className="mt-2"><strong>Pour exercer vos droits :</strong> contact@richat-partners.com</p>
        </div>

        <div className="bg-green-50 p-4 rounded-lg border border-green-200">
          <h3 className="font-semibold text-base mb-2 text-green-800">8. Sécurité et transparence</h3>
          <p className="text-green-700">Richat Partners met en œuvre des mesures techniques et organisationnelles appropriées pour protéger vos données personnelles. Notre système de transformation CV utilise des technologies avancées tout en respectant votre vie privée.</p>
        </div>
      </div>
    </DialogContent>
  </Dialog>
);

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
    <div className="bg-amber-50 border border-amber-200 rounded-lg p-3">
      <h4 className="text-sm font-medium text-amber-800 mb-2 flex items-center gap-2">
        <InfoIcon className="h-4 w-4" />
        Recommandations d'amélioration
      </h4>
      <ul className="text-xs text-amber-700 space-y-1">
        {recommendations.map((rec, index) => (
          <li key={index} className="flex items-start gap-2">
            <span className="text-amber-500 mt-0.5">•</span>
            <span>{rec}</span>
          </li>
        ))}
      </ul>
    </div>
  );
};

const ConsultantRegister = () => {
  const [cvFile, setCvFile] = useState<File | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [registrationComplete, setRegistrationComplete] = useState(false);
  const [cvProcessing, setCvProcessing] = useState(false);
  const [uploadProgress, setUploadProgress] = useState(0);
  const [extractedData, setExtractedData] = useState<ExtractedData | null>(null);
  const [processingStats, setProcessingStats] = useState<ProcessingStats | null>(null);
  const [qualityScore, setQualityScore] = useState<number | null>(null);
  const [recommendations, setRecommendations] = useState<string[]>([]);
  const [cvError, setCvError] = useState<string | null>(null);
  const [standardizedCvUrl, setStandardizedCvUrl] = useState<string | null>(null);
  const [cvTransformationComplete, setCvTransformationComplete] = useState(false);
  const [csrfToken, setCsrfToken] = useState<string>("");
  const [isDragging, setIsDragging] = useState(false);
  const navigate = useNavigate();
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Récupérer le token CSRF au chargement
  useEffect(() => {
    const fetchCsrfToken = async () => {
      try {
        const response = await fetch(`${API_BASE_URL}/get-csrf-token/`, {
          credentials: 'include'
        });
        const data = await response.json();
        if (data.csrf_token) {
          setCsrfToken(data.csrf_token);
          console.log("Token CSRF récupéré:", data.csrf_token.substring(0, 10) + "...");
        }
      } catch (error) {
        console.error("Erreur récupération token CSRF:", error);
        toast.error("Erreur de connexion sécurisée. Veuillez rafraîchir la page.");
      }
    };

    fetchCsrfToken();
  }, []);

  // Initialisation du formulaire avec validation zod
  const form = useForm<FormValues>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      firstName: "",
      lastName: "",
      email: "",
      phone: "",
      country: "Mauritanie",
      city: "Nouakchott",
      startAvailability: "",
      endAvailability: "",
      password: "",
      confirmPassword: "",
      domainePrincipal: "DIGITAL",
      specialite: "",
      competences: "",
      privacyAccepted: false,
    },
  });

  // Fonction de traitement et transformation du CV au format Richat - VERSION COMPLÈTE
  const processAndTransformCV = async (file: File) => {
    setCvProcessing(true);
    setCvError(null);
    setUploadProgress(0);
    setCvTransformationComplete(false);
    setRecommendations([]);
    
    const progressInterval = setInterval(() => {
      setUploadProgress(prev => {
        if (prev >= 85) {
          clearInterval(progressInterval);
          return 85;
        }
        return prev + Math.random() * 15 + 5; // Progression plus réaliste
      });
    }, 800);
    
    try {
      // Validation côté client renforcée
      const maxSize = 25 * 1024 * 1024; // 25MB (augmenté)
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

      // Vérification de l'extension et du contenu
      if (fileExtension === 'pdf' && !file.type.includes('pdf')) {
        throw new Error("Le fichier ne semble pas être un PDF valide.");
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
      
      // Ajouter le token CSRF
      if (csrfToken) {
        formData.append("csrfmiddlewaretoken", csrfToken);
      }
      
      console.log("Envoi vers:", `${API_BASE_URL}/consultant/process-cv/`);
      
      const response = await fetch(`${API_BASE_URL}/consultant/process-cv/`, {
        method: "POST",
        body: formData,
        headers: {
          ...(csrfToken && { 'X-CSRFToken': csrfToken }),
          'X-Requested-With': 'XMLHttpRequest',
        },
        credentials: 'include',
      });
      
      console.log("Statut de la réponse:", response.status);
      console.log("Headers de la réponse:", Object.fromEntries(response.headers.entries()));
      
      let responseData;
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
        // Gestion spécifique des erreurs
        if (response.status === 403) {
          if (responseData.error && responseData.error.includes('CSRF')) {
            try {
              const csrfResponse = await fetch(`${API_BASE_URL}/get-csrf-token/`, {
                credentials: 'include'
              });
              const csrfData = await csrfResponse.json();
              if (csrfData.csrf_token) {
                setCsrfToken(csrfData.csrf_token);
                throw new Error("Erreur de sécurité. Veuillez réessayer.");
              }
            } catch (csrfError) {
              console.error("Erreur récupération nouveau token CSRF:", csrfError);
            }
            throw new Error("Erreur de sécurité (CSRF). Veuillez rafraîchir la page et réessayer.");
          } else {
            throw new Error("Accès refusé. Veuillez vérifier vos permissions.");
          }
        } else if (response.status === 413) {
          throw new Error("Fichier trop volumineux pour le serveur.");
        } else if (response.status >= 500) {
          throw new Error("Erreur du serveur. Veuillez réessayer plus tard.");
        }
        
        const errorMessage = responseData?.error || `Erreur HTTP ${response.status}`;
        throw new Error(errorMessage);
      }
      
      if (responseData.success) {
        // Mettre à jour le token CSRF si fourni
        if (responseData.csrf_token) {
          setCsrfToken(responseData.csrf_token);
        }
        
        // Stocker toutes les données extraites
        setExtractedData(responseData.extracted_data);
        setProcessingStats(responseData.stats);
        setQualityScore(responseData.quality_score);
        setRecommendations(responseData.recommendations || []);
        
        console.log("Données extraites:", responseData.extracted_data);
        console.log("Score de qualité:", responseData.quality_score);
        console.log("Statistiques:", responseData.stats);
        console.log("Recommandations:", responseData.recommendations);
        
        // Extraction et mise à jour des compétences
        const skills = responseData.extracted_data?.skills || [];
        
        if (skills.length > 0) {
          const competencesString = skills.slice(0, 15).join(", "); // Limiter à 15 compétences
          form.setValue("competences", competencesString);
          console.log("Compétences mises à jour:", competencesString);
        }
        
        // Pré-remplir les informations personnelles si disponibles et valides
        if (responseData.extracted_data?.personal_info) {
          const personalInfo = responseData.extracted_data.personal_info;
          
          // Nom - éviter les erreurs d'extraction
          if (personalInfo.full_name && personalInfo.full_name.trim()) {
            const fullName = personalInfo.full_name.trim();
            const problematicNames = ['noukchoot', 'nouakchott', 'richat', 'partners', 'curriculum', 'vitae'];
            
            if (!problematicNames.some(name => fullName.toLowerCase().includes(name)) &&
                fullName.length > 3 && 
                fullName.split(' ').length >= 2 &&
                /^[A-Za-zÀ-ÿ\u0600-\u06FF\s\-'\.]+$/.test(fullName)) {
              
              const nameParts = fullName.split(' ');
              form.setValue("firstName", nameParts[0]);
              form.setValue("lastName", nameParts.slice(1).join(' '));
              console.log("Nom mis à jour:", nameParts[0], nameParts.slice(1).join(' '));
            }
          }
          
          // Email - validation renforcée
          if (personalInfo.email && personalInfo.email.includes('@')) {
            const emailRegex = /^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$/;
            if (emailRegex.test(personalInfo.email) && personalInfo.email.length < 100) {
              form.setValue("email", personalInfo.email);
              console.log("Email mis à jour:", personalInfo.email);
            }
          }
          
          // Téléphone - nettoyage avancé
          if (personalInfo.phone) {
            let phone = personalInfo.phone.trim();
            // Supprimer les préfixes internationaux mauritaniens
            phone = phone.replace(/^(\+?222|00\s*222)\s*/, '');
            // Nettoyer et formater
            phone = phone.replace(/[^\d\s\-\(\)]/g, '');
            phone = phone.replace(/\s+/g, ' ').trim();
            
            if (phone.length >= 8 && phone.length <= 15) {
              form.setValue("phone", phone);
              console.log("Téléphone mis à jour:", phone);
            }
          }
          
          // Résidence/Pays
          if (personalInfo.residence) {
            const residence = personalInfo.residence.trim();
            if (residence.toLowerCase().includes('mauritanie')) {
              form.setValue("country", "Mauritanie");
            }
            if (residence.toLowerCase().includes('nouakchott')) {
              form.setValue("city", "Nouakchott");
            }
          }
        }
        
        // Gestion du CV standardisé Richat
        if (responseData.cv_url) {
          setStandardizedCvUrl(responseData.cv_url);
          setCvTransformationComplete(true);
          
          const qualityText = responseData.quality_score ? ` (Score: ${responseData.quality_score}%)` : '';
          toast.success(
            `CV transformé au format Richat avec succès !${qualityText}`,
            { 
              duration: 5000,
              description: "Votre CV est maintenant optimisé selon les standards Richat Partners"
            }
          );
          
          // Afficher les recommandations si disponibles
          if (responseData.recommendations && responseData.recommendations.length > 0) {
            toast.info(
              `${responseData.recommendations.length} recommandation(s) d'amélioration disponible(s)`,
              { duration: 3000 }
            );
          }
        } else {
          toast.success("CV traité avec succès !");
        }
      } else {
        throw new Error(responseData.message || "Erreur lors du traitement du CV");
      }
    } catch (error) {
      console.error("Erreur lors de la transformation:", error);
      
      let errorMessage = "Erreur lors de la transformation du CV au format Richat";
      
      if (error instanceof Error) {
        errorMessage = error.message;
      } else if (typeof error === 'string') {
        errorMessage = error;
      }
      
      // Messages d'erreur contextuels et utiles
      if (errorMessage.includes("NetworkError") || errorMessage.includes("Failed to fetch")) {
        errorMessage = "Problème de connexion. Vérifiez votre connexion internet et réessayez.";
      } else if (errorMessage.includes("timeout")) {
        errorMessage = "Le traitement prend trop de temps. Essayez avec un fichier plus petit ou réessayez plus tard.";
      } else if (errorMessage.includes("Bad Request")) {
        errorMessage = "Le fichier ne peut pas être traité. Vérifiez qu'il s'agit d'un CV valide et lisible.";
      } else if (errorMessage.includes("CSRF")) {
        errorMessage = "Erreur de sécurité. Rafraîchissez la page et réessayez.";
      } else if (errorMessage.includes("413") || errorMessage.includes("trop volumineux")) {
        errorMessage = "Fichier trop volumineux. Réduisez la taille de votre CV ou utilisez un format plus compact.";
      }
      
      setCvError(errorMessage);
      toast.error(errorMessage, { 
        duration: 6000,
        action: {
          label: "Aide",
          onClick: () => {
            toast.info("Formats supportés: PDF, DOC, DOCX, TXT. Taille max: 25MB", {
              duration: 5000
            });
          }
        }
      });
    } finally {
      clearInterval(progressInterval);
      setUploadProgress(100);
      setTimeout(() => {
        setCvProcessing(false);
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
    setCvTransformationComplete(false);
    
    // Validation du fichier côté client
    const extension = file.name.split('.').pop()?.toLowerCase();
    const allowedExtensions = ['pdf', 'doc', 'docx', 'txt'];
    
    if (!extension || !allowedExtensions.includes(extension)) {
      const errorMsg = "Format de fichier non supporté. Veuillez télécharger un fichier PDF, DOC, DOCX ou TXT.";
      setCvError(errorMsg);
      toast.error(errorMsg);
      return;
    }
    
    const maxSize = 25 * 1024 * 1024; // 25MB
    if (file.size > maxSize) {
      const errorMsg = "Le fichier est trop volumineux. La taille maximale autorisée est de 25MB.";
      setCvError(errorMsg);
      toast.error(errorMsg);
      return;
    }
    
    if (file.size === 0) {
      const errorMsg = "Le fichier sélectionné est vide. Veuillez choisir un autre fichier.";
      setCvError(errorMsg);
      toast.error(errorMsg);
      return;
    }
    
    setCvFile(file);
    
    // Traiter et transformer le CV automatiquement
    await processAndTransformCV(file);
  };

  // Gestion du changement de fichier avec drag & drop
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
    setCvTransformationComplete(false);
    
    // Réinitialiser les champs du formulaire liés au CV
    form.setValue("competences", "");
    
    // Réinitialiser l'input file
    if (fileInputRef.current) {
      fileInputRef.current.value = "";
    }
    
    toast.info("CV supprimé. Vous pouvez en télécharger un nouveau.");
  };

  // Validation des dates
  const validateDates = (startDate: string, endDate: string): boolean => {
    const start = new Date(startDate);
    const end = new Date(endDate);
    const now = new Date();
    
    if (start <= now) {
      toast.error("La date de début doit être dans le futur");
      return false;
    }
    
    if (end <= start) {
      toast.error("La date de fin doit être postérieure à la date de début");
      return false;
    }
    
    return true;
  };

  // Soumission du formulaire avec validation complète
  const onSubmit = async (data: FormValues) => {
    // Validations préliminaires
    if (!cvFile) {
      toast.error("Veuillez télécharger votre CV avant de vous inscrire");
      return;
    }

    if (!data.privacyAccepted) {
      toast.error("Vous devez accepter la politique de confidentialité pour continuer");
      return;
    }

    if (!cvTransformationComplete) {
      toast.error("Veuillez attendre que la transformation du CV soit terminée");
      return;
    }

    if (!csrfToken) {
      toast.error("Erreur de sécurité. Veuillez rafraîchir la page.");
      return;
    }

    // Validation des dates
    if (!validateDates(data.startAvailability, data.endAvailability)) {
      return;
    }

    setIsLoading(true);

    try {
      const formData = new FormData();
      
      // Données personnelles
      formData.append("nom", data.lastName.trim());
      formData.append("prenom", data.firstName.trim());
      formData.append("email", data.email.trim().toLowerCase());
      formData.append("telephone", data.phone.trim());
      formData.append("pays", data.country.trim());
      formData.append("ville", data.city.trim());
      formData.append("date_debut_dispo", data.startAvailability);
      formData.append("date_fin_dispo", data.endAvailability);
      formData.append("password", data.password);
      formData.append("domaine_principal", data.domainePrincipal);
      formData.append("specialite", data.specialite.trim());
      formData.append("cv", cvFile);
      formData.append("privacy_accepted", data.privacyAccepted.toString());
      
      // Métadonnées de la session
      formData.append("registration_timestamp", new Date().toISOString());
      formData.append("frontend_version", "2.0");
      formData.append("browser_info", navigator.userAgent);
      
      // Token CSRF
      if (csrfToken) {
        formData.append("csrfmiddlewaretoken", csrfToken);
      }
      
      // Compétences
      if (data.competences && data.competences.trim()) {
        formData.append("competences", data.competences.trim());
      }

      // Données enrichies du CV
      if (standardizedCvUrl) {
        formData.append("richat_cv_url", standardizedCvUrl);
      }

      if (extractedData) {
        formData.append("extracted_data", JSON.stringify(extractedData));
      }
      
      if (processingStats) {
        formData.append("processing_stats", JSON.stringify(processingStats));
      }
      
      if (qualityScore !== null) {
        formData.append("quality_score", qualityScore.toString());
      }
      
      if (recommendations.length > 0) {
        formData.append("recommendations", JSON.stringify(recommendations));
      }

      console.log("Envoi des données d'inscription...");

      const response = await fetch(`${API_BASE_URL}/consultant/register/`, {
        method: "POST",
        body: formData,
        headers: {
          ...(csrfToken && { 'X-CSRFToken': csrfToken }),
          'X-Requested-With': 'XMLHttpRequest',
        },
        credentials: 'include',
      });
      
      const resData = await response.json();
      console.log("Réponse du serveur:", resData);

      if (!response.ok) {
        // Gestion d'erreurs spécifiques
        if (response.status === 400 && resData.error) {
          if (resData.error.includes('email')) {
            toast.error("Cette adresse email est déjà utilisée");
          } else if (resData.error.includes('telephone')) {
            toast.error("Ce numéro de téléphone est déjà utilisé");
          } else {
            toast.error(resData.error);
          }
        } else {
          toast.error(resData?.error || "Erreur lors de l'inscription");
        }
        return;
      }

      // Inscription réussie
      const successMessage = qualityScore 
        ? `Inscription réussie ! CV transformé au format Richat avec un score de qualité de ${qualityScore}%.`
        : "Inscription réussie ! CV transformé au format Richat.";
      
      toast.success(successMessage, {
        duration: 7000,
        description: "Votre compte est en attente de validation par un administrateur."
      });
      
      setRegistrationComplete(true);
      
      // Redirection différée
      setTimeout(() => {
        navigate("/consultant/login", { 
          state: { 
            message: "Inscription terminée. Vous pouvez vous connecter dès que votre compte sera validé.",
            email: data.email 
          }
        });
      }, 6000);
      
    } catch (error) {
      console.error("Erreur lors de l'inscription:", error);
      toast.error("Erreur de connexion au serveur. Veuillez réessayer.", {
        duration: 5000
      });
    } finally {
      setIsLoading(false);
    }
  };

  // Fonction pour prévisualiser le CV Richat
  const previewRichatCV = () => {
    if (standardizedCvUrl) {
      window.open(standardizedCvUrl, '_blank', 'width=800,height=900,scrollbars=yes');
    }
  };

  // Si l'inscription est terminée, afficher un message de confirmation
  if (registrationComplete) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-100 p-4">
        <Card className="w-full max-w-lg shadow-lg">
          <CardHeader className="space-y-1 text-center">
            <div className="flex justify-center mb-4">
              <div className="relative">
                <CheckCircleIcon className="h-16 w-16 text-green-600" />
                <div className="absolute -top-1 -right-1 bg-blue-600 rounded-full p-1">
                  <Award className="h-6 w-6 text-white" />
                </div>
              </div>
            </div>
            <CardTitle className="text-2xl font-bold text-green-800">Inscription réussie !</CardTitle>
            <CardDescription className="text-gray-600">
              Votre profil consultant a été créé avec succès
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <Alert className="border-green-200 bg-green-50">
              <CheckCircleIcon className="h-4 w-4 text-green-600" />
              <AlertTitle className="text-green-800">Compte créé avec transformation CV</AlertTitle>
              <AlertDescription className="text-green-700">
                <div className="space-y-2">
                  <p>Votre compte a été créé avec succès et votre CV a été automatiquement transformé au format standardisé Richat Partners.</p>
                  
                  {qualityScore && (
                    <div className="flex items-center gap-2 mt-2">
                      <span>Score de qualité de votre CV:</span>
                      <QualityScoreDisplay score={qualityScore} />
                    </div>
                  )}
                  
                  {processingStats && (
                    <div className="text-xs bg-white p-2 rounded border border-green-200 mt-2">
                      <div className="grid grid-cols-2 gap-2">
                        <span>Compétences: {processingStats.skills_found}</span>
                        <span>Projets: {processingStats.experience_entries}</span>
                        <span>Formation: {processingStats.education_entries}</span>
                        <span>Langues: {processingStats.languages_found}</span>
                      </div>
                    </div>
                  )}
                </div>
              </AlertDescription>
            </Alert>

            <Alert>
              <Clock className="h-4 w-4" />
              <AlertTitle>Prochaines étapes</AlertTitle>
              <AlertDescription className="space-y-2">
                <div className="flex items-start gap-2">
                  <span className="bg-blue-100 text-blue-800 text-xs px-2 py-1 rounded-full mt-0.5">1</span>
                  <span>Votre compte doit être validé par un administrateur</span>
                </div>
                <div className="flex items-start gap-2">
                  <span className="bg-blue-100 text-blue-800 text-xs px-2 py-1 rounded-full mt-0.5">2</span>
                  <span>Vous recevrez un email de confirmation</span>
                </div>
                <div className="flex items-start gap-2">
                  <span className="bg-blue-100 text-blue-800 text-xs px-2 py-1 rounded-full mt-0.5">3</span>
                  <span>Vous pourrez alors vous connecter et accéder à votre espace</span>
                </div>
              </AlertDescription>
            </Alert>

            {standardizedCvUrl && (
              <div className="bg-blue-50 p-3 rounded-lg border border-blue-200">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <FileIcon className="h-5 w-5 text-blue-600" />
                    <div>
                      <p className="text-sm font-medium text-blue-800">CV Richat généré</p>
                      <p className="text-xs text-blue-600">Format professionnel standardisé</p>
                    </div>
                  </div>
                  <Button 
                    variant="outline" 
                    size="sm"
                    onClick={previewRichatCV}
                    className="text-blue-600 border-blue-300 hover:bg-blue-50"
                  >
                    <Eye className="h-4 w-4 mr-1" />
                    Aperçu
                  </Button>
                </div>
              </div>
            )}

            <div className="text-center">
              <p className="text-sm text-gray-600 mb-4">
                Redirection automatique vers la page de connexion dans quelques secondes...
              </p>
              <div className="flex gap-2 justify-center">
                <Button 
                  onClick={() => navigate("/consultant/login")} 
                  className="bg-blue-600 hover:bg-blue-500"
                >
                  Aller à la connexion
                </Button>
                <Button 
                  variant="outline"
                  onClick={() => navigate("/")}
                >
                  Retour à l'accueil
                </Button>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-100 p-4">
      <Card className="w-full max-w-3xl shadow-lg">
        <CardHeader className="space-y-1">
          <div className="flex justify-center mb-4">
            <img 
              src="/lovable-uploads/c66ee083-bf5b-456a-b3a6-368225f4b25e.png" 
              alt="Richat Logo" 
              className="h-16 w-auto"
            />
          </div>
          <CardTitle className="text-2xl font-bold text-center">Inscription Consultant</CardTitle>
          <CardDescription className="text-center">
            Créez votre compte consultant - Votre CV sera automatiquement transformé au format Richat
          </CardDescription>
          
          {/* Indicateur de sécurité */}
          <div className="flex justify-center">
            <div className="flex items-center gap-2 text-xs bg-green-50 text-green-700 px-3 py-1 rounded-full border border-green-200">
              <Shield className="h-3 w-3" />
              <span>{csrfToken ? "Connexion sécurisée" : "Chargement sécurisé..."}</span>
            </div>
          </div>
        </CardHeader>
        
        <CardContent>
          <Form {...form}>
            <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
              
              {/* Informations personnelles */}
              <div className="space-y-4">
                <h3 className="text-lg font-medium text-gray-900 flex items-center gap-2">
                  <Users className="h-5 w-5" />
                  Informations personnelles
                </h3>
                
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <FormField control={form.control} name="firstName" render={({ field }) => (
                    <FormItem>
                      <FormLabel>Prénom *</FormLabel>
                      <FormControl>
                        <Input 
                          {...field} 
                          placeholder="Votre prénom"
                          className={extractedData?.personal_info?.full_name ? "border-green-300 bg-green-50" : ""}
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )} />
                  
                  <FormField control={form.control} name="lastName" render={({ field }) => (
                    <FormItem>
                      <FormLabel>Nom *</FormLabel>
                      <FormControl>
                        <Input 
                          {...field} 
                          placeholder="Votre nom de famille"
                          className={extractedData?.personal_info?.full_name ? "border-green-300 bg-green-50" : ""}
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )} />
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <FormField control={form.control} name="email" render={({ field }) => (
                    <FormItem>
                      <FormLabel>Email *</FormLabel>
                      <FormControl>
                        <Input 
                          type="email" 
                          {...field} 
                          placeholder="votre.email@exemple.com"
                          className={extractedData?.personal_info?.email ? "border-green-300 bg-green-50" : ""}
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )} />
                  
                  <FormField control={form.control} name="phone" render={({ field }) => (
                    <FormItem>
                      <FormLabel>Téléphone *</FormLabel>
                      <FormControl>
                        <Input 
                          {...field} 
                          placeholder="Ex: 31 34 61 21"
                          className={extractedData?.personal_info?.phone ? "border-green-300 bg-green-50" : ""}
                        />
                      </FormControl>
                      <FormDescription className="text-xs">
                        Numéro mauritanien sans le préfixe +222
                      </FormDescription>
                      <FormMessage />
                    </FormItem>
                  )} />
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <FormField control={form.control} name="country" render={({ field }) => (
                    <FormItem>
                      <FormLabel>Pays *</FormLabel>
                      <FormControl>
                        <Input {...field} placeholder="Mauritanie" />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )} />
                  
                  <FormField control={form.control} name="city" render={({ field }) => (
                    <FormItem>
                      <FormLabel>Ville *</FormLabel>
                      <FormControl>
                        <Input {...field} placeholder="Nouakchott" />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )} />
                </div>
              </div>

              <Separator />

              {/* Disponibilité */}
              <div className="space-y-4">
                <h3 className="text-lg font-medium text-gray-900 flex items-center gap-2">
                  <Clock className="h-5 w-5" />
                  Disponibilité
                </h3>
                
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <FormField control={form.control} name="startAvailability" render={({ field }) => (
                    <FormItem>
                      <FormLabel>Disponible à partir de *</FormLabel>
                      <FormControl>
                        <Input type="date" {...field} min={new Date().toISOString().split('T')[0]} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )} />
                  
                  <FormField control={form.control} name="endAvailability" render={({ field }) => (
                    <FormItem>
                      <FormLabel>Disponible jusqu'à *</FormLabel>
                      <FormControl>
                        <Input type="date" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )} />
                </div>
              </div>

              <Separator />

              {/* Domaine de compétence */}
              <div className="space-y-4">
                <h3 className="text-lg font-medium text-gray-900 flex items-center gap-2">
                  <TrendingUp className="h-5 w-5" />
                  Domaine de compétence
                </h3>
                
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <FormField control={form.control} name="domainePrincipal" render={({ field }) => (
                    <FormItem>
                      <FormLabel>Domaine principal *</FormLabel>
                      <Select onValueChange={field.onChange} defaultValue={field.value}>
                        <FormControl>
                          <SelectTrigger>
                            <SelectValue placeholder="Sélectionnez un domaine" />
                          </SelectTrigger>
                        </FormControl>
                        <SelectContent>
                          <SelectItem value="DIGITAL">
                            <div className="flex items-center gap-2">
                              <Zap className="h-4 w-4" />
                              Digital et Télécoms
                            </div>
                          </SelectItem>
                          <SelectItem value="FINANCE">
                            <div className="flex items-center gap-2">
                              <TrendingUp className="h-4 w-4" />
                              Secteur bancaire et financier
                            </div>
                          </SelectItem>
                          <SelectItem value="ENERGIE">
                            <div className="flex items-center gap-2">
                              <Zap className="h-4 w-4" />
                              Transition énergétique
                            </div>
                          </SelectItem>
                          <SelectItem value="INDUSTRIE">
                            <div className="flex items-center gap-2">
                              <TrendingUp className="h-4 w-4" />
                              Industrie et Mines
                            </div>
                          </SelectItem>
                        </SelectContent>
                      </Select>
                      <FormMessage />
                    </FormItem>
                  )} />
                  
                  <FormField control={form.control} name="specialite" render={({ field }) => (
                    <FormItem>
                      <FormLabel>Sous-domaine de spécialisation *</FormLabel>
                      <FormControl>
                        <Input 
                          placeholder="Ex: Cybersécurité, Finance Islamique, IA..." 
                          {...field} 
                        />
                      </FormControl>
                      <FormDescription className="text-xs">
                        Votre domaine d'expertise spécifique
                      </FormDescription>
                      <FormMessage />
                    </FormItem>
                  )} />
                </div>
              </div>

              <Separator />

              {/* Zone d'upload CV avec transformation automatique - VERSION COMPLÈTE ET AMÉLIORÉE */}
              <div className="space-y-4">
                <h3 className="text-lg font-medium text-gray-900 flex items-center gap-2">
                  <FileTextIcon className="h-5 w-5" />
                  CV - Transformation automatique Richat
                </h3>
                
                <div className="space-y-4 border-2 border-dashed border-blue-300 p-6 rounded-lg bg-gradient-to-br from-blue-50 to-green-50">
                  
                  {!cvFile ? (
                    <div 
                      className={`text-center py-8 transition-all duration-200 ${
                        isDragging ? 'bg-blue-100 border-blue-400' : 'hover:bg-blue-50'
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
                            disabled={cvProcessing}
                          >
                            <UploadIcon className="h-4 w-4 mr-2" />
                            {cvProcessing ? "Traitement en cours..." : "Choisir un fichier"}
                          </Button>
                        </div>
                      </div>
                      
                      <Input 
                        id="cv" 
                        type="file" 
                        accept=".pdf,.doc,.docx,.txt" 
                        onChange={handleFileChange}
                        ref={fileInputRef}
                        required 
                        className="hidden"
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
                          {cvTransformationComplete && (
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
                          >
                            <XIcon className="h-4 w-4" />
                          </Button>
                        </div>
                      </div>

                      {/* Progression du traitement */}
                      {cvProcessing && (
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
                              disabled={cvProcessing}
                            >
                              <RefreshCwIcon className="h-3 w-3 mr-1" />
                              Réessayer
                            </Button>
                          </AlertDescription>
                        </Alert>
                      )}

                      {/* Aperçu des données extraites */}
                      {extractedData && (
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
                            {extractedData.personal_info?.full_name && (
                              <div className="flex items-center gap-2">
                                <Users className="h-3 w-3" />
                                <span>Nom: {extractedData.personal_info.full_name}</span>
                              </div>
                            )}
                            {extractedData.personal_info?.email && (
                              <div className="flex items-center gap-2">
                                <InfoIcon className="h-3 w-3" />
                                <span>Email: {extractedData.personal_info.email}</span>
                              </div>
                            )}
                            {extractedData.personal_info?.phone && (
                              <div className="flex items-center gap-2">
                                <InfoIcon className="h-3 w-3" />
                                <span>Téléphone: {extractedData.personal_info.phone}</span>
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
                                <span>Projets: {extractedData.experience.length} identifiés</span>
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
                                <span>Sections: {processingStats.experience_entries + processingStats.education_entries}</span>
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
                      {standardizedCvUrl && cvTransformationComplete && (
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
                </div>
              </div>

              <Separator />

              {/* Zone des compétences avec extraction automatique */}
              <div className="space-y-4">
                <h3 className="text-lg font-medium text-gray-900 flex items-center gap-2">
                  <Star className="h-5 w-5" />
                  Compétences
                  {extractedData?.skills && extractedData.skills.length > 0 && (
                    <Badge variant="secondary" className="bg-green-100 text-green-800 border-green-300">
                      <CheckCircleIcon className="h-3 w-3 mr-1" />
                      {extractedData.skills.length} extraites
                    </Badge>
                  )}
                </h3>
                
                <FormField control={form.control} name="competences" render={({ field }) => (
                  <FormItem>
                    <FormLabel>Compétences techniques et professionnelles</FormLabel>
                    <FormControl>
                      <Input 
                        {...field} 
                        placeholder="Ex: Java, Gestion de projet, Analyse financière..." 
                        className={extractedData?.skills && extractedData.skills.length > 0 ? "border-green-300 bg-green-50" : ""}
                      />
                    </FormControl>
                    <FormDescription className="space-y-1">
                      <p>Ajoutez vos principales compétences, séparées par des virgules</p>
                      {extractedData?.skills && extractedData.skills.length > 0 && (
                        <div className="text-green-700 text-xs bg-green-50 p-2 rounded border border-green-200">
                          <p className="flex items-center gap-1 font-medium">
                            <CheckCircleIcon className="h-3 w-3" />
                            Compétences automatiquement extraites et optimisées au format Richat
                          </p>
                          {qualityScore !== null && qualityScore < 70 && (
                            <p className="text-yellow-700 mt-1">
                              ⚠ Score de qualité moyen ({qualityScore}%) - Vous pouvez enrichir vos compétences
                            </p>
                          )}
                        </div>
                      )}
                    </FormDescription>
                    <FormMessage />
                  </FormItem>
                )} />
              </div>

              <Separator />

              {/* Sécurité */}
              <div className="space-y-4">
                <h3 className="text-lg font-medium text-gray-900 flex items-center gap-2">
                  <Shield className="h-5 w-5" />
                  Sécurité
                </h3>
                
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <FormField control={form.control} name="password" render={({ field }) => (
                    <FormItem>
                      <FormLabel>Mot de passe *</FormLabel>
                      <FormControl>
                        <Input type="password" {...field} placeholder="Mot de passe sécurisé" />
                      </FormControl>
                      <FormDescription className="text-xs">
                        Minimum 8 caractères avec majuscule, minuscule et chiffre
                      </FormDescription>
                      <FormMessage />
                    </FormItem>
                  )} />
                  
                  <FormField control={form.control} name="confirmPassword" render={({ field }) => (
                    <FormItem>
                      <FormLabel>Confirmer le mot de passe *</FormLabel>
                      <FormControl>
                        <Input type="password" {...field} placeholder="Répétez le mot de passe" />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )} />
                </div>
              </div>

              <Separator />

              {/* Politique de confidentialité enrichie */}
              <div className="space-y-4 border-2 border-blue-200 p-6 rounded-lg bg-blue-50">
                <div className="space-y-4">
                  <h3 className="font-semibold text-lg text-blue-900 flex items-center gap-2">
                    <Shield className="h-5 w-5" />
                    Politique de confidentialité et traitement des données
                  </h3>
                  
                  <div className="text-sm text-blue-800 space-y-3">
                    <div className="bg-white p-4 rounded-lg border border-blue-200">
                      <h4 className="font-medium mb-2">Traitement automatisé de votre CV</h4>
                      <p>En transmettant votre CV, vous acceptez :</p>
                      <ul className="list-disc list-inside ml-4 mt-2 space-y-1 text-blue-700">
                        <li>L'extraction automatique de vos informations personnelles</li>
                        <li>L'analyse et la catégorisation de vos compétences</li>
                        <li>La transformation au format standardisé Richat Partners</li>
                        <li>Le calcul d'un score de qualité personnalisé</li>
                        <li>L'utilisation pour améliorer nos algorithmes d'extraction</li>
                      </ul>
                    </div>
                    
                    <div className="bg-white p-4 rounded-lg border border-blue-200">
                      <h4 className="font-medium mb-2">Utilisation des données</h4>
                      <p>Vos données sont utilisées exclusivement pour :</p>
                      <ul className="list-disc list-inside ml-4 mt-2 space-y-1 text-blue-700">
                        <li>Le recrutement et la gestion des candidatures</li>
                        <li>La mise en relation avec des opportunités professionnelles</li>
                        <li>L'amélioration de la qualité de votre profil</li>
                        <li>La génération de statistiques anonymisées</li>
                      </ul>
                    </div>
                    
                    <p className="text-center">
                      Consultez notre <PrivacyPolicyDialog /> pour plus de détails sur vos droits et nos engagements.
                    </p>
                  </div>
                  
                  <FormField control={form.control} name="privacyAccepted" render={({ field }) => (
                    <FormItem className="flex flex-row items-start space-x-3 space-y-0">
                      <FormControl>
                        <Checkbox
                          checked={field.value}
                          onCheckedChange={field.onChange}
                          className="mt-1"
                          required
                        />
                      </FormControl>
                      <div className="space-y-1 leading-none">
                        <FormLabel className="text-sm font-medium cursor-pointer">
                          J'accepte les conditions de traitement de mes données personnelles, la transformation automatique de mon CV au format Richat et l'utilisation de mes informations pour les services de recrutement. <span className="text-red-500">*</span>
                        </FormLabel>
                        <FormMessage />
                      </div>
                    </FormItem>
                  )} />
                </div>
              </div>

              {/* Informations sur le système */}
              <Alert className="border-blue-200 bg-blue-50">
                <InfoIcon className="h-4 w-4 text-blue-600" />
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
                    <p className="text-xs mt-3 text-blue-600">
                      Après validation par un administrateur, vous pourrez télécharger votre CV optimisé et accéder à votre espace consultant.
                    </p>
                  </div>
                </AlertDescription>
              </Alert>

              {/* Bouton de soumission avec état détaillé */}
              <div className="space-y-4">
                <Button 
                  type="submit" 
                  className="w-full bg-blue-600 hover:bg-blue-500 text-white py-3 text-lg font-medium" 
                  disabled={isLoading || cvProcessing || !cvTransformationComplete || !csrfToken}
                  size="lg"
                >
                  {isLoading ? (
                    <div className="flex items-center gap-2">
                      <RefreshCwIcon className="h-5 w-5 animate-spin" />
                      Inscription en cours...
                    </div>
                  ) : cvProcessing ? (
                    <div className="flex items-center gap-2">
                      <RefreshCwIcon className="h-5 w-5 animate-spin" />
                      Transformation CV en cours...
                    </div>
                  ) : !cvTransformationComplete && cvFile ? (
                    <div className="flex items-center gap-2">
                      <Clock className="h-5 w-5" />
                      En attente de transformation...
                    </div>
                  ) : !csrfToken ? (
                    <div className="flex items-center gap-2">
                      <Shield className="h-5 w-5" />
                      Chargement sécurisé...
                    </div>
                  ) : (
                    <div className="flex items-center gap-2">
                      <CheckCircleIcon className="h-5 w-5" />
                      Créer mon compte consultant
                      {qualityScore !== null && (
                        <Badge variant="secondary" className="bg-white text-blue-600 ml-2">
                          {qualityScore}% qualité
                        </Badge>
                      )}
                    </div>
                  )}
                </Button>

                {/* Indicateurs d'état */}
                <div className="flex justify-center gap-4 text-sm">
                  <div className={`flex items-center gap-1 ${csrfToken ? 'text-green-600' : 'text-gray-400'}`}>
                    <Shield className="h-3 w-3" />
                    <span>Sécurisé</span>
                  </div>
                  
                  <div className={`flex items-center gap-1 ${cvFile ? 'text-green-600' : 'text-gray-400'}`}>
                    <FileTextIcon className="h-3 w-3" />
                    <span>CV téléchargé</span>
                  </div>
                  
                  <div className={`flex items-center gap-1 ${cvTransformationComplete ? 'text-green-600' : 'text-gray-400'}`}>
                    <CheckCircleIcon className="h-3 w-3" />
                    <span>Transformé</span>
                  </div>
                  
                  {qualityScore !== null && (
                    <div className="flex items-center gap-1 text-blue-600">
                      <Star className="h-3 w-3" />
                      <span>Qualité: {qualityScore}%</span>
                    </div>
                  )}
                </div>

                {/* Message d'aide contextuel */}
                {!cvFile && (
                  <Alert className="border-yellow-200 bg-yellow-50">
                    <InfoIcon className="h-4 w-4 text-yellow-600" />
                    <AlertDescription className="text-yellow-800">
                      Téléchargez votre CV pour activer la transformation automatique Richat et calculer votre score de qualité.
                    </AlertDescription>
                  </Alert>
                )}
                
                {cvFile && !cvTransformationComplete && !cvProcessing && cvError && (
                  <Alert variant="destructive">
                    <AlertCircleIcon className="h-4 w-4" />
                    <AlertDescription>
                      La transformation du CV a échoué. Veuillez corriger le problème avant de vous inscrire.
                    </AlertDescription>
                  </Alert>
                )}
              </div>
            </form>
          </Form>
        </CardContent>
        
        <CardFooter className="flex flex-col space-y-4">
          <Separator />
          <div className="flex flex-col items-center space-y-2 text-center">
            <p className="text-sm text-gray-600">
              Déjà inscrit ? <a href="/consultant/login" className="text-blue-600 hover:underline font-medium">Se connecter</a>
            </p>
            <div className="flex items-center gap-4 text-xs text-gray-500">
              <span className="flex items-center gap-1">
                <Shield className="h-3 w-3" />
                Données sécurisées
              </span>
              <span className="flex items-center gap-1">
                <CheckCircleIcon className="h-3 w-3" />
                Conforme RGPD
              </span>
              <span className="flex items-center gap-1">
                <Award className="h-3 w-3" />
                Format Richat certified
              </span>
            </div>
          </div>
        </CardFooter>
      </Card>
    </div>
  );
};

export default ConsultantRegister;