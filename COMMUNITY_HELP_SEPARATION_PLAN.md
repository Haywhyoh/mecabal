# Community Help/Errands Separation - Implementation Plan

## Executive Summary
Separate the Community Help feature from Marketplace to create two distinct experiences:
- **Marketplace**: Commercial transactions (Properties, Goods, Professional Services)
- **Community Help**: Neighborly favors (Errands, Tasks, Recommendations, Advice, Borrow/Lend)

**Scope**: Mobile App + Backend
**Estimated Time**: 3-4 days (24-32 hours)
**Priority**: High - Critical UX improvement

---

## Phase 1: Update Help Categories (Remove Jobs, Add New Categories)

### FRONTEND TASKS

#### Task 1.1: Update Help Categories Constants
**File**: `Hommie_Mobile/src/constants/index.ts`
**Time**: 30 min
**Priority**: P0 - Critical

**Current** (inferred from PART4 doc):
```typescript
const HELP_CATEGORIES = [
  { id: 'errand', label: 'Errands' },
  { id: 'job', label: 'Jobs' },  // ❌ Remove
  { id: 'recommendation', label: 'Recommendations' },
  { id: 'advice', label: 'Advice' },
];
```

**New**:
```typescript
export const COMMUNITY_HELP_CATEGORIES = [
  { id: 'errand', label: 'Quick Errands', icon: 'bicycle', description: 'Quick neighborhood favors' },
  { id: 'task', label: 'Tasks & Favors', icon: 'hand-helping', description: 'Small jobs and help' },
  { id: 'recommendation', label: 'Recommendations', icon: 'star', description: 'Ask for advice on services' },
  { id: 'advice', label: 'Advice & Tips', icon: 'lightbulb', description: 'Get community input' },
  { id: 'borrow', label: 'Borrow/Lend', icon: 'sync', description: 'Share items temporarily' },
];

// Add example templates
export const HELP_REQUEST_EXAMPLES = {
  errand: [
    'Can someone pick up my package from the gate?',
    'Need groceries delivered, willing to pay',
    'Anyone going to the market? Can you help?'
  ],
  task: [
    'Help moving furniture this Saturday',
    'Need someone to walk my dog for a week',
    'Looking for help with garden cleanup'
  ],
  borrow: [
    'Can I borrow a ladder for the weekend?',
    'Looking to borrow a pressure washer',
    'Need a generator for tomorrow evening'
  ],
  recommendation: [
    'Recommend a good plumber in the estate',
    'Best place to buy fresh fish nearby?',
    'Reliable generator repair person?'
  ],
  advice: [
    'How do I deal with persistent mosquitoes?',
    'Best way to maintain my compound garden?',
    'Tips for organizing estate security?'
  ]
};
```

**Acceptance Criteria**:
- ✅ New categories added to constants
- ✅ Job category removed
- ✅ Example templates added
- ✅ Icons use Ionicons (no emojis)

---

#### Task 1.2: Update HelpPostCard Component
**File**: `Hommie_Mobile/src/components/HelpPostCard.tsx`
**Time**: 45 min
**Priority**: P0 - Critical

**Location**: Update `getHelpIcon()` function (around line 39-47)

**Updates needed**:
1. Update `getHelpIcon()` to include new categories (task, borrow)
2. Add helper text showing category context
3. Update "I Can Help" button text based on category
4. Add visual distinction for borrow/lend requests

**Code Changes**:
```typescript
const getHelpIcon = () => {
  switch (post.helpCategory) {
    case 'errand': return 'bicycle';
    case 'task': return 'hand-helping';  // NEW
    case 'borrow': return 'sync';  // NEW
    case 'recommendation': return 'star';
    case 'advice': return 'lightbulb';
    default: return 'help-circle';
  }
};

const getActionButtonText = () => {
  switch (post.helpCategory) {
    case 'errand': return 'I Can Help';
    case 'task': return 'I Can Do This';
    case 'borrow': return 'I Can Lend';
    case 'recommendation': return 'I Recommend';
    case 'advice': return 'Share Advice';
    default: return 'Respond';
  }
};

const getCategoryLabel = () => {
  switch (post.helpCategory) {
    case 'errand': return 'Quick Errand';
    case 'task': return 'Task';
    case 'borrow': return 'Borrow/Lend';
    case 'recommendation': return 'Recommendation';
    case 'advice': return 'Advice';
    default: return 'Help Request';
  }
};
```

