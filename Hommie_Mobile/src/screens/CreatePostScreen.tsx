import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  SafeAreaView,
  TouchableOpacity,
  Alert,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import PostCreator from '../components/PostCreator';
import { Post } from '../services/postsService';

interface CreatePostScreenProps {
  navigation: any;
  route?: {
    params?: {
      postType?: 'general' | 'safety' | 'marketplace' | 'event' | 'recommendation' | 'civic';
    };
  };
}

export const CreatePostScreen: React.FC<CreatePostScreenProps> = ({
  navigation,
  route,
}) => {
  const [showPostCreator, setShowPostCreator] = useState(true);
  const [isLoading, setIsLoading] = useState(false);

  const handlePostCreated = (post: Post) => {
    // Navigate back to previous screen with the new post
    navigation.goBack();
    
    // You can also pass the post data back to the previous screen
    // navigation.navigate('FeedScreen', { newPost: post });
  };

  const handleClose = () => {
    if (showPostCreator) {
      Alert.alert(
        'Discard Post',
        'Are you sure you want to discard this post?',
        [
          { text: 'Cancel', style: 'cancel' },
          { text: 'Discard', style: 'destructive', onPress: () => navigation.goBack() },
        ]
      );
    } else {
      navigation.goBack();
    }
  };

  return (
    <SafeAreaView style={styles.container}>
      <PostCreator
        visible={showPostCreator}
        onClose={handleClose}
        onPostCreated={handlePostCreated}
        initialPostType={route?.params?.postType || 'general'}
      />
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f8f9fa',
  },
});

export default CreatePostScreen;
