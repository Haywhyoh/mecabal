import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  SafeAreaView,
  TextInput,
  Alert,
  ActivityIndicator,
  Modal,
  FlatList,
} from 'react-native';
import MaterialCommunityIcons from '@expo/vector-icons/MaterialCommunityIcons';
import { ScreenHeader } from '../../components/ui';
import { businessServiceApi } from '../../services/api';
import { CreateBusinessServiceDto } from '../../services/types/business.types';
import { NIGERIAN_SERVICE_CATEGORIES } from '../../constants';

interface CreateServiceScreenProps {
  route: {
    params: {
      businessId: string;
    };
  };
  navigation?: any;
}

export default function CreateServiceScreen({ route, navigation }: CreateServiceScreenProps) {
  const { businessId } = route.params;
  const [loading, setLoading] = useState(false);
  const [showCategoryModal, setShowCategoryModal] = useState(false);
  const [formData, setFormData] = useState<CreateBusinessServiceDto>({
    serviceName: '',
    description: '',
    category: undefined,
    priceMin: undefined,
    priceMax: undefined,
    duration: '',
    isActive: true,
  });

  const handleSave = async () => {
    if (!formData.serviceName.trim()) {
      Alert.alert('Required', 'Service name is required');
      return;
    }

    try {
      setLoading(true);
      await businessServiceApi.createBusinessService(businessId, formData);
      Alert.alert(
        'Success',
        'Service created successfully',
        [
          {
            text: 'OK',
            onPress: () => navigation?.goBack(),
          },
        ]
      );
    } catch (error: any) {
      Alert.alert('Error', error.message || 'Failed to create service');
    } finally {
      setLoading(false);
    }
  };

  return (
    <SafeAreaView style={styles.container}>
      <ScreenHeader
        title="Add Service"
        navigation={navigation}
      />
      <ScrollView style={styles.scrollView} showsVerticalScrollIndicator={false}>
        <View style={styles.formContent}>
          {/* Service Name */}
          <View style={styles.inputGroup}>
            <Text style={styles.inputLabel}>Service Name *</Text>
            <TextInput
              style={styles.textInput}
              value={formData.serviceName}
              onChangeText={(text) => setFormData({ ...formData, serviceName: text })}
              placeholder="e.g., Plumbing Repair"
              placeholderTextColor="#8E8E8E"
            />
          </View>

          {/* Category */}
          <View style={styles.inputGroup}>
            <Text style={styles.inputLabel}>Category</Text>
            <TouchableOpacity
              style={styles.categoryPicker}
              onPress={() => setShowCategoryModal(true)}
            >
              <Text style={[styles.categoryPickerText, !formData.category && styles.categoryPickerPlaceholder]}>
                {formData.category || 'Select a category'}
              </Text>
              <MaterialCommunityIcons name="chevron-down" size={20} color="#8E8E8E" />
            </TouchableOpacity>
          </View>

          {/* Description */}
          <View style={styles.inputGroup}>
            <Text style={styles.inputLabel}>Description</Text>
            <TextInput
              style={[styles.textInput, styles.textArea]}
              value={formData.description}
              onChangeText={(text) => setFormData({ ...formData, description: text })}
              placeholder="Describe your service..."
              placeholderTextColor="#8E8E8E"
              multiline
              numberOfLines={4}
            />
          </View>

          {/* Price Range */}
          <View style={styles.inputGroup}>
            <Text style={styles.inputLabel}>Price Range (₦)</Text>
            <View style={styles.priceRow}>
              <View style={styles.priceInputContainer}>
                <Text style={styles.priceLabel}>Min</Text>
                <TextInput
                  style={styles.priceInput}
                  value={formData.priceMin?.toString() || ''}
                  onChangeText={(text) =>
                    setFormData({
                      ...formData,
                      priceMin: text ? parseFloat(text) : undefined,
                    })
                  }
                  placeholder="0"
                  placeholderTextColor="#8E8E8E"
                  keyboardType="numeric"
                />
              </View>
              <View style={styles.priceInputContainer}>
                <Text style={styles.priceLabel}>Max</Text>
                <TextInput
                  style={styles.priceInput}
                  value={formData.priceMax?.toString() || ''}
                  onChangeText={(text) =>
                    setFormData({
                      ...formData,
                      priceMax: text ? parseFloat(text) : undefined,
                    })
                  }
                  placeholder="0"
                  placeholderTextColor="#8E8E8E"
                  keyboardType="numeric"
                />
              </View>
            </View>
          </View>

          {/* Duration */}
          <View style={styles.inputGroup}>
            <Text style={styles.inputLabel}>Duration</Text>
            <TextInput
              style={styles.textInput}
              value={formData.duration}
              onChangeText={(text) => setFormData({ ...formData, duration: text })}
              placeholder="e.g., 2 hours, 1 day"
              placeholderTextColor="#8E8E8E"
            />
          </View>

          {/* Active Status */}
          <View style={styles.checkboxGroup}>
            <TouchableOpacity
              style={styles.checkbox}
              onPress={() =>
                setFormData({ ...formData, isActive: !formData.isActive })
              }
            >
              <View
                style={[
                  styles.checkboxBox,
                  formData.isActive && styles.checkboxChecked,
                ]}
              >
                {formData.isActive && (
                  <MaterialCommunityIcons name="check" size={16} color="#FFFFFF" />
                )}
              </View>
              <Text style={styles.checkboxLabel}>
                Service is active and visible to customers
              </Text>
            </TouchableOpacity>
          </View>
        </View>
      </ScrollView>

      {/* Save Button */}
      <View style={styles.footer}>
        <TouchableOpacity
          style={[styles.saveButton, loading && styles.saveButtonDisabled]}
          onPress={handleSave}
          disabled={loading}
        >
          {loading ? (
            <ActivityIndicator color="#FFFFFF" />
          ) : (
            <Text style={styles.saveButtonText}>Create Service</Text>
          )}
        </TouchableOpacity>
      </View>

      {/* Category Selection Modal */}
      <Modal
        visible={showCategoryModal}
        transparent={true}
        animationType="slide"
        onRequestClose={() => setShowCategoryModal(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>Select Category</Text>
              <TouchableOpacity
                onPress={() => setShowCategoryModal(false)}
                style={styles.modalCloseButton}
              >
                <MaterialCommunityIcons name="close" size={24} color="#2C2C2C" />
              </TouchableOpacity>
            </View>
            <FlatList
              data={NIGERIAN_SERVICE_CATEGORIES}
              keyExtractor={(item, index) => `${item}-${index}`}
              renderItem={({ item }) => (
                <TouchableOpacity
                  style={[
                    styles.categoryItem,
                    formData.category === item && styles.categoryItemSelected,
                  ]}
                  onPress={() => {
                    setFormData({ ...formData, category: item });
                    setShowCategoryModal(false);
                  }}
                >
                  <Text
                    style={[
                      styles.categoryItemText,
                      formData.category === item && styles.categoryItemTextSelected,
                    ]}
                  >
                    {item}
                  </Text>
                  {formData.category === item && (
                    <MaterialCommunityIcons name="check" size={20} color="#00A651" />
                  )}
                </TouchableOpacity>
              )}
              style={styles.categoryList}
            />
          </View>
        </View>
      </Modal>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F2F2F7',
  },
  scrollView: {
    flex: 1,
  },
  formContent: {
    padding: 20,
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
  priceRow: {
    flexDirection: 'row',
    gap: 12,
  },
  priceInputContainer: {
    flex: 1,
  },
  priceLabel: {
    fontSize: 14,
    color: '#8E8E93',
    marginBottom: 8,
  },
  priceInput: {
    backgroundColor: '#FFFFFF',
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#E0E0E0',
    paddingHorizontal: 16,
    paddingVertical: 12,
    fontSize: 16,
    color: '#2C2C2C',
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
  footer: {
    backgroundColor: '#FFFFFF',
    padding: 16,
    borderTopWidth: 1,
    borderTopColor: '#F0F0F0',
  },
  saveButton: {
    backgroundColor: '#00A651',
    paddingVertical: 16,
    borderRadius: 8,
    alignItems: 'center',
  },
  saveButtonDisabled: {
    opacity: 0.6,
  },
  saveButtonText: {
    fontSize: 18,
    fontWeight: '600',
    color: '#FFFFFF',
  },
  categoryPicker: {
    backgroundColor: '#FFFFFF',
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#E0E0E0',
    paddingHorizontal: 16,
    paddingVertical: 12,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  categoryPickerText: {
    fontSize: 16,
    color: '#2C2C2C',
    flex: 1,
  },
  categoryPickerPlaceholder: {
    color: '#8E8E8E',
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'flex-end',
  },
  modalContent: {
    backgroundColor: '#FFFFFF',
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    maxHeight: '80%',
    paddingBottom: 20,
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingVertical: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#E0E0E0',
  },
  modalTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#2C2C2C',
  },
  modalCloseButton: {
    padding: 4,
  },
  categoryList: {
    maxHeight: 400,
  },
  categoryItem: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingVertical: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#F0F0F0',
  },
  categoryItemSelected: {
    backgroundColor: '#F0F9F4',
  },
  categoryItemText: {
    fontSize: 16,
    color: '#2C2C2C',
    flex: 1,
  },
  categoryItemTextSelected: {
    color: '#00A651',
    fontWeight: '600',
  },
});










