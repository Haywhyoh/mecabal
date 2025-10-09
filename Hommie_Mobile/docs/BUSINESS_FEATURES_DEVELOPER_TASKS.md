# Business Features Integration - Developer Task Breakdown

## Overview

This document breaks down the business features integration into specific, actionable tasks for developers. Each task includes acceptance criteria, estimated effort, and dependencies.

---

## Phase 1: Foundation & API Setup (Week 1)

### Task 1.1: Create API Service Layer Structure

**Priority:** Critical
**Estimated Effort:** 4 hours
**Assigned To:** Backend Integration Developer

**Description:**
Set up the foundational API service layer with TypeScript interfaces and API client configuration.

**Implementation Steps:**

1. Create directory structure:
   ```
   src/services/api/
   src/services/types/
   ```

2. Install dependencies:
   ```bash
   npm install axios @react-native-async-storage/async-storage
   ```

3. Create `apiClient.ts` with:
   - Axios instance configuration
   - Request/response interceptors
   - Authentication token management
   - Error handling

4. Create TypeScript interface files:
   - `business.types.ts`
   - `review.types.ts`
   - `inquiry.types.ts`
   - `api.types.ts`

**Acceptance Criteria:**
- [ ] API client successfully connects to backend
- [ ] Auth tokens are automatically attached to requests
- [ ] 401 errors trigger logout flow
- [ ] All TypeScript interfaces match backend DTOs
- [ ] Environment variables configured for API URLs

**Files to Create:**
- `src/services/api/apiClient.ts`
- `src/services/types/business.types.ts`
- `src/services/types/review.types.ts`
- `src/services/types/inquiry.types.ts`
- `src/services/types/api.types.ts`

---

### Task 1.2: Implement Business Profile API Service

**Priority:** Critical
**Estimated Effort:** 3 hours
**Depends On:** Task 1.1

**Description:**
Create the business profile API service with all CRUD operations.

**Implementation Steps:**

1. Create `src/services/api/businessApi.ts`

2. Implement methods:
   - `registerBusiness(data)` - POST /business/register
   - `getMyBusiness()` - GET /business/my-business
   - `getBusinessById(id)` - GET /business/:id
   - `updateBusiness(id, data)` - PUT /business/:id
   - `updateBusinessStatus(id, isActive)` - PUT /business/:id/status
   - `deleteBusiness(id)` - DELETE /business/:id

3. Add proper error handling for each method

4. Write unit tests for API service

**Acceptance Criteria:**
- [ ] All API methods properly typed with TypeScript
- [ ] Error responses handled gracefully
- [ ] Successful responses return properly typed data
- [ ] 404 responses handled for non-existent businesses
- [ ] Unit tests pass with 80%+ coverage

**Files to Create:**
- `src/services/api/businessApi.ts`
- `src/services/api/__tests__/businessApi.test.ts`

---

### Task 1.3: Implement Business Search API Service

**Priority:** Critical
**Estimated Effort:** 4 hours
**Depends On:** Task 1.1

**Description:**
Create the business search API service with all search and discovery features.

**Implementation Steps:**

1. Create `src/services/api/businessSearchApi.ts`

2. Implement methods:
   - `searchBusinesses(params)` - Main search with filters
   - `searchByServiceArea(lat, lng, category)` - Location-based grouping
   - `getFeatured(limit)` - Featured businesses
   - `getTrending(limit)` - Trending businesses

3. Implement SearchBusinessDto with all filter parameters

4. Add pagination support

**Acceptance Criteria:**
- [ ] Search accepts all filter parameters
- [ ] Pagination works correctly
- [ ] Location-based search returns distance-sorted results
- [ ] Featured/trending endpoints work
- [ ] Query parameters properly encoded

**Files to Create:**
- `src/services/api/businessSearchApi.ts`
- `src/services/api/__tests__/businessSearchApi.test.ts`

---

### Task 1.4: Implement Reviews & Inquiries API Services

**Priority:** High
**Estimated Effort:** 3 hours each (6 hours total)
**Depends On:** Task 1.1

**Description:**
Create API services for reviews and inquiries functionality.

**Implementation Steps:**

