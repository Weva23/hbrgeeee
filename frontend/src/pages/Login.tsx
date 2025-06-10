import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { toast } from "sonner";
import { LockIcon, UserIcon, ShieldIcon, HomeIcon } from "lucide-react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger, DialogFooter } from "@/components/ui/dialog";

const Login = () => {
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [registerDialogOpen, setRegisterDialogOpen] = useState(false);
  const [registerData, setRegisterData] = useState({
    username: "",
    password: "",
    confirmPassword: "",
    adminKey: "",
  });
  const navigate = useNavigate();

  // Vérifier si l'utilisateur est déjà connecté en tant qu'admin
  useEffect(() => {
    const userRole = localStorage.getItem("userRole");
    if (userRole === "admin") {
      navigate("/admin/dashboard");
    }
  }, [navigate]);

  // Stockage local des comptes créés (en situation réelle, ce serait dans une base de données)
  const [createdAccounts, setCreatedAccounts] = useState(() => {
    const savedAccounts = localStorage.getItem("createdAdminAccounts");
    return savedAccounts ? JSON.parse(savedAccounts) : [];
  });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);

    try {
      // Dans une application réelle, remplacez ceci par un appel API
      // const response = await fetch("http://127.0.0.1:8000/api/admin/login/", {
      //   method: "POST",
      //   headers: { "Content-Type": "application/json" },
      //   body: JSON.stringify({ username, password }),
      // });
      // const data = await response.json();

      // Vérifier si l'utilisateur existe dans les comptes créés
      const accounts = JSON.parse(localStorage.getItem("createdAdminAccounts") || "[]");
      const account = accounts.find(acc => acc.username === username && acc.password === password);
      
      if (account) {
        // En situation réelle, stockez un token JWT
        localStorage.setItem("userRole", "admin");
        localStorage.setItem("adminId", account.id || Date.now().toString());
        localStorage.setItem("adminUsername", username);
        localStorage.setItem("adminAuthToken", "demo-token-" + Date.now());
        toast.success("Connexion réussie");
        navigate("/admin/dashboard");
      } else {
        // Message générique pour tous les autres identifiants, y compris admin/admin
        toast.error("Identifiants incorrects. Seuls les comptes créés depuis le formulaire d'inscription sont autorisés.");
      }
    } catch (error) {
      console.error("Erreur de connexion:", error);
      toast.error("Erreur de connexion au serveur");
    } finally {
      setIsLoading(false);
    }
  };

  const handleRegisterSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    // Validation des données
    if (registerData.password !== registerData.confirmPassword) {
      toast.error("Les mots de passe ne correspondent pas");
      return;
    }

    if (!registerData.username || !registerData.password || !registerData.adminKey) {
      toast.error("Tous les champs sont obligatoires");
      return;
    }

    setIsLoading(true);
    
    try {
      // Dans une application réelle, remplacez ceci par un appel API
      // const response = await fetch("http://127.0.0.1:8000/api/admin/register/", {
      //   method: "POST",
      //   headers: { "Content-Type": "application/json" },
      //   body: JSON.stringify({
      //     username: registerData.username,
      //     password: registerData.password,
      //     admin_key: registerData.adminKey
      //   }),
      // });
      // const data = await response.json();

      // Simulation pour la démo (vérifier la clé admin)
      if (registerData.adminKey === "RICHAT2024") {
        // Sauvegarder le nouveau compte dans le localStorage
        const newAccount = {
          id: Date.now().toString(),
          username: registerData.username,
          password: registerData.password
        };
        
        // Récupérer les comptes existants et ajouter le nouveau
        const existingAccounts = JSON.parse(localStorage.getItem("createdAdminAccounts") || "[]");
        existingAccounts.push(newAccount);
        localStorage.setItem("createdAdminAccounts", JSON.stringify(existingAccounts));
        
        toast.success("Compte administrateur créé avec succès");
        toast.info("Vous pouvez maintenant vous connecter avec ce compte");
        setRegisterDialogOpen(false);
        
        // Pré-remplir les champs de connexion pour faciliter la connexion immédiate
        setUsername(registerData.username);
        setPassword(registerData.password);
      } else {
        toast.error("Clé d'administration invalide");
      }
    } catch (error) {
      console.error("Erreur d'inscription:", error);
      toast.error("Erreur lors de la création du compte");
    } finally {
      setIsLoading(false);
    }
  };

  const handleRegisterChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setRegisterData(prev => ({ ...prev, [name]: value }));
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
          <Dialog open={registerDialogOpen} onOpenChange={setRegisterDialogOpen}>
            <DialogTrigger asChild>
              <Button variant="link" className="text-admin-primary">
                Créer un compte administrateur
              </Button>
            </DialogTrigger>
            <DialogContent>
              <DialogHeader>
                <DialogTitle>Création d'un compte administrateur</DialogTitle>
              </DialogHeader>
              <form onSubmit={handleRegisterSubmit} className="space-y-4 py-4">
                <div className="space-y-2">
                  <Label htmlFor="register-username">Nom d'utilisateur</Label>
                  <Input
                    id="register-username"
                    name="username"
                    value={registerData.username}
                    onChange={handleRegisterChange}
                    required
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="register-password">Mot de passe</Label>
                  <Input
                    id="register-password"
                    name="password"
                    type="password"
                    value={registerData.password}
                    onChange={handleRegisterChange}
                    required
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="register-confirm-password">Confirmer le mot de passe</Label>
                  <Input
                    id="register-confirm-password"
                    name="confirmPassword"
                    type="password"
                    value={registerData.confirmPassword}
                    onChange={handleRegisterChange}
                    required
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="register-admin-key">Clé d'administration</Label>
                  <Input
                    id="register-admin-key"
                    name="adminKey"
                    type="password"
                    value={registerData.adminKey}
                    onChange={handleRegisterChange}
                    required
                  />
                  <p className="text-xs text-gray-500">
                    Une clé d'administration valide est requise pour créer un compte.
                  </p>
                  <p className="text-xs text-gray-500 mt-1">
                    Note: En mode démonstration, seuls les comptes créés via ce formulaire pourront se connecter.
                  </p>
                </div>
                <DialogFooter>
                  <Button
                    type="submit"
                    className="w-full bg-admin-primary"
                    disabled={isLoading}
                  >
                    {isLoading ? "Création en cours..." : "Créer un compte"}
                  </Button>
                </DialogFooter>
              </form>
            </DialogContent>
          </Dialog>
          <p className="text-xs text-center text-gray-500">
            Pour la démonstration, créez d'abord un compte via le formulaire d'inscription
          </p>
        </CardFooter>
      </Card>
    </div>
  );
};

export default Login;