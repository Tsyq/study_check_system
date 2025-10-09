import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import api from '../services/api';
import { useAuth } from './AuthContext';

interface NotificationItem {
  type: 'like' | 'comment';
  createdAt: string;
  content?: string;
  checkinId: string;
  fromUser: {
    _id: string;
    username: string;
    avatar: string;
  };
}

interface NotificationContextType {
  notifications: NotificationItem[];
  unreadCount: number;
  loading: boolean;
  fetchNotifications: () => Promise<void>;
  markAsRead: () => void;
  refreshNotifications: () => Promise<void>;
}

const NotificationContext = createContext<NotificationContextType | undefined>(undefined);

export const useNotifications = () => {
  const context = useContext(NotificationContext);
  if (context === undefined) {
    throw new Error('useNotifications must be used within a NotificationProvider');
  }
  return context;
};

interface NotificationProviderProps {
  children: ReactNode;
}

export const NotificationProvider: React.FC<NotificationProviderProps> = ({ children }) => {
  const [notifications, setNotifications] = useState<NotificationItem[]>([]);
  const [unreadCount, setUnreadCount] = useState(0);
  const [loading, setLoading] = useState(false);
  const { user, token } = useAuth();

  const fetchNotifications = async () => {
    if (!user?.id || user.id === 'demo-user') {
      // 演示模式，使用模拟数据
      const demoNotifications: NotificationItem[] = [
        {
          type: 'like',
          createdAt: new Date(Date.now() - 3600000).toISOString(),
          checkinId: '1',
          fromUser: {
            _id: 'user1',
            username: '小明',
            avatar: ''
          }
        },
        {
          type: 'comment',
          createdAt: new Date(Date.now() - 7200000).toISOString(),
          content: '加油！',
          checkinId: '2',
          fromUser: {
            _id: 'user2',
            username: '小红',
            avatar: ''
          }
        }
      ];
      setNotifications(demoNotifications);
      setUnreadCount(demoNotifications.length);
      return;
    }

    if (!token) return;

    setLoading(true);
    try {
      const response = await api.get('/social/me/received?limit=50');
      const items = response.data.items || [];
      setNotifications(items);
      setUnreadCount(items.length);
    } catch (error) {
      console.error('获取通知失败:', error);
    } finally {
      setLoading(false);
    }
  };

  const markAsRead = () => {
    setUnreadCount(0);
  };

  const refreshNotifications = async () => {
    await fetchNotifications();
  };

  // 定期刷新通知（每30秒）
  useEffect(() => {
    if (user?.id && user.id !== 'demo-user') {
      fetchNotifications();
      const interval = setInterval(fetchNotifications, 30000);
      return () => clearInterval(interval);
    }
  }, [user?.id, token]);

  const value: NotificationContextType = {
    notifications,
    unreadCount,
    loading,
    fetchNotifications,
    markAsRead,
    refreshNotifications
  };

  return (
    <NotificationContext.Provider value={value}>
      {children}
    </NotificationContext.Provider>
  );
};
