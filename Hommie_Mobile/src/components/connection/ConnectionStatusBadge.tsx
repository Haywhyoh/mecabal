import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import MaterialCommunityIcons from '@expo/vector-icons/MaterialCommunityIcons';
import { ConnectionStatusBadgeProps } from '../../types/connectionTypes';
import { ConnectionService } from '../../services/connectionService';

export default function ConnectionStatusBadge({
  connection,
  size = 'medium',
  showText = true
}: ConnectionStatusBadgeProps) {
  
  if (!connection) return null;

  const connectionType = ConnectionService.getConnectionTypeInfo(connection.connectionType);
  const status = ConnectionService.getConnectionStatus(connection);

  if (status !== 'accepted') return null;

  const sizeConfig = {
    small: { 
      iconSize: 10, 
      fontSize: 8, 
      padding: 2,
      borderRadius: 6
    },
    medium: { 
      iconSize: 14, 
      fontSize: 11, 
      padding: 4,
      borderRadius: 8
    },
    large: { 
      iconSize: 16, 
      fontSize: 12, 
      padding: 6,
      borderRadius: 10
    }
  };

  const config = sizeConfig[size];

  return (
    <View style={[
      styles.badge, 
      { 
        backgroundColor: connectionType.color + '20',
        padding: config.padding,
        borderRadius: config.borderRadius
      }
    ]}>
      <MaterialCommunityIcons 
        name={connectionType.icon as any} 
        size={config.iconSize} 
        color={connectionType.color} 
      />
      {showText && (
        <Text style={[
          styles.badgeText, 
          { 
            color: connectionType.color,
            fontSize: config.fontSize,
            marginLeft: showText ? 3 : 0
          }
        ]}>
          {connectionType.name}
        </Text>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  badge: {
    flexDirection: 'row',
    alignItems: 'center',
    alignSelf: 'flex-start',
  },
  badgeText: {
    fontWeight: '600',
  },
});