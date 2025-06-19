import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { toast } from "sonner";
import { LockIcon, UserIcon, HomeIcon } from "lucide-react";

const Login = () => {
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const navigate = useNavigate();

  // Identifiants fixes pour l'administrateur unique
  const ADMIN_USERNAME = "wevanahi";
  const ADMIN_PASSWORD = "admin123";

  // Vérifier si l'utilisateur est déjà connecté en tant qu'admin
  useEffect(() => {
    const userRole = localStorage.getItem("userRole");
    if (userRole === "admin") {
      navigate("/admin/dashboard");
    }
  }, [navigate]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);

    try {
      // Vérifier les identifiants fixes
      if (username === ADMIN_USERNAME && password === ADMIN_PASSWORD) {
        // Stocker les informations de session
        localStorage.setItem("userRole", "admin");
        localStorage.setItem("adminId", "1");
        localStorage.setItem("adminUsername", username);
        localStorage.setItem("adminAuthToken", "demo-token-" + Date.now());
        
        toast.success("Connexion réussie");
        navigate("/admin/dashboard");
      } else {
        toast.error("Identifiants incorrects");
      }
    } catch (error) {
      console.error("Erreur de connexion:", error);
      toast.error("Erreur de connexion");
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-admin-background">
      {/* Bouton retour à l'accueil */}
      <Button
        onClick={() => navigate("/")}
        variant="outline"
        className="absolute top-4 left-4 flex items-center gap-2"
      >
        <HomeIcon className="h-4 w-4" />
        Accueil
      </Button>

      <Card className="w-full max-w-md shadow-lg">
        <CardHeader className="space-y-1">
          <div className="flex justify-center mb-4">
            <img 
              src="/lovable-uploads/c66ee083-bf5b-456a-b3a6-368225f4b25e.png" 
              alt="Richat Logo" 
              className="h-16 w-auto"
            />
          </div>
          <CardTitle className="text-2xl font-bold text-center">
            Portail d'Administration
          </CardTitle>
          <CardDescription className="text-center">
            Connectez-vous pour accéder au tableau de bord
          </CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="username">Nom d'utilisateur</Label>
              <div className="relative">
                <UserIcon className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-500 h-4 w-4" />
                <Input
                  id="username"
                  placeholder="admin"
                  className="pl-10"
                  value={username}
                  onChange={(e) => setUsername(e.target.value)}
                  required
                />
              </div>
            </div>
            <div className="space-y-2">
              <Label htmlFor="password">Mot de passe</Label>
              <div className="relative">
                <LockIcon className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-500 h-4 w-4" />
                <Input
                  id="password"
                  type="password"
                  placeholder="••••••••"
                  className="pl-10"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  required
                />
              </div>
            </div>
            <Button 
              type="submit" 
              className="w-full bg-admin-primary hover:bg-admin-secondary" 
              disabled={isLoading}
            >
              {isLoading ? "Connexion en cours..." : "Se connecter"}
            </Button>
          </form>
        </CardContent>
        <CardFooter className="flex flex-col space-y-2">
          <p className="text-xs text-center text-gray-500">
            
          </p>
        </CardFooter>
      </Card>
    </div>
  );
};

export default Login;