**Visual Updates**:
Add category badge with color coding:
```typescript
const getCategoryColor = () => {
  switch (post.helpCategory) {
    case 'errand': return '#FF6B35';  // Orange
    case 'task': return '#9C27B0';    // Purple
    case 'borrow': return '#2196F3';  // Blue
    case 'recommendation': return '#FFC107';  // Yellow
    case 'advice': return '#00BCD4';  // Cyan
    default: return '#8E8E93';
  }
};
```

**Acceptance Criteria**:
- ✅ New icons for task and borrow categories
- ✅ Action button text changes per category
- ✅ Category badge shows with color
- ✅ Job category removed from switch statements

---

#### Task 1.3: Update CreateHelpPostScreen
**File**: `Hommie_Mobile/src/screens/CreateHelpPostScreen.tsx`
**Time**: 1 hour
**Priority**: P0 - Critical

**Updates needed**:
1. Remove "job" category option
2. Add "task" and "borrow" categories
3. Update form fields based on category:
   - Borrow: Add "borrow duration", "condition notes"
   - Task: Add "task type", "estimated duration"
4. Add example templates per category
5. Update validation rules

**Category Selection Update**:
```typescript
const HELP_CATEGORIES = [
  { id: 'errand', label: 'Quick Errands', icon: 'bicycle', color: '#FF6B35' },
  { id: 'task', label: 'Tasks & Favors', icon: 'hand-helping', color: '#9C27B0' },
  { id: 'borrow', label: 'Borrow/Lend', icon: 'sync', color: '#2196F3' },
  { id: 'recommendation', label: 'Recommendations', icon: 'star', color: '#FFC107' },
  { id: 'advice', label: 'Advice & Tips', icon: 'lightbulb', color: '#00BCD4' },
];
```

**Add Conditional Fields**:
```typescript
{/* Borrow-specific fields */}
{selectedCategory === 'borrow' && (
  <>
    <View style={styles.section}>
      <Text style={styles.label}>What do you need?</Text>
      <TextInput
        style={styles.input}
        placeholder="e.g., Ladder, Pressure washer, Generator"
        value={borrowItem}
        onChangeText={setBorrowItem}
      />
    </View>

    <View style={styles.section}>
      <Text style={styles.label}>How long do you need it?</Text>
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
            onPress={() => setBorrowDuration(duration.value)}
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
      <Text style={styles.label}>Condition Notes (Optional)</Text>
      <TextInput
        style={[styles.input, styles.textArea]}
        placeholder="Any specific condition requirements..."
        value={conditionNotes}
        onChangeText={setConditionNotes}
        multiline
        numberOfLines={3}
      />
    </View>
  </>
)}

{/* Task-specific fields */}
{selectedCategory === 'task' && (
  <>
    <View style={styles.section}>
      <Text style={styles.label}>Task Type</Text>
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
            onPress={() => setTaskType(type.value)}
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
      <Text style={styles.label}>Estimated Duration</Text>
      <TextInput
        style={styles.input}
        placeholder="e.g., 2 hours, Half day"
        value={estimatedDuration}
        onChangeText={setEstimatedDuration}
      />
    </View>
  </>
)}
```

**Add Example Templates Display**:
```typescript
{/* Show examples for selected category */}
{selectedCategory && (
  <View style={styles.examplesCard}>
    <Text style={styles.examplesTitle}>Example Requests:</Text>
    {HELP_REQUEST_EXAMPLES[selectedCategory]?.map((example, index) => (
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
```

