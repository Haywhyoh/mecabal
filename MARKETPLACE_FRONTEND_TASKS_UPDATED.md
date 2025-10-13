# Marketplace Frontend Tasks - Comprehensive & Detailed

## Document Overview

This document provides a **comprehensive, detailed, and implementation-ready** task breakdown for the MeCabal mobile app marketplace frontend. After analyzing the current implementation, backend structure, and existing gaps, this document addresses all missing functionality and provides specific implementation guidance.

---

## Executive Summary

### Current State Analysis

**What's Working:**
- ✅ Basic MarketplaceScreen with API-connected listings
- ✅ ListingsService with proper API integration and retry logic
- ✅ CreateListingScreen with image upload functionality
- ✅ TypeScript types matching backend entities
- ✅ Backend has comprehensive listing and business profile entities

**Critical Gaps Identified:**
1. ❌ **ListingDetailsScreen uses mock data** - Not connected to API
2. ❌ **No back button** for marketplace navigation (iOS and Android)
3. ❌ **Missing type-specific fields rendering** in details page
4. ❌ **No business profile integration** for services
5. ❌ **CreateListingScreen lacks dynamic type-specific fields** (services, jobs, properties)
6. ❌ **No service inquiry system** for contacting businesses
7. ❌ **Missing job-specific features** (applications, requirements)
8. ❌ **Incomplete property details rendering** (amenities, utilities, etc.)
9. ❌ **No listing edit/update functionality**
10. ❌ **Missing advanced search and filters**

---

## Phase 1: Critical Bug Fixes & API Integration (Week 1)

### Task 1.1: Add Universal Back Button to MarketplaceScreen
**Priority:** CRITICAL
**Estimated Time:** 2 hours
**File:** `Hommie_Mobile/src/screens/MarketplaceScreen.tsx`

**Problem:**
No back button for both iOS and Android users in marketplace screen.

**Implementation:**
```typescript
// Add to header section (around line 143)
<View style={styles.headerContainer}>
  <View style={styles.header}>
    <TouchableOpacity
      style={styles.backButton}
      onPress={() => navigation?.goBack()}
      activeOpacity={0.7}
      accessible={true}
      accessibilityLabel="Go back"
      accessibilityRole="button"
    >
      <Ionicons
        name={Platform.OS === 'ios' ? 'chevron-back' : 'arrow-back'}
        size={28}
        color={colors.primary}
      />
    </TouchableOpacity>
    <Text style={styles.largeTitle}>Marketplace</Text>
    <TouchableOpacity
      style={styles.viewModeButton}
      onPress={() => setViewMode(viewMode === 'grid' ? 'list' : 'grid')}
      activeOpacity={0.6}
    >
      <Ionicons
        name={viewMode === 'grid' ? 'list-outline' : 'grid-outline'}
        size={22}
        color={colors.primary}
      />
    </TouchableOpacity>
  </View>
  {/* ... rest of header ... */}
</View>

// Add style
backButton: {
  width: 40,
  height: 40,
  alignItems: 'center',
  justifyContent: 'center',
  marginRight: spacing.xs,
},
```

**Acceptance Criteria:**
- [ ] Back button visible on both iOS and Android
- [ ] Uses platform-appropriate icon (chevron-back for iOS, arrow-back for Android)
- [ ] Navigation works correctly
- [ ] Proper accessibility labels
- [ ] Matches existing header design

---

### Task 1.2: Fix ListingDetailsScreen API Integration
**Priority:** CRITICAL
**Estimated Time:** 8 hours
**File:** `Hommie_Mobile/src/screens/ListingDetailsScreen.tsx`

**Problem:**
The details screen currently loads data via API (`getListing(listingId)`) but doesn't properly render all the type-specific fields from the backend.

**Current Issues:**
1. Missing service-specific fields (availability, credentials, response time)
2. Missing job-specific fields (employment type, salary range, skills)
3. Missing enhanced property fields (amenities, utilities, security features)
4. No business profile information display
5. No contact preferences handling

**Implementation Steps:**

#### Step 1: Update TypeScript interfaces to match backend
```typescript
// Ensure Listing interface in listingsService.ts includes:
interface Listing {
  // ... existing fields ...

  // Service fields (from backend entity)
  availabilitySchedule?: {
    days: string[];
    startTime: string;
    endTime: string;
    timezone: string;
  };
  serviceRadius?: number;
  professionalCredentials?: {
    licenses: string[];
    certifications: string[];
    experience: number;
    insurance: boolean;
  };
  pricingModel?: string;
  responseTime?: number;

  // Job fields
  salaryMin?: number;
  salaryMax?: number;
  companyInfo?: {
    name: string;
    size: string;
    industry: string;
    website?: string;
  };

  // Enhanced property fields
  utilitiesIncluded?: string[];
  securityFeatures?: string[];
  landSize?: number;

  // Contact preferences
  contactPreferences?: {
    allowCalls: boolean;
    allowMessages: boolean;
    allowWhatsApp: boolean;
    preferredTime: string;
  };

  // Verification
  verificationStatus: string;
  featured: boolean;
  boosted: boolean;
}
```

