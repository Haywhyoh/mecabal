// Estate Search Component
// Search input with debouncing and live results for estate selection

import React, { useState, useEffect, useCallback, useRef } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TextInput,
  TouchableOpacity,
  ScrollView,
  ActivityIndicator,
  Platform,
  Keyboard,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import * as Haptics from 'expo-haptics';
import { locationApi } from '../../services/api/locationApi';
import {
  Neighborhood,
  NeighborhoodType,
} from '../../types/location.types';

interface EstateSearchInputProps {
  onEstateSelected: (estate: Neighborhood) => void;
  onAddNewEstate?: () => void;
  placeholder?: string;
  showRecentlySearched?: boolean;
  maxRecentSearches?: number;
  style?: any;
}

interface RecentSearch {
  id: string;
  name: string;
  type: NeighborhoodType;
  isGated: boolean;
  searchedAt: Date;
}

export const EstateSearchInput: React.FC<EstateSearchInputProps> = ({
  onEstateSelected,
  onAddNewEstate,
  placeholder = 'Search for estates, communities...',
  showRecentlySearched = true,
  maxRecentSearches = 5,
  style,
}) => {
  // Local state
  const [searchQuery, setSearchQuery] = useState('');
  const [searchResults, setSearchResults] = useState<Neighborhood[]>([]);
  const [recentSearches, setRecentSearches] = useState<RecentSearch[]>([]);
  const [isSearching, setIsSearching] = useState(false);
  const [showResults, setShowResults] = useState(false);
  const [isFocused, setIsFocused] = useState(false);

  // Refs
  const searchInputRef = useRef<TextInput>(null);
  const searchTimeoutRef = useRef<NodeJS.Timeout | null>(null);

  // Load recent searches on mount
  useEffect(() => {
    loadRecentSearches();
  }, []);

  // Debounced search
  useEffect(() => {
    if (searchQuery.trim().length === 0) {
      setSearchResults([]);
      setShowResults(false);
      return;
    }

    if (searchQuery.trim().length < 2) {
      return;
    }

    // Clear previous timeout
    if (searchTimeoutRef.current) {
      clearTimeout(searchTimeoutRef.current);
    }

    // Set new timeout for debounced search
    searchTimeoutRef.current = setTimeout(() => {
      performSearch(searchQuery.trim());
    }, 300);

    return () => {
      if (searchTimeoutRef.current) {
        clearTimeout(searchTimeoutRef.current);
      }
    };
  }, [searchQuery]);

  // Cleanup timeout on unmount
  useEffect(() => {
    return () => {
      if (searchTimeoutRef.current) {
        clearTimeout(searchTimeoutRef.current);
      }
    };
  }, []);

  const loadRecentSearches = async () => {
    try {
      // In a real app, this would load from AsyncStorage or a database
      // For now, we'll use a mock implementation
      const recent: RecentSearch[] = [
        {
          id: '1',
          name: 'Victoria Island Estate',
          type: NeighborhoodType.ESTATE,
          isGated: true,
          searchedAt: new Date(Date.now() - 1000 * 60 * 30), // 30 minutes ago
        },
        {
          id: '2',
          name: 'Ikeja GRA',
          type: NeighborhoodType.AREA,
          isGated: false,
          searchedAt: new Date(Date.now() - 1000 * 60 * 60 * 2), // 2 hours ago
        },
        {
          id: '3',
          name: 'Lekki Phase 1',
          type: NeighborhoodType.COMMUNITY,
          isGated: false,
          searchedAt: new Date(Date.now() - 1000 * 60 * 60 * 24), // 1 day ago
        },
      ];
      setRecentSearches(recent);
    } catch (error) {
      console.error('Error loading recent searches:', error);
    }
  };

  const performSearch = async (query: string) => {
    try {
      setIsSearching(true);
      
      const response = await locationApi.searchNeighborhoods({
        query,
        type: NeighborhoodType.ESTATE, // Focus on estates
        limit: 10,
      });

      setSearchResults(response.data);
      setShowResults(true);
    } catch (error) {
      console.error('Error searching estates:', error);
      setSearchResults([]);
    } finally {
      setIsSearching(false);
    }
  };

  const handleEstateSelect = (estate: Neighborhood) => {
    // Add to recent searches
    addToRecentSearches(estate);
    
    // Clear search
    setSearchQuery('');
    setShowResults(false);
    setIsFocused(false);
    
    // Hide keyboard
    Keyboard.dismiss();
    
    // Haptic feedback
    if (Platform.OS === 'ios') {
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    }
    
    // Call callback
    onEstateSelected(estate);
  };

  const handleRecentSearchSelect = (recent: RecentSearch) => {
    // Convert recent search to neighborhood format
    const estate: Neighborhood = {
      id: recent.id,
      name: recent.name,
      type: recent.type,
      wardId: '',
      stateId: '',
      lgaId: '',
      isGated: recent.isGated,
      requiresVerification: recent.isGated,
    };
    
    handleEstateSelect(estate);
  };

  const addToRecentSearches = (estate: Neighborhood) => {
    const recentSearch: RecentSearch = {
      id: estate.id,
      name: estate.name,
      type: estate.type,
      isGated: estate.isGated,
      searchedAt: new Date(),
    };

    setRecentSearches(prev => {
      // Remove if already exists
      const filtered = prev.filter(item => item.id !== estate.id);
      // Add to beginning
      const updated = [recentSearch, ...filtered];
      // Keep only maxRecentSearches
      return updated.slice(0, maxRecentSearches);
    });
  };

  const handleClearSearch = () => {
    setSearchQuery('');
    setSearchResults([]);
    setShowResults(false);
    searchInputRef.current?.blur();
  };

  const handleFocus = () => {
    setIsFocused(true);
    if (recentSearches.length > 0) {
      setShowResults(true);
    }
  };

  const handleBlur = () => {
    // Delay hiding results to allow for selection
    setTimeout(() => {
      setIsFocused(false);
      setShowResults(false);
    }, 200);
  };

  const getEstateTypeColor = (type: NeighborhoodType): string => {
    switch (type) {
      case NeighborhoodType.ESTATE: return '#FF9500';
      case NeighborhoodType.COMMUNITY: return '#34C759';
      case NeighborhoodType.AREA: return '#007AFF';
      default: return '#8E8E93';
    }
  };

  const formatRecentSearchTime = (date: Date): string => {
    const now = new Date();
    const diffInMinutes = Math.floor((now.getTime() - date.getTime()) / (1000 * 60));
    
    if (diffInMinutes < 1) return 'Just now';
    if (diffInMinutes < 60) return `${diffInMinutes}m ago`;
    if (diffInMinutes < 1440) return `${Math.floor(diffInMinutes / 60)}h ago`;
    return `${Math.floor(diffInMinutes / 1440)}d ago`;
  };

  const renderSearchInput = () => (
    <View style={styles.searchContainer}>
      <Ionicons name="search" size={20} color="#8E8E93" style={styles.searchIcon} />
      <TextInput
        ref={searchInputRef}
        style={styles.searchInput}
        placeholder={placeholder}
        value={searchQuery}
        onChangeText={setSearchQuery}
        onFocus={handleFocus}
        onBlur={handleBlur}
        returnKeyType="search"
        autoCorrect={false}
        autoCapitalize="words"
        accessibilityLabel="Search for estates and communities"
      />
      {searchQuery.length > 0 && (
        <TouchableOpacity
          style={styles.clearButton}
          onPress={handleClearSearch}
          accessibilityLabel="Clear search"
          accessibilityRole="button"
        >
          <Ionicons name="close-circle" size={20} color="#8E8E93" />
        </TouchableOpacity>
      )}
      {isSearching && (
        <ActivityIndicator size="small" color="#007AFF" style={styles.loadingIndicator} />
      )}
    </View>
  );

  const renderEstateItem = (estate: Neighborhood, isRecent = false) => (
    <TouchableOpacity
      key={estate.id}
      style={styles.estateItem}
      onPress={() => handleEstateSelect(estate)}
      accessibilityLabel={`Select ${estate.name} ${estate.type.toLowerCase()}`}
      accessibilityRole="button"
    >
      <View style={styles.estateInfo}>
        <Text style={styles.estateName} numberOfLines={1}>
          {estate.name}
        </Text>
        <View style={styles.estateMeta}>
          <View style={[
            styles.typeBadge,
            { backgroundColor: getEstateTypeColor(estate.type) }
          ]}>
            <Text style={styles.typeBadgeText}>{estate.type}</Text>
          </View>
          {estate.isGated && (
            <View style={styles.gatedBadge}>
              <Ionicons name="lock-closed" size={12} color="white" />
            </View>
          )}
        </View>
      </View>
      <Ionicons name="chevron-forward" size={16} color="#8E8E93" />
    </TouchableOpacity>
  );

  const renderRecentSearchItem = (recent: RecentSearch) => (
    <TouchableOpacity
      key={recent.id}
      style={styles.recentItem}
      onPress={() => handleRecentSearchSelect(recent)}
      accessibilityLabel={`Select recent search ${recent.name}`}
      accessibilityRole="button"
    >
      <Ionicons name="time" size={16} color="#8E8E93" style={styles.recentIcon} />
      <View style={styles.recentInfo}>
        <Text style={styles.recentName} numberOfLines={1}>
          {recent.name}
        </Text>
        <Text style={styles.recentTime}>
          {formatRecentSearchTime(recent.searchedAt)}
        </Text>
      </View>
      <View style={styles.recentMeta}>
        <View style={[
          styles.typeBadge,
          { backgroundColor: getEstateTypeColor(recent.type) }
        ]}>
          <Text style={styles.typeBadgeText}>{recent.type}</Text>
        </View>
        {recent.isGated && (
          <View style={styles.gatedBadge}>
            <Ionicons name="lock-closed" size={10} color="white" />
          </View>
        )}
      </View>
    </TouchableOpacity>
  );

  const renderSearchResults = () => {
    if (!showResults) return null;

    return (
      <View style={styles.resultsContainer}>
        <ScrollView
          style={styles.resultsList}
          showsVerticalScrollIndicator={false}
          keyboardShouldPersistTaps="handled"
        >
          {searchQuery.length === 0 && showRecentlySearched && recentSearches.length > 0 && (
            <>
              <View style={styles.sectionHeader}>
                <Text style={styles.sectionTitle}>Recent Searches</Text>
              </View>
              {recentSearches.map(renderRecentSearchItem)}
            </>
          )}

          {searchQuery.length > 0 && searchResults.length > 0 && (
            <>
              <View style={styles.sectionHeader}>
                <Text style={styles.sectionTitle}>Search Results</Text>
              </View>
              {searchResults.map(estate => renderEstateItem(estate))}
            </>
          )}

          {searchQuery.length > 0 && searchResults.length === 0 && !isSearching && (
            <View style={styles.noResultsContainer}>
              <Ionicons name="search" size={48} color="#8E8E93" />
              <Text style={styles.noResultsTitle}>No estates found</Text>
              <Text style={styles.noResultsDescription}>
                Try searching with different keywords or check the spelling
              </Text>
              {onAddNewEstate && (
                <TouchableOpacity
                  style={styles.addNewButton}
                  onPress={onAddNewEstate}
                  accessibilityLabel="Add new estate"
                  accessibilityRole="button"
                >
                  <Ionicons name="add" size={16} color="#007AFF" />
                  <Text style={styles.addNewButtonText}>Not listed? Add new estate</Text>
                </TouchableOpacity>
              )}
            </View>
          )}
        </ScrollView>
      </View>
    );
  };

  return (
    <View style={[styles.container, style]}>
      {renderSearchInput()}
      {renderSearchResults()}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    position: 'relative',
    zIndex: 1000,
  },
  searchContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'white',
    borderRadius: 12,
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderWidth: 1,
    borderColor: '#E5E5EA',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  searchIcon: {
    marginRight: 12,
  },
  searchInput: {
    flex: 1,
    fontSize: 17,
    color: '#000',
  },
  clearButton: {
    marginLeft: 8,
    padding: 4,
  },
  loadingIndicator: {
    marginLeft: 8,
  },
  resultsContainer: {
    position: 'absolute',
    top: '100%',
    left: 0,
    right: 0,
    backgroundColor: 'white',
    borderRadius: 12,
    marginTop: 4,
    maxHeight: 300,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.15,
    shadowRadius: 8,
    elevation: 8,
    borderWidth: 1,
    borderColor: '#E5E5EA',
  },
  resultsList: {
    maxHeight: 300,
  },
  sectionHeader: {
    paddingHorizontal: 16,
    paddingVertical: 8,
    backgroundColor: '#F2F2F7',
    borderTopLeftRadius: 12,
    borderTopRightRadius: 12,
  },
  sectionTitle: {
    fontSize: 14,
    fontWeight: '600',
    color: '#8E8E93',
  },
  estateItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#F2F2F7',
  },
  estateInfo: {
    flex: 1,
    marginRight: 8,
  },
  estateName: {
    fontSize: 16,
    fontWeight: '500',
    color: '#000',
    marginBottom: 4,
  },
  estateMeta: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  typeBadge: {
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 12,
    marginRight: 8,
  },
  typeBadgeText: {
    fontSize: 12,
    fontWeight: '600',
    color: 'white',
  },
  gatedBadge: {
    backgroundColor: '#FF3B30',
    borderRadius: 10,
    padding: 4,
  },
  recentItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#F2F2F7',
  },
  recentIcon: {
    marginRight: 12,
  },
  recentInfo: {
    flex: 1,
    marginRight: 8,
  },
  recentName: {
    fontSize: 16,
    fontWeight: '500',
    color: '#000',
    marginBottom: 2,
  },
  recentTime: {
    fontSize: 12,
    color: '#8E8E93',
  },
  recentMeta: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  noResultsContainer: {
    alignItems: 'center',
    paddingVertical: 32,
    paddingHorizontal: 16,
  },
  noResultsTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#000',
    marginTop: 16,
    marginBottom: 8,
  },
  noResultsDescription: {
    fontSize: 14,
    color: '#8E8E93',
    textAlign: 'center',
    lineHeight: 20,
    marginBottom: 24,
  },
  addNewButton: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#F0F8FF',
    borderRadius: 8,
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderWidth: 1,
    borderColor: '#007AFF',
  },
  addNewButtonText: {
    fontSize: 14,
    fontWeight: '500',
    color: '#007AFF',
    marginLeft: 8,
  },
});

export default EstateSearchInput;
