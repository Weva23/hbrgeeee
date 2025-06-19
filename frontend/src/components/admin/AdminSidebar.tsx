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
  ChevronRightIcon,
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
    localStorage.removeItem("adminId");
    localStorage.removeItem("adminUsername");
    localStorage.removeItem("adminAuthToken");
    window.location.href = "/login";
  };

  return (
    <div
      className={cn(
        "bg-gradient-to-b from-slate-50 to-white h-screen shadow-lg transition-all duration-300 flex flex-col border-r border-slate-200",
        expanded ? "w-72" : "w-20"
      )}
    >
      {/* En-tête avec Logo Richat */}
      <div className={cn(
        "flex items-center px-4 h-16 border-b border-slate-200",
        expanded ? "justify-between" : "justify-center"
      )}>
        {expanded ? (
          <Link to="/admin/dashboard" className="flex items-center space-x-3">
            {/* Logo Richat */}
            <div className="w-10 h-10 rounded-lg overflow-hidden shadow-md">
              <img 
                src="/lovable-uploads/c66ee083-bf5b-456a-b3a6-368225f4b25e.png" 
                alt="Richat Logo" 
                className="w-full h-full object-contain bg-white"
                onError={(e) => {
                  // Fallback en cas d'erreur de chargement
                  (e.target as HTMLImageElement).style.display = 'none';
                  (e.target as HTMLImageElement).nextElementSibling!.classList.remove('hidden');
                }}
              />
              {/* Fallback logo */}
              <div className="hidden w-full h-full bg-gradient-to-br from-blue-600 to-indigo-600 flex items-center justify-center">
                <span className="text-white font-bold text-lg">R</span>
              </div>
            </div>
            <div>
              <div className="text-lg font-bold bg-clip-text text-transparent bg-gradient-to-r from-blue-600 to-indigo-700">
                Admin Portal
              </div>
              <div className="text-xs text-slate-500">Richat Platform</div>
            </div>
          </Link>
        ) : (
          <Link to="/admin/dashboard" className="block">
            <div className="w-10 h-10 rounded-lg overflow-hidden shadow-md">
              <img 
                src="/lovable-uploads/c66ee083-bf5b-456a-b3a6-368225f4b25e.png" 
                alt="Richat Logo" 
                className="w-full h-full object-contain bg-white"
                onError={(e) => {
                  (e.target as HTMLImageElement).style.display = 'none';
                  (e.target as HTMLImageElement).nextElementSibling!.classList.remove('hidden');
                }}
              />
              {/* Fallback logo */}
              <div className="hidden w-full h-full bg-gradient-to-br from-blue-600 to-indigo-600 flex items-center justify-center">
                <span className="text-white font-bold text-lg">R</span>
              </div>
            </div>
          </Link>
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
                    ? "bg-blue-50 text-blue-700 shadow-sm border border-blue-100"
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
        </nav>

        {/* Section Consultants en attente - Après les paramètres */}
        <div className="mt-6 pt-4 border-t border-slate-200">
          {expanded && (
            <div className="px-3 mb-3">
              <h3 className="text-xs font-semibold text-slate-400 uppercase tracking-wider">
                Actions Requises
              </h3>
            </div>
          )}
          
          <Link
            to="/admin/pending-consultants"
            className={cn(
              "relative flex items-center px-3 py-3 rounded-lg text-sm font-medium transition-all duration-200",
              location.pathname === "/admin/pending-consultants"
                ? "bg-orange-50 text-orange-700 shadow-sm border border-orange-100"
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
                      <Badge className="bg-orange-100 text-orange-800 border-orange-200 text-xs px-2 py-0.5">
                        {pendingCount}
                      </Badge>
                    )}
                  </div>
                  <span className="text-xs text-orange-500 mt-0.5">Validation requise</span>
                </div>
              )}
              {!expanded && pendingCount > 0 && (
                <div className="absolute -top-1 -right-1 bg-orange-500 text-white rounded-full h-5 w-5 flex items-center justify-center text-xs font-bold">
                  {pendingCount}
                </div>
              )}
            </div>
          </Link>
        </div>
      </div>

      {/* Bouton déconnexion en bas */}
      <div className="border-t border-slate-200 p-4">
        <Button
          variant="ghost"
          className={cn(
            "w-full text-slate-600 hover:bg-red-50 hover:text-red-600 transition-all duration-200",
            expanded ? "justify-start py-3" : "justify-center p-3"
          )}
          onClick={handleLogout}
        >
          <LogOutIcon className={cn("h-5 w-5", expanded ? "mr-3" : "")} />
          {expanded && <span>Déconnexion</span>}
        </Button>
      </div>
    </div>
  );
};

export default AdminSidebar;