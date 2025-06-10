// src/components/ConsultantProfileEdit.tsx
import React, { useState, useEffect } from "react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
  DialogFooter,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { toast } from "sonner";
import { Edit, Save } from "lucide-react";

const ConsultantProfileEdit = ({ consultantData, onProfileUpdate }) => {
  const [isLoading, setIsLoading] = useState(false);
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [formData, setFormData] = useState({
    firstName: "",
    lastName: "",
    email: "",
    phone: "",
    country: "",
    city: "",
    startAvailability: "",
    endAvailability: "",
  });
  const [errors, setErrors] = useState({});

  // Mettre à jour les valeurs du formulaire lorsque consultantData change
  useEffect(() => {
    if (consultantData) {
      setFormData({
        firstName: consultantData.firstName || "",
        lastName: consultantData.lastName || "",
        email: consultantData.email || "",
        phone: consultantData.phone || "",
        country: consultantData.country || "",
        city: consultantData.city || "",
        startAvailability: consultantData.startAvailability ? new Date(consultantData.startAvailability).toISOString().split('T')[0] : "",
        endAvailability: consultantData.endAvailability ? new Date(consultantData.endAvailability).toISOString().split('T')[0] : "",
      });
    }
  }, [consultantData]);

  // Gérer les changements de champ
  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
    
    // Effacer l'erreur lorsque l'utilisateur corrige la valeur
    if (errors[name]) {
      setErrors(prev => ({ ...prev, [name]: null }));
    }
  };

  // Valider le formulaire
  const validateForm = () => {
    const newErrors = {};
    
    if (!formData.firstName || formData.firstName.length < 2) {
      newErrors.firstName = "Le prénom doit contenir au moins 2 caractères";
    }
    
    if (!formData.lastName || formData.lastName.length < 2) {
      newErrors.lastName = "Le nom doit contenir au moins 2 caractères";
    }
    
    if (!formData.email || !/^\S+@\S+\.\S+$/.test(formData.email)) {
      newErrors.email = "Email invalide";
    }
    
    if (!formData.phone || formData.phone.length < 8) {
      newErrors.phone = "Numéro de téléphone invalide";
    }
    
    if (!formData.country || formData.country.length < 2) {
      newErrors.country = "Pays requis";
    }
    
    if (!formData.city || formData.city.length < 2) {
      newErrors.city = "Ville requise";
    }
    
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async () => {
    if (!validateForm()) {
      toast.error("Veuillez corriger les erreurs du formulaire");
      return;
    }
    
    setIsLoading(true);
    try {
      const consultantId = localStorage.getItem("consultantId");
      if (!consultantId) {
        throw new Error("ID consultant non trouvé");
      }

      const response = await fetch(`http://localhost:8000/api/consultant/${consultantId}/update-profile/`, {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(formData),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || "Erreur lors de la mise à jour du profil");
      }

      const updatedData = await response.json();
      onProfileUpdate(updatedData);
      toast.success("Profil mis à jour avec succès!");
      setIsDialogOpen(false);
    } catch (error) {
      console.error("Erreur:", error);
      toast.error(error.message || "Erreur lors de la mise à jour du profil");
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
      <DialogTrigger asChild>
        <Button variant="outline" className="flex items-center gap-2">
          <Edit className="h-4 w-4" />
          Modifier le profil
        </Button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-md md:max-w-xl">
        <DialogHeader>
          <DialogTitle>Modifier mon profil</DialogTitle>
          <DialogDescription>
            Mettez à jour vos informations personnelles et votre disponibilité
          </DialogDescription>
        </DialogHeader>
        
        <div className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="firstName">Prénom</Label>
              <Input 
                id="firstName"
                name="firstName"
                placeholder="Prénom" 
                value={formData.firstName}
                onChange={handleChange}
              />
              {errors.firstName && <p className="text-sm text-red-500">{errors.firstName}</p>}
            </div>
            
            <div className="space-y-2">
              <Label htmlFor="lastName">Nom</Label>
              <Input 
                id="lastName"
                name="lastName"
                placeholder="Nom" 
                value={formData.lastName}
                onChange={handleChange}
              />
              {errors.lastName && <p className="text-sm text-red-500">{errors.lastName}</p>}
            </div>
            
            <div className="space-y-2">
              <Label htmlFor="email">Email</Label>
              <Input 
                id="email"
                name="email"
                type="email"
                placeholder="Email" 
                value={formData.email}
                onChange={handleChange}
              />
              {errors.email && <p className="text-sm text-red-500">{errors.email}</p>}
            </div>
            
            <div className="space-y-2">
              <Label htmlFor="phone">Téléphone</Label>
              <Input 
                id="phone"
                name="phone"
                placeholder="Téléphone" 
                value={formData.phone}
                onChange={handleChange}
              />
              {errors.phone && <p className="text-sm text-red-500">{errors.phone}</p>}
            </div>
            
            <div className="space-y-2">
              <Label htmlFor="country">Pays</Label>
              <Input 
                id="country"
                name="country"
                placeholder="Pays" 
                value={formData.country}
                onChange={handleChange}
              />
              {errors.country && <p className="text-sm text-red-500">{errors.country}</p>}
            </div>
            
            <div className="space-y-2">
              <Label htmlFor="city">Ville</Label>
              <Input 
                id="city"
                name="city"
                placeholder="Ville" 
                value={formData.city}
                onChange={handleChange}
              />
              {errors.city && <p className="text-sm text-red-500">{errors.city}</p>}
            </div>
            
            <div className="space-y-2">
              <Label htmlFor="startAvailability">Disponible à partir du</Label>
              <Input 
                id="startAvailability"
                name="startAvailability"
                type="date" 
                value={formData.startAvailability}
                onChange={handleChange}
              />
              {errors.startAvailability && <p className="text-sm text-red-500">{errors.startAvailability}</p>}
            </div>
            
            <div className="space-y-2">
              <Label htmlFor="endAvailability">Disponible jusqu'au</Label>
              <Input 
                id="endAvailability"
                name="endAvailability"
                type="date" 
                value={formData.endAvailability}
                onChange={handleChange}
              />
              {errors.endAvailability && <p className="text-sm text-red-500">{errors.endAvailability}</p>}
            </div>
          </div>
          
          <DialogFooter>
            <Button type="button" variant="outline" onClick={() => setIsDialogOpen(false)}>
              Annuler
            </Button>
            <Button onClick={handleSubmit} disabled={isLoading} className="flex items-center gap-2">
              {isLoading ? (
                <>
                  <div className="h-4 w-4 animate-spin rounded-full border-2 border-white border-t-transparent"></div>
                  Enregistrement...
                </>
              ) : (
                <>
                  <Save className="h-4 w-4" />
                  Enregistrer
                </>
              )}
            </Button>
          </DialogFooter>
        </div>
      </DialogContent>
    </Dialog>
  );
};

export default ConsultantProfileEdit;