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
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import * as ImagePicker from 'expo-image-picker';
import * as ImageManipulator from 'expo-image-manipulator';
import RichTextEditor from './RichTextEditor';
import MediaService, { MediaFile, UploadedMedia } from '../services/mediaService';
import PostsService, { CreatePostRequest, Category } from '../services/postsService';

interface PostCreatorProps {
  visible: boolean;
  onClose: () => void;
  onPostCreated?: (post: any) => void;
  initialPostType?: 'general' | 'event' | 'alert' | 'marketplace' | 'lost_found';
}

const { width } = Dimensions.get('window');

export const PostCreator: React.FC<PostCreatorProps> = ({
  visible,
  onClose,
  onPostCreated,
  initialPostType = 'general',
}) => {
  const [content, setContent] = useState('');
  const [title, setTitle] = useState('');
  const [postType, setPostType] = useState(initialPostType);
  const [privacyLevel, setPrivacyLevel] = useState<'neighborhood' | 'group' | 'public'>('neighborhood');
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
        title: title.trim() || undefined,
        content: content.trim(),
        postType,
        privacyLevel,
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
      setTitle('');
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

  const postTypes = [
    { id: 'general', label: 'General', icon: 'chatbubble-outline', color: '#3498db' },
    { id: 'event', label: 'Event', icon: 'calendar-outline', color: '#e74c3c' },
    { id: 'alert', label: 'Alert', icon: 'warning-outline', color: '#f39c12' },
    { id: 'marketplace', label: 'Marketplace', icon: 'storefront-outline', color: '#2ecc71' },
    { id: 'lost_found', label: 'Lost & Found', icon: 'search-outline', color: '#9b59b6' },
  ];

  const privacyLevels = [
    { id: 'neighborhood', label: 'Neighborhood', icon: 'people-outline' },
    { id: 'group', label: 'Group', icon: 'people-circle-outline' },
    { id: 'public', label: 'Public', icon: 'globe-outline' },
  ];

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
          {/* Post Type Selection */}
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Post Type</Text>
            <ScrollView horizontal showsHorizontalScrollIndicator={false}>
              {postTypes.map((type) => (
                <TouchableOpacity
                  key={type.id}
                  style={[
                    styles.postTypeButton,
                    postType === type.id && styles.postTypeButtonActive,
                    { borderColor: type.color },
                  ]}
                  onPress={() => setPostType(type.id as any)}
                >
                  <Ionicons
                    name={type.icon as any}
                    size={20}
                    color={postType === type.id ? '#fff' : type.color}
                  />
                  <Text
                    style={[
                      styles.postTypeButtonText,
                      postType === type.id && styles.postTypeButtonTextActive,
                    ]}
                  >
                    {type.label}
                  </Text>
                </TouchableOpacity>
              ))}
            </ScrollView>
          </View>

          {/* Privacy Level */}
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Privacy</Text>
            <View style={styles.privacyContainer}>
              {privacyLevels.map((level) => (
                <TouchableOpacity
                  key={level.id}
                  style={[
                    styles.privacyButton,
                    privacyLevel === level.id && styles.privacyButtonActive,
                  ]}
                  onPress={() => setPrivacyLevel(level.id as any)}
                >
                  <Ionicons
                    name={level.icon as any}
                    size={16}
                    color={privacyLevel === level.id ? '#fff' : '#7f8c8d'}
                  />
                  <Text
                    style={[
                      styles.privacyButtonText,
                      privacyLevel === level.id && styles.privacyButtonTextActive,
                    ]}
                  >
                    {level.label}
                  </Text>
                </TouchableOpacity>
              ))}
            </View>
          </View>

          {/* Category Selection */}
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Category (Optional)</Text>
            <TouchableOpacity
              style={styles.categoryButton}
              onPress={() => setShowCategoryModal(true)}
            >
              <Text style={styles.categoryButtonText}>
                {selectedCategory ? selectedCategory.name : 'Select Category'}
              </Text>
              <Ionicons name="chevron-down" size={20} color="#7f8c8d" />
            </TouchableOpacity>
          </View>

          {/* Title Input */}
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Title (Optional)</Text>
            <TextInput
              style={styles.titleInput}
              value={title}
              onChangeText={setTitle}
              placeholder="Enter a title for your post"
              placeholderTextColor="#bdc3c7"
              maxLength={200}
            />
          </View>

          {/* Content Editor */}
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Content</Text>
            <RichTextEditor
              value={content}
              onChange={setContent}
              placeholder="What's happening in your neighborhood?"
              maxLength={5000}
              showCharacterCount={true}
            />
          </View>

          {/* Media Upload */}
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Media (Optional)</Text>
            <View style={styles.mediaContainer}>
              <TouchableOpacity
                style={styles.mediaButton}
                onPress={handleImagePicker}
              >
                <Ionicons name="image-outline" size={24} color="#3498db" />
                <Text style={styles.mediaButtonText}>Photo</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={styles.mediaButton}
                onPress={handleVideoPicker}
              >
                <Ionicons name="videocam-outline" size={24} color="#e74c3c" />
                <Text style={styles.mediaButtonText}>Video</Text>
              </TouchableOpacity>
            </View>

            {/* Media Preview */}
            {mediaFiles.length > 0 && (
              <View style={styles.mediaPreview}>
                {mediaFiles.map((file, index) => (
                  <View key={index} style={styles.mediaItem}>
                    <Text style={styles.mediaItemText}>{file.name}</Text>
                    <TouchableOpacity
                      style={styles.removeMediaButton}
                      onPress={() => removeMediaFile(index)}
                    >
                      <Ionicons name="close" size={16} color="#e74c3c" />
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
    paddingHorizontal: 16,
  },
  section: {
    marginVertical: 16,
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#2c3e50',
    marginBottom: 8,
  },
  postTypeButton: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 8,
    paddingHorizontal: 12,
    marginRight: 8,
    borderRadius: 20,
    borderWidth: 1,
    backgroundColor: '#f8f9fa',
  },
  postTypeButtonActive: {
    backgroundColor: '#3498db',
  },
  postTypeButtonText: {
    marginLeft: 4,
    fontSize: 14,
    fontWeight: '500',
    color: '#7f8c8d',
  },
  postTypeButtonTextActive: {
    color: '#fff',
  },
  privacyContainer: {
    flexDirection: 'row',
    justifyContent: 'space-around',
  },
  privacyButton: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 8,
    paddingHorizontal: 12,
    borderRadius: 8,
    backgroundColor: '#f8f9fa',
  },
  privacyButtonActive: {
    backgroundColor: '#3498db',
  },
  privacyButtonText: {
    marginLeft: 4,
    fontSize: 14,
    fontWeight: '500',
    color: '#7f8c8d',
  },
  privacyButtonTextActive: {
    color: '#fff',
  },
  categoryButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: 12,
    paddingHorizontal: 16,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#e1e8ed',
    backgroundColor: '#f8f9fa',
  },
  categoryButtonText: {
    fontSize: 16,
    color: '#2c3e50',
  },
  titleInput: {
    paddingVertical: 12,
    paddingHorizontal: 16,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#e1e8ed',
    backgroundColor: '#f8f9fa',
    fontSize: 16,
    color: '#2c3e50',
  },
  mediaContainer: {
    flexDirection: 'row',
    justifyContent: 'space-around',
  },
  mediaButton: {
    alignItems: 'center',
    paddingVertical: 16,
    paddingHorizontal: 24,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#e1e8ed',
    backgroundColor: '#f8f9fa',
  },
  mediaButtonText: {
    marginTop: 4,
    fontSize: 14,
    fontWeight: '500',
    color: '#2c3e50',
  },
  mediaPreview: {
    marginTop: 12,
  },
  mediaItem: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: 8,
    paddingHorizontal: 12,
    marginBottom: 4,
    borderRadius: 6,
    backgroundColor: '#f8f9fa',
  },
  mediaItemText: {
    flex: 1,
    fontSize: 14,
    color: '#2c3e50',
  },
  removeMediaButton: {
    padding: 4,
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