#### Step 2: Create type-specific rendering components
```typescript
// Add these rendering functions to ListingDetailsScreen

const renderServiceDetails = () => {
  if (listing.listingType !== 'service') return null;

  return (
    <View style={styles.serviceSection}>
      <Text style={styles.sectionTitle}>Service Details</Text>

      {/* Availability Schedule */}
      {listing.availabilitySchedule && (
        <View style={styles.infoRow}>
          <Ionicons name="calendar-outline" size={20} color={colors.text.light} />
          <Text style={styles.infoLabel}>Available</Text>
          <Text style={styles.infoValue}>
            {listing.availabilitySchedule.days.join(', ')}
          </Text>
        </View>
      )}

      {/* Service Radius */}
      {listing.serviceRadius && (
        <View style={styles.infoRow}>
          <Ionicons name="location-outline" size={20} color={colors.text.light} />
          <Text style={styles.infoLabel}>Service Radius</Text>
          <Text style={styles.infoValue}>{listing.serviceRadius} km</Text>
        </View>
      )}

      {/* Response Time */}
      {listing.responseTime && (
        <View style={styles.infoRow}>
          <Ionicons name="time-outline" size={20} color={colors.text.light} />
          <Text style={styles.infoLabel}>Response Time</Text>
          <Text style={styles.infoValue}>Within {listing.responseTime} hours</Text>
        </View>
      )}

      {/* Professional Credentials */}
      {listing.professionalCredentials && (
        <>
          <Text style={styles.subsectionTitle}>Professional Credentials</Text>

          {listing.professionalCredentials.experience > 0 && (
            <View style={styles.infoRow}>
              <Ionicons name="briefcase-outline" size={20} color={colors.text.light} />
              <Text style={styles.infoLabel}>Experience</Text>
              <Text style={styles.infoValue}>
                {listing.professionalCredentials.experience} years
              </Text>
            </View>
          )}

          {listing.professionalCredentials.licenses.length > 0 && (
            <View style={styles.credentialsList}>
              <Text style={styles.credentialsLabel}>Licenses:</Text>
              {listing.professionalCredentials.licenses.map((license, index) => (
                <View key={index} style={styles.credentialBadge}>
                  <Ionicons name="ribbon-outline" size={16} color={colors.primary} />
                  <Text style={styles.credentialText}>{license}</Text>
                </View>
              ))}
            </View>
          )}

          {listing.professionalCredentials.certifications.length > 0 && (
            <View style={styles.credentialsList}>
              <Text style={styles.credentialsLabel}>Certifications:</Text>
              {listing.professionalCredentials.certifications.map((cert, index) => (
                <View key={index} style={styles.credentialBadge}>
                  <Ionicons name="medal-outline" size={16} color={colors.primary} />
                  <Text style={styles.credentialText}>{cert}</Text>
                </View>
              ))}
            </View>
          )}

          {listing.professionalCredentials.insurance && (
            <View style={styles.insuranceBadge}>
              <Ionicons name="shield-checkmark" size={20} color={colors.success} />
              <Text style={styles.insuranceText}>Insured Professional</Text>
            </View>
          )}
        </>
      )}
    </View>
  );
};

const renderJobDetails = () => {
  if (listing.listingType !== 'job') return null;

  return (
    <View style={styles.jobSection}>
      <Text style={styles.sectionTitle}>Job Details</Text>

      {/* Employment Type */}
      {listing.employmentType && (
        <View style={styles.infoRow}>
          <Ionicons name="briefcase-outline" size={20} color={colors.text.light} />
          <Text style={styles.infoLabel}>Employment Type</Text>
          <Text style={styles.infoValue}>
            {listing.employmentType.replace('_', ' ').toUpperCase()}
          </Text>
        </View>
      )}

      {/* Salary Range */}
      {listing.salaryMin && listing.salaryMax && (
        <View style={styles.infoRow}>
          <Ionicons name="cash-outline" size={20} color={colors.text.light} />
          <Text style={styles.infoLabel}>Salary Range</Text>
          <Text style={styles.infoValue}>
            ₦{listing.salaryMin.toLocaleString()} - ₦{listing.salaryMax.toLocaleString()}
          </Text>
        </View>
      )}

      {/* Work Location */}
      {listing.workLocation && (
        <View style={styles.infoRow}>
          <Ionicons name="location-outline" size={20} color={colors.text.light} />
          <Text style={styles.infoLabel}>Work Location</Text>
          <Text style={styles.infoValue}>
            {listing.workLocation.replace('_', ' ')}
          </Text>
        </View>
      )}

      {/* Application Deadline */}
      {listing.applicationDeadline && (
        <View style={styles.infoRow}>
          <Ionicons name="calendar-outline" size={20} color={colors.text.light} />
          <Text style={styles.infoLabel}>Application Deadline</Text>
          <Text style={styles.infoValue}>
            {formatDate(listing.applicationDeadline)}
          </Text>
        </View>
      )}

      {/* Required Skills */}
      {listing.requiredSkills && listing.requiredSkills.length > 0 && (
        <View style={styles.skillsSection}>
          <Text style={styles.subsectionTitle}>Required Skills</Text>
          <View style={styles.skillsContainer}>
            {listing.requiredSkills.map((skill, index) => (
              <View key={index} style={styles.skillChip}>
                <Text style={styles.skillText}>{skill}</Text>
              </View>
            ))}
          </View>
        </View>
      )}

      {/* Required Experience */}
      {listing.requiredExperience && (
        <View style={styles.infoRow}>
          <Ionicons name="school-outline" size={20} color={colors.text.light} />
          <Text style={styles.infoLabel}>Required Experience</Text>
          <Text style={styles.infoValue}>{listing.requiredExperience}</Text>
        </View>
      )}

      {/* Education */}
      {listing.education && (
        <View style={styles.infoRow}>
          <Ionicons name="book-outline" size={20} color={colors.text.light} />
          <Text style={styles.infoLabel}>Education</Text>
          <Text style={styles.infoValue}>{listing.education}</Text>
        </View>
      )}

      {/* Benefits */}
      {listing.benefits && listing.benefits.length > 0 && (
        <View style={styles.benefitsSection}>
          <Text style={styles.subsectionTitle}>Benefits</Text>
          {listing.benefits.map((benefit, index) => (
            <View key={index} style={styles.benefitItem}>
              <Ionicons name="checkmark-circle" size={18} color={colors.success} />
              <Text style={styles.benefitText}>{benefit}</Text>
            </View>
          ))}
        </View>
      )}

      {/* Company Info */}
      {listing.companyInfo && (
        <View style={styles.companySection}>
          <Text style={styles.subsectionTitle}>About the Company</Text>
          <Text style={styles.companyName}>{listing.companyInfo.name}</Text>
          <View style={styles.companyDetails}>
            <Text style={styles.companyDetailText}>
              Size: {listing.companyInfo.size}
            </Text>
            <Text style={styles.companyDetailText}>
              Industry: {listing.companyInfo.industry}
            </Text>
            {listing.companyInfo.website && (
              <TouchableOpacity
                onPress={() => Linking.openURL(listing.companyInfo.website)}
              >
                <Text style={styles.companyWebsite}>
                  {listing.companyInfo.website}
                </Text>
              </TouchableOpacity>
            )}
          </View>
        </View>
      )}
    </View>
  );
};

const renderEnhancedPropertyDetails = () => {
  if (listing.listingType !== 'property') return null;

  return (
    <View style={styles.propertySection}>
      {/* ... existing property fields ... */}

      {/* Property Size */}
      {listing.propertySize && (
        <View style={styles.infoRow}>
          <Ionicons name="resize-outline" size={20} color={colors.text.light} />
          <Text style={styles.infoLabel}>Property Size</Text>
          <Text style={styles.infoValue}>{listing.propertySize} m²</Text>
        </View>
      )}

      {/* Land Size */}
      {listing.landSize && (
        <View style={styles.infoRow}>
          <Ionicons name="map-outline" size={20} color={colors.text.light} />
          <Text style={styles.infoLabel}>Land Size</Text>
          <Text style={styles.infoValue}>{listing.landSize} m²</Text>
        </View>
      )}

      {/* Parking */}
      {listing.parkingSpaces && (
        <View style={styles.infoRow}>
          <Ionicons name="car-outline" size={20} color={colors.text.light} />
          <Text style={styles.infoLabel}>Parking</Text>
          <Text style={styles.infoValue}>{listing.parkingSpaces} spaces</Text>
        </View>
      )}

      {/* Pet Policy */}
      {listing.petPolicy && (
        <View style={styles.infoRow}>
          <Ionicons name="paw-outline" size={20} color={colors.text.light} />
          <Text style={styles.infoLabel}>Pet Policy</Text>
          <Text style={styles.infoValue}>
            {listing.petPolicy.replace('_', ' ')}
          </Text>
        </View>
      )}

      {/* Amenities */}
      {listing.amenities && listing.amenities.length > 0 && (
        <View style={styles.amenitiesSection}>
          <Text style={styles.subsectionTitle}>Amenities</Text>
          <View style={styles.amenitiesGrid}>
            {listing.amenities.map((amenity, index) => (
              <View key={index} style={styles.amenityItem}>
                <Ionicons name="checkmark-circle" size={18} color={colors.primary} />
                <Text style={styles.amenityText}>{amenity}</Text>
              </View>
            ))}
          </View>
        </View>
      )}

      {/* Utilities Included */}
      {listing.utilitiesIncluded && listing.utilitiesIncluded.length > 0 && (
        <View style={styles.utilitiesSection}>
          <Text style={styles.subsectionTitle}>Utilities Included</Text>
          {listing.utilitiesIncluded.map((utility, index) => (
            <View key={index} style={styles.utilityItem}>
              <Ionicons name="checkmark-circle" size={18} color={colors.success} />
              <Text style={styles.utilityText}>{utility}</Text>
            </View>
          ))}
        </View>
      )}

      {/* Security Features */}
      {listing.securityFeatures && listing.securityFeatures.length > 0 && (
        <View style={styles.securitySection}>
          <Text style={styles.subsectionTitle}>Security Features</Text>
          {listing.securityFeatures.map((feature, index) => (
            <View key={index} style={styles.securityItem}>
              <Ionicons name="shield-checkmark" size={18} color={colors.primary} />
              <Text style={styles.securityText}>{feature}</Text>
            </View>
          ))}
        </View>
      )}
    </View>
  );
};

const renderContactPreferences = () => {
  if (!listing.contactPreferences) return null;

  return (
    <View style={styles.contactPreferencesSection}>
      <Text style={styles.sectionTitle}>Contact Preferences</Text>
      <View style={styles.preferencesList}>
        {listing.contactPreferences.allowCalls && (
          <View style={styles.preferenceItem}>
            <Ionicons name="call" size={20} color={colors.primary} />
            <Text style={styles.preferenceText}>Phone calls accepted</Text>
          </View>
        )}
        {listing.contactPreferences.allowMessages && (
          <View style={styles.preferenceItem}>
            <Ionicons name="chatbubble" size={20} color={colors.primary} />
            <Text style={styles.preferenceText}>In-app messages accepted</Text>
          </View>
        )}
        {listing.contactPreferences.allowWhatsApp && (
          <View style={styles.preferenceItem}>
            <Ionicons name="logo-whatsapp" size={20} color={colors.success} />
            <Text style={styles.preferenceText}>WhatsApp available</Text>
          </View>
        )}
        {listing.contactPreferences.preferredTime && (
          <View style={styles.preferenceItem}>
            <Ionicons name="time" size={20} color={colors.text.light} />
            <Text style={styles.preferenceText}>
              Best time: {listing.contactPreferences.preferredTime}
            </Text>
          </View>
        )}
      </View>
    </View>
  );
};
```

