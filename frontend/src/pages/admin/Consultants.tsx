import React, { useState, useEffect, useCallback } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from "@/components/ui/alert-dialog";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import AdminLayout from "@/components/admin/AdminLayout";
import {
  PlusIcon, SearchIcon, Edit2Icon, Trash2Icon, RefreshCwIcon, UserCogIcon,
  FileTextIcon, ListIcon, CalendarIcon, MapPinIcon, PhoneIcon, MailIcon, 
  BriefcaseIcon, ImageIcon, StarIcon, AwardIcon, TrendingUpIcon, UsersIcon,
  XIcon
} from "lucide-react";
import { toast } from "sonner";
import axios from "axios";
import { Link } from "react-router-dom";

interface Consultant {
  id: number;
  user?: number;
  nom: string;
  prenom: string;
  email: string;
  telephone: string;
  pays: string;
  ville?: string;
  date_debut_dispo: string;
  date_fin_dispo: string;
  cv?: string;
  photo?: string;
  expertise: string;
  domaine_principal: string;
  specialite: string;
  statut?: string;
  is_validated: boolean;
}

interface Competence {
  id: number;
  nom_competence: string;
  niveau: number;
}

interface Stats {
  total: number;
  active: number;
  expert: number;
  domains: { [key: string]: number };
}

const API_URL = "http://localhost:8000/api";

// Configuration des domaines et expertises
const DOMAINS = [
  { value: 'DIGITAL', label: 'Digital et Télécoms' },
  { value: 'FINANCE', label: 'Secteur bancaire et financier' },
  { value: 'ENERGIE', label: 'Transition énergétique' },
  { value: 'INDUSTRIE', label: 'Industrie et Mines' }
];

const EXPERTISE_LEVELS = [
  { value: 'Débutant', label: 'Débutant' },
  { value: 'Intermédiaire', label: 'Intermédiaire' },
  { value: 'Expert', label: 'Expert' }
];

// Règles de validation
const validateConsultantForm = (formData: any) => {
  const errors: { [key: string]: string } = {};
  
  if (!formData.nom || formData.nom.trim().length < 2) {
    errors.nom = "Le nom doit contenir au moins 2 caractères";
  }
  
  if (!formData.prenom || formData.prenom.trim().length < 2) {
    errors.prenom = "Le prénom doit contenir au moins 2 caractères";
  }
  
  if (!formData.email || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(formData.email)) {
    errors.email = "Veuillez saisir un email valide";
  }
  
  if (!formData.telephone || formData.telephone.trim().length < 8) {
    errors.telephone = "Le numéro de téléphone doit contenir au moins 8 caractères";
  }
  
  if (!formData.pays || formData.pays.trim().length < 2) {
    errors.pays = "Veuillez saisir un pays";
  }
  
  if (!formData.date_debut_dispo || !formData.date_fin_dispo) {
    errors.disponibilite = "Les dates de disponibilité sont requises";
  } else if (new Date(formData.date_debut_dispo) >= new Date(formData.date_fin_dispo)) {
    errors.disponibilite = "La date de fin doit être postérieure à la date de début";
  }
  
  if (!formData.specialite || formData.specialite.trim().length < 5) {
    errors.specialite = "Veuillez préciser votre spécialité (minimum 5 caractères)";
  }
  
  return {
    isValid: Object.keys(errors).length === 0,
    errors
  };
};

