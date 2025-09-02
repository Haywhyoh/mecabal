import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TextInput,
  TouchableOpacity,
  SafeAreaView,
  Alert,
  Modal,
  Switch,
  Image,
  Dimensions,
  KeyboardAvoidingView,
  Platform,
} from 'react-native';
import DateTimePicker from '@react-native-community/datetimepicker';
import MaterialCommunityIcons from '@expo/vector-icons/MaterialCommunityIcons';
import { EventCategory, eventCategories, nigerianStates } from '../data/eventsData';
import { colors, spacing, typography, shadows } from '../constants';

const { width } = Dimensions.get('window');

interface CreateEventScreenProps {
  navigation: any;
}

interface EventFormData {
  title: string;
  description: string;
  category: EventCategory | '';
  date: Date | null;
  time: Date | null;
  endTime: Date | null;
  location: {
    name: string;
    estate: string;
    city: string;
    state: string;
    landmark: string;
  };
  isFree: boolean;
  price: string;
  maxAttendees: string;
  requireVerification: boolean;
  languages: string[];
  isPrivate: boolean;
  allowGuests: boolean;
  ageRestriction: string;
  specialRequirements: string;
}

const nigerianLanguages = ['English', 'Hausa', 'Yoruba', 'Igbo', 'Pidgin', 'Fulani', 'Kanuri', 'Ibibio'];

const ageRestrictions = [
  { value: '', label: 'No restriction' },
  { value: 'family-friendly', label: 'Family-friendly' },
  { value: '18+', label: '18+ only' },
  { value: '21+', label: '21+ only' },
  { value: 'children-only', label: 'Children only' },
];

