import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import {
  Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle
} from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { toast } from "sonner";
import {
  Form, FormControl, FormField, FormItem, FormLabel, FormMessage, FormDescription
} from "@/components/ui/form";
import { 
  Select, 
  SelectContent, 
  SelectItem, 
  SelectTrigger, 
  SelectValue 
} from "@/components/ui/select";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { 
  InfoIcon, 
  CheckCircleIcon, 
  ExternalLinkIcon, 
  Shield,
  Star,
  TrendingUp,
  Users,
  Award,
  Clock,
  FileText,
  Zap,
  Upload
} from "lucide-react";
import { Checkbox } from "@/components/ui/checkbox";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";

// Configuration de l'API
const API_BASE_URL = "http://127.0.0.1:8000/api";

// Schéma de validation du formulaire simplifié
const formSchema = z.object({
  firstName: z.string()
    .min(2, "Le prénom doit contenir au moins 2 caractères")
    .max(50, "Le prénom ne peut pas dépasser 50 caractères")
    .regex(/^[A-Za-zÀ-ÿ\u0600-\u06FF\s\-'\.]+$/, "Le prénom contient des caractères invalides"),
  lastName: z.string()
    .min(2, "Le nom doit contenir au moins 2 caractères")
    .max(50, "Le nom ne peut pas dépasser 50 caractères")
    .regex(/^[A-Za-zÀ-ÿ\u0600-\u06FF\s\-'\.]+$/, "Le nom contient des caractères invalides"),
  email: z.string()
    .email("Format d'email invalide")
    .min(1, "L'email est requis"),
  phone: z.string()
    .min(8, "Le numéro de téléphone doit contenir au moins 8 caractères")
    .max(20, "Le numéro de téléphone est trop long")
    .regex(/^[\d\s\-\+\(\)]+$/, "Le numéro contient des caractères invalides"),
  country: z.string()
    .min(2, "Le pays doit contenir au moins 2 caractères")
    .max(100, "Le nom du pays est trop long"),
  city: z.string()
    .min(2, "La ville doit contenir au moins 2 caractères")
    .max(100, "Le nom de la ville est trop long"),
  startAvailability: z.string()
    .min(1, "Date de début requise")
    .refine((date) => new Date(date) >= new Date(), "La date doit être dans le futur"),
  endAvailability: z.string()
    .min(1, "Date de fin requise"),
  password: z.string()
    .min(8, "Le mot de passe doit contenir au moins 8 caractères")
    .max(128, "Le mot de passe est trop long")
    .regex(/^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)/, "Le mot de passe doit contenir au moins une minuscule, une majuscule et un chiffre"),
  confirmPassword: z.string()
    .min(1, "La confirmation du mot de passe est requise"),
  domainePrincipal: z.string()
    .min(1, "Domaine requis"),
  specialite: z.string()
    .min(2, "Sous-domaine requis")
    .max(200, "La spécialité est trop longue"),
  competences: z.string()
    .optional(),
  privacyAccepted: z.boolean()
    .refine((val) => val === true, {
      message: "Vous devez accepter la politique de confidentialité pour continuer"
    }),
}).refine((data) => data.password === data.confirmPassword, {
  message: "Les mots de passe ne correspondent pas",
  path: ["confirmPassword"],
}).refine((data) => new Date(data.endAvailability) > new Date(data.startAvailability), {
  message: "La date de fin doit être postérieure à la date de début",
  path: ["endAvailability"],
});

type FormValues = z.infer<typeof formSchema>;

// Composant pour la politique de confidentialité
const PrivacyPolicyDialog = () => (
  <Dialog>
    <DialogTrigger asChild>
      <Button variant="link" className="h-auto p-0 text-blue-600 underline">
        Politique de confidentialité
        <ExternalLinkIcon className="ml-1 h-3 w-3" />
      </Button>
    </DialogTrigger>
    <DialogContent className="max-w-4xl max-h-[80vh] overflow-y-auto">
      <DialogHeader>
        <DialogTitle className="flex items-center gap-2">
          <Shield className="h-5 w-5 text-blue-600" />
          Politique de confidentialité – Recrutement
        </DialogTitle>
        <DialogDescription>
          Conditions de traitement de vos données personnelles par Richat Partners
        </DialogDescription>
      </DialogHeader>
      <div className="space-y-6 text-sm">
        <div className="bg-blue-50 p-4 rounded-lg border border-blue-200">
          <h3 className="font-semibold text-base mb-2 text-blue-800">1. Responsable du traitement</h3>
          <p className="text-blue-700">Richat Partners, en sa qualité de responsable du traitement, collecte et traite vos données personnelles dans le cadre de ses procédures de recrutement.</p>
        </div>
        
        <div>
          <h3 className="font-semibold text-base mb-2">2. Données collectées</h3>
          <p>Nous collectons les informations que vous fournissez volontairement :</p>
          <ul className="list-disc list-inside ml-4 mt-2 space-y-1">
            <li>Informations personnelles (nom, prénom, email, téléphone)</li>
            <li>Documents professionnels (CV, lettres de motivation)</li>
            <li>Compétences, expériences et formations</li>
            <li>Données de disponibilité</li>
          </ul>
        </div>

        <div>
          <h3 className="font-semibold text-base mb-2">3. Finalité du traitement</h3>
          <p>Vos données sont utilisées exclusivement pour :</p>
          <ul className="list-disc list-inside ml-4 mt-2 space-y-1">
            <li>L'évaluation de votre candidature</li>
            <li>La gestion de notre base de talents et consultants</li>
            <li>La mise en relation avec des opportunités professionnelles</li>
            <li>La communication concernant nos services</li>
          </ul>
        </div>

        <div>
          <h3 className="font-semibold text-base mb-2">4. Durée de conservation</h3>
          <p>Vos données sont conservées pendant 2 ans à compter de la date de soumission de votre candidature, sauf demande contraire de votre part.</p>
        </div>

        <div>
          <h3 className="font-semibold text-base mb-2">5. Vos droits</h3>
          <p>Conformément au RGPD, vous disposez des droits suivants :</p>
          <ul className="list-disc list-inside ml-4 mt-2 space-y-1">
            <li>Droit d'accès à vos données personnelles</li>
            <li>Droit de rectification des données inexactes</li>
            <li>Droit de suppression de vos données</li>
            <li>Droit d'opposition au traitement</li>
            <li>Droit à la portabilité de vos données</li>
          </ul>
          <p className="mt-2"><strong>Contact :</strong> contact@richat-partners.com</p>
        </div>
      </div>
    </DialogContent>
  </Dialog>
);

const ConsultantRegister = () => {
  const [isLoading, setIsLoading] = useState(false);
  const [registrationComplete, setRegistrationComplete] = useState(false);
  const [csrfToken, setCsrfToken] = useState<string>("");
  const [cvFile, setCvFile] = useState<File | null>(null);
  
  const navigate = useNavigate();

  // Récupérer le token CSRF au chargement
  useEffect(() => {
    const fetchCsrfToken = async () => {
      try {
        const response = await fetch(`${API_BASE_URL}/get-csrf-token/`, {
          credentials: 'include'
        });
        const data = await response.json();
        if (data.csrf_token) {
          setCsrfToken(data.csrf_token);
          console.log("Token CSRF récupéré");
        }
      } catch (error) {
        console.error("Erreur récupération token CSRF:", error);
        toast.error("Erreur de connexion sécurisée. Veuillez rafraîchir la page.");
      }
    };

    fetchCsrfToken();
  }, []);

  // Initialisation du formulaire avec validation zod
  const form = useForm<FormValues>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      firstName: "",
      lastName: "",
      email: "",
      phone: "",
      country: "Mauritanie",
      city: "Nouakchott",
      startAvailability: "",
      endAvailability: "",
      password: "",
      confirmPassword: "",
      domainePrincipal: "DIGITAL",
      specialite: "",
      competences: "",
      privacyAccepted: false,
    },
  });

  // Gestion du fichier CV
  const handleFileChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file) {
      // Vérifier le type de fichier
      const allowedTypes = ['application/pdf', 'application/msword', 'application/vnd.openxmlformats-officedocument.wordprocessingml.document'];
      if (!allowedTypes.includes(file.type)) {
        toast.error("Format de fichier non supporté. Veuillez utiliser PDF, DOC ou DOCX.");
        return;
      }
      
      // Vérifier la taille (max 25MB)
      if (file.size > 25 * 1024 * 1024) {
        toast.error("Le fichier est trop volumineux. Taille maximum : 25MB.");
        return;
      }
      
      setCvFile(file);
      toast.success(`CV "${file.name}" sélectionné avec succès`);
    }
  };

  // Validation des dates
  const validateDates = (startDate: string, endDate: string): boolean => {
    const start = new Date(startDate);
    const end = new Date(endDate);
    const now = new Date();
    
    if (start <= now) {
      toast.error("La date de début doit être dans le futur");
      return false;
    }
    
    if (end <= start) {
      toast.error("La date de fin doit être postérieure à la date de début");
      return false;
    }
    
    return true;
  };

  // Soumission du formulaire
  const onSubmit = async (data: FormValues) => {
    // Validations préliminaires
    if (!data.privacyAccepted) {
      toast.error("Vous devez accepter la politique de confidentialité pour continuer");
      return;
    }

    if (!csrfToken) {
      toast.error("Erreur de sécurité. Veuillez rafraîchir la page.");
      return;
    }

    // Validation des dates
    if (!validateDates(data.startAvailability, data.endAvailability)) {
      return;
    }

    setIsLoading(true);

    try {
      const formData = new FormData();
      
      // Données personnelles
      formData.append("nom", data.lastName.trim());
      formData.append("prenom", data.firstName.trim());
      formData.append("email", data.email.trim().toLowerCase());
      formData.append("telephone", data.phone.trim());
      formData.append("pays", data.country.trim());
      formData.append("ville", data.city.trim());
      formData.append("date_debut_dispo", data.startAvailability);
      formData.append("date_fin_dispo", data.endAvailability);
      formData.append("password", data.password);
      formData.append("domaine_principal", data.domainePrincipal);
      formData.append("specialite", data.specialite.trim());
      formData.append("privacy_accepted", data.privacyAccepted.toString());
      
      // CV optionnel
      if (cvFile) {
        formData.append("cv", cvFile);
      }
      
      // Métadonnées
      formData.append("registration_timestamp", new Date().toISOString());
      formData.append("frontend_version", "2.0");
      
      // Token CSRF
      if (csrfToken) {
        formData.append("csrfmiddlewaretoken", csrfToken);
      }
      
      // Compétences
      if (data.competences && data.competences.trim()) {
        formData.append("competences", data.competences.trim());
      }

      console.log("Envoi des données d'inscription...");

      const response = await fetch(`${API_BASE_URL}/consultant/register/`, {
        method: "POST",
        body: formData,
        headers: {
          ...(csrfToken && { 'X-CSRFToken': csrfToken }),
          'X-Requested-With': 'XMLHttpRequest',
        },
        credentials: 'include',
      });
      
      const resData = await response.json();
      console.log("Réponse du serveur:", resData);

      if (!response.ok) {
        // Gestion d'erreurs spécifiques
        if (response.status === 400 && resData.error) {
          if (resData.error.includes('email')) {
            toast.error("Cette adresse email est déjà utilisée");
          } else if (resData.error.includes('telephone')) {
            toast.error("Ce numéro de téléphone est déjà utilisé");
          } else {
            toast.error(resData.error);
          }
        } else {
          toast.error(resData?.error || "Erreur lors de l'inscription");
        }
        return;
      }

      // Inscription réussie
      toast.success("Inscription réussie !", {
        duration: 7000,
        description: "Votre compte est en attente de validation par un administrateur."
      });
      
      setRegistrationComplete(true);
      
      // Redirection différée
      setTimeout(() => {
        navigate("/consultant/login", { 
          state: { 
            message: "Inscription terminée. Vous pouvez vous connecter dès que votre compte sera validé.",
            email: data.email 
          }
        });
      }, 5000);
      
    } catch (error) {
      console.error("Erreur lors de l'inscription:", error);
      toast.error("Erreur de connexion au serveur. Veuillez réessayer.", {
        duration: 5000
      });
    } finally {
      setIsLoading(false);
    }
  };

  // Si l'inscription est terminée, afficher un message de confirmation
  if (registrationComplete) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-100 p-4">
        <Card className="w-full max-w-lg shadow-lg">
          <CardHeader className="space-y-1 text-center">
            <div className="flex justify-center mb-4">
              <div className="relative">
                <CheckCircleIcon className="h-16 w-16 text-green-600" />
                <div className="absolute -top-1 -right-1 bg-blue-600 rounded-full p-1">
                  <Award className="h-6 w-6 text-white" />
                </div>
              </div>
            </div>
            <CardTitle className="text-2xl font-bold text-green-800">Inscription réussie !</CardTitle>
            <CardDescription className="text-gray-600">
              Votre profil consultant a été créé avec succès
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <Alert className="border-green-200 bg-green-50">
              <CheckCircleIcon className="h-4 w-4 text-green-600" />
              <AlertTitle className="text-green-800">Compte créé</AlertTitle>
              <AlertDescription className="text-green-700">
                Votre compte consultant a été créé avec succès. Vous recevrez un email de confirmation une fois votre compte validé par un administrateur.
              </AlertDescription>
            </Alert>

            <Alert>
              <Clock className="h-4 w-4" />
              <AlertTitle>Prochaines étapes</AlertTitle>
              <AlertDescription className="space-y-2">
                <div className="flex items-start gap-2">
                  <span className="bg-blue-100 text-blue-800 text-xs px-2 py-1 rounded-full mt-0.5">1</span>
                  <span>Validation de votre compte par un administrateur</span>
                </div>
                <div className="flex items-start gap-2">
                  <span className="bg-blue-100 text-blue-800 text-xs px-2 py-1 rounded-full mt-0.5">2</span>
                  <span>Réception d'un email de confirmation</span>
                </div>
                <div className="flex items-start gap-2">
                  <span className="bg-blue-100 text-blue-800 text-xs px-2 py-1 rounded-full mt-0.5">3</span>
                  <span>Accès à votre espace consultant</span>
                </div>
              </AlertDescription>
            </Alert>

            <div className="text-center">
              <p className="text-sm text-gray-600 mb-4">
                Redirection automatique vers la page de connexion...
              </p>
              <div className="flex gap-2 justify-center">
                <Button 
                  onClick={() => navigate("/consultant/login")} 
                  className="bg-blue-600 hover:bg-blue-500"
                >
                  Aller à la connexion
                </Button>
                <Button 
                  variant="outline"
                  onClick={() => navigate("/")}
                >
                  Retour à l'accueil
                </Button>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-100 p-4">
      <Card className="w-full max-w-4xl shadow-lg">
        <CardHeader className="space-y-1">
          <div className="flex justify-center mb-4">
            <img 
              src="/lovable-uploads/c66ee083-bf5b-456a-b3a6-368225f4b25e.png" 
              alt="Richat Logo" 
              className="h-16 w-auto"
            />
          </div>
          <CardTitle className="text-2xl font-bold text-center">Inscription Consultant</CardTitle>
          <CardDescription className="text-center">
            Créez votre compte consultant Richat Partners
          </CardDescription>
          
          {/* Indicateur de sécurité */}
          <div className="flex justify-center">
            <div className="flex items-center gap-2 text-xs bg-green-50 text-green-700 px-3 py-1 rounded-full border border-green-200">
              <Shield className="h-3 w-3" />
              <span>{csrfToken ? "Connexion sécurisée" : "Chargement sécurisé..."}</span>
            </div>
          </div>
        </CardHeader>
        
        <CardContent>
          <Form {...form}>
            <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
              
              {/* Informations personnelles */}
              <div className="space-y-4">
                <h3 className="text-lg font-medium text-gray-900 flex items-center gap-2">
                  <Users className="h-5 w-5" />
                  Informations personnelles
                </h3>
                
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <FormField control={form.control} name="firstName" render={({ field }) => (
                    <FormItem>
                      <FormLabel>Prénom *</FormLabel>
                      <FormControl>
                        <Input {...field} placeholder="Votre prénom" />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )} />
                  
                  <FormField control={form.control} name="lastName" render={({ field }) => (
                    <FormItem>
                      <FormLabel>Nom *</FormLabel>
                      <FormControl>
                        <Input {...field} placeholder="Votre nom" />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )} />
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <FormField control={form.control} name="email" render={({ field }) => (
                    <FormItem>
                      <FormLabel>Email *</FormLabel>
                      <FormControl>
                        <Input type="email" {...field} placeholder="votre.email@exemple.com" />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )} />
                  
                  <FormField control={form.control} name="phone" render={({ field }) => (
                    <FormItem>
                      <FormLabel>Téléphone *</FormLabel>
                      <FormControl>
                        <Input {...field} placeholder="Ex: 31 34 61 21" />
                      </FormControl>
                      <FormDescription className="text-xs">
                        Numéro mauritanien sans le préfixe +222
                      </FormDescription>
                      <FormMessage />
                    </FormItem>
                  )} />
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <FormField control={form.control} name="country" render={({ field }) => (
                    <FormItem>
                      <FormLabel>Pays *</FormLabel>
                      <FormControl>
                        <Input {...field} placeholder="Mauritanie" />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )} />
                  
                  <FormField control={form.control} name="city" render={({ field }) => (
                    <FormItem>
                      <FormLabel>Ville *</FormLabel>
                      <FormControl>
                        <Input {...field} placeholder="Nouakchott" />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )} />
                </div>
              </div>

              <Separator />

              {/* Disponibilité */}
              <div className="space-y-4">
                <h3 className="text-lg font-medium text-gray-900 flex items-center gap-2">
                  <Clock className="h-5 w-5" />
                  Disponibilité
                </h3>
                
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <FormField control={form.control} name="startAvailability" render={({ field }) => (
                    <FormItem>
                      <FormLabel>Disponible à partir de *</FormLabel>
                      <FormControl>
                        <Input type="date" {...field} min={new Date().toISOString().split('T')[0]} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )} />
                  
                  <FormField control={form.control} name="endAvailability" render={({ field }) => (
                    <FormItem>
                      <FormLabel>Disponible jusqu'à *</FormLabel>
                      <FormControl>
                        <Input type="date" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )} />
                </div>
              </div>

              <Separator />

              {/* Domaine de compétence */}
              <div className="space-y-4">
                <h3 className="text-lg font-medium text-gray-900 flex items-center gap-2">
                  <TrendingUp className="h-5 w-5" />
                  Domaine de compétence
                </h3>
                
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <FormField control={form.control} name="domainePrincipal" render={({ field }) => (
                    <FormItem>
                      <FormLabel>Domaine principal *</FormLabel>
                      <Select onValueChange={field.onChange} defaultValue={field.value}>
                        <FormControl>
                          <SelectTrigger>
                            <SelectValue placeholder="Sélectionnez un domaine" />
                          </SelectTrigger>
                        </FormControl>
                        <SelectContent>
                          <SelectItem value="DIGITAL">
                            <div className="flex items-center gap-2">
                              <Zap className="h-4 w-4" />
                              Digital et Télécoms
                            </div>
                          </SelectItem>
                          <SelectItem value="FINANCE">
                            <div className="flex items-center gap-2">
                              <TrendingUp className="h-4 w-4" />
                              Secteur bancaire et financier
                            </div>
                          </SelectItem>
                          <SelectItem value="ENERGIE">
                            <div className="flex items-center gap-2">
                              <Zap className="h-4 w-4" />
                              Transition énergétique
                            </div>
                          </SelectItem>
                          <SelectItem value="INDUSTRIE">
                            <div className="flex items-center gap-2">
                              <TrendingUp className="h-4 w-4" />
                              Industrie et Mines
                            </div>
                          </SelectItem>
                        </SelectContent>
                      </Select>
                      <FormMessage />
                    </FormItem>
                  )} />
                  
                  <FormField control={form.control} name="specialite" render={({ field }) => (
                    <FormItem>
                      <FormLabel>Sous-domaine de spécialisation *</FormLabel>
                      <FormControl>
                        <Input 
                          placeholder="Ex: Cybersécurité, Finance Islamique, IA..." 
                          {...field} 
                        />
                      </FormControl>
                      <FormDescription className="text-xs">
                        Votre domaine d'expertise spécifique
                      </FormDescription>
                      <FormMessage />
                    </FormItem>
                  )} />
                </div>
              </div>

              <Separator />

              {/* CV Upload optionnel */}
              <div className="space-y-4">
                <h3 className="text-lg font-medium text-gray-900 flex items-center gap-2">
                  <FileText className="h-5 w-5" />
                  CV (optionnel)
                </h3>
                
                <div className="space-y-2">
                  <Label htmlFor="cv-upload" className="text-sm font-medium">
                    Télécharger votre CV
                  </Label>
                  <div className="border-2 border-dashed border-gray-300 rounded-lg p-6 text-center hover:border-gray-400 transition-colors">
                    <input
                      id="cv-upload"
                      type="file"
                      accept=".pdf,.doc,.docx"
                      onChange={handleFileChange}
                      className="hidden"
                    />
                    <div className="space-y-2">
                      <Upload className="h-8 w-8 text-gray-400 mx-auto" />
                      <div>
                        <Button
                          type="button"
                          variant="outline"
                          onClick={() => document.getElementById('cv-upload')?.click()}
                          className="cursor-pointer"
                        >
                          <Upload className="h-4 w-4 mr-2" />
                          Choisir un fichier
                        </Button>
                      </div>
                      <p className="text-xs text-gray-500">
                        PDF, DOC ou DOCX - Maximum 25MB
                      </p>
                      {cvFile && (
                        <div className="flex items-center justify-center gap-2 text-green-600 bg-green-50 p-2 rounded border border-green-200">
                          <CheckCircleIcon className="h-4 w-4" />
                          <span className="text-sm">{cvFile.name}</span>
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              </div>

              <Separator />

              {/* Compétences */}
              <div className="space-y-4">
                <h3 className="text-lg font-medium text-gray-900 flex items-center gap-2">
                  <Star className="h-5 w-5" />
                  Compétences
                </h3>
                
                <FormField control={form.control} name="competences" render={({ field }) => (
                  <FormItem>
                    <FormLabel>Compétences techniques et professionnelles</FormLabel>
                    <FormControl>
                      <Input 
                        {...field} 
                        placeholder="Ex: Java, Gestion de projet, Analyse financière..." 
                      />
                    </FormControl>
                    <FormDescription>
                      Listez vos principales compétences, séparées par des virgules
                    </FormDescription>
                    <FormMessage />
                  </FormItem>
                )} />
              </div>

              <Separator />

              {/* Sécurité */}
              <div className="space-y-4">
                <h3 className="text-lg font-medium text-gray-900 flex items-center gap-2">
                  <Shield className="h-5 w-5" />
                  Sécurité
                </h3>
                
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <FormField control={form.control} name="password" render={({ field }) => (
                    <FormItem>
                      <FormLabel>Mot de passe *</FormLabel>
                      <FormControl>
                        <Input type="password" {...field} placeholder="Mot de passe sécurisé" />
                      </FormControl>
                      <FormDescription className="text-xs">
                        Minimum 8 caractères avec majuscule, minuscule et chiffre
                      </FormDescription>
                      <FormMessage />
                    </FormItem>
                  )} />
                  
                  <FormField control={form.control} name="confirmPassword" render={({ field }) => (
                    <FormItem>
                      <FormLabel>Confirmer le mot de passe *</FormLabel>
                      <FormControl>
                        <Input type="password" {...field} placeholder="Répétez le mot de passe" />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )} />
                </div>
              </div>

              <Separator />

              {/* Politique de confidentialité */}
              <div className="space-y-4 border-2 border-blue-200 p-6 rounded-lg bg-blue-50">
                <div className="space-y-4">
                  <h3 className="font-semibold text-lg text-blue-900 flex items-center gap-2">
                    <Shield className="h-5 w-5" />
                    Politique de confidentialité
                  </h3>
                  
                  <div className="text-sm text-blue-800 space-y-3">
                    <div className="bg-white p-4 rounded-lg border border-blue-200">
                      <h4 className="font-medium mb-2">Traitement de vos données</h4>
                      <p>En vous inscrivant, vous acceptez :</p>
                      <ul className="list-disc list-inside ml-4 mt-2 space-y-1 text-blue-700">
                        <li>Le traitement de vos données personnelles</li>
                        <li>La conservation de vos informations professionnelles</li>
                        <li>L'utilisation de vos données pour le recrutement</li>
                        <li>La mise en relation avec des opportunités</li>
                      </ul>
                    </div>
                    
                    <p className="text-center">
                      Consultez notre <PrivacyPolicyDialog /> pour plus de détails sur vos droits.
                    </p>
                  </div>
                  
                  <FormField control={form.control} name="privacyAccepted" render={({ field }) => (
                    <FormItem className="flex flex-row items-start space-x-3 space-y-0">
                      <FormControl>
                        <Checkbox
                          checked={field.value}
                          onCheckedChange={field.onChange}
                          className="mt-1"
                          required
                        />
                      </FormControl>
                      <div className="space-y-1 leading-none">
                        <FormLabel className="text-sm font-medium cursor-pointer">
                          J'accepte les conditions de traitement de mes données personnelles et la politique de confidentialité de Richat Partners. <span className="text-red-500">*</span>
                        </FormLabel>
                        <FormMessage />
                      </div>
                    </FormItem>
                  )} />
                </div>
              </div>

              {/* Informations importantes */}
              <Alert className="border-blue-200 bg-blue-50">
                <InfoIcon className="h-4 w-4 text-blue-600" />
                <AlertTitle className="text-blue-900">Processus d'inscription</AlertTitle>
                <AlertDescription className="text-blue-800">
                  <div className="space-y-2">
                    <p>Après votre inscription :</p>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-2 text-sm">
                      <div className="flex items-center gap-2">
                        <CheckCircleIcon className="h-3 w-3 text-green-600" />
                        <span>Création immédiate de votre compte</span>
                      </div>
                      <div className="flex items-center gap-2">
                        <Clock className="h-3 w-3 text-yellow-600" />
                        <span>Validation par un administrateur</span>
                      </div>
                      <div className="flex items-center gap-2">
                        <CheckCircleIcon className="h-3 w-3 text-green-600" />
                        <span>Email de confirmation</span>
                      </div>
                      <div className="flex items-center gap-2">
                        <Users className="h-3 w-3 text-blue-600" />
                        <span>Accès à votre espace consultant</span>
                      </div>
                    </div>
                    <p className="text-xs mt-3 text-blue-600">
                      Une fois validé, vous pourrez accéder aux offres de mission et gérer votre profil.
                    </p>
                  </div>
                </AlertDescription>
              </Alert>

              {/* Bouton de soumission */}
              <div className="space-y-4">
                <Button 
                  type="submit" 
                  className="w-full bg-blue-600 hover:bg-blue-500 text-white py-3 text-lg font-medium" 
                  disabled={isLoading || !csrfToken}
                  size="lg"
                >
                  {isLoading ? (
                    <div className="flex items-center gap-2">
                      <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white"></div>
                      Inscription en cours...
                    </div>
                  ) : !csrfToken ? (
                    <div className="flex items-center gap-2">
                      <Shield className="h-5 w-5" />
                      Chargement sécurisé...
                    </div>
                  ) : (
                    <div className="flex items-center gap-2">
                      <CheckCircleIcon className="h-5 w-5" />
                      Créer mon compte consultant
                    </div>
                  )}
                </Button>

                {/* Indicateurs d'état */}
                <div className="flex justify-center gap-4 text-sm">
                  <div className={`flex items-center gap-1 ${csrfToken ? 'text-green-600' : 'text-gray-400'}`}>
                    <Shield className="h-3 w-3" />
                    <span>Sécurisé</span>
                  </div>
                  
                  <div className="flex items-center gap-1 text-blue-600">
                    <Users className="h-3 w-3" />
                    <span>Simple</span>
                  </div>
                  
                  <div className="flex items-center gap-1 text-blue-600">
                    <Clock className="h-3 w-3" />
                    <span>Rapide</span>
                  </div>
                </div>

                {/* Message d'aide contextuel */}
                {!csrfToken && (
                  <Alert className="border-yellow-200 bg-yellow-50">
                    <InfoIcon className="h-4 w-4 text-yellow-600" />
                    <AlertDescription className="text-yellow-800">
                      Initialisation de la connexion sécurisée en cours...
                    </AlertDescription>
                  </Alert>
                )}
              </div>
            </form>
          </Form>
        </CardContent>
        
        <CardFooter className="flex flex-col space-y-4">
          <Separator />
          <div className="flex flex-col items-center space-y-2 text-center">
            <p className="text-sm text-gray-600">
              Déjà inscrit ? <a href="/consultant/login" className="text-blue-600 hover:underline font-medium">Se connecter</a>
            </p>
            <div className="flex items-center gap-4 text-xs text-gray-500">
              <span className="flex items-center gap-1">
                <Shield className="h-3 w-3" />
                Données sécurisées
              </span>
              <span className="flex items-center gap-1">
                <CheckCircleIcon className="h-3 w-3" />
                Conforme RGPD
              </span>
              <span className="flex items-center gap-1">
                <Award className="h-3 w-3" />
                Richat Partners
              </span>
            </div>
          </div>
        </CardFooter>
      </Card>
    </div>
  );
};

export default ConsultantRegister;