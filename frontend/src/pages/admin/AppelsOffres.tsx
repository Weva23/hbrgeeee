import React, { useState, useEffect } from "react";
import axios from "axios";
import { useNavigate } from "react-router-dom";
import { toast } from "sonner";
import AdminLayout from "@/components/admin/AdminLayout";

// Icônes
import {
  SearchIcon, 
  Edit2Icon, 
  UsersIcon, 
  XIcon,
  RefreshCwIcon,
  CalendarIcon,
  BriefcaseIcon,
  AlertCircleIcon,
  StarIcon,
  ClockIcon,
  CheckCircleIcon,
  ExternalLinkIcon,
  FileTextIcon,
  TagIcon,
  TrendingUpIcon,
  MapPinIcon,
  DollarSignIcon
} from "lucide-react";

// Composants UI
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import {
  Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter,
} from "@/components/ui/dialog";
import { 
  Card,
  CardContent,
  CardHeader,
  CardTitle
} from "@/components/ui/card";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";

const API_BASE_URL = "http://localhost:8000/api";

// Interface mise à jour pour le nouveau modèle
interface AppelOffre {
  id: number;
  titre: string;
  date_de_publication?: string;
  date_limite?: string;
  client?: string;
  type_d_appel_d_offre?: string;
  description?: string;
  critere_evaluation?: string;
  documents?: string;
  lien_site?: string;
  created_at: string;
  updated_at: string;
  // Champs calculés
  is_expired?: boolean;
  days_remaining?: number;
}

interface Criterion {
  nom_critere: string;
  poids: number;
}

