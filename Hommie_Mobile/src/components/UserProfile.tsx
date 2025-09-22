import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';
import MaterialCommunityIcons from '@expo/vector-icons/MaterialCommunityIcons';
import { NigerianUser } from '../types/supabase';
import { UserAvatar } from './UserAvatar';

interface UserProfileProps {
  user?: NigerianUser | null;
  size?: 'small' | 'medium' | 'large';
  showLocation?: boolean;
  showJoinDate?: boolean;
  showVerificationBadge?: boolean;
  showCameraButton?: boolean;
  horizontal?: boolean;
  onPress?: () => void;
  onAvatarPress?: () => void;
  onCameraPress?: () => void;
}

export const UserProfile: React.FC<UserProfileProps> = ({
  user,
  size = 'medium',
  showLocation = false,
  showJoinDate = false,
  showVerificationBadge = true,
  showCameraButton = false,
  horizontal = false,
  onPress,
  onAvatarPress,
  onCameraPress,
}) => {
  // Helper function to get full user name
  const getUserName = () => {
    if (user?.firstName && user?.lastName) {
      return `${user.firstName} ${user.lastName}`;
    } else if (user?.firstName) {
      return user.firstName;
    } else if (user?.email) {
      return user.email.split('@')[0];
    } else if (user?.phoneNumber) {
      return user.phoneNumber;
    }
    return 'User';
  };

  // Helper function to format join date
  const getJoinDate = () => {
    if (user?.createdAt) {
      const date = new Date(user.createdAt);
      return `Member since ${date.toLocaleDateString('en-US', { month: 'long', year: 'numeric' })}`;
    }
    return 'New member';
  };

  // Helper function to get location
  const getUserLocation = () => {
    if (user?.address) {
      return user.address;
    } else if (user?.estate) {
      return user.estate;
    } else if (user?.city) {
      return user.city;
    } else if (user?.state) {
      return user.state;
    }
    return 'Location not set';
  };

  const nameStyles = {
    small: styles.nameSmall,
    medium: styles.nameMedium,
    large: styles.nameLarge,
  };

  const ProfileContent = () => (
    <View style={[
      styles.container,
      horizontal ? styles.horizontalLayout : styles.verticalLayout
    ]}>
      <UserAvatar
        user={user}
        size={size}
        showBadge={showVerificationBadge}
        showCameraButton={showCameraButton}
        onPress={onAvatarPress}
        onCameraPress={onCameraPress}
      />

      <View style={[
        styles.infoContainer,
        horizontal ? styles.infoHorizontal : styles.infoVertical
      ]}>
        <Text style={[styles.userName, nameStyles[size]]}>
          {getUserName()}
        </Text>

        {showLocation && (
          <View style={styles.locationContainer}>
            <MaterialCommunityIcons name="map-marker" size={14} color="#8E8E8E" />
            <Text style={styles.locationText}>{getUserLocation()}</Text>
          </View>
        )}

        {showJoinDate && (
          <Text style={styles.joinDate}>{getJoinDate()}</Text>
        )}

        {showVerificationBadge && user?.isVerified && (
          <View style={styles.verificationContainer}>
            <MaterialCommunityIcons name="check-circle" size={16} color="#00A651" />
            <Text style={styles.verifiedText}>
              {user?.phoneNumber ? 'Phone Verified' : 'Verified'}
            </Text>
          </View>
        )}
      </View>
    </View>
  );

  if (onPress) {
    return (
      <TouchableOpacity onPress={onPress} style={styles.touchable}>
        <ProfileContent />
      </TouchableOpacity>
    );
  }

  return <ProfileContent />;
};

const styles = StyleSheet.create({
  container: {
    alignItems: 'center',
  },
  verticalLayout: {
    flexDirection: 'column',
  },
  horizontalLayout: {
    flexDirection: 'row',
  },
  touchable: {
    borderRadius: 12,
  },
  infoContainer: {
    alignItems: 'center',
  },
  infoVertical: {
    marginTop: 12,
  },
  infoHorizontal: {
    marginLeft: 12,
    alignItems: 'flex-start',
    flex: 1,
  },
  userName: {
    color: '#2C2C2C',
    fontWeight: '600',
    textAlign: 'center',
  },
  nameSmall: {
    fontSize: 14,
  },
  nameMedium: {
    fontSize: 18,
  },
  nameLarge: {
    fontSize: 24,
    fontWeight: '700',
  },
  locationContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 4,
  },
  locationText: {
    fontSize: 14,
    color: '#8E8E8E',
    marginLeft: 4,
  },
  joinDate: {
    fontSize: 12,
    color: '#8E8E8E',
    marginTop: 4,
  },
  verificationContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#E8F5E8',
    paddingVertical: 4,
    paddingHorizontal: 8,
    borderRadius: 12,
    marginTop: 8,
  },
  verifiedText: {
    fontSize: 12,
    color: '#00A651',
    fontWeight: '600',
    marginLeft: 4,
  },
});

export default UserProfile;