import React from 'react';
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  TouchableOpacity,
  SafeAreaView,
  Platform,
} from 'react-native';
import MaterialCommunityIcons from '@expo/vector-icons/MaterialCommunityIcons';
import { ScreenHeader } from '../../components/ui';
import { BUSINESS_CATEGORIES } from '../../constants/businessData';
import { colors, spacing, typography } from '../../constants';

interface ServicesScreenProps {
  navigation?: any;
}

export default function ServicesScreen({ navigation }: ServicesScreenProps) {
  const renderCategoryItem = ({ item }: { item: typeof BUSINESS_CATEGORIES[0] }) => {
    return (
      <TouchableOpacity
        style={styles.categoryCard}
        onPress={() => navigation?.navigate('ServiceCategory', { category: item })}
        activeOpacity={0.7}
      >
        <View style={[styles.categoryIconContainer, { backgroundColor: `${item.color}15` }]}>
          <MaterialCommunityIcons
            name={item.icon as any}
            size={32}
            color={item.color}
          />
        </View>
        <View style={styles.categoryInfo}>
          <Text style={styles.categoryName}>{item.name}</Text>
          <Text style={styles.categoryDescription}>{item.description}</Text>
          <Text style={styles.categoryCount}>
            {item.subcategories.length} service types
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

        <FlatList
          data={BUSINESS_CATEGORIES}
          renderItem={renderCategoryItem}
          keyExtractor={(item) => item.id}
          contentContainerStyle={styles.listContent}
          showsVerticalScrollIndicator={false}
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









