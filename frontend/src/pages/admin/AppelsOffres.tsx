import React, { useState, useEffect } from "react";
import axios from "axios";
import { useNavigate } from "react-router-dom";
import { toast } from "sonner";
import AdminLayout from "@/components/admin/AdminLayout";

// Icônes
import {
  PlusIcon, 
  SearchIcon, 
  Edit2Icon, 
  Trash2Icon, 
  UsersIcon, 
  XIcon,
  FilterIcon,
  RefreshCwIcon,
  CalendarIcon,
  DollarSignIcon,
  ArrowRightIcon,
  BriefcaseIcon,
  AlertCircleIcon
} from "lucide-react";

// Composants UI
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Table, TableBody, TableCell, TableHead, TableHeader, TableRow,
} from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import {
  Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger, DialogFooter,
} from "@/components/ui/dialog";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { 
  Card,
  CardContent,
  CardHeader,
  CardTitle
} from "@/components/ui/card";

const API_BASE_URL = "http://localhost:8000/api";

// Types
interface Offer {
  id?: number;
  nom_projet: string;
  client: string;
  description: string;
  budget: number;
  date_debut: string;
  date_fin: string;
  statut: string;
}

interface FrontendOffer {
  id?: number;
  title: string;
  client: string;
  description: string;
  budget: number;
  startDate: string;
  endDate: string;
  status: string;
}

interface Criterion {
  nom_critere: string;
  poids: number;
}

interface FrontendCriterion {
  name: string;
  weight: number;
}

// Composant pour gérer les critères d'évaluation
const CriteriaSection = ({ 
  criteria, 
  setCriteria 
}: { 
  criteria: FrontendCriterion[], 
  setCriteria: React.Dispatch<React.SetStateAction<FrontendCriterion[]>>
}) => {
  const addCriteria = () => {
    setCriteria([...criteria, { name: "", weight: 1 }]);
  };

  const updateCriteria = (index: number, field: string, value: string | number) => {
    const newCriteria = [...criteria];
    if (field === "name") {
      newCriteria[index].name = value as string;
    } else if (field === "weight") {
      newCriteria[index].weight = value as number;
    }
    setCriteria(newCriteria);
  };

  const removeCriteria = (index: number) => {
    setCriteria(criteria.filter((_, i) => i !== index));
  };

  return (
    <div className="space-y-3 mt-4 border-t border-gray-100 pt-4">
      <div className="flex justify-between items-center">
        <h3 className="text-sm font-medium text-gray-700">Critères d'évaluation</h3>
        <Button 
          type="button" 
          variant="outline" 
          size="sm" 
          onClick={addCriteria}
          className="border-blue-200 text-blue-600 hover:bg-blue-50"
        >
          <PlusIcon className="h-3 w-3 mr-1" /> Ajouter critère
        </Button>
      </div>
      
      {criteria.length === 0 ? (
        <div className="text-sm text-gray-500 p-4 text-center bg-gray-50 rounded-md">
          Aucun critère défini. Ajoutez des critères pour évaluer les consultants.
        </div>
      ) : (
        criteria.map((criterion, index) => (
          <div key={index} className="flex gap-2 items-center p-2 rounded-md bg-gray-50">
            <Input
              placeholder="Nom du critère"
              value={criterion.name}
              onChange={(e) => updateCriteria(index, "name", e.target.value)}
              className="flex-grow"
            />
            <div className="flex-shrink-0 w-24">
              <select
                value={criterion.weight}
                onChange={(e) => updateCriteria(index, "weight", parseInt(e.target.value))}
                className="w-full h-10 px-3 py-2 bg-white border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              >
                {[1, 2, 3, 4, 5].map(num => (
                  <option key={num} value={num}>Poids {num}</option>
                ))}
              </select>
            </div>
            <Button
              type="button"
              variant="ghost"
              size="icon"
              onClick={() => removeCriteria(index)}
              className="h-9 w-9 text-gray-400 hover:text-red-500"
            >
              <XIcon className="h-4 w-4" />
            </Button>
          </div>
        ))
      )}
    </div>
  );
};

