import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { VisitorPass } from '../services/api/visitorApi';
import { format } from 'date-fns';

interface VisitorPassCardProps {
  pass: VisitorPass;
  onPress?: () => void;
  onResendCode?: () => void;
  onRevoke?: () => void;
}

export const VisitorPassCard: React.FC<VisitorPassCardProps> = ({
  pass,
  onPress,
  onResendCode,
  onRevoke,
}) => {
  const getStatusColor = (status: string) => {
    switch (status) {
      case 'PENDING':
        return '#FFA500';
      case 'ACTIVE':
      case 'CHECKED_IN':
        return '#00A651';
      case 'CHECKED_OUT':
        return '#666';
      case 'EXPIRED':
      case 'REVOKED':
        return '#FF0000';
      default:
        return '#666';
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'PENDING':
        return 'clock-outline';
      case 'ACTIVE':
        return 'check-circle';
      case 'CHECKED_IN':
        return 'login';
      case 'CHECKED_OUT':
        return 'logout';
      case 'EXPIRED':
        return 'alert-circle';
      case 'REVOKED':
        return 'cancel';
      default:
        return 'help-circle';
    }
  };

  return (
    <TouchableOpacity
      style={styles.card}
      onPress={onPress}
      activeOpacity={0.7}
    >
      <View style={styles.header}>
        <View style={styles.headerLeft}>
          <Text style={styles.visitorName}>
            {pass.visitor?.fullName || 'Unknown Visitor'}
          </Text>
          <Text style={styles.estateName}>{pass.estate?.name || 'Unknown Estate'}</Text>
        </View>
        <View
          style={[
            styles.statusBadge,
            { backgroundColor: getStatusColor(pass.status) + '20' },
          ]}
        >
          <MaterialCommunityIcons
            name={getStatusIcon(pass.status) as any}
            size={16}
            color={getStatusColor(pass.status)}
          />
          <Text
            style={[styles.statusText, { color: getStatusColor(pass.status) }]}
          >
            {pass.status.replace('_', ' ')}
          </Text>
        </View>
      </View>

      <View style={styles.details}>
        <View style={styles.detailRow}>
          <MaterialCommunityIcons name="calendar-clock" size={16} color="#666" />
          <Text style={styles.detailText}>
            {format(new Date(pass.expectedArrival), 'MMM dd, yyyy HH:mm')}
          </Text>
        </View>
        {pass.accessCode && (
          <View style={styles.detailRow}>
            <MaterialCommunityIcons name="key" size={16} color="#666" />
            <Text style={styles.detailText}>Code: {pass.accessCode}</Text>
          </View>
        )}
        {pass.purpose && (
          <View style={styles.detailRow}>
            <MaterialCommunityIcons name="information" size={16} color="#666" />
            <Text style={styles.detailText} numberOfLines={1}>
              {pass.purpose}
            </Text>
          </View>
        )}
      </View>

      {(onResendCode || onRevoke) && (
        <View style={styles.actions}>
          {onResendCode && pass.status !== 'REVOKED' && (
            <TouchableOpacity
              style={styles.actionButton}
              onPress={(e) => {
                e.stopPropagation();
                onResendCode();
              }}
            >
              <MaterialCommunityIcons name="send" size={16} color="#00A651" />
              <Text style={styles.actionText}>Resend</Text>
            </TouchableOpacity>
          )}
          {onRevoke && pass.status !== 'REVOKED' && pass.status !== 'CHECKED_OUT' && (
            <TouchableOpacity
              style={[styles.actionButton, styles.revokeButton]}
              onPress={(e) => {
                e.stopPropagation();
                onRevoke();
              }}
            >
              <MaterialCommunityIcons name="cancel" size={16} color="#FF0000" />
              <Text style={[styles.actionText, styles.revokeText]}>Revoke</Text>
            </TouchableOpacity>
          )}
        </View>
      )}
    </TouchableOpacity>
  );
};

const styles = StyleSheet.create({
  card: {
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    padding: 16,
    marginBottom: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 12,
  },
  headerLeft: {
    flex: 1,
  },
  visitorName: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#000',
    marginBottom: 4,
  },
  estateName: {
    fontSize: 14,
    color: '#666',
  },
  statusBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 12,
    gap: 4,
  },
  statusText: {
    fontSize: 12,
    fontWeight: '600',
    textTransform: 'capitalize',
  },
  details: {
    gap: 8,
    marginBottom: 12,
  },
  detailRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  detailText: {
    fontSize: 14,
    color: '#666',
  },
  actions: {
    flexDirection: 'row',
    gap: 12,
    paddingTop: 12,
    borderTopWidth: 1,
    borderTopColor: '#F0F0F0',
  },
  actionButton: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 6,
    backgroundColor: '#F0F0F0',
    gap: 6,
  },
  revokeButton: {
    backgroundColor: '#FFE5E5',
  },
  actionText: {
    fontSize: 14,
    color: '#00A651',
    fontWeight: '500',
  },
  revokeText: {
    color: '#FF0000',
  },
});

