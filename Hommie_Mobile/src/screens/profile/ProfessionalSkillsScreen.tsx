import React, { useState } from 'react';
import { View, Text, StyleSheet, ScrollView, SafeAreaView, TouchableOpacity, TextInput, Modal, Alert } from 'react-native';
import MaterialCommunityIcons from '@expo/vector-icons/MaterialCommunityIcons';
import { BUSINESS_CATEGORIES } from '../constants/businessData';

interface Skill {
  id: string;
  name: string;
  category: string;
  level: 'beginner' | 'intermediate' | 'advanced' | 'expert';
  yearsExperience: number;
  description?: string;
  certifications: string[];
  isVerified: boolean;
  verificationSource?: string;
}

interface SkillCategory {
  id: string;
  name: string;
  icon: string;
  color: string;
  skills: string[];
}

const SKILL_CATEGORIES: SkillCategory[] = [
  {
    id: 'technical',
    name: 'Technical Skills',
    icon: 'laptop',
    color: '#7B68EE',
    skills: [
      'Plumbing Installation', 'Electrical Wiring', 'Air Conditioning Repair', 'Solar Panel Installation',
      'Computer Repair', 'Network Setup', 'CCTV Installation', 'Web Development', 'Mobile App Development'
    ]
  },
  {
    id: 'creative',
    name: 'Creative Services',
    icon: 'palette',
    color: '#FF69B4',
    skills: [
      'Photography', 'Videography', 'Graphic Design', 'Event Planning', 'Interior Design',
      'Music Production', 'DJ Services', 'Content Writing', 'Social Media Management'
    ]
  },
  {
    id: 'professional',
    name: 'Professional Services',
    icon: 'briefcase',
    color: '#0066CC',
    skills: [
      'Legal Consulting', 'Tax Preparation', 'Financial Planning', 'Real Estate', 'Insurance',
      'Business Consulting', 'Project Management', 'HR Consulting', 'Marketing Strategy'
    ]
  },
  {
    id: 'health',
    name: 'Health & Wellness',
    icon: 'medical-bag',
    color: '#228B22',
    skills: [
      'Fitness Training', 'Massage Therapy', 'Nutrition Counseling', 'Mental Health Counseling',
      'Physiotherapy', 'Nursing Care', 'First Aid Training', 'Yoga Instruction', 'Life Coaching'
    ]
  },
  {
    id: 'education',
    name: 'Education & Training',
    icon: 'school',
    color: '#E74C3C',
    skills: [
      'Mathematics Tutoring', 'English Tutoring', 'Computer Training', 'Language Teaching',
      'Music Lessons', 'Art Classes', 'Professional Training', 'Exam Preparation', 'Skills Development'
    ]
  },
  {
    id: 'trades',
    name: 'Trade Services',
    icon: 'hammer',
    color: '#FF6B35',
    skills: [
      'Carpentry', 'Painting', 'Tiling', 'Roofing', 'Welding', 'Masonry',
      'Landscaping', 'Pest Control', 'Cleaning Services', 'Security Services'
    ]
  }
];

const SKILL_LEVELS = [
  { id: 'beginner', name: 'Beginner', description: '0-1 years', color: '#FFC107' },
  { id: 'intermediate', name: 'Intermediate', description: '1-3 years', color: '#FF6B35' },
  { id: 'advanced', name: 'Advanced', description: '3-7 years', color: '#00A651' },
  { id: 'expert', name: 'Expert', description: '7+ years', color: '#0066CC' }
];

