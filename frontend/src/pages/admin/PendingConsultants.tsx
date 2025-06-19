import React, { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from "@/components/ui/alert-dialog";
import AdminLayout from "@/components/admin/AdminLayout";
import { 
  CheckIcon, 
  RefreshCwIcon, 
  SearchIcon, 
  ArrowLeftIcon, 
  XIcon, 
  ClockIcon, 
  UserCheckIcon,
  UserXIcon,
  MapPinIcon,
  MailIcon,
  PhoneIcon,
  CalendarIcon,
  BriefcaseIcon,
  StarIcon,
  AlertTriangleIcon,
  FileTextIcon
} from "lucide-react";
import { toast } from "sonner";
import axios from "axios";
import { useNavigate } from "react-router-dom";

interface Consultant {
  id: number;
  nom: string;
  prenom: string;
  email: string;
  telephone: string;
  pays: string;
  ville?: string;
  domaine_principal: string;
  specialite: string;
  date_debut_dispo: string;
  date_fin_dispo: string;
  expertise: string;
  photo?: string;
  cv?: string;
}

const API_URL = "http://localhost:8000/api";

const PendingConsultants = () => {
  const [consultants, setConsultants] = useState<Consultant[]>([]);
  const [searchTerm, setSearchTerm] = useState("");
  const [loading, setLoading] = useState(true);
  const [validating, setValidating] = useState<number | null>(null);
  const [rejecting, setRejecting] = useState<number | null>(null);
  const [validatedId, setValidatedId] = useState<number | null>(null);
  const [selectedConsultant, setSelectedConsultant] = useState<Consultant | null>(null);
  const [rejectDialogOpen, setRejectDialogOpen] = useState(false);
  const navigate = useNavigate();

  const fetchPendingConsultants = async () => {
    try {
      setLoading(true);
      const response = await axios.get(`${API_URL}/admin/consultants/pending/`);
      
      if (response.data.success && Array.isArray(response.data.data)) {
        setConsultants(response.data.data);
        toast.success(`${response.data.data.length} consultants en attente chargés`);
      } else if (Array.isArray(response.data)) {
        setConsultants(response.data);
      } else {
        console.error("Format de réponse inattendu:", response.data);
        setConsultants([]);
        toast.error("Format de données inattendu");
      }
    } catch (error) {
      console.error("Erreur lors du chargement des consultants en attente:", error);
      toast.error("Erreur de chargement des consultants en attente");
      setConsultants([]);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchPendingConsultants();
  }, []);

  const handleValidate = async (id: number) => {
    if (validating !== null || rejecting !== null) return;
    
    try {
      setValidating(id);
      const consultant = consultants.find(c => c.id === id);
      const consultantName = consultant ? `${consultant.prenom} ${consultant.nom}` : `Consultant ${id}`;
      
      const loadingToast = toast.loading(`Validation de ${consultantName}...`);
      
      const response = await axios.put(`${API_URL}/admin/consultants/validate/${id}/`);
      
      if (response.status >= 200 && response.status < 300) {
        setConsultants(prev => prev.filter(c => c.id !== id));
        toast.dismiss(loadingToast);
        toast.success(`${consultantName} validé avec succès`);
        setValidatedId(id);
        
        // Auto-hide success notification after 3 seconds
        setTimeout(() => setValidatedId(null), 3000);
      } else {
        toast.dismiss(loadingToast);
        toast.error("Erreur lors de la validation");
      }
    } catch (error) {
      console.error("Erreur lors de la validation:", error);
      
      if (axios.isAxiosError(error) && error.response) {
        toast.error(`Erreur: ${error.response.data.error || "Échec de la validation"}`);
      } else {
        toast.error("Erreur lors de la validation du consultant");
      }
    } finally {
      setValidating(null);
    }
  };

  const handleReject = async () => {
    if (!selectedConsultant || rejecting !== null || validating !== null) return;
    
    try {
      setRejecting(selectedConsultant.id);
      const consultantName = `${selectedConsultant.prenom} ${selectedConsultant.nom}`;
      
      // Fermer le dialogue immédiatement
      setRejectDialogOpen(false);
      
      const loadingToast = toast.loading(`Rejet de ${consultantName}...`);
      
      // Note: Utiliser l'endpoint DELETE pour rejeter
      const response = await axios.delete(`${API_URL}/admin/consultants/${selectedConsultant.id}/`);
      
      if (response.status >= 200 && response.status < 300) {
        setConsultants(prev => prev.filter(c => c.id !== selectedConsultant.id));
        toast.dismiss(loadingToast);
        toast.success(`${consultantName} rejeté avec succès`);
      } else {
        toast.dismiss(loadingToast);
        toast.error("Erreur lors du rejet");
      }
    } catch (error) {
      console.error("Erreur lors du rejet:", error);
      
      if (axios.isAxiosError(error) && error.response) {
        toast.error(`Erreur: ${error.response.data.error || "Échec du rejet"}`);
      } else {
        toast.error("Erreur lors du rejet du consultant");
      }
    } finally {
      setRejecting(null);
      setSelectedConsultant(null);
    }
  };

  const openRejectDialog = (consultant: Consultant) => {
    setSelectedConsultant(consultant);
    setRejectDialogOpen(true);
  };

  const filteredConsultants = consultants.filter(
    (c) =>
      (c.prenom && c.prenom.toLowerCase().includes(searchTerm.toLowerCase())) ||
      (c.nom && c.nom.toLowerCase().includes(searchTerm.toLowerCase())) ||
      (c.email && c.email.toLowerCase().includes(searchTerm.toLowerCase())) ||
      (c.specialite && c.specialite.toLowerCase().includes(searchTerm.toLowerCase()))
  );

  const getDomainName = (code: string) => {
    switch (code) {
      case "DIGITAL": return "Digital et Télécoms";
      case "FINANCE": return "Secteur bancaire et financier";
      case "ENERGIE": return "Transition énergétique";
      case "INDUSTRIE": return "Industrie et Mines";
      default: return code;
    }
  };

  const getDomainBadgeColor = (domain: string) => {
    switch (domain) {
      case "DIGITAL": return "bg-blue-100 text-blue-800 border-blue-300";
      case "FINANCE": return "bg-green-100 text-green-800 border-green-300";
      case "ENERGIE": return "bg-yellow-100 text-yellow-800 border-yellow-300";
      case "INDUSTRIE": return "bg-cyan-100 text-cyan-800 border-cyan-300";
      default: return "bg-gray-100 text-gray-800 border-gray-300";
    }
  };

  const getExpertiseBadgeColor = (expertise: string) => {
    switch (expertise) {
      case "Débutant": return "bg-sky-50 text-sky-700 border-sky-200";
      case "Intermédiaire": return "bg-amber-50 text-amber-700 border-amber-200";
      case "Expert": return "bg-blue-50 text-blue-700 border-blue-200";
      default: return "bg-gray-100 text-gray-800 border-gray-300";
    }
  };

  const formatDate = (dateString: string) => {
    if (!dateString || dateString === "" || dateString === "1970-01-01") {
      return "Non définie";
    }
    
    const date = new Date(dateString);
    if (isNaN(date.getTime())) {
      return "Non définie";
    }
    
    return new Intl.DateTimeFormat('fr-FR').format(date);
  };

  const getImageUrl = (photo: string | undefined) => {
    if (!photo) return null;
    
    if (photo.startsWith('http')) {
      return photo;
    }
    
    if (photo.startsWith('/')) {
      return `http://localhost:8000${photo}`;
    }
    
    return `http://localhost:8000/media/${photo}`;
  };

  return (
    <AdminLayout>
      <div className="space-y-6 p-6 bg-gradient-to-br from-slate-50 to-blue-50 min-h-screen">
        {/* En-tête */}
        <div className="bg-white rounded-2xl shadow-lg p-6 border border-gray-100">
          <div className="flex flex-col lg:flex-row justify-between items-start lg:items-center gap-6">
            <div className="flex items-center gap-4">
              <Button 
                variant="ghost" 
                size="sm" 
                onClick={() => navigate("/admin/consultants")}
                className="p-2 h-10 w-10 rounded-full border border-gray-200 hover:bg-gray-50 transition-colors"
              >
                <ArrowLeftIcon className="h-5 w-5 text-gray-600" />
              </Button>
              <div>
                <h1 className="text-3xl font-bold text-gray-800 mb-2 flex items-center gap-3">
                  <ClockIcon className="h-8 w-8 text-orange-500" />
                  Consultants en attente de validation
                </h1>
                <p className="text-gray-600">
                  Examinez et validez les nouvelles candidatures de consultants
                </p>
              </div>
            </div>


          </div>

          {/* Barre de recherche et actions */}
          <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 mt-6">
            <div className="relative flex-grow max-w-md">
              <SearchIcon className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 h-4 w-4" />
              <Input
                placeholder="Rechercher un consultant..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-10 border-gray-200 focus:border-blue-300 focus:ring focus:ring-blue-200 focus:ring-opacity-50 rounded-lg"
              />
            </div>
            
            <Button 
              onClick={fetchPendingConsultants} 
              variant="outline"
              className="flex items-center gap-2 border-gray-200 hover:bg-gray-50 transition-colors"
              disabled={loading}
            >
              <RefreshCwIcon className={`h-4 w-4 text-gray-600 ${loading ? 'animate-spin' : ''}`} />
              <span className="text-gray-600">Actualiser</span>
            </Button>
          </div>
        </div>

        {/* Contenu principal */}
        <Card className="shadow-lg border-none bg-white rounded-2xl overflow-hidden">
          {loading ? (
            <div className="flex flex-col items-center justify-center py-20">
              <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mb-4"></div>
              <p className="text-gray-500 text-lg">Chargement des consultants en attente...</p>
            </div>
          ) : filteredConsultants.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-20">
              <div className="bg-gray-100 rounded-full p-6 mb-4">
                {searchTerm ? (
                  <SearchIcon className="h-8 w-8 text-gray-400" />
                ) : (
                  <UserCheckIcon className="h-8 w-8 text-gray-400" />
                )}
              </div>
              {searchTerm ? (
                <div className="text-center">
                  <p className="text-gray-500 mb-3 text-lg">Aucun consultant trouvé pour "{searchTerm}"</p>
                  <Button 
                    onClick={() => setSearchTerm("")}
                    variant="outline"
                    className="border-blue-200 text-blue-600 hover:bg-blue-50"
                  >
                    Effacer la recherche
                  </Button>
                </div>
              ) : (
                <div className="text-center">
                  <p className="text-gray-500 mb-3 text-lg">Aucun consultant en attente de validation</p>
                  <Button 
                    onClick={() => navigate("/admin/consultants")}
                    className="bg-blue-600 hover:bg-blue-700 text-white"
                  >
                    Retour à la liste des consultants
                  </Button>
                </div>
              )}
            </div>
          ) : (
            <div className="overflow-x-auto">
              <Table>
                <TableHeader className="bg-gradient-to-r from-gray-50 to-blue-50">
                  <TableRow>
                    <TableHead className="font-semibold text-gray-700">Consultant</TableHead>
                    <TableHead className="font-semibold text-gray-700">Contact</TableHead>
                    <TableHead className="font-semibold text-gray-700">Domaine</TableHead>
                    <TableHead className="font-semibold text-gray-700">Expertise</TableHead>
                    <TableHead className="font-semibold text-gray-700">Disponibilité</TableHead>
                    <TableHead className="font-semibold text-gray-700 text-right">Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filteredConsultants.map((consultant) => (
                    <TableRow 
                      key={consultant.id} 
                      className="hover:bg-gradient-to-r hover:from-gray-50 hover:to-blue-50 transition-all duration-200"
                    >
                      <TableCell>
                        <div className="flex items-center gap-4">
                          <div className="relative">
                            <Avatar className="h-12 w-12 ring-2 ring-orange-100">
                              <AvatarImage 
                                src={getImageUrl(consultant.photo) || undefined} 
                                alt={`${consultant.prenom} ${consultant.nom}`}
                                onError={(e) => {
                                  (e.target as HTMLImageElement).style.display = 'none';
                                }}
                              />
                              <AvatarFallback className="bg-gradient-to-br from-orange-500 to-orange-600 text-white font-semibold">
                                {consultant.prenom.charAt(0)}{consultant.nom.charAt(0)}
                              </AvatarFallback>
                            </Avatar>
                            <div className="absolute -top-1 -right-1 bg-orange-500 text-white rounded-full p-1">
                              <ClockIcon className="h-3 w-3" />
                            </div>
                          </div>
                          <div>
                            <p className="font-semibold text-gray-900">{consultant.prenom} {consultant.nom}</p>
                            <div className="flex items-center text-gray-500 text-sm">
                              <MapPinIcon className="h-3 w-3 mr-1" />
                              {consultant.ville || ""}, {consultant.pays}
                            </div>
                          </div>
                        </div>
                      </TableCell>
                      
                      <TableCell>
                        <div className="text-sm space-y-1">
                          <div className="flex items-center text-gray-600">
                            <MailIcon className="h-3 w-3 mr-2 text-blue-500" />
                            <span className="truncate max-w-40">{consultant.email}</span>
                          </div>
                          <div className="flex items-center text-gray-600">
                            <PhoneIcon className="h-3 w-3 mr-2 text-green-500" />
                            {consultant.telephone}
                          </div>
                        </div>
                      </TableCell>
                      
                      <TableCell>
                        <div className="space-y-2">
                          <Badge 
                            className={`px-3 py-1 rounded-full border ${getDomainBadgeColor(consultant.domaine_principal)}`}
                          >
                            {getDomainName(consultant.domaine_principal)}
                          </Badge>
                          {consultant.specialite && (
                            <p className="text-sm text-gray-600 font-medium">{consultant.specialite}</p>
                          )}
                        </div>
                      </TableCell>
                      
                      <TableCell>
                        <Badge 
                          className={`px-3 py-1 rounded-full border ${getExpertiseBadgeColor(consultant.expertise)}`}
                        >
                          <StarIcon className="h-3 w-3 mr-1" />
                          {consultant.expertise}
                        </Badge>
                      </TableCell>
                      
                      <TableCell>
                        <div className="space-y-1">
                          <div className="flex items-center text-gray-600 text-sm">
                            <CalendarIcon className="h-3 w-3 mr-2 text-blue-500" />
                            <span>Du {formatDate(consultant.date_debut_dispo)}</span>
                          </div>
                          <div className="flex items-center text-gray-600 text-sm">
                            <CalendarIcon className="h-3 w-3 mr-2 text-red-500" />
                            <span>Au {formatDate(consultant.date_fin_dispo)}</span>
                          </div>
                        </div>
                      </TableCell>
                      
                      <TableCell className="text-right">
                        <div className="flex justify-end gap-2">
                          {consultant.cv && (
                            <Button 
                              variant="outline" 
                              size="sm" 
                              className="h-8 px-3 border-blue-200 hover:bg-blue-50 transition-colors" 
                              onClick={() => window.open(getImageUrl(consultant.cv), '_blank')}
                              title="Télécharger CV"
                            >
                              <FileTextIcon className="w-4 h-4 text-blue-600" />
                            </Button>
                          )}
                          
                          <Button 
                            variant="outline" 
                            size="sm" 
                            className="h-8 px-3 border-green-200 hover:bg-green-50 transition-colors" 
                            onClick={() => handleValidate(consultant.id)}
                            disabled={validating !== null || rejecting !== null}
                            title="Valider"
                          >
                            {validating === consultant.id ? (
                              <div className="animate-spin h-4 w-4 border-2 border-green-600 border-t-transparent rounded-full"></div>
                            ) : (
                              <CheckIcon className="w-4 h-4 text-green-600" />
                            )}
                          </Button>
                          
                          <Button 
                            variant="outline" 
                            size="sm" 
                            className="h-8 px-3 border-red-200 hover:bg-red-50 transition-colors" 
                            onClick={() => openRejectDialog(consultant)}
                            disabled={validating !== null || rejecting !== null}
                            title="Refuser"
                          >
                            {rejecting === consultant.id ? (
                              <div className="animate-spin h-4 w-4 border-2 border-red-600 border-t-transparent rounded-full"></div>
                            ) : (
                              <XIcon className="w-4 h-4 text-red-600" />
                            )}
                          </Button>
                        </div>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          )}
        </Card>
        
        {/* Notification de succès */}
        {validatedId && (
          <div className="fixed bottom-4 right-4 bg-white p-6 shadow-2xl rounded-2xl border border-green-200 z-50 max-w-sm">
            <div className="flex items-start gap-4">
              <div className="bg-green-100 rounded-full p-2">
                <CheckIcon className="h-6 w-6 text-green-600" />
              </div>
              <div className="flex-1">
                <p className="text-green-700 font-semibold mb-2">Consultant validé avec succès!</p>
                <div className="flex gap-2">
                  <Button 
                    size="sm"
                    onClick={() => navigate("/admin/consultants")}
                    className="bg-green-600 hover:bg-green-700 text-white"
                  >
                    Voir la liste
                  </Button>
                  <Button 
                    size="sm"
                    variant="outline"
                    onClick={() => setValidatedId(null)}
                    className="border-green-200 text-green-600"
                  >
                    Fermer
                  </Button>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Dialogue de confirmation de rejet */}
      <AlertDialog open={rejectDialogOpen} onOpenChange={(open) => {
        if (!rejecting) {
          setRejectDialogOpen(open);
        }
      }}>
        <AlertDialogContent className="bg-white rounded-2xl">
          <AlertDialogHeader>
            <AlertDialogTitle className="text-xl font-bold text-gray-800 flex items-center gap-2">
              <AlertTriangleIcon className="h-6 w-6 text-red-500" />
              Confirmation de rejet
            </AlertDialogTitle>
            <AlertDialogDescription className="text-gray-600">
              Êtes-vous sûr de vouloir refuser la candidature de <strong>{selectedConsultant?.prenom} {selectedConsultant?.nom}</strong> ? 
              <br /><br />
              <div className="bg-red-50 border border-red-200 rounded-lg p-3 mt-2">
                <p className="text-red-800 text-sm font-medium">⚠️ Cette action est irréversible</p>
                <p className="text-red-700 text-sm mt-1">
                  Le consultant sera définitivement supprimé de la liste des candidatures et ne pourra plus accéder à la plateforme.
                </p>
              </div>
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter className="gap-3">
            <AlertDialogCancel 
              className="border-gray-300 text-gray-700 hover:bg-gray-50"
              disabled={rejecting !== null}
            >
              Annuler
            </AlertDialogCancel>
            <AlertDialogAction 
              onClick={handleReject}
              className="bg-red-600 hover:bg-red-700 text-white"
              disabled={rejecting !== null}
            >
              {rejecting ? (
                <div className="flex items-center gap-2">
                  <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
                  Rejet en cours...
                </div>
              ) : (
                <>
                  <UserXIcon className="h-4 w-4 mr-2" />
                  Refuser définitivement
                </>
              )}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </AdminLayout>
  );
};

export default PendingConsultants;