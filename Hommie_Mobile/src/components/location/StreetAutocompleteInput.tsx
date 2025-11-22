// Street Autocomplete Input Component
// Uses Google Places API to search for street names

import React, { useState, useEffect, useRef } from 'react';
import {
  View,
  Text,
  TextInput,
  StyleSheet,
  TouchableOpacity,
  FlatList,
  ActivityIndicator,
  Platform,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { GooglePlacesService, PlaceResult } from '../../services/googlePlaces';

interface StreetAutocompleteInputProps {
  value: string;
  onChangeText: (text: string) => void;
  onPlaceSelected?: (place: PlaceResult) => void;
  placeholder?: string;
  label?: string;
  error?: string;
  disabled?: boolean;
  coordinates?: { latitude: number; longitude: number };
}

export default function StreetAutocompleteInput({
  value,
  onChangeText,
  onPlaceSelected,
  placeholder = 'Search for street name...',
  label,
  error,
  disabled = false,
  coordinates,
}: StreetAutocompleteInputProps) {
  const [suggestions, setSuggestions] = useState<PlaceResult[]>([]);
  const [isSearching, setIsSearching] = useState(false);
  const [showSuggestions, setShowSuggestions] = useState(false);
  const debounceTimer = useRef<NodeJS.Timeout | null>(null);
  const inputRef = useRef<TextInput>(null);

  // Debounced search function
  useEffect(() => {
    // Clear previous timer
    if (debounceTimer.current) {
      clearTimeout(debounceTimer.current);
    }

    // Don't search if value is too short or empty
    if (!value || value.length < 3) {
      setSuggestions([]);
      setShowSuggestions(false);
      return;
    }

    // Set loading state
    setIsSearching(true);
    setShowSuggestions(true);

    // Debounce the search
    debounceTimer.current = setTimeout(async () => {
      try {
        const result = await GooglePlacesService.searchPlacesByText(
          value,
          coordinates?.latitude,
          coordinates?.longitude,
          50000 // 50km radius
        );

        if (result.success && result.data) {
          // Filter for street/route types and format addresses
          const streetResults = result.data
            .filter((place) => {
              // Filter for street/route types
              return (
                place.types?.includes('route') ||
                place.types?.includes('street_address') ||
                place.types?.includes('premise') ||
                place.formatted_address.toLowerCase().includes('street') ||
                place.formatted_address.toLowerCase().includes('road') ||
                place.formatted_address.toLowerCase().includes('avenue') ||
                place.formatted_address.toLowerCase().includes('close') ||
                place.formatted_address.toLowerCase().includes('drive')
              );
            })
            .slice(0, 5); // Limit to 5 results

          setSuggestions(streetResults);
        } else {
          setSuggestions([]);
        }
      } catch (err) {
        console.error('Street search error:', err);
        setSuggestions([]);
      } finally {
        setIsSearching(false);
      }
    }, 500); // 500ms debounce

    return () => {
      if (debounceTimer.current) {
        clearTimeout(debounceTimer.current);
      }
    };
  }, [value, coordinates]);

  const handleSelectPlace = (place: PlaceResult) => {
    // Extract street name from formatted address
    const addressParts = place.formatted_address.split(',');
    const streetName = addressParts[0]?.trim() || place.name;

    onChangeText(streetName);
    setShowSuggestions(false);
    inputRef.current?.blur();

    if (onPlaceSelected) {
      onPlaceSelected(place);
    }
  };

  const formatAddress = (place: PlaceResult): string => {
    // Return just the street part of the address
    const addressParts = place.formatted_address.split(',');
    return addressParts[0]?.trim() || place.name;
  };

  return (
    <View style={styles.container}>
      {label && <Text style={styles.label}>{label}</Text>}
      
      <View style={styles.inputContainer}>
        <Ionicons name="location" size={20} color="#8E8E93" style={styles.inputIcon} />
        <TextInput
          ref={inputRef}
          style={[styles.input, error && styles.inputError]}
          value={value}
          onChangeText={onChangeText}
          placeholder={placeholder}
          placeholderTextColor="#8E8E93"
          editable={!disabled}
          onFocus={() => {
            if (suggestions.length > 0) {
              setShowSuggestions(true);
            }
          }}
          onBlur={() => {
            // Delay hiding suggestions to allow selection
            setTimeout(() => setShowSuggestions(false), 200);
          }}
        />
        {isSearching && (
          <ActivityIndicator size="small" color="#00A651" style={styles.loadingIndicator} />
        )}
      </View>

      {error && <Text style={styles.errorText}>{error}</Text>}

      {showSuggestions && suggestions.length > 0 && (
        <View style={styles.suggestionsContainer}>
          <FlatList
            data={suggestions}
            keyExtractor={(item) => item.place_id}
            renderItem={({ item }) => (
              <TouchableOpacity
                style={styles.suggestionItem}
                onPress={() => handleSelectPlace(item)}
              >
                <Ionicons name="location-outline" size={18} color="#00A651" />
                <View style={styles.suggestionContent}>
                  <Text style={styles.suggestionText}>{formatAddress(item)}</Text>
                  {item.formatted_address !== formatAddress(item) && (
                    <Text style={styles.suggestionSubtext} numberOfLines={1}>
                      {item.formatted_address}
                    </Text>
                  )}
                </View>
              </TouchableOpacity>
            )}
            keyboardShouldPersistTaps="handled"
            nestedScrollEnabled
          />
        </View>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    marginBottom: 16,
  },
  label: {
    fontSize: 16,
    fontWeight: '600',
    color: '#000',
    marginBottom: 8,
  },
  inputContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#F5F5F5',
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#E0E0E0',
    paddingHorizontal: 12,
  },
  inputIcon: {
    marginRight: 8,
  },
  input: {
    flex: 1,
    fontSize: 16,
    color: '#000',
    paddingVertical: 12,
    paddingHorizontal: 0,
  },
  inputError: {
    borderColor: '#FF3B30',
  },
  loadingIndicator: {
    marginLeft: 8,
  },
  errorText: {
    fontSize: 14,
    color: '#FF3B30',
    marginTop: 4,
    marginLeft: 4,
  },
  suggestionsContainer: {
    marginTop: 8,
    backgroundColor: 'white',
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#E0E0E0',
    maxHeight: 200,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  suggestionItem: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#F5F5F5',
  },
  suggestionContent: {
    flex: 1,
    marginLeft: 12,
  },
  suggestionText: {
    fontSize: 16,
    color: '#000',
    fontWeight: '500',
  },
  suggestionSubtext: {
    fontSize: 14,
    color: '#8E8E93',
    marginTop: 2,
  },
});

