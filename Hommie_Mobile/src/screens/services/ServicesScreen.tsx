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
} from 'react-native';
import MaterialCommunityIcons from '@expo/vector-icons/MaterialCommunityIcons';
import { ScreenHeader } from '../../components/ui';
import { BUSINESS_CATEGORIES } from '../../constants/businessData';
import { businessCategoryApi, BusinessCategory } from '../../services/api';
import { colors, spacing, typography } from '../../constants';

interface ServicesScreenProps {
  navigation?: any;
}

// Map Material Icons to MaterialCommunityIcons
const iconMapping: Record<string, string> = {
  'agriculture': 'tractor',
  'directions-car': 'car',
  'face': 'face-man',
  'child-care': 'baby-face',
  'construction': 'hammer-wrench',
  'checkroom': 'hanger',
  'restaurant': 'silverware-fork-knife',
  'medical-services': 'medical-bag',
  'home-repair': 'home-wrench',
  'pets': 'paw',
  'computer': 'laptop',
  'local-shipping': 'truck-delivery',
  'home-variant': 'home-variant',
  'briefcase': 'briefcase',
  'laptop': 'laptop',
  'car-wrench': 'car-wrench',
  'food-variant': 'food-variant',
  'school': 'school',
  'calendar-check': 'calendar-check',
};

const getValidIconName = (iconName?: string): string => {
  if (!iconName) return 'briefcase-outline';

  // If it's already a valid MaterialCommunityIcons name, use it
  if (iconMapping[iconName]) {
    return iconMapping[iconName];
  }

  // Otherwise return as-is (might be already valid) or fallback
  return iconName || 'briefcase-outline';
};

export default function ServicesScreen({ navigation }: ServicesScreenProps) {
  const [categories, setCategories] = useState<BusinessCategory[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Fetch categories from API
  const fetchCategories = async (isRefreshing: boolean = false) => {
    try {
      if (!isRefreshing) setLoading(true);
      setError(null);

      const data = await businessCategoryApi.getAllCategories(true);
      setCategories(data);
    } catch (err) {
      console.error('Failed to fetch categories:', err);
      setError('Failed to load categories');

      // Fallback to hardcoded data
      setCategories(BUSINESS_CATEGORIES.map(cat => ({
        ...cat,
        serviceCount: cat.subcategories.length,
        createdAt: new Date().toISOString(),
      })));
    } finally {
      setLoading(false);
      if (isRefreshing) setRefreshing(false);
    }
  };

  // Fetch on mount
  useEffect(() => {
    fetchCategories();
  }, []);

  // Pull to refresh
  const onRefresh = () => {
    setRefreshing(true);
    fetchCategories(true);
  };

  const renderCategoryItem = ({ item }: { item: BusinessCategory }) => {
    const iconName = getValidIconName(item.icon);
    const iconColor = item.color || '#00A651';

    return (
      <TouchableOpacity
        style={styles.categoryCard}
        onPress={() => navigation?.navigate('ServiceCategory', { category: item })}
        activeOpacity={0.7}
      >
        <View style={[styles.categoryIconContainer, { backgroundColor: `${iconColor}15` }]}>
          <MaterialCommunityIcons
            name={iconName as any}
            size={32}
            color={iconColor}
          />
        </View>
        <View style={styles.categoryInfo}>
          <Text style={styles.categoryName}>{item.name}</Text>
          <Text style={styles.categoryDescription}>{item.description}</Text>
          <Text style={styles.categoryCount}>
            {item.serviceCount || 0} available services
          </Text>
        </View>
        <MaterialCommunityIcons
          name="chevron-right"
          size={24}
          color="#8E8E93"
        />
      </TouchableOpacity>
    );
  };

  if (loading) {
    return (
      <SafeAreaView style={styles.container}>
        <ScreenHeader title="Services" navigation={navigation} />
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color="#00A651" />
          <Text style={styles.loadingText}>Loading categories...</Text>
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.container}>
      <ScreenHeader
        title="Services"
        navigation={navigation}
      />
      <View style={styles.content}>
        <View style={styles.headerSection}>
          <Text style={styles.headerTitle}>Browse Services</Text>
          <Text style={styles.headerSubtitle}>
            Find estate-verified service providers in your neighborhood
          </Text>
        </View>

        {error && (
          <View style={styles.errorBanner}>
            <MaterialCommunityIcons name="alert-circle" size={20} color="#FF3B30" />
            <Text style={styles.errorText}>{error} - Showing cached data</Text>
          </View>
        )}

        <FlatList
          data={categories}
          renderItem={renderCategoryItem}
          keyExtractor={(item) => item.id}
          contentContainerStyle={styles.listContent}
          showsVerticalScrollIndicator={false}
          refreshControl={
            <RefreshControl
              refreshing={refreshing}
              onRefresh={onRefresh}
              tintColor="#00A651"
              colors={['#00A651']}
            />
          }
          ListEmptyComponent={
            <View style={styles.emptyState}>
              <MaterialCommunityIcons name="wrench" size={64} color="#8E8E93" />
              <Text style={styles.emptyText}>No service categories available</Text>
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
  loadingText: {
    marginTop: 12,
    fontSize: 16,
    color: '#8E8E93',
  },
  headerSection: {
    backgroundColor: '#FFFFFF',
    paddingHorizontal: 20,
    paddingVertical: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#F0F0F0',
  },
  headerTitle: {
    fontSize: 24,
    fontWeight: '700',
    color: '#1C1C1E',
    marginBottom: 4,
  },
  headerSubtitle: {
    fontSize: 14,
    color: '#8E8E93',
    lineHeight: 20,
  },
  errorBanner: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FFF3F2',
    paddingHorizontal: 16,
    paddingVertical: 12,
    marginHorizontal: 16,
    marginTop: 12,
    borderRadius: 8,
    borderLeftWidth: 4,
    borderLeftColor: '#FF3B30',
  },
  errorText: {
    marginLeft: 8,
    fontSize: 13,
    color: '#FF3B30',
    flex: 1,
  },
  listContent: {
    padding: 16,
  },
  categoryCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    padding: 16,
    marginBottom: 12,
    flexDirection: 'row',
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 2,
    elevation: 2,
  },
  categoryIconContainer: {
    width: 64,
    height: 64,
    borderRadius: 32,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 16,
  },
  categoryInfo: {
    flex: 1,
  },
  categoryName: {
    fontSize: 18,
    fontWeight: '600',
    color: '#1C1C1E',
    marginBottom: 4,
  },
  categoryDescription: {
    fontSize: 14,
    color: '#8E8E93',
    marginBottom: 4,
  },
  categoryCount: {
    fontSize: 12,
    color: '#00A651',
    fontWeight: '500',
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
  },
});














