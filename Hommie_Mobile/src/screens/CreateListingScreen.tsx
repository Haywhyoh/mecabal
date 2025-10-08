import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ScrollView,
  TextInput,
  Image,
  Alert,
  KeyboardAvoidingView,
  Platform,
  ActionSheetIOS,
  ActivityIndicator
} from 'react-native';
import { SafeAreaView } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import * as ImagePicker from 'expo-image-picker';
import * as Haptics from 'expo-haptics';
import { colors, typography, spacing, shadows, MARKETPLACE_CATEGORIES, NIGERIAN_SERVICE_CATEGORIES } from '../constants';
import { MediaService } from '../services/mediaService';
import { ListingsService, CreateListingRequest } from '../services/listingsService';

interface CreateListingScreenProps {
  navigation?: any;
  route?: any;
}

export default function CreateListingScreen({ navigation, route }: CreateListingScreenProps) {
  const [listingType, setListingType] = useState<'sell' | 'service' | 'job'>('sell');
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [price, setPrice] = useState('');
  const [category, setCategory] = useState('');
  const [condition, setCondition] = useState('');
  const [location, setLocation] = useState('');
  const [contactMethod, setContactMethod] = useState<'in_app' | 'phone' | 'both'>('in_app');
  const [images, setImages] = useState<string[]>([]);
  const [uploadedImageUrls, setUploadedImageUrls] = useState<string[]>([]);
  const [showCategoryPicker, setShowCategoryPicker] = useState(false);
  const [showConditionPicker, setShowConditionPicker] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [submitting, setSubmitting] = useState(false);

  const mediaService = MediaService.getInstance();
  const listingsService = ListingsService.getInstance();

  const conditionOptions = [
    { label: 'Brand New', value: 'new' },
    { label: 'Like New', value: 'like_new' },
    { label: 'Good Condition', value: 'good' },
    { label: 'Fair Condition', value: 'fair' }
  ];

  const triggerHaptic = () => {
    if (Platform.OS === 'ios') {
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    }
  };

  const handleImagePicker = () => {
    triggerHaptic();

    if (Platform.OS === 'ios') {
      ActionSheetIOS.showActionSheetWithOptions(
        {
          options: ['Cancel', 'Take Photo', 'Choose from Gallery'],
          cancelButtonIndex: 0,
        },
        async (buttonIndex) => {
          if (buttonIndex === 1) {
            await openCamera();
          } else if (buttonIndex === 2) {
            await openGallery();
          }
        }
      );
    } else {
      Alert.alert(
        'Add Photo',
        'Choose how you want to add a photo:',
        [
          { text: 'Cancel', style: 'cancel' },
          { text: 'Camera', onPress: openCamera },
          { text: 'Gallery', onPress: openGallery },
        ]
      );
    }
  };

  const openCamera = async () => {
    try {
      const { status } = await ImagePicker.requestCameraPermissionsAsync();
      if (status !== 'granted') {
        Alert.alert('Permission Denied', 'Camera permission is required to take photos');
        return;
      }

      const result = await ImagePicker.launchCameraAsync({
        mediaTypes: ImagePicker.MediaTypeOptions.Images,
        allowsEditing: true,
        aspect: [4, 3],
        quality: 0.8,
      });

      if (!result.canceled && result.assets[0]) {
        await uploadImage(result.assets[0].uri);
      }
    } catch (error) {
      console.error('Camera error:', error);
      Alert.alert('Error', 'Failed to open camera');
    }
  };

  const openGallery = async () => {
    try {
      const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();
      if (status !== 'granted') {
        Alert.alert('Permission Denied', 'Gallery permission is required to select photos');
        return;
      }

      const result = await ImagePicker.launchImageLibraryAsync({
        mediaTypes: ImagePicker.MediaTypeOptions.Images,
        allowsEditing: true,
        aspect: [4, 3],
        quality: 0.8,
        allowsMultipleSelection: false,
      });

      if (!result.canceled && result.assets[0]) {
        await uploadImage(result.assets[0].uri);
      }
    } catch (error) {
      console.error('Gallery error:', error);
      Alert.alert('Error', 'Failed to open gallery');
    }
  };

  const uploadImage = async (uri: string) => {
    if (images.length >= 5) {
      Alert.alert('Limit Reached', 'You can only upload up to 5 images');
      return;
    }

    try {
      setUploading(true);
      setImages([...images, uri]);

      const mediaFile = {
        uri,
        type: 'image' as const,
        name: `listing-${Date.now()}.jpg`,
        size: 0,
      };

      const uploadedMedia = await mediaService.uploadMedia(mediaFile);
      setUploadedImageUrls([...uploadedImageUrls, uploadedMedia.url]);

      triggerHaptic();
    } catch (error: any) {
      console.error('Upload error:', error);
      Alert.alert('Upload Failed', error.message || 'Failed to upload image');
      // Remove the failed image from local state
      setImages(images.filter(img => img !== uri));
    } finally {
      setUploading(false);
    }
  };

  const handleSubmit = async () => {
    // Validate required fields
    if (!title || !description || !price || !category) {
      Alert.alert('Missing Information', 'Please fill in all required fields.');
      return;
    }

    // Validate minimum lengths
    if (title.length < 10) {
      Alert.alert('Title Too Short', 'Title must be at least 10 characters long.');
      return;
    }

    if (description.length < 20) {
      Alert.alert('Description Too Short', 'Description must be at least 20 characters long.');
      return;
    }

    if (location && location.length < 10) {
      Alert.alert('Location Too Short', 'Location address must be at least 10 characters long.');
      return;
    }

    if (images.length === 0) {
      Alert.alert('No Images', 'Please add at least one image to your listing');
      return;
    }

    try {
      setSubmitting(true);
      triggerHaptic();

      // Map listingType to API expected format
      const apiListingType = listingType === 'sell' ? 'item' : listingType === 'service' ? 'service' : 'item';

      // Find category backend ID from constants
      const categoryData = MARKETPLACE_CATEGORIES.find(cat => cat.name === category);
      if (!categoryData || !categoryData.backendId) {
        Alert.alert('Invalid Category', 'Please select a valid category');
        setSubmitting(false);
        return;
      }
      const categoryId = categoryData.backendId;

      const listingData: CreateListingRequest = {
        listingType: apiListingType as any,
        categoryId: categoryId,
        title,
        description,
        price: parseFloat(price.replace(/,/g, '')),
        priceType: 'fixed',
        condition,
        location: {
          latitude: 0, // TODO: Get from user's location
          longitude: 0,
          address: location || 'Default Location Address'
        },
        media: uploadedImageUrls.map((url, index) => ({
          url,
          type: 'image' as const,
          displayOrder: index
        }))
      };

      await listingsService.createListing(listingData);

      Alert.alert(
        'Success!',
        'Your listing has been created successfully',
        [
          {
            text: 'OK',
            onPress: () => navigation?.goBack()
          }
        ]
      );

    } catch (error: any) {
      console.error('Submit error:', error);
      Alert.alert('Error', error.message || 'Failed to create listing');
    } finally {
      setSubmitting(false);
    }
  };

  const renderListingTypeSelector = () => (
    <View style={styles.sectionContainer}>
      <Text style={styles.sectionTitle}>What are you offering?</Text>
      <View style={styles.typeSelector}>
        {[
          { key: 'sell', label: '🛍️ Sell Item', desc: 'Physical products' },
          { key: 'service', label: '🔧 Offer Service', desc: 'Skills & services' },
          { key: 'job', label: '💼 Post Job', desc: 'Hire someone' },
        ].map((type) => (
          <TouchableOpacity
            key={type.key}
            style={[
              styles.typeOption,
              listingType === type.key && styles.typeOptionActive
            ]}
            onPress={() => {
              triggerHaptic();
              setListingType(type.key as any);
            }}
            accessible={true}
            accessibilityLabel={`${type.label}, ${type.desc}`}
            accessibilityRole="button"
            accessibilityState={{ selected: listingType === type.key }}
          >
            <Text style={[
              styles.typeLabel,
              listingType === type.key && styles.typeLabelActive
            ]}>
              {type.label}
            </Text>
            <Text style={[
              styles.typeDesc,
              listingType === type.key && styles.typeDescActive
            ]}>
              {type.desc}
            </Text>
          </TouchableOpacity>
        ))}
      </View>
    </View>
  );

  const renderImageUpload = () => (
    <View style={styles.sectionContainer}>
      <Text style={styles.sectionTitle}>
        Photos {images.length > 0 && `(${images.length}/5)`}
      </Text>
      <Text style={styles.sectionSubtitle}>
        Add photos to get 5x more responses
      </Text>

      <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.imagesContainer}>
        {images.length < 5 && (
          <TouchableOpacity
            style={styles.addImageButton}
            onPress={handleImagePicker}
            disabled={uploading}
            accessible={true}
            accessibilityLabel="Add photo"
            accessibilityRole="button"
          >
            {uploading ? (
              <ActivityIndicator size="large" color={colors.primary} />
            ) : (
              <>
                <Ionicons name="camera-outline" size={32} color={colors.primary} />
                <Text style={styles.addImageLabel}>Add Photo</Text>
              </>
            )}
          </TouchableOpacity>
        )}

        {images.map((image, index) => (
          <View key={index} style={styles.imageItem}>
            <Image source={{ uri: image }} style={styles.uploadedImage} />
            <TouchableOpacity
              style={styles.removeImageButton}
              onPress={() => {
                triggerHaptic();
                setImages(images.filter((_, i) => i !== index));
                setUploadedImageUrls(uploadedImageUrls.filter((_, i) => i !== index));
              }}
              accessible={true}
              accessibilityLabel="Remove photo"
              accessibilityRole="button"
            >
              <Ionicons name="close" size={16} color={colors.white} />
            </TouchableOpacity>
          </View>
        ))}
      </ScrollView>
    </View>
  );

  const renderBasicInfo = () => (
    <View style={styles.sectionContainer}>
      <Text style={styles.sectionTitle}>Basic Information</Text>
      
      <View style={styles.inputGroup}>
        <Text style={styles.inputLabel}>Title * (min 10 characters)</Text>
        <TextInput
          style={styles.textInput}
          placeholder={
            listingType === 'sell' ? 'e.g., iPhone 12 Pro Max 256GB' :
            listingType === 'service' ? 'e.g., Professional Plumbing Service' :
            'e.g., Need a Graphic Designer'
          }
          value={title}
          onChangeText={setTitle}
          maxLength={100}
        />
        <Text style={[styles.characterCount, title.length < 10 && title.length > 0 && styles.characterCountWarning]}>
          {title.length}/100 {title.length < 10 && title.length > 0 ? '(min 10)' : ''}
        </Text>
      </View>

      <View style={styles.inputGroup}>
        <Text style={styles.inputLabel}>Description * (min 20 characters)</Text>
        <TextInput
          style={[styles.textInput, styles.textArea]}
          placeholder={`Describe your ${listingType === 'sell' ? 'item' : listingType === 'service' ? 'service' : 'job requirements'} in detail...`}
          value={description}
          onChangeText={setDescription}
          multiline
          numberOfLines={6}
          maxLength={1000}
        />
        <Text style={[styles.characterCount, description.length < 20 && description.length > 0 && styles.characterCountWarning]}>
          {description.length}/1000 {description.length < 20 && description.length > 0 ? '(min 20)' : ''}
        </Text>
      </View>

      <View style={styles.inputGroup}>
        <Text style={styles.inputLabel}>
          {listingType === 'sell' ? 'Price *' : listingType === 'service' ? 'Rate *' : 'Budget *'}
        </Text>
        <View style={styles.priceInputContainer}>
          <Text style={styles.currencySymbol}>₦</Text>
          <TextInput
            style={styles.priceInput}
            placeholder={
              listingType === 'sell' ? '150,000' :
              listingType === 'service' ? '5,000/hour or 25,000/project' :
              '50,000 - 100,000'
            }
            value={price}
            onChangeText={setPrice}
            keyboardType="numeric"
          />
        </View>
      </View>
    </View>
  );

  const renderCategorySelection = () => (
    <View style={styles.sectionContainer}>
      <Text style={styles.sectionTitle}>Category *</Text>
      <TouchableOpacity 
        style={styles.pickerButton}
        onPress={() => setShowCategoryPicker(!showCategoryPicker)}
      >
        <Text style={styles.pickerButtonText}>
          {category || 'Select a category'}
        </Text>
        <Text style={styles.pickerArrow}>▼</Text>
      </TouchableOpacity>
      
      {showCategoryPicker && (
        <View style={styles.pickerDropdown}>
          {MARKETPLACE_CATEGORIES
            .filter(cat => cat.backendId !== null && (
              listingType === 'service' ? cat.type === 'service' : cat.type === 'item'
            ))
            .map((cat) => (
              <TouchableOpacity
                key={cat.id}
                style={styles.pickerOption}
                onPress={() => {
                  setCategory(cat.name);
                  setShowCategoryPicker(false);
                }}
              >
                <Text style={styles.pickerOptionText}>{cat.icon} {cat.name}</Text>
              </TouchableOpacity>
            ))}
        </View>
      )}
    </View>
  );

  const renderConditionSelection = () => (
    listingType === 'sell' && (
      <View style={styles.sectionContainer}>
        <Text style={styles.sectionTitle}>Condition</Text>
        <TouchableOpacity
          style={styles.pickerButton}
          onPress={() => setShowConditionPicker(!showConditionPicker)}
        >
          <Text style={styles.pickerButtonText}>
            {condition ? conditionOptions.find(c => c.value === condition)?.label : 'Select condition'}
          </Text>
          <Text style={styles.pickerArrow}>▼</Text>
        </TouchableOpacity>
        
        {showConditionPicker && (
          <View style={styles.pickerDropdown}>
            {conditionOptions.map((cond) => (
              <TouchableOpacity
                key={cond.value}
                style={styles.pickerOption}
                onPress={() => {
                  setCondition(cond.value);
                  setShowConditionPicker(false);
                }}
              >
                <Text style={styles.pickerOptionText}>{cond.label}</Text>
              </TouchableOpacity>
            ))}
          </View>
        )}
      </View>
    )
  );

  const renderLocationContact = () => (
    <View style={styles.sectionContainer}>
      <Text style={styles.sectionTitle}>Location & Contact</Text>
      
      <View style={styles.inputGroup}>
        <Text style={styles.inputLabel}>Location (min 10 characters)</Text>
        <TextInput
          style={styles.textInput}
          placeholder="e.g., Ikeja, Lagos State, Nigeria"
          value={location}
          onChangeText={setLocation}
        />
        {location && location.length < 10 && (
          <Text style={[styles.characterCount, styles.characterCountWarning]}>
            {location.length}/10 minimum characters required
          </Text>
        )}
      </View>

      <View style={styles.inputGroup}>
        <Text style={styles.inputLabel}>How should buyers contact you?</Text>
        <View style={styles.contactOptions}>
          {[
            { key: 'in_app', label: '💬 In-app messaging only' },
            { key: 'phone', label: '📞 Phone calls preferred' },
            { key: 'both', label: '📱 Both messaging and calls' },
          ].map((option) => (
            <TouchableOpacity
              key={option.key}
              style={[
                styles.contactOption,
                contactMethod === option.key && styles.contactOptionActive
              ]}
              onPress={() => setContactMethod(option.key as any)}
            >
              <Text style={[
                styles.contactOptionText,
                contactMethod === option.key && styles.contactOptionTextActive
              ]}>
                {option.label}
              </Text>
            </TouchableOpacity>
          ))}
        </View>
      </View>
    </View>
  );

  return (
    <SafeAreaView style={styles.container}>
      {/* Header with iOS-compliant icons */}
      <View style={styles.header}>
        <TouchableOpacity
          style={styles.headerButton}
          onPress={() => {
            triggerHaptic();
            navigation?.goBack();
          }}
          accessible={true}
          accessibilityLabel="Close"
          accessibilityRole="button"
        >
          <Ionicons name="close" size={28} color={colors.text.dark} />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Create Listing</Text>
        <TouchableOpacity
          style={styles.headerButton}
          onPress={handleSubmit}
          disabled={submitting}
          accessible={true}
          accessibilityLabel="Post listing"
          accessibilityRole="button"
        >
          {submitting ? (
            <ActivityIndicator size="small" color={colors.primary} />
          ) : (
            <Text style={styles.postButtonText}>Post</Text>
          )}
        </TouchableOpacity>
      </View>

      <KeyboardAvoidingView 
        style={styles.keyboardAvoid}
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
      >
        <ScrollView style={styles.scrollView} showsVerticalScrollIndicator={false}>
          {renderListingTypeSelector()}
          {renderImageUpload()}
          {renderBasicInfo()}
          {renderCategorySelection()}
          {renderConditionSelection()}
          {renderLocationContact()}

          {/* Preview & Submit */}
          <View style={styles.sectionContainer}>
            <Text style={styles.sectionTitle}>Ready to Post?</Text>
            <Text style={styles.sectionSubtitle}>
              Your listing will be reviewed and go live within 24 hours
            </Text>

            <TouchableOpacity
              style={[styles.submitButton, submitting && styles.submitButtonDisabled]}
              onPress={handleSubmit}
              disabled={submitting}
              accessible={true}
              accessibilityLabel="Create listing"
              accessibilityRole="button"
            >
              {submitting ? (
                <ActivityIndicator size="small" color={colors.white} />
              ) : (
                <Text style={styles.submitButtonText}>Create Listing</Text>
              )}
            </TouchableOpacity>
          </View>
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.neutral.offWhite,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
    backgroundColor: colors.white,
    borderBottomWidth: 1,
    borderBottomColor: colors.neutral.lightGray,
  },
  headerButton: {
    padding: spacing.xs,
    minWidth: 44,
    minHeight: 44,
    justifyContent: 'center',
    alignItems: 'center',
  },
  headerTitle: {
    fontSize: typography.sizes.lg,
    fontWeight: typography.weights.semibold,
    color: colors.text.dark,
  },
  postButtonText: {
    fontSize: typography.sizes.base,
    fontWeight: typography.weights.semibold,
    color: colors.primary,
    textAlign: 'right',
  },
  keyboardAvoid: {
    flex: 1,
  },
  scrollView: {
    flex: 1,
  },
  sectionContainer: {
    backgroundColor: colors.white,
    marginBottom: spacing.sm,
    padding: spacing.md,
  },
  sectionTitle: {
    fontSize: typography.sizes.lg,
    fontWeight: typography.weights.semibold,
    color: colors.text.dark,
    marginBottom: spacing.xs,
  },
  sectionSubtitle: {
    fontSize: typography.sizes.sm,
    color: colors.text.light,
    marginBottom: spacing.md,
  },
  typeSelector: {
    gap: spacing.sm,
  },
  typeOption: {
    padding: spacing.md,
    borderRadius: 12,
    borderWidth: 2,
    borderColor: colors.neutral.lightGray,
  },
  typeOptionActive: {
    borderColor: colors.primary,
    backgroundColor: colors.lightGreen,
  },
  typeLabel: {
    fontSize: typography.sizes.base,
    fontWeight: typography.weights.semibold,
    color: colors.text.dark,
    marginBottom: spacing.xs / 2,
  },
  typeLabelActive: {
    color: colors.primary,
  },
  typeDesc: {
    fontSize: typography.sizes.sm,
    color: colors.text.light,
  },
  typeDescActive: {
    color: colors.text.dark,
  },
  imagesContainer: {
    flexDirection: 'row',
  },
  addImageButton: {
    width: 100,
    height: 100,
    borderRadius: 8,
    borderWidth: 2,
    borderStyle: 'dashed',
    borderColor: colors.primary,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: spacing.sm,
  },
  addImageText: {
    fontSize: typography.sizes['2xl'],
    color: colors.primary,
  },
  addImageLabel: {
    fontSize: typography.sizes.sm,
    color: colors.primary,
    marginTop: spacing.xs,
  },
  imageItem: {
    position: 'relative',
    marginRight: spacing.sm,
  },
  uploadedImage: {
    width: 100,
    height: 100,
    borderRadius: 8,
  },
  removeImageButton: {
    position: 'absolute',
    top: -5,
    right: -5,
    backgroundColor: colors.danger,
    borderRadius: 15,
    width: 20,
    height: 20,
    alignItems: 'center',
    justifyContent: 'center',
  },
  removeImageText: {
    color: colors.white,
    fontSize: typography.sizes.sm,
    fontWeight: typography.weights.bold,
  },
  inputGroup: {
    marginBottom: spacing.md,
  },
  inputLabel: {
    fontSize: typography.sizes.base,
    fontWeight: typography.weights.medium,
    color: colors.text.dark,
    marginBottom: spacing.xs,
  },
  textInput: {
    borderWidth: 1,
    borderColor: colors.neutral.lightGray,
    borderRadius: 8,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
    fontSize: typography.sizes.base,
    color: colors.text.dark,
    backgroundColor: colors.white,
  },
  textArea: {
    height: 120,
    textAlignVertical: 'top',
  },
  characterCount: {
    fontSize: typography.sizes.sm,
    color: colors.text.light,
    textAlign: 'right',
    marginTop: spacing.xs / 2,
  },
  characterCountWarning: {
    color: colors.warning,
  },
  priceInputContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: colors.neutral.lightGray,
    borderRadius: 8,
    backgroundColor: colors.white,
  },
  currencySymbol: {
    fontSize: typography.sizes.lg,
    fontWeight: typography.weights.semibold,
    color: colors.accent.marketGreen,
    paddingLeft: spacing.md,
  },
  priceInput: {
    flex: 1,
    paddingHorizontal: spacing.sm,
    paddingVertical: spacing.sm,
    fontSize: typography.sizes.base,
    color: colors.text.dark,
  },
  pickerButton: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: colors.neutral.lightGray,
    borderRadius: 8,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
    backgroundColor: colors.white,
  },
  pickerButtonText: {
    fontSize: typography.sizes.base,
    color: colors.text.dark,
  },
  pickerArrow: {
    fontSize: typography.sizes.sm,
    color: colors.text.light,
  },
  pickerDropdown: {
    borderWidth: 1,
    borderColor: colors.neutral.lightGray,
    borderRadius: 8,
    backgroundColor: colors.white,
    marginTop: spacing.xs,
    maxHeight: 200,
  },
  pickerOption: {
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
    borderBottomWidth: 1,
    borderBottomColor: colors.neutral.lightGray,
  },
  pickerOptionText: {
    fontSize: typography.sizes.base,
    color: colors.text.dark,
  },
  contactOptions: {
    gap: spacing.sm,
  },
  contactOption: {
    padding: spacing.sm,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: colors.neutral.lightGray,
  },
  contactOptionActive: {
    borderColor: colors.primary,
    backgroundColor: colors.lightGreen,
  },
  contactOptionText: {
    fontSize: typography.sizes.base,
    color: colors.text.dark,
  },
  contactOptionTextActive: {
    color: colors.primary,
    fontWeight: typography.weights.medium,
  },
  submitButton: {
    backgroundColor: colors.primary,
    borderRadius: 25,
    paddingVertical: spacing.md,
    alignItems: 'center',
    marginTop: spacing.md,
    minHeight: 48,
    justifyContent: 'center',
  },
  submitButtonDisabled: {
    backgroundColor: colors.neutral.gray,
    opacity: 0.6,
  },
  submitButtonText: {
    fontSize: typography.sizes.lg,
    fontWeight: typography.weights.semibold,
    color: colors.white,
  },
});