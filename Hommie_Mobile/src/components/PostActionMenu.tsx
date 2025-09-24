import React from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  Modal,
  StyleSheet,
  Dimensions,
  TouchableWithoutFeedback,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { Post } from '../services/postsService';

interface PostActionMenuProps {
  visible: boolean;
  onClose: () => void;
  post: Post;
  isOwner: boolean;
  onReport?: (postId: string) => void;
  onEdit?: (post: Post) => void;
  onDelete?: (postId: string) => void;
  position: { x: number; y: number };
}

const { width, height } = Dimensions.get('window');

export const PostActionMenu: React.FC<PostActionMenuProps> = ({
  visible,
  onClose,
  post,
  isOwner,
  onReport,
  onEdit,
  onDelete,
  position,
}) => {
  const handleCopyLink = () => {
    // Implement copy link functionality
    console.log('Copy link for post:', post.id);
    onClose();
  };

  const handleMute = () => {
    // Implement mute functionality
    console.log('Mute user:', post.author.id);
    onClose();
  };

  const handleBlock = () => {
    // Implement block functionality
    console.log('Block user:', post.author.id);
    onClose();
  };

  const handleReport = () => {
    onReport?.(post.id);
    onClose();
  };

  const handleEdit = () => {
    onEdit?.(post);
    onClose();
  };

  const handleDelete = () => {
    onDelete?.(post.id);
    onClose();
  };

  // Calculate menu position to prevent overflow
  const menuWidth = 200;
  const menuHeight = isOwner ? 200 : 160;

  let menuX = position.x - menuWidth + 20; // Offset from button
  let menuY = position.y + 30;

  // Adjust if menu goes off screen
  if (menuX < 10) menuX = 10;
  if (menuX + menuWidth > width - 10) menuX = width - menuWidth - 10;
  if (menuY + menuHeight > height - 50) menuY = position.y - menuHeight - 10;

  const menuItems = [
    { icon: 'link-outline', text: 'Copy link', onPress: handleCopyLink },
    ...(!isOwner ? [
      { icon: 'volume-mute-outline', text: 'Mute user', onPress: handleMute },
      { icon: 'ban-outline', text: 'Block user', onPress: handleBlock },
      { icon: 'flag-outline', text: 'Report post', onPress: handleReport, color: '#EF4444' },
    ] : [
      { icon: 'create-outline', text: 'Edit post', onPress: handleEdit },
      { icon: 'trash-outline', text: 'Delete post', onPress: handleDelete, color: '#EF4444' },
    ])
  ];

  return (
    <Modal
      visible={visible}
      transparent
      animationType="fade"
      onRequestClose={onClose}
    >
      <TouchableWithoutFeedback onPress={onClose}>
        <View style={styles.overlay}>
          <View
            style={[
              styles.menu,
              {
                left: menuX,
                top: menuY,
              },
            ]}
          >
            {menuItems.map((item, index) => (
              <TouchableOpacity
                key={index}
                style={[
                  styles.menuItem,
                  index === menuItems.length - 1 && styles.lastMenuItem,
                ]}
                onPress={item.onPress}
              >
                <Ionicons
                  name={item.icon as any}
                  size={20}
                  color={item.color || '#374151'}
                />
                <Text style={[styles.menuText, item.color && { color: item.color }]}>
                  {item.text}
                </Text>
              </TouchableOpacity>
            ))}
          </View>
        </View>
      </TouchableWithoutFeedback>
    </Modal>
  );
};

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.1)',
  },
  menu: {
    position: 'absolute',
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    paddingVertical: 8,
    minWidth: 200,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.15,
    shadowRadius: 12,
    elevation: 8,
    borderWidth: 1,
    borderColor: '#E5E7EB',
  },
  menuItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#F3F4F6',
  },
  lastMenuItem: {
    borderBottomWidth: 0,
  },
  menuText: {
    marginLeft: 12,
    fontSize: 16,
    color: '#374151',
    fontWeight: '500',
  },
});

export default PostActionMenu;