# Marketplace Frontend Enhancement Tasks

## Overview
This document outlines the frontend tasks required to enhance the marketplace functionality in the MeCabal mobile app, addressing navigation issues, API integration, listing details improvements, and dynamic listing creation based on different listing types.

## Current Issues Identified

### 1. Navigation Issues
- **Problem**: No back button for Android users in marketplace screen
- **Impact**: Poor Android user experience
- **Priority**: High

### 2. Data Integration Issues
- **Problem**: Listings still using mock data instead of API
- **Impact**: Users see outdated/incorrect information
- **Priority**: High

### 3. Listing Details Gaps
- **Problem**: Missing critical data fields in listing details
- **Impact**: Incomplete user experience
- **Priority**: High

### 4. Design System Issues
- **Problem**: Not following Apple Design Guidelines consistently
- **Impact**: Poor iOS user experience
- **Priority**: Medium

## Frontend Tasks

### Phase 1: Critical Fixes (Week 1-2)

#### Task 1.1: Add Universal Back Button
**File**: `Hommie_Mobile/src/screens/MarketplaceScreen.tsx`
**Priority**: High
**Estimated Time**: 4 hours

**Requirements**:
- Add back button for both iOS and Android users
- Implement platform-appropriate navigation patterns
- Ensure consistent navigation across both platforms
- Test on both platforms

**Implementation Details**:
```typescript
// Add to header section for both platforms
<TouchableOpacity
  style={styles.backButton}
  onPress={() => navigation?.goBack()}
  activeOpacity={0.7}
>
  <Ionicons 
    name={Platform.OS === 'ios' ? 'chevron-back' : 'arrow-back'} 
    size={24} 
    color={colors.primary} 
  />
</TouchableOpacity>
```

**Acceptance Criteria**:
- [ ] Both iOS and Android users can navigate back from marketplace
- [ ] Navigation uses platform-appropriate icons
- [ ] Consistent behavior across platforms
- [ ] Proper accessibility labels added

#### Task 1.2: Connect Listings to Real API
**File**: `Hommie_Mobile/src/services/listingsService.ts`
**Priority**: High
**Estimated Time**: 8 hours

**Requirements**:
- Replace mock data with actual API calls
- Implement proper error handling
- Add loading states
- Handle API failures gracefully

**Implementation Details**:
- Verify API endpoints are working
- Update service methods to use real data
- Add proper error handling and user feedback
- Implement retry logic for failed requests

**Acceptance Criteria**:
- [ ] All listings come from API
- [ ] Proper error handling implemented
- [ ] Loading states shown during API calls
- [ ] Offline handling implemented

#### Task 1.3: Enhance Listing Details Page
**File**: `Hommie_Mobile/src/screens/ListingDetailsScreen.tsx`
**Priority**: High
**Estimated Time**: 12 hours

**Requirements**:
- Add missing data fields based on listing type
- Implement dynamic rendering based on listing category
- Add service-specific information
- Improve property listing details

**Missing Fields to Add**:
- Service availability hours
- Service area coverage
- Professional credentials for services
- Property amenities
- Job requirements and qualifications
- Contact preferences
- Response time expectations

**Implementation Details**:
```typescript
// Add service-specific sections
const renderServiceDetails = () => {
  if (listing.listingType !== 'service') return null;
  
  return (
    <View style={styles.serviceSection}>
      <Text style={styles.sectionTitle}>Service Details</Text>
      {/* Service availability, area coverage, etc. */}
    </View>
  );
};
```

**Acceptance Criteria**:
- [ ] All listing types show relevant details
- [ ] Service listings show availability and coverage
- [ ] Property listings show amenities and features
- [ ] Job listings show requirements and qualifications
- [ ] Dynamic rendering based on category

### Phase 2: Dynamic Listing Creation (Week 3-4)

#### Task 2.1: Create Dynamic Listing Form
**File**: `Hommie_Mobile/src/screens/CreateListingScreen.tsx`
**Priority**: High
**Estimated Time**: 16 hours

