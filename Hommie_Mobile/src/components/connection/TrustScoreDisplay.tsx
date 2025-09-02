import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';
import MaterialCommunityIcons from '@expo/vector-icons/MaterialCommunityIcons';
import { TrustScoreDisplayProps } from '../../types/connectionTypes';
import { ConnectionService } from '../../services/connectionService';

export default function TrustScoreDisplay({
  trustScore,
  size = 'medium',
  showLabel = false,
  interactive = false,
  onPress
}: TrustScoreDisplayProps) {
  
  const trustLevel = ConnectionService.getTrustLevel(trustScore);
  
  const sizeConfig = {
    small: { 
      iconSize: 12, 
      scoreSize: 9, 
      labelSize: 8,
      padding: 3,
      borderRadius: 6
    },
    medium: { 
      iconSize: 16, 
      scoreSize: 11, 
      labelSize: 9,
      padding: 4,
      borderRadius: 8
    },
    large: { 
      iconSize: 20, 
      scoreSize: 14, 
      labelSize: 11,
      padding: 6,
      borderRadius: 10
    }
  };

  const config = sizeConfig[size];

  const TrustContent = () => (
    <View style={[
      styles.container,
      {
        backgroundColor: trustLevel.color + '20',
        padding: config.padding,
        borderRadius: config.borderRadius
      }
    ]}>
      <MaterialCommunityIcons 
        name={trustLevel.icon as any} 
        size={config.iconSize} 
        color={trustLevel.color} 
      />
      <Text style={[
        styles.trustScore, 
        { 
          color: trustLevel.color,
          fontSize: config.scoreSize,
          marginLeft: 3
        }
      ]}>
        {trustScore}
      </Text>
      {showLabel && (
        <Text style={[
          styles.trustLabel, 
          { 
            color: trustLevel.color,
            fontSize: config.labelSize,
            marginLeft: 2
          }
        ]}>
          {trustLevel.name}
        </Text>
      )}
    </View>
  );

  if (interactive && onPress) {
    return (
      <TouchableOpacity onPress={onPress} activeOpacity={0.7}>
        <TrustContent />
      </TouchableOpacity>
    );
  }

  return <TrustContent />;
}

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    alignItems: 'center',
    alignSelf: 'flex-start',
  },
  trustScore: {
    fontWeight: '700',
  },
  trustLabel: {
    fontWeight: '600',
  },
});