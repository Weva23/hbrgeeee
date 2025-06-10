// GEDAppelOffreDetail.tsx - Version améliorée
import React, { useState, useEffect } from "react";
import { useParams, useNavigate } from "react-router-dom";
import axios from "axios";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
  CardFooter,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { useToast } from "@/components/ui/use-toast";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from "@/components/ui/accordion";
import { Badge } from "@/components/ui/badge";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Checkbox } from "@/components/ui/checkbox";
import { Alert, AlertDescription } from "@/components/ui/alert";

import {
  FileIcon,
  FolderIcon,
  FileTextIcon,
  DownloadIcon,
  TrashIcon,
  EditIcon,
  PlusIcon,
  ArrowLeftIcon,
  CheckCircleIcon,
  XCircleIcon,
  ClockIcon,
  ExternalLinkIcon,
} from "lucide-react";

const API_URL = "http://localhost:8000/api";

const GEDAppelOffreDetail = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const { toast } = useToast();
  
  // États pour les données
  const [appelOffre, setAppelOffre] = useState(null);
  const [documentsByFolder, setDocumentsByFolder] = useState({});
  const [loading, setLoading] = useState(true);
  const [consultants, setConsultants] = useState([]);
  
  // État pour le formulaire d'ajout de document
  const [isAddDocumentOpen, setIsAddDocumentOpen] = useState(false);
  const [selectedFolder, setSelectedFolder] = useState(null);
  const [documentForm, setDocumentForm] = useState({
    title: '',
    description: '',
    file: null,
    document_type: 'APPEL_OFFRE',
    folder_type: 'GENERAL',
    tags: '',
    is_public: false,
    consultant: '',
    appel_offre: id,
    use_kdrive: true,
  });
  
  // Types de dossiers principaux pour les appels d'offres
  const folderTypes = [
    { value: 'ADMIN', label: 'Dossier administratif' },
    { value: 'TECHNIQUE', label: 'Dossier technique' },
    { value: 'FINANCE', label: 'Dossier financier' },
    { value: 'CONTEXTE', label: 'Contexte' },
    { value: 'OUTREACH', label: 'Outreach' },
    { value: 'GENERAL', label: 'Général' },
  ];
  
  // Charger les données de l'appel d'offre et ses documents
  const loadAppelOffreData = async () => {
    try {
      setLoading(true);
      
      // Charger les détails de l'appel d'offre
      const appelResponse = await axios.get(`${API_URL}/appels/${id}/`);
      setAppelOffre(appelResponse.data);
      
      // Charger les documents organisés par dossier
      const docsResponse = await axios.get(`${API_URL}/documents/appel-offre/${id}/`);
      
      // S'assurer que documentsByFolder contient au minimum les trois dossiers principaux
      const folders = docsResponse.data.documents_by_folder || {};
      
      // Créer une version enrichie de documents_by_folder avec les trois dossiers principaux garantis
      const enrichedFolders = { ...folders };
      
      // S'assurer que les trois dossiers principaux existent
      ['ADMIN', 'TECHNIQUE', 'FINANCE', 'CONTEXTE', 'OUTREACH', 'GENERAL'].forEach(folderType => {
        if (!enrichedFolders[folderType]) {
          enrichedFolders[folderType] = {
            label: folderTypes.find(f => f.value === folderType)?.label || folderType,
            documents: []
          };
        }
      });
      
      setDocumentsByFolder(enrichedFolders);
      setLoading(false);
    } catch (error) {
      console.error("Erreur lors du chargement des données:", error);
      toast({
        title: "Erreur",
        description: "Impossible de charger les données de l'appel d'offre.",
        variant: "destructive",
      });
      setLoading(false);
    }
  };
  
  // Charger les consultants
  const loadConsultants = async () => {
    try {
      const response = await axios.get(`${API_URL}/api_public_consultants/`);
      
      if (Array.isArray(response.data)) {
        setConsultants(response.data);
      } else if (response.data && response.data.data) {
        setConsultants(response.data.data);
      }
    } catch (error) {
      console.error("Erreur lors du chargement des consultants:", error);
      try {
        const altResponse = await axios.get(`${API_URL}/admin/consultants/`);
        
        if (Array.isArray(altResponse.data)) {
          setConsultants(altResponse.data);
        } else if (altResponse.data && altResponse.data.data) {
          setConsultants(altResponse.data.data);
        }
      } catch (altError) {
        console.error("Erreur avec l'endpoint alternatif:", altError);
      }
    }
  };
  
  // Chargement initial
  useEffect(() => {
    loadAppelOffreData();
    loadConsultants();
  }, [id]);
  
  // Ouvrir le formulaire d'ajout de document
  const openAddDocumentForm = (folderType = 'GENERAL') => {
    setSelectedFolder(folderType);
    setDocumentForm({
      ...documentForm,
      folder_type: folderType,
    });
    setIsAddDocumentOpen(true);
  };
  
  // Gérer le changement dans le formulaire
  const handleFormChange = (name, value) => {
    // Traiter les valeurs null, none ou undefined pour les champs Select
    if ((name === 'consultant') && (value === null || value === 'null' || value === 'none' || value === undefined)) {
      value = '';
    }
    
    setDocumentForm({ ...documentForm, [name]: value });
  };
  
  // Gérer le changement de fichier
  const handleFileChange = (event) => {
    setDocumentForm({ ...documentForm, file: event.target.files[0] });
  };
  
  // Ajouter un nouveau document
  const addDocument = async () => {
    try {
      // Vérifier que les champs obligatoires sont remplis
      if (!documentForm.title || !documentForm.file) {
        toast({
          title: "Erreur",
          description: "Veuillez remplir tous les champs obligatoires.",
          variant: "destructive",
        });
        return;
      }
      
      // Créer un objet FormData pour envoyer le fichier
      const formData = new FormData();
      formData.append('title', documentForm.title);
      formData.append('description', documentForm.description || '');
      formData.append('file', documentForm.file);
      formData.append('document_type', documentForm.document_type);
      formData.append('folder_type', documentForm.folder_type);
      formData.append('is_public', documentForm.is_public);
      formData.append('use_kdrive', documentForm.use_kdrive);
      formData.append('appel_offre', id);
      
      // Ajouter explicitement created_by = null pour que le backend utilise l'utilisateur par défaut
      formData.append('created_by', '');
      
      // Ajouter les tags si présents
      if (documentForm.tags) {
        formData.append('tags', documentForm.tags);
      }
      
      // Vérifier et ajouter le consultant uniquement s'il est sélectionné
      if (documentForm.consultant && documentForm.consultant !== '' && documentForm.consultant !== 'none') {
        formData.append('consultant', documentForm.consultant);
      }
      
      const response = await axios.post(`${API_URL}/documents/`, formData, {
        headers: {
          'Content-Type': 'multipart/form-data',
        },
      });
      
      setIsAddDocumentOpen(false);
      loadAppelOffreData();
      
      toast({
        title: "Succès",
        description: "Document ajouté avec succès.",
      });
    } catch (error) {
      console.error("Erreur lors de l'ajout du document:", error);
      
      let errorMessage = "Impossible d'ajouter le document.";
      if (error.response?.data?.detail) {
        errorMessage = error.response.data.detail;
      }
      
      toast({
        title: "Erreur",
        description: errorMessage,
        variant: "destructive",
      });
    }
  };
  
  // Télécharger un document
  const downloadDocument = (documentId) => {
    window.open(`${API_URL}/documents/${documentId}/download/`, '_blank');
  };
  
  // Supprimer un document
  const deleteDocument = async (documentId) => {
    if (!confirm("Êtes-vous sûr de vouloir supprimer ce document ?")) {
      return;
    }
    
    try {
      await axios.delete(`${API_URL}/documents/${documentId}/`);
      loadAppelOffreData();
      
      toast({
        title: "Succès",
        description: "Document supprimé avec succès.",
      });
    } catch (error) {
      console.error("Erreur lors de la suppression du document:", error);
      toast({
        title: "Erreur",
        description: "Impossible de supprimer le document.",
        variant: "destructive",
      });
    }
  };
  
  // Obtenir l'icône pour le type de fichier
  const getFileIcon = (fileType) => {
    switch (fileType?.toLowerCase()) {
      case 'pdf':
        return <FileIcon className="h-5 w-5 text-red-500" />;
      case 'doc':
      case 'docx':
        return <FileIcon className="h-5 w-5 text-blue-500" />;
      case 'xls':
      case 'xlsx':
        return <FileIcon className="h-5 w-5 text-green-500" />;
      case 'ppt':
      case 'pptx':
        return <FileIcon className="h-5 w-5 text-orange-500" />;
      case 'jpg':
      case 'jpeg':
      case 'png':
        return <FileIcon className="h-5 w-5 text-purple-500" />;
      default:
        return <FileTextIcon className="h-5 w-5 text-gray-500" />;
    }
  };
  
  // Obtenir l'icône pour le type de dossier
  const getFolderIcon = (folderType) => {
    switch (folderType) {
      case 'ADMIN':
        return <FolderIcon className="h-5 w-5 text-blue-500" />;
      case 'TECHNIQUE':
        return <FolderIcon className="h-5 w-5 text-green-500" />;
      case 'FINANCE':
        return <FolderIcon className="h-5 w-5 text-amber-500" />;
      case 'CONTEXTE':
        return <FolderIcon className="h-5 w-5 text-indigo-500" />;
      case 'OUTREACH':
        return <FolderIcon className="h-5 w-5 text-purple-500" />;
      default:
        return <FolderIcon className="h-5 w-5 text-gray-500" />;
    }
  };
  
  // Obtenir l'icône pour le statut de l'appel d'offre
  const getStatusIcon = (status) => {
    switch (status) {
      case 'A_venir':
        return <ClockIcon className="h-5 w-5 text-blue-500" />;
      case 'En_cours':
        return <CheckCircleIcon className="h-5 w-5 text-green-500" />;
      case 'Termine':
        return <XCircleIcon className="h-5 w-5 text-gray-500" />;
      default:
        return <ClockIcon className="h-5 w-5 text-gray-500" />;
    }
  };
  
  // Vérifier si un dossier contient des documents
  const hasFolderDocuments = (folderType) => {
    return documentsByFolder[folderType] && 
           documentsByFolder[folderType].documents && 
           documentsByFolder[folderType].documents.length > 0;
  };

  if (loading) {
    return (
      <div className="flex justify-center items-center py-10">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-gray-900"></div>
      </div>
    );
  }
  
  if (!appelOffre) {
    return (
      <div className="text-center py-8">
        <h2 className="text-xl font-bold mb-2">Appel d'offre introuvable</h2>
        <p className="text-gray-500 mb-4">L'appel d'offre demandé n'existe pas ou a été supprimé.</p>
        <Button onClick={() => navigate('/admin/ged/documents')} className="bg-blue-600">
          Retour à la liste des documents
        </Button>
      </div>
    );
  }
  
  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <Button
          variant="outline"
          size="sm"
          onClick={() => navigate('/admin/ged/documents')}
          className="flex items-center gap-1"
        >
          <ArrowLeftIcon className="h-4 w-4" />
          Retour
        </Button>
      </div>
      
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle>{appelOffre.nom_projet}</CardTitle>
              <CardDescription className="mt-1">
                Client: {appelOffre.client}
              </CardDescription>
            </div>
            <Badge className="flex items-center gap-1">
              {getStatusIcon(appelOffre.statut)}
              {appelOffre.statut === 'A_venir' ? 'À venir' : 
               appelOffre.statut === 'En_cours' ? 'En cours' : 'Terminé'}
            </Badge>
          </div>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-2 gap-4 mb-4">
            <div>
              <h3 className="text-sm font-medium text-gray-500">Budget</h3>
              <p>{new Intl.NumberFormat('fr-FR', { style: 'currency', currency: 'MRU' }).format(appelOffre.budget)}</p>
            </div>
            <div>
              <h3 className="text-sm font-medium text-gray-500">Période</h3>
              <p>{new Date(appelOffre.date_debut).toLocaleDateString()} - {new Date(appelOffre.date_fin).toLocaleDateString()}</p>
            </div>
          </div>
          
          <div className="mb-4">
            <h3 className="text-sm font-medium text-gray-500 mb-1">Description</h3>
            <p className="text-sm whitespace-pre-line">{appelOffre.description}</p>
          </div>
          
          <div className="mt-6">
            <h3 className="text-lg font-medium mb-4">Documents par dossier</h3>
            
            <Tabs defaultValue="documents">
              <TabsList>
                <TabsTrigger value="documents">Documents</TabsTrigger>
                <TabsTrigger value="matching">Consultants matchés</TabsTrigger>
              </TabsList>
              
              <TabsContent value="documents" className="mt-4">
                {/* Message explicatif des types de dossiers */}
                <Alert className="mb-4">
                  <AlertDescription>
                    Les documents de cet appel d'offre sont organisés dans trois dossiers principaux : 
                    administratif, technique et financier. Vous pouvez également utiliser d'autres types 
                    de dossiers pour une organisation plus spécifique.
                  </AlertDescription>
                </Alert>
                
                {/* Dossiers principaux mis en évidence */}
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
                  {['ADMIN', 'TECHNIQUE', 'FINANCE'].map((folderType) => {
                    const folderData = documentsByFolder[folderType];
                    const hasDocuments = hasFolderDocuments(folderType);
                    const folderLabel = folderTypes.find(f => f.value === folderType)?.label || "Dossier";
                    
                    return (
                      <Card key={folderType} className={`overflow-hidden ${hasDocuments ? 'border-blue-200' : 'border-dashed'}`}>
                        <CardHeader className="py-3 px-4 bg-gray-50 border-b">
                          <div className="flex items-center justify-between">
                            <div className="flex items-center gap-2">
                              {getFolderIcon(folderType)}
                              <h3 className="text-sm font-medium">{folderLabel}</h3>
                            </div>
                            {hasDocuments && (
                              <Badge variant="outline">
                                {folderData.documents.length}
                              </Badge>
                            )}
                          </div>
                        </CardHeader>
                        <CardContent className="p-4">
                          {!hasDocuments ? (
                            <div className="text-center py-4">
                              <p className="text-sm text-gray-500 mb-3">Aucun document</p>
                              <Button 
                                variant="outline" 
                                size="sm"
                                onClick={() => openAddDocumentForm(folderType)}
                                className="w-full"
                              >
                                <PlusIcon className="h-4 w-4 mr-2" />
                                Ajouter
                              </Button>
                            </div>
                          ) : (
                            <div>
                              <div className="divide-y divide-gray-100 max-h-40 overflow-y-auto mb-3">
                                {folderData.documents.slice(0, 3).map((doc) => (
                                  <div key={doc.id} className="py-2 flex items-center justify-between">
                                    <div className="flex items-center gap-2 truncate">
                                      {getFileIcon(doc.file_type)}
                                      <span className="text-sm truncate">{doc.title}</span>
                                    </div>
                                    <Button
                                      variant="ghost"
                                      size="icon"
                                      className="h-7 w-7"
                                      onClick={() => downloadDocument(doc.id)}
                                    >
                                      <DownloadIcon className="h-3 w-3" />
                                    </Button>
                                  </div>
                                ))}
                              </div>
                              <div className="flex justify-between">
                                {folderData.documents.length > 3 && (
                                  <span className="text-xs text-gray-500">
                                    +{folderData.documents.length - 3} documents
                                  </span>
                                )}
                                <Button 
                                  variant="ghost" 
                                  size="sm"
                                  onClick={() => openAddDocumentForm(folderType)}
                                  className="ml-auto"
                                >
                                  <PlusIcon className="h-3 w-3 mr-1" />
                                  Ajouter
                                </Button>
                              </div>
                            </div>
                          )}
                        </CardContent>
                      </Card>
                    );
                  })}
                </div>
                
                {/* Tous les dossiers dans un accordéon */}
                <h4 className="text-md font-medium mb-3">Liste complète des documents</h4>
                <Accordion type="multiple" defaultValue={Object.keys(documentsByFolder)}>
                  {Object.keys(documentsByFolder).map((folderType) => {
                    const folderData = documentsByFolder[folderType];
                    const hasDocuments = hasFolderDocuments(folderType);
                    
                    return (
                      <AccordionItem key={folderType} value={folderType}>
                        <AccordionTrigger className="hover:bg-gray-50 px-4">
                          <div className="flex items-center gap-2">
                            {getFolderIcon(folderType)}
                            <span>{folderData.label}</span>
                            {hasDocuments && (
                              <Badge variant="outline" className="ml-2">
                                {folderData.documents.length}
                              </Badge>
                            )}
                          </div>
                        </AccordionTrigger>
                        <AccordionContent className="px-4">
                          <div className="mb-2 flex justify-end">
                            <Button
                              variant="outline"
                              size="sm"
                              onClick={() => openAddDocumentForm(folderType)}
                              className="flex items-center gap-1"
                            >
                              <PlusIcon className="h-4 w-4" />
                              Ajouter un document
                            </Button>
                          </div>
                          
                          {!hasDocuments ? (
                            <div className="text-center py-4 text-gray-500">
                              Aucun document dans ce dossier
                            </div>
                          ) : (
                            <div className="divide-y divide-gray-100">
                              {folderData.documents.map((doc) => (
                                <div key={doc.id} className="py-3 flex items-start justify-between">
                                  <div className="flex items-start gap-3">
                                    {getFileIcon(doc.file_type)}
                                    <div>
                                      <div className="font-medium">{doc.title}</div>
                                      {doc.description && (
                                        <div className="text-sm text-gray-500 mt-1">
                                          {doc.description.length > 100
                                            ? `${doc.description.substring(0, 100)}...`
                                            : doc.description}
                                        </div>
                                      )}
                                      <div className="flex items-center gap-2 mt-1">
                                        <span className="text-xs text-gray-500">
                                          {new Date(doc.upload_date).toLocaleDateString()}
                                        </span>
                                        <span className="text-xs text-gray-500">
                                          {doc.file_size_display}
                                        </span>
                                      </div>
                                    </div>
                                  </div>
                                  <div className="flex items-center gap-1">
                                    <Button
                                      variant="ghost"
                                      size="icon"
                                      onClick={() => downloadDocument(doc.id)}
                                      title="Télécharger"
                                    >
                                      <DownloadIcon className="h-4 w-4" />
                                    </Button>
                                    <Button
                                      variant="ghost"
                                      size="icon"
                                      onClick={() => deleteDocument(doc.id)}
                                      title="Supprimer"
                                    >
                                      <TrashIcon className="h-4 w-4" />
                                    </Button>
                                  </div>
                                </div>
                              ))}
                            </div>
                          )}
                        </AccordionContent>
                      </AccordionItem>
                    );
                  })}
                </Accordion>
              </TabsContent>
              
              <TabsContent value="matching" className="mt-4">
                <div className="text-center py-8 bg-gray-50 rounded-lg">
                  <p className="text-gray-500">Fonctionnalité de matching à implémenter</p>
                  <Button
                    variant="outline"
                    onClick={() => navigate(`/admin/matching/offer/${id}`)}
                    className="mt-4"
                  >
                    Voir les consultants matchés
                  </Button>
                </div>
              </TabsContent>
            </Tabs>
          </div>
        </CardContent>
      </Card>
      
      {/* Modal d'ajout de document */}
      <Dialog open={isAddDocumentOpen} onOpenChange={setIsAddDocumentOpen}>
        <DialogContent className="sm:max-w-[600px]">
          <DialogHeader>
            <DialogTitle>
              Ajouter un document au dossier {folderTypes.find(f => f.value === selectedFolder)?.label || 'Général'}
            </DialogTitle>
          </DialogHeader>
          
          <div className="grid gap-4 py-4">
            <div className="grid grid-cols-4 items-center gap-4">
              <div></div>
              <div className="flex items-center space-x-2 col-span-3">
                <Checkbox
                  id="is_public"
                  checked={documentForm.is_public}
                  onCheckedChange={(checked) => handleFormChange("is_public", checked)}
                />
                <Label htmlFor="is_public">Document public</Label>
              </div>
            </div>
            
            <div className="grid grid-cols-4 items-center gap-4">
              <div></div>
              <div className="flex items-center space-x-2 col-span-3">
                <Checkbox
                  id="use_kdrive"
                  checked={documentForm.use_kdrive}
                  onCheckedChange={(checked) => handleFormChange("use_kdrive", checked)}
                />
                <Label htmlFor="use_kdrive">Stocker sur Infomaniak kDrive</Label>
              </div>
            </div>
          </div>
          
          <DialogFooter>
            <Button variant="outline" onClick={() => setIsAddDocumentOpen(false)}>
              Annuler
            </Button>
            <Button onClick={addDocument} className="bg-blue-600">Ajouter</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default GEDAppelOffreDetail;