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
  Image,
} from 'react-native';
import MaterialCommunityIcons from '@expo/vector-icons/MaterialCommunityIcons';
import { ScreenHeader } from '../../components/ui';
import { businessServiceApi } from '../../services/api';
import { BusinessService, BusinessProfile } from '../../services/types/business.types';
import { formatNairaCurrency } from '../../constants/businessData';
import { useLocation } from '../../contexts/LocationContext';

interface ServiceCategoryScreenProps {
  route: {
    params: {
      category: {
        id: string;
        name: string;
        icon: string;
        color: string;
        description: string;
      };
    };
  };
  navigation?: any;
}

interface ServiceWithBusiness extends BusinessService {
  business: BusinessProfile;
}

export default function ServiceCategoryScreen({ route, navigation }: ServiceCategoryScreenProps) {
  const { category } = route.params;
  const { currentCoordinates } = useLocation();
  const [services, setServices] = useState<ServiceWithBusiness[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    loadServices();
  }, [category.id]);

  const loadServices = async () => {
    try {
      setLoading(true);
      setError(null);
      const servicesData = await businessServiceApi.getServicesByCategory(
        category.id,
        currentCoordinates?.latitude,
        currentCoordinates?.longitude
      );
      setServices(servicesData);
    } catch (err: any) {
      console.error('Error loading services:', err);
      setError(err.message || 'Failed to load services');
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  const handleRefresh = () => {
    setRefreshing(true);
    loadServices();
  };

  const handleServicePress = (service: ServiceWithBusiness) => {
    navigation?.navigate('ServiceDetails', { service, business: service.business });
  };

  const renderServiceItem = ({ item }: { item: ServiceWithBusiness }) => {
    const priceRange =
      item.priceMin && item.priceMax
        ? `${formatNairaCurrency(item.priceMin)} - ${formatNairaCurrency(item.priceMax)}`
        : item.priceMin
        ? `From ${formatNairaCurrency(item.priceMin)}`
        : 'Price on request';

    return (
      <TouchableOpacity
        style={styles.serviceCard}
        onPress={() => handleServicePress(item)}
        activeOpacity={0.7}
      >
        <View style={styles.serviceHeader}>
          <View style={styles.serviceInfo}>
            <Text style={styles.serviceName}>{item.serviceName}</Text>
            {item.business && (
              <View style={styles.businessInfo}>
                <Text style={styles.businessName}>{item.business.businessName}</Text>
                {item.business.isVerified && (
                  <MaterialCommunityIcons
                    name="shield-check"
                    size={16}
                    color="#00A651"
                    style={styles.verifiedBadge}
                  />
                )}
              </View>
            )}
          </View>
          {item.business?.profileImageUrl && (
            <Image
              source={{ uri: item.business.profileImageUrl }}
              style={styles.businessImage}
            />
          )}
        </View>

        {item.description && (
          <Text style={styles.serviceDescription} numberOfLines={2}>
            {item.description}
          </Text>
        )}

        <View style={styles.serviceFooter}>
          <View style={styles.priceContainer}>
            <MaterialCommunityIcons name="currency-ngn" size={16} color="#00A651" />
            <Text style={styles.priceText}>{priceRange}</Text>
          </View>
          {item.duration && (
            <View style={styles.durationContainer}>
              <MaterialCommunityIcons name="clock-outline" size={16} color="#8E8E93" />
              <Text style={styles.durationText}>{item.duration}</Text>
            </View>
          )}
        </View>

        {item.business && (
          <View style={styles.ratingContainer}>
            <MaterialCommunityIcons name="star" size={14} color="#FFC107" />
            <Text style={styles.ratingText}>
              {item.business.rating.toFixed(1)} ({item.business.reviewCount} reviews)
            </Text>
          </View>
        )}
      </TouchableOpacity>
    );
  };

  if (loading && !refreshing) {
    return (
      <SafeAreaView style={styles.container}>
        <ScreenHeader
          title={category.name}
          navigation={navigation}
        />
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color="#00A651" />
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.container}>
      <ScreenHeader
        title={category.name}
        navigation={navigation}
      />
      <View style={styles.content}>
        {error ? (
          <View style={styles.errorContainer}>
            <MaterialCommunityIcons name="alert-circle" size={48} color="#FF3B30" />
            <Text style={styles.errorText}>{error}</Text>
            <TouchableOpacity
              style={styles.retryButton}
              onPress={loadServices}
            >
              <Text style={styles.retryButtonText}>Retry</Text>
            </TouchableOpacity>
          </View>
        ) : (
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
                <Text style={styles.emptyText}>No services available in this category</Text>
                <Text style={styles.emptySubtext}>
                  Check back later or try another category
                </Text>
              </View>
            }
          />
        )}
      </View>
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
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 8,
  },
  serviceInfo: {
    flex: 1,
    marginRight: 12,
  },
  serviceName: {
    fontSize: 18,
    fontWeight: '600',
    color: '#1C1C1E',
    marginBottom: 4,
  },
  businessInfo: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  businessName: {
    fontSize: 14,
    color: '#8E8E93',
    marginRight: 4,
  },
  verifiedBadge: {
    marginLeft: 4,
  },
  businessImage: {
    width: 48,
    height: 48,
    borderRadius: 24,
  },
  serviceDescription: {
    fontSize: 14,
    color: '#8E8E93',
    marginBottom: 12,
    lineHeight: 20,
  },
  serviceFooter: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 8,
  },
  priceContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginRight: 16,
  },
  priceText: {
    fontSize: 16,
    fontWeight: '600',
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
  ratingContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 8,
  },
  ratingText: {
    fontSize: 12,
    color: '#8E8E93',
    marginLeft: 4,
  },
  emptyState: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 60,
  },
  emptyText: {
    fontSize: 16,
    color: '#8E8E93',
    marginTop: 16,
    fontWeight: '500',
  },
  emptySubtext: {
    fontSize: 14,
    color: '#8E8E93',
    marginTop: 8,
  },
  errorContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 32,
  },
  errorText: {
    fontSize: 16,
    color: '#FF3B30',
    marginTop: 16,
    textAlign: 'center',
  },
  retryButton: {
    marginTop: 24,
    paddingHorizontal: 24,
    paddingVertical: 12,
    backgroundColor: '#00A651',
    borderRadius: 8,
  },
  retryButtonText: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: '600',
  },
});

