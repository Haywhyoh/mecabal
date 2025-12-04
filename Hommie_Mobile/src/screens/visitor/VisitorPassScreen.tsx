import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Alert,
  SafeAreaView,
} from 'react-native';
import { useNavigation, useRoute } from '@react-navigation/native';
import MaterialCommunityIcons from '@expo/vector-icons/MaterialCommunityIcons';
import { visitorApi, VisitorPass } from '../../services/api/visitorApi';
import { QRCodeDisplay } from '../../components/QRCodeDisplay';
import { AccessCodeDisplay } from '../../components/AccessCodeDisplay';
import { useAuth } from '../../contexts/AuthContext';
import { useLocation } from '../../contexts/LocationContext';
import Toast from 'react-native-toast-message';
import { LoadingState, ErrorState, ScreenHeader } from '../../components/ui';
import { format } from 'date-fns';

export const VisitorPassScreen: React.FC = () => {
  const navigation = useNavigation();
  const route = useRoute();
  const { user } = useAuth();
  const { primaryLocation } = useLocation();
  // Get estateId from multiple sources with fallback
  const estateId = 
    primaryLocation?.neighborhoodId || 
    user?.primaryLocationId || 
    user?.userNeighborhoods?.find((neighborhood) => neighborhood.isPrimary)?.id;

  const { passId } = (route.params as any) || {};
  const [pass, setPass] = useState<VisitorPass | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (passId && estateId) {
      loadPass();
    }
  }, [passId, estateId]);

  const loadPass = async () => {
    if (!estateId || !passId) {
      setError('Missing required information');
      setLoading(false);
      return;
    }

    try {
      setError(null);
      const data = await visitorApi.getVisitorPass(estateId, passId);
      setPass(data);
    } catch (err: any) {
      setError(err.message || 'Failed to load visitor pass');
      Toast.show({
        type: 'error',
        text1: 'Error',
        text2: err.message || 'Failed to load visitor pass',
      });
    } finally {
      setLoading(false);
    }
  };

  const handleResendCode = async () => {
    if (!estateId || !pass) return;

    try {
      const method = pass.sendMethod || 'SMS';
      await visitorApi.sendVisitorCode(estateId, pass.id, method);
      Toast.show({
        type: 'success',
        text1: 'Code sent',
        text2: `Access code sent via ${method}`,
      });
    } catch (err: any) {
      Toast.show({
        type: 'error',
        text1: 'Error',
        text2: err.message || 'Failed to send code',
      });
    }
  };

  const handleRevoke = () => {
    if (!pass) return;

    Alert.alert(
      'Revoke Pass',
      'Are you sure you want to revoke this visitor pass?',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Revoke',
          style: 'destructive',
          onPress: async () => {
            if (!estateId) return;
            try {
              await visitorApi.revokeVisitorPass(estateId, pass.id);
              Toast.show({
                type: 'success',
                text1: 'Pass revoked',
                text2: 'Visitor pass has been revoked',
              });
              navigation.goBack();
            } catch (err: any) {
              Toast.show({
                type: 'error',
                text1: 'Error',
                text2: err.message || 'Failed to revoke pass',
              });
            }
          },
        },
      ],
    );
  };

  if (loading) {
    return <LoadingState message="Loading visitor pass..." />;
  }

  if (error || !pass) {
    return (
      <ErrorState
        message={error || 'Visitor pass not found'}
        onRetry={loadPass}
      />
    );
  }

  return (
    <SafeAreaView style={styles.container}>
      <ScreenHeader
        title="Visitor Pass"
        navigation={navigation}
        showBackButton={true}
      />
      <ScrollView style={styles.scrollView}>
        <View style={styles.content}>
          <View style={styles.header}>
            <Text style={styles.visitorName}>{pass.visitor?.fullName || 'Unknown Visitor'}</Text>
            <View
              style={[
                styles.statusBadge,
                {
                  backgroundColor:
                    pass.status === 'PENDING'
                      ? '#FFA50020'
                      : pass.status === 'CHECKED_IN'
                      ? '#00A65120'
                      : '#66620',
                },
              ]}
            >
              <Text
                style={[
                  styles.statusText,
                  {
                    color:
                      pass.status === 'PENDING'
                        ? '#FFA500'
                        : pass.status === 'CHECKED_IN'
                        ? '#00A651'
                        : '#666',
                  },
                ]}
              >
                {pass.status.replace('_', ' ')}
              </Text>
            </View>
          </View>

        {pass.qrCode && (
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>QR Code</Text>
            <QRCodeDisplay value={pass.qrCode} size={250} />
          </View>
        )}

        {pass.accessCode && (
          <View style={styles.section}>
            <AccessCodeDisplay code={pass.accessCode} />
          </View>
        )}

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Visit Details</Text>
          <View style={styles.detailRow}>
            <MaterialCommunityIcons name="calendar-clock" size={20} color="#666" />
            <View style={styles.detailContent}>
              <Text style={styles.detailLabel}>Expected Arrival</Text>
              <Text style={styles.detailValue}>
                {format(new Date(pass.expectedArrival), 'MMM dd, yyyy HH:mm')}
              </Text>
            </View>
          </View>
          <View style={styles.detailRow}>
            <MaterialCommunityIcons name="calendar-alert" size={20} color="#666" />
            <View style={styles.detailContent}>
              <Text style={styles.detailLabel}>Expires At</Text>
              <Text style={styles.detailValue}>
                {format(new Date(pass.expiresAt), 'MMM dd, yyyy HH:mm')}
              </Text>
            </View>
          </View>
          {pass.purpose && (
            <View style={styles.detailRow}>
              <MaterialCommunityIcons name="information" size={20} color="#666" />
              <View style={styles.detailContent}>
                <Text style={styles.detailLabel}>Purpose</Text>
                <Text style={styles.detailValue}>{pass.purpose}</Text>
              </View>
            </View>
          )}
          {pass.visitor?.phoneNumber && (
            <View style={styles.detailRow}>
              <MaterialCommunityIcons name="phone" size={20} color="#666" />
              <View style={styles.detailContent}>
                <Text style={styles.detailLabel}>Phone</Text>
                <Text style={styles.detailValue}>{pass.visitor.phoneNumber}</Text>
              </View>
            </View>
          )}
          {pass.visitor?.email && (
            <View style={styles.detailRow}>
              <MaterialCommunityIcons name="email" size={20} color="#666" />
              <View style={styles.detailContent}>
                <Text style={styles.detailLabel}>Email</Text>
                <Text style={styles.detailValue}>{pass.visitor.email}</Text>
              </View>
            </View>
          )}
        </View>

        {pass.status !== 'REVOKED' && pass.status !== 'CHECKED_OUT' && (
          <View style={styles.actions}>
            {pass.accessCode && (
              <TouchableOpacity style={styles.actionButton} onPress={handleResendCode}>
                <MaterialCommunityIcons name="send" size={20} color="#00A651" />
                <Text style={styles.actionText}>Resend Code</Text>
              </TouchableOpacity>
            )}
            <TouchableOpacity
              style={[styles.actionButton, styles.revokeButton]}
              onPress={handleRevoke}
            >
              <MaterialCommunityIcons name="cancel" size={20} color="#FF0000" />
              <Text style={[styles.actionText, styles.revokeText]}>Revoke Pass</Text>
            </TouchableOpacity>
          </View>
        )}
        </View>
      </ScrollView>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#FFFFFF',
  },
  scrollView: {
    flex: 1,
    backgroundColor: '#F5F5F5',
  },
  content: {
    padding: 16,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 24,
  },
  visitorName: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#000',
    flex: 1,
  },
  statusBadge: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 12,
  },
  statusText: {
    fontSize: 12,
    fontWeight: '600',
    textTransform: 'capitalize',
  },
  section: {
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    padding: 16,
    marginBottom: 16,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#000',
    marginBottom: 16,
  },
  detailRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    marginBottom: 16,
    gap: 12,
  },
  detailContent: {
    flex: 1,
  },
  detailLabel: {
    fontSize: 12,
    color: '#666',
    marginBottom: 4,
  },
  detailValue: {
    fontSize: 16,
    color: '#000',
  },
  actions: {
    flexDirection: 'row',
    gap: 12,
    marginTop: 8,
  },
  actionButton: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    padding: 12,
    borderRadius: 8,
    backgroundColor: '#F0F0F0',
    gap: 8,
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

