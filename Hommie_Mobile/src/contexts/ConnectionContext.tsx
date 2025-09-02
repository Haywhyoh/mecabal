import React, { createContext, useContext, useReducer, useCallback, ReactNode } from 'react';
import { View, Text } from 'react-native';
import MaterialCommunityIcons from '@expo/vector-icons/MaterialCommunityIcons';
import { 
  ConnectionState, 
  ConnectionContextType, 
  NeighborConnection,
  MutualConnection,
  NetworkAnalysis,
  ConnectionRequest,
  ConnectionNotification,
  ConnectionType,
  ConnectionAction
} from '../types/connectionTypes';
import { ConnectionService } from '../services/connectionService';
import { connectionStyles, connectionColors } from '../styles/connectionStyles';

// Initial state
const initialState: ConnectionState = {
  connections: {},
  mutualConnections: {},
  networkAnalyses: {},
  pendingRequests: [],
  notifications: [],
  loading: false,
  error: null,
};

// Action types
type ConnectionAction_Redux = 
  | { type: 'SET_LOADING'; payload: boolean }
  | { type: 'SET_ERROR'; payload: string | null }
  | { type: 'SET_CONNECTION'; payload: { userId: string; connection: NeighborConnection } }
  | { type: 'REMOVE_CONNECTION'; payload: string }
  | { type: 'SET_MUTUAL_CONNECTIONS'; payload: { pairKey: string; connections: MutualConnection[] } }
  | { type: 'SET_NETWORK_ANALYSIS'; payload: { pairKey: string; analysis: NetworkAnalysis } }
  | { type: 'ADD_PENDING_REQUEST'; payload: ConnectionRequest }
  | { type: 'REMOVE_PENDING_REQUEST'; payload: string }
  | { type: 'UPDATE_REQUEST_STATUS'; payload: { requestId: string; status: 'accepted' | 'declined' } }
  | { type: 'ADD_NOTIFICATION'; payload: ConnectionNotification }
  | { type: 'MARK_NOTIFICATION_READ'; payload: string }
  | { type: 'CLEAR_NOTIFICATIONS' };

// Reducer
function connectionReducer(state: ConnectionState, action: ConnectionAction_Redux): ConnectionState {
  switch (action.type) {
    case 'SET_LOADING':
      return { ...state, loading: action.payload };
    
    case 'SET_ERROR':
      return { ...state, error: action.payload, loading: false };
    
    case 'SET_CONNECTION':
      return {
        ...state,
        connections: {
          ...state.connections,
          [action.payload.userId]: action.payload.connection
        }
      };
    
    case 'REMOVE_CONNECTION':
      const { [action.payload]: removed, ...remainingConnections } = state.connections;
      return { ...state, connections: remainingConnections };
    
    case 'SET_MUTUAL_CONNECTIONS':
      return {
        ...state,
        mutualConnections: {
          ...state.mutualConnections,
          [action.payload.pairKey]: action.payload.connections
        }
      };
    
    case 'SET_NETWORK_ANALYSIS':
      return {
        ...state,
        networkAnalyses: {
          ...state.networkAnalyses,
          [action.payload.pairKey]: action.payload.analysis
        }
      };
    
    case 'ADD_PENDING_REQUEST':
      return {
        ...state,
        pendingRequests: [...state.pendingRequests, action.payload]
      };
    
    case 'REMOVE_PENDING_REQUEST':
      return {
        ...state,
        pendingRequests: state.pendingRequests.filter(req => req.id !== action.payload)
      };
    
    case 'UPDATE_REQUEST_STATUS':
      return {
        ...state,
        pendingRequests: state.pendingRequests.map(req =>
          req.id === action.payload.requestId
            ? { ...req, status: action.payload.status }
            : req
        )
      };
    
    case 'ADD_NOTIFICATION':
      return {
        ...state,
        notifications: [action.payload, ...state.notifications]
      };
    
    case 'MARK_NOTIFICATION_READ':
      return {
        ...state,
        notifications: state.notifications.map(notification =>
          notification.id === action.payload
            ? { ...notification, read: true }
            : notification
        )
      };
    
    case 'CLEAR_NOTIFICATIONS':
      return { ...state, notifications: [] };
    
    default:
      return state;
  }
}

// Create context
const ConnectionContext = createContext<ConnectionContextType | null>(null);

// Provider component
interface ConnectionProviderProps {
  children: ReactNode;
}