const OfferDialog = ({ 
  offer, 
  onSave, 
  onClose, 
  open 
}: { 
  offer?: FrontendOffer, 
  onSave: (data: FrontendOffer, criteria: FrontendCriterion[]) => void,
  onClose: () => void,
  open: boolean
}) => {
  const [formData, setFormData] = useState<FrontendOffer>(() => offer || {
    title: "",
    client: "",
    description: "",
    budget: 0,
    startDate: "",
    endDate: "",
    status: "A_venir",
  });

  const [criteria, setCriteria] = useState<FrontendCriterion[]>([]);
  const [isLoading, setIsLoading] = useState(false);

  useEffect(() => {
    if (offer) {
      setFormData(offer);
      
      // Charger les critères existants si l'offre existe
      if (offer.id) {
        setIsLoading(true);
        axios.get(`${API_BASE_URL}/appels/${offer.id}/criteres/`)
          .then(res => {
            const loadedCriteria = res.data.map((c: Criterion) => ({
              name: c.nom_critere,
              weight: c.poids
            }));
            setCriteria(loadedCriteria);
          })
          .catch(err => {
            console.error("Erreur lors du chargement des critères:", err);
            setCriteria([]);
          })
          .finally(() => {
            setIsLoading(false);
          });
      }
    } else {
      setFormData({
        title: "",
        client: "",
        description: "",
        budget: 0,
        startDate: "",
        endDate: "",
        status: "A_venir",
      });
      setCriteria([]);
    }
  }, [offer, open]);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ 
      ...prev, 
      [name]: name === 'budget' ? parseFloat(value) || 0 : value 
    }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    // Validation des dates
    if (new Date(formData.startDate) > new Date(formData.endDate)) {
      toast.error("La date de début doit être antérieure à la date de fin");
      return;
    }
    
    // Validation du budget
    if (formData.budget <= 0) {
      toast.error("Le budget doit être supérieur à 0");
      return;
    }
    
    onSave(formData, criteria);
  };

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="text-xl">
            {offer ? "Modifier l'appel d'offres" : "Ajouter un appel d'offres"}
          </DialogTitle>
        </DialogHeader>
        
        {isLoading ? (
          <div className="flex justify-center py-8">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
          </div>
        ) : (
          <form onSubmit={handleSubmit} className="space-y-4 pt-2">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Titre du projet *
                </label>
                <Input 
                  name="title" 
                  value={formData.title} 
                  onChange={handleChange} 
                  required 
                  placeholder="Ex: Refonte application mobile"
                  className="border-gray-300"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Client *
                </label>
                <Input 
                  name="client" 
                  value={formData.client} 
                  onChange={handleChange} 
                  required 
                  placeholder="Ex: Banque du Maghreb"
                  className="border-gray-300"
                />
              </div>
            </div>
            
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Description *
              </label>
              <textarea 
                name="description" 
                value={formData.description} 
                onChange={handleChange} 
                required 
                placeholder="Description détaillée du projet, compétences requises, livrables attendus..." 
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                rows={4}
              />
            </div>
            
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Budget (MRU) *
                </label>
                <div className="relative">
                  <DollarSignIcon className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 h-4 w-4" />
                  <Input 
                    name="budget" 
                    type="number" 
                    min="0"
                    step="0.01"
                    value={formData.budget} 
                    onChange={handleChange} 
                    required 
                    placeholder="0" 
                    className="pl-10 border-gray-300"
                  />
                </div>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Date de début *
                </label>
                <div className="relative">
                  <CalendarIcon className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 h-4 w-4" />
                  <Input 
                    name="startDate" 
                    type="date" 
                    value={formData.startDate} 
                    onChange={handleChange} 
                    required 
                    className="pl-10 border-gray-300"
                  />
                </div>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Date de fin *
                </label>
                <div className="relative">
                  <CalendarIcon className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 h-4 w-4" />
                  <Input 
                    name="endDate" 
                    type="date" 
                    value={formData.endDate} 
                    onChange={handleChange} 
                    required 
                    className="pl-10 border-gray-300"
                  />
                </div>
              </div>
            </div>
            
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Statut
              </label>
              <select 
                name="status" 
                value={formData.status} 
                onChange={handleChange} 
                className="w-full h-10 px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              >
                <option value="A_venir">À venir</option>
                <option value="En_cours">En cours</option>
                <option value="Termine">Terminé</option>
              </select>
            </div>
            
            <CriteriaSection criteria={criteria} setCriteria={setCriteria} />
            
            <DialogFooter className="mt-6 flex justify-end gap-3">
              <Button type="button" variant="outline" onClick={onClose} className="border-gray-300">
                Annuler
              </Button>
              <Button type="submit" className="bg-blue-600 hover:bg-blue-700">
                {offer ? "Mettre à jour" : "Créer l'appel d'offres"}
              </Button>
            </DialogFooter>
          </form>
        )}
      </DialogContent>
    </Dialog>
  );
};

