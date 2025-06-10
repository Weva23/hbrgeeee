import React, { useState, useEffect } from 'react';
import { Bell } from 'lucide-react';
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Badge } from "@/components/ui/badge";

interface Notification {
  id: number;
  type: string;
  title: string;
  content: string;
  is_read: boolean;
  appel_offre_id?: number;
  appel_offre_nom?: string;
  match_id?: number;
}

interface NotificationBellProps {
  consultantId: string | null;
  onNotificationClick: (notificationId: number, appelOffreId?: number) => void;
}

const NotificationBell: React.FC<NotificationBellProps> = ({ consultantId, onNotificationClick }) => {
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [unreadCount, setUnreadCount] = useState(0);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [isOpen, setIsOpen] = useState(false);

  // Fonction pour charger les notifications
  const fetchNotifications = async () => {
    if (!consultantId) return;
    
    setIsLoading(true);
    setError(null);
    
    try {
      const response = await fetch(`http://localhost:8000/api/consultant/${consultantId}/notifications/`);
      
      if (!response.ok) {
        throw new Error(`Erreur HTTP: ${response.status}`);
      }
      
      const data = await response.json();
      
      if (data.success) {
        setNotifications(data.notifications || []);
        setUnreadCount(data.unread_count || 0);
      } else {
        setError(data.error || "Erreur lors du chargement des notifications");
      }
    } catch (err) {
      console.error("Erreur lors du chargement des notifications:", err);
      setError("Impossible de charger les notifications");
    } finally {
      setIsLoading(false);
    }
  };

  // Charger les notifications au chargement du composant et périodiquement
  useEffect(() => {
    fetchNotifications();
    
    // Actualiser les notifications toutes les 30 secondes
    const interval = setInterval(() => {
      fetchNotifications();
    }, 30000);
    
    return () => clearInterval(interval);
  }, [consultantId]);

  // Gérer le clic sur une notification
  const handleNotificationClick = (notification: Notification) => {
    if (notification.match_id) {
      onNotificationClick(notification.id, notification.appel_offre_id);
    } else {
      onNotificationClick(notification.id);
    }
    setIsOpen(false);
    
    // Marquer comme lue localement
    setNotifications(prevNotifications => 
      prevNotifications.map(n => 
        n.id === notification.id ? { ...n, is_read: true } : n
      )
    );
    setUnreadCount(prev => Math.max(0, prev - 1));
  };

  return (
    <Popover open={isOpen} onOpenChange={setIsOpen}>
      <PopoverTrigger asChild>
        <button className="relative p-2 rounded-full hover:bg-gray-100">
          <Bell className="h-5 w-5" />
          {unreadCount > 0 && (
            <span className="absolute top-0 right-0 transform translate-x-1/4 -translate-y-1/4 bg-red-500 text-white text-xs font-bold rounded-full h-5 w-5 flex items-center justify-center">
              {unreadCount}
            </span>
          )}
        </button>
      </PopoverTrigger>
      <PopoverContent className="w-80 p-0">
        <div className="p-3 border-b">
          <h3 className="font-medium">Notifications</h3>
        </div>
        <div className="max-h-80 overflow-y-auto">
          {isLoading ? (
            <div className="p-4 text-center">
              <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-gray-500 mx-auto"></div>
              <p className="mt-2 text-sm text-gray-500">Chargement...</p>
            </div>
          ) : error ? (
            <div className="p-4 text-center text-red-500">{error}</div>
          ) : notifications.length === 0 ? (
            <div className="p-4 text-center text-gray-500">
              <p>Aucune notification</p>
            </div>
          ) : (
            <div>
              {notifications.map(notification => (
                <div 
                  key={notification.id} 
                  className={`p-3 border-b hover:bg-gray-50 cursor-pointer ${notification.is_read ? 'opacity-70' : 'bg-blue-50'}`}
                  onClick={() => handleNotificationClick(notification)}
                >
                  <div className="flex items-start">
                    <div className="flex-grow">
                      <p className="font-medium text-sm">{notification.title}</p>
                      <p className="text-xs text-gray-500 mt-1 line-clamp-2">{notification.content}</p>
                      {notification.appel_offre_nom && (
                        <div className="mt-1">
                          <Badge variant="outline" className="text-xs">
                            {notification.appel_offre_nom}
                          </Badge>
                        </div>
                      )}
                    </div>
                    {!notification.is_read && (
                      <div className="h-2 w-2 bg-blue-500 rounded-full ml-2 mt-1"></div>
                    )}
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
        <div className="p-2 border-t">
          <button 
            onClick={fetchNotifications}
            className="w-full text-center text-xs text-blue-600 hover:text-blue-800 py-1"
          >
            Actualiser
          </button>
        </div>
      </PopoverContent>
    </Popover>
  );
};

export default NotificationBell;