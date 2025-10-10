import React, { useState } from 'react';
import { View, Text, Image, StyleSheet, TouchableOpacity, ActivityIndicator, Alert } from 'react-native';
import MaterialCommunityIcons from '@expo/vector-icons/MaterialCommunityIcons';
import { NigerianUser } from '../types/supabase';
import { AvatarUploadService } from '../services/avatarUpload';

interface UserAvatarProps {
  user?: NigerianUser | null;
  size?: 'small' | 'medium' | 'large';
  showBadge?: boolean;
  showCameraButton?: boolean;
  onPress?: () => void;
  onCameraPress?: () => void;
  onAvatarUpdated?: (avatarUrl: string) => void;
}

export const UserAvatar: React.FC<UserAvatarProps> = ({
  user,
  size = 'medium',
  showBadge = false,
  showCameraButton = false,
  onPress,
  onCameraPress,
  onAvatarUpdated,
}) => {
  const [isUploadingAvatar, setIsUploadingAvatar] = useState(false);

  const handleAvatarPress = async () => {
    if (onCameraPress) {
      onCameraPress();
      return;
    }

    // Default avatar change behavior
    try {
      const imageUri = await AvatarUploadService.showAvatarPicker();
      if (imageUri) {
        setIsUploadingAvatar(true);
        const result = await AvatarUploadService.uploadAvatar(imageUri);

        if (result.success && result.data) {
          onAvatarUpdated?.(result.data.avatarUrl);
          Alert.alert('Success', 'Profile photo updated!');
        } else {
          Alert.alert('Error', result.error || 'Failed to upload photo');
        }
      }
    } catch (error) {
      Alert.alert('Error', 'Failed to change avatar');
    } finally {
      setIsUploadingAvatar(false);
    }
  };

  // Helper function to get user initials
  const getUserInitials = () => {
    if (user?.firstName && user?.lastName) {
      return `${user.firstName.charAt(0)}${user.lastName.charAt(0)}`.toUpperCase();
    } else if (user?.firstName) {
      return user.firstName.charAt(0).toUpperCase();
    } else if (user?.email) {
      return user.email.charAt(0).toUpperCase();
    } else if (user?.phoneNumber) {
      return user.phoneNumber.charAt(1) || 'U'; // Skip the +
    }
    return 'U';
  };

  const sizeStyles = {
    small: { width: 40, height: 40, borderRadius: 20 },
    medium: { width: 60, height: 60, borderRadius: 30 },
    large: { width: 120, height: 120, borderRadius: 60 },
  };

  const textSizeStyles = {
    small: { fontSize: 16 },
    medium: { fontSize: 24 },
    large: { fontSize: 48 },
  };

  const badgeSizeStyles = {
    small: { width: 12, height: 12, borderRadius: 6, right: -2, bottom: -2 },
    medium: { width: 16, height: 16, borderRadius: 8, right: 2, bottom: 2 },
    large: { width: 20, height: 20, borderRadius: 10, right: 8, bottom: 8 },
  };

  const cameraSizeStyles = {
    small: { width: 20, height: 20, borderRadius: 10, right: -2, bottom: -2 },
    medium: { width: 24, height: 24, borderRadius: 12, right: 2, bottom: 2 },
    large: { width: 32, height: 32, borderRadius: 16, right: 8, bottom: 8 },
  };

  const cameraIconSizes = {
    small: 12,
    medium: 14,
    large: 16,
  };

  // Get avatar URL - handle multiple possible field names from API
  const getAvatarUrl = () => {
    // Try different possible field names
    if (user?.profilePictureUrl) return user.profilePictureUrl;

    const userAny = user as any;
    if (userAny?.profilePicture) return userAny.profilePicture;
    if (userAny?.profile_picture_url) return userAny.profile_picture_url;
    if (userAny?.avatar_url) return userAny.avatar_url;
    if (userAny?.avatarUrl) return userAny.avatarUrl;

    return null;
  };

  const avatarUrl = getAvatarUrl();

  const AvatarContent = () => (
    <View style={[styles.avatarContainer, sizeStyles[size]]}>
      {avatarUrl ? (
        <Image
          source={{ uri: avatarUrl }}
          style={[styles.avatarImage, sizeStyles[size]]}
        />
      ) : (
        <View style={[styles.avatar, sizeStyles[size]]}>
          <Text style={[styles.avatarText, textSizeStyles[size]]}>
            {getUserInitials()}
          </Text>
        </View>
      )}

      {/* Verification Badge */}
      {showBadge && user?.isVerified && (
        <View style={[styles.verificationBadge, badgeSizeStyles[size]]}>
          <MaterialCommunityIcons
            name="check"
            size={size === 'small' ? 8 : size === 'medium' ? 10 : 12}
            color="#FFFFFF"
          />
        </View>
      )}

      {/* Camera Button */}
      {showCameraButton && (
        <TouchableOpacity
          style={[styles.cameraButton, cameraSizeStyles[size]]}
          onPress={handleAvatarPress}
          disabled={isUploadingAvatar}
        >
          {isUploadingAvatar ? (
            <ActivityIndicator size="small" color="#2C2C2C" />
          ) : (
            <MaterialCommunityIcons
              name="camera"
              size={cameraIconSizes[size]}
              color="#2C2C2C"
            />
          )}
        </TouchableOpacity>
      )}
    </View>
  );

  if (onPress) {
    return (
      <TouchableOpacity onPress={onPress}>
        <AvatarContent />
      </TouchableOpacity>
    );
  }

  return <AvatarContent />;
};

const styles = StyleSheet.create({
  avatarContainer: {
    position: 'relative',
  },
  avatar: {
    backgroundColor: '#00A651',
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: '#000000',
    shadowOpacity: 0.1,
    shadowRadius: 8,
    shadowOffset: { width: 0, height: 2 },
    elevation: 3,
  },
  avatarImage: {
    resizeMode: 'cover',
  },
  avatarText: {
    fontWeight: '700',
    color: '#FFFFFF',
  },
  verificationBadge: {
    position: 'absolute',
    backgroundColor: '#00A651',
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 2,
    borderColor: '#FFFFFF',
  },
  cameraButton: {
    position: 'absolute',
    backgroundColor: '#FFFFFF',
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: '#000000',
    shadowOpacity: 0.15,
    shadowRadius: 4,
    shadowOffset: { width: 0, height: 2 },
    elevation: 3,
  },
});

export default UserAvatar;