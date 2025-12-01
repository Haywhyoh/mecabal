import React, { useState, useEffect } from 'react';
import { TouchableOpacity, StyleSheet, ActivityIndicator, Alert, Text } from 'react-native';
import MaterialCommunityIcons from '@expo/vector-icons/MaterialCommunityIcons';
import { UserDashboardService } from '../../services/userDashboard';
import { useProfile } from '../../contexts/ProfileContext';

interface BookmarkButtonProps {
  itemType: 'post' | 'listing' | 'event';
  itemId: string;
  size?: 'small' | 'medium' | 'large';
  showText?: boolean;
  onBookmarkChange?: (isBookmarked: boolean) => void;
  disabled?: boolean;
}

export default function BookmarkButton({
  itemType,
  itemId,
  size = 'medium',
  showText = false,
  onBookmarkChange,
  disabled = false,
}: BookmarkButtonProps) {
  const { refreshDashboard } = useProfile();
  const [isBookmarked, setIsBookmarked] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [isChecking, setIsChecking] = useState(true);

  // Check bookmark status on mount
  useEffect(() => {
    checkBookmarkStatus();
  }, [itemId]);

  const checkBookmarkStatus = async () => {
    try {
      setIsChecking(true);
      const response = await UserDashboardService.isBookmarked(itemType, itemId);
      if (response.success && response.data) {
        setIsBookmarked(response.data.isBookmarked);
      }
    } catch (error) {
      console.error('Error checking bookmark status:', error);
    } finally {
      setIsChecking(false);
    }
  };

  const handleToggleBookmark = async () => {
    if (disabled || isLoading) return;

    try {
      setIsLoading(true);
      
      const response = await UserDashboardService.toggleBookmark(itemType, itemId);
      
      if (response.success) {
        const newBookmarkStatus = !isBookmarked;
        setIsBookmarked(newBookmarkStatus);
        
        // Refresh dashboard stats
        await refreshDashboard();
        
        // Notify parent component
        onBookmarkChange?.(newBookmarkStatus);
        
        // Show feedback
        if (newBookmarkStatus) {
          // Could show a toast or haptic feedback
          console.log('Item bookmarked successfully');
        } else {
          console.log('Bookmark removed successfully');
        }
      } else {
        Alert.alert('Error', response.error || 'Failed to update bookmark');
      }
    } catch (error: any) {
      console.error('Bookmark toggle error:', error);
      Alert.alert('Error', 'Failed to update bookmark. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };

  const getSizeConfig = () => {
    switch (size) {
      case 'small':
        return { iconSize: 16, fontSize: 12, padding: 6 };
      case 'large':
        return { iconSize: 24, fontSize: 16, padding: 12 };
      case 'medium':
      default:
        return { iconSize: 20, fontSize: 14, padding: 8 };
    }
  };

  const sizeConfig = getSizeConfig();

  if (isChecking) {
    return (
      <TouchableOpacity style={[styles.button, { padding: sizeConfig.padding }]} disabled>
        <ActivityIndicator size="small" color="#8E8E8E" />
      </TouchableOpacity>
    );
  }

  return (
    <TouchableOpacity
      style={[
        styles.button,
        {
          padding: sizeConfig.padding,
          backgroundColor: isBookmarked ? '#00A651' : '#F8F9FA',
          borderColor: isBookmarked ? '#00A651' : '#E0E0E0',
        },
        disabled && styles.disabled,
      ]}
      onPress={handleToggleBookmark}
      disabled={disabled || isLoading}
      activeOpacity={0.7}
    >
      {isLoading ? (
        <ActivityIndicator size="small" color={isBookmarked ? '#FFFFFF' : '#8E8E8E'} />
      ) : (
        <MaterialCommunityIcons
          name={isBookmarked ? 'bookmark' : 'bookmark-outline'}
          size={sizeConfig.iconSize}
          color={isBookmarked ? '#FFFFFF' : '#8E8E8E'}
        />
      )}
      
      {showText && (
        <Text
          style={[
            styles.buttonText,
            {
              fontSize: sizeConfig.fontSize,
              color: isBookmarked ? '#FFFFFF' : '#8E8E8E',
              marginLeft: 4,
            },
          ]}
        >
          {isBookmarked ? 'Saved' : 'Save'}
        </Text>
      )}
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  button: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: 8,
    borderWidth: 1,
  },
  disabled: {
    opacity: 0.5,
  },
  buttonText: {
    fontWeight: '600',
  },
});
