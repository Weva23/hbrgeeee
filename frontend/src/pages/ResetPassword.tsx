import React, { useState, useEffect } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { toast } from "sonner";
import { LockIcon, ShieldIcon, ArrowLeftIcon, CheckCircleIcon, XCircleIcon, EyeIcon, EyeOffIcon } from "lucide-react";

const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || "http://127.0.0.1:8000";

const ResetPassword = () => {
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [isValidating, setIsValidating] = useState(true);
  const [isTokenValid, setIsTokenValid] = useState(false);
  const [userEmail, setUserEmail] = useState("");
  const [validationError, setValidationError] = useState("");
  const navigate = useNavigate();
  const { uid, token } = useParams<{ uid: string; token: string }>();

  // Validation du mot de passe
  const validatePassword = (password: string) => {
    const errors = [];
    if (password.length < 8) errors.push("Au moins 8 caractères");
    if (!/[A-Z]/.test(password)) errors.push("Au moins une majuscule");
    if (!/[a-z]/.test(password)) errors.push("Au moins une minuscule");
    if (!/[0-9]/.test(password)) errors.push("Au moins un chiffre");
    return errors;
  };

  // Valider le token au chargement de la page
  useEffect(() => {
    const validateToken = async () => {
      if (!uid || !token) {
        console.error("❌ Paramètres manquants - UID:", uid, "Token:", !!token);
        setValidationError("Lien de réinitialisation invalide - paramètres manquants");
        setIsValidating(false);
        return;
      }

      console.log("🔍 Validation du token - UID:", uid, "Token (longueur):", token.length);
      console.log("🌐 URL complète:", window.location.href);

      try {
        const response = await fetch(`${API_BASE_URL}/api/password-reset/validate/`, {
          method: "POST",
          headers: { 
            "Content-Type": "application/json",
            "Origin": window.location.origin
          },
          credentials: 'include',
          body: JSON.stringify({ uid, token }),
        });

        const data = await response.json();
        console.log("📨 Réponse de validation:", data);

        if (response.ok && data.valid) {
          setIsTokenValid(true);
          setUserEmail(data.user_email || "");
          console.log("✅ Token validé avec succès pour", data.user_email);
          toast.success("Lien de réinitialisation valide");
        } else {
          console.error("❌ Token invalide:", data.error);
          setValidationError(data.error || "Le lien de réinitialisation est invalide ou a expiré");
          toast.error(data.error || "Le lien de réinitialisation est invalide ou a expiré");
        }
      } catch (error) {
        console.error("💥 Erreur lors de la validation:", error);
        setValidationError("Une erreur s'est produite lors de la validation du lien");
        toast.error("Erreur de connexion lors de la validation");
      } finally {
        setIsValidating(false);
      }
    };

    validateToken();
  }, [uid, token]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    // Validations côté client
    if (password !== confirmPassword) {
      toast.error("Les mots de passe ne correspondent pas");
      return;
    }

    const passwordErrors = validatePassword(password);
    if (passwordErrors.length > 0) {
      toast.error(`Mot de passe invalide: ${passwordErrors.join(", ")}`);
      return;
    }

    setIsLoading(true);

    try {
      console.log("🔄 Envoi de la demande de réinitialisation");
      console.log("📋 UID:", uid, "Token (longueur):", token?.length);
      
      const response = await fetch(`${API_BASE_URL}/api/password-reset/reset/`, {
        method: "POST",
        headers: { 
          "Content-Type": "application/json",
          "Origin": window.location.origin
        },
        credentials: 'include',
        body: JSON.stringify({
          uid,
          token,
          new_password: password,
        }),
      });

      const data = await response.json();
      console.log("📨 Réponse reçue:", data);

      if (response.ok && data.success) {
        console.log("✅ Mot de passe réinitialisé avec succès");
        toast.success("Mot de passe réinitialisé avec succès ! Redirection vers la connexion...");
        
        // Redirection avec délai pour laisser voir le message
        setTimeout(() => {
          navigate("/consultant/login", { 
            state: { 
              message: "Mot de passe réinitialisé avec succès. Vous pouvez maintenant vous connecter.",
              email: userEmail 
            }
          });
        }, 2000);
      } else {
        console.error("❌ Erreur de réinitialisation:", data.error);
        toast.error(data.error || "Échec de la réinitialisation du mot de passe");
      }
    } catch (error) {
      console.error("💥 Erreur lors de la réinitialisation:", error);
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
            <div className="flex justify-center mb-2">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
            </div>
            <CardTitle className="text-center">Validation du lien</CardTitle>
            <CardDescription className="text-center">
              Veuillez patienter pendant que nous validons votre lien de réinitialisation...
            </CardDescription>
          </CardHeader>
        </Card>
      </div>
    );
  }

  // Affichage du formulaire de réinitialisation si token valide
  if (isTokenValid) {
    const passwordErrors = validatePassword(password);
    const isPasswordValid = password.length >= 8 && passwordErrors.length === 0;
    const doPasswordsMatch = password === confirmPassword && confirmPassword.length > 0;

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
              {userEmail ? (
                <span>Pour le compte : <span className="font-medium text-blue-600">{userEmail}</span></span>
              ) : (
                "Créez un nouveau mot de passe sécurisé"
              )}
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
                    type={showPassword ? "text" : "password"}
                    className="pl-10 pr-10"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    required
                  />
                  <button
                    type="button"
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-500 hover:text-gray-700"
                    onClick={() => setShowPassword(!showPassword)}
                  >
                    {showPassword ? <EyeOffIcon className="h-4 w-4" /> : <EyeIcon className="h-4 w-4" />}
                  </button>
                </div>
                
                {/* Indicateurs de sécurité du mot de passe */}
                {password && (
                  <div className="space-y-1">
                    <div className="flex items-center gap-2 text-xs">
                      {password.length >= 8 ? (
                        <CheckCircleIcon className="h-3 w-3 text-green-500" />
                      ) : (
                        <XCircleIcon className="h-3 w-3 text-red-500" />
                      )}
                      <span className={password.length >= 8 ? "text-green-600" : "text-red-600"}>
                        Au moins 8 caractères
                      </span>
                    </div>
                    <div className="flex items-center gap-2 text-xs">
                      {/[A-Z]/.test(password) ? (
                        <CheckCircleIcon className="h-3 w-3 text-green-500" />
                      ) : (
                        <XCircleIcon className="h-3 w-3 text-red-500" />
                      )}
                      <span className={/[A-Z]/.test(password) ? "text-green-600" : "text-red-600"}>
                        Au moins une majuscule
                      </span>
                    </div>
                    <div className="flex items-center gap-2 text-xs">
                      {/[0-9]/.test(password) ? (
                        <CheckCircleIcon className="h-3 w-3 text-green-500" />
                      ) : (
                        <XCircleIcon className="h-3 w-3 text-red-500" />
                      )}
                      <span className={/[0-9]/.test(password) ? "text-green-600" : "text-red-600"}>
                        Au moins un chiffre
                      </span>
                    </div>
                  </div>
                )}
              </div>
              
              <div className="space-y-2">
                <Label htmlFor="confirm-password">Confirmer le mot de passe</Label>
                <div className="relative">
                  <LockIcon className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-500 h-4 w-4" />
                  <Input
                    id="confirm-password"
                    type={showConfirmPassword ? "text" : "password"}
                    className="pl-10 pr-10"
                    value={confirmPassword}
                    onChange={(e) => setConfirmPassword(e.target.value)}
                    required
                  />
                  <button
                    type="button"
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-500 hover:text-gray-700"
                    onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                  >
                    {showConfirmPassword ? <EyeOffIcon className="h-4 w-4" /> : <EyeIcon className="h-4 w-4" />}
                  </button>
                </div>
                
                {/* Indicateur de correspondance */}
                {confirmPassword && (
                  <div className="flex items-center gap-2 text-xs">
                    {doPasswordsMatch ? (
                      <CheckCircleIcon className="h-3 w-3 text-green-500" />
                    ) : (
                      <XCircleIcon className="h-3 w-3 text-red-500" />
                    )}
                    <span className={doPasswordsMatch ? "text-green-600" : "text-red-600"}>
                      Les mots de passe correspondent
                    </span>
                  </div>
                )}
              </div>
              
              <Button
                type="submit"
                className="w-full bg-blue-600 hover:bg-blue-500"
                disabled={isLoading || !isPasswordValid || !doPasswordsMatch}
              >
                {isLoading ? (
                  <div className="flex items-center gap-2">
                    <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
                    Réinitialisation en cours...
                  </div>
                ) : (
                  "Réinitialiser le mot de passe"
                )}
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
          <div className="flex justify-center mb-2">
            <XCircleIcon className="h-8 w-8 text-red-500" />
          </div>
          <CardTitle className="text-center text-red-600">Lien invalide</CardTitle>
          <CardDescription className="text-center">
            {validationError || "Le lien de réinitialisation est invalide ou a expiré."}
          </CardDescription>
        </CardHeader>
        <CardContent className="text-center py-6 space-y-4">
          <p className="text-gray-600">
            Veuillez faire une nouvelle demande de réinitialisation de mot de passe.
          </p>
          <div className="space-y-2">
            <Button 
              onClick={() => navigate("/consultant/forgot-password")}
              className="w-full bg-blue-600 hover:bg-blue-500"
            >
              Nouvelle demande
            </Button>
            <Button 
              variant="outline"
              onClick={() => navigate("/consultant/login")}
              className="w-full"
            >
              Retour à la connexion
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default ResetPassword;