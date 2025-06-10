import React, { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import AdminLayout from "@/components/admin/AdminLayout";
import { CheckIcon, RefreshCwIcon, SearchIcon, ArrowLeftIcon } from "lucide-react";
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
}

const API_URL = "http://localhost:8000/api";

const PendingConsultants = () => {
  const [consultants, setConsultants] = useState<Consultant[]>([]);
  const [searchTerm, setSearchTerm] = useState("");
  const [loading, setLoading] = useState(true);
  const [validating, setValidating] = useState<number | null>(null);
  const [validatedId, setValidatedId] = useState<number | null>(null);
  const navigate = useNavigate();

  const fetchPendingConsultants = async () => {
    try {
      setLoading(true);
      const response = await axios.get(`${API_URL}/admin/consultants/pending/`);
      
      if (response.data.success && Array.isArray(response.data.data)) {
        setConsultants(response.data.data);
      } else if (Array.isArray(response.data)) {
        setConsultants(response.data);
      } else {
        console.error("Format de réponse inattendu:", response.data);
        setConsultants([]);
      }
    } catch (error) {
      console.error("Erreur lors du chargement des consultants en attente:", error);
      toast.error("Erreur de chargement des consultants en attente");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchPendingConsultants();
  }, []);

  // Fonction simplifiée avec redirection directe
  const handleValidate = async (id: number) => {
    if (validating !== null) return;
    
    try {
      setValidating(id);
      // Effectuer une requête directe avec console.log pour debug
      console.log(`Validation du consultant ${id}...`);
      const response = await axios.put(`${API_URL}/admin/consultants/validate/${id}/`);
      console.log("Réponse complète:", response);
      
      // Considérer toute réponse 2xx comme un succès
      if (response.status >= 200 && response.status < 300) {
        setConsultants(prev => prev.filter(c => c.id !== id));
        toast.success("Consultant validé avec succès");
        setValidatedId(id);
      } else {
        console.error("Réponse non-2xx:", response);
        toast.error("Erreur lors de la validation");
      }
    } catch (error) {
      console.error("Erreur complète lors de la validation:", error);
      
      if (axios.isAxiosError(error) && error.response) {
        console.log("Détails de l'erreur:", error.response.data);
        toast.error(`Erreur: ${error.response.data.error || "Échec de la validation"}`);
      } else {
        toast.error("Erreur lors de la validation du consultant");
      }
    } finally {
      setValidating(null);
    }
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
      case "DIGITAL": return "bg-blue-100 text-blue-800";
      case "FINANCE": return "bg-green-100 text-green-800";
      case "ENERGIE": return "bg-yellow-100 text-yellow-800";
      case "INDUSTRIE": return "bg-purple-100 text-purple-800";
      default: return "bg-gray-100 text-gray-800";
    }
  };

  // Formater la date avec gestion des erreurs
  const formatDate = (dateString) => {
    if (!dateString) return "Non définie";
    try {
      return new Date(dateString).toLocaleDateString('fr-FR');
    } catch (e) {
      return "Date invalide";
    }
  };

  return (
    <AdminLayout>
      <div className="space-y-6">
        <div className="flex justify-between items-center">
          <div className="flex items-center gap-2">
            <Button 
              variant="ghost" 
              size="sm" 
              onClick={() => navigate("/admin/consultants")}
              className="p-0 h-8 w-8"
            >
              <ArrowLeftIcon className="h-5 w-5" />
            </Button>
            <h1 className="text-2xl font-bold">Consultants en attente de validation</h1>
          </div>
          <div className="flex gap-2">
            <div className="relative">
              <SearchIcon className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-500 h-4 w-4" />
              <Input
                placeholder="Rechercher..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-64 pl-10"
              />
            </div>
            <Button 
              onClick={fetchPendingConsultants} 
              variant="outline"
            >
              <RefreshCwIcon className="h-4 w-4 mr-2" />
              Actualiser
            </Button>
          </div>
        </div>

        {loading ? (
          <div className="flex justify-center py-8">
            <div className="animate-spin h-8 w-8 border-4 border-primary border-t-transparent rounded-full"></div>
          </div>
        ) : filteredConsultants.length === 0 ? (
          <div className="bg-gray-50 rounded-md p-8 text-center">
            <p className="text-gray-500">
              {searchTerm 
                ? `Aucun résultat trouvé pour "${searchTerm}"` 
                : "Aucun consultant en attente de validation"}
            </p>
            {searchTerm && (
              <Button 
                variant="link" 
                onClick={() => setSearchTerm("")}
              >
                Effacer la recherche
              </Button>
            )}
          </div>
        ) : (
          <div className="rounded-md border">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Nom</TableHead>
                  <TableHead>Email</TableHead>
                  <TableHead>Téléphone</TableHead>
                  <TableHead>Domaine</TableHead>
                  <TableHead>Sous-domaine</TableHead>
                  <TableHead>Disponibilité</TableHead>
                  <TableHead>Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredConsultants.map((consultant) => (
                  <TableRow key={consultant.id}>
                    <TableCell className="font-medium">{consultant.prenom} {consultant.nom}</TableCell>
                    <TableCell>{consultant.email}</TableCell>
                    <TableCell>{consultant.telephone}</TableCell>
                    <TableCell>
                      <Badge className={getDomainBadgeColor(consultant.domaine_principal)}>
                        {getDomainName(consultant.domaine_principal)}
                      </Badge>
                    </TableCell>
                    <TableCell>{consultant.specialite}</TableCell>
                    <TableCell>
                      {formatDate(consultant.date_debut_dispo)} - {formatDate(consultant.date_fin_dispo)}
                    </TableCell>
                    <TableCell>
                      <Button 
                        variant="outline" 
                        size="sm" 
                        className="text-green-600 border-green-600 hover:bg-green-50"
                        onClick={() => handleValidate(consultant.id)}
                        disabled={validating !== null}
                      >
                        {validating === consultant.id ? (
                          <span className="flex items-center">
                            <svg className="animate-spin -ml-1 mr-2 h-4 w-4 text-green-600" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                              <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                              <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                            </svg>
                            Validation...
                          </span>
                        ) : (
                          <>
                            <CheckIcon className="h-4 w-4 mr-2" />
                            Valider
                          </>
                        )}
                      </Button>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>
        )}
        
        {/* Notification après validation réussie */}
        {validatedId && (
          <div className="fixed bottom-4 right-4 bg-white p-4 shadow-lg rounded-md border border-green-200 z-50">
            <p className="text-green-600 font-medium mb-2">Consultant validé avec succès!</p>
            <Button onClick={() => navigate("/admin/consultants")}>
              Retour à la liste des consultants
            </Button>
          </div>
        )}
      </div>
    </AdminLayout>
  );
};

export default PendingConsultants;