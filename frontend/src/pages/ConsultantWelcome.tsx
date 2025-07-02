import React, { useEffect, useState } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { 
  LogOut, 
  User, 
  Calendar, 
  Phone, 
  MapPin, 
  BookOpen, 
  CheckCircle, 
  Award, 
  Briefcase,
  Building,
  ArrowRight,
  Edit,
  FileText,
  Download,
  FileIcon,
  RefreshCw,
  Star,
  Camera,
  Mail,
  Settings,
  Bell,
  Menu,
  X,
  Save,
  Plus,
  GraduationCap,
  Languages,
  Zap,
  Globe,
  Trash2,
  UserCircle,
  ChevronDown,
  TrendingUp,
  Users
} from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Progress } from "@/components/ui/progress";
import { Checkbox } from "@/components/ui/checkbox";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import {
  Tabs,
  TabsContent,
  TabsList,
  TabsTrigger,
} from "@/components/ui/tabs";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

interface ConsultantData {
  firstName: string;
  lastName: string;
  email: string;
  phone: string;
  country: string;
  city: string;
  startAvailability: string;
  endAvailability: string;
  skills: string;
  expertise: string;
  domaine_principal: string;
  specialite: string;
  cvFilename?: string;
  standardizedCvFilename?: string;
  profileImage?: string;
  expertise_score?: number;
  // 🔥 AJOUT DES CHAMPS D'EXPERTISE MANQUANTS
  annees_experience?: number;
  formation_niveau?: string;
  certifications_count?: number;
  projets_realises?: number;
  leadership_experience?: boolean;
  international_experience?: boolean;
}

interface ExpertiseFormData {
  annees_experience: number;
  formation_niveau: string;
  certifications_count: number;
  projets_realises: number;
  leadership_experience: boolean;
  international_experience: boolean;
}

interface ExpertiseDetails {
  niveau_calcule: string;
  score_total: number;
  details: {
    experience: { score: number; poids: string; contribution: number };
    formation: { score: number; poids: string; contribution: number };
    competences: { score: number; poids: string; contribution: number };
    qualitatif: { score: number; poids: string; contribution: number };
  };
  recommandations: string[];
}

interface MissionData {
  id: number;
  appel_offre_id: number;
  nom_projet: string;
  client: string;
  description: string;
  date_debut: string;
  date_fin: string;
  score: number;
  date_validation: string;
}

interface RichatCvDetails {
  available: boolean;
  filename?: string;
  created_at?: string;
  file_size?: number;
  download_url?: string;
}

interface Notification {
  id: number;
  title: string;
  content: string;
  is_read: boolean;
  created_at: string;
  type: string;
}

interface RichatCVFormData {
  titre: string;
  nom_expert: string;
  date_naissance: string;
  pays_residence: string;
  titre_professionnel: string;
  resume_profil: string;
  formations: Array<{
    nom_ecole: string;
    periode_etude: string;
    diplome_obtenu: string;
    specialisation: string;
  }>;
  experiences: Array<{
    periode: string;
    nom_employeur: string;
    titre_professionnel: string;
    pays: string;
    activites: string;
  }>;
  langues: Array<{
    langue: string;
    parler: string;
    lecture: string;
    editorial: string;
  }>;
  missions_reference: Array<{
    nom_projet: string;
    date: string;
    societe: string;
    poste_occupe: string;
    lieu: string;
    client_bailleur: string;
    description_projet: string;
    type_secteur: string;
    activites_responsabilites: string;
  }>;
  certifications: string[];
  adhesions_professionnelles: string;
}

