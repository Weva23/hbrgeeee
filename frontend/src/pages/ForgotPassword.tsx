import React, { useState } from "react";
import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { toast } from "sonner";
import { MailIcon, ArrowLeftIcon } from "lucide-react";

const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || "http://127.0.0.1:8000";

const ForgotPassword = () => {
  const [email, setEmail] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [emailSent, setEmailSent] = useState(false);
  const navigate = useNavigate();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);

    if (!email || !email.includes("@")) {
      toast.error("Veuillez entrer une adresse email valide");
      setIsLoading(false);
      return;
    }

    try {
      console.log(`Envoi de la demande de réinitialisation pour: ${email}`);
      const response = await fetch(`${API_BASE_URL}/api/password-reset/request/`, {
        method: "POST",
        headers: { 
          "Content-Type": "application/json",
          "Origin": window.location.origin // Envoyer l'origine pour construire l'URL correcte
        },
        body: JSON.stringify({ email }),
      });

      const data = await response.json();
      console.log("Réponse reçue:", data);
      
      if (response.ok) {
        setEmailSent(true);
        toast.success("Si l'adresse email est associée à un compte, un email de réinitialisation a été envoyé.");
      } else {
        // Même message de succès pour des raisons de sécurité
        setEmailSent(true);
        toast.success("Si l'adresse email est associée à un compte, un email de réinitialisation a été envoyé.");
        // Mais on log l'erreur en console pour le débogage
        console.error("Erreur:", data.error);
      }
    } catch (error) {
      console.error("Erreur lors de la demande:", error);
      toast.error("Une erreur s'est produite. Veuillez réessayer plus tard.");
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-100">
      <Card className="w-full max-w-md shadow-lg">
        <CardHeader className="space-y-1">
          <CardTitle className="text-2xl font-bold text-center">
            Mot de passe oublié
          </CardTitle>
          <CardDescription className="text-center">
            {!emailSent ? 
              "Entrez votre adresse email pour réinitialiser votre mot de passe" :
              "Vérifiez votre boîte mail pour les instructions de réinitialisation"
            }
          </CardDescription>
        </CardHeader>
        <CardContent>
          {!emailSent ? (
            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="email">Adresse email</Label>
                <div className="relative">
                  <MailIcon className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-500 h-4 w-4" />
                  <Input
                    id="email"
                    type="email"
                    placeholder="consultant@example.com"
                    className="pl-10"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    required
                  />
                </div>
              </div>
              <Button
                type="submit"
                className="w-full bg-blue-600 hover:bg-blue-500"
                disabled={isLoading}
              >
                {isLoading ? "Envoi en cours..." : "Envoyer les instructions"}
              </Button>
            </form>
          ) : (
            <div className="text-center space-y-4 py-4">
              <p className="text-gray-600">
                Si l'adresse <span className="font-medium">{email}</span> est associée à un compte, vous recevrez un email avec les instructions pour réinitialiser votre mot de passe.
              </p>
              <p className="text-gray-600">
                N'oubliez pas de vérifier votre dossier de spam si vous ne trouvez pas l'email.
              </p>
            </div>
          )}
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
};

export default ForgotPassword;