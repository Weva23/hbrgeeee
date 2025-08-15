import React, { useState } from "react";
import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { toast } from "sonner";
import { MailIcon, ArrowLeftIcon, CheckCircleIcon, AlertCircleIcon } from "lucide-react";

const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || "http://127.0.0.1:8000";

const ForgotPassword = () => {
  const [email, setEmail] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [emailSent, setEmailSent] = useState(false);
  const [debugInfo, setDebugInfo] = useState<any>(null);
  const navigate = useNavigate();

  const validateEmail = (email: string) => {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return emailRegex.test(email);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    setDebugInfo(null);

    // Validation côté client
    if (!email || !validateEmail(email)) {
      toast.error("Veuillez entrer une adresse email valide");
      setIsLoading(false);
      return;
    }

    try {
      console.log(`🔄 Envoi de la demande de réinitialisation pour: ${email}`);
      console.log(`🌐 API URL: ${API_BASE_URL}/api/password-reset/request/`);
      console.log(`🔗 Origin: ${window.location.origin}`);

      const response = await fetch(`${API_BASE_URL}/api/password-reset/request/`, {
        method: "POST",
        headers: { 
          "Content-Type": "application/json",
          "Origin": window.location.origin,
          "Referer": window.location.href
        },
        credentials: 'include',
        body: JSON.stringify({ email }),
      });

      const data = await response.json();
      console.log("📨 Réponse reçue:", data);
      
      // Stocker les infos de débogage si disponibles
      if (data.debug_info) {
        setDebugInfo(data.debug_info);
        console.log("🐛 Debug info:", data.debug_info);
      }
      
      if (response.ok && data.success) {
        setEmailSent(true);
        toast.success("Email de réinitialisation envoyé avec succès !");
        console.log("✅ Email envoyé avec succès");
      } else if (response.ok) {
        // Même si l'API retourne success: true, considérer comme succès
        setEmailSent(true);
        toast.success("Si l'adresse email est associée à un compte, un email de réinitialisation a été envoyé.");
        console.log("ℹ️ Réponse positive de sécurité");
      } else {
        // En cas d'erreur serveur, montrer quand même un message positif pour la sécurité
        setEmailSent(true);
        toast.success("Si l'adresse email est associée à un compte, un email de réinitialisation a été envoyé.");
        console.error("❌ Erreur serveur:", data.error);
      }
    } catch (error) {
      console.error("💥 Erreur lors de la demande:", error);
      
      // Même en cas d'erreur réseau, afficher un message positif
      setEmailSent(true);
      toast.success("Si l'adresse email est associée à un compte, un email de réinitialisation a été envoyé.");
      
      // Toast d'erreur technique pour l'utilisateur technique
      if (import.meta.env.DEV) {
        toast.error(`Erreur technique: ${error}`);
      }
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
                    autoComplete="email"
                  />
                </div>
              </div>
              <Button
                type="submit"
                className="w-full bg-blue-600 hover:bg-blue-500"
                disabled={isLoading}
              >
                {isLoading ? (
                  <div className="flex items-center gap-2">
                    <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
                    Envoi en cours...
                  </div>
                ) : (
                  "Envoyer les instructions"
                )}
              </Button>
            </form>
          ) : (
            <div className="text-center space-y-4 py-4">
              <div className="flex justify-center mb-4">
                <CheckCircleIcon className="h-12 w-12 text-green-500" />
              </div>
              <p className="text-gray-600">
                Si l'adresse <span className="font-medium text-blue-600">{email}</span> est associée à un compte, vous recevrez un email avec les instructions pour réinitialiser votre mot de passe.
              </p>
              <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-3">
                <div className="flex items-start gap-2">
                  <AlertCircleIcon className="h-4 w-4 text-yellow-600 mt-0.5 flex-shrink-0" />
                  <div className="text-sm text-yellow-800">
                    <p className="font-medium">N'oubliez pas de vérifier :</p>
                    <ul className="mt-1 space-y-1">
                      <li>• Votre dossier de spam/courrier indésirable</li>
                      <li>• L'onglet "Promotions" (Gmail)</li>
                      <li>• Attendez quelques minutes pour la réception</li>
                    </ul>
                  </div>
                </div>
              </div>
              
              {/* Informations de débogage en mode développement */}
              {/* {import.meta.env.DEV && debugInfo && (
                <div className="mt-4 p-3 bg-gray-50 border rounded text-xs text-left">
                  <p className="font-medium text-gray-700 mb-2">Debug Info:</p>
                  <pre className="text-gray-600 whitespace-pre-wrap">
                    {JSON.stringify(debugInfo, null, 2)}
                  </pre>
                </div>
              )} */}
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