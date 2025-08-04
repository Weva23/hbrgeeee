// NotificationBell.tsx - VERSION CORRIGÉE avec gestion des notifications de missions

import React, { useState, useEffect } from 'react';
import { Bell, CheckCircle, Clock, Star, AlertTriangle } from 'lucide-react';
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Badge } from "@/components/ui/badge";

interface Notification {
  id: number;
  type: string;
  title: string;
  content: string;
  priority: 'HIGH' | 'NORMAL' | 'LOW';
  is_read: boolean;
  created_at: string;
  read_at?: string;
  appel_offre_id?: number;
  appel_offre_nom?: string;
  client?: string;
  match_id?: number;
  match_score?: number;
  mission_id?: number;
  mission_title?: string;
  metadata?: any;
  age_days: number;
}

interface NotificationBellProps {
  consultantId: string | null;
  onNotificationClick: (notificationId: number, appelOffreId?: number, missionId?: number) => void;
}

// 🔥 NOUVEAUTÉ - Fonction pour obtenir l'icône selon le type de notification
const getNotificationIcon = (notification: Notification) => {
  switch (notification.type) {
    case 'MATCH_VALID':
      return <CheckCircle className="h-4 w-4 text-green-600" />;
    case 'MISSION_START':
      return <Star className="h-4 w-4 text-blue-600" />;
    case 'MISSION_UPDATE':
      return <Clock className="h-4 w-4 text-orange-600" />;
    case 'MISSION_END':
      return <CheckCircle className="h-4 w-4 text-purple-600" />;
    default:
      return <Bell className="h-4 w-4 text-gray-600" />;
  }
};

// 🔥 NOUVEAUTÉ - Fonction pour obtenir la couleur selon la priorité
const getPriorityColor = (priority: string) => {
  switch (priority) {
    case 'HIGH':
      return 'border-l-red-500 bg-red-50';
    case 'NORMAL':
      return 'border-l-blue-500 bg-blue-50';
    case 'LOW':
      return 'border-l-gray-500 bg-gray-50';
    default:
      return 'border-l-blue-500 bg-blue-50';
  }
};

// 🔥 NOUVEAUTÉ - Fonction pour formater le temps écoulé
const formatTimeAgo = (createdAt: string) => {
  const now = new Date();
  const created = new Date(createdAt);
  const diffInHours = Math.floor((now.getTime() - created.getTime()) / (1000 * 60 * 60));
  
  if (diffInHours < 1) {
    const diffInMinutes = Math.floor((now.getTime() - created.getTime()) / (1000 * 60));
    return diffInMinutes < 1 ? 'À l\'instant' : `Il y a ${diffInMinutes}min`;
  } else if (diffInHours < 24) {
    return `Il y a ${diffInHours}h`;
  } else {
    const diffInDays = Math.floor(diffInHours / 24);
    return diffInDays === 1 ? 'Hier' : `Il y a ${diffInDays}j`;
  }
};

