import React from 'react';
import { View, Text, StyleSheet, ScrollView, SafeAreaView, TouchableOpacity } from 'react-native';
import MaterialCommunityIcons from '@expo/vector-icons/MaterialCommunityIcons';

export default function DiscoverScreen() {
  return (
    <SafeAreaView style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <Text style={styles.headerTitle}>Discover</Text>
        <Text style={styles.headerSubtitle}>Find new communities and groups</Text>
      </View>

      <ScrollView style={styles.scrollView} showsVerticalScrollIndicator={false}>
        {/* Nearby Communities */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Nearby Communities</Text>
          
          <TouchableOpacity style={styles.communityCard}>
            <View style={styles.communityIcon}>
              <MaterialCommunityIcons name="home-group" size={24} color="#00A651" />
            </View>
            <View style={styles.communityInfo}>
              <Text style={styles.communityName}>Banana Island Estate</Text>
              <Text style={styles.communityLocation}>📍 Ikoyi, Lagos • 2.3km away</Text>
              <Text style={styles.memberCount}>1,247 members • Very active</Text>
            </View>
            <TouchableOpacity style={styles.joinButton}>
              <Text style={styles.joinButtonText}>Join</Text>
            </TouchableOpacity>
          </TouchableOpacity>

          <TouchableOpacity style={styles.communityCard}>
            <View style={styles.communityIcon}>
              <MaterialCommunityIcons name="building" size={24} color="#FF6B35" />
            </View>
            <View style={styles.communityInfo}>
              <Text style={styles.communityName}>Lekki Gardens Phase 2</Text>
              <Text style={styles.communityLocation}>📍 Lekki, Lagos • 4.1km away</Text>
              <Text style={styles.memberCount}>892 members • Active</Text>
            </View>
            <TouchableOpacity style={styles.joinButton}>
              <Text style={styles.joinButtonText}>Join</Text>
            </TouchableOpacity>
          </TouchableOpacity>

          <TouchableOpacity style={styles.communityCard}>
            <View style={styles.communityIcon}>
              <MaterialCommunityIcons name="city" size={24} color="#7B68EE" />
            </View>
            <View style={styles.communityInfo}>
              <Text style={styles.communityName}>Maitama District</Text>
              <Text style={styles.communityLocation}>📍 Abuja FCT • 1.8km away</Text>
              <Text style={styles.memberCount}>2,156 members • Very active</Text>
            </View>
            <TouchableOpacity style={styles.joinButton}>
              <Text style={styles.joinButtonText}>Join</Text>
            </TouchableOpacity>
          </TouchableOpacity>
        </View>

        {/* Interest Groups */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Interest Groups</Text>
          
          <View style={styles.groupsGrid}>
            <TouchableOpacity style={styles.groupCard}>
              <MaterialCommunityIcons name="shield-account" size={28} color="#0066CC" />
              <Text style={styles.groupName}>Neighborhood Watch</Text>
              <Text style={styles.groupMembers}>156 members</Text>
            </TouchableOpacity>

            <TouchableOpacity style={styles.groupCard}>
              <MaterialCommunityIcons name="baby-face" size={28} color="#FF69B4" />
              <Text style={styles.groupName}>Lagos Moms</Text>
              <Text style={styles.groupMembers}>324 members</Text>
            </TouchableOpacity>

            <TouchableOpacity style={styles.groupCard}>
              <MaterialCommunityIcons name="soccer" size={28} color="#228B22" />
              <Text style={styles.groupName}>Weekend Football</Text>
              <Text style={styles.groupMembers}>89 members</Text>
            </TouchableOpacity>

            <TouchableOpacity style={styles.groupCard}>
              <MaterialCommunityIcons name="food" size={28} color="#FFC107" />
              <Text style={styles.groupName}>Foodies Lagos</Text>
              <Text style={styles.groupMembers}>267 members</Text>
            </TouchableOpacity>
          </View>
        </View>

        {/* Popular in Lagos */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Popular in Lagos</Text>
          
          <TouchableOpacity style={styles.popularCard}>
            <View style={styles.popularIcon}>
              <MaterialCommunityIcons name="car" size={20} color="#FFFFFF" />
            </View>
            <View style={styles.popularInfo}>
              <Text style={styles.popularName}>Lagos Carpooling Network</Text>
              <Text style={styles.popularDesc}>Share rides, save money, reduce traffic</Text>
              <Text style={styles.popularStats}>5,432 members • 127 active rides today</Text>
            </View>
          </TouchableOpacity>

          <TouchableOpacity style={styles.popularCard}>
            <View style={styles.popularIcon}>
              <MaterialCommunityIcons name="briefcase" size={20} color="#FFFFFF" />
            </View>
            <View style={styles.popularInfo}>
              <Text style={styles.popularName}>Tech Professionals Lagos</Text>
              <Text style={styles.popularDesc}>Networking, job opportunities, skill sharing</Text>
              <Text style={styles.popularStats}>2,894 members • 45 job posts this week</Text>
            </View>
          </TouchableOpacity>

          <TouchableOpacity style={styles.popularCard}>
            <View style={styles.popularIcon}>
              <MaterialCommunityIcons name="wrench" size={20} color="#FFFFFF" />
            </View>
            <View style={styles.popularInfo}>
              <Text style={styles.popularName}>Home Services Lagos</Text>
              <Text style={styles.popularDesc}>Find trusted electricians, plumbers, cleaners</Text>
              <Text style={styles.popularStats}>3,621 members • 98% satisfaction rate</Text>
            </View>
          </TouchableOpacity>
        </View>

        {/* Create Community CTA */}
        <View style={styles.section}>
          <TouchableOpacity style={styles.createCommunityCard}>
            <MaterialCommunityIcons name="plus-circle" size={32} color="#00A651" />
            <Text style={styles.createTitle}>Start Your Own Community</Text>
            <Text style={styles.createDesc}>Can't find what you're looking for? Create a new community or group for your neighborhood.</Text>
            <View style={styles.createButton}>
              <Text style={styles.createButtonText}>Create Community</Text>
            </View>
          </TouchableOpacity>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#FAFAFA',
  },
  header: {
    backgroundColor: '#FFFFFF',
    paddingHorizontal: 16,
    paddingTop: 16,
    paddingBottom: 24,
    borderBottomWidth: 1,
    borderBottomColor: '#F0F0F0',
  },
  headerTitle: {
    fontSize: 28,
    fontWeight: '700',
    color: '#2C2C2C',
    marginBottom: 4,
  },
  headerSubtitle: {
    fontSize: 16,
    color: '#8E8E8E',
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
    fontWeight: '600',
    color: '#2C2C2C',
    paddingHorizontal: 16,
    marginBottom: 16,
  },
  communityCard: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#F5F5F5',
  },
  communityIcon: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: '#F5F5F5',
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 16,
  },
  communityInfo: {
    flex: 1,
  },
  communityName: {
    fontSize: 16,
    fontWeight: '600',
    color: '#2C2C2C',
    marginBottom: 4,
  },
  communityLocation: {
    fontSize: 14,
    color: '#8E8E8E',
    marginBottom: 2,
  },
  memberCount: {
    fontSize: 12,
    color: '#00A651',
    fontWeight: '500',
  },
  joinButton: {
    backgroundColor: '#00A651',
    borderRadius: 8,
    paddingVertical: 8,
    paddingHorizontal: 16,
  },
  joinButtonText: {
    fontSize: 14,
    fontWeight: '600',
    color: '#FFFFFF',
  },
  groupsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    paddingHorizontal: 16,
    justifyContent: 'space-between',
  },
  groupCard: {
    width: '48%',
    backgroundColor: '#F5F5F5',
    borderRadius: 12,
    padding: 16,
    alignItems: 'center',
    marginBottom: 12,
  },
  groupName: {
    fontSize: 14,
    fontWeight: '600',
    color: '#2C2C2C',
    marginTop: 8,
    marginBottom: 4,
    textAlign: 'center',
  },
  groupMembers: {
    fontSize: 12,
    color: '#8E8E8E',
  },
  popularCard: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#F5F5F5',
  },
  popularIcon: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: '#00A651',
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 16,
  },
  popularInfo: {
    flex: 1,
  },
  popularName: {
    fontSize: 16,
    fontWeight: '600',
    color: '#2C2C2C',
    marginBottom: 4,
  },
  popularDesc: {
    fontSize: 14,
    color: '#8E8E8E',
    marginBottom: 4,
  },
  popularStats: {
    fontSize: 12,
    color: '#00A651',
    fontWeight: '500',
  },
  createCommunityCard: {
    backgroundColor: '#F5F5F5',
    marginHorizontal: 16,
    borderRadius: 16,
    padding: 24,
    alignItems: 'center',
    borderWidth: 2,
    borderColor: '#E8F5E8',
    borderStyle: 'dashed',
  },
  createTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#2C2C2C',
    marginTop: 12,
    marginBottom: 8,
  },
  createDesc: {
    fontSize: 14,
    color: '#8E8E8E',
    textAlign: 'center',
    lineHeight: 20,
    marginBottom: 20,
  },
  createButton: {
    backgroundColor: '#00A651',
    borderRadius: 12,
    paddingVertical: 12,
    paddingHorizontal: 24,
  },
  createButtonText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#FFFFFF',
  },
});