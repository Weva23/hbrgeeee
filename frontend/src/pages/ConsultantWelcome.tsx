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
  Users,
  AlertCircle,
  Target,
  Clock
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
import {
  Alert,
  AlertDescription,
} from "@/components/ui/alert";

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
  id: number | string;
  appel_offre_id: number;
  nom_projet: string;
  client: string;
  description: string;
  date_debut: string;
  date_fin: string;
  score: number;
  date_validation: string;
  statut?: string;
  type?: 'mission' | 'matching';
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
  appel_offre_id?: number;
  appel_offre_nom?: string;
  match_id?: number;
  priority?: string;
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
  const [missionsError, setMissionsError] = useState<string | null>(null);
  const [isUpdatingProfile, setIsUpdatingProfile] = useState(false);
  
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
  const [isUpdatingExpertise, setIsUpdatingExpertise] = useState(false);

  // Fonction pour afficher les messages
  const showMessage = (type: 'success' | 'error' | 'info', text: string) => {
    const newMessage = { type, text, id: Date.now() };
    setMessages(prev => [...prev, newMessage]);
    setTimeout(() => {
      setMessages(prev => prev.filter(msg => msg.id !== newMessage.id));
    }, 4000);
  };

  // 🔥 FONCTION MISSIONS CORRIGÉE
  const fetchConsultantMissions = async (consultantId: string) => {
    console.log("🔍 === DÉBUT RÉCUPÉRATION MISSIONS CORRIGÉE ===");
    console.log("Consultant ID:", consultantId);
    
    setLoadingMissions(true);
    setMissionsError(null);
    
    try {
      const response = await fetch(`http://127.0.0.1:8000/api/consultant/${consultantId}/missions/`, {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
          'Accept': 'application/json',
        },
      });
      
      console.log("📡 Réponse serveur - Status:", response.status);
      console.log("📡 Réponse serveur - OK:", response.ok);
      
      // Gérer les erreurs HTTP spécifiques
      if (!response.ok) {
        if (response.status === 404) {
          console.log("ℹ️ Consultant trouvé mais aucune mission");
          setMissions([]);
          return;
        }
        
        const errorText = await response.text();
        console.error("❌ Erreur HTTP:", response.status, errorText);
        throw new Error(`Erreur ${response.status}: ${response.statusText}`);
      }
      
      const data = await response.json();
      console.log("📦 Données missions brutes reçues:", data);
      
      if (data.success) {
        const missionsData = Array.isArray(data.missions) ? data.missions : [];
        console.log("✅ Missions à traiter:", missionsData.length);
        
        // Validation et nettoyage des données missions
        const validMissions = missionsData
          .filter((mission: any) => {
            const isValid = mission && 
                           (mission.id || mission.appel_offre_id) && 
                           mission.nom_projet;
            
            if (!isValid) {
              console.warn("⚠️ Mission invalide ignorée:", mission);
            }
            return isValid;
          })
          .map((mission: any) => ({
            // Garantir un ID unique
            id: mission.id || `match_${mission.appel_offre_id}_${Date.now()}`,
            appel_offre_id: mission.appel_offre_id,
            nom_projet: mission.nom_projet || "Projet sans nom",
            client: mission.client || "Client non spécifié",
            description: mission.description || "",
            date_debut: mission.date_debut,
            date_fin: mission.date_fin,
            score: Number(mission.score) || 0,
            date_validation: mission.date_validation,
            statut: mission.statut || 'Validée',
            type: mission.type || 'mission'
          }));
        
        setMissions(validMissions);
        console.log(`✅ ${validMissions.length} missions valides chargées`);
        
        if (validMissions.length === 0) {
          console.log("ℹ️ Aucune mission trouvée pour ce consultant");
          showMessage('info', 'Aucune mission trouvée. Vos futures missions apparaîtront ici.');
        } else {
          showMessage('success', `${validMissions.length} mission(s) chargée(s)`);
        }
        
      } else {
        console.error("❌ Erreur dans la réponse API:", data.error);
        setMissionsError(data.error || "Erreur lors du chargement des missions");
        setMissions([]);
      }
      
    } catch (err) {
      console.error("❌ Exception lors de la récupération des missions:", err);
      const errorMessage = err instanceof Error ? err.message : "Erreur de connexion au serveur";
      
      // Ne pas bloquer l'interface pour les erreurs de missions
      setMissionsError(errorMessage);
      setMissions([]);
      
      showMessage('error', 'Impossible de charger les missions. Vérifiez votre connexion.');
      
    } finally {
      setLoadingMissions(false);
      console.log("🏁 === FIN RÉCUPÉRATION MISSIONS ===");
    }
  };

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
  };

  const fetchExpertiseDetails = async (consultantId: string) => {
    try {
      console.log("🔍 Récupération des détails d'expertise...");
      const response = await fetch(`http://127.0.0.1:8000/api/consultant/${consultantId}/expertise-analysis/`);
      
      if (response.ok) {
        const data = await response.json();
        console.log("📊 Données d'expertise reçues:", data);
        
        if (data.success && data.consultant) {
          setExpertiseDetails(data.consultant.analyse);
          
          setConsultantData(prev => prev ? {
            ...prev,
            expertise: data.consultant.expertise_actuelle || prev.expertise,
            expertise_score: data.consultant.analyse.score_total || prev.expertise_score
          } : null);
          
          console.log("✅ Détails d'expertise mis à jour");
        }
      }
    } catch (error) {
      console.error("❌ Erreur lors de la récupération des détails d'expertise:", error);
    }
  };

  const fetchNotifications = async (consultantId: string) => {
    try {
      console.log("🔔 Récupération des notifications pour consultant:", consultantId);
      
      const response = await fetch(`http://127.0.0.1:8000/api/consultant/${consultantId}/notifications/`);
      
      if (!response.ok) {
        console.warn(`⚠️ Erreur HTTP notifications: ${response.status}`);
        return;
      }
      
      const data = await response.json();
      console.log("📦 Données notifications reçues:", data);
      
      if (data.success) {
        setNotifications(data.notifications || []);
        setUnreadCount(data.unread_count || 0);
        console.log(`✅ ${data.notifications?.length || 0} notifications chargées`);
      }
    } catch (error) {
      console.warn("⚠️ Erreur lors de la récupération des notifications:", error);
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

  const extractSkillsFromCV = async () => {
    const consultantId = localStorage.getItem("consultantId");
    if (!consultantId) return;

    setIsExtractingSkills(true);
    try {
      const response = await fetch(`http://127.0.0.1:8000/api/consultant/${consultantId}/extract-skills/`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
      });

      const data = await response.json();
      
      if (data.success) {
        setExtractedSkills(data.new_skills || []);
        showMessage('success', `${data.new_skills?.length || 0} nouvelles compétences extraites`);
        
        // Mettre à jour les données du consultant
        if (consultantData) {
          setConsultantData({
            ...consultantData,
            skills: data.skills?.join(', ') || consultantData.skills,
            expertise: data.expertise_level || consultantData.expertise
          });
        }
      } else {
        showMessage('error', data.error || 'Erreur lors de l\'extraction');
      }
    } catch (error) {
      console.error("Erreur lors de l'extraction des compétences:", error);
      showMessage('error', 'Erreur lors de l\'extraction des compétences');
    } finally {
      setIsExtractingSkills(false);
    }
  };

  const updateExpertiseInfo = async () => {
    const consultantId = localStorage.getItem("consultantId");
    if (!consultantId) return;

    setIsUpdatingExpertise(true);
    try {
      const response = await fetch(`http://127.0.0.1:8000/api/consultant/${consultantId}/update-expertise/`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(expertiseFormData),
      });

      const data = await response.json();
      
      if (data.success) {
        showMessage('success', 'Expertise mise à jour avec succès');
        
        // Mettre à jour les données locales
        if (consultantData) {
          setConsultantData({
            ...consultantData,
            expertise: data.consultant.expertise_level,
            expertise_score: data.consultant.expertise_score,
            ...expertiseFormData
          });
        }
        
        setExpertiseDetails(data.consultant.expertise_details);
        setShowExpertiseForm(false);
        
      } else {
        showMessage('error', data.error || 'Erreur lors de la mise à jour');
      }
    } catch (error) {
      console.error("Erreur lors de la mise à jour de l'expertise:", error);
      showMessage('error', 'Erreur lors de la mise à jour de l\'expertise');
    } finally {
      setIsUpdatingExpertise(false);
    }
  };

  const updateProfile = async () => {
    const consultantId = localStorage.getItem("consultantId");
    if (!consultantId) return;

    setIsUpdatingProfile(true);
    try {
      const formData = new FormData();
      
      // Ajouter les champs texte
      Object.entries(editFormData).forEach(([key, value]) => {
        if (value !== null && value !== undefined) {
          formData.append(key, value.toString());
        }
      });

      const response = await fetch(`http://127.0.0.1:8000/api/consultant/${consultantId}/update-profile/`, {
        method: 'PUT',
        body: formData,
      });

      const data = await response.json();
      
      if (data.success) {
        setConsultantData(data.data);
        setIsEditingProfile(false);
        showMessage('success', 'Profil mis à jour avec succès');
      } else {
        showMessage('error', data.error || 'Erreur lors de la mise à jour');
      }
    } catch (error) {
      console.error("Erreur lors de la mise à jour du profil:", error);
      showMessage('error', 'Erreur lors de la mise à jour du profil');
    } finally {
      setIsUpdatingProfile(false);
    }
  };

  const downloadRichatCV = async () => {
    const consultantId = localStorage.getItem("consultantId");
    if (!consultantId) return;

    setLoadingCv(true);
    try {
      const response = await fetch(`http://127.0.0.1:8000/api/consultant/${consultantId}/download-cv/`);
      
      if (response.ok) {
        const blob = await response.blob();
        const url = window.URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.style.display = 'none';
        a.href = url;
        a.download = `CV_Richat_${consultantData?.firstName}_${consultantData?.lastName}.pdf`;
        document.body.appendChild(a);
        a.click();
        window.URL.revokeObjectURL(url);
        showMessage('success', 'CV téléchargé avec succès');
      } else {
        showMessage('error', 'Erreur lors du téléchargement du CV');
      }
    } catch (error) {
      console.error("Erreur lors du téléchargement:", error);
      showMessage('error', 'Erreur lors du téléchargement du CV');
    } finally {
      setLoadingCv(false);
    }
  };

  // 🔥 EFFET PRINCIPAL CORRIGÉ
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
        
        setConsultantData(data);
        setEditFormData(data);
        initializeExpertiseData(data);
        
        if (data.profileImage) {
          setProfileImageUrl(data.profileImage);
        }
        
        console.log("✅ Données du consultant chargées");
        
        // 🔥 CHARGEMENT PRIORITAIRE DES MISSIONS (avant les autres données)
        console.log("🔄 Chargement prioritaire des missions...");
        await fetchConsultantMissions(consultantId);
        
        // Puis charger les autres données en parallèle (non bloquant)
        try {
          await Promise.all([
            checkRichatCV(consultantId),
            fetchNotifications(consultantId),
            fetchExpertiseDetails(consultantId)
          ]);
          console.log("✅ Données secondaires chargées");
        } catch (secondaryError) {
          console.warn("⚠️ Erreur dans le chargement des données secondaires:", secondaryError);
          // Ne pas bloquer l'interface pour ces erreurs
        }
        
        console.log("✅ Chargement complet terminé");
        
      } catch (err) {
        console.error("❌ Erreur lors de la récupération des données principales:", err);
        setError("Impossible de récupérer vos informations");
        showMessage('error', "Erreur de connexion au serveur");
      } finally {
        setLoading(false);
      }
    };

    fetchConsultantData();
  }, []);

  // Fonction pour rafraîchir les missions
  const refreshMissions = async () => {
    const consultantId = localStorage.getItem("consultantId");
    if (consultantId) {
      console.log("🔄 Rafraîchissement des missions...");
      await fetchConsultantMissions(consultantId);
    } else {
      console.error("❌ Impossible de rafraîchir : consultantId manquant");
      showMessage('error', 'Session expirée. Veuillez vous reconnecter.');
    }
  };

  const handleLogout = () => {
    localStorage.removeItem("userRole");
    localStorage.removeItem("consultantId");
    showMessage('success', "Déconnexion réussie");
    window.location.href = "/consultant/login";
  };

  const formatDate = (dateString: string) => {
    if (!dateString) return "Non spécifiée";
    try {
      return new Date(dateString).toLocaleDateString('fr-FR', {
        year: 'numeric',
        month: 'short',
        day: 'numeric'
      });
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

  const getMissionStatusBadge = (mission: MissionData) => {
    if (mission.type === 'matching') {
      return <Badge variant="outline" className="bg-blue-50 text-blue-700">En attente</Badge>;
    }
    
    const status = mission.statut || 'Validée';
    switch (status) {
      case 'En_cours':
        return <Badge className="bg-green-100 text-green-800">En cours</Badge>;
      case 'Terminée':
        return <Badge variant="outline" className="bg-gray-100 text-gray-700">Terminée</Badge>;
      case 'Validée':
        return <Badge className="bg-blue-100 text-blue-800">Validée</Badge>;
      default:
        return <Badge variant="outline">{status}</Badge>;
    }
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

  if (loading) {
    return (
      <div className="min-h-screen flex justify-center items-center bg-gray-50">
        <div className="text-center">
          <div className="w-16 h-16 border-4 border-blue-200 border-t-blue-600 rounded-full animate-spin mx-auto mb-4"></div>
          <p className="text-gray-600">Chargement de votre espace consultant...</p>
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

      {/* Header */}
      <header className="sticky top-0 z-40 bg-white border-b shadow-sm">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
          <div className="flex justify-between items-center">
            <div className="flex items-center gap-4">
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

              {/* Menu Profil */}
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
          <div className="lg:col-span-1 space-y-6">
            
            {/* Carte de profil */}
            <Card>
              <div className="h-20 bg-gradient-to-r from-blue-600 to-blue-700 relative">
                <div className="absolute -bottom-10 left-6">
                  <Avatar className="h-20 w-20 ring-4 ring-white">
                    <AvatarImage 
                      src={profileImageUrl || undefined} 
                      alt={`${consultantData.firstName} ${consultantData.lastName}`} 
                    />
                    <AvatarFallback className="bg-blue-600 text-white text-xl font-bold">
                      {getInitials(consultantData.firstName, consultantData.lastName)}
                    </AvatarFallback>
                  </Avatar>
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

            {/* Section Expertise et Compétences */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              
              {/* Section Expertise */}
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

                    {expertiseDetails ? (
                      <div className="space-y-2">
                        <Progress value={expertiseDetails.score_total} className="h-2" />
                        
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

                        {expertiseDetails.recommandations.length > 0 && (
                          <div className="bg-orange-50 p-2 rounded border border-orange-200">
                            <p className="text-xs text-orange-700">
                              💡 {expertiseDetails.recommandations[0]}
                            </p>
                          </div>
                        )}
                      </div>
                    ) : (
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

              {/* Section Compétences */}
              <Card className="h-fit">
                <CardHeader className="pb-3">
                  <div className="flex justify-between items-center">
                    <CardTitle className="flex items-center gap-2 text-lg">
                      <BookOpen className="h-4 w-4" />
                      Compétences
                    </CardTitle>
                    <div className="flex gap-1">
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
                      
                      {extractedSkills.length > 0 && (
                        <div className="mt-3 p-2 bg-green-50 rounded border border-green-200">
                          <p className="text-xs text-green-700 font-medium mb-1">
                            🆕 Nouvelles compétences extraites:
                          </p>
                          <div className="flex flex-wrap gap-1">
                            {extractedSkills.slice(0, 3).map((skill, index) => (
                              <Badge 
                                key={index} 
                                variant="outline" 
                                className="bg-green-100 text-green-800 text-xs"
                              >
                                {skill}
                              </Badge>
                            ))}
                            {extractedSkills.length > 3 && (
                              <span className="text-xs text-green-600">
                                +{extractedSkills.length - 3} autres
                              </span>
                            )}
                          </div>
                        </div>
                      )}
                    </div>
                  ) : (
                    <div className="text-center py-4">
                      <p className="text-sm text-gray-500 mb-3">Aucune compétence renseignée</p>
                      <div className="flex flex-col gap-2">
                        <Button 
                          variant="outline" 
                          size="sm"
                          onClick={extractSkillsFromCV}
                          disabled={isExtractingSkills}
                          className="w-full"
                        >
                          {isExtractingSkills ? (
                            <RefreshCw className="h-3 w-3 mr-1 animate-spin" />
                          ) : (
                            <Zap className="h-3 w-3 mr-1" />
                          )}
                          Extraire du CV
                        </Button>
                        <Button 
                          variant="outline" 
                          size="sm"
                          onClick={() => setIsEditingProfile(true)}
                          className="w-full"
                        >
                          <Plus className="h-3 w-3 mr-1" />
                          Ajouter manuellement
                        </Button>
                      </div>
                    </div>
                  )}
                </CardContent>
              </Card>
            </div>

            {/* 🔥 SECTION MISSIONS CORRIGÉE */}
            <Card>
              <CardHeader>
                <div className="flex justify-between items-center">
                  <CardTitle className="flex items-center gap-2">
                    <Briefcase className="h-5 w-5" />
                    Mes Missions
                  </CardTitle>
                  <div className="flex items-center gap-2">
                    <Badge variant="outline">
                      {missions.length} mission{missions.length !== 1 ? 's' : ''}
                    </Badge>
                    <Button 
                      variant="ghost" 
                      size="sm"
                      onClick={refreshMissions}
                      disabled={loadingMissions}
                    >
                      <RefreshCw className={`h-4 w-4 ${loadingMissions ? 'animate-spin' : ''}`} />
                    </Button>
                  </div>
                </div>
              </CardHeader>
              <CardContent>
                {/* 🔥 GESTION DES ÉTATS DE CHARGEMENT ET D'ERREUR */}
                {loadingMissions ? (
                  <div className="flex justify-center py-8">
                    <div className="text-center">
                      <RefreshCw className="animate-spin h-8 w-8 text-blue-600 mx-auto mb-2" />
                      <p className="text-sm text-gray-600">Chargement des missions...</p>
                    </div>
                  </div>
                ) : missionsError ? (
                  <div className="py-8">
                    <Alert className="border-yellow-200 bg-yellow-50">
                      <AlertCircle className="h-4 w-4 text-yellow-600" />
                      <AlertDescription className="text-yellow-800">
                        <div className="space-y-2">
                          <p className="font-medium">Erreur de chargement des missions</p>
                          <p className="text-sm">{missionsError}</p>
                          <Button 
                            variant="outline" 
                            size="sm"
                            onClick={refreshMissions}
                            className="mt-2"
                          >
                            <RefreshCw className="h-3 w-3 mr-1" />
                            Réessayer
                          </Button>
                        </div>
                      </AlertDescription>
                    </Alert>
                  </div>
                ) : missions.length > 0 ? (
                  /* 🔥 AFFICHAGE DES MISSIONS AVEC DESIGN AMÉLIORÉ */
                  <div className="space-y-4">
                    {missions.map((mission) => (
                      <Card key={mission.id} className="border-l-4 border-l-blue-500 hover:shadow-md transition-shadow">
                        <CardContent className="p-4">
                          <div className="flex justify-between items-start mb-3">
                            <div className="flex-1">
                              <div className="flex items-start justify-between mb-2">
                                <h3 className="font-semibold text-gray-900 text-lg">
                                  {mission.nom_projet}
                                </h3>
                                <div className="flex items-center gap-2">
                                  {getMissionStatusBadge(mission)}
                                  <Badge className={getScoreBadgeColor(mission.score)}>
                                    {Math.round(mission.score)}%
                                  </Badge>
                                </div>
                              </div>
                              
                              <div className="flex items-center gap-1 text-sm text-gray-600 mb-2">
                                <Building className="h-4 w-4" />
                                <span className="font-medium">{mission.client}</span>
                                {mission.type && (
                                  <>
                                    <span className="mx-2">•</span>
                                    <span className="text-xs bg-gray-100 px-2 py-1 rounded">
                                      {mission.type === 'matching' ? 'Matching validé' : 'Mission'}
                                    </span>
                                  </>
                                )}
                              </div>
                            </div>
                          </div>
                          
                          {mission.description && (
                            <p className="text-sm text-gray-700 mb-3 line-clamp-2">
                              {mission.description}
                            </p>
                          )}
                          
                          <div className="flex justify-between items-center">
                            <div className="flex items-center gap-4 text-xs text-gray-500">
                              <div className="flex items-center gap-1">
                                <Calendar className="h-3 w-3" />
                                <span>
                                  {formatDate(mission.date_debut)} → {formatDate(mission.date_fin)}
                                </span>
                              </div>
                              
                              {mission.date_validation && (
                                <div className="flex items-center gap-1">
                                  <CheckCircle className="h-3 w-3 text-green-600" />
                                  <span>Validé le {formatDate(mission.date_validation)}</span>
                                </div>
                              )}
                            </div>
                            
                            <Button variant="ghost" size="sm" className="h-auto p-1 text-blue-600">
                              <ArrowRight className="h-3 w-3" />
                            </Button>
                          </div>
                        </CardContent>
                      </Card>
                    ))}

                    {/* 🔥 MESSAGE D'ENCOURAGEMENT SI PEU DE MISSIONS */}
                    {missions.length < 3 && (
                      <div className="mt-6 p-4 bg-blue-50 rounded-lg border border-blue-200">
                        <div className="flex items-start gap-3">
                          <Target className="h-5 w-5 text-blue-600 mt-0.5" />
                          <div>
                            <h4 className="font-medium text-blue-900">Obtenez plus de missions</h4>
                            <p className="text-sm text-blue-700 mt-1">
                              Complétez votre profil et maintenez vos compétences à jour pour augmenter 
                              vos chances d'être sélectionné pour de nouvelles missions.
                            </p>
                            <div className="flex gap-2 mt-3">
                              <Button 
                                size="sm" 
                                variant="outline"
                                onClick={() => setIsEditingProfile(true)}
                                className="text-blue-600 border-blue-300"
                              >
                                Compléter le profil
                              </Button>
                              <Button 
                                size="sm" 
                                variant="outline"
                                onClick={() => setShowExpertiseForm(true)}
                                className="text-blue-600 border-blue-300"
                              >
                                Évaluer expertise
                              </Button>
                            </div>
                          </div>
                        </div>
                      </div>
                    )}
                  </div>
                ) : (
                  /* 🔥 ÉTAT VIDE AMÉLIORÉ */
                  <div className="text-center py-12">
                    <div className="max-w-sm mx-auto">
                      <Briefcase className="h-16 w-16 text-gray-300 mx-auto mb-4" />
                      <h3 className="text-lg font-medium text-gray-900 mb-2">
                        Aucune mission pour le moment
                      </h3>
                      <p className="text-gray-500 mb-6">
                        Vous serez notifié dès qu'une mission correspondant à votre profil sera disponible.
                      </p>
                      
                      <div className="space-y-3">
                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                          <Button 
                            variant="outline" 
                            size="sm"
                            onClick={() => setIsEditingProfile(true)}
                            className="flex items-center gap-2"
                          >
                            <User className="h-4 w-4" />
                            Optimiser le profil
                          </Button>
                          <Button 
                            variant="outline" 
                            size="sm"
                            onClick={() => setShowExpertiseForm(true)}
                            className="flex items-center gap-2"
                          >
                            <TrendingUp className="h-4 w-4" />
                            Évaluer expertise
                          </Button>
                        </div>
                        
                        <div className="pt-4 border-t border-gray-200">
                          <p className="text-xs text-gray-400">
                            💡 Plus votre profil est complet, plus vous avez de chances d'être sélectionné
                          </p>
                        </div>
                      </div>
                    </div>
                  </div>
                )}
              </CardContent>
            </Card>

            {/* Section CV */}
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
                      
                      <Button 
                        className="w-full"
                        disabled={loadingCv}
                        onClick={downloadRichatCV}
                      >
                        {loadingCv ? (
                          <RefreshCw className="animate-spin h-4 w-4 mr-2" />
                        ) : (
                          <Download className="h-4 w-4 mr-2" />
                        )}
                        Télécharger CV Richat
                      </Button>
                    </div>
                  ) : (
                    <div className="text-center py-4">
                      <FileIcon className="h-8 w-8 text-gray-400 mx-auto mb-2" />
                      <p className="text-sm text-gray-600 mb-3">CV Richat non disponible</p>
                      
                      <Button 
                        className="w-full bg-blue-600 hover:bg-blue-700"
                        size="sm"
                      >
                        <Zap className="h-4 w-4 mr-2" />
                        Créer CV Richat
                      </Button>
                    </div>
                  )}
                </CardContent>
              </Card>
            </div>
          </div>
        </div>
      </div>

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
                Exemple: Python, React, SQL, Gestion de projet, Analyse de données
              </p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <Label htmlFor="startAvailability">Disponible à partir du</Label>
                <Input
                  id="startAvailability"
                  type="date"
                  value={editFormData.startAvailability || ''}
                  onChange={(e) => setEditFormData(prev => ({ ...prev, startAvailability: e.target.value }))}
                />
              </div>
              <div>
                <Label htmlFor="endAvailability">Disponible jusqu'au</Label>
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
            <Button 
              onClick={updateProfile}
              disabled={isUpdatingProfile}
            >
              {isUpdatingProfile ? (
                <RefreshCw className="h-4 w-4 mr-2 animate-spin" />
              ) : (
                <Save className="h-4 w-4 mr-2" />
              )}
              Enregistrer
            </Button>
          </div>
        </DialogContent>
      </Dialog>

      {/* Dialog d'évaluation d'expertise */}
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
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              
              <div className="space-y-4">
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
                  />
                  <p className="text-xs text-gray-500 mt-1">
                    Incluez toute votre expérience professionnelle pertinente
                  </p>
                </div>
                
                <div>
                  <Label htmlFor="projets">Nombre de projets significatifs</Label>
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
                  />
                  <p className="text-xs text-gray-500 mt-1">
                    Projets où vous avez eu un rôle important
                  </p>
                </div>
              </div>

              <div className="space-y-4">
                <Label className="text-base font-medium flex items-center gap-2">
                  <GraduationCap className="h-4 w-4 text-green-600" />
                  Formation et Certifications
                </Label>
                
                <div>
                  <Label htmlFor="formation">Niveau de formation le plus élevé</Label>
                  <Select 
                    value={expertiseFormData.formation_niveau} 
                    onValueChange={(value) => setExpertiseFormData({
                      ...expertiseFormData, 
                      formation_niveau: value
                    })}
                  >
                    <SelectTrigger className="mt-1">
                      <SelectValue />
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
                
                <div>
                  <Label htmlFor="certifications">Nombre de certifications professionnelles</Label>
                  <Input
                    id="certifications"
                    type="number"
                    min="0"
                    max="50"
                    value={expertiseFormData.certifications_count}
                    onChange={(e) => setExpertiseFormData({
                      ...expertiseFormData, 
                      certifications_count: parseInt(e.target.value) || 0
                    })}
                    className="mt-1"
                  />
                  <p className="text-xs text-gray-500 mt-1">
                    Certifications reconnues dans votre domaine
                  </p>
                </div>
              </div>
            </div>
            
            <div className="space-y-4">
              <Label className="text-base font-medium flex items-center gap-2">
                <Users className="h-4 w-4 text-purple-600" />
                Expérience Qualitative
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
            
            {expertiseDetails && (
              <div className="mt-6 p-4 bg-blue-50 rounded-lg border border-blue-200">
                <h4 className="font-medium text-blue-900 mb-2">
                  Évaluation actuelle: {expertiseDetails.niveau_calcule}
                </h4>
                <div className="flex items-center gap-2 mb-2">
                  <Progress value={expertiseDetails.score_total} className="flex-1 h-2" />
                  <span className="text-sm font-medium text-blue-700">
                    {expertiseDetails.score_total}/100
                  </span>
                </div>
                {expertiseDetails.recommandations.length > 0 && (
                  <p className="text-xs text-blue-700">
                    💡 {expertiseDetails.recommandations[0]}
                  </p>
                )}
              </div>
            )}
          </div>

          <div className="flex justify-end gap-3 pt-4 border-t">
            <Button variant="outline" onClick={() => setShowExpertiseForm(false)}>
              Annuler
            </Button>
            <Button 
              className="bg-blue-600 hover:bg-blue-700"
              onClick={updateExpertiseInfo}
              disabled={isUpdatingExpertise}
            >
              {isUpdatingExpertise ? (
                <RefreshCw className="h-4 w-4 mr-2 animate-spin" />
              ) : (
                <Save className="h-4 w-4 mr-2" />
              )}
              Mettre à jour l'expertise
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default ConsultantWelcome;