const Consultants: React.FC = () => {
  // États principaux
  const [consultants, setConsultants] = useState<Consultant[]>([]);
  const [searchTerm, setSearchTerm] = useState("");
  const [loading, setLoading] = useState(true);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editing, setEditing] = useState<Consultant | null>(null);
  const [formData, setFormData] = useState<any>({});
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [consultantToDelete, setConsultantToDelete] = useState<Consultant | null>(null);
  const [pendingCount, setPendingCount] = useState(0);
  const [activeFilter, setActiveFilter] = useState("all");
  const [stats, setStats] = useState<Stats>({ total: 0, active: 0, expert: 0, domains: {} });
  const [isDeleting, setIsDeleting] = useState(false);
  const [previewImage, setPreviewImage] = useState<string | null>(null);
  const [validationErrors, setValidationErrors] = useState<{ [key: string]: string }>({});

  // Calcul des statistiques
  const calculateStats = useCallback((consultants: Consultant[]) => {
    const total = consultants.length;
    const active = consultants.filter(c => c.statut === "Actif").length;
    const expert = consultants.filter(c => c.expertise === "Expert").length;
    
    const domains: { [key: string]: number } = {};
    consultants.forEach(c => {
      domains[c.domaine_principal] = (domains[c.domaine_principal] || 0) + 1;
    });

    setStats({ total, active, expert, domains });
  }, []);

  // Récupération des consultants
  const fetchConsultants = useCallback(async () => {
    setLoading(true);
    try {
      const response = await axios.get(`${API_URL}/admin/consultants/`);
      
      let consultantsData: Consultant[] = [];
      if (response.data.success && Array.isArray(response.data.data)) {
        consultantsData = response.data.data;
      } else if (Array.isArray(response.data)) {
        consultantsData = response.data;
      } else {
        console.error("Format de réponse inattendu:", response.data);
        toast.error("Format de données inattendu du serveur");
        return;
      }
      
      setConsultants(consultantsData);
      calculateStats(consultantsData);
      
      if (consultantsData.length > 0) {
        toast.success(`${consultantsData.length} consultants chargés`);
      }
    } catch (error: any) {
      console.error("Erreur lors du chargement des consultants:", error);
      const errorMessage = error.response?.data?.error || "Erreur lors du chargement des consultants";
      toast.error(errorMessage);
      setConsultants([]);
    } finally {
      setLoading(false);
    }
  }, [calculateStats]);

  // Récupération du nombre de consultants en attente
  const fetchPendingCount = useCallback(async () => {
    try {
      const response = await axios.get(`${API_URL}/admin/consultants/pending/`);
      
      let count = 0;
      if (response.data.success && Array.isArray(response.data.data)) {
        count = response.data.data.length;
      } else if (Array.isArray(response.data)) {
        count = response.data.length;
      } else if (typeof response.data.count === 'number') {
        count = response.data.count;
      }
      
      setPendingCount(count);
    } catch (error) {
      console.error("Erreur lors du chargement des consultants en attente:", error);
      setPendingCount(0);
    }
  }, []);

  useEffect(() => {
    fetchConsultants();
    fetchPendingCount();
  }, [fetchConsultants, fetchPendingCount]);

  // Gestion du formulaire
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    // Validation côté client
    const validation = validateConsultantForm(formData);
    if (!validation.isValid) {
      setValidationErrors(validation.errors);
      toast.error("Veuillez corriger les erreurs dans le formulaire");
      return;
    }
    
    // Validation supplémentaire pour la création
    if (!editing && !formData.password) {
      setValidationErrors({ password: "Le mot de passe est requis pour créer un nouveau consultant" });
      toast.error("Le mot de passe est requis pour créer un nouveau consultant");
      return;
    }
    
    setValidationErrors({});
    const loadingToast = toast.loading(editing ? "Modification en cours..." : "Création en cours...");
    
    try {
      // Préparer les données
      const payload = new FormData();
      
      // Ajouter tous les champs texte
      Object.entries(formData).forEach(([key, value]) => {
        if (value !== null && value !== undefined && value !== '') {
          if (key === 'photo' && value instanceof File) {
            payload.append(key, value);
          } else if (key === 'cv' && value instanceof File) {
            payload.append(key, value);
          } else if (typeof value === 'string' || typeof value === 'number') {
            payload.append(key, String(value));
          }
        }
      });
      
      let response;
      if (editing) {
        // Modification
        response = await axios.put(`${API_URL}/admin/consultants/${editing.id}/`, payload, {
          headers: { 'Content-Type': 'multipart/form-data' }
        });
      } else {
        // Création
        response = await axios.post(`${API_URL}/consultant/register/`, payload, {
          headers: { 'Content-Type': 'multipart/form-data' }
        });
      }
      
      // Gérer la réponse
      if (response.data.success) {
        const consultantData = response.data.data;
        
        if (editing) {
          // Mise à jour de la liste
          setConsultants(prev => prev.map(c => 
            c.id === editing.id ? consultantData : c
          ));
          toast.dismiss(loadingToast);
          toast.success("Consultant modifié avec succès");
        } else {
          // Ajout à la liste
          setConsultants(prev => [...prev, consultantData]);
          toast.dismiss(loadingToast);
          toast.success("Consultant ajouté avec succès");
        }
        
        // Fermer le dialogue et réinitialiser
        setDialogOpen(false);
        setEditing(null);
        setPreviewImage(null);
        setFormData({});
        setValidationErrors({});
        
        // Recalculer les statistiques
        calculateStats(consultants);
        fetchPendingCount();
      } else {
        toast.dismiss(loadingToast);
        const errorMessage = response.data.error || "Erreur lors de l'opération";
        toast.error(errorMessage);
      }
      
    } catch (error: any) {
      console.error("Erreur lors de l'enregistrement:", error);
      toast.dismiss(loadingToast);
      
      let errorMessage = "Erreur lors de l'enregistrement";
      if (error.response?.data?.error) {
        errorMessage = error.response.data.error;
      } else if (error.response?.data?.errors) {
        // Gestion des erreurs de validation multiples
        const errors = Object.entries(error.response.data.errors)
          .map(([field, messages]) => `${field}: ${Array.isArray(messages) ? messages.join(', ') : messages}`)
          .join('; ');
        errorMessage = `Erreurs de validation: ${errors}`;
        
        // Afficher les erreurs dans le formulaire
        if (typeof error.response.data.errors === 'object') {
          setValidationErrors(error.response.data.errors);
        }
      } else if (error.response?.data?.message) {
        errorMessage = error.response.data.message;
      }
      
      toast.error(errorMessage);
    }
  };

  // Ouverture du dialogue
  const openDialog = (consultant?: Consultant) => {
    setValidationErrors({});
    
    if (consultant) {
      setEditing(consultant);
      setFormData({ ...consultant });
      // Gestion de l'image existante
      if (consultant.photo) {
        setPreviewImage(getImageUrl(consultant.photo));
      }
    } else {
      setEditing(null);
      setFormData({
        nom: "",
        prenom: "",
        email: "",
        telephone: "",
        pays: "",
        ville: "",
        date_debut_dispo: "",
        date_fin_dispo: "",
        domaine_principal: "DIGITAL",
        specialite: "",
        expertise: "Débutant",
        cv: null,
        photo: null,
        password: ""
      });
      setPreviewImage(null);
    }
    setDialogOpen(true);
  };

  // Ouverture du dialogue de suppression
  const openDeleteDialog = (consultant: Consultant) => {
    setConsultantToDelete(consultant);
    setDeleteDialogOpen(true);
  };

  // Suppression d'un consultant
  const handleDelete = async () => {
    if (!consultantToDelete || isDeleting) return;

    setIsDeleting(true);
    
    try {
      const consultantId = consultantToDelete.id;
      const consultantName = `${consultantToDelete.prenom} ${consultantToDelete.nom}`;
      
      // Fermer immédiatement le dialogue
      setDeleteDialogOpen(false);
      
      // Mise à jour optimiste de l'UI
      setConsultants(prev => prev.filter(c => c.id !== consultantId));
      
      const loadingToast = toast.loading("Suppression en cours...");
      
      const response = await axios.delete(`${API_URL}/admin/consultants/${consultantId}/`);
      
      if (response.data.success) {
        // Recalculer les stats
        const updatedConsultants = consultants.filter(c => c.id !== consultantId);
        calculateStats(updatedConsultants);
        fetchPendingCount();
        
        toast.dismiss(loadingToast);
        toast.success(`Consultant "${consultantName}" supprimé avec succès`);
      } else {
        // Restaurer en cas d'erreur
        fetchConsultants();
        toast.dismiss(loadingToast);
        toast.error(response.data.error || "Erreur lors de la suppression");
      }
    } catch (error: any) {
      console.error("Erreur lors de la suppression:", error);
      
      // Restaurer la liste en cas d'erreur
      fetchConsultants();
      
      let errorMessage = "Erreur lors de la suppression du consultant";
      if (error.response?.data?.error) {
        errorMessage = error.response.data.error;
      }
      
      toast.error(errorMessage);
    } finally {
      setIsDeleting(false);
      setConsultantToDelete(null);
    }
  };

  // Filtrage des consultants
  const filterByStatus = (consultants: Consultant[], status: string) => {
    if (status === "all") return consultants;
    return consultants.filter(c => c.statut === status);
  };

  const filteredConsultants = filterByStatus(
    consultants.filter(
      (c) =>
        c.prenom?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        c.nom?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        c.email?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        (c.specialite && c.specialite.toLowerCase().includes(searchTerm.toLowerCase())) ||
        (c.domaine_principal && c.domaine_principal.toLowerCase().includes(searchTerm.toLowerCase()))
    ),
    activeFilter
  );

  // Utilitaires
  const getDomainName = (code: string) => {
    const domain = DOMAINS.find(d => d.value === code);
    return domain ? domain.label : code;
  };

  const getDomainBadgeColor = (domain: string) => {
    switch (domain) {
      case "DIGITAL": return "bg-blue-100 text-blue-800 border-blue-300";
      case "FINANCE": return "bg-green-100 text-green-800 border-green-300";
      case "ENERGIE": return "bg-yellow-100 text-yellow-800 border-yellow-300";
      case "INDUSTRIE": return "bg-purple-100 text-purple-800 border-purple-300";
      default: return "bg-gray-100 text-gray-800 border-gray-300";
    }
  };

  const getExpertiseBadgeColor = (expertise: string) => {
    switch (expertise) {
      case "Débutant": return "bg-sky-50 text-sky-700 border-sky-200";
      case "Intermédiaire": return "bg-amber-50 text-amber-700 border-amber-200";
      case "Expert": return "bg-rose-50 text-rose-700 border-rose-200";
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

  // Gestion des fichiers avec prévisualisation
  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>, type: 'photo' | 'cv') => {
    if (e.target.files && e.target.files[0]) {
      const file = e.target.files[0];
      
      // Validation de la taille
      const maxSize = type === 'photo' ? 5 * 1024 * 1024 : 10 * 1024 * 1024; // 5MB pour photo, 10MB pour CV
      if (file.size > maxSize) {
        toast.error(`Le fichier est trop volumineux. Taille maximum: ${maxSize / (1024 * 1024)}MB`);
        return;
      }
      
      // Validation du type de fichier
      if (type === 'photo' && !file.type.startsWith('image/')) {
        toast.error("Veuillez sélectionner un fichier image valide");
        return;
      }
      
      if (type === 'cv' && !['application/pdf', 'application/msword', 'application/vnd.openxmlformats-officedocument.wordprocessingml.document'].includes(file.type)) {
        toast.error("Veuillez sélectionner un fichier PDF ou Word");
        return;
      }
      
      setFormData(prev => ({ ...prev, [type]: file }));
      
      // Prévisualisation pour les images
      if (type === 'photo' && file.type.startsWith('image/')) {
        const reader = new FileReader();
        reader.onload = (e) => {
          setPreviewImage(e.target?.result as string);
        };
        reader.readAsDataURL(file);
      }
    }
  };

  // Fonction pour obtenir l'URL de l'image avec fallback
  const getImageUrl = (photo: string | undefined) => {
    if (!photo) return null;
    
    // Si c'est une URL complète
    if (photo.startsWith('http')) {
      return photo;
    }
    
    // Si c'est un chemin relatif, construire l'URL complète
    if (photo.startsWith('/')) {
      return `http://localhost:8000${photo}`;
    }
    
    // Fallback pour les autres cas
    return `http://localhost:8000/media/${photo}`;
  };

  return (
    <AdminLayout>
      <div className="space-y-6 p-6 bg-gradient-to-br from-slate-50 to-blue-50 min-h-screen">
        {/* En-tête avec statistiques */}
        <div className="bg-white rounded-2xl shadow-lg p-6 border border-gray-100">
          <div className="flex flex-col lg:flex-row justify-between items-start lg:items-center gap-6 mb-6">
            <div>
              <h1 className="text-3xl font-bold text-gray-800 mb-2">Gestion des Consultants</h1>
              <p className="text-gray-600">Gérez votre base de données de consultants experts</p>
            </div>
            
            {/* Statistiques rapides */}
            <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 w-full lg:w-auto">
              <Card className="border-blue-200 bg-blue-50">
                <CardContent className="p-4">
                  <div className="flex items-center space-x-2">
                    <UsersIcon className="h-5 w-5 text-blue-600" />
                    <div>
                      <p className="text-sm text-blue-600">Total</p>
                      <p className="text-xl font-bold text-blue-800">{stats.total}</p>
                    </div>
                  </div>
                </CardContent>
              </Card>
              
              <Card className="border-green-200 bg-green-50">
                <CardContent className="p-4">
                  <div className="flex items-center space-x-2">
                    <TrendingUpIcon className="h-5 w-5 text-green-600" />
                    <div>
                      <p className="text-sm text-green-600">Actifs</p>
                      <p className="text-xl font-bold text-green-800">{stats.active}</p>
                    </div>
                  </div>
                </CardContent>
              </Card>
              
              <Card className="border-purple-200 bg-purple-50">
                <CardContent className="p-4">
                  <div className="flex items-center space-x-2">
                    <AwardIcon className="h-5 w-5 text-purple-600" />
                    <div>
                      <p className="text-sm text-purple-600">Experts</p>
                      <p className="text-xl font-bold text-purple-800">{stats.expert}</p>
                    </div>
                  </div>
                </CardContent>
              </Card>
              
              <Card className="border-orange-200 bg-orange-50">
                <CardContent className="p-4">
                  <div className="flex items-center space-x-2">
                    <UserCogIcon className="h-5 w-5 text-orange-600" />
                    <div>
                      <p className="text-sm text-orange-600">En attente</p>
                      <p className="text-xl font-bold text-orange-800">{pendingCount}</p>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </div>
          </div>

          {/* Actions et recherche */}
          <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
            <div className="flex flex-col sm:flex-row gap-3">
              <Link to="/admin/pending-consultants">
                <Button variant="outline" className="flex items-center gap-2 border-orange-200 hover:bg-orange-50 transition-colors">
                  <UserCogIcon className="h-4 w-4 text-orange-600" />
                  <span className="text-orange-600">Validations</span>
                  {pendingCount > 0 && (
                    <Badge className="ml-1 bg-red-500 text-white">{pendingCount}</Badge>
                  )}
                </Button>
              </Link>
              <Button 
                onClick={fetchConsultants} 
                variant="outline" 
                className="flex items-center gap-2 border-gray-200 hover:bg-gray-50 transition-colors"
                disabled={loading}
              >
                <RefreshCwIcon className={`h-4 w-4 text-gray-600 ${loading ? 'animate-spin' : ''}`} />
                <span className="text-gray-600">Actualiser</span>
              </Button>
              <Button 
                className="bg-gradient-to-r from-indigo-600 to-purple-600 hover:from-indigo-700 hover:to-purple-700 transition-all duration-200 text-white shadow-lg" 
                onClick={() => openDialog()}
              >
                <PlusIcon className="h-4 w-4 mr-2" /> Ajouter un consultant
              </Button>
            </div>

            <div className="flex flex-col md:flex-row gap-4 w-full md:w-auto">
              <div className="relative flex-grow md:max-w-md">
                <SearchIcon className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 h-4 w-4" />
                <Input
                  placeholder="Rechercher un consultant..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pl-10 border-gray-200 focus:border-indigo-300 focus:ring focus:ring-indigo-200 focus:ring-opacity-50 rounded-lg"
                />
              </div>
              
              <div className="flex gap-2">
                <Button 
                  variant={activeFilter === "all" ? "default" : "outline"}
                  onClick={() => setActiveFilter("all")}
                  className={activeFilter === "all" ? "bg-indigo-600 text-white" : "border-gray-200"}
                >
                  Tous
                </Button>
                <Button 
                  variant={activeFilter === "Actif" ? "default" : "outline"}
                  onClick={() => setActiveFilter("Actif")}
                  className={activeFilter === "Actif" ? "bg-green-600 text-white" : "border-gray-200"}
                >
                  Actifs
                </Button>
                <Button 
                  variant={activeFilter === "Inactif" ? "default" : "outline"}
                  onClick={() => setActiveFilter("Inactif")}
                  className={activeFilter === "Inactif" ? "bg-gray-600 text-white" : "border-gray-200"}
                >
                  Inactifs
                </Button>
              </div>
            </div>
          </div>
        </div>

        {/* Tableau des consultants */}
        <Card className="shadow-lg border-none bg-white rounded-2xl overflow-hidden">
          {loading ? (
            <div className="flex flex-col items-center justify-center py-20">
              <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-indigo-600 mb-4"></div>
              <p className="text-gray-500 text-lg">Chargement des consultants...</p>
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
                    <TableHead className="font-semibold text-gray-700">Statut</TableHead>
                    <TableHead className="font-semibold text-gray-700">Disponibilité</TableHead>
                    <TableHead className="font-semibold text-gray-700 text-right">Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filteredConsultants.length > 0 ? (
                    filteredConsultants.map((consultant) => (
                      <TableRow key={consultant.id} className="hover:bg-gradient-to-r hover:from-gray-50 hover:to-blue-50 transition-all duration-200">
                        <TableCell>
                          <div className="flex items-center gap-4">
                            <Avatar className="h-12 w-12 ring-2 ring-indigo-100">
                              <AvatarImage 
                                src={getImageUrl(consultant.photo) || undefined} 
                                alt={`${consultant.prenom} ${consultant.nom}`}
                                onError={(e) => {
                                  (e.target as HTMLImageElement).style.display = 'none';
                                }}
                              />
                              <AvatarFallback className="bg-gradient-to-br from-indigo-500 to-purple-600 text-white font-semibold">
                                {consultant.prenom.charAt(0)}{consultant.nom.charAt(0)}
                              </AvatarFallback>
                            </Avatar>
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
                          <div className="flex items-center">
                            <div className={`w-2 h-2 rounded-full mr-2 ${
                              consultant.statut === "Actif" ? "bg-green-500" : "bg-gray-400"
                            }`}></div>
                            <Badge 
                              className={`px-3 py-1 rounded-full border ${
                                consultant.statut === "Actif" 
                                  ? "bg-green-50 text-green-700 border-green-200" 
                                  : "bg-gray-50 text-gray-700 border-gray-200"
                              }`}
                            >
                              {consultant.statut}
                            </Badge>
                          </div>
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
                            <Button 
                              variant="outline" 
                              size="sm" 
                              className="h-8 px-3 border-amber-200 hover:bg-amber-50 transition-colors" 
                              onClick={() => openDialog(consultant)} 
                              title="Modifier"
                            >
                              <Edit2Icon className="w-4 h-4 text-amber-600" />
                            </Button>
                            <Button 
                              variant="outline" 
                              size="sm" 
                              className="h-8 px-3 border-red-200 hover:bg-red-50 transition-colors" 
                              onClick={() => openDeleteDialog(consultant)} 
                              title="Supprimer"
                              disabled={isDeleting}
                            >
                              <Trash2Icon className="w-4 h-4 text-red-600" />
                            </Button>
                          </div>
                        </TableCell>
                      </TableRow>
                    ))
                  ) : (
                    <TableRow>
                      <TableCell colSpan={7} className="text-center py-16">
                        <div className="flex flex-col items-center justify-center">
                          <div className="bg-gray-100 rounded-full p-6 mb-4">
                            <SearchIcon className="h-8 w-8 text-gray-400" />
                          </div>
                          {searchTerm ? (
                            <div>
                              <p className="text-gray-500 mb-3 text-lg">Aucun consultant trouvé pour "{searchTerm}"</p>
                              <Button 
                                onClick={() => setSearchTerm("")}
                                variant="outline"
                                className="border-indigo-200 text-indigo-600 hover:bg-indigo-50"
                              >
                                Effacer la recherche
                              </Button>
                            </div>
                          ) : (
                            <div>
                              <p className="text-gray-500 mb-3 text-lg">Aucun consultant disponible</p>
                              <Button 
                                onClick={() => openDialog()}
                                className="bg-indigo-600 hover:bg-indigo-700 text-white"
                              >
                                <PlusIcon className="h-4 w-4 mr-2" />
                                Ajouter un consultant
                              </Button>
                            </div>
                          )}
                        </div>
                      </TableCell>
                    </TableRow>
                  )}
                </TableBody>
              </Table>
            </div>
          )}
        </Card>
      </div>

      {/* Dialogue de formulaire */}
      <Dialog open={dialogOpen} onOpenChange={(open) => {
        setDialogOpen(open);
        if (!open) {
          setPreviewImage(null);
          setFormData({});
          setEditing(null);
          setValidationErrors({});
        }
      }}>
        <DialogContent className="max-w-4xl bg-white max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="text-2xl font-bold text-gray-800 flex items-center gap-2">
              {editing ? <Edit2Icon className="h-6 w-6" /> : <PlusIcon className="h-6 w-6" />}
              {editing ? "Modifier" : "Ajouter"} un consultant
            </DialogTitle>
          </DialogHeader>
          
          <form onSubmit={handleSubmit} className="space-y-6 pt-2">
            {/* Photo de profil avec prévisualisation */}
            <div className="flex flex-col items-center gap-4 p-4 bg-gray-50 rounded-lg">
              <Avatar className="h-32 w-32 ring-4 ring-indigo-100">
                <AvatarImage 
                  src={previewImage || getImageUrl(formData.photo) || undefined} 
                  alt="Photo de profil"
                  onError={(e) => {
                    (e.target as HTMLImageElement).style.display = 'none';
                  }}
                />
                <AvatarFallback className="bg-gradient-to-br from-indigo-500 to-purple-600 text-white text-2xl">
                  {formData.prenom?.charAt(0) || ''}{formData.nom?.charAt(0) || ''}
                </AvatarFallback>
              </Avatar>
              <div className="text-center">
                <label className="block text-sm font-medium text-gray-700 mb-2">Photo de profil</label>
                <div className="flex items-center gap-2">
                  <label className="cursor-pointer">
                    <input
                      type="file"
                      accept="image/*"
                      onChange={(e) => handleFileChange(e, 'photo')}
                      className="hidden"
                    />
                    <Button type="button" variant="outline" className="flex items-center gap-2" asChild>
                      <span>
                        <ImageIcon className="h-4 w-4" />
                        Choisir une photo
                      </span>
                    </Button>
                  </label>
                  {(formData.photo || previewImage) && (
                    <Button
                      type="button"
                      variant="ghost"
                      onClick={() => {
                        setFormData({ ...formData, photo: null });
                        setPreviewImage(null);
                      }}
                      className="text-red-500 hover:text-red-700"
                    >
                      <XIcon className="h-4 w-4" />
                    </Button>
                  )}
                </div>
                <p className="text-xs text-gray-500 mt-1">
                  Formats acceptés: JPG, PNG, GIF (max 5MB)
                </p>
                {validationErrors.photo && (
                  <p className="text-red-500 text-xs mt-1">{validationErrors.photo}</p>
                )}
              </div>
            </div>

            {/* Informations personnelles */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Prénom <span className="text-red-500">*</span>
                </label>
                <Input 
                  placeholder="Prénom" 
                  value={formData.prenom || ''} 
                  onChange={(e) => setFormData({ ...formData, prenom: e.target.value })} 
                  required 
                  className={`border-gray-300 focus:border-indigo-300 focus:ring focus:ring-indigo-200 focus:ring-opacity-50 ${
                    validationErrors.prenom ? 'border-red-500' : ''
                  }`}
                />
                {validationErrors.prenom && (
                  <p className="text-red-500 text-xs mt-1">{validationErrors.prenom}</p>
                )}
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Nom <span className="text-red-500">*</span>
                </label>
                <Input 
                  placeholder="Nom" 
                  value={formData.nom || ''} 
                  onChange={(e) => setFormData({ ...formData, nom: e.target.value })} 
                  required 
                  className={`border-gray-300 focus:border-indigo-300 focus:ring focus:ring-indigo-200 focus:ring-opacity-50 ${
                    validationErrors.nom ? 'border-red-500' : ''
                  }`}
                />
                {validationErrors.nom && (
                  <p className="text-red-500 text-xs mt-1">{validationErrors.nom}</p>
                )}
              </div>
            </div>

            {/* Contact */}
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Email <span className="text-red-500">*</span>
                </label>
                <div className="relative">
                  <MailIcon className="h-4 w-4 text-gray-400 absolute left-3 top-1/2 -translate-y-1/2" />
                  <Input 
                    type="email" 
                    placeholder="email@example.com" 
                    value={formData.email || ''} 
                    onChange={(e) => setFormData({ ...formData, email: e.target.value })} 
                    required 
                    className={`pl-10 border-gray-300 focus:border-indigo-300 focus:ring focus:ring-indigo-200 focus:ring-opacity-50 ${
                      validationErrors.email ? 'border-red-500' : ''
                    }`}
                  />
                </div>
                {validationErrors.email && (
                  <p className="text-red-500 text-xs mt-1">{validationErrors.email}</p>
                )}
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Téléphone <span className="text-red-500">*</span>
                </label>
                <div className="relative">
                  <PhoneIcon className="h-4 w-4 text-gray-400 absolute left-3 top-1/2 -translate-y-1/2" />
                  <Input 
                    placeholder="+222 XX XX XX XX" 
                    value={formData.telephone || ''} 
                    onChange={(e) => setFormData({ ...formData, telephone: e.target.value })} 
                    required 
                    className={`pl-10 border-gray-300 focus:border-indigo-300 focus:ring focus:ring-indigo-200 focus:ring-opacity-50 ${
                      validationErrors.telephone ? 'border-red-500' : ''
                    }`}
                  />
                </div>
                {validationErrors.telephone && (
                  <p className="text-red-500 text-xs mt-1">{validationErrors.telephone}</p>
                )}
              </div>
            </div>

            {/* Localisation */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Pays <span className="text-red-500">*</span>
                </label>
                <div className="relative">
                  <MapPinIcon className="h-4 w-4 text-gray-400 absolute left-3 top-1/2 -translate-y-1/2" />
                  <Input 
                    placeholder="Mauritanie"
                    value={formData.pays || ''} 
                    onChange={(e) => setFormData({ ...formData, pays: e.target.value })} 
                    required 
                    className={`pl-10 border-gray-300 focus:border-indigo-300 focus:ring focus:ring-indigo-200 focus:ring-opacity-50 ${
                      validationErrors.pays ? 'border-red-500' : ''
                    }`}
                  />
                </div>
                {validationErrors.pays && (
                  <p className="text-red-500 text-xs mt-1">{validationErrors.pays}</p>
                )}
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Ville</label>
                <Input 
                  placeholder="Nouakchott" 
                  value={formData.ville || ''} 
                  onChange={(e) => setFormData({ ...formData, ville: e.target.value })} 
                  className="border-gray-300 focus:border-indigo-300 focus:ring focus:ring-indigo-200 focus:ring-opacity-50"
                />
              </div>
            </div>

            {/* Disponibilité */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Disponible à partir de <span className="text-red-500">*</span>
                </label>
                <div className="relative">
                  <CalendarIcon className="h-4 w-4 text-gray-400 absolute left-3 top-1/2 -translate-y-1/2" />
                  <Input 
                    type="date" 
                    value={formData.date_debut_dispo || ''} 
                    onChange={(e) => setFormData({ ...formData, date_debut_dispo: e.target.value })} 
                    required 
                    className={`pl-10 border-gray-300 focus:border-indigo-300 focus:ring focus:ring-indigo-200 focus:ring-opacity-50 ${
                      validationErrors.disponibilite ? 'border-red-500' : ''
                    }`}
                  />
                </div>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Disponible jusqu'à <span className="text-red-500">*</span>
                </label>
                <div className="relative">
                  <CalendarIcon className="h-4 w-4 text-gray-400 absolute left-3 top-1/2 -translate-y-1/2" />
                  <Input 
                    type="date" 
                    value={formData.date_fin_dispo || ''} 
                    onChange={(e) => setFormData({ ...formData, date_fin_dispo: e.target.value })} 
                    required 
                    className={`pl-10 border-gray-300 focus:border-indigo-300 focus:ring focus:ring-indigo-200 focus:ring-opacity-50 ${
                      validationErrors.disponibilite ? 'border-red-500' : ''
                    }`}
                  />
                </div>
              </div>
              {validationErrors.disponibilite && (
                <div className="col-span-2">
                  <p className="text-red-500 text-xs">{validationErrors.disponibilite}</p>
                </div>
              )}
            </div>

            {/* Expertise */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Domaine principal <span className="text-red-500">*</span>
                </label>
                <div className="relative">
                  <BriefcaseIcon className="h-4 w-4 text-gray-400 absolute left-3 top-1/2 -translate-y-1/2" />
                  <select 
                    value={formData.domaine_principal || 'DIGITAL'} 
                    onChange={(e) => setFormData({ ...formData, domaine_principal: e.target.value })} 
                    className="w-full pl-10 p-2 border rounded-lg border-gray-300 focus:border-indigo-300 focus:ring focus:ring-indigo-200 focus:ring-opacity-50"
                  >
                    {DOMAINS.map(domain => (
                      <option key={domain.value} value={domain.value}>{domain.label}</option>
                    ))}
                  </select>
                </div>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Niveau d'expertise <span className="text-red-500">*</span>
                </label>
                <div className="relative">
                  <StarIcon className="h-4 w-4 text-gray-400 absolute left-3 top-1/2 -translate-y-1/2" />
                  <select 
                    value={formData.expertise || 'Débutant'} 
                    onChange={(e) => setFormData({ ...formData, expertise: e.target.value })} 
                    className="w-full pl-10 p-2 border rounded-lg border-gray-300 focus:border-indigo-300 focus:ring focus:ring-indigo-200 focus:ring-opacity-50"
                  >
                    {EXPERTISE_LEVELS.map(level => (
                      <option key={level.value} value={level.value}>{level.label}</option>
                    ))}
                  </select>
                </div>
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Sous-domaine / Spécialité <span className="text-red-500">*</span>
              </label>
              <Input 
                placeholder="Ex: Cybersécurité, Finance Islamique, Énergies renouvelables..." 
                value={formData.specialite || ''} 
                onChange={(e) => setFormData({ ...formData, specialite: e.target.value })} 
                required 
                className={`border-gray-300 focus:border-indigo-300 focus:ring focus:ring-indigo-200 focus:ring-opacity-50 ${
                  validationErrors.specialite ? 'border-red-500' : ''
                }`}
              />
              {validationErrors.specialite && (
                <p className="text-red-500 text-xs mt-1">{validationErrors.specialite}</p>
              )}
            </div>

            {/* Mot de passe pour nouveaux consultants */}
            {!editing && (
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Mot de passe <span className="text-red-500">*</span>
                </label>
                <Input 
                  type="password" 
                  placeholder="Mot de passe"
                  value={formData.password || ''}
                  onChange={(e) => setFormData({ ...formData, password: e.target.value })} 
                  required={!editing}
                  className={`border-gray-300 focus:border-indigo-300 focus:ring focus:ring-indigo-200 focus:ring-opacity-50 ${
                    validationErrors.password ? 'border-red-500' : ''
                  }`}
                />
                {validationErrors.password && (
                  <p className="text-red-500 text-xs mt-1">{validationErrors.password}</p>
                )}
              </div>
            )}

            {/* CV */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                CV (PDF, DOC, DOCX) {!editing && <span className="text-red-500">*</span>}
              </label>
              <div className="flex items-center gap-2">
                <label className="cursor-pointer flex-1">
                  <input
                    type="file"
                    accept=".pdf,.doc,.docx"
                    onChange={(e) => handleFileChange(e, 'cv')}
                    className="hidden"
                    required={!editing}
                  />
                  <div className="border-2 border-dashed border-gray-300 rounded-lg p-4 hover:border-indigo-300 transition-colors">
                    <div className="flex items-center justify-center gap-2">
                      <FileTextIcon className="h-5 w-5 text-gray-400" />
                      <span className="text-sm text-gray-600">
                        {formData.cv instanceof File 
                          ? formData.cv.name 
                          : formData.cv 
                            ? 'Fichier CV existant' 
                            : 'Cliquez pour choisir un fichier CV'}
                      </span>
                    </div>
                  </div>
                </label>
                {formData.cv && (
                  <Button
                    type="button"
                    variant="ghost"
                    onClick={() => setFormData({ ...formData, cv: null })}
                    className="text-red-500 hover:text-red-700"
                  >
                    <XIcon className="h-4 w-4" />
                  </Button>
                )}
              </div>
              <p className="text-xs text-gray-500 mt-1">
                Formats acceptés: PDF, DOC, DOCX (max 10MB)
              </p>
              {validationErrors.cv && (
                <p className="text-red-500 text-xs mt-1">{validationErrors.cv}</p>
              )}
            </div>

            <DialogFooter className="mt-8 flex justify-end gap-3 pt-6 border-t border-gray-100">
              <Button 
                type="button" 
                variant="outline" 
                onClick={() => setDialogOpen(false)}
                className="border-gray-300 text-gray-700 hover:bg-gray-50"
              >
                Annuler
              </Button>
              <Button 
                type="submit"
                className="bg-gradient-to-r from-indigo-600 to-purple-600 hover:from-indigo-700 hover:to-purple-700 text-white"
                disabled={loading}
              >
                {loading ? (
                  <div className="flex items-center gap-2">
                    <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
                    {editing ? "Modification..." : "Création..."}
                  </div>
                ) : (
                  editing ? "Mettre à jour" : "Enregistrer"
                )}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>

      {/* Dialogue de confirmation de suppression */}
      <AlertDialog open={deleteDialogOpen} onOpenChange={(open) => {
        if (!isDeleting) {
          setDeleteDialogOpen(open);
        }
      }}>
        <AlertDialogContent className="bg-white rounded-2xl">
          <AlertDialogHeader>
            <AlertDialogTitle className="text-xl font-bold text-gray-800 flex items-center gap-2">
              <Trash2Icon className="h-6 w-6 text-red-500" />
              Confirmation de suppression
            </AlertDialogTitle>
            <AlertDialogDescription className="text-gray-600">
              Êtes-vous sûr de vouloir supprimer <strong>{consultantToDelete?.prenom} {consultantToDelete?.nom}</strong> ? 
              <br /><br />
              <div className="bg-red-50 border border-red-200 rounded-lg p-3 mt-2">
                <p className="text-red-800 text-sm font-medium">⚠️ Cette action est irréversible</p>
                <p className="text-red-700 text-sm mt-1">
                  Toutes les données associées à ce consultant seront définitivement supprimées :
                </p>
                <ul className="text-red-700 text-sm mt-2 list-disc list-inside space-y-1">
                  <li>Profil et informations personnelles</li>
                  <li>Compétences et expertises</li>
                  <li>Historique des matchings</li>
                  <li>Notifications</li>
                </ul>
              </div>
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter className="gap-3">
            <AlertDialogCancel 
              className="border-gray-300 text-gray-700 hover:bg-gray-50"
              disabled={isDeleting}
            >
              Annuler
            </AlertDialogCancel>
            <AlertDialogAction 
              onClick={handleDelete}
              className="bg-red-600 hover:bg-red-700 text-white"
              disabled={isDeleting}
            >
              {isDeleting ? (
                <div className="flex items-center gap-2">
                  <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
                  Suppression...
                </div>
              ) : (
                <>
                  <Trash2Icon className="h-4 w-4 mr-2" />
                  Supprimer définitivement
                </>
              )}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </AdminLayout>
  );
};

export default Consultants;