import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  SafeAreaView,
  ScrollView,
  TextInput,
  TouchableOpacity,
  Alert,
  Platform,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import DateTimePicker from '@react-native-community/datetimepicker';
import { PostsService } from '../../services/postsService';
import { COMMUNITY_HELP_CATEGORIES, HELP_REQUEST_EXAMPLES } from '../constants';

interface CreateHelpPostScreenProps {
  navigation: any;
}

export const CreateHelpPostScreen: React.FC<CreateHelpPostScreenProps> = ({
  navigation,
}) => {
  const [content, setContent] = useState('');
  const [helpCategory, setHelpCategory] = useState<
    'errand' | 'task' | 'recommendation' | 'advice' | 'borrow'
  >('errand');
  const [urgency, setUrgency] = useState<'low' | 'medium' | 'high'>('medium');
  const [budget, setBudget] = useState('');
  const [deadline, setDeadline] = useState<Date | null>(null);
  const [showDatePicker, setShowDatePicker] = useState(false);
  const [submitting, setSubmitting] = useState(false);

  // Borrow-specific state
  const [borrowItem, setBorrowItem] = useState('');
  const [borrowDuration, setBorrowDuration] = useState<'few_hours' | 'day' | 'few_days' | 'week' | ''>('');
  const [conditionNotes, setConditionNotes] = useState('');

  // Task-specific state
  const [taskType, setTaskType] = useState<'moving' | 'repair' | 'delivery' | 'other' | ''>('');
  const [estimatedDuration, setEstimatedDuration] = useState('');

  const postsService = PostsService.getInstance();

  const getCategoryColor = (categoryId: string) => {
    switch (categoryId) {
      case 'errand': return '#FF6B35';  // Orange
      case 'task': return '#9C27B0';    // Purple
      case 'borrow': return '#2196F3';  // Blue
      case 'recommendation': return '#FFC107';  // Yellow
      case 'advice': return '#00BCD4';  // Cyan
      default: return '#8E8E93';
    }
  };

  const helpCategories = COMMUNITY_HELP_CATEGORIES.map(cat => ({
    id: cat.id as any,
    label: cat.label,
    description: cat.description,
    icon: cat.icon,
    color: getCategoryColor(cat.id),
  }));

  const urgencyLevels = [
    { id: 'low' as const, label: 'Low', color: '#00A651' },
    { id: 'medium' as const, label: 'Medium', color: '#FFC107' },
    { id: 'high' as const, label: 'High', color: '#E74C3C' },
  ];

  const handleSubmit = async () => {
    if (!content.trim()) {
      Alert.alert('Error', 'Please describe what help you need');
      return;
    }

    if (content.length < 20) {
      Alert.alert('Content Too Short', 'Please describe your request (min 20 characters)');
      return;
    }

    // Borrow-specific validation
    if (helpCategory === 'borrow') {
      if (!borrowItem.trim()) {
        Alert.alert('Missing Information', 'Please specify what you need to borrow');
        return;
      }
      if (!borrowDuration) {
        Alert.alert('Missing Information', 'Please specify how long you need it');
        return;
      }
    }

    // Task-specific validation
    if (helpCategory === 'task') {
      if (!taskType) {
        Alert.alert('Missing Information', 'Please select a task type');
        return;
      }
    }

    try {
      setSubmitting(true);
      await postsService.createPost({
        content: content.trim(),
        postType: 'help',
        privacyLevel: 'neighborhood',
        helpCategory,
        urgency,
        budget: budget || undefined,
        deadline: deadline?.toISOString(),
        // Borrow-specific fields
        borrowItem: helpCategory === 'borrow' ? borrowItem : undefined,
        borrowDuration: helpCategory === 'borrow' ? borrowDuration : undefined,
        itemCondition: helpCategory === 'borrow' ? conditionNotes : undefined,
        // Task-specific fields
        taskType: helpCategory === 'task' ? taskType : undefined,
        estimatedDuration: helpCategory === 'task' ? estimatedDuration : undefined,
      });

      Alert.alert('Success', 'Help request posted!', [
        { text: 'OK', onPress: () => navigation.goBack() },
      ]);
    } catch (error) {
      console.error('Error creating help post:', error);
      Alert.alert('Error', 'Failed to post help request. Please try again.');
    } finally {
      setSubmitting(false);
    }
  };

  const handleDateChange = (event: any, selectedDate?: Date) => {
    setShowDatePicker(Platform.OS === 'ios');
    if (selectedDate) {
      setDeadline(selectedDate);
    }
  };

  const formatDate = (date: Date) => {
    return date.toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
    });
  };

  return (
    <SafeAreaView style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity onPress={() => navigation.goBack()}>
          <Text style={styles.cancelButton}>Cancel</Text>
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Ask for Help</Text>
        <TouchableOpacity
          onPress={handleSubmit}
          disabled={submitting || !content.trim()}
        >
          <Text
            style={[
              styles.postButton,
              (submitting || !content.trim()) && styles.postButtonDisabled,
            ]}
          >
            {submitting ? 'Posting...' : 'Post'}
          </Text>
        </TouchableOpacity>
      </View>

      <ScrollView style={styles.content} showsVerticalScrollIndicator={false}>
        {/* Help Category Selection */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>
            What kind of help do you need?
          </Text>
          <View style={styles.categoryGrid}>
            {helpCategories.map((cat) => (
              <TouchableOpacity
                key={cat.id}
                style={[
                  styles.categoryCard,
                  helpCategory === cat.id && styles.selectedCategoryCard,
                  helpCategory === cat.id && {
                    borderColor: cat.color,
                    backgroundColor: cat.color + '10',
                  },
                ]}
                onPress={() => setHelpCategory(cat.id)}
              >
                <Ionicons
                  name={cat.icon as any}
                  size={32}
                  color={helpCategory === cat.id ? cat.color : '#8E8E8E'}
                />
                <Text
                  style={[
                    styles.categoryCardLabel,
                    helpCategory === cat.id && { color: cat.color },
                  ]}
                >
                  {cat.label}
                </Text>
                <Text style={styles.categoryCardDescription}>
                  {cat.description}
                </Text>
              </TouchableOpacity>
            ))}
          </View>
        </View>

        {/* Description */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>
            Description <Text style={styles.required}>*</Text>
          </Text>
          <TextInput
            style={styles.textArea}
            placeholder="Describe what help you need..."
            placeholderTextColor="#8E8E8E"
            multiline
            numberOfLines={6}
            value={content}
            onChangeText={setContent}
            textAlignVertical="top"
          />
          <Text style={styles.charCount}>{content.length}/1000</Text>
        </View>

        {/* Show examples for selected category */}
        {helpCategory && HELP_REQUEST_EXAMPLES[helpCategory] && (
          <View style={styles.examplesCard}>
            <Text style={styles.examplesTitle}>Example Requests:</Text>
            {HELP_REQUEST_EXAMPLES[helpCategory].map((example, index) => (
              <TouchableOpacity
                key={index}
                style={styles.exampleItem}
                onPress={() => setContent(example)}
              >
                <Ionicons name="bulb-outline" size={16} color="#00A651" />
                <Text style={styles.exampleText}>{example}</Text>
              </TouchableOpacity>
            ))}
          </View>
        )}

        {/* Borrow-specific fields */}
        {helpCategory === 'borrow' && (
          <>
            <View style={styles.section}>
              <Text style={styles.sectionTitle}>
                What do you need? <Text style={styles.required}>*</Text>
              </Text>
              <TextInput
                style={styles.input}
                placeholder="e.g., Ladder, Pressure washer, Generator"
                placeholderTextColor="#8E8E8E"
                value={borrowItem}
                onChangeText={setBorrowItem}
              />
            </View>

            <View style={styles.section}>
              <Text style={styles.sectionTitle}>
                How long do you need it? <Text style={styles.required}>*</Text>
              </Text>
              <View style={styles.durationSelector}>
                {[
                  { value: 'few_hours', label: 'Few hours' },
                  { value: 'day', label: 'One day' },
                  { value: 'few_days', label: 'Few days' },
                  { value: 'week', label: 'A week' },
                ].map((duration) => (
                  <TouchableOpacity
                    key={duration.value}
                    style={[
                      styles.durationOption,
                      borrowDuration === duration.value && styles.durationOptionActive
                    ]}
                    onPress={() => setBorrowDuration(duration.value as any)}
                  >
                    <Text style={[
                      styles.durationText,
                      borrowDuration === duration.value && styles.durationTextActive
                    ]}>
                      {duration.label}
                    </Text>
                  </TouchableOpacity>
                ))}
              </View>
            </View>

            <View style={styles.section}>
              <Text style={styles.sectionTitle}>Condition Notes (Optional)</Text>
              <TextInput
                style={[styles.input, styles.textArea]}
                placeholder="Any specific condition requirements..."
                placeholderTextColor="#8E8E8E"
                value={conditionNotes}
                onChangeText={setConditionNotes}
                multiline
                numberOfLines={3}
              />
            </View>
          </>
        )}

        {/* Task-specific fields */}
        {helpCategory === 'task' && (
          <>
            <View style={styles.section}>
              <Text style={styles.sectionTitle}>
                Task Type <Text style={styles.required}>*</Text>
              </Text>
              <View style={styles.taskTypeSelector}>
                {[
                  { value: 'moving', label: 'Moving Help' },
                  { value: 'repair', label: 'Small Repair' },
                  { value: 'delivery', label: 'Delivery/Pickup' },
                  { value: 'other', label: 'Other' },
                ].map((type) => (
                  <TouchableOpacity
                    key={type.value}
                    style={[
                      styles.taskTypeChip,
                      taskType === type.value && styles.taskTypeChipActive
                    ]}
                    onPress={() => setTaskType(type.value as any)}
                  >
                    <Text style={[
                      styles.taskTypeText,
                      taskType === type.value && styles.taskTypeTextActive
                    ]}>
                      {type.label}
                    </Text>
                  </TouchableOpacity>
                ))}
              </View>
            </View>

            <View style={styles.section}>
              <Text style={styles.sectionTitle}>Estimated Duration (Optional)</Text>
              <TextInput
                style={styles.input}
                placeholder="e.g., 2 hours, Half day"
                placeholderTextColor="#8E8E8E"
                value={estimatedDuration}
                onChangeText={setEstimatedDuration}
              />
            </View>
          </>
        )}

        {/* Budget (for any category that might need it) */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Budget (Optional)</Text>
          <View style={styles.inputContainer}>
            <Text style={styles.currencySymbol}>₦</Text>
            <TextInput
              style={styles.input}
              placeholder="e.g., 5,000"
              placeholderTextColor="#8E8E8E"
              value={budget}
              onChangeText={setBudget}
              keyboardType="numeric"
            />
          </View>
        </View>

        {/* Deadline */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Deadline (Optional)</Text>
          <TouchableOpacity
            style={styles.dateButton}
            onPress={() => setShowDatePicker(true)}
          >
            <Ionicons name="calendar-outline" size={20} color="#8E8E8E" />
            <Text style={styles.dateButtonText}>
              {deadline ? formatDate(deadline) : 'Select deadline'}
            </Text>
            {deadline && (
              <TouchableOpacity
                onPress={() => setDeadline(null)}
                style={styles.clearDateButton}
              >
                <Ionicons name="close-circle" size={20} color="#8E8E8E" />
              </TouchableOpacity>
            )}
          </TouchableOpacity>
        </View>

        {/* Urgency */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Urgency</Text>
          <View style={styles.urgencyButtons}>
            {urgencyLevels.map((level) => (
              <TouchableOpacity
                key={level.id}
                style={[
                  styles.urgencyButton,
                  urgency === level.id && {
                    backgroundColor: level.color,
                    borderColor: level.color,
                  },
                ]}
                onPress={() => setUrgency(level.id)}
              >
                <Text
                  style={[
                    styles.urgencyButtonText,
                    urgency === level.id && styles.selectedUrgencyButtonText,
                  ]}
                >
                  {level.label}
                </Text>
              </TouchableOpacity>
            ))}
          </View>
        </View>

        {/* Help Text */}
        <View style={styles.helpTextContainer}>
          <Ionicons name="information-circle-outline" size={20} color="#8E8E8E" />
          <Text style={styles.helpText}>
            Your help request will be visible to your neighbors. You'll receive
            responses via comments or direct messages.
          </Text>
        </View>
      </ScrollView>

      {/* Date Picker Modal */}
      {showDatePicker && (
        <DateTimePicker
          value={deadline || new Date()}
          mode="date"
          display={Platform.OS === 'ios' ? 'spinner' : 'default'}
          onChange={handleDateChange}
          minimumDate={new Date()}
        />
      )}
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#FFFFFF',
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#F0F0F0',
  },
  cancelButton: {
    fontSize: 16,
    color: '#8E8E8E',
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#2C2C2C',
  },
  postButton: {
    fontSize: 16,
    fontWeight: '600',
    color: '#00A651',
  },
  postButtonDisabled: {
    color: '#C0C0C0',
  },
  content: {
    flex: 1,
  },
  section: {
    padding: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#F0F0F0',
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#2C2C2C',
    marginBottom: 12,
  },
  required: {
    color: '#E74C3C',
  },
  categoryGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 12,
  },
  categoryCard: {
    width: '48%',
    aspectRatio: 1,
    borderWidth: 2,
    borderColor: '#E0E0E0',
    borderRadius: 12,
    padding: 16,
    alignItems: 'center',
    justifyContent: 'center',
  },
  selectedCategoryCard: {
    borderWidth: 2,
  },
  categoryCardLabel: {
    fontSize: 16,
    fontWeight: '600',
    color: '#2C2C2C',
    marginTop: 8,
  },
  categoryCardDescription: {
    fontSize: 12,
    color: '#8E8E8E',
    marginTop: 4,
    textAlign: 'center',
  },
  textArea: {
    borderWidth: 1,
    borderColor: '#E0E0E0',
    borderRadius: 8,
    padding: 12,
    fontSize: 16,
    color: '#2C2C2C',
    minHeight: 120,
  },
  charCount: {
    fontSize: 12,
    color: '#8E8E8E',
    textAlign: 'right',
    marginTop: 4,
  },
  inputContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#E0E0E0',
    borderRadius: 8,
    paddingHorizontal: 12,
  },
  currencySymbol: {
    fontSize: 18,
    fontWeight: '600',
    color: '#00A651',
    marginRight: 8,
  },
  input: {
    flex: 1,
    paddingVertical: 12,
    fontSize: 16,
    color: '#2C2C2C',
  },
  dateButton: {
    flexDirection: 'row',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#E0E0E0',
    borderRadius: 8,
    padding: 12,
  },
  dateButtonText: {
    flex: 1,
    fontSize: 16,
    color: '#2C2C2C',
    marginLeft: 8,
  },
  clearDateButton: {
    padding: 4,
  },
  urgencyButtons: {
    flexDirection: 'row',
    gap: 12,
  },
  urgencyButton: {
    flex: 1,
    paddingVertical: 12,
    borderWidth: 2,
    borderColor: '#E0E0E0',
    borderRadius: 8,
    alignItems: 'center',
  },
  urgencyButtonText: {
    fontSize: 14,
    fontWeight: '600',
    color: '#2C2C2C',
  },
  selectedUrgencyButtonText: {
    color: '#FFFFFF',
  },
  helpTextContainer: {
    flexDirection: 'row',
    padding: 16,
    backgroundColor: '#F8F9FA',
    margin: 16,
    borderRadius: 8,
  },
  helpText: {
    flex: 1,
    fontSize: 14,
    color: '#8E8E8E',
    marginLeft: 8,
    lineHeight: 20,
  },
  // Examples card styles
  examplesCard: {
    backgroundColor: '#F8F9FA',
    margin: 16,
    padding: 16,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#E0E0E0',
  },
  examplesTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#2C2C2C',
    marginBottom: 12,
  },
  exampleItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 8,
    paddingHorizontal: 12,
    backgroundColor: '#FFFFFF',
    borderRadius: 6,
    marginBottom: 8,
    borderWidth: 1,
    borderColor: '#E0E0E0',
  },
  exampleText: {
    flex: 1,
    fontSize: 14,
    color: '#2C2C2C',
    marginLeft: 8,
  },
  // Duration selector styles
  durationSelector: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  durationOption: {
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderWidth: 1,
    borderColor: '#E0E0E0',
    borderRadius: 20,
    backgroundColor: '#FFFFFF',
  },
  durationOptionActive: {
    backgroundColor: '#2196F3',
    borderColor: '#2196F3',
  },
  durationText: {
    fontSize: 14,
    fontWeight: '500',
    color: '#2C2C2C',
  },
  durationTextActive: {
    color: '#FFFFFF',
  },
  // Task type selector styles
  taskTypeSelector: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  taskTypeChip: {
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderWidth: 1,
    borderColor: '#E0E0E0',
    borderRadius: 20,
    backgroundColor: '#FFFFFF',
  },
  taskTypeChipActive: {
    backgroundColor: '#9C27B0',
    borderColor: '#9C27B0',
  },
  taskTypeText: {
    fontSize: 14,
    fontWeight: '500',
    color: '#2C2C2C',
  },
  taskTypeTextActive: {
    color: '#FFFFFF',
  },
});

export default CreateHelpPostScreen;
