import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
} from 'react-native';
import { visitorApi, UserQRCode } from '../services/api/visitorApi';
import { QRCodeDisplay } from '../components/QRCodeDisplay';
import { LoadingState, ErrorState } from '../components/ui';
import Toast from 'react-native-toast-message';
import { MaterialCommunityIcons } from '@expo/vector-icons';

export const MyQRCodeScreen: React.FC = () => {
  const [qrData, setQrData] = useState<UserQRCode | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    loadQRCode();
  }, []);

  const loadQRCode = async () => {
    try {
      setError(null);
      const data = await visitorApi.getUserQRCode();
      setQrData(data);
    } catch (err: any) {
      setError(err.message || 'Failed to load QR code');
      Toast.show({
        type: 'error',
        text1: 'Error',
        text2: err.message || 'Failed to load QR code',
      });
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return <LoadingState message="Generating QR code..." />;
  }

  if (error || !qrData) {
    return (
      <ErrorState
        message={error || 'Failed to generate QR code'}
        onRetry={loadQRCode}
      />
    );
  }

  return (
    <ScrollView style={styles.container}>
      <View style={styles.content}>
        <View style={styles.header}>
          <Text style={styles.title}>My QR Code</Text>
          <Text style={styles.subtitle}>
            Share this QR code for identification at gates and security checkpoints
          </Text>
        </View>

        <View style={styles.qrSection}>
          <QRCodeDisplay value={qrData.qrCode} size={280} />
        </View>

        <View style={styles.infoSection}>
          <Text style={styles.sectionTitle}>Profile Information</Text>
          
          <View style={styles.infoRow}>
            <MaterialCommunityIcons name="account" size={20} color="#666" />
            <View style={styles.infoContent}>
              <Text style={styles.infoLabel}>Name</Text>
              <Text style={styles.infoValue}>{qrData.data.fullName}</Text>
            </View>
          </View>

          {qrData.data.phoneNumber && (
            <View style={styles.infoRow}>
              <MaterialCommunityIcons name="phone" size={20} color="#666" />
              <View style={styles.infoContent}>
                <Text style={styles.infoLabel}>Phone</Text>
                <Text style={styles.infoValue}>{qrData.data.phoneNumber}</Text>
              </View>
            </View>
          )}

          <View style={styles.infoRow}>
            <MaterialCommunityIcons name="email" size={20} color="#666" />
            <View style={styles.infoContent}>
              <Text style={styles.infoLabel}>Email</Text>
              <Text style={styles.infoValue}>{qrData.data.email}</Text>
            </View>
          </View>

          {qrData.data.estateName && (
            <View style={styles.infoRow}>
              <MaterialCommunityIcons name="home" size={20} color="#666" />
              <View style={styles.infoContent}>
                <Text style={styles.infoLabel}>Estate</Text>
                <Text style={styles.infoValue}>{qrData.data.estateName}</Text>
              </View>
            </View>
          )}

          <View style={styles.infoRow}>
            <MaterialCommunityIcons
              name={qrData.data.verified ? 'check-circle' : 'alert-circle'}
              size={20}
              color={qrData.data.verified ? '#00A651' : '#FFA500'}
            />
            <View style={styles.infoContent}>
              <Text style={styles.infoLabel}>Verification Status</Text>
              <Text
                style={[
                  styles.infoValue,
                  { color: qrData.data.verified ? '#00A651' : '#FFA500' },
                ]}
              >
                {qrData.data.verified ? 'Verified' : 'Not Verified'}
              </Text>
            </View>
          </View>
        </View>

        <View style={styles.noteSection}>
          <MaterialCommunityIcons name="information" size={20} color="#666" />
          <Text style={styles.noteText}>
            This QR code contains your profile information and can be scanned by security
            personnel for quick identification and access verification.
          </Text>
        </View>
      </View>
    </ScrollView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F5F5F5',
  },
  content: {
    padding: 16,
  },
  header: {
    marginBottom: 24,
  },
  title: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#000',
    marginBottom: 8,
  },
  subtitle: {
    fontSize: 14,
    color: '#666',
    lineHeight: 20,
  },
  qrSection: {
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    padding: 24,
    marginBottom: 24,
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  infoSection: {
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
  infoRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    marginBottom: 16,
    gap: 12,
  },
  infoContent: {
    flex: 1,
  },
  infoLabel: {
    fontSize: 12,
    color: '#666',
    marginBottom: 4,
  },
  infoValue: {
    fontSize: 16,
    color: '#000',
  },
  noteSection: {
    flexDirection: 'row',
    backgroundColor: '#E3F2FD',
    borderRadius: 8,
    padding: 12,
    gap: 12,
  },
  noteText: {
    flex: 1,
    fontSize: 12,
    color: '#1976D2',
    lineHeight: 18,
  },
});

