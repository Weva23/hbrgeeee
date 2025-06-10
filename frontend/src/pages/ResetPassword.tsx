import React, { useState, useEffect } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { toast } from "sonner";
import { LockIcon, ShieldIcon, ArrowLeftIcon } from "lucide-react";

const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || "http://127.0.0.1:8000";

const ResetPassword = () => {
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [isValidating, setIsValidating] = useState(true);
  const [isTokenValid, setIsTokenValid] = useState(false);
  const [userEmail, setUserEmail] = useState("");
  const navigate = useNavigate();
  const { uid, token } = useParams<{ uid: string; token: string }>();

  // Valider le token au chargement de la page
  useEffect(() => {
    const validateToken = async () => {
      if (!uid || !token) {
        console.error("Paramètres manquants - UID:", uid, "Token:", token);
        toast.error("Lien de réinitialisation invalide");
        navigate("/consultant/login");
        return;
      }

      console.log("Validation du token - UID:", uid, "Token (longueur):", token.length);

      try {
        const response = await fetch(`${API_BASE_URL}/api/password-reset/validate/`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ uid, token }),
        });

        const data = await response.json();
        console.log("Réponse de validation:", data);

        if (data.valid) {
          setIsTokenValid(true);
          setUserEmail(data.user_email || "");
          console.log("Token validé avec succès pour", data.user_email);
        } else {
          console.error("Token invalide:", data.error);
          toast.error("Le lien de réinitialisation est invalide ou a expiré");
          setTimeout(() => navigate("/consultant/login"), 3000);
        }
      } catch (error) {
        console.error("Erreur lors de la validation:", error);
        toast.error("Une erreur s'est produite lors de la validation du lien");
        setTimeout(() => navigate("/consultant/login"), 3000);
      } finally {
        setIsValidating(false);
      }
    };

    validateToken();
  }, [uid, token, navigate]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (password !== confirmPassword) {
      toast.error("Les mots de passe ne correspondent pas");
      return;
    }

    if (password.length < 8) {
      toast.error("Le mot de passe doit contenir au moins 8 caractères");
      return;
    }

    setIsLoading(true);

    try {
      console.log("Envoi de la demande de réinitialisation - UID:", uid, "Token (longueur):", token?.length);
      
      const response = await fetch(`${API_BASE_URL}/api/password-reset/reset/`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          uid,
          token,
          new_password: password,
        }),
      });

      const data = await response.json();
      console.log("Réponse reçue:", data);

      if (response.ok) {
        toast.success("Mot de passe réinitialisé avec succès");
        setTimeout(() => navigate("/consultant/login"), 2000);
      } else {
        toast.error(data.error || "Échec de la réinitialisation du mot de passe");
        console.error("Erreur de réinitialisation:", data);
      }
    } catch (error) {
      console.error("Erreur lors de la réinitialisation:", error);
      toast.error("Une erreur s'est produite. Veuillez réessayer plus tard.");
    } finally {
      setIsLoading(false);
    }
  };

  // Affichage pendant la validation du token
  if (isValidating) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-100">
        <Card className="w-full max-w-md shadow-lg">
          <CardHeader className="space-y-1">
            <CardTitle className="text-center">Validation du lien</CardTitle>
            <CardDescription className="text-center">
              Veuillez patienter pendant que nous validons votre lien de réinitialisation...
            </CardDescription>
          </CardHeader>
          <CardContent className="flex justify-center py-6">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
          </CardContent>
        </Card>
      </div>
    );
  }

  // Affichage du formulaire de réinitialisation
  if (isTokenValid) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-100">
        <Card className="w-full max-w-md shadow-lg">
          <CardHeader className="space-y-1">
            <div className="flex justify-center mb-2">
              <ShieldIcon className="h-8 w-8 text-blue-600" />
            </div>
            <CardTitle className="text-2xl font-bold text-center">
              Réinitialisation du mot de passe
            </CardTitle>
            <CardDescription className="text-center">
              {userEmail ? `Pour le compte : ${userEmail}` : "Créez un nouveau mot de passe sécurisé"}
            </CardDescription>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="password">Nouveau mot de passe</Label>
                <div className="relative">
                  <LockIcon className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-500 h-4 w-4" />
                  <Input
                    id="password"
                    type="password"
                    className="pl-10"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    required
                    minLength={8}
                  />
                </div>
                <p className="text-xs text-gray-500">
                  Minimum 8 caractères
                </p>
              </div>
              <div className="space-y-2">
                <Label htmlFor="confirm-password">Confirmer le mot de passe</Label>
                <div className="relative">
                  <LockIcon className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-500 h-4 w-4" />
                  <Input
                    id="confirm-password"
                    type="password"
                    className="pl-10"
                    value={confirmPassword}
                    onChange={(e) => setConfirmPassword(e.target.value)}
                    required
                  />
                </div>
              </div>
              <Button
                type="submit"
                className="w-full bg-blue-600 hover:bg-blue-500"
                disabled={isLoading}
              >
                {isLoading ? "Réinitialisation en cours..." : "Réinitialiser le mot de passe"}
              </Button>
            </form>
          </CardContent>
          <CardFooter className="flex justify-center">
            <Button
              variant="link"
              onClick={() => navigate("/consultant/login")}
              className="flex items-center gap-2"
            >
              <ArrowLeftIcon className="h-4 w-4" />
              Retour à la connexion
            </Button>
          </CardFooter>
        </Card>
      </div>
    );
  }

  // Affichage en cas de token invalide
  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-100">
      <Card className="w-full max-w-md shadow-lg">
        <CardHeader className="space-y-1">
          <CardTitle className="text-center text-red-600">Lien invalide</CardTitle>
          <CardDescription className="text-center">
            Le lien de réinitialisation est invalide ou a expiré.
          </CardDescription>
        </CardHeader>
        <CardContent className="text-center py-6">
          <p className="mb-4">Veuillez faire une nouvelle demande de réinitialisation de mot de passe.</p>
          <Button 
            onClick={() => navigate("/consultant/forgot-password")}
            className="bg-blue-600 hover:bg-blue-500"
          >
            Nouvelle demande
          </Button>
        </CardContent>
      </Card>
    </div>
  );
};

export default ResetPassword;