#### Step 3: Update ScrollView to include new sections
```typescript
<ScrollView>
  {/* ... existing image gallery and price section ... */}

  {/* Basic info section */}
  <View style={styles.infoSection}>
    {/* ... existing category, location fields ... */}
  </View>

  {/* Type-specific details */}
  {renderServiceDetails()}
  {renderJobDetails()}
  {renderEnhancedPropertyDetails()}

  {/* Description */}
  {/* ... existing description section ... */}

  {/* Contact Preferences */}
  {renderContactPreferences()}

  {/* Seller Info */}
  {/* ... existing seller section ... */}
</ScrollView>
```

#### Step 4: Add required styles
```typescript
// Add to styles object
serviceSection: {
  backgroundColor: colors.white,
  marginTop: spacing.sm,
  padding: spacing.md,
},
subsectionTitle: {
  ...typography.styles.subhead,
  color: colors.text.dark,
  fontWeight: typography.weights.semibold,
  marginTop: spacing.md,
  marginBottom: spacing.sm,
},
credentialsList: {
  marginTop: spacing.sm,
},
credentialsLabel: {
  ...typography.styles.caption1,
  color: colors.text.light,
  marginBottom: spacing.xs,
},
credentialBadge: {
  flexDirection: 'row',
  alignItems: 'center',
  backgroundColor: colors.lightGreen,
  paddingHorizontal: spacing.sm,
  paddingVertical: 6,
  borderRadius: 8,
  marginBottom: spacing.xs,
  gap: spacing.xs,
},
credentialText: {
  ...typography.styles.caption1,
  color: colors.primary,
},
insuranceBadge: {
  flexDirection: 'row',
  alignItems: 'center',
  backgroundColor: colors.success + '20',
  padding: spacing.sm,
  borderRadius: 8,
  marginTop: spacing.sm,
  gap: spacing.xs,
},
insuranceText: {
  ...typography.styles.subhead,
  color: colors.success,
  fontWeight: typography.weights.semibold,
},
skillsSection: {
  marginTop: spacing.md,
},
skillsContainer: {
  flexDirection: 'row',
  flexWrap: 'wrap',
  gap: spacing.xs,
},
skillChip: {
  backgroundColor: colors.neutral.lightGray,
  paddingHorizontal: spacing.sm,
  paddingVertical: 6,
  borderRadius: 16,
},
skillText: {
  ...typography.styles.caption1,
  color: colors.text.dark,
},
benefitsSection: {
  marginTop: spacing.md,
},
benefitItem: {
  flexDirection: 'row',
  alignItems: 'center',
  marginBottom: spacing.sm,
  gap: spacing.sm,
},
benefitText: {
  ...typography.styles.body,
  color: colors.text.secondary,
  flex: 1,
},
amenitiesSection: {
  marginTop: spacing.md,
},
amenitiesGrid: {
  gap: spacing.sm,
},
amenityItem: {
  flexDirection: 'row',
  alignItems: 'center',
  marginBottom: spacing.xs,
  gap: spacing.sm,
},
amenityText: {
  ...typography.styles.body,
  color: colors.text.secondary,
},
contactPreferencesSection: {
  backgroundColor: colors.white,
  marginTop: spacing.sm,
  padding: spacing.md,
},
preferencesList: {
  gap: spacing.sm,
},
preferenceItem: {
  flexDirection: 'row',
  alignItems: 'center',
  paddingVertical: spacing.xs,
  gap: spacing.sm,
},
preferenceText: {
  ...typography.styles.body,
  color: colors.text.secondary,
},
```

