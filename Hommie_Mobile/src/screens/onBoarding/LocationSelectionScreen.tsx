import React, { useState } from 'react';
import { View, Text, StyleSheet, TextInput, TouchableOpacity, SafeAreaView, StatusBar, ScrollView } from 'react-native';
import Icon from 'react-native-vector-icons/MaterialCommunityIcons';
import { COLORS, SPACING, TYPOGRAPHY, BORDER_RADIUS, SHADOWS } from '../../constants';
import { DEMO_LOCATIONS } from '../../constants/demoData';

export default function LocationSelectionScreen({ navigation }: any) {
  const [searchQuery, setSearchQuery] = useState('Nigeria');
  const [selectedLocation, setSelectedLocation] = useState('');

  const handleLocationSelect = (location: any) => {
    setSelectedLocation(location.name);
    // Navigate to next step
    navigation.navigate('LocationAccess');
  };

  const handleContinue = () => {
    if (selectedLocation) {
      navigation.navigate('LocationAccess');
    }
  };

  return (
    <SafeAreaView style={styles.container}>
      <StatusBar barStyle="dark-content" backgroundColor={COLORS.white} />
      
      <View style={styles.content}>
        {/* Header */}
        <View style={styles.header}>
          <TouchableOpacity 
            style={styles.backButton}
            onPress={() => navigation.goBack()}
          >
            <Text style={styles.backButtonText}>←</Text>
          </TouchableOpacity>
        
        </View>

        <Text style={styles.title}>Select your location</Text>

        {/* Search Bar */}
        <View style={styles.searchContainer}>
          <View style={styles.searchBar}>
            <Icon name="magnify" size={20} color={COLORS.textSecondary} style={styles.searchIcon} />
            <TextInput
              style={styles.searchInput}
              value={searchQuery}
              onChangeText={setSearchQuery}
              placeholder="Search for city or state"
              placeholderTextColor={COLORS.textSecondary}
            />
            {searchQuery.length > 0 && (
              <TouchableOpacity 
                style={styles.clearButton}
                onPress={() => setSearchQuery('')}
              >
                <Icon name="close" size={20} color={COLORS.textSecondary} />
              </TouchableOpacity>
            )}
          </View>
        </View>

        {/* Current Location */}
        <View style={styles.section}>
          <View style={styles.sectionHeader}>
            <Icon name="map-marker" size={20} color={COLORS.primary} style={styles.sectionIcon} />
            <Text style={styles.sectionTitle}>Current location</Text>
          </View>
          
          <TouchableOpacity 
            style={styles.currentLocationItem}
            onPress={() => handleLocationSelect(DEMO_LOCATIONS[0])}
          >
            <Icon name="map-marker-radius" size={20} color={COLORS.primary} style={styles.locationPin} />
            <View style={styles.locationInfo}>
              <Text style={styles.locationName}>{DEMO_LOCATIONS[0].name}</Text>
              <Text style={styles.locationDescription}>Detected from your device</Text>
            </View>
            <Icon name="pencil" size={20} color={COLORS.textSecondary} style={styles.editIcon} />
          </TouchableOpacity>
          
          <TouchableOpacity style={styles.whatsThisLink}>
            <Text style={styles.whatsThisText}>What's this?</Text>
          </TouchableOpacity>
        </View>

        {/* Suggested Locations */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Popular cities in Nigeria</Text>
          
          <ScrollView style={styles.locationsList} showsVerticalScrollIndicator={false}>
            {DEMO_LOCATIONS.slice(1).map((location) => (
              <TouchableOpacity
                key={location.id}
                style={[
                  styles.locationItem,
                  selectedLocation === location.name && styles.locationItemSelected
                ]}
                onPress={() => handleLocationSelect(location)}
              >
                <View style={styles.locationHeader}>
                  <Text style={styles.locationName}>{location.name}</Text>
                  <Text style={styles.locationPopulation}>{location.population}</Text>
                </View>
                <Text style={styles.locationType}>{location.type}</Text>
                <Text style={styles.locationDescription}>{location.description}</Text>
              </TouchableOpacity>
            ))}
          </ScrollView>
        </View>

        {/* Continue Button */}
        <TouchableOpacity 
          style={[
            styles.continueButton, 
            !selectedLocation && styles.continueButtonDisabled
          ]} 
          onPress={handleContinue}
          disabled={!selectedLocation}
        >
          <Text style={styles.continueButtonText}>Continue</Text>
        </TouchableOpacity>
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: COLORS.white,
  },
  content: {
    flex: 1,
    paddingHorizontal: SPACING.lg,
    paddingTop: SPACING.md,
    justifyContent: 'center',
    alignItems: 'center',
  },
  header: {
    marginBottom: SPACING.xl,
  },
  backButton: {
    marginBottom: SPACING.md,
  },
  backButtonText: {
    fontSize: 24,
    color: COLORS.text,
  },
  title: {
    fontSize: TYPOGRAPHY.fontSizes.xxl,
    fontWeight: '700',
    color: COLORS.text,
    lineHeight: 32,
    marginTop: 100,
  },
  searchContainer: {
    marginBottom: SPACING.xl,
  },
  searchBar: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: COLORS.lightGray,
    borderRadius: BORDER_RADIUS.lg,
    paddingHorizontal: SPACING.md,
    paddingVertical: SPACING.md,
    ...SHADOWS.small,
  },
  searchIcon: {
    fontSize: 20,
    marginRight: SPACING.sm,
    color: COLORS.textSecondary,
  },
  searchInput: {
    flex: 1,
    fontSize: TYPOGRAPHY.fontSizes.md,
    color: COLORS.text,
  },
  clearButton: {
    width: 24,
    height: 24,
    borderRadius: 12,
    backgroundColor: COLORS.mediumGray,
    alignItems: 'center',
    justifyContent: 'center',
  },
  clearButtonText: {
    color: COLORS.white,
    fontSize: TYPOGRAPHY.fontSizes.sm,
    fontWeight: '600',
  },
  section: {
    marginBottom: SPACING.xl,
  },
  sectionHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: SPACING.md,
  },
  sectionIcon: {
    fontSize: 20,
    marginRight: SPACING.sm,
  },
  sectionTitle: {
    fontSize: TYPOGRAPHY.fontSizes.lg,
    fontWeight: '600',
    color: COLORS.text,
  },
  currentLocationItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: SPACING.md,
    borderBottomWidth: 1,
    borderBottomColor: COLORS.border,
    marginBottom: SPACING.sm,
  },
  locationPin: {
    fontSize: 20,
    marginRight: SPACING.md,
  },
  locationInfo: {
    flex: 1,
  },
  locationName: {
    fontSize: TYPOGRAPHY.fontSizes.md,
    fontWeight: '500',
    color: COLORS.text,
    marginBottom: SPACING.xs,
  },
  locationDescription: {
    fontSize: TYPOGRAPHY.fontSizes.sm,
    color: COLORS.textSecondary,
  },
  editIcon: {
    fontSize: 16,
    color: COLORS.textSecondary,
  },
  whatsThisLink: {
    alignSelf: 'flex-start',
  },
  whatsThisText: {
    fontSize: TYPOGRAPHY.fontSizes.sm,
    color: COLORS.blue,
    fontWeight: '500',
  },
  locationsList: {
    maxHeight: 300,
  },
  locationItem: {
    backgroundColor: COLORS.white,
    padding: SPACING.md,
    borderRadius: BORDER_RADIUS.md,
    marginBottom: SPACING.md,
    borderWidth: 2,
    borderColor: COLORS.border,
    ...SHADOWS.small,
  },
  locationItemSelected: {
    borderColor: COLORS.primary,
    backgroundColor: COLORS.lightGreen,
  },
  locationHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: SPACING.xs,
  },
  locationPopulation: {
    fontSize: TYPOGRAPHY.fontSizes.sm,
    color: COLORS.primary,
    fontWeight: '500',
  },
  locationType: {
    fontSize: TYPOGRAPHY.fontSizes.sm,
    color: COLORS.primary,
    marginBottom: SPACING.xs,
  },
  continueButton: {
    backgroundColor: COLORS.primary,
    paddingVertical: SPACING.md,
    borderRadius: BORDER_RADIUS.lg,
    alignItems: 'center',
    marginBottom: SPACING.xl,
    ...SHADOWS.medium,
  },
  continueButtonDisabled: {
    backgroundColor: COLORS.lightGray,
  },
  continueButtonText: {
    color: COLORS.white,
    fontSize: TYPOGRAPHY.fontSizes.md,
    fontWeight: '600',
  },
});
