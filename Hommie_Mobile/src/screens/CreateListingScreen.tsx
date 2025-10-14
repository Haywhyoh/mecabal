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
  const [listingType, setListingType] = useState<'property' | 'item' | 'service'>('item');
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [price, setPrice] = useState('');
  const [category, setCategory] = useState('');
  const [location, setLocation] = useState('');
  const [images, setImages] = useState<string[]>([]);
  const [uploadedImageUrls, setUploadedImageUrls] = useState<string[]>([]);
  const [showCategoryPicker, setShowCategoryPicker] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [showConditionPicker, setShowConditionPicker] = useState(false);
  const [contactMethod, setContactMethod] = useState<'in_app' | 'phone' | 'both'>('in_app');

  // Service-specific state
  const [serviceType, setServiceType] = useState<'offering' | 'request'>('offering');
  const [availabilityDays, setAvailabilityDays] = useState<string[]>([]);
  const [startTime, setStartTime] = useState('09:00');
  const [endTime, setEndTime] = useState('17:00');
  const [serviceRadius, setServiceRadius] = useState('5');
  const [licenses, setLicenses] = useState<string[]>([]);
  const [certifications, setCertifications] = useState<string[]>([]);
  const [yearsExperience, setYearsExperience] = useState('');
  const [hasInsurance, setHasInsurance] = useState(false);
  const [pricingModel, setPricingModel] = useState<'hourly' | 'project' | 'fixed' | 'negotiable'>('fixed');
  const [responseTime, setResponseTime] = useState('24');


  // Property-specific state
  const [propertyType, setPropertyType] = useState<'apartment' | 'house' | 'land' | 'office'>('apartment');
  const [transactionType, setTransactionType] = useState<'sale' | 'rent' | 'lease'>('rent');
  const [bedrooms, setBedrooms] = useState('');
  const [bathrooms, setBathrooms] = useState('');
  const [propertySize, setPropertySize] = useState('');
  const [landSize, setLandSize] = useState('');
  const [parkingSpaces, setParkingSpaces] = useState('');
  const [petPolicy, setPetPolicy] = useState<'allowed' | 'not_allowed' | 'case_by_case'>('not_allowed');
  const [rentalPeriod, setRentalPeriod] = useState<'monthly' | 'yearly'>('yearly');
  const [amenities, setAmenities] = useState<string[]>([]);
  const [utilitiesIncluded, setUtilitiesIncluded] = useState<string[]>([]);
  const [securityFeatures, setSecurityFeatures] = useState<string[]>([]);

  // Item-specific state
  const [condition, setCondition] = useState('');
  const [brand, setBrand] = useState('');
  const [model, setModel] = useState('');
  const [year, setYear] = useState('');
  const [warranty, setWarranty] = useState('');

  // Contact preferences state
  const [allowCalls, setAllowCalls] = useState(true);
  const [allowMessages, setAllowMessages] = useState(true);
  const [allowWhatsApp, setAllowWhatsApp] = useState(false);
  const [preferredContactTime, setPreferredContactTime] = useState('');

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

    // Type-specific validation
    if (listingType === 'service') {
      if (availabilityDays.length === 0) {
        Alert.alert('Missing Information', 'Please select at least one available day.');
        return;
      }
      if (!serviceRadius || isNaN(parseInt(serviceRadius))) {
        Alert.alert('Missing Information', 'Please enter a valid service radius.');
        return;
      }
    }


    if (listingType === 'property') {
      if ((propertyType === 'apartment' || propertyType === 'house') && (!bedrooms || !bathrooms)) {
        Alert.alert('Missing Information', 'Please enter number of bedrooms and bathrooms.');
        return;
      }
      if (propertyType === 'land' && (!landSize || isNaN(parseFloat(landSize)))) {
        Alert.alert('Missing Information', 'Please enter valid land size.');
        return;
      }
    }

    if (listingType === 'item' && !condition) {
      Alert.alert('Missing Information', 'Please select item condition.');
      return;
    }

    try {
      setSubmitting(true);
      triggerHaptic();

      // Find category backend ID from constants
      const categoryData = MARKETPLACE_CATEGORIES.find(cat => cat.name === category);
      if (!categoryData || !categoryData.backendId) {
        Alert.alert('Invalid Category', 'Please select a valid category');
        setSubmitting(false);
        return;
      }
      const categoryId = categoryData.backendId;

      const baseData: CreateListingRequest = {
        listingType: listingType,
        categoryId: categoryId,
        title,
        description,
        price: parseFloat(price.replace(/,/g, '')),
        priceType: 'fixed',
        location: {
          latitude: 0, // TODO: Get from user's location
          longitude: 0,
          address: location || 'Default Location Address'
        },
        media: uploadedImageUrls.map((url, index) => ({
          id: `media-${index}`,
          url,
          type: 'image' as const,
          displayOrder: index
        }))
      };

      // Add type-specific fields
      if (listingType === 'service') {
        Object.assign(baseData, {
          serviceType,
          availabilitySchedule: {
            days: availabilityDays,
            startTime,
            endTime,
            timezone: 'Africa/Lagos'
          },
          serviceRadius: parseInt(serviceRadius),
          professionalCredentials: {
            licenses: licenses.filter(l => l),
            certifications: certifications.filter(c => c),
            experience: parseInt(yearsExperience) || 0,
            insurance: hasInsurance
          },
          pricingModel,
          responseTime: parseInt(responseTime),
          contactPreferences: {
            allowCalls,
            allowMessages,
            allowWhatsApp,
            preferredTime: preferredContactTime
          }
        });
      } else if (listingType === 'property') {
        const propertyData: any = {
          propertyType,
          transactionType, // Add transaction type
          bedrooms: parseInt(bedrooms) || undefined,
          bathrooms: parseInt(bathrooms) || undefined,
          propertySize: parseFloat(propertySize) || undefined,
          landSize: parseFloat(landSize) || undefined,
          parkingSpaces: parseInt(parkingSpaces) || undefined,
          petPolicy,
          propertyAmenities: amenities.length > 0 ? amenities : undefined, // Rename field
          utilitiesIncluded: utilitiesIncluded.length > 0 ? utilitiesIncluded : undefined,
          securityFeatures: securityFeatures.length > 0 ? securityFeatures : undefined
        };

        // Only include rentalPeriod if transaction type is rent
        if (transactionType === 'rent') {
          propertyData.rentalPeriod = rentalPeriod;
        }

        Object.assign(baseData, propertyData);
      } else if (listingType === 'item') {
        Object.assign(baseData, {
          condition,
          brand,
          model,
          year: parseInt(year) || undefined,
          warranty
        });
      }

      await listingsService.createListing(baseData);

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
      <Text style={styles.sectionTitle}>What type of listing?</Text>
      <View style={styles.typeSelector}>
        {[
          { key: 'item', label: '🛍️ Sell Item', desc: 'Physical products and goods' },
          { key: 'service', label: '🔧 Offer Service', desc: 'Professional services' },
          { key: 'property', label: '🏠 List Property', desc: 'Rent or sell property' },
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
            listingType === 'item' ? 'e.g., iPhone 12 Pro Max 256GB' :
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
          placeholder={`Describe your ${listingType === 'item' ? 'item' : listingType === 'service' ? 'service' : 'property'} in detail...`}
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
          {listingType === 'item' ? 'Price *' : listingType === 'service' ? 'Rate *' : 'Budget *'}
        </Text>
        <View style={styles.priceInputContainer}>
          <Text style={styles.currencySymbol}>₦</Text>
          <TextInput
            style={styles.priceInput}
            placeholder={
              listingType === 'item' ? '150,000' :
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
          .filter(cat => cat.backendId !== null && cat.type === listingType)
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

  const renderServiceFields = () => {
    if (listingType !== 'service') return null;

    return (
      <View style={styles.sectionContainer}>
        <Text style={styles.sectionTitle}>Service Details</Text>

        {/* Service Type */}
        <View style={styles.inputGroup}>
          <Text style={styles.inputLabel}>Service Type *</Text>
          <View style={styles.radioGroup}>
            <TouchableOpacity
              style={[styles.radioOption, serviceType === 'offering' && styles.radioOptionActive]}
              onPress={() => setServiceType('offering')}
            >
              <Ionicons
                name={serviceType === 'offering' ? 'radio-button-on' : 'radio-button-off'}
                size={20}
                color={serviceType === 'offering' ? colors.primary : colors.text.light}
              />
              <Text style={styles.radioLabel}>I Offer This Service</Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={[styles.radioOption, serviceType === 'request' && styles.radioOptionActive]}
              onPress={() => setServiceType('request')}
            >
              <Ionicons
                name={serviceType === 'request' ? 'radio-button-on' : 'radio-button-off'}
                size={20}
                color={serviceType === 'request' ? colors.primary : colors.text.light}
              />
              <Text style={styles.radioLabel}>I Need This Service</Text>
            </TouchableOpacity>
          </View>
        </View>

        {/* Availability Days */}
        <View style={styles.inputGroup}>
          <Text style={styles.inputLabel}>Available Days *</Text>
          <View style={styles.daysSelector}>
            {['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'].map((day) => (
              <TouchableOpacity
                key={day}
                style={[
                  styles.dayChip,
                  availabilityDays.includes(day) && styles.dayChipActive
                ]}
                onPress={() => {
                  if (availabilityDays.includes(day)) {
                    setAvailabilityDays(availabilityDays.filter(d => d !== day));
                  } else {
                    setAvailabilityDays([...availabilityDays, day]);
                  }
                }}
              >
                <Text style={[
                  styles.dayText,
                  availabilityDays.includes(day) && styles.dayTextActive
                ]}>
                  {day}
                </Text>
              </TouchableOpacity>
            ))}
          </View>
        </View>

        {/* Time Range */}
        <View style={styles.timeRangeGroup}>
          <View style={[styles.inputGroup, { flex: 1 }]}>
            <Text style={styles.inputLabel}>Start Time *</Text>
            <TextInput
              style={styles.textInput}
              placeholder="09:00"
              value={startTime}
              onChangeText={setStartTime}
            />
          </View>
          <View style={[styles.inputGroup, { flex: 1 }]}>
            <Text style={styles.inputLabel}>End Time *</Text>
            <TextInput
              style={styles.textInput}
              placeholder="17:00"
              value={endTime}
              onChangeText={setEndTime}
            />
          </View>
        </View>

        {/* Service Radius */}
        <View style={styles.inputGroup}>
          <Text style={styles.inputLabel}>Service Radius (km) *</Text>
          <TextInput
            style={styles.textInput}
            placeholder="e.g., 5"
            value={serviceRadius}
            onChangeText={setServiceRadius}
            keyboardType="numeric"
          />
        </View>

        {/* Pricing Model */}
        <View style={styles.inputGroup}>
          <Text style={styles.inputLabel}>Pricing Model *</Text>
          <View style={styles.pricingModelSelector}>
            {[
              { value: 'hourly', label: '₦ /hour', icon: 'time-outline' },
              { value: 'project', label: 'Per Project', icon: 'briefcase-outline' },
              { value: 'fixed', label: 'Fixed Rate', icon: 'cash-outline' },
              { value: 'negotiable', label: 'Negotiable', icon: 'swap-horizontal-outline' },
            ].map((model) => (
              <TouchableOpacity
                key={model.value}
                style={[
                  styles.pricingOption,
                  pricingModel === model.value && styles.pricingOptionActive
                ]}
                onPress={() => setPricingModel(model.value as any)}
              >
                <Ionicons
                  name={model.icon as any}
                  size={20}
                  color={pricingModel === model.value ? colors.primary : colors.text.light}
                />
                <Text style={[
                  styles.pricingLabel,
                  pricingModel === model.value && styles.pricingLabelActive
                ]}>
                  {model.label}
                </Text>
              </TouchableOpacity>
            ))}
          </View>
        </View>

        {/* Response Time */}
        <View style={styles.inputGroup}>
          <Text style={styles.inputLabel}>Response Time (hours)</Text>
          <TextInput
            style={styles.textInput}
            placeholder="24"
            value={responseTime}
            onChangeText={setResponseTime}
            keyboardType="numeric"
          />
          <Text style={styles.inputHint}>How quickly can you respond to inquiries?</Text>
        </View>

        {/* Professional Credentials */}
        <View style={styles.credentialsGroup}>
          <Text style={styles.sectionTitle}>Professional Credentials (Optional)</Text>

          {/* Years of Experience */}
          <View style={styles.inputGroup}>
            <Text style={styles.inputLabel}>Years of Experience</Text>
            <TextInput
              style={styles.textInput}
              placeholder="e.g., 5"
              value={yearsExperience}
              onChangeText={setYearsExperience}
              keyboardType="numeric"
            />
          </View>

          {/* Insurance */}
          <TouchableOpacity
            style={styles.checkboxRow}
            onPress={() => setHasInsurance(!hasInsurance)}
          >
            <Ionicons
              name={hasInsurance ? 'checkbox' : 'square-outline'}
              size={24}
              color={hasInsurance ? colors.primary : colors.text.light}
            />
            <Text style={styles.checkboxLabel}>I have professional insurance</Text>
          </TouchableOpacity>

          {/* Licenses */}
          <View style={styles.inputGroup}>
            <Text style={styles.inputLabel}>Licenses (comma-separated)</Text>
            <TextInput
              style={styles.textInput}
              placeholder="e.g., Electrician License, CAC Registration"
              value={licenses.join(', ')}
              onChangeText={(text) => setLicenses(text.split(',').map(l => l.trim()))}
            />
          </View>

          {/* Certifications */}
          <View style={styles.inputGroup}>
            <Text style={styles.inputLabel}>Certifications (comma-separated)</Text>
            <TextInput
              style={styles.textInput}
              placeholder="e.g., ISO Certified, Safety Training"
              value={certifications.join(', ')}
              onChangeText={(text) => setCertifications(text.split(',').map(c => c.trim()))}
            />
          </View>
        </View>
      </View>
    );
  };



  const renderPropertyFields = () => {
    if (listingType !== 'property') return null;

    return (
      <View style={styles.sectionContainer}>
        <Text style={styles.sectionTitle}>Property Details</Text>

        {/* Property Type */}
        <View style={styles.inputGroup}>
          <Text style={styles.inputLabel}>Property Type *</Text>
          <View style={styles.propertyTypeSelector}>
            {[
              { value: 'apartment', label: 'Apartment', icon: 'business-outline' },
              { value: 'house', label: 'House', icon: 'home-outline' },
              { value: 'land', label: 'Land', icon: 'map-outline' },
              { value: 'office', label: 'Office', icon: 'briefcase-outline' },
            ].map((type) => (
              <TouchableOpacity
                key={type.value}
                style={[
                  styles.propertyTypeOption,
                  propertyType === type.value && styles.propertyTypeOptionActive
                ]}
                onPress={() => setPropertyType(type.value as any)}
              >
                <Ionicons
                  name={type.icon as any}
                  size={24}
                  color={propertyType === type.value ? colors.primary : colors.text.light}
                />
                <Text style={[
                  styles.propertyTypeText,
                  propertyType === type.value && styles.propertyTypeTextActive
                ]}>
                  {type.label}
                </Text>
              </TouchableOpacity>
            ))}
          </View>
        </View>

        {/* Bedrooms & Bathrooms */}
        {(propertyType === 'apartment' || propertyType === 'house') && (
          <View style={styles.roomsGroup}>
            <View style={[styles.inputGroup, { flex: 1 }]}>
              <Text style={styles.inputLabel}>Bedrooms *</Text>
              <TextInput
                style={styles.textInput}
                placeholder="e.g., 3"
                value={bedrooms}
                onChangeText={setBedrooms}
                keyboardType="numeric"
              />
            </View>
            <View style={[styles.inputGroup, { flex: 1 }]}>
              <Text style={styles.inputLabel}>Bathrooms *</Text>
              <TextInput
                style={styles.textInput}
                placeholder="e.g., 2"
                value={bathrooms}
                onChangeText={setBathrooms}
                keyboardType="numeric"
              />
            </View>
          </View>
        )}

        {/* Property Size */}
        <View style={styles.inputGroup}>
          <Text style={styles.inputLabel}>Property Size (m²)</Text>
          <TextInput
            style={styles.textInput}
            placeholder="e.g., 150"
            value={propertySize}
            onChangeText={setPropertySize}
            keyboardType="numeric"
          />
        </View>

        {/* Land Size */}
        {propertyType === 'land' && (
          <View style={styles.inputGroup}>
            <Text style={styles.inputLabel}>Land Size (m²) *</Text>
            <TextInput
              style={styles.textInput}
              placeholder="e.g., 500"
              value={landSize}
              onChangeText={setLandSize}
              keyboardType="numeric"
            />
          </View>
        )}

        {/* Parking Spaces */}
        <View style={styles.inputGroup}>
          <Text style={styles.inputLabel}>Parking Spaces</Text>
          <TextInput
            style={styles.textInput}
            placeholder="e.g., 2"
            value={parkingSpaces}
            onChangeText={setParkingSpaces}
            keyboardType="numeric"
          />
        </View>

        {/* Pet Policy */}
        {(propertyType === 'apartment' || propertyType === 'house') && (
          <View style={styles.inputGroup}>
            <Text style={styles.inputLabel}>Pet Policy</Text>
            <View style={styles.petPolicySelector}>
              {[
                { value: 'allowed', label: 'Allowed' },
                { value: 'not_allowed', label: 'Not Allowed' },
                { value: 'case_by_case', label: 'Case by Case' },
              ].map((policy) => (
                <TouchableOpacity
                  key={policy.value}
                  style={[
                    styles.petPolicyOption,
                    petPolicy === policy.value && styles.petPolicyOptionActive
                  ]}
                  onPress={() => setPetPolicy(policy.value as any)}
                >
                  <Text style={[
                    styles.petPolicyText,
                    petPolicy === policy.value && styles.petPolicyTextActive
                  ]}>
                    {policy.label}
                  </Text>
                </TouchableOpacity>
              ))}
            </View>
          </View>
        )}

        {/* Transaction Type */}
        <View style={styles.inputGroup}>
          <Text style={styles.inputLabel}>Transaction Type *</Text>
          <View style={styles.transactionTypeSelector}>
            {[
              { value: 'sale', label: 'For Sale', icon: 'cash-outline' },
              { value: 'rent', label: 'For Rent', icon: 'key-outline' },
              { value: 'lease', label: 'For Lease', icon: 'document-text-outline' },
            ].map((type) => (
              <TouchableOpacity
                key={type.value}
                style={[
                  styles.transactionTypeOption,
                  transactionType === type.value && styles.transactionTypeOptionActive
                ]}
                onPress={() => setTransactionType(type.value as any)}
              >
                <Ionicons
                  name={type.icon as any}
                  size={20}
                  color={transactionType === type.value ? colors.primary : colors.text.light}
                />
                <Text style={[
                  styles.transactionTypeText,
                  transactionType === type.value && styles.transactionTypeTextActive
                ]}>
                  {type.label}
                </Text>
              </TouchableOpacity>
            ))}
          </View>
        </View>

        {/* Rental Period - Only show for rent transactions */}
        {transactionType === 'rent' && (
          <View style={styles.inputGroup}>
            <Text style={styles.inputLabel}>Rental Period *</Text>
          <View style={styles.rentalPeriodSelector}>
            {[
              { value: 'monthly', label: 'Monthly' },
              { value: 'yearly', label: 'Yearly' },
            ].map((period) => (
              <TouchableOpacity
                key={period.value}
                style={[
                  styles.rentalPeriodOption,
                  rentalPeriod === period.value && styles.rentalPeriodOptionActive
                ]}
                onPress={() => setRentalPeriod(period.value as any)}
              >
                <Text style={[
                  styles.rentalPeriodText,
                  rentalPeriod === period.value && styles.rentalPeriodTextActive
                ]}>
                  {period.label}
                </Text>
              </TouchableOpacity>
            ))}
          </View>
        </View>
        )}

        {/* Amenities */}
        <View style={styles.inputGroup}>
          <Text style={styles.inputLabel}>Amenities (select all that apply)</Text>
          <View style={styles.amenitiesSelector}>
            {[
              'Swimming Pool', 'Gym', 'Generator', 'Air Conditioning',
              'Water Heater', 'Balcony', 'Garden', 'Elevator',
              'Garage', 'Playground', 'Security', 'CCTV'
            ].map((amenity) => (
              <TouchableOpacity
                key={amenity}
                style={[
                  styles.amenityChip,
                  amenities.includes(amenity) && styles.amenityChipActive
                ]}
                onPress={() => {
                  if (amenities.includes(amenity)) {
                    setAmenities(amenities.filter(a => a !== amenity));
                  } else {
                    setAmenities([...amenities, amenity]);
                  }
                }}
              >
                <Text style={[
                  styles.amenityChipText,
                  amenities.includes(amenity) && styles.amenityChipTextActive
                ]}>
                  {amenity}
                </Text>
              </TouchableOpacity>
            ))}
          </View>
        </View>

        {/* Utilities Included */}
        <View style={styles.inputGroup}>
          <Text style={styles.inputLabel}>Utilities Included</Text>
          <View style={styles.utilitiesSelector}>
            {[
              'Water', 'Electricity', 'Gas', 'Internet',
              'Cable TV', 'Trash Collection', 'Security'
            ].map((utility) => (
              <TouchableOpacity
                key={utility}
                style={[
                  styles.utilityChip,
                  utilitiesIncluded.includes(utility) && styles.utilityChipActive
                ]}
                onPress={() => {
                  if (utilitiesIncluded.includes(utility)) {
                    setUtilitiesIncluded(utilitiesIncluded.filter(u => u !== utility));
                  } else {
                    setUtilitiesIncluded([...utilitiesIncluded, utility]);
                  }
                }}
              >
                <Text style={[
                  styles.utilityChipText,
                  utilitiesIncluded.includes(utility) && styles.utilityChipTextActive
                ]}>
                  {utility}
                </Text>
              </TouchableOpacity>
            ))}
          </View>
        </View>

        {/* Security Features */}
        <View style={styles.inputGroup}>
          <Text style={styles.inputLabel}>Security Features</Text>
          <View style={styles.securitySelector}>
            {[
              'Gated Estate', '24/7 Security', 'CCTV', 'Alarm System',
              'Security Door', 'Intercom', 'Fire Extinguisher'
            ].map((feature) => (
              <TouchableOpacity
                key={feature}
                style={[
                  styles.securityChip,
                  securityFeatures.includes(feature) && styles.securityChipActive
                ]}
                onPress={() => {
                  if (securityFeatures.includes(feature)) {
                    setSecurityFeatures(securityFeatures.filter(f => f !== feature));
                  } else {
                    setSecurityFeatures([...securityFeatures, feature]);
                  }
                }}
              >
                <Text style={[
                  styles.securityChipText,
                  securityFeatures.includes(feature) && styles.securityChipTextActive
                ]}>
                  {feature}
                </Text>
              </TouchableOpacity>
            ))}
          </View>
        </View>
      </View>
    );
  };

  const renderItemFields = () => {
    if (listingType !== 'item') return null;

    return (
      <View style={styles.sectionContainer}>
        <Text style={styles.sectionTitle}>Item Details</Text>

        {/* Condition */}
        <View style={styles.inputGroup}>
          <Text style={styles.inputLabel}>Condition *</Text>
          <View style={styles.conditionSelector}>
            {conditionOptions.map((cond) => (
              <TouchableOpacity
                key={cond.value}
                style={[
                  styles.conditionChip,
                  condition === cond.value && styles.conditionChipActive
                ]}
                onPress={() => setCondition(cond.value)}
              >
                <Text style={[
                  styles.conditionText,
                  condition === cond.value && styles.conditionTextActive
                ]}>
                  {cond.label}
                </Text>
              </TouchableOpacity>
            ))}
          </View>
        </View>

        {/* Brand */}
        <View style={styles.inputGroup}>
          <Text style={styles.inputLabel}>Brand</Text>
          <TextInput
            style={styles.textInput}
            placeholder="e.g., Apple, Samsung, Nike"
            value={brand}
            onChangeText={setBrand}
          />
        </View>

        {/* Model */}
        <View style={styles.inputGroup}>
          <Text style={styles.inputLabel}>Model</Text>
          <TextInput
            style={styles.textInput}
            placeholder="e.g., iPhone 12 Pro, Galaxy S21"
            value={model}
            onChangeText={setModel}
          />
        </View>

        {/* Year */}
        <View style={styles.inputGroup}>
          <Text style={styles.inputLabel}>Year</Text>
          <TextInput
            style={styles.textInput}
            placeholder="e.g., 2023"
            value={year}
            onChangeText={setYear}
            keyboardType="numeric"
          />
        </View>

        {/* Warranty */}
        <View style={styles.inputGroup}>
          <Text style={styles.inputLabel}>Warranty</Text>
          <TextInput
            style={styles.textInput}
            placeholder="e.g., 1 year manufacturer warranty"
            value={warranty}
            onChangeText={setWarranty}
          />
        </View>
      </View>
    );
  };

  const renderConditionSelection = () => (
    listingType === 'item' && (
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

          {/* Type-specific fields */}
          {renderServiceFields()}
          {renderPropertyFields()}
          {renderItemFields()}

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
  
  // Service-specific styles
  radioGroup: {
    gap: spacing.sm,
  },
  radioOption: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: spacing.sm,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: colors.neutral.lightGray,
    gap: spacing.sm,
  },
  radioOptionActive: {
    borderColor: colors.primary,
    backgroundColor: colors.lightGreen,
  },
  radioLabel: {
    fontSize: typography.sizes.base,
    color: colors.text.dark,
    fontWeight: typography.weights.medium,
  },
  daysSelector: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: spacing.xs,
  },
  dayChip: {
    paddingHorizontal: spacing.sm,
    paddingVertical: spacing.xs,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: colors.neutral.lightGray,
    backgroundColor: colors.white,
  },
  dayChipActive: {
    borderColor: colors.primary,
    backgroundColor: colors.primary,
  },
  dayText: {
    fontSize: typography.sizes.sm,
    color: colors.text.dark,
    fontWeight: typography.weights.medium,
  },
  dayTextActive: {
    color: colors.white,
    fontWeight: typography.weights.semibold,
  },
  timeRangeGroup: {
    flexDirection: 'row',
    gap: spacing.sm,
  },
  pricingModelSelector: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: spacing.sm,
  },
  pricingOption: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: spacing.sm,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: colors.neutral.lightGray,
    gap: spacing.xs,
    minWidth: 120,
  },
  pricingOptionActive: {
    borderColor: colors.primary,
    backgroundColor: colors.lightGreen,
  },
  pricingLabel: {
    fontSize: typography.sizes.sm,
    color: colors.text.dark,
    fontWeight: typography.weights.medium,
  },
  pricingLabelActive: {
    color: colors.primary,
    fontWeight: typography.weights.semibold,
  },
  inputHint: {
    fontSize: typography.sizes.sm,
    color: colors.text.secondary,
    marginTop: spacing.xs / 2,
  },
  credentialsGroup: {
    marginTop: spacing.md,
  },
  checkboxRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: spacing.sm,
    gap: spacing.sm,
  },
  checkboxLabel: {
    fontSize: typography.sizes.base,
    color: colors.text.dark,
    fontWeight: typography.weights.medium,
  },
  
  
  // Property-specific styles
  propertyTypeSelector: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: spacing.sm,
  },
  propertyTypeOption: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: spacing.sm,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: colors.neutral.lightGray,
    gap: spacing.xs,
    minWidth: 100,
  },
  propertyTypeOptionActive: {
    borderColor: colors.primary,
    backgroundColor: colors.lightGreen,
  },
  propertyTypeText: {
    fontSize: typography.sizes.sm,
    color: colors.text.dark,
    fontWeight: typography.weights.medium,
  },
  propertyTypeTextActive: {
    color: colors.primary,
    fontWeight: typography.weights.semibold,
  },
  roomsGroup: {
    flexDirection: 'row',
    gap: spacing.sm,
  },
  petPolicySelector: {
    flexDirection: 'row',
    gap: spacing.sm,
  },
  petPolicyOption: {
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: colors.neutral.lightGray,
    backgroundColor: colors.white,
    flex: 1,
  },
  petPolicyOptionActive: {
    borderColor: colors.primary,
    backgroundColor: colors.primary,
  },
  petPolicyText: {
    fontSize: typography.sizes.sm,
    color: colors.text.dark,
    textAlign: 'center',
    fontWeight: typography.weights.medium,
  },
  petPolicyTextActive: {
    color: colors.white,
    fontWeight: typography.weights.semibold,
  },
  rentalPeriodSelector: {
    flexDirection: 'row',
    gap: spacing.sm,
  },
  rentalPeriodOption: {
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: colors.neutral.lightGray,
    backgroundColor: colors.white,
    flex: 1,
  },
  rentalPeriodOptionActive: {
    borderColor: colors.primary,
    backgroundColor: colors.primary,
  },
  rentalPeriodText: {
    fontSize: typography.sizes.sm,
    color: colors.text.dark,
    textAlign: 'center',
    fontWeight: typography.weights.medium,
  },
  rentalPeriodTextActive: {
    color: colors.white,
    fontWeight: typography.weights.semibold,
  },
  amenitiesSelector: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: spacing.sm,
  },
  amenityChip: {
    paddingHorizontal: spacing.sm,
    paddingVertical: spacing.xs,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: colors.neutral.lightGray,
    backgroundColor: colors.white,
  },
  amenityChipActive: {
    borderColor: colors.primary,
    backgroundColor: colors.primary,
  },
  amenityChipText: {
    fontSize: typography.sizes.sm,
    color: colors.text.dark,
    fontWeight: typography.weights.medium,
  },
  amenityChipTextActive: {
    color: colors.white,
    fontWeight: typography.weights.semibold,
  },
  utilitiesSelector: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: spacing.sm,
  },
  utilityChip: {
    paddingHorizontal: spacing.sm,
    paddingVertical: spacing.xs,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: colors.neutral.lightGray,
    backgroundColor: colors.white,
  },
  utilityChipActive: {
    borderColor: colors.success,
    backgroundColor: colors.success,
  },
  utilityChipText: {
    fontSize: typography.sizes.sm,
    color: colors.text.dark,
    fontWeight: typography.weights.medium,
  },
  utilityChipTextActive: {
    color: colors.white,
    fontWeight: typography.weights.semibold,
  },
  securitySelector: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: spacing.sm,
  },
  securityChip: {
    paddingHorizontal: spacing.sm,
    paddingVertical: spacing.xs,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: colors.neutral.lightGray,
    backgroundColor: colors.white,
  },
  securityChipActive: {
    borderColor: colors.primary,
    backgroundColor: colors.primary,
  },
  securityChipText: {
    fontSize: typography.sizes.sm,
    color: colors.text.dark,
    fontWeight: typography.weights.medium,
  },
  securityChipTextActive: {
    color: colors.white,
    fontWeight: typography.weights.semibold,
  },
  
  // Item-specific styles
  conditionSelector: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: spacing.sm,
  },
  conditionChip: {
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
    borderRadius: 20,
    borderWidth: 1,
    borderColor: colors.neutral.lightGray,
    backgroundColor: colors.white,
  },
  conditionChipActive: {
    borderColor: colors.primary,
    backgroundColor: colors.primary,
  },
  conditionText: {
    fontSize: typography.sizes.sm,
    color: colors.text.dark,
    fontWeight: typography.weights.medium,
  },
  conditionTextActive: {
    color: colors.white,
    fontWeight: typography.weights.semibold,
  },
  transactionTypeSelector: {
    flexDirection: 'row',
    gap: spacing.sm,
  },
  transactionTypeOption: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: spacing.sm,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: colors.neutral.lightGray,
    gap: spacing.xs,
    flex: 1,
  },
  transactionTypeOptionActive: {
    borderColor: colors.primary,
    backgroundColor: colors.lightGreen,
  },
  transactionTypeText: {
    fontSize: typography.sizes.sm,
    color: colors.text.dark,
    fontWeight: typography.weights.medium,
  },
  transactionTypeTextActive: {
    color: colors.primary,
    fontWeight: typography.weights.semibold,
  },
});