import React from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  SafeAreaView,
  Image,
} from 'react-native';
import MaterialCommunityIcons from '@expo/vector-icons/MaterialCommunityIcons';
import { colors, spacing, typography } from '../constants';

interface MoreScreenProps {
  navigation?: any;
}

interface MenuSection {
  title: string;
  items: MenuItem[];
}

interface MenuItem {
  id: string;
  title: string;
  subtitle?: string;
  icon: string;
  iconColor?: string;
  onPress: () => void;
  badge?: number;
  isNew?: boolean;
}

const MoreScreen: React.FC<MoreScreenProps> = ({ navigation }) => {
  const handleNavigation = (screenName: string, params?: any) => {
    navigation?.navigate(screenName, params);
  };

  const menuSections: MenuSection[] = [
    {
      title: 'Your Profile',
      items: [
        {
          id: 'profile',
          title: 'View & Edit Profile',
          subtitle: 'Manage your community presence',
          icon: 'account-circle',
          iconColor: colors.primary,
          onPress: () => handleNavigation('Profile'),
        },
        {
          id: 'badges',
          title: 'Community Badges',
          subtitle: '3 badges earned',
          icon: 'shield-star',
          iconColor: colors.accent.warmGold,
          onPress: () => handleNavigation('BadgeSystem'),
        },
        {
          id: 'verification',
          title: 'Verification Center',
          subtitle: 'Enhance your trust level',
          icon: 'shield-check',
          iconColor: colors.accent.trustBlue,
          onPress: () => handleNavigation('PhoneVerificationEnhanced'),
        },
      ],
    },
    {
      title: 'Community',
      items: [
        {
          id: 'events',
          title: 'Events Calendar',
          subtitle: '5 upcoming events',
          icon: 'calendar-multiple',
          iconColor: colors.accent.lagosOrange,
          onPress: () => handleNavigation('Events'),
          badge: 5,
        },
        {
          id: 'neighbors',
          title: 'Neighbor Connections',
          subtitle: 'Connect with your community',
          icon: 'account-group',
          iconColor: colors.accent.neighborPurple,
          onPress: () => handleNavigation('NeighborConnections'),
        },
        {
          id: 'business-directory',
          title: 'Local Business Directory',
          subtitle: 'Find trusted services nearby',
          icon: 'store',
          iconColor: colors.accent.marketGreen,
          onPress: () => handleNavigation('LocalBusinessDirectory'),
        },
        {
          id: 'community-activity',
          title: 'Community Activity',
          subtitle: 'See what\'s happening',
          icon: 'chart-line',
          iconColor: colors.accent.trustBlue,
          onPress: () => handleNavigation('CommunityActivity'),
        },
      ],
    },
    {
      title: 'Safety & Civic',
      items: [
        {
          id: 'safety-alerts',
          title: 'Safety Center',
          subtitle: 'Report and view safety alerts',
          icon: 'shield-alert',
          iconColor: colors.accent.safetyRed,
          onPress: () => {
            // Navigate to safety reporting - could be a new screen
            console.log('Navigate to Safety Center');
          },
        },
        {
          id: 'civic-reports',
          title: 'Civic Reporting',
          subtitle: 'Report community issues',
          icon: 'clipboard-text',
          iconColor: colors.accent.trustBlue,
          onPress: () => {
            // Navigate to civic reporting - could be a new screen
            console.log('Navigate to Civic Reporting');
          },
          isNew: true,
        },
        {
          id: 'estate-manager',
          title: 'Estate Management',
          subtitle: 'Connect with your estate',
          icon: 'office-building',
          iconColor: colors.neutral.richCharcoal,
          onPress: () => handleNavigation('EstateManager'),
        },
      ],
    },
    {
      title: 'Business',
      items: [
        {
          id: 'business-profile',
          title: 'Business Profile',
          subtitle: 'Manage your business presence',
          icon: 'briefcase',
          iconColor: colors.accent.marketGreen,
          onPress: () => handleNavigation('BusinessProfile'),
        },
        {
          id: 'business-registration',
          title: 'Register Your Business',
          subtitle: 'Get verified as a service provider',
          icon: 'store-plus',
          iconColor: colors.primary,
          onPress: () => handleNavigation('BusinessRegistration'),
        },
      ],
    },
    {
      title: 'Settings & Support',
      items: [
        {
          id: 'notifications',
          title: 'Notification Settings',
          subtitle: 'Customize your alerts',
          icon: 'bell-cog',
          iconColor: colors.neutral.friendlyGray,
          onPress: () => {
            console.log('Navigate to Notification Settings');
          },
        },
        {
          id: 'privacy',
          title: 'Privacy & Safety',
          subtitle: 'Control your visibility',
          icon: 'shield-account',
          iconColor: colors.neutral.friendlyGray,
          onPress: () => {
            console.log('Navigate to Privacy Settings');
          },
        },
        {
          id: 'help',
          title: 'Help & Support',
          subtitle: 'Get help with MeCabal',
          icon: 'help-circle',
          iconColor: colors.neutral.friendlyGray,
          onPress: () => {
            console.log('Navigate to Help Center');
          },
        },
        {
          id: 'about',
          title: 'About MeCabal',
          subtitle: 'Version 1.0.0',
          icon: 'information',
          iconColor: colors.neutral.friendlyGray,
          onPress: () => {
            console.log('Navigate to About');
          },
        },
      ],
    },
  ];

  const ProfileHeader = () => (
    <View style={styles.profileHeader}>
      <TouchableOpacity 
        style={styles.profileInfo}
        onPress={() => handleNavigation('Profile')}
      >
        <View style={styles.profileAvatar}>
          <MaterialCommunityIcons
            name="account"
            size={32}
            color={colors.neutral.pureWhite}
          />
        </View>
        <View style={styles.profileDetails}>
          <Text style={styles.profileName}>Adebayo Ogundimu</Text>
          <Text style={styles.profileLocation}>Victoria Island Estate, Lagos</Text>
          <View style={styles.verificationBadge}>
            <MaterialCommunityIcons
              name="shield-check"
              size={14}
              color={colors.primary}
            />
            <Text style={styles.verificationText}>Verified Resident</Text>
          </View>
        </View>
      </TouchableOpacity>
      
      <TouchableOpacity style={styles.editButton}>
        <MaterialCommunityIcons
          name="pencil"
          size={18}
          color={colors.primary}
        />
      </TouchableOpacity>
    </View>
  );

  const MenuItem: React.FC<{ item: MenuItem }> = ({ item }) => (
    <TouchableOpacity style={styles.menuItem} onPress={item.onPress}>
      <View style={styles.menuItemLeft}>
        <View style={[styles.menuIcon, { backgroundColor: `${item.iconColor}15` }]}>
          <MaterialCommunityIcons
            name={item.icon}
            size={24}
            color={item.iconColor || colors.neutral.friendlyGray}
          />
        </View>
        <View style={styles.menuItemText}>
          <View style={styles.menuItemTitleRow}>
            <Text style={styles.menuItemTitle}>{item.title}</Text>
            {item.isNew && (
              <View style={styles.newBadge}>
                <Text style={styles.newBadgeText}>NEW</Text>
              </View>
            )}
            {item.badge && (
              <View style={styles.badge}>
                <Text style={styles.badgeText}>{item.badge}</Text>
              </View>
            )}
          </View>
          {item.subtitle && (
            <Text style={styles.menuItemSubtitle}>{item.subtitle}</Text>
          )}
        </View>
      </View>
      
      <MaterialCommunityIcons
        name="chevron-right"
        size={20}
        color={colors.neutral.friendlyGray}
      />
    </TouchableOpacity>
  );

  return (
    <SafeAreaView style={styles.container}>
      <ScrollView style={styles.scrollView} showsVerticalScrollIndicator={false}>
        <ProfileHeader />
        
        {menuSections.map((section, sectionIndex) => (
          <View key={section.title} style={styles.section}>
            <Text style={styles.sectionTitle}>{section.title}</Text>
            <View style={styles.sectionContent}>
              {section.items.map((item, itemIndex) => (
                <View key={item.id}>
                  <MenuItem item={item} />
                  {itemIndex < section.items.length - 1 && (
                    <View style={styles.separator} />
                  )}
                </View>
              ))}
            </View>
          </View>
        ))}
        
        {/* Footer */}
        <View style={styles.footer}>
          <Text style={styles.footerText}>
            Made with ❤️ for Nigerian Communities
          </Text>
          <Text style={styles.footerVersion}>MeCabal v1.0.0</Text>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.neutral.warmOffWhite,
  },
  scrollView: {
    flex: 1,
  },
  profileHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.neutral.pureWhite,
    padding: spacing.lg,
    marginBottom: spacing.lg,
    shadowColor: colors.neutral.deepBlack,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 8,
    elevation: 2,
  },
  profileInfo: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  profileAvatar: {
    width: 60,
    height: 60,
    borderRadius: 30,
    backgroundColor: colors.primary,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: spacing.md,
  },
  profileDetails: {
    flex: 1,
  },
  profileName: {
    fontSize: typography.sizes.lg,
    fontWeight: '600',
    color: colors.neutral.richCharcoal,
    marginBottom: spacing.xs,
  },
  profileLocation: {
    fontSize: typography.sizes.sm,
    color: colors.neutral.friendlyGray,
    marginBottom: spacing.xs,
  },
  verificationBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  verificationText: {
    fontSize: typography.sizes.xs,
    color: colors.primary,
    fontWeight: '500',
  },
  editButton: {
    padding: spacing.sm,
  },
  section: {
    marginBottom: spacing.lg,
  },
  sectionTitle: {
    fontSize: typography.sizes.sm,
    fontWeight: '600',
    color: colors.neutral.richCharcoal,
    textTransform: 'uppercase',
    letterSpacing: 0.5,
    marginHorizontal: spacing.lg,
    marginBottom: spacing.sm,
  },
  sectionContent: {
    backgroundColor: colors.neutral.pureWhite,
    marginHorizontal: spacing.md,
    borderRadius: 12,
    shadowColor: colors.neutral.deepBlack,
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 2,
    elevation: 1,
  },
  menuItem: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.md,
  },
  menuItemLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  menuIcon: {
    width: 40,
    height: 40,
    borderRadius: 20,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: spacing.md,
  },
  menuItemText: {
    flex: 1,
  },
  menuItemTitleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: spacing.xs,
  },
  menuItemTitle: {
    fontSize: typography.sizes.base,
    fontWeight: '500',
    color: colors.neutral.richCharcoal,
    flex: 1,
  },
  menuItemSubtitle: {
    fontSize: typography.sizes.sm,
    color: colors.neutral.friendlyGray,
    lineHeight: 18,
  },
  newBadge: {
    backgroundColor: colors.accent.lagosOrange,
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 8,
    marginLeft: spacing.sm,
  },
  newBadgeText: {
    fontSize: typography.sizes.xs,
    fontWeight: '600',
    color: colors.neutral.pureWhite,
  },
  badge: {
    backgroundColor: colors.primary,
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 10,
    marginLeft: spacing.sm,
  },
  badgeText: {
    fontSize: typography.sizes.xs,
    fontWeight: '600',
    color: colors.neutral.pureWhite,
  },
  separator: {
    height: 1,
    backgroundColor: colors.neutral.softGray,
    marginLeft: spacing.md + 40 + spacing.md, // Align with text
  },
  footer: {
    alignItems: 'center',
    paddingVertical: spacing.xl,
    paddingHorizontal: spacing.lg,
  },
  footerText: {
    fontSize: typography.sizes.sm,
    color: colors.neutral.friendlyGray,
    textAlign: 'center',
    marginBottom: spacing.xs,
  },
  footerVersion: {
    fontSize: typography.sizes.xs,
    color: colors.neutral.friendlyGray,
    textAlign: 'center',
  },
});

export default MoreScreen;