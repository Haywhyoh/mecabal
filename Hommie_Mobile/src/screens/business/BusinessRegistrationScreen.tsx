import React, { useState } from 'react';
import { View, Text, StyleSheet, ScrollView, SafeAreaView, TouchableOpacity, TextInput, Modal, FlatList, Alert, ActivityIndicator, Image, ActionSheetIOS, Platform } from 'react-native';
import MaterialCommunityIcons from '@expo/vector-icons/MaterialCommunityIcons';
import { ScreenHeader } from '../../components/ui';
import { businessApi } from '../../services/api';
import { ServiceArea, PricingModel, Availability } from '../../services/types/business.types';
import { BusinessImageUploadService } from '../../services/businessImageUpload';
import { 
  BUSINESS_CATEGORIES, 
  SERVICE_AREAS, 
  PRICING_MODELS, 
  AVAILABILITY_SCHEDULES,
  PAYMENT_METHODS,
  BUSINESS_VERIFICATION_LEVELS,
  NIGERIAN_BUSINESS_LICENSES
} from '../../constants/businessData';

interface BusinessRegistration {
  businessName: string;
  description: string;
  category: string;
  subcategory: string;
  serviceArea: string;  
  pricingModel: string;
  priceRange: { min: number; max: number };
  availability: string;
  paymentMethods: string[];
  phoneNumber: string;
  whatsappNumber: string;
  businessAddress: string;
  yearsOfExperience: number;
  licenses: string[];
  hasInsurance: boolean;
  guarantees: string[];
  profileImageUrl?: string;
  coverImageUrl?: string;
}

interface BusinessRegistrationScreenProps {
  navigation?: any;
}

