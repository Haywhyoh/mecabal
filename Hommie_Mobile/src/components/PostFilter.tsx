import React, { useState } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  Modal,
  ScrollView,
  TextInput,
  Switch,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { PostFilter as PostFilterType } from '../services/postsService';

interface PostFilterProps {
  visible: boolean;
  onClose: () => void;
  onApply: (filter: PostFilterType) => void;
  currentFilter: PostFilterType;
}

export const PostFilter: React.FC<PostFilterProps> = ({
  visible,
  onClose,
  onApply,
  currentFilter,
}) => {
  const [filter, setFilter] = useState<PostFilterType>(currentFilter);
  const [showPostTypeModal, setShowPostTypeModal] = useState(false);
  const [showCategoryModal, setShowCategoryModal] = useState(false);

  const postTypes = [
    { id: 'general', label: 'General', icon: 'chatbubble-outline', color: '#3498db' },
    { id: 'event', label: 'Event', icon: 'calendar-outline', color: '#e74c3c' },
    { id: 'alert', label: 'Alert', icon: 'warning-outline', color: '#f39c12' },
    { id: 'marketplace', label: 'Marketplace', icon: 'storefront-outline', color: '#2ecc71' },
    { id: 'lost_found', label: 'Lost & Found', icon: 'search-outline', color: '#9b59b6' },
  ];

  const privacyLevels = [
    { id: 'neighborhood', label: 'Neighborhood', icon: 'people-outline' },
    { id: 'group', label: 'Group', icon: 'people-circle-outline' },
    { id: 'public', label: 'Public', icon: 'globe-outline' },
  ];

  const sortOptions = [
    { id: 'createdAt', label: 'Date Created', icon: 'time-outline' },
    { id: 'updatedAt', label: 'Last Updated', icon: 'refresh-outline' },
    { id: 'title', label: 'Title', icon: 'text-outline' },
  ];

  const sortOrders = [
    { id: 'DESC', label: 'Newest First', icon: 'arrow-down-outline' },
    { id: 'ASC', label: 'Oldest First', icon: 'arrow-up-outline' },
  ];

  const handleApply = () => {
    onApply(filter);
    onClose();
  };

  const handleReset = () => {
    const resetFilter: PostFilterType = {
      page: 1,
      limit: 20,
      sortBy: 'createdAt',
      sortOrder: 'DESC',
    };
    setFilter(resetFilter);
  };

  const updateFilter = (key: keyof PostFilterType, value: any) => {
    setFilter(prev => ({ ...prev, [key]: value }));
  };

  const getPostTypeLabel = (type: string) => {
    return postTypes.find(t => t.id === type)?.label || 'All Types';
  };

  const getPrivacyLabel = (level: string) => {
    return privacyLevels.find(l => l.id === level)?.label || 'All Privacy';
  };

  const getSortLabel = (sort: string) => {
    return sortOptions.find(s => s.id === sort)?.label || 'Date Created';
  };

  const getSortOrderLabel = (order: string) => {
    return sortOrders.find(o => o.id === order)?.label || 'Newest First';
  };

  return (
    <Modal
      visible={visible}
      animationType="slide"
      presentationStyle="pageSheet"
      onRequestClose={onClose}
    >
      <View style={styles.container}>
        {/* Header */}
        <View style={styles.header}>
          <TouchableOpacity onPress={onClose} style={styles.headerButton}>
            <Text style={styles.headerButtonText}>Cancel</Text>
          </TouchableOpacity>
          <Text style={styles.headerTitle}>Filter Posts</Text>
          <TouchableOpacity onPress={handleApply} style={styles.headerButton}>
            <Text style={styles.applyButtonText}>Apply</Text>
          </TouchableOpacity>
        </View>

        <ScrollView style={styles.content} showsVerticalScrollIndicator={false}>
          {/* Search */}
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Search</Text>
            <TextInput
              style={styles.searchInput}
              value={filter.search || ''}
              onChangeText={(text) => updateFilter('search', text || undefined)}
              placeholder="Search posts..."
              placeholderTextColor="#bdc3c7"
            />
          </View>

          {/* Post Type */}
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Post Type</Text>
            <TouchableOpacity
              style={styles.filterButton}
              onPress={() => setShowPostTypeModal(true)}
            >
              <Text style={styles.filterButtonText}>
                {filter.postType ? getPostTypeLabel(filter.postType) : 'All Types'}
              </Text>
              <Ionicons name="chevron-down" size={20} color="#7f8c8d" />
            </TouchableOpacity>
          </View>

          {/* Privacy Level */}
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Privacy Level</Text>
            <TouchableOpacity
              style={styles.filterButton}
              onPress={() => setShowCategoryModal(true)}
            >
              <Text style={styles.filterButtonText}>
                {filter.privacyLevel ? getPrivacyLabel(filter.privacyLevel) : 'All Privacy'}
              </Text>
              <Ionicons name="chevron-down" size={20} color="#7f8c8d" />
            </TouchableOpacity>
          </View>

          {/* Sort By */}
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Sort By</Text>
            <View style={styles.sortContainer}>
              <TouchableOpacity
                style={styles.sortButton}
                onPress={() => {
                  // Show sort options modal
                }}
              >
                <Ionicons name="time-outline" size={16} color="#7f8c8d" />
                <Text style={styles.sortButtonText}>
                  {getSortLabel(filter.sortBy || 'createdAt')}
                </Text>
                <Ionicons name="chevron-down" size={16} color="#7f8c8d" />
              </TouchableOpacity>

              <TouchableOpacity
                style={styles.sortButton}
                onPress={() => {
                  // Show sort order options
                }}
              >
                <Ionicons name="arrow-down-outline" size={16} color="#7f8c8d" />
                <Text style={styles.sortButtonText}>
                  {getSortOrderLabel(filter.sortOrder || 'DESC')}
                </Text>
                <Ionicons name="chevron-down" size={16} color="#7f8c8d" />
              </TouchableOpacity>
            </View>
          </View>

          {/* Filters */}
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Filters</Text>
            
            <View style={styles.filterRow}>
              <Text style={styles.filterLabel}>Pinned Posts Only</Text>
              <Switch
                value={filter.isPinned || false}
                onValueChange={(value) => updateFilter('isPinned', value || undefined)}
                trackColor={{ false: '#e1e8ed', true: '#3498db' }}
                thumbColor={filter.isPinned ? '#fff' : '#f4f3f4'}
              />
            </View>

            <View style={styles.filterRow}>
              <Text style={styles.filterLabel}>Approved Posts Only</Text>
              <Switch
                value={filter.isApproved !== false}
                onValueChange={(value) => updateFilter('isApproved', value)}
                trackColor={{ false: '#e1e8ed', true: '#3498db' }}
                thumbColor={filter.isApproved !== false ? '#fff' : '#f4f3f4'}
              />
            </View>
          </View>

          {/* Reset Button */}
          <TouchableOpacity style={styles.resetButton} onPress={handleReset}>
            <Ionicons name="refresh-outline" size={20} color="#e74c3c" />
            <Text style={styles.resetButtonText}>Reset Filters</Text>
          </TouchableOpacity>
        </ScrollView>

        {/* Post Type Selection Modal */}
        <Modal
          visible={showPostTypeModal}
          animationType="slide"
          presentationStyle="pageSheet"
          onRequestClose={() => setShowPostTypeModal(false)}
        >
          <View style={styles.modalContainer}>
            <View style={styles.modalHeader}>
              <TouchableOpacity
                onPress={() => setShowPostTypeModal(false)}
                style={styles.modalHeaderButton}
              >
                <Text style={styles.modalHeaderButtonText}>Cancel</Text>
              </TouchableOpacity>
              <Text style={styles.modalHeaderTitle}>Select Post Type</Text>
              <View style={styles.modalHeaderButton} />
            </View>
            <ScrollView style={styles.modalContent}>
              <TouchableOpacity
                style={styles.modalItem}
                onPress={() => {
                  updateFilter('postType', undefined);
                  setShowPostTypeModal(false);
                }}
              >
                <Text style={styles.modalItemText}>All Types</Text>
                {!filter.postType && <Ionicons name="checkmark" size={20} color="#3498db" />}
              </TouchableOpacity>
              {postTypes.map((type) => (
                <TouchableOpacity
                  key={type.id}
                  style={styles.modalItem}
                  onPress={() => {
                    updateFilter('postType', type.id as any);
                    setShowPostTypeModal(false);
                  }}
                >
                  <View style={styles.modalItemContent}>
                    <Ionicons name={type.icon as any} size={20} color={type.color} />
                    <Text style={styles.modalItemText}>{type.label}</Text>
                  </View>
                  {filter.postType === type.id && (
                    <Ionicons name="checkmark" size={20} color="#3498db" />
                  )}
                </TouchableOpacity>
              ))}
            </ScrollView>
          </View>
        </Modal>
      </View>
    </Modal>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#fff',
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#e1e8ed',
  },
  headerButton: {
    paddingVertical: 8,
    paddingHorizontal: 12,
  },
  headerButtonText: {
    fontSize: 16,
    color: '#7f8c8d',
  },
  applyButtonText: {
    fontSize: 16,
    color: '#3498db',
    fontWeight: '600',
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#2c3e50',
  },
  content: {
    flex: 1,
    paddingHorizontal: 16,
  },
  section: {
    marginVertical: 16,
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#2c3e50',
    marginBottom: 8,
  },
  searchInput: {
    paddingVertical: 12,
    paddingHorizontal: 16,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#e1e8ed',
    backgroundColor: '#f8f9fa',
    fontSize: 16,
    color: '#2c3e50',
  },
  filterButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: 12,
    paddingHorizontal: 16,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#e1e8ed',
    backgroundColor: '#f8f9fa',
  },
  filterButtonText: {
    fontSize: 16,
    color: '#2c3e50',
  },
  sortContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  sortButton: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 12,
    paddingHorizontal: 16,
    marginHorizontal: 4,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#e1e8ed',
    backgroundColor: '#f8f9fa',
  },
  sortButtonText: {
    flex: 1,
    marginLeft: 8,
    fontSize: 14,
    color: '#2c3e50',
  },
  filterRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#e1e8ed',
  },
  filterLabel: {
    fontSize: 16,
    color: '#2c3e50',
  },
  resetButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 16,
    marginVertical: 20,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#e74c3c',
    backgroundColor: '#fff',
  },
  resetButtonText: {
    marginLeft: 8,
    fontSize: 16,
    color: '#e74c3c',
    fontWeight: '600',
  },
  modalContainer: {
    flex: 1,
    backgroundColor: '#fff',
  },
  modalHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#e1e8ed',
  },
  modalHeaderButton: {
    paddingVertical: 8,
    paddingHorizontal: 12,
  },
  modalHeaderButtonText: {
    fontSize: 16,
    color: '#3498db',
  },
  modalHeaderTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#2c3e50',
  },
  modalContent: {
    flex: 1,
    paddingHorizontal: 16,
  },
  modalItem: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#e1e8ed',
  },
  modalItemContent: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  modalItemText: {
    marginLeft: 12,
    fontSize: 16,
    color: '#2c3e50',
  },
});

export default PostFilter;
