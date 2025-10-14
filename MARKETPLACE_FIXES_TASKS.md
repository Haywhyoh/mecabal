# Marketplace Fixes - Developer Tasks

## Overview
This document outlines fixes for three critical issues in the marketplace:
1. Category mismatch when creating property listings
2. Missing sale/lease options for land properties
3. Backend validation errors causing 500 responses

All solutions follow Apple Human Interface Guidelines for iOS/mobile design.

---

## Issue 1: Category Filter Mismatch

### Problem
When user selects "List Property" as listing type, the category dropdown still shows item categories (Electronics, Furniture, Vehicles) instead of property categories (Apartment, House, Land, Office).

### Root Cause
- Property categories exist in backend database (IDs 1-4) but are missing from frontend `MARKETPLACE_CATEGORIES` constant
- Category filtering logic in CreateListingScreen only checks for 'service' vs 'item', ignoring 'property' and 'job' types
- See: `CreateListingScreen.tsx:587-591`

### Task 1.1: Add Property Categories to Constants
**File**: `Hommie_Mobile/src/constants/index.ts`

**Current Code** (lines 510-523):
```typescript
export const MARKETPLACE_CATEGORIES = [
  { id: 'all', name: 'All', icon: 'apps-outline', backendId: null, type: null },
  { id: 'electronics', name: 'Electronics', icon: 'phone-portrait-outline', backendId: 5, type: 'item' },
  { id: 'furniture', name: 'Furniture', icon: 'bed-outline', backendId: 6, type: 'item' },
  // ... only item and service categories (missing property categories)
];
```

**Required Changes**:
Add property categories at the beginning (after 'all'). **Use Ionicons (no emojis)** per Apple HIG:
```typescript
export const MARKETPLACE_CATEGORIES = [
  { id: 'all', name: 'All', icon: 'apps-outline', backendId: null, type: null },
  // Property categories (backend IDs 1-4)
  { id: 'apartment', name: 'Apartment', icon: 'business-outline', backendId: 1, type: 'property' },
  { id: 'house', name: 'House', icon: 'home-outline', backendId: 2, type: 'property' },
  { id: 'land', name: 'Land', icon: 'leaf-outline', backendId: 3, type: 'property' },
  { id: 'office', name: 'Office Space', icon: 'briefcase-outline', backendId: 4, type: 'property' },
  // Item categories (backend IDs 5-9)
  { id: 'electronics', name: 'Electronics', icon: 'phone-portrait-outline', backendId: 5, type: 'item' },
  { id: 'furniture', name: 'Furniture', icon: 'bed-outline', backendId: 6, type: 'item' },
  { id: 'vehicles', name: 'Vehicles', icon: 'car-outline', backendId: 7, type: 'item' },
  { id: 'fashion', name: 'Fashion', icon: 'shirt-outline', backendId: 8, type: 'item' },
  { id: 'home', name: 'Home & Garden', icon: 'home-outline', backendId: 9, type: 'item' },
  // Service categories (backend IDs 10-14)
  { id: 'plumbing', name: 'Plumbing', icon: 'water-outline', backendId: 10, type: 'service' },
  { id: 'electrical', name: 'Electrical', icon: 'flash-outline', backendId: 11, type: 'service' },
  { id: 'cleaning', name: 'Cleaning', icon: 'sparkles-outline', backendId: 12, type: 'service' },
  { id: 'security', name: 'Security', icon: 'shield-checkmark-outline', backendId: 13, type: 'service' },
  { id: 'repairs', name: 'Repairs', icon: 'hammer-outline', backendId: 14, type: 'service' },
];
```

**Important Notes**:
- All icons are Ionicons (SF Symbols-style) - NO emojis
- Ionicons already imported in the app: `import { Ionicons } from '@expo/vector-icons'`
- Backend IDs from `backend/seed-categories.js` lines 17-31

### Task 1.2: Fix Category Filtering Logic
**File**: `Hommie_Mobile/src/screens/CreateListingScreen.tsx`

