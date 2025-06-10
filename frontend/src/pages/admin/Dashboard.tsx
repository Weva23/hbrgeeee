import React, { useEffect, useState } from "react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
// Utiliser le chemin correct vers le composant AdminLayout
import AdminLayout from "@/components/admin/AdminLayout";
import { 
  UserIcon, BriefcaseIcon, CheckCircleIcon, AlertCircleIcon, 
  TrendingUpIcon, UsersIcon, CalendarIcon, BarChart3Icon, 
  FileTextIcon, PieChartIcon
} from "lucide-react";
import { 
  LineChart, Line, XAxis, YAxis, CartesianGrid, 
  Tooltip, ResponsiveContainer, Legend, PieChart, Pie, Cell 
} from 'recharts';
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import axios from "axios"; // Importation d'axios pour les requêtes API

const Dashboard = () => {
  const [stats, setStats] = useState({
    consultants_count: 0,
    appels_total: 0,
    offres_actives: 0,
    offres_expirees: 0,
    derniers_consultants: [],
    derniers_appels: [],
    validated_matches: 0, // Ajout pour stocker le nombre réel de matchings validés
    // Statistiques supplémentaires
    matching_success_rate: 85, // Taux de réussite des matchings
    avg_matching_score: 76, // Score moyen des matchings
    projects_by_domain: {
      "Digital et Télécoms": 42,
      "Secteur bancaire et financier": 25,
      "Transition énergétique": 18,
      "Industrie et Mines": 15
    },
    consultants_by_status: {
      "Actif": 65,
      "Inactif": 35
    },
    consultants_by_expertise: {
      "Débutant": 30,
      "Intermédiaire": 45,
      "Expert": 25
    },
    documents_count: 124
  });

  // Données pour le graphique d'évolution sur 6 mois
  const [chartData, setChartData] = useState([
    { name: 'Jan', consultants: 4, offers: 2, matchings: 1 },
    { name: 'Fév', consultants: 8, offers: 5, matchings: 3 },
    { name: 'Mar', consultants: 12, offers: 8, matchings: 6 },
    { name: 'Avr', consultants: 17, offers: 10, matchings: 8 },
    { name: 'Mai', consultants: 22, offers: 14, matchings: 11 },
    { name: 'Juin', consultants: 25, offers: 18, matchings: 16 },
  ]);

  // Fonction pour récupérer le nombre de matchings validés
  const fetchValidatedMatchesCount = async () => {
    try {
      const response = await axios.get("http://localhost:8000/api/matching/validated/");
      // Mettre à jour le nombre de matchings validés
      setStats(prevStats => ({
        ...prevStats,
        validated_matches: response.data.length || 0
      }));

      // Mettre à jour les données du graphique avec le nombre réel de matchings
      const matchesCount = response.data.length || 0;
      // Calculer une distribution progressive pour les matchings dans le graphique
      if (matchesCount > 0) {
        const newChartData = [...chartData];
        // Répartir les matchings de manière progressive sur les 6 mois
        const monthlyIncrement = Math.ceil(matchesCount / 6);
        let currentCount = 0;
        
        for (let i = 0; i < newChartData.length; i++) {
          if (i === newChartData.length - 1) {
            // Dernier mois = nombre total exact
            newChartData[i].matchings = matchesCount;
          } else {
            // Distribution progressive
            currentCount = Math.min(currentCount + monthlyIncrement, matchesCount);
            newChartData[i].matchings = i === 0 ? Math.ceil(matchesCount * 0.2) : currentCount;
          }
        }
        
        setChartData(newChartData);
      }
    } catch (error) {
      console.error("Erreur lors de la récupération des matchings validés:", error);
    }
  };

  useEffect(() => {
    // Utilisation de fetch pour les statistiques générales
    fetch("http://localhost:8000/api/dashboard/")
      .then(response => {
        if (!response.ok) {
          throw new Error("Erreur réseau");
        }
        return response.json();
      })
      .then(data => {
        // Fusionner les données de l'API avec les statistiques
        setStats(prevStats => ({
          ...prevStats,
          consultants_count: data.consultants_count || prevStats.consultants_count,
          appels_total: data.appels_total || prevStats.appels_total,
          offres_actives: data.offres_actives || prevStats.offres_actives,
          offres_expirees: data.offres_expirees || prevStats.offres_expirees,
          derniers_consultants: data.derniers_consultants || prevStats.derniers_consultants,
          derniers_appels: data.derniers_appels || prevStats.derniers_appels,
        }));
      })
      .catch(error => console.error("Erreur chargement stats:", error));

    // Récupérer les matchings validés
    fetchValidatedMatchesCount();
  }, []);

  // Préparer les données pour les graphiques circulaires
  const domainData = Object.entries(stats.projects_by_domain).map(([name, value]) => ({ name, value }));
  const COLORS = ['#0088FE', '#00C49F', '#FFBB28', '#FF8042'];

  const statusData = Object.entries(stats.consultants_by_status).map(([name, value]) => ({ name, value }));
  const STATUS_COLORS = ['#4CAF50', '#FFC107'];

  const expertiseData = Object.entries(stats.consultants_by_expertise).map(([name, value]) => ({ name, value }));
  const EXPERTISE_COLORS = ['#03A9F4', '#673AB7', '#F44336'];

  return (
    <AdminLayout>
      <div className="space-y-6">
        <div className="flex items-center justify-between mb-6">
          <div>
            <h1 className="text-2xl font-bold text-slate-900">Tableau de bord</h1>
            <p className="text-slate-500 mt-1">Vue d'ensemble des activités et statistiques</p>
          </div>
          <div className="flex space-x-2">
            <Button variant="outline" size="sm">
              <CalendarIcon className="h-4 w-4 mr-2" />
              Ce mois
            </Button>
            <Button variant="outline" size="sm">
              <FileTextIcon className="h-4 w-4 mr-2" />
              Exporter
            </Button>
          </div>
        </div>

        {/* Cartes principales avec indicateurs clés */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          <Card className="border-l-4 border-l-blue-500">
            <CardHeader className="flex flex-row items-center justify-between pb-2 space-y-0">
              <CardTitle className="text-sm font-medium">Consultants</CardTitle>
              <UserIcon className="h-5 w-5 text-blue-500" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{stats.consultants_count}</div>
              <div className="flex items-center mt-1">
                <TrendingUpIcon className="h-4 w-4 text-green-500 mr-1" />
                <p className="text-xs text-green-500">+5 ce mois-ci</p>
              </div>
            </CardContent>
          </Card>
          <Card className="border-l-4 border-l-indigo-500">
            <CardHeader className="flex flex-row items-center justify-between pb-2 space-y-0">
              <CardTitle className="text-sm font-medium">Appels d'offres</CardTitle>
              <BriefcaseIcon className="h-5 w-5 text-indigo-500" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{stats.appels_total}</div>
              <div className="flex items-center mt-1">
                <TrendingUpIcon className="h-4 w-4 text-green-500 mr-1" />
                <p className="text-xs text-green-500">+3 ce mois-ci</p>
              </div>
            </CardContent>
          </Card>
          <Card className="border-l-4 border-l-emerald-500">
            <CardHeader className="flex flex-row items-center justify-between pb-2 space-y-0">
              <CardTitle className="text-sm font-medium">Offres actives</CardTitle>
              <CheckCircleIcon className="h-5 w-5 text-emerald-500" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{stats.offres_actives}</div>
              <div className="flex items-center mt-1">
                <TrendingUpIcon className="h-4 w-4 text-green-500 mr-1" />
                <p className="text-xs text-green-500">4 nouvelles</p>
              </div>
            </CardContent>
          </Card>
          <Card className="border-l-4 border-l-amber-500">
            <CardHeader className="flex flex-row items-center justify-between pb-2 space-y-0">
              <CardTitle className="text-sm font-medium">Matchings validés</CardTitle>
              <UsersIcon className="h-5 w-5 text-amber-500" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{stats.validated_matches}</div>
              <div className="flex items-center mt-1">
                <TrendingUpIcon className="h-4 w-4 text-green-500 mr-1" />
                <p className="text-xs text-green-500">+8 cette semaine</p>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Graphiques principaux avec système d'onglets */}
        <Tabs defaultValue="activity">
          <TabsList className="mb-4">
            <TabsTrigger value="activity">Activité</TabsTrigger>
            <TabsTrigger value="consultants">Consultants</TabsTrigger>
            <TabsTrigger value="projects">Projets</TabsTrigger>
          </TabsList>
          
          <TabsContent value="activity">
            <Card>
              <CardHeader>
                <CardTitle>Évolution sur 6 mois</CardTitle>
                <CardDescription>Progression des inscriptions, offres et matchings validés</CardDescription>
              </CardHeader>
              <CardContent className="h-80">
                <ResponsiveContainer width="100%" height="100%">
                  <LineChart
                    data={chartData}
                    margin={{ top: 5, right: 30, left: 20, bottom: 5 }}
                  >
                    <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
                    <XAxis dataKey="name" />
                    <YAxis />
                    <Tooltip 
                      contentStyle={{ 
                        backgroundColor: 'rgba(255, 255, 255, 0.9)',
                        borderRadius: '8px',
                        boxShadow: '0 4px 12px rgba(0, 0, 0, 0.1)',
                        border: 'none'
                      }} 
                    />
                    <Legend />
                    <Line 
                      type="monotone" 
                      dataKey="consultants" 
                      stroke="#2563EB" 
                      strokeWidth={2}
                      activeDot={{ r: 8 }} 
                      name="Consultants"
                    />
                    <Line 
                      type="monotone" 
                      dataKey="offers" 
                      stroke="#8B5CF6" 
                      strokeWidth={2}
                      name="Appels d'offres" 
                    />
                    <Line 
                      type="monotone" 
                      dataKey="matchings" 
                      stroke="#10B981" 
                      strokeWidth={2}
                      name="Matchings validés" 
                    />
                  </LineChart>
                </ResponsiveContainer>
              </CardContent>
            </Card>
          </TabsContent>
          
          <TabsContent value="consultants">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <Card>
                <CardHeader>
                  <CardTitle>Consultants par expertise</CardTitle>
                  <CardDescription>Répartition selon le niveau d'expérience</CardDescription>
                </CardHeader>
                <CardContent className="h-72">
                  <ResponsiveContainer width="100%" height="100%">
                    <PieChart>
                      <Pie
                        data={expertiseData}
                        cx="50%"
                        cy="50%"
                        labelLine={false}
                        outerRadius={80}
                        fill="#8884d8"
                        dataKey="value"
                        label={({ name, percent }) => `${name} ${(percent * 100).toFixed(0)}%`}
                      >
                        {expertiseData.map((entry, index) => (
                          <Cell key={`cell-${index}`} fill={EXPERTISE_COLORS[index % EXPERTISE_COLORS.length]} />
                        ))}
                      </Pie>
                      <Tooltip />
                    </PieChart>
                  </ResponsiveContainer>
                </CardContent>
              </Card>
              
              <Card>
                <CardHeader>
                  <CardTitle>Statut des consultants</CardTitle>
                  <CardDescription>Consultants actifs vs inactifs</CardDescription>
                </CardHeader>
                <CardContent className="h-72">
                  <ResponsiveContainer width="100%" height="100%">
                    <PieChart>
                      <Pie
                        data={statusData}
                        cx="50%"
                        cy="50%"
                        labelLine={false}
                        outerRadius={80}
                        fill="#8884d8"
                        dataKey="value"
                        label={({ name, percent }) => `${name} ${(percent * 100).toFixed(0)}%`}
                      >
                        {statusData.map((entry, index) => (
                          <Cell key={`cell-${index}`} fill={STATUS_COLORS[index % STATUS_COLORS.length]} />
                        ))}
                      </Pie>
                      <Tooltip />
                    </PieChart>
                  </ResponsiveContainer>
                </CardContent>
              </Card>
            </div>
          </TabsContent>
          
          <TabsContent value="projects">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <Card>
                <CardHeader>
                  <CardTitle>Projets par domaine</CardTitle>
                  <CardDescription>Répartition des projets par secteur d'activité</CardDescription>
                </CardHeader>
                <CardContent className="h-72">
                  <ResponsiveContainer width="100%" height="100%">
                    <PieChart>
                      <Pie
                        data={domainData}
                        cx="50%"
                        cy="50%"
                        labelLine={false}
                        outerRadius={80}
                        fill="#8884d8"
                        dataKey="value"
                        label={({ name, percent }) => `${name.slice(0, 10)}... ${(percent * 100).toFixed(0)}%`}
                      >
                        {domainData.map((entry, index) => (
                          <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                        ))}
                      </Pie>
                      <Tooltip />
                    </PieChart>
                  </ResponsiveContainer>
                </CardContent>
              </Card>
              
              <Card>
                <CardHeader>
                  <CardTitle>Métriques des matchings</CardTitle>
                  <CardDescription>Performance des correspondances consultant-projet</CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="space-y-6 py-4">
                    <div className="space-y-2">
                      <div className="flex items-center justify-between">
                        <div className="flex items-center">
                          <CheckCircleIcon className="h-4 w-4 text-emerald-500 mr-2" />
                          <span className="text-sm font-medium">Taux de réussite des matchings</span>
                        </div>
                        <span className="text-sm font-bold">{stats.matching_success_rate}%</span>
                      </div>
                      <Progress value={stats.matching_success_rate} className="h-2" />
                    </div>
                    
                    <div className="space-y-2">
                      <div className="flex items-center justify-between">
                        <div className="flex items-center">
                          <BarChart3Icon className="h-4 w-4 text-blue-500 mr-2" />
                          <span className="text-sm font-medium">Score moyen des matchings</span>
                        </div>
                        <span className="text-sm font-bold">{stats.avg_matching_score}%</span>
                      </div>
                      <Progress value={stats.avg_matching_score} className="h-2" />
                    </div>
                    
                    <div className="space-y-2">
                      <div className="flex items-center justify-between">
                        <div className="flex items-center">
                          <FileTextIcon className="h-4 w-4 text-amber-500 mr-2" />
                          <span className="text-sm font-medium">Documents dans la GED</span>
                        </div>
                        <span className="text-sm font-bold">{stats.documents_count}</span>
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </div>
          </TabsContent>
        </Tabs>

        {/* Dernières activités */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <Card>
            <CardHeader>
              <CardTitle>Derniers consultants inscrits</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {stats.derniers_consultants.map((consultant, index) => (
                  <div key={index} className="flex items-center space-x-4 p-2 rounded-lg hover:bg-slate-50 transition-colors">
                    <div className="bg-blue-100 rounded-full p-2">
                      <UserIcon className="h-4 w-4 text-blue-600" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium truncate">{consultant.nom}</p>
                      <p className="text-xs text-slate-500 truncate">{consultant.specialite}</p>
                    </div>
                    <div className="text-xs px-2 py-1 rounded-full bg-slate-100 text-slate-700">{consultant.date}</div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardHeader>
              <CardTitle>Derniers appels d'offres</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {stats.derniers_appels.map((offer, index) => (
                  <div key={index} className="flex items-center space-x-4 p-2 rounded-lg hover:bg-slate-50 transition-colors">
                    <div className="bg-indigo-100 rounded-full p-2">
                      <BriefcaseIcon className="h-4 w-4 text-indigo-600" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium truncate">{offer.title}</p>
                      <p className="text-xs text-slate-500 truncate">{offer.client}</p>
                    </div>
                    <div className="text-xs px-2 py-1 rounded-full bg-slate-100 text-slate-700">{offer.date}</div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </AdminLayout>
  );
};

export default Dashboard;