1. Create `src/services/api/businessReviewApi.ts` with:
   - `createReview(businessId, data)`
   - `getReviews(businessId, query)`
   - `getReviewStats(businessId)`
   - `updateReview(businessId, reviewId, data)`
   - `respondToReview(businessId, reviewId, response)`
   - `deleteReview(businessId, reviewId)`

2. Create `src/services/api/businessInquiryApi.ts` with:
   - `createInquiry(businessId, data)`
   - `getBusinessInquiries(businessId, status)`
   - `getInquiryStats(businessId)`
   - `respondToInquiry(businessId, inquiryId, response)`
   - `updateInquiryStatus(businessId, inquiryId, status)`
   - `getMyInquiries()`

**Acceptance Criteria:**
- [ ] All review operations work correctly
- [ ] All inquiry operations work correctly
- [ ] Proper TypeScript typing throughout
- [ ] Error handling for authorization failures
- [ ] Pagination works for review/inquiry lists

**Files to Create:**
- `src/services/api/businessReviewApi.ts`
- `src/services/api/businessInquiryApi.ts`
- `src/services/api/__tests__/businessReviewApi.test.ts`
- `src/services/api/__tests__/businessInquiryApi.test.ts`

---

## Phase 2: Business Profile Screen Integration (Week 1-2)

### Task 2.1: Update BusinessProfileScreen with Real Data

**Priority:** Critical
**Estimated Effort:** 6 hours
**Depends On:** Task 1.2

**Description:**
Replace all mock data in BusinessProfileScreen with real API calls.

**Implementation Steps:**

1. Add state management:
   ```typescript
   const [businessProfile, setBusinessProfile] = useState<BusinessProfile | null>(null);
   const [loading, setLoading] = useState(true);
   const [error, setError] = useState<string | null>(null);
   ```

2. Implement data loading:
   - Load business on component mount
   - Handle loading states
   - Handle error states
   - Handle no business case

3. Update UI components to use real data:
   - Business name, description, category
   - Ratings and review count
   - Contact information
   - Credentials and licenses
   - Activity feed

4. Implement real status toggle functionality

**Acceptance Criteria:**
- [ ] Screen loads real business data on mount
- [ ] Loading spinner shows while fetching
- [ ] Error message displays on failure
- [ ] Empty state shows if no business registered
- [ ] Status toggle updates backend and UI
- [ ] Pull-to-refresh reloads data
- [ ] All UI elements display real data correctly

**Files to Modify:**
- `src/screens/BusinessProfileScreen.tsx`

**UI/UX Requirements (Apple HIG):**
- Loading state: Full-screen spinner with descriptive text
- Error state: Alert with retry option
- Empty state: Clear message with CTA to register business
- Status toggle: Confirmation dialog before changing
- Smooth transitions between states

---

### Task 2.2: Update BusinessRegistrationScreen with API Integration

**Priority:** Critical
**Estimated Effort:** 8 hours
**Depends On:** Task 1.2

**Description:**
Connect the business registration flow to the backend API.

**Implementation Steps:**

1. Update form submission:
   - Validate all required fields
   - Show loading indicator during submission
   - Call `businessApi.registerBusiness()`
   - Handle success/error responses

2. Add proper navigation:
   - Navigate to BusinessProfile on success
   - Show success message
   - Handle validation errors from backend

3. Implement file upload for:
   - Profile image
   - Cover image
   - License documents (future enhancement)

**Acceptance Criteria:**
- [ ] Form validates before submission
- [ ] Submission shows loading state
- [ ] Success navigates to business profile
- [ ] Backend validation errors displayed properly
- [ ] Network errors handled gracefully
- [ ] All form data correctly mapped to DTO

**Files to Modify:**
- `src/screens/BusinessRegistrationScreen.tsx`

**UI/UX Requirements:**
- Disable submit button while loading
- Show progress indicator on button
- Display field-level errors from backend
- Success message with celebration animation
- Clear error messages for each failure scenario

---

### Task 2.3: Create Business Edit Screen

**Priority:** High
**Estimated Effort:** 6 hours
**Depends On:** Task 2.1

**Description:**
Create a screen for editing existing business profiles.

**Implementation Steps:**

1. Create `src/screens/EditBusinessProfileScreen.tsx`

2. Pre-populate form with existing business data

