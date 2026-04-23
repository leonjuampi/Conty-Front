import { createContext, useContext, useEffect, useState, useCallback } from 'react';
import { Notification, getNotifications, markAsRead, markAllAsRead } from '../services/notifications.service';
import { useAuth } from './AuthContext';

const MODAL_SEEN_KEY = 'conty_notif_modal_seen';

interface NotificationContextType {
  notifications: Notification[];
  unreadCount: number;
  showModal: boolean;
  dismissModal: () => void;
  handleMarkAsRead: (id: number) => void;
  handleMarkAllAsRead: () => void;
  refresh: () => void;
}

const NotificationContext = createContext<NotificationContextType | null>(null);

export function NotificationProvider({ children }: { children: React.ReactNode }) {
  const { currentUser } = useAuth();
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [showModal, setShowModal] = useState(false);

  const refresh = useCallback(async () => {
    if (!currentUser) return;
    try {
      const data = await getNotifications();
      setNotifications(data);

      const hasUnread = data.some(n => !n.is_read);
      const lastSeenId = sessionStorage.getItem(MODAL_SEEN_KEY);
      const latestId = data[0]?.id?.toString();

      if (hasUnread && latestId && lastSeenId !== latestId) {
        setShowModal(true);
      }
    } catch {
      // silencioso
    }
  }, [currentUser]);

  useEffect(() => {
    refresh();
  }, [refresh]);

  const dismissModal = () => {
    const latestId = notifications[0]?.id?.toString();
    if (latestId) sessionStorage.setItem(MODAL_SEEN_KEY, latestId);
    setShowModal(false);
  };

  const handleMarkAsRead = async (id: number) => {
    await markAsRead(id);
    setNotifications(prev => prev.map(n => n.id === id ? { ...n, is_read: true } : n));
  };

  const handleMarkAllAsRead = async () => {
    await markAllAsRead();
    setNotifications(prev => prev.map(n => ({ ...n, is_read: true })));
  };

  const unreadCount = notifications.filter(n => !n.is_read).length;

  return (
    <NotificationContext.Provider value={{
      notifications,
      unreadCount,
      showModal,
      dismissModal,
      handleMarkAsRead,
      handleMarkAllAsRead,
      refresh,
    }}>
      {children}
    </NotificationContext.Provider>
  );
}

export function useNotifications() {
  const ctx = useContext(NotificationContext);
  if (!ctx) throw new Error('useNotifications must be used within NotificationProvider');
  return ctx;
}