**Acceptance Criteria:**
- [ ] All service-specific fields render correctly
- [ ] Job details display properly with salary, skills, benefits
- [ ] Enhanced property details show amenities, utilities, security
- [ ] Contact preferences displayed clearly
- [ ] Professional credentials show badges and verification
- [ ] No data uses mock/hardcoded values
- [ ] Proper handling of optional fields (no crashes if data missing)
- [ ] Loading states work properly
- [ ] Error states handled gracefully

---

## Phase 2: Dynamic Listing Creation (Week 2-3)

### Task 2.1: Implement Type-Specific Fields in CreateListingScreen
**Priority:** HIGH
**Estimated Time:** 20 hours
**File:** `Hommie_Mobile/src/screens/CreateListingScreen.tsx`

**Problem:**
CreateListingScreen only supports basic item fields. Missing service, job, and property-specific fields.

**Implementation:**

#### Step 1: Update state management
```typescript
// Add type-specific state
const [listingType, setListingType] = useState<'property' | 'item' | 'service' | 'job'>('item');

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

// Job-specific state
const [employmentType, setEmploymentType] = useState<'full_time' | 'part_time' | 'contract' | 'freelance'>('full_time');
const [salaryMin, setSalaryMin] = useState('');
const [salaryMax, setSalaryMax] = useState('');
const [workLocation, setWorkLocation] = useState<'remote' | 'on_site' | 'hybrid'>('on_site');
const [requiredSkills, setRequiredSkills] = useState<string[]>([]);
const [requiredExperience, setRequiredExperience] = useState('');
const [education, setEducation] = useState('');
const [benefits, setBenefits] = useState<string[]>([]);
const [applicationDeadline, setApplicationDeadline] = useState<Date | null>(null);
const [companyName, setCompanyName] = useState('');
const [companySize, setCompanySize] = useState('');
const [companyIndustry, setCompanyIndustry] = useState('');
const [companyWebsite, setCompanyWebsite] = useState('');

// Property-specific state
const [propertyType, setPropertyType] = useState<'apartment' | 'house' | 'land' | 'office'>('apartment');
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

// Item-specific state (existing)
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
```