3. Implement update functionality:
   - Call `businessApi.updateBusiness()`
   - Handle partial updates
   - Show loading state
   - Navigate back on success

4. Add image update functionality:
   - Profile image picker
   - Cover image picker
   - Upload to backend

**Acceptance Criteria:**
- [ ] Form pre-populated with current data
- [ ] Only changed fields sent to backend
- [ ] Update successful message shown
- [ ] Profile screen reflects changes immediately
- [ ] Validation errors displayed properly

**Files to Create:**
- `src/screens/EditBusinessProfileScreen.tsx`

**UI/UX Requirements:**
- Pre-filled forms with current values
- Save and Cancel buttons
- Confirmation dialog if unsaved changes
- Loading state on save button
- Success toast notification

---

## Phase 3: Business Directory Integration (Week 2)

### Task 3.1: Update LocalBusinessDirectoryScreen with API Search

**Priority:** Critical
**Estimated Effort:** 8 hours
**Depends On:** Task 1.3

**Description:**
Replace mock business data with real API search functionality.

**Implementation Steps:**

1. Implement search state management:
   ```typescript
   const [businesses, setBusinesses] = useState<BusinessProfile[]>([]);
   const [loading, setLoading] = useState(true);
   const [searchParams, setSearchParams] = useState<SearchBusinessDto>({});
   const [pagination, setPagination] = useState({...});
   ```

2. Implement search functionality:
   - Text search
   - Category filters
   - Location-based search
   - Sort options
   - Pagination

3. Add user location tracking:
   - Request location permission
   - Get current coordinates
   - Use in distance calculations

4. Implement infinite scroll:
   - Load more on scroll to bottom
   - Show loading indicator
   - Handle end of results

5. Add pull-to-refresh

**Acceptance Criteria:**
- [ ] Search returns real businesses from API
- [ ] All filters work correctly
- [ ] Location-based search shows distance
- [ ] Pagination loads more results
- [ ] Pull-to-refresh reloads search
- [ ] Empty state shown when no results
- [ ] Loading states displayed properly

**Files to Modify:**
- `src/screens/LocalBusinessDirectoryScreen.tsx`

**UI/UX Requirements:**
- Skeleton loading for initial load
- Smooth scroll performance
- Pull-to-refresh with haptic feedback
- Filter chips with visual feedback
- Distance badges on business cards
- Loading spinner for "load more"

---

### Task 3.2: Create Business Detail Screen

**Priority:** High
**Estimated Effort:** 8 hours
**Depends On:** Task 1.2, Task 1.4

**Description:**
Create a detailed view screen for individual businesses.

**Implementation Steps:**

1. Create `src/screens/BusinessDetailScreen.tsx`

2. Load business data:
   - Business profile
   - Review stats
   - Recent reviews

3. Implement UI sections:
   - Header with cover/profile images
   - Business info and verification badge
   - About section
   - Services offered
   - Contact options
   - Reviews summary
   - Recent reviews (first 5)
   - Inquiry form

4. Add interaction features:
   - Contact buttons (Call, WhatsApp, Message)
   - Send inquiry modal
   - View all reviews button
   - Write review button
   - Share business option

5. Track analytics:
   - Log profile view on mount
   - Log contact clicks

**Acceptance Criteria:**
- [ ] Business details loaded correctly
- [ ] All sections display proper data
- [ ] Contact buttons functional
- [ ] Inquiry modal works
- [ ] Navigation to reviews screen works
- [ ] Profile views tracked
- [ ] Contact clicks tracked

**Files to Create:**
- `src/screens/BusinessDetailScreen.tsx`
- `src/components/BusinessHeader.tsx`
- `src/components/BusinessContactButtons.tsx`
- `src/components/InquiryModal.tsx`

**UI/UX Requirements (Apple HIG):**
- Large header with parallax scroll
- Floating action button for primary CTA
- Card-based layout for sections
- Smooth modal animations
- Haptic feedback on interactions
- Native share sheet integration

---

### Task 3.3: Implement Advanced Search Filters

**Priority:** Medium
**Estimated Effort:** 4 hours
**Depends On:** Task 3.1

**Description:**
Add a comprehensive filter modal for business search.

**Implementation Steps:**

1. Create `src/components/SearchFiltersModal.tsx`