**Update Validation**:
```typescript
const validateForm = () => {
  if (!selectedCategory) {
    Alert.alert('Missing Category', 'Please select a help category');
    return false;
  }

  if (!content.trim() || content.length < 20) {
    Alert.alert('Content Too Short', 'Please describe your request (min 20 characters)');
    return false;
  }

  // Borrow-specific validation
  if (selectedCategory === 'borrow') {
    if (!borrowItem.trim()) {
      Alert.alert('Missing Information', 'Please specify what you need to borrow');
      return false;
    }
    if (!borrowDuration) {
      Alert.alert('Missing Information', 'Please specify how long you need it');
      return false;
    }
  }

  // Task-specific validation
  if (selectedCategory === 'task') {
    if (!taskType) {
      Alert.alert('Missing Information', 'Please select a task type');
      return false;
    }
  }

  return true;
};
```

**Acceptance Criteria**:
- ✅ Job category removed from options
- ✅ Task and Borrow categories added
- ✅ Conditional fields show for borrow/task
- ✅ Example templates display and are tappable
- ✅ Validation works for new fields
- ✅ Form submits with correct data structure

---

### BACKEND TASKS

#### Task 1.4: Update Post Entity
**File**: `backend/libs/database/src/entities/post.entity.ts`
**Time**: 30 min
**Priority**: P0 - Critical

**Current** (lines 61-67):
```typescript
@Column({ name: 'help_category', length: 50, nullable: true })
helpCategory?: string; // 'job', 'errand', 'recommendation', 'advice'
```

**Update validation enum**:
```typescript
@ApiProperty({
  description: 'Help category (required if postType is help)',
  enum: ['errand', 'task', 'recommendation', 'advice', 'borrow'],  // UPDATED
  required: false,
})
@Column({ name: 'help_category', length: 50, nullable: true })
helpCategory?: string;

// Add new fields for borrow category
@ApiProperty({
  description: 'Borrow duration (for borrow requests)',
  enum: ['few_hours', 'day', 'few_days', 'week'],
  required: false,
})
@Column({ name: 'borrow_duration', length: 50, nullable: true })
borrowDuration?: string;

@ApiProperty({
  description: 'Item to borrow (for borrow requests)',
  required: false,
})
@Column({ name: 'borrow_item', length: 200, nullable: true })
borrowItem?: string;

@ApiProperty({
  description: 'Item condition notes (for borrow requests)',
  required: false,
})
@Column({ name: 'item_condition', type: 'text', nullable: true })
itemCondition?: string;

// Add new fields for task category
@ApiProperty({
  description: 'Task type (for task requests)',
  required: false,
})
@Column({ name: 'task_type', length: 50, nullable: true })
taskType?: string;

@ApiProperty({
  description: 'Estimated duration (for task requests)',
  required: false,
})
@Column({ name: 'estimated_duration', length: 100, nullable: true })
estimatedDuration?: string;
```

**Acceptance Criteria**:
- ✅ Help category enum updated
- ✅ Job removed from valid values
- ✅ Borrow-specific fields added
- ✅ Task-specific fields added
- ✅ All fields properly documented

---

#### Task 1.5: Create Database Migration
**File**: `backend/libs/database/src/migrations/[timestamp]-UpdateHelpCategories.ts`
**Time**: 30 min
**Priority**: P0 - Critical

