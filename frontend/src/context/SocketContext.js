import React, { createContext, useContext, useEffect, useState } from 'react';
import { io } from 'socket.io-client';
import { useAuth } from './AuthContext';

const SocketContext = createContext();

export const useSocket = () => {
  const context = useContext(SocketContext);
  if (!context) {
    throw new Error('useSocket must be used within SocketProvider');
  }
  return context;
};

export const SocketProvider = ({ children }) => {
  const [socket, setSocket] = useState(null);
  const [connected, setConnected] = useState(false);
  const { user } = useAuth();

  useEffect(() => {
    // eslint-disable-next-line react-hooks/exhaustive-deps
    if (user) {
      const token = localStorage.getItem('accessToken');
      const SOCKET_URL = process.env.REACT_APP_SOCKET_URL || 'http://localhost:5001';

      // Initialize socket connection
      const newSocket = io(SOCKET_URL, {
        auth: { token },
        transports: ['websocket', 'polling'],
      });

      newSocket.on('connect', () => {
        console.log('✅ Socket connected');
        setConnected(true);
      });

      newSocket.on('disconnect', () => {
        console.log('❌ Socket disconnected');
        setConnected(false);
      });

      newSocket.on('connect_error', (error) => {
        console.error('Socket connection error:', error);
        setConnected(false);
      });

      setSocket(newSocket);

      // Cleanup on unmount
      return () => {
        newSocket.close();
      };
    } else {
      // Disconnect socket if user logs out
      if (socket) {
        socket.close();
        setSocket(null);
        setConnected(false);
      }
    }
  }, [user]);

  const joinProject = (projectId) => {
    if (socket && connected) {
      socket.emit('project:join', projectId);
    }
  };

  const leaveProject = (projectId) => {
    if (socket && connected) {
      socket.emit('project:leave', projectId);
    }
  };

  const joinWorkspace = (workspaceId) => {
    if (socket && connected) {
      socket.emit('workspace:join', workspaceId);
    }
  };

  const leaveWorkspace = (workspaceId) => {
    if (socket && connected) {
      socket.emit('workspace:leave', workspaceId);
    }
  };

  const emitTaskViewing = (taskId, projectId) => {
    if (socket && connected) {
      socket.emit('task:viewing', { taskId, projectId });
    }
  };

  const emitTaskStopViewing = (taskId, projectId) => {
    if (socket && connected) {
      socket.emit('task:stop-viewing', { taskId, projectId });
    }
  };

  const value = {
    socket,
    connected,
    joinProject,
    leaveProject,
    joinWorkspace,
    leaveWorkspace,
    emitTaskViewing,
    emitTaskStopViewing,
  };

  return <SocketContext.Provider value={value}>{children}</SocketContext.Provider>;
};