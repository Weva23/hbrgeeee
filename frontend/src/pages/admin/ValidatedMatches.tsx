import React, { useState, useEffect } from "react";
import axios from "axios";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle, CardDescription, CardFooter } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { UserIcon, BriefcaseIcon, CalendarIcon, SearchIcon, RefreshCwIcon, CheckCircleIcon, ArrowRightIcon, FilterIcon, TrendingUpIcon, GlobeIcon, ExternalLinkIcon, ClockIcon, AlertTriangleIcon } from "lucide-react";
import AdminLayout from "@/components/admin/AdminLayout";
import { toast } from "sonner";
import { useNavigate } from "react-router-dom";
import { Input } from "@/components/ui/input";
import { motion } from "framer-motion";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";
import { Separator } from "@/components/ui/separator";

interface MatchData {
  id: number;
  consultant_id: number;
  consultant_name: string;
  appel_offre_id: number;
  appel_offre_name: string;
  client: string;
  score: number;
  date_validation: string;
  domaine_principal?: string;
  consultant_expertise?: string;
  email?: string;
  is_scraped_offer?: boolean;
  source_type?: 'scraped' | 'manual';
  date_de_publication?: string;
  date_limite?: string;
  is_expired?: boolean;
  days_remaining?: number;
  type_appel_offre?: string;
  description_courte?: string;
  lien_site?: string;
}

interface MatchingStats {
  total_matches: number;
  avg_score: number;
  best_score: number;
  domains_distribution: { [key: string]: number };
  recent_validations: number;
}