**Requirements**:
- Create dynamic form based on listing type
- Implement different fields for goods, services, jobs, and properties
- Add category-specific validation
- Implement step-by-step form flow

**Form Structure**:
1. **Listing Type Selection** (Current)
2. **Category Selection** (Enhanced)
3. **Basic Information** (Dynamic based on type)
4. **Type-Specific Details** (New)
5. **Location & Contact** (Enhanced)
6. **Media Upload** (Current)
7. **Review & Submit** (New)

**Implementation Details**:
```typescript
const renderDynamicFields = () => {
  switch (listingType) {
    case 'property':
      return <PropertyFields />;
    case 'service':
      return <ServiceFields />;
    case 'job':
      return <JobFields />;
    default:
      return <ItemFields />;
  }
};
```

**Acceptance Criteria**:
- [ ] Dynamic form fields based on listing type
- [ ] Category-specific validation rules
- [ ] Step-by-step form flow
- [ ] Proper error handling and validation
- [ ] Form state management

#### Task 2.2: Implement Business Profile Management
**Priority**: High
**Estimated Time**: 12 hours

**Requirements**:
- Business profile creation and editing
- Service offerings management within business profile
- Business verification display
- Service area and availability management
- Professional credentials management

**Fields to Add**:
- Business name and type
- Verification level display
- Services offered (multiple services per business)
- Service area coverage (estate, neighborhood, city-wide)
- Professional licenses and certifications
- Availability schedule
- Contact preferences

**Acceptance Criteria**:
- [ ] Business profile creation and editing
- [ ] Multiple services per business profile
- [ ] Service area selection
- [ ] Professional credentials management
- [ ] Business verification display

#### Task 2.3: Implement Job-Specific Fields
**Priority**: High
**Estimated Time**: 10 hours

**Requirements**:
- Job requirements and qualifications
- Employment type (full-time, part-time, contract)
- Salary range or budget
- Application deadline
- Required skills and experience
- Work location preferences

**Fields to Add**:
- Job title and description
- Employment type selection
- Salary/budget range
- Application deadline
- Required skills checklist
- Work location (remote, on-site, hybrid)
- Company information

**Acceptance Criteria**:
- [ ] Job requirements input
- [ ] Employment type selection
- [ ] Salary range input
- [ ] Application deadline
- [ ] Skills and experience requirements
- [ ] Work location preferences

#### Task 2.4: Implement Service Inquiry System
**Priority**: High
**Estimated Time**: 10 hours

**Requirements**:
- Service inquiry form for contacting businesses
- Business contact preferences handling
- Inquiry tracking and management
- Response time expectations
- Service-specific inquiry details

**Fields to Add**:
- Service type selection
- Service description and requirements
- Preferred contact method
- Urgency level
- Budget range (optional)
- Preferred timing
- Additional notes

**Acceptance Criteria**:
- [ ] Service inquiry form
- [ ] Business contact preferences respected
- [ ] Inquiry tracking system
- [ ] Response time display
- [ ] Service-specific inquiry details

### Phase 3: Design System Implementation (Week 5-6)

#### Task 3.1: Implement Apple Design Guidelines
**Priority**: Medium
**Estimated Time**: 16 hours

**Requirements**:
- Follow iOS Human Interface Guidelines
- Implement proper typography scale
- Use correct spacing and layout
- Add proper accessibility support
- Implement dark mode support

**Design Elements**:
- Typography following iOS scale
- Proper spacing using 8pt grid
- Correct button styles and states
- Proper form field styling
- Accessibility labels and hints
- Dark mode color schemes

**Acceptance Criteria**:
- [ ] Typography follows iOS guidelines
- [ ] Spacing uses 8pt grid system
- [ ] Button styles match iOS patterns
- [ ] Form fields follow iOS design
- [ ] Accessibility labels added
- [ ] Dark mode implemented

#### Task 3.2: Enhance Android Compatibility
**Priority**: Medium
**Estimated Time**: 8 hours