#### Step 2: Create type-specific form sections

**Service Fields Component:**
```typescript
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
```

**Job Fields Component:**
```typescript
const renderJobFields = () => {
  if (listingType !== 'job') return null;

  return (
    <View style={styles.sectionContainer}>
      <Text style={styles.sectionTitle}>Job Details</Text>

      {/* Employment Type */}
      <View style={styles.inputGroup}>
        <Text style={styles.inputLabel}>Employment Type *</Text>
        <View style={styles.employmentTypeSelector}>
          {[
            { value: 'full_time', label: 'Full-time' },
            { value: 'part_time', label: 'Part-time' },
            { value: 'contract', label: 'Contract' },
            { value: 'freelance', label: 'Freelance' },
          ].map((type) => (
            <TouchableOpacity
              key={type.value}
              style={[
                styles.employmentChip,
                employmentType === type.value && styles.employmentChipActive
              ]}
              onPress={() => setEmploymentType(type.value as any)}
            >
              <Text style={[
                styles.employmentText,
                employmentType === type.value && styles.employmentTextActive
              ]}>
                {type.label}
              </Text>
            </TouchableOpacity>
          ))}
        </View>
      </View>

      {/* Salary Range */}
      <View style={styles.salaryRangeGroup}>
        <Text style={styles.inputLabel}>Salary Range *</Text>
        <View style={styles.salaryInputs}>
          <View style={[styles.inputGroup, { flex: 1 }]}>
            <TextInput
              style={styles.textInput}
              placeholder="Min (₦)"
              value={salaryMin}
              onChangeText={setSalaryMin}
              keyboardType="numeric"
            />
          </View>
          <Text style={styles.salaryDivider}>to</Text>
          <View style={[styles.inputGroup, { flex: 1 }]}>
            <TextInput
              style={styles.textInput}
              placeholder="Max (₦)"
              value={salaryMax}
              onChangeText={setSalaryMax}
              keyboardType="numeric"
            />
          </View>
        </View>
      </View>

      {/* Work Location */}
      <View style={styles.inputGroup}>
        <Text style={styles.inputLabel}>Work Location *</Text>
        <View style={styles.workLocationSelector}>
          {[
            { value: 'remote', label: 'Remote', icon: 'home-outline' },
            { value: 'on_site', label: 'On-site', icon: 'business-outline' },
            { value: 'hybrid', label: 'Hybrid', icon: 'swap-horizontal-outline' },
          ].map((location) => (
            <TouchableOpacity
              key={location.value}
              style={[
                styles.workLocationOption,
                workLocation === location.value && styles.workLocationOptionActive
              ]}
              onPress={() => setWorkLocation(location.value as any)}
            >
              <Ionicons
                name={location.icon as any}
                size={20}
                color={workLocation === location.value ? colors.primary : colors.text.light}
              />
              <Text style={[
                styles.workLocationText,
                workLocation === location.value && styles.workLocationTextActive
              ]}>
                {location.label}
              </Text>
            </TouchableOpacity>
          ))}
        </View>
      </View>

      {/* Required Skills */}
      <View style={styles.inputGroup}>
        <Text style={styles.inputLabel}>Required Skills * (comma-separated)</Text>
        <TextInput
          style={styles.textInput}
          placeholder="e.g., JavaScript, React, Node.js"
          value={requiredSkills.join(', ')}
          onChangeText={(text) => setRequiredSkills(text.split(',').map(s => s.trim()))}
          multiline
        />
      </View>

      {/* Required Experience */}
      <View style={styles.inputGroup}>
        <Text style={styles.inputLabel}>Required Experience *</Text>
        <TextInput
          style={styles.textInput}
          placeholder="e.g., 3-5 years"
          value={requiredExperience}
          onChangeText={setRequiredExperience}
        />
      </View>

      {/* Education */}
      <View style={styles.inputGroup}>
        <Text style={styles.inputLabel}>Education Requirements</Text>
        <TextInput
          style={styles.textInput}
          placeholder="e.g., Bachelor's degree in Computer Science"
          value={education}
          onChangeText={setEducation}
        />
      </View>

      {/* Benefits */}
      <View style={styles.inputGroup}>
        <Text style={styles.inputLabel}>Benefits (comma-separated)</Text>
        <TextInput
          style={[styles.textInput, styles.textArea]}
          placeholder="e.g., Health Insurance, Pension, Annual Leave"
          value={benefits.join(', ')}
          onChangeText={(text) => setBenefits(text.split(',').map(b => b.trim()))}
          multiline
          numberOfLines={3}
        />
      </View>

      {/* Application Deadline */}
      <View style={styles.inputGroup}>
        <Text style={styles.inputLabel}>Application Deadline</Text>
        <TouchableOpacity
          style={styles.datePickerButton}
          onPress={() => {
            // Implement date picker
          }}
        >
          <Ionicons name="calendar-outline" size={20} color={colors.text.light} />
          <Text style={styles.dateText}>
            {applicationDeadline
              ? applicationDeadline.toLocaleDateString()
              : 'Select deadline date'}
          </Text>
        </TouchableOpacity>
      </View>

      {/* Company Info */}
      <View style={styles.companyInfoGroup}>
        <Text style={styles.sectionTitle}>Company Information</Text>

        <View style={styles.inputGroup}>
          <Text style={styles.inputLabel}>Company Name *</Text>
          <TextInput
            style={styles.textInput}
            placeholder="e.g., Tech Solutions Ltd"
            value={companyName}
            onChangeText={setCompanyName}
          />
        </View>

        <View style={styles.inputGroup}>
          <Text style={styles.inputLabel}>Company Size</Text>
          <TextInput
            style={styles.textInput}
            placeholder="e.g., 10-50 employees"
            value={companySize}
            onChangeText={setCompanySize}
          />
        </View>

        <View style={styles.inputGroup}>
          <Text style={styles.inputLabel}>Industry</Text>
          <TextInput
            style={styles.textInput}
            placeholder="e.g., Technology, Finance"
            value={companyIndustry}
            onChangeText={setCompanyIndustry}
          />
        </View>

        <View style={styles.inputGroup}>
          <Text style={styles.inputLabel}>Company Website</Text>
          <TextInput
            style={styles.textInput}
            placeholder="https://www.company.com"
            value={companyWebsite}
            onChangeText={setCompanyWebsite}
            keyboardType="url"
          />
        </View>
      </View>
    </View>
  );
};
```