**Current Code** (lines 585-604):
```typescript
const renderCategorySelection = () => (
  <View style={styles.sectionContainer}>
    <Text style={styles.sectionTitle}>Category *</Text>
    <TouchableOpacity
      style={styles.pickerButton}
      onPress={() => setShowCategoryPicker(!showCategoryPicker)}
    >
      <Text style={styles.pickerButtonText}>
        {category || 'Select a category'}
      </Text>
      <Text style={styles.pickerArrow}>▼</Text>
    </TouchableOpacity>

    {showCategoryPicker && (
      <View style={styles.pickerDropdown}>
        {MARKETPLACE_CATEGORIES
          .filter(cat => cat.backendId !== null && (
            listingType === 'service' ? cat.type === 'service' : cat.type === 'item'
          ))
          .map((cat) => (
            // ... render options
          ))}
      </View>
    )}
  </View>
);
```

**Problem**: The filter only handles 'service' and 'item', defaulting everything else to 'item'

**Required Changes**:
Replace the filter logic (line 588-590) with:
```typescript
{MARKETPLACE_CATEGORIES
  .filter(cat => cat.backendId !== null && cat.type === listingType)
  .map((cat) => (
    // ... render options
  ))}
```

**Explanation**:
- `cat.type === listingType` directly matches the category type to the selected listing type
- This works for all four types: 'property', 'item', 'service', 'job'
- Much simpler and more maintainable than nested ternary

---

## Issue 2: Missing Sale/Lease Options for Properties

### Problem
When listing land or other properties, user only sees "Rental Period" (Monthly/Yearly) options. Properties can also be for sale or long-term lease, not just rent.

### Root Cause
- No "Transaction Type" field to distinguish between Sale, Rent, and Lease
- "Rental Period" field shown for all property types regardless of transaction intent
- Backend DTO doesn't have transactionType field

### Task 2.1: Add Transaction Type State
**File**: `Hommie_Mobile/src/screens/CreateListingScreen.tsx`

**Location**: Add after line 80 (with other property-specific state)

**Code to Add**:
```typescript
const [transactionType, setTransactionType] = useState<'sale' | 'rent' | 'lease'>('rent');
```

### Task 2.2: Add Transaction Type UI Component
**File**: `Hommie_Mobile/src/screens/CreateListingScreen.tsx`

**Location**: Inside `renderPropertyFields()` function, before the "Rental Period" section (before line 1154)

**Code to Add**:
```typescript
{/* Transaction Type */}
<View style={styles.inputGroup}>
  <Text style={styles.inputLabel}>Transaction Type *</Text>
  <View style={styles.transactionTypeSelector}>
    {[
      { value: 'sale', label: 'For Sale', icon: 'cash-outline' },
      { value: 'rent', label: 'For Rent', icon: 'key-outline' },
      { value: 'lease', label: 'For Lease', icon: 'document-text-outline' },
    ].map((type) => (
      <TouchableOpacity
        key={type.value}
        style={[
          styles.transactionTypeOption,
          transactionType === type.value && styles.transactionTypeOptionActive
        ]}
        onPress={() => setTransactionType(type.value as any)}
      >
        <Ionicons
          name={type.icon as any}
          size={20}
          color={transactionType === type.value ? colors.primary : colors.text.light}
        />
        <Text style={[
          styles.transactionTypeText,
          transactionType === type.value && styles.transactionTypeTextActive
        ]}>
          {type.label}
        </Text>
      </TouchableOpacity>
    ))}
  </View>
</View>
```

### Task 2.3: Conditionally Show Rental Period
**File**: `Hommie_Mobile/src/screens/CreateListingScreen.tsx`

**Current Code** (lines 1154-1179):
```typescript
{/* Rental Period */}
<View style={styles.inputGroup}>
  <Text style={styles.inputLabel}>Rental Period</Text>
  <View style={styles.rentalPeriodSelector}>
    // ... rental period options
  </View>
</View>
```

**Required Changes**:
Wrap the entire Rental Period section with a condition:
```typescript
{/* Rental Period - Only show for rent transactions */}
{transactionType === 'rent' && (
  <View style={styles.inputGroup}>
    <Text style={styles.inputLabel}>Rental Period *</Text>
    <View style={styles.rentalPeriodSelector}>
      {[
        { value: 'monthly', label: 'Monthly' },
        { value: 'yearly', label: 'Yearly' },
      ].map((period) => (
        // ... existing code
      ))}
    </View>
  </View>
)}
```

### Task 2.4: Add Transaction Type Styles
**File**: `Hommie_Mobile/src/screens/CreateListingScreen.tsx`

**Location**: Add to StyleSheet at the end of file (after line 2136)

