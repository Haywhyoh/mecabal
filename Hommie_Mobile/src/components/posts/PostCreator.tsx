import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  ScrollView,
  Alert,
  ActivityIndicator,
  Modal,
  Dimensions,
  TextInput,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import * as ImagePicker from 'expo-image-picker';
import * as ImageManipulator from 'expo-image-manipulator';
import RichTextEditor from './RichTextEditor';
import MediaService, { MediaFile, UploadedMedia } from '../../services/mediaService';
import PostsService, { CreatePostRequest, Category } from '../../services/postsService';

interface PostCreatorProps {
  visible: boolean;
  onClose: () => void;
  onPostCreated?: (post: any) => void;
  initialPostType?: 'general' | 'alert' | 'marketplace' | 'event' | 'help' | 'lost_found';
}

const { width } = Dimensions.get('window');

const PostCreator: React.FC<PostCreatorProps> = ({
  visible,
  onClose,
  onPostCreated,
  initialPostType = 'general',
}) => {
  const [content, setContent] = useState('');
  const [selectedCategory, setSelectedCategory] = useState<Category | null>(null);
  const [mediaFiles, setMediaFiles] = useState<MediaFile[]>([]);
  const [uploadedMedia, setUploadedMedia] = useState<UploadedMedia[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [categories, setCategories] = useState<Category[]>([]);
  const [showCategoryModal, setShowCategoryModal] = useState(false);

  const mediaService = MediaService.getInstance();
  const postsService = PostsService.getInstance();

  useEffect(() => {
    if (visible) {
      loadCategories();
    }
  }, [visible]);

  const loadCategories = async () => {
    try {
      const categoriesData = await postsService.getCategories();
      setCategories(categoriesData);
    } catch (error) {
      console.error('Error loading categories:', error);
    }
  };

  const handleImagePicker = async () => {
    try {
      const result = await mediaService.pickImage({
        allowsEditing: true,
        aspect: [4, 3],
        quality: 0.8,
        maxWidth: 1200,
        maxHeight: 1200,
      });

      if (result) {
        setMediaFiles(prev => [...prev, result]);
      }
    } catch (error) {
      Alert.alert('Error', 'Failed to pick image');
    }
  };

  const handleVideoPicker = async () => {
    try {
      const result = await mediaService.pickVideo({
        maxDuration: 60,
        quality: ImagePicker.UIImagePickerControllerQualityType.Medium,
      });

      if (result) {
        setMediaFiles(prev => [...prev, result]);
      }
    } catch (error) {
      Alert.alert('Error', 'Failed to pick video');
    }
  };

  const removeMediaFile = (index: number) => {
    setMediaFiles(prev => prev.filter((_, i) => i !== index));
  };

  const uploadMediaFiles = async (): Promise<UploadedMedia[]> => {
    if (mediaFiles.length === 0) return [];

    try {
      const uploaded = await mediaService.uploadMultipleMedia(mediaFiles, {
        quality: 0.8,
        maxWidth: 1200,
        maxHeight: 1200,
      });
      setUploadedMedia(uploaded);
      return uploaded;
    } catch (error) {
      console.error('Error uploading media:', error);
      throw new Error('Failed to upload media files');
    }
  };

  const handleCreatePost = async () => {
    if (!content.trim()) {
      Alert.alert('Error', 'Please enter some content for your post');
      return;
    }

    setIsLoading(true);

    try {
      // Upload media files first
      const uploadedMedia = await uploadMediaFiles();

      // Prepare post data
      const postData: CreatePostRequest = {
        content: content.trim(),
        postType: initialPostType,
        privacyLevel: 'neighborhood',
        categoryId: selectedCategory?.id,
        media: uploadedMedia.map(media => ({
          url: media.url,
          type: media.type,
          caption: media.name,
        })),
      };

      // Create post
      const newPost = await postsService.createPost(postData);

      // Reset form
      setContent('');
      setMediaFiles([]);
      setUploadedMedia([]);
      setSelectedCategory(null);

      // Notify parent component
      onPostCreated?.(newPost);

      // Close modal
      onClose();

      Alert.alert('Success', 'Post created successfully!');
    } catch (error) {
      console.error('Error creating post:', error);
      Alert.alert('Error', 'Failed to create post. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };


  return (
    <Modal
      visible={visible}
      animationType="slide"
      presentationStyle="pageSheet"
      onRequestClose={onClose}
    >
      <View style={styles.container}>
        {/* Header */}
        <View style={styles.header}>
          <TouchableOpacity onPress={onClose} style={styles.headerButton}>
            <Text style={styles.headerButtonText}>Cancel</Text>
          </TouchableOpacity>
          <Text style={styles.headerTitle}>Create Post</Text>
          <TouchableOpacity
            onPress={handleCreatePost}
            style={[styles.headerButton, styles.postButton]}
            disabled={isLoading || !content.trim()}
          >
            {isLoading ? (
              <ActivityIndicator size="small" color="#fff" />
            ) : (
              <Text style={styles.postButtonText}>Post</Text>
            )}
          </TouchableOpacity>
        </View>

        <ScrollView style={styles.content} showsVerticalScrollIndicator={false}>
          {/* Main Content Area - Twitter-like */}
          <View style={styles.mainContentContainer}>
            {/* Post Type Indicator */}
            {initialPostType !== 'general' && (
              <View style={styles.postTypeIndicator}>
                <Ionicons name="bookmark-outline" size={16} color="#00A651" />
                <Text style={styles.postTypeIndicatorText}>
                  {initialPostType.charAt(0).toUpperCase() + initialPostType.slice(1)} Post
                </Text>
              </View>
            )}

            {/* Large Text Input */}
            <View style={styles.textInputContainer}>
              <TextInput
                style={styles.mainTextInput}
                value={content}
                onChangeText={setContent}
                placeholder="What's happening in your neighborhood?"
                placeholderTextColor="#bdc3c7"
                multiline
                numberOfLines={8}
                maxLength={2800}
                textAlignVertical="top"
              />

              {/* Character Count */}
              <View style={styles.characterCountContainer}>
                <Text style={[
                  styles.characterCount,
                  content.length > 2500 && styles.characterCountWarning,
                  content.length > 2700 && styles.characterCountDanger,
                ]}>
                  {content.length}/2800
                </Text>
              </View>
            </View>

            {/* Inline Media Controls */}
            <View style={styles.inlineMediaControls}>
              <TouchableOpacity
                style={styles.inlineMediaButton}
                onPress={handleImagePicker}
              >
                <Ionicons name="image-outline" size={20} color="#00A651" />
              </TouchableOpacity>

              <TouchableOpacity
                style={styles.inlineMediaButton}
                onPress={handleVideoPicker}
              >
                <Ionicons name="videocam-outline" size={20} color="#00A651" />
              </TouchableOpacity>

              <TouchableOpacity
                style={styles.inlineMediaButton}
                onPress={() => setShowCategoryModal(true)}
              >
                <Ionicons name="pricetag" size={20} color="#00A651" />
              </TouchableOpacity>

              {/* Privacy Indicator */}
              <View style={styles.privacyIndicator}>
                <Ionicons name="people-outline" size={16} color="#7f8c8d" />
                <Text style={styles.privacyText}>Neighborhood</Text>
              </View>
            </View>

            {/* Media Preview */}
            {mediaFiles.length > 0 && (
              <View style={styles.mediaPreview}>
                {mediaFiles.map((file, index) => (
                  <View key={index} style={styles.mediaItem}>
                    <View style={styles.mediaItemContent}>
                      <Ionicons
                        name={file.type === 'image' ? "image-outline" : "videocam-outline"}
                        size={16}
                        color="#7f8c8d"
                      />
                      <Text style={styles.mediaItemText}>{file.name}</Text>
                    </View>
                    <TouchableOpacity
                      style={styles.removeMediaButton}
                      onPress={() => removeMediaFile(index)}
                    >
                      <Ionicons name="close-circle" size={20} color="#e74c3c" />
                    </TouchableOpacity>
                  </View>
                ))}
              </View>
            )}
          </View>
        </ScrollView>

        {/* Category Selection Modal */}
        <Modal
          visible={showCategoryModal}
          animationType="slide"
          presentationStyle="pageSheet"
          onRequestClose={() => setShowCategoryModal(false)}
        >
          <View style={styles.modalContainer}>
            <View style={styles.modalHeader}>
              <TouchableOpacity
                onPress={() => setShowCategoryModal(false)}
                style={styles.modalHeaderButton}
              >
                <Text style={styles.modalHeaderButtonText}>Cancel</Text>
              </TouchableOpacity>
              <Text style={styles.modalHeaderTitle}>Select Category</Text>
              <View style={styles.modalHeaderButton} />
            </View>
            <ScrollView style={styles.modalContent}>
              {categories.map((category) => (
                <TouchableOpacity
                  key={category.id}
                  style={styles.categoryItem}
                  onPress={() => {
                    setSelectedCategory(category);
                    setShowCategoryModal(false);
                  }}
                >
                  <View style={styles.categoryItemContent}>
                    <View
                      style={[
                        styles.categoryColor,
                        { backgroundColor: category.colorCode || '#3498db' },
                      ]}
                    />
                    <Text style={styles.categoryItemText}>{category.name}</Text>
                  </View>
                  {selectedCategory?.id === category.id && (
                    <Ionicons name="checkmark" size={20} color="#3498db" />
                  )}
                </TouchableOpacity>
              ))}
            </ScrollView>
          </View>
        </Modal>
      </View>
    </Modal>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#fff',
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#e1e8ed',
  },
  headerButton: {
    paddingVertical: 8,
    paddingHorizontal: 12,
  },
  headerButtonText: {
    fontSize: 16,
    color: '#3498db',
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#2c3e50',
  },
  postButton: {
    backgroundColor: '#3498db',
    borderRadius: 8,
    paddingVertical: 8,
    paddingHorizontal: 16,
  },
  postButtonText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#fff',
  },
  content: {
    flex: 1,
    paddingHorizontal: 20,
    paddingVertical: 12,
  },
  mainContentContainer: {
    flex: 1,
  },
  postTypeIndicator: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 8,
    paddingHorizontal: 12,
    marginBottom: 16,
    backgroundColor: '#E8F5E8',
    borderRadius: 16,
    alignSelf: 'flex-start',
  },
  postTypeIndicatorText: {
    marginLeft: 6,
    fontSize: 13,
    fontWeight: '500',
    color: '#00A651',
  },
  textInputContainer: {
    position: 'relative',
    marginBottom: 16,
  },
  mainTextInput: {
    fontSize: 18,
    lineHeight: 24,
    color: '#2c3e50',
    minHeight: 120,
    maxHeight: 200,
    paddingVertical: 12,
    paddingHorizontal: 0,
    textAlignVertical: 'top',
  },
  characterCountContainer: {
    position: 'absolute',
    bottom: 8,
    right: 8,
  },
  characterCount: {
    fontSize: 12,
    color: '#7f8c8d',
    fontWeight: '500',
  },
  characterCountWarning: {
    color: '#f39c12',
  },
  characterCountDanger: {
    color: '#e74c3c',
  },
  inlineMediaControls: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingTop: 12,
    borderTopWidth: 1,
    borderTopColor: '#f0f0f0',
  },
  inlineMediaButton: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: '#f8f9fa',
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 12,
  },
  privacyIndicator: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
    justifyContent: 'flex-end',
  },
  privacyText: {
    marginLeft: 6,
    fontSize: 13,
    color: '#7f8c8d',
    fontWeight: '500',
  },
  mediaPreview: {
    marginTop: 16,
    paddingTop: 16,
    borderTopWidth: 1,
    borderTopColor: '#f0f0f0',
  },
  mediaItem: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: 10,
    paddingHorizontal: 14,
    marginBottom: 8,
    borderRadius: 12,
    backgroundColor: '#f8f9fa',
    borderWidth: 1,
    borderColor: '#e1e8ed',
  },
  mediaItemContent: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  mediaItemText: {
    marginLeft: 8,
    fontSize: 14,
    color: '#2c3e50',
    fontWeight: '500',
  },
  removeMediaButton: {
    padding: 2,
  },
  modalContainer: {
    flex: 1,
    backgroundColor: '#fff',
  },
  modalHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#e1e8ed',
  },
  modalHeaderButton: {
    paddingVertical: 8,
    paddingHorizontal: 12,
  },
  modalHeaderButtonText: {
    fontSize: 16,
    color: '#3498db',
  },
  modalHeaderTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#2c3e50',
  },
  modalContent: {
    flex: 1,
    paddingHorizontal: 16,
  },
  categoryItem: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#e1e8ed',
  },
  categoryItemContent: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  categoryColor: {
    width: 12,
    height: 12,
    borderRadius: 6,
    marginRight: 12,
  },
  categoryItemText: {
    fontSize: 16,
    color: '#2c3e50',
  },
});

export default PostCreator;
