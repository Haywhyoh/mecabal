import React, { useState } from 'react';
import { View, Text, StyleSheet, ScrollView, SafeAreaView, TouchableOpacity, Modal } from 'react-native';
import MaterialCommunityIcons from '@expo/vector-icons/MaterialCommunityIcons';
import { ScreenHeader } from '../components/ScreenHeader';

interface Estate {
  id: string;
  name: string;
  location: string;
  isPrimary: boolean;
  isVerified: boolean;
  memberSince: string;
  memberCount: number;
  distance?: string;
}

interface EstateManagerScreenProps {
  navigation?: any;
}

export default function EstateManagerScreen({ navigation }: EstateManagerScreenProps) {
  const [showAddEstate, setShowAddEstate] = useState(false);
  const [estates] = useState<Estate[]>([
    {
      id: '1',
      name: 'Victoria Island Estate',
      location: 'Victoria Island, Lagos',
      isPrimary: true,
      isVerified: true,
      memberSince: 'August 2024',
      memberCount: 1247,
    },
    {
      id: '2',
      name: 'Lekki Phase 1 Gardens',
      location: 'Lekki Phase 1, Lagos',
      isPrimary: false,
      isVerified: true,
      memberSince: 'September 2024',
      memberCount: 892,
      distance: '4.2km away',
    },
    {
      id: '3',
      name: 'Ikoyi Heights',
      location: 'Ikoyi, Lagos',
      isPrimary: false,
      isVerified: false,
      memberSince: 'October 2024',
      memberCount: 645,
      distance: '2.8km away',
    },
  ]);

  const handleSetPrimary = (estateId: string) => {
    // Implementation for setting primary estate
    console.log('Setting primary estate:', estateId);
  };

  const handleLeaveEstate = (estateId: string) => {
    // Implementation for leaving estate
    console.log('Leaving estate:', estateId);
  };

  const handleMoveToNewEstate = () => {
    setShowAddEstate(true);
  };

  return (
    <SafeAreaView style={styles.container}>
      {/* Header */}
      <ScreenHeader 
        title="My Estates"
        navigation={navigation}
        rightComponent={
          <TouchableOpacity style={styles.addButton} onPress={handleMoveToNewEstate}>
            <MaterialCommunityIcons name="plus" size={24} color="#00A651" />
          </TouchableOpacity>
        }
      />

      <ScrollView style={styles.scrollView} showsVerticalScrollIndicator={false}>
        {/* Current Estates */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Your Estates ({estates.length})</Text>
          <Text style={styles.sectionSubtitle}>You're a member of these communities</Text>
          
          {estates.map((estate) => (
            <View key={estate.id} style={styles.estateCard}>
              <View style={styles.estateHeader}>
                <View style={styles.estateIcon}>
                  <MaterialCommunityIcons 
                    name={estate.isPrimary ? "home" : "home-outline"} 
                    size={24} 
                    color={estate.isPrimary ? "#00A651" : "#8E8E8E"} 
                  />
                </View>
                
                <View style={styles.estateInfo}>
                  <View style={styles.estateNameRow}>
                    <Text style={styles.estateName}>{estate.name}</Text>
                    {estate.isPrimary && (
                      <View style={styles.primaryBadge}>
                        <Text style={styles.primaryText}>Primary</Text>
                      </View>
                    )}
                  </View>
                  
                  <Text style={styles.estateLocation}>{estate.location}</Text>
                  
                  <View style={styles.estateDetails}>
                    <Text style={styles.memberSince}>Member since {estate.memberSince}</Text>
                    <Text style={styles.memberCount}>{estate.memberCount.toLocaleString()} members</Text>
                    {estate.distance && (
                      <Text style={styles.distance}>• {estate.distance}</Text>
                    )}
                  </View>
                </View>
                
                <TouchableOpacity style={styles.moreButton}>
                  <MaterialCommunityIcons name="dots-vertical" size={20} color="#8E8E8E" />
                </TouchableOpacity>
              </View>

              {/* Verification Status */}
              <View style={styles.verificationRow}>
                <MaterialCommunityIcons 
                  name={estate.isVerified ? "shield-check" : "shield-alert"} 
                  size={16} 
                  color={estate.isVerified ? "#00A651" : "#FF6B35"} 
                />
                <Text style={[
                  styles.verificationText,
                  { color: estate.isVerified ? "#00A651" : "#FF6B35" }
                ]}>
                  {estate.isVerified ? "Verified Resident" : "Verification Pending"}
                </Text>
              </View>

              {/* Action Buttons */}
              {!estate.isPrimary && (
                <View style={styles.actionButtons}>
                  <TouchableOpacity 
                    style={styles.setPrimaryButton}
                    onPress={() => handleSetPrimary(estate.id)}
                  >
                    <Text style={styles.setPrimaryText}>Set as Primary</Text>
                  </TouchableOpacity>
                  
                  <TouchableOpacity 
                    style={styles.leaveButton}
                    onPress={() => handleLeaveEstate(estate.id)}
                  >
                    <Text style={styles.leaveText}>Leave Estate</Text>
                  </TouchableOpacity>
                </View>
              )}
            </View>
          ))}
        </View>

        {/* Privacy Settings */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Location Privacy</Text>
          <Text style={styles.sectionSubtitle}>Control how neighbors can discover your profile</Text>
          
          <View style={styles.privacyCard}>
            <TouchableOpacity style={styles.privacyOption}>
              <View style={styles.privacyOptionLeft}>
                <MaterialCommunityIcons name="map-marker-radius" size={20} color="#00A651" />
                <View style={styles.privacyOptionText}>
                  <Text style={styles.privacyTitle}>Discoverable by Distance</Text>
                  <Text style={styles.privacySubtitle}>Let neighbors find you based on proximity</Text>
                </View>
              </View>
              <View style={styles.switchContainer}>
                <View style={[styles.switch, styles.switchOn]}>
                  <View style={styles.switchThumb} />
                </View>
              </View>
            </TouchableOpacity>

            <TouchableOpacity style={styles.privacyOption}>
              <View style={styles.privacyOptionLeft}>
                <MaterialCommunityIcons name="eye" size={20} color="#0066CC" />
                <View style={styles.privacyOptionText}>
                  <Text style={styles.privacyTitle}>Show on Estate Directory</Text>
                  <Text style={styles.privacySubtitle}>Appear in your estate's member list</Text>
                </View>
              </View>
              <View style={styles.switchContainer}>
                <View style={[styles.switch, styles.switchOn]}>
                  <View style={styles.switchThumb} />
                </View>
              </View>
            </TouchableOpacity>

            <TouchableOpacity style={styles.privacyOption}>
              <View style={styles.privacyOptionLeft}>
                <MaterialCommunityIcons name="account-group" size={20} color="#7B68EE" />
                <View style={styles.privacyOptionText}>
                  <Text style={styles.privacyTitle}>Cross-Estate Visibility</Text>
                  <Text style={styles.privacySubtitle}>Be visible to members of your other estates</Text>
                </View>
              </View>
              <View style={styles.switchContainer}>
                <View style={styles.switch}>
                  <View style={styles.switchThumb} />
                </View>
              </View>
            </TouchableOpacity>
          </View>
        </View>

        {/* Discovery Settings */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Discovery Range</Text>
          <Text style={styles.sectionSubtitle}>Set how far neighbors can be to discover your profile</Text>
          
          <View style={styles.rangeCard}>
            <Text style={styles.rangeLabel}>Maximum distance: 5km</Text>
            <View style={styles.rangeSlider}>
              <View style={styles.rangeTrack} />
              <View style={styles.rangeProgress} />
              <View style={styles.rangeThumb} />
            </View>
            <View style={styles.rangeLabels}>
              <Text style={styles.rangeMin}>1km</Text>
              <Text style={styles.rangeMax}>10km</Text>
            </View>
          </View>
        </View>
      </ScrollView>

      {/* Add Estate Modal */}
      <Modal
        visible={showAddEstate}
        animationType="slide"
        presentationStyle="pageSheet"
      >
        <SafeAreaView style={styles.modalContainer}>
          <View style={styles.modalHeader}>
            <TouchableOpacity onPress={() => setShowAddEstate(false)}>
              <Text style={styles.cancelText}>Cancel</Text>
            </TouchableOpacity>
            <Text style={styles.modalTitle}>Join New Estate</Text>
            <TouchableOpacity>
              <Text style={styles.doneText}>Done</Text>
            </TouchableOpacity>
          </View>
          
          <View style={styles.modalContent}>
            <Text style={styles.modalSubtitle}>
              Search for your new estate or request to join a new community
            </Text>
            
            <TouchableOpacity style={styles.searchOption}>
              <MaterialCommunityIcons name="magnify" size={24} color="#00A651" />
              <Text style={styles.searchText}>Search by Estate Name</Text>
            </TouchableOpacity>
            
            <TouchableOpacity style={styles.searchOption}>
              <MaterialCommunityIcons name="map-marker" size={24} color="#0066CC" />
              <Text style={styles.searchText}>Find by Location</Text>
            </TouchableOpacity>
            
            <TouchableOpacity style={styles.searchOption}>
              <MaterialCommunityIcons name="plus-circle" size={24} color="#FF6B35" />
              <Text style={styles.searchText}>Request New Estate</Text>
            </TouchableOpacity>
          </View>
        </SafeAreaView>
      </Modal>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#FAFAFA',
  },
  addButton: {
    padding: 8,
    marginLeft: 8,
  },
  scrollView: {
    flex: 1,
  },
  section: {
    backgroundColor: '#FFFFFF',
    marginTop: 12,
    paddingVertical: 20,
  },
  sectionTitle: {
    fontSize: 20,
    fontWeight: '700',
    color: '#2C2C2C',
    paddingHorizontal: 16,
    marginBottom: 4,
  },
  sectionSubtitle: {
    fontSize: 14,
    color: '#8E8E8E',
    paddingHorizontal: 16,
    marginBottom: 20,
  },
  estateCard: {
    marginHorizontal: 16,
    marginBottom: 16,
    backgroundColor: '#FAFAFA',
    borderRadius: 12,
    padding: 16,
    shadowColor: '#000000',
    shadowOpacity: 0.05,
    shadowRadius: 8,
    shadowOffset: { width: 0, height: 2 },
    elevation: 2,
  },
  estateHeader: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    marginBottom: 12,
  },
  estateIcon: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: '#FFFFFF',
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 12,
    shadowColor: '#000000',
    shadowOpacity: 0.1,
    shadowRadius: 4,
    shadowOffset: { width: 0, height: 2 },
    elevation: 2,
  },
  estateInfo: {
    flex: 1,
  },
  estateNameRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 4,
  },
  estateName: {
    fontSize: 16,
    fontWeight: '600',
    color: '#2C2C2C',
    marginRight: 8,
  },
  primaryBadge: {
    backgroundColor: '#E8F5E8',
    paddingVertical: 2,
    paddingHorizontal: 8,
    borderRadius: 12,
  },
  primaryText: {
    fontSize: 12,
    color: '#00A651',
    fontWeight: '600',
  },
  estateLocation: {
    fontSize: 14,
    color: '#8E8E8E',
    marginBottom: 8,
  },
  estateDetails: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    alignItems: 'center',
  },
  memberSince: {
    fontSize: 12,
    color: '#8E8E8E',
    marginRight: 8,
  },
  memberCount: {
    fontSize: 12,
    color: '#00A651',
    fontWeight: '500',
    marginRight: 8,
  },
  distance: {
    fontSize: 12,
    color: '#8E8E8E',
  },
  moreButton: {
    padding: 4,
  },
  verificationRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 12,
  },
  verificationText: {
    fontSize: 14,
    fontWeight: '500',
    marginLeft: 6,
  },
  actionButtons: {
    flexDirection: 'row',
    gap: 12,
  },
  setPrimaryButton: {
    flex: 1,
    backgroundColor: '#00A651',
    borderRadius: 8,
    paddingVertical: 8,
    paddingHorizontal: 16,
    alignItems: 'center',
  },
  setPrimaryText: {
    fontSize: 14,
    fontWeight: '600',
    color: '#FFFFFF',
  },
  leaveButton: {
    flex: 1,
    backgroundColor: 'transparent',
    borderColor: '#E74C3C',
    borderWidth: 1,
    borderRadius: 8,
    paddingVertical: 8,
    paddingHorizontal: 16,
    alignItems: 'center',
  },
  leaveText: {
    fontSize: 14,
    fontWeight: '600',
    color: '#E74C3C',
  },
  privacyCard: {
    marginHorizontal: 16,
    backgroundColor: '#FAFAFA',
    borderRadius: 12,
    padding: 16,
  },
  privacyOption: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#F5F5F5',
  },
  privacyOptionLeft: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
  },
  privacyOptionText: {
    flex: 1,
    marginLeft: 12,
  },
  privacyTitle: {
    fontSize: 16,
    fontWeight: '500',
    color: '#2C2C2C',
    marginBottom: 2,
  },
  privacySubtitle: {
    fontSize: 14,
    color: '#8E8E8E',
  },
  switchContainer: {
    marginLeft: 16,
  },
  switch: {
    width: 44,
    height: 24,
    borderRadius: 12,
    backgroundColor: '#E0E0E0',
    padding: 2,
    justifyContent: 'center',
  },
  switchOn: {
    backgroundColor: '#00A651',
    alignItems: 'flex-end',
  },
  switchThumb: {
    width: 20,
    height: 20,
    borderRadius: 10,
    backgroundColor: '#FFFFFF',
    shadowColor: '#000000',
    shadowOpacity: 0.2,
    shadowRadius: 2,
    shadowOffset: { width: 0, height: 1 },
    elevation: 2,
  },
  rangeCard: {
    marginHorizontal: 16,
    backgroundColor: '#FAFAFA',
    borderRadius: 12,
    padding: 20,
  },
  rangeLabel: {
    fontSize: 16,
    fontWeight: '600',
    color: '#2C2C2C',
    marginBottom: 16,
    textAlign: 'center',
  },
  rangeSlider: {
    height: 4,
    backgroundColor: '#E0E0E0',
    borderRadius: 2,
    marginBottom: 8,
    position: 'relative',
  },
  rangeTrack: {
    flex: 1,
    height: '100%',
    borderRadius: 2,
  },
  rangeProgress: {
    position: 'absolute',
    left: 0,
    width: '50%',
    height: '100%',
    backgroundColor: '#00A651',
    borderRadius: 2,
  },
  rangeThumb: {
    position: 'absolute',
    left: '48%',
    top: -6,
    width: 16,
    height: 16,
    borderRadius: 8,
    backgroundColor: '#00A651',
    shadowColor: '#000000',
    shadowOpacity: 0.2,
    shadowRadius: 4,
    shadowOffset: { width: 0, height: 2 },
    elevation: 3,
  },
  rangeLabels: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  rangeMin: {
    fontSize: 12,
    color: '#8E8E8E',
  },
  rangeMax: {
    fontSize: 12,
    color: '#8E8E8E',
  },
  modalContainer: {
    flex: 1,
    backgroundColor: '#FAFAFA',
  },
  modalHeader: {
    backgroundColor: '#FFFFFF',
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#F0F0F0',
  },
  cancelText: {
    fontSize: 16,
    color: '#8E8E8E',
    minWidth: 60,
  },
  modalTitle: {
    flex: 1,
    fontSize: 18,
    fontWeight: '600',
    color: '#2C2C2C',
    textAlign: 'center',
  },
  doneText: {
    fontSize: 16,
    color: '#00A651',
    fontWeight: '600',
    minWidth: 60,
    textAlign: 'right',
  },
  modalContent: {
    flex: 1,
    padding: 20,
  },
  modalSubtitle: {
    fontSize: 16,
    color: '#8E8E8E',
    textAlign: 'center',
    marginBottom: 32,
    lineHeight: 22,
  },
  searchOption: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FFFFFF',
    padding: 20,
    borderRadius: 12,
    marginBottom: 16,
    shadowColor: '#000000',
    shadowOpacity: 0.05,
    shadowRadius: 8,
    shadowOffset: { width: 0, height: 2 },
    elevation: 2,
  },
  searchText: {
    fontSize: 16,
    fontWeight: '500',
    color: '#2C2C2C',
    marginLeft: 16,
  },
});