const ValidatedMatches = () => {
  const [matches, setMatches] = useState<MatchData[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [searchTerm, setSearchTerm] = useState("");
  const [domainFilter, setDomainFilter] = useState<string | null>(null);
  const [sourceFilter, setSourceFilter] = useState<'all' | 'scraped' | 'manual'>('all');
  const [stats, setStats] = useState<MatchingStats | null>(null);
  const navigate = useNavigate();

  useEffect(() => {
    fetchValidatedMatches();
  }, []);

  const fetchValidatedMatches = async () => {
    setLoading(true);
    setError(null);
    
    try {
      console.log("🔄 Début récupération des matchings validés...");
      
      // Essayer plusieurs endpoints en cas d'erreur
      const endpoints = [
        "http://localhost:8000/api/validated-matches/",
        "http://localhost:8000/api/validated-matches-updated/",
        "http://localhost:8000/validated-matches/"
      ];
      
      let res = null;
      let lastError = null;
      
      for (const endpoint of endpoints) {
        try {
          console.log(`📡 Tentative avec endpoint: ${endpoint}`);
          res = await axios.get(endpoint);
          console.log(`✅ Succès avec endpoint: ${endpoint}`);
          break;
        } catch (endpointError) {
          console.warn(`❌ Échec avec endpoint: ${endpoint}`, endpointError);
          lastError = endpointError;
          continue;
        }
      }
      
      if (!res) {
        throw lastError;
      }
      
      console.log("📊 Données brutes reçues:", res.data);
      
      // Vérifier si les données sont dans un format attendu
      let matchesData = [];
      
      if (Array.isArray(res.data)) {
        matchesData = res.data;
      } else if (res.data && Array.isArray(res.data.data)) {
        matchesData = res.data.data;
      } else if (res.data && res.data.success && Array.isArray(res.data.matches)) {
        matchesData = res.data.matches;
      } else {
        console.warn("⚠️ Format de données inattendu:", res.data);
        matchesData = [];
      }
      
      console.log(`✅ ${matchesData.length} matchings validés trouvés`);
      
      // Nettoyer et valider chaque matching
      const cleanedMatches = matchesData.map((match: any) => {
        // Gestion sécurisée des données
        const cleanedMatch: MatchData = {
          id: match.id || Math.random(),
          consultant_id: match.consultant_id || 0,
          consultant_name: match.consultant_name || 'Nom non disponible',
          appel_offre_id: match.appel_offre_id || 0,
          appel_offre_name: match.appel_offre_name || 'Titre non disponible',
          client: match.client || 'Client non spécifié',
          score: parseFloat(match.score) || 0,
          date_validation: match.date_validation || new Date().toISOString(),
          domaine_principal: match.domaine_principal || 'DIGITAL',
          consultant_expertise: match.consultant_expertise || 'Débutant',
          email: match.email || '',
          is_scraped_offer: match.is_scraped_offer !== false, // Par défaut true
          source_type: match.source_type || 'scraped',
          date_de_publication: match.date_de_publication || null,
          date_limite: match.date_limite || null,
          is_expired: match.is_expired || false,
          days_remaining: match.days_remaining || null,
          type_appel_offre: match.type_appel_offre || '',
          description_courte: match.description_courte || '',
          lien_site: match.lien_site || ''
        };
        
        return cleanedMatch;
      });
      
      console.log("🧹 Matchings nettoyés:", cleanedMatches);
      setMatches(cleanedMatches);
      
      // Calculer les statistiques
      calculateStats(cleanedMatches);
      
      toast.success(`${cleanedMatches.length} matchings validés chargés`);
      
    } catch (error: any) {
      console.error("❌ Erreur lors du chargement des matchings validés:", error);
      
      const errorMessage = error.response?.data?.error || 
                          error.response?.data?.message || 
                          error.message || 
                          "Erreur de connexion au serveur";
      
      setError(errorMessage);
      toast.error("Erreur lors du chargement des matchings validés");
      
      // Données de fallback pour éviter une page blanche
      setMatches([]);
    } finally {
      setLoading(false);
    }
  };

  const calculateStats = (matchesData: MatchData[]) => {
    if (matchesData.length === 0) {
      setStats(null);
      return;
    }

    const scores = matchesData.map(m => m.score);
    const domains = matchesData.reduce((acc, match) => {
      const domain = match.domaine_principal || 'Non spécifié';
      acc[domain] = (acc[domain] || 0) + 1;
      return acc;
    }, {} as { [key: string]: number });

    // Compter les validations récentes (7 derniers jours)
    const weekAgo = new Date();
    weekAgo.setDate(weekAgo.getDate() - 7);
    const recentValidations = matchesData.filter(match => {
      try {
        return new Date(match.date_validation) > weekAgo;
      } catch {
        return false;
      }
    }).length;

    setStats({
      total_matches: matchesData.length,
      avg_score: scores.reduce((a, b) => a + b, 0) / scores.length,
      best_score: Math.max(...scores),
      domains_distribution: domains,
      recent_validations: recentValidations
    });
  };

  const formatDate = (dateString: string) => {
    if (!dateString) return "N/A";
    try {
      const date = new Date(dateString);
      return new Intl.DateTimeFormat('fr-FR', {
        day: '2-digit',
        month: '2-digit',
        year: 'numeric',
        hour: '2-digit',
        minute: '2-digit'
      }).format(date);
    } catch {
      return "Date invalide";
    }
  };

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
      default: return code || 'Non spécifié';
    }
  };

  const getSourceIcon = (sourceType: string) => {
    return sourceType === 'scraped' ? <GlobeIcon className="h-4 w-4" /> : <BriefcaseIcon className="h-4 w-4" />;
  };

  const getSourceBadge = (sourceType: string) => {
    return sourceType === 'scraped' ? (
      <Badge className="bg-blue-100 text-blue-800 border-blue-300 flex items-center gap-1">
        <GlobeIcon className="h-3 w-3" />
        Scrapé
      </Badge>
    ) : (
      <Badge className="bg-gray-100 text-gray-800 border-gray-300 flex items-center gap-1">
        <BriefcaseIcon className="h-3 w-3" />
        Manuel
      </Badge>
    );
  };

  // Filtrer les matchings selon la recherche et les filtres
  const filteredMatches = matches.filter(match => {
    const searchLower = searchTerm.toLowerCase();
    const matchesSearch = (
      match.consultant_name.toLowerCase().includes(searchLower) ||
      match.appel_offre_name.toLowerCase().includes(searchLower) ||
      match.client.toLowerCase().includes(searchLower) ||
      (match.email && match.email.toLowerCase().includes(searchLower))
    );

    const matchesDomain = !domainFilter || match.domaine_principal === domainFilter;
    const matchesSource = sourceFilter === 'all' || match.source_type === sourceFilter;

    return matchesSearch && matchesDomain && matchesSource;
  });

  // Extraire les domaines uniques pour le filtre
  const uniqueDomains = Array.from(new Set(matches.map(match => match.domaine_principal).filter(Boolean)));

  // Composant d'erreur
  if (error && !loading) {
    return (
      <AdminLayout>
        <div className="min-h-screen bg-gradient-to-br from-slate-50 to-blue-50 p-6">
          <Card className="max-w-2xl mx-auto mt-20">
            <CardHeader className="text-center">
              <div className="mx-auto w-16 h-16 bg-red-100 rounded-full flex items-center justify-center mb-4">
                <AlertTriangleIcon className="h-8 w-8 text-red-600" />
              </div>
              <CardTitle className="text-red-600">Erreur de chargement</CardTitle>
              <CardDescription className="text-gray-600">
                Impossible de récupérer les matchings validés
              </CardDescription>
            </CardHeader>
            <CardContent className="text-center">
              <p className="text-sm text-gray-500 mb-4">
                {error}
              </p>
              <Button onClick={fetchValidatedMatches} className="mx-auto">
                <RefreshCwIcon className="h-4 w-4 mr-2" />
                Réessayer
              </Button>
            </CardContent>
          </Card>
        </div>
      </AdminLayout>
    );
  }

  return (
    <AdminLayout>
      <div className="space-y-6 p-6 bg-gradient-to-br from-slate-50 to-blue-50 min-h-screen">
        {/* En-tête avec statistiques */}
        <div className="bg-white rounded-2xl shadow-lg border border-gray-100 overflow-hidden">
          <div className="bg-gradient-to-r from-emerald-600 to-teal-600 p-6 text-white">
            <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
              <div>
                <h1 className="text-2xl font-bold flex items-center gap-2">
                  <CheckCircleIcon className="h-6 w-6" />
                  Matchings validés
                </h1>
                <p className="text-emerald-100 mt-1">
                  Liste des consultants assignés à des missions • Système unifié
                </p>
                {stats && (
                  <div className="flex items-center gap-4 mt-2 text-sm text-emerald-100">
                    <span>{stats.total_matches} assignation(s) active(s)</span>
                    <span>•</span>
                    <span>Score moyen: {Math.round(stats.avg_score)}%</span>
                    <span>•</span>
                    <span>{stats.recent_validations} récente(s)</span>
                  </div>
                )}
              </div>
              <div className="flex flex-col sm:flex-row gap-3 w-full md:w-auto">
                <div className="relative flex-grow">
                  <SearchIcon className="h-4 w-4 absolute left-3 top-3 text-white/70" />
                  <Input 
                    placeholder="Rechercher..." 
                    value={searchTerm} 
                    onChange={(e) => setSearchTerm(e.target.value)} 
                    className="pl-10 bg-white/20 border-white/30 text-white placeholder:text-white/70 rounded-full focus:bg-white/30 focus:border-white/50 w-full"
                  />
                </div>
                <TooltipProvider>
                  <Tooltip>
                    <TooltipTrigger asChild>
                      <Button 
                        onClick={fetchValidatedMatches} 
                        variant="outline" 
                        size="icon"
                        className="h-10 w-10 rounded-full border-white/30 bg-white/20 hover:bg-white/30 text-white border backdrop-blur-sm"
                        disabled={loading}
                      >
                        <RefreshCwIcon className={`h-4 w-4 ${loading ? 'animate-spin' : ''}`} />
                      </Button>
                    </TooltipTrigger>
                    <TooltipContent>
                      <p>Actualiser la liste</p>
                    </TooltipContent>
                  </Tooltip>
                </TooltipProvider>
              </div>
            </div>
          </div>

          {/* Statistiques détaillées */}
          {stats && (
            <div className="p-6 bg-gray-50 border-b">
              <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                <div className="bg-white rounded-lg p-4 text-center border shadow-sm">
                  <div className="text-2xl font-bold text-emerald-600">{stats.total_matches}</div>
                  <div className="text-sm text-gray-600">Assignations totales</div>
                </div>
                <div className="bg-white rounded-lg p-4 text-center border shadow-sm">
                  <div className="text-2xl font-bold text-blue-600">{Math.round(stats.avg_score)}%</div>
                  <div className="text-sm text-gray-600">Score moyen</div>
                </div>
                <div className="bg-white rounded-lg p-4 text-center border shadow-sm">
                  <div className="text-2xl font-bold text-purple-600">{Math.round(stats.best_score)}%</div>
                  <div className="text-sm text-gray-600">Meilleur score</div>
                </div>
                <div className="bg-white rounded-lg p-4 text-center border shadow-sm">
                  <div className="text-2xl font-bold text-orange-600">{stats.recent_validations}</div>
                  <div className="text-sm text-gray-600">Cette semaine</div>
                </div>
              </div>
              
              {/* Répartition par domaine */}
              {Object.keys(stats.domains_distribution).length > 0 && (
                <div className="mt-4">
                  <p className="text-sm font-medium text-gray-700 mb-2">Répartition par domaine:</p>
                  <div className="flex flex-wrap gap-2">
                    {Object.entries(stats.domains_distribution).map(([domain, count]) => (
                      <Badge 
                        key={domain} 
                        className={`${getDomainBadgeColor(domain)} border px-3 py-1`}
                      >
                        {getDomainName(domain)}: {count}
                      </Badge>
                    ))}
                  </div>
                </div>
              )}
            </div>
          )}
        </div>

        {/* Filtres avancés */}
        <Card className="shadow-md">
          <CardHeader className="pb-3">
            <CardTitle className="text-lg flex items-center gap-2">
              <FilterIcon className="h-5 w-5 text-blue-600" />
              Filtres et options
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex flex-wrap gap-4">
              <div className="flex items-center gap-2">
                <label className="text-sm font-medium text-gray-700">Domaine:</label>
                <select
                  value={domainFilter || ''}
                  onChange={(e) => setDomainFilter(e.target.value || null)}
                  className="px-3 py-1 border border-gray-300 rounded-md text-sm focus:border-blue-300 focus:ring focus:ring-blue-200 focus:ring-opacity-50"
                >
                  <option value="">Tous les domaines</option>
                  {uniqueDomains.map(domain => (
                    <option key={domain} value={domain}>{getDomainName(domain)}</option>
                  ))}
                </select>
              </div>
              
              <div className="flex items-center gap-2">
                <label className="text-sm font-medium text-gray-700">Source:</label>
                <select
                  value={sourceFilter}
                  onChange={(e) => setSourceFilter(e.target.value as 'all' | 'scraped' | 'manual')}
                  className="px-3 py-1 border border-gray-300 rounded-md text-sm focus:border-blue-300 focus:ring focus:ring-blue-200 focus:ring-opacity-50"
                >
                  <option value="all">Toutes sources</option>
                  <option value="scraped">Appels d'offres scrapés</option>
                  <option value="manual">Appels d'offres manuels</option>
                </select>
              </div>

              {(domainFilter || sourceFilter !== 'all' || searchTerm) && (
                <Button
                  onClick={() => {
                    setDomainFilter(null);
                    setSourceFilter('all');
                    setSearchTerm('');
                  }}
                  variant="outline"
                  size="sm"
                  className="text-gray-600 border-gray-300"
                >
                  Réinitialiser
                </Button>
              )}
            </div>
          </CardContent>
        </Card>

        {/* Table des matchings validés */}
        <Card className="shadow-md hover:shadow-lg transition-all duration-200 border-0">
          <CardHeader className="bg-gradient-to-r from-blue-50 to-white border-b pb-4">
            <div className="flex justify-between">
              <div>
                <CardTitle className="text-blue-700 flex items-center gap-2">
                  <BriefcaseIcon className="h-5 w-5" />
                  Assignations consultant-mission
                </CardTitle>
                {filteredMatches.length > 0 && (
                  <CardDescription className="mt-1 text-gray-600">
                    {filteredMatches.length} assignation(s) {searchTerm || domainFilter || sourceFilter !== 'all' ? 'filtrée(s)' : 'active(s)'}
                    {stats && ` • Score moyen: ${Math.round(stats.avg_score)}%`}
                  </CardDescription>
                )}
              </div>
              {matches.length > 0 && (
                <div className="hidden md:flex items-center gap-2 bg-white px-3 py-1.5 rounded-full shadow-sm border border-gray-200">
                  <TrendingUpIcon className="h-4 w-4 text-gray-400" />
                  <span className="text-sm text-gray-500">{matches.length} total</span>
                </div>
              )}
            </div>
          </CardHeader>
          <CardContent className="p-0">
            {loading ? (
              <div className="flex justify-center py-16">
                <div className="flex flex-col items-center">
                  <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mb-4"></div>
                  <p className="text-gray-500">Chargement des données...</p>
                </div>
              </div>
            ) : filteredMatches.length > 0 ? (
              <div className="overflow-x-auto">
                <Table>
                  <TableHeader>
                    <TableRow className="bg-gray-50">
                      <TableHead className="font-semibold text-gray-700">Consultant</TableHead>
                      <TableHead className="font-semibold text-gray-700">Mission</TableHead>
                      <TableHead className="font-semibold text-gray-700">Client</TableHead>
                      <TableHead className="font-semibold text-gray-700">Domaine</TableHead>
                      <TableHead className="font-semibold text-gray-700">Source & Score</TableHead>
                      <TableHead className="font-semibold text-gray-700">Date validation</TableHead>
                      <TableHead className="text-right font-semibold text-gray-700">Actions</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {filteredMatches.map((match, index) => (
                      <motion.tr 
                        key={match.id} 
                        className="hover:bg-gray-50 transition-colors duration-150 border-b"
                        initial={{ opacity: 0, y: 10 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ duration: 0.2, delay: index * 0.05 }}
                      >
                        <TableCell>
                          <div className="flex items-center">
                            <div className="h-8 w-8 rounded-full bg-blue-100 flex items-center justify-center mr-3">
                              <UserIcon className="h-4 w-4 text-blue-600" />
                            </div>
                            <div>
                              <span className="font-semibold text-gray-800">{match.consultant_name}</span>
                              {match.consultant_expertise && (
                                <div className="text-xs text-gray-500">{match.consultant_expertise}</div>
                              )}
                              {match.email && (
                                <div className="text-xs text-gray-400">{match.email}</div>
                              )}
                            </div>
                          </div>
                        </TableCell>
                        <TableCell>
                          <div className="flex items-center">
                            <div className={`h-8 w-8 rounded-full flex items-center justify-center mr-3 ${
                              match.source_type === 'scraped' ? 'bg-blue-100' : 'bg-indigo-100'
                            }`}>
                              {getSourceIcon(match.source_type || 'scraped')}
                            </div>
                            <div>
                              <span className="font-medium text-gray-700">{match.appel_offre_name}</span>
                              <div className="flex items-center gap-2 mt-1">
                                {getSourceBadge(match.source_type || 'scraped')}
                                {match.is_expired && (
                                  <Badge className="bg-red-100 text-red-800 border-red-300 text-xs">
                                    Expiré
                                  </Badge>
                                )}
                              </div>
                            </div>
                          </div>
                        </TableCell>
                        <TableCell>
                          <div className="flex items-center gap-2">
                            <span className="text-gray-700 font-medium">{match.client}</span>
                          </div>
                        </TableCell>
                        <TableCell>
                          {match.domaine_principal ? (
                            <Badge className={`${getDomainBadgeColor(match.domaine_principal)} px-2 py-1 border`}>
                              {getDomainName(match.domaine_principal)}
                            </Badge>
                          ) : (
                            <span className="text-gray-500 italic">Non spécifié</span>
                          )}
                        </TableCell>
                        <TableCell>
                          <div className="flex items-center gap-3">
                            {/* Score circulaire */}
                            <div className="w-10 h-10 relative flex items-center justify-center">
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
                                  stroke={match.score >= 75 ? "#059669" : match.score >= 50 ? "#2563eb" : match.score >= 25 ? "#d97706" : "#dc2626"}
                                  strokeWidth="3"
                                  strokeDasharray={`${Math.round(match.score)}, 100`}
                                />
                                <text x="18" y="20.5" textAnchor="middle" 
                                  className="text-xs font-bold"
                                  fill={match.score >= 75 ? "#059669" : match.score >= 50 ? "#2563eb" : match.score >= 25 ? "#d97706" : "#dc2626"}>
                                  {Math.round(match.score)}%
                                </text>
                              </svg>
                            </div>
                          </div>
                        </TableCell>
                        <TableCell>
                          <div className="flex items-center">
                            <div className="h-7 w-7 rounded-full bg-gray-100 flex items-center justify-center mr-2">
                              <CalendarIcon className="h-3.5 w-3.5 text-gray-600" />
                            </div>
                            <div>
                              <span className="text-gray-600 text-sm">{formatDate(match.date_validation)}</span>
                              {(() => {
                                try {
                                  const validationDate = new Date(match.date_validation);
                                  const now = new Date();
                                  const diffDays = Math.floor((now.getTime() - validationDate.getTime()) / (1000 * 60 * 60 * 24));
                                  
                                  if (diffDays === 0) {
                                    return <div className="text-xs text-green-600 font-medium">Aujourd'hui</div>;
                                  } else if (diffDays === 1) {
                                    return <div className="text-xs text-blue-600">Hier</div>;
                                  } else if (diffDays <= 7) {
                                    return <div className="text-xs text-gray-500">Il y a {diffDays}j</div>;
                                  }
                                  return null;
                                } catch {
                                  return null;
                                }
                              })()}
                            </div>
                          </div>
                        </TableCell>
                        <TableCell className="text-right">
                          <div className="flex justify-end gap-2">
                            <TooltipProvider>
                              <Tooltip>
                                <TooltipTrigger asChild>
                                  <Button 
                                    variant="ghost" 
                                    size="sm" 
                                    onClick={() => navigate(`/admin/appels-offres/${match.appel_offre_id}`)}
                                    className="text-blue-600 hover:text-blue-800 hover:bg-blue-50 gap-1"
                                  >
                                    Détails
                                    <ArrowRightIcon className="h-4 w-4 ml-1" />
                                  </Button>
                                </TooltipTrigger>
                                <TooltipContent>
                                  <p>Voir les détails du matching</p>
                                </TooltipContent>
                              </Tooltip>
                            </TooltipProvider>
                            
                            {match.source_type === 'scraped' && match.lien_site && (
                              <TooltipProvider>
                                <Tooltip>
                                  <TooltipTrigger asChild>
                                    <Button
                                      variant="ghost"
                                      size="sm"
                                      onClick={() => window.open(match.lien_site, '_blank')}
                                      className="text-gray-600 hover:text-gray-800 hover:bg-gray-50"
                                    >
                                      <ExternalLinkIcon className="h-4 w-4" />
                                    </Button>
                                  </TooltipTrigger>
                                  <TooltipContent>
                                    <p>Voir l'appel d'offre source</p>
                                  </TooltipContent>
                                </Tooltip>
                              </TooltipProvider>
                            )}
                          </div>
                        </TableCell>
                      </motion.tr>
                    ))}
                  </TableBody>
                </Table>
              </div>
            ) : (
              <div className="text-center py-16">
                {searchTerm || domainFilter || sourceFilter !== 'all' ? (
                  <div className="space-y-4">
                    <div className="inline-flex rounded-full bg-amber-100 p-4">
                      <SearchIcon className="h-6 w-6 text-amber-600" />
                    </div>
                    <p className="text-gray-600 font-medium">Aucun résultat pour les filtres appliqués</p>
                    <Button 
                      variant="outline" 
                      onClick={() => {
                        setSearchTerm("");
                        setDomainFilter(null);
                        setSourceFilter('all');
                      }} 
                      className="mt-2 bg-white"
                    >
                      Réinitialiser les filtres
                    </Button>
                  </div>
                ) : (
                  <div className="space-y-4">
                    <div className="inline-flex rounded-full bg-blue-100 p-4">
                      <CheckCircleIcon className="h-6 w-6 text-blue-600" />
                    </div>
                    <p className="text-gray-600 font-medium">Aucun matching validé pour le moment.</p>
                    <p className="text-gray-500 max-w-md mx-auto">
                      Les consultants validés pour des missions apparaîtront ici. Le système traite automatiquement les appels d'offres scrapés et manuels.
                    </p>
                    <Button 
                      variant="outline" 
                      onClick={() => navigate("/admin/appels-offres")}
                      className="mt-4"
                    >
                      Voir les appels d'offres
                    </Button>
                  </div>
                )}
              </div>
            )}
          </CardContent>
          {filteredMatches.length > 0 && (
            <CardFooter className="flex justify-between items-center py-4 bg-gray-50 border-t">
              <div className="text-sm text-gray-500">
                Affichage de {filteredMatches.length} sur {matches.length} matchings
                {stats && ` • Score moyen global: ${Math.round(stats.avg_score)}%`}
              </div>
              <Button 
                variant="outline" 
                size="sm" 
                onClick={() => navigate("/admin/appels-offres")}
                className="text-blue-600 border-blue-200 hover:bg-blue-50"
              >
                <BriefcaseIcon className="h-4 w-4 mr-2" />
                Voir tous les appels d'offres
              </Button>
            </CardFooter>
          )}
        </Card>

        {/* Notification informative */}
        {stats && stats.recent_validations > 0 && (
          <div className="fixed bottom-4 right-4 bg-gradient-to-r from-emerald-50 to-teal-50 border border-emerald-200 rounded-xl p-4 shadow-lg max-w-sm backdrop-blur-sm">
            <div className="flex items-start">
              <CheckCircleIcon className="h-5 w-5 text-emerald-600 mr-2 mt-0.5 flex-shrink-0" />
              <div>
                <p className="text-sm text-emerald-800 font-medium">
                  Activité récente
                </p>
                <p className="text-xs text-emerald-700 mt-1">
                  {stats.recent_validations} nouvelle(s) validation(s) cette semaine
                  • Système unifié actif
                </p>
              </div>
            </div>
          </div>
        )}

        {/* Debug info - uniquement en développement */}
        {process.env.NODE_ENV === 'development' && matches.length > 0 && (
          <Card className="mt-4 border-dashed border-2 border-gray-300">
            <CardHeader>
              <CardTitle className="text-sm text-gray-500">Debug Info</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-xs text-gray-400 space-y-1">
                <p>Total matchings chargés: {matches.length}</p>
                <p>Matchings filtrés: {filteredMatches.length}</p>
                <p>Domaines détectés: {uniqueDomains.join(', ')}</p>
                <p>Sources détectées: {Array.from(new Set(matches.map(m => m.source_type))).join(', ')}</p>
              </div>
            </CardContent>
          </Card>
        )}
      </div>
    </AdminLayout>
  );
};

export default ValidatedMatches;