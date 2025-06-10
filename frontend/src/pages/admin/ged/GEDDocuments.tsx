// GEDDocuments.tsx - Version complète corrigée
import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import axios from "axios";
import {
  Tabs,
  TabsContent,
  TabsList,
  TabsTrigger,
} from "@/components/ui/tabs";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
  CardFooter,
} from "@/components/ui/card";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
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
import { Checkbox } from "@/components/ui/checkbox";
import { useToast } from "@/components/ui/use-toast";
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from "@/components/ui/accordion";

import { 
  FileIcon, 
  FolderIcon, 
  SearchIcon, 
  PlusIcon, 
  DownloadIcon, 
  TrashIcon, 
  EditIcon, 
  XIcon, 
  FileTextIcon, 
  BarChart2Icon,
  FolderOpenIcon,
  ExternalLinkIcon,
} from "lucide-react";

const API_URL = "http://localhost:8000/api";

const GEDDocuments = () => {
  const { toast } = useToast();
  const navigate = useNavigate();
  
  // État pour les documents et catégories
  const [documents, setDocuments] = useState([]);
  const [categories, setCategories] = useState([]);
  const [appelsOffres, setAppelsOffres] = useState([]);
  const [consultants, setConsultants] = useState([]);
  
  // Types constants
  const documentTypes = [
    { value: 'APPEL_OFFRE', label: 'Document d\'appel d\'offre' },
    { value: 'ETUDE', label: 'Étude' },
    { value: 'RAPPORT', label: 'Rapport de mission' },
    { value: 'CV', label: 'CV consultant' },
    { value: 'METHODOLOGIE', label: 'Méthodologie' },
    { value: 'CONTRAT', label: 'Contrat' },
    { value: 'AUTRE', label: 'Autre' },
  ];
  
  const folderTypes = [
    { value: 'ADMIN', label: 'Dossier administratif' },
    { value: 'TECHNIQUE', label: 'Dossier technique' },
    { value: 'FINANCE', label: 'Dossier financier' },
    { value: 'CONTEXTE', label: 'Contexte' },
    { value: 'OUTREACH', label: 'Outreach' },
    { value: 'GENERAL', label: 'Général' },
  ];
  
  // État pour les filtres
  const [filters, setFilters] = useState({
    document_type: '',
    category_id: '',
    folder_type: '',
    appel_offre_id: '',
    search: '',
  });
  
  // État pour l'affichage par appel d'offre
  const [selectedAppelOffre, setSelectedAppelOffre] = useState(null);
  const [documentsByFolder, setDocumentsByFolder] = useState({});
  const [viewMode, setViewMode] = useState('list'); // 'list' or 'folder'
  
  // État pour l'ajout/modification de document
  const [isAddDocumentOpen, setIsAddDocumentOpen] = useState(false);
  const [isEditDocumentOpen, setIsEditDocumentOpen] = useState(false);
  const [currentDocument, setCurrentDocument] = useState(null);
  const [documentForm, setDocumentForm] = useState({
    title: '',
    description: '',
    file: null,
    document_type: 'AUTRE',
    folder_type: 'GENERAL',
    category: '',
    tags: '',
    is_public: false,
    consultant: '',
    appel_offre: '',
    mission: '',
    projet: '',
    use_kdrive: true,
  });
  
  // État pour les statistiques
  const [stats, setStats] = useState({
    total_documents: 0,
    documents_by_type: {},
    recent_documents: []
  });
  
  // État de chargement
  const [loading, setLoading] = useState(true);
  
  // Charger les documents (mode liste)
  const loadDocuments = async () => {
    try {
      setLoading(true);
      let url = `${API_URL}/documents/?`;
      
      // Ajouter les filtres
      if (filters.document_type && filters.document_type !== '') {
        url += `document_type=${filters.document_type}&`;
      }
      if (filters.category_id && filters.category_id !== '') {
        url += `category_id=${filters.category_id}&`;
      }
      if (filters.folder_type && filters.folder_type !== '') {
        url += `folder_type=${filters.folder_type}&`;
      }
      if (filters.appel_offre_id && filters.appel_offre_id !== '') {
        url += `appel_offre_id=${filters.appel_offre_id}&`;
      }
      if (filters.search) {
        url += `search=${filters.search}&`;
      }
      
      const response = await axios.get(url);
      setDocuments(response.data);
      setLoading(false);
    } catch (error) {
      console.error("Erreur lors du chargement des documents:", error);
      toast({
        title: "Erreur",
        description: "Impossible de charger les documents.",
        variant: "destructive",
      });
      setLoading(false);
    }
  };
  
  // Charger tous les documents organisés par dossier (sans filtrer par appel d'offre)
  const loadAllDocumentsByFolder = async () => {
    try {
      setLoading(true);
      
      // 1. Charger tous les documents
      const response = await axios.get(`${API_URL}/documents/`);
      const allDocuments = response.data;
      
      // 2. Organiser les documents par type de dossier
      const folderMap = {};
      
      // Initialiser tous les types de dossiers connus
      folderTypes.forEach(folder => {
        folderMap[folder.value] = {
          label: folder.label,
          documents: []
        };
      });
      
      // Classer les documents dans leurs dossiers respectifs
      allDocuments.forEach(doc => {
        const folderType = doc.folder_type || 'GENERAL';
        
        // S'assurer que le dossier existe
        if (!folderMap[folderType]) {
          folderMap[folderType] = {
            label: folderType,
            documents: []
          };
        }
        
        folderMap[folderType].documents.push(doc);
      });
      
      setDocumentsByFolder(folderMap);
      setSelectedAppelOffre(null);
      setLoading(false);
    } catch (error) {
      console.error("Erreur lors du chargement des documents par dossier:", error);
      toast({
        title: "Erreur",
        description: "Impossible de charger la structure de dossiers.",
        variant: "destructive",
      });
      setLoading(false);
    }
  };
  
  // Charger les documents par dossier (pour un appel d'offre spécifique)
  const loadDocumentsByFolder = async (appelOffreId) => {
    try {
      setLoading(true);
      
      if (!appelOffreId || appelOffreId === '') {
        // Si aucun appel d'offre n'est sélectionné, charger tous les documents par dossier
        return loadAllDocumentsByFolder();
      }
      
      const response = await axios.get(`${API_URL}/documents/appel-offre/${appelOffreId}/`);
      setSelectedAppelOffre(response.data.appel_offre);
      
      // Assurer que tous les types de dossiers sont représentés
      const enrichedFolders = { ...response.data.documents_by_folder } || {};
      
      folderTypes.forEach(folder => {
        if (!enrichedFolders[folder.value]) {
          enrichedFolders[folder.value] = {
            label: folder.label,
            documents: []
          };
        }
      });
      
      setDocumentsByFolder(enrichedFolders);
      setLoading(false);
    } catch (error) {
      console.error("Erreur lors du chargement des documents par dossier:", error);
      toast({
        title: "Erreur",
        description: "Impossible de charger la structure de dossiers.",
        variant: "destructive",
      });
      setLoading(false);
    }
  };
  
  // Charger les catégories
  const loadCategories = async () => {
    try {
      const response = await axios.get(`${API_URL}/document-categories/`);
      
      if (Array.isArray(response.data)) {
        setCategories(response.data);
      } else if (response.data && response.data.data) {
        setCategories(response.data.data);
      }
    } catch (error) {
      console.error("Erreur lors du chargement des catégories:", error);
    }
  };
  
  // Charger les appels d'offres
  const loadAppelsOffres = async () => {
    try {
      const response = await axios.get(`${API_URL}/appels/`);
      
      if (Array.isArray(response.data)) {
        setAppelsOffres(response.data);
      } else if (response.data && response.data.data) {
        setAppelsOffres(response.data.data);
      }
    } catch (error) {
      console.error("Erreur lors du chargement des appels d'offres:", error);
      try {
        const altResponse = await axios.get(`${API_URL}/admin/appels-offres/`);
        
        if (Array.isArray(altResponse.data)) {
          setAppelsOffres(altResponse.data);
        } else if (altResponse.data && altResponse.data.data) {
          setAppelsOffres(altResponse.data.data);
        }
      } catch (altError) {
        console.error("Erreur également avec l'endpoint alternatif:", altError);
      }
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
  
  // Charger les statistiques
  const loadStats = async () => {
    try {
      const response = await axios.get(`${API_URL}/document-stats/`);
      setStats(response.data);
    } catch (error) {
      console.error("Erreur lors du chargement des statistiques:", error);
    }
  };
  
  // Chargement initial
  useEffect(() => {
    loadDocuments();
    loadCategories();
    loadAppelsOffres();
    loadConsultants();
    loadStats();
  }, []);
  
  // Recharger les documents lorsque les filtres changent
  useEffect(() => {
    if (viewMode === 'list') {
      loadDocuments();
    }
  }, [filters, viewMode]);
  
  // Gestionnaire de changement de mode d'affichage
  const handleViewModeChange = (mode) => {
    setViewMode(mode);
    if (mode === 'folder') {
      if (filters.appel_offre_id && filters.appel_offre_id !== '') {
        loadDocumentsByFolder(filters.appel_offre_id);
      } else {
        // Si aucun appel d'offre n'est sélectionné, charger tous les documents par dossier
        loadAllDocumentsByFolder();
      }
    } else if (mode === 'list') {
      loadDocuments();
    }
  };
  
  // Gestionnaire de changement de filtres
  const handleFilterChange = (name, value) => {
    // S'assurer que la valeur n'est jamais 'null' ou 'undefined'
    const safeValue = value === null || value === undefined || value === 'null' || value === 'tous' ? '' : value;
    setFilters({ ...filters, [name]: safeValue });
    
    // Si on change l'appel d'offre et qu'on est en mode dossier, recharger immédiatement
    if (name === 'appel_offre_id' && viewMode === 'folder') {
      if (safeValue && safeValue !== '') {
        loadDocumentsByFolder(safeValue);
      } else {
        loadAllDocumentsByFolder();
      }
    }
  };
  
  // Réinitialiser les filtres
  const resetFilters = () => {
    setFilters({
      document_type: '',
      category_id: '',
      folder_type: '',
      appel_offre_id: '',
      search: '',
    });
  };
  
  // Navigation vers la vue détaillée de l'appel d'offre
  const navigateToAppelOffre = (appelOffreId) => {
    navigate(`/admin/ged/appel-offre/${appelOffreId}`);
  };
  
  // Ouvrir le formulaire d'ajout de document
  const openAddDocumentForm = (folderType = 'GENERAL', appelOffreId = null) => {
    setDocumentForm({
      title: '',
      description: '',
      file: null,
      document_type: 'AUTRE',
      folder_type: folderType || 'GENERAL',
      category: '',
      tags: '',
      is_public: false,
      consultant: '',
      appel_offre: appelOffreId || '',
      mission: '',
      projet: '',
      use_kdrive: true,
    });
    setIsAddDocumentOpen(true);
  };
  
  // Ouvrir le formulaire de modification de document
  const openEditDocumentForm = (document) => {
    setCurrentDocument(document);
    setDocumentForm({
      title: document.title,
      description: document.description || '',
      file: null,
      document_type: document.document_type,
      folder_type: document.folder_type || 'GENERAL',
      category: document.category || '',
      tags: document.tags || '',
      is_public: document.is_public,
      consultant: document.consultant || '',
      appel_offre: document.appel_offre || '',
      mission: document.mission || '',
      projet: document.projet || '',
      use_kdrive: document.kdrive_id ? true : false,
    });
    setIsEditDocumentOpen(true);
  };
  
  // Gérer le changement dans le formulaire
  const handleFormChange = (name, value) => {
    // S'assurer que la valeur n'est jamais null ou none pour les champs Select
    if ((name === 'appel_offre' || name === 'consultant' || name === 'category') && 
        (value === null || value === 'null' || value === 'none' || value === undefined)) {
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
      if (!documentForm.title || !documentForm.document_type || !documentForm.file) {
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
      
      // Vérifier et ajouter l'appel d'offre uniquement s'il est sélectionné
      if (documentForm.appel_offre && documentForm.appel_offre !== '' && documentForm.appel_offre !== 'none' && documentForm.appel_offre !== 'tous') {
        formData.append('appel_offre', documentForm.appel_offre);
      }
      
      const response = await axios.post(`${API_URL}/documents/`, formData, {
        headers: {
          'Content-Type': 'multipart/form-data',
        },
      });
      
      setIsAddDocumentOpen(false);
      
      // Recharger les données selon le mode d'affichage
      if (viewMode === 'list') {
        loadDocuments();
      } else if (viewMode === 'folder') {
        if (filters.appel_offre_id && filters.appel_offre_id !== '') {
          loadDocumentsByFolder(filters.appel_offre_id);
        } else {
          loadAllDocumentsByFolder();
        }
      }
      
      loadStats();
      
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
  
  // Modifier un document existant
  const updateDocument = async () => {
    try {
      if (!currentDocument) return;
      
      // Créer un objet FormData pour envoyer les données
      const formData = new FormData();
      formData.append('title', documentForm.title);
      formData.append('description', documentForm.description || '');
      formData.append('document_type', documentForm.document_type);
      formData.append('folder_type', documentForm.folder_type);
      formData.append('is_public', documentForm.is_public);
      formData.append('use_kdrive', documentForm.use_kdrive);
      
      // Ajouter explicitly created_by = null
      formData.append('created_by', '');
      
      if (documentForm.file) {
        formData.append('file', documentForm.file);
      }
      
      // Vérifier et ajouter les tags si présents
      if (documentForm.tags) {
        formData.append('tags', documentForm.tags);
      }
      
      // Vérifier et ajouter le consultant
      if (documentForm.consultant && documentForm.consultant !== '' && documentForm.consultant !== 'none') {
        formData.append('consultant', documentForm.consultant);
      }
      
      // Vérifier et ajouter l'appel d'offre
      if (documentForm.appel_offre && documentForm.appel_offre !== '' && documentForm.appel_offre !== 'none' && documentForm.appel_offre !== 'tous') {
        formData.append('appel_offre', documentForm.appel_offre);
      }
      
      const response = await axios.put(`${API_URL}/documents/${currentDocument.id}/`, formData, {
        headers: {
          'Content-Type': 'multipart/form-data',
        },
      });
      
      setIsEditDocumentOpen(false);
      
      // Recharger les données selon le mode d'affichage
      if (viewMode === 'list') {
        loadDocuments();
      } else if (viewMode === 'folder') {
        if (filters.appel_offre_id && filters.appel_offre_id !== '') {
          loadDocumentsByFolder(filters.appel_offre_id);
        } else {
          loadAllDocumentsByFolder();
        }
      }
      
      loadStats();
      
      toast({
        title: "Succès",
        description: "Document mis à jour avec succès.",
      });
    } catch (error) {
      console.error("Erreur lors de la mise à jour du document:", error);
      
      let errorMessage = "Impossible de mettre à jour le document.";
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
  
  // Supprimer un document
  const deleteDocument = async (documentId) => {
    if (!confirm("Êtes-vous sûr de vouloir supprimer ce document ?")) {
      return;
    }
    
    try {
      await axios.delete(`${API_URL}/documents/${documentId}/`);
      
      // Recharger les données selon le mode d'affichage
      if (viewMode === 'list') {
        loadDocuments();
      } else if (viewMode === 'folder') {
        if (filters.appel_offre_id && filters.appel_offre_id !== '') {
          loadDocumentsByFolder(filters.appel_offre_id);
        } else {
          loadAllDocumentsByFolder();
        }
      }
      
      loadStats();
      
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
  
  // Télécharger un document
  const downloadDocument = (documentId) => {
    window.open(`${API_URL}/documents/${documentId}/download/`, '_blank');
  };
  
 // Afficher les icônes de type de fichier
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

return (
  <div className="space-y-6">
    <div className="flex items-center justify-between">
      <h2 className="text-xl font-semibold">Documents</h2>
      <div className="flex space-x-2">
        <Button
          variant={viewMode === 'list' ? 'default' : 'outline'}
          onClick={() => handleViewModeChange('list')}
          className="flex items-center gap-2"
          style={{ background: viewMode === 'list' ? '#2563eb' : '' }}
        >
          <FileTextIcon className="h-4 w-4" />
          Vue liste
        </Button>
        <Button
          variant={viewMode === 'folder' ? 'default' : 'outline'}
          onClick={() => handleViewModeChange('folder')}
          className="flex items-center gap-2"
          style={{ background: viewMode === 'folder' ? '#2563eb' : '' }}
        >
          <FolderOpenIcon className="h-4 w-4" />
          Vue dossiers
        </Button>
        <Button onClick={() => openAddDocumentForm()} className="bg-blue-600">
          <PlusIcon className="h-4 w-4 mr-2" />
          Ajouter un document
        </Button>
      </div>
    </div>
    
    <Tabs defaultValue="documents">
      <TabsList className="mb-4">
        <TabsTrigger value="documents">Documents</TabsTrigger>
        <TabsTrigger value="stats">Statistiques</TabsTrigger>
      </TabsList>
      
      <TabsContent value="documents">
        <Card>
          <CardHeader>
            <CardTitle>
              {viewMode === 'list' 
                ? 'Bibliothèque de documents'
                : selectedAppelOffre 
                  ? `Documents pour l'appel d'offre: ${selectedAppelOffre.nom}`
                  : 'Documents par dossier'
              }
            </CardTitle>
            <CardDescription>
              {viewMode === 'list'
                ? 'Accédez à tous les documents centralisés dans la GED'
                : selectedAppelOffre
                  ? `Client: ${selectedAppelOffre.client}`
                  : 'Visualisez les documents organisés par type de dossier'
              }
            </CardDescription>
            
            {/* Filtres */}
            <div className="flex flex-wrap gap-4 mt-4">
              <div className="flex items-center space-x-2">
                <Select
                  value={filters.document_type}
                  onValueChange={(value) => handleFilterChange('document_type', value)}
                >
                  <SelectTrigger className="w-[180px]">
                    <SelectValue placeholder="Type de document" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="tous">Tous les types</SelectItem>
                    {documentTypes.map((type) => (
                      <SelectItem key={type.value} value={type.value}>
                        {type.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              
              {viewMode === 'list' && (
                <div className="flex items-center space-x-2">
                  <Select
                    value={filters.folder_type}
                    onValueChange={(value) => handleFilterChange('folder_type', value)}
                  >
                    <SelectTrigger className="w-[180px]">
                      <SelectValue placeholder="Type de dossier" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="tous">Tous les dossiers</SelectItem>
                      {folderTypes.map((type) => (
                        <SelectItem key={type.value} value={type.value}>
                          {type.label}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              )}
              
              <div className="flex items-center space-x-2">
                <Select
                  value={filters.appel_offre_id}
                  onValueChange={(value) => handleFilterChange('appel_offre_id', value)}
                >
                  <SelectTrigger className="w-[250px]">
                    <SelectValue placeholder="Appel d'offre" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="tous">Tous les appels d'offre</SelectItem>
                    {appelsOffres.map((appel) => (
                      <SelectItem key={appel.id} value={appel.id.toString()}>
                        {appel.nom_projet}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              
              <div className="flex-1 flex items-center space-x-2">
                <div className="relative flex-1">
                  <Input
                    value={filters.search}
                    onChange={(e) => handleFilterChange('search', e.target.value)}
                    placeholder="Rechercher un document..."
                    className="pr-10"
                  />
                  <SearchIcon className="h-4 w-4 absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400" />
                </div>
                <Button variant="outline" onClick={resetFilters}>
                  <XIcon className="h-4 w-4" />
                </Button>
              </div>
            </div>
          </CardHeader>
          
          <CardContent>
            {loading ? (
              <div className="flex justify-center items-center py-10">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-gray-900"></div>
              </div>
            ) : viewMode === 'list' ? (
              // Vue liste standard
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead className="w-[50px]">Type</TableHead>
                    <TableHead>Titre</TableHead>
                    <TableHead>Dossier</TableHead>
                    <TableHead>Appel d'offre</TableHead>
                    <TableHead>Date d'ajout</TableHead>
                    <TableHead>Taille</TableHead>
                    <TableHead className="text-right">Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {documents.length === 0 ? (
                    <TableRow>
                      <TableCell colSpan={7} className="text-center py-8 text-gray-500">
                        Aucun document trouvé
                      </TableCell>
                    </TableRow>
                  ) : (
                    documents.map((document) => (
                      <TableRow key={document.id}>
                        <TableCell>{getFileIcon(document.file_type)}</TableCell>
                        <TableCell>
                          <div className="font-medium">{document.title}</div>
                          <div className="text-xs text-gray-500 mt-1">
                            {document.description ? (
                              <>
                                {document.description.length > 50
                                  ? `${document.description.substring(0, 50)}...`
                                  : document.description}
                              </>
                            ) : null}
                          </div>
                          {document.tags && (
                            <div className="flex gap-1 mt-1 flex-wrap">
                              {document.tags.split(',').map((tag, index) => (
                                <Badge key={index} variant="outline" className="text-xs">
                                  {tag.trim()}
                                </Badge>
                              ))}
                            </div>
                          )}
                        </TableCell>
                        <TableCell>
                          {document.folder_type_label || <span className="text-gray-400">Général</span>}
                        </TableCell>
                        <TableCell>
                          {document.appel_offre_id ? (
                            <div className="flex items-center gap-1">
                              <span>{document.appel_offre_nom || "Appel d'offre"}</span>
                              <Button
                                variant="ghost"
                                size="icon"
                                className="h-5 w-5"
                                onClick={() => navigateToAppelOffre(document.appel_offre_id)}
                                title="Voir les détails"
                              >
                                <ExternalLinkIcon className="h-3 w-3" />
                              </Button>
                            </div>
                          ) : (
                            <span className="text-gray-400">-</span>
                          )}
                        </TableCell>
                        <TableCell>
                          {new Date(document.upload_date).toLocaleDateString()}
                        </TableCell>
                        <TableCell>{document.file_size_display}</TableCell>
                        <TableCell className="text-right">
                          <div className="flex justify-end gap-2">
                            <Button
                              variant="ghost"
                              size="icon"
                              onClick={() => downloadDocument(document.id)}
                              title="Télécharger"
                            >
                              <DownloadIcon className="h-4 w-4" />
                            </Button>
                            <Button
                              variant="ghost"
                              size="icon"
                              onClick={() => openEditDocumentForm(document)}
                              title="Modifier"
                            >
                              <EditIcon className="h-4 w-4" />
                            </Button>
                            <Button
                              variant="ghost"
                              size="icon"
                              onClick={() => deleteDocument(document.id)}
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
            ) : (
              // Vue par dossiers pour appel d'offre spécifique ou tous les documents
              <div>
                <div className="mb-4 flex justify-between items-center">
                  {selectedAppelOffre && (
                    <Button 
                      onClick={() => navigateToAppelOffre(selectedAppelOffre.id)}
                      variant="outline"
                      className="flex items-center gap-2"
                    >
                      <ExternalLinkIcon className="h-4 w-4" />
                      Voir la page détaillée de l'appel d'offre
                    </Button>
                  )}
                  <Button 
                    onClick={() => openAddDocumentForm('GENERAL', selectedAppelOffre?.id || '')}
                    variant="default"
                    className="flex items-center gap-2 bg-blue-600 ml-auto"
                  >
                    <PlusIcon className="h-4 w-4" />
                    Ajouter un document
                  </Button>
                </div>
                
                {/* Dossiers principaux mis en évidence */}
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
                  {['ADMIN', 'TECHNIQUE', 'FINANCE'].map((folderType) => {
                    const folderData = documentsByFolder[folderType] || { documents: [] };
                    const hasDocuments = folderData.documents && folderData.documents.length > 0;
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
                                onClick={() => openAddDocumentForm(folderType, selectedAppelOffre?.id || '')}
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
                                  onClick={() => openAddDocumentForm(folderType, selectedAppelOffre?.id || '')}
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
                <h4 className="text-md font-medium mb-3">Liste complète des documents par dossier</h4>
                <Accordion type="multiple" defaultValue={Object.keys(documentsByFolder)}>
                  {Object.keys(documentsByFolder).map((folderType) => {
                    // Ne pas répéter les dossiers principaux déjà affichés
                    if(['ADMIN', 'TECHNIQUE', 'FINANCE'].includes(folderType) && 
                       ['ADMIN', 'TECHNIQUE', 'FINANCE'].indexOf(folderType) < 3) {
                      return null;
                    }
                    
                    const folderData = documentsByFolder[folderType] || { documents: [] };
                    const hasDocuments = folderData.documents && folderData.documents.length > 0;
                    
                    return (
                      <AccordionItem key={folderType} value={folderType}>
                        <AccordionTrigger className="hover:bg-gray-50 px-4">
                          <div className="flex items-center gap-2">
                            {getFolderIcon(folderType)}
                            <span>{folderData.label}</span>
                            <Badge variant="outline" className="ml-2">
                              {folderData.documents ? folderData.documents.length : 0}
                            </Badge>
                          </div>
                        </AccordionTrigger>
                        <AccordionContent className="px-4">
                          <div className="mb-2 flex justify-end">
                            <Button
                              variant="outline"
                              size="sm"
                              onClick={() => openAddDocumentForm(folderType, selectedAppelOffre?.id || '')}
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
                                      onClick={() => openEditDocumentForm(doc)}
                                      title="Modifier"
                                    >
                                      <EditIcon className="h-4 w-4" />
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
              </div>
            )}
          </CardContent>
        </Card>
      </TabsContent>
      
      <TabsContent value="stats">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-lg">Total documents</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-3xl font-bold">{stats.total_documents}</div>
            </CardContent>
          </Card>
          
          {documentTypes.map((type) => {
            const typeStats = stats.documents_by_type[type.value] || { count: 0 };
            return (
              <Card key={type.value}>
                <CardHeader className="pb-2">
                  <CardTitle className="text-lg">{type.label}</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="text-3xl font-bold">{typeStats.count}</div>
                </CardContent>
              </Card>
            );
          })}
        </div>
        
        <Card className="mt-6">
          <CardHeader>
            <CardTitle>Documents récents</CardTitle>
          </CardHeader>
          <CardContent>
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Titre</TableHead>
                  <TableHead>Type</TableHead>
                  <TableHead>Dossier</TableHead>
                  <TableHead>Ajouté par</TableHead>
                  <TableHead>Date</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {stats.recent_documents.map((doc) => (
                  <TableRow key={doc.id}>
                    <TableCell className="font-medium">{doc.title}</TableCell>
                    <TableCell>
                      {documentTypes.find((t) => t.value === doc.document_type)?.label || doc.document_type}
                    </TableCell>
                    <TableCell>
                      {folderTypes.find((t) => t.value === doc.folder_type)?.label || "Général"}
                    </TableCell>
                    <TableCell>{doc.created_by_name}</TableCell>
                    <TableCell>{new Date(doc.upload_date).toLocaleDateString()}</TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </CardContent>
        </Card>
      </TabsContent>
    </Tabs>
    {/* Modal d'ajout de document */}
    <Dialog open={isAddDocumentOpen} onOpenChange={setIsAddDocumentOpen}>
      <DialogContent className="sm:max-w-[600px]">
        <DialogHeader>
          <DialogTitle>Ajouter un nouveau document</DialogTitle>
          <DialogDescription>
            Remplissez les informations ci-dessous pour ajouter un document à la GED.
          </DialogDescription>
        </DialogHeader>
        
        <div className="grid gap-4 py-4">
          <div className="grid grid-cols-4 items-center gap-4">
            <Label htmlFor="title" className="text-right">
              Titre*
            </Label>
            <Input
              id="title"
              value={documentForm.title}
              onChange={(e) => handleFormChange("title", e.target.value)}
              className="col-span-3"
            />
          </div>
          
          <div className="grid grid-cols-4 items-center gap-4">
            <Label htmlFor="description" className="text-right">
              Description
            </Label>
            <Textarea
              id="description"
              value={documentForm.description}
              onChange={(e) => handleFormChange("description", e.target.value)}
              className="col-span-3"
            />
          </div>
          
          <div className="grid grid-cols-4 items-center gap-4">
            <Label htmlFor="document_type" className="text-right">
              Type*
            </Label>
            <Select
              value={documentForm.document_type}
              onValueChange={(value) => handleFormChange("document_type", value)}
            >
              <SelectTrigger className="col-span-3">
                <SelectValue placeholder="Sélectionner un type" />
              </SelectTrigger>
              <SelectContent>
                {documentTypes.map((type) => (
                  <SelectItem key={type.value} value={type.value}>
                    {type.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          
          <div className="grid grid-cols-4 items-center gap-4">
            <Label htmlFor="folder_type" className="text-right">
              Dossier*
            </Label>
            <Select
              value={documentForm.folder_type}
              onValueChange={(value) => handleFormChange("folder_type", value)}
            >
              <SelectTrigger className="col-span-3">
                <SelectValue placeholder="Sélectionner un dossier" />
              </SelectTrigger>
              <SelectContent>
                {folderTypes.map((type) => (
                  <SelectItem key={type.value} value={type.value}>
                    {type.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          
          <div className="grid grid-cols-4 items-center gap-4">
            <Label htmlFor="appel_offre" className="text-right">
              Appel d'offre
            </Label>
            <Select
              value={documentForm.appel_offre}
              onValueChange={(value) => handleFormChange("appel_offre", value)}
            >
              <SelectTrigger className="col-span-3">
                <SelectValue placeholder="Sélectionner un appel d'offre" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="none">Aucun appel d'offre</SelectItem>
                {appelsOffres.map((appel) => (
                  <SelectItem key={appel.id} value={appel.id.toString()}>
                    {appel.nom_projet}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          
          <div className="grid grid-cols-4 items-center gap-4">
            <Label htmlFor="tags" className="text-right">
              Tags
            </Label>
            <Input
              id="tags"
              value={documentForm.tags}
              onChange={(e) => handleFormChange("tags", e.target.value)}
              placeholder="Séparez les tags par des virgules"
              className="col-span-3"
            />
          </div>
          
          <div className="grid grid-cols-4 items-center gap-4">
            <Label htmlFor="file" className="text-right">
              Fichier*
            </Label>
            <Input
              id="file"
              type="file"
              onChange={handleFileChange}
              className="col-span-3"
            />
          </div>
          
          <div className="grid grid-cols-4 items-center gap-4">
            <Label htmlFor="consultant" className="text-right">
              Consultant lié
            </Label>
            <Select
              value={documentForm.consultant}
              onValueChange={(value) => handleFormChange("consultant", value)}
            >
              <SelectTrigger className="col-span-3">
                <SelectValue placeholder="Sélectionner un consultant" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="none">Aucun consultant</SelectItem>
                {consultants.map((consultant) => (
                  <SelectItem key={consultant.id} value={consultant.id.toString()}>
                    {consultant.nom} {consultant.prenom}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          
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
    
    {/* Modal de modification de document */}
    <Dialog open={isEditDocumentOpen} onOpenChange={setIsEditDocumentOpen}>
      <DialogContent className="sm:max-w-[600px]">
        <DialogHeader>
          <DialogTitle>Modifier le document</DialogTitle>
          <DialogDescription>
            Modifiez les informations du document.
          </DialogDescription>
        </DialogHeader>
        
        <div className="grid gap-4 py-4">
          <div className="grid grid-cols-4 items-center gap-4">
            <Label htmlFor="edit-title" className="text-right">
              Titre*
            </Label>
            <Input
              id="edit-title"
              value={documentForm.title}
              onChange={(e) => handleFormChange("title", e.target.value)}
              className="col-span-3"
            />
          </div>
          
          <div className="grid grid-cols-4 items-center gap-4">
            <Label htmlFor="edit-description" className="text-right">
              Description
            </Label>
            <Textarea
              id="edit-description"
              value={documentForm.description}
              onChange={(e) => handleFormChange("description", e.target.value)}
              className="col-span-3"
            />
          </div>
          
          <div className="grid grid-cols-4 items-center gap-4">
            <Label htmlFor="edit-document_type" className="text-right">
              Type*
            </Label>
            <Select
              value={documentForm.document_type}
              onValueChange={(value) => handleFormChange("document_type", value)}
            >
              <SelectTrigger className="col-span-3">
                <SelectValue placeholder="Sélectionner un type" />
              </SelectTrigger>
              <SelectContent>
                {documentTypes.map((type) => (
                  <SelectItem key={type.value} value={type.value}>
                    {type.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          
          <div className="grid grid-cols-4 items-center gap-4">
            <Label htmlFor="edit-folder_type" className="text-right">
              Dossier*
            </Label>
            <Select
              value={documentForm.folder_type}
              onValueChange={(value) => handleFormChange("folder_type", value)}
            >
              <SelectTrigger className="col-span-3">
                <SelectValue placeholder="Sélectionner un dossier" />
              </SelectTrigger>
              <SelectContent>
                {folderTypes.map((type) => (
                  <SelectItem key={type.value} value={type.value}>
                    {type.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          
          <div className="grid grid-cols-4 items-center gap-4">
            <Label htmlFor="edit-appel_offre" className="text-right">
              Appel d'offre
            </Label>
            <Select
              value={documentForm.appel_offre}
              onValueChange={(value) => handleFormChange("appel_offre", value)}
            >
              <SelectTrigger className="col-span-3">
                <SelectValue placeholder="Sélectionner un appel d'offre" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="none">Aucun appel d'offre</SelectItem>
                {appelsOffres.map((appel) => (
                  <SelectItem key={appel.id} value={appel.id.toString()}>
                    {appel.nom_projet}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          
          <div className="grid grid-cols-4 items-center gap-4">
            <Label htmlFor="edit-tags" className="text-right">
              Tags
            </Label>
            <Input
              id="edit-tags"
              value={documentForm.tags}
              onChange={(e) => handleFormChange("tags", e.target.value)}
              placeholder="Séparez les tags par des virgules"
              className="col-span-3"
            />
          </div>
          
          <div className="grid grid-cols-4 items-center gap-4">
            <Label htmlFor="edit-file" className="text-right">
              Nouveau fichier
            </Label>
            <Input
              id="edit-file"
              type="file"
              onChange={handleFileChange}
              className="col-span-3"
            />
            <div></div>
            <div className="col-span-3 text-xs text-gray-500">
              Laissez vide pour conserver le fichier actuel. Un changement de fichier créera une nouvelle version.
            </div>
          </div>
          
          <div className="grid grid-cols-4 items-center gap-4">
            <Label htmlFor="edit-consultant" className="text-right">
              Consultant lié
            </Label>
            <Select
              value={documentForm.consultant}
              onValueChange={(value) => handleFormChange("consultant", value)}
            >
              <SelectTrigger className="col-span-3">
                <SelectValue placeholder="Sélectionner un consultant" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="none">Aucun consultant</SelectItem>
                {consultants.map((consultant) => (
                  <SelectItem key={consultant.id} value={consultant.id.toString()}>
                    {consultant.nom} {consultant.prenom}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          
          <div className="grid grid-cols-4 items-center gap-4">
            <div></div>
            <div className="flex items-center space-x-2 col-span-3">
              <Checkbox
                id="edit-is_public"
                checked={documentForm.is_public}
                onCheckedChange={(checked) => handleFormChange("is_public", checked)}
              />
              <Label htmlFor="edit-is_public">Document public</Label>
            </div>
          </div>
          
          <div className="grid grid-cols-4 items-center gap-4">
            <div></div>
            <div className="flex items-center space-x-2 col-span-3">
              <Checkbox
                id="edit-use_kdrive"
                checked={documentForm.use_kdrive}
                onCheckedChange={(checked) => handleFormChange("use_kdrive", checked)}
              />
              <Label htmlFor="edit-use_kdrive">Stocker sur Infomaniak kDrive</Label>
            </div>
          </div>
        </div>
        
        <DialogFooter>
          <Button variant="outline" onClick={() => setIsEditDocumentOpen(false)}>
            Annuler
          </Button>
          <Button onClick={updateDocument} className="bg-blue-600">Mettre à jour</Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  </div>
);
};

export default GEDDocuments;