// Dialog pour éditer les détails d'un appel d'offre
const EditOfferDialog = ({ 
  offer, 
  onSave, 
  onClose, 
  open 
}: { 
  offer: AppelOffre, 
  onSave: (data: Partial<AppelOffre>, criteria: Criterion[]) => void,
  onClose: () => void,
  open: boolean
}) => {
  const [formData, setFormData] = useState<Partial<AppelOffre>>({});
  const [criteria, setCriteria] = useState<Criterion[]>([]);
  const [isLoading, setIsLoading] = useState(false);

  useEffect(() => {
    if (offer && open) {
      setFormData({
        description: offer.description || "",
        critere_evaluation: offer.critere_evaluation || "",
        type_d_appel_d_offre: offer.type_d_appel_d_offre || ""
      });
      
      // Charger les critères existants
      if (offer.id) {
        setIsLoading(true);
        axios.get(`${API_BASE_URL}/appels/${offer.id}/criteres/`)
          .then(res => {
            const loadedCriteria = res.data.criteres || res.data || [];
            const formattedCriteria = loadedCriteria.map((c: any) => ({
              nom_critere: c.nom_critere || c.name || '',
              poids: c.poids || c.weight || 1
            }));
            setCriteria(formattedCriteria);
          })
          .catch(err => {
            console.warn("Pas de critères existants ou erreur:", err);
            setCriteria([]);
          })
          .finally(() => {
            setIsLoading(false);
          });
      }
    } else {
      setFormData({});
      setCriteria([]);
    }
  }, [offer, open]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    onSave(formData, criteria);
  };

  const addCriteria = () => {
    setCriteria([...criteria, { nom_critere: "", poids: 1 }]);
  };

  const updateCriteria = (index: number, field: string, value: string | number) => {
    const newCriteria = [...criteria];
    if (field === "nom_critere") {
      newCriteria[index].nom_critere = value as string;
    } else if (field === "poids") {
      newCriteria[index].poids = value as number;
    }
    setCriteria(newCriteria);
  };

  const removeCriteria = (index: number) => {
    setCriteria(criteria.filter((_, i) => i !== index));
  };

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="max-w-4xl max-h-[95vh] overflow-y-auto bg-white rounded-3xl border-none shadow-2xl">
        <DialogHeader className="pb-6">
          <DialogTitle className="text-2xl font-bold text-gray-900 flex items-center gap-2">
            <Edit2Icon className="h-6 w-6 text-blue-600" />
            Enrichir l'appel d'offres
          </DialogTitle>
          <p className="text-gray-500 mt-2">
            Ajoutez des informations détaillées pour améliorer le matching avec les consultants
          </p>
        </DialogHeader>
        
        {isLoading ? (
          <div className="flex justify-center py-12">
            <div className="animate-spin rounded-full h-10 w-10 border-b-2 border-blue-600"></div>
          </div>
        ) : (
          <form onSubmit={handleSubmit} className="space-y-6">
            {/* Informations scrapées (lecture seule) */}
            <div className="bg-gray-50 rounded-2xl p-6">
              <h3 className="text-lg font-semibold text-gray-800 mb-4 flex items-center gap-2">
                <FileTextIcon className="h-5 w-5 text-gray-600" />
                Informations extraites automatiquement
              </h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
                <div>
                  <label className="block text-gray-600 font-medium mb-1">Titre</label>
                  <p className="bg-white p-3 rounded-lg border border-gray-200">{offer.titre}</p>
                </div>
                <div>
                  <label className="block text-gray-600 font-medium mb-1">Client</label>
                  <p className="bg-white p-3 rounded-lg border border-gray-200">{offer.client || "Non spécifié"}</p>
                </div>
                <div>
                  <label className="block text-gray-600 font-medium mb-1">Date de publication</label>
                  <p className="bg-white p-3 rounded-lg border border-gray-200">
                    {offer.date_de_publication ? new Date(offer.date_de_publication).toLocaleDateString('fr-FR') : "Non spécifiée"}
                  </p>
                </div>
                <div>
                  <label className="block text-gray-600 font-medium mb-1">Date limite</label>
                  <p className="bg-white p-3 rounded-lg border border-gray-200">
                    {offer.date_limite ? new Date(offer.date_limite).toLocaleDateString('fr-FR') : "Non spécifiée"}
                  </p>
                </div>
                {offer.lien_site && (
                  <div className="col-span-2">
                    <label className="block text-gray-600 font-medium mb-1">Source</label>
                    <a 
                      href={offer.lien_site} 
                      target="_blank" 
                      rel="noopener noreferrer"
                      className="inline-flex items-center gap-2 text-blue-600 hover:text-blue-800 bg-white p-3 rounded-lg border border-gray-200 w-full"
                    >
                      <ExternalLinkIcon className="h-4 w-4" />
                      Voir l'annonce originale
                    </a>
                  </div>
                )}
              </div>
            </div>

            {/* Champs d'enrichissement */}
            <div className="space-y-6">
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-2">
                  Type d'appel d'offres
                </label>
                <Select 
                  value={formData.type_d_appel_d_offre || "all"} 
                  onValueChange={(value) => setFormData(prev => ({...prev, type_d_appel_d_offre: value === "all" ? "" : value}))}
                >
                  <SelectTrigger className="border-gray-200 rounded-xl h-12">
                    <SelectValue placeholder="Sélectionner le type" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">Non spécifié</SelectItem>
                    <SelectItem value="Appel d'offres ouvert">Appel d'offres ouvert</SelectItem>
                    <SelectItem value="Appel d'offres restreint">Appel d'offres restreint</SelectItem>
                    <SelectItem value="Consultation">Consultation</SelectItem>
                    <SelectItem value="Manifestation d'intérêt">Manifestation d'intérêt</SelectItem>
                    <SelectItem value="Concours">Concours</SelectItem>
                    <SelectItem value="Autre">Autre</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-2">
                  Description détaillée du projet
                </label>
                <Textarea 
                  name="description" 
                  value={formData.description || ""} 
                  onChange={(e) => setFormData(prev => ({...prev, description: e.target.value}))}
                  placeholder="Décrivez le projet en détail : objectifs, livrables attendus, compétences techniques requises, contexte, contraintes..." 
                  className="border-gray-200 rounded-xl min-h-[120px] text-base focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                  rows={6}
                />
                <p className="text-xs text-gray-500 mt-1">
                  Plus la description est détaillée, meilleur sera le matching avec les consultants
                </p>
              </div>
              
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-2">
                  Critères d'évaluation des candidatures
                </label>
                <Textarea 
                  name="critere_evaluation" 
                  value={formData.critere_evaluation || ""} 
                  onChange={(e) => setFormData(prev => ({...prev, critere_evaluation: e.target.value}))}
                  placeholder="Expérience minimale requise, certifications, diplômes, compétences spécifiques, références similaires..." 
                  className="border-gray-200 rounded-xl min-h-[100px] text-base focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                  rows={4}
                />
              </div>
            </div>

            {/* Critères structurés pour le matching */}
            <div className="space-y-4 mt-6 border-t border-gray-100 pt-6">
              <div className="flex justify-between items-center">
                <div>
                  <h3 className="text-lg font-semibold text-gray-900">Critères de matching</h3>
                  <p className="text-sm text-gray-500">Définissez les compétences clés pour un matching précis</p>
                </div>
                <Button 
                  type="button" 
                  variant="outline" 
                  size="sm" 
                  onClick={addCriteria}
                  className="border-blue-200 text-blue-600 hover:bg-blue-50 rounded-full px-4"
                >
                  <StarIcon className="h-4 w-4 mr-2" /> Ajouter critère
                </Button>
              </div>
              
              {criteria.length === 0 ? (
                <div className="text-sm text-gray-500 p-6 text-center bg-gray-50 rounded-2xl">
                  <div className="mb-2">🎯</div>
                  Ajoutez des critères spécifiques pour améliorer la précision du matching
                  <div className="text-xs mt-2 text-gray-400">
                    Ex: JavaScript, Gestion de projet, Expérience bancaire, etc.
                  </div>
                </div>
              ) : (
                <div className="space-y-3">
                  {criteria.map((criterion, index) => (
                    <div key={index} className="flex gap-3 items-center p-4 rounded-2xl bg-gray-50 hover:bg-gray-100 transition-all duration-200">
                      <Input
                        placeholder="Nom du critère (ex: React.js, Audit financier, SAP)"
                        value={criterion.nom_critere}
                        onChange={(e) => updateCriteria(index, "nom_critere", e.target.value)}
                        className="flex-grow border-none bg-white shadow-sm rounded-xl"
                      />
                      <div className="flex-shrink-0 w-32">
                        <select
                          value={criterion.poids}
                          onChange={(e) => updateCriteria(index, "poids", parseInt(e.target.value))}
                          className="w-full h-10 px-3 py-2 bg-white border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                        >
                          {[1, 2, 3, 4, 5].map(num => (
                            <option key={num} value={num}>
                              {num === 1 ? 'Souhaitable' : 
                               num === 2 ? 'Important' :
                               num === 3 ? 'Très important' :
                               num === 4 ? 'Essentiel' : 'Critique'}
                            </option>
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
                Enregistrer et lancer le matching
              </Button>
            </DialogFooter>
          </form>
        )}
      </DialogContent>
    </Dialog>
  );
};

const AppelsOffres = () => {
  // ✅ CORRECTION: Initialiser avec "all" au lieu de ""
  const [offers, setOffers] = useState<AppelOffre[]>([]);
  const [searchTerm, setSearchTerm] = useState("");
  const [editingOffer, setEditingOffer] = useState<AppelOffre | undefined>(undefined);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const [filterType, setFilterType] = useState<string>("all");
  const [filterClient, setFilterClient] = useState<string>("all");
  const [filterStatus, setFilterStatus] = useState<string>("all");

  const navigate = useNavigate();

  // ✅ CORRECTION: Amélioration de fetchOffers avec gestion d'erreur robuste
  const fetchOffers = async () => {
    setLoading(true);
    try {
      console.log("🔄 Récupération des appels d'offres...");
      
      // Essayer plusieurs endpoints en cas d'échec
      let response;
      const endpoints = [
        `${API_BASE_URL}/appels/`,
        `${API_BASE_URL}/admin/appels/`
      ];
      
      let lastError;
      for (const endpoint of endpoints) {
        try {
          console.log(`Tentative avec endpoint: ${endpoint}`);
          response = await axios.get(endpoint, {
            timeout: 10000, // 10 secondes de timeout
            headers: {
              'Content-Type': 'application/json',
            }
          });
          console.log(`✅ Succès avec endpoint: ${endpoint}`);
          break;
        } catch (err) {
          console.warn(`❌ Échec avec endpoint ${endpoint}:`, err);
          lastError = err;
          continue;
        }
      }
      
      if (!response) {
        throw lastError || new Error("Tous les endpoints ont échoué");
      }
      
      console.log("✅ Réponse reçue:", response.data);
      
      // Gestion flexible du format de réponse
      let offersData = [];
      if (Array.isArray(response.data)) {
        offersData = response.data;
      } else if (response.data && Array.isArray(response.data.data)) {
        offersData = response.data.data;
      } else if (response.data && response.data.results && Array.isArray(response.data.results)) {
        offersData = response.data.results;
      } else {
        console.error("❌ Format de données inattendu:", response.data);
        throw new Error("Format de données inattendu");
      }
      
      setOffers(offersData);
      toast.success(`${offersData.length} appel(s) d'offres chargé(s)`);
      
    } catch (error) {
      console.error("❌ Erreur lors du chargement:", error);
      
      if (axios.isAxiosError(error)) {
        if (error.code === 'ERR_NETWORK' || error.code === 'ECONNREFUSED') {
          toast.error("❌ Serveur Django inaccessible. Vérifiez que le serveur fonctionne sur http://localhost:8000");
        } else if (error.response?.status === 404) {
          toast.error("❌ Endpoint non trouvé. Vérifiez la configuration des URLs Django.");
        } else if (error.response?.status >= 500) {
          toast.error(`❌ Erreur serveur ${error.response.status}. Vérifiez les logs Django.`);
        } else if (error.response?.status === 403) {
          toast.error("❌ Accès interdit. Vérifiez les permissions.");
        } else {
          const errorMsg = error.response?.data?.error || error.response?.data?.detail || error.message;
          toast.error(`❌ Erreur HTTP ${error.response?.status}: ${errorMsg}`);
        }
      } else {
        toast.error("❌ Erreur lors du chargement des appels d'offres");
      }
      
      setOffers([]);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchOffers();
  }, []);

  const handleSave = async (offerData: Partial<AppelOffre>, criteria: Criterion[]) => {
    if (!editingOffer) return;
    
    try {
      toast.loading("🔄 Enrichissement en cours...");
      
      // Mettre à jour les champs enrichis
      const updateData = {
        description: offerData.description,
        critere_evaluation: offerData.critere_evaluation,
        type_d_appel_d_offre: offerData.type_d_appel_d_offre
      };
      
      const response = await axios.put(`${API_BASE_URL}/admin/appels/${editingOffer.id}/`, updateData);
      
      // Sauvegarder les critères de matching
      if (criteria.length > 0) {
        try {
          // Supprimer les anciens critères
          await axios.delete(`${API_BASE_URL}/appels/${editingOffer.id}/criteres/`);
          
          // Ajouter les nouveaux critères
          for (const criterion of criteria) {
            if (criterion.nom_critere.trim()) {
              await axios.post(`${API_BASE_URL}/appels/${editingOffer.id}/criteres/`, {
                nom_critere: criterion.nom_critere.trim(),
                poids: criterion.poids,
                appel_offre: editingOffer.id
              });
            }
          }
          toast.success("✅ Appel d'offres enrichi avec succès !");
        } catch (criteriaError) {
          console.error("Erreur critères:", criteriaError);
          toast.warning("⚠️ Appel d'offres sauvegardé, mais erreur avec les critères");
        }
      } else {
        toast.success("✅ Appel d'offres mis à jour avec succès !");
      }
      
      // Mettre à jour l'état local
      setOffers(offers.map(o => o.id === editingOffer.id ? { ...o, ...updateData } : o));
      
    } catch (error) {
      console.error("Erreur lors de l'enregistrement:", error);
      toast.error("❌ Erreur lors de l'enregistrement");
    }
    
    setEditingOffer(undefined);
    setDialogOpen(false);
  };

  const getStatusBadge = (offer: AppelOffre) => {
    const now = new Date();
    const dateLimit = offer.date_limite ? new Date(offer.date_limite) : null;
    
    if (dateLimit) {
      if (dateLimit < now) {
        return <Badge className="bg-red-100 text-red-800 border-red-200">Expiré</Badge>;
      } else if (dateLimit.getTime() - now.getTime() < 7 * 24 * 60 * 60 * 1000) {
        return <Badge className="bg-amber-100 text-amber-800 border-amber-200">Urgent</Badge>;
      } else {
        return <Badge className="bg-green-100 text-green-800 border-green-200">Actif</Badge>;
      }
    }
    return <Badge className="bg-gray-100 text-gray-800 border-gray-200">Date non définie</Badge>;
  };

  const getEnrichmentStatus = (offer: AppelOffre) => {
    const hasDescription = offer.description && offer.description.length > 50;
    const hasCriteria = offer.critere_evaluation && offer.critere_evaluation.length > 20;
    const hasType = offer.type_d_appel_d_offre;
    
    const enrichmentScore = (hasDescription ? 1 : 0) + (hasCriteria ? 1 : 0) + (hasType ? 1 : 0);
    
    if (enrichmentScore === 3) {
      return <Badge className="bg-emerald-100 text-emerald-800 border-emerald-200">Enrichi</Badge>;
    } else if (enrichmentScore >= 1) {
      return <Badge className="bg-blue-100 text-blue-800 border-blue-200">Partiellement enrichi</Badge>;
    } else {
      return <Badge className="bg-orange-100 text-orange-800 border-orange-200">À enrichir</Badge>;
    }
  };

  // ✅ CORRECTION: Amélioration de la logique de filtrage
  const filteredOffers = offers.filter(offer => {
    const matchesSearch = 
      offer.titre.toLowerCase().includes(searchTerm.toLowerCase()) ||
      (offer.client && offer.client.toLowerCase().includes(searchTerm.toLowerCase())) ||
      (offer.description && offer.description.toLowerCase().includes(searchTerm.toLowerCase()));
    
    // ✅ Gérer "all" correctement
    const matchesType = filterType === "all" || !filterType || offer.type_d_appel_d_offre === filterType;
    const matchesClient = filterClient === "all" || !filterClient || offer.client === filterClient;
    
    let matchesStatus = true;
    if (filterStatus && filterStatus !== "all") {
      const now = new Date();
      const dateLimit = offer.date_limite ? new Date(offer.date_limite) : null;
      
      if (filterStatus === 'active' && dateLimit) {
        matchesStatus = dateLimit >= now;
      } else if (filterStatus === 'expired' && dateLimit) {
        matchesStatus = dateLimit < now;
      } else if (filterStatus === 'urgent' && dateLimit) {
        const timeDiff = dateLimit.getTime() - now.getTime();
        matchesStatus = timeDiff > 0 && timeDiff < 7 * 24 * 60 * 60 * 1000;
      }
    }
    
    return matchesSearch && matchesType && matchesClient && matchesStatus;
  });

  const formatDate = (dateString: string | undefined) => {
    if (!dateString) return "Non définie";
    try {
      return new Intl.DateTimeFormat('fr-FR', { 
        day: 'numeric', 
        month: 'short',
        year: 'numeric'
      }).format(new Date(dateString));
    } catch (error) {
      return "Non définie";
    }
  };

  // Statistiques
  const stats = {
    total: offers.length,
    active: offers.filter(o => {
      if (!o.date_limite) return true;
      return new Date(o.date_limite) > new Date();
    }).length,
    enriched: offers.filter(o => 
      o.description && o.description.length > 50 && 
      o.critere_evaluation && o.critere_evaluation.length > 20
    ).length,
    withCriteria: offers.filter(o => o.critere_evaluation && o.critere_evaluation.length > 20).length
  };

  // Extraire les valeurs uniques pour les filtres
  const uniqueTypes = Array.from(new Set(offers.map(o => o.type_d_appel_d_offre).filter(Boolean)));
  const uniqueClients = Array.from(new Set(offers.map(o => o.client).filter(Boolean)));

  return (
    <AdminLayout>
      <div className="min-h-screen bg-gray-50 -m-6 p-6">
        {/* Header */}
        <div className="bg-white border-b border-gray-200 -mx-6 -mt-6 mb-8 px-6 py-6">
          <div className="flex justify-between items-center">
            <div>
              <h1 className="text-3xl font-bold text-gray-900 tracking-tight flex items-center gap-3">
                <BriefcaseIcon className="h-8 w-8 text-blue-600" />
                Appels d'offres
              </h1>
              <p className="mt-1 text-sm text-gray-500">
                Données importées automatiquement • Enrichissez pour améliorer le matching
              </p>
            </div>
            <div className="flex items-center space-x-3">
              <Button 
                onClick={fetchOffers}
                disabled={loading}
                variant="outline"
                className="border-gray-300 rounded-xl"
              >
                <RefreshCwIcon className={`h-4 w-4 mr-2 ${loading ? 'animate-spin' : ''}`} />
                Actualiser
              </Button>
            </div>
          </div>
        </div>

        {/* Cartes de statistiques */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
          <Card className="bg-white rounded-2xl shadow-sm border border-gray-200">
            <CardContent className="p-6">
              <div className="flex items-center">
                <div className="w-12 h-12 bg-blue-100 rounded-xl flex items-center justify-center">
                  <BriefcaseIcon className="h-6 w-6 text-blue-600" />
                </div>
                <div className="ml-4">
                  <p className="text-sm font-medium text-gray-500">Total</p>
                  <p className="text-2xl font-bold text-gray-900">{stats.total}</p>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card className="bg-white rounded-2xl shadow-sm border border-gray-200">
            <CardContent className="p-6">
              <div className="flex items-center">
                <div className="w-12 h-12 bg-green-100 rounded-xl flex items-center justify-center">
                  <CheckCircleIcon className="h-6 w-6 text-green-600" />
                </div>
                <div className="ml-4">
                  <p className="text-sm font-medium text-gray-500">Actifs</p>
                  <p className="text-2xl font-bold text-gray-900">{stats.active}</p>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card className="bg-white rounded-2xl shadow-sm border border-gray-200">
            <CardContent className="p-6">
              <div className="flex items-center">
                <div className="w-12 h-12 bg-emerald-100 rounded-xl flex items-center justify-center">
                  <TrendingUpIcon className="h-6 w-6 text-emerald-600" />
                </div>
                <div className="ml-4">
                  <p className="text-sm font-medium text-gray-500">Enrichis</p>
                  <p className="text-2xl font-bold text-gray-900">{stats.enriched}</p>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card className="bg-white rounded-2xl shadow-sm border border-gray-200">
            <CardContent className="p-6">
              <div className="flex items-center">
                <div className="w-12 h-12 bg-purple-100 rounded-xl flex items-center justify-center">
                  <TagIcon className="h-6 w-6 text-purple-600" />
                </div>
                <div className="ml-4">
                  <p className="text-sm font-medium text-gray-500">Avec critères</p>
                  <p className="text-2xl font-bold text-gray-900">{stats.withCriteria}</p>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Barre de recherche et filtres */}
        <Card className="bg-white rounded-2xl shadow-sm border border-gray-200 p-6 mb-8">
          <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between space-y-4 lg:space-y-0 lg:space-x-4">
            <div className="relative flex-1 max-w-lg">
              <SearchIcon className="absolute left-4 top-1/2 transform -translate-y-1/2 h-5 w-5 text-gray-400" />
              <input
                type="text"
                placeholder="Rechercher par titre, client ou description..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full pl-12 pr-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              />
            </div>
            
            <div className="flex flex-col sm:flex-row gap-3">
              {/* ✅ CORRECTION: Select avec value="all" au lieu de "" */}
              <Select value={filterStatus} onValueChange={setFilterStatus}>
                <SelectTrigger className="w-48 border-gray-200 rounded-xl">
                  <SelectValue placeholder="Filtrer par statut" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Tous les statuts</SelectItem>
                  <SelectItem value="active">Actifs</SelectItem>
                  <SelectItem value="urgent">Urgents</SelectItem>
                  <SelectItem value="expired">Expirés</SelectItem>
                </SelectContent>
              </Select>
              
              <Select value={filterType} onValueChange={setFilterType}>
                <SelectTrigger className="w-48 border-gray-200 rounded-xl">
                  <SelectValue placeholder="Filtrer par type" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Tous les types</SelectItem>
                  {uniqueTypes.map(type => (
                    <SelectItem key={type} value={type}>{type}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
              
              <Select value={filterClient} onValueChange={setFilterClient}>
                <SelectTrigger className="w-48 border-gray-200 rounded-xl">
                  <SelectValue placeholder="Filtrer par client" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Tous les clients</SelectItem>
                  {uniqueClients.map(client => (
                    <SelectItem key={client} value={client}>{client}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>
        </Card>

        {/* Liste des appels d'offres */}
        <div className="space-y-6">
          {loading ? (
            <div className="flex justify-center py-16">
              <div className="text-center">
                <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
                <p className="text-gray-500">Chargement des appels d'offres...</p>
                <p className="text-xs text-gray-400 mt-2">Vérification de la connexion au serveur...</p>
              </div>
            </div>
          ) : filteredOffers.length > 0 ? (
            filteredOffers.map((offer) => (
              <Card
                key={offer.id}
                className="bg-white rounded-2xl shadow-sm border border-gray-200 hover:shadow-lg transition-all duration-300 group"
              >
                <CardContent className="p-8">
                  <div className="flex items-start justify-between">
                    <div className="flex-1 min-w-0">
                      {/* Header avec titre et badges */}
                      <div className="flex items-start justify-between mb-4">
                        <div className="flex-1 min-w-0">
                          <h3 className="text-xl font-bold text-gray-900 group-hover:text-blue-600 transition-colors duration-200 mb-3">
                            {offer.titre}
                          </h3>
                          <div className="flex items-center gap-2 flex-wrap">
                            {getStatusBadge(offer)}
                            {getEnrichmentStatus(offer)}
                            {offer.type_d_appel_d_offre && (
                              <Badge variant="outline" className="rounded-full">
                                {offer.type_d_appel_d_offre}
                              </Badge>
                            )}
                          </div>
                        </div>
                      </div>
                      
                      {/* Informations principales */}
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6 text-sm">
                        <div className="flex items-center text-gray-600">
                          <BriefcaseIcon className="h-4 w-4 mr-2 text-gray-400" />
                          <span className="font-medium">{offer.client || "Client non spécifié"}</span>
                        </div>
                        {offer.date_de_publication && (
                          <div className="flex items-center text-gray-600">
                            <CalendarIcon className="h-4 w-4 mr-2 text-gray-400" />
                            <span>Publié le {formatDate(offer.date_de_publication)}</span>
                          </div>
                        )}
                        {offer.date_limite && (
                          <div className="flex items-center text-gray-600">
                            <ClockIcon className="h-4 w-4 mr-2 text-gray-400" />
                            <span>Échéance: {formatDate(offer.date_limite)}</span>
                          </div>
                        )}
                        {offer.lien_site && (
                          <div className="flex items-center">
                            <ExternalLinkIcon className="h-4 w-4 mr-2 text-gray-400" />
                            <a 
                              href={offer.lien_site} 
                              target="_blank" 
                              rel="noopener noreferrer"
                              className="text-blue-600 hover:text-blue-800 text-sm"
                            >
                              Source externe
                            </a>
                          </div>
                        )}
                      </div>

                      {/* Description */}
                      {offer.description ? (
                        <div className="mb-6">
                          <h4 className="text-sm font-medium text-gray-700 mb-2">Description</h4>
                          <p className="text-gray-700 text-sm leading-relaxed line-clamp-3">
                            {offer.description}
                          </p>
                        </div>
                      ) : (
                        <div className="bg-amber-50 border border-amber-200 rounded-lg p-4 mb-6">
                          <div className="flex items-center">
                            <AlertCircleIcon className="h-5 w-5 text-amber-600 mr-2" />
                            <div>
                              <p className="text-amber-800 text-sm font-medium">
                                Description manquante
                              </p>
                              <p className="text-amber-700 text-xs mt-1">
                                Enrichissez cet appel d'offres pour améliorer le matching
                              </p>
                            </div>
                          </div>
                        </div>
                      )}

                      {/* Critères d'évaluation */}
                      {offer.critere_evaluation && (
                        <div className="mb-6">
                          <h4 className="text-sm font-medium text-gray-700 mb-2">Critères d'évaluation</h4>
                          <p className="text-gray-600 text-sm line-clamp-2">
                            {offer.critere_evaluation}
                          </p>
                        </div>
                      )}

                      {/* Documents */}
                      {offer.documents && (
                        <div className="mb-6">
                          <h4 className="text-sm font-medium text-gray-700 mb-2">Documents</h4>
                          <p className="text-gray-600 text-sm line-clamp-2">
                            {offer.documents}
                          </p>
                        </div>
                      )}

                      {/* Actions */}
                      <div className="flex items-center justify-between pt-4 border-t border-gray-100">
                        <div className="text-xs text-gray-500">
                          Mis à jour le {formatDate(offer.updated_at)}
                        </div>
                        
                        <div className="flex items-center space-x-3">
                          <Button
                            onClick={() => {
                              setEditingOffer(offer);
                              setDialogOpen(true);
                            }}
                            variant="outline"
                            size="sm"
                            className="text-blue-600 hover:text-blue-800 hover:bg-blue-50 border-blue-200 rounded-lg"
                          >
                            <Edit2Icon className="h-4 w-4 mr-1" />
                            {offer.description ? 'Modifier' : 'Enrichir'}
                          </Button>
                          
                          <Button
                            onClick={() => navigate(`/admin/matching/${offer.id}`)}
                            size="sm"
                            className="bg-blue-600 text-white hover:bg-blue-700 rounded-lg"
                          >
                            <UsersIcon className="h-4 w-4 mr-2" />
                            Matching
                          </Button>
                        </div>
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))
          ) : (
            <div className="text-center py-16">
              <div className="mx-auto w-24 h-24 bg-gray-100 rounded-full flex items-center justify-center mb-6">
                {searchTerm || (filterType !== "all") || (filterClient !== "all") || (filterStatus !== "all") ? (
                  <SearchIcon className="h-12 w-12 text-gray-400" />
                ) : (
                  <BriefcaseIcon className="h-12 w-12 text-gray-400" />
                )}
              </div>
              <h3 className="text-lg font-medium text-gray-900 mb-2">
                {searchTerm || (filterType !== "all") || (filterClient !== "all") || (filterStatus !== "all") ? "Aucun résultat trouvé" : "Aucun appel d'offres"}
              </h3>
              <p className="text-gray-500 mb-6">
                {searchTerm || (filterType !== "all") || (filterClient !== "all") || (filterStatus !== "all")
                  ? "Essayez de modifier vos critères de recherche ou filtres." 
                  : "Les appels d'offres apparaîtront ici après l'importation automatique."}
              </p>
              {(searchTerm || (filterType !== "all") || (filterClient !== "all") || (filterStatus !== "all")) && (
                <Button 
                  onClick={() => {
                    setSearchTerm("");
                    setFilterType("all");
                    setFilterClient("all");
                    setFilterStatus("all");
                  }}
                  variant="outline"
                  className="border-blue-200 text-blue-700 hover:bg-blue-50 rounded-xl"
                >
                  Réinitialiser les filtres
                </Button>
              )}
              
              {/* Message d'aide pour le développement */}
              {offers.length === 0 && !loading && (
                <div className="mt-8 p-6 bg-blue-50 border border-blue-200 rounded-2xl max-w-md mx-auto">
                  <div className="text-blue-600 mb-2">
                    <AlertCircleIcon className="h-8 w-8 mx-auto mb-2" />
                  </div>
                  <h4 className="text-sm font-semibold text-blue-900 mb-2">
                    Pas d'appels d'offres disponibles
                  </h4>
                  <div className="text-xs text-blue-800 space-y-1">
                    <p>• Vérifiez que le serveur Django fonctionne</p>
                    <p>• Vérifiez l'endpoint: <code className="bg-blue-100 px-1 rounded">GET /api/appels/</code></p>
                    <p>• Consultez les logs Django pour plus de détails</p>
                  </div>
                  <Button 
                    onClick={fetchOffers}
                    size="sm"
                    className="mt-4 bg-blue-600 hover:bg-blue-700 text-white"
                  >
                    <RefreshCwIcon className="h-4 w-4 mr-2" />
                    Réessayer
                  </Button>
                </div>
              )}
            </div>
          )}
        </div>

        {/* Dialog d'enrichissement */}
        {dialogOpen && editingOffer && (
          <EditOfferDialog 
            key={editingOffer.id} 
            offer={editingOffer} 
            onSave={handleSave} 
            onClose={() => {
              setDialogOpen(false);
              setEditingOffer(undefined);
            }}
            open={dialogOpen}
          />
        )}

        {/* Notifications flottantes */}
        {offers.length > 0 && stats.enriched < stats.total * 0.5 && (
          <div className="fixed bottom-4 right-4 bg-gradient-to-r from-blue-50 to-indigo-50 border border-blue-200 rounded-2xl p-4 shadow-lg max-w-sm">
            <div className="flex items-start">
              <div className="w-8 h-8 bg-blue-100 rounded-full flex items-center justify-center mr-3 flex-shrink-0">
                <TrendingUpIcon className="h-4 w-4 text-blue-600" />
              </div>
              <div>
                <p className="text-sm text-blue-900 font-semibold">
                  Amélioration suggérée
                </p>
                <p className="text-xs text-blue-800 mt-1">
                  {stats.total - stats.enriched} appels d'offres peuvent être enrichis pour un meilleur matching.
                </p>
                <Button 
                  size="sm" 
                  className="mt-2 bg-blue-600 hover:bg-blue-700 text-white text-xs rounded-lg"
                  onClick={() => {
                    const firstUnenriched = offers.find(o => 
                      !o.description || o.description.length <= 50 || 
                      !o.critere_evaluation || o.critere_evaluation.length <= 20
                    );
                    if (firstUnenriched) {
                      setEditingOffer(firstUnenriched);
                      setDialogOpen(true);
                    }
                  }}
                >
                  Commencer l'enrichissement
                </Button>
              </div>
            </div>
          </div>
        )}

        {/* Indicateur de connexion */}
        {offers.length > 0 && (
          <div className="fixed bottom-20 right-4 bg-white border border-gray-200 rounded-xl p-3 shadow-lg">
            <div className="flex items-center">
              <div className="w-2 h-2 bg-green-500 rounded-full animate-pulse mr-2"></div>
              <p className="text-xs text-gray-600">
                Connecté • {offers.length} appels d'offres
              </p>
            </div>
          </div>
        )}

        {/* Indicateur d'erreur de connexion */}
        {!loading && offers.length === 0 && (
          <div className="fixed bottom-4 right-4 bg-red-50 border border-red-200 rounded-xl p-3 shadow-lg max-w-sm">
            <div className="flex items-center">
              <div className="w-2 h-2 bg-red-500 rounded-full mr-2"></div>
              <div>
                <p className="text-xs text-red-800 font-medium">
                  Serveur Django inaccessible
                </p>
                <p className="text-xs text-red-600 mt-1">
                  Vérifiez que le serveur fonctionne sur le port 8000
                </p>
                <Button 
                  onClick={fetchOffers}
                  size="sm"
                  variant="outline"
                  className="mt-2 border-red-200 text-red-700 hover:bg-red-50 text-xs"
                >
                  <RefreshCwIcon className="h-3 w-3 mr-1" />
                  Reconnexion
                </Button>
              </div>
            </div>
          </div>
        )}
      </div>
    </AdminLayout>
  );
};

export default AppelsOffres;