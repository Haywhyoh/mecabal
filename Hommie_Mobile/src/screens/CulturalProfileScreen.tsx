import React, { useState } from 'react';
import { View, Text, StyleSheet, ScrollView, SafeAreaView, TouchableOpacity, Modal, FlatList } from 'react-native';
import MaterialCommunityIcons from '@expo/vector-icons/MaterialCommunityIcons';
import { 
  NIGERIAN_STATES, 
  NIGERIAN_LANGUAGES, 
  CULTURAL_BACKGROUNDS, 
  PROFESSIONAL_TITLES,
  VERIFICATION_BADGES
} from '../constants/nigerianData';
import { useNavigation } from '@react-navigation/native';

interface CulturalProfile {
  stateOfOrigin?: string;
  languages: string[];
  culturalBackground?: string;
  professionalTitle?: string;
  showStateOnProfile: boolean;
  showLanguagesOnProfile: boolean;
  showCultureOnProfile: boolean;
  showProfessionOnProfile: boolean;
}

export default function CulturalProfileScreen() {
  const [profile, setProfile] = useState<CulturalProfile>({
    stateOfOrigin: 'lagos',
    languages: ['english', 'yoruba'],
    culturalBackground: 'yoruba',
    professionalTitle: 'Software Developer',
    showStateOnProfile: true,
    showLanguagesOnProfile: true,
    showCultureOnProfile: false,
    showProfessionOnProfile: true,
  });

  const navigation = useNavigation();


  const [showStateModal, setShowStateModal] = useState(false);
  const [showLanguageModal, setShowLanguageModal] = useState(false);
  const [showCultureModal, setShowCultureModal] = useState(false);
  const [showProfessionModal, setShowProfessionModal] = useState(false);

  const getSelectedState = () => {
    return NIGERIAN_STATES.find(state => state.id === profile.stateOfOrigin);
  };

  const getSelectedLanguages = () => {
    return NIGERIAN_LANGUAGES.filter(lang => profile.languages.includes(lang.id));
  };

  const getSelectedCulture = () => {
    return CULTURAL_BACKGROUNDS.find(culture => culture.id === profile.culturalBackground);
  };

  const handleStateSelect = (stateId: string) => {
    setProfile(prev => ({ ...prev, stateOfOrigin: stateId }));
    setShowStateModal(false);
  };

  const handleGoBack = () => {
      navigation.goBack();
  };

  const handleLanguageToggle = (languageId: string) => {
    setProfile(prev => ({
      ...prev,
      languages: prev.languages.includes(languageId)
        ? prev.languages.filter(id => id !== languageId)
        : [...prev.languages, languageId]
    }));
  };

  const handleCultureSelect = (cultureId: string) => {
    setProfile(prev => ({ ...prev, culturalBackground: cultureId }));
    setShowCultureModal(false);
  };

  const handleProfessionSelect = (profession: string) => {
    setProfile(prev => ({ ...prev, professionalTitle: profession }));
    setShowProfessionModal(false);
  };

  const toggleVisibility = (field: keyof CulturalProfile) => {
    setProfile(prev => ({ ...prev, [field]: !prev[field] }));
  };

  const renderStateModal = () => (
    <Modal visible={showStateModal} animationType="slide" presentationStyle="pageSheet">
      <SafeAreaView style={styles.modalContainer}>
        <View style={styles.modalHeader}>
          <TouchableOpacity onPress={() => setShowStateModal(false)}>
            <Text style={styles.cancelText}>Cancel</Text>
          </TouchableOpacity>
          <Text style={styles.modalTitle}>State of Origin</Text>
          <TouchableOpacity onPress={() => setShowStateModal(false)}>
            <Text style={styles.doneText}>Done</Text>
          </TouchableOpacity>
        </View>
        
        <FlatList
          data={NIGERIAN_STATES}
          keyExtractor={(item) => item.id}
          renderItem={({ item }) => (
            <TouchableOpacity
              style={[
                styles.modalItem,
                profile.stateOfOrigin === item.id && styles.selectedItem
              ]}
              onPress={() => handleStateSelect(item.id)}
            >
              <View style={styles.modalItemContent}>
                <Text style={styles.modalItemTitle}>{item.name}</Text>
                <Text style={styles.modalItemSubtitle}>{item.region} • {item.capital}</Text>
              </View>
              {profile.stateOfOrigin === item.id && (
                <MaterialCommunityIcons name="check" size={20} color="#00A651" />
              )}
            </TouchableOpacity>
          )}
        />
      </SafeAreaView>
    </Modal>
  );

  const renderLanguageModal = () => (
    <Modal visible={showLanguageModal} animationType="slide" presentationStyle="pageSheet">
      <SafeAreaView style={styles.modalContainer}>
        <View style={styles.modalHeader}>
          <TouchableOpacity onPress={() => setShowLanguageModal(false)}>
            <Text style={styles.cancelText}>Cancel</Text>
          </TouchableOpacity>
          <Text style={styles.modalTitle}>Languages</Text>
          <TouchableOpacity onPress={() => setShowLanguageModal(false)}>
            <Text style={styles.doneText}>Done</Text>
          </TouchableOpacity>
        </View>
        
        <Text style={styles.modalSubtitle}>Select all languages you speak</Text>
        
        <FlatList
          data={NIGERIAN_LANGUAGES}
          keyExtractor={(item) => item.id}
          renderItem={({ item }) => (
            <TouchableOpacity
              style={styles.modalItem}
              onPress={() => handleLanguageToggle(item.id)}
            >
              <View style={styles.modalItemContent}>
                <Text style={styles.modalItemTitle}>{item.name}</Text>
                <Text style={styles.modalItemSubtitle}>
                  {item.nativeName} • "{item.greeting}" • {item.description}
                </Text>
              </View>
              <View style={styles.checkbox}>
                {profile.languages.includes(item.id) && (
                  <MaterialCommunityIcons name="check" size={16} color="#00A651" />
                )}
              </View>
            </TouchableOpacity>
          )}
        />
      </SafeAreaView>
    </Modal>
  );

  const renderCultureModal = () => (
    <Modal visible={showCultureModal} animationType="slide" presentationStyle="pageSheet">
      <SafeAreaView style={styles.modalContainer}>
        <View style={styles.modalHeader}>
          <TouchableOpacity onPress={() => setShowCultureModal(false)}>
            <Text style={styles.cancelText}>Cancel</Text>
          </TouchableOpacity>
          <Text style={styles.modalTitle}>Cultural Background</Text>
          <TouchableOpacity onPress={() => setShowCultureModal(false)}>
            <Text style={styles.doneText}>Done</Text>
          </TouchableOpacity>
        </View>
        
        <Text style={styles.modalSubtitle}>Optional: Share your cultural heritage</Text>
        
        <FlatList
          data={CULTURAL_BACKGROUNDS}
          keyExtractor={(item) => item.id}
          renderItem={({ item }) => (
            <TouchableOpacity
              style={[
                styles.modalItem,
                profile.culturalBackground === item.id && styles.selectedItem
              ]}
              onPress={() => handleCultureSelect(item.id)}
            >
              <View style={styles.modalItemContent}>
                <Text style={styles.modalItemTitle}>{item.name}</Text>
                {item.region && <Text style={styles.modalItemSubtitle}>{item.region}</Text>}
              </View>
              {profile.culturalBackground === item.id && (
                <MaterialCommunityIcons name="check" size={20} color="#00A651" />
              )}
            </TouchableOpacity>
          )}
        />
      </SafeAreaView>
    </Modal>
  );

  const renderProfessionModal = () => {
    const groupedProfessions = PROFESSIONAL_TITLES.reduce((acc, profession) => {
      if (!acc[profession.category]) {
        acc[profession.category] = [];
      }
      acc[profession.category].push(profession);
      return acc;
    }, {} as Record<string, typeof PROFESSIONAL_TITLES>);

    return (
      <Modal visible={showProfessionModal} animationType="slide" presentationStyle="pageSheet">
        <SafeAreaView style={styles.modalContainer}>
          <View style={styles.modalHeader}>
            <TouchableOpacity onPress={() => setShowProfessionModal(false)}>
              <Text style={styles.cancelText}>Cancel</Text>
            </TouchableOpacity>
            <Text style={styles.modalTitle}>Profession</Text>
            <TouchableOpacity onPress={() => setShowProfessionModal(false)}>
              <Text style={styles.doneText}>Done</Text>
            </TouchableOpacity>
          </View>
          
          <ScrollView style={styles.modalScrollView}>
            {Object.entries(groupedProfessions).map(([category, professions]) => (
              <View key={category} style={styles.professionCategory}>
                <Text style={styles.categoryTitle}>{category}</Text>
                {professions.map((profession) => (
                  <TouchableOpacity
                    key={profession.title}
                    style={[
                      styles.modalItem,
                      profile.professionalTitle === profession.title && styles.selectedItem
                    ]}
                    onPress={() => handleProfessionSelect(profession.title)}
                  >
                    <Text style={styles.modalItemTitle}>{profession.title}</Text>
                    {profile.professionalTitle === profession.title && (
                      <MaterialCommunityIcons name="check" size={20} color="#00A651" />
                    )}
                  </TouchableOpacity>
                ))}
              </View>
            ))}
          </ScrollView>
        </SafeAreaView>
      </Modal>
    );
  };

  return (
    <SafeAreaView style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity style={styles.backButton} onPress={handleGoBack}>
          <MaterialCommunityIcons name="arrow-left" size={24} color="#2C2C2C" />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Cultural Profile</Text>
        <TouchableOpacity>
          <Text style={styles.saveText}>Save</Text>
        </TouchableOpacity>
      </View>

      <ScrollView style={styles.scrollView} showsVerticalScrollIndicator={false}>
        {/* Introduction */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Nigerian Identity</Text>
          <Text style={styles.sectionDescription}>
            Share your Nigerian heritage and connect with neighbors who understand your background. 
            All information is optional and you control what appears on your profile.
          </Text>
        </View>

        {/* State of Origin */}
        <View style={styles.section}>
          <TouchableOpacity style={styles.profileItem} onPress={() => setShowStateModal(true)}>
            <View style={styles.profileItemLeft}>
              <MaterialCommunityIcons name="map" size={20} color="#00A651" />
              <View style={styles.profileItemText}>
                <Text style={styles.profileItemTitle}>State of Origin</Text>
                <Text style={styles.profileItemValue}>
                  {getSelectedState()?.name || 'Select your state'}
                </Text>
              </View>
            </View>
            <MaterialCommunityIcons name="chevron-right" size={20} color="#8E8E8E" />
          </TouchableOpacity>
          
          <View style={styles.visibilityControl}>
            <Text style={styles.visibilityLabel}>Show on profile</Text>
            <TouchableOpacity
              style={styles.visibilityToggle}
              onPress={() => toggleVisibility('showStateOnProfile')}
            >
              <View style={[styles.switch, profile.showStateOnProfile && styles.switchOn]}>
                <View style={styles.switchThumb} />
              </View>
            </TouchableOpacity>
          </View>
        </View>

        {/* Languages */}
        <View style={styles.section}>
          <TouchableOpacity style={styles.profileItem} onPress={() => setShowLanguageModal(true)}>
            <View style={styles.profileItemLeft}>
              <MaterialCommunityIcons name="translate" size={20} color="#0066CC" />
              <View style={styles.profileItemText}>
                <Text style={styles.profileItemTitle}>Languages</Text>
                <Text style={styles.profileItemValue}>
                  {getSelectedLanguages().map(lang => lang.name).join(', ') || 'Select languages'}
                </Text>
              </View>
            </View>
            <MaterialCommunityIcons name="chevron-right" size={20} color="#8E8E8E" />
          </TouchableOpacity>
          
          <View style={styles.languageGreetings}>
            {getSelectedLanguages().map(lang => (
              <View key={lang.id} style={styles.greetingChip}>
                <Text style={styles.greetingText}>"{lang.greeting}" - {lang.name}</Text>
              </View>
            ))}
          </View>
          
          <View style={styles.visibilityControl}>
            <Text style={styles.visibilityLabel}>Show on profile</Text>
            <TouchableOpacity
              style={styles.visibilityToggle}
              onPress={() => toggleVisibility('showLanguagesOnProfile')}
            >
              <View style={[styles.switch, profile.showLanguagesOnProfile && styles.switchOn]}>
                <View style={styles.switchThumb} />
              </View>
            </TouchableOpacity>
          </View>
        </View>

        {/* Cultural Background */}
        <View style={styles.section}>
          <TouchableOpacity style={styles.profileItem} onPress={() => setShowCultureModal(true)}>
            <View style={styles.profileItemLeft}>
              <MaterialCommunityIcons name="account-group" size={20} color="#7B68EE" />
              <View style={styles.profileItemText}>
                <Text style={styles.profileItemTitle}>Cultural Background</Text>
                <Text style={styles.profileItemValue}>
                  {getSelectedCulture()?.name || 'Optional - Select background'}
                </Text>
              </View>
            </View>
            <MaterialCommunityIcons name="chevron-right" size={20} color="#8E8E8E" />
          </TouchableOpacity>
          
          <View style={styles.visibilityControl}>
            <Text style={styles.visibilityLabel}>Show on profile</Text>
            <TouchableOpacity
              style={styles.visibilityToggle}
              onPress={() => toggleVisibility('showCultureOnProfile')}
            >
              <View style={[styles.switch, profile.showCultureOnProfile && styles.switchOn]}>
                <View style={styles.switchThumb} />
              </View>
            </TouchableOpacity>
          </View>
        </View>

        {/* Professional Title */}
        <View style={styles.section}>
          <TouchableOpacity style={styles.profileItem} onPress={() => setShowProfessionModal(true)}>
            <View style={styles.profileItemLeft}>
              <MaterialCommunityIcons name="briefcase" size={20} color="#FF6B35" />
              <View style={styles.profileItemText}>
                <Text style={styles.profileItemTitle}>Profession</Text>
                <Text style={styles.profileItemValue}>
                  {profile.professionalTitle || 'Select your profession'}
                </Text>
              </View>
            </View>
            <MaterialCommunityIcons name="chevron-right" size={20} color="#8E8E8E" />
          </TouchableOpacity>
          
          <View style={styles.visibilityControl}>
            <Text style={styles.visibilityLabel}>Show on profile</Text>
            <TouchableOpacity
              style={styles.visibilityToggle}
              onPress={() => toggleVisibility('showProfessionOnProfile')}
            >
              <View style={[styles.switch, profile.showProfessionOnProfile && styles.switchOn]}>
                <View style={styles.switchThumb} />
              </View>
            </TouchableOpacity>
          </View>
        </View>

        {/* Verification Badges */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Your Verification Badges</Text>
          <Text style={styles.sectionDescription}>
            Badges you've earned based on your profile and community activity.
          </Text>
          
          <View style={styles.badgeGrid}>
            {VERIFICATION_BADGES.slice(0, 4).map(badge => (
              <View key={badge.id} style={styles.badgeCard}>
                <MaterialCommunityIcons name={badge.icon as any} size={24} color={badge.color} />
                <Text style={styles.badgeName}>{badge.name}</Text>
                <Text style={styles.badgeDescription}>{badge.description}</Text>
              </View>
            ))}
          </View>
        </View>

        {/* Profile Preview */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Profile Preview</Text>
          <Text style={styles.sectionDescription}>
            This is how your cultural information will appear to neighbors.
          </Text>
          
          <View style={styles.previewCard}>
            <View style={styles.previewHeader}>
              <View style={styles.previewAvatar}>
                <Text style={styles.previewAvatarText}>A</Text>
              </View>
              <View style={styles.previewInfo}>
                <Text style={styles.previewName}>Adebayo Ogundimu</Text>
                {profile.showStateOnProfile && getSelectedState() && (
                  <Text style={styles.previewDetail}>📍 From {getSelectedState()?.name} State</Text>
                )}
                {profile.showProfessionOnProfile && profile.professionalTitle && (
                  <Text style={styles.previewDetail}>💼 {profile.professionalTitle}</Text>
                )}
                {profile.showLanguagesOnProfile && profile.languages.length > 0 && (
                  <Text style={styles.previewDetail}>
                    🗣️ Speaks {getSelectedLanguages().map(l => l.name).join(', ')}
                  </Text>
                )}
                {profile.showCultureOnProfile && getSelectedCulture() && (
                  <Text style={styles.previewDetail}>🏛️ {getSelectedCulture()?.name} heritage</Text>
                )}
              </View>
            </View>
          </View>
        </View>
      </ScrollView>

      {renderStateModal()}
      {renderLanguageModal()}
      {renderCultureModal()}
      {renderProfessionModal()}
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
  saveText: {
    fontSize: 16,
    color: '#00A651',
    fontWeight: '600',
    paddingHorizontal: 8,
  },
  scrollView: {
    flex: 1,
  },
  section: {
    backgroundColor: '#FFFFFF',
    marginTop: 12,
    paddingVertical: 20,
    paddingHorizontal: 16,
  },
  sectionTitle: {
    fontSize: 20,
    fontWeight: '700',
    color: '#2C2C2C',
    marginBottom: 8,
  },
  sectionDescription: {
    fontSize: 14,
    color: '#8E8E8E',
    lineHeight: 20,
    marginBottom: 16,
  },
  profileItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#F5F5F5',
  },
  profileItemLeft: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
  },
  profileItemText: {
    flex: 1,
    marginLeft: 12,
  },
  profileItemTitle: {
    fontSize: 16,
    fontWeight: '500',
    color: '#2C2C2C',
    marginBottom: 2,
  },
  profileItemValue: {
    fontSize: 14,
    color: '#8E8E8E',
  },
  visibilityControl: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingTop: 12,
  },
  visibilityLabel: {
    fontSize: 14,
    color: '#8E8E8E',
  },
  visibilityToggle: {
    marginLeft: 16,
  },
  switch: {
    width: 44,
    height: 24,
    borderRadius: 12,
    backgroundColor: '#E0E0E0',
    padding: 2,
    justifyContent: 'center',
  },
  switchOn: {
    backgroundColor: '#00A651',
    alignItems: 'flex-end',
  },
  switchThumb: {
    width: 20,
    height: 20,
    borderRadius: 10,
    backgroundColor: '#FFFFFF',
    shadowColor: '#000000',
    shadowOpacity: 0.2,
    shadowRadius: 2,
    shadowOffset: { width: 0, height: 1 },
    elevation: 2,
  },
  languageGreetings: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    marginBottom: 8,
  },
  greetingChip: {
    backgroundColor: '#E8F5E8',
    paddingVertical: 4,
    paddingHorizontal: 8,
    borderRadius: 12,
    marginRight: 8,
    marginBottom: 4,
  },
  greetingText: {
    fontSize: 12,
    color: '#00A651',
    fontWeight: '500',
  },
  badgeGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    marginTop: 8,
  },
  badgeCard: {
    width: '48%',
    backgroundColor: '#FAFAFA',
    padding: 12,
    borderRadius: 8,
    marginRight: '4%',
    marginBottom: 8,
    alignItems: 'center',
  },
  badgeName: {
    fontSize: 12,
    fontWeight: '600',
    color: '#2C2C2C',
    marginTop: 4,
    marginBottom: 2,
    textAlign: 'center',
  },
  badgeDescription: {
    fontSize: 10,
    color: '#8E8E8E',
    textAlign: 'center',
  },
  previewCard: {
    backgroundColor: '#FAFAFA',
    borderRadius: 12,
    padding: 16,
  },
  previewHeader: {
    flexDirection: 'row',
    alignItems: 'flex-start',
  },
  previewAvatar: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: '#00A651',
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 12,
  },
  previewAvatarText: {
    fontSize: 20,
    fontWeight: '700',
    color: '#FFFFFF',
  },
  previewInfo: {
    flex: 1,
  },
  previewName: {
    fontSize: 16,
    fontWeight: '600',
    color: '#2C2C2C',
    marginBottom: 4,
  },
  previewDetail: {
    fontSize: 14,
    color: '#8E8E8E',
    marginBottom: 2,
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
  doneText: {
    fontSize: 16,
    color: '#00A651',
    fontWeight: '600',
    minWidth: 60,
    textAlign: 'right',
  },
  modalSubtitle: {
    fontSize: 14,
    color: '#8E8E8E',
    textAlign: 'center',
    padding: 16,
  },
  modalScrollView: {
    flex: 1,
  },
  modalItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#F5F5F5',
  },
  selectedItem: {
    backgroundColor: '#E8F5E8',
  },
  modalItemContent: {
    flex: 1,
  },
  modalItemTitle: {
    fontSize: 16,
    fontWeight: '500',
    color: '#2C2C2C',
    marginBottom: 2,
  },
  modalItemSubtitle: {
    fontSize: 14,
    color: '#8E8E8E',
  },
  checkbox: {
    width: 20,
    height: 20,
    borderRadius: 4,
    borderWidth: 2,
    borderColor: '#E0E0E0',
    alignItems: 'center',
    justifyContent: 'center',
  },
  professionCategory: {
    marginBottom: 24,
  },
  categoryTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#2C2C2C',
    paddingHorizontal: 16,
    paddingVertical: 12,
    backgroundColor: '#F5F5F5',
  },
});