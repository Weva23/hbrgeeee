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
  AlertCircleIcon,
  ExternalLinkIcon,
  FileTextIcon,
  TagIcon,
  MapPinIcon,
  GlobeIcon,
  ClockIcon,
  TrendingUpIcon
} from "lucide-react";
import AdminLayout from "@/components/admin/AdminLayout";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";
import { motion } from "framer-motion";

// Interface pour les appels d'offres scrapés (modèle mis à jour)
interface ScrapedOfferData {
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
  is_expired: boolean;
  days_remaining?: number;
}

// Interface pour les données de matching (adaptée)
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

interface CriterionData {
  id: number;
  nom_critere: string;
  poids: number;
  description?: string;
}

interface MatchingStats {
  min: number;
  max: number;
  avg: number;
  count: number;
}

interface AppelOffreInfo {
  id: number;
  titre: string;
  client: string;
  has_description: boolean;
  has_criteria: boolean;
}

const OffreMatchingUpdated = () => {
  const { offerId } = useParams<{ offerId: string }>();
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);
  const [generating, setGenerating] = useState(false);
  const [validating, setValidating] = useState<number | null>(null);
  const [matches, setMatches] = useState<MatchData[]>([]);
  const [offer, setOffer] = useState<ScrapedOfferData | null>(null);
  const [criteria, setCriteria] = useState<CriterionData[]>([]);
  const [domainFilter, setDomainFilter] = useState<string | null>(null);
  const [scoreFilter, setScoreFilter] = useState<number | null>(null);
  const [lastRefresh, setLastRefresh] = useState<Date | null>(null);
  const [matchingStats, setMatchingStats] = useState<MatchingStats | null>(null);

  // Récupération des matchings existants avec la nouvelle API
  const fetchMatches = async () => {
    setLoading(true);
    try {
      console.log(`🔄 Récupération des matchings pour AO ${offerId}`);
      const res = await axios.get(`http://localhost:8000/api/matching/offer/${offerId}/`);
      console.log("Données matchings pour AO scrapé:", res.data);
      
      if (res.data.success) {
        const cleanedMatches = (res.data.matches || []).map(match => ({
          ...match,
          score: parseFloat(match.score) || 0,
          date_match_score: parseFloat(match.date_match_score) || 0,
          skills_match_score: parseFloat(match.skills_match_score) || 0,
          top_skills: Array.isArray(match.top_skills) ? match.top_skills : []
        }));
        
        console.log("Matchings nettoyés:", cleanedMatches);
        setMatches(cleanedMatches);
        setLastRefresh(new Date());
        
        // Calculer les statistiques des scores
        if (cleanedMatches.length > 0) {
          const scores = cleanedMatches.map(m => m.score);
          setMatchingStats({
            min: Math.min(...scores),
            max: Math.max(...scores),
            avg: scores.reduce((a, b) => a + b, 0) / scores.length,
            count: cleanedMatches.length
          });
        } else {
          setMatchingStats(null);
        }
        
        if (cleanedMatches.length === 0) {
          toast.info("Aucun matching trouvé pour cet appel d'offre scrapé");
        }
      } else {
        console.error("❌ Erreur dans la réponse:", res.data);
        toast.error(res.data.error || "Erreur lors du chargement des matchings");
        setMatches([]);
      }
    } catch (error) {
      console.error("❌ Erreur lors du chargement des matchings:", error);
      
      if (axios.isAxiosError(error)) {
        if (error.response?.status === 404) {
          toast.error("Appel d'offre introuvable");
        } else if (error.response?.status === 500) {
          console.error("Détails erreur 500:", error.response.data);
          toast.error("Erreur serveur lors du chargement des matchings");
        } else {
          toast.error(`Erreur de connexion: ${error.response?.status || 'Unknown'}`);
        }
      } else {
        toast.error("Erreur de connexion au serveur");
      }
      setMatches([]);
    } finally {
      setLoading(false);
    }
  };

  // Récupération des détails de l'appel d'offre scrapé
  const fetchOfferDetails = async () => {
    try {
      console.log(`🔄 Récupération détails AO ${offerId}`);
      const res = await axios.get(`http://localhost:8000/api/admin/appels/${offerId}/`);
      console.log("Détails AO scrapé:", res.data);
      setOffer(res.data);
      
      // Charger les critères d'évaluation structurés
      try {
        const criteriaRes = await axios.get(`http://localhost:8000/api/appels/${offerId}/criteres/`);
        if (criteriaRes.data.criteres) {
          setCriteria(criteriaRes.data.criteres);
        } else {
          setCriteria([]);
        }
      } catch (err) {
        console.error("Erreur lors du chargement des critères:", err);
        setCriteria([]);
      }
    } catch (error) {
      console.error("Erreur lors du chargement des détails de l'offre:", error);
      toast.error("Impossible de charger les détails de l'offre");
    }
  };

  // Génération de nouveaux matchings avec la nouvelle API
  const generateMatches = async () => {
    setGenerating(true);
    try {
      console.log(`🔄 Génération des matchings pour AO ${offerId}`);
      toast.loading("Génération des matchings pour l'appel d'offre scrapé...");
      
      const res = await axios.post(`http://localhost:8000/api/matching/offer/${offerId}/`);
      
      toast.dismiss();
      
      if (res.data.success) {
        const cleanedMatches = (res.data.matches || []).map(match => ({
          ...match,
          score: parseFloat(match.score) || 0,
          date_match_score: parseFloat(match.date_match_score) || 0,
          skills_match_score: parseFloat(match.skills_match_score) || 0,
          top_skills: Array.isArray(match.top_skills) ? match.top_skills : []
        }));
        
        console.log("Nouveaux matchings générés:", cleanedMatches);
        
        setMatches(cleanedMatches);
        setLastRefresh(new Date());
        
        // Afficher les statistiques de génération
        if (res.data.stats) {
          setMatchingStats(res.data.stats);
          toast.success(
            `${cleanedMatches.length} matching(s) généré(s) - Score moyen: ${Math.round(res.data.stats.avg)}%`
          );
        } else {
          toast.success(`${cleanedMatches.length} matching(s) généré(s) avec succès`);
        }
        
        // Afficher des informations sur l'enrichissement si disponibles
        if (res.data.appel_offre_info && !res.data.appel_offre_info.has_description) {
          toast.info("💡 Enrichir la description améliorerait la précision du matching");
        }
      } else {
        console.error("❌ Erreur dans la génération:", res.data);
        toast.error(res.data.error || "Erreur lors de la génération des matchings");
      }
    } catch (error) {
      console.error("❌ Erreur lors de la génération des matchings:", error);
      
      if (axios.isAxiosError(error)) {
        if (error.response?.status === 404) {
          toast.error("Appel d'offre introuvable");
        } else if (error.response?.status === 500) {
          console.error("Détails erreur 500:", error.response.data);
          toast.error("Erreur serveur lors de la génération. Vérifiez les logs serveur.");
        } else {
          toast.error(`Erreur de connexion: ${error.response?.status || 'Unknown'}`);
        }
      } else {
        toast.error("Erreur de connexion au serveur");
      }
    } finally {
      setGenerating(false);
    }
  };

  // Validation/invalidation d'un matching (inchangé)
  const toggleValidation = async (matchId: number) => {
    setValidating(matchId);
    try {
      const res = await axios.put(`http://localhost:8000/api/matching/validate/${matchId}/`);
      if (res.data.success) {
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
      toast.error("Erreur de connexion au serveur");
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

  // Fonctions utilitaires (mises à jour)
  const getScoreBadgeColor = (score: number) => {
    if (score >= 75) return "bg-emerald-100 text-emerald-800 border-emerald-300";
    if (score >= 50) return "bg-blue-100 text-blue-800 border-blue-300";
    if (score >= 25) return "bg-amber-100 text-amber-800 border-amber-300";
    return "bg-red-100 text-red-800 border-red-300";
  };

  const getDomainBadgeColor = (domain: string) => {
    switch(domain) {
      case 'DIGITAL': return 'bg-indigo-100 text-indigo-800 border-indigo-300';
      case 'FINANCE': return 'bg-emerald-100 text-emerald-800 border-emerald-300';
      case 'ENERGIE': return 'bg-amber-100 text-amber-800 border-amber-300';
      case 'INDUSTRIE': return 'bg-purple-100 text-purple-800 border-purple-300';
      default: return 'bg-gray-100 text-gray-800 border-gray-300';
    }
  };

  const getDomainName = (code: string) => {
    switch(code) {
      case 'DIGITAL': return 'Digital et Télécoms';
      case 'FINANCE': return 'Secteur bancaire et financier';
      case 'ENERGIE': return 'Transition énergétique';
      case 'INDUSTRIE': return 'Industrie et Mines';
      default: return code;
    }
  };

  const getStatusBadge = (offer: ScrapedOfferData) => {
    if (!offer.date_limite) {
      return <Badge className="bg-gray-100 text-gray-800 border-gray-300">Date limite non définie</Badge>;
    }
    
    if (offer.is_expired) {
      return <Badge className="bg-red-100 text-red-800 border-red-300">Expiré</Badge>;
    } else if (offer.days_remaining !== undefined && offer.days_remaining <= 7) {
      return <Badge className="bg-amber-100 text-amber-800 border-amber-300">Urgent ({offer.days_remaining}j)</Badge>;
    } else {
      return <Badge className="bg-green-100 text-green-800 border-green-300">Actif</Badge>;
    }
  };

  const getEnrichmentLevel = (offer: ScrapedOfferData) => {
    let level = 0;
    let total = 4;
    
    if (offer.description && offer.description.length > 100) level++;
    if (offer.critere_evaluation && offer.critere_evaluation.length > 50) level++;
    if (offer.type_d_appel_d_offre) level++;
    if (criteria.length > 0) level++;
    
    return { level, total, percentage: (level / total) * 100 };
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
  const formatDate = (dateString: string | undefined) => {
    if (!dateString) return "Non définie";
    try {
      const date = new Date(dateString);
      return new Intl.DateTimeFormat('fr-FR').format(date);
    } catch {
      return "Non définie";
    }
  };

  return (
    <AdminLayout>
      <div className="space-y-6 p-6 bg-gradient-to-br from-slate-50 to-blue-50 min-h-screen">
        {/* En-tête amélioré */}
        <div className="bg-white rounded-2xl shadow-lg border border-gray-100 overflow-hidden">
          <div className="bg-gradient-to-r from-blue-600 to-indigo-600 p-6 text-white">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-4">
                <TooltipProvider>
                  <Tooltip>
                    <TooltipTrigger asChild>
                      <Button 
                        variant="secondary" 
                        size="sm" 
                        onClick={() => navigate("/admin/appels-offres")}
                        className="h-10 w-10 rounded-full bg-white/20 hover:bg-white/30 border-0"
                      >
                        <ArrowLeftIcon className="h-5 w-5" />
                      </Button>
                    </TooltipTrigger>
                    <TooltipContent>
                      <p>Retour aux appels d'offres</p>
                    </TooltipContent>
                  </Tooltip>
                </TooltipProvider>
                <div>
                  <h1 className="text-2xl font-bold flex items-center gap-3">
                    <GlobeIcon className="h-7 w-7" />
                    Matching - Appel d'offre scrapé
                  </h1>
                  {offer ? (
                    <div className="text-blue-100 mt-1 flex items-center">
                      <BriefcaseIcon className="h-4 w-4 mr-2" />
                      <span className="font-medium">{offer.titre}</span>
                      <span className="mx-2">•</span>
                      <span>{offer.client || "Client non spécifié"}</span>
                    </div>
                  ) : loading ? (
                    <Skeleton className="h-4 w-48 mt-1 bg-white/20" />
                  ) : null}
                </div>
              </div>
              <div className="flex gap-3">
                <Button 
                  onClick={generateMatches} 
                  disabled={generating || loading}
                  className="bg-white/20 hover:bg-white/30 border border-white/30 text-white backdrop-blur-sm"
                >
                  <RefreshCwIcon className={`h-4 w-4 mr-2 ${generating ? 'animate-spin' : ''}`} />
                  {generating ? "Génération..." : "Générer Matchings"}
                </Button>
              </div>
            </div>
          </div>

          {/* Métriques de matching */}
          {matchingStats && (
            <div className="p-6 bg-gray-50 border-b">
              <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                <div className="bg-white rounded-lg p-4 text-center border">
                  <div className="text-2xl font-bold text-blue-600">{matchingStats.count}</div>
                  <div className="text-sm text-gray-600">Consultants évalués</div>
                </div>
                <div className="bg-white rounded-lg p-4 text-center border">
                  <div className="text-2xl font-bold text-emerald-600">{Math.round(matchingStats.avg)}%</div>
                  <div className="text-sm text-gray-600">Score moyen</div>
                </div>
                <div className="bg-white rounded-lg p-4 text-center border">
                  <div className="text-2xl font-bold text-purple-600">{Math.round(matchingStats.max)}%</div>
                  <div className="text-sm text-gray-600">Meilleur score</div>
                </div>
                <div className="bg-white rounded-lg p-4 text-center border">
                  <div className="text-2xl font-bold text-orange-600">
                    {matches.filter(m => m.is_validated).length}
                  </div>
                  <div className="text-sm text-gray-600">Validés</div>
                </div>
              </div>
            </div>
          )}
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Détails de l'offre scrapée */}
          {loading && !offer ? (
            <Card className="lg:col-span-2">
              <CardHeader>
                <Skeleton className="h-6 w-48" />
              </CardHeader>
              <CardContent>
                <div className="space-y-2">
                  <Skeleton className="h-4 w-full" />
                  <Skeleton className="h-4 w-3/4" />
                </div>
              </CardContent>
            </Card>
          ) : offer ? (
            <Card className="lg:col-span-2 shadow-md hover:shadow-lg transition-all duration-200">
              <CardHeader className="pb-3 border-b">
                <div className="flex items-center justify-between">
                  <CardTitle className="flex items-center gap-2 text-blue-700">
                    <FileTextIcon className="h-5 w-5" />
                    Appel d'offre scrapé
                  </CardTitle>
                  <div className="flex items-center gap-2">
                    {getStatusBadge(offer)}
                    {offer.type_d_appel_d_offre && (
                      <Badge variant="outline" className="rounded-full">
                        {offer.type_d_appel_d_offre}
                      </Badge>
                    )}
                  </div>
                </div>
                
                {/* Niveau d'enrichissement */}
                {(() => {
                  const enrichment = getEnrichmentLevel(offer);
                  return (
                    <div className="mt-3">
                      <div className="flex items-center justify-between text-sm">
                        <span className="text-gray-600">Niveau d'enrichissement</span>
                        <span className="font-medium">{enrichment.level}/{enrichment.total}</span>
                      </div>
                      <div className="w-full bg-gray-200 rounded-full h-2 mt-1">
                        <div 
                          className={`h-2 rounded-full transition-all duration-300 ${
                            enrichment.percentage >= 75 ? 'bg-emerald-500' :
                            enrichment.percentage >= 50 ? 'bg-blue-500' :
                            enrichment.percentage >= 25 ? 'bg-amber-500' : 'bg-red-500'
                          }`}
                          style={{ width: `${enrichment.percentage}%` }}
                        ></div>
                      </div>
                    </div>
                  );
                })()}
              </CardHeader>
              <CardContent className="pt-4">
                <div className="space-y-4">
                  {/* Informations de base */}
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="bg-gray-50 p-4 rounded-lg">
                      <p className="text-sm font-medium text-gray-500 mb-1">Titre</p>
                      <p className="font-semibold text-gray-800">{offer.titre}</p>
                    </div>
                    <div className="bg-gray-50 p-4 rounded-lg">
                      <p className="text-sm font-medium text-gray-500 mb-1">Client</p>
                      <p className="font-semibold text-gray-800">{offer.client || "Non spécifié"}</p>
                    </div>
                    <div className="bg-gray-50 p-4 rounded-lg">
                      <p className="text-sm font-medium text-gray-500 mb-1">Date de publication</p>
                      <p className="font-semibold text-gray-800 flex items-center">
                        <CalendarIcon className="h-4 w-4 mr-2 text-blue-500" />
                        {formatDate(offer.date_de_publication)}
                      </p>
                    </div>
                    <div className="bg-gray-50 p-4 rounded-lg">
                      <p className="text-sm font-medium text-gray-500 mb-1">Date limite</p>
                      <p className="font-semibold text-gray-800 flex items-center">
                        <ClockIcon className="h-4 w-4 mr-2 text-red-500" />
                        {formatDate(offer.date_limite)}
                      </p>
                    </div>
                  </div>

                  {/* Description */}
                  {offer.description ? (
                    <div className="bg-gray-50 p-4 rounded-lg">
                      <p className="text-sm font-medium text-gray-500 mb-2">Description</p>
                      <p className="text-gray-800 leading-relaxed">{offer.description}</p>
                    </div>
                  ) : (
                    <div className="bg-amber-50 border border-amber-200 rounded-lg p-4">
                      <div className="flex items-center">
                        <AlertCircleIcon className="h-5 w-5 text-amber-600 mr-2" />
                        <div>
                          <p className="text-amber-800 font-medium">Description manquante</p>
                          <p className="text-amber-700 text-sm mt-1">
                            Enrichir la description améliorerait la précision du matching automatique.
                          </p>
                        </div>
                      </div>
                    </div>
                  )}

                  {/* Critères d'évaluation textuels */}
                  {offer.critere_evaluation && (
                    <div className="bg-gray-50 p-4 rounded-lg">
                      <p className="text-sm font-medium text-gray-500 mb-2">Critères d'évaluation</p>
                      <p className="text-gray-800 leading-relaxed">{offer.critere_evaluation}</p>
                    </div>
                  )}

                  {/* Critères structurés */}
                  {criteria.length > 0 && (
                    <div>
                      <p className="text-sm font-medium text-gray-500 mb-3 flex items-center">
                        <BarChart3Icon className="h-4 w-4 mr-2 text-blue-500" />
                        Critères d'évaluation structurés ({criteria.length})
                      </p>
                      <div className="flex flex-wrap gap-2">
                        {criteria.map(criterion => (
                          <Badge 
                            key={criterion.id} 
                            variant="outline" 
                            className="flex gap-2 items-center bg-white border-2 border-blue-200 px-3 py-1.5 rounded-full"
                          >
                            {criterion.nom_critere}
                            <span className="bg-blue-100 text-blue-800 text-xs px-2 py-0.5 rounded-full font-bold">
                              {criterion.poids}%
                            </span>
                          </Badge>
                        ))}
                      </div>
                    </div>
                  )}

                  {/* Documents */}
                  {offer.documents && (
                    <div className="bg-gray-50 p-4 rounded-lg">
                      <p className="text-sm font-medium text-gray-500 mb-2">Documents</p>
                      <p className="text-gray-800 leading-relaxed">{offer.documents}</p>
                    </div>
                  )}

                  {/* Lien vers la source */}
                  {offer.lien_site && (
                    <div>
                      <Button
                        onClick={() => window.open(offer.lien_site, '_blank')}
                        variant="outline"
                        className="w-full border-blue-200 text-blue-600 hover:bg-blue-50"
                      >
                        <ExternalLinkIcon className="h-4 w-4 mr-2" />
                        Voir l'annonce originale
                      </Button>
                    </div>
                  )}
                </div>
              </CardContent>
            </Card>
          ) : null}

          {/* Tableau de bord du matching */}
          <Card className="shadow-md hover:shadow-lg transition-all duration-200 bg-gradient-to-br from-blue-50 to-white">
            <CardHeader className="pb-3 border-b">
              <CardTitle className="flex items-center gap-2 text-blue-700">
                <TrendingUpIcon className="h-5 w-5" />
                Tableau de bord
              </CardTitle>
            </CardHeader>
            <CardContent className="pt-4 space-y-4">
              <div className="bg-white rounded-lg p-4 shadow-sm border">
                <div className="flex items-center justify-between">
                  <p className="text-sm font-medium text-gray-500">Matchings totaux</p>
                  <span className="bg-blue-100 text-blue-800 px-2 py-0.5 rounded-full text-xs font-bold">
                    {matches.length}
                  </span>
                </div>
              </div>
              
              <div className="bg-white rounded-lg p-4 shadow-sm border">
                <div className="flex items-center justify-between">
                  <p className="text-sm font-medium text-gray-500">Consultants validés</p>
                  <span className="bg-emerald-100 text-emerald-800 px-2 py-0.5 rounded-full text-xs font-bold">
                    {matches.filter(m => m.is_validated).length}
                  </span>
                </div>
              </div>
              
              {matchingStats && (
                <>
                  <div className="bg-white rounded-lg p-4 shadow-sm border">
                    <div className="flex items-center justify-between">
                      <p className="text-sm font-medium text-gray-500">Score moyen</p>
                      <span className="bg-purple-100 text-purple-800 px-2 py-0.5 rounded-full text-xs font-bold">
                        {Math.round(matchingStats.avg)}%
                      </span>
                    </div>
                  </div>
                  
                  <div className="bg-white rounded-lg p-4 shadow-sm border">
                    <div className="flex items-center justify-between">
                      <p className="text-sm font-medium text-gray-500">Meilleur score</p>
                      <span className="bg-emerald-100 text-emerald-800 px-2 py-0.5 rounded-full text-xs font-bold">
                        {Math.round(matchingStats.max)}%
                      </span>
                    </div>
                  </div>
                </>
              )}

              {lastRefresh && (
                <div className="bg-white rounded-lg p-4 shadow-sm border">
                  <div className="flex items-center justify-between">
                    <p className="text-sm font-medium text-gray-500">Dernière mise à jour</p>
                    <span className="text-gray-600 text-xs">
                      {lastRefresh.toLocaleTimeString()}
                    </span>
                  </div>
                </div>
              )}

              {/* Recommandations d'amélioration */}
              {offer && !offer.description && (
                <div className="bg-amber-50 border border-amber-200 rounded-lg p-4">
                  <div className="flex items-start">
                    <AlertCircleIcon className="h-4 w-4 text-amber-600 mr-2 mt-0.5" />
                    <div>
                      <p className="text-amber-800 text-xs font-medium">Amélioration suggérée</p>
                      <p className="text-amber-700 text-xs mt-1">
                        Enrichir la description pour un matching plus précis
                      </p>
                    </div>
                  </div>
                </div>
              )}

              {criteria.length === 0 && (
                <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
                  <div className="flex items-start">
                    <BarChart3Icon className="h-4 w-4 text-blue-600 mr-2 mt-0.5" />
                    <div>
                      <p className="text-blue-800 text-xs font-medium">Suggestion</p>
                      <p className="text-blue-700 text-xs mt-1">
                        Ajouter des critères structurés améliorerait la précision
                      </p>
                    </div>
                  </div>
                </div>
              )}
            </CardContent>
          </Card>
        </div>

        {/* Table des matchings */}
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
                  {matchingStats && ` • Score moyen: ${Math.round(matchingStats.avg)}%`}
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
                <div className="flex flex-col items-center">
                  <div className="animate-spin rounded-full h-10 w-10 border-b-2 border-blue-600 mb-4"></div>
                  <p className="text-gray-500">Analyse des matchings...</p>
                </div>
              </div>
            ) : filteredMatches.length > 0 ? (
              <Table>
                <TableHeader>
                  <TableRow className="bg-gray-50">
                    <TableHead className="font-semibold text-gray-700">Consultant</TableHead>
                    <TableHead className="font-semibold text-gray-700">Domaine</TableHead>
                    <TableHead className="font-semibold text-gray-700">Expertise</TableHead>
                    <TableHead className="font-semibold text-gray-700">Contact</TableHead>
                    <TableHead className="font-semibold text-gray-700">Score de matching</TableHead>
                    <TableHead className="font-semibold text-gray-700">Statut</TableHead>
                    <TableHead className="text-right font-semibold text-gray-700">Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filteredMatches.map((match, index) => {
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
                            <div>
                              <span className="font-semibold text-gray-800">{match.consultant_name}</span>
                              {match.top_skills && match.top_skills.length > 0 && (
                                <div className="text-xs text-gray-500 mt-1">
                                  {match.top_skills.slice(0, 2).join(', ')}
                                  {match.top_skills.length > 2 && '...'}
                                </div>
                              )}
                            </div>
                          </div>
                        </TableCell>
                        <TableCell>
                          <Badge className={`${getDomainBadgeColor(match.domaine_principal)} px-2 py-1 border`}>
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
                            {/* Graphique circulaire du score global */}
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
                            
                            {/* Affichage des scores détaillés adapté au nouveau modèle */}
                            <div className="mt-2 w-full text-xs">
                              <div className="flex items-center justify-between px-1 mb-1">
                                <span className="text-gray-600">Disponibilité:</span>
                                <Badge className={getScoreBadgeColor(match.date_match_score)}>
                                  {Math.round(match.date_match_score)}%
                                </Badge>
                              </div>
                              <div className="flex items-center justify-between px-1">
                                <span className="text-gray-600">Compétences:</span>
                                <Badge className={getScoreBadgeColor(match.skills_match_score)}>
                                  {Math.round(match.skills_match_score)}%
                                </Badge>
                              </div>
                            </div>
                          </div>
                        </TableCell>
                        <TableCell>
                          {match.is_validated ? (
                            <Badge className="bg-emerald-100 text-emerald-800 px-3 py-1 flex items-center gap-1.5 border border-emerald-300">
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
                <p className="text-gray-600 mb-4">Aucun matching trouvé pour cette offre scrapée.</p>
                <div className="space-y-2 mb-4">
                  <p className="text-sm text-gray-500">
                    Cet appel d'offre provient du scraping automatique.
                  </p>
                  {offer && !offer.description && (
                    <p className="text-sm text-amber-600">
                      💡 Enrichir la description améliorerait significativement la qualité du matching.
                    </p>
                  )}
                  {criteria.length === 0 && (
                    <p className="text-sm text-blue-600">
                      ℹ️ Ajouter des critères structurés optimiserait l'algorithme de matching.
                    </p>
                  )}
                </div>
                <div className="flex flex-col sm:flex-row gap-3 justify-center">
                  <Button 
                    onClick={generateMatches} 
                    className="bg-blue-600 hover:bg-blue-700 shadow-md"
                    disabled={generating}
                  >
                    <RefreshCwIcon className={`h-4 w-4 mr-2 ${generating ? 'animate-spin' : ''}`} />
                    Générer des matchings
                  </Button>
                  {offer && (!offer.description || criteria.length === 0) && (
                    <Button 
                      onClick={() => navigate(`/admin/appels-offres`)} 
                      variant="outline"
                      className="border-blue-200 text-blue-600 hover:bg-blue-50"
                    >
                      <FileTextIcon className="h-4 w-4 mr-2" />
                      Enrichir l'offre
                    </Button>
                  )}
                </div>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Notification d'information sur les appels d'offres scrapés */}
        {offer && (
          <div className="fixed bottom-4 right-4 bg-gradient-to-r from-blue-50 to-indigo-50 border border-blue-200 rounded-xl p-4 shadow-lg max-w-sm backdrop-blur-sm">
            <div className="flex items-start">
              <GlobeIcon className="h-5 w-5 text-blue-600 mr-2 mt-0.5 flex-shrink-0" />
              <div>
                {/* CORRECTION: Changer <p> en <div> pour contenir Badge */}
                <div className="text-sm text-blue-800 font-medium flex items-center gap-1">
                  <span>Appel d'offre scrapé</span>
                  {(() => {
                    const enrichment = getEnrichmentLevel(offer);
                    return (
                      <Badge 
                        className={`ml-2 text-xs ${
                          enrichment.percentage >= 75 ? 'bg-emerald-100 text-emerald-800' :
                          enrichment.percentage >= 50 ? 'bg-blue-100 text-blue-800' :
                          enrichment.percentage >= 25 ? 'bg-amber-100 text-amber-800' : 'bg-red-100 text-red-800'
                        }`}
                      >
                        {Math.round(enrichment.percentage)}% enrichi
                      </Badge>
                    );
                  })()}
                </div>
                <p className="text-xs text-blue-700 mt-1">
                  Source: {offer.lien_site ? "Externe" : "Scraping automatique"}
                  {(() => {
                    const enrichment = getEnrichmentLevel(offer);
                    if (enrichment.percentage < 75) {
                      return " • Enrichissement recommandé pour améliorer le matching";
                    }
                    return " • Données optimisées pour le matching";
                  })()}
                </p>
              </div>
            </div>
          </div>
        )}
      </div>
    </AdminLayout>
  );
};

export default OffreMatchingUpdated;