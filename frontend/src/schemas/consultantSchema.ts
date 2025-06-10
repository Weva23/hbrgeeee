
import * as z from "zod";

export const consultantFormSchema = z.object({
  firstName: z.string().min(2, "Le prénom doit contenir au moins 2 caractères"),
  lastName: z.string().min(2, "Le nom doit contenir au moins 2 caractères"),
  email: z.string().email("Email invalide"),
  phone: z.string().min(8, "Numéro de téléphone invalide"),
  country: z.string().min(2, "Pays requis"),
  city: z.string().min(2, "Ville requise"),
  startAvailability: z.string().min(1, "Date de début requise"),
  endAvailability: z.string().min(1, "Date de fin requise"),
  skills: z.string().optional(),
  expertise: z.string().default("Débutant")
});

export type ConsultantFormValues = z.infer<typeof consultantFormSchema>;