2. Implement filter options:
   - Category selection
   - Service area selection
   - Price range slider
   - Rating filter
   - Verified only toggle
   - Payment methods
   - Distance radius slider

3. Add filter state management:
   - Store filter selections
   - Clear all filters
   - Apply filters button

4. Update search when filters applied

**Acceptance Criteria:**
- [ ] All filter options functional
- [ ] Filter state persists during session
- [ ] Clear filters resets to defaults
- [ ] Apply filters triggers new search
- [ ] Filter count shown on filter button
- [ ] Smooth modal animations

**Files to Create:**
- `src/components/SearchFiltersModal.tsx`
- `src/components/FilterOption.tsx`

---

## Phase 4: Reviews & Ratings (Week 3)

### Task 4.1: Create Business Reviews Screen

**Priority:** High
**Estimated Effort:** 6 hours
**Depends On:** Task 1.4

**Description:**
Create a full-screen view for all business reviews.

**Implementation Steps:**

1. Create `src/screens/BusinessReviewsScreen.tsx`

2. Implement sections:
   - Overall rating summary
   - Rating breakdown (5-star breakdown)
   - Detailed rating averages
   - Review filters (by rating)
   - Reviews list with pagination

3. Add review card component:
   - Reviewer info
   - Rating stars
   - Review text
   - Detailed ratings
   - Business response (if any)
   - Helpful votes (future)

**Acceptance Criteria:**
- [ ] Reviews load with pagination
- [ ] Rating breakdown calculates correctly
- [ ] Filter by rating works
- [ ] Business responses displayed
- [ ] Infinite scroll for reviews
- [ ] Loading states shown properly

**Files to Create:**
- `src/screens/BusinessReviewsScreen.tsx`
- `src/components/ReviewCard.tsx`
- `src/components/RatingBreakdown.tsx`

---

### Task 4.2: Create Write Review Screen

**Priority:** High
**Estimated Effort:** 5 hours
**Depends On:** Task 1.4

**Description:**
Create a screen for users to write reviews for businesses.

**Implementation Steps:**

1. Create `src/screens/WriteReviewScreen.tsx`

2. Implement form fields:
   - Overall rating (required)
   - Service quality rating
   - Professionalism rating
   - Value for money rating
   - Review text (optional)

3. Add star rating component:
   - Interactive star selection
   - Visual feedback on selection

4. Form validation and submission:
   - Require overall rating
   - Character limit on review text
   - Submit to API
   - Success/error handling

**Acceptance Criteria:**
- [ ] All rating fields functional
- [ ] Star ratings update correctly
- [ ] Review text character counter
- [ ] Submission creates review
- [ ] Success message and navigation
- [ ] Duplicate review prevented

**Files to Create:**
- `src/screens/WriteReviewScreen.tsx`
- `src/components/StarRating.tsx`

**UI/UX Requirements:**
- Large, tappable star buttons
- Haptic feedback on star selection
- Character count with color indicator
- Submit button disabled until valid
- Success animation on submit
- Error messages clearly displayed

---

### Task 4.3: Implement Review Response Feature (Business Owner)

**Priority:** Medium
**Estimated Effort:** 4 hours
**Depends On:** Task 4.1

**Description:**
Allow business owners to respond to reviews on their business.

**Implementation Steps:**

1. Add "Respond" button to review cards (owner only)

2. Create response modal:
   - Text input for response
   - Character limit (500)
   - Submit/cancel buttons

3. Implement response submission:
   - Call API to add response
   - Update review card with response
   - Show success message

4. Display responses in review cards:
   - Business owner badge
   - Response text
   - Response date

**Acceptance Criteria:**
- [ ] Respond button only shows for business owner
- [ ] Modal opens with text input
- [ ] Response submits correctly
- [ ] Review updates with response
- [ ] Response visible to all users

**Files to Modify:**
- `src/components/ReviewCard.tsx`
- Create: `src/components/ReviewResponseModal.tsx`

---

## Phase 5: Inquiry Management (Week 3)

### Task 5.1: Create Send Inquiry Modal

**Priority:** High
**Estimated Effort:** 4 hours
**Depends On:** Task 1.4

**Description:**
Create a modal for sending inquiries to businesses.

**Implementation Steps:**

1. Create `src/components/SendInquiryModal.tsx`

