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
  AlertCircleIcon,
  StarIcon,
  ClockIcon,
  CheckCircleIcon,
  TrendingUpIcon
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

// Composant pour gérer les critères d'évaluation avec design Apple
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
    <div className="space-y-4 mt-6 border-t border-gray-100 pt-6">
      <div className="flex justify-between items-center">
        <h3 className="text-lg font-semibold text-gray-900">Critères d'évaluation</h3>
        <Button 
          type="button" 
          variant="outline" 
          size="sm" 
          onClick={addCriteria}
          className="border-blue-200 text-blue-600 hover:bg-blue-50 rounded-full px-4"
        >
          <PlusIcon className="h-4 w-4 mr-2" /> Ajouter critère
        </Button>
      </div>
      
      {criteria.length === 0 ? (
        <div className="text-sm text-gray-500 p-6 text-center bg-gray-50 rounded-2xl">
          <div className="mb-2">📋</div>
          Aucun critère défini. Ajoutez des critères pour évaluer les consultants.
        </div>
      ) : (
        <div className="space-y-3">
          {criteria.map((criterion, index) => (
            <div key={index} className="flex gap-3 items-center p-4 rounded-2xl bg-gray-50 hover:bg-gray-100 transition-all duration-200">
              <Input
                placeholder="Nom du critère"
                value={criterion.name}
                onChange={(e) => updateCriteria(index, "name", e.target.value)}
                className="flex-grow border-none bg-white shadow-sm rounded-xl"
              />
              <div className="flex-shrink-0 w-32">
                <select
                  value={criterion.weight}
                  onChange={(e) => updateCriteria(index, "weight", parseInt(e.target.value))}
                  className="w-full h-10 px-3 py-2 bg-white border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
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
                className="h-10 w-10 text-gray-400 hover:text-red-500 rounded-full"
              >
                <XIcon className="h-4 w-4" />
              </Button>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

// Dialog avec design Apple
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
      <DialogContent className="max-w-3xl max-h-[95vh] overflow-y-auto bg-white rounded-3xl border-none shadow-2xl">
        <DialogHeader className="pb-6">
          <DialogTitle className="text-2xl font-bold text-gray-900">
            {offer ? "Modifier l'appel d'offres" : "Créer un nouvel appel d'offres"}
          </DialogTitle>
        </DialogHeader>
        
        {isLoading ? (
          <div className="flex justify-center py-12">
            <div className="animate-spin rounded-full h-10 w-10 border-b-2 border-blue-600"></div>
          </div>
        ) : (
          <form onSubmit={handleSubmit} className="space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-2">
                  Titre du projet *
                </label>
                <Input 
                  name="title" 
                  value={formData.title} 
                  onChange={handleChange} 
                  required 
                  placeholder="Ex: Refonte application mobile"
                  className="border-gray-200 rounded-xl h-12 text-base focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                />
              </div>
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-2">
                  Client *
                </label>
                <Input 
                  name="client" 
                  value={formData.client} 
                  onChange={handleChange} 
                  required 
                  placeholder="Ex: Banque du Maghreb"
                  className="border-gray-200 rounded-xl h-12 text-base focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                />
              </div>
            </div>
            
            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-2">
                Description *
              </label>
              <textarea 
                name="description" 
                value={formData.description} 
                onChange={handleChange} 
                required 
                placeholder="Description détaillée du projet, compétences requises, livrables attendus..." 
                className="w-full px-4 py-3 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 text-base"
                rows={5}
              />
            </div>
            
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-2">
                  Budget (MRU) *
                </label>
                <div className="relative">
                  <DollarSignIcon className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400 h-5 w-5" />
                  <Input 
                    name="budget" 
                    type="number" 
                    min="0"
                    step="0.01"
                    value={formData.budget} 
                    onChange={handleChange} 
                    required 
                    placeholder="0" 
                    className="pl-12 border-gray-200 rounded-xl h-12 text-base focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                  />
                </div>
              </div>
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-2">
                  Date de début *
                </label>
                <div className="relative">
                  <CalendarIcon className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400 h-5 w-5" />
                  <Input 
                    name="startDate" 
                    type="date" 
                    value={formData.startDate} 
                    onChange={handleChange} 
                    required 
                    className="pl-12 border-gray-200 rounded-xl h-12 text-base focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                  />
                </div>
              </div>
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-2">
                  Date de fin *
                </label>
                <div className="relative">
                  <CalendarIcon className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400 h-5 w-5" />
                  <Input 
                    name="endDate" 
                    type="date" 
                    value={formData.endDate} 
                    onChange={handleChange} 
                    required 
                    className="pl-12 border-gray-200 rounded-xl h-12 text-base focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                  />
                </div>
              </div>
            </div>
            
            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-2">
                Statut
              </label>
              <select 
                name="status" 
                value={formData.status} 
                onChange={handleChange} 
                className="w-full h-12 px-4 py-3 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 text-base"
              >
                <option value="A_venir">À venir</option>
                <option value="En_cours">En cours</option>
                <option value="Termine">Terminé</option>
              </select>
            </div>
            
            <CriteriaSection criteria={criteria} setCriteria={setCriteria} />
            
            <DialogFooter className="mt-8 flex justify-end gap-4 pt-6">
              <Button 
                type="button" 
                variant="outline" 
                onClick={onClose} 
                className="border-gray-300 rounded-xl px-6 py-3 text-base"
              >
                Annuler
              </Button>
              <Button 
                type="submit" 
                className="bg-blue-600 hover:bg-blue-700 rounded-xl px-6 py-3 text-base text-white"
              >
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
      budget: typeof backendOffer.budget === 'number' ? backendOffer.budget : parseFloat(backendOffer.budget) || 0,
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
      case "En_cours": return "bg-blue-100 text-blue-800 border-blue-200";
      case "A_venir": return "bg-amber-100 text-amber-800 border-amber-200";
      case "Termine": return "bg-green-100 text-green-800 border-green-200";
      default: return "bg-gray-100 text-gray-800 border-gray-200";
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
      return new Intl.DateTimeFormat('fr-FR', { 
        day: 'numeric', 
        month: 'short',
        year: 'numeric'
      }).format(date);
    } catch (error) {
      return dateString;
    }
  };

  const formatCurrency = (amount: number) => {
    try {
      // S'assurer que amount est un nombre valide
      const numAmount = typeof amount === 'number' ? amount : parseFloat(amount) || 0;
      
      if (isNaN(numAmount)) {
        return "0";
      }
      
      return new Intl.NumberFormat('fr-FR', {
        minimumFractionDigits: 0,
        maximumFractionDigits: 0,
      }).format(numAmount);
    } catch (error) {
      console.error("Erreur formatage currency:", error);
      return "0";
    }
  };

  // Statistiques calculées depuis les vraies données
  const stats = {
    total: offers.length,
    enCours: offers.filter(o => o.status === "En_cours").length,
    aVenir: offers.filter(o => o.status === "A_venir").length,
    termine: offers.filter(o => o.status === "Termine").length,
    budgetTotal: offers.reduce((sum, offer) => {
      const budget = typeof offer.budget === 'number' ? offer.budget : parseFloat(offer.budget) || 0;
      return sum + budget;
    }, 0)
  };

  return (
    <AdminLayout>
      <div className="min-h-screen bg-gray-50 -m-6 p-6">
        {/* Header avec style Apple */}
        <div className="bg-white border-b border-gray-200 -mx-6 -mt-6 mb-8 px-6 py-6">
          <div className="flex justify-between items-center">
            <div>
              <h1 className="text-3xl font-bold text-gray-900 tracking-tight">
                Appels d'offres
              </h1>
              <p className="mt-1 text-sm text-gray-500">
                Gérez vos projets et trouvez les meilleurs consultants
              </p>
            </div>
            <div className="flex items-center space-x-3">
              <button 
                onClick={fetchOffers}
                disabled={loading}
                className="inline-flex items-center px-4 py-2 border border-gray-300 rounded-full text-sm font-medium text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 transition-all duration-200"
              >
                <RefreshCwIcon className={`h-4 w-4 mr-2 ${loading ? 'animate-spin' : ''}`} />
                Actualiser
              </button>
              <button 
                onClick={() => {
                  setEditingOffer(undefined);
                  setDialogOpen(true);
                }}
                className="inline-flex items-center px-6 py-2 bg-blue-600 border border-transparent rounded-full text-sm font-medium text-white hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 shadow-sm transition-all duration-200"
              >
                <PlusIcon className="h-4 w-4 mr-2" />
                Nouveau projet
              </button>
            </div>
          </div>
        </div>

        {/* Stats Cards avec style Apple */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
          <div className="bg-white rounded-2xl shadow-sm border border-gray-200 p-6 hover:shadow-md transition-shadow duration-200">
            <div className="flex items-center">
              <div className="flex-shrink-0">
                <div className="w-12 h-12 bg-blue-100 rounded-xl flex items-center justify-center">
                  <BriefcaseIcon className="h-6 w-6 text-blue-600" />
                </div>
              </div>
              <div className="ml-4">
                <p className="text-sm font-medium text-gray-500">Total des projets</p>
                <p className="text-2xl font-bold text-gray-900">{stats.total}</p>
              </div>
            </div>
          </div>

          <div className="bg-white rounded-2xl shadow-sm border border-gray-200 p-6 hover:shadow-md transition-shadow duration-200">
            <div className="flex items-center">
              <div className="flex-shrink-0">
                <div className="w-12 h-12 bg-amber-100 rounded-xl flex items-center justify-center">
                  <ClockIcon className="h-6 w-6 text-amber-600" />
                </div>
              </div>
              <div className="ml-4">
                <p className="text-sm font-medium text-gray-500">En cours</p>
                <p className="text-2xl font-bold text-gray-900">{stats.enCours}</p>
              </div>
            </div>
          </div>

          <div className="bg-white rounded-2xl shadow-sm border border-gray-200 p-6 hover:shadow-md transition-shadow duration-200">
            <div className="flex items-center">
              <div className="flex-shrink-0">
                <div className="w-12 h-12 bg-emerald-100 rounded-xl flex items-center justify-center">
                  <CheckCircleIcon className="h-6 w-6 text-emerald-600" />
                </div>
              </div>
              <div className="ml-4">
                <p className="text-sm font-medium text-gray-500">Terminés</p>
                <p className="text-2xl font-bold text-gray-900">{stats.termine}</p>
              </div>
            </div>
          </div>

          <div className="bg-white rounded-2xl shadow-sm border border-gray-200 p-6 hover:shadow-md transition-shadow duration-200">
            <div className="flex items-center">
              <div className="flex-shrink-0">
                <div className="w-12 h-12 bg-green-100 rounded-xl flex items-center justify-center">
                  <TrendingUpIcon className="h-6 w-6 text-green-600" />
                </div>
              </div>
              <div className="ml-4">
                <p className="text-sm font-medium text-gray-500">Budget total</p>
                <p className="text-2xl font-bold text-gray-900">{formatCurrency(stats.budgetTotal)} MRU</p>
              </div>
            </div>
          </div>
        </div>

        {/* Barre de recherche style Apple */}
        <div className="bg-white rounded-2xl shadow-sm border border-gray-200 p-6 mb-8">
          <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between space-y-4 lg:space-y-0 lg:space-x-4">
            <div className="relative flex-1 max-w-lg">
              <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
                <SearchIcon className="h-5 w-5 text-gray-400" />
              </div>
              <input
                type="text"
                placeholder="Rechercher un projet ou un client..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="block w-full pl-12 pr-4 py-3 border border-gray-300 rounded-xl leading-5 bg-white placeholder-gray-500 focus:outline-none focus:placeholder-gray-400 focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all duration-200 text-base"
              />
            </div>
          </div>
        </div>

        {/* Liste des offres avec design Apple */}
        <div className="space-y-6">
          {loading ? (
            <div className="flex justify-center py-12">
              <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
              <p className="ml-3 text-gray-500">Chargement des données...</p>
            </div>
          ) : filteredOffers.length > 0 ? (
            filteredOffers.map((offer) => (
              <div
                key={offer.id}
                className="bg-white rounded-2xl shadow-sm border border-gray-200 hover:shadow-lg transition-all duration-300 group"
              >
                <div className="p-8">
                  <div className="flex items-start justify-between">
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center space-x-3 mb-4">
                        <h3 className="text-xl font-bold text-gray-900 group-hover:text-blue-600 transition-colors duration-200">
                          {offer.title}
                        </h3>
                        <Badge className={`rounded-full px-3 py-1 text-xs font-medium border ${getStatusBadgeStyles(offer.status)}`}>
                          {getStatusLabel(offer.status)}
                        </Badge>
                      </div>
                      
                      <div className="flex items-center text-sm text-gray-600 mb-4 space-x-6">
                        <div className="flex items-center">
                          <BriefcaseIcon className="h-4 w-4 mr-2 text-gray-400" />
                          <span className="font-medium">{offer.client}</span>
                        </div>
                        <div className="flex items-center">
                          <DollarSignIcon className="h-4 w-4 mr-2 text-gray-400" />
                          <span className="font-semibold text-gray-900">{formatCurrency(offer.budget)} MRU</span>
                        </div>
                      </div>

                      <p className="text-gray-700 text-sm mb-6 line-clamp-2 leading-relaxed">
                        {offer.description}
                      </p>

                      <div className="flex items-center justify-between">
                        <div className="flex items-center text-sm text-gray-500">
                          <CalendarIcon className="h-4 w-4 mr-2" />
                          <span>{formatDate(offer.startDate)} - {formatDate(offer.endDate)}</span>
                        </div>

                        <div className="flex items-center space-x-3">
                          <button
                            onClick={() => {
                              setEditingOffer(offer);
                              setDialogOpen(true);
                            }}
                            className="inline-flex items-center px-3 py-2 text-blue-600 hover:text-blue-800 hover:bg-blue-50 rounded-lg transition-all duration-200"
                          >
                            <Edit2Icon className="h-4 w-4 mr-1" />
                            Modifier
                          </button>
                          <button
                            onClick={() => navigate(`/matching/${offer.id}`)}
                            className="inline-flex items-center px-4 py-2 bg-blue-600 text-white text-sm font-medium rounded-lg hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 transition-all duration-200"
                          >
                            <UsersIcon className="h-4 w-4 mr-2" />
                            Matching
                          </button>
                          <button
                            onClick={() => openDeleteDialog(offer)}
                            className="inline-flex items-center px-3 py-2 text-red-600 hover:text-red-800 hover:bg-red-50 rounded-lg transition-all duration-200"
                          >
                            <Trash2Icon className="h-4 w-4" />
                          </button>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            ))
          ) : (
            <div className="text-center py-16">
              <div className="mx-auto w-24 h-24 bg-gray-100 rounded-full flex items-center justify-center mb-6">
                <BriefcaseIcon className="h-12 w-12 text-gray-400" />
              </div>
              <h3 className="text-lg font-medium text-gray-900 mb-2">
                {searchTerm ? "Aucun résultat trouvé" : "Aucun appel d'offres"}
              </h3>
              <p className="text-gray-500 mb-6">
                {searchTerm 
                  ? "Essayez de modifier vos critères de recherche." 
                  : "Commencez par créer votre premier projet."}
              </p>
              {!searchTerm && (
                <button 
                  onClick={() => {
                    setEditingOffer(undefined);
                    setDialogOpen(true);
                  }}
                  className="inline-flex items-center px-6 py-3 bg-blue-600 border border-transparent rounded-xl text-sm font-medium text-white hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 transition-all duration-200"
                >
                  <PlusIcon className="h-4 w-4 mr-2" />
                  Créer un appel d'offres
                </button>
              )}
            </div>
          )}
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
          <AlertDialogContent className="rounded-2xl">
            <AlertDialogHeader>
              <AlertDialogTitle className="text-xl font-bold">Confirmer la suppression</AlertDialogTitle>
              <AlertDialogDescription className="text-gray-600">
                Êtes-vous sûr de vouloir supprimer l'appel d'offres "{offerToDelete?.title}" ? 
                Cette action est irréversible et supprimera également tous les matchings associés.
              </AlertDialogDescription>
            </AlertDialogHeader>
            <AlertDialogFooter className="space-x-3">
              <AlertDialogCancel className="rounded-xl">Annuler</AlertDialogCancel>
              <AlertDialogAction 
                onClick={handleDelete} 
                className="bg-red-600 hover:bg-red-700 rounded-xl"
              >
                Supprimer
              </AlertDialogAction>
            </AlertDialogFooter>
          </AlertDialogContent>
        </AlertDialog>

        {/* Notification pour confirmer les données du backend */}
        {offers.length > 0 && (
          <div className="fixed bottom-4 right-4 bg-green-50 border border-green-200 rounded-xl p-4 shadow-lg">
            <div className="flex items-center">
              <CheckCircleIcon className="h-5 w-5 text-green-600 mr-2" />
              <p className="text-sm text-green-800">
                Données chargées depuis la base de données ({offers.length} projets)
              </p>
            </div>
          </div>
        )}
      </div>
    </AdminLayout>
  );
};

export default AppelsOffres;