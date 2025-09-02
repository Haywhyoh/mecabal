import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';
import MaterialCommunityIcons from '@expo/vector-icons/MaterialCommunityIcons';
import { NeighborConnectionComponentProps, ConnectionAction, ConnectionType } from '../../types/connectionTypes';
import { ConnectionService } from '../../services/connectionService';
import { connectionStyles, connectionColors, connectionSizes } from '../../styles/connectionStyles';
import TrustScoreDisplay from './TrustScoreDisplay';
import ConnectionActionButtons from './ConnectionActionButtons';

export default function NeighborConnectionCard({
  neighborProfile,
  currentConnection,
  userId,
  compactMode = false,
  showConnectionButton = true,
  showTrustScore = true,
  showRequestBadge = true,
  pendingRequestCount = 0,
  onConnectionChange,
  onRequestAction
}: NeighborConnectionComponentProps) {
  
  const handleConnectionAction = (action: ConnectionAction, connectionType?: ConnectionType) => {
    if (onConnectionChange) {
      onConnectionChange(action, connectionType || 'connect');
    }
  };

  const renderAvatar = () => {
    const avatarSize = compactMode ? connectionSizes.avatarSmall : connectionSizes.avatarLarge;
    const fontSize = compactMode ? 12 : 18;
    
    return (
      <View style={[
        connectionStyles.avatar, 
        { 
          width: avatarSize, 
          height: avatarSize, 
          borderRadius: avatarSize / 2 
        }
      ]}>
        <Text style={[connectionStyles.avatarText, { fontSize }]}>
          {neighborProfile.firstName.charAt(0)}{neighborProfile.lastName.charAt(0)}
        </Text>
      </View>
    );
  };

  const renderCompactCard = () => {
    return (
      <View style={[connectionStyles.compactContainer, styles.compactRow]}>
        {renderAvatar()}
        
        <View style={styles.compactInfo}>
          <View style={styles.compactHeader}>
            <Text style={[connectionStyles.primaryText, { fontSize: 14 }]}>
              {neighborProfile.displayName}
            </Text>
            {neighborProfile.isVerified && (
              <MaterialCommunityIcons name="check-decagram" size={14} color={connectionColors.success} />
            )}
          </View>
          
          <View style={styles.locationRow}>
            <MaterialCommunityIcons name="map-marker" size={12} color={connectionColors.textSecondary} />
            <Text style={[connectionStyles.captionText, { marginLeft: 3 }]}>
              {neighborProfile.building && `${neighborProfile.building}, `}{neighborProfile.estate}
            </Text>
          </View>
          
          {showTrustScore && (
            <View style={styles.trustRow}>
              <TrustScoreDisplay 
                trustScore={neighborProfile.trustScore}
                size="small"
                showLabel={false}
              />
            </View>
          )}
        </View>
        
        {showConnectionButton && (
          <ConnectionActionButtons
            neighborProfile={neighborProfile}
            currentConnection={currentConnection}
            compactMode={true}
            pendingRequestCount={pendingRequestCount}
            onAction={handleConnectionAction}
          />
        )}
      </View>
    );
  };

  const renderFullCard = () => {
    return (
      <View style={connectionStyles.container}>
        {/* Header with avatar and basic info */}
        <View style={styles.headerRow}>
          {renderAvatar()}
          
          <View style={styles.profileInfo}>
            <View style={styles.nameRow}>
              <Text style={connectionStyles.primaryText}>
                {neighborProfile.displayName}
              </Text>
              {neighborProfile.isVerified && (
                <MaterialCommunityIcons 
                  name="check-decagram" 
                  size={16} 
                  color={connectionColors.success} 
                  style={{ marginLeft: 4 }}
                />
              )}
            </View>
            
            <View style={styles.locationRow}>
              <MaterialCommunityIcons 
                name="map-marker" 
                size={14} 
                color={connectionColors.textSecondary} 
              />
              <Text style={[connectionStyles.secondaryText, { marginLeft: 4 }]}>
                {neighborProfile.building ? `${neighborProfile.building}, ` : ''}{neighborProfile.estate}
              </Text>
            </View>
            
            {neighborProfile.bio && (
              <Text 
                style={[connectionStyles.secondaryText, styles.bioText]} 
                numberOfLines={2}
              >
                {neighborProfile.bio}
              </Text>
            )}
          </View>
        </View>

        {/* Stats row */}
        <View style={styles.statsRow}>
          {showTrustScore && (
            <TrustScoreDisplay 
              trustScore={neighborProfile.trustScore}
              size="medium"
              showLabel={true}
            />
          )}
          
          <View style={styles.connectionStats}>
            <Text style={connectionStyles.captionText}>
              {ConnectionService.formatConnectionCount(neighborProfile.connectionStats.totalConnections)}
            </Text>
            <Text style={[connectionStyles.captionText, { marginHorizontal: 4 }]}>•</Text>
            <Text style={connectionStyles.captionText}>
              Joined {neighborProfile.joinedDate}
            </Text>
          </View>
        </View>

        {/* Interests */}
        {neighborProfile.interests.length > 0 && (
          <View style={styles.interestsSection}>
            <Text style={[connectionStyles.captionText, { marginBottom: 4 }]}>
              Interests:
            </Text>
            <View style={styles.interestsList}>
              {neighborProfile.interests.slice(0, 3).map((interest, index) => (
                <View key={index} style={connectionStyles.interestTag}>
                  <Text style={connectionStyles.interestText}>{interest}</Text>
                </View>
              ))}
              {neighborProfile.interests.length > 3 && (
                <Text style={connectionStyles.captionText}>
                  +{neighborProfile.interests.length - 3}
                </Text>
              )}
            </View>
          </View>
        )}

        {/* Action buttons */}
        {showConnectionButton && (
          <ConnectionActionButtons
            neighborProfile={neighborProfile}
            currentConnection={currentConnection}
            compactMode={false}
            pendingRequestCount={pendingRequestCount}
            onAction={handleConnectionAction}
          />
        )}
        
        {neighborProfile.lastSeen && (
          <View style={styles.lastSeenRow}>
            <MaterialCommunityIcons 
              name="clock-outline" 
              size={12} 
              color={connectionColors.textSecondary} 
            />
            <Text style={[connectionStyles.smallText, { marginLeft: 3 }]}>
              Last seen {ConnectionService.formatLastSeen(neighborProfile.lastSeen)}
            </Text>
          </View>
        )}
      </View>
    );
  };

  return compactMode ? renderCompactCard() : renderFullCard();
}

const styles = StyleSheet.create({
  // Compact mode styles
  compactRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  
  compactInfo: {
    flex: 1,
    marginLeft: 12,
  },
  
  compactHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 2,
  },

  // Full mode styles  
  headerRow: {
    flexDirection: 'row',
    marginBottom: 12,
  },
  
  profileInfo: {
    flex: 1,
    marginLeft: 12,
  },
  
  nameRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 4,
  },
  
  locationRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 4,
  },
  
  bioText: {
    marginTop: 4,
    lineHeight: 18,
  },
  
  statsRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 12,
  },
  
  connectionStats: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  
  interestsSection: {
    marginBottom: 12,
  },
  
  interestsList: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    alignItems: 'center',
  },
  
  trustRow: {
    marginTop: 2,
  },
  
  lastSeenRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 8,
    paddingTop: 8,
    borderTopWidth: 1,
    borderTopColor: '#F5F5F5',
  },
});