2. Implement form fields:
   - Inquiry type selection (Booking, Question, Quote)
   - Message text (required)
   - Phone number (optional)
   - Preferred contact method
   - Preferred date/time (for bookings)

3. Form validation and submission:
   - Validate required fields
   - Submit to API
   - Success/error handling
   - Close modal on success

**Acceptance Criteria:**
- [ ] All form fields functional
- [ ] Type-specific fields show conditionally
- [ ] Validation works correctly
- [ ] Inquiry sends successfully
- [ ] Success message displayed
- [ ] Modal closes after success

**Files to Create:**
- `src/components/SendInquiryModal.tsx`

**UI/UX Requirements:**
- Sheet modal presentation
- Smooth keyboard handling
- Type icons for visual clarity
- Date/time picker for bookings
- Submit button with loading state

---

### Task 5.2: Create My Inquiries Screen

**Priority:** Medium
**Estimated Effort:** 5 hours
**Depends On:** Task 1.4

**Description:**
Create a screen showing all inquiries sent by the user.

**Implementation Steps:**

1. Create `src/screens/MyInquiriesScreen.tsx`

2. Load user's inquiries from API

3. Implement inquiry list:
   - Business name and type
   - Inquiry status (Pending, Responded, Closed)
   - Original message
   - Business response (if any)
   - Timestamp

4. Add status filters:
   - All, Pending, Responded, Closed

5. Implement inquiry detail view:
   - Full inquiry thread
   - Mark as closed option

**Acceptance Criteria:**
- [ ] All inquiries load correctly
- [ ] Status filters work
- [ ] Responses displayed properly
- [ ] Tap to view full details
- [ ] Mark as closed works

**Files to Create:**
- `src/screens/MyInquiriesScreen.tsx`
- `src/components/InquiryCard.tsx`

---

### Task 5.3: Create Business Inquiries Management Screen (Owner)

**Priority:** Medium
**Estimated Effort:** 6 hours
**Depends On:** Task 1.4

**Description:**
Create a screen for business owners to manage incoming inquiries.

**Implementation Steps:**

1. Create `src/screens/BusinessInquiriesScreen.tsx`

2. Load business inquiries with filters

3. Implement inquiry list:
   - Customer name
   - Inquiry type
   - Status
   - Preview of message
   - Timestamp

4. Implement response feature:
   - Tap to view full inquiry
   - Response text input
   - Send response button
   - Updates status to "Responded"

5. Add inquiry statistics:
   - Total inquiries
   - Pending count
   - Average response time

**Acceptance Criteria:**
- [ ] Inquiries load correctly
- [ ] Statistics accurate
- [ ] Response feature works
- [ ] Status updates properly
- [ ] Notifications for new inquiries (future)

**Files to Create:**
- `src/screens/BusinessInquiriesScreen.tsx`
- `src/components/InquiryDetailModal.tsx`

---

## Phase 6: Analytics & Insights (Week 4)

### Task 6.1: Create Business Analytics Screen

**Priority:** Medium
**Estimated Effort:** 8 hours
**Depends On:** Task 1.2 (Analytics API)

**Description:**
Create an analytics dashboard for business owners.

**Implementation Steps:**

1. Create `src/screens/BusinessAnalyticsScreen.tsx`

2. Implement analytics sections:
   - Overview metrics (views, contacts, inquiries)
   - Period selector (7d, 30d, 90d, All)
   - Charts and graphs
   - Daily statistics
   - Recent activity feed

3. Integrate charting library:
   ```bash
   npm install react-native-chart-kit
   ```

4. Create chart components:
   - Line chart for daily views
   - Bar chart for conversion metrics
   - Pie chart for inquiry types

**Acceptance Criteria:**
- [ ] Analytics load correctly
- [ ] Period selector changes data
- [ ] Charts render properly
- [ ] Activity feed displays recent events
- [ ] Data updates in real-time

**Files to Create:**
- `src/screens/BusinessAnalyticsScreen.tsx`
- `src/components/analytics/MetricsCard.tsx`
- `src/components/analytics/AnalyticsChart.tsx`

**UI/UX Requirements:**
- Card-based metric layout
- Color-coded trend indicators
- Smooth chart animations
- Pull-to-refresh data
- Export data option (future)

---

