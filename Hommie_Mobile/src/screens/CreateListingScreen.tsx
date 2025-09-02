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
  Platform
} from 'react-native';
import { SafeAreaView } from 'react-native';
import { colors, typography, spacing, shadows, MARKETPLACE_CATEGORIES, NIGERIAN_SERVICE_CATEGORIES } from '../constants';

interface CreateListingScreenProps {
  navigation?: any;
}

export default function CreateListingScreen({ navigation }: CreateListingScreenProps) {
  const [listingType, setListingType] = useState<'sell' | 'service' | 'job'>('sell');
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [price, setPrice] = useState('');
  const [category, setCategory] = useState('');
  const [condition, setCondition] = useState('');
  const [location, setLocation] = useState('');
  const [contactMethod, setContactMethod] = useState<'in_app' | 'phone' | 'both'>('in_app');
  const [images, setImages] = useState<string[]>([]);
  const [showCategoryPicker, setShowCategoryPicker] = useState(false);
  const [showConditionPicker, setShowConditionPicker] = useState(false);

  const conditionOptions = [
    'Brand New',
    'Used - Like New',
    'Used - Good',
    'Used - Fair',
    'Used - Needs Repair'
  ];

  const handleImagePicker = () => {
    Alert.alert(
      'Add Photo',
      'Choose how you want to add a photo:',
      [
        { text: 'Cancel', style: 'cancel' },
        { text: '📷 Camera', onPress: () => console.log('Open camera') },
        { text: '📱 Gallery', onPress: () => console.log('Open gallery') },
      ]
    );
  };

  const handleSubmit = () => {
    if (!title || !description || !price || !category) {
      Alert.alert('Missing Information', 'Please fill in all required fields.');
      return;
    }

    Alert.alert(
      'Create Listing',
      'Your listing will be reviewed before going live. Continue?',
      [
        { text: 'Cancel', style: 'cancel' },
        { 
          text: 'Create Listing', 
          onPress: () => {
            console.log('Creating listing...');
            navigation?.goBack();
          }
        },
      ]
    );
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
            onPress={() => setListingType(type.key as any)}
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
        <TouchableOpacity style={styles.addImageButton} onPress={handleImagePicker}>
          <Text style={styles.addImageText}>+</Text>
          <Text style={styles.addImageLabel}>Add Photo</Text>
        </TouchableOpacity>
        
        {images.map((image, index) => (
          <View key={index} style={styles.imageItem}>
            <Image source={{ uri: image }} style={styles.uploadedImage} />
            <TouchableOpacity 
              style={styles.removeImageButton}
              onPress={() => setImages(images.filter((_, i) => i !== index))}
            >
              <Text style={styles.removeImageText}>×</Text>
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
        <Text style={styles.inputLabel}>Title *</Text>
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
        <Text style={styles.characterCount}>{title.length}/100</Text>
      </View>

      <View style={styles.inputGroup}>
        <Text style={styles.inputLabel}>Description *</Text>
        <TextInput
          style={[styles.textInput, styles.textArea]}
          placeholder={`Describe your ${listingType === 'sell' ? 'item' : listingType === 'service' ? 'service' : 'job requirements'} in detail...`}
          value={description}
          onChangeText={setDescription}
          multiline
          numberOfLines={6}
          maxLength={1000}
        />
        <Text style={styles.characterCount}>{description.length}/1000</Text>
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
          {(listingType === 'service' ? NIGERIAN_SERVICE_CATEGORIES : 
            MARKETPLACE_CATEGORIES.slice(1).map(c => c.name)
          ).map((cat) => (
            <TouchableOpacity
              key={cat}
              style={styles.pickerOption}
              onPress={() => {
                setCategory(cat);
                setShowCategoryPicker(false);
              }}
            >
              <Text style={styles.pickerOptionText}>{cat}</Text>
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
            {condition || 'Select condition'}
          </Text>
          <Text style={styles.pickerArrow}>▼</Text>
        </TouchableOpacity>
        
        {showConditionPicker && (
          <View style={styles.pickerDropdown}>
            {conditionOptions.map((cond) => (
              <TouchableOpacity
                key={cond}
                style={styles.pickerOption}
                onPress={() => {
                  setCondition(cond);
                  setShowConditionPicker(false);
                }}
              >
                <Text style={styles.pickerOptionText}>{cond}</Text>
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
        <Text style={styles.inputLabel}>Location</Text>
        <TextInput
          style={styles.textInput}
          placeholder="e.g., Ikeja, Lagos"
          value={location}
          onChangeText={setLocation}
        />
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
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity 
          style={styles.headerButton}
          onPress={() => navigation?.goBack()}
        >
          <Text style={styles.headerButtonText}>×</Text>
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Create Listing</Text>
        <TouchableOpacity style={styles.headerButton} onPress={handleSubmit}>
          <Text style={styles.postButtonText}>Post</Text>
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
            
            <TouchableOpacity style={styles.submitButton} onPress={handleSubmit}>
              <Text style={styles.submitButtonText}>Create Listing</Text>
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
    minWidth: 50,
  },
  headerButtonText: {
    fontSize: typography.sizes.xl,
    color: colors.text.dark,
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
  },
  submitButtonText: {
    fontSize: typography.sizes.lg,
    fontWeight: typography.weights.semibold,
    color: colors.white,
  },
});