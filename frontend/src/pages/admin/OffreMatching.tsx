import React, { useState, useEffect } from "react";
import { useParams, useNavigate } from "react-router-dom";
import axios from "axios";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { toast } from "sonner";
import { 
  RefreshCwIcon, 
  CheckIcon, 
  XIcon, 
  UserIcon, 
  MailIcon, 
  BriefcaseIcon, 
  CalendarIcon, 
  ArrowLeftIcon, 
  FilterIcon,
  BarChart3Icon,
  ClipboardCheckIcon,
  AlertCircleIcon
} from "lucide-react";
import AdminLayout from "@/components/admin/AdminLayout";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";
import { motion } from "framer-motion";
import { Separator } from "@/components/ui/separator";

// Interface pour les données de matching
interface MatchData {
  id: number;
  consultant_id: number;
  consultant_name: string;
  consultant_expertise: string;
  email: string;
  domaine_principal: string;
  specialite?: string;
  top_skills: string[];
  date_match_score: number;
  skills_match_score: number;
  score: number;
  is_validated: boolean;
}

interface OfferData {
  id: number;
  nom_projet: string;
  client: string;
  description: string;
  budget: number;
  date_debut: string;
  date_fin: string;
  statut: string;
}

interface CriterionData {
  id: number;
  nom_critere: string;
  poids: number;
}