**Create new migration file**:
```typescript
import { MigrationInterface, QueryRunner } from 'typeorm';

export class UpdateHelpCategories1234567890123 implements MigrationInterface {
  name = 'UpdateHelpCategories1234567890123';

  public async up(queryRunner: QueryRunner): Promise<void> {
    // Add new columns for borrow category
    await queryRunner.query(`
      ALTER TABLE posts
      ADD COLUMN IF NOT EXISTS borrow_duration VARCHAR(50),
      ADD COLUMN IF NOT EXISTS borrow_item VARCHAR(200),
      ADD COLUMN IF NOT EXISTS item_condition TEXT
    `);

    // Add new columns for task category
    await queryRunner.query(`
      ALTER TABLE posts
      ADD COLUMN IF NOT EXISTS task_type VARCHAR(50),
      ADD COLUMN IF NOT EXISTS estimated_duration VARCHAR(100)
    `);

    // Update existing 'job' help posts to 'task'
    await queryRunner.query(`
      UPDATE posts
      SET help_category = 'task'
      WHERE help_category = 'job' AND post_type = 'help'
    `);

    console.log('✅ Help categories updated: job → task, new fields added');
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    // Revert task back to job
    await queryRunner.query(`
      UPDATE posts
      SET help_category = 'job'
      WHERE help_category = 'task' AND post_type = 'help'
    `);

    // Remove new columns
    await queryRunner.query(`
      ALTER TABLE posts
      DROP COLUMN IF EXISTS borrow_duration,
      DROP COLUMN IF EXISTS borrow_item,
      DROP COLUMN IF EXISTS item_condition,
      DROP COLUMN IF EXISTS task_type,
      DROP COLUMN IF EXISTS estimated_duration
    `);

    console.log('✅ Help categories migration rolled back');
  }
}
```

**Run migration**:
```bash
cd backend
npm run migration:run
```

**Acceptance Criteria**:
- ✅ Migration creates new columns
- ✅ Existing job posts converted to task
- ✅ Migration is reversible
- ✅ No data loss
- ✅ Runs without errors

---

#### Task 1.6: Update CreatePostDto
**File**: `backend/apps/social-service/src/posts/dto/create-post.dto.ts`
**Time**: 30 min
**Priority**: P0 - Critical

**Add validation for new categories**:
```typescript
@ApiPropertyOptional({
  description: 'Help category',
  enum: ['errand', 'task', 'recommendation', 'advice', 'borrow'],
  example: 'errand',
})
@IsOptional()
@IsEnum(['errand', 'task', 'recommendation', 'advice', 'borrow'], {
  message: 'Help category must be one of: errand, task, recommendation, advice, borrow'
})
helpCategory?: string;

@ApiPropertyOptional({
  description: 'Borrow duration (required if helpCategory is borrow)',
  enum: ['few_hours', 'day', 'few_days', 'week'],
  example: 'day',
})
@IsOptional()
@IsEnum(['few_hours', 'day', 'few_days', 'week'])
@ValidateIf((o) => o.helpCategory === 'borrow')
@IsNotEmpty({ message: 'Borrow duration is required for borrow requests' })
borrowDuration?: string;

@ApiPropertyOptional({
  description: 'Item to borrow (required if helpCategory is borrow)',
  example: 'Ladder',
})
@IsOptional()
@IsString()
@MaxLength(200)
@ValidateIf((o) => o.helpCategory === 'borrow')
@IsNotEmpty({ message: 'Borrow item is required for borrow requests' })
borrowItem?: string;

@ApiPropertyOptional({
  description: 'Item condition notes (for borrow requests)',
  example: 'Prefer one in good working condition',
})
@IsOptional()
@IsString()
@MaxLength(500)
itemCondition?: string;

@ApiPropertyOptional({
  description: 'Task type (for task requests)',
  example: 'moving',
})
@IsOptional()
@IsString()
@MaxLength(50)
taskType?: string;

@ApiPropertyOptional({
  description: 'Estimated duration (for task requests)',
  example: '2 hours',
})
@IsOptional()
@IsString()
@MaxLength(100)
estimatedDuration?: string;
```