**Code to Add**:
```typescript
transactionTypeSelector: {
  flexDirection: 'row',
  gap: spacing.sm,
},
transactionTypeOption: {
  flexDirection: 'row',
  alignItems: 'center',
  padding: spacing.sm,
  borderRadius: 8,
  borderWidth: 1,
  borderColor: colors.neutral.lightGray,
  gap: spacing.xs,
  flex: 1,
},
transactionTypeOptionActive: {
  borderColor: colors.primary,
  backgroundColor: colors.lightGreen,
},
transactionTypeText: {
  fontSize: typography.sizes.sm,
  color: colors.text.dark,
  fontWeight: typography.weights.medium,
},
transactionTypeTextActive: {
  color: colors.primary,
  fontWeight: typography.weights.semibold,
},
```

### Task 2.5: Update Submit Logic
**File**: `Hommie_Mobile/src/screens/CreateListingScreen.tsx`

**Location**: Inside `handleSubmit()` function, in the property-specific data section (around line 372-385)

**Current Code**:
```typescript
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
}
```

**Required Changes**:
```typescript
} else if (listingType === 'property') {
  const propertyData: any = {
    propertyType,
    transactionType, // Add transaction type
    bedrooms: parseInt(bedrooms) || undefined,
    bathrooms: parseInt(bathrooms) || undefined,
    propertySize: parseFloat(propertySize) || undefined,
    landSize: parseFloat(landSize) || undefined,
    parkingSpaces: parseInt(parkingSpaces) || undefined,
    petPolicy,
    propertyAmenities: amenities.length > 0 ? amenities : undefined, // Rename field
    utilitiesIncluded: utilitiesIncluded.length > 0 ? utilitiesIncluded : undefined,
    securityFeatures: securityFeatures.length > 0 ? securityFeatures : undefined
  };

  // Only include rentalPeriod if transaction type is rent
  if (transactionType === 'rent') {
    propertyData.rentalPeriod = rentalPeriod;
  }

  Object.assign(baseData, propertyData);
}
```

**Key Changes**:
1. Add `transactionType` field
2. Rename `amenities` → `propertyAmenities` to match backend
3. Only include `rentalPeriod` when transaction type is 'rent'

---

## Issue 3: Backend Validation & Field Mapping Errors

### Problem
Creating property listing fails with 500 error:
```json
{
  "error": "Marketplace request failed with status code 400: Bad Request"
}
```