const OffreMatching = () => {
  const { offerId } = useParams<{ offerId: string }>();
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);
  const [generating, setGenerating] = useState(false);
  const [validating, setValidating] = useState<number | null>(null);
  const [matches, setMatches] = useState<MatchData[]>([]);
  const [offer, setOffer] = useState<OfferData | null>(null);
  const [criteria, setCriteria] = useState<CriterionData[]>([]);
  const [domainFilter, setDomainFilter] = useState<string | null>(null);
  const [scoreFilter, setScoreFilter] = useState<number | null>(null);
  const [lastRefresh, setLastRefresh] = useState<Date | null>(null);

  // Récupération des matchings existants
  const fetchMatches = async () => {
    setLoading(true);
    try {
      const res = await axios.get(`http://localhost:8000/api/matching/offer/${offerId}/`);
      console.log("Données brutes du serveur:", res.data);
      
      if (res.data.success) {
        // S'assurer que les scores sont bien des nombres
        const cleanedMatches = res.data.matches.map(match => ({
          ...match,
          score: parseFloat(match.score),
          date_match_score: parseFloat(match.date_match_score),
          skills_match_score: parseFloat(match.skills_match_score)
        }));
        
        console.log("Matchings nettoyés avec scores convertis:", cleanedMatches);
        setMatches(cleanedMatches);
        setLastRefresh(new Date());
        
        if (cleanedMatches.length === 0) {
          toast.info("Aucun matching trouvé pour cet appel d'offre");
        }
      } else {
        toast.error(res.data.error || "Erreur lors du chargement des matchings");
      }
    } catch (error) {
      console.error("Erreur lors du chargement des matchings:", error);
      toast.error("Erreur de connexion au serveur. Veuillez réessayer plus tard.");
    } finally {
      setLoading(false);
    }
  };

  // Récupération des détails de l'appel d'offre
  const fetchOfferDetails = async () => {
    try {
      const res = await axios.get(`http://localhost:8000/api/appels/${offerId}/`);
      setOffer(res.data);
      
      // Charger les critères d'évaluation
      try {
        const criteriaRes = await axios.get(`http://localhost:8000/api/appels/${offerId}/criteres/`);
        setCriteria(criteriaRes.data);
      } catch (err) {
        console.error("Erreur lors du chargement des critères:", err);
        setCriteria([]);
      }
    } catch (error) {
      console.error("Erreur lors du chargement des détails de l'offre:", error);
      toast.error("Impossible de charger les détails de l'offre");
    }
  };

  // Génération de nouveaux matchings
  const generateMatches = async () => {
    setGenerating(true);
    try {
      toast.loading("Génération des matchings en cours...");
      const res = await axios.post(`http://localhost:8000/api/matching/offer/${offerId}/`);
      
      toast.dismiss(); // Fermer le toast de chargement
      
      if (res.data.success) {
        // S'assurer que les scores sont bien des nombres
        const cleanedMatches = res.data.matches.map(match => ({
          ...match,
          score: parseFloat(match.score),
          date_match_score: parseFloat(match.date_match_score),
          skills_match_score: parseFloat(match.skills_match_score)
        }));
        
        // Debug - vérifier les scores convertis
        console.log("Scores après génération et conversion:", 
          cleanedMatches.map(m => ({
            id: m.id,
            consultant: m.consultant_name,
            score: m.score,
            type: typeof m.score
          }))
        );
        
        setMatches(cleanedMatches);
        setLastRefresh(new Date());
        toast.success(`${cleanedMatches.length} matching(s) généré(s) avec succès`);
      } else {
        toast.error(res.data.error || "Erreur lors de la génération des matchings");
      }
    } catch (error) {
      console.error("Erreur lors de la génération des matchings:", error);
      toast.error("Erreur de connexion au serveur. Veuillez réessayer plus tard.");
    } finally {
      setGenerating(false);
    }
  };

  // Validation/invalidation d'un matching
  const toggleValidation = async (matchId: number) => {
    setValidating(matchId);
    try {
      const res = await axios.put(`http://localhost:8000/api/matching/validate/${matchId}/`);
      if (res.data.success) {
        // Mettre à jour l'état local
        setMatches(matches.map(match => 
          match.id === matchId 
            ? { ...match, is_validated: res.data.is_validated } 
            : match
        ));
        
        toast.success(res.data.is_validated 
          ? "Consultant validé pour cette mission" 
          : "Validation annulée");
          
        if (res.data.notification) {
          toast.info(res.data.notification);
        }
      } else {
        toast.error(res.data.error || "Erreur lors de la validation");
      }
    } catch (error) {
      console.error("Erreur lors de la validation:", error);
      toast.error("Erreur de connexion au serveur. Veuillez réessayer.");
    } finally {
      setValidating(null);
    }
  };

  useEffect(() => {
    if (offerId) {
      fetchOfferDetails();
      fetchMatches();
    }
  }, [offerId]);

  // Fonction pour obtenir la couleur du badge selon le score
  const getScoreBadgeColor = (score: number) => {
    if (score >= 75) return "bg-emerald-100 text-emerald-800";
    if (score >= 50) return "bg-blue-100 text-blue-800";
    if (score >= 25) return "bg-amber-100 text-amber-800";
    return "bg-red-100 text-red-800";
  };

  // Fonction pour obtenir la couleur du badge selon le domaine
  const getDomainBadgeColor = (domain: string) => {
    switch(domain) {
      case 'DIGITAL': return 'bg-indigo-100 text-indigo-800';
      case 'FINANCE': return 'bg-emerald-100 text-emerald-800';
      case 'ENERGIE': return 'bg-amber-100 text-amber-800';
      case 'INDUSTRIE': return 'bg-purple-100 text-purple-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  // Fonction pour obtenir le nom complet du domaine
  const getDomainName = (code: string) => {
    switch(code) {
      case 'DIGITAL': return 'Digital et Télécoms';
      case 'FINANCE': return 'Secteur bancaire et financier';
      case 'ENERGIE': return 'Transition énergétique';
      case 'INDUSTRIE': return 'Industrie et Mines';
      default: return code;
    }
  };

  // Appliquer les filtres
  const filteredMatches = matches.filter(match => {
    if (domainFilter && match.domaine_principal !== domainFilter) return false;
    if (scoreFilter && Math.round(match.score) < scoreFilter) return false;
    return true;
  });

  // Extraire les domaines uniques pour le filtre
  const uniqueDomains = Array.from(new Set(matches.map(match => match.domaine_principal)));

  // Formater la date
  const formatDate = (dateString: string) => {
    if (!dateString) return "N/A";
    const date = new Date(dateString);
    return new Intl.DateTimeFormat('fr-FR').format(date);
  };

  // Formater le statut pour l'affichage
  const formatStatus = (status: string) => {
    if (!status) return "N/A";
    return status.replace("_", " ");
  };

  // Afficher le budget en format monétaire
  const formatBudget = (budget: number) => {
    return new Intl.NumberFormat('fr-FR', { style: 'currency', currency: 'MRU' }).format(budget);
  };

  return (
    <AdminLayout>
      <div className="space-y-6 p-6">
        <div className="flex items-center justify-between">
          <div>
            <div className="flex items-center gap-3">
              <TooltipProvider>
                <Tooltip>
                  <TooltipTrigger asChild>
                    <Button 
                      variant="ghost" 
                      size="sm" 
                      onClick={() => navigate("/admin/appels-offres")}
                      className="p-0 h-10 w-10 rounded-full bg-white shadow-sm hover:bg-gray-100 transition-colors"
                    >
                      <ArrowLeftIcon className="h-5 w-5 text-gray-700" />
                    </Button>
                  </TooltipTrigger>
                  <TooltipContent>
                    <p>Retour à la liste des appels d'offres</p>
                  </TooltipContent>
                </Tooltip>
              </TooltipProvider>
              <div>
                <h1 className="text-2xl font-bold text-gray-800">Matching pour l'appel d'offre</h1>
                {offer ? (
                  <p className="text-gray-500 mt-1 flex items-center">
                    <BriefcaseIcon className="h-4 w-4 mr-2 text-blue-500" />
                    <span className="font-medium text-blue-600">{offer.nom_projet}</span>
                    <span className="mx-2">•</span>
                    <span className="text-gray-600">{offer.client}</span>
                  </p>
                ) : loading ? (
                  <Skeleton className="h-4 w-48 mt-1" />
                ) : null}
              </div>
            </div>
          </div>
          <div className="flex gap-3">
            <Button 
              onClick={generateMatches} 
              disabled={generating || loading}
              className="bg-blue-600 hover:bg-blue-700 shadow-md hover:shadow-lg transition-all duration-200"
            >
              <RefreshCwIcon className={`h-4 w-4 mr-2 ${generating ? 'animate-spin' : ''}`} />
              {generating ? "Génération..." : "Générer Matchings"}
            </Button>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {loading && !offer ? (
            <Card className="col-span-3 md:col-span-3">
              <CardHeader>
                <Skeleton className="h-6 w-48" />
              </CardHeader>
              <CardContent>
                <div className="space-y-2">
                  <Skeleton className="h-4 w-full" />
                  <Skeleton className="h-4 w-3/4" />
                  <Skeleton className="h-4 w-1/2" />
                </div>
              </CardContent>
            </Card>
          ) : offer ? (
            <>
              <Card className="col-span-3 md:col-span-2 shadow-md hover:shadow-lg transition-all duration-200">
                <CardHeader className="pb-3 border-b">
                  <CardTitle className="flex items-center gap-2 text-blue-700">
                    <BriefcaseIcon className="h-5 w-5" />
                    Détails de la mission
                  </CardTitle>
                </CardHeader>
                <CardContent className="pt-4">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                    <div className="bg-gray-50 p-4 rounded-lg">
                      <p className="text-sm font-medium text-gray-500 mb-1">Projet</p>
                      <p className="font-semibold text-gray-800">{offer.nom_projet}</p>
                    </div>
                    <div className="bg-gray-50 p-4 rounded-lg">
                      <p className="text-sm font-medium text-gray-500 mb-1">Client</p>
                      <p className="font-semibold text-gray-800">{offer.client}</p>
                    </div>
                    <div className="bg-gray-50 p-4 rounded-lg">
                      <p className="text-sm font-medium text-gray-500 mb-1">Budget</p>
                      <p className="font-semibold text-gray-800">{formatBudget(offer.budget)}</p>
                    </div>
                    <div className="bg-gray-50 p-4 rounded-lg">
                      <p className="text-sm font-medium text-gray-500 mb-1">Statut</p>
                      <Badge className={
                        offer.statut === "En_cours" ? "bg-blue-100 text-blue-800 px-3 py-1" :
                        offer.statut === "A_venir" ? "bg-amber-100 text-amber-800 px-3 py-1" :
                        "bg-emerald-100 text-emerald-800 px-3 py-1"
                      }>
                        {formatStatus(offer.statut)}
                      </Badge>
                    </div>
                    <div className="bg-gray-50 p-4 rounded-lg col-span-2">
                      <p className="text-sm font-medium text-gray-500 mb-1">Période</p>
                      <p className="flex items-center gap-2 font-semibold text-gray-800">
                        <CalendarIcon className="h-4 w-4 text-blue-500" />
                        Du {formatDate(offer.date_debut)} au {formatDate(offer.date_fin)}
                      </p>
                    </div>
                  </div>
                  <div className="mt-5 bg-gray-50 p-4 rounded-lg">
                    <p className="text-sm font-medium text-gray-500 mb-2">Description</p>
                    <p className="text-gray-800 leading-relaxed">{offer.description}</p>
                  </div>
                  
                  {criteria.length > 0 && (
                    <div className="mt-5">
                      <p className="text-sm font-medium text-gray-500 mb-3 flex items-center">
                        <BarChart3Icon className="h-4 w-4 mr-2 text-blue-500" />
                        Critères d'évaluation
                      </p>
                      <div className="flex flex-wrap gap-2">
                        {criteria.map(criterion => (
                          <Badge key={criterion.id} variant="outline" className="flex gap-2 items-center bg-white border-2 border-gray-200 px-3 py-1.5 rounded-full shadow-sm">
                            {criterion.nom_critere}
                            <span className="bg-blue-100 text-blue-800 text-xs px-2 py-0.5 rounded-full font-bold">
                              {criterion.poids}
                            </span>
                          </Badge>
                        ))}
                      </div>
                    </div>
                  )}
                </CardContent>
              </Card>
              
              <Card className="col-span-3 md:col-span-1 shadow-md hover:shadow-lg transition-all duration-200 bg-gradient-to-br from-blue-50 to-white">
                <CardHeader className="pb-3 border-b">
                  <CardTitle className="flex items-center gap-2 text-blue-700">
                    <ClipboardCheckIcon className="h-5 w-5" />
                    Suivi du matching
                  </CardTitle>
                </CardHeader>
                <CardContent className="pt-4 space-y-4">
                  <div className="bg-white rounded-lg p-4 shadow-sm border border-gray-100">
                    <div className="flex items-center justify-between">
                      <p className="text-sm font-medium text-gray-500">Matchings</p>
                      <span className="bg-blue-100 text-blue-800 px-2 py-0.5 rounded-full text-xs font-bold">
                        {matches.length}
                      </span>
                    </div>
                  </div>
                  
                  <div className="bg-white rounded-lg p-4 shadow-sm border border-gray-100">
                    <div className="flex items-center justify-between">
                      <p className="text-sm font-medium text-gray-500">Consultants validés</p>
                      <span className="bg-emerald-100 text-emerald-800 px-2 py-0.5 rounded-full text-xs font-bold">
                        {matches.filter(m => m.is_validated).length}
                      </span>
                    </div>
                  </div>
                  
                  <div className="bg-white rounded-lg p-4 shadow-sm border border-gray-100">
                    <div className="flex items-center justify-between">
                      <p className="text-sm font-medium text-gray-500">Score moyen</p>
                      <span className="bg-amber-100 text-amber-800 px-2 py-0.5 rounded-full text-xs font-bold">
                        {matches.length ? 
                          Math.round(matches.reduce((sum, m) => sum + m.score, 0) / matches.length) + '%' : 
                          'N/A'}
                      </span>
                    </div>
                  </div>

                  {lastRefresh && (
                    <div className="bg-white rounded-lg p-4 shadow-sm border border-gray-100">
                      <div className="flex items-center justify-between">
                        <p className="text-sm font-medium text-gray-500">Dernière mise à jour</p>
                        <span className="text-gray-600 text-xs">
                          {lastRefresh.toLocaleTimeString()}
                        </span>
                      </div>
                    </div>
                  )}
                </CardContent>
              </Card>
            </>
          ) : null}
        </div>

        <Card className="shadow-md hover:shadow-lg transition-all duration-200">
          <CardHeader className="flex flex-row items-center justify-between pb-3 border-b">
            <div>
              <CardTitle className="text-xl text-blue-700 flex items-center gap-2">
                <UserIcon className="h-5 w-5" />
                Consultants proposés
              </CardTitle>
              {filteredMatches.length > 0 && (
                <CardDescription className="mt-1">
                  {filteredMatches.length} consultant(s) sur {matches.length} 
                  {domainFilter || scoreFilter ? " (filtrés)" : ""}
                </CardDescription>
              )}
            </div>
            <div className="flex flex-col md:flex-row gap-4">
              <div className="flex items-center gap-2 bg-white px-3 py-2 rounded-lg shadow-sm border border-gray-200">
                <FilterIcon className="h-4 w-4 text-gray-500" />
                <select
                  value={domainFilter || ''}
                  onChange={(e) => setDomainFilter(e.target.value || null)}
                  className="border-none text-sm focus:ring-0 focus:outline-none bg-transparent w-full"
                  disabled={loading || matches.length === 0}
                >
                  <option value="">Tous les domaines</option>
                  {uniqueDomains.map(domain => (
                    <option key={domain} value={domain}>{getDomainName(domain)}</option>
                  ))}
                </select>
              </div>
              <div className="flex items-center gap-2 bg-white px-3 py-2 rounded-lg shadow-sm border border-gray-200">
                <BarChart3Icon className="h-4 w-4 text-gray-500" />
                <select
                  value={scoreFilter || ''}
                  onChange={(e) => setScoreFilter(e.target.value ? parseInt(e.target.value) : null)}
                  className="border-none text-sm focus:ring-0 focus:outline-none bg-transparent w-full"
                  disabled={loading || matches.length === 0}
                >
                  <option value="">Score minimum</option>
                  <option value="75">75% et plus</option>
                  <option value="50">50% et plus</option>
                  <option value="25">25% et plus</option>
                </select>
              </div>
            </div>
          </CardHeader>
          <CardContent className="p-0">
            {loading ? (
              <div className="flex justify-center py-12">
                <div className="animate-spin rounded-full h-10 w-10 border-b-2 border-blue-600"></div>
              </div>
            ) : filteredMatches.length > 0 ? (
              <Table>
                <TableHeader>
                  <TableRow className="bg-gray-50">
                    <TableHead className="font-semibold text-gray-700">Consultant</TableHead>
                    <TableHead className="font-semibold text-gray-700">Domaine</TableHead>
                    <TableHead className="font-semibold text-gray-700">Expertise</TableHead>
                    <TableHead className="font-semibold text-gray-700">Contact</TableHead>
                    <TableHead className="font-semibold text-gray-700">Score</TableHead>
                    <TableHead className="font-semibold text-gray-700">Statut</TableHead>
                    <TableHead className="text-right font-semibold text-gray-700">Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filteredMatches.map((match, index) => {
                    // Log de débogage
                    console.log(`Match ${match.id}, consultant: ${match.consultant_name}, score: ${match.score}, type: ${typeof match.score}`);
                    
                    return (
                      <motion.tr 
                        key={match.id} 
                        className={`
                          ${match.is_validated ? "bg-emerald-50" : ""}
                          ${match.is_validated ? "hover:bg-emerald-100" : "hover:bg-gray-50"}
                          transition-colors duration-150
                        `}
                        initial={{ opacity: 0, y: 10 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ duration: 0.2, delay: index * 0.05 }}
                      >
                        <TableCell className="font-medium">
                          <div className="flex items-center">
                            <div className="h-8 w-8 rounded-full bg-blue-100 flex items-center justify-center mr-3">
                              <UserIcon className="h-4 w-4 text-blue-600" />
                            </div>
                            <span className="font-semibold text-gray-800">{match.consultant_name}</span>
                          </div>
                        </TableCell>
                        <TableCell>
                          <Badge className={`${getDomainBadgeColor(match.domaine_principal)} px-2 py-1`}>
                            {getDomainName(match.domaine_principal)}
                          </Badge>
                          {match.specialite && (
                            <div className="text-xs mt-1 text-gray-600 italic">{match.specialite}</div>
                          )}
                        </TableCell>
                        <TableCell className="font-medium text-gray-700">{match.consultant_expertise}</TableCell>
                        <TableCell>
                          <div className="flex items-center">
                            <div className="h-7 w-7 rounded-full bg-gray-100 flex items-center justify-center mr-2">
                              <MailIcon className="h-3.5 w-3.5 text-gray-600" />
                            </div>
                            <span className="text-gray-600 text-sm">{match.email}</span>
                          </div>
                        </TableCell>
                        <TableCell>
                          <div className="flex flex-col items-center">
                            {/* Graphique circulaire du score global - CORRIGÉ */}
                            <div className="w-16 h-16 relative flex items-center justify-center">
                              <svg className="w-full h-full" viewBox="0 0 36 36">
                                <path
                                  d="M18 2.0845 a 15.9155 15.9155 0 0 1 0 31.831 a 15.9155 15.9155 0 0 1 0 -31.831"
                                  fill="none"
                                  stroke="#e6e6e6"
                                  strokeWidth="3"
                                  strokeDasharray="100, 100"
                                />
                                <path
                                  d="M18 2.0845 a 15.9155 15.9155 0 0 1 0 31.831 a 15.9155 15.9155 0 0 1 0 -31.831"
                                  fill="none"
                                  stroke={match.score >= 75 ? "#059669" : 
                                          match.score >= 50 ? "#2563eb" : 
                                          match.score >= 25 ? "#d97706" : "#dc2626"}
                                  strokeWidth="3"
                                  strokeDasharray={`${Math.round(match.score)}, 100`}
                                />
                                <text x="18" y="20.5" textAnchor="middle" 
                                  className="font-bold text-xs"
                                  fill={match.score >= 75 ? "#059669" : 
                                        match.score >= 50 ? "#2563eb" : 
                                        match.score >= 25 ? "#d97706" : "#dc2626"}>
                                  {Math.round(match.score)}%
                                </text>
                              </svg>
                            </div>
                            
                            {/* Affichage des scores détaillés */}
                            <div className="mt-2 w-full text-xs">
                              <div className="flex items-center justify-between px-1 mb-1">
                                <span className="text-gray-600">Disponibilité:</span>
                                <Badge className={
                                  match.date_match_score >= 75 ? "bg-emerald-100 text-emerald-800" :
                                  match.date_match_score >= 50 ? "bg-blue-100 text-blue-800" :
                                  match.date_match_score >= 25 ? "bg-amber-100 text-amber-800" :
                                  "bg-red-100 text-red-800"
                                }>
                                  {Math.round(match.date_match_score)}%
                                </Badge>
                              </div>
                              <div className="flex items-center justify-between px-1">
                                <span className="text-gray-600">Compétences:</span>
                                <Badge className={
                                  match.skills_match_score >= 75 ? "bg-emerald-100 text-emerald-800" :
                                  match.skills_match_score >= 50 ? "bg-blue-100 text-blue-800" :
                                  match.skills_match_score >= 25 ? "bg-amber-100 text-amber-800" :
                                  "bg-red-100 text-red-800"
                                }>
                                  {Math.round(match.skills_match_score)}%
                                </Badge>
                              </div>
                            </div>
                          </div>
                        </TableCell>
                        <TableCell>
                          {match.is_validated ? (
                            <Badge className="bg-emerald-100 text-emerald-800 px-3 py-1 flex items-center gap-1.5">
                              <CheckIcon className="h-3 w-3" /> Validé
                            </Badge>
                          ) : (
                            <Badge variant="outline" className="px-3 py-1 border-gray-300 text-gray-600">
                              En attente
                            </Badge>
                          )}
                        </TableCell>
                        <TableCell className="text-right">
                          <TooltipProvider>
                            <Tooltip>
                              <TooltipTrigger asChild>
                                <Button
                                  variant={match.is_validated ? "destructive" : "default"} 
                                  size="sm"
                                  onClick={() => toggleValidation(match.id)}
                                  disabled={validating === match.id}
                                  className={match.is_validated ? 
                                    "bg-red-600 hover:bg-red-700 shadow-sm" : 
                                    "bg-blue-600 hover:bg-blue-700 shadow-sm"}
                                >
                                  {validating === match.id ? (
                                    <>
                                      <RefreshCwIcon className="h-4 w-4 mr-1 animate-spin" />
                                      {match.is_validated ? "Annulation..." : "Validation..."}
                                    </>
                                  ) : match.is_validated ? (
                                    <>
                                      <XIcon className="h-4 w-4 mr-1" />
                                      Annuler
                                    </>
                                  ) : (
                                    <>
                                      <CheckIcon className="h-4 w-4 mr-1" />
                                      Valider
                                    </>
                                  )}
                                </Button>
                              </TooltipTrigger>
                              <TooltipContent>
                                <p>{match.is_validated ? "Retirer la validation" : "Valider ce consultant"}</p>
                              </TooltipContent>
                            </Tooltip>
                          </TooltipProvider>
                        </TableCell>
                      </motion.tr>
                    );
                  })}
                </TableBody>
              </Table>
            ) : matches.length > 0 ? (
              <div className="text-center py-12">
                <div className="inline-flex rounded-full bg-yellow-100 p-4 mb-4">
                  <FilterIcon className="h-6 w-6 text-yellow-600" />
                </div>
                <p className="text-gray-600 mb-4">Aucun consultant ne correspond aux filtres sélectionnés.</p>
                <Button 
                  onClick={() => {
                    setDomainFilter(null);
                    setScoreFilter(null);
                  }} 
                  variant="outline" 
                  className="border-blue-200 text-blue-700 hover:bg-blue-50"
                >
                  Réinitialiser les filtres
                </Button>
              </div>
            ) : (
              <div className="text-center py-12">
                <div className="inline-flex rounded-full bg-blue-100 p-4 mb-4">
                  <UserIcon className="h-6 w-6 text-blue-600" />
                </div>
                <p className="text-gray-600 mb-4">Aucun matching trouvé pour cette offre.</p>
                <Button 
                  onClick={generateMatches} 
                  className="bg-blue-600 hover:bg-blue-700 shadow-md"
                  disabled={generating}
                >
                  <RefreshCwIcon className={`h-4 w-4 mr-2 ${generating ? 'animate-spin' : ''}`} />
                  Générer des matchings
                </Button>
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </AdminLayout>
  );
};

export default OffreMatching;