const NotificationBell: React.FC<NotificationBellProps> = ({ consultantId, onNotificationClick }) => {
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [unreadCount, setUnreadCount] = useState(0);
  const [priorityCounts, setPriorityCounts] = useState({ HIGH: 0, NORMAL: 0, LOW: 0 });
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [isOpen, setIsOpen] = useState(false);

  // Fonction pour charger les notifications - VERSION AMÉLIORÉE
  const fetchNotifications = async () => {
    if (!consultantId) return;
    
    setIsLoading(true);
    setError(null);
    
    try {
      console.log("📡 Récupération des notifications pour consultant:", consultantId);
      
      const response = await fetch(`http://127.0.0.1:8000/api/consultant/${consultantId}/notifications/`, {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
          'Accept': 'application/json',
        },
      });
      
      console.log("📡 Notifications - Status:", response.status);
      
      if (!response.ok) {
        console.warn(`⚠️ Notifications indisponibles: ${response.status}`);
        setNotifications([]);
        setUnreadCount(0);
        setPriorityCounts({ HIGH: 0, NORMAL: 0, LOW: 0 });
        return;
      }
      
      const data = await response.json();
      console.log("📦 Données notifications:", data);
      
      if (data.success) {
        const notificationsData = data.notifications || [];
        setNotifications(notificationsData);
        setUnreadCount(data.unread_count || 0);
        setPriorityCounts(data.priority_counts || { HIGH: 0, NORMAL: 0, LOW: 0 });
        
        console.log(`✅ ${notificationsData.length} notifications chargées`);
        console.log(`🔔 ${data.unread_count} non lues - Priorités:`, data.priority_counts);
        
        // 🔥 NOUVEAUTÉ - Afficher une alerte pour les notifications haute priorité non lues
        const highPriorityUnread = notificationsData.filter(
          (n: Notification) => n.priority === 'HIGH' && !n.is_read
        );
        
        if (highPriorityUnread.length > 0 && !isOpen) {
          console.log(`🚨 ${highPriorityUnread.length} notifications haute priorité non lues`);
        }
        
      } else {
        console.warn("⚠️ Erreur API notifications:", data.error);
        setNotifications([]);
        setUnreadCount(0);
        setPriorityCounts({ HIGH: 0, NORMAL: 0, LOW: 0 });
      }
    } catch (err) {
      console.error("❌ Exception notifications:", err);
      setNotifications([]);
      setUnreadCount(0);
      setPriorityCounts({ HIGH: 0, NORMAL: 0, LOW: 0 });
    } finally {
      setIsLoading(false);
    }
  };

  // Charger les notifications au chargement du composant
  useEffect(() => {
    fetchNotifications();
    
    // 🔥 CORRECTION - Actualiser plus fréquemment pour les notifications de missions
    const interval = setInterval(() => {
      fetchNotifications();
    }, 30000); // Toutes les 30 secondes
    
    return () => clearInterval(interval);
  }, [consultantId]);

  // 🔥 AMÉLIORATION - Gérer le clic sur une notification avec plus de logique
  const handleNotificationClick = async (notification: Notification) => {
    try {
      console.log("🔔 Clic sur notification:", notification);
      
      // Marquer comme lue côté serveur
      if (!notification.is_read) {
        const markReadResponse = await fetch(`http://127.0.0.1:8000/api/notifications/${notification.id}/read/`, {
          method: 'PUT',
          headers: {
            'Content-Type': 'application/json',
          },
        });
        
        if (markReadResponse.ok) {
          // Marquer comme lue localement
          setNotifications(prevNotifications => 
            prevNotifications.map(n => 
              n.id === notification.id ? { ...n, is_read: true, read_at: new Date().toISOString() } : n
            )
          );
          setUnreadCount(prev => Math.max(0, prev - 1));
          
          // Mettre à jour les compteurs de priorité
          if (notification.priority) {
            setPriorityCounts(prev => ({
              ...prev,
              [notification.priority]: Math.max(0, prev[notification.priority] - 1)
            }));
          }
        }
      }
      
      // 🔥 NOUVEAUTÉ - Logique de navigation selon le type de notification
      let targetId: number | undefined;
      let missionId: number | undefined;
      
      switch (notification.type) {
        case 'MATCH_VALID':
          // Pour les validations de matching, aller à l'appel d'offre ou à la mission
          targetId = notification.mission_id || notification.appel_offre_id;
          missionId = notification.mission_id;
          break;
          
        case 'MISSION_START':
        case 'MISSION_UPDATE':
        case 'MISSION_END':
          // Pour les notifications de mission, aller directement à la mission
          targetId = notification.appel_offre_id;
          missionId = notification.mission_id;
          break;
          
        case 'NEW_OFFER':
          // Pour les nouvelles offres, aller à l'appel d'offre
          targetId = notification.appel_offre_id;
          break;
          
        default:
          targetId = notification.appel_offre_id;
          break;
      }
      
      // Déclencher l'action avec les IDs appropriés
      onNotificationClick(notification.id, targetId, missionId);
      
      setIsOpen(false);
      
    } catch (error) {
      console.error("❌ Erreur lors du clic sur notification:", error);
      // Continuer quand même avec l'action
      onNotificationClick(notification.id, notification.appel_offre_id, notification.mission_id);
      setIsOpen(false);
    }
  };

  // 🔥 NOUVEAUTÉ - Fonction pour marquer toutes les notifications comme lues
  const markAllAsRead = async () => {
    try {
      const unreadNotifications = notifications.filter(n => !n.is_read);
      
      for (const notification of unreadNotifications) {
        await fetch(`http://127.0.0.1:8000/api/notifications/${notification.id}/read/`, {
          method: 'PUT',
          headers: {
            'Content-Type': 'application/json',
          },
        });
      }
      
      // Mettre à jour l'état local
      setNotifications(prev => prev.map(n => ({ ...n, is_read: true, read_at: new Date().toISOString() })));
      setUnreadCount(0);
      setPriorityCounts({ HIGH: 0, NORMAL: 0, LOW: 0 });
      
    } catch (error) {
      console.error("❌ Erreur marquage toutes lues:", error);
    }
  };

  return (
    <Popover open={isOpen} onOpenChange={setIsOpen}>
      <PopoverTrigger asChild>
        <button className="relative p-2 rounded-full hover:bg-gray-100 transition-colors">
          <Bell className="h-5 w-5" />
          {unreadCount > 0 && (
            <span className={`absolute top-0 right-0 transform translate-x-1/4 -translate-y-1/4 
              ${priorityCounts.HIGH > 0 ? 'bg-red-500 animate-pulse' : 'bg-blue-500'} 
              text-white text-xs font-bold rounded-full h-5 w-5 flex items-center justify-center`}>
              {unreadCount > 9 ? '9+' : unreadCount}
            </span>
          )}
          {/* 🔥 NOUVEAUTÉ - Indicateur de priorité haute */}
          {priorityCounts.HIGH > 0 && (
            <span className="absolute top-0 left-0 transform -translate-x-1/4 -translate-y-1/4 
              bg-red-500 rounded-full h-3 w-3 animate-ping">
            </span>
          )}
        </button>
      </PopoverTrigger>
      <PopoverContent className="w-96 p-0 shadow-lg max-h-[80vh] overflow-hidden">
        <div className="p-3 border-b bg-gray-50">
          <div className="flex justify-between items-center">
            <h3 className="font-medium">Notifications</h3>
            <div className="flex items-center gap-2">
              {unreadCount > 0 && (
                <Badge variant="secondary" className="bg-blue-100 text-blue-800">
                  {unreadCount} nouveau{unreadCount > 1 ? 'x' : ''}
                </Badge>
              )}
              {/* 🔥 NOUVEAUTÉ - Compteurs par priorité */}
              {priorityCounts.HIGH > 0 && (
                <Badge variant="destructive" className="bg-red-100 text-red-800 text-xs">
                  {priorityCounts.HIGH} urgent{priorityCounts.HIGH > 1 ? 's' : ''}
                </Badge>
              )}
            </div>
          </div>
          {/* 🔥 NOUVEAUTÉ - Bouton marquer tout comme lu */}
          {unreadCount > 0 && (
            <button 
              onClick={markAllAsRead}
              className="mt-2 text-xs text-blue-600 hover:text-blue-800 underline"
            >
              Marquer tout comme lu
            </button>
          )}
        </div>
        
        <div className="max-h-80 overflow-y-auto">
          {isLoading ? (
            <div className="p-4 text-center">
              <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-blue-500 mx-auto"></div>
              <p className="mt-2 text-sm text-gray-500">Chargement...</p>
            </div>
          ) : error ? (
            <div className="p-4 text-center">
              <p className="text-sm text-gray-500">Notifications indisponibles</p>
              <button 
                onClick={fetchNotifications}
                className="mt-2 text-xs text-blue-600 hover:text-blue-800"
              >
                Réessayer
              </button>
            </div>
          ) : notifications.length === 0 ? (
            <div className="p-4 text-center">
              <Bell className="h-8 w-8 text-gray-300 mx-auto mb-2" />
              <p className="text-sm text-gray-500">Aucune notification</p>
              <p className="text-xs text-gray-400 mt-1">Vous serez notifié des nouvelles missions</p>
            </div>
          ) : (
            <div>
              {notifications.slice(0, 10).map(notification => (
                <div 
                  key={notification.id} 
                  className={`p-3 border-b hover:bg-gray-50 cursor-pointer transition-colors relative
                    ${notification.is_read ? 'opacity-70' : getPriorityColor(notification.priority)} 
                    ${notification.is_read ? '' : 'border-l-4'}`}
                  onClick={() => handleNotificationClick(notification)}
                >
                  <div className="flex items-start gap-3">
                    {/* 🔥 NOUVEAUTÉ - Icône selon le type */}
                    <div className="mt-1 flex-shrink-0">
                      {getNotificationIcon(notification)}
                    </div>
                    
                    <div className="flex-grow min-w-0">
                      <div className="flex items-start justify-between">
                        <p className={`text-sm ${notification.is_read ? 'font-normal' : 'font-medium'} 
                          ${notification.priority === 'HIGH' ? 'text-red-900' : ''}`}>
                          {notification.title}
                        </p>
                        <div className="flex flex-col items-end gap-1 ml-2">
                          <p className="text-xs text-gray-400">
                            {formatTimeAgo(notification.created_at)}
                          </p>
                          {notification.priority === 'HIGH' && !notification.is_read && (
                            <AlertTriangle className="h-3 w-3 text-red-500" />
                          )}
                        </div>
                      </div>
                      
                      <p className="text-xs text-gray-600 mt-1 line-clamp-2">
                        {notification.content}
                      </p>
                      
                      {/* 🔥 NOUVEAUTÉ - Informations contextuelles */}
                      <div className="mt-2 flex flex-wrap gap-1">
                        {notification.client && (
                          <Badge variant="outline" className="text-xs">
                            🏢 {notification.client}
                          </Badge>
                        )}
                        {notification.match_score && (
                          <Badge variant="outline" className="text-xs">
                            📊 {notification.match_score.toFixed(1)}%
                          </Badge>
                        )}
                        {notification.mission_title && (
                          <Badge variant="outline" className="text-xs">
                            🎯 {notification.mission_title}
                          </Badge>
                        )}
                      </div>
                    </div>
                    
                    {/* 🔥 AMÉLIORATION - Indicateur de statut */}
                    {!notification.is_read && (
                      <div className={`h-2 w-2 rounded-full ml-2 mt-1 flex-shrink-0
                        ${notification.priority === 'HIGH' ? 'bg-red-500' : 'bg-blue-500'}`}>
                      </div>
                    )}
                  </div>
                </div>
              ))}
              
              {notifications.length > 10 && (
                <div className="p-2 text-center border-t bg-gray-50">
                  <p className="text-xs text-gray-500">
                    +{notifications.length - 10} notifications supplémentaires
                  </p>
                </div>
              )}
            </div>
          )}
        </div>
        
        {/* 🔥 AMÉLIORATION - Footer avec actions */}
        <div className="p-2 border-t bg-gray-50 flex justify-between items-center">
          <button 
            onClick={fetchNotifications}
            disabled={isLoading}
            className="text-xs text-blue-600 hover:text-blue-800 py-1 transition-colors disabled:opacity-50"
          >
            {isLoading ? 'Actualisation...' : '🔄 Actualiser'}
          </button>
          
          {/* 🔥 NOUVEAUTÉ - Lien vers toutes les notifications */}
          <button 
            className="text-xs text-gray-600 hover:text-gray-800 py-1 transition-colors"
            onClick={() => {
              // TODO: Implémenter la navigation vers une page de toutes les notifications
              setIsOpen(false);
            }}
          >
            Voir tout →
          </button>
        </div>
      </PopoverContent>
    </Popover>
  );
};

export default NotificationBell;