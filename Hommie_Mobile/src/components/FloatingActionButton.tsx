import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Animated,
  Dimensions,
} from 'react-native';
import { useFocusEffect } from '@react-navigation/native';
import MaterialCommunityIcons from '@expo/vector-icons/MaterialCommunityIcons';
import { colors, spacing, typography } from '../constants';

interface PostType {
  id: string;
  title: string;
  description: string;
  icon: string;
  color: string;
  onPress: () => void;
}

interface FloatingActionButtonProps {
  navigation?: any;
}

const { width: screenWidth, height: screenHeight } = Dimensions.get('window');

const FloatingActionButton: React.FC<FloatingActionButtonProps> = ({ navigation }) => {
  const [isExpanded, setIsExpanded] = useState(false);
  const [animation] = useState(new Animated.Value(0));

  const postTypes: PostType[] = [
    {
      id: 'general',
      title: 'General Post',
      description: 'Share news, updates, or start a conversation',
      icon: 'text',
      color: colors.primary,
      onPress: () => handlePostType('general'),
    },
    {
      id: 'help',
      title: 'Ask for Help',
      description: 'Get help with jobs, errands, or recommendations',
      icon: 'hand',
      color: colors.accent.lagosOrange,
      onPress: () => handlePostType('help'),
    },
    {
      id: 'listing',
      title: 'Create Listing',
      description: 'Sell property, items, or offer services',
      icon: 'pricetag',
      color: colors.accent.marketGreen,
      onPress: () => handlePostType('listing'),
    },
    {
      id: 'event',
      title: 'Create Event',
      description: 'Organize a community gathering',
      icon: 'calendar-outline',
      color: colors.accent.trustBlue,
      onPress: () => handlePostType('event'),
    },
    {
      id: 'alert',
      title: 'Safety Alert',
      description: 'Report security or emergency situations',
      icon: 'shield-alert',
      color: colors.accent.safetyRed,
      onPress: () => handlePostType('alert'),
    },
  ];

  const closeModal = () => {
    setIsExpanded(false);
    Animated.spring(animation, {
      toValue: 0,
      useNativeDriver: false,
      tension: 100,
      friction: 8,
    }).start();
  };

  const handlePostType = (type: string) => {
    closeModal();

    switch (type) {
      case 'general':
        navigation?.navigate('CreatePost', { postType: 'general' });
        break;
      case 'help':
        navigation?.navigate('CreateHelpPost');
        break;
      case 'listing':
        navigation?.navigate('Market', {
          screen: 'CreateListing'
        });
        break;
      case 'event':
        navigation?.navigate('CreateEvent');
        break;
      case 'alert':
        navigation?.navigate('CreatePost', { postType: 'alert' });
        break;
    }
  };

  const toggleExpanded = () => {
    if (isExpanded) {
      closeModal();
    } else {
      setIsExpanded(true);
      Animated.spring(animation, {
        toValue: 1,
        useNativeDriver: false,
        tension: 100,
        friction: 8,
      }).start();
    }
  };

  // Reset state when screen loses focus
  useFocusEffect(
    React.useCallback(() => {
      return () => {
        // Cleanup when leaving screen
        closeModal();
      };
    }, [])
  );

  const fabScale = animation.interpolate({
    inputRange: [0, 1],
    outputRange: [1, 1.1],
  });

  const PostTypeButton: React.FC<{ postType: PostType; index: number }> = ({ postType, index }) => {
    const buttonTranslateY = animation.interpolate({
      inputRange: [0, 1],
      outputRange: [0, -(65 * (index + 1))], // Spacing for 5 icons
    });

    const buttonOpacity = animation.interpolate({
      inputRange: [0, 0.3, 1],
      outputRange: [0, 0.7, 1], // Faster fade-in for better UX
    });

    const buttonScale = animation.interpolate({
      inputRange: [0, 1],
      outputRange: [0.3, 1], // Scale animation for more dynamic effect
    });

    return (
      <Animated.View
        style={[
          styles.postTypeButton,
          {
            transform: [
              { translateY: buttonTranslateY },
              { scale: buttonScale }
            ],
            opacity: buttonOpacity,
          },
        ]}
      >
        <TouchableOpacity
          style={[
            styles.postTypeButtonInner,
            { borderColor: postType.color }
          ]}
          onPress={postType.onPress}
          activeOpacity={0.8}
        >
          <MaterialCommunityIcons
            name={postType.icon as any}
            size={24}
            color={postType.color}
          />
        </TouchableOpacity>
      </Animated.View>
    );
  };

  return (
    <>
      {/* Floating Icons Backdrop */}
      {isExpanded && (
        <TouchableOpacity
          style={styles.floatingBackdrop}
          activeOpacity={1}
          onPress={closeModal}
        >
          <Animated.View
            style={[
              styles.backdropOverlay,
              {
                opacity: animation.interpolate({
                  inputRange: [0, 1],
                  outputRange: [0, 1],
                }),
              },
            ]}
          />
        </TouchableOpacity>
      )}

      {/* Main FAB */}
      <View style={styles.fabContainer}>
        {isExpanded && (
          <View style={styles.postTypeContainer}>
            {postTypes.map((postType, index) => (
              <PostTypeButton key={postType.id} postType={postType} index={index} />
            ))}
          </View>
        )}

        <Animated.View
          style={[
            styles.fab,
            {
              transform: [{ scale: fabScale }],
            },
          ]}
        >
          <TouchableOpacity
            style={styles.fabButton}
            onPress={toggleExpanded}
            activeOpacity={0.8}
          >
            <MaterialCommunityIcons
              name={isExpanded ? "close" : "plus"}
              size={28}
              color={colors.neutral.pureWhite}
            />
          </TouchableOpacity>
        </Animated.View>
      </View>
    </>
  );
};

const styles = StyleSheet.create({
  fabContainer: {
    position: 'absolute',
    bottom: 100, // Above tab bar
    right: spacing.lg,
    alignItems: 'center',
  },
  fab: {
    width: 56,
    height: 56,
    borderRadius: 28,
    backgroundColor: colors.primary,
    shadowColor: colors.neutral.darkGray,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 8,
  },
  fabButton: {
    width: '100%',
    height: '100%',
    borderRadius: 28,
    alignItems: 'center',
    justifyContent: 'center',
  },
  postTypeContainer: {
    position: 'absolute',
    bottom: 0,
    alignItems: 'center',
  },
  postTypeButton: {
    position: 'absolute',
    bottom: 56,
  },
  postTypeButtonInner: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: colors.neutral.pureWhite,
    borderWidth: 2,
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: colors.neutral.deepBlack,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 6,
  },
  floatingBackdrop: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: 'rgba(0, 0, 0, 0.3)',
    justifyContent: 'flex-end',
    alignItems: 'flex-end',
  },
  backdropOverlay: {
    position: 'absolute',
    bottom: 80, // Above tab bar but below FAB
    right: spacing.lg - 20,
    width: 100,
    height: 350, // Enough to cover all 5 floating buttons
    backgroundColor: 'rgba(0, 166, 81, 0.05)',
    borderRadius: 50,
    borderWidth: 1,
    borderColor: 'rgba(0, 166, 81, 0.1)',
  },
});

export default FloatingActionButton;