const CreateEventScreen: React.FC<CreateEventScreenProps> = ({ navigation }) => {
  const [currentStep, setCurrentStep] = useState(1);
  const [formData, setFormData] = useState<EventFormData>({
    title: '',
    description: '',
    category: '',
    date: null,
    time: null,
    endTime: null,
    location: {
      name: '',
      estate: '',
      city: '',
      state: '',
      landmark: '',
    },
    isFree: true,
    price: '',
    maxAttendees: '',
    requireVerification: true,
    languages: ['English'],
    isPrivate: false,
    allowGuests: true,
    ageRestriction: '',
    specialRequirements: '',
  });

  const [showCategoryModal, setShowCategoryModal] = useState(false);
  const [showLanguageModal, setShowLanguageModal] = useState(false);
  const [showStateModal, setShowStateModal] = useState(false);
  const [showAgeModal, setShowAgeModal] = useState(false);
  
  // Date/Time picker states
  const [showDatePicker, setShowDatePicker] = useState(false);
  const [showTimePicker, setShowTimePicker] = useState(false);
  const [showEndTimePicker, setShowEndTimePicker] = useState(false);
  const [pickerMode, setPickerMode] = useState<'date' | 'time'>('date');

  const totalSteps = 5;

  const updateFormData = (field: keyof EventFormData | string, value: any) => {
    if (field.includes('.')) {
      const [parent, child] = field.split('.');
      setFormData(prev => ({
        ...prev,
        [parent]: {
          ...(prev[parent as keyof EventFormData] as any),
          [child]: value
        }
      }));
    } else {
      setFormData(prev => ({
        ...prev,
        [field]: value
      }));
    }
  };

  const validateStep = (step: number): boolean => {
    switch (step) {
      case 1:
        return !!(formData.title.trim() && formData.description.trim() && formData.category);
      case 2:
        return !!(formData.date && formData.time);
      case 3:
        return !!(formData.location.name.trim() && formData.location.estate.trim() && 
                 formData.location.city.trim() && formData.location.state);
      case 4:
        return formData.isFree || (formData.price.trim() && parseFloat(formData.price) > 0);
      case 5:
        return true; // Optional settings
      default:
        return false;
    }
  };

  const handleDateChange = (event: any, selectedDate?: Date) => {
    if (Platform.OS === 'android') {
      setShowDatePicker(false);
    }
    
    if (selectedDate && event.type !== 'dismissed') {
      updateFormData('date', selectedDate);
    }
    
    if (Platform.OS === 'android' || event.type === 'dismissed') {
      setShowDatePicker(false);
    }
  };

  const handleTimeChange = (event: any, selectedTime?: Date) => {
    if (Platform.OS === 'android') {
      setShowTimePicker(false);
    }
    
    if (selectedTime && event.type !== 'dismissed') {
      updateFormData('time', selectedTime);
    }
    
    if (Platform.OS === 'android' || event.type === 'dismissed') {
      setShowTimePicker(false);
    }
  };

  const handleEndTimeChange = (event: any, selectedTime?: Date) => {
    if (Platform.OS === 'android') {
      setShowEndTimePicker(false);
    }
    
    if (selectedTime && event.type !== 'dismissed') {
      updateFormData('endTime', selectedTime);
    }
    
    if (Platform.OS === 'android' || event.type === 'dismissed') {
      setShowEndTimePicker(false);
    }
  };

  const formatDisplayDate = (date: Date | null): string => {
    if (!date) return 'Select date';
    return date.toLocaleDateString('en-GB', {
      weekday: 'short',
      year: 'numeric',
      month: 'short',
      day: 'numeric'
    });
  };

  const formatDisplayTime = (time: Date | null): string => {
    if (!time) return '00:00';
    return time.toLocaleTimeString('en-GB', {
      hour: '2-digit',
      minute: '2-digit',
      hour12: false
    });
  };

  const nextStep = () => {
    if (!validateStep(currentStep)) {
      Alert.alert('Incomplete Information', 'Please fill in all required fields before continuing.');
      return;
    }
    if (currentStep < totalSteps) {
      setCurrentStep(currentStep + 1);
    }
  };

  const prevStep = () => {
    if (currentStep > 1) {
      setCurrentStep(currentStep - 1);
    }
  };

  const handleSubmit = () => {
    if (!validateStep(currentStep)) {
      Alert.alert('Incomplete Information', 'Please fill in all required fields.');
      return;
    }

    // Validate final form
    const missingFields = [];
    if (!formData.title.trim()) missingFields.push('title');
    if (!formData.description.trim()) missingFields.push('description');
    if (!formData.category) missingFields.push('category');
    if (!formData.date) missingFields.push('date');
    if (!formData.time) missingFields.push('time');
    
    if (missingFields.length > 0) {
      Alert.alert('Missing Information', 'Please complete all required steps.');
      return;
    }

    Alert.alert(
      'Create Event',
      'Are you sure you want to create this event? It will be visible to your community after review.',
      [
        { text: 'Cancel', style: 'cancel' },
        { 
          text: 'Create Event', 
          onPress: () => {
            // Here you would send to API
            console.log('Creating event:', formData);
            Alert.alert(
              'Event Created!',
              'Your event has been submitted for review. You\'ll receive a notification when it\'s approved.',
              [{ text: 'OK', onPress: () => navigation.goBack() }]
            );
          }
        }
      ]
    );
  };

  const renderProgressBar = () => (
    <View style={styles.progressContainer}>
      <View style={styles.progressBar}>
        <View style={[styles.progressFill, { width: `${(currentStep / totalSteps) * 100}%` }]} />
      </View>
      <Text style={styles.progressText}>Step {currentStep} of {totalSteps}</Text>
    </View>
  );

  const renderStepIndicator = () => (
    <View style={styles.stepIndicator}>
      {Array.from({ length: totalSteps }, (_, i) => (
        <View
          key={i}
          style={[
            styles.stepDot,
            i + 1 === currentStep && styles.activeStepDot,
            i + 1 < currentStep && styles.completedStepDot,
          ]}
        >
          {i + 1 < currentStep ? (
            <MaterialCommunityIcons name="check" size={12} color={colors.white} />
          ) : (
            <Text style={[
              styles.stepNumber,
              i + 1 === currentStep && styles.activeStepNumber,
              i + 1 < currentStep && styles.completedStepNumber,
            ]}>
              {i + 1}
            </Text>
          )}
        </View>
      ))}
    </View>
  );

  const renderStep1 = () => (
    <View style={styles.stepContent}>
      <Text style={styles.stepTitle}>Event Details</Text>
      <Text style={styles.stepSubtitle}>Tell your community about your event</Text>

      <View style={styles.inputGroup}>
        <Text style={styles.inputLabel}>Event Title *</Text>
        <TextInput
          style={styles.textInput}
          value={formData.title}
          onChangeText={(value) => updateFormData('title', value)}
          placeholder="e.g., Estate Monthly Meeting"
          placeholderTextColor={colors.neutral.gray}
          maxLength={100}
        />
        <Text style={styles.charCount}>{formData.title.length}/100</Text>
      </View>

      <View style={styles.inputGroup}>
        <Text style={styles.inputLabel}>Description *</Text>
        <TextInput
          style={[styles.textInput, styles.textArea]}
          value={formData.description}
          onChangeText={(value) => updateFormData('description', value)}
          placeholder="Describe your event, what to expect, and any important details..."
          placeholderTextColor={colors.neutral.gray}
          multiline
          numberOfLines={4}
          maxLength={500}
        />
        <Text style={styles.charCount}>{formData.description.length}/500</Text>
      </View>

      <View style={styles.inputGroup}>
        <Text style={styles.inputLabel}>Category *</Text>
        <TouchableOpacity
          style={styles.selectInput}
          onPress={() => setShowCategoryModal(true)}
        >
          <Text style={[
            styles.selectInputText,
            !formData.category && styles.selectInputPlaceholder
          ]}>
            {formData.category ? 
              eventCategories.find(c => c.id === formData.category)?.name : 
              'Select event category'
            }
          </Text>
          <MaterialCommunityIcons name="chevron-down" size={20} color={colors.neutral.gray} />
        </TouchableOpacity>
      </View>

      {/* Category Modal */}
      <Modal visible={showCategoryModal} animationType="slide" presentationStyle="pageSheet">
        <SafeAreaView style={styles.modalContainer}>
          <View style={styles.modalHeader}>
            <TouchableOpacity onPress={() => setShowCategoryModal(false)}>
              <Text style={styles.modalCancel}>Cancel</Text>
            </TouchableOpacity>
            <Text style={styles.modalTitle}>Select Category</Text>
            <View style={{ width: 60 }} />
          </View>
          <ScrollView style={styles.modalContent}>
            {eventCategories.map((category) => (
              <TouchableOpacity
                key={category.id}
                style={styles.categoryOption}
                onPress={() => {
                  updateFormData('category', category.id);
                  setShowCategoryModal(false);
                }}
              >
                <View style={[styles.categoryIcon, { backgroundColor: category.color }]}>
                  <MaterialCommunityIcons name={category.icon as any} size={24} color={colors.white} />
                </View>
                <View style={styles.categoryInfo}>
                  <Text style={styles.categoryName}>{category.name}</Text>
                  <Text style={styles.categoryDescription}>{category.description}</Text>
                </View>
                {formData.category === category.id && (
                  <MaterialCommunityIcons name="check" size={24} color={colors.primary} />
                )}
              </TouchableOpacity>
            ))}
          </ScrollView>
        </SafeAreaView>
      </Modal>
    </View>
  );

  const renderStep2 = () => (
    <View style={styles.stepContent}>
      <Text style={styles.stepTitle}>When is your event?</Text>
      <Text style={styles.stepSubtitle}>Set the date and time for your event</Text>

      <View style={styles.inputGroup}>
        <Text style={styles.inputLabel}>Date *</Text>
        <TouchableOpacity 
          style={styles.selectInput}
          onPress={() => setShowDatePicker(true)}
        >
          <Text style={[
            styles.selectInputText,
            !formData.date && styles.selectInputPlaceholder
          ]}>
            {formatDisplayDate(formData.date)}
          </Text>
          <MaterialCommunityIcons name="calendar" size={20} color={colors.neutral.gray} />
        </TouchableOpacity>
      </View>

      <View style={styles.rowInputs}>
        <View style={[styles.inputGroup, { flex: 1, marginRight: spacing.sm }]}>
          <Text style={styles.inputLabel}>Start Time *</Text>
          <TouchableOpacity 
            style={styles.selectInput}
            onPress={() => setShowTimePicker(true)}
          >
            <Text style={[
              styles.selectInputText,
              !formData.time && styles.selectInputPlaceholder
            ]}>
              {formatDisplayTime(formData.time)}
            </Text>
            <MaterialCommunityIcons name="clock-outline" size={20} color={colors.neutral.gray} />
          </TouchableOpacity>
        </View>

        <View style={[styles.inputGroup, { flex: 1, marginLeft: spacing.sm }]}>
          <Text style={styles.inputLabel}>End Time</Text>
          <TouchableOpacity 
            style={styles.selectInput}
            onPress={() => setShowEndTimePicker(true)}
          >
            <Text style={[
              styles.selectInputText,
              !formData.endTime && styles.selectInputPlaceholder
            ]}>
              {formatDisplayTime(formData.endTime)}
            </Text>
            <MaterialCommunityIcons name="clock-outline" size={20} color={colors.neutral.gray} />
          </TouchableOpacity>
        </View>
      </View>

      <View style={styles.helperText}>
        <MaterialCommunityIcons name="information-outline" size={16} color={colors.neutral.gray} />
        <Text style={styles.helperTextContent}>
          Times are shown in West Africa Time (WAT). Your community will see the event in their local timezone.
        </Text>
      </View>

      {/* Date Picker */}
      {showDatePicker && Platform.OS === 'ios' && (
        <Modal visible={showDatePicker} animationType="slide" presentationStyle="pageSheet">
          <SafeAreaView style={styles.modalContainer}>
            <View style={styles.modalHeader}>
              <TouchableOpacity onPress={() => setShowDatePicker(false)}>
                <Text style={styles.modalCancel}>Cancel</Text>
              </TouchableOpacity>
              <Text style={styles.modalTitle}>Select Date</Text>
              <TouchableOpacity onPress={() => setShowDatePicker(false)}>
                <Text style={styles.modalSend}>Done</Text>
              </TouchableOpacity>
            </View>
            <View style={styles.pickerContainer}>
              <DateTimePicker
                value={formData.date || new Date()}
                mode="date"
                display="spinner"
                onChange={handleDateChange}
                minimumDate={new Date()}
              />
            </View>
          </SafeAreaView>
        </Modal>
      )}

      {showDatePicker && Platform.OS === 'android' && (
        <DateTimePicker
          value={formData.date || new Date()}
          mode="date"
          display="default"
          onChange={handleDateChange}
          minimumDate={new Date()}
        />
      )}

      {/* Time Picker */}
      {showTimePicker && Platform.OS === 'ios' && (
        <Modal visible={showTimePicker} animationType="slide" presentationStyle="pageSheet">
          <SafeAreaView style={styles.modalContainer}>
            <View style={styles.modalHeader}>
              <TouchableOpacity onPress={() => setShowTimePicker(false)}>
                <Text style={styles.modalCancel}>Cancel</Text>
              </TouchableOpacity>
              <Text style={styles.modalTitle}>Select Start Time</Text>
              <TouchableOpacity onPress={() => setShowTimePicker(false)}>
                <Text style={styles.modalSend}>Done</Text>
              </TouchableOpacity>
            </View>
            <View style={styles.pickerContainer}>
              <DateTimePicker
                value={formData.time || new Date()}
                mode="time"
                display="spinner"
                onChange={handleTimeChange}
              />
            </View>
          </SafeAreaView>
        </Modal>
      )}

      {showTimePicker && Platform.OS === 'android' && (
        <DateTimePicker
          value={formData.time || new Date()}
          mode="time"
          display="default"
          onChange={handleTimeChange}
        />
      )}

      {/* End Time Picker */}
      {showEndTimePicker && Platform.OS === 'ios' && (
        <Modal visible={showEndTimePicker} animationType="slide" presentationStyle="pageSheet">
          <SafeAreaView style={styles.modalContainer}>
            <View style={styles.modalHeader}>
              <TouchableOpacity onPress={() => setShowEndTimePicker(false)}>
                <Text style={styles.modalCancel}>Cancel</Text>
              </TouchableOpacity>
              <Text style={styles.modalTitle}>Select End Time</Text>
              <TouchableOpacity onPress={() => setShowEndTimePicker(false)}>
                <Text style={styles.modalSend}>Done</Text>
              </TouchableOpacity>
            </View>
            <View style={styles.pickerContainer}>
              <DateTimePicker
                value={formData.endTime || new Date()}
                mode="time"
                display="spinner"
                onChange={handleEndTimeChange}
              />
            </View>
          </SafeAreaView>
        </Modal>
      )}

      {showEndTimePicker && Platform.OS === 'android' && (
        <DateTimePicker
          value={formData.endTime || new Date()}
          mode="time"
          display="default"
          onChange={handleEndTimeChange}
        />
      )}
    </View>
  );

  const renderStep3 = () => (
    <View style={styles.stepContent}>
      <Text style={styles.stepTitle}>Where is your event?</Text>
      <Text style={styles.stepSubtitle}>Help your neighbors find your event</Text>

      <View style={styles.inputGroup}>
        <Text style={styles.inputLabel}>Venue Name *</Text>
        <TextInput
          style={styles.textInput}
          value={formData.location.name}
          onChangeText={(value) => updateFormData('location.name', value)}
          placeholder="e.g., Community Hall, My Compound, Local School"
          placeholderTextColor={colors.neutral.gray}
        />
      </View>

      <View style={styles.inputGroup}>
        <Text style={styles.inputLabel}>Estate/Compound *</Text>
        <TextInput
          style={styles.textInput}
          value={formData.location.estate}
          onChangeText={(value) => updateFormData('location.estate', value)}
          placeholder="e.g., Victoria Island Estate"
          placeholderTextColor={colors.neutral.gray}
        />
      </View>

      <View style={styles.rowInputs}>
        <View style={[styles.inputGroup, { flex: 1, marginRight: spacing.sm }]}>
          <Text style={styles.inputLabel}>City *</Text>
          <TextInput
            style={styles.textInput}
            value={formData.location.city}
            onChangeText={(value) => updateFormData('location.city', value)}
            placeholder="e.g., Ikeja"
            placeholderTextColor={colors.neutral.gray}
          />
        </View>

        <View style={[styles.inputGroup, { flex: 1, marginLeft: spacing.sm }]}>
          <Text style={styles.inputLabel}>State *</Text>
          <TouchableOpacity
            style={styles.selectInput}
            onPress={() => setShowStateModal(true)}
          >
            <Text style={[
              styles.selectInputText,
              !formData.location.state && styles.selectInputPlaceholder
            ]}>
              {formData.location.state || 'Select state'}
            </Text>
            <MaterialCommunityIcons name="chevron-down" size={20} color={colors.neutral.gray} />
          </TouchableOpacity>
        </View>
      </View>

      <View style={styles.inputGroup}>
        <Text style={styles.inputLabel}>Nearby Landmark</Text>
        <TextInput
          style={styles.textInput}
          value={formData.location.landmark}
          onChangeText={(value) => updateFormData('location.landmark', value)}
          placeholder="e.g., Near Ikeja City Mall, Opposite First Bank"
          placeholderTextColor={colors.neutral.gray}
        />
      </View>

      {/* State Modal */}
      <Modal visible={showStateModal} animationType="slide" presentationStyle="pageSheet">
        <SafeAreaView style={styles.modalContainer}>
          <View style={styles.modalHeader}>
            <TouchableOpacity onPress={() => setShowStateModal(false)}>
              <Text style={styles.modalCancel}>Cancel</Text>
            </TouchableOpacity>
            <Text style={styles.modalTitle}>Select State</Text>
            <View style={{ width: 60 }} />
          </View>
          <ScrollView style={styles.modalContent}>
            {nigerianStates.map((state) => (
              <TouchableOpacity
                key={state}
                style={styles.stateOption}
                onPress={() => {
                  updateFormData('location.state', state);
                  setShowStateModal(false);
                }}
              >
                <Text style={styles.stateText}>{state}</Text>
                {formData.location.state === state && (
                  <MaterialCommunityIcons name="check" size={24} color={colors.primary} />
                )}
              </TouchableOpacity>
            ))}
          </ScrollView>
        </SafeAreaView>
      </Modal>
    </View>
  );

  const renderStep4 = () => (
    <View style={styles.stepContent}>
      <Text style={styles.stepTitle}>Event Settings</Text>
      <Text style={styles.stepSubtitle}>Configure pricing and attendance</Text>

      <View style={styles.inputGroup}>
        <View style={styles.switchRow}>
          <View style={styles.switchInfo}>
            <Text style={styles.switchLabel}>Free Event</Text>
            <Text style={styles.switchSubLabel}>This event is free to attend</Text>
          </View>
          <Switch
            value={formData.isFree}
            onValueChange={(value) => updateFormData('isFree', value)}
            trackColor={{ false: colors.neutral.lightGray, true: colors.primary }}
            thumbColor={colors.white}
          />
        </View>
      </View>

      {!formData.isFree && (
        <View style={styles.inputGroup}>
          <Text style={styles.inputLabel}>Ticket Price (₦) *</Text>
          <TextInput
            style={styles.textInput}
            value={formData.price}
            onChangeText={(value) => updateFormData('price', value)}
            placeholder="0.00"
            placeholderTextColor={colors.neutral.gray}
            keyboardType="numeric"
          />
        </View>
      )}

      <View style={styles.inputGroup}>
        <Text style={styles.inputLabel}>Maximum Attendees</Text>
        <TextInput
          style={styles.textInput}
          value={formData.maxAttendees}
          onChangeText={(value) => updateFormData('maxAttendees', value)}
          placeholder="Leave empty for unlimited"
          placeholderTextColor={colors.neutral.gray}
          keyboardType="numeric"
        />
      </View>

      <View style={styles.inputGroup}>
        <View style={styles.switchRow}>
          <View style={styles.switchInfo}>
            <Text style={styles.switchLabel}>Require Verification</Text>
            <Text style={styles.switchSubLabel}>Only verified neighbors can attend</Text>
          </View>
          <Switch
            value={formData.requireVerification}
            onValueChange={(value) => updateFormData('requireVerification', value)}
            trackColor={{ false: colors.neutral.lightGray, true: colors.primary }}
            thumbColor={colors.white}
          />
        </View>
      </View>

      <View style={styles.inputGroup}>
        <View style={styles.switchRow}>
          <View style={styles.switchInfo}>
            <Text style={styles.switchLabel}>Private Event</Text>
            <Text style={styles.switchSubLabel}>Only invited neighbors can see this event</Text>
          </View>
          <Switch
            value={formData.isPrivate}
            onValueChange={(value) => updateFormData('isPrivate', value)}
            trackColor={{ false: colors.neutral.lightGray, true: colors.primary }}
            thumbColor={colors.white}
          />
        </View>
      </View>
    </View>
  );

  const renderStep5 = () => (
    <View style={styles.stepContent}>
      <Text style={styles.stepTitle}>Additional Details</Text>
      <Text style={styles.stepSubtitle}>Help your community prepare for the event</Text>

      <View style={styles.inputGroup}>
        <Text style={styles.inputLabel}>Event Languages</Text>
        <TouchableOpacity
          style={styles.selectInput}
          onPress={() => setShowLanguageModal(true)}
        >
          <Text style={styles.selectInputText}>
            {formData.languages.length > 0 ? formData.languages.join(', ') : 'Select languages'}
          </Text>
          <MaterialCommunityIcons name="chevron-down" size={20} color={colors.neutral.gray} />
        </TouchableOpacity>
      </View>

      <View style={styles.inputGroup}>
        <Text style={styles.inputLabel}>Age Restriction</Text>
        <TouchableOpacity
          style={styles.selectInput}
          onPress={() => setShowAgeModal(true)}
        >
          <Text style={[
            styles.selectInputText,
            !formData.ageRestriction && styles.selectInputPlaceholder
          ]}>
            {ageRestrictions.find(a => a.value === formData.ageRestriction)?.label || 'No restriction'}
          </Text>
          <MaterialCommunityIcons name="chevron-down" size={20} color={colors.neutral.gray} />
        </TouchableOpacity>
      </View>

      <View style={styles.inputGroup}>
        <Text style={styles.inputLabel}>Special Requirements</Text>
        <TextInput
          style={[styles.textInput, styles.textArea]}
          value={formData.specialRequirements}
          onChangeText={(value) => updateFormData('specialRequirements', value)}
          placeholder="Any special requirements, what to bring, dress code, etc."
          placeholderTextColor={colors.neutral.gray}
          multiline
          numberOfLines={3}
        />
      </View>

      <View style={styles.inputGroup}>
        <View style={styles.switchRow}>
          <View style={styles.switchInfo}>
            <Text style={styles.switchLabel}>Allow Guests</Text>
            <Text style={styles.switchSubLabel}>Attendees can bring guests</Text>
          </View>
          <Switch
            value={formData.allowGuests}
            onValueChange={(value) => updateFormData('allowGuests', value)}
            trackColor={{ false: colors.neutral.lightGray, true: colors.primary }}
            thumbColor={colors.white}
          />
        </View>
      </View>

      {/* Language Modal */}
      <Modal visible={showLanguageModal} animationType="slide" presentationStyle="pageSheet">
        <SafeAreaView style={styles.modalContainer}>
          <View style={styles.modalHeader}>
            <TouchableOpacity onPress={() => setShowLanguageModal(false)}>
              <Text style={styles.modalCancel}>Done</Text>
            </TouchableOpacity>
            <Text style={styles.modalTitle}>Event Languages</Text>
            <View style={{ width: 60 }} />
          </View>
          <ScrollView style={styles.modalContent}>
            {nigerianLanguages.map((language) => (
              <TouchableOpacity
                key={language}
                style={styles.languageOption}
                onPress={() => {
                  const isSelected = formData.languages.includes(language);
                  if (isSelected) {
                    updateFormData('languages', formData.languages.filter(l => l !== language));
                  } else {
                    updateFormData('languages', [...formData.languages, language]);
                  }
                }}
              >
                <Text style={styles.languageText}>{language}</Text>
                {formData.languages.includes(language) && (
                  <MaterialCommunityIcons name="check" size={24} color={colors.primary} />
                )}
              </TouchableOpacity>
            ))}
          </ScrollView>
        </SafeAreaView>
      </Modal>

      {/* Age Modal */}
      <Modal visible={showAgeModal} animationType="slide" presentationStyle="pageSheet">
        <SafeAreaView style={styles.modalContainer}>
          <View style={styles.modalHeader}>
            <TouchableOpacity onPress={() => setShowAgeModal(false)}>
              <Text style={styles.modalCancel}>Cancel</Text>
            </TouchableOpacity>
            <Text style={styles.modalTitle}>Age Restriction</Text>
            <View style={{ width: 60 }} />
          </View>
          <ScrollView style={styles.modalContent}>
            {ageRestrictions.map((restriction) => (
              <TouchableOpacity
                key={restriction.value}
                style={styles.ageOption}
                onPress={() => {
                  updateFormData('ageRestriction', restriction.value);
                  setShowAgeModal(false);
                }}
              >
                <Text style={styles.ageText}>{restriction.label}</Text>
                {formData.ageRestriction === restriction.value && (
                  <MaterialCommunityIcons name="check" size={24} color={colors.primary} />
                )}
              </TouchableOpacity>
            ))}
          </ScrollView>
        </SafeAreaView>
      </Modal>
    </View>
  );

  const renderCurrentStep = () => {
    switch (currentStep) {
      case 1: return renderStep1();
      case 2: return renderStep2();
      case 3: return renderStep3();
      case 4: return renderStep4();
      case 5: return renderStep5();
      default: return renderStep1();
    }
  };

  return (
    <SafeAreaView style={styles.container}>
      <KeyboardAvoidingView 
        style={{ flex: 1 }} 
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
      >
        {/* Header */}
        <View style={styles.header}>
          <TouchableOpacity 
            style={styles.headerButton}
            onPress={() => navigation.goBack()}
          >
            <MaterialCommunityIcons name="close" size={24} color={colors.text.dark} />
          </TouchableOpacity>
          
          <Text style={styles.headerTitle}>Create Event</Text>
          
          <TouchableOpacity 
            style={styles.headerButton}
            onPress={() => Alert.alert('Save Draft', 'Feature coming soon!')}
          >
            <Text style={styles.saveDraftText}>Save</Text>
          </TouchableOpacity>
        </View>

        {/* Progress Indicator */}
        {renderStepIndicator()}
        {renderProgressBar()}

        {/* Content */}
        <ScrollView style={styles.content} showsVerticalScrollIndicator={false}>
          {renderCurrentStep()}
        </ScrollView>

        {/* Navigation Buttons */}
        <View style={styles.navigationButtons}>
          {currentStep > 1 && (
            <TouchableOpacity style={styles.backButton} onPress={prevStep}>
              <MaterialCommunityIcons name="arrow-left" size={20} color={colors.neutral.gray} />
              <Text style={styles.backButtonText}>Back</Text>
            </TouchableOpacity>
          )}
          
          <TouchableOpacity 
            style={[
              styles.nextButton,
              currentStep === 1 && { flex: 1 },
              !validateStep(currentStep) && styles.nextButtonDisabled
            ]} 
            onPress={currentStep === totalSteps ? handleSubmit : nextStep}
            disabled={!validateStep(currentStep)}
          >
            <Text style={[
              styles.nextButtonText,
              !validateStep(currentStep) && styles.nextButtonTextDisabled
            ]}>
              {currentStep === totalSteps ? 'Create Event' : 'Continue'}
            </Text>
            {currentStep < totalSteps && (
              <MaterialCommunityIcons 
                name="arrow-right" 
                size={20} 
                color={validateStep(currentStep) ? colors.white : colors.neutral.gray} 
              />
            )}
          </TouchableOpacity>
        </View>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.white,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.md,
    borderBottomWidth: 1,
    borderBottomColor: colors.neutral.lightGray,
  },
  headerButton: {
    padding: spacing.sm,
    minWidth: 60,
  },
  headerTitle: {
    fontSize: typography.sizes.lg,
    fontWeight: '600',
    color: colors.text.dark,
  },
  saveDraftText: {
    fontSize: typography.sizes.base,
    color: colors.primary,
    fontWeight: '500',
  },
  progressContainer: {
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
  },
  progressBar: {
    height: 4,
    backgroundColor: colors.neutral.lightGray,
    borderRadius: 2,
    marginBottom: spacing.sm,
  },
  progressFill: {
    height: '100%',
    backgroundColor: colors.primary,
    borderRadius: 2,
  },
  progressText: {
    fontSize: typography.sizes.sm,
    color: colors.neutral.gray,
    textAlign: 'center',
  },
  stepIndicator: {
    flexDirection: 'row',
    justifyContent: 'center',
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.md,
  },
  stepDot: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: colors.neutral.lightGray,
    justifyContent: 'center',
    alignItems: 'center',
    marginHorizontal: 4,
  },
  activeStepDot: {
    backgroundColor: colors.primary,
  },
  completedStepDot: {
    backgroundColor: colors.success,
  },
  stepNumber: {
    fontSize: typography.sizes.sm,
    color: colors.neutral.gray,
    fontWeight: '600',
  },
  activeStepNumber: {
    color: colors.white,
  },
  completedStepNumber: {
    color: colors.white,
  },
  content: {
    flex: 1,
    paddingHorizontal: spacing.md,
  },
  stepContent: {
    paddingBottom: spacing.xl,
  },
  stepTitle: {
    fontSize: typography.sizes['2xl'],
    fontWeight: '700',
    color: colors.text.dark,
    marginBottom: spacing.sm,
  },
  stepSubtitle: {
    fontSize: typography.sizes.base,
    color: colors.neutral.gray,
    marginBottom: spacing.lg,
  },
  inputGroup: {
    marginBottom: spacing.lg,
  },
  inputLabel: {
    fontSize: typography.sizes.base,
    fontWeight: '500',
    color: colors.text.dark,
    marginBottom: spacing.sm,
  },
  textInput: {
    borderWidth: 1,
    borderColor: colors.neutral.lightGray,
    borderRadius: 12,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.md,
    fontSize: typography.sizes.base,
    color: colors.text.dark,
    backgroundColor: colors.white,
  },
  textArea: {
    height: 100,
    textAlignVertical: 'top',
  },
  selectInput: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: colors.neutral.lightGray,
    borderRadius: 12,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.md,
    backgroundColor: colors.white,
  },
  selectInputText: {
    fontSize: typography.sizes.base,
    color: colors.text.dark,
    flex: 1,
  },
  selectInputPlaceholder: {
    color: colors.neutral.gray,
  },
  charCount: {
    fontSize: typography.sizes.sm,
    color: colors.neutral.gray,
    textAlign: 'right',
    marginTop: 4,
  },
  rowInputs: {
    flexDirection: 'row',
    alignItems: 'flex-end',
  },
  switchRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: spacing.sm,
  },
  switchInfo: {
    flex: 1,
    marginRight: spacing.md,
  },
  switchLabel: {
    fontSize: typography.sizes.base,
    fontWeight: '500',
    color: colors.text.dark,
    marginBottom: 2,
  },
  switchSubLabel: {
    fontSize: typography.sizes.sm,
    color: colors.neutral.gray,
  },
  helperText: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    backgroundColor: colors.neutral.offWhite,
    padding: spacing.md,
    borderRadius: 8,
    marginTop: spacing.sm,
  },
  helperTextContent: {
    fontSize: typography.sizes.sm,
    color: colors.neutral.gray,
    marginLeft: spacing.sm,
    flex: 1,
    lineHeight: 20,
  },
  navigationButtons: {
    flexDirection: 'row',
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.md,
    borderTopWidth: 1,
    borderTopColor: colors.neutral.lightGray,
    backgroundColor: colors.white,
  },
  backButton: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: spacing.lg,
    paddingVertical: spacing.md,
    marginRight: spacing.sm,
    borderRadius: 12,
    backgroundColor: colors.neutral.offWhite,
  },
  backButtonText: {
    fontSize: typography.sizes.base,
    color: colors.neutral.gray,
    fontWeight: '500',
    marginLeft: spacing.sm,
  },
  nextButton: {
    flex: 1,
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    paddingVertical: spacing.md,
    borderRadius: 12,
    backgroundColor: colors.primary,
  },
  nextButtonDisabled: {
    backgroundColor: colors.neutral.lightGray,
  },
  nextButtonText: {
    fontSize: typography.sizes.base,
    color: colors.white,
    fontWeight: '600',
    marginRight: spacing.sm,
  },
  nextButtonTextDisabled: {
    color: colors.neutral.gray,
  },
  // Modal styles
  modalContainer: {
    flex: 1,
    backgroundColor: colors.white,
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.md,
    borderBottomWidth: 1,
    borderBottomColor: colors.neutral.lightGray,
  },
  modalCancel: {
    fontSize: typography.sizes.base,
    color: colors.neutral.gray,
  },
  modalTitle: {
    fontSize: typography.sizes.lg,
    fontWeight: '600',
    color: colors.text.dark,
  },
  modalContent: {
    flex: 1,
    padding: spacing.md,
  },
  pickerContainer: {
    flex: 1,
    justifyContent: 'center',
    paddingHorizontal: spacing.md,
  },
  categoryOption: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: spacing.md,
    borderBottomWidth: 1,
    borderBottomColor: colors.neutral.lightGray,
  },
  categoryIcon: {
    width: 40,
    height: 40,
    borderRadius: 20,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: spacing.md,
  },
  categoryInfo: {
    flex: 1,
  },
  categoryName: {
    fontSize: typography.sizes.base,
    fontWeight: '500',
    color: colors.text.dark,
    marginBottom: 2,
  },
  categoryDescription: {
    fontSize: typography.sizes.sm,
    color: colors.neutral.gray,
  },
  stateOption: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: spacing.md,
    borderBottomWidth: 1,
    borderBottomColor: colors.neutral.lightGray,
  },
  stateText: {
    fontSize: typography.sizes.base,
    color: colors.text.dark,
  },
  languageOption: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: spacing.md,
    borderBottomWidth: 1,
    borderBottomColor: colors.neutral.lightGray,
  },
  languageText: {
    fontSize: typography.sizes.base,
    color: colors.text.dark,
  },
  ageOption: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: spacing.md,
    borderBottomWidth: 1,
    borderBottomColor: colors.neutral.lightGray,
  },
  ageText: {
    fontSize: typography.sizes.base,
    color: colors.text.dark,
  },
});

export default CreateEventScreen;