**Update validation logic in posts.service.ts**:
```typescript
async createPost(userId: string, dto: CreatePostDto): Promise<Post> {
  // Validate help category specific fields
  if (dto.postType === 'help') {
    if (!dto.helpCategory) {
      throw new BadRequestException('Help category is required for help posts');
    }

    // Borrow-specific validation
    if (dto.helpCategory === 'borrow') {
      if (!dto.borrowItem || !dto.borrowDuration) {
        throw new BadRequestException('Borrow item and duration are required for borrow requests');
      }
    }

    // Reject job category
    if (dto.helpCategory === 'job') {
      throw new BadRequestException('Job category is no longer supported. Use "task" instead.');
    }
  }

  // ... rest of creation logic
}
```

**Acceptance Criteria**:
- ✅ New categories validated
- ✅ Job category rejected with helpful message
- ✅ Borrow fields required when category is borrow
- ✅ Task fields optional
- ✅ All field lengths validated

---

## Phase 2: Remove Jobs from Marketplace

### FRONTEND TASKS

#### Task 2.1: Update Marketplace Categories
**File**: `Hommie_Mobile/src/constants/index.ts`
**Time**: 15 min
**Priority**: P0 - Critical

**Remove job type** from MARKETPLACE_CATEGORIES constant:
```typescript
export const MARKETPLACE_MAIN_CATEGORIES = [
  { id: 'property', label: 'Properties', icon: 'home-outline', type: 'property' },
  { id: 'item', label: 'Goods', icon: 'cube-outline', type: 'item' },
  { id: 'service', label: 'Services', icon: 'construct-outline', type: 'service' },
  // ❌ REMOVED: { id: 'job', label: 'Jobs', icon: 'briefcase-outline', type: 'job' },
];
```

**Update any comments/documentation**:
```typescript
/**
 * Marketplace Categories
 *
 * MARKETPLACE IS FOR:
 * - Properties: Real estate for rent/sale
 * - Goods: Physical items for sale
 * - Services: Professional business services (plumbers, electricians, etc.)
 *
 * NOT FOR:
 * - Jobs/Employment: Removed - use Community Help "Tasks" instead
 * - Neighbor favors: Use Community Help
 */
```

**Acceptance Criteria**:
- ✅ Job category removed from constants
- ✅ Only 3 main categories remain
- ✅ Documentation updated
- ✅ No references to jobs in marketplace

---

#### Task 2.2: Update CreateListingScreen
**File**: `Hommie_Mobile/src/screens/CreateListingScreen.tsx`
**Time**: 30 min
**Priority**: P0 - Critical

**Remove job listing type** (line 30):
```typescript
// BEFORE
const [listingType, setListingType] = useState<'property' | 'item' | 'service' | 'job'>('item');

// AFTER
const [listingType, setListingType] = useState<'property' | 'item' | 'service'>('item');
```

**Remove job type selector** (in renderListingTypeSelector around line 421-426):
```typescript
// REMOVE this entire option:
// { key: 'job', label: '💼 Post Job', desc: 'Hire for a position' },

// Keep only these:
const renderListingTypeSelector = () => (
  <View style={styles.sectionContainer}>
    <Text style={styles.sectionTitle}>What type of listing?</Text>
    <View style={styles.typeSelector}>
      {[
        { key: 'item', label: 'Sell Item', icon: 'cube-outline', desc: 'Physical products and goods' },
        { key: 'service', label: 'Offer Service', icon: 'construct-outline', desc: 'Professional services' },
        { key: 'property', label: 'List Property', icon: 'home-outline', desc: 'Rent or sell property' },
      ].map((type) => (
        // ... render type option
      ))}
    </View>
  </View>
);
```

**Remove job-specific state** (lines 57-71):
```typescript
// DELETE all job-specific state variables:
// const [employmentType, setEmploymentType] = useState<'full_time' | 'part_time' | 'contract' | 'freelance'>('full_time');
// const [salaryMin, setSalaryMin] = useState('');
// const [salaryMax, setSalaryMax] = useState('');
// const [workLocation, setWorkLocation] = useState<'remote' | 'on_site' | 'hybrid'>('on_site');
// const [requiredSkills, setRequiredSkills] = useState<string[]>([]);
// const [requiredExperience, setRequiredExperience] = useState('');
// const [education, setEducation] = useState('');
// const [benefits, setBenefits] = useState<string[]>([]);
// const [applicationDeadline, setApplicationDeadline] = useState<Date | null>(null);
// const [companyName, setCompanyName] = useState('');
// const [companySize, setCompanySize] = useState('');
// const [companyIndustry, setCompanyIndustry] = useState('');
// const [companyWebsite, setCompanyWebsite] = useState('');
```

