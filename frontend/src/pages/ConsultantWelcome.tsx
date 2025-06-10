import React, { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle, CardFooter } from "@/components/ui/card";
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
  Star
} from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { toast } from "sonner";
import NotificationBell from "@/components/NotificationBell";
import ConsultantProfileEdit from "@/components/ConsultantProfileEdit"; 

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

const ConsultantWelcome = () => {
  const [consultantData, setConsultantData] = useState<ConsultantData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [missions, setMissions] = useState<MissionData[]>([]);
  const [loadingMissions, setLoadingMissions] = useState(false);
  const [loadingCv, setLoadingCv] = useState(false);
  const [richatCvDetails, setRichatCvDetails] = useState<RichatCvDetails>({ available: false });
  const navigate = useNavigate();

  // Vérifier la disponibilité du CV standardisé Richat
  const checkRichatCV = async (consultantId: string) => {
    try {
      console.log("Vérification de la disponibilité du CV Richat...");
      const response = await fetch(`http://127.0.0.1:8000/api/consultant/${consultantId}/check-cv/`);
      
      console.log("Statut de réponse CV Richat:", response.status);
      
      if (response.ok) {
        const data = await response.json();
        setRichatCvDetails(data);
        console.log("Détails du CV Richat:", data);
      } else {
        console.warn("Erreur lors de la vérification du CV Richat:", response.status);
        setRichatCvDetails({ available: false });
      }
    } catch (error) {
      console.error("Exception lors de la vérification du CV Richat:", error);
      setRichatCvDetails({ available: false });
    }
  };

  useEffect(() => {
    const fetchConsultantData = async () => {
      setLoading(true);
      setError(null);
      
      const consultantId = localStorage.getItem("consultantId");
      console.log("ID consultant récupéré:", consultantId);

      if (!consultantId) {
        console.error("Aucun ID consultant trouvé dans le localStorage");
        setError("Vous devez vous connecter pour accéder à cette page");
        toast.error("Veuillez vous connecter");
        navigate("/consultant/login");
        return;
      }

      try {
        const response = await fetch(`http://127.0.0.1:8000/api/consultant/${consultantId}/data/`);
        console.log("Statut de la réponse:", response.status);
        
        if (!response.ok) {
          throw new Error(`Erreur HTTP: ${response.status}`);
        }
        
        const data = await response.json();
        console.log("Données du consultant récupérées:", data);
        
        if (data.error) {
          throw new Error(data.error);
        }
        
        setConsultantData(data);
        
        // Vérifier si un CV Richat standardisé est disponible
        await checkRichatCV(consultantId);
        
        // Charger les missions du consultant
        fetchConsultantMissions(consultantId);
        
      } catch (err) {
        console.error("Erreur lors de la récupération des données:", err);
        setError("Impossible de récupérer vos informations");
        toast.error("Erreur de connexion au serveur");
        
        if (err instanceof Error && err.message.includes("401")) {
          navigate("/consultant/login");
        }
      } finally {
        setLoading(false);
      }
    };

    fetchConsultantData();
  }, [navigate]);

  const fetchConsultantMissions = async (consultantId: string) => {
    setLoadingMissions(true);
    try {
      console.log(`Récupération des missions pour le consultant ${consultantId}...`);
      
      const response = await fetch(`http://127.0.0.1:8000/api/consultant/${consultantId}/missions/`);
      console.log("Statut de la réponse missions:", response.status);
      
      if (!response.ok) {
        throw new Error(`Erreur HTTP: ${response.status}`);
      }
      
      const data = await response.json();
      console.log("Données des missions récupérées:", data);
      
      if (data.success) {
        setMissions(data.missions);
        console.log(`${data.missions.length} mission(s) récupérée(s)`);
      } else {
        console.error("Erreur lors de la récupération des missions:", data.error);
        toast.error("Erreur lors du chargement des missions");
      }
    } catch (err) {
      console.error("Erreur lors de la récupération des missions:", err);
      toast.error("Erreur de connexion au serveur");
    } finally {
      setLoadingMissions(false);
    }
  };

  // Télécharger le CV standardisé Richat
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
      
      toast.success("CV Richat téléchargé avec succès");
    } catch (error) {
      toast.error("Erreur lors du téléchargement du CV Richat");
    } finally {
      setLoadingCv(false);
    }
  };

  // Régénérer le CV Richat
  const handleRegenerateRichatCV = async () => {
    const consultantId = localStorage.getItem("consultantId");
    if (!consultantId || !consultantData?.cvFilename) return;
    
    setLoadingCv(true);
    try {
      // Note: Ici vous devriez avoir l'endpoint pour régénérer
      // Pour l'instant, on recharge juste les informations
      await checkRichatCV(consultantId);
      toast.success("CV Richat vérifié");
    } catch (error) {
      toast.error("Erreur lors de la vérification du CV Richat");
    } finally {
      setLoadingCv(false);
    }
  };

  const handleLogout = () => {
    localStorage.removeItem("userRole");
    localStorage.removeItem("consultantId");
    toast.success("Déconnexion réussie");
    navigate("/consultant/login");
  };

  const handleNotificationClick = (notificationId: number, appel_offre_id: number) => {
    // Marquer la notification comme lue
    fetch(`http://127.0.0.1:8000/api/notifications/${notificationId}/read/`, {
      method: 'PUT'
    });
    
    // Rafraîchir les missions
    const consultantId = localStorage.getItem("consultantId");
    if (consultantId) {
      fetchConsultantMissions(consultantId);
    }
    
    // Faire défiler jusqu'à la section des missions
    const missionsSection = document.getElementById('missions-section');
    if (missionsSection) {
      missionsSection.scrollIntoView({ behavior: 'smooth' });
    }
  };

  // Gestionnaire pour mettre à jour les données du profil
  const handleProfileUpdate = (updatedData: Partial<ConsultantData>) => {
    setConsultantData(prev => ({
      ...prev,
      ...updatedData
    } as ConsultantData));
    toast.success("Profil mis à jour avec succès");
  };

  const formatDate = (dateString: string) => {
    if (!dateString) return "Non spécifiée";
    try {
      return new Date(dateString).toLocaleDateString('fr-FR');
    } catch (e) {
      return dateString;
    }
  };

  const formatFileSize = (bytes: number) => {
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
  };

  const getExpertiseBadgeColor = (expertise: string) => {
    switch (expertise) {
      case "Expert": return "bg-green-100 text-green-800 border-green-300";
      case "Intermédiaire": return "bg-blue-100 text-blue-800 border-blue-300";
      default: return "bg-yellow-100 text-yellow-800 border-yellow-300";
    }
  };

  const getScoreBadgeColor = (score: number) => {
    if (score >= 75) return "bg-green-100 text-green-800";
    if (score >= 50) return "bg-blue-100 text-blue-800";
    if (score >= 25) return "bg-yellow-100 text-yellow-800";
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

  // Affichage pendant le chargement
  if (loading) {
    return (
      <div className="min-h-screen flex justify-center items-center bg-admin-background">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-admin-primary mx-auto"></div>
          <p className="mt-3 text-gray-600">Chargement des données...</p>
        </div>
      </div>
    );
  }

  // Affichage en cas d'erreur
  if (error) {
    return (
      <div className="min-h-screen flex justify-center items-center bg-admin-background">
        <Card className="w-full max-w-md">
          <CardHeader>
            <CardTitle className="text-center text-red-600">Erreur</CardTitle>
            <CardDescription className="text-center">{error}</CardDescription>
          </CardHeader>
          <CardContent className="flex justify-center">
            <Button onClick={() => navigate("/consultant/login")}>Retour à la connexion</Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  // Si pas de données consultant malgré un chargement réussi
  if (!consultantData) {
    return (
      <div className="min-h-screen flex justify-center items-center bg-admin-background">
        <Card className="w-full max-w-md">
          <CardHeader>
            <CardTitle className="text-center">Aucune donnée disponible</CardTitle>
            <CardDescription className="text-center">
              Nous n'avons pas pu récupérer vos informations. Veuillez réessayer.
            </CardDescription>
          </CardHeader>
          <CardContent className="flex justify-center">
            <Button onClick={() => window.location.reload()}>Actualiser</Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  // Affichage principal du profil consultant
  return (
    <div className="min-h-screen flex flex-col bg-admin-background">
      <header className="bg-white shadow-sm">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4 flex justify-between items-center">
          <h1 className="text-xl font-semibold text-gray-900">Portail Consultant</h1>
          <div className="flex items-center gap-3">
            <NotificationBell consultantId={localStorage.getItem("consultantId")} onNotificationClick={handleNotificationClick} />
            <Button variant="outline" onClick={handleLogout} className="flex items-center gap-2">
              <LogOut className="h-4 w-4" />
              Déconnexion
            </Button>
          </div>
        </div>
      </header>

      <div className="flex-grow max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <Card className="w-full shadow-md mb-8">
          <CardHeader className="border-b pb-6">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-4">
                <div className="bg-admin-light rounded-full p-3">
                  <User className="h-8 w-8 text-admin-primary" />
                </div>
                <div>
                  <CardTitle className="text-2xl">
                    Bienvenue, {consultantData.firstName} {consultantData.lastName} !
                  </CardTitle>
                  <CardDescription>Votre compte consultant est actif</CardDescription>
                </div>
              </div>
              <div className="flex items-center gap-3">
                <div className={`px-4 py-1 rounded-full border ${getExpertiseBadgeColor(consultantData.expertise)} flex items-center gap-2`}>
                  <Award className="h-4 w-4" />
                  {consultantData.expertise}
                </div>
                <ConsultantProfileEdit consultantData={consultantData} onProfileUpdate={handleProfileUpdate} />
              </div>
            </div>
          </CardHeader>
          <CardContent className="pt-6 space-y-6">
            <div className="bg-gray-50 p-6 rounded-lg">
              <h2 className="text-xl font-medium mb-4">Informations personnelles</h2>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                  <p className="text-sm text-gray-500">Email</p>
                  <p className="font-medium">{consultantData.email}</p>
                </div>
                <div className="flex items-center gap-2">
                  <Phone className="h-4 w-4 text-gray-500" />
                  <div>
                    <p className="text-sm text-gray-500">Téléphone</p>
                    <p className="font-medium">{consultantData.phone}</p>
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  <MapPin className="h-4 w-4 text-gray-500" />
                  <div>
                    <p className="text-sm text-gray-500">Ville & Pays</p>
                    <p className="font-medium">{consultantData.city}, {consultantData.country}</p>
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  <Calendar className="h-4 w-4 text-gray-500" />
                  <div>
                    <p className="text-sm text-gray-500">Disponibilité</p>
                    <p className="font-medium">
                      Du {formatDate(consultantData.startAvailability)} au {formatDate(consultantData.endAvailability)}
                    </p>
                  </div>
                </div>
              </div>
            </div>

            <div className="bg-gray-50 p-6 rounded-lg">
              <div className="flex items-center justify-between mb-4">
                <div className="flex items-center gap-2">
                  <BookOpen className="h-5 w-5 text-admin-primary" />
                  <h2 className="text-xl font-medium">Profil professionnel</h2>
                </div>
                <Badge className="bg-blue-100 text-blue-800 hover:bg-blue-200">
                  {getDomaineLabel(consultantData.domaine_principal)}
                </Badge>
              </div>
              
              <div className="mb-4">
                <p className="text-sm text-gray-500 mb-1">Spécialité</p>
                <p className="font-medium">{consultantData.specialite || "Non spécifiée"}</p>
              </div>
              
              <div>
                <p className="text-sm text-gray-500 mb-2">Compétences</p>
                {consultantData.skills ? (
                  <div className="flex flex-wrap gap-2">
                    {consultantData.skills.split(',').map((skill, index) => (
                      <div key={index} className="bg-admin-light text-admin-primary px-3 py-1 rounded-full text-sm flex items-center">
                        <CheckCircle className="h-3 w-3 mr-1" />
                        {skill.trim()}
                      </div>
                    ))}
                  </div>
                ) : (
                  <p className="text-gray-500">Aucune compétence détectée</p>
                )}
              </div>
            </div>

            {/* Section des Missions */}
            <div id="missions-section" className="bg-gray-50 p-6 rounded-lg">
              <div className="flex items-center justify-between mb-4">
                <div className="flex items-center gap-2">
                  <Briefcase className="h-5 w-5 text-admin-primary" />
                  <h2 className="text-xl font-medium">Mes Missions</h2>
                </div>
                <Badge className="bg-admin-primary text-white">
                  {missions.length} mission{missions.length !== 1 ? 's' : ''}
                </Badge>
              </div>

              {loadingMissions ? (
                <div className="flex justify-center py-4">
                  <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-admin-primary"></div>
                </div>
              ) : missions.length > 0 ? (
                <div className="space-y-4">
                  {missions.map((mission) => (
                    <Card key={mission.id} className="overflow-hidden shadow-sm">
                      <div className="bg-admin-primary h-1"></div>
                      <CardContent className="p-4">
                        <div className="flex flex-col gap-2">
                          <div className="flex justify-between items-start">
                            <div>
                              <h3 className="font-bold text-gray-900">{mission.nom_projet}</h3>
                              <div className="flex items-center gap-1 text-sm text-gray-600">
                                <Building className="h-3 w-3" />
                                <span>{mission.client}</span>
                              </div>
                            </div>
                            <Badge className={getScoreBadgeColor(mission.score)}>
                              Score: {Math.round(mission.score)}%
                            </Badge>
                          </div>
                          
                          <p className="text-sm text-gray-700 line-clamp-2">
                            {mission.description}
                          </p>
                          
                          <div className="flex flex-wrap justify-between items-center text-xs text-gray-500 mt-2">
                            <div className="flex items-center gap-1">
                              <Calendar className="h-3 w-3" />
                              <span>
                                Du {formatDate(mission.date_debut)} au {formatDate(mission.date_fin)}
                              </span>
                            </div>
                            <Button variant="ghost" size="sm" className="h-7 text-xs px-2 text-admin-primary">
                              Voir détails <ArrowRight className="h-3 w-3 ml-1" />
                            </Button>
                          </div>
                        </div>
                      </CardContent>
                    </Card>
                  ))}
                </div>
              ) : (
                <div className="text-center py-6">
                  <p className="text-gray-500 mb-2">Aucune mission validée pour le moment</p>
                  <p className="text-sm text-gray-400">
                    Vous serez notifié lorsque vous serez sélectionné pour une mission
                  </p>
                </div>
              )}
            </div>

            {/* Section CV avec focus sur le format Richat */}
            <div className="space-y-4">
              {/* CV Original */}
              {consultantData.cvFilename && (
                <div className="bg-blue-50 p-4 rounded-lg border border-blue-100">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center">
                      <div className="mr-3">
                        <FileText className="h-8 w-8 text-blue-500" />
                      </div>
                      <div>
                        <p className="text-sm text-blue-800 font-medium">CV original téléchargé</p>
                        <p className="text-xs text-blue-600">{consultantData.cvFilename}</p>
                      </div>
                    </div>
                    <Button 
                      variant="outline" 
                      size="sm" 
                      className="bg-white text-blue-600 border-blue-300 hover:bg-blue-50"
                      onClick={() => window.open(`http://127.0.0.1:8000/media/uploads/${consultantData.cvFilename}`, '_blank')}
                    >
                      <Download className="h-4 w-4 mr-1" />
                      Télécharger
                    </Button>
                  </div>
                </div>
              )}

              {/* CV Richat Standardisé - Section principale */}
              <div className="bg-gradient-to-r from-green-50 to-blue-50 p-6 rounded-lg border-2 border-green-200">
                <div className="flex items-center justify-between mb-4">
                  <div className="flex items-center gap-3">
                    <div className="bg-green-500 p-3 rounded-full">
                      <Star className="h-6 w-6 text-white" />
                    </div>
                    <div>
                      <h3 className="text-lg font-bold text-green-800">CV Richat Partners</h3>
                      <p className="text-sm text-green-600">Format standardisé professionnel</p>
                    </div>
                  </div>
                  {richatCvDetails.available && (
                    <Badge className="bg-green-100 text-green-800 border-green-300">
                      <CheckCircle className="h-3 w-3 mr-1" />
                      Disponible
                    </Badge>
                  )}
                </div>

                {richatCvDetails.available ? (
                  <div className="space-y-4">
                    <div className="bg-white p-4 rounded-md border border-green-200">
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
                        <div>
                          <p className="text-sm text-gray-500">Nom du fichier</p>
                          <p className="font-medium text-gray-800">{richatCvDetails.filename}</p>
                        </div>
                        <div>
                          <p className="text-sm text-gray-500">Date de création</p>
                          <p className="font-medium text-gray-800">
                            {richatCvDetails.created_at ? formatDate(richatCvDetails.created_at) : 'N/A'}
                          </p>
                        </div>
                        {richatCvDetails.file_size && (
                          <div>
                            <p className="text-sm text-gray-500">Taille du fichier</p>
                            <p className="font-medium text-gray-800">{formatFileSize(richatCvDetails.file_size)}</p>
                          </div>
                        )}
                      </div>
                      
                      <div className="flex flex-wrap gap-3">
                        <Button 
                          onClick={handleDownloadRichatCV}
                          disabled={loadingCv}
                          className="bg-green-600 hover:bg-green-700 text-white"
                        >
                          {loadingCv ? (
                            <div className="flex items-center">
                              <RefreshCw className="animate-spin h-4 w-4 mr-2" />
                              <span>Téléchargement...</span>
                            </div>
                          ) : (
                            <div className="flex items-center gap-2">
                              <Download className="h-4 w-4" />
                              <span>Télécharger CV Richat</span>
                            </div>
                          )}
                        </Button>
                        
                        <Button 
                          variant="outline"
                          onClick={handleRegenerateRichatCV}
                          disabled={loadingCv}
                          className="border-green-300 text-green-600 hover:bg-green-50"
                        >
                          <RefreshCw className="h-4 w-4 mr-2" />
                          Actualiser
                        </Button>
                      </div>
                    </div>
                    
                    <div className="bg-green-100 p-3 rounded-md">
                      <h4 className="font-medium text-green-800 mb-2">Avantages du format Richat :</h4>
                      <ul className="text-sm text-green-700 space-y-1">
                        <li>✓ Format standardisé et professionnel</li>
                        <li>✓ Optimisé pour les processus de recrutement</li>
                        <li>✓ Présentation homogène et lisible</li>
                        <li>✓ Compatible avec tous les systèmes</li>
                      </ul>
                    </div>
                  </div>
                ) : (
                  <div className="text-center py-6">
                    <FileIcon className="h-12 w-12 text-gray-400 mx-auto mb-3" />
                    <p className="text-gray-600 mb-2">CV Richat non disponible</p>
                    <p className="text-sm text-gray-500 mb-4">
                      Votre CV n'a pas encore été transformé au format Richat ou la transformation a échoué.
                    </p>
                    <Button 
                      variant="outline"
                      onClick={handleRegenerateRichatCV}
                      disabled={loadingCv}
                      className="border-green-300 text-green-600 hover:bg-green-50"
                    >
                      <RefreshCw className="h-4 w-4 mr-2" />
                      Vérifier à nouveau
                    </Button>
                  </div>
                )}
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Debug section - à enlever en production */}
        {process.env.NODE_ENV === 'development' && (
          <div className="bg-yellow-50 p-4 border border-yellow-200 rounded-lg mt-4">
            <h3 className="font-medium text-yellow-800 mb-2">Informations de débogage</h3>
            <div className="text-sm text-yellow-700">
              <p>ID Consultant: {localStorage.getItem("consultantId")}</p>
              <p>Missions chargées: {missions.length}</p>
              <p>CV Richat disponible: {richatCvDetails.available ? 'Oui' : 'Non'}</p>
              <button 
                onClick={() => {
                  const consultantId = localStorage.getItem("consultantId");
                  if (consultantId) {
                    fetchConsultantMissions(consultantId);
                    checkRichatCV(consultantId);
                  }
                }}
                className="mt-2 px-3 py-1 bg-yellow-200 rounded-md text-yellow-800 hover:bg-yellow-300"
              >
                Recharger les données
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default ConsultantWelcome;