import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  TouchableOpacity,
  SafeAreaView,
  ActivityIndicator,
  RefreshControl,
  Alert,
} from 'react-native';
import MaterialCommunityIcons from '@expo/vector-icons/MaterialCommunityIcons';
import { ScreenHeader } from '../../components/ui';
import { businessServiceApi } from '../../services/api';
import { BusinessService } from '../../services/types/business.types';
import { businessApi } from '../../services/api';
import { formatNairaCurrency } from '../../constants/businessData';

interface ManageServicesScreenProps {
  navigation?: any;
}

export default function ManageServicesScreen({ navigation }: ManageServicesScreenProps) {
  const [services, setServices] = useState<BusinessService[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [businessId, setBusinessId] = useState<string | null>(null);

  useEffect(() => {
    loadBusinessAndServices();
  }, []);

  const loadBusinessAndServices = async () => {
    try {
      setLoading(true);
      const business = await businessApi.getMyBusiness();
      if (business) {
        setBusinessId(business.id);
        const servicesData = await businessServiceApi.getBusinessServices(business.id);
        setServices(servicesData);
      } else {
        Alert.alert(
          'No Business Profile',
          'You need to create a business profile first.',
          [
            {
              text: 'OK',
              onPress: () => navigation?.goBack(),
            },
          ]
        );
      }
    } catch (error: any) {
      console.error('Error loading services:', error);
      Alert.alert('Error', error.message || 'Failed to load services');
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  const handleRefresh = () => {
    setRefreshing(true);
    loadBusinessAndServices();
  };

  const handleCreateService = () => {
    if (businessId) {
      navigation?.navigate('CreateService', { businessId });
    }
  };

  const handleEditService = (service: BusinessService) => {
    navigation?.navigate('EditService', { service });
  };

  const handleToggleActive = async (service: BusinessService) => {
    try {
      const updated = await businessServiceApi.toggleServiceActive(service.id);
      setServices(services.map(s => s.id === service.id ? updated : s));
    } catch (error: any) {
      Alert.alert('Error', error.message || 'Failed to update service status');
    }
  };

  const handleDeleteService = (service: BusinessService) => {
    Alert.alert(
      'Delete Service',
      `Are you sure you want to delete "${service.serviceName}"?`,
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Delete',
          style: 'destructive',
          onPress: async () => {
            try {
              await businessServiceApi.deleteBusinessService(service.id);
              setServices(services.filter(s => s.id !== service.id));
              Alert.alert('Success', 'Service deleted successfully');
            } catch (error: any) {
              Alert.alert('Error', error.message || 'Failed to delete service');
            }
          },
        },
      ]
    );
  };

  const renderServiceItem = ({ item }: { item: BusinessService }) => {
    const priceRange =
      item.priceMin && item.priceMax
        ? `${formatNairaCurrency(item.priceMin)} - ${formatNairaCurrency(item.priceMax)}`
        : item.priceMin
        ? `From ${formatNairaCurrency(item.priceMin)}`
        : 'Price on request';

    return (
      <View style={styles.serviceCard}>
        <View style={styles.serviceHeader}>
          <View style={styles.serviceInfo}>
            <View style={styles.serviceNameRow}>
              <Text style={styles.serviceName}>{item.serviceName}</Text>
              {!item.isActive && (
                <View style={styles.inactiveBadge}>
                  <Text style={styles.inactiveText}>Inactive</Text>
                </View>
              )}
            </View>
            {item.description && (
              <Text style={styles.serviceDescription} numberOfLines={2}>
                {item.description}
              </Text>
            )}
            <View style={styles.serviceDetails}>
              <View style={styles.priceContainer}>
                <MaterialCommunityIcons name="currency-ngn" size={14} color="#00A651" />
                <Text style={styles.priceText}>{priceRange}</Text>
              </View>
              {item.duration && (
                <View style={styles.durationContainer}>
                  <MaterialCommunityIcons name="clock-outline" size={14} color="#8E8E93" />
                  <Text style={styles.durationText}>{item.duration}</Text>
                </View>
              )}
            </View>
          </View>
        </View>

        <View style={styles.serviceActions}>
          <TouchableOpacity
            style={styles.actionButton}
            onPress={() => handleToggleActive(item)}
          >
            <MaterialCommunityIcons
              name={item.isActive ? 'eye-off' : 'eye'}
              size={18}
              color="#8E8E93"
            />
            <Text style={styles.actionText}>
              {item.isActive ? 'Deactivate' : 'Activate'}
            </Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={styles.actionButton}
            onPress={() => handleEditService(item)}
          >
            <MaterialCommunityIcons name="pencil" size={18} color="#0066CC" />
            <Text style={[styles.actionText, { color: '#0066CC' }]}>Edit</Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={styles.actionButton}
            onPress={() => handleDeleteService(item)}
          >
            <MaterialCommunityIcons name="delete" size={18} color="#FF3B30" />
            <Text style={[styles.actionText, { color: '#FF3B30' }]}>Delete</Text>
          </TouchableOpacity>
        </View>
      </View>
    );
  };

  if (loading && !refreshing) {
    return (
      <SafeAreaView style={styles.container}>
        <ScreenHeader title="Manage Services" navigation={navigation} />
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color="#00A651" />
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.container}>
      <ScreenHeader
        title="Manage Services"
        navigation={navigation}
        rightComponent={
          <TouchableOpacity onPress={handleCreateService}>
            <MaterialCommunityIcons name="plus" size={24} color="#00A651" />
          </TouchableOpacity>
        }
      />
      <View style={styles.content}>
        <FlatList
          data={services}
          renderItem={renderServiceItem}
          keyExtractor={(item) => item.id}
          contentContainerStyle={styles.listContent}
          refreshControl={
            <RefreshControl
              refreshing={refreshing}
              onRefresh={handleRefresh}
              tintColor="#00A651"
            />
          }
          ListEmptyComponent={
            <View style={styles.emptyState}>
              <MaterialCommunityIcons name="wrench" size={64} color="#8E8E93" />
              <Text style={styles.emptyText}>No services yet</Text>
              <Text style={styles.emptySubtext}>
                Add your first service to get started
              </Text>
              <TouchableOpacity
                style={styles.addButton}
                onPress={handleCreateService}
              >
                <Text style={styles.addButtonText}>Add Service</Text>
              </TouchableOpacity>
            </View>
          }
        />
      </View>
      {services.length > 0 && (
        <View style={styles.footer}>
          <TouchableOpacity
            style={styles.fab}
            onPress={handleCreateService}
          >
            <MaterialCommunityIcons name="plus" size={24} color="#FFFFFF" />
          </TouchableOpacity>
        </View>
      )}
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F2F2F7',
  },
  content: {
    flex: 1,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  listContent: {
    padding: 16,
  },
  serviceCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    padding: 16,
    marginBottom: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 2,
    elevation: 2,
  },
  serviceHeader: {
    marginBottom: 12,
  },
  serviceInfo: {
    flex: 1,
  },
  serviceNameRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 8,
  },
  serviceName: {
    fontSize: 18,
    fontWeight: '600',
    color: '#1C1C1E',
    flex: 1,
  },
  inactiveBadge: {
    backgroundColor: '#FFE5E5',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 12,
    marginLeft: 8,
  },
  inactiveText: {
    fontSize: 10,
    color: '#FF3B30',
    fontWeight: '500',
  },
  serviceDescription: {
    fontSize: 14,
    color: '#8E8E93',
    marginBottom: 8,
    lineHeight: 20,
  },
  serviceDetails: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 16,
  },
  priceContainer: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  priceText: {
    fontSize: 14,
    fontWeight: '500',
    color: '#00A651',
    marginLeft: 4,
  },
  durationContainer: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  durationText: {
    fontSize: 14,
    color: '#8E8E93',
    marginLeft: 4,
  },
  serviceActions: {
    flexDirection: 'row',
    borderTopWidth: 1,
    borderTopColor: '#F0F0F0',
    paddingTop: 12,
    gap: 12,
  },
  actionButton: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 8,
    borderRadius: 8,
    backgroundColor: '#F2F2F7',
  },
  actionText: {
    fontSize: 12,
    color: '#8E8E93',
    marginLeft: 4,
    fontWeight: '500',
  },
  emptyState: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 60,
  },
  emptyText: {
    fontSize: 18,
    fontWeight: '500',
    color: '#8E8E93',
    marginTop: 16,
  },
  emptySubtext: {
    fontSize: 14,
    color: '#8E8E93',
    marginTop: 8,
    marginBottom: 24,
  },
  addButton: {
    backgroundColor: '#00A651',
    paddingHorizontal: 24,
    paddingVertical: 12,
    borderRadius: 8,
  },
  addButtonText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#FFFFFF',
  },
  footer: {
    position: 'absolute',
    bottom: 20,
    right: 20,
  },
  fab: {
    width: 56,
    height: 56,
    borderRadius: 28,
    backgroundColor: '#00A651',
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.25,
    shadowRadius: 4,
    elevation: 5,
  },
});