**Requirements**:
- Ensure Android Material Design compatibility
- Add Android-specific navigation patterns
- Implement proper Android form controls
- Add Android-specific accessibility features

**Implementation Details**:
- Use Android-specific navigation components
- Implement Material Design form controls
- Add Android accessibility features
- Test on various Android screen sizes

**Acceptance Criteria**:
- [ ] Material Design compatibility
- [ ] Android navigation patterns
- [ ] Android form controls
- [ ] Android accessibility features
- [ ] Multi-screen size support

### Phase 4: Advanced Features (Week 7-8)

#### Task 4.1: Implement Advanced Search and Filtering
**Priority**: Medium
**Estimated Time**: 12 hours

**Requirements**:
- Advanced search with multiple criteria
- Filter by price range, location, category
- Sort by relevance, price, date
- Save search preferences
- Recent searches history

**Features**:
- Multi-criteria search
- Price range slider
- Location-based filtering
- Category and subcategory filters
- Sort options
- Search history
- Saved searches

**Acceptance Criteria**:
- [ ] Advanced search implemented
- [ ] Multiple filter options
- [ ] Sort functionality
- [ ] Search history
- [ ] Saved searches

#### Task 4.2: Implement Listing Management
**Priority**: Medium
**Estimated Time**: 10 hours

**Requirements**:
- Edit existing listings
- Mark listings as sold/expired
- Duplicate listings
- View listing analytics
- Manage listing media

**Features**:
- Edit listing details
- Status management
- Listing duplication
- Analytics dashboard
- Media management
- Bulk operations

**Acceptance Criteria**:
- [ ] Edit functionality
- [ ] Status management
- [ ] Duplication feature
- [ ] Analytics display
- [ ] Media management

#### Task 4.3: Implement Enhanced Media Handling
**Priority**: Low
**Estimated Time**: 8 hours

**Requirements**:
- Multiple image upload
- Image editing and cropping
- Video support for services
- Image compression
- Media gallery management

**Features**:
- Multiple image selection
- Image editing tools
- Video upload support
- Automatic compression
- Media gallery
- Drag-and-drop reordering

**Acceptance Criteria**:
- [ ] Multiple image upload
- [ ] Image editing tools
- [ ] Video support
- [ ] Compression implemented
- [ ] Gallery management

## Technical Requirements

### Dependencies
- React Native 0.72+
- Expo SDK 49+
- TypeScript 4.9+
- React Navigation 6+
- Expo Image Picker
- React Native Elements (for Android compatibility)

### Performance Requirements
- App should load listings within 2 seconds
- Smooth scrolling with 100+ listings
- Image loading should be optimized
- Form validation should be instant
- API calls should have proper loading states

### Testing Requirements
- Unit tests for all new components
- Integration tests for API calls
- E2E tests for critical user flows
- Performance testing with large datasets
- Accessibility testing on both platforms

### Accessibility Requirements
- Screen reader support
- High contrast mode support
- Keyboard navigation support
- Voice control support
- Dynamic type support (iOS)

## Success Metrics

### User Experience
- Listing load time < 2 seconds
- Form completion rate > 80%
- User satisfaction score > 4.5/5
- Crash rate < 0.1%

### Functionality
- API integration success rate > 99%
- Form validation accuracy > 95%
- Search result relevance > 90%
- Image upload success rate > 98%

### Platform Compatibility
- iOS 14+ support
- Android 8+ support
- Various screen sizes
- Different orientations

## Notes

### Service vs Job Handling
**Recommendation**: Implement both approaches
- **Services**: Professionals post their offerings
- **Jobs**: People post what they need, professionals can apply
- **Hybrid**: Allow both, with clear distinction in UI

### Property Listings
- Separate property-specific fields
- Integration with property management features
- Virtual tour support (future enhancement)
- Property verification system

### Dynamic Categories
- Backend-driven category system
- Category-specific field definitions
- Validation rules per category
- Future extensibility for new categories

This document should be reviewed and updated as requirements evolve. Each task should be estimated and assigned to appropriate team members based on their expertise and availability.
