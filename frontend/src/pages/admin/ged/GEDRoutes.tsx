// GEDRoutes.tsx
import React from "react";
import { Routes, Route, Navigate } from "react-router-dom";
import GED from "./GED";
import GEDDocuments from "./GEDDocuments";
import GEDCategories from "./GEDCategories";
import GEDAppelOffreDetail from "./GEDAppelOffreDetail";

const GEDRoutes = () => {
  return (
    <Routes>
      <Route path="/" element={<GED />}>
        <Route index element={<GEDDocuments />} />
        <Route path="documents" element={<GEDDocuments />} />
        <Route path="categories" element={<GEDCategories />} />
        <Route path="appel-offre/:id" element={<GEDAppelOffreDetail />} />
        <Route path="search" element={<div>Recherche Avancée (À implémenter)</div>} />
        <Route path="import" element={<div>Import de Documents (À implémenter)</div>} />
        <Route path="stats" element={<div>Statistiques (À implémenter)</div>} />
        <Route path="settings" element={<div>Paramètres (À implémenter)</div>} />
        <Route path="*" element={<Navigate to="/admin/ged" replace />} />
      </Route>
    </Routes>
  );
};

export default GEDRoutes;