const ConsultantWelcome = () => {
  const [consultantData, setConsultantData] = useState<ConsultantData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [missions, setMissions] = useState<MissionData[]>([]);
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [loadingMissions, setLoadingMissions] = useState(false);
  const [loadingCv, setLoadingCv] = useState(false);
  const [richatCvDetails, setRichatCvDetails] = useState<RichatCvDetails>({ available: false });
  const [uploadingImage, setUploadingImage] = useState(false);
  const [profileImageUrl, setProfileImageUrl] = useState<string | null>(null);
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [isEditingProfile, setIsEditingProfile] = useState(false);
  const [editFormData, setEditFormData] = useState<Partial<ConsultantData>>({});
  const [messages, setMessages] = useState<{type: 'success' | 'error' | 'info', text: string, id: number}[]>([]);
  const [unreadCount, setUnreadCount] = useState(0);
  
  // 🔥 ÉTAT D'EXPERTISE CORRIGÉ AVEC INITIALISATION PAR DÉFAUT
  const [expertiseFormData, setExpertiseFormData] = useState<ExpertiseFormData>({
    annees_experience: 0,
    formation_niveau: 'BAC+3',
    certifications_count: 0,
    projets_realises: 0,
    leadership_experience: false,
    international_experience: false
  });

  const [expertiseDetails, setExpertiseDetails] = useState<ExpertiseDetails | null>(null);
  const [showExpertiseForm, setShowExpertiseForm] = useState(false);
  const [extractedSkills, setExtractedSkills] = useState<string[]>([]);
  const [isExtractingSkills, setIsExtractingSkills] = useState(false);
  
  // États pour le CV Richat complet
  const [isCompletingCV, setIsCompletingCV] = useState(false);
  const [richatCVData, setRichatCVData] = useState<RichatCVFormData>({
    titre: "Mr.",
    nom_expert: "",
    date_naissance: "",
    pays_residence: "Mauritanie",
    titre_professionnel: "",
    resume_profil: "",
    formations: [{
      nom_ecole: "",
      periode_etude: "",
      diplome_obtenu: "",
      specialisation: ""
    }],
    experiences: [{
      periode: "",
      nom_employeur: "",
      titre_professionnel: "",
      pays: "",
      activites: ""
    }],
    langues: [
      {
        langue: "Français",
        parler: "",
        lecture: "",
        editorial: ""
      },
      {
        langue: "Anglais",
        parler: "",
        lecture: "",
        editorial: ""
      },
      {
        langue: "Arabe",
        parler: "Native speaker",
        lecture: "Native speaker",
        editorial: "Native speaker"
      }
    ],
    missions_reference: [{
      nom_projet: "",
      date: "",
      societe: "",
      poste_occupe: "",
      lieu: "",
      client_bailleur: "",
      description_projet: "",
      type_secteur: "",
      activites_responsabilites: ""
    }],
    certifications: [],
    adhesions_professionnelles: "N/A"
  });
  const [generatingCV, setGeneratingCV] = useState(false);

  // Fonction pour afficher les messages
  const showMessage = (type: 'success' | 'error' | 'info', text: string) => {
    const newMessage = { type, text, id: Date.now() };
    setMessages(prev => [...prev, newMessage]);
    setTimeout(() => {
      setMessages(prev => prev.filter(msg => msg.id !== newMessage.id));
    }, 4000);
  };

  // 🔥 FONCTION CORRIGÉE POUR INITIALISER LES DONNÉES D'EXPERTISE
  const initializeExpertiseData = (consultant: ConsultantData) => {
    console.log("🔧 Initialisation des données d'expertise:", consultant);
    
    setExpertiseFormData({
      annees_experience: consultant.annees_experience ?? 0,
      formation_niveau: consultant.formation_niveau ?? 'BAC+3',
      certifications_count: consultant.certifications_count ?? 0,
      projets_realises: consultant.projets_realises ?? 0,
      leadership_experience: consultant.leadership_experience ?? false,
      international_experience: consultant.international_experience ?? false
    });
    
    console.log("✅ Données d'expertise initialisées:", {
      annees_experience: consultant.annees_experience ?? 0,
      formation_niveau: consultant.formation_niveau ?? 'BAC+3',
      certifications_count: consultant.certifications_count ?? 0,
      projets_realises: consultant.projets_realises ?? 0,
      leadership_experience: consultant.leadership_experience ?? false,
      international_experience: consultant.international_experience ?? false
    });
  };

  // 🔥 FONCTION CORRIGÉE POUR RÉCUPÉRER LES DÉTAILS D'EXPERTISE
  const fetchExpertiseDetails = async (consultantId: string) => {
    try {
      console.log("🔍 Récupération des détails d'expertise...");
      const response = await fetch(`http://127.0.0.1:8000/api/consultant/${consultantId}/expertise-analysis/`);
      
      if (response.ok) {
        const data = await response.json();
        console.log("📊 Données d'expertise reçues:", data);
        
        if (data.success && data.consultant) {
          // Mettre à jour l'état avec l'analyse d'expertise
          setExpertiseDetails(data.consultant.analyse);
          
          // 🔥 MISE À JOUR AUTOMATIQUE DES DONNÉES DU CONSULTANT AVEC L'EXPERTISE
          if (data.consultant.analyse) {
            setConsultantData(prev => prev ? {
              ...prev,
              expertise: data.consultant.expertise_actuelle || prev.expertise,
              expertise_score: data.consultant.analyse.score_total || prev.expertise_score
            } : null);
          }
          
          console.log("✅ Détails d'expertise mis à jour");
        }
      } else {
        console.log("⚠️ Réponse non OK pour les détails d'expertise:", response.status);
      }
    } catch (error) {
      console.error("❌ Erreur lors de la récupération des détails d'expertise:", error);
    }
  };

  // Fonction pour extraire les compétences du CV
  const extractSkillsFromCV = async () => {
    const consultantId = localStorage.getItem("consultantId");
    if (!consultantId) {
      showMessage('error', "ID consultant manquant");
      return;
    }

    if (!consultantData?.cvFilename && !consultantData?.cv) {
      showMessage('error', "Aucun CV trouvé. Veuillez d'abord télécharger votre CV.");
      return;
    }

    setIsExtractingSkills(true);
    
    try {
      console.log("=== DÉBUT EXTRACTION COMPÉTENCES ===");
      console.log("Consultant ID:", consultantId);
      console.log("CV filename:", consultantData?.cvFilename);
      
      const response = await fetch(`http://127.0.0.1:8000/api/consultant/${consultantId}/extract-skills/`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
      });

      console.log("Réponse serveur statut:", response.status);
      
      if (!response.ok) {
        const errorText = await response.text();
        console.error("Erreur HTTP:", response.status, errorText);
        throw new Error(`Erreur serveur: ${response.status}`);
      }
      
      const data = await response.json();
      console.log("Données reçues:", data);
      
      if (data.success) {
        console.log("✓ Extraction réussie");
        console.log("Nouvelles compétences:", data.new_skills);
        console.log("Total compétences:", data.total_skills);
        console.log("Niveau expertise:", data.expertise_level);
        
        setExtractedSkills(data.skills || []);
        
        setConsultantData(prev => 
          prev ? { 
            ...prev, 
            skills: data.skills ? data.skills.join(', ') : '',
            domaine_principal: data.primary_domain || prev.domaine_principal,
            expertise: data.expertise_level || prev.expertise
          } : null
        );
        
        let successMessage = data.message;
        if (data.extraction_details) {
          const details = data.extraction_details;
          successMessage += ` (${details.new_count} nouvelles, ${details.existing_count} existantes)`;
        }
        
        showMessage('success', successMessage);
        
      } else {
        console.error("❌ Erreur d'extraction:", data);
        
        let errorMessage = data.error || "Erreur lors de l'extraction";
        
        if (data.error?.includes('Aucun CV trouvé')) {
          errorMessage = "Aucun CV trouvé. Veuillez d'abord télécharger votre CV.";
        } else if (data.error?.includes('introuvable')) {
          errorMessage = "Fichier CV introuvable sur le serveur. Veuillez télécharger à nouveau votre CV.";
        } else if (data.error?.includes('Aucune compétence détectée')) {
          errorMessage = "Aucune compétence détectée dans votre CV. Vérifiez que votre CV contient bien vos compétences techniques.";
        }
        
        showMessage('error', errorMessage);
        
        if (data.debug_info) {
          console.log("Informations de débogage:", data.debug_info);
        }
      }
    } catch (error) {
      console.error("❌ Erreur réseau:", error);
      showMessage('error', "Erreur de connexion au serveur. Veuillez réessayer.");
    } finally {
      setIsExtractingSkills(false);
    }
  };

  // 🔥 FONCTION CORRIGÉE POUR METTRE À JOUR L'EXPERTISE
  const updateExpertiseInfo = async () => {
    const consultantId = localStorage.getItem("consultantId");
    if (!consultantId) return;

    try {
      console.log("🔄 Mise à jour des informations d'expertise...");
      console.log("Données envoyées:", expertiseFormData);
      
      const response = await fetch(`http://127.0.0.1:8000/api/consultant/${consultantId}/update-expertise/`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(expertiseFormData),
      });

      if (response.ok) {
        const data = await response.json();
        console.log("✅ Réponse de mise à jour d'expertise:", data);
        
        if (data.success) {
          // 🔥 MISE À JOUR COMPLÈTE DES DONNÉES DU CONSULTANT
          setConsultantData(prev => prev ? { 
            ...prev, 
            expertise: data.consultant.expertise_level,
            expertise_score: data.consultant.expertise_score,
            // Mettre à jour aussi les champs d'expertise dans les données principales
            annees_experience: expertiseFormData.annees_experience,
            formation_niveau: expertiseFormData.formation_niveau,
            certifications_count: expertiseFormData.certifications_count,
            projets_realises: expertiseFormData.projets_realises,
            leadership_experience: expertiseFormData.leadership_experience,
            international_experience: expertiseFormData.international_experience
          } : null);
          
          // Mettre à jour les détails d'expertise
          setExpertiseDetails(data.consultant.expertise_details);
          
          setShowExpertiseForm(false);
          showMessage('success', 'Niveau d\'expertise mis à jour avec succès');
          
          console.log("✅ État mis à jour avec succès");
        }
      } else {
        throw new Error("Erreur lors de la mise à jour");
      }
    } catch (error) {
      console.error("❌ Erreur lors de la mise à jour de l'expertise:", error);
      showMessage('error', "Erreur lors de la mise à jour de l'expertise");
    }
  };

  // Fonction pour pré-remplir le CV Richat avec les données existantes
  const prefillRichatCV = () => {
    if (!consultantData) return;
    
    setRichatCVData(prev => ({
      ...prev,
      nom_expert: `${consultantData.firstName} ${consultantData.lastName}`,
      pays_residence: `${consultantData.country} - ${consultantData.city}`,
      titre_professionnel: consultantData.specialite || "Consultant",
      resume_profil: `Expert en ${consultantData.domaine_principal} avec spécialisation en ${consultantData.specialite}. ` +
                    `Consultant expérimenté avec un niveau d'expertise ${consultantData.expertise}. ` +
                    `Compétences principales: ${consultantData.skills || 'Non spécifiées'}.`,
    }));
  };

  const handleImageUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    if (file.size > 5 * 1024 * 1024) {
      showMessage('error', "L'image ne doit pas dépasser 5MB");
      return;
    }

    if (!file.type.startsWith('image/')) {
      showMessage('error', "Veuillez sélectionner une image valide");
      return;
    }

    setUploadingImage(true);
    try {
      const reader = new FileReader();
      reader.onload = (e) => {
        setProfileImageUrl(e.target?.result as string);
      };
      reader.readAsDataURL(file);

      await new Promise(resolve => setTimeout(resolve, 1500));
      showMessage('success', "Photo de profil mise à jour");
    } catch (error) {
      console.error("Erreur lors de l'upload:", error);
      showMessage('error', "Erreur lors de la mise à jour de la photo");
      setProfileImageUrl(null);
    } finally {
      setUploadingImage(false);
    }
  };

  const checkRichatCV = async (consultantId: string) => {
    try {
      const response = await fetch(`http://127.0.0.1:8000/api/consultant/${consultantId}/check-cv/`);
      
      if (response.ok) {
        const data = await response.json();
        setRichatCvDetails(data);
      } else {
        setRichatCvDetails({ available: false });
      }
    } catch (error) {
      console.error("Exception lors de la vérification du CV Richat:", error);
      setRichatCvDetails({ available: false });
    }
  };

  const fetchNotifications = async (consultantId: string) => {
    try {
      const response = await fetch(`http://127.0.0.1:8000/api/consultant/${consultantId}/notifications/`);
      if (response.ok) {
        const data = await response.json();
        if (data.success) {
          setNotifications(data.notifications);
          setUnreadCount(data.unread_count);
        }
      }
    } catch (error) {
      console.error("Erreur lors de la récupération des notifications:", error);
    }
  };

  // 🔥 EFFET PRINCIPAL CORRIGÉ AVEC INITIALISATION COMPLÈTE
  useEffect(() => {
    const fetchConsultantData = async () => {
      setLoading(true);
      setError(null);
      
      const consultantId = localStorage.getItem("consultantId");

      if (!consultantId) {
        setError("Vous devez vous connecter pour accéder à cette page");
        showMessage('error', "Veuillez vous connecter");
        setLoading(false);
        return;
      }

      try {
        console.log("🔄 Récupération des données du consultant...");
        const response = await fetch(`http://127.0.0.1:8000/api/consultant/${consultantId}/data/`);
        
        if (!response.ok) {
          throw new Error(`Erreur HTTP: ${response.status}`);
        }
        
        const data = await response.json();
        console.log("📦 Données du consultant reçues:", data);
        
        if (data.error) {
          throw new Error(data.error);
        }
        
        // 🔥 MISE À JOUR COMPLÈTE DES DONNÉES
        setConsultantData(data);
        setEditFormData(data);
        
        // 🔥 INITIALISATION CRUCIALE DES DONNÉES D'EXPERTISE
        initializeExpertiseData(data);
        
        if (data.profileImage) {
          setProfileImageUrl(data.profileImage);
        }
        
        // 🔥 RÉCUPÉRATION SÉQUENTIELLE DES AUTRES DONNÉES
        await Promise.all([
          checkRichatCV(consultantId),
          fetchConsultantMissions(consultantId),
          fetchNotifications(consultantId),
          fetchExpertiseDetails(consultantId)
        ]);
        
        console.log("✅ Toutes les données chargées avec succès");
        
      } catch (err) {
        console.error("❌ Erreur lors de la récupération des données:", err);
        setError("Impossible de récupérer vos informations");
        showMessage('error', "Erreur de connexion au serveur");
      } finally {
        setLoading(false);
      }
    };

    fetchConsultantData();
  }, []);

  const fetchConsultantMissions = async (consultantId: string) => {
    setLoadingMissions(true);
    try {
      const response = await fetch(`http://127.0.0.1:8000/api/consultant/${consultantId}/missions/`);
      
      if (!response.ok) {
        throw new Error(`Erreur HTTP: ${response.status}`);
      }
      
      const data = await response.json();
      
      if (data.success) {
        setMissions(data.missions);
      } else {
        showMessage('error', "Erreur lors du chargement des missions");
      }
    } catch (err) {
      console.error("Erreur lors de la récupération des missions:", err);
      showMessage('error', "Erreur de connexion au serveur");
    } finally {
      setLoadingMissions(false);
    }
  };

  const handleDownloadRichatCV = async () => {
    const consultantId = localStorage.getItem("consultantId");
    if (!consultantId) return;
    
    setLoadingCv(true);
    try {
      const response = await fetch(
        `http://127.0.0.1:8000/api/consultant/${consultantId}/download-cv/`
      );
      
      if (!response.ok) throw new Error("Erreur de téléchargement");
      
      const blob = await response.blob();
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `CV_Richat_${consultantData?.firstName}_${consultantData?.lastName}.pdf`;
      document.body.appendChild(a);
      a.click();
      a.remove();
      
      showMessage('success', "CV Richat téléchargé avec succès");
    } catch (error) {
      showMessage('error', "Erreur lors du téléchargement du CV Richat");
    } finally {
      setLoadingCv(false);
    }
  };

  const handleRegenerateRichatCV = async () => {
    const consultantId = localStorage.getItem("consultantId");
    if (!consultantId || !consultantData?.cvFilename) return;
    
    setLoadingCv(true);
    try {
      await checkRichatCV(consultantId);
      showMessage('success', "CV Richat vérifié");
    } catch (error) {
      showMessage('error', "Erreur lors de la vérification du CV Richat");
    } finally {
      setLoadingCv(false);
    }
  };

  const handleLogout = () => {
    localStorage.removeItem("userRole");
    localStorage.removeItem("consultantId");
    showMessage('success', "Déconnexion réussie");
    window.location.href = "/consultant/login";
  };

  const handleSaveProfile = async () => {
    const consultantId = localStorage.getItem("consultantId");
    if (!consultantId) return;

    try {
      const response = await fetch(`http://127.0.0.1:8000/api/consultant/${consultantId}/update-profile/`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(editFormData),
      });

      if (response.ok) {
        const updatedData = await response.json();
        setConsultantData(prev => ({ ...prev, ...updatedData }));
        setIsEditingProfile(false);
        showMessage('success', "Profil mis à jour avec succès");
      } else {
        throw new Error("Erreur lors de la mise à jour");
      }
    } catch (error) {
      showMessage('error', "Erreur lors de la mise à jour du profil");
    }
  };

  const formatDate = (dateString: string) => {
    if (!dateString) return "Non spécifiée";
    try {
      return new Date(dateString).toLocaleDateString('fr-FR');
    } catch (e) {
      return dateString;
    }
  };

  const getExpertiseBadgeColor = (expertise: string) => {
    switch (expertise) {
      case "Senior": return "bg-purple-50 text-purple-700 border-purple-200";
      case "Expert": return "bg-green-50 text-green-700 border-green-200";
      case "Intermédiaire": return "bg-blue-50 text-blue-700 border-blue-200";
      default: return "bg-orange-50 text-orange-700 border-orange-200";
    }
  };

  const getScoreBadgeColor = (score: number) => {
    if (score >= 75) return "bg-green-100 text-green-800";
    if (score >= 50) return "bg-blue-100 text-blue-800";
    if (score >= 25) return "bg-orange-100 text-orange-800";
    return "bg-red-100 text-red-800";
  };

  const getDomaineLabel = (domaine: string) => {
    const domainesMap = {
      'DIGITAL': 'Digital et Télécoms',
      'FINANCE': 'Secteur bancaire et financier',
      'ENERGIE': 'Transition énergétique',
      'INDUSTRIE': 'Industrie et Mines'
    };
    return domainesMap[domaine as keyof typeof domainesMap] || domaine;
  };

  const calculateProfileCompletion = () => {
    if (!consultantData) return 0;
    
    const fields = [
      consultantData.firstName,
      consultantData.lastName,
      consultantData.email,
      consultantData.phone,
      consultantData.country,
      consultantData.city,
      consultantData.startAvailability,
      consultantData.endAvailability,
      consultantData.skills,
      consultantData.specialite,
      profileImageUrl,
      richatCvDetails.available
    ];
    
    const completedFields = fields.filter(field => field && field.toString().trim() !== '').length;
    return Math.round((completedFields / fields.length) * 100);
  };

  const getInitials = (firstName: string, lastName: string) => {
    return `${firstName?.[0] || ''}${lastName?.[0] || ''}`.toUpperCase();
  };

  const markNotificationAsRead = async (notificationId: number) => {
    try {
      await fetch(`http://127.0.0.1:8000/api/notifications/${notificationId}/read/`, {
        method: 'PUT'
      });
      
      setNotifications(prev => 
        prev.map(notif => 
          notif.id === notificationId ? { ...notif, is_read: true } : notif
        )
      );
      setUnreadCount(prev => Math.max(0, prev - 1));
    } catch (error) {
      console.error("Erreur lors du marquage de la notification:", error);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen flex justify-center items-center bg-gray-50">
        <div className="text-center">
          <div className="w-16 h-16 border-4 border-blue-200 border-t-blue-600 rounded-full animate-spin mx-auto mb-4"></div>
          <p className="text-gray-600">Chargement...</p>
        </div>
      </div>
    );
  }

  if (error || !consultantData) {
    return (
      <div className="min-h-screen flex justify-center items-center bg-gray-50">
        <Card className="w-full max-w-md">
          <CardHeader className="text-center">
            <CardTitle className="text-red-600">Erreur</CardTitle>
            <CardDescription>{error || "Aucune donnée disponible"}</CardDescription>
          </CardHeader>
          <CardContent className="flex flex-col gap-3">
            <Button onClick={() => window.location.reload()} className="w-full">
              <RefreshCw className="h-4 w-4 mr-2" />
              Actualiser
            </Button>
            <Button variant="outline" onClick={() => window.location.href = "/consultant/login"} className="w-full">
              Retour à la connexion
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  const profileCompletion = calculateProfileCompletion();

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Messages de notification */}
      <div className="fixed top-4 right-4 z-50 space-y-2">
        {messages.map((message) => (
          <div
            key={message.id}
            className={`px-4 py-3 rounded-lg shadow-lg transition-all duration-300 ${
              message.type === 'success' ? 'bg-green-100 text-green-800' :
              message.type === 'error' ? 'bg-red-100 text-red-800' :
              'bg-blue-100 text-blue-800'
            }`}
          >
            {message.text}
          </div>
        ))}
      </div>

      {/* Header simple */}
      <header className="sticky top-0 z-40 bg-white border-b shadow-sm">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
          <div className="flex justify-between items-center">
            <div className="flex items-center gap-4">
              <Button
                variant="ghost"
                size="sm"
                className="lg:hidden"
                onClick={() => setSidebarOpen(!sidebarOpen)}
              >
                <Menu className="h-5 w-5" />
              </Button>
              
              <div className="flex items-center gap-3">
                <img 
                  src="/lovable-uploads/c66ee083-bf5b-456a-b3a6-368225f4b25e.png" 
                  alt="Richat Logo" 
                  className="h-10 w-auto"
                />
                <div>
                  <h1 className="text-xl font-bold text-gray-900">
                    Portail Consultant
                  </h1>
                  <p className="text-xs text-gray-500">Richat Partners</p>
                </div>
              </div>
            </div>

            <div className="flex items-center gap-3">
              {/* Notifications */}
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button variant="ghost" size="sm" className="relative">
                    <Bell className="h-5 w-5" />
                    {unreadCount > 0 && (
                      <span className="absolute -top-1 -right-1 h-5 w-5 bg-red-500 text-white text-xs rounded-full flex items-center justify-center">
                        {unreadCount}
                      </span>
                    )}
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent className="w-80" align="end">
                  <DropdownMenuLabel>Notifications</DropdownMenuLabel>
                  <DropdownMenuSeparator />
                  {notifications.length > 0 ? (
                    notifications.slice(0, 5).map((notification) => (
                      <DropdownMenuItem 
                        key={notification.id}
                        className={`cursor-pointer ${!notification.is_read ? 'bg-blue-50' : ''}`}
                        onClick={() => markNotificationAsRead(notification.id)}
                      >
                        <div className="flex flex-col space-y-1">
                          <p className="text-sm font-medium">{notification.title}</p>
                          <p className="text-xs text-gray-500">{notification.content}</p>
                        </div>
                      </DropdownMenuItem>
                    ))
                  ) : (
                    <DropdownMenuItem disabled>
                      Aucune notification
                    </DropdownMenuItem>
                  )}
                </DropdownMenuContent>
              </DropdownMenu>

              {/* Menu Profil Connecté */}
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button variant="ghost" className="flex items-center gap-2 hover:bg-gray-100">
                    <Avatar className="h-8 w-8">
                      <AvatarImage 
                        src={profileImageUrl || undefined} 
                        alt={`${consultantData.firstName} ${consultantData.lastName}`} 
                      />
                      <AvatarFallback className="bg-blue-600 text-white text-sm font-medium">
                        {getInitials(consultantData.firstName, consultantData.lastName)}
                      </AvatarFallback>
                    </Avatar>
                    <div className="hidden md:flex flex-col items-start">
                      <span className="text-sm font-medium text-gray-900">
                        {consultantData.firstName} {consultantData.lastName}
                      </span>
                      <span className="text-xs text-gray-500">
                        {consultantData.specialite || "Consultant"}
                      </span>
                    </div>
                    <ChevronDown className="h-4 w-4 text-gray-500" />
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent className="w-60" align="end">
                  <DropdownMenuLabel>
                    <div className="flex items-center gap-3">
                      <Avatar className="h-10 w-10">
                        <AvatarImage 
                          src={profileImageUrl || undefined} 
                          alt={`${consultantData.firstName} ${consultantData.lastName}`} 
                        />
                        <AvatarFallback className="bg-blue-600 text-white">
                          {getInitials(consultantData.firstName, consultantData.lastName)}
                        </AvatarFallback>
                      </Avatar>
                      <div>
                        <p className="font-medium">{consultantData.firstName} {consultantData.lastName}</p>
                        <p className="text-xs text-gray-500">{consultantData.email}</p>
                      </div>
                    </div>
                  </DropdownMenuLabel>
                  <DropdownMenuSeparator />
                  
                  <DropdownMenuItem onClick={() => setIsEditingProfile(true)} className="cursor-pointer">
                    <User className="h-4 w-4 mr-2" />
                    Mon Profil
                  </DropdownMenuItem>
                  
                  <DropdownMenuItem className="cursor-pointer">
                    <Settings className="h-4 w-4 mr-2" />
                    Paramètres
                  </DropdownMenuItem>
                  
                  <DropdownMenuItem className="cursor-pointer">
                    <Briefcase className="h-4 w-4 mr-2" />
                    Mes Missions
                  </DropdownMenuItem>
                  
                  <DropdownMenuItem className="cursor-pointer">
                    <FileText className="h-4 w-4 mr-2" />
                    Mes CV
                  </DropdownMenuItem>
                  
                  <DropdownMenuSeparator />
                  
                  <DropdownMenuItem 
                    onClick={handleLogout} 
                    className="cursor-pointer text-red-600 focus:text-red-600 focus:bg-red-50"
                  >
                    <LogOut className="h-4 w-4 mr-2" />
                    Se déconnecter
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
            </div>
          </div>
        </div>
      </header>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="grid grid-cols-1 lg:grid-cols-4 gap-8">
          
          {/* Sidebar Profile */}
          <div className={`lg:col-span-1 space-y-6 ${sidebarOpen ? 'block' : 'hidden lg:block'}`}>
            
            {/* Carte de profil */}
            <Card>
              <div className="h-20 bg-gradient-to-r from-blue-600 to-blue-700 relative">
                <div className="absolute -bottom-10 left-6">
                  <div className="relative">
                    <Avatar className="h-20 w-20 ring-4 ring-white">
                      <AvatarImage 
                        src={profileImageUrl || undefined} 
                        alt={`${consultantData.firstName} ${consultantData.lastName}`} 
                      />
                      <AvatarFallback className="bg-blue-600 text-white text-xl font-bold">
                        {getInitials(consultantData.firstName, consultantData.lastName)}
                      </AvatarFallback>
                    </Avatar>
                    
                    <Dialog>
                      <DialogTrigger asChild>
                        <Button 
                          size="sm" 
                          className="absolute -bottom-1 -right-1 h-8 w-8 rounded-full bg-blue-600 hover:bg-blue-700"
                          disabled={uploadingImage}
                        >
                          {uploadingImage ? (
                            <RefreshCw className="h-3 w-3 animate-spin" />
                          ) : (
                            <Camera className="h-3 w-3" />
                          )}
                        </Button>
                      </DialogTrigger>
                      <DialogContent className="sm:max-w-md">
                        <DialogHeader>
                          <DialogTitle>Changer la photo de profil</DialogTitle>
                          <DialogDescription>
                            Sélectionnez une nouvelle photo (max 5MB)
                          </DialogDescription>
                        </DialogHeader>
                        <div className="space-y-4">
                          <div className="flex justify-center">
                            <Avatar className="h-32 w-32">
                              <AvatarImage src={profileImageUrl || undefined} />
                              <AvatarFallback className="bg-blue-600 text-white text-3xl">
                                {getInitials(consultantData.firstName, consultantData.lastName)}
                              </AvatarFallback>
                            </Avatar>
                          </div>
                          <div>
                            <Label htmlFor="profile-image">Nouvelle photo</Label>
                            <Input
                              id="profile-image"
                              type="file"
                              accept="image/*"
                              onChange={handleImageUpload}
                              disabled={uploadingImage}
                              className="mt-2"
                            />
                          </div>
                        </div>
                      </DialogContent>
                    </Dialog>
                  </div>
                </div>
              </div>

              <CardContent className="pt-12 pb-6">
                <div className="space-y-4">
                  <div className="text-center">
                    <h2 className="text-xl font-bold text-gray-900">
                      {consultantData.firstName} {consultantData.lastName}
                    </h2>
                    <p className="text-gray-600">{consultantData.specialite || "Consultant"}</p>
                  </div>

                  <div className="flex justify-center">
                    <Badge className={`${getExpertiseBadgeColor(consultantData.expertise)}`}>
                      <Award className="h-3 w-3 mr-1" />
                      {consultantData.expertise}
                    </Badge>
                  </div>

                  <div className="space-y-2">
                    <div className="flex justify-between text-sm">
                      <span>Profil complété</span>
                      <span className="font-medium">{profileCompletion}%</span>
                    </div>
                    <Progress value={profileCompletion} className="h-2" />
                  </div>

                  <div className="space-y-3 pt-4 border-t">
                    <div className="flex items-center gap-2 text-sm text-gray-600">
                      <Mail className="h-4 w-4" />
                      <span className="truncate">{consultantData.email}</span>
                    </div>
                    <div className="flex items-center gap-2 text-sm text-gray-600">
                      <Phone className="h-4 w-4" />
                      <span>{consultantData.phone}</span>
                    </div>
                    <div className="flex items-center gap-2 text-sm text-gray-600">
                      <MapPin className="h-4 w-4" />
                      <span>{consultantData.city}, {consultantData.country}</span>
                    </div>
                  </div>

                  <Button 
                    onClick={() => setIsEditingProfile(true)}
                    variant="outline" 
                    size="sm" 
                    className="w-full"
                  >
                    <Edit className="h-4 w-4 mr-2" />
                    Modifier le profil
                  </Button>
                </div>
              </CardContent>
            </Card>

            {/* Stats rapides */}
            <div className="grid grid-cols-2 gap-4">
              <Card className="p-4 text-center">
                <div className="text-2xl font-bold text-blue-600">{missions.length}</div>
                <div className="text-sm text-gray-600">Missions</div>
              </Card>
              
              <Card className="p-4 text-center">
                <div className="text-2xl font-bold text-green-600">
                  {richatCvDetails.available ? "✓" : "⏳"}
                </div>
                <div className="text-sm text-gray-600">CV Richat</div>
              </Card>
            </div>
          </div>

          {/* Contenu principal */}
          <div className="lg:col-span-3 space-y-6">
            
            {/* Banner de bienvenue */}
            <Card className="bg-gradient-to-r from-blue-600 to-blue-700 text-white">
              <CardContent className="p-8">
                <div className="flex justify-between items-start">
                  <div>
                    <h1 className="text-3xl font-bold mb-2">
                      Bienvenue, {consultantData.firstName} ! 👋
                    </h1>
                    <p className="text-blue-100 mb-4">
                      Votre espace consultant Richat Partners
                    </p>
                    <div className="flex items-center gap-2 text-sm text-blue-100">
                      <Calendar className="h-4 w-4" />
                      <span>
                        Disponible du {formatDate(consultantData.startAvailability)} 
                        au {formatDate(consultantData.endAvailability)}
                      </span>
                    </div>
                  </div>
                  <div className="text-right">
                    <div className="text-sm text-blue-100">Profil complété</div>
                    <div className="text-3xl font-bold">{profileCompletion}%</div>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* 🔥 SECTION EXPERTISE ET COMPÉTENCES COMPACTES EN 2 COLONNES */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              
              {/* Section Expertise - Compacte */}
              <Card className="h-fit">
                <CardHeader className="pb-3">
                  <div className="flex justify-between items-center">
                    <CardTitle className="flex items-center gap-2 text-lg">
                      <Award className="h-4 w-4" />
                      Expertise
                    </CardTitle>
                    <Button 
                      variant="outline" 
                      size="sm"
                      onClick={() => setShowExpertiseForm(true)}
                    >
                      <Edit className="h-3 w-3 mr-1" />
                      Évaluer
                    </Button>
                  </div>
                </CardHeader>
                <CardContent className="pt-0">
                  <div className="space-y-3">
                    {/* Badge et score en ligne */}
                    <div className="flex items-center justify-between">
                      <Badge className={`px-3 py-1 ${getExpertiseBadgeColor(consultantData.expertise)}`}>
                        <Star className="h-3 w-3 mr-1" />
                        {consultantData.expertise}
                      </Badge>
                      
                      {expertiseDetails && (
                        <div className="text-right">
                          <div className="text-lg font-bold text-blue-600">
                            {expertiseDetails.score_total}/100
                          </div>
                        </div>
                      )}
                    </div>

                    {/* Détails d'expertise compacts */}
                    {expertiseDetails ? (
                      <div className="space-y-2">
                        <Progress value={expertiseDetails.score_total} className="h-2" />
                        
                        {/* Détails en format plus compact */}
                        <div className="grid grid-cols-2 gap-1 text-xs">
                          <div className="flex justify-between">
                            <span className="text-gray-600">Exp:</span>
                            <span className="font-medium">{expertiseDetails.details.experience.contribution}/40</span>
                          </div>
                          <div className="flex justify-between">
                            <span className="text-gray-600">Form:</span>
                            <span className="font-medium">{expertiseDetails.details.formation.contribution}/25</span>
                          </div>
                          <div className="flex justify-between">
                            <span className="text-gray-600">Comp:</span>
                            <span className="font-medium">{expertiseDetails.details.competences.contribution}/20</span>
                          </div>
                          <div className="flex justify-between">
                            <span className="text-gray-600">Spéc:</span>
                            <span className="font-medium">{expertiseDetails.details.qualitatif.contribution}/15</span>
                          </div>
                        </div>

                        {/* Recommandation compacte */}
                        {expertiseDetails.recommandations.length > 0 && (
                          <div className="bg-orange-50 p-2 rounded border border-orange-200">
                            <p className="text-xs text-orange-700">
                              💡 {expertiseDetails.recommandations[0]}
                            </p>
                            {expertiseDetails.recommandations.length > 1 && (
                              <button 
                                onClick={() => setShowExpertiseForm(true)}
                                className="text-xs text-orange-600 hover:text-orange-800 mt-1 underline"
                              >
                                +{expertiseDetails.recommandations.length - 1} autres
                              </button>
                            )}
                          </div>
                        )}
                      </div>
                    ) : (
                      /* Fallback compact */
                      <div className="bg-blue-50 p-3 rounded border border-blue-200 text-center">
                        <Button 
                          variant="outline" 
                          size="sm"
                          onClick={() => setShowExpertiseForm(true)}
                          className="text-blue-600 border-blue-300"
                        >
                          <TrendingUp className="h-3 w-3 mr-1" />
                          Évaluer mon expertise
                        </Button>
                      </div>
                    )}
                  </div>
                </CardContent>
              </Card>

              {/* Section Compétences - Compacte */}
              <Card className="h-fit">
                <CardHeader className="pb-3">
                  <div className="flex justify-between items-center">
                    <CardTitle className="flex items-center gap-2 text-lg">
                      <BookOpen className="h-4 w-4" />
                      Compétences
                    </CardTitle>
                    <div className="flex gap-1">
                      {consultantData.cvFilename && (
                        <Button 
                          variant="outline"
                          size="sm"
                          onClick={extractSkillsFromCV}
                          disabled={isExtractingSkills}
                        >
                          {isExtractingSkills ? (
                            <RefreshCw className="h-3 w-3 animate-spin" />
                          ) : (
                            <Zap className="h-3 w-3" />
                          )}
                        </Button>
                      )}
                      <Button 
                        variant="outline" 
                        size="sm"
                        onClick={() => setIsEditingProfile(true)}
                      >
                        <Edit className="h-3 w-3" />
                      </Button>
                    </div>
                  </div>
                </CardHeader>
                <CardContent className="pt-0">
                  {consultantData.skills ? (
                    <div className="space-y-3">
                      {/* Compétences en badges compacts */}
                      <div className="flex flex-wrap gap-1">
                        {consultantData.skills.split(',').slice(0, 8).map((skill, index) => (
                          <Badge 
                            key={index} 
                            variant="secondary" 
                            className="bg-blue-100 text-blue-800 text-xs px-2 py-1"
                          >
                            {skill.trim()}
                          </Badge>
                        ))}
                        {consultantData.skills.split(',').length > 8 && (
                          <Badge 
                            variant="outline" 
                            className="text-xs px-2 py-1 cursor-pointer"
                            onClick={() => setIsEditingProfile(true)}
                          >
                            +{consultantData.skills.split(',').length - 8} autres
                          </Badge>
                        )}
                      </div>
                      
                      {/* Compétences extraites compactes */}
                      {extractedSkills.length > 0 && (
                        <div className="p-2 bg-green-50 rounded border border-green-200">
                          <div className="flex items-center justify-between">
                            <span className="text-xs font-medium text-green-800">
                              ✨ {extractedSkills.length} extraites
                            </span>
                            <div className="flex flex-wrap gap-1">
                              {extractedSkills.slice(0, 3).map((skill, index) => (
                                <Badge 
                                  key={index} 
                                  variant="outline" 
                                  className="text-xs bg-green-100 border-green-300 text-green-700 px-1 py-0"
                                >
                                  {skill}
                                </Badge>
                              ))}
                              {extractedSkills.length > 3 && (
                                <span className="text-xs text-green-600">+{extractedSkills.length - 3}</span>
                              )}
                            </div>
                          </div>
                        </div>
                      )}
                    </div>
                  ) : (
                    <div className="text-center py-4">
                      <p className="text-sm text-gray-500 mb-2">Aucune compétence</p>
                      <div className="flex justify-center gap-1">
                        {consultantData.cvFilename && (
                          <Button 
                            variant="outline" 
                            size="sm"
                            onClick={extractSkillsFromCV}
                            disabled={isExtractingSkills}
                          >
                            {isExtractingSkills ? (
                              <RefreshCw className="h-3 w-3 animate-spin" />
                            ) : (
                              <Zap className="h-3 w-3 mr-1" />
                            )}
                            Extraire
                          </Button>
                        )}
                        <Button 
                          variant="outline" 
                          size="sm"
                          onClick={() => setIsEditingProfile(true)}
                        >
                          <Plus className="h-3 w-3 mr-1" />
                          Ajouter
                        </Button>
                      </div>
                    </div>
                  )}
                </CardContent>
              </Card>
            </div>

            {/* Missions */}
            <Card>
              <CardHeader>
                <div className="flex justify-between items-center">
                  <CardTitle className="flex items-center gap-2">
                    <Briefcase className="h-5 w-5" />
                    Mes Missions
                  </CardTitle>
                  <Badge variant="outline">
                    {missions.length} mission{missions.length !== 1 ? 's' : ''}
                  </Badge>
                </div>
              </CardHeader>
              <CardContent>
                {loadingMissions ? (
                  <div className="flex justify-center py-8">
                    <RefreshCw className="animate-spin h-8 w-8 text-blue-600" />
                  </div>
                ) : missions.length > 0 ? (
                  <div className="space-y-4">
                    {missions.map((mission) => (
                      <Card key={mission.id} className="border-l-4 border-l-blue-500">
                        <CardContent className="p-4">
                          <div className="flex justify-between items-start mb-2">
                            <div>
                              <h3 className="font-semibold text-gray-900">{mission.nom_projet}</h3>
                              <div className="flex items-center gap-1 text-sm text-gray-600">
                                <Building className="h-4 w-4" />
                                <span>{mission.client}</span>
                              </div>
                            </div>
                            <Badge className={getScoreBadgeColor(mission.score)}>
                              {Math.round(mission.score)}%
                            </Badge>
                          </div>
                          
                          <p className="text-sm text-gray-700 mb-3">
                            {mission.description}
                          </p>
                          
                          <div className="flex justify-between items-center text-xs text-gray-500">
                            <div className="flex items-center gap-1">
                              <Calendar className="h-3 w-3" />
                              <span>
                                Du {formatDate(mission.date_debut)} au {formatDate(mission.date_fin)}
                              </span>
                            </div>
                            <Button variant="ghost" size="sm" className="h-auto p-0 text-blue-600">
                              Voir détails
                              <ArrowRight className="h-3 w-3 ml-1" />
                            </Button>
                          </div>
                        </CardContent>
                      </Card>
                    ))}
                  </div>
                ) : (
                  <div className="text-center py-8">
                    <Briefcase className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                    <p className="text-gray-500">Aucune mission validée</p>
                    <p className="text-sm text-gray-400 mt-1">
                      Vous serez notifié lorsque vous serez sélectionné
                    </p>
                  </div>
                )}
              </CardContent>
            </Card>

            {/* CV Section */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {/* CV Original */}
              {consultantData.cvFilename && (
                <Card>
                  <CardContent className="p-6">
                    <div className="flex items-center gap-3 mb-4">
                      <FileText className="h-8 w-8 text-blue-600" />
                      <div>
                        <h3 className="font-semibold">CV Original</h3>
                        <p className="text-sm text-gray-500">Document téléchargé</p>
                      </div>
                    </div>
                    <p className="text-xs text-gray-600 mb-4 truncate">{consultantData.cvFilename}</p>
                    <Button 
                      variant="outline" 
                      className="w-full"
                      onClick={() => window.open(`http://127.0.0.1:8000/media/uploads/${consultantData.cvFilename}`, '_blank')}
                    >
                      <Download className="h-4 w-4 mr-2" />
                      Télécharger
                    </Button>
                  </CardContent>
                </Card>
              )}

              {/* CV Richat */}
              <Card>
                <CardContent className="p-6">
                  <div className="flex items-center gap-3 mb-4">
                    <Star className="h-8 w-8 text-green-600" />
                    <div>
                      <h3 className="font-semibold">CV Richat Partners</h3>
                      <p className="text-sm text-gray-500">Format standardisé</p>
                    </div>
                  </div>

                  {richatCvDetails.available ? (
                    <div className="space-y-4">
                      <div className="bg-gray-50 p-3 rounded">
                        <p className="text-xs text-gray-600">Fichier:</p>
                        <p className="font-medium text-sm truncate">{richatCvDetails.filename}</p>
                        {richatCvDetails.created_at && (
                          <>
                            <p className="text-xs text-gray-600 mt-2">Créé le:</p>
                            <p className="text-sm">{formatDate(richatCvDetails.created_at)}</p>
                          </>
                        )}
                      </div>
                      
                      <div className="flex gap-2">
                        <Button 
                          onClick={handleDownloadRichatCV}
                          disabled={loadingCv}
                          className="flex-1"
                        >
                          {loadingCv ? (
                            <RefreshCw className="animate-spin h-4 w-4 mr-2" />
                          ) : (
                            <Download className="h-4 w-4 mr-2" />
                          )}
                          Télécharger
                        </Button>
                        
                        <Button 
                          variant="outline"
                          onClick={handleRegenerateRichatCV}
                          disabled={loadingCv}
                        >
                          <RefreshCw className="h-4 w-4" />
                        </Button>
                      </div>

                      {/* Bouton pour compléter le CV */}
                      <Button 
                        onClick={() => {
                          prefillRichatCV();
                          setIsCompletingCV(true);
                        }}
                        variant="outline"
                        className="w-full border-blue-300 text-blue-600 hover:bg-blue-50"
                      >
                        <Edit className="h-4 w-4 mr-2" />
                        Compléter le CV Richat
                      </Button>
                    </div>
                  ) : (
                    <div className="text-center py-4">
                      <FileIcon className="h-8 w-8 text-gray-400 mx-auto mb-2" />
                      <p className="text-sm text-gray-600 mb-3">CV Richat non disponible</p>
                      
                      <div className="space-y-2">
                        <Button 
                          variant="outline"
                          onClick={handleRegenerateRichatCV}
                          disabled={loadingCv}
                          size="sm"
                          className="w-full"
                        >
                          <RefreshCw className="h-4 w-4 mr-2" />
                          Vérifier
                        </Button>
                        
                        <Button 
                          onClick={() => {
                            prefillRichatCV();
                            setIsCompletingCV(true);
                          }}
                          className="w-full bg-blue-600 hover:bg-blue-700"
                          size="sm"
                        >
                          <Zap className="h-4 w-4 mr-2" />
                          Créer CV Richat
                        </Button>
                      </div>
                    </div>
                  )}
                </CardContent>
              </Card>
            </div>
          </div>
        </div>
      </div>

      {/* 🔥 DIALOG D'ÉVALUATION D'EXPERTISE CORRIGÉ */}
      <Dialog open={showExpertiseForm} onOpenChange={setShowExpertiseForm}>
        <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <TrendingUp className="h-6 w-6" />
              Évaluation du Niveau d'Expertise
            </DialogTitle>
            <DialogDescription>
              Complétez ces informations pour obtenir une évaluation précise de votre niveau d'expertise
            </DialogDescription>
          </DialogHeader>
          
          <div className="space-y-6 py-4">
            {/* 🔥 AFFICHAGE DES VALEURS ACTUELLES EN HAUT */}
            {(consultantData.annees_experience || consultantData.formation_niveau || consultantData.certifications_count || consultantData.projets_realises) && (
              <div className="bg-blue-50 p-4 rounded-lg border border-blue-200">
                <h4 className="font-medium text-blue-900 mb-2">📊 Votre profil d'expertise actuel</h4>
                <div className="grid grid-cols-2 md:grid-cols-4 gap-3 text-xs">
                  <div>
                    <span className="text-gray-600">Expérience:</span>
                    <div className="font-medium">{consultantData.annees_experience || 0} ans</div>
                  </div>
                  <div>
                    <span className="text-gray-600">Formation:</span>
                    <div className="font-medium">{consultantData.formation_niveau || 'BAC+3'}</div>
                  </div>
                  <div>
                    <span className="text-gray-600">Certifications:</span>
                    <div className="font-medium">{consultantData.certifications_count || 0}</div>
                  </div>
                  <div>
                    <span className="text-gray-600">Projets:</span>
                    <div className="font-medium">{consultantData.projets_realises || 0}</div>
                  </div>
                </div>
              </div>
            )}

            {/* Formulaire d'expertise */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              
              {/* Expérience */}
              <div className="space-y-3">
                <Label className="text-base font-medium flex items-center gap-2">
                  <Briefcase className="h-4 w-4 text-blue-600" />
                  Expérience Professionnelle
                </Label>
                <div>
                  <Label htmlFor="experience">Années d'expérience totale</Label>
                  <Input
                    id="experience"
                    type="number"
                    min="0"
                    max="50"
                    value={expertiseFormData.annees_experience}
                    onChange={(e) => setExpertiseFormData({
                      ...expertiseFormData, 
                      annees_experience: parseInt(e.target.value) || 0
                    })}
                    className="mt-1"
                    placeholder="Nombre d'années d'expérience"
                  />
                </div>
              </div>

              {/* Formation */}
              <div className="space-y-3">
                <Label className="text-base font-medium flex items-center gap-2">
                  <GraduationCap className="h-4 w-4 text-green-600" />
                  Formation
                </Label>
                <div>
                  <Label htmlFor="formation">Niveau le plus élevé</Label>
                  <Select 
                    value={expertiseFormData.formation_niveau} 
                    onValueChange={(value) => setExpertiseFormData({
                      ...expertiseFormData, 
                      formation_niveau: value
                    })}
                  >
                    <SelectTrigger className="mt-1">
                      <SelectValue placeholder="Sélectionnez votre niveau" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="BAC">Baccalauréat</SelectItem>
                      <SelectItem value="BAC+2">BTS/DUT/DEUG</SelectItem>
                      <SelectItem value="BAC+3">Licence/Bachelor</SelectItem>
                      <SelectItem value="BAC+4">Maîtrise</SelectItem>
                      <SelectItem value="BAC+5">Master/Ingénieur</SelectItem>
                      <SelectItem value="BAC+8">Doctorat/PhD</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>

              {/* Certifications */}
              <div className="space-y-3">
                <Label className="text-base font-medium flex items-center gap-2">
                  <Award className="h-4 w-4 text-yellow-600" />
                  Certifications
                </Label>
                <div>
                  <Label htmlFor="certifications">Nombre de certifications professionnelles</Label>
                  <Input
                    id="certifications"
                    type="number"
                    min="0"
                    max="20"
                    value={expertiseFormData.certifications_count}
                    onChange={(e) => setExpertiseFormData({
                      ...expertiseFormData, 
                      certifications_count: parseInt(e.target.value) || 0
                    })}
                    className="mt-1"
                    placeholder="Nombre de certifications"
                  />
                </div>
              </div>

              {/* Projets */}
              <div className="space-y-3">
                <Label className="text-base font-medium flex items-center gap-2">
                  <Briefcase className="h-4 w-4 text-purple-600" />
                  Projets
                </Label>
                <div>
                  <Label htmlFor="projets">Projets significatifs réalisés</Label>
                  <Input
                    id="projets"
                    type="number"
                    min="0"
                    max="100"
                    value={expertiseFormData.projets_realises}
                    onChange={(e) => setExpertiseFormData({
                      ...expertiseFormData, 
                      projets_realises: parseInt(e.target.value) || 0
                    })}
                    className="mt-1"
                    placeholder="Nombre de projets"
                  />
                </div>
              </div>
            </div>

            {/* Expériences spécialisées */}
            <div className="space-y-3">
              <Label className="text-base font-medium flex items-center gap-2">
                <Users className="h-4 w-4 text-indigo-600" />
                Expériences Spécialisées
              </Label>
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="flex items-center space-x-2">
                  <Checkbox
                    id="leadership"
                    checked={expertiseFormData.leadership_experience}
                    onCheckedChange={(checked) => setExpertiseFormData({
                      ...expertiseFormData, 
                      leadership_experience: checked as boolean
                    })}
                  />
                  <Label htmlFor="leadership" className="text-sm">
                    Expérience en leadership/management d'équipe
                  </Label>
                </div>
                
                <div className="flex items-center space-x-2">
                  <Checkbox
                    id="international"
                    checked={expertiseFormData.international_experience}
                    onCheckedChange={(checked) => setExpertiseFormData({
                      ...expertiseFormData, 
                      international_experience: checked as boolean
                    })}
                  />
                  <Label htmlFor="international" className="text-sm">
                    Expérience internationale ou multiculturelle
                  </Label>
                </div>
              </div>
            </div>

            {/* Aperçu du niveau calculé */}
            {expertiseDetails && (
              <Card className="bg-blue-50 border-blue-200">
                <CardContent className="p-4">
                  <div className="flex justify-between items-center mb-3">
                    <h4 className="font-medium text-blue-900">Niveau d'expertise calculé</h4>
                    <Badge className={`${getExpertiseBadgeColor(expertiseDetails.niveau_calcule)}`}>
                      {expertiseDetails.niveau_calcule}
                    </Badge>
                  </div>
                  
                  <div className="space-y-2">
                    <div className="flex justify-between">
                      <span className="text-sm text-blue-700">Score global</span>
                      <span className="font-bold text-blue-900">{expertiseDetails.score_total}/100</span>
                    </div>
                    <Progress value={expertiseDetails.score_total} className="h-2" />
                    
                    {/* Détails des composantes */}
                    <div className="grid grid-cols-2 gap-2 text-xs mt-3">
                      <div className="flex justify-between">
                        <span className="text-blue-600">Expérience:</span>
                        <span className="font-medium">{expertiseDetails.details.experience.contribution}/40</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-blue-600">Formation:</span>
                        <span className="font-medium">{expertiseDetails.details.formation.contribution}/25</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-blue-600">Compétences:</span>
                        <span className="font-medium">{expertiseDetails.details.competences.contribution}/20</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-blue-600">Spécialisé:</span>
                        <span className="font-medium">{expertiseDetails.details.qualitatif.contribution}/15</span>
                      </div>
                    </div>

                    {/* Recommandations */}
                    {expertiseDetails.recommandations.length > 0 && (
                      <div className="mt-3 p-2 bg-white rounded border">
                        <h5 className="text-xs font-medium text-blue-800 mb-1">Recommandations:</h5>
                        <ul className="text-xs text-blue-700 space-y-1">
                          {expertiseDetails.recommandations.map((rec, index) => (
                            <li key={index}>• {rec}</li>
                          ))}
                        </ul>
                      </div>
                    )}
                  </div>
                </CardContent>
              </Card>
            )}
          </div>

          <div className="flex justify-end gap-3 pt-4 border-t">
            <Button variant="outline" onClick={() => setShowExpertiseForm(false)}>
              Annuler
            </Button>
            <Button 
              onClick={updateExpertiseInfo} 
              className="bg-blue-600 hover:bg-blue-700"
              disabled={!expertiseFormData.annees_experience && !expertiseFormData.formation_niveau}
            >
              <Save className="h-4 w-4 mr-2" />
              Mettre à jour mon expertise
            </Button>
          </div>
        </DialogContent>
      </Dialog>

      {/* Dialog d'édition du profil */}
      <Dialog open={isEditingProfile} onOpenChange={setIsEditingProfile}>
        <DialogContent className="sm:max-w-3xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Modifier le profil</DialogTitle>
            <DialogDescription>
              Mettez à jour vos informations personnelles et professionnelles
            </DialogDescription>
          </DialogHeader>
          
          <div className="space-y-6 py-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <Label htmlFor="firstName">Prénom</Label>
                <Input
                  id="firstName"
                  value={editFormData.firstName || ''}
                  onChange={(e) => setEditFormData(prev => ({ ...prev, firstName: e.target.value }))}
                />
              </div>
              <div>
                <Label htmlFor="lastName">Nom</Label>
                <Input
                  id="lastName"
                  value={editFormData.lastName || ''}
                  onChange={(e) => setEditFormData(prev => ({ ...prev, lastName: e.target.value }))}
                />
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <Label htmlFor="email">Email</Label>
                <Input
                  id="email"
                  type="email"
                  value={editFormData.email || ''}
                  onChange={(e) => setEditFormData(prev => ({ ...prev, email: e.target.value }))}
                />
              </div>
              <div>
                <Label htmlFor="phone">Téléphone</Label>
                <Input
                  id="phone"
                  value={editFormData.phone || ''}
                  onChange={(e) => setEditFormData(prev => ({ ...prev, phone: e.target.value }))}
                />
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <Label htmlFor="country">Pays</Label>
                <Input
                  id="country"
                  value={editFormData.country || ''}
                  onChange={(e) => setEditFormData(prev => ({ ...prev, country: e.target.value }))}
                />
              </div>
              <div>
                <Label htmlFor="city">Ville</Label>
                <Input
                  id="city"
                  value={editFormData.city || ''}
                  onChange={(e) => setEditFormData(prev => ({ ...prev, city: e.target.value }))}
                />
              </div>
            </div>

            <div>
              <Label htmlFor="specialite">Spécialité</Label>
              <Input
                id="specialite"
                value={editFormData.specialite || ''}
                onChange={(e) => setEditFormData(prev => ({ ...prev, specialite: e.target.value }))}
                placeholder="Ex: Développement Web, Analyse Financière..."
              />
            </div>

            <div>
              <Label htmlFor="skills">Compétences</Label>
              <Textarea
                id="skills"
                value={editFormData.skills || ''}
                onChange={(e) => setEditFormData(prev => ({ ...prev, skills: e.target.value }))}
                placeholder="Séparez vos compétences par des virgules"
                rows={3}
              />
              <p className="text-xs text-gray-500 mt-1">
                💡 Vous pouvez aussi utiliser l'extraction automatique depuis votre CV
              </p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <Label htmlFor="startAvailability">Disponible à partir de</Label>
                <Input
                  id="startAvailability"
                  type="date"
                  value={editFormData.startAvailability || ''}
                  onChange={(e) => setEditFormData(prev => ({ ...prev, startAvailability: e.target.value }))}
                />
              </div>
              <div>
                <Label htmlFor="endAvailability">Disponible jusqu'à</Label>
                <Input
                  id="endAvailability"
                  type="date"
                  value={editFormData.endAvailability || ''}
                  onChange={(e) => setEditFormData(prev => ({ ...prev, endAvailability: e.target.value }))}
                />
              </div>
            </div>
          </div>

          <div className="flex justify-end gap-3 pt-4 border-t">
            <Button variant="outline" onClick={() => setIsEditingProfile(false)}>
              Annuler
            </Button>
            <Button onClick={handleSaveProfile}>
              <Save className="h-4 w-4 mr-2" />
              Enregistrer
            </Button>
          </div>
        </DialogContent>
      </Dialog>

      {/* Dialog pour compléter le CV Richat */}
      <Dialog open={isCompletingCV} onOpenChange={setIsCompletingCV}>
        <DialogContent className="max-w-6xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <FileText className="h-6 w-6" />
              Créer/Compléter votre CV Richat
            </DialogTitle>
            <DialogDescription>
              Remplissez les informations pour générer votre CV au format Richat Partners
            </DialogDescription>
          </DialogHeader>

          <Tabs defaultValue="general" className="w-full">
            <TabsList className="grid w-full grid-cols-5">
              <TabsTrigger value="general">Général</TabsTrigger>
              <TabsTrigger value="formation">Formation</TabsTrigger>
              <TabsTrigger value="experience">Expérience</TabsTrigger>
              <TabsTrigger value="langues">Langues</TabsTrigger>
              <TabsTrigger value="missions">Missions</TabsTrigger>
            </TabsList>

            <TabsContent value="general" className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="titre">Titre</Label>
                  <Select 
                    value={richatCVData.titre} 
                    onValueChange={(value) => setRichatCVData(prev => ({ ...prev, titre: value }))}
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="Mr.">Mr.</SelectItem>
                      <SelectItem value="Mme.">Mme.</SelectItem>
                      <SelectItem value="Dr.">Dr.</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <div>
                  <Label htmlFor="nom_expert">Nom complet</Label>
                  <Input
                    id="nom_expert"
                    value={richatCVData.nom_expert}
                    onChange={(e) => setRichatCVData(prev => ({ ...prev, nom_expert: e.target.value }))}
                    placeholder="Prénom Nom"
                  />
                </div>

                <div>
                  <Label htmlFor="date_naissance">Date de naissance</Label>
                  <Input
                    id="date_naissance"
                    type="date"
                    value={richatCVData.date_naissance}
                    onChange={(e) => setRichatCVData(prev => ({ ...prev, date_naissance: e.target.value }))}
                  />
                </div>

                <div>
                  <Label htmlFor="pays_residence">Pays de résidence</Label>
                  <Input
                    id="pays_residence"
                    value={richatCVData.pays_residence}
                    onChange={(e) => setRichatCVData(prev => ({ ...prev, pays_residence: e.target.value }))}
                    placeholder="Mauritanie - Nouakchott"
                  />
                </div>

                <div className="md:col-span-2">
                  <Label htmlFor="titre_professionnel">Titre professionnel</Label>
                  <Input
                    id="titre_professionnel"
                    value={richatCVData.titre_professionnel}
                    onChange={(e) => setRichatCVData(prev => ({ ...prev, titre_professionnel: e.target.value }))}
                    placeholder="Ex: Consultant Senior en Développement Web"
                  />
                </div>

                <div className="md:col-span-2">
                  <Label htmlFor="resume_profil">Résumé du profil</Label>
                  <Textarea
                    id="resume_profil"
                    value={richatCVData.resume_profil}
                    onChange={(e) => setRichatCVData(prev => ({ ...prev, resume_profil: e.target.value }))}
                    placeholder="Décrivez brièvement votre profil professionnel..."
                    rows={4}
                  />
                </div>
              </div>
            </TabsContent>

            <TabsContent value="formation" className="space-y-4">
              <div className="space-y-4">
                <div className="flex justify-between items-center">
                  <h3 className="text-lg font-medium">Formations</h3>
                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    onClick={() => setRichatCVData(prev => ({
                      ...prev,
                      formations: [...prev.formations, {
                        nom_ecole: "",
                        periode_etude: "",
                        diplome_obtenu: "",
                        specialisation: ""
                      }]
                    }))}
                  >
                    <Plus className="h-4 w-4 mr-2" />
                    Ajouter formation
                  </Button>
                </div>

                {richatCVData.formations.map((formation, index) => (
                  <Card key={index} className="p-4">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div>
                        <Label>École/Université</Label>
                        <Input
                          value={formation.nom_ecole}
                          onChange={(e) => {
                            const newFormations = [...richatCVData.formations];
                            newFormations[index].nom_ecole = e.target.value;
                            setRichatCVData(prev => ({ ...prev, formations: newFormations }));
                          }}
                          placeholder="Nom de l'établissement"
                        />
                      </div>

                      <div>
                        <Label>Période d'étude</Label>
                        <Input
                          value={formation.periode_etude}
                          onChange={(e) => {
                            const newFormations = [...richatCVData.formations];
                            newFormations[index].periode_etude = e.target.value;
                            setRichatCVData(prev => ({ ...prev, formations: newFormations }));
                          }}
                          placeholder="Ex: 2018-2022"
                        />
                      </div>

                      <div>
                        <Label>Diplôme obtenu</Label>
                        <Input
                          value={formation.diplome_obtenu}
                          onChange={(e) => {
                            const newFormations = [...richatCVData.formations];
                            newFormations[index].diplome_obtenu = e.target.value;
                            setRichatCVData(prev => ({ ...prev, formations: newFormations }));
                          }}
                          placeholder="Ex: Master en Informatique"
                        />
                      </div>

                      <div>
                        <Label>Spécialisation</Label>
                        <Input
                          value={formation.specialisation}
                          onChange={(e) => {
                            const newFormations = [...richatCVData.formations];
                            newFormations[index].specialisation = e.target.value;
                            setRichatCVData(prev => ({ ...prev, formations: newFormations }));
                          }}
                          placeholder="Ex: Développement Web"
                        />
                      </div>
                    </div>

                    {richatCVData.formations.length > 1 && (
                      <Button
                        type="button"
                        variant="outline"
                        size="sm"
                        className="mt-2 text-red-600"
                        onClick={() => {
                          const newFormations = richatCVData.formations.filter((_, i) => i !== index);
                          setRichatCVData(prev => ({ ...prev, formations: newFormations }));
                        }}
                      >
                        <Trash2 className="h-4 w-4 mr-2" />
                        Supprimer
                      </Button>
                    )}
                  </Card>
                ))}
              </div>
            </TabsContent>

            <TabsContent value="experience" className="space-y-4">
              <div className="space-y-4">
                <div className="flex justify-between items-center">
                  <h3 className="text-lg font-medium">Expériences professionnelles</h3>
                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    onClick={() => setRichatCVData(prev => ({
                      ...prev,
                      experiences: [...prev.experiences, {
                        periode: "",
                        nom_employeur: "",
                        titre_professionnel: "",
                        pays: "",
                        activites: ""
                      }]
                    }))}
                  >
                    <Plus className="h-4 w-4 mr-2" />
                    Ajouter expérience
                  </Button>
                </div>

                {richatCVData.experiences.map((experience, index) => (
                  <Card key={index} className="p-4">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div>
                        <Label>Période</Label>
                        <Input
                          value={experience.periode}
                          onChange={(e) => {
                            const newExperiences = [...richatCVData.experiences];
                            newExperiences[index].periode = e.target.value;
                            setRichatCVData(prev => ({ ...prev, experiences: newExperiences }));
                          }}
                          placeholder="Ex: Jan 2020 - Présent"
                        />
                      </div>

                      <div>
                        <Label>Nom de l'employeur</Label>
                        <Input
                          value={experience.nom_employeur}
                          onChange={(e) => {
                            const newExperiences = [...richatCVData.experiences];
                            newExperiences[index].nom_employeur = e.target.value;
                            setRichatCVData(prev => ({ ...prev, experiences: newExperiences }));
                          }}
                          placeholder="Nom de l'entreprise"
                        />
                      </div>

                      <div>
                        <Label>Titre professionnel</Label>
                        <Input
                          value={experience.titre_professionnel}
                          onChange={(e) => {
                            const newExperiences = [...richatCVData.experiences];
                            newExperiences[index].titre_professionnel = e.target.value;
                            setRichatCVData(prev => ({ ...prev, experiences: newExperiences }));
                          }}
                          placeholder="Votre poste"
                        />
                      </div>

                      <div>
                        <Label>Pays</Label>
                        <Input
                          value={experience.pays}
                          onChange={(e) => {
                            const newExperiences = [...richatCVData.experiences];
                            newExperiences[index].pays = e.target.value;
                            setRichatCVData(prev => ({ ...prev, experiences: newExperiences }));
                          }}
                          placeholder="Pays de l'emploi"
                        />
                      </div>

                      <div className="md:col-span-2">
                        <Label>Activités menées</Label>
                        <Textarea
                          value={experience.activites}
                          onChange={(e) => {
                            const newExperiences = [...richatCVData.experiences];
                            newExperiences[index].activites = e.target.value;
                            setRichatCVData(prev => ({ ...prev, experiences: newExperiences }));
                          }}
                          placeholder="Décrivez vos principales activités et responsabilités..."
                          rows={3}
                        />
                      </div>
                    </div>

                    {richatCVData.experiences.length > 1 && (
                      <Button
                        type="button"
                        variant="outline"
                        size="sm"
                        className="mt-2 text-red-600"
                        onClick={() => {
                          const newExperiences = richatCVData.experiences.filter((_, i) => i !== index);
                          setRichatCVData(prev => ({ ...prev, experiences: newExperiences }));
                        }}
                      >
                        <Trash2 className="h-4 w-4 mr-2" />
                        Supprimer
                      </Button>
                    )}
                  </Card>
                ))}
              </div>
            </TabsContent>

            <TabsContent value="langues" className="space-y-4">
              <div className="space-y-4">
                <h3 className="text-lg font-medium">Langues parlées</h3>
                
                {richatCVData.langues.map((langue, index) => (
                  <Card key={index} className="p-4">
                    <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                      <div>
                        <Label>Langue</Label>
                        <Input
                          value={langue.langue}
                          onChange={(e) => {
                            const newLangues = [...richatCVData.langues];
                            newLangues[index].langue = e.target.value;
                            setRichatCVData(prev => ({ ...prev, langues: newLangues }));
                          }}
                          placeholder="Ex: Français"
                        />
                      </div>

                      <div>
                        <Label>Parler</Label>
                        <Select 
                          value={langue.parler}
                          onValueChange={(value) => {
                            const newLangues = [...richatCVData.langues];
                            newLangues[index].parler = value;
                            setRichatCVData(prev => ({ ...prev, langues: newLangues }));
                          }}
                        >
                          <SelectTrigger>
                            <SelectValue placeholder="Niveau" />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="Native speaker">Native speaker</SelectItem>
                            <SelectItem value="Excellent">Excellent</SelectItem>
                            <SelectItem value="Bon">Bon</SelectItem>
                            <SelectItem value="Moyen">Moyen</SelectItem>
                            <SelectItem value="Débutant">Débutant</SelectItem>
                          </SelectContent>
                        </Select>
                      </div>

                      <div>
                        <Label>Lecture</Label>
                        <Select 
                          value={langue.lecture}
                          onValueChange={(value) => {
                            const newLangues = [...richatCVData.langues];
                            newLangues[index].lecture = value;
                            setRichatCVData(prev => ({ ...prev, langues: newLangues }));
                          }}
                        >
                          <SelectTrigger>
                            <SelectValue placeholder="Niveau" />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="Native speaker">Native speaker</SelectItem>
                            <SelectItem value="Excellent">Excellent</SelectItem>
                            <SelectItem value="Bon">Bon</SelectItem>
                            <SelectItem value="Moyen">Moyen</SelectItem>
                            <SelectItem value="Débutant">Débutant</SelectItem>
                          </SelectContent>
                        </Select>
                      </div>

                      <div>
                        <Label>Éditorial</Label>
                        <Select 
                          value={langue.editorial}
                          onValueChange={(value) => {
                            const newLangues = [...richatCVData.langues];
                            newLangues[index].editorial = value;
                            setRichatCVData(prev => ({ ...prev, langues: newLangues }));
                          }}
                        >
                          <SelectTrigger>
                            <SelectValue placeholder="Niveau" />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="Native speaker">Native speaker</SelectItem>
                            <SelectItem value="Excellent">Excellent</SelectItem>
                            <SelectItem value="Bon">Bon</SelectItem>
                            <SelectItem value="Moyen">Moyen</SelectItem>
                            <SelectItem value="Débutant">Débutant</SelectItem>
                          </SelectContent>
                        </Select>
                      </div>
                    </div>
                  </Card>
                ))}

                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={() => setRichatCVData(prev => ({
                    ...prev,
                    langues: [...prev.langues, {
                      langue: "",
                      parler: "",
                      lecture: "",
                      editorial: ""
                    }]
                  }))}
                >
                  <Plus className="h-4 w-4 mr-2" />
                  Ajouter langue
                </Button>
              </div>
            </TabsContent>

            <TabsContent value="missions" className="space-y-4">
              <div className="space-y-4">
                <div className="flex justify-between items-center">
                  <h3 className="text-lg font-medium">Missions de référence</h3>
                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    onClick={() => setRichatCVData(prev => ({
                      ...prev,
                      missions_reference: [...prev.missions_reference, {
                        nom_projet: "",
                        date: "",
                        societe: "",
                        poste_occupe: "",
                        lieu: "",
                        client_bailleur: "",
                        description_projet: "",
                        type_secteur: "",
                        activites_responsabilites: ""
                      }]
                    }))}
                  >
                    <Plus className="h-4 w-4 mr-2" />
                    Ajouter mission
                  </Button>
                </div>

                {richatCVData.missions_reference.map((mission, index) => (
                  <Card key={index} className="p-4">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div>
                        <Label>Nom du projet</Label>
                        <Input
                          value={mission.nom_projet}
                          onChange={(e) => {
                            const newMissions = [...richatCVData.missions_reference];
                            newMissions[index].nom_projet = e.target.value;
                            setRichatCVData(prev => ({ ...prev, missions_reference: newMissions }));
                          }}
                          placeholder="Nom du projet"
                        />
                      </div>

                      <div>
                        <Label>Date</Label>
                        <Input
                          value={mission.date}
                          onChange={(e) => {
                            const newMissions = [...richatCVData.missions_reference];
                            newMissions[index].date = e.target.value;
                            setRichatCVData(prev => ({ ...prev, missions_reference: newMissions }));
                          }}
                          placeholder="Ex: 2023-2024"
                        />
                      </div>

                      <div>
                        <Label>Société</Label>
                        <Input
                          value={mission.societe}
                          onChange={(e) => {
                            const newMissions = [...richatCVData.missions_reference];
                            newMissions[index].societe = e.target.value;
                            setRichatCVData(prev => ({ ...prev, missions_reference: newMissions }));
                          }}
                          placeholder="Nom de la société"
                        />
                      </div>

                      <div>
                        <Label>Poste occupé</Label>
                        <Input
                          value={mission.poste_occupe}
                          onChange={(e) => {
                            const newMissions = [...richatCVData.missions_reference];
                            newMissions[index].poste_occupe = e.target.value;
                            setRichatCVData(prev => ({ ...prev, missions_reference: newMissions }));
                          }}
                          placeholder="Votre rôle"
                        />
                      </div>

                      <div>
                        <Label>Lieu</Label>
                        <Input
                          value={mission.lieu}
                          onChange={(e) => {
                            const newMissions = [...richatCVData.missions_reference];
                            newMissions[index].lieu = e.target.value;
                            setRichatCVData(prev => ({ ...prev, missions_reference: newMissions }));
                          }}
                          placeholder="Lieu de la mission"
                        />
                      </div>

                      <div>
                        <Label>Client / Bailleur</Label>
                        <Input
                          value={mission.client_bailleur}
                          onChange={(e) => {
                            const newMissions = [...richatCVData.missions_reference];
                            newMissions[index].client_bailleur = e.target.value;
                            setRichatCVData(prev => ({ ...prev, missions_reference: newMissions }));
                          }}
                          placeholder="Nom du client"
                        />
                      </div>

                      <div className="md:col-span-2">
                        <Label>Description du projet</Label>
                        <Textarea
                          value={mission.description_projet}
                          onChange={(e) => {
                            const newMissions = [...richatCVData.missions_reference];
                            newMissions[index].description_projet = e.target.value;
                            setRichatCVData(prev => ({ ...prev, missions_reference: newMissions }));
                          }}
                          placeholder="Objectifs et description du projet..."
                          rows={3}
                        />
                      </div>

                      <div>
                        <Label>Type ou secteur d'activité</Label>
                        <Input
                          value={mission.type_secteur}
                          onChange={(e) => {
                            const newMissions = [...richatCVData.missions_reference];
                            newMissions[index].type_secteur = e.target.value;
                            setRichatCVData(prev => ({ ...prev, missions_reference: newMissions }));
                          }}
                          placeholder="Ex: Banque, Télécom, etc."
                        />
                      </div>

                      <div className="md:col-span-2">
                        <Label>Activités et responsabilités</Label>
                        <Textarea
                          value={mission.activites_responsabilites}
                          onChange={(e) => {
                            const newMissions = [...richatCVData.missions_reference];
                            newMissions[index].activites_responsabilites = e.target.value;
                            setRichatCVData(prev => ({ ...prev, missions_reference: newMissions }));
                          }}
                          placeholder="Décrivez vos activités et responsabilités sur ce projet..."
                          rows={3}
                        />
                      </div>
                    </div>

                    {richatCVData.missions_reference.length > 1 && (
                      <Button
                        type="button"
                        variant="outline"
                        size="sm"
                        className="mt-2 text-red-600"
                        onClick={() => {
                          const newMissions = richatCVData.missions_reference.filter((_, i) => i !== index);
                          setRichatCVData(prev => ({ ...prev, missions_reference: newMissions }));
                        }}
                      >
                        <Trash2 className="h-4 w-4 mr-2" />
                        Supprimer
                      </Button>
                    )}
                  </Card>
                ))}
              </div>
            </TabsContent>
          </Tabs>

          <div className="flex justify-end gap-3 pt-4 border-t">
            <Button variant="outline" onClick={() => setIsCompletingCV(false)}>
              Annuler
            </Button>
            <Button 
              onClick={async () => {
                setGeneratingCV(true);
                try {
                  const consultantId = localStorage.getItem("consultantId");
                  const response = await fetch(`http://127.0.0.1:8000/api/consultant/${consultantId}/generate-richat-cv/`, {
                    method: 'POST',
                    headers: {
                      'Content-Type': 'application/json',
                    },
                    body: JSON.stringify(richatCVData),
                  });

                  const data = await response.json();
                  
                  if (data.success) {
                    showMessage('success', 'CV Richat généré avec succès !');
                    setIsCompletingCV(false);
                    // Rafraîchir les détails du CV
                    if (consultantId) {
                      await checkRichatCV(consultantId);
                    }
                  } else {
                    showMessage('error', data.error || 'Erreur lors de la génération du CV');
                  }
                } catch (error) {
                  showMessage('error', 'Erreur de connexion lors de la génération du CV');
                } finally {
                  setGeneratingCV(false);
                }
              }}
              disabled={generatingCV}
              className="bg-blue-600 hover:bg-blue-700"
            >
              {generatingCV ? (
                <RefreshCw className="h-4 w-4 mr-2 animate-spin" />
              ) : (
                <Download className="h-4 w-4 mr-2" />
              )}
              Générer CV Richat
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default ConsultantWelcome;