**Property Fields Component:**
```typescript
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

      {/* Rental Period */}
      <View style={styles.inputGroup}>
        <Text style={styles.inputLabel}>Rental Period</Text>
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
```

#### Step 3: Update listing type selector
```typescript
const renderListingTypeSelector = () => (
  <View style={styles.sectionContainer}>
    <Text style={styles.sectionTitle}>What type of listing?</Text>
    <View style={styles.typeSelector}>
      {[
        { key: 'item', label: '🛍️ Sell Item', desc: 'Physical products and goods' },
        { key: 'service', label: '🔧 Offer Service', desc: 'Professional services' },
        { key: 'job', label: '💼 Post Job', desc: 'Hire for a position' },
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
```

#### Step 4: Update submit handler to include all fields
```typescript
const handleSubmit = async () => {
  // ... existing validation ...

  try {
    setSubmitting(true);
    triggerHaptic();

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
    } else if (listingType === 'job') {
      Object.assign(baseData, {
        employmentType,
        salaryMin: parseFloat(salaryMin),
        salaryMax: parseFloat(salaryMax),
        workLocation,
        requiredSkills: requiredSkills.filter(s => s),
        requiredExperience,
        education,
        benefits: benefits.filter(b => b),
        applicationDeadline: applicationDeadline?.toISOString(),
        companyInfo: {
          name: companyName,
          size: companySize,
          industry: companyIndustry,
          website: companyWebsite
        }
      });
    } else if (listingType === 'property') {
      Object.assign(baseData, {
        propertyType,
        bedrooms: parseInt(bedrooms) || undefined,
        bathrooms: parseInt(bathrooms) || undefined,
        propertySize: parseFloat(propertySize) || undefined,
        landSize: parseFloat(landSize) || undefined,
        parkingSpaces: parseInt(parkingSpaces) || undefined,
        petPolicy,
        rentalPeriod,
        amenities: amenities.length > 0 ? amenities : undefined,
        utilitiesIncluded: utilitiesIncluded.length > 0 ? utilitiesIncluded : undefined,
        securityFeatures: securityFeatures.length > 0 ? securityFeatures : undefined
      });
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
```

#### Step 5: Update ScrollView to include type-specific fields
```typescript
<ScrollView style={styles.scrollView} showsVerticalScrollIndicator={false}>
  {renderListingTypeSelector()}
  {renderImageUpload()}
  {renderBasicInfo()}
  {renderCategorySelection()}

  {/* Type-specific fields */}
  {renderServiceFields()}
  {renderJobFields()}
  {renderPropertyFields()}

  {/* Item-specific fields */}
  {listingType === 'item' && renderConditionSelection()}
  {listingType === 'item' && renderItemFields()}

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
    >
      {submitting ? (
        <ActivityIndicator size="small" color={colors.white} />
      ) : (
        <Text style={styles.submitButtonText}>Create Listing</Text>
      )}
    </TouchableOpacity>
  </View>
</ScrollView>
```

**Acceptance Criteria:**
- [ ] Dynamic form fields based on listing type selection
- [ ] All service-specific fields captured
- [ ] All job-specific fields captured
- [ ] All property-specific fields captured
- [ ] Item-specific fields work properly
- [ ] Validation for required fields per type
- [ ] Proper data submission to backend
- [ ] Loading and error states
- [ ] Form state persists during type switch
- [ ] Accessibility labels for all inputs

---

## Phase 3: Business Profile Integration (Week 4)

### Task 3.1: Create Business Profile Components
**Priority:** HIGH
**Estimated Time:** 16 hours
**Files:** Create new files in `Hommie_Mobile/src/`

**Problem:**
No integration with BusinessProfile entity from backend. Services need to be tied to business accounts.

**Implementation:**

#### Step 1: Create BusinessService
**File:** `Hommie_Mobile/src/services/businessService.ts`