**Remove renderJobFields function** (lines 810-1017):
```typescript
// DELETE entire function:
// const renderJobFields = () => { ... }
```

**Remove job validation** in handleSubmit (around line 264-277):
```typescript
// DELETE this entire validation block:
/*
if (listingType === 'job') {
  if (!salaryMin || !salaryMax || isNaN(parseFloat(salaryMin)) || isNaN(parseFloat(salaryMax))) {
    Alert.alert('Missing Information', 'Please enter valid salary range.');
    return;
  }
  if (requiredSkills.length === 0) {
    Alert.alert('Missing Information', 'Please enter at least one required skill.');
    return;
  }
  if (!companyName) {
    Alert.alert('Missing Information', 'Please enter company name.');
    return;
  }
}
*/
```

**Remove job submission logic** in handleSubmit (around line 354-371):
```typescript
// DELETE this entire block:
/*
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
}
*/
```

**Remove call to renderJobFields** (around line 1490):
```typescript
// DELETE this line:
// {renderJobFields()}
```

**Remove job-specific styles** (lines 1886-1969):
```typescript
// DELETE all these style definitions:
// employmentTypeSelector, employmentChip, employmentChipActive, employmentText,
// employmentTextActive, salaryRangeGroup, salaryInputs, salaryDivider,
// workLocationSelector, workLocationOption, workLocationOptionActive,
// workLocationText, workLocationTextActive, datePickerButton, dateText,
// companyInfoGroup
```

**Acceptance Criteria**:
- ✅ Job type removed from type selector
- ✅ Job state variables deleted
- ✅ Job validation removed
- ✅ Job submission logic removed
- ✅ Job fields rendering removed
- ✅ Job styles removed
- ✅ No TypeScript errors
- ✅ App compiles successfully

---

#### Task 2.3: Update MarketplaceScreen Filters
**File**: `Hommie_Mobile/src/screens/MarketplaceScreen.tsx`
**Time**: 15 min
**Priority**: P0 - Critical

**Remove Jobs from category filter** (around lines 163-170):
```typescript
// If there's a hardcoded categories array, remove job entry
const categories = [
  { id: null, label: 'All', icon: 'apps-outline' },
  { id: 5, label: 'Electronics', icon: 'phone-portrait-outline' },
  { id: 6, label: 'Furniture', icon: 'bed-outline' },
  { id: 7, label: 'Vehicles', icon: 'car-outline' },
  { id: 10, label: 'Services', icon: 'construct-outline' },
  { id: 1, label: 'Property', icon: 'home-outline' },
  // ❌ REMOVE if exists: { id: X, label: 'Jobs', icon: 'briefcase-outline' },
];
```

**Update filter logic** to only show property, item, service:
```typescript
// Ensure hierarchical filtering (if implemented) excludes jobs
const displayCategories = selectedMainCategory
  ? MARKETPLACE_CATEGORIES.filter(cat =>
      cat.type === selectedMainCategory &&
      cat.type !== 'job'  // Explicit exclusion
    )
  : MARKETPLACE_MAIN_CATEGORIES.filter(cat => cat.type !== 'job');
```

**Acceptance Criteria**:
- ✅ Jobs removed from filter options
- ✅ Only 3 main categories shown
- ✅ Filtering works correctly
- ✅ No job listings appear

---

### BACKEND TASKS

#### Task 2.4: Update Listing Entity
**File**: `backend/libs/database/src/entities/listing.entity.ts`
**Time**: 30 min
**Priority**: P1 - High

