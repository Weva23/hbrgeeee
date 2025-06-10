
import React from "react";
import { Button } from "@/components/ui/button";
import { useNavigate } from "react-router-dom";
import { UserIcon, Users, BriefcaseIcon, BookOpenIcon, LineChartIcon } from "lucide-react";

const Index = () => {
  const navigate = useNavigate();

  return (
    <div className="min-h-screen flex flex-col bg-gradient-to-br from-blue-50 to-white">
      <header className="bg-white shadow-sm border-b">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6 flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold text-blue-900">Richat Partners</h1>
            <p className="text-blue-600 mt-1">Plateforme de Gestion des Consultants et Missions</p>
          </div>
          <img src="/lovable-uploads/c66ee083-bf5b-456a-b3a6-368225f4b25e.png" alt="Richat Logo" className="h-16 w-auto" />
        </div>
      </header>

      <main className="flex-1">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
          <div className="text-center mb-12">
            <h2 className="text-2xl font-semibold text-gray-900 mb-4">
              Système Digitalisé de Gestion des Consultants et Missions
            </h2>
            <p className="text-gray-600 max-w-3xl mx-auto">
              Une plateforme centralisée pour optimiser le matching entre consultants et projets,
              simplifier la gestion documentaire et améliorer le suivi des missions.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8 mt-12">
            <div className="bg-white p-8 rounded-lg shadow-md hover:shadow-lg transition-shadow">
              <div className="p-4 rounded-full bg-blue-50 w-16 h-16 flex items-center justify-center mb-4">
                <UserIcon className="h-8 w-8 text-blue-600" />
              </div>
              <h3 className="font-semibold text-xl mb-2 text-gray-900">Espace Administrateur</h3>
              <p className="text-gray-600 mb-6">
                Gérez les consultants, les appels d'offres et suivez les missions en cours.
              </p>
              <Button
                onClick={() => navigate("/login")}
                className="w-full bg-gradient-to-r from-blue-600 to-blue-700 hover:from-blue-700 hover:to-blue-800 text-white"
              >
                Connexion Admin
              </Button>
            </div>

            <div className="bg-white p-8 rounded-lg shadow-md hover:shadow-lg transition-shadow">
              <div className="p-4 rounded-full bg-blue-50 w-16 h-16 flex items-center justify-center mb-4">
                <Users className="h-8 w-8 text-blue-600" />
              </div>
              <h3 className="font-semibold text-xl mb-2 text-gray-900">Espace Consultant</h3>
              <p className="text-gray-600 mb-6">
                Accédez à votre profil, gérez vos disponibilités et suivez vos missions.
              </p>
              <Button
                onClick={() => navigate("/consultant/login")}
                className="w-full bg-gradient-to-r from-blue-600 to-blue-700 hover:from-blue-700 hover:to-blue-800 text-white"
              >
                Connexion Consultant
              </Button>
            </div>

            <div className="bg-white p-8 rounded-lg shadow-md hover:shadow-lg transition-shadow">
              <div className="p-4 rounded-full bg-blue-50 w-16 h-16 flex items-center justify-center mb-4">
                <BriefcaseIcon className="h-8 w-8 text-blue-600" />
              </div>
              <h3 className="font-semibold text-xl mb-2 text-gray-900">Inscription Consultant</h3>
              <p className="text-gray-600 mb-6">
                Rejoignez notre réseau de consultants nationaux et internationaux.
              </p>
              <Button
                onClick={() => navigate("/consultant/register")}
                className="w-full bg-gradient-to-r from-blue-600 to-blue-700 hover:from-blue-700 hover:to-blue-800 text-white"
              >
                S'inscrire
              </Button>
            </div>
          </div>

          <div className="mt-16 grid grid-cols-1 md:grid-cols-3 gap-8">
            <div className="bg-blue-50 p-6 rounded-lg">
              <BookOpenIcon className="h-8 w-8 text-blue-600 mb-4" />
              <h4 className="font-semibold mb-2">Gestion Documentaire</h4>
              <p className="text-sm text-gray-600">
                Centralisation des documents, réponses aux appels d'offres et rapports de mission.
              </p>
            </div>
            
            <div className="bg-blue-50 p-6 rounded-lg">
              <Users className="h-8 w-8 text-blue-600 mb-4" />
              <h4 className="font-semibold mb-2">Matching Intelligent</h4>
              <p className="text-sm text-gray-600">
                Association automatique des consultants aux projets selon leurs compétences.
              </p>
            </div>

            <div className="bg-blue-50 p-6 rounded-lg">
              <LineChartIcon className="h-8 w-8 text-blue-600 mb-4" />
              <h4 className="font-semibold mb-2">Suivi des Missions</h4>
              <p className="text-sm text-gray-600">
                Tableaux de bord interactifs pour le suivi des projets et l'évaluation.
              </p>
            </div>
          </div>
        </div>
      </main>

      <footer className="bg-white border-t py-8">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex flex-col items-center justify-center">
            <img src="/lovable-uploads/c66ee083-bf5b-456a-b3a6-368225f4b25e.png" alt="Richat Logo" className="h-10 w-auto mb-4" />
            <p className="text-center text-gray-500">
              © {new Date().getFullYear()} Richat Partners. Tous droits réservés.
            </p>
          </div>
        </div>
      </footer>
    </div>
  );
};

export default Index;