### Root Causes
1. Field name mismatch: Frontend sends `amenities`, backend expects `propertyAmenities`
2. Backend requires `bedrooms`/`bathrooms` for all properties, but these don't apply to land
3. `rentalPeriod` sent for land sales (doesn't make sense)
4. No `transactionType` field in backend DTO

### Task 3.1: Add Transaction Type to Backend DTO
**File**: `backend/apps/marketplace-service/src/listings/dto/create-listing.dto.ts`

**Location**: After line 49 (after PropertyType enum)

**Code to Add**:
```typescript
export enum TransactionType {
  SALE = 'sale',
  RENT = 'rent',
  LEASE = 'lease',
}
```

**Location**: After line 359 (in CreateListingDto class, with property fields)

**Code to Add**:
```typescript
@ApiPropertyOptional({
  description: 'Transaction type for properties',
  enum: TransactionType,
  example: TransactionType.RENT,
})
@IsOptional()
@IsEnum(TransactionType)
transactionType?: TransactionType;
```

### Task 3.2: Make Rental Period Conditional
**File**: `backend/apps/marketplace-service/src/listings/dto/create-listing.dto.ts`

**Current Code** (lines 379-386):
```typescript
@ApiPropertyOptional({
  description: 'Rental period',
  enum: RentalPeriod,
  example: RentalPeriod.YEARLY,
})
@IsOptional()
@IsEnum(RentalPeriod)
rentalPeriod?: RentalPeriod;
```

**Required Changes**:
Update the description to clarify when it's required:
```typescript
@ApiPropertyOptional({
  description: 'Rental period (required only when transactionType is "rent")',
  enum: RentalPeriod,
  example: RentalPeriod.YEARLY,
})
@IsOptional()
@IsEnum(RentalPeriod)
rentalPeriod?: RentalPeriod;
```

### Task 3.3: Make Bedrooms/Bathrooms Conditional
**File**: `backend/apps/marketplace-service/src/listings/dto/create-listing.dto.ts`

**Current Code** (lines 361-377):
```typescript
@ApiPropertyOptional({
  description: 'Number of bedrooms',
  example: 3,
})
@IsOptional()
@IsNumber()
@Min(0)
bedrooms?: number;

@ApiPropertyOptional({
  description: 'Number of bathrooms',
  example: 2,
})
@IsOptional()
@IsNumber()
@Min(0)
bathrooms?: number;
```

**Required Changes**:
Update descriptions to clarify when required:
```typescript
@ApiPropertyOptional({
  description: 'Number of bedrooms (required for apartments and houses)',
  example: 3,
})
@IsOptional()
@IsNumber()
@Min(0)
bedrooms?: number;

@ApiPropertyOptional({
  description: 'Number of bathrooms (required for apartments and houses)',
  example: 2,
})
@IsOptional()
@IsNumber()
@Min(0)
bathrooms?: number;
```

### Task 3.4: Add Custom Validation Logic (Optional but Recommended)
**File**: `backend/apps/marketplace-service/src/listings/listings.service.ts`

**Location**: In the `createListing()` method, add validation before saving

**Code to Add**:
```typescript
// Validate property-specific requirements
if (createListingDto.listingType === ListingType.PROPERTY) {
  const { propertyType, bedrooms, bathrooms, transactionType, rentalPeriod } = createListingDto;

  // Apartments and houses require bedrooms and bathrooms
  if ((propertyType === PropertyType.APARTMENT || propertyType === PropertyType.HOUSE)) {
    if (!bedrooms || bedrooms < 1) {
      throw new BadRequestException(`${propertyType} listings must specify number of bedrooms`);
    }
    if (!bathrooms || bathrooms < 1) {
      throw new BadRequestException(`${propertyType} listings must specify number of bathrooms`);
    }
  }

  // Rental period only required for rent transactions
  if (transactionType === TransactionType.RENT && !rentalPeriod) {
    throw new BadRequestException('Rental period is required for rent transactions');
  }

  // Rental period should not be provided for sales/leases
  if (transactionType !== TransactionType.RENT && rentalPeriod) {
    throw new BadRequestException('Rental period should only be specified for rent transactions');
  }
}
```

**Import Required**:
```typescript
import { BadRequestException } from '@nestjs/common';
```

---

## Issue 4: Hierarchical Category Filtering (Enhancement)

### Problem
Current marketplace filter shows all categories in a flat list. Better UX would show main categories first (Properties, Goods, Services, Jobs), then subcategories.

### Task 4.1: Add Main Category Constants
**File**: `Hommie_Mobile/src/constants/index.ts`

**Location**: Add before MARKETPLACE_CATEGORIES (around line 510)

**Code to Add**:
```typescript
// Main marketplace categories for hierarchical filtering (Ionicons - no emojis)
export const MARKETPLACE_MAIN_CATEGORIES = [
  { id: 'property', label: 'Properties', icon: 'home-outline', type: 'property' },
  { id: 'item', label: 'Goods', icon: 'cube-outline', type: 'item' },
  { id: 'service', label: 'Services', icon: 'construct-outline', type: 'service' },
  { id: 'job', label: 'Jobs', icon: 'briefcase-outline', type: 'job' },
];
```

**Note**: Icons are Ionicons (SF Symbols-compatible), NOT emojis. This follows Apple HIG.

### Task 4.2: Add Hierarchical Filter State
**File**: `Hommie_Mobile/src/screens/MarketplaceScreen.tsx`

**Location**: Add after line 18 (with other state declarations)

**Code to Add**:
```typescript
const [selectedMainCategory, setSelectedMainCategory] = useState<string | null>(null);
const [showSubcategories, setShowSubcategories] = useState(false);
```

### Task 4.3: Update Categories Display
**File**: `Hommie_Mobile/src/screens/MarketplaceScreen.tsx`

**Current Code** (lines 163-170):
```typescript
const categories = [
  { id: null, label: 'All', icon: 'apps-outline' },
  { id: 5, label: 'Electronics', icon: 'phone-portrait-outline' },
  { id: 6, label: 'Furniture', icon: 'bed-outline' },
  { id: 7, label: 'Vehicles', icon: 'car-outline' },
  { id: 10, label: 'Services', icon: 'construct-outline' },
  { id: 1, label: 'Property', icon: 'home-outline' },
];
```

**Required Changes**:
Replace with:
```typescript
// Show main categories or subcategories based on selection
const displayCategories = selectedMainCategory
  ? MARKETPLACE_CATEGORIES.filter(cat => cat.type === selectedMainCategory)
  : MARKETPLACE_MAIN_CATEGORIES.map(mainCat => ({
      id: mainCat.type,
      label: mainCat.label,
      icon: mainCat.icon,
      isMainCategory: true,
    }));
```

### Task 4.4: Update Category Selection Handler
**File**: `Hommie_Mobile/src/screens/MarketplaceScreen.tsx`

**Current Code** (line 148-150):
```typescript
const handleCategorySelect = useCallback((categoryId: number | null) => {
  setSelectedCategory(categoryId);
}, []);
```

**Required Changes**:
```typescript
const handleCategorySelect = useCallback((categoryId: number | null, isMainCategory = false) => {
  if (isMainCategory) {
    // User clicked a main category, show subcategories
    setSelectedMainCategory(categoryId as string);
    setShowSubcategories(true);
  } else {
    // User clicked a subcategory, apply filter
    setSelectedCategory(categoryId);
    setShowSubcategories(false);
  }
}, []);

const handleBackToMainCategories = useCallback(() => {
  setSelectedMainCategory(null);
  setShowSubcategories(false);
  setSelectedCategory(null);
}, []);
```

### Task 4.5: Update Category Chips Rendering
**File**: `Hommie_Mobile/src/screens/MarketplaceScreen.tsx`

**Location**: Update the categories ScrollView section (lines 270-304)

**Add Before ScrollView**:
```typescript
{selectedMainCategory && (
  <TouchableOpacity
    style={styles.backButton}
    onPress={handleBackToMainCategories}
    activeOpacity={0.7}
  >
    <Ionicons name="arrow-back" size={20} color={colors.primary} />
    <Text style={styles.backButtonText}>Back to Categories</Text>
  </TouchableOpacity>
)}
```

**Update the map function** to handle new structure:
```typescript
{displayCategories.map((item: any) => (
  <TouchableOpacity
    key={item.id?.toString() || 'all'}
    style={[
      styles.categoryChip,
      (item.isMainCategory
        ? selectedMainCategory === item.id
        : selectedCategory === item.backendId
      ) && styles.categoryChipActive
    ]}
    onPress={() => handleCategorySelect(
      item.isMainCategory ? item.id : item.backendId,
      item.isMainCategory
    )}
    activeOpacity={0.7}
  >
    {/* ... rest of chip rendering */}
  </TouchableOpacity>
))}
```

### Task 4.6: Add Styles for Back Button
**File**: `Hommie_Mobile/src/screens/MarketplaceScreen.tsx`

**Location**: Add to StyleSheet (after line 570)

**Code to Add**:
```typescript
backButton: {
  flexDirection: 'row',
  alignItems: 'center',
  paddingHorizontal: spacing.md,
  paddingVertical: spacing.sm,
  gap: spacing.xs,
},
backButtonText: {
  ...typography.styles.subhead,
  color: colors.primary,
  fontWeight: typography.weights.medium,
},
```

---

## Testing Checklist

### Test Case 1: Property Category Filtering
- [ ] Start creating a listing
- [ ] Select "List Property"
- [ ] Open category dropdown
- [ ] Verify only property categories shown (Apartment, House, Land, Office Space)
- [ ] Select each category, verify it displays correctly
- [ ] Switch to "Sell Item", verify item categories shown
- [ ] Switch to "Offer Service", verify service categories shown

### Test Case 2: Transaction Types
- [ ] Create property listing
- [ ] Select "Land" as property type
- [ ] Verify "Transaction Type" appears with 3 options
- [ ] Select "For Sale"
- [ ] Verify "Rental Period" is hidden
- [ ] Select "For Rent"
- [ ] Verify "Rental Period" appears
- [ ] Select "For Lease"
- [ ] Verify "Rental Period" is hidden

### Test Case 3: Land Listing Submission
- [ ] Create land listing
- [ ] Select "For Sale" transaction type
- [ ] Fill required fields (title, description, price, location, land size)
- [ ] Upload at least one image
- [ ] Submit listing
- [ ] Verify no 500 error
- [ ] Verify listing created successfully

### Test Case 4: Apartment Rental Submission
- [ ] Create property listing
- [ ] Select "Apartment" property type
- [ ] Select "For Rent" transaction type
- [ ] Fill all fields including bedrooms, bathrooms
- [ ] Select rental period (Monthly or Yearly)
- [ ] Add amenities
- [ ] Submit listing
- [ ] Verify listing created successfully

### Test Case 5: Hierarchical Filtering (if implemented)
- [ ] Open marketplace
- [ ] Verify main categories shown (Properties, Goods, Services, Jobs)
- [ ] Tap "Properties"
- [ ] Verify subcategories shown (Apartment, House, Land, Office)
- [ ] Verify "Back to Categories" button appears
- [ ] Select a subcategory
- [ ] Verify listings filtered correctly
- [ ] Tap back button
- [ ] Verify returns to main categories

---

## Apple HIG Design Principles Applied

### 1. **Clarity**
- Clear, descriptive labels: "For Sale" vs "For Rent" vs "For Lease"
- Conditional field visibility prevents confusion
- Hierarchical categories reduce cognitive load
- **Professional iconography**: SF Symbols-style icons (Ionicons) instead of emojis

### 2. **Direct Manipulation**
- Segmented controls for mutually exclusive choices (transaction type)
- Chip-based selection for categories (familiar iOS pattern)
- Immediate visual feedback on selection
- Touch targets meet minimum 44x44pt iOS standard

### 3. **Consistency**
- All selectors use same iOS-style chips/buttons
- Color scheme matches iOS guidelines (primary green, light backgrounds)
- Typography follows iOS standards (SF Pro Display/Text)
- **Icon system**: Ionicons throughout - no emoji usage (professional, platform-consistent)

### 4. **Feedback**
- Selected state clearly indicated with color change
- Disabled fields hidden rather than shown as disabled
- Form validation with clear error messages
- Haptic feedback on interactions (iOS native)

### 5. **Progressive Disclosure**
- Main categories first, then subcategories
- Rental period only shown when relevant
- Property-specific fields only for properties

### 6. **Platform Conventions**
- Uses iOS system icons (SF Symbols via Ionicons)
- Follows iOS design language (not Material Design)
- No emojis - professional icon system
- Proper use of iOS spacing (8pt grid)

---

## Technical Notes

### Frontend Dependencies
No new dependencies required. Uses existing:
- React Native core components
- **Ionicons** for all icons (SF Symbols-style, already installed via `@expo/vector-icons`)
- TypeScript for type safety

**Icon Note**: All icons use Ionicons library, NOT emojis. This provides:
- Professional, consistent appearance
- Platform-native feel (SF Symbols on iOS)
- Proper sizing and alignment
- Accessibility support

### Backend Dependencies
No new dependencies required. Uses existing:
- class-validator for DTO validation
- NestJS decorators

### Database Changes
**None required**. Property categories already exist in database from seed-categories.js.

### API Contract Changes
New field added to request body:
```typescript
{
  "listingType": "property",
  "transactionType": "sale", // NEW FIELD
  "propertyType": "land",
  "propertyAmenities": [...], // RENAMED from "amenities"
  // rentalPeriod only included if transactionType is "rent"
}
```

---

## Estimated Time

| Task | Time Estimate |
|------|---------------|
| Task 1.1: Add property categories constant | 5 min |
| Task 1.2: Fix category filtering logic | 10 min |
| Task 2.1-2.5: Add transaction type (frontend) | 30 min |
| Task 3.1-3.4: Backend DTO updates | 30 min |
| Task 4.1-4.6: Hierarchical filtering (optional) | 45 min |
| Testing all scenarios | 30 min |
| **Total** | **2.5 hours** (2 hours without optional Task 4) |

---

## Priority Order

1. **High Priority** (Fixes critical bugs):
   - Task 1.1 & 1.2: Category filtering
   - Task 2.1-2.5: Transaction type
   - Task 3.1-3.2: Backend DTO transactionType

2. **Medium Priority** (Improves validation):
   - Task 3.3-3.4: Conditional validation

3. **Low Priority** (UX enhancement):
   - Task 4.1-4.6: Hierarchical filtering

---

## Questions for Product Owner

1. Should "For Lease" support both short-term and long-term leases, or is it distinct from rent?
2. For office spaces, are amenities/utilities similar to residential, or should we add office-specific options?
3. Should we add job categories in this sprint, or leave for later?
4. Do you want hierarchical filtering (Task 4) in this release, or can it wait?

---

## Support

For questions or issues during implementation:
- Check existing code patterns in other screens (consistency)
- Refer to Apple HIG: https://developer.apple.com/design/human-interface-guidelines/
- Backend validation docs: `backend/API_Documentation.md`
