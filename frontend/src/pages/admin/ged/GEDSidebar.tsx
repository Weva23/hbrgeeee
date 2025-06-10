import React from "react";
import { Link, useLocation } from "react-router-dom";
import { cn } from "@/lib/utils";
import {
  FileIcon,
  FolderIcon,
  SearchIcon,
  PlusIcon,
  SettingsIcon,
  HomeIcon,
  BarChart2Icon,
} from "lucide-react";

const GEDSidebar = () => {
  const location = useLocation();
  
  // Items de navigation
  const navItems = [
    {
      name: "Tableau de bord",
      icon: HomeIcon,
      path: "/admin/ged",
      active: location.pathname === "/admin/ged" || location.pathname === "/admin/ged/",
    },
    {
      name: "Documents",
      icon: FileIcon,
      path: "/admin/ged/documents",
      active: location.pathname.includes("/admin/ged/documents"),
    },
    {
      name: "Catégories",
      icon: FolderIcon,
      path: "/admin/ged/categories",
      active: location.pathname.includes("/admin/ged/categories"),
    },
    {
      name: "Recherche avancée",
      icon: SearchIcon,
      path: "/admin/ged/search",
      active: location.pathname.includes("/admin/ged/search"),
    },
    {
      name: "Import de documents",
      icon: PlusIcon,
      path: "/admin/ged/import",
      active: location.pathname.includes("/admin/ged/import"),
    },
    {
      name: "Statistiques",
      icon: BarChart2Icon,
      path: "/admin/ged/stats",
      active: location.pathname.includes("/admin/ged/stats"),
    },
  ];
  
  return (
    <div className="w-64 bg-gray-50 border-r border-gray-200 p-4">
      <h2 className="text-lg font-bold mb-6 flex items-center gap-2">
        <FileIcon className="h-5 w-5 text-blue-600" />
        GED Richat
      </h2>
      
      <nav className="space-y-1">
        {navItems.map((item, index) => (
          <Link
            key={index}
            to={item.path}
            className={cn(
              "flex items-center px-3 py-2 rounded-md text-sm font-medium transition-colors",
              item.active
                ? "bg-blue-50 text-blue-600"
                : "text-gray-700 hover:bg-gray-100"
            )}
          >
            <item.icon className={cn(
              "h-5 w-5 mr-3",
              item.active ? "text-blue-600" : "text-gray-500"
            )} />
            <span>{item.name}</span>
          </Link>
        ))}
      </nav>
      
      <div className="mt-10 pt-4 border-t border-gray-200">
        <Link
          to="/admin/dashboard"
          className="flex items-center px-3 py-2 rounded-md text-sm font-medium transition-colors text-gray-700 hover:bg-gray-100"
        >
          <HomeIcon className="h-5 w-5 mr-3 text-gray-500" />
          <span>Retour au tableau de bord</span>
        </Link>
        
        <Link
          to="/admin/ged/settings"
          className="flex items-center px-3 py-2 rounded-md text-sm font-medium transition-colors text-gray-700 hover:bg-gray-100 mt-1"
        >
          <SettingsIcon className="h-5 w-5 mr-3 text-gray-500" />
          <span>Paramètres GED</span>
        </Link>
      </div>
      
      <div className="mt-10 pt-4 border-t border-gray-200">
        <div className="px-3 py-2 text-xs text-gray-500">
          <p>GED intégrée avec Infomaniak kDrive</p>
          <p className="mt-1">Synchronisation activée</p>
        </div>
      </div>
    </div>
  );
};

export default GEDSidebar;