import React, { useState } from "react";
import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { toast } from "sonner";
import { HomeIcon } from "lucide-react";

const ConsultantLogin = () => {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const navigate = useNavigate();

  // Dans la fonction handleSubmit de ConsultantLogin.tsx
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);

    try {
      const response = await fetch("http://127.0.0.1:8000/api/consultant/login/", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ email, password }),
      });

      const data = await response.json();

      if (!response.ok) {
        // Vérifier si le compte n'est pas validé
        if (response.status === 403 && data.error && data.error.includes("attente de validation")) {
          toast.error(data.error || "Votre compte est en attente de validation par un administrateur");
          setIsLoading(false);
          return;
        }
        
        throw new Error(data.error || "Erreur lors de la connexion");
      }

      // Connexion réussie
      localStorage.setItem("userRole", "consultant");
      localStorage.setItem("consultantId", data.consultant_id.toString());
      toast.success("Connexion réussie !");
      navigate("/consultant/welcome");
    } catch (error) {
      console.error("Erreur:", error);
      toast.error(error instanceof Error ? error.message : "Erreur lors de la connexion");
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-100">
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
          <CardTitle className="text-2xl font-bold text-center">Espace Consultant</CardTitle>
          <CardDescription className="text-center">
            Connectez-vous à votre compte consultant
          </CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="email">Email</Label>
              <Input
                id="email"
                type="email"
                placeholder="vous@exemple.com"
                required
                value={email}
                onChange={(e) => setEmail(e.target.value)}
              />
            </div>
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <Label htmlFor="password">Mot de passe</Label>
                <a
                  href="/consultant/forgot-password"
                  className="text-sm text-blue-600 hover:underline"
                >
                  Mot de passe oublié ?
                </a>
              </div>
              <Input
                id="password"
                type="password"
                required
                value={password}
                onChange={(e) => setPassword(e.target.value)}
              />
            </div>
            <Button
              type="submit"
              className="w-full bg-blue-600 hover:bg-blue-500"
              disabled={isLoading}
            >
              {isLoading ? "Connexion en cours..." : "Se connecter"}
            </Button>
          </form>
        </CardContent>
        <CardFooter>
          <p className="text-sm text-center w-full">
            Pas encore de compte ?{" "}
            <a href="/consultant/register" className="text-blue-600 hover:underline">
              S'inscrire
            </a>
          </p>
        </CardFooter>
      </Card>
    </div>
  );
};

export default ConsultantLogin;