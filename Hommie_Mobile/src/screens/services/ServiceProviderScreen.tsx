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
import { businessSearchApi } from '../../services/api';
import { BusinessProfile } from '../../services/types/business.types';
import { formatNairaCurrency } from '../../constants/businessData';
import { useLocation } from '../../contexts/LocationContext';

interface ServiceProviderScreenProps {
  route: {
    params: {
      serviceName: string;
      category?: string;
    };
  };
  navigation?: any;
}

export default function ServiceProviderScreen({ route, navigation }: ServiceProviderScreenProps) {
  const { serviceName, category } = route.params;
  const { currentCoordinates } = useLocation();
  const [providers, setProviders] = useState<BusinessProfile[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  useEffect(() => {
    loadProviders();
  }, [category]);

  const loadProviders = async () => {
    try {
      setLoading(true);
      const searchParams: any = {
        verifiedOnly: true,
        limit: 50,
      };

      if (category) {
        searchParams.category = category;
      }

      if (currentCoordinates) {
        searchParams.latitude = currentCoordinates.latitude;
        searchParams.longitude = currentCoordinates.longitude;
      }

      const response = await businessSearchApi.searchBusinesses(searchParams);
      setProviders(response.data || []);
    } catch (error: any) {
      console.error('Error loading providers:', error);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  const handleRefresh = () => {
    setRefreshing(true);
    loadProviders();
  };

  const handleProviderPress = (provider: BusinessProfile) => {
    navigation?.navigate('BusinessDetail', { businessId: provider.id });
  };

  const renderProviderItem = ({ item }: { item: BusinessProfile }) => {
    return (
      <TouchableOpacity
        style={styles.providerCard}
        onPress={() => handleProviderPress(item)}
        activeOpacity={0.7}
      >
        <View style={styles.providerHeader}>
          {item.profileImageUrl ? (
            <Image
              source={{ uri: item.profileImageUrl }}
              style={styles.providerImage}
            />
          ) : (
            <View style={styles.providerImagePlaceholder}>
              <MaterialCommunityIcons name="store" size={24} color="#8E8E93" />
            </View>
          )}
          <View style={styles.providerInfo}>
            <View style={styles.providerNameRow}>
              <Text style={styles.providerName}>{item.businessName}</Text>
              {item.isVerified && (
                <MaterialCommunityIcons
                  name="shield-check"
                  size={20}
                  color="#00A651"
                  style={styles.verifiedIcon}
                />
              )}
            </View>
            <View style={styles.ratingRow}>
              <MaterialCommunityIcons name="star" size={16} color="#FFC107" />
              <Text style={styles.ratingText}>
                {(typeof item.rating === 'number' ? item.rating : 0).toFixed(1)} ({item.reviewCount || 0} reviews)
              </Text>
            </View>
            {item.completedJobs > 0 && (
              <Text style={styles.jobsText}>
                {item.completedJobs} completed jobs
              </Text>
            )}
          </View>
        </View>

        {/* Verification Badges */}
        <View style={styles.badgesContainer}>
          {item.isVerified && (
            <View style={styles.badge}>
              <MaterialCommunityIcons name="shield-check" size={14} color="#00A651" />
              <Text style={styles.badgeText}>Estate Verified</Text>
            </View>
          )}
          {item.hasInsurance && (
            <View style={styles.badge}>
              <MaterialCommunityIcons name="shield" size={14} color="#0066CC" />
              <Text style={styles.badgeText}>Insured</Text>
            </View>
          )}
        </View>

        {/* Service Area */}
        <View style={styles.serviceAreaRow}>
          <MaterialCommunityIcons name="map-marker-radius" size={16} color="#8E8E93" />
          <Text style={styles.serviceAreaText}>
            Service Area: {item.serviceArea.replace('-', ' ')}
          </Text>
        </View>
      </TouchableOpacity>
    );
  };

  if (loading && !refreshing) {
    return (
      <SafeAreaView style={styles.container}>
        <ScreenHeader
          title="Service Providers"
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
        title="Service Providers"
        navigation={navigation}
      />
      <View style={styles.content}>
        <View style={styles.headerSection}>
          <Text style={styles.headerTitle}>Estate-Verified Providers</Text>
          <Text style={styles.headerSubtitle}>
            Trusted service providers in your neighborhood
          </Text>
        </View>

        <FlatList
          data={providers}
          renderItem={renderProviderItem}
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
              <MaterialCommunityIcons name="store-off" size={64} color="#8E8E93" />
              <Text style={styles.emptyText}>No verified providers found</Text>
              <Text style={styles.emptySubtext}>
                Check back later or try another service category
              </Text>
            </View>
          }
        />
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
  headerSection: {
    backgroundColor: '#FFFFFF',
    padding: 20,
    borderBottomWidth: 1,
    borderBottomColor: '#F0F0F0',
  },
  headerTitle: {
    fontSize: 20,
    fontWeight: '700',
    color: '#1C1C1E',
    marginBottom: 4,
  },
  headerSubtitle: {
    fontSize: 14,
    color: '#8E8E93',
  },
  listContent: {
    padding: 16,
  },
  providerCard: {
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
  providerHeader: {
    flexDirection: 'row',
    marginBottom: 12,
  },
  providerImage: {
    width: 56,
    height: 56,
    borderRadius: 28,
    marginRight: 12,
  },
  providerImagePlaceholder: {
    width: 56,
    height: 56,
    borderRadius: 28,
    backgroundColor: '#F0F0F0',
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 12,
  },
  providerInfo: {
    flex: 1,
  },
  providerNameRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 4,
  },
  providerName: {
    fontSize: 18,
    fontWeight: '600',
    color: '#1C1C1E',
  },
  verifiedIcon: {
    marginLeft: 8,
  },
  ratingRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 4,
  },
  ratingText: {
    fontSize: 14,
    color: '#8E8E93',
    marginLeft: 4,
  },
  jobsText: {
    fontSize: 12,
    color: '#8E8E93',
  },
  badgesContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
    marginBottom: 12,
  },
  badge: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#F0F8F0',
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 12,
    marginRight: 8,
  },
  badgeText: {
    fontSize: 11,
    color: '#00A651',
    marginLeft: 4,
    fontWeight: '500',
  },
  serviceAreaRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 8,
    paddingTop: 12,
    borderTopWidth: 1,
    borderTopColor: '#F0F0F0',
  },
  serviceAreaText: {
    fontSize: 14,
    color: '#8E8E93',
    marginLeft: 8,
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
    textAlign: 'center',
  },
});