```typescript
import { ENV, API_ENDPOINTS } from '../config/environment';
import { MeCabalAuth } from './auth';

export interface BusinessProfile {
  id: string;
  userId: string;
  businessName: string;
  description: string;
  category: string;
  subcategory?: string;
  serviceArea: string;
  pricingModel: string;
  availability: string;
  phoneNumber?: string;
  whatsappNumber?: string;
  businessAddress?: string;
  latitude?: number;
  longitude?: number;
  state?: string;
  city?: string;
  yearsOfExperience: number;
  isVerified: boolean;
  verificationLevel: 'basic' | 'enhanced' | 'premium';
  profileImageUrl?: string;
  coverImageUrl?: string;
  rating: number;
  reviewCount: number;
  completedJobs: number;
  hasInsurance: boolean;
  isActive: boolean;
  paymentMethods?: string[];
  businessHours?: Record<string, { open: string; close: string }>;
  servicesOffered?: {
    category: string;
    subcategory: string;
    description: string;
    pricing: {
      model: 'hourly' | 'project' | 'fixed' | 'negotiable';
      rate?: number;
    };
    availability: {
      days: string[];
      startTime: string;
      endTime: string;
    };
  }[];
  serviceAreas?: {
    type: 'estate' | 'neighborhood' | 'city' | 'state';
    radius?: number;
    specificAreas?: string[];
  };
  responseTime: number;
  contactPreferences?: {
    allowCalls: boolean;
    allowMessages: boolean;
    allowWhatsApp: boolean;
    preferredTime: string;
  };
  joinedDate: string;
  createdAt: string;
  updatedAt: string;
}

export interface BusinessInquiry {
  id: string;
  businessId: string;
  customerId: string;
  serviceType: string;
  description: string;
  urgency: 'low' | 'normal' | 'high' | 'urgent';
  budgetMin?: number;
  budgetMax?: number;
  preferredContact: 'call' | 'message' | 'whatsapp';
  status: 'pending' | 'responded' | 'completed' | 'cancelled';
  createdAt: string;
}

export class BusinessService {
  private static instance: BusinessService;
  private baseUrl: string;

  private constructor() {
    this.baseUrl = ENV.API.BASE_URL;
  }

  public static getInstance(): BusinessService {
    if (!BusinessService.instance) {
      BusinessService.instance = new BusinessService();
    }
    return BusinessService.instance;
  }

  private async getAuthHeaders(): Promise<HeadersInit> {
    const token = await MeCabalAuth.getAuthToken();
    return {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${token}`,
    };
  }

  // Get all businesses
  async getBusinesses(params?: {
    category?: string;
    serviceArea?: string;
    search?: string;
    page?: number;
    limit?: number;
  }): Promise<{ data: BusinessProfile[]; total: number }> {
    const queryParams = new URLSearchParams();
    if (params) {
      Object.entries(params).forEach(([key, value]) => {
        if (value !== undefined) queryParams.append(key, value.toString());
      });
    }

    const response = await fetch(
      `${this.baseUrl}/businesses?${queryParams.toString()}`,
      {
        headers: await this.getAuthHeaders(),
      }
    );

    if (!response.ok) throw new Error('Failed to fetch businesses');
    return await response.json();
  }

  // Get single business
  async getBusiness(id: string): Promise<BusinessProfile> {
    const response = await fetch(
      `${this.baseUrl}/businesses/${id}`,
      {
        headers: await this.getAuthHeaders(),
      }
    );

    if (!response.ok) throw new Error('Failed to fetch business');
    return await response.json();
  }

  // Create business inquiry
  async createInquiry(data: {
    businessId: string;
    serviceType: string;
    description: string;
    urgency?: string;
    budgetMin?: number;
    budgetMax?: number;
    preferredContact: string;
  }): Promise<BusinessInquiry> {
    const response = await fetch(
      `${this.baseUrl}/businesses/inquiries`,
      {
        method: 'POST',
        headers: await this.getAuthHeaders(),
        body: JSON.stringify(data),
      }
    );

    if (!response.ok) throw new Error('Failed to create inquiry');
    return await response.json();
  }

  // Get business inquiries (for business owner)
  async getMyInquiries(): Promise<BusinessInquiry[]> {
    const response = await fetch(
      `${this.baseUrl}/businesses/inquiries/my`,
      {
        headers: await this.getAuthHeaders(),
      }
    );

    if (!response.ok) throw new Error('Failed to fetch inquiries');
    return await response.json();
  }
}
```

#### Step 2: Create BusinessSearchScreen
**File:** `Hommie_Mobile/src/screens/BusinessSearchScreen.tsx`

```typescript
import React, { useState, useEffect, useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  TouchableOpacity,
  TextInput,
  ActivityIndicator,
  SafeAreaView,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { colors, typography, spacing, shadows } from '../constants';
import { BusinessService, BusinessProfile } from '../services/businessService';

interface BusinessSearchScreenProps {
  navigation: any;
}

export default function BusinessSearchScreen({ navigation }: BusinessSearchScreenProps) {
  const [businesses, setBusinesses] = useState<BusinessProfile[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState<string | null>(null);

  const businessService = BusinessService.getInstance();

  const fetchBusinesses = useCallback(async () => {
    try {
      setLoading(true);
      const result = await businessService.getBusinesses({
        search: searchQuery || undefined,
        category: selectedCategory || undefined,
      });
      setBusinesses(result.data);
    } catch (error) {
      console.error('Error fetching businesses:', error);
    } finally {
      setLoading(false);
    }
  }, [searchQuery, selectedCategory]);

  useEffect(() => {
    fetchBusinesses();
  }, [fetchBusinesses]);

  const renderBusinessCard = ({ item }: { item: BusinessProfile }) => (
    <TouchableOpacity
      style={styles.businessCard}
      onPress={() => navigation.navigate('BusinessDetail', { businessId: item.id })}
    >
      <View style={styles.businessHeader}>
        <View style={styles.businessInfo}>
          <View style={styles.businessNameRow}>
            <Text style={styles.businessName}>{item.businessName}</Text>
            {item.isVerified && (
              <Ionicons name="shield-checkmark" size={20} color={colors.primary} />
            )}
          </View>
          <Text style={styles.businessCategory}>{item.category}</Text>
        </View>
        {item.profileImageUrl && (
          <Image
            source={{ uri: item.profileImageUrl }}
            style={styles.businessImage}
          />
        )}
      </View>

      <Text style={styles.businessDescription} numberOfLines={2}>
        {item.description}
      </Text>

      <View style={styles.businessStats}>
        <View style={styles.statItem}>
          <Ionicons name="star" size={16} color={colors.warning} />
          <Text style={styles.statText}>
            {item.rating.toFixed(1)} ({item.reviewCount})
          </Text>
        </View>
        <View style={styles.statItem}>
          <Ionicons name="checkmark-circle" size={16} color={colors.success} />
          <Text style={styles.statText}>{item.completedJobs} jobs</Text>
        </View>
        <View style={styles.statItem}>
          <Ionicons name="location" size={16} color={colors.text.light} />
          <Text style={styles.statText}>{item.serviceArea}</Text>
        </View>
      </View>

      <View style={styles.verificationBadge}>
        <Text style={styles.verificationText}>
          {item.verificationLevel.toUpperCase()} VERIFIED
        </Text>
      </View>
    </TouchableOpacity>
  );

  return (
    <SafeAreaView style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity
          style={styles.backButton}
          onPress={() => navigation.goBack()}
        >
          <Ionicons name="chevron-back" size={28} color={colors.primary} />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Local Businesses</Text>
        <View style={styles.backButton} />
      </View>

      {/* Search Bar */}
      <View style={styles.searchContainer}>
        <View style={styles.searchBar}>
          <Ionicons name="search" size={20} color={colors.text.light} />
          <TextInput
            style={styles.searchInput}
            placeholder="Search services..."
            value={searchQuery}
            onChangeText={setSearchQuery}
          />
        </View>
      </View>

      {/* Results */}
      {loading ? (
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color={colors.primary} />
        </View>
      ) : (
        <FlatList
          data={businesses}
          renderItem={renderBusinessCard}
          keyExtractor={(item) => item.id}
          contentContainerStyle={styles.listContent}
        />
      )}
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
    padding: spacing.md,
    backgroundColor: colors.white,
  },
  backButton: {
    width: 40,
    height: 40,
    justifyContent: 'center',
  },
  headerTitle: {
    ...typography.styles.title3,
    color: colors.text.dark,
  },
  searchContainer: {
    padding: spacing.md,
    backgroundColor: colors.white,
  },
  searchBar: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.neutral.lightGray,
    borderRadius: 10,
    paddingHorizontal: spacing.sm,
    height: 40,
    gap: spacing.xs,
  },
  searchInput: {
    flex: 1,
    ...typography.styles.body,
    color: colors.text.dark,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  listContent: {
    padding: spacing.md,
    gap: spacing.md,
  },
  businessCard: {
    backgroundColor: colors.white,
    borderRadius: 12,
    padding: spacing.md,
    ...shadows.small,
  },
  businessHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: spacing.sm,
  },
  businessInfo: {
    flex: 1,
  },
  businessNameRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.xs,
    marginBottom: spacing.xs / 2,
  },
  businessName: {
    ...typography.styles.headline,
    color: colors.text.dark,
  },
  businessCategory: {
    ...typography.styles.subhead,
    color: colors.text.light,
  },
  businessImage: {
    width: 60,
    height: 60,
    borderRadius: 30,
  },
  businessDescription: {
    ...typography.styles.body,
    color: colors.text.secondary,
    marginBottom: spacing.sm,
  },
  businessStats: {
    flexDirection: 'row',
    gap: spacing.md,
    marginBottom: spacing.sm,
  },
  statItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  statText: {
    ...typography.styles.caption1,
    color: colors.text.light,
  },
  verificationBadge: {
    alignSelf: 'flex-start',
    backgroundColor: colors.lightGreen,
    paddingHorizontal: spacing.sm,
    paddingVertical: 4,
    borderRadius: 6,
  },
  verificationText: {
    ...typography.styles.caption2,
    color: colors.primary,
    fontWeight: typography.weights.semibold,
  },
});
```

**Acceptance Criteria:**
- [ ] BusinessService created with all CRUD methods
- [ ] Business search screen implemented
- [ ] Business detail screen created
- [ ] Service inquiry form implemented
- [ ] Integration with backend APIs
- [ ] Proper error handling
- [ ] Loading states

---

## Phase 4: Additional Features (Week 5-6)

### Task 4.1: Implement Listing Edit Functionality
**Priority:** MEDIUM
**Estimated Time:** 12 hours

### Task 4.2: Advanced Search & Filters
**Priority:** MEDIUM
**Estimated Time:** 10 hours

### Task 4.3: Listing Management Dashboard
**Priority:** LOW
**Estimated Time:** 8 hours

---

## Testing Requirements

### Unit Tests
- [ ] ListingsService methods
- [ ] BusinessService methods
- [ ] Form validation logic
- [ ] Data transformation utilities

### Integration Tests
- [ ] API integration tests
- [ ] Navigation flow tests
- [ ] Form submission tests

### E2E Tests
- [ ] Complete listing creation flow
- [ ] Listing details viewing
- [ ] Business search and inquiry
- [ ] Edit listing flow

---

## Performance Requirements
- API calls < 2s response time
- Smooth scrolling with 100+ items
- Image loading optimization
- Form validation should be instant

---

## Accessibility Requirements
- Screen reader support for all components
- Proper accessibility labels
- High contrast mode support
- Keyboard navigation support (web)
- Dynamic type support (iOS)

---

## Documentation Requirements
- [ ] Update API documentation
- [ ] Component documentation
- [ ] Service documentation
- [ ] User guide for new features

---

## Success Metrics
- Listing creation completion rate > 80%
- API integration success rate > 99%
- User satisfaction score > 4.5/5
- Crash rate < 0.1%

---

## Notes

This document provides comprehensive, implementation-ready tasks. Each task includes:
- Specific file paths
- Detailed code examples
- Complete implementation guidance
- Acceptance criteria
- Time estimates

The tasks are ordered by priority and dependencies. Phase 1 must be completed before Phase 2, etc.
