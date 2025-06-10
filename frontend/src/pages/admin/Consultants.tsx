import React, { useState, useEffect, useCallback } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger, DialogFooter } from "@/components/ui/dialog";
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from "@/components/ui/alert-dialog";
import AdminLayout from "@/components/admin/AdminLayout";
import {
  PlusIcon, SearchIcon, Edit2Icon, Trash2Icon, RefreshCwIcon, UserCogIcon,
  FileTextIcon, ListIcon, CalendarIcon, MapPinIcon, PhoneIcon, MailIcon, BriefcaseIcon
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

const API_URL = "http://localhost:8000/api";

const Consultants = () => {
  const [consultants, setConsultants] = useState<Consultant[]>([]);
  const [searchTerm, setSearchTerm] = useState("");
  const [loading, setLoading] = useState(true);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [competencesDialogOpen, setCompetencesDialogOpen] = useState(false);
  const [editing, setEditing] = useState<Consultant | null>(null);
  const [formData, setFormData] = useState<any>({});
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [consultantToDelete, setConsultantToDelete] = useState<Consultant | null>(null);
  const [selectedConsultantId, setSelectedConsultantId] = useState<number | null>(null);
  const [pendingCount, setPendingCount] = useState(0);
  const [consultantCompetences, setConsultantCompetences] = useState<Competence[]>([]);
  const [loadingCompetences, setLoadingCompetences] = useState(false);
  const [activeFilter, setActiveFilter] = useState("all");

  // Récupération du nombre de consultants en attente
  const fetchPendingCount = useCallback(async () => {
    try {
      const response = await axios.get(`${API_URL}/admin/consultants/pending/`);
      
      // Vérifier le format de la réponse et extraire correctement le nombre
      if (response.data.success && Array.isArray(response.data.data)) {
        setPendingCount(response.data.data.length);
      } else if (Array.isArray(response.data)) {
        setPendingCount(response.data.length);
      } else {
        console.error("Format de réponse inattendu pour pending count:", response.data);
        setPendingCount(0);
      }
    } catch (error) {
      console.error("Erreur lors du chargement des consultants en attente:", error);
      setPendingCount(0);
    }
  }, []);

  // Récupération des consultants validés
  const fetchConsultants = useCallback(async () => {
    try {
      setLoading(true);
      const response = await axios.get(`${API_URL}/admin/consultants/`);
      
      // Mettre à jour également le compteur de consultants en attente
      fetchPendingCount();
      
      if (response.data.success) {
        const now = new Date();
        const withStatus = response.data.data.map((c: Consultant) => ({
          ...c,
          statut: new Date(c.date_fin_dispo) >= now ? "Actif" : "Inactif"
        }));
        setConsultants(withStatus);
      } else {
        toast.error(response.data.error || "Erreur lors du chargement des consultants");
      }
    } catch (error) {
      toast.error("Erreur de chargement des consultants");
      console.error("Erreur lors du chargement des consultants:", error);
    } finally {
      setLoading(false);
    }
  }, [fetchPendingCount]);

  useEffect(() => {
    fetchConsultants();
  }, [fetchConsultants]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const payload = new FormData();
    Object.entries(formData).forEach(([key, value]) => {
      if (value !== null && value !== undefined) {
        payload.append(key, value);
      }
    });

    try {
      if (editing) {
        await axios.put(`${API_URL}/admin/consultants/${editing.id}/`, payload, {
          headers: { 'Content-Type': 'multipart/form-data' }
        });
        toast.success("Consultant modifié avec succès");
      } else {
        await axios.post(`${API_URL}/consultant/register/`, payload, {
          headers: { 'Content-Type': 'multipart/form-data' }
        });
        toast.success("Consultant ajouté avec succès");
      }
      setDialogOpen(false);
      setEditing(null);
      fetchConsultants();
    } catch (error) {
      console.error("Erreur lors de l'enregistrement:", error);
      if (axios.isAxiosError(error) && error.response) {
        toast.error(`Erreur: ${error.response.data.error || "Échec de l'opération"}`);
      } else {
        toast.error("Erreur lors de l'enregistrement");
      }
    }
  };

  const openDialog = (consultant?: Consultant) => {
    if (consultant) {
      setEditing(consultant);
      setFormData({ ...consultant });
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
        password: ""  // Champ requis pour les nouveaux consultants
      });
    }
    setDialogOpen(true);
  };

  const openDeleteDialog = (consultant: Consultant) => {
    setConsultantToDelete(consultant);
    setDeleteDialogOpen(true);
  };

  const openCompetencesDialog = async (consultantId: number) => {
    setSelectedConsultantId(consultantId);
    setLoadingCompetences(true);
    
    try {
      const response = await axios.get(`${API_URL}/consultant-competences/${consultantId}/`);
      setConsultantCompetences(response.data);
    } catch (error) {
      console.error("Erreur lors du chargement des compétences:", error);
      toast.error("Impossible de charger les compétences du consultant");
      setConsultantCompetences([]);
    } finally {
      setLoadingCompetences(false);
      setCompetencesDialogOpen(true);
    }
  };

  const handleDelete = async () => {
    if (!consultantToDelete) return;

    try {
      setDeleteDialogOpen(false); // Fermer d'abord la boîte de dialogue pour une meilleure UX
      
      // Afficher un toast de chargement
      const loadingToast = toast.loading("Suppression en cours...");
      
      await axios.delete(`${API_URL}/admin/consultants/${consultantToDelete.id}/`);
      
      // Mettre à jour l'état local en supprimant le consultant
      setConsultants(consultants.filter(c => c.id !== consultantToDelete.id));
      
      // Mettre à jour le compteur de consultants en attente après suppression
      fetchPendingCount();
      
      // Remplacer le toast de chargement par un toast de succès
      toast.dismiss(loadingToast);
      toast.success(`Consultant "${consultantToDelete.prenom} ${consultantToDelete.nom}" supprimé avec succès`);
    } catch (error) {
      console.error("Erreur lors de la suppression:", error);
      
      let errorMessage = "Erreur lors de la suppression du consultant";
      
      if (axios.isAxiosError(error) && error.response) {
        // Récupérer le message d'erreur détaillé du backend si disponible
        errorMessage = error.response.data.error || errorMessage;
      }
      
      toast.error(errorMessage);
    } finally {
      setConsultantToDelete(null);
    }
  };

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
    activeFilter === "all" ? "all" : activeFilter
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

  const formatDate = (dateString) => {
    // Si la date est nulle, vide ou correspond à la date Unix epoch
    if (!dateString || dateString === "" || dateString === "1970-01-01") {
      return "Non définie";
    }
    
    // Créer un objet Date
    const date = new Date(dateString);
    
    // Vérifier si la date est valide
    if (isNaN(date.getTime())) {
      return "Non définie";
    }
    
    // Retourner la date formatée selon les conventions françaises
    return new Intl.DateTimeFormat('fr-FR').format(date);
  };

  const renderSkillLevel = (level: number) => {
    const maxLevel = 5;
    return (
      <div className="flex space-x-1 items-center">
        {Array.from({ length: maxLevel }).map((_, index) => (
          <div 
            key={index} 
            className={`h-2 w-6 rounded ${index < level ? 'bg-indigo-500' : 'bg-gray-200'}`} 
          />
        ))}
        <span className="ml-2 text-xs text-gray-600">Niveau {level}/{maxLevel}</span>
      </div>
    );
  };

  return (
    <AdminLayout>
      <div className="space-y-6 p-6 bg-gray-50 min-h-screen">
        <div className="bg-white rounded-xl shadow-sm p-6 border border-gray-100">
          <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 mb-6">
            <div>
              <h1 className="text-2xl font-bold text-gray-800">Gestion des Consultants</h1>
              <p className="text-gray-500 mt-1">Gérez votre base de données de consultants</p>
            </div>
            <div className="flex flex-col sm:flex-row gap-3">
              <Link to="/admin/pending-consultants">
                <Button variant="outline" className="flex items-center gap-2 border-indigo-200 hover:bg-indigo-50 transition-colors">
                  <UserCogIcon className="h-4 w-4 text-indigo-600" />
                  <span className="text-indigo-600">En attente</span>
                  {pendingCount > 0 && (
                    <Badge className="ml-1 bg-red-500 text-white">{pendingCount}</Badge>
                  )}
                </Button>
              </Link>
              <Button 
                onClick={fetchConsultants} 
                variant="outline" 
                className="flex items-center gap-2 border-gray-200 hover:bg-gray-50 transition-colors"
              >
                <RefreshCwIcon className="h-4 w-4 text-gray-600" />
                <span className="text-gray-600">Actualiser</span>
              </Button>
              <Button 
                className="bg-indigo-600 hover:bg-indigo-700 transition-colors text-white" 
                onClick={() => openDialog()}
              >
                <PlusIcon className="h-4 w-4 mr-2" /> Ajouter
              </Button>
            </div>
          </div>

          <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 mb-6">
            <div className="relative w-full md:w-auto flex-grow md:max-w-md">
              <SearchIcon className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 h-4 w-4" />
              <Input
                placeholder="Rechercher un consultant..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-10 border-gray-200 focus:border-indigo-300 focus:ring focus:ring-indigo-200 focus:ring-opacity-50 rounded-lg"
              />
            </div>
            <div className="flex gap-2 overflow-x-auto w-full md:w-auto">
              <Button 
                variant={activeFilter === "all" ? "default" : "outline"}
                onClick={() => setActiveFilter("all")}
                className={activeFilter === "all" ? "bg-indigo-100 text-indigo-800 hover:bg-indigo-200 border-indigo-200" : ""}
              >
                Tous
              </Button>
              <Button 
                variant={activeFilter === "Actif" ? "default" : "outline"}
                onClick={() => setActiveFilter("Actif")}
                className={activeFilter === "Actif" ? "bg-green-100 text-green-800 hover:bg-green-200 border-green-200" : ""}
              >
                Actifs
              </Button>
              <Button 
                variant={activeFilter === "Inactif" ? "default" : "outline"}
                onClick={() => setActiveFilter("Inactif")}
                className={activeFilter === "Inactif" ? "bg-gray-100 text-gray-800 hover:bg-gray-200 border-gray-200" : ""}
              >
                Inactifs
              </Button>
            </div>
          </div>

          <div className="overflow-hidden rounded-xl border border-gray-200 bg-white">
            <Table>
              <TableHeader className="bg-gray-50">
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
                {loading ? (
                  <TableRow>
                    <TableCell colSpan={7} className="text-center py-10">
                      <div className="flex flex-col items-center justify-center">
                        <div className="animate-spin rounded-full h-10 w-10 border-b-2 border-indigo-600 mb-2"></div>
                        <p className="text-gray-500">Chargement des consultants...</p>
                      </div>
                    </TableCell>
                  </TableRow>
                ) : filteredConsultants.length > 0 ? (
                  filteredConsultants.map((consultant) => (
                    <TableRow key={consultant.id} className="hover:bg-gray-50 transition-colors">
                      <TableCell>
                        <div className="flex items-center gap-3">
                          <div className="h-10 w-10 rounded-full bg-indigo-100 flex items-center justify-center text-indigo-800 font-semibold">
                            {consultant.prenom.charAt(0)}{consultant.nom.charAt(0)}
                          </div>
                          <div>
                            <p className="font-medium text-gray-900">{consultant.prenom} {consultant.nom}</p>
                            <div className="flex items-center text-gray-500 text-sm">
                              <MapPinIcon className="h-3 w-3 mr-1" />
                              {consultant.ville || ""}, {consultant.pays}
                            </div>
                          </div>
                        </div>
                      </TableCell>
                      <TableCell>
                        <div className="text-sm">
                          <div className="flex items-center text-gray-600">
                            <MailIcon className="h-3 w-3 mr-2" />
                            {consultant.email}
                          </div>
                          <div className="flex items-center text-gray-600 mt-1">
                            <PhoneIcon className="h-3 w-3 mr-2" />
                            {consultant.telephone}
                          </div>
                        </div>
                      </TableCell>
                      <TableCell>
                        <div className="space-y-1">
                          <Badge 
                            className={`px-2 py-1 rounded-md border ${getDomainBadgeColor(consultant.domaine_principal)}`}
                          >
                            {getDomainName(consultant.domaine_principal)}
                          </Badge>
                          <p className="text-sm text-gray-600 mt-1">{consultant.specialite}</p>
                        </div>
                      </TableCell>
                      <TableCell>
                        <Badge 
                          className={`px-2 py-1 rounded-md border ${getExpertiseBadgeColor(consultant.expertise)}`}
                        >
                          {consultant.expertise}
                        </Badge>
                      </TableCell>
                      <TableCell>
                        <Badge 
                          className={`px-2 py-1 rounded-md border ${
                            consultant.statut === "Actif" 
                              ? "bg-green-50 text-green-700 border-green-200" 
                              : "bg-gray-50 text-gray-700 border-gray-200"
                          }`}
                        >
                          {consultant.statut}
                        </Badge>
                      </TableCell>
                      <TableCell>
                        <div className="flex flex-col">
                          <div className="flex items-center text-gray-600 text-sm">
                            <CalendarIcon className="h-3 w-3 mr-2" />
                            <span>Du {formatDate(consultant.date_debut_dispo)}</span>
                          </div>
                          <div className="flex items-center text-gray-600 text-sm mt-1">
                            <CalendarIcon className="h-3 w-3 mr-2" />
                            <span>Au {formatDate(consultant.date_fin_dispo)}</span>
                          </div>
                        </div>
                      </TableCell>
                      <TableCell className="text-right">
                        <div className="flex justify-end gap-2">
                          <Button 
                            variant="outline" 
                            size="sm" 
                            className="h-8 px-2 border-gray-200 hover:bg-gray-50 transition-colors" 
                            onClick={() => openCompetencesDialog(consultant.id)}
                            title="Voir les compétences"
                          >
                            <ListIcon className="w-4 h-4 text-indigo-600" />
                          </Button>
                          <Button 
                            variant="outline" 
                            size="sm" 
                            className="h-8 px-2 border-gray-200 hover:bg-gray-50 transition-colors" 
                            onClick={() => openDialog(consultant)} 
                            title="Modifier"
                          >
                            <Edit2Icon className="w-4 h-4 text-amber-600" />
                          </Button>
                          <Button 
                            variant="outline" 
                            size="sm" 
                            className="h-8 px-2 border-gray-200 hover:bg-gray-50 transition-colors" 
                            onClick={() => openDeleteDialog(consultant)} 
                            title="Supprimer"
                          >
                            <Trash2Icon className="w-4 h-4 text-red-600" />
                          </Button>
                        </div>
                      </TableCell>
                    </TableRow>
                  ))
                ) : (
                  <TableRow>
                    <TableCell colSpan={7} className="text-center py-10">
                      <div className="flex flex-col items-center justify-center">
                        <div className="bg-gray-100 rounded-full p-3 mb-3">
                          <SearchIcon className="h-6 w-6 text-gray-400" />
                        </div>
                        {searchTerm ? (
                          <div>
                            <p className="text-gray-500 mb-2">Aucun résultat trouvé pour "{searchTerm}"</p>
                            <Button 
                              variant="link" 
                              onClick={() => setSearchTerm("")}
                              className="text-indigo-600 hover:text-indigo-800"
                            >
                              Effacer la recherche
                            </Button>
                          </div>
                        ) : (
                          <p className="text-gray-500">Aucun consultant disponible</p>
                        )}
                      </div>
                    </TableCell>
                  </TableRow>
                )}
              </TableBody>
            </Table>
          </div>
        </div>
      </div>

      {/* Form Dialog */}
      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent className="max-w-md bg-white">
          <DialogHeader>
            <DialogTitle className="text-xl font-bold text-gray-800">{editing ? "Modifier" : "Ajouter"} un consultant</DialogTitle>
          </DialogHeader>
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="text-sm font-medium text-gray-700">Prénom</label>
                <Input 
                  placeholder="Prénom" 
                  name="prenom" 
                  value={formData.prenom || ''} 
                  onChange={(e) => setFormData({ ...formData, prenom: e.target.value })} 
                  required 
                  className="mt-1 border-gray-300 focus:border-indigo-300 focus:ring focus:ring-indigo-200 focus:ring-opacity-50"
                />
              </div>
              <div>
                <label className="text-sm font-medium text-gray-700">Nom</label>
                <Input 
                  placeholder="Nom" 
                  name="nom" 
                  value={formData.nom || ''} 
                  onChange={(e) => setFormData({ ...formData, nom: e.target.value })} 
                  required 
                  className="mt-1 border-gray-300 focus:border-indigo-300 focus:ring focus:ring-indigo-200 focus:ring-opacity-50"
                />
              </div>
            </div>
            <div>
              <label className="text-sm font-medium text-gray-700">Email</label>
              <div className="mt-1 relative">
                <MailIcon className="h-4 w-4 text-gray-400 absolute left-3 top-1/2 -translate-y-1/2" />
                <Input 
                  type="email" 
                  placeholder="Email" 
                  name="email" 
                  value={formData.email || ''} 
                  onChange={(e) => setFormData({ ...formData, email: e.target.value })} 
                  required 
                  className="pl-10 border-gray-300 focus:border-indigo-300 focus:ring focus:ring-indigo-200 focus:ring-opacity-50"
                />
              </div>
            </div>
            <div>
              <label className="text-sm font-medium text-gray-700">Téléphone</label>
              <div className="mt-1 relative">
                <PhoneIcon className="h-4 w-4 text-gray-400 absolute left-3 top-1/2 -translate-y-1/2" />
                <Input 
                  placeholder="Téléphone" 
                  name="telephone" 
                  value={formData.telephone || ''} 
                  onChange={(e) => setFormData({ ...formData, telephone: e.target.value })} 
                  required 
                  className="pl-10 border-gray-300 focus:border-indigo-300 focus:ring focus:ring-indigo-200 focus:ring-opacity-50"
                />
              </div>
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="text-sm font-medium text-gray-700">Pays</label>
                <div className="mt-1 relative">
                  <MapPinIcon className="h-4 w-4 text-gray-400 absolute left-3 top-1/2 -translate-y-1/2" />
                  <Input 
                    placeholder="Pays" 
                    name="pays" 
                    value={formData.pays || ''} 
                    onChange={(e) => setFormData({ ...formData, pays: e.target.value })} 
                    required 
                    className="pl-10 border-gray-300 focus:border-indigo-300 focus:ring focus:ring-indigo-200 focus:ring-opacity-50"
                  />
                </div>
              </div>
              <div>
                <label className="text-sm font-medium text-gray-700">Ville</label>
                <Input 
                  placeholder="Ville" 
                  name="ville" 
                  value={formData.ville || ''} 
                  onChange={(e) => setFormData({ ...formData, ville: e.target.value })} 
                  className="mt-1 border-gray-300 focus:border-indigo-300 focus:ring focus:ring-indigo-200 focus:ring-opacity-50"
                />
              </div>
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="text-sm font-medium text-gray-700">Disponible à partir de</label>
                <div className="mt-1 relative">
                  <CalendarIcon className="h-4 w-4 text-gray-400 absolute left-3 top-1/2 -translate-y-1/2" />
                  <Input 
                    type="date" 
                    name="date_debut_dispo" 
                    value={formData.date_debut_dispo || ''} 
                    onChange={(e) => setFormData({ ...formData, date_debut_dispo: e.target.value })} 
                    required 
                    className="pl-10 border-gray-300 focus:border-indigo-300 focus:ring focus:ring-indigo-200 focus:ring-opacity-50"
                  />
                </div>
              </div>
              <div>
                <label className="text-sm font-medium text-gray-700">Disponible jusqu'à</label>
                <div className="mt-1 relative">
                  <CalendarIcon className="h-4 w-4 text-gray-400 absolute left-3 top-1/2 -translate-y-1/2" />
                  <Input 
                    type="date" 
                    name="date_fin_dispo" 
                    value={formData.date_fin_dispo || ''} 
                    onChange={(e) => setFormData({ ...formData, date_fin_dispo: e.target.value })} 
                    required 
                    className="pl-10 border-gray-300 focus:border-indigo-300 focus:ring focus:ring-indigo-200 focus:ring-opacity-50"
                  />
                </div>
              </div>
            </div>
            <div>
              <label className="text-sm font-medium text-gray-700">Domaine principal</label>
              <div className="mt-1 relative">
                <BriefcaseIcon className="h-4 w-4 text-gray-400 absolute left-3 top-1/2 -translate-y-1/2" />
                <select 
                  name="domaine_principal" 
                  value={formData.domaine_principal || 'DIGITAL'} 
                  onChange={(e) => setFormData({ ...formData, domaine_principal: e.target.value })} 
                  className="w-full pl-10 p-2 border rounded border-gray-300 focus:border-indigo-300 focus:ring focus:ring-indigo-200 focus:ring-opacity-50"
                >
                  <option value="DIGITAL">Digital et Télécoms</option>
                  <option value="FINANCE">Secteur bancaire et financier</option>
                  <option value="ENERGIE">Transition énergétique</option>
                  <option value="INDUSTRIE">Industrie et Mines</option>
                </select>
              </div>
            </div>
            <div>
              <label className="text-sm font-medium text-gray-700">Sous-domaine</label>
              <Input 
                placeholder="Ex: Cybersécurité, Finance Islamique..." 
                name="specialite" 
                value={formData.specialite || ''} 
                onChange={(e) => setFormData({ ...formData, specialite: e.target.value })} 
                required 
                className="mt-1 border-gray-300 focus:border-indigo-300 focus:ring focus:ring-indigo-200 focus:ring-opacity-50"
              />
            </div>
            <div>
              <label className="text-sm font-medium text-gray-700">Niveau d'expertise</label>
              <select 
                name="expertise" 
                value={formData.expertise || 'Débutant'} 
                onChange={(e) => setFormData({ ...formData, expertise: e.target.value })} 
                className="w-full mt-1 p-2 border rounded border-gray-300 focus:border-indigo-300 focus:ring focus:ring-indigo-200 focus:ring-opacity-50"
              >
                <option value="Débutant">Débutant</option>
                <option value="Intermédiaire">Intermédiaire</option>
                <option value="Expert">Expert</option>
              </select>
            </div>
            {!editing && (
              <div>
                <label className="text-sm font-medium text-gray-700">Mot de passe</label>
                <div className="mt-1 relative">
                  <Input 
                    type="password" 
                    placeholder="Mot de passe"
                    name="password" 
                    onChange={(e) => setFormData({ ...formData, password: e.target.value })} 
                    required={!editing}
                    className="border-gray-300 focus:border-indigo-300 focus:ring focus:ring-indigo-200 focus:ring-opacity-50"
                  />
                </div>
              </div>
            )}
            <div>
              <label className="text-sm font-medium text-gray-700">CV (PDF)</label>
              <Input 
                type="file" 
                placeholder="CV"
                name="cv" 
                accept=".pdf,.doc,.docx"
                onChange={(e) => {
                  if (e.target.files && e.target.files[0]) {
                    setFormData({ ...formData, cv: e.target.files[0] })
                  }
                }}
                required={!editing}
                className="mt-1 border-gray-300 focus:border-indigo-300 focus:ring focus:ring-indigo-200 focus:ring-opacity-50"
              />
            </div>
            <DialogFooter className="mt-6 gap-2">
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
                className="bg-indigo-600 hover:bg-indigo-700 text-white"
              >
                {editing ? "Mettre à jour" : "Enregistrer"}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>

      {/* Delete Dialog */}
      <AlertDialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
        <AlertDialogContent className="bg-white">
          <AlertDialogHeader>
            <AlertDialogTitle className="text-xl font-bold text-gray-800">Confirmation de suppression</AlertDialogTitle>
            <AlertDialogDescription className="text-gray-600">
              Êtes-vous sûr de vouloir supprimer {consultantToDelete?.prenom} {consultantToDelete?.nom} ? 
              <br />Cette action est irréversible et toutes les données associées à ce consultant seront supprimées.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter className="gap-2">
            <AlertDialogCancel className="border-gray-300 text-gray-700 hover:bg-gray-50">Annuler</AlertDialogCancel>
            <AlertDialogAction 
              onClick={handleDelete}
              className="bg-red-600 hover:bg-red-700 text-white"
            >
              Supprimer
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      {/* Competences Dialog */}
      <Dialog open={competencesDialogOpen} onOpenChange={setCompetencesDialogOpen}>
        <DialogContent className="max-w-md bg-white">
          <DialogHeader>
            <DialogTitle className="text-xl font-bold text-gray-800">
              Compétences du consultant
            </DialogTitle>
          </DialogHeader>
          <div className="py-2">
            {loadingCompetences ? (
              <div className="flex justify-center p-4">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-indigo-600"></div>
              </div>
            ) : consultantCompetences.length > 0 ? (
              <div className="space-y-3 max-h-96 overflow-y-auto pr-2">
                {consultantCompetences.map((competence) => (
                  <div key={competence.id} className="p-3 bg-gray-50 rounded-lg border border-gray-100">
                    <div className="flex justify-between items-center mb-2">
                      <div className="font-medium text-gray-800">{competence.nom_competence}</div>
                      <Badge variant="outline" className="bg-indigo-50 text-indigo-700 border-indigo-200">
                        {competence.niveau}/5
                      </Badge>
                    </div>
                    {renderSkillLevel(competence.niveau)}
                  </div>
                ))}
              </div>
            ) : (
              <div className="flex flex-col items-center justify-center py-8 text-gray-500">
                <ListIcon className="h-12 w-12 text-gray-300 mb-3" />
                <p>Ce consultant n'a pas encore de compétences enregistrées.</p>
              </div>
            )}
          </div>
          <DialogFooter>
            <Button 
              onClick={() => setCompetencesDialogOpen(false)}
              className="bg-indigo-600 hover:bg-indigo-700 text-white"
            >
              Fermer
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </AdminLayout>
  );
};

export default Consultants;