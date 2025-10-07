import React, { createContext, useContext, useEffect, useState, ReactNode } from 'react';
import { io, Socket } from 'socket.io-client';
import { useAuth } from './AuthContext';

interface SocketContextType {
  socket: Socket | null;
  isConnected: boolean;
}

const SocketContext = createContext<SocketContextType | undefined>(undefined);

export const useSocket = () => {
  const context = useContext(SocketContext);
  if (context === undefined) {
    throw new Error('useSocket must be used within a SocketProvider');
  }
  return context;
};

interface SocketProviderProps {
  children: ReactNode;
}

export const SocketProvider: React.FC<SocketProviderProps> = ({ children }) => {
  const [socket, setSocket] = useState<Socket | null>(null);
  const [isConnected, setIsConnected] = useState(false);
  const { user, token } = useAuth();

  useEffect(() => {
    if (token && user) {
      const socketUrl = process.env.REACT_APP_SOCKET_URL || 'http://localhost:5000';
      const newSocket = io(socketUrl, {
        auth: {
          token
        },
        transports: ['websocket', 'polling'],
        timeout: 20000,
        forceNew: true
      });

      newSocket.on('connect', () => {
        console.log('Socket连接成功');
        setIsConnected(true);
        newSocket.emit('join-study-circle', user.id);
      });

      newSocket.on('connect_error', (error) => {
        console.error('Socket连接失败:', error);
        setIsConnected(false);
      });

      newSocket.on('disconnect', (reason) => {
        console.log('Socket连接断开:', reason);
        setIsConnected(false);
      });

      newSocket.on('checkin-notification', (data) => {
        console.log('收到打卡通知:', data);
        // 这里可以显示通知或更新UI
      });

      newSocket.on('like-notification', (data) => {
        console.log('收到点赞通知:', data);
        // 这里可以显示通知或更新UI
      });

      setSocket(newSocket);

      return () => {
        newSocket.close();
      };
    } else {
      if (socket) {
        socket.close();
        setSocket(null);
        setIsConnected(false);
      }
    }
  }, [token, user]);

  const value: SocketContextType = {
    socket,
    isConnected
  };

  return (
    <SocketContext.Provider value={value}>
      {children}
    </SocketContext.Provider>
  );
};
