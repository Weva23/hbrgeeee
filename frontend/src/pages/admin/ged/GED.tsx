import React, { useEffect, useState } from "react";
import { Outlet } from "react-router-dom";
import AdminLayout from "@/components/admin/AdminLayout";

const GED = () => {
  const [hasError, setHasError] = useState(false);
  const [errorMessage, setErrorMessage] = useState("");

  useEffect(() => {
    const handleError = (error: ErrorEvent) => {
      console.error("Erreur capturée :", error);
      setHasError(true);
      setErrorMessage(error.message);
    };

    window.addEventListener('error', handleError);
    
    return () => {
      window.removeEventListener('error', handleError);
    };
  }, []);

  if (hasError) {
    return (
      <AdminLayout>
        <div className="p-6 bg-red-100 text-red-800 rounded-lg">
          <h2 className="text-xl font-bold mb-4">Une erreur s'est produite</h2>
          <p>{errorMessage}</p>
        </div>
      </AdminLayout>
    );
  }

  try {
    return (
      <AdminLayout>
        <div className="space-y-6">
          <div className="flex items-center justify-between">
            <h1 className="text-2xl font-bold">Gestion Électronique des Documents (GED)</h1>
          </div>
          
          {/* Utiliser Outlet au lieu de Routes */}
          <Outlet />
        </div>
      </AdminLayout>
    );
  } catch (error) {
    console.error("Erreur lors du rendu:", error);
    return (
      <AdminLayout>
        <div className="p-6 bg-red-100 text-red-800 rounded-lg">
          <h2 className="text-xl font-bold mb-4">Une erreur s'est produite lors du rendu</h2>
          <p>{error instanceof Error ? error.message : String(error)}</p>
        </div>
      </AdminLayout>
    );
  }
};

export default GED;