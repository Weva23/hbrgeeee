import React, { useState, useEffect } from "react";
import axios from "axios";
import { Badge } from "@/components/ui/badge";
import { CheckIcon, BriefcaseIcon } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";

interface MatchSuggestion {
  id: number;
  appel_offre_id: number;
  appel_offre_name: string;
  client: string;
  date_debut: string;
  date_fin: string;
  score: number;
  is_validated: boolean;
}

const MatchingSuggestions: React.FC<{ consultantId: string | null }> = ({ consultantId }) => {
  const [matches, setMatches] = useState<MatchSuggestion[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchMatches = async () => {
      if (!consultantId) {
        setLoading(false);
        return;
      }
      
      try {
        const res = await axios.get(`http://localhost:8000/api/matching/consultant/${consultantId}/`);
        if (res.data.success) {
          setMatches(res.data.matches);
        }
      } catch (error) {
        console.error("Erreur lors du chargement des suggestions:", error);
      } finally {
        setLoading(false);
      }
    };

    fetchMatches();
  }, [consultantId]);

  if (loading) {
    return (
      <div className="flex justify-center items-center p-6">
        <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-blue-600"></div>
        <span className="ml-2 text-gray-500">Chargement des suggestions...</span>
      </div>
    );
  }

  if (!matches.length) {
    return (
      <div className="text-center py-8 px-4 bg-gray-50 rounded-lg">
        <BriefcaseIcon className="h-12 w-12 mx-auto text-gray-300 mb-3" />
        <p className="text-gray-500">Aucune suggestion de mission disponible actuellement.</p>
        <p className="text-sm text-gray-400 mt-2">Les missions correspondant à votre profil apparaîtront ici.</p>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {matches.map((match) => (
        <div key={match.id} className="bg-white p-4 rounded-lg border shadow-sm hover:shadow-md transition-shadow duration-200">
          <div className="flex justify-between items-start">
            <div>
              <h3 className="font-medium text-lg">{match.appel_offre_name}</h3>
              <p className="text-sm text-gray-500 flex items-center mt-1">
                <BriefcaseIcon className="h-4 w-4 mr-1 inline" />
                {match.client}
              </p>
              <p className="text-xs text-gray-400 mt-2">
                {new Date(match.date_debut).toLocaleDateString()} au {new Date(match.date_fin).toLocaleDateString()}
              </p>
            </div>
            <div className="flex flex-col items-end">
              <Badge className={match.score > 75 ? "bg-green-100 text-green-800" : "bg-blue-100 text-blue-800"}>
                {Math.round(match.score)}% de correspondance
              </Badge>
              {match.is_validated && (
                <Badge className="mt-2 bg-green-100 text-green-800 flex items-center">
                  <CheckIcon className="h-3 w-3 mr-1" />
                  Mission confirmée
                </Badge>
              )}
            </div>
          </div>
        </div>
      ))}
    </div>
  );
};

// Composant à intégrer dans ConsultantWelcome.tsx
const SuggestionsSection: React.FC<{ consultantId: string | null }> = ({ consultantId }) => {
  return (
    <Card className="w-full shadow-md mt-8">
      <CardHeader className="border-b pb-4">
        <CardTitle className="flex items-center gap-2">
          <BriefcaseIcon className="h-5 w-5 text-blue-600" />
          Suggestions de missions
        </CardTitle>
        <CardDescription>
          Missions correspondant à votre profil en fonction de vos compétences et disponibilités
        </CardDescription>
      </CardHeader>
      <CardContent className="pt-4">
        <MatchingSuggestions consultantId={consultantId} />
      </CardContent>
    </Card>
  );
};

export default SuggestionsSection;