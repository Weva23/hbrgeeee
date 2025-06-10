import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { Routes, Route } from "react-router-dom";
import Index from "./pages/Index";

import Login from "./pages/Login";
import ValidatedMatches from "./pages/admin/ValidatedMatches";
import ConsultantLogin from "./pages/ConsultantLogin";
import ConsultantRegister from "./pages/ConsultantRegister";
import ConsultantWelcome from "./pages/ConsultantWelcome";
import ForgotPassword from "./pages/ForgotPassword";
import ResetPassword from "./pages/ResetPassword";
import Dashboard from "./pages/admin/Dashboard";
import Consultants from "./pages/admin/Consultants";
import PendingConsultants from "./pages/admin/PendingConsultants";
import AppelsOffres from "./pages/admin/AppelsOffres";
import OffreMatching from "./pages/admin/OffreMatching";
import NotFound from "./pages/NotFound";
import AdminRoute from "./components/auth/AdminRoute";
import ConsultantRoute from "./components/auth/ConsultantRoute";

// Import du composant GED et GEDRoutes
import GED from "./pages/admin/ged/GED";
import GEDRoutes from "./pages/admin/ged/GEDRoutes";

const queryClient = new QueryClient();

const App = () => (
  <QueryClientProvider client={queryClient}>
    <TooltipProvider>
      <Toaster />
      <Sonner />
      <Routes>
        {/* Pages publiques */}
        <Route path="/" element={<Index />} />
        <Route path="/login" element={<Login />} />
        <Route path="/consultant/login" element={<ConsultantLogin />} />
        <Route path="/consultant/register" element={<ConsultantRegister />} />
        <Route path="/consultant/forgot-password" element={<ForgotPassword />} />
        <Route path="/reset-password/:uid/:token" element={<ResetPassword />} />
        
        {/* Routes protégées consultant */}
        <Route path="/consultant/welcome" element={
          <ConsultantRoute>
            <ConsultantWelcome />
          </ConsultantRoute>
        } />
        
        {/* Routes protégées admin */}
        <Route path="/admin/dashboard" element={
          <AdminRoute>
            <Dashboard />
          </AdminRoute>
        } />
        <Route path="/admin/consultants" element={
          <AdminRoute>
            <Consultants />
          </AdminRoute>
        } />
        <Route path="/admin/pending-consultants" element={
          <AdminRoute>
            <PendingConsultants />
          </AdminRoute>
        } />
        <Route path="/admin/appels-offres" element={
          <AdminRoute>
            <AppelsOffres />
          </AdminRoute>
        } />
        <Route path="/admin/settings" element={
          <AdminRoute>
            <Dashboard />
          </AdminRoute>
        } />
        <Route path="/admin/validated-matches" element={
          <AdminRoute>
            <ValidatedMatches />
          </AdminRoute>
        } />
        
        {/* Route pour la GED en utilisant GEDRoutes */}
        <Route path="/admin/ged/*" element={
          <AdminRoute>
            <GEDRoutes />
          </AdminRoute>
        } />
        
        {/* Route pour le matching d'offres */}
        <Route path="/matching/:offerId" element={
          <AdminRoute>
            <OffreMatching />
          </AdminRoute>
        } />
        
        {/* Page 404 */}
        <Route path="*" element={<NotFound />} />
      </Routes>
    </TooltipProvider>
  </QueryClientProvider>
);

export default App;