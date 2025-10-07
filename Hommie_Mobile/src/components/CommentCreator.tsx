import React, { useState } from 'react';
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
import MediaService, { MediaFile, UploadedMedia } from '../services/mediaService';
import PostsService, { CreateCommentRequest } from '../services/postsService';

interface CommentCreatorProps {
  visible: boolean;
  onClose: () => void;
  onCommentCreated?: (comment: any) => void;
  postId: string;
  parentCommentId?: string;
  placeholder?: string;
  autoFocus?: boolean;
}

const { width } = Dimensions.get('window');

const CommentCreator: React.FC<CommentCreatorProps> = ({
  visible,
  onClose,
  onCommentCreated,
  postId,
  parentCommentId,
  placeholder = "What's your thought on this?",
  autoFocus = false,
}) => {
  const [content, setContent] = useState('');
  const [mediaFiles, setMediaFiles] = useState<MediaFile[]>([]);
  const [uploadedMedia, setUploadedMedia] = useState<UploadedMedia[]>([]);
  const [isLoading, setIsLoading] = useState(false);

  const mediaService = MediaService.getInstance();
  const postsService = PostsService.getInstance();

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

  const handleCreateComment = async () => {
    if (!content.trim()) {
      Alert.alert('Error', 'Please enter some content for your comment');
      return;
    }

    setIsLoading(true);

    try {
      // Upload media files first
      const uploadedMedia = await uploadMediaFiles();

      // Prepare comment data
      const commentData: CreateCommentRequest = {
        content: content.trim(),
        parentCommentId,
        media: uploadedMedia.map(media => ({
          url: media.url,
          type: media.type,
          caption: media.name,
        })),
      };

      // Create comment
      const newComment = await postsService.createComment(postId, commentData);

      // Reset form
      setContent('');
      setMediaFiles([]);
      setUploadedMedia([]);

      // Notify parent component
      onCommentCreated?.(newComment);

      // Close modal
      onClose();
    } catch (error) {
      console.error('Error creating comment:', error);
      Alert.alert('Error', 'Failed to create comment. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };

  const handleCancel = () => {
    // Reset form
    setContent('');
    setMediaFiles([]);
    setUploadedMedia([]);
    onClose();
  };

  return (
    <Modal
      visible={visible}
      animationType="slide"
      presentationStyle="pageSheet"
      onRequestClose={handleCancel}
    >
      <View style={styles.container}>
        {/* Header */}
        <View style={styles.header}>
          <TouchableOpacity
            onPress={handleCancel}
            style={styles.headerButton}
            accessibilityLabel="Cancel"
            accessibilityHint="Cancel creating comment and close the modal"
          >
            <Text style={styles.headerButtonText}>Cancel</Text>
          </TouchableOpacity>
          <Text style={styles.headerTitle}>
            {parentCommentId ? 'Reply' : 'Comment'}
          </Text>
          <TouchableOpacity
            onPress={handleCreateComment}
            style={[styles.headerButton, styles.postButton]}
            disabled={isLoading || !content.trim()}
            accessibilityLabel={parentCommentId ? 'Post reply' : 'Post comment'}
            accessibilityHint={isLoading ? 'Posting comment' : 'Post your comment'}
          >
            {isLoading ? (
              <ActivityIndicator size="small" color="#fff" />
            ) : (
              <Text style={styles.postButtonText}>Post</Text>
            )}
          </TouchableOpacity>
        </View>

        <ScrollView style={styles.content} showsVerticalScrollIndicator={false}>
          {/* Main Content Area */}
          <View style={styles.mainContentContainer}>
            {/* Text Input */}
            <View style={styles.textInputContainer}>
              <TextInput
                style={styles.mainTextInput}
                value={content}
                onChangeText={setContent}
                placeholder={placeholder}
                placeholderTextColor="#bdc3c7"
                multiline
                numberOfLines={6}
                maxLength={2000}
                textAlignVertical="top"
                autoFocus={autoFocus}
              />

              {/* Character Count */}
              <View style={styles.characterCountContainer}>
                <Text style={[
                  styles.characterCount,
                  content.length > 1800 && styles.characterCountWarning,
                  content.length > 1900 && styles.characterCountDanger,
                ]}>
                  {content.length}/2000
                </Text>
              </View>
            </View>

            {/* Inline Media Controls */}
            <View style={styles.inlineMediaControls}>
              <TouchableOpacity
                style={styles.inlineMediaButton}
                onPress={handleImagePicker}
                accessibilityLabel="Add image"
                accessibilityHint="Select an image to attach to your comment"
              >
                <Ionicons name="image-outline" size={20} color="#00A651" />
              </TouchableOpacity>

              <TouchableOpacity
                style={styles.inlineMediaButton}
                onPress={handleVideoPicker}
                accessibilityLabel="Add video"
                accessibilityHint="Select a video to attach to your comment"
              >
                <Ionicons name="videocam-outline" size={20} color="#00A651" />
              </TouchableOpacity>

              {/* Media Count Indicator */}
              {mediaFiles.length > 0 && (
                <View style={styles.mediaCountIndicator}>
                  <Text style={styles.mediaCountText}>
                    {mediaFiles.length} file{mediaFiles.length > 1 ? 's' : ''} selected
                  </Text>
                </View>
              )}
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
    color: '#00A651',
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#2c3e50',
  },
  postButton: {
    backgroundColor: '#00A651',
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
  textInputContainer: {
    position: 'relative',
    marginBottom: 16,
  },
  mainTextInput: {
    fontSize: 16,
    lineHeight: 22,
    color: '#2c3e50',
    minHeight: 100,
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
  mediaCountIndicator: {
    flex: 1,
    alignItems: 'flex-end',
  },
  mediaCountText: {
    fontSize: 12,
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
});

export default CommentCreator;