export function ConnectionProvider({ children }: ConnectionProviderProps) {
  const [state, dispatch] = useReducer(connectionReducer, initialState);

  // Helper function to generate pair key
  const generatePairKey = (userId1: string, userId2: string): string => {
    return [userId1, userId2].sort().join('_');
  };

  // Helper function for API simulation
  const simulateAsyncOperation = <T>(data: T, delay: number = 1000): Promise<T> => {
    return new Promise((resolve) => {
      setTimeout(() => resolve(data), delay);
    });
  };

  // Action implementations
  const sendConnectionRequest = useCallback(async (
    targetUserId: string, 
    connectionType: ConnectionType, 
    message?: string
  ) => {
    dispatch({ type: 'SET_LOADING', payload: true });
    
    try {
      // Simulate API call
      const request: ConnectionRequest = {
        id: `req_${Date.now()}`,
        fromUserId: 'current_user', // This would come from auth context
        toUserId: targetUserId,
        connectionType,
        message,
        createdAt: new Date().toISOString(),
        status: 'pending',
        fromUserProfile: {
          // Mock profile - would come from user context
          id: 'current_user',
          firstName: 'Current',
          lastName: 'User',
          displayName: 'Current U.',
          estate: 'Current Estate',
          joinedDate: 'Jan 2024',
          isVerified: true,
          verificationLevel: 'enhanced',
          trustScore: 75,
          connectionStats: {
            totalConnections: 15,
            trustedConnections: 5,
            mutualConnections: 8,
            followerCount: 20,
            followingCount: 18
          },
          badges: ['verified_neighbor'],
          interests: ['Community'],
          privacySettings: {
            allowConnections: true,
            requireApproval: true,
            showLocation: true,
            showActivity: true,
            showMutualConnections: true
          }
        }
      };

      await simulateAsyncOperation(request);
      dispatch({ type: 'ADD_PENDING_REQUEST', payload: request });

      // Add notification
      const notification: ConnectionNotification = {
        id: `notif_${Date.now()}`,
        type: 'connection_request',
        fromUserId: 'current_user',
        targetUserId,
        message: `Connection request sent to user`,
        createdAt: new Date().toISOString(),
        read: false,
        actionRequired: false,
        relatedConnectionId: request.id
      };
      
      dispatch({ type: 'ADD_NOTIFICATION', payload: notification });
      dispatch({ type: 'SET_LOADING', payload: false });
      
    } catch (error) {
      dispatch({ type: 'SET_ERROR', payload: 'Failed to send connection request' });
    }
  }, []);

  const acceptConnectionRequest = useCallback(async (requestId: string) => {
    dispatch({ type: 'SET_LOADING', payload: true });
    
    try {
      await simulateAsyncOperation(null, 800);
      
      const request = state.pendingRequests.find(req => req.id === requestId);
      if (request) {
        // Create connection
        const connection: NeighborConnection = {
          id: `conn_${Date.now()}`,
          fromUserId: request.fromUserId,
          toUserId: request.toUserId,
          connectionType: request.connectionType,
          status: 'accepted',
          initiatedBy: request.fromUserId,
          createdAt: request.createdAt,
          acceptedAt: new Date().toISOString()
        };

        dispatch({ type: 'SET_CONNECTION', payload: { userId: request.fromUserId, connection } });
        dispatch({ type: 'UPDATE_REQUEST_STATUS', payload: { requestId, status: 'accepted' } });

        // Add notification
        const notification: ConnectionNotification = {
          id: `notif_${Date.now()}`,
          type: 'connection_accepted',
          fromUserId: 'current_user',
          targetUserId: request.fromUserId,
          message: `Connection request accepted`,
          createdAt: new Date().toISOString(),
          read: false,
          actionRequired: false,
          relatedConnectionId: connection.id
        };
        
        dispatch({ type: 'ADD_NOTIFICATION', payload: notification });
      }
      
      dispatch({ type: 'SET_LOADING', payload: false });
      
    } catch (error) {
      dispatch({ type: 'SET_ERROR', payload: 'Failed to accept connection request' });
    }
  }, [state.pendingRequests]);

  const declineConnectionRequest = useCallback(async (requestId: string) => {
    dispatch({ type: 'SET_LOADING', payload: true });
    
    try {
      await simulateAsyncOperation(null, 500);
      dispatch({ type: 'UPDATE_REQUEST_STATUS', payload: { requestId, status: 'declined' } });
      dispatch({ type: 'SET_LOADING', payload: false });
      
    } catch (error) {
      dispatch({ type: 'SET_ERROR', payload: 'Failed to decline connection request' });
    }
  }, []);

  const upgradeConnection = useCallback(async (userId: string, newConnectionType: ConnectionType) => {
    dispatch({ type: 'SET_LOADING', payload: true });
    
    try {
      const existingConnection = state.connections[userId];
      if (existingConnection) {
        const upgradedConnection = {
          ...existingConnection,
          connectionType: newConnectionType
        };
        
        await simulateAsyncOperation(upgradedConnection, 800);
        dispatch({ type: 'SET_CONNECTION', payload: { userId, connection: upgradedConnection } });

        // Add notification
        const notification: ConnectionNotification = {
          id: `notif_${Date.now()}`,
          type: 'trust_upgrade',
          fromUserId: 'current_user',
          targetUserId: userId,
          message: `Connection upgraded to ${ConnectionService.getConnectionTypeInfo(newConnectionType).name}`,
          createdAt: new Date().toISOString(),
          read: false,
          actionRequired: false,
          relatedConnectionId: existingConnection.id
        };
        
        dispatch({ type: 'ADD_NOTIFICATION', payload: notification });
      }
      
      dispatch({ type: 'SET_LOADING', payload: false });
      
    } catch (error) {
      dispatch({ type: 'SET_ERROR', payload: 'Failed to upgrade connection' });
    }
  }, [state.connections]);

  const disconnectFromUser = useCallback(async (userId: string) => {
    dispatch({ type: 'SET_LOADING', payload: true });
    
    try {
      await simulateAsyncOperation(null, 600);
      dispatch({ type: 'REMOVE_CONNECTION', payload: userId });
      dispatch({ type: 'SET_LOADING', payload: false });
      
    } catch (error) {
      dispatch({ type: 'SET_ERROR', payload: 'Failed to disconnect from user' });
    }
  }, []);

  const blockUser = useCallback(async (userId: string) => {
    dispatch({ type: 'SET_LOADING', payload: true });
    
    try {
      await simulateAsyncOperation(null, 600);
      dispatch({ type: 'REMOVE_CONNECTION', payload: userId });
      // In a real app, would also add to blocked users list
      dispatch({ type: 'SET_LOADING', payload: false });
      
    } catch (error) {
      dispatch({ type: 'SET_ERROR', payload: 'Failed to block user' });
    }
  }, []);

  const loadMutualConnections = useCallback(async (
    currentUserId: string, 
    targetUserId: string
  ): Promise<MutualConnection[]> => {
    const pairKey = generatePairKey(currentUserId, targetUserId);
    
    // Check cache first
    const cached = state.mutualConnections[pairKey];
    if (cached) return cached;

    dispatch({ type: 'SET_LOADING', payload: true });
    
    try {
      const mutualConnections = ConnectionService.generateMockMutualConnections(
        currentUserId, 
        targetUserId, 
        3
      );
      
      const result = await simulateAsyncOperation(mutualConnections, 800);
      dispatch({ type: 'SET_MUTUAL_CONNECTIONS', payload: { pairKey, connections: result } });
      dispatch({ type: 'SET_LOADING', payload: false });
      
      return result;
      
    } catch (error) {
      dispatch({ type: 'SET_ERROR', payload: 'Failed to load mutual connections' });
      return [];
    }
  }, [state.mutualConnections]);

  const loadNetworkAnalysis = useCallback(async (
    currentUserId: string, 
    targetUserId: string
  ): Promise<NetworkAnalysis> => {
    const pairKey = generatePairKey(currentUserId, targetUserId);
    
    // Check cache first
    const cached = state.networkAnalyses[pairKey];
    if (cached) return cached;

    dispatch({ type: 'SET_LOADING', payload: true });
    
    try {
      const mutualConnections = await loadMutualConnections(currentUserId, targetUserId);
      const analysis = ConnectionService.calculateNetworkAnalysis(
        currentUserId, 
        targetUserId, 
        mutualConnections
      );
      
      const result = await simulateAsyncOperation(analysis, 600);
      dispatch({ type: 'SET_NETWORK_ANALYSIS', payload: { pairKey, analysis: result } });
      dispatch({ type: 'SET_LOADING', payload: false });
      
      return result;
      
    } catch (error) {
      dispatch({ type: 'SET_ERROR', payload: 'Failed to load network analysis' });
      throw error;
    }
  }, [state.networkAnalyses, loadMutualConnections]);

  const markNotificationAsRead = useCallback((notificationId: string) => {
    dispatch({ type: 'MARK_NOTIFICATION_READ', payload: notificationId });
  }, []);

  const clearError = useCallback(() => {
    dispatch({ type: 'SET_ERROR', payload: null });
  }, []);

  const contextValue: ConnectionContextType = {
    state,
    actions: {
      sendConnectionRequest,
      acceptConnectionRequest,
      declineConnectionRequest,
      upgradeConnection,
      disconnectFromUser,
      blockUser,
      loadMutualConnections,
      loadNetworkAnalysis,
      markNotificationAsRead,
      clearError,
    },
  };

  return (
    <ConnectionContext.Provider value={contextValue}>
      {children}
    </ConnectionContext.Provider>
  );
}

// Hook to use the connection context
export function useConnection(): ConnectionContextType {
  const context = useContext(ConnectionContext);
  if (!context) {
    throw new Error('useConnection must be used within a ConnectionProvider');
  }
  return context;
}

// Helper hooks for specific functionality
export function useMutualConnections(currentUserId: string, targetUserId: string) {
  const { state, actions } = useConnection();
  const pairKey = [currentUserId, targetUserId].sort().join('_');
  
  const mutualConnections = state.mutualConnections[pairKey] || [];
  const networkAnalysis = state.networkAnalyses[pairKey];
  
  React.useEffect(() => {
    if (mutualConnections.length === 0 && !state.loading) {
      actions.loadMutualConnections(currentUserId, targetUserId);
    }
  }, [currentUserId, targetUserId]);

  return {
    mutualConnections,
    networkAnalysis,
    loading: state.loading,
    error: state.error,
    loadNetworkAnalysis: () => actions.loadNetworkAnalysis(currentUserId, targetUserId)
  };
}

export function useConnectionRequests() {
  const { state, actions } = useConnection();
  
  return {
    pendingRequests: state.pendingRequests.filter(req => req.status === 'pending'),
    acceptRequest: actions.acceptConnectionRequest,
    declineRequest: actions.declineConnectionRequest,
    loading: state.loading,
    error: state.error
  };
}

export function useNotifications() {
  const { state, actions } = useConnection();
  
  return {
    notifications: state.notifications,
    unreadCount: state.notifications.filter(n => !n.read).length,
    markAsRead: actions.markNotificationAsRead,
    clearAll: () => {} // Fixed: no direct dispatch access here
  };
}

// Error boundary for connection-related components
export class ConnectionErrorBoundary extends React.Component<
  { children: React.ReactNode; fallback?: React.ComponentType },
  { hasError: boolean }
> {
  constructor(props: any) {
    super(props);
    this.state = { hasError: false };
  }

  static getDerivedStateFromError(error: Error) {
    return { hasError: true };
  }

  componentDidCatch(error: Error, errorInfo: React.ErrorInfo) {
    console.error('Connection component error:', error, errorInfo);
  }

  render() {
    if (this.state.hasError) {
      const FallbackComponent = this.props.fallback || DefaultConnectionError;
      return <FallbackComponent />;
    }

    return this.props.children;
  }
}

// Default error fallback component
const DefaultConnectionError: React.FC = () => (
  <View style={connectionStyles.emptyState}>
    <MaterialCommunityIcons name="alert-circle-outline" size={32} color={connectionColors.error} />
    <Text style={connectionStyles.emptyStateText}>
      Connection error occurred
    </Text>
  </View>
);

// Retry hook for failed operations
export function useRetry(operation: () => Promise<void>, maxRetries: number = 3) {
  const [retryCount, setRetryCount] = React.useState(0);
  const [isRetrying, setIsRetrying] = React.useState(false);

  const retry = React.useCallback(async () => {
    if (retryCount >= maxRetries) return;
    
    setIsRetrying(true);
    try {
      await operation();
      setRetryCount(0);
    } catch (error) {
      setRetryCount(prev => prev + 1);
    } finally {
      setIsRetrying(false);
    }
  }, [operation, retryCount, maxRetries]);

  return { retry, retryCount, isRetrying, canRetry: retryCount < maxRetries };
}