export default function ProfessionalSkillsScreen() {
  const [userSkills, setUserSkills] = useState<Skill[]>([
    {
      id: '1',
      name: 'Plumbing Installation',
      category: 'technical',
      level: 'advanced',
      yearsExperience: 5,
      description: 'Specialized in residential plumbing systems, pipe installation, and leak repairs.',
      certifications: ['Lagos State Plumber License', 'Water System Installation Certificate'],
      isVerified: true,
      verificationSource: 'Lagos State Ministry of Works'
    },
    {
      id: '2',
      name: 'Electrical Wiring',
      category: 'technical',
      level: 'intermediate',
      yearsExperience: 3,
      description: 'Home electrical installations and repair services.',
      certifications: ['Basic Electrical Certificate'],
      isVerified: false
    },
    {
      id: '3',
      name: 'Customer Service',
      category: 'professional',
      level: 'expert',
      yearsExperience: 8,
      description: 'Excellent communication and problem-solving skills.',
      certifications: [],
      isVerified: true,
      verificationSource: 'Community Reviews'
    }
  ]);

  const [showAddSkillModal, setShowAddSkillModal] = useState(false);
  const [showEditModal, setShowEditModal] = useState(false);
  const [selectedSkill, setSelectedSkill] = useState<Skill | null>(null);
  const [selectedCategory, setSelectedCategory] = useState<string>('');
  const [showCategoryModal, setShowCategoryModal] = useState(false);
  const [showSkillListModal, setShowSkillListModal] = useState(false);

  // New skill form state
  const [newSkill, setNewSkill] = useState({
    name: '',
    category: '',
    level: 'beginner' as const,
    yearsExperience: 0,
    description: '',
    certifications: [] as string[]
  });

  const handleAddSkill = () => {
    setNewSkill({
      name: '',
      category: '',
      level: 'beginner',
      yearsExperience: 0,
      description: '',
      certifications: []
    });
    setShowAddSkillModal(true);
  };

  const handleEditSkill = (skill: Skill) => {
    setSelectedSkill(skill);
    setShowEditModal(true);
  };

  const handleDeleteSkill = (skillId: string) => {
    Alert.alert(
      'Delete Skill',
      'Are you sure you want to remove this skill from your profile?',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Delete',
          style: 'destructive',
          onPress: () => {
            setUserSkills(prev => prev.filter(skill => skill.id !== skillId));
          }
        }
      ]
    );
  };

  const handleSaveNewSkill = () => {
    if (!newSkill.name || !newSkill.category) {
      Alert.alert('Missing Information', 'Please fill in skill name and category.');
      return;
    }

    const skill: Skill = {
      id: Date.now().toString(),
      name: newSkill.name,
      category: newSkill.category,
      level: newSkill.level,
      yearsExperience: newSkill.yearsExperience,
      description: newSkill.description,
      certifications: newSkill.certifications,
      isVerified: false
    };

    setUserSkills(prev => [...prev, skill]);
    setShowAddSkillModal(false);
  };

  const handleRequestVerification = (skillId: string) => {
    Alert.alert(
      'Request Verification',
      'Submit skill for community verification? Verified neighbors or local authorities will review your skill.',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Submit',
          onPress: () => {
            Alert.alert('Verification Submitted', 'Your skill has been submitted for verification. You\'ll be notified once reviewed.');
          }
        }
      ]
    );
  };

  const getSkillsByCategory = (categoryId: string) => {
    return userSkills.filter(skill => skill.category === categoryId);
  };

  const getSkillCategory = (categoryId: string) => {
    return SKILL_CATEGORIES.find(cat => cat.id === categoryId);
  };

  const getSkillLevel = (level: string) => {
    return SKILL_LEVELS.find(l => l.id === level);
  };

  const renderSkillCard = (skill: Skill) => {
    const category = getSkillCategory(skill.category);
    const level = getSkillLevel(skill.level);

    return (
      <View key={skill.id} style={styles.skillCard}>
        <View style={styles.skillHeader}>
          <View style={styles.skillTitleSection}>
            <Text style={styles.skillName}>{skill.name}</Text>
            <View style={styles.skillMeta}>
              <View style={[styles.levelBadge, { backgroundColor: level?.color + '20' }]}>
                <Text style={[styles.levelText, { color: level?.color }]}>{level?.name}</Text>
              </View>
              <Text style={styles.experienceText}>{skill.yearsExperience} years</Text>
            </View>
          </View>
          
          <View style={styles.skillActions}>
            {skill.isVerified ? (
              <View style={styles.verifiedBadge}>
                <MaterialCommunityIcons name="check-decagram" size={16} color="#00A651" />
                <Text style={styles.verifiedText}>Verified</Text>
              </View>
            ) : (
              <TouchableOpacity 
                style={styles.verifyButton}
                onPress={() => handleRequestVerification(skill.id)}
              >
                <MaterialCommunityIcons name="shield-check-outline" size={14} color="#0066CC" />
                <Text style={styles.verifyText}>Verify</Text>
              </TouchableOpacity>
            )}
            
            <TouchableOpacity onPress={() => handleEditSkill(skill)} style={styles.actionButton}>
              <MaterialCommunityIcons name="pencil" size={16} color="#8E8E8E" />
            </TouchableOpacity>
            
            <TouchableOpacity onPress={() => handleDeleteSkill(skill.id)} style={styles.actionButton}>
              <MaterialCommunityIcons name="delete" size={16} color="#E74C3C" />
            </TouchableOpacity>
          </View>
        </View>

        {skill.description && (
          <Text style={styles.skillDescription}>{skill.description}</Text>
        )}

        {skill.certifications.length > 0 && (
          <View style={styles.certificationsSection}>
            <Text style={styles.certificationsTitle}>Certifications:</Text>
            {skill.certifications.map((cert, index) => (
              <View key={index} style={styles.certificationItem}>
                <MaterialCommunityIcons name="certificate" size={12} color="#00A651" />
                <Text style={styles.certificationText}>{cert}</Text>
              </View>
            ))}
          </View>
        )}

        {skill.isVerified && skill.verificationSource && (
          <View style={styles.verificationSource}>
            <MaterialCommunityIcons name="information" size={12} color="#0066CC" />
            <Text style={styles.sourceText}>Verified by {skill.verificationSource}</Text>
          </View>
        )}
      </View>
    );
  };

  const AddSkillModal = () => (
    <Modal visible={showAddSkillModal} animationType="slide" presentationStyle="pageSheet">
      <SafeAreaView style={styles.modalContainer}>
        <View style={styles.modalHeader}>
          <TouchableOpacity onPress={() => setShowAddSkillModal(false)}>
            <Text style={styles.cancelText}>Cancel</Text>
          </TouchableOpacity>
          <Text style={styles.modalTitle}>Add Professional Skill</Text>
          <TouchableOpacity onPress={handleSaveNewSkill}>
            <Text style={styles.saveText}>Save</Text>
          </TouchableOpacity>
        </View>

        <ScrollView style={styles.modalContent}>
          <View style={styles.inputGroup}>
            <Text style={styles.inputLabel}>Skill Name *</Text>
            <TextInput
              style={styles.textInput}
              value={newSkill.name}
              onChangeText={(text) => setNewSkill(prev => ({ ...prev, name: text }))}
              placeholder="e.g., Plumbing Installation"
              placeholderTextColor="#8E8E8E"
            />
          </View>

          <View style={styles.inputGroup}>
            <Text style={styles.inputLabel}>Category *</Text>
            <TouchableOpacity 
              style={styles.selectInput}
              onPress={() => setShowCategoryModal(true)}
            >
              <Text style={[styles.selectText, !newSkill.category && styles.placeholderText]}>
                {getSkillCategory(newSkill.category)?.name || 'Select category'}
              </Text>
              <MaterialCommunityIcons name="chevron-down" size={20} color="#8E8E8E" />
            </TouchableOpacity>
          </View>

          <View style={styles.inputGroup}>
            <Text style={styles.inputLabel}>Skill Level</Text>
            <View style={styles.levelSelector}>
              {SKILL_LEVELS.map((level) => (
                <TouchableOpacity
                  key={level.id}
                  style={[
                    styles.levelOption,
                    newSkill.level === level.id && styles.levelOptionSelected
                  ]}
                  onPress={() => setNewSkill(prev => ({ ...prev, level: level.id as any }))}
                >
                  <View style={[styles.levelIndicator, { backgroundColor: level.color }]} />
                  <View style={styles.levelInfo}>
                    <Text style={styles.levelName}>{level.name}</Text>
                    <Text style={styles.levelDesc}>{level.description}</Text>
                  </View>
                  {newSkill.level === level.id && (
                    <MaterialCommunityIcons name="check" size={20} color="#00A651" />
                  )}
                </TouchableOpacity>
              ))}
            </View>
          </View>

          <View style={styles.inputGroup}>
            <Text style={styles.inputLabel}>Years of Experience</Text>
            <TextInput
              style={styles.textInput}
              value={newSkill.yearsExperience.toString()}
              onChangeText={(text) => setNewSkill(prev => ({ ...prev, yearsExperience: parseInt(text) || 0 }))}
              placeholder="0"
              placeholderTextColor="#8E8E8E"
              keyboardType="numeric"
            />
          </View>

          <View style={styles.inputGroup}>
            <Text style={styles.inputLabel}>Description (Optional)</Text>
            <TextInput
              style={[styles.textInput, styles.textArea]}
              value={newSkill.description}
              onChangeText={(text) => setNewSkill(prev => ({ ...prev, description: text }))}
              placeholder="Describe your experience and specializations..."
              placeholderTextColor="#8E8E8E"
              multiline
              numberOfLines={3}
            />
          </View>
        </ScrollView>
      </SafeAreaView>
    </Modal>
  );

  const CategoryModal = () => (
    <Modal visible={showCategoryModal} animationType="slide" presentationStyle="pageSheet">
      <SafeAreaView style={styles.modalContainer}>
        <View style={styles.modalHeader}>
          <TouchableOpacity onPress={() => setShowCategoryModal(false)}>
            <Text style={styles.cancelText}>Cancel</Text>
          </TouchableOpacity>
          <Text style={styles.modalTitle}>Select Category</Text>
          <View style={styles.placeholder} />
        </View>

        <ScrollView style={styles.modalContent}>
          {SKILL_CATEGORIES.map((category) => (
            <TouchableOpacity
              key={category.id}
              style={styles.categoryOption}
              onPress={() => {
                setNewSkill(prev => ({ ...prev, category: category.id }));
                setShowCategoryModal(false);
              }}
            >
              <MaterialCommunityIcons name={category.icon as any} size={24} color={category.color} />
              <Text style={styles.categoryName}>{category.name}</Text>
              <MaterialCommunityIcons name="chevron-right" size={20} color="#8E8E8E" />
            </TouchableOpacity>
          ))}
        </ScrollView>
      </SafeAreaView>
    </Modal>
  );

  return (
    <SafeAreaView style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity style={styles.backButton}>
          <MaterialCommunityIcons name="arrow-left" size={24} color="#2C2C2C" />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Professional Skills</Text>
        <TouchableOpacity onPress={handleAddSkill}>
          <MaterialCommunityIcons name="plus" size={24} color="#00A651" />
        </TouchableOpacity>
      </View>

      <ScrollView style={styles.scrollView} showsVerticalScrollIndicator={false}>
        {/* Skills Overview */}
        <View style={styles.overviewCard}>
          <Text style={styles.overviewTitle}>Skills Portfolio</Text>
          <Text style={styles.overviewSubtitle}>Showcase your professional expertise to your community</Text>
          
          <View style={styles.skillsStats}>
            <View style={styles.statItem}>
              <Text style={styles.statNumber}>{userSkills.length}</Text>
              <Text style={styles.statLabel}>Total Skills</Text>
            </View>
            <View style={styles.statDivider} />
            <View style={styles.statItem}>
              <Text style={styles.statNumber}>{userSkills.filter(s => s.isVerified).length}</Text>
              <Text style={styles.statLabel}>Verified</Text>
            </View>
            <View style={styles.statDivider} />
            <View style={styles.statItem}>
              <Text style={styles.statNumber}>{SKILL_CATEGORIES.length}</Text>
              <Text style={styles.statLabel}>Categories</Text>
            </View>
          </View>
        </View>

        {/* Skills by Category */}
        {SKILL_CATEGORIES.map((category) => {
          const categorySkills = getSkillsByCategory(category.id);
          if (categorySkills.length === 0) return null;

          return (
            <View key={category.id} style={styles.categorySection}>
              <View style={styles.categoryHeader}>
                <MaterialCommunityIcons name={category.icon as any} size={20} color={category.color} />
                <Text style={styles.categoryTitle}>{category.name}</Text>
                <Text style={styles.skillCount}>({categorySkills.length})</Text>
              </View>
              
              {categorySkills.map(renderSkillCard)}
            </View>
          );
        })}

        {userSkills.length === 0 && (
          <View style={styles.emptyState}>
            <MaterialCommunityIcons name="briefcase-outline" size={64} color="#8E8E8E" />
            <Text style={styles.emptyTitle}>No Skills Added Yet</Text>
            <Text style={styles.emptySubtitle}>
              Add your professional skills to showcase your expertise to neighbors and potential clients.
            </Text>
            <TouchableOpacity style={styles.addFirstSkillButton} onPress={handleAddSkill}>
              <Text style={styles.addFirstSkillText}>Add Your First Skill</Text>
            </TouchableOpacity>
          </View>
        )}
      </ScrollView>

      <AddSkillModal />
      <CategoryModal />
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#FAFAFA',
  },
  header: {
    backgroundColor: '#FFFFFF',
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingTop: 8,
    paddingBottom: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#F0F0F0',
  },
  backButton: {
    padding: 8,
    marginRight: 8,
  },
  headerTitle: {
    flex: 1,
    fontSize: 18,
    fontWeight: '600',
    color: '#2C2C2C',
    textAlign: 'center',
  },
  scrollView: {
    flex: 1,
  },
  overviewCard: {
    backgroundColor: '#FFFFFF',
    margin: 16,
    padding: 20,
    borderRadius: 12,
    shadowColor: '#000000',
    shadowOpacity: 0.05,
    shadowRadius: 8,
    shadowOffset: { width: 0, height: 2 },
    elevation: 2,
  },
  overviewTitle: {
    fontSize: 20,
    fontWeight: '700',
    color: '#2C2C2C',
    marginBottom: 4,
  },
  overviewSubtitle: {
    fontSize: 14,
    color: '#8E8E8E',
    marginBottom: 20,
  },
  skillsStats: {
    flexDirection: 'row',
    justifyContent: 'space-around',
  },
  statItem: {
    alignItems: 'center',
  },
  statNumber: {
    fontSize: 24,
    fontWeight: '700',
    color: '#00A651',
    marginBottom: 4,
  },
  statLabel: {
    fontSize: 12,
    color: '#8E8E8E',
  },
  statDivider: {
    width: 1,
    backgroundColor: '#F0F0F0',
    marginHorizontal: 16,
  },
  categorySection: {
    backgroundColor: '#FFFFFF',
    marginHorizontal: 16,
    marginBottom: 16,
    borderRadius: 12,
    padding: 16,
    shadowColor: '#000000',
    shadowOpacity: 0.05,
    shadowRadius: 8,
    shadowOffset: { width: 0, height: 2 },
    elevation: 2,
  },
  categoryHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 16,
  },
  categoryTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#2C2C2C',
    marginLeft: 8,
    flex: 1,
  },
  skillCount: {
    fontSize: 12,
    color: '#8E8E8E',
  },
  skillCard: {
    backgroundColor: '#FAFAFA',
    padding: 16,
    borderRadius: 8,
    marginBottom: 12,
  },
  skillHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 8,
  },
  skillTitleSection: {
    flex: 1,
  },
  skillName: {
    fontSize: 16,
    fontWeight: '600',
    color: '#2C2C2C',
    marginBottom: 6,
  },
  skillMeta: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  levelBadge: {
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 12,
    marginRight: 8,
  },
  levelText: {
    fontSize: 10,
    fontWeight: '600',
  },
  experienceText: {
    fontSize: 12,
    color: '#8E8E8E',
  },
  skillActions: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  verifiedBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#E8F5E8',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 12,
    marginRight: 8,
  },
  verifiedText: {
    fontSize: 10,
    color: '#00A651',
    fontWeight: '600',
    marginLeft: 4,
  },
  verifyButton: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#F0F8FF',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 12,
    marginRight: 8,
  },
  verifyText: {
    fontSize: 10,
    color: '#0066CC',
    fontWeight: '600',
    marginLeft: 4,
  },
  actionButton: {
    padding: 4,
    marginLeft: 4,
  },
  skillDescription: {
    fontSize: 14,
    color: '#2C2C2C',
    lineHeight: 20,
    marginBottom: 8,
  },
  certificationsSection: {
    marginBottom: 8,
  },
  certificationsTitle: {
    fontSize: 12,
    fontWeight: '600',
    color: '#2C2C2C',
    marginBottom: 4,
  },
  certificationItem: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 2,
  },
  certificationText: {
    fontSize: 11,
    color: '#2C2C2C',
    marginLeft: 6,
  },
  verificationSource: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  sourceText: {
    fontSize: 11,
    color: '#0066CC',
    marginLeft: 4,
    fontStyle: 'italic',
  },
  emptyState: {
    alignItems: 'center',
    padding: 40,
    backgroundColor: '#FFFFFF',
    margin: 16,
    borderRadius: 12,
  },
  emptyTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#2C2C2C',
    marginTop: 16,
    marginBottom: 8,
  },
  emptySubtitle: {
    fontSize: 14,
    color: '#8E8E8E',
    textAlign: 'center',
    lineHeight: 20,
    marginBottom: 24,
  },
  addFirstSkillButton: {
    backgroundColor: '#00A651',
    paddingHorizontal: 24,
    paddingVertical: 12,
    borderRadius: 8,
  },
  addFirstSkillText: {
    fontSize: 14,
    fontWeight: '600',
    color: '#FFFFFF',
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
  cancelText: {
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
  saveText: {
    fontSize: 16,
    color: '#00A651',
    fontWeight: '600',
    minWidth: 60,
    textAlign: 'right',
  },
  placeholder: {
    minWidth: 60,
  },
  modalContent: {
    flex: 1,
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
    height: 80,
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
  levelSelector: {
    gap: 8,
  },
  levelOption: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FFFFFF',
    padding: 12,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#E0E0E0',
  },
  levelOptionSelected: {
    borderColor: '#00A651',
    backgroundColor: '#F9FFF9',
  },
  levelIndicator: {
    width: 12,
    height: 12,
    borderRadius: 6,
    marginRight: 12,
  },
  levelInfo: {
    flex: 1,
  },
  levelName: {
    fontSize: 14,
    fontWeight: '600',
    color: '#2C2C2C',
  },
  levelDesc: {
    fontSize: 12,
    color: '#8E8E8E',
  },
  categoryOption: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FFFFFF',
    padding: 16,
    marginBottom: 8,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#F0F0F0',
  },
  categoryName: {
    fontSize: 16,
    color: '#2C2C2C',
    flex: 1,
    marginLeft: 12,
  },
});