const AppelsOffres = () => {
  const [offers, setOffers] = useState<FrontendOffer[]>([]);
  const [searchTerm, setSearchTerm] = useState("");
  const [editingOffer, setEditingOffer] = useState<FrontendOffer | undefined>(undefined);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [offerToDelete, setOfferToDelete] = useState<FrontendOffer | null>(null);

  const navigate = useNavigate();

  // Fonction pour adapter les données du backend vers le frontend
  const adaptOfferFromBackend = (backendOffer: Offer): FrontendOffer => {
    return {
      id: backendOffer.id,
      title: backendOffer.nom_projet,
      client: backendOffer.client,
      description: backendOffer.description,
      budget: backendOffer.budget,
      startDate: backendOffer.date_debut,
      endDate: backendOffer.date_fin,
      status: backendOffer.statut
    };
  };

  // Fonction pour adapter les données du frontend vers le backend
  const adaptOfferToBackend = (frontendOffer: FrontendOffer): Offer => {
    return {
      id: frontendOffer.id,
      nom_projet: frontendOffer.title,
      client: frontendOffer.client,
      description: frontendOffer.description,
      budget: frontendOffer.budget,
      date_debut: frontendOffer.startDate,
      date_fin: frontendOffer.endDate,
      statut: frontendOffer.status
    };
  };

  const fetchOffers = async () => {
    setLoading(true);
    try {
      console.log("Récupération des appels d'offres...");
      const response = await axios.get(`${API_BASE_URL}/appels/`);
      console.log("Réponse reçue:", response.data);
      
      // Adapter les données pour le frontend
      const adaptedOffers = response.data.map((offer: Offer) => adaptOfferFromBackend(offer));
      setOffers(adaptedOffers);
      
      toast.success(`${adaptedOffers.length} appel(s) d'offres chargé(s)`);
    } catch (error) {
      console.error("Erreur lors du chargement des appels d'offres:", error);
      
      if (axios.isAxiosError(error)) {
        if (error.response?.status === 404) {
          toast.error("Endpoint non trouvé. Vérifiez la configuration du serveur.");
        } else if (error.response?.status >= 500) {
          toast.error("Erreur serveur. Veuillez réessayer plus tard.");
        } else if (error.response?.status === 403) {
          toast.error("Accès non autorisé.");
        } else {
          toast.error(`Erreur HTTP ${error.response?.status}: ${error.response?.statusText}`);
        }
      } else if (error.code === 'NETWORK_ERROR') {
        toast.error("Erreur réseau. Vérifiez votre connexion.");
      } else {
        toast.error("Erreur lors du chargement des appels d'offres");
      }
      
      setOffers([]);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchOffers();
  }, []);

  const handleSave = async (offerData: FrontendOffer, criteria: FrontendCriterion[]) => {
    try {
      toast.loading(offerData.id ? "Mise à jour en cours..." : "Création en cours...");
      
      // Adapter les données pour le backend
      const backendData = adaptOfferToBackend(offerData);
      
      let offerId: number;
      let updatedOffer: FrontendOffer;

      if (offerData.id) {
        // Mettre à jour l'appel d'offre existant
        const response = await axios.put(`${API_BASE_URL}/admin/appels/${offerData.id}/`, backendData);
        offerId = response.data.id;
        updatedOffer = adaptOfferFromBackend(response.data);
        
        setOffers(offers.map(o => o.id === offerData.id ? updatedOffer : o));
        toast.dismiss();
        toast.success("Appel d'offres modifié avec succès");
      } else {
        // Créer un nouvel appel d'offre
        const response = await axios.post(`${API_BASE_URL}/admin/appels/`, backendData);
        offerId = response.data.id;
        updatedOffer = adaptOfferFromBackend(response.data);
        
        setOffers([...offers, updatedOffer]);
        toast.dismiss();
        toast.success("Appel d'offres ajouté avec succès");
      }

      // Sauvegarder les critères
      if (criteria.length > 0) {
        try {
          // D'abord supprimer les critères existants
          await axios.delete(`${API_BASE_URL}/appels/${offerId}/criteres/`);
          
          // Ensuite ajouter les nouveaux critères
          for (const criterion of criteria) {
            await axios.post(`${API_BASE_URL}/appels/${offerId}/criteres/`, {
              nom_critere: criterion.name,
              poids: criterion.weight,
              appel_offre: offerId
            });
          }
        } catch (criteriaError) {
          console.error("Erreur lors de la sauvegarde des critères:", criteriaError);
          toast.warning("Appel d'offres sauvegardé, mais erreur avec les critères");
        }
      }
    } catch (error) {
      console.error("Erreur lors de l'enregistrement:", error);
      toast.dismiss();
      
      if (axios.isAxiosError(error)) {
        if (error.response?.status === 400) {
          toast.error("Données invalides. Vérifiez les champs obligatoires.");
        } else if (error.response?.status === 500) {
          toast.error("Erreur serveur lors de l'enregistrement");
        } else {
          toast.error(`Erreur ${error.response?.status}: ${error.response?.statusText}`);
        }
      } else {
        toast.error("Erreur lors de l'enregistrement");
      }
    }
    
    setEditingOffer(undefined);
    setDialogOpen(false);
  };

  const openDeleteDialog = (offer: FrontendOffer) => {
    setOfferToDelete(offer);
    setDeleteDialogOpen(true);
  };

  const handleDelete = async () => {
    if (!offerToDelete || !offerToDelete.id) return;
    
    try {
      toast.loading("Suppression en cours...");
      await axios.delete(`${API_BASE_URL}/admin/appels/${offerToDelete.id}/`);
      setOffers(offers.filter(o => o.id !== offerToDelete.id));
      toast.dismiss();
      toast.success("Appel d'offres supprimé avec succès");
    } catch (error) {
      console.error("Erreur lors de la suppression:", error);
      toast.dismiss();
      toast.error("Erreur lors de la suppression");
    } finally {
      setDeleteDialogOpen(false);
      setOfferToDelete(null);
    }
  };

  const getStatusBadgeStyles = (status: string) => {
    switch (status) {
      case "En_cours": return "bg-blue-100 text-blue-800";
      case "A_venir": return "bg-amber-100 text-amber-800";
      case "Termine": return "bg-green-100 text-green-800";
      default: return "bg-gray-100 text-gray-800";
    }
  };

  const getStatusLabel = (status: string) => {
    switch (status) {
      case "En_cours": return "En cours";
      case "A_venir": return "À venir";
      case "Termine": return "Terminé";
      default: return status;
    }
  };

  const filteredOffers = offers.filter(offer =>
    offer.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
    offer.client.toLowerCase().includes(searchTerm.toLowerCase()) ||
    getStatusLabel(offer.status).toLowerCase().includes(searchTerm.toLowerCase())
  );

  const formatDate = (dateString: string) => {
    try {
      const date = new Date(dateString);
      return new Intl.DateTimeFormat('fr-FR').format(date);
    } catch (error) {
      return dateString;
    }
  };

  const formatCurrency = (amount: number) => {
    try {
      return new Intl.NumberFormat('fr-FR', {
        minimumFractionDigits: 0,
        maximumFractionDigits: 0,
      }).format(amount);
    } catch (error) {
      return amount.toString();
    }
  };

  return (
    <AdminLayout>
      <div className="space-y-6">
        <div className="flex flex-col md:flex-row md:justify-between md:items-center gap-4">
          <div>
            <h1 className="text-2xl font-bold text-gray-900">Appels d'offres</h1>
            <p className="text-sm text-gray-500 mt-1">
              Gérez les appels d'offres et les critères d'évaluation
            </p>
          </div>
          <div className="flex flex-col sm:flex-row gap-3">
            <Button 
              variant="outline" 
              onClick={fetchOffers} 
              disabled={loading}
              className="flex items-center gap-2 border-gray-300"
            >
              <RefreshCwIcon className={`h-4 w-4 ${loading ? 'animate-spin' : ''}`} />
              Actualiser
            </Button>
            <div className="relative">
              <SearchIcon className="h-4 w-4 absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
              <Input 
                placeholder="Rechercher..." 
                value={searchTerm} 
                onChange={(e) => setSearchTerm(e.target.value)} 
                className="pl-10 w-full sm:w-60 focus:border-blue-300 focus:ring-blue-300"
              />
            </div>
            <Button 
              onClick={() => {
                setEditingOffer(undefined);
                setDialogOpen(true);
              }} 
              className="bg-blue-600 hover:bg-blue-700"
            >
              <PlusIcon className="h-4 w-4 mr-2" />
              Ajouter
            </Button>
          </div>
        </div>
        
        {/* Boîte de dialogue pour l'ajout/modification d'offre */}
        {dialogOpen && (
          <OfferDialog 
            key={editingOffer?.id || "new"} 
            offer={editingOffer} 
            onSave={handleSave} 
            onClose={() => setDialogOpen(false)}
            open={dialogOpen}
          />
        )}
        
        {/* Boîte de dialogue de confirmation de suppression */}
        <AlertDialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
          <AlertDialogContent>
            <AlertDialogHeader>
              <AlertDialogTitle>Confirmer la suppression</AlertDialogTitle>
              <AlertDialogDescription>
                Êtes-vous sûr de vouloir supprimer l'appel d'offres "{offerToDelete?.title}" ? 
                Cette action est irréversible et supprimera également tous les matchings associés.
              </AlertDialogDescription>
            </AlertDialogHeader>
            <AlertDialogFooter>
              <AlertDialogCancel>Annuler</AlertDialogCancel>
              <AlertDialogAction onClick={handleDelete} className="bg-red-600 hover:bg-red-700">
                Supprimer
              </AlertDialogAction>
            </AlertDialogFooter>
          </AlertDialogContent>
        </AlertDialog>

        <Card className="shadow-sm border-none">
          {loading ? (
            <div className="flex justify-center items-center py-20">
              <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
              <p className="ml-3 text-gray-500">Chargement des données...</p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <Table>
                <TableHeader className="bg-gray-50">
                  <TableRow>
                    <TableHead className="font-medium">Projet</TableHead>
                    <TableHead className="font-medium">Client</TableHead>
                    <TableHead className="font-medium">Budget</TableHead>
                    <TableHead className="font-medium">Période</TableHead>
                    <TableHead className="font-medium">Statut</TableHead>
                    <TableHead className="text-right font-medium">Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filteredOffers.length > 0 ? (
                    filteredOffers.map((offer) => (
                      <TableRow key={offer.id} className="hover:bg-gray-50">
                        <TableCell>
                          <div className="flex items-center">
                            <div className="bg-blue-100 p-2 rounded-md mr-3 flex-shrink-0">
                              <BriefcaseIcon className="h-5 w-5 text-blue-600" />
                            </div>
                            <div className="min-w-0 flex-1">
                              <div className="font-medium text-gray-900 truncate">{offer.title}</div>
                              <div className="text-sm text-gray-500 max-w-xs truncate">
                                {offer.description}
                              </div>
                            </div>
                          </div>
                        </TableCell>
                        <TableCell className="font-medium">{offer.client}</TableCell>
                        <TableCell className="font-medium text-gray-900">
                          {formatCurrency(offer.budget)} MRU
                        </TableCell>
                        <TableCell>
                          <div className="flex flex-col text-sm space-y-1">
                            <div className="flex items-center text-gray-500">
                              <CalendarIcon className="h-3 w-3 mr-1 flex-shrink-0" /> 
                              <span className="truncate">Début: {formatDate(offer.startDate)}</span>
                            </div>
                            <div className="flex items-center text-gray-500">
                              <CalendarIcon className="h-3 w-3 mr-1 flex-shrink-0" /> 
                              <span className="truncate">Fin: {formatDate(offer.endDate)}</span>
                            </div>
                          </div>
                        </TableCell>
                        <TableCell>
                          <Badge className={getStatusBadgeStyles(offer.status)}>
                            {getStatusLabel(offer.status)}
                          </Badge>
                        </TableCell>
                        <TableCell className="text-right">
                          <div className="flex gap-1 justify-end">
                            <Button 
                              variant="ghost" 
                              size="sm" 
                              onClick={() => { 
                                setEditingOffer(offer); 
                                setDialogOpen(true); 
                              }}
                              title="Modifier"
                              className="h-8 w-8 p-0 text-blue-600 hover:text-blue-800 hover:bg-blue-50"
                            >
                              <Edit2Icon className="h-4 w-4" />
                            </Button>
                            <Button 
                              variant="ghost" 
                              size="sm" 
                              onClick={() => navigate(`/matching/${offer.id}`)}
                              title="Matching avec consultants"
                              className="h-8 w-8 p-0 text-blue-600 hover:text-blue-800 hover:bg-blue-50"
                            >
                              <UsersIcon className="h-4 w-4" />
                            </Button>
                            <Button 
                              variant="ghost" 
                              size="sm" 
                              onClick={() => openDeleteDialog(offer)}
                              title="Supprimer"
                              className="h-8 w-8 p-0 text-red-500 hover:text-red-700 hover:bg-red-50"
                            >
                              <Trash2Icon className="h-4 w-4" />
                            </Button>
                          </div>
                        </TableCell>
                      </TableRow>
                    ))
                  ) : (
                    <TableRow>
                      <TableCell colSpan={6} className="h-40 text-center">
                        {searchTerm ? (
                          <div className="py-8">
                            <AlertCircleIcon className="h-12 w-12 text-gray-300 mx-auto mb-3" />
                            <p className="text-gray-500 mb-2">Aucun résultat trouvé pour "{searchTerm}"</p>
                            <Button 
                              variant="outline" 
                              onClick={() => setSearchTerm("")}
                              className="mt-2 mx-auto border-blue-200 text-blue-600 hover:bg-blue-50"
                            >
                              Effacer la recherche
                            </Button>
                          </div>
                        ) : (
                          <div className="py-8">
                            <BriefcaseIcon className="h-12 w-12 text-gray-300 mx-auto mb-3" />
                            <p className="text-gray-500 mb-2">Aucun appel d'offres disponible</p>
                            <Button 
                              variant="outline" 
                              onClick={() => {
                                setEditingOffer(undefined);
                                setDialogOpen(true);
                              }}
                              className="mt-2 mx-auto border-blue-200 text-blue-600 hover:bg-blue-50"
                            >
                              Créer un premier appel d'offres
                            </Button>
                          </div>
                        )}
                      </TableCell>
                    </TableRow>
                  )}
                </TableBody>
              </Table>
            </div>
          )}
        </Card>

        {/* Statistiques rapides */}
        {offers.length > 0 && (
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mt-6">
            <Card>
              <CardContent className="p-4">
                <div className="flex items-center">
                  <div className="bg-blue-100 p-2 rounded-md mr-3">
                    <BriefcaseIcon className="h-5 w-5 text-blue-600" />
                  </div>
                  <div>
                    <p className="text-sm font-medium text-gray-500">Total</p>
                    <p className="text-2xl font-bold text-gray-900">{offers.length}</p>
                  </div>
                </div>
              </CardContent>
            </Card>
            
            <Card>
              <CardContent className="p-4">
                <div className="flex items-center">
                  <div className="bg-amber-100 p-2 rounded-md mr-3">
                    <CalendarIcon className="h-5 w-5 text-amber-600" />
                  </div>
                  <div>
                    <p className="text-sm font-medium text-gray-500">En cours</p>
                    <p className="text-2xl font-bold text-gray-900">
                      {offers.filter(o => o.status === "En_cours").length}
                    </p>
                  </div>
                </div>
              </CardContent>
            </Card>
            
            <Card>
              <CardContent className="p-4">
                <div className="flex items-center">
                  <div className="bg-green-100 p-2 rounded-md mr-3">
                    <DollarSignIcon className="h-5 w-5 text-green-600" />
                  </div>
                  <div>
                    <p className="text-sm font-medium text-gray-500">Budget total</p>
                    <p className="text-2xl font-bold text-gray-900">
                      {formatCurrency(offers.reduce((sum, offer) => sum + offer.budget, 0))} MRU
                    </p>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        )}
      </div>
    </AdminLayout>
  );
};

export default AppelsOffres;