import React, { useState, useEffect } from "react";
import axios from "axios";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle, CardDescription, CardFooter } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { UserIcon, BriefcaseIcon, CalendarIcon, SearchIcon, RefreshCwIcon, CheckCircleIcon, ArrowRightIcon, FilterIcon } from "lucide-react";
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
}

const ValidatedMatches = () => {
  const [matches, setMatches] = useState<MatchData[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");
  const navigate = useNavigate();

  useEffect(() => {
    fetchValidatedMatches();
  }, []);

  const fetchValidatedMatches = async () => {
    setLoading(true);
    try {
      const res = await axios.get("http://localhost:8000/api/matching/validated/");
      console.log("Données brutes des matchings validés:", res.data);
      
     
      const cleanedMatches = res.data.map(match => ({
        ...match,
        score: parseFloat(match.score)
      }));
      
      console.log("Matchings validés nettoyés:", cleanedMatches);
      setMatches(cleanedMatches);
    } catch (error) {
      console.error("Erreur lors du chargement des matchings validés:", error);
      toast.error("Erreur de connexion au serveur");
    } finally {
      setLoading(false);
    }
  };

  const formatDate = (dateString: string) => {
    if (!dateString) return "N/A";
    const date = new Date(dateString);
    return new Intl.DateTimeFormat('fr-FR').format(date);
  };

  const getScoreBadgeColor = (score: number) => {
    if (score >= 75) return "bg-emerald-100 text-emerald-800";
    if (score >= 50) return "bg-blue-100 text-blue-800";
    if (score >= 25) return "bg-amber-100 text-amber-800";
    return "bg-red-100 text-red-800";
  };

  const getDomainBadgeColor = (domain: string) => {
    switch(domain) {
      case 'DIGITAL': return 'bg-indigo-100 text-indigo-800';
      case 'FINANCE': return 'bg-emerald-100 text-emerald-800';
      case 'ENERGIE': return 'bg-amber-100 text-amber-800';
      case 'INDUSTRIE': return 'bg-purple-100 text-purple-800';
      default: return 'bg-gray-100 text-gray-800';
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

  // Filtrer les matchings selon la recherche
  const filteredMatches = matches.filter(match => {
    const searchLower = searchTerm.toLowerCase();
    return (
      match.consultant_name.toLowerCase().includes(searchLower) ||
      match.appel_offre_name.toLowerCase().includes(searchLower) ||
      match.client.toLowerCase().includes(searchLower)
    );
  });

  return (
    <AdminLayout>
      <div className="space-y-6 p-6">
        <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
          <div>
            <h1 className="text-2xl font-bold text-gray-800 flex items-center gap-2">
              <CheckCircleIcon className="h-6 w-6 text-emerald-500" />
              Matchings validés
            </h1>
            <p className="text-gray-500 mt-1">Liste des consultants assignés à des missions</p>
          </div>
          <div className="flex flex-col sm:flex-row gap-3 w-full md:w-auto">
            <div className="relative flex-grow">
              <SearchIcon className="h-4 w-4 absolute left-3 top-3 text-gray-400" />
              <Input 
                placeholder="Rechercher..." 
                value={searchTerm} 
                onChange={(e) => setSearchTerm(e.target.value)} 
                className="pl-10 bg-white rounded-full border-gray-200 focus:border-blue-300 focus-visible:ring-blue-500 shadow-sm w-full"
              />
            </div>
            <TooltipProvider>
              <Tooltip>
                <TooltipTrigger asChild>
                  <Button 
                    onClick={fetchValidatedMatches} 
                    variant="outline" 
                    size="icon"
                    className="h-10 w-10 rounded-full border-gray-200 hover:bg-blue-50 hover:text-blue-600 hover:border-blue-200 shadow-sm"
                  >
                    <RefreshCwIcon className="h-4 w-4" />
                  </Button>
                </TooltipTrigger>
                <TooltipContent>
                  <p>Actualiser la liste</p>
                </TooltipContent>
              </Tooltip>
            </TooltipProvider>
          </div>
        </div>

        <Card className="shadow-md hover:shadow-lg transition-all duration-200 overflow-hidden border-0">
          <CardHeader className="bg-gradient-to-r from-blue-50 to-white border-b pb-4">
            <div className="flex justify-between">
              <div>
                <CardTitle className="text-blue-700 flex items-center gap-2">
                  <BriefcaseIcon className="h-5 w-5" />
                  Liste des assignations consultant-mission
                </CardTitle>
                {filteredMatches.length > 0 && (
                  <CardDescription className="mt-1 text-gray-600">
                    {filteredMatches.length} assignation(s) {searchTerm ? 'trouvée(s)' : 'active(s)'}
                  </CardDescription>
                )}
              </div>
              {matches.length > 0 && (
                <div className="hidden md:flex items-center gap-2 bg-white px-3 py-1.5 rounded-full shadow-sm border border-gray-200">
                  <FilterIcon className="h-4 w-4 text-gray-400" />
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
                      <TableHead className="font-semibold text-gray-700">Score</TableHead>
                      <TableHead className="font-semibold text-gray-700">Date validation</TableHead>
                      <TableHead className="text-right font-semibold text-gray-700">Actions</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {filteredMatches.map((match, index) => {
                      // Log de débogage
                      console.log(`Match validé ${match.id}, consultant: ${match.consultant_name}, score: ${match.score}, type: ${typeof match.score}`);
                      
                      return (
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
                              <span className="font-semibold text-gray-800">{match.consultant_name}</span>
                            </div>
                          </TableCell>
                          <TableCell>
                            <div className="flex items-center">
                              <div className="h-8 w-8 rounded-full bg-indigo-100 flex items-center justify-center mr-3">
                                <BriefcaseIcon className="h-4 w-4 text-indigo-600" />
                              </div>
                              <span className="font-medium text-gray-700">{match.appel_offre_name}</span>
                            </div>
                          </TableCell>
                          <TableCell>
                            <div className="flex items-center gap-2">
                              <span className="text-gray-700 font-medium">{match.client}</span>
                            </div>
                          </TableCell>
                          <TableCell>
                            {match.domaine_principal ? (
                              <Badge className={`${getDomainBadgeColor(match.domaine_principal)} px-2 py-1`}>
                                {getDomainName(match.domaine_principal)}
                              </Badge>
                            ) : (
                              <span className="text-gray-500 italic">Non spécifié</span>
                            )}
                          </TableCell>
                          <TableCell>
                            <div className="flex items-center">
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
                              <span className="text-gray-600 text-sm">{formatDate(match.date_validation)}</span>
                            </div>
                          </TableCell>
                          <TableCell className="text-right">
                            <Button 
                              variant="ghost" 
                              size="sm" 
                              onClick={() => navigate(`/admin/matching/${match.appel_offre_id}`)}
                              className="text-blue-600 hover:text-blue-800 hover:bg-blue-50 gap-1"
                            >
                              Détails
                              <ArrowRightIcon className="h-4 w-4 ml-1" />
                            </Button>
                          </TableCell>
                        </motion.tr>
                      );
                    })}
                  </TableBody>
                </Table>
              </div>
            ) : (
              <div className="text-center py-16">
                {searchTerm ? (
                  <div className="space-y-4">
                    <div className="inline-flex rounded-full bg-amber-100 p-4">
                      <SearchIcon className="h-6 w-6 text-amber-600" />
                    </div>
                    <p className="text-gray-600 font-medium">Aucun résultat pour "{searchTerm}"</p>
                    <Button variant="outline" onClick={() => setSearchTerm("")} className="mt-2 bg-white">
                      Réinitialiser la recherche
                    </Button>
                  </div>
                ) : (
                  <div className="space-y-4">
                    <div className="inline-flex rounded-full bg-blue-100 p-4">
                      <CheckCircleIcon className="h-6 w-6 text-blue-600" />
                    </div>
                    <p className="text-gray-600 font-medium">Aucun matching validé pour le moment.</p>
                    <p className="text-gray-500 max-w-md mx-auto">
                      Les consultants validés pour des missions apparaîtront ici. Vous pouvez valider des consultants depuis la page de détail d'un appel d'offre.
                    </p>
                  </div>
                )}
              </div>
            )}
          </CardContent>
          {filteredMatches.length > 0 && (
            <CardFooter className="flex justify-between items-center py-4 bg-gray-50 border-t">
              <div className="text-sm text-gray-500">
                Affichage de {filteredMatches.length} sur {matches.length} matchings
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
      </div>
    </AdminLayout>
  );
};

export default ValidatedMatches;