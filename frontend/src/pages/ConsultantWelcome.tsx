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
  ChevronDown
} from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Progress } from "@/components/ui/progress";
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

// Interface pour le CV Richat complet
interface RichatCVFormData {
  // Informations personnelles
  titre: string;
  nom_expert: string;
  date_naissance: string;
  pays_residence: string;
  titre_professionnel: string;
  
  // Résumé du profil
  resume_profil: string;
  
  // Éducation
  formations: Array<{
    nom_ecole: string;
    periode_etude: string;
    diplome_obtenu: string;
    specialisation: string;
  }>;
  
  // Expérience professionnelle
  experiences: Array<{
    periode: string;
    nom_employeur: string;
    titre_professionnel: string;
    pays: string;
    activites: string;
  }>;
  
  // Langues
  langues: Array<{
    langue: string;
    parler: string;
    lecture: string;
    editorial: string;
  }>;
  
  // Missions de référence
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
  
  // Certifications
  certifications: string[];
  
  // Adhésions professionnelles
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
  
  // Nouveaux états pour le CV Richat complet
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

  useEffect(() => {
    const fetchConsultantData = async () => {
      setLoading(true);
      setError(null);
      
      const consultantId = localStorage.getItem("consultantId");

      if (!consultantId) {
        setError("Vous devez vous connecter pour accéder à cette page");
        showMessage('error', "Veuillez vous connecter");
        return;
      }

      try {
        const response = await fetch(`http://127.0.0.1:8000/api/consultant/${consultantId}/data/`);
        
        if (!response.ok) {
          throw new Error(`Erreur HTTP: ${response.status}`);
        }
        
        const data = await response.json();
        
        if (data.error) {
          throw new Error(data.error);
        }
        
        setConsultantData(data);
        setEditFormData(data);
        
        if (data.profileImage) {
          setProfileImageUrl(data.profileImage);
        }
        
        await checkRichatCV(consultantId);
        fetchConsultantMissions(consultantId);
        fetchNotifications(consultantId);
        
      } catch (err) {
        console.error("Erreur lors de la récupération des données:", err);
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
      case "Expert": return "bg-green-100 text-green-800 border-green-300";
      case "Intermédiaire": return "bg-blue-100 text-blue-800 border-blue-300";
      default: return "bg-orange-100 text-orange-800 border-orange-300";
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

            {/* Compétences */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <BookOpen className="h-5 w-5" />
                  Compétences
                </CardTitle>
              </CardHeader>
              <CardContent>
                {consultantData.skills ? (
                  <div className="flex flex-wrap gap-2">
                    {consultantData.skills.split(',').map((skill, index) => (
                      <Badge 
                        key={index} 
                        variant="secondary" 
                        className="bg-blue-100 text-blue-800"
                      >
                        {skill.trim()}
                      </Badge>
                    ))}
                  </div>
                ) : (
                  <div className="text-center py-8">
                    <p className="text-gray-500 mb-4">Aucune compétence renseignée</p>
                    <Button 
                      variant="outline" 
                      onClick={() => setIsEditingProfile(true)}
                    >
                      <Plus className="h-4 w-4 mr-2" />
                      Ajouter des compétences
                    </Button>
                  </div>
                )}
              </CardContent>
            </Card>

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
    </div>
  );
};

export default ConsultantWelcome;