**Mark job fields as deprecated** (don't remove for backward compatibility):
```typescript
/**
 * @deprecated Job listings are no longer supported in Marketplace.
 * Use Community Help 'task' category instead.
 * This field is kept for backward compatibility with existing data.
 */
@ApiPropertyOptional({
  description: 'Employment type (DEPRECATED - use Community Help for jobs)',
  enum: EmploymentType,
  deprecated: true,
})
@Column({ name: 'employment_type', nullable: true })
employmentType?: EmploymentType;

/**
 * @deprecated See employmentType deprecation notice
 */
@ApiPropertyOptional({
  description: 'Minimum salary (DEPRECATED)',
  deprecated: true,
})
@Column({ name: 'salary_min', type: 'decimal', precision: 12, scale: 2, nullable: true })
salaryMin?: number;

/**
 * @deprecated See employmentType deprecation notice
 */
@ApiPropertyOptional({
  description: 'Maximum salary (DEPRECATED)',
  deprecated: true,
})
@Column({ name: 'salary_max', type: 'decimal', precision: 12, scale: 2, nullable: true })
salaryMax?: number;

// ... mark all other job-related fields as deprecated similarly
```

**Acceptance Criteria**:
- ✅ Job fields marked as deprecated
- ✅ Deprecation notices added
- ✅ Fields not removed (backward compatibility)
- ✅ Documentation updated

---

#### Task 2.5: Update CreateListingDto
**File**: `backend/apps/marketplace-service/src/listings/dto/create-listing.dto.ts`
**Time**: 30 min
**Priority**: P0 - Critical

**Update enum** (line 32-37):
```typescript
export enum ListingType {
  PROPERTY = 'property',
  ITEM = 'item',
  SERVICE = 'service',
  // @deprecated Use Community Help 'task' category for job postings
  // JOB = 'job',
}
```

**Update validation in listings.service.ts**:
```typescript
async createListing(userId: string, dto: CreateListingDto): Promise<Listing> {
  // Reject job listings
  if (dto.listingType === 'job') {
    throw new BadRequestException(
      'Job listings are no longer supported in Marketplace. Please use Community Help "Tasks" feature instead.'
    );
  }

  // Validate only property, item, service
  if (!['property', 'item', 'service'].includes(dto.listingType)) {
    throw new BadRequestException(
      'Listing type must be one of: property, item, service'
    );
  }

  // ... rest of validation and creation
}
```

**Keep job DTO fields but mark deprecated**:
```typescript
/**
 * @deprecated Job listings no longer supported. Use Community Help instead.
 */
@ApiPropertyOptional({
  description: 'Employment type (DEPRECATED)',
  enum: EmploymentType,
  deprecated: true,
})
@IsOptional()
@IsEnum(EmploymentType)
employmentType?: EmploymentType;

// ... same for all job-related fields
```

**Acceptance Criteria**:
- ✅ JOB enum value commented out
- ✅ Service rejects job listings with helpful error
- ✅ Job DTO fields kept but deprecated
- ✅ Validation only allows property, item, service

---

## Phase 3: Create Standalone Community Help Navigation

### FRONTEND TASKS

#### Task 3.1: Create Help Navigation Stack
**File**: `Hommie_Mobile/src/navigation/HelpNavigation.tsx` (NEW FILE)
**Time**: 1 hour
**Priority**: P0 - Critical

**Create new navigation stack**:
```typescript
import React from 'react';
import { createStackNavigator } from '@react-navigation/stack';
import HelpRequestsScreen from '../screens/HelpRequestsScreen';
import HelpRequestDetailScreen from '../screens/HelpRequestDetailScreen';
import OfferHelpScreen from '../screens/OfferHelpScreen';
import CreateHelpRequestScreen from '../screens/CreateHelpPostScreen';
import MyHelpActivityScreen from '../screens/MyHelpActivityScreen';

export type HelpStackParamList = {
  HelpRequests: undefined;
  HelpRequestDetail: {
    requestId: string;
    focusComment?: boolean
  };
  OfferHelp: {
    requestId: string
  };
  CreateHelpRequest: undefined;
  MyHelpActivity: undefined;
};

const Stack = createStackNavigator<HelpStackParamList>();

export const HelpNavigator: React.FC = () => {
  return (
    <Stack.Navigator
      screenOptions={{
        headerShown: false,
        cardStyle: { backgroundColor: '#F2F2F7' },
        cardStyleInterpolator: ({ current, layouts }) => ({
          cardStyle: {
            opacity: current.progress,
            transform: [
              {
                translateX: current.progress.interpolate({
                  inputRange: [0, 1],
                  outputRange: [layouts.screen.width, 0],
                }),
              },
            ],
          },
        }),
      }}
    >
      <Stack.Screen
        name="HelpRequests"
        component={HelpRequestsScreen}
        options={{ title: 'Community Help' }}
      />
      <Stack.Screen
        name="HelpRequestDetail"
        component={HelpRequestDetailScreen}
        options={{ title: 'Help Request' }}
      />
      <Stack.Screen
        name="OfferHelp"
        component={OfferHelpScreen}
        options={{
          title: 'Offer Help',
          presentation: 'modal'
        }}
      />
      <Stack.Screen
        name="CreateHelpRequest"
        component={CreateHelpRequestScreen}
        options={{
          title: 'Request Help',
          presentation: 'modal'
        }}
      />
      <Stack.Screen
        name="MyHelpActivity"
        component={MyHelpActivityScreen}
        options={{ title: 'My Help Activity' }}
      />
    </Stack.Navigator>
  );
};

export default HelpNavigator;
```

**Acceptance Criteria**:
- ✅ Navigation file created
- ✅ All routes defined with correct params
- ✅ Modal presentation for create/offer screens
- ✅ iOS-style transitions
- ✅ TypeScript types exported

---

#### Task 3.2: Add Community Help to Main Navigation
**File**: `Hommie_Mobile/App.tsx` or main navigation file
**Time**: 30 min
**Priority**: P0 - Critical

**Option A - Add to Tab Navigator** (if space available):
```typescript
import HelpNavigator from './src/navigation/HelpNavigation';

<Tab.Navigator>
  {/* ... existing tabs */}
  <Tab.Screen
    name="Help"
    component={HelpNavigator}
    options={{
      tabBarLabel: 'Help',
      tabBarIcon: ({ color, size }) => (
        <Ionicons name="hand-right-outline" size={size} color={color} />
      ),
    }}
  />
</Tab.Navigator>
```

**Option B - Add to More Screen** (recommended):
```typescript
// In MoreScreen.tsx, add prominent item
<TouchableOpacity
  style={styles.helpMenuItem}
  onPress={() => navigation.navigate('Help')}
>
  <View style={styles.helpMenuIcon}>
    <Ionicons name="hand-right" size={28} color="#FF6B35" />
  </View>
  <View style={styles.helpMenuContent}>
    <Text style={styles.helpMenuTitle}>Community Help</Text>
    <Text style={styles.helpMenuSubtitle}>
      Request or offer help to neighbors
    </Text>
  </View>
  <Ionicons name="chevron-right" size={20} color="#8E8E93" />
</TouchableOpacity>
```

**Register in main navigation**:
```typescript
// In main navigation file (e.g., App.tsx or RootNavigator.tsx)
<Stack.Screen
  name="Help"
  component={HelpNavigator}
  options={{ headerShown: false }}
/>
```

**Acceptance Criteria**:
- ✅ Help accessible from main navigation
- ✅ Clear icon and label
- ✅ Navigates to HelpNavigator stack
- ✅ Works on both iOS and Android

---

(Continuing with remaining tasks...)

The document continues with detailed implementation for all remaining phases. Would you like me to continue writing the complete document, or would you like me to save this first part and create it as a downloadable file?

