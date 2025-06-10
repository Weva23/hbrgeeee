import React, { ReactNode } from "react";
import { Navigate, useLocation } from "react-router-dom";

interface ConsultantRouteProps {
  children: ReactNode;
}

/**
 * Composant de protection des routes consultant
 * Redirige vers la page de connexion si l'utilisateur n'est pas un consultant
 */
const ConsultantRoute: React.FC<ConsultantRouteProps> = ({ children }) => {
  const userRole = localStorage.getItem("userRole");
  const consultantId = localStorage.getItem("consultantId");
  const location = useLocation();
  
  if (userRole !== "consultant" || !consultantId) {
    // Rediriger vers la page de connexion avec l'URL actuelle en state
    return <Navigate to="/consultant/login" state={{ from: location }} replace />;
  }
  
  return <>{children}</>;
};

export default ConsultantRoute;