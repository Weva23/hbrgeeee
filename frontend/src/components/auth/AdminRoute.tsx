import React, { ReactNode } from "react";
import { Navigate, useLocation } from "react-router-dom";

interface AdminRouteProps {
  children: ReactNode;
}

/**
 * Composant de protection des routes admin
 * Redirige vers la page de connexion si l'utilisateur n'est pas un admin
 */
const AdminRoute: React.FC<AdminRouteProps> = ({ children }) => {
  const userRole = localStorage.getItem("userRole");
  const adminId = localStorage.getItem("adminId");
  const location = useLocation();
  
  if (userRole !== "admin" || !adminId) {
    // Rediriger vers la page de connexion avec l'URL actuelle en state
    return <Navigate to="/login" state={{ from: location }} replace />;
  }
  
  return <>{children}</>;
};

export default AdminRoute;