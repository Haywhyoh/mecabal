import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  RefreshControl,
  TouchableOpacity,
} from 'react-native';
import { useNavigation } from '@react-navigation/native';
import MaterialCommunityIcons from '@expo/vector-icons/MaterialCommunityIcons';
import { visitorApi, VisitorPass } from '../../services/api/visitorApi';
import { VisitorPassCard } from '../../components/VisitorPassCard';
import { useAuth } from '../../contexts/AuthContext';
import { useLocation } from '../../contexts/LocationContext';
import Toast from 'react-native-toast-message';
import { LoadingState, ErrorState, EmptyState } from '../../components/ui';

export const VisitorManagementScreen: React.FC = () => {
  const navigation = useNavigation();
  const { user } = useAuth();
  const { primaryLocation } = useLocation();
  const [passes, setPasses] = useState<VisitorPass[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Get estateId from multiple sources with fallback
  const estateId = 
    primaryLocation?.neighborhoodId || 
    user?.primaryLocationId || 
    user?.userNeighborhoods?.find((neighborhood) => neighborhood.isPrimary)?.id;

  useEffect(() => {
    loadPasses();
  }, [estateId]);

  const loadPasses = async () => {
    if (!estateId) {
      setError('No estate selected');
      setLoading(false);
      return;
    }

    try {
      setError(null);
      const data = await visitorApi.getMyVisitorPasses(estateId);
      setPasses(data);
    } catch (err: any) {
      setError(err.message || 'Failed to load visitor passes');
      Toast.show({
        type: 'error',
        text1: 'Error',
        text2: err.message || 'Failed to load visitor passes',
      });
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  const handleRefresh = () => {
    setRefreshing(true);
    loadPasses();
  };

  const handleResendCode = async (pass: VisitorPass) => {
    if (!estateId) return;

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

  const handleRevoke = async (pass: VisitorPass) => {
    if (!estateId) return;

    try {
      await visitorApi.revokeVisitorPass(estateId, pass.id);
      Toast.show({
        type: 'success',
        text1: 'Pass revoked',
        text2: 'Visitor pass has been revoked',
      });
      loadPasses();
    } catch (err: any) {
      Toast.show({
        type: 'error',
        text1: 'Error',
        text2: err.message || 'Failed to revoke pass',
      });
    }
  };

  if (loading) {
    return <LoadingState message="Loading visitor passes..." />;
  }

  if (error && passes.length === 0) {
    return (
      <ErrorState
        message={error}
        onRetry={loadPasses}
      />
    );
  }

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.title}>Visitor Management</Text>
        <TouchableOpacity
          style={styles.addButton}
          onPress={() => navigation.navigate('PreRegisterVisitor' as never)}
        >
          <MaterialCommunityIcons name="plus" size={24} color="#FFFFFF" />
        </TouchableOpacity>
      </View>

      <ScrollView
        style={styles.content}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={handleRefresh} />
        }
      >
        {passes.length === 0 ? (
          <EmptyState
            icon="account-group"
            title="No visitor passes"
            message="Pre-register a visitor to get started"
            actionLabel="Pre-register Visitor"
            onAction={() => navigation.navigate('PreRegisterVisitor' as never)}
          />
        ) : (
          passes.map((pass) => (
            <VisitorPassCard
              key={pass.id}
              pass={pass}
              onPress={() =>
                navigation.navigate('VisitorPass', { passId: pass.id } as never)
              }
              onResendCode={() => handleResendCode(pass)}
              onRevoke={() => handleRevoke(pass)}
            />
          ))
        )}
      </ScrollView>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F5F5F5',
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 16,
    backgroundColor: '#FFFFFF',
    borderBottomWidth: 1,
    borderBottomColor: '#E0E0E0',
  },
  title: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#000',
  },
  addButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: '#00A651',
    justifyContent: 'center',
    alignItems: 'center',
  },
  content: {
    flex: 1,
    padding: 16,
  },
});

