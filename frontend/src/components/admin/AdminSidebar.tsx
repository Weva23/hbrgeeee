import React, { useState, useEffect } from "react";
import { Link, useLocation } from "react-router-dom";
import {
  HomeIcon,
  UserIcon,
  BriefcaseIcon,
  SettingsIcon,
  MenuIcon,
  XIcon,
  LogOutIcon,
  CheckCircleIcon,
  FileIcon,
  AlertCircleIcon,
  ChevronRightIcon
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { Badge } from "@/components/ui/badge";
import axios from "axios";

const API_URL = "http://localhost:8000/api";

const AdminSidebar = () => {
  const [expanded, setExpanded] = useState(true);
  const [pendingCount, setPendingCount] = useState(0);
  const location = useLocation();

  useEffect(() => {
    // Charger le nombre de consultants en attente
    const fetchPendingCount = async () => {
      try {
        const response = await axios.get(`${API_URL}/admin/consultants/pending/`);
        if (Array.isArray(response.data)) {
          setPendingCount(response.data.length);
        } else if (response.data && response.data.data) {
          setPendingCount(response.data.data.length);
        }
      } catch (error) {
        console.error("Erreur lors du chargement des consultants en attente:", error);
      }
    };
    
    fetchPendingCount();
    
    // Mettre à jour toutes les 5 minutes
    const interval = setInterval(fetchPendingCount, 5 * 60 * 1000);
    
    return () => clearInterval(interval);
  }, []);

  const navigation = [
    {
      name: "Dashboard",
      href: "/admin/dashboard",
      icon: HomeIcon,
      description: "Vue d'ensemble"
    },
    {
      name: "Consultants",
      href: "/admin/consultants",
      icon: UserIcon,
      description: "Gestion des consultants"
    },
    {
      name: "Appels d'offres",
      href: "/admin/appels-offres",
      icon: BriefcaseIcon,
      description: "Projets et missions"
    },
    {
      name: "Matchings validés",
      href: "/admin/validated-matches",
      icon: CheckCircleIcon,
      description: "Correspondances confirmées"
    },
    {
      name: "GED",
      href: "/admin/ged",
      icon: FileIcon,
      description: "Gestion documentaire"
    },
    {
      name: "Paramètres",
      href: "/admin/settings",
      icon: SettingsIcon,
      description: "Configuration"
    },
  ];
  
  // Déterminer dans quelle section nous sommes
  const currentSection = location.pathname.split('/')[2] || '';

  const toggleSidebar = () => {
    setExpanded(!expanded);
  };

  const handleLogout = () => {
    localStorage.removeItem("userRole");
    window.location.href = "/login";
  };

  return (
    <div
      className={cn(
        "bg-gradient-to-b from-slate-50 to-white h-screen shadow-lg transition-all duration-300 flex flex-col border-r border-slate-200",
        expanded ? "w-64" : "w-20"
      )}
    >
      {/* En-tête */}
      <div className={cn(
        "flex items-center px-4 h-16 border-b border-slate-200",
        expanded ? "justify-between" : "justify-center"
      )}>
        {expanded ? (
          <Link to="/admin/dashboard" className="text-lg font-bold bg-clip-text text-transparent bg-gradient-to-r from-blue-600 to-indigo-700">
            Admin Portal
          </Link>
        ) : (
          <div className="w-8 h-8 bg-gradient-to-r from-blue-600 to-indigo-600 rounded-md flex items-center justify-center">
            <span className="text-white font-bold text-sm">AP</span>
          </div>
        )}
        <Button
          variant="ghost"
          size="icon"
          onClick={toggleSidebar}
          className="h-8 w-8 text-slate-500 hover:bg-slate-100 rounded-full"
        >
          {expanded ? <XIcon size={18} /> : <MenuIcon size={18} />}
        </Button>
      </div>

      {/* Navigation principale */}
      <div className="flex-1 overflow-y-auto py-4 px-3">
        <nav className="space-y-1">
          {navigation.map((item) => {
            const isActive = location.pathname.startsWith(item.href);
            return (
              <Link
                key={item.name}
                to={item.href}
                className={cn(
                  "flex items-center px-3 py-3 rounded-lg text-sm font-medium transition-all duration-200",
                  isActive
                    ? "bg-blue-50 text-blue-700"
                    : "text-slate-600 hover:bg-slate-100",
                  !expanded && "justify-center"
                )}
              >
                <div className={cn(
                  "flex items-center justify-center",
                  isActive ? "text-blue-600" : "text-slate-500",
                  !expanded ? "w-full" : ""
                )}>
                  <item.icon className={cn("h-5 w-5", !expanded ? "" : "mr-3")} />
                  {expanded && (
                    <div className="flex-1">
                      <div className="flex items-center justify-between">
                        <span>{item.name}</span>
                        {isActive && <ChevronRightIcon size={16} />}
                      </div>
                      {isActive && (
                        <span className="text-xs text-slate-500 mt-0.5">{item.description}</span>
                      )}
                    </div>
                  )}
                </div>
              </Link>
            );
          })}
          
          {/* Lien pour Consultants en attente avec badge */}
          <Link
            to="/admin/pending-consultants"
            className={cn(
              "flex items-center px-3 py-3 rounded-lg text-sm font-medium transition-all duration-200",
              location.pathname === "/admin/pending-consultants"
                ? "bg-orange-50 text-orange-700"
                : "text-orange-600 hover:bg-orange-50",
              !expanded && "justify-center"
            )}
          >
            <div className={cn(
              "flex items-center justify-center",
              !expanded ? "w-full" : ""
            )}>
              <AlertCircleIcon className={cn("h-5 w-5 text-orange-500", !expanded ? "" : "mr-3")} />
              {expanded && (
                <div className="flex-1">
                  <div className="flex items-center justify-between">
                    <span>Consultants en attente</span>
                    {pendingCount > 0 && (
                      <Badge className="bg-orange-100 text-orange-800 border-none">
                        {pendingCount}
                      </Badge>
                    )}
                  </div>
                  <span className="text-xs text-orange-500 mt-0.5">Validation requise</span>
                </div>
              )}
              {!expanded && pendingCount > 0 && (
                <Badge className="absolute -top-1 -right-1 bg-orange-500 text-white border-none h-5 w-5 flex items-center justify-center p-0 rounded-full">
                  {pendingCount}
                </Badge>
              )}
            </div>
          </Link>
        </nav>
      </div>

      {/* Pied de page avec déconnexion */}
      <div className="p-4 border-t border-slate-200">
        <Button
          variant="ghost"
          className={cn(
            "flex w-full py-2.5 rounded-lg transition-all duration-200",
            expanded ? "justify-start" : "justify-center",
            "text-slate-600 hover:bg-red-50 hover:text-red-600"
          )}
          onClick={handleLogout}
        >
          <LogOutIcon className={cn("h-5 w-5", !expanded ? "" : "mr-3")} />
          {expanded && <span>Déconnexion</span>}
        </Button>
      </div>
    </div>
  );
};

export default AdminSidebar;