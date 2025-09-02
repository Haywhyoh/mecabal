import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Modal,
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

export const FloatingActionButton: React.FC<FloatingActionButtonProps> = ({ navigation }) => {
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
      id: 'safety',
      title: 'Safety Alert',
      description: 'Report security or emergency situations',
      icon: 'shield-alert',
      color: colors.accent.safetyRed,
      onPress: () => handlePostType('safety'),
    },
    {
      id: 'marketplace',
      title: 'Sell Something',
      description: 'List an item or service for sale',
      icon: 'shopping',
      color: colors.accent.marketGreen,
      onPress: () => handlePostType('marketplace'),
    },
    {
      id: 'event',
      title: 'Create Event',
      description: 'Organize a community gathering',
      icon: 'calendar-plus',
      color: colors.accent.lagosOrange,
      onPress: () => handlePostType('event'),
    },
    {
      id: 'recommendation',
      title: 'Ask for Help',
      description: 'Get recommendations or assistance',
      icon: 'help-circle',
      color: colors.accent.trustBlue,
      onPress: () => handlePostType('recommendation'),
    },
    {
      id: 'civic',
      title: 'Report Issue',
      description: 'Report infrastructure or civic problems',
      icon: 'clipboard-text',
      color: colors.accent.neighborPurple,
      onPress: () => handlePostType('civic'),
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
        console.log('Navigate to General Post creation');
        // navigation?.navigate('CreatePost', { type: 'general' });
        break;
      case 'safety':
        console.log('Navigate to Safety Alert creation');
        // navigation?.navigate('CreateSafetyAlert');
        break;
      case 'marketplace':
        navigation?.navigate('Market', { 
          screen: 'CreateListing',
          params: { type: 'sell' }
        });
        break;
      case 'event':
        navigation?.navigate('CreateEvent');
        break;
      case 'recommendation':
        console.log('Navigate to Recommendation Post creation');
        // navigation?.navigate('CreatePost', { type: 'recommendation' });
        break;
      case 'civic':
        console.log('Navigate to Civic Report creation');
        // navigation?.navigate('CreateCivicReport');
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
      outputRange: [0, -(70 * (index + 1))],
    });

    const buttonOpacity = animation.interpolate({
      inputRange: [0, 0.5, 1],
      outputRange: [0, 0.5, 1],
    });

    return (
      <Animated.View
        style={[
          styles.postTypeButton,
          {
            transform: [{ translateY: buttonTranslateY }],
            opacity: buttonOpacity,
          },
        ]}
      >
        <TouchableOpacity
          style={[styles.postTypeButtonInner, { borderColor: postType.color }]}
          onPress={postType.onPress}
        >
          <MaterialCommunityIcons
            name={postType.icon}
            size={24}
            color={postType.color}
          />
        </TouchableOpacity>
      </Animated.View>
    );
  };

  return (
    <>
      {/* Backdrop */}
      <Modal
        visible={isExpanded}
        transparent
        animationType="none"
        onRequestClose={closeModal}
      >
        <TouchableOpacity
          style={styles.backdrop}
          activeOpacity={1}
          onPress={closeModal}
        >
          <Animated.View 
            style={[
              styles.modalContent,
              {
                transform: [{
                  scale: animation.interpolate({
                    inputRange: [0, 1],
                    outputRange: [0.8, 1],
                  }),
                }],
                opacity: animation.interpolate({
                  inputRange: [0, 1],
                  outputRange: [0, 1],
                }),
              },
            ]}
          >
            <Text style={styles.modalTitle}>What would you like to share?</Text>
            <View style={styles.postTypesGrid}>
              {postTypes.map((postType, index) => (
                <TouchableOpacity
                  key={postType.id}
                  style={styles.postTypeCard}
                  onPress={postType.onPress}
                >
                  <View style={[styles.postTypeIcon, { backgroundColor: `${postType.color}15` }]}>
                    <MaterialCommunityIcons
                      name={postType.icon}
                      size={28}
                      color={postType.color}
                    />
                  </View>
                  <Text style={styles.postTypeTitle}>{postType.title}</Text>
                  <Text style={styles.postTypeDescription}>{postType.description}</Text>
                </TouchableOpacity>
              ))}
            </View>
          </Animated.View>
        </TouchableOpacity>
      </Modal>

      {/* Floating Icons Backdrop */}
      {isExpanded && (
        <Animated.View 
          style={[
            styles.floatingBackdrop,
            {
              opacity: animation.interpolate({
                inputRange: [0, 1],
                outputRange: [0, 1],
              }),
            },
          ]}
        />
      )}

      {/* Main FAB */}
      <View style={styles.fabContainer}>
        {isExpanded && (
          <View style={styles.postTypeContainer}>
            {postTypes.slice(0, 4).map((postType, index) => (
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
    shadowColor: colors.neutral.deepBlack,
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
    bottom: 80, // Above tab bar but below FAB
    right: spacing.lg - 20,
    width: 100,
    height: 320, // Enough to cover all floating buttons
    backgroundColor: 'rgba(0, 166, 81, 0.05)',
    borderRadius: 50,
    borderWidth: 1,
    borderColor: 'rgba(0, 166, 81, 0.1)',
  },
  backdrop: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  modalContent: {
    backgroundColor: colors.neutral.pureWhite,
    borderRadius: 20,
    padding: spacing.xl,
    margin: spacing.lg,
    maxWidth: screenWidth - spacing.lg * 2,
    width: '100%',
  },
  modalTitle: {
    fontSize: typography.sizes.xl,
    fontWeight: '600',
    color: colors.neutral.richCharcoal,
    textAlign: 'center',
    marginBottom: spacing.xl,
  },
  postTypesGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
  },
  postTypeCard: {
    width: '48%',
    backgroundColor: colors.neutral.warmOffWhite,
    borderRadius: 12,
    padding: spacing.md,
    marginBottom: spacing.md,
    alignItems: 'center',
  },
  postTypeIcon: {
    width: 48,
    height: 48,
    borderRadius: 24,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: spacing.sm,
  },
  postTypeTitle: {
    fontSize: typography.sizes.sm,
    fontWeight: '600',
    color: colors.neutral.richCharcoal,
    textAlign: 'center',
    marginBottom: spacing.xs,
  },
  postTypeDescription: {
    fontSize: typography.sizes.xs,
    color: colors.neutral.friendlyGray,
    textAlign: 'center',
    lineHeight: 16,
  },
});