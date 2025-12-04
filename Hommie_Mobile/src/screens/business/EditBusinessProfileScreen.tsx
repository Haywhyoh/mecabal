import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, ScrollView, SafeAreaView, TouchableOpacity, TextInput, Modal, FlatList, Alert, ActivityIndicator } from 'react-native';
import MaterialCommunityIcons from '@expo/vector-icons/MaterialCommunityIcons';
import { ScreenHeader } from '../../components/ui';
import { businessApi } from '../../services/api';
import { BusinessProfile, ServiceArea, PricingModel, Availability } from '../../services/types/business.types';
import {
  BUSINESS_CATEGORIES,
  SERVICE_AREAS,
  PRICING_MODELS,
  AVAILABILITY_SCHEDULES,
  PAYMENT_METHODS,
} from '../../constants/businessData';

interface EditBusinessProfileScreenProps {
  route: {
    params: {
      business: BusinessProfile;
    };
  };
  navigation?: any;
}

export default function EditBusinessProfileScreen({ route, navigation }: EditBusinessProfileScreenProps) {
  const { business } = route.params;

  const [loading, setLoading] = useState(false);
  const [showCategoryModal, setShowCategoryModal] = useState(false);
  const [showSubcategoryModal, setShowSubcategoryModal] = useState(false);
  const [showServiceAreaModal, setShowServiceAreaModal] = useState(false);
  const [showPricingModal, setShowPricingModal] = useState(false);
  const [showAvailabilityModal, setShowAvailabilityModal] = useState(false);
  const [showPaymentModal, setShowPaymentModal] = useState(false);

  const [formData, setFormData] = useState({
    businessName: business.businessName,
    description: business.description || '',
    category: business.category,
    subcategory: business.subcategory || '',
    serviceArea: business.serviceArea,
    pricingModel: business.pricingModel,
    availability: business.availability,
    phoneNumber: business.phoneNumber || '',
    whatsappNumber: business.whatsappNumber || '',
    businessAddress: business.businessAddress || '',
    yearsOfExperience: business.yearsOfExperience,
    paymentMethods: business.paymentMethods || [],
    hasInsurance: business.hasInsurance || false,
  });

  const [hasChanges, setHasChanges] = useState(false);

  // Track changes
  useEffect(() => {
    const changed =
      formData.businessName !== business.businessName ||
      formData.description !== (business.description || '') ||
      formData.category !== business.category ||
      formData.subcategory !== (business.subcategory || '') ||
      formData.serviceArea !== business.serviceArea ||
      formData.pricingModel !== business.pricingModel ||
      formData.availability !== business.availability ||
      formData.phoneNumber !== (business.phoneNumber || '') ||
      formData.whatsappNumber !== (business.whatsappNumber || '') ||
      formData.businessAddress !== (business.businessAddress || '') ||
      formData.yearsOfExperience !== business.yearsOfExperience ||
      formData.hasInsurance !== (business.hasInsurance || false) ||
      JSON.stringify(formData.paymentMethods) !== JSON.stringify(business.paymentMethods || []);

    setHasChanges(changed);
  }, [formData, business]);

  const getSelectedCategory = () => {
    return BUSINESS_CATEGORIES.find(cat => cat.id === formData.category);
  };

  const getSelectedServiceArea = () => {
    return SERVICE_AREAS.find(area => area.id === formData.serviceArea);
  };

  const getSelectedPricingModel = () => {
    return PRICING_MODELS.find(model => model.id === formData.pricingModel);
  };

  const getSelectedAvailability = () => {
    return AVAILABILITY_SCHEDULES.find(schedule => schedule.id === formData.availability);
  };

  const handleCategorySelect = (categoryId: string) => {
    setFormData(prev => ({ ...prev, category: categoryId, subcategory: '' }));
    setShowCategoryModal(false);
  };

  const handleSubcategorySelect = (subcategory: string) => {
    setFormData(prev => ({ ...prev, subcategory }));
    setShowSubcategoryModal(false);
  };

  const handlePaymentMethodToggle = (methodId: string) => {
    setFormData(prev => ({
      ...prev,
      paymentMethods: prev.paymentMethods.includes(methodId)
        ? prev.paymentMethods.filter(id => id !== methodId)
        : [...prev.paymentMethods, methodId]
    }));
  };

  const validateForm = (): boolean => {
    if (!formData.businessName.trim()) {
      Alert.alert('Validation Error', 'Business name is required');
      return false;
    }
    if (!formData.category) {
      Alert.alert('Validation Error', 'Business category is required');
      return false;
    }
    return true;
  };

  const handleSave = async () => {
    if (!validateForm()) return;
    if (!hasChanges) {
      Alert.alert('No Changes', 'You haven\'t made any changes to save.');
      return;
    }
    if (loading) return;

    try {
      setLoading(true);

      // Build update DTO with only changed fields
      const updateData: any = {};

      if (formData.businessName !== business.businessName) {
        updateData.businessName = formData.businessName.trim();
      }
      if (formData.description !== (business.description || '')) {
        updateData.description = formData.description.trim() || undefined;
      }
      if (formData.category !== business.category) {
        updateData.category = formData.category;
      }
      if (formData.subcategory !== (business.subcategory || '')) {
        updateData.subcategory = formData.subcategory || undefined;
      }
      if (formData.serviceArea !== business.serviceArea) {
        updateData.serviceArea = formData.serviceArea as ServiceArea;
      }
      if (formData.pricingModel !== business.pricingModel) {
        updateData.pricingModel = formData.pricingModel as PricingModel;
      }
      if (formData.availability !== business.availability) {
        updateData.availability = formData.availability as Availability;
      }
      if (formData.phoneNumber !== (business.phoneNumber || '')) {
        updateData.phoneNumber = formData.phoneNumber.trim() || undefined;
      }
      if (formData.whatsappNumber !== (business.whatsappNumber || '')) {
        updateData.whatsappNumber = formData.whatsappNumber.trim() || undefined;
      }
      if (formData.businessAddress !== (business.businessAddress || '')) {
        updateData.businessAddress = formData.businessAddress.trim() || undefined;
      }
      if (formData.yearsOfExperience !== business.yearsOfExperience) {
        updateData.yearsOfExperience = formData.yearsOfExperience;
      }
      if (JSON.stringify(formData.paymentMethods) !== JSON.stringify(business.paymentMethods || [])) {
        updateData.paymentMethods = formData.paymentMethods.length > 0 ? formData.paymentMethods : undefined;
      }
      if (formData.hasInsurance !== (business.hasInsurance || false)) {
        updateData.hasInsurance = formData.hasInsurance;
      }

      console.log('Updating business with:', updateData);

      const updated = await businessApi.updateBusiness(business.id, updateData);

      console.log('Business updated successfully:', updated);

      Alert.alert(
        'Success!',
        'Your business profile has been updated.',
        [
          {
            text: 'OK',
            onPress: () => {
              // Navigate back to profile
              navigation?.goBack();
            }
          }
        ]
      );
    } catch (error: any) {
      console.error('Update error:', error);

      let errorMessage = 'Failed to update business profile. Please try again.';

      if (error.response?.data?.message) {
        errorMessage = error.response.data.message;
      } else if (error.response?.status === 403) {
        errorMessage = 'You do not have permission to edit this business.';
      } else if (error.response?.status === 404) {
        errorMessage = 'Business not found.';
      } else if (error.message) {
        errorMessage = error.message;
      }

      Alert.alert('Update Failed', errorMessage);
    } finally {
      setLoading(false);
    }
  };

  const handleCancel = () => {
    if (hasChanges) {
      Alert.alert(
        'Discard Changes?',
        'You have unsaved changes. Are you sure you want to discard them?',
        [
          { text: 'Keep Editing', style: 'cancel' },
          {
            text: 'Discard',
            style: 'destructive',
            onPress: () => navigation?.goBack()
          }
        ]
      );
    } else {
      navigation?.goBack();
    }
  };

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
              style={[styles.modalItem, formData.category === item.id && styles.modalItemSelected]}
              onPress={() => handleCategorySelect(item.id)}
            >
              <MaterialCommunityIcons name={item.icon as any} size={24} color={item.color} />
              <View style={styles.modalItemText}>
                <Text style={styles.modalItemTitle}>{item.name}</Text>
                <Text style={styles.modalItemDesc}>{item.description}</Text>
              </View>
              {formData.category === item.id && (
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
                style={[styles.modalItem, formData.subcategory === item && styles.modalItemSelected]}
                onPress={() => handleSubcategorySelect(item)}
              >
                <MaterialCommunityIcons name={selectedCategory.icon as any} size={24} color={selectedCategory.color} />
                <View style={styles.modalItemText}>
                  <Text style={styles.modalItemTitle}>{item}</Text>
                </View>
                {formData.subcategory === item && (
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
              style={[styles.modalItem, formData.serviceArea === item.id && styles.modalItemSelected]}
              onPress={() => {
                setFormData(prev => ({ ...prev, serviceArea: item.id }));
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
              {formData.serviceArea === item.id && (
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
              style={[styles.modalItem, formData.pricingModel === item.id && styles.modalItemSelected]}
              onPress={() => {
                setFormData(prev => ({ ...prev, pricingModel: item.id }));
                setShowPricingModal(false);
              }}
            >
              <MaterialCommunityIcons name="currency-ngn" size={24} color="#228B22" />
              <View style={styles.modalItemText}>
                <Text style={styles.modalItemTitle}>{item.name}</Text>
                <Text style={styles.modalItemDesc}>{item.description}</Text>
                <Text style={styles.modalItemExample}>{item.example}</Text>
              </View>
              {formData.pricingModel === item.id && (
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
              style={[styles.modalItem, formData.availability === item.id && styles.modalItemSelected]}
              onPress={() => {
                setFormData(prev => ({ ...prev, availability: item.id }));
                setShowAvailabilityModal(false);
              }}
            >
              <MaterialCommunityIcons name="clock-outline" size={24} color="#FF6B35" />
              <View style={styles.modalItemText}>
                <Text style={styles.modalItemTitle}>{item.name}</Text>
                <Text style={styles.modalItemDesc}>{item.description}</Text>
              </View>
              {formData.availability === item.id && (
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

        <ScrollView style={styles.modalContent}>
          <Text style={styles.sectionSubtitle}>Select payment methods you accept</Text>

          {PAYMENT_METHODS.map((method) => (
            <TouchableOpacity
              key={method.id}
              style={[styles.checkboxItem, formData.paymentMethods.includes(method.id) && styles.checkboxItemSelected]}
              onPress={() => handlePaymentMethodToggle(method.id)}
            >
              <View style={styles.checkboxContainer}>
                <View style={[styles.checkboxBox, formData.paymentMethods.includes(method.id) && styles.checkboxChecked]}>
                  {formData.paymentMethods.includes(method.id) && (
                    <MaterialCommunityIcons name="check" size={16} color="#FFFFFF" />
                  )}
                </View>
                <MaterialCommunityIcons name={method.icon as any} size={24} color="#0066CC" />
                <View style={styles.checkboxTextContainer}>
                  <Text style={styles.checkboxTitle}>{method.name}</Text>
                  <Text style={styles.checkboxDesc}>{method.description}</Text>
                  {method.popular && (
                    <Text style={styles.popularTag}>Popular</Text>
                  )}
                </View>
              </View>
            </TouchableOpacity>
          ))}
        </ScrollView>
      </SafeAreaView>
    </Modal>
  );

  return (
    <SafeAreaView style={styles.container}>
      <ScreenHeader
        title="Edit Business Profile"
        navigation={navigation}
        leftComponent={
          <TouchableOpacity onPress={handleCancel}>
            <Text style={styles.cancelButton}>Cancel</Text>
          </TouchableOpacity>
        }
      />

      <ScrollView style={styles.scrollView} showsVerticalScrollIndicator={false}>
        <View style={styles.formContent}>
          {/* Business Information */}
          <Text style={styles.sectionTitle}>Business Information</Text>

          <View style={styles.inputGroup}>
            <Text style={styles.inputLabel}>Business Name *</Text>
            <TextInput
              style={styles.textInput}
              value={formData.businessName}
              onChangeText={(text) => setFormData(prev => ({ ...prev, businessName: text }))}
              placeholder="e.g., Adebayo's Home Repairs"
              placeholderTextColor="#8E8E8E"
            />
          </View>

          <View style={styles.inputGroup}>
            <Text style={styles.inputLabel}>Business Description</Text>
            <TextInput
              style={[styles.textInput, styles.textArea]}
              value={formData.description}
              onChangeText={(text) => setFormData(prev => ({ ...prev, description: text }))}
              placeholder="Describe your services, experience, and what makes your business special..."
              placeholderTextColor="#8E8E8E"
              multiline
              numberOfLines={4}
            />
          </View>

          <View style={styles.inputGroup}>
            <Text style={styles.inputLabel}>Service Category *</Text>
            <TouchableOpacity style={styles.selectInput} onPress={() => setShowCategoryModal(true)}>
              <Text style={[styles.selectText, !formData.category && styles.placeholderText]}>
                {getSelectedCategory()?.name || 'Select category'}
              </Text>
              <MaterialCommunityIcons name="chevron-down" size={20} color="#8E8E8E" />
            </TouchableOpacity>
          </View>

          {formData.category && (
            <View style={styles.inputGroup}>
              <Text style={styles.inputLabel}>Service Type</Text>
              <TouchableOpacity style={styles.selectInput} onPress={() => setShowSubcategoryModal(true)}>
                <Text style={[styles.selectText, !formData.subcategory && styles.placeholderText]}>
                  {formData.subcategory || 'Select service type'}
                </Text>
                <MaterialCommunityIcons name="chevron-down" size={20} color="#8E8E8E" />
              </TouchableOpacity>
            </View>
          )}

          <View style={styles.inputGroup}>
            <Text style={styles.inputLabel}>Years of Experience</Text>
            <TextInput
              style={styles.textInput}
              value={formData.yearsOfExperience.toString()}
              onChangeText={(text) => setFormData(prev => ({ ...prev, yearsOfExperience: parseInt(text) || 0 }))}
              placeholder="0"
              placeholderTextColor="#8E8E8E"
              keyboardType="numeric"
            />
          </View>

          {/* Service Details */}
          <Text style={styles.sectionTitle}>Service Details</Text>

          <View style={styles.inputGroup}>
            <Text style={styles.inputLabel}>Service Area</Text>
            <TouchableOpacity style={styles.selectInput} onPress={() => setShowServiceAreaModal(true)}>
              <Text style={styles.selectText}>
                {getSelectedServiceArea()?.name || 'Select service area'}
              </Text>
              <MaterialCommunityIcons name="chevron-down" size={20} color="#8E8E8E" />
            </TouchableOpacity>
          </View>

          <View style={styles.inputGroup}>
            <Text style={styles.inputLabel}>Pricing Model</Text>
            <TouchableOpacity style={styles.selectInput} onPress={() => setShowPricingModal(true)}>
              <Text style={styles.selectText}>
                {getSelectedPricingModel()?.name || 'Select pricing model'}
              </Text>
              <MaterialCommunityIcons name="chevron-down" size={20} color="#8E8E8E" />
            </TouchableOpacity>
          </View>

          <View style={styles.inputGroup}>
            <Text style={styles.inputLabel}>Availability</Text>
            <TouchableOpacity style={styles.selectInput} onPress={() => setShowAvailabilityModal(true)}>
              <Text style={styles.selectText}>
                {getSelectedAvailability()?.name || 'Select availability'}
              </Text>
              <MaterialCommunityIcons name="chevron-down" size={20} color="#8E8E8E" />
            </TouchableOpacity>
          </View>

          <View style={styles.inputGroup}>
            <Text style={styles.inputLabel}>Payment Methods</Text>
            <TouchableOpacity style={styles.selectInput} onPress={() => setShowPaymentModal(true)}>
              <Text style={styles.selectText}>
                {formData.paymentMethods.length > 0
                  ? `${formData.paymentMethods.length} methods selected`
                  : 'Select payment methods'}
              </Text>
              <MaterialCommunityIcons name="chevron-down" size={20} color="#8E8E8E" />
            </TouchableOpacity>
          </View>

          {/* Contact Information */}
          <Text style={styles.sectionTitle}>Contact Information</Text>

          <View style={styles.inputGroup}>
            <Text style={styles.inputLabel}>Phone Number</Text>
            <TextInput
              style={styles.textInput}
              value={formData.phoneNumber}
              onChangeText={(text) => setFormData(prev => ({ ...prev, phoneNumber: text }))}
              placeholder="+234 803 123 4567"
              placeholderTextColor="#8E8E8E"
              keyboardType="phone-pad"
            />
          </View>

          <View style={styles.inputGroup}>
            <Text style={styles.inputLabel}>WhatsApp Number</Text>
            <TextInput
              style={styles.textInput}
              value={formData.whatsappNumber}
              onChangeText={(text) => setFormData(prev => ({ ...prev, whatsappNumber: text }))}
              placeholder="+234 803 123 4567"
              placeholderTextColor="#8E8E8E"
              keyboardType="phone-pad"
            />
          </View>

          <View style={styles.inputGroup}>
            <Text style={styles.inputLabel}>Business Address</Text>
            <TextInput
              style={styles.textInput}
              value={formData.businessAddress}
              onChangeText={(text) => setFormData(prev => ({ ...prev, businessAddress: text }))}
              placeholder="Block 5, Flat 3, Victoria Island Estate"
              placeholderTextColor="#8E8E8E"
            />
          </View>

          {/* Insurance */}
          <View style={styles.checkboxGroup}>
            <TouchableOpacity
              style={styles.checkbox}
              onPress={() => setFormData(prev => ({ ...prev, hasInsurance: !prev.hasInsurance }))}
            >
              <View style={[styles.checkboxBox, formData.hasInsurance && styles.checkboxChecked]}>
                {formData.hasInsurance && (
                  <MaterialCommunityIcons name="check" size={16} color="#FFFFFF" />
                )}
              </View>
              <Text style={styles.checkboxLabel}>I have business insurance coverage</Text>
            </TouchableOpacity>
          </View>
        </View>
      </ScrollView>

      {/* Bottom Action Buttons */}
      <View style={styles.bottomActions}>
        <TouchableOpacity
          style={styles.cancelActionButton}
          onPress={handleCancel}
          disabled={loading}
        >
          <Text style={styles.cancelActionText}>Cancel</Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={[
            styles.saveButton,
            (!hasChanges || loading) && styles.saveButtonDisabled
          ]}
          onPress={handleSave}
          disabled={!hasChanges || loading}
        >
          {loading ? (
            <ActivityIndicator size="small" color="#FFFFFF" />
          ) : (
            <Text style={[
              styles.saveButtonText,
              (!hasChanges || loading) && styles.saveButtonTextDisabled
            ]}>
              Save Changes
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
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#FAFAFA',
  },
  cancelButton: {
    fontSize: 16,
    color: '#FF3B30',
    fontWeight: '600',
  },
  scrollView: {
    flex: 1,
  },
  formContent: {
    padding: 20,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: '#2C2C2C',
    marginTop: 16,
    marginBottom: 16,
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
  checkboxLabel: {
    fontSize: 16,
    color: '#2C2C2C',
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
  cancelActionButton: {
    flex: 1,
    marginRight: 12,
    paddingVertical: 12,
    alignItems: 'center',
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#E0E0E0',
  },
  cancelActionText: {
    fontSize: 16,
    color: '#8E8E8E',
    fontWeight: '600',
  },
  saveButton: {
    flex: 2,
    backgroundColor: '#00A651',
    paddingVertical: 12,
    alignItems: 'center',
    borderRadius: 8,
  },
  saveButtonDisabled: {
    backgroundColor: '#E0E0E0',
  },
  saveButtonText: {
    fontSize: 16,
    color: '#FFFFFF',
    fontWeight: '600',
  },
  saveButtonTextDisabled: {
    color: '#8E8E8E',
  },
  // Modal styles
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
    color: '#0066CC',
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
  checkboxTextContainer: {
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
});