export default function BusinessRegistrationScreen({ navigation }: BusinessRegistrationScreenProps) {
  const [currentStep, setCurrentStep] = useState(1);
  const [submitting, setSubmitting] = useState(false);
  const [uploadingImage, setUploadingImage] = useState(false);
  const [showCategoryModal, setShowCategoryModal] = useState(false);
  const [showSubcategoryModal, setShowSubcategoryModal] = useState(false);
  const [showServiceAreaModal, setShowServiceAreaModal] = useState(false);
  const [showPricingModal, setShowPricingModal] = useState(false);
  const [showAvailabilityModal, setShowAvailabilityModal] = useState(false);
  const [showPaymentModal, setShowPaymentModal] = useState(false);
  const [showLicenseModal, setShowLicenseModal] = useState(false);

  const [registration, setRegistration] = useState<BusinessRegistration>({
    businessName: '',
    description: '',
    category: '',
    subcategory: '',
    serviceArea: 'neighborhood',
    pricingModel: 'fixed-rate',
    priceRange: { min: 0, max: 0 },
    availability: 'business-hours',
    paymentMethods: ['cash', 'bank-transfer'],
    phoneNumber: '',
    whatsappNumber: '',
    businessAddress: '',
    yearsOfExperience: 0,
    licenses: [],
    hasInsurance: false,
    guarantees: [],
    profileImageUrl: undefined,
    coverImageUrl: undefined,
  });

  const getSelectedCategory = () => {
    return BUSINESS_CATEGORIES.find(cat => cat.id === registration.category);
  };

  const getSelectedServiceArea = () => {
    return SERVICE_AREAS.find(area => area.id === registration.serviceArea);
  };

  const getSelectedPricingModel = () => {
    return PRICING_MODELS.find(model => model.id === registration.pricingModel);
  };

  const getSelectedAvailability = () => {
    return AVAILABILITY_SCHEDULES.find(schedule => schedule.id === registration.availability);
  };

  const handleCategorySelect = (categoryId: string) => {
    setRegistration(prev => ({ ...prev, category: categoryId, subcategory: '' }));
    setShowCategoryModal(false);
  };

  const handleSubcategorySelect = (subcategory: string) => {
    setRegistration(prev => ({ ...prev, subcategory }));
    setShowSubcategoryModal(false);
  };

  const handlePaymentMethodToggle = (methodId: string) => {
    setRegistration(prev => ({
      ...prev,
      paymentMethods: prev.paymentMethods.includes(methodId)
        ? prev.paymentMethods.filter(id => id !== methodId)
        : [...prev.paymentMethods, methodId]
    }));
  };

  const handleLicenseToggle = (license: string) => {
    setRegistration(prev => ({
      ...prev,
      licenses: prev.licenses.includes(license)
        ? prev.licenses.filter(l => l !== license)
        : [...prev.licenses, license]
    }));
  };

  const handleImagePicker = async (type: 'profile' | 'cover') => {
    try {
      const options = ['Camera', 'Photo Library', 'Cancel'];
      let imageUri: string | null = null;

      if (Platform.OS === 'ios') {
        ActionSheetIOS.showActionSheetWithOptions(
          {
            options,
            cancelButtonIndex: 2,
          },
          async (buttonIndex) => {
            if (buttonIndex === 0) {
              imageUri = await BusinessImageUploadService.pickImageFromCamera(
                type === 'cover' ? [3, 1] : [1, 1]
              );
            } else if (buttonIndex === 1) {
              imageUri = await BusinessImageUploadService.pickImageFromLibrary(
                type === 'cover' ? [3, 1] : [1, 1]
              );
            }
            if (imageUri) {
              // Store image URI temporarily - will upload after business creation
              setRegistration(prev => ({
                ...prev,
                [type === 'profile' ? 'profileImageUrl' : 'coverImageUrl']: imageUri || undefined,
              }));
            }
          }
        );
      } else {
        // Android - show Alert with options
        Alert.alert(
          'Select Image',
          'Choose an option',
          [
            { text: 'Camera', onPress: async () => {
              imageUri = await BusinessImageUploadService.pickImageFromCamera(
                type === 'cover' ? [3, 1] : [1, 1]
              );
              if (imageUri) {
                setRegistration(prev => ({
                  ...prev,
                  [type === 'profile' ? 'profileImageUrl' : 'coverImageUrl']: imageUri || undefined,
                }));
              }
            }},
            { text: 'Photo Library', onPress: async () => {
              imageUri = await BusinessImageUploadService.pickImageFromLibrary(
                type === 'cover' ? [3, 1] : [1, 1]
              );
              if (imageUri) {
                setRegistration(prev => ({
                  ...prev,
                  [type === 'profile' ? 'profileImageUrl' : 'coverImageUrl']: imageUri || undefined,
                }));
              }
            }},
            { text: 'Cancel', style: 'cancel' },
          ]
        );
      }
    } catch (error: any) {
      Alert.alert('Error', error.message || 'Failed to pick image');
    }
  };

  const validateStep = (step: number): boolean => {
    switch (step) {
      case 1:
        return registration.businessName.trim() !== '' && 
               registration.description.trim() !== '' && 
               registration.category !== '' && 
               registration.subcategory !== '';
      case 2:
        return registration.serviceArea !== '' && 
               registration.pricingModel !== '' && 
               registration.availability !== '' && 
               registration.paymentMethods.length > 0;
      case 3:
        return registration.phoneNumber.trim() !== '';
      case 4:
        return true; // Review step
      default:
        return false;
    }
  };

  const handleSubmitRegistration = async () => {
    if (submitting) return;

    try {
      setSubmitting(true);

      // Map form data to API DTO - only include defined fields
      const businessData: any = {
        businessName: registration.businessName.trim(),
        category: registration.category,
        serviceArea: registration.serviceArea,
        pricingModel: registration.pricingModel,
        availability: registration.availability,
        yearsOfExperience: registration.yearsOfExperience,
        hasInsurance: registration.hasInsurance,
      };

      // Add optional fields only if they have values
      if (registration.description.trim()) {
        businessData.description = registration.description.trim();
      }
      if (registration.subcategory) {
        businessData.subcategory = registration.subcategory;
      }
      if (registration.phoneNumber.trim()) {
        businessData.phoneNumber = registration.phoneNumber.trim();
      }
      if (registration.whatsappNumber.trim()) {
        businessData.whatsappNumber = registration.whatsappNumber.trim();
      }
      if (registration.businessAddress.trim()) {
        businessData.businessAddress = registration.businessAddress.trim();
      }
      if (registration.paymentMethods.length > 0) {
        businessData.paymentMethods = registration.paymentMethods;
      }

      console.log('🔧 Submitting business registration:', businessData);

      // Call the API
      const response = await businessApi.registerBusiness(businessData);

      console.log('✅ Business registered successfully:', response);

      // Upload images if they were selected
      if (registration.profileImageUrl || registration.coverImageUrl) {
        setUploadingImage(true);
        try {
          if (registration.profileImageUrl) {
            const profileResult = await BusinessImageUploadService.uploadProfileImage(
              response.id,
              registration.profileImageUrl
            );
            if (!profileResult.success) {
              console.warn('Failed to upload profile image:', profileResult.error);
            }
          }
          if (registration.coverImageUrl) {
            const coverResult = await BusinessImageUploadService.uploadCoverImage(
              response.id,
              registration.coverImageUrl
            );
            if (!coverResult.success) {
              console.warn('Failed to upload cover image:', coverResult.error);
            }
          }
        } catch (error) {
          console.error('Error uploading images:', error);
        } finally {
          setUploadingImage(false);
        }
      }

      Alert.alert(
        'Registration Successful!',
        `Welcome to MeCabal Business! Your profile "${response.businessName}" has been created.`,
        [
          {
            text: 'View Profile',
            onPress: () => {
              // Navigate back to business profile
              navigation?.navigate('BusinessProfile');
            }
          }
        ]
      );
    } catch (error: any) {
      console.error('Registration error:', error);

      let errorMessage = 'Unable to submit your registration. Please try again.';

      if (error.response?.data?.message) {
        errorMessage = error.response.data.message;
      } else if (error.response?.status === 400) {
        errorMessage = 'You already have a business profile. Please edit your existing profile instead.';
      } else if (error.response?.status === 401) {
        errorMessage = 'Please log in to register a business.';
      } else if (error.message) {
        errorMessage = error.message;
      }

      Alert.alert(
        'Registration Failed',
        errorMessage,
        [
          {
            text: 'OK',
            style: 'cancel'
          }
        ]
      );
    } finally {
      setSubmitting(false);
    }
  };

  const renderStep1 = () => (
    <View style={styles.stepContent}>
      <Text style={styles.stepTitle}>Business Information</Text>
      <Text style={styles.stepDescription}>
        Tell us about your business to help neighbors find and trust your services.
      </Text>

      {/* Business Images */}
      <View style={styles.inputGroup}>
        <Text style={styles.inputLabel}>Business Images (Optional)</Text>
        
        {/* Cover Image */}
        <View style={styles.imageUploadSection}>
          <Text style={styles.imageLabel}>Cover Image</Text>
          <TouchableOpacity
            style={styles.imageUploadButton}
            onPress={() => handleImagePicker('cover')}
            disabled={uploadingImage}
          >
            {registration.coverImageUrl ? (
              <Image source={{ uri: registration.coverImageUrl }} style={styles.coverImagePreview} />
            ) : (
              <View style={styles.imagePlaceholder}>
                <MaterialCommunityIcons name="image-plus" size={32} color="#8E8E8E" />
                <Text style={styles.imagePlaceholderText}>Add Cover Image</Text>
                <Text style={styles.imagePlaceholderSubtext}>1200x400px recommended</Text>
              </View>
            )}
            {registration.coverImageUrl && (
              <View style={styles.imageOverlay}>
                <MaterialCommunityIcons name="camera" size={24} color="#FFFFFF" />
              </View>
            )}
          </TouchableOpacity>
        </View>

        {/* Profile Image */}
        <View style={styles.imageUploadSection}>
          <Text style={styles.imageLabel}>Business Logo</Text>
          <TouchableOpacity
            style={styles.imageUploadButton}
            onPress={() => handleImagePicker('profile')}
            disabled={uploadingImage}
          >
            {registration.profileImageUrl ? (
              <Image source={{ uri: registration.profileImageUrl }} style={styles.profileImagePreview} />
            ) : (
              <View style={styles.imagePlaceholder}>
                <MaterialCommunityIcons name="store" size={32} color="#8E8E8E" />
                <Text style={styles.imagePlaceholderText}>Add Logo</Text>
                <Text style={styles.imagePlaceholderSubtext}>400x400px recommended</Text>
              </View>
            )}
            {registration.profileImageUrl && (
              <View style={styles.imageOverlay}>
                <MaterialCommunityIcons name="camera" size={24} color="#FFFFFF" />
              </View>
            )}
          </TouchableOpacity>
        </View>
      </View>

      <View style={styles.inputGroup}>
        <Text style={styles.inputLabel}>Business Name *</Text>
        <TextInput
          style={styles.textInput}
          value={registration.businessName}
          onChangeText={(text) => setRegistration(prev => ({ ...prev, businessName: text }))}
          placeholder="e.g., Adebayo's Home Repairs"
          placeholderTextColor="#8E8E8E"
        />
      </View>

      <View style={styles.inputGroup}>
        <Text style={styles.inputLabel}>Business Description *</Text>
        <TextInput
          style={[styles.textInput, styles.textArea]}
          value={registration.description}
          onChangeText={(text) => setRegistration(prev => ({ ...prev, description: text }))}
          placeholder="Describe your services, experience, and what makes your business special..."
          placeholderTextColor="#8E8E8E"
          multiline
          numberOfLines={4}
        />
      </View>

      <View style={styles.inputGroup}>
        <Text style={styles.inputLabel}>Service Category *</Text>
        <TouchableOpacity style={styles.selectInput} onPress={() => setShowCategoryModal(true)}>
          <Text style={[styles.selectText, !registration.category && styles.placeholderText]}>
            {getSelectedCategory()?.name || 'Select category'}
          </Text>
          <MaterialCommunityIcons name="chevron-down" size={20} color="#8E8E8E" />
        </TouchableOpacity>
      </View>

      {registration.category && (
        <View style={styles.inputGroup}>
          <Text style={styles.inputLabel}>Service Type *</Text>
          <TouchableOpacity style={styles.selectInput} onPress={() => setShowSubcategoryModal(true)}>
            <Text style={[styles.selectText, !registration.subcategory && styles.placeholderText]}>
              {registration.subcategory || 'Select service type'}
            </Text>
            <MaterialCommunityIcons name="chevron-down" size={20} color="#8E8E8E" />
          </TouchableOpacity>
        </View>
      )}

      <View style={styles.inputGroup}>
        <Text style={styles.inputLabel}>Years of Experience</Text>
        <TextInput
          style={styles.textInput}
          value={registration.yearsOfExperience.toString()}
          onChangeText={(text) => setRegistration(prev => ({ ...prev, yearsOfExperience: parseInt(text) || 0 }))}
          placeholder="0"
          placeholderTextColor="#8E8E8E"
          keyboardType="numeric"
        />
      </View>
    </View>
  );

  const renderStep2 = () => (
    <View style={styles.stepContent}>
      <Text style={styles.stepTitle}>Service Details</Text>
      <Text style={styles.stepDescription}>
        Configure your service area, pricing, and availability.
      </Text>

      <View style={styles.inputGroup}>
        <Text style={styles.inputLabel}>Service Area *</Text>
        <TouchableOpacity style={styles.selectInput} onPress={() => setShowServiceAreaModal(true)}>
          <Text style={styles.selectText}>
            {getSelectedServiceArea()?.name || 'Select service area'}
          </Text>
          <MaterialCommunityIcons name="chevron-down" size={20} color="#8E8E8E" />
        </TouchableOpacity>
        {getSelectedServiceArea() && (
          <Text style={styles.inputHelp}>{getSelectedServiceArea()?.description}</Text>
        )}
      </View>

      <View style={styles.inputGroup}>
        <Text style={styles.inputLabel}>Pricing Model *</Text>
        <TouchableOpacity style={styles.selectInput} onPress={() => setShowPricingModal(true)}>
          <Text style={styles.selectText}>
            {getSelectedPricingModel()?.name || 'Select pricing model'}
          </Text>
          <MaterialCommunityIcons name="chevron-down" size={20} color="#8E8E8E" />
        </TouchableOpacity>
        {getSelectedPricingModel() && (
          <Text style={styles.inputHelp}>{getSelectedPricingModel()?.example}</Text>
        )}
      </View>

      <View style={styles.inputGroup}>
        <Text style={styles.inputLabel}>Availability *</Text>
        <TouchableOpacity style={styles.selectInput} onPress={() => setShowAvailabilityModal(true)}>
          <Text style={styles.selectText}>
            {getSelectedAvailability()?.name || 'Select availability'}
          </Text>
          <MaterialCommunityIcons name="chevron-down" size={20} color="#8E8E8E" />
        </TouchableOpacity>
        {getSelectedAvailability() && (
          <Text style={styles.inputHelp}>{getSelectedAvailability()?.description}</Text>
        )}
      </View>

      <View style={styles.inputGroup}>
        <Text style={styles.inputLabel}>Payment Methods *</Text>
        <TouchableOpacity style={styles.selectInput} onPress={() => setShowPaymentModal(true)}>
          <Text style={styles.selectText}>
            {registration.paymentMethods.length > 0 
              ? `${registration.paymentMethods.length} methods selected`
              : 'Select payment methods'}
          </Text>
          <MaterialCommunityIcons name="chevron-down" size={20} color="#8E8E8E" />
        </TouchableOpacity>
      </View>
    </View>
  );

  const renderStep3 = () => (
    <View style={styles.stepContent}>
      <Text style={styles.stepTitle}>Contact & Verification</Text>
      <Text style={styles.stepDescription}>
        Provide contact details and verification information to build trust.
      </Text>

      <View style={styles.inputGroup}>
        <Text style={styles.inputLabel}>Phone Number *</Text>
        <TextInput
          style={styles.textInput}
          value={registration.phoneNumber}
          onChangeText={(text) => setRegistration(prev => ({ ...prev, phoneNumber: text }))}
          placeholder="+234 803 123 4567"
          placeholderTextColor="#8E8E8E"
          keyboardType="phone-pad"
        />
      </View>

      <View style={styles.inputGroup}>
        <Text style={styles.inputLabel}>WhatsApp Number</Text>
        <TextInput
          style={styles.textInput}
          value={registration.whatsappNumber}
          onChangeText={(text) => setRegistration(prev => ({ ...prev, whatsappNumber: text }))}
          placeholder="+234 803 123 4567"
          placeholderTextColor="#8E8E8E"
          keyboardType="phone-pad"
        />
      </View>

      <View style={styles.inputGroup}>
        <Text style={styles.inputLabel}>Business Address</Text>
        <TextInput
          style={styles.textInput}
          value={registration.businessAddress}
          onChangeText={(text) => setRegistration(prev => ({ ...prev, businessAddress: text }))}
          placeholder="Block 5, Flat 3, Victoria Island Estate"
          placeholderTextColor="#8E8E8E"
        />
      </View>

      <View style={styles.inputGroup}>
        <Text style={styles.inputLabel}>Professional Licenses</Text>
        <TouchableOpacity style={styles.selectInput} onPress={() => setShowLicenseModal(true)}>
          <Text style={styles.selectText}>
            {registration.licenses.length > 0 
              ? `${registration.licenses.length} licenses selected`
              : 'Add professional licenses (optional)'}
          </Text>
          <MaterialCommunityIcons name="chevron-down" size={20} color="#8E8E8E" />
        </TouchableOpacity>
      </View>

      <View style={styles.checkboxGroup}>
        <TouchableOpacity 
          style={styles.checkbox}
          onPress={() => setRegistration(prev => ({ ...prev, hasInsurance: !prev.hasInsurance }))}
        >
          <View style={[styles.checkboxBox, registration.hasInsurance && styles.checkboxChecked]}>
            {registration.hasInsurance && (
              <MaterialCommunityIcons name="check" size={16} color="#FFFFFF" />
            )}
          </View>
          <Text style={styles.checkboxText}>I have business insurance coverage</Text>
        </TouchableOpacity>
      </View>

      {/* Verification Preview */}
      <View style={styles.verificationPreview}>
        <Text style={styles.verificationTitle}>Verification Level</Text>
        <View style={styles.verificationCard}>
          <MaterialCommunityIcons name="shield-check" size={24} color="#00A651" />
          <View style={styles.verificationInfo}>
            <Text style={styles.verificationLevel}>Basic Verification</Text>
            <Text style={styles.verificationDesc}>Phone and address verification</Text>
          </View>
        </View>
        <Text style={styles.verificationNote}>
          Higher verification levels unlock more features and increase customer trust.
        </Text>
      </View>
    </View>
  );

  const renderStep4 = () => (
    <View style={styles.stepContent}>
      <Text style={styles.stepTitle}>Review & Submit</Text>
      <Text style={styles.stepDescription}>
        Review your business information before submitting for approval.
      </Text>

      <View style={styles.reviewCard}>
        <View style={styles.reviewSection}>
          <Text style={styles.reviewSectionTitle}>Business Information</Text>
          <View style={styles.reviewItem}>
            <Text style={styles.reviewLabel}>Name:</Text>
            <Text style={styles.reviewValue}>{registration.businessName}</Text>
          </View>
          <View style={styles.reviewItem}>
            <Text style={styles.reviewLabel}>Category:</Text>
            <Text style={styles.reviewValue}>{getSelectedCategory()?.name}</Text>
          </View>
          <View style={styles.reviewItem}>
            <Text style={styles.reviewLabel}>Service:</Text>
            <Text style={styles.reviewValue}>{registration.subcategory}</Text>
          </View>
        </View>

        <View style={styles.reviewSection}>
          <Text style={styles.reviewSectionTitle}>Service Details</Text>
          <View style={styles.reviewItem}>
            <Text style={styles.reviewLabel}>Area:</Text>
            <Text style={styles.reviewValue}>{getSelectedServiceArea()?.name}</Text>
          </View>
          <View style={styles.reviewItem}>
            <Text style={styles.reviewLabel}>Pricing:</Text>
            <Text style={styles.reviewValue}>{getSelectedPricingModel()?.name}</Text>
          </View>
          <View style={styles.reviewItem}>
            <Text style={styles.reviewLabel}>Availability:</Text>
            <Text style={styles.reviewValue}>{getSelectedAvailability()?.name}</Text>
          </View>
        </View>

        <View style={styles.reviewSection}>
          <Text style={styles.reviewSectionTitle}>Contact</Text>
          <View style={styles.reviewItem}>
            <Text style={styles.reviewLabel}>Phone:</Text>
            <Text style={styles.reviewValue}>{registration.phoneNumber}</Text>
          </View>
          {registration.whatsappNumber && (
            <View style={styles.reviewItem}>
              <Text style={styles.reviewLabel}>WhatsApp:</Text>
              <Text style={styles.reviewValue}>{registration.whatsappNumber}</Text>
            </View>
          )}
        </View>
      </View>

      <View style={styles.approvalNotice}>
        <MaterialCommunityIcons name="information" size={16} color="#0066CC" />
        <Text style={styles.approvalText}>
          Your business will be reviewed within 24-48 hours. You'll receive a notification once approved.
        </Text>
      </View>
    </View>
  );

  const CategoryModal = () => (
    <Modal visible={showCategoryModal} animationType="slide" presentationStyle="pageSheet">
      <SafeAreaView style={styles.modalContainer}>
        <View style={styles.modalHeader}>
          <TouchableOpacity onPress={() => setShowCategoryModal(false)}>
            <Text style={styles.modalCancel}>Cancel</Text>
          </TouchableOpacity>
          <Text style={styles.modalTitle}>Select Category</Text>
          <View style={styles.modalPlaceholder} />
        </View>
        
        <FlatList
          data={BUSINESS_CATEGORIES}
          keyExtractor={(item) => item.id}
          renderItem={({ item }) => (
            <TouchableOpacity
              style={[styles.modalItem, registration.category === item.id && styles.modalItemSelected]}
              onPress={() => handleCategorySelect(item.id)}
            >
              <MaterialCommunityIcons name={item.icon as any} size={24} color={item.color} />
              <View style={styles.modalItemText}>
                <Text style={styles.modalItemTitle}>{item.name}</Text>
                <Text style={styles.modalItemDesc}>{item.description}</Text>
              </View>
              {registration.category === item.id && (
                <MaterialCommunityIcons name="check" size={20} color="#00A651" />
              )}
            </TouchableOpacity>
          )}
        />
      </SafeAreaView>
    </Modal>
  );

  const SubcategoryModal = () => {
    const selectedCategory = getSelectedCategory();
    if (!selectedCategory) return null;

    return (
      <Modal visible={showSubcategoryModal} animationType="slide" presentationStyle="pageSheet">
        <SafeAreaView style={styles.modalContainer}>
          <View style={styles.modalHeader}>
            <TouchableOpacity onPress={() => setShowSubcategoryModal(false)}>
              <Text style={styles.modalCancel}>Cancel</Text>
            </TouchableOpacity>
            <Text style={styles.modalTitle}>Select Service Type</Text>
            <View style={styles.modalPlaceholder} />
          </View>
          
          <FlatList
            data={selectedCategory.subcategories}
            keyExtractor={(item) => item}
            renderItem={({ item }) => (
              <TouchableOpacity
                style={[styles.modalItem, registration.subcategory === item && styles.modalItemSelected]}
                onPress={() => handleSubcategorySelect(item)}
              >
                <MaterialCommunityIcons name={selectedCategory.icon as any} size={24} color={selectedCategory.color} />
                <View style={styles.modalItemText}>
                  <Text style={styles.modalItemTitle}>{item}</Text>
                </View>
                {registration.subcategory === item && (
                  <MaterialCommunityIcons name="check" size={20} color="#00A651" />
                )}
              </TouchableOpacity>
            )}
          />
        </SafeAreaView>
      </Modal>
    );
  };

  const ServiceAreaModal = () => (
    <Modal visible={showServiceAreaModal} animationType="slide" presentationStyle="pageSheet">
      <SafeAreaView style={styles.modalContainer}>
        <View style={styles.modalHeader}>
          <TouchableOpacity onPress={() => setShowServiceAreaModal(false)}>
            <Text style={styles.modalCancel}>Cancel</Text>
          </TouchableOpacity>
          <Text style={styles.modalTitle}>Service Area</Text>
          <View style={styles.modalPlaceholder} />
        </View>
        
        <FlatList
          data={SERVICE_AREAS}
          keyExtractor={(item) => item.id}
          renderItem={({ item }) => (
            <TouchableOpacity
              style={[styles.modalItem, registration.serviceArea === item.id && styles.modalItemSelected]}
              onPress={() => {
                setRegistration(prev => ({ ...prev, serviceArea: item.id }));
                setShowServiceAreaModal(false);
              }}
            >
              <MaterialCommunityIcons 
                name={item.radius === 0 ? "home" : item.radius === -1 ? "earth" : "map-marker-radius"} 
                size={24} 
                color="#0066CC" 
              />
              <View style={styles.modalItemText}>
                <Text style={styles.modalItemTitle}>{item.name}</Text>
                <Text style={styles.modalItemDesc}>{item.description}</Text>
              </View>
              {registration.serviceArea === item.id && (
                <MaterialCommunityIcons name="check" size={20} color="#00A651" />
              )}
            </TouchableOpacity>
          )}
        />
      </SafeAreaView>
    </Modal>
  );

  const PricingModal = () => (
    <Modal visible={showPricingModal} animationType="slide" presentationStyle="pageSheet">
      <SafeAreaView style={styles.modalContainer}>
        <View style={styles.modalHeader}>
          <TouchableOpacity onPress={() => setShowPricingModal(false)}>
            <Text style={styles.modalCancel}>Cancel</Text>
          </TouchableOpacity>
          <Text style={styles.modalTitle}>Pricing Model</Text>
          <View style={styles.modalPlaceholder} />
        </View>
        
        <FlatList
          data={PRICING_MODELS}
          keyExtractor={(item) => item.id}
          renderItem={({ item }) => (
            <TouchableOpacity
              style={[styles.modalItem, registration.pricingModel === item.id && styles.modalItemSelected]}
              onPress={() => {
                setRegistration(prev => ({ ...prev, pricingModel: item.id }));
                setShowPricingModal(false);
              }}
            >
              <MaterialCommunityIcons name="currency-ngn" size={24} color="#228B22" />
              <View style={styles.modalItemText}>
                <Text style={styles.modalItemTitle}>{item.name}</Text>
                <Text style={styles.modalItemDesc}>{item.description}</Text>
                <Text style={styles.modalItemExample}>{item.example}</Text>
              </View>
              {registration.pricingModel === item.id && (
                <MaterialCommunityIcons name="check" size={20} color="#00A651" />
              )}
            </TouchableOpacity>
          )}
        />
      </SafeAreaView>
    </Modal>
  );

  const AvailabilityModal = () => (
    <Modal visible={showAvailabilityModal} animationType="slide" presentationStyle="pageSheet">
      <SafeAreaView style={styles.modalContainer}>
        <View style={styles.modalHeader}>
          <TouchableOpacity onPress={() => setShowAvailabilityModal(false)}>
            <Text style={styles.modalCancel}>Cancel</Text>
          </TouchableOpacity>
          <Text style={styles.modalTitle}>Availability</Text>
          <View style={styles.modalPlaceholder} />
        </View>
        
        <FlatList
          data={AVAILABILITY_SCHEDULES}
          keyExtractor={(item) => item.id}
          renderItem={({ item }) => (
            <TouchableOpacity
              style={[styles.modalItem, registration.availability === item.id && styles.modalItemSelected]}
              onPress={() => {
                setRegistration(prev => ({ ...prev, availability: item.id }));
                setShowAvailabilityModal(false);
              }}
            >
              <MaterialCommunityIcons name="clock-outline" size={24} color="#FF6B35" />
              <View style={styles.modalItemText}>
                <Text style={styles.modalItemTitle}>{item.name}</Text>
                <Text style={styles.modalItemDesc}>{item.description}</Text>
              </View>
              {registration.availability === item.id && (
                <MaterialCommunityIcons name="check" size={20} color="#00A651" />
              )}
            </TouchableOpacity>
          )}
        />
      </SafeAreaView>
    </Modal>
  );

  const PaymentModal = () => (
    <Modal visible={showPaymentModal} animationType="slide" presentationStyle="pageSheet">
      <SafeAreaView style={styles.modalContainer}>
        <View style={styles.modalHeader}>
          <TouchableOpacity onPress={() => setShowPaymentModal(false)}>
            <Text style={styles.modalCancel}>Done</Text>
          </TouchableOpacity>
          <Text style={styles.modalTitle}>Payment Methods</Text>
          <View style={styles.modalPlaceholder} />
        </View>
        
        <View style={styles.modalContent}>
          <Text style={styles.sectionSubtitle}>Select payment methods you accept</Text>
          
          {PAYMENT_METHODS.map((method) => (
            <TouchableOpacity
              key={method.id}
              style={[styles.checkboxItem, registration.paymentMethods.includes(method.id) && styles.checkboxItemSelected]}
              onPress={() => handlePaymentMethodToggle(method.id)}
            >
              <View style={styles.checkboxContainer}>
                <View style={[styles.checkboxBox, registration.paymentMethods.includes(method.id) && styles.checkboxChecked]}>
                  {registration.paymentMethods.includes(method.id) && (
                    <MaterialCommunityIcons name="check" size={16} color="#FFFFFF" />
                  )}
                </View>
                <MaterialCommunityIcons name={method.icon as any} size={24} color="#0066CC" />
                <View style={styles.checkboxText}>
                  <Text style={styles.checkboxTitle}>{method.name}</Text>
                  <Text style={styles.checkboxDesc}>{method.description}</Text>
                  {method.popular && (
                    <Text style={styles.popularTag}>Popular</Text>
                  )}
                </View>
              </View>
            </TouchableOpacity>
          ))}
        </View>
      </SafeAreaView>
    </Modal>
  );

  const LicenseModal = () => (
    <Modal visible={showLicenseModal} animationType="slide" presentationStyle="pageSheet">
      <SafeAreaView style={styles.modalContainer}>
        <View style={styles.modalHeader}>
          <TouchableOpacity onPress={() => setShowLicenseModal(false)}>
            <Text style={styles.modalCancel}>Done</Text>
          </TouchableOpacity>
          <Text style={styles.modalTitle}>Professional Licenses</Text>
          <View style={styles.modalPlaceholder} />
        </View>
        
        <ScrollView style={styles.scrollContent}>
          <Text style={styles.sectionSubtitle}>Select licenses you hold (optional)</Text>
          
          {NIGERIAN_BUSINESS_LICENSES.map((category) => (
            <View key={category.category} style={styles.licenseCategory}>
              <Text style={styles.licenseCategoryTitle}>{category.category}</Text>
              {category.licenses.map((license) => (
                <TouchableOpacity
                  key={license}
                  style={[styles.checkboxItem, registration.licenses.includes(license) && styles.checkboxItemSelected]}
                  onPress={() => handleLicenseToggle(license)}
                >
                  <View style={styles.checkboxContainer}>
                    <View style={[styles.checkboxBox, registration.licenses.includes(license) && styles.checkboxChecked]}>
                      {registration.licenses.includes(license) && (
                        <MaterialCommunityIcons name="check" size={16} color="#FFFFFF" />
                      )}
                    </View>
                    <View style={styles.checkboxText}>
                      <Text style={styles.checkboxTitle}>{license}</Text>
                    </View>
                  </View>
                </TouchableOpacity>
              ))}
            </View>
          ))}
        </ScrollView>
      </SafeAreaView>
    </Modal>
  );

  return (
    <SafeAreaView style={styles.container}>
      {/* Header */}
      <ScreenHeader 
        title="Register Business"
        navigation={navigation}
      />

      {/* Progress Indicator */}
      <View style={styles.progressContainer}>
        <View style={styles.progressBar}>
          <View style={[styles.progressFill, { width: `${(currentStep / 4) * 100}%` }]} />
        </View>
        <Text style={styles.progressText}>Step {currentStep} of 4</Text>
      </View>

      {uploadingImage && (
        <View style={styles.uploadingOverlay}>
          <ActivityIndicator size="large" color="#00A651" />
          <Text style={styles.uploadingText}>Uploading images...</Text>
        </View>
      )}

      <ScrollView style={styles.scrollView} showsVerticalScrollIndicator={false}>
        {currentStep === 1 && renderStep1()}
        {currentStep === 2 && renderStep2()}
        {currentStep === 3 && renderStep3()}
        {currentStep === 4 && renderStep4()}
      </ScrollView>

      {/* Bottom Actions */}
      <View style={styles.bottomActions}>
        {currentStep > 1 && (
          <TouchableOpacity 
            style={styles.backStepButton}
            onPress={() => setCurrentStep(prev => prev - 1)}
          >
            <Text style={styles.backStepText}>Back</Text>
          </TouchableOpacity>
        )}
        
        <TouchableOpacity
          style={[
            styles.nextButton,
            currentStep === 1 && styles.nextButtonFull,
            (!validateStep(currentStep) || submitting) && styles.nextButtonDisabled
          ]}
          onPress={() => {
            if (currentStep < 4) {
              if (validateStep(currentStep)) {
                setCurrentStep(prev => prev + 1);
              } else {
                Alert.alert('Please complete all required fields', 'All required fields must be filled before continuing.');
              }
            } else {
              handleSubmitRegistration();
            }
          }}
          disabled={!validateStep(currentStep) || submitting || uploadingImage}
        >
          {(submitting || uploadingImage) && currentStep === 4 ? (
            <ActivityIndicator size="small" color="#FFFFFF" />
          ) : (
            <Text style={[
              styles.nextButtonText,
              (!validateStep(currentStep) || submitting) && styles.nextButtonTextDisabled
            ]}>
              {currentStep === 4 
                ? (submitting || uploadingImage) 
                  ? (uploadingImage ? 'Uploading Images...' : 'Submitting...') 
                  : 'Submit Registration' 
                : 'Continue'}
            </Text>
          )}
        </TouchableOpacity>
      </View>

      <CategoryModal />
      <SubcategoryModal />
      <ServiceAreaModal />
      <PricingModal />
      <AvailabilityModal />
      <PaymentModal />
      <LicenseModal />
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#FAFAFA',
  },
  progressContainer: {
    backgroundColor: '#FFFFFF',
    paddingHorizontal: 16,
    paddingVertical: 12,
  },
  progressBar: {
    height: 4,
    backgroundColor: '#E0E0E0',
    borderRadius: 2,
    marginBottom: 8,
  },
  progressFill: {
    height: '100%',
    backgroundColor: '#00A651',
    borderRadius: 2,
  },
  progressText: {
    fontSize: 12,
    color: '#8E8E8E',
    textAlign: 'center',
  },
  scrollView: {
    flex: 1,
  },
  stepContent: {
    padding: 20,
  },
  stepTitle: {
    fontSize: 24,
    fontWeight: '700',
    color: '#2C2C2C',
    marginBottom: 8,
  },
  stepDescription: {
    fontSize: 16,
    color: '#8E8E8E',
    lineHeight: 22,
    marginBottom: 24,
  },
  inputGroup: {
    marginBottom: 20,
  },
  inputLabel: {
    fontSize: 16,
    fontWeight: '600',
    color: '#2C2C2C',
    marginBottom: 8,
  },
  textInput: {
    backgroundColor: '#FFFFFF',
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#E0E0E0',
    paddingHorizontal: 16,
    paddingVertical: 12,
    fontSize: 16,
    color: '#2C2C2C',
  },
  textArea: {
    height: 100,
    textAlignVertical: 'top',
  },
  selectInput: {
    backgroundColor: '#FFFFFF',
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#E0E0E0',
    paddingHorizontal: 16,
    paddingVertical: 12,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  selectText: {
    fontSize: 16,
    color: '#2C2C2C',
    flex: 1,
  },
  placeholderText: {
    color: '#8E8E8E',
  },
  inputHelp: {
    fontSize: 12,
    color: '#8E8E8E',
    marginTop: 4,
  },
  checkboxGroup: {
    marginBottom: 20,
  },
  checkbox: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  checkboxBox: {
    width: 20,
    height: 20,
    borderRadius: 4,
    borderWidth: 2,
    borderColor: '#E0E0E0',
    marginRight: 12,
    alignItems: 'center',
    justifyContent: 'center',
  },
  checkboxChecked: {
    backgroundColor: '#00A651',
    borderColor: '#00A651',
  },
  checkboxText: {
    fontSize: 16,
    color: '#2C2C2C',
    flex: 1,
  },
  verificationPreview: {
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    padding: 16,
    marginTop: 20,
  },
  verificationTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#2C2C2C',
    marginBottom: 12,
  },
  verificationCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#E8F5E8',
    padding: 12,
    borderRadius: 8,
    marginBottom: 8,
  },
  verificationInfo: {
    marginLeft: 12,
  },
  verificationLevel: {
    fontSize: 14,
    fontWeight: '600',
    color: '#00A651',
  },
  verificationDesc: {
    fontSize: 12,
    color: '#00A651',
  },
  verificationNote: {
    fontSize: 12,
    color: '#8E8E8E',
    fontStyle: 'italic',
  },
  reviewCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    padding: 16,
    marginBottom: 20,
  },
  reviewSection: {
    marginBottom: 16,
    paddingBottom: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#F5F5F5',
  },
  reviewSectionTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#2C2C2C',
    marginBottom: 8,
  },
  reviewItem: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 4,
  },
  reviewLabel: {
    fontSize: 14,
    color: '#8E8E8E',
  },
  reviewValue: {
    fontSize: 14,
    color: '#2C2C2C',
    fontWeight: '500',
    flex: 1,
    textAlign: 'right',
  },
  approvalNotice: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    backgroundColor: '#F0F8FF',
    padding: 16,
    borderRadius: 8,
  },
  approvalText: {
    fontSize: 14,
    color: '#0066CC',
    lineHeight: 20,
    marginLeft: 8,
    flex: 1,
  },
  bottomActions: {
    backgroundColor: '#FFFFFF',
    flexDirection: 'row',
    paddingHorizontal: 20,
    paddingVertical: 16,
    borderTopWidth: 1,
    borderTopColor: '#F0F0F0',
  },
  backStepButton: {
    flex: 1,
    marginRight: 12,
    paddingVertical: 12,
    alignItems: 'center',
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#E0E0E0',
  },
  backStepText: {
    fontSize: 16,
    color: '#8E8E8E',
    fontWeight: '600',
  },
  nextButton: {
    flex: 2,
    backgroundColor: '#00A651',
    paddingVertical: 12,
    alignItems: 'center',
    borderRadius: 8,
  },
  nextButtonFull: {
    flex: 1,
    marginLeft: 0,
  },
  nextButtonText: {
    fontSize: 16,
    color: '#FFFFFF',
    fontWeight: '600',
  },
  nextButtonDisabled: {
    backgroundColor: '#E0E0E0',
  },
  nextButtonTextDisabled: {
    color: '#8E8E8E',
  },
  modalContainer: {
    flex: 1,
    backgroundColor: '#FAFAFA',
  },
  modalHeader: {
    backgroundColor: '#FFFFFF',
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#F0F0F0',
  },
  modalCancel: {
    fontSize: 16,
    color: '#8E8E8E',
    minWidth: 60,
  },
  modalTitle: {
    flex: 1,
    fontSize: 18,
    fontWeight: '600',
    color: '#2C2C2C',
    textAlign: 'center',
  },
  modalPlaceholder: {
    minWidth: 60,
  },
  modalItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#F5F5F5',
  },
  modalItemSelected: {
    backgroundColor: '#E8F5E8',
  },
  modalItemText: {
    flex: 1,
    marginLeft: 12,
  },
  modalItemTitle: {
    fontSize: 16,
    fontWeight: '500',
    color: '#2C2C2C',
    marginBottom: 2,
  },
  modalItemDesc: {
    fontSize: 14,
    color: '#8E8E8E',
  },
  modalItemExample: {
    fontSize: 12,
    color: '#00A651',
    fontStyle: 'italic',
    marginTop: 2,
  },
  modalContent: {
    flex: 1,
    padding: 20,
  },
  sectionSubtitle: {
    fontSize: 14,
    color: '#8E8E8E',
    marginBottom: 16,
  },
  checkboxItem: {
    backgroundColor: '#FFFFFF',
    borderRadius: 8,
    marginBottom: 8,
    borderWidth: 1,
    borderColor: '#F0F0F0',
  },
  checkboxItemSelected: {
    borderColor: '#00A651',
    backgroundColor: '#F9FFF9',
  },
  checkboxContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 16,
  },
  checkboxBox: {
    width: 20,
    height: 20,
    borderRadius: 4,
    borderWidth: 2,
    borderColor: '#E0E0E0',
    marginRight: 12,
    alignItems: 'center',
    justifyContent: 'center',
  },
  checkboxChecked: {
    backgroundColor: '#00A651',
    borderColor: '#00A651',
  },
  checkboxText: {
    flex: 1,
    marginLeft: 12,
  },
  checkboxTitle: {
    fontSize: 14,
    fontWeight: '500',
    color: '#2C2C2C',
  },
  checkboxDesc: {
    fontSize: 12,
    color: '#8E8E8E',
    marginTop: 2,
  },
  popularTag: {
    fontSize: 10,
    color: '#FF6B35',
    fontWeight: '600',
    marginTop: 2,
  },
  scrollContent: {
    flex: 1,
    padding: 20,
  },
  licenseCategory: {
    marginBottom: 24,
  },
  licenseCategoryTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#2C2C2C',
    marginBottom: 12,
  },
  imageUploadSection: {
    marginBottom: 20,
  },
  imageLabel: {
    fontSize: 14,
    fontWeight: '600',
    color: '#2C2C2C',
    marginBottom: 8,
  },
  imageUploadButton: {
    width: '100%',
    borderRadius: 8,
    overflow: 'hidden',
    borderWidth: 1,
    borderColor: '#E0E0E0',
    backgroundColor: '#F5F5F5',
    position: 'relative',
  },
  coverImagePreview: {
    width: '100%',
    height: 150,
    resizeMode: 'cover',
  },
  profileImagePreview: {
    width: '100%',
    height: 150,
    resizeMode: 'contain',
    backgroundColor: '#FFFFFF',
  },
  imagePlaceholder: {
    width: '100%',
    height: 150,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#F5F5F5',
  },
  imagePlaceholderText: {
    fontSize: 14,
    color: '#8E8E8E',
    marginTop: 8,
    fontWeight: '500',
  },
  imagePlaceholderSubtext: {
    fontSize: 12,
    color: '#8E8E8E',
    marginTop: 4,
  },
  imageOverlay: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: 'rgba(0, 0, 0, 0.3)',
    justifyContent: 'center',
    alignItems: 'center',
    opacity: 0,
  },
  uploadingOverlay: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'center',
    alignItems: 'center',
    zIndex: 1000,
  },
  uploadingText: {
    color: '#FFFFFF',
    marginTop: 12,
    fontSize: 16,
    fontWeight: '500',
  },
});