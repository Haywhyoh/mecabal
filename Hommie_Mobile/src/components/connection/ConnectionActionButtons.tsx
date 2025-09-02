import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity, Alert } from 'react-native';
import MaterialCommunityIcons from '@expo/vector-icons/MaterialCommunityIcons';
import { ConnectionActionButtonsProps, ConnectionAction, ConnectionType } from '../../types/connectionTypes';
import { ConnectionService } from '../../services/connectionService';
import ConnectionStatusBadge from './ConnectionStatusBadge';

export default function ConnectionActionButtons({
  neighborProfile,
  currentConnection,
  loading = false,
  compactMode = false,
  pendingRequestCount = 0,
  onAction
}: ConnectionActionButtonsProps) {
  
  const connectionStatus = ConnectionService.getConnectionStatus(currentConnection);
  const connectionType = currentConnection ? ConnectionService.getConnectionTypeInfo(currentConnection.connectionType) : null;

  const handleAction = (action: ConnectionAction, connectionType?: ConnectionType) => {
    const actionLabel = ConnectionService.getActionLabel(action);
    const message = ConnectionService.getActionMessage(action, neighborProfile.displayName);
    const isDestructive = ConnectionService.isDestructiveAction(action);

    Alert.alert(
      actionLabel,
      message,
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: actionLabel,
          style: isDestructive ? 'destructive' : 'default',
          onPress: () => onAction(action, connectionType)
        }
      ]
    );
  };

  const renderPendingRequestBadge = () => {
    if (pendingRequestCount === 0) return null;
    
    return (
      <View style={styles.requestBadge}>
        <Text style={styles.requestBadgeText}>
          {pendingRequestCount > 9 ? '9+' : pendingRequestCount}
        </Text>
      </View>
    );
  };

  // No connection state
  if (connectionStatus === 'none') {
    if (compactMode) {
      return (
        <View style={styles.compactActions}>
          <TouchableOpacity 
            style={styles.compactConnectButton}
            onPress={() => handleAction('connect', 'connect')}
            disabled={loading}
          >
            <MaterialCommunityIcons name="account-plus" size={14} color="#00A651" />
            {renderPendingRequestBadge()}
          </TouchableOpacity>
        </View>
      );
    }

    return (
      <View style={styles.connectionActions}>
        <TouchableOpacity 
          style={[styles.actionButton, styles.followButton]}
          onPress={() => handleAction('follow', 'follow')}
          disabled={loading}
        >
          <MaterialCommunityIcons name="account-plus" size={16} color="#0066CC" />
          <Text style={[styles.actionButtonText, styles.followButtonText]}>Follow</Text>
        </TouchableOpacity>
        
        <TouchableOpacity 
          style={[styles.actionButton, styles.connectButton]}
          onPress={() => handleAction('connect', 'connect')}
          disabled={loading}
        >
          <MaterialCommunityIcons name="account-multiple-plus" size={16} color="#FFFFFF" />
          <Text style={[styles.actionButtonText, styles.connectButtonText]}>Connect</Text>
          {renderPendingRequestBadge()}
        </TouchableOpacity>
      </View>
    );
  }

  // Pending connection
  if (connectionStatus === 'pending') {
    return (
      <View style={compactMode ? styles.compactPending : styles.pendingContainer}>
        <MaterialCommunityIcons name="clock-outline" size={compactMode ? 12 : 16} color="#FF6B35" />
        <Text style={compactMode ? styles.compactPendingText : styles.pendingText}>
          {compactMode ? 'Pending' : 'Connection Pending'}
        </Text>
      </View>
    );
  }

  // Accepted connection
  if (connectionStatus === 'accepted' && connectionType) {
    if (compactMode) {
      return (
        <View style={styles.compactConnected}>
          <ConnectionStatusBadge 
            connection={currentConnection}
            size="small"
            showText={false}
          />
          {renderPendingRequestBadge()}
        </View>
      );
    }

    return (
      <View style={styles.connectedActions}>
        <ConnectionStatusBadge 
          connection={currentConnection}
          size="medium"
          showText={true}
        />
        
        {connectionType.id !== 'trusted' && (
          <TouchableOpacity 
            style={styles.upgradeButton}
            onPress={() => handleAction('trust', 'trusted')}
            disabled={loading}
          >
            <MaterialCommunityIcons name="shield-plus" size={14} color="#FF6B35" />
            <Text style={styles.upgradeButtonText}>Trust</Text>
          </TouchableOpacity>
        )}
        
        <TouchableOpacity 
          style={styles.moreButton}
          onPress={() => {
            Alert.alert(
              'Connection Options',
              'Choose an action:',
              [
                { 
                  text: 'Message', 
                  onPress: () => Alert.alert('Message', 'Opening chat...') 
                },
                { 
                  text: 'View Profile', 
                  onPress: () => Alert.alert('Profile', 'Opening profile...') 
                },
                { 
                  text: 'Disconnect', 
                  style: 'destructive', 
                  onPress: () => handleAction('disconnect') 
                },
                { 
                  text: 'Block', 
                  style: 'destructive', 
                  onPress: () => handleAction('block') 
                },
                { text: 'Cancel', style: 'cancel' }
              ]
            );
          }}
        >
          <MaterialCommunityIcons name="dots-vertical" size={16} color="#8E8E8E" />
          {renderPendingRequestBadge()}
        </TouchableOpacity>
      </View>
    );
  }

  return null;
}

const styles = StyleSheet.create({
  // Compact mode styles
  compactActions: {
    marginLeft: 8,
  },
  compactConnectButton: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: '#E8F5E8',
    alignItems: 'center',
    justifyContent: 'center',
    position: 'relative',
  },
  compactConnected: {
    marginLeft: 8,
    position: 'relative',
  },
  compactPending: {
    flexDirection: 'row',
    alignItems: 'center',
    marginLeft: 8,
  },
  compactPendingText: {
    fontSize: 10,
    fontWeight: '600',
    color: '#FF6B35',
    marginLeft: 3,
  },

  // Full mode styles
  connectionActions: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginTop: 12,
  },
  actionButton: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 10,
    borderRadius: 16,
    flex: 1,
    justifyContent: 'center',
  },
  followButton: {
    backgroundColor: '#F0F8FF',
    borderWidth: 1,
    borderColor: '#0066CC',
    marginRight: 8,
  },
  connectButton: {
    backgroundColor: '#00A651',
    marginLeft: 8,
    position: 'relative',
  },
  actionButtonText: {
    fontSize: 14,
    fontWeight: '600',
    marginLeft: 4,
  },
  followButtonText: {
    color: '#0066CC',
  },
  connectButtonText: {
    color: '#FFFFFF',
  },
  
  // Pending state
  pendingContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 12,
    backgroundColor: '#FFF4E6',
    borderRadius: 16,
    marginTop: 12,
  },
  pendingText: {
    fontSize: 14,
    fontWeight: '600',
    color: '#FF6B35',
    marginLeft: 6,
  },
  
  // Connected state
  connectedActions: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginTop: 12,
  },
  upgradeButton: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FFF4E6',
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 12,
    marginLeft: 8,
  },
  upgradeButtonText: {
    fontSize: 11,
    fontWeight: '600',
    color: '#FF6B35',
    marginLeft: 3,
  },
  moreButton: {
    padding: 8,
    marginLeft: 4,
    position: 'relative',
  },
  
  // Request badge
  requestBadge: {
    position: 'absolute',
    top: -4,
    right: -4,
    backgroundColor: '#E74C3C',
    borderRadius: 10,
    minWidth: 20,
    height: 20,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 2,
    borderColor: '#FFFFFF',
    zIndex: 1,
  },
  requestBadgeText: {
    fontSize: 10,
    fontWeight: '700',
    color: '#FFFFFF',
    textAlign: 'center',
  },
});