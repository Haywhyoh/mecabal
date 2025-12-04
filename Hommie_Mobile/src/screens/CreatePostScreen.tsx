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
import { PostCreator } from '../components/posts';
import { Post } from '../services/postsService';

interface CreatePostScreenProps {
  navigation: any;
  route?: {
    params?: {
      postType?: 'general' | 'alert' | 'marketplace' | 'event' | 'help' | 'lost_found';
    };
  };
}

export const CreatePostScreen: React.FC<CreatePostScreenProps> = ({
  navigation,
  route,
}) => {
  const handlePostCreated = (post: Post) => {
    // Navigate back to previous screen with the new post
    navigation.goBack();
  };

  const handleClose = () => {
    navigation.goBack();
  };

  return (
    <SafeAreaView style={styles.container}>
      <PostCreator
        visible={true}
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
