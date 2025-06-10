import React, { useState, useEffect } from "react";
import axios from "axios";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { useToast } from "@/components/ui/use-toast";
import { 
  FolderIcon, 
  PlusIcon, 
  TrashIcon, 
  EditIcon,
} from "lucide-react";

const GEDCategories = () => {
  const { toast } = useToast();
  
  // État pour les catégories
  const [categories, setCategories] = useState([]);
  
  // État pour l'ajout/modification de catégorie
  const [isAddCategoryOpen, setIsAddCategoryOpen] = useState(false);
  const [isEditCategoryOpen, setIsEditCategoryOpen] = useState(false);
  const [currentCategory, setCurrentCategory] = useState(null);
  const [categoryForm, setCategoryForm] = useState({
    name: '',
    description: '',
  });
  
  // Charger les catégories
  const loadCategories = async () => {
    try {
      const response = await axios.get("http://localhost:8000/api/document-categories/");
      setCategories(response.data);
    } catch (error) {
      console.error("Erreur lors du chargement des catégories:", error);
      toast({
        title: "Erreur",
        description: "Impossible de charger les catégories de documents.",
        variant: "destructive",
      });
    }
  };
  
  // Chargement initial
  useEffect(() => {
    loadCategories();
  }, []);
  
  // Ouvrir le formulaire d'ajout de catégorie
  const openAddCategoryForm = () => {
    setCategoryForm({
      name: '',
      description: '',
    });
    setIsAddCategoryOpen(true);
  };
  
  // Ouvrir le formulaire de modification de catégorie
  const openEditCategoryForm = (category) => {
    setCurrentCategory(category);
    setCategoryForm({
      name: category.name,
      description: category.description || '',
    });
    setIsEditCategoryOpen(true);
  };
  
  // Gérer le changement dans le formulaire
  const handleFormChange = (name, value) => {
    setCategoryForm({ ...categoryForm, [name]: value });
  };
  
  // Ajouter une nouvelle catégorie
  const addCategory = async () => {
    try {
      // Vérifier que les champs obligatoires sont remplis
      if (!categoryForm.name) {
        toast({
          title: "Erreur",
          description: "Le nom de la catégorie est obligatoire.",
          variant: "destructive",
        });
        return;
      }
      
      // Envoyer la requête au serveur
      await axios.post("http://localhost:8000/api/document-categories/", categoryForm);
      
      setIsAddCategoryOpen(false);
      loadCategories();
      
      toast({
        title: "Succès",
        description: "Catégorie ajoutée avec succès.",
      });
    } catch (error) {
      console.error("Erreur lors de l'ajout de la catégorie:", error);
      toast({
        title: "Erreur",
        description: "Impossible d'ajouter la catégorie.",
        variant: "destructive",
      });
    }
  };
  
  // Mettre à jour une catégorie existante
  const updateCategory = async () => {
    try {
      if (!currentCategory) return;
      
      // Vérifier que les champs obligatoires sont remplis
      if (!categoryForm.name) {
        toast({
          title: "Erreur",
          description: "Le nom de la catégorie est obligatoire.",
          variant: "destructive",
        });
        return;
      }
      
      // Envoyer la requête au serveur
      await axios.put(`http://localhost:8000/api/document-categories/${currentCategory.id}/`, categoryForm);
      
      setIsEditCategoryOpen(false);
      loadCategories();
      
      toast({
        title: "Succès",
        description: "Catégorie mise à jour avec succès.",
      });
    } catch (error) {
      console.error("Erreur lors de la mise à jour de la catégorie:", error);
      toast({
        title: "Erreur",
        description: "Impossible de mettre à jour la catégorie.",
        variant: "destructive",
      });
    }
  };
  
  // Supprimer une catégorie
  const deleteCategory = async (categoryId) => {
    if (!confirm("Êtes-vous sûr de vouloir supprimer cette catégorie ?")) {
      return;
    }
    
    try {
      await axios.delete(`http://localhost:8000/api/document-categories/${categoryId}/`);
      loadCategories();
      
      toast({
        title: "Succès",
        description: "Catégorie supprimée avec succès.",
      });
    } catch (error) {
      console.error("Erreur lors de la suppression de la catégorie:", error);
      toast({
        title: "Erreur",
        description: "Impossible de supprimer la catégorie.",
        variant: "destructive",
      });
    }
  };
  
  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h2 className="text-xl font-semibold">Catégories de documents</h2>
        <Button onClick={openAddCategoryForm} className="bg-blue-600">
          <PlusIcon className="h-4 w-4 mr-2" />
          Ajouter une catégorie
        </Button>
      </div>
      
      <Card>
        <CardHeader>
          <CardTitle>Liste des catégories</CardTitle>
          <CardDescription>
            Gérez les catégories utilisées pour classer les documents dans la GED
          </CardDescription>
        </CardHeader>
        
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Nom</TableHead>
                <TableHead>Description</TableHead>
                <TableHead>Documents</TableHead>
                <TableHead className="text-right">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {categories.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={4} className="text-center py-8 text-gray-500">
                    Aucune catégorie trouvée
                  </TableCell>
                </TableRow>
              ) : (
                categories.map((category) => (
                  <TableRow key={category.id}>
                    <TableCell className="font-medium">
                      <div className="flex items-center space-x-2">
                        <FolderIcon className="h-5 w-5 text-blue-500" />
                        <span>{category.name}</span>
                      </div>
                    </TableCell>
                    <TableCell>
                      {category.description || <span className="text-gray-400">-</span>}
                    </TableCell>
                    <TableCell>{category.document_count}</TableCell>
                    <TableCell className="text-right">
                      <div className="flex justify-end gap-2">
                        <Button
                          variant="ghost"
                          size="icon"
                          onClick={() => openEditCategoryForm(category)}
                          title="Modifier"
                        >
                          <EditIcon className="h-4 w-4" />
                        </Button>
                        <Button
                          variant="ghost"
                          size="icon"
                          onClick={() => deleteCategory(category.id)}
                          title="Supprimer"
                        >
                          <TrashIcon className="h-4 w-4" />
                        </Button>
                      </div>
                    </TableCell>
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>
        </CardContent>
      </Card>
      
      {/* Modal d'ajout de catégorie */}
      <Dialog open={isAddCategoryOpen} onOpenChange={setIsAddCategoryOpen}>
        <DialogContent className="sm:max-w-[500px]">
          <DialogHeader>
            <DialogTitle>Ajouter une nouvelle catégorie</DialogTitle>
            <DialogDescription>
              Créez une nouvelle catégorie pour organiser vos documents.
            </DialogDescription>
          </DialogHeader>
          
          <div className="grid gap-4 py-4">
            <div className="grid grid-cols-4 items-center gap-4">
              <Label htmlFor="name" className="text-right">
                Nom*
              </Label>
              <Input
                id="name"
                value={categoryForm.name}
                onChange={(e) => handleFormChange("name", e.target.value)}
                className="col-span-3"
              />
            </div>
            
            <div className="grid grid-cols-4 items-center gap-4">
              <Label htmlFor="description" className="text-right">
                Description
              </Label>
              <Textarea
                id="description"
                value={categoryForm.description}
                onChange={(e) => handleFormChange("description", e.target.value)}
                className="col-span-3"
              />
            </div>
          </div>
          
          <DialogFooter>
            <Button variant="outline" onClick={() => setIsAddCategoryOpen(false)}>
              Annuler
            </Button>
            <Button onClick={addCategory}>Ajouter</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
      
      {/* Modal de modification de catégorie */}
      <Dialog open={isEditCategoryOpen} onOpenChange={setIsEditCategoryOpen}>
        <DialogContent className="sm:max-w-[500px]">
          <DialogHeader>
            <DialogTitle>Modifier la catégorie</DialogTitle>
            <DialogDescription>
              Mettez à jour les informations de la catégorie.
            </DialogDescription>
          </DialogHeader>
          
          <div className="grid gap-4 py-4">
            <div className="grid grid-cols-4 items-center gap-4">
              <Label htmlFor="edit-name" className="text-right">
                Nom*
              </Label>
              <Input
                id="edit-name"
                value={categoryForm.name}
                onChange={(e) => handleFormChange("name", e.target.value)}
                className="col-span-3"
              />
            </div>
            
            <div className="grid grid-cols-4 items-center gap-4">
              <Label htmlFor="edit-description" className="text-right">
                Description
              </Label>
              <Textarea
                id="edit-description"
                value={categoryForm.description}
                onChange={(e) => handleFormChange("description", e.target.value)}
                className="col-span-3"
              />
            </div>
          </div>
          
          <DialogFooter>
            <Button variant="outline" onClick={() => setIsEditCategoryOpen(false)}>
              Annuler
            </Button>
            <Button onClick={updateCategory}>Mettre à jour</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default GEDCategories;