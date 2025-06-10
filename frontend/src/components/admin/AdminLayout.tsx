import React, { useEffect, useState } from "react";
import { Link, useLocation, useNavigate } from "react-router-dom";
import AdminSidebar from "./AdminSidebar";
import { toast } from "sonner";
import { Badge } from "@/components/ui/badge";
import axios from "axios";

interface AdminLayoutProps {
  children: React.ReactNode;
}

const API_URL = "http://localhost:8000/api";

const AdminLayout: React.FC<AdminLayoutProps> = ({ children }) => {
  const navigate = useNavigate();
  const location = useLocation();
  const [loading, setLoading] = useState(true);
  const [pendingCount, setPendingCount] = useState(0);

  useEffect(() => {
    const userRole = localStorage.getItem("userRole");
    if (userRole !== "admin") {
      toast.error("Accès non autorisé. Veuillez vous connecter en tant qu'administrateur.");
      navigate("/login");
      return;
    }

    const timer = setTimeout(() => {
      setLoading(false);
    }, 300);

    // Charger le nombre de consultants en attente
    const fetchPendingCount = async () => {
      try {
        const response = await axios.get(`${API_URL}/admin/consultants/pending/`);
        
        // Vérifier le format de la réponse et extraire le compte correctement
        if (response.data.success && Array.isArray(response.data.data)) {
          setPendingCount(response.data.data.length);
        } else if (Array.isArray(response.data)) {
          setPendingCount(response.data.length);
        } else {
          console.error("Format de réponse inattendu:", response.data);
          setPendingCount(0);
        }
      } catch (error) {
        console.error("Erreur lors du chargement des consultants en attente:", error);
        setPendingCount(0);
      }
    };
    
    fetchPendingCount();
    
    // Mettre à jour toutes les 5 minutes
    const interval = setInterval(fetchPendingCount, 5 * 60 * 1000);
    
    return () => {
      clearTimeout(timer);
      clearInterval(interval);
    };
  }, [navigate]);

  if (loading) {
    return (
      <div className="flex h-screen items-center justify-center bg-admin-background">
        <div className="text-center">
          <div
            className="inline-block h-8 w-8 animate-spin rounded-full border-4 border-solid border-current border-r-transparent align-[-0.125em] motion-reduce:animate-[spin_1.5s_linear_infinite]"
            role="status"
          >
            <span className="sr-only">Chargement...</span>
          </div>
          <p className="mt-2 text-sm text-gray-600">
            Chargement du tableau de bord administrateur...
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="flex h-screen bg-admin-background">
      <AdminSidebar />
      <div className="flex-1 flex flex-col overflow-hidden">
        <main className="flex-1 overflow-y-auto p-4 md:p-6">
          {children}
        </main>
      </div>
    </div>
  );
};

export default AdminLayout;