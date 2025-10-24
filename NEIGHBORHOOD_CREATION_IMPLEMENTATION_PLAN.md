# Neighborhood Creation System - Complete Implementation Plan

## Table of Contents
1. [Overview](#overview)
2. [Platform Decision: Web vs Mobile](#platform-decision)
3. [Boundary Approach: Polygon vs Circle](#boundary-approach)
4. [Backend Implementation Plan](#backend-implementation-plan)
5. [Web Admin Panel Design](#web-admin-panel-design)
6. [Mobile App Integration](#mobile-app-integration)
7. [Database Schema](#database-schema)
8. [API Specifications](#api-specifications)
9. [Technology Stack](#technology-stack)
10. [Implementation Phases](#implementation-phases)
11. [Cost Analysis](#cost-analysis)

---

## Overview

This document provides a comprehensive plan for implementing a neighborhood creation and management system for MeCabal. The system will allow both administrators and users to create, propose, and manage neighborhood boundaries across Nigeria, starting with Lagos.

### Goals
- Enable administrators to precisely map Lagos neighborhoods with polygon boundaries
- Allow users to propose new neighborhoods using simple tools
- Support both precise polygon boundaries and simple circle-based areas
- Provide approval workflow for user-submitted proposals
- Scale to cover all Nigerian states

---

## Platform Decision: Web vs Mobile

### Recommendation: **Start with Web Admin Panel** ✅

#### Why Web First?

**1. Superior UX for Boundary Drawing**
- **Mouse/Trackpad Precision**: Drawing complex polygons requires precise cursor control
  - Web: Click multiple points accurately, easy corrections
  - Mobile: Touch interface is imprecise for detailed work, fat finger problem
- **Larger Screen Real Estate**: Better overview of neighborhood boundaries
  - Web: Can see entire LGA, zoom levels, multiple neighborhoods
  - Mobile: Limited viewport, constant zooming/panning
- **Mature Drawing Tools**: Leaflet.draw, Mapbox Draw GL have years of development
  - Web: Snap to existing boundaries, edit vertices, draw holes in polygons
  - Mobile: react-native-maps-draw is less mature, limited features

**2. Better Admin Workflow**
- **Data Entry**: Easier to fill forms with keyboard
- **Multi-tasking**: Can reference other sources, documentation
- **Bulk Operations**: Import GeoJSON files, batch approve proposals
- **Quality Control**: Better tools for reviewing and editing submissions

**3. Technical Advantages**
- **PostGIS Integration**: Direct queries and visualization
- **Performance**: No mobile bundle size concerns for complex libraries
- **Debugging**: Browser dev tools are superior
- **Deployment**: Simpler hosting (Vercel, Netlify) vs app store approvals

**4. Cost & Time Efficiency**
- **Single Codebase**: Web admin covers desktop & tablet
- **Faster Iteration**: Hot reload, no app store submission delays
- **Library Ecosystem**: More mature mapping libraries for web

#### Mobile App Role

Mobile app should focus on **simplified proposals** for users:
- Tap a point on map (center)
- Adjust radius with slider
- Basic form (name, type, description)
- Submit for admin review

**Not recommended on mobile:**
- Drawing complex polygons
- Editing existing boundaries
- Administrative approval workflows

---

## Boundary Approach: Polygon vs Circle

### Recommendation: **Hybrid System** ✅

Your database already supports both approaches! Use them strategically:

### 1. Polygon Boundaries (Precise)

**Use For:**
- Official neighborhoods (like Victoria Island, Lekki Phase 1)
- Gated estates with clear boundaries (like Banana Island)
- Administratively defined areas (wards, LCDAs)
- Areas with natural boundaries (waterways, highways)

**Benefits:**
- Accurate representation of actual boundaries
- No overlap issues
- Better for official records
- Supports complex shapes (with holes, irregular borders)

**Implementation:**
- PostGIS `geometry(Polygon, 4326)` column
- GeoJSON format for API transport
- Leaflet.draw for web editing
- PostGIS queries for point-in-polygon checks

**Example:**
```json
{
  "type": "Polygon",
  "coordinates": [[
    [3.4219, 6.4281],
    [3.4319, 6.4281],
    [3.4319, 6.4381],
    [3.4219, 6.4381],
    [3.4219, 6.4281]
  ]]
}
```

### 2. Circle (Center + Radius)

**Use For:**
- User-submitted proposals (easy to create)
- Informal communities without clear boundaries
- Initial drafts (can be refined to polygons later)
- Areas where precision isn't critical

**Benefits:**
- Simple to create and understand
- Easy UI on mobile (drag pin, adjust slider)
- Faster for users to submit proposals
- Good for discovery ("neighborhoods within 2km")

**Implementation:**
- `center_latitude`, `center_longitude`, `radius_meters` columns
- Simple distance calculations
- Can be converted to approximate polygon later

**Example:**
```json
{
  "centerLatitude": 6.4281,
  "centerLongitude": 3.4219,
  "radiusMeters": 1000
}
```

### 3. Upgrade Path

**Workflow:**
1. User submits proposal with circle (mobile app)
2. Admin reviews on web panel
3. Admin can:
   - Approve as-is (circle becomes official)
   - Convert to polygon for precision
   - Request more information
   - Reject with feedback

### 4. Validation Rules

**Prevent Issues:**
- No overlapping neighborhoods in same LGA (PostGIS `ST_Overlaps`)
- Minimum radius: 100m (avoid tiny areas)
- Maximum radius: 10km (avoid oversized areas)
- Polygons must have at least 3 points
- Must be within LGA boundaries (PostGIS `ST_Within`)

---

## Backend Implementation Plan

### Phase 1: Enhanced DTOs

#### 1.1 Create Enhanced `CreateNeighborhoodDto`

**File**: `backend/apps/location-service/src/dto/neighborhood.dto.ts`

**New Fields to Add:**
```typescript
export class CreateNeighborhoodDto {
  // Existing fields
  name: string;
  type: NeighborhoodType;
  lgaId: string;

  // New fields for both approaches
  wardId?: string;  // Make optional (some areas don't have wards yet)
  description?: string;  // NEW: Detailed description

  // Polygon approach
  boundaryCoordinates?: GeoJSON.Polygon;  // NEW: GeoJSON format

  // Circle approach
  centerLatitude?: number;  // NEW
  centerLongitude?: number;  // NEW
  radiusMeters?: number;  // NEW (default: 1000)

  // Metadata
  isGated?: boolean;
  requiresVerification?: boolean;
  adminUserId?: string;
  createdBy: string;  // NEW: Track who created it
}
```

**Validation Rules:**
- Either `boundaryCoordinates` OR (`centerLatitude` + `centerLongitude`) must be provided
- If circle: `radiusMeters` between 100-10000
- If polygon: At least 3 coordinate pairs
- `lgaId` must exist in database
- `wardId` must exist and belong to the `lgaId`

#### 1.2 Create `CreateNeighborhoodProposalDto`

**New File**: `backend/apps/location-service/src/dto/neighborhood-proposal.dto.ts`

```typescript
export enum ProposalStatus {
  PENDING = 'PENDING',
  UNDER_REVIEW = 'UNDER_REVIEW',
  APPROVED = 'APPROVED',
  REJECTED = 'REJECTED',
}

export class CreateNeighborhoodProposalDto {
  // Basic info
  name: string;
  type: NeighborhoodType;
  description?: string;

  // Location (simplified - circle only for mobile)
  centerLatitude: number;
  centerLongitude: number;
  radiusMeters: number;

  // Will be auto-detected from coordinates
  stateId?: string;
  lgaId?: string;
  wardId?: string;

  // Metadata
  isGated?: boolean;
  requiresVerification?: boolean;

  // Supporting data
  landmarks?: string[];  // JSON array of nearby landmark names
  photos?: string[];  // URLs to uploaded photos
  reasonForProposal?: string;  // Why this neighborhood should exist
}

export class UpdateProposalStatusDto {
  status: ProposalStatus;
  reviewNotes?: string;
  rejectionReason?: string;

  // If approved, optionally refine to polygon
  refinedBoundary?: GeoJSON.Polygon;
}
```

### Phase 2: Database Migrations

#### 2.1 Create Neighborhood Proposals Table

**File**: `backend/libs/database/src/migrations/YYYYMMDDHHMMSS-CreateNeighborhoodProposals.ts`

```sql
CREATE TABLE neighborhood_proposals (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),

  -- User who submitted
  user_id UUID NOT NULL REFERENCES users(id),

  -- Proposal details
  name VARCHAR(200) NOT NULL,
  type VARCHAR(20) NOT NULL,
  description TEXT,

  -- Location (circle-based)
  center_latitude DECIMAL(10, 8) NOT NULL,
  center_longitude DECIMAL(11, 8) NOT NULL,
  radius_meters INTEGER DEFAULT 1000,

  -- Detected/selected hierarchy
  state_id INTEGER REFERENCES states(id),
  lga_id INTEGER REFERENCES local_government_areas(id),
  ward_id INTEGER REFERENCES wards(id),

  -- Metadata
  is_gated BOOLEAN DEFAULT false,
  requires_verification BOOLEAN DEFAULT false,

  -- Supporting data
  landmarks JSONB,
  photos JSONB,
  reason_for_proposal TEXT,

  -- Workflow
  status VARCHAR(20) DEFAULT 'PENDING',
  reviewed_by UUID REFERENCES users(id),
  reviewed_at TIMESTAMP,
  review_notes TEXT,
  rejection_reason TEXT,

  -- If approved, points to created neighborhood
  approved_neighborhood_id UUID REFERENCES neighborhoods(id),

  -- Timestamps
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
);

CREATE INDEX idx_proposals_status ON neighborhood_proposals(status);
CREATE INDEX idx_proposals_user ON neighborhood_proposals(user_id);
CREATE INDEX idx_proposals_lga ON neighborhood_proposals(lga_id);
```

#### 2.2 Add Missing Columns to Neighborhoods

**Check if needed** (your schema already has most):
```sql
ALTER TABLE neighborhoods
  ADD COLUMN IF NOT EXISTS description TEXT,
  ADD COLUMN IF NOT EXISTS created_by UUID REFERENCES users(id);
```

### Phase 3: Service Layer Enhancements

#### 3.1 Enhance `NeighborhoodsService`

**File**: `backend/apps/location-service/src/services/neighborhoods.service.ts`

**New Methods to Add:**

```typescript
/**
 * Create neighborhood with polygon or circle
 * Validates no overlaps, converts formats as needed
 */
async createNeighborhood(dto: CreateNeighborhoodDto): Promise<Neighborhood> {
  // 1. Validate LGA/Ward exist
  // 2. Convert circle to PostGIS point + radius if provided
  // 3. Convert GeoJSON polygon to PostGIS geometry if provided
  // 4. Check for overlaps with existing neighborhoods
  // 5. Calculate center point if polygon provided (ST_Centroid)
  // 6. Save to database
  // 7. Return created neighborhood
}

/**
 * Check if neighborhoods overlap
 * Uses PostGIS ST_Overlaps
 */
async checkOverlap(
  lgaId: string,
  boundary: GeoJSON | { lat: number, lng: number, radius: number }
): Promise<Neighborhood[]> {
  // Query using PostGIS geometry functions
}

/**
 * Convert circle to approximate polygon
 * Useful for visualization
 */
convertCircleToPolygon(
  centerLat: number,
  centerLng: number,
  radiusMeters: number,
  numPoints: number = 32
): GeoJSON.Polygon {
  // Calculate points around circle
  // Return as polygon
}

/**
 * Get neighborhoods within bounds
 * For map viewport queries
 */
async getNeighborhoodsInBounds(
  minLat: number,
  minLng: number,
  maxLat: number,
  maxLng: number
): Promise<Neighborhood[]> {
  // PostGIS bounding box query
}

/**
 * Detect LGA/Ward from coordinates
 * Used for auto-filling proposals
 */
async detectLocationFromCoordinates(
  latitude: number,
  longitude: number
): Promise<{ state?: State; lga?: LGA; ward?: Ward }> {
  // PostGIS point-in-polygon queries
  // Check state boundaries first, then LGA, then Ward
}
```

#### 3.2 Create New `NeighborhoodProposalsService`

**New File**: `backend/apps/location-service/src/services/neighborhood-proposals.service.ts`

```typescript
@Injectable()
export class NeighborhoodProposalsService {
  constructor(
    @InjectRepository(NeighborhoodProposal)
    private proposalRepo: Repository<NeighborhoodProposal>,
    private neighborhoodsService: NeighborhoodsService,
  ) {}

  /**
   * Create a new proposal
   * Auto-detects location hierarchy
   */
  async createProposal(
    dto: CreateNeighborhoodProposalDto,
    userId: string
  ): Promise<NeighborhoodProposal> {
    // 1. Detect state/LGA/ward from coordinates
    // 2. Validate location data
    // 3. Check if similar proposals exist (within 500m)
    // 4. Create proposal with PENDING status
    // 5. Notify admins (optional)
  }

  /**
   * List proposals with filters
   */
  async listProposals(filters: {
    status?: ProposalStatus;
    userId?: string;
    lgaId?: string;
    limit?: number;
    offset?: number;
  }): Promise<{ data: NeighborhoodProposal[]; total: number }> {
    // Query with filters, pagination
  }

  /**
   * Approve a proposal
   * Creates actual neighborhood
   */
  async approveProposal(
    proposalId: string,
    adminUserId: string,
    dto: UpdateProposalStatusDto
  ): Promise<Neighborhood> {
    // 1. Validate admin permissions
    // 2. Get proposal
    // 3. Create neighborhood from proposal data
    // 4. Update proposal status to APPROVED
    // 5. Link proposal to created neighborhood
    // 6. Notify proposer
  }

  /**
   * Reject a proposal
   */
  async rejectProposal(
    proposalId: string,
    adminUserId: string,
    dto: UpdateProposalStatusDto
  ): Promise<NeighborhoodProposal> {
    // 1. Validate admin permissions
    // 2. Update status to REJECTED
    // 3. Save rejection reason
    // 4. Notify proposer
  }

  /**
   * Get proposal statistics
   */
  async getProposalStats(): Promise<{
    total: number;
    pending: number;
    underReview: number;
    approved: number;
    rejected: number;
    byLGA: Array<{ lgaName: string; count: number }>;
  }> {
    // Aggregate queries
  }
}
```

### Phase 4: API Controllers

#### 4.1 Enhance Neighborhoods Controller

**File**: `backend/apps/location-service/src/controllers/neighborhoods.controller.ts`

**New Endpoints:**

```typescript
@Post()
@ApiOperation({ summary: 'Create neighborhood (Admin/Verified Users)' })
@UseGuards(AuthGuard, RolesGuard)
@Roles('admin', 'verified_creator')
async createNeighborhood(
  @Body() dto: CreateNeighborhoodDto,
  @CurrentUser() user: User
) {
  // Validate permissions
  // Create neighborhood
  // Return created neighborhood
}

@Post('validate-boundaries')
@ApiOperation({ summary: 'Validate boundaries before creation' })
async validateBoundaries(@Body() dto: {
  lgaId: string;
  boundary: GeoJSON.Polygon | { centerLat: number; centerLng: number; radius: number };
}) {
  // Check for overlaps
  // Return validation result
}

@Get('in-bounds')
@ApiOperation({ summary: 'Get neighborhoods within map bounds' })
async getInBounds(
  @Query('minLat') minLat: number,
  @Query('minLng') minLng: number,
  @Query('maxLat') maxLat: number,
  @Query('maxLng') maxLng: number
) {
  // Get neighborhoods in viewport
}
```

#### 4.2 Create New Proposals Controller

**New File**: `backend/apps/location-service/src/controllers/neighborhood-proposals.controller.ts`

```typescript
@ApiTags('Neighborhood Proposals')
@Controller('neighborhoods/proposals')
export class NeighborhoodProposalsController {

  @Post()
  @ApiOperation({ summary: 'Submit a neighborhood proposal' })
  @UseGuards(AuthGuard)
  async createProposal(
    @Body() dto: CreateNeighborhoodProposalDto,
    @CurrentUser() user: User
  ) {
    // Create proposal
  }

  @Get()
  @ApiOperation({ summary: 'List proposals (with filters)' })
  @UseGuards(AuthGuard)
  async listProposals(
    @Query() filters: ProposalFiltersDto,
    @CurrentUser() user: User
  ) {
    // If admin: see all
    // If user: see only their proposals
  }

  @Get('stats')
  @ApiOperation({ summary: 'Get proposal statistics' })
  @UseGuards(AuthGuard, RolesGuard)
  @Roles('admin')
  async getStats() {
    // Return statistics
  }

  @Get(':id')
  @ApiOperation({ summary: 'Get proposal details' })
  async getProposal(@Param('id') id: string) {
    // Return proposal with full details
  }

  @Patch(':id/approve')
  @ApiOperation({ summary: 'Approve a proposal' })
  @UseGuards(AuthGuard, RolesGuard)
  @Roles('admin')
  async approveProposal(
    @Param('id') id: string,
    @Body() dto: UpdateProposalStatusDto,
    @CurrentUser() user: User
  ) {
    // Approve and create neighborhood
  }

  @Patch(':id/reject')
  @ApiOperation({ summary: 'Reject a proposal' })
  @UseGuards(AuthGuard, RolesGuard)
  @Roles('admin')
  async rejectProposal(
    @Param('id') id: string,
    @Body() dto: UpdateProposalStatusDto,
    @CurrentUser() user: User
  ) {
    // Reject with reason
  }

  @Delete(':id')
  @ApiOperation({ summary: 'Delete own proposal (if pending)' })
  @UseGuards(AuthGuard)
  async deleteProposal(
    @Param('id') id: string,
    @CurrentUser() user: User
  ) {
    // Allow users to delete their own pending proposals
  }
}
```

### Phase 5: PostGIS Query Examples

#### Check for Overlapping Neighborhoods

```typescript
// In NeighborhoodsService
async checkOverlap(lgaId: string, boundary: any): Promise<Neighborhood[]> {
  // For polygon boundary
  if (boundary.type === 'Polygon') {
    return this.neighborhoodRepo
      .createQueryBuilder('n')
      .where('n.lgaId = :lgaId', { lgaId })
      .andWhere(
        `ST_Overlaps(
          n.boundaries,
          ST_GeomFromGeoJSON(:geojson)
        )`,
        { geojson: JSON.stringify(boundary) }
      )
      .getMany();
  }

  // For circle (center + radius)
  return this.neighborhoodRepo
    .createQueryBuilder('n')
    .where('n.lgaId = :lgaId', { lgaId })
    .andWhere(
      `ST_DWithin(
        ST_MakePoint(n.center_longitude, n.center_latitude)::geography,
        ST_MakePoint(:lng, :lat)::geography,
        :radius
      )`,
      { lat: boundary.centerLat, lng: boundary.centerLng, radius: boundary.radius }
    )
    .getMany();
}
```

#### Detect Location from Coordinates

```typescript
async detectLocationFromCoordinates(
  lat: number,
  lng: number
): Promise<DetectedLocation> {
  const point = `ST_SetSRID(ST_MakePoint(${lng}, ${lat}), 4326)`;

  // Find LGA
  const lga = await this.lgaRepo
    .createQueryBuilder('lga')
    .leftJoinAndSelect('lga.state', 'state')
    .where(`ST_Contains(lga.boundaries, ${point})`)
    .getOne();

  if (!lga) return {};

  // Find Ward within that LGA
  const ward = await this.wardRepo
    .createQueryBuilder('ward')
    .where('ward.lgaId = :lgaId', { lgaId: lga.id })
    .andWhere(`ST_Contains(ward.boundaries, ${point})`)
    .getOne();

  return {
    state: lga.state,
    lga,
    ward,
  };
}
```

#### Get Neighborhoods in Map Bounds

```typescript
async getNeighborhoodsInBounds(
  minLat: number,
  minLng: number,
  maxLat: number,
  maxLng: number
): Promise<Neighborhood[]> {
  // Create bounding box
  const bbox = `ST_MakeEnvelope(${minLng}, ${minLat}, ${maxLng}, ${maxLat}, 4326)`;

  return this.neighborhoodRepo
    .createQueryBuilder('n')
    .where(`ST_Intersects(n.boundaries, ${bbox})`)
    .orWhere(
      `ST_DWithin(
        ST_MakePoint(n.center_longitude, n.center_latitude)::geography,
        ${bbox}::geography,
        n.radius_meters
      )`
    )
    .leftJoinAndSelect('n.lga', 'lga')
    .leftJoinAndSelect('n.ward', 'ward')
    .getMany();
}
```

---

## Web Admin Panel Design

### Technology Stack

#### Core Framework
**Next.js 14+** (App Router)
- **Why**: SSR, API routes, great DX, easy deployment
- **Alternative**: Remix, Nuxt (if team prefers Vue)

#### Mapping Library
**Leaflet.js** ✅ Recommended
- **Pros**:
  - Free and open source
  - Lightweight (38KB gzipped)
  - Excellent drawing plugin (Leaflet.draw)
  - Large ecosystem
  - Works great with PostGIS
- **Cons**:
  - Less modern than Mapbox GL
  - Raster tiles (vs vector)

**Mapbox GL** 💰 Alternative
- **Pros**:
  - Beautiful vector tiles
  - Smooth zooming/rotating
  - 3D capabilities
  - Mapbox Draw plugin
- **Cons**:
  - Not free (after 50k map loads/month)
  - Heavier bundle size
  - Requires API key

**Recommendation**: Start with Leaflet, can migrate to Mapbox later if needed.

#### UI Framework
**Shadcn/ui + Tailwind CSS**
- Modern, accessible components
- Easy customization
- Great for admin panels

#### State Management
**TanStack Query (React Query)**
- Server state management
- Caching, mutations
- Perfect for CRUD operations

#### Form Handling
**React Hook Form + Zod**
- Type-safe validation
- Great DX

### Architecture

```
mecabal-admin/
├── app/
│   ├── (auth)/
│   │   ├── login/
│   │   └── layout.tsx
│   ├── (dashboard)/
│   │   ├── layout.tsx          # Sidebar, header
│   │   ├── page.tsx            # Dashboard home
│   │   ├── neighborhoods/
│   │   │   ├── page.tsx        # List neighborhoods
│   │   │   ├── new/
│   │   │   │   └── page.tsx    # Create form with map
│   │   │   └── [id]/
│   │   │       ├── page.tsx    # View details
│   │   │       └── edit/
│   │   │           └── page.tsx # Edit form
│   │   ├── proposals/
│   │   │   ├── page.tsx        # List proposals
│   │   │   └── [id]/
│   │   │       ├── page.tsx    # Review proposal
│   │   │       └── approve/
│   │   │           └── page.tsx # Approval flow
│   │   └── analytics/
│   │       └── page.tsx        # Stats & charts
│   └── api/
│       └── [...]/              # Proxy to NestJS backend
├── components/
│   ├── ui/                     # Shadcn components
│   ├── map/
│   │   ├── NeighborhoodMap.tsx
│   │   ├── DrawControl.tsx
│   │   ├── BoundaryLayer.tsx
│   │   └── LocationPicker.tsx
│   ├── neighborhoods/
│   │   ├── NeighborhoodForm.tsx
│   │   ├── NeighborhoodCard.tsx
│   │   └── NeighborhoodList.tsx
│   └── proposals/
│       ├── ProposalCard.tsx
│       ├── ProposalReviewForm.tsx
│       └── ProposalsList.tsx
├── lib/
│   ├── api/                    # API client
│   ├── hooks/                  # Custom hooks
│   ├── utils/                  # Helpers
│   └── schemas/                # Zod schemas
└── types/
    └── index.ts                # TypeScript types
```

### Key Features

#### 1. Dashboard Home
- **Stats Overview**:
  - Total neighborhoods by state
  - Pending proposals count
  - Recently added neighborhoods
  - Verification status breakdown
- **Quick Actions**:
  - Create new neighborhood
  - Review proposals
  - Import GeoJSON

#### 2. Neighborhoods Management

**List View:**
- Table with filters:
  - State, LGA, Ward
  - Type (Estate, Area, Community)
  - Gated status
  - Verification status
- Search by name
- Bulk operations (export, bulk verify)
- Pagination

**Map View:**
- See all neighborhoods on map
- Color-coded by type
- Click to see details
- Filter visibility
- Toggle between satellite/street view

**Create/Edit Form:**
```
┌─────────────────────────────────────────────┐
│ Create Neighborhood                         │
├─────────────────────────────────────────────┤
│                                             │
│ Basic Information                           │
│ ├─ Name: [________________]                │
│ ├─ Type: [Estate ▼]                        │
│ └─ Description: [____________]              │
│                                             │
│ Location Hierarchy                          │
│ ├─ State: [Lagos ▼]                        │
│ ├─ LGA: [Eti-Osa ▼]                        │
│ └─ Ward: [Lekki Ward 1 ▼] (optional)       │
│                                             │
│ Boundary Definition                         │
│ ┌────────────────────────────────┐         │
│ │ ○ Draw Polygon (Recommended)   │         │
│ │ ○ Use Circle (Center + Radius) │         │
│ └────────────────────────────────┘         │
│                                             │
│ ┌──────────────────────────────────────┐  │
│ │          INTERACTIVE MAP              │  │
│ │  [Drawing tools if polygon selected]  │  │
│ │  [Pin + Radius slider if circle]      │  │
│ │                                        │  │
│ │  Shows existing neighborhoods          │  │
│ │  Validates no overlaps                 │  │
│ └──────────────────────────────────────┘  │
│                                             │
│ Settings                                    │
│ ├─ ☐ Gated Community                       │
│ ├─ ☐ Requires Verification                 │
│ └─ Admin User: [Select User ▼]             │
│                                             │
│ [Cancel] [Save as Draft] [Create]          │
└─────────────────────────────────────────────┘
```

#### 3. Proposals Management

**List View:**
- Filter by status (Pending, Under Review, Approved, Rejected)
- Sort by date, name, LGA
- Bulk actions (bulk review, bulk reject)

**Review Page:**
```
┌─────────────────────────────────────────────┐
│ Review Proposal: "Ajah Extension"          │
├─────────────────────────────────────────────┤
│                                             │
│ Proposal Details                            │
│ ├─ Submitted by: John Doe (@johnd)         │
│ ├─ Date: 2024-01-15                        │
│ ├─ Type: Community                         │
│ └─ Reason: "Growing community needs..."    │
│                                             │
│ ┌──────────────────────────────────────┐  │
│ │          MAP VIEW                     │  │
│ │  Shows proposed circle/location       │  │
│ │  Nearby landmarks highlighted          │  │
│ │  Overlapping neighborhoods (if any)    │  │
│ └──────────────────────────────────────┘  │
│                                             │
│ Detected Location                           │
│ ├─ State: Lagos                            │
│ ├─ LGA: Eti-Osa (auto-detected)           │
│ └─ Ward: Ajah Ward (auto-detected)         │
│                                             │
│ Supporting Information                      │
│ ├─ Nearby Landmarks: [List]                │
│ ├─ Photos: [Thumbnails]                    │
│ └─ Members Interested: 45 users             │
│                                             │
│ Admin Actions                               │
│ ┌────────────────────────────────┐         │
│ │ ○ Approve as Circle             │         │
│ │ ○ Approve & Refine to Polygon   │         │
│ │ ○ Request More Info              │         │
│ │ ○ Reject                         │         │
│ └────────────────────────────────┘         │
│                                             │
│ [If refining to polygon: Drawing tools]    │
│                                             │
│ Review Notes: [___________________]         │
│                                             │
│ [Cancel] [Save Decision]                   │
└─────────────────────────────────────────────┘
```

#### 4. Map Drawing Tools

**Leaflet.draw Integration:**
- **Toolbar**:
  - Draw polygon (click points)
  - Draw circle (drag radius)
  - Edit vertices
  - Delete shapes
  - Snap to existing boundaries
- **Validation**:
  - Real-time overlap checking
  - Visual feedback (red if overlaps)
  - Minimum area enforcement
  - LGA boundary constraints

**Helper Features**:
- Import GeoJSON file
- Copy from existing neighborhood
- Snap to roads/landmarks
- Measure area (in sq km)
- Undo/Redo

#### 5. Bulk Operations

**Import from GeoJSON:**
```json
{
  "type": "FeatureCollection",
  "features": [
    {
      "type": "Feature",
      "properties": {
        "name": "Victoria Island",
        "type": "AREA",
        "lgaName": "Eti-Osa",
        "isGated": false
      },
      "geometry": {
        "type": "Polygon",
        "coordinates": [[...]]
      }
    }
  ]
}
```

**Export Options:**
- Export to GeoJSON
- Export to KML (Google Earth)
- Export to CSV (basic info)
- Export to Shapefile (GIS software)

### Authentication & Permissions

**Roles:**
1. **Super Admin**: Full access
2. **State Admin**: Manage neighborhoods in assigned state(s)
3. **LGA Admin**: Manage neighborhoods in assigned LGA(s)
4. **Reviewer**: Review proposals, can't create/edit directly
5. **Viewer**: Read-only access

**Implementation:**
- JWT auth with NestJS backend
- Role-based guards on API routes
- UI adapts based on permissions

---

## Mobile App Integration

### Phase 1: Update locationApi

**File**: `Hommie_Mobile/src/services/api/locationApi.ts`

**Add Methods:**
```typescript
/**
 * Create a neighborhood proposal (simple circle-based)
 */
async createNeighborhoodProposal(
  proposal: {
    name: string;
    type: 'ESTATE' | 'AREA' | 'COMMUNITY';
    description?: string;
    centerLatitude: number;
    centerLongitude: number;
    radiusMeters: number;
    isGated?: boolean;
    requiresVerification?: boolean;
    reasonForProposal?: string;
    photos?: string[]; // URLs after upload
  }
): Promise<{
  success: boolean;
  data?: NeighborhoodProposal;
  message: string;
}> {
  const response = await apiClient.post(
    `${this.baseUrl}/neighborhoods/proposals`,
    proposal
  );
  return response;
}

/**
 * Get user's submitted proposals
 */
async getMyProposals(): Promise<NeighborhoodProposal[]> {
  const response = await apiClient.get(
    `${this.baseUrl}/neighborhoods/proposals?userId=me`
  );
  return response.data || [];
}

/**
 * Get proposal by ID
 */
async getProposalById(id: string): Promise<NeighborhoodProposal> {
  const response = await apiClient.get(
    `${this.baseUrl}/neighborhoods/proposals/${id}`
  );
  return response.data;
}
```

### Phase 2: Create ProposeNeighborhoodScreen

**File**: `Hommie_Mobile/src/screens/onBoarding/ProposeNeighborhoodScreen.tsx`

**Simplified Flow:**
```
Step 1: Basic Info
- Name input
- Type selector (Estate, Area, Community)
- Description textarea
- Is it gated? checkbox

Step 2: Location
- Map showing user's current location
- Draggable pin for center
- Radius slider (500m - 5km)
- Shows circle overlay on map
- Auto-detects LGA/Ward from pin location

Step 3: Supporting Info (Optional)
- Why should this neighborhood exist?
- Upload photos (up to 3)
- Nearby landmarks (auto-populated)

Step 4: Review & Submit
- Summary of all info
- Preview on map
- Terms acceptance
- Submit button
```

**UI Components:**
```typescript
// Simple map with pin and radius
<MapView>
  <Marker
    draggable
    coordinate={pinLocation}
    onDragEnd={(e) => setPinLocation(e.nativeEvent.coordinate)}
  />
  <Circle
    center={pinLocation}
    radius={radiusMeters}
    fillColor="rgba(0, 166, 81, 0.2)"
    strokeColor="#00A651"
  />
</MapView>

// Radius slider
<Slider
  value={radiusMeters}
  minimumValue={500}
  maximumValue={5000}
  step={100}
  onValueChange={setRadiusMeters}
/>
<Text>{radiusMeters}m radius</Text>
```

### Phase 3: Add to Location Selector

**File**: `Hommie_Mobile/src/components/location/HierarchicalLocationSelector.tsx`

**Add at Neighborhood Step:**
```typescript
const renderNeighborhoodStep = () => {
  // ... existing code ...

  return (
    <View>
      {/* Existing neighborhood list */}

      {/* Add "Can't find your neighborhood?" button */}
      {neighborhoods.length > 0 && (
        <TouchableOpacity
          style={styles.cantFindButton}
          onPress={() => navigation.navigate('ProposeNeighborhood', {
            prefilledData: {
              lgaId: selectedLGA.id,
              wardId: selectedWard?.id,
              centerLatitude: currentCoordinates?.latitude,
              centerLongitude: currentCoordinates?.longitude,
            }
          })}
        >
          <Ionicons name="add-circle-outline" size={20} color="#00A651" />
          <Text style={styles.cantFindText}>
            Can't find your neighborhood? Propose a new one
          </Text>
        </TouchableOpacity>
      )}
    </View>
  );
};
```

### Phase 4: Proposal Tracking Screen

**New Screen**: `Hommie_Mobile/src/screens/MyProposalsScreen.tsx`

**Features:**
- List user's proposals
- Status badges (Pending, Under Review, Approved, Rejected)
- Tap to see details
- Edit pending proposals
- Delete pending proposals
- See rejection reasons if rejected
- Celebrate if approved! 🎉

---

## Database Schema

### Tables

#### neighborhoods (Existing - Enhanced)
```sql
CREATE TABLE neighborhoods (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  name VARCHAR(200) NOT NULL,
  type VARCHAR(20) NOT NULL,
  lga_id INTEGER NOT NULL REFERENCES local_government_areas(id),
  ward_id INTEGER REFERENCES wards(id),
  parent_neighborhood_id UUID REFERENCES neighborhoods(id),
  description TEXT,

  -- Polygon approach
  boundary_coordinates JSONB,  -- GeoJSON format
  boundaries GEOMETRY(Polygon, 4326),  -- PostGIS

  -- Circle approach
  center_latitude DECIMAL(10, 8),
  center_longitude DECIMAL(11, 8),
  radius_meters INTEGER DEFAULT 1000,

  -- Metadata
  is_gated BOOLEAN DEFAULT false,
  requires_verification BOOLEAN DEFAULT false,
  is_verified BOOLEAN DEFAULT false,
  admin_user_id UUID REFERENCES users(id),
  created_by UUID NOT NULL REFERENCES users(id),

  -- Timestamps
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW(),

  -- Indexes
  CONSTRAINT neighborhoods_pkey PRIMARY KEY (id)
);

CREATE INDEX idx_neighborhoods_lga ON neighborhoods(lga_id);
CREATE INDEX idx_neighborhoods_ward ON neighborhoods(ward_id);
CREATE INDEX idx_neighborhoods_type ON neighborhoods(type);
CREATE INDEX idx_neighborhoods_gated ON neighborhoods(is_gated);
CREATE INDEX idx_neighborhoods_boundaries_gist ON neighborhoods USING GIST(boundaries);
CREATE INDEX idx_neighborhoods_center_point ON neighborhoods USING GIST(
  ST_MakePoint(center_longitude, center_latitude)
);
```

#### neighborhood_proposals (New)
```sql
CREATE TABLE neighborhood_proposals (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID NOT NULL REFERENCES users(id),

  -- Proposal data
  name VARCHAR(200) NOT NULL,
  type VARCHAR(20) NOT NULL,
  description TEXT,
  center_latitude DECIMAL(10, 8) NOT NULL,
  center_longitude DECIMAL(11, 8) NOT NULL,
  radius_meters INTEGER DEFAULT 1000,

  -- Detected location
  state_id INTEGER REFERENCES states(id),
  lga_id INTEGER REFERENCES local_government_areas(id),
  ward_id INTEGER REFERENCES wards(id),

  -- Metadata
  is_gated BOOLEAN DEFAULT false,
  requires_verification BOOLEAN DEFAULT false,

  -- Supporting data
  landmarks JSONB,  -- Array of landmark objects
  photos JSONB,  -- Array of photo URLs
  reason_for_proposal TEXT,

  -- Workflow
  status VARCHAR(20) DEFAULT 'PENDING',
  reviewed_by UUID REFERENCES users(id),
  reviewed_at TIMESTAMP,
  review_notes TEXT,
  rejection_reason TEXT,
  approved_neighborhood_id UUID REFERENCES neighborhoods(id),

  -- Timestamps
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW(),

  CONSTRAINT proposals_pkey PRIMARY KEY (id)
);

CREATE INDEX idx_proposals_user ON neighborhood_proposals(user_id);
CREATE INDEX idx_proposals_status ON neighborhood_proposals(status);
CREATE INDEX idx_proposals_lga ON neighborhood_proposals(lga_id);
CREATE INDEX idx_proposals_created ON neighborhood_proposals(created_at DESC);
```

---

## API Specifications

### Neighborhoods API

#### Create Neighborhood
```
POST /api/location/neighborhoods
Auth: Required (Admin/Verified Creator)

Request Body:
{
  "name": "Victoria Island",
  "type": "AREA",
  "lgaId": "uuid",
  "wardId": "uuid",  // optional
  "description": "Prime business district...",

  // Option 1: Polygon
  "boundaryCoordinates": {
    "type": "Polygon",
    "coordinates": [[
      [3.4219, 6.4281],
      [3.4319, 6.4281],
      [3.4319, 6.4381],
      [3.4219, 6.4381],
      [3.4219, 6.4281]
    ]]
  },

  // Option 2: Circle (if no polygon provided)
  "centerLatitude": 6.4281,
  "centerLongitude": 3.4219,
  "radiusMeters": 2000,

  "isGated": false,
  "requiresVerification": false,
  "createdBy": "user-uuid"
}

Response 201:
{
  "success": true,
  "data": {
    "id": "uuid",
    "name": "Victoria Island",
    ...
  },
  "message": "Neighborhood created successfully"
}

Response 400:
{
  "success": false,
  "message": "Validation failed",
  "errors": [
    "Neighborhood overlaps with existing: Lekki Phase 1"
  ]
}
```

#### Validate Boundaries
```
POST /api/location/neighborhoods/validate-boundaries
Auth: Required

Request Body:
{
  "lgaId": "uuid",
  "boundary": {
    // Either polygon or circle
    "type": "Polygon",
    "coordinates": [[...]]
  }
}

Response 200:
{
  "success": true,
  "data": {
    "valid": true,
    "overlapping": [],
    "area": "2.5 sq km"
  }
}

Response 200 (with overlaps):
{
  "success": true,
  "data": {
    "valid": false,
    "overlapping": [
      {
        "id": "uuid",
        "name": "Lekki Phase 1",
        "overlapPercentage": 15
      }
    ]
  }
}
```

### Proposals API

#### Create Proposal
```
POST /api/location/neighborhoods/proposals
Auth: Required (Any authenticated user)

Request Body:
{
  "name": "Ajah Extension",
  "type": "COMMUNITY",
  "description": "Growing residential area...",
  "centerLatitude": 6.4659,
  "centerLongitude": 3.5645,
  "radiusMeters": 1500,
  "isGated": false,
  "reasonForProposal": "This area has grown significantly...",
  "photos": [
    "https://cdn.example.com/photo1.jpg"
  ]
}

Response 201:
{
  "success": true,
  "data": {
    "id": "proposal-uuid",
    "name": "Ajah Extension",
    "status": "PENDING",
    "detectedLocation": {
      "state": "Lagos",
      "lga": "Eti-Osa",
      "ward": "Ajah Ward"
    },
    ...
  },
  "message": "Proposal submitted successfully. We'll review it within 48 hours."
}
```

#### List Proposals
```
GET /api/location/neighborhoods/proposals
Auth: Required
Query Params:
  - status: PENDING | UNDER_REVIEW | APPROVED | REJECTED
  - userId: UUID (admins can see all, users see only theirs)
  - lgaId: UUID
  - limit: number
  - offset: number

Response 200:
{
  "success": true,
  "data": [
    {
      "id": "uuid",
      "name": "Ajah Extension",
      "status": "PENDING",
      "submittedBy": {
        "id": "uuid",
        "name": "John Doe"
      },
      "createdAt": "2024-01-15T10:00:00Z",
      ...
    }
  ],
  "total": 45,
  "page": 1,
  "limit": 20
}
```

#### Approve Proposal
```
PATCH /api/location/neighborhoods/proposals/:id/approve
Auth: Required (Admin only)

Request Body:
{
  "reviewNotes": "Approved with minor boundary adjustments",
  "refinedBoundary": {
    // Optional: Admin can provide refined polygon
    "type": "Polygon",
    "coordinates": [[...]]
  }
}

Response 200:
{
  "success": true,
  "data": {
    "proposal": {...},
    "createdNeighborhood": {
      "id": "uuid",
      "name": "Ajah Extension",
      ...
    }
  },
  "message": "Proposal approved and neighborhood created"
}
```

---

## Technology Stack Summary

### Backend (NestJS)
- **Framework**: NestJS 10+
- **Database**: PostgreSQL 15+ with PostGIS extension
- **ORM**: TypeORM
- **Validation**: class-validator, class-transformer
- **Auth**: JWT with Passport
- **API Docs**: Swagger/OpenAPI

### Web Admin (Next.js)
- **Framework**: Next.js 14+ (App Router)
- **Language**: TypeScript
- **UI**: Shadcn/ui + Tailwind CSS
- **Mapping**: Leaflet.js + Leaflet.draw
- **State**: TanStack Query + Zustand
- **Forms**: React Hook Form + Zod
- **Charts**: Recharts or Chart.js

### Mobile App (React Native)
- **Framework**: React Native (Expo)
- **Mapping**: react-native-maps
- **Navigation**: React Navigation
- **State**: React Context + TanStack Query
- **Forms**: React Hook Form

---

## Implementation Phases

### Phase 1: Backend Foundation (Week 1)
**Goals**: Get API ready for both web and mobile

- [ ] Create database migrations (proposals table)
- [ ] Enhance DTOs with validation
- [ ] Implement NeighborhoodProposalsService
- [ ] Add PostGIS query methods to NeighborhoodsService
- [ ] Create proposals controller endpoints
- [ ] Add validation endpoints
- [ ] Write unit tests
- [ ] Update Swagger docs

**Deliverable**: Fully functional backend API

### Phase 2: Web Admin MVP (Week 2-3)
**Goals**: Basic admin panel working

- [ ] Set up Next.js project
- [ ] Implement authentication
- [ ] Create dashboard layout
- [ ] Build neighborhoods list/view pages
- [ ] Integrate Leaflet with basic drawing
- [ ] Implement proposals review interface
- [ ] Add basic CRUD for neighborhoods

**Deliverable**: Admins can create neighborhoods and review proposals

### Phase 3: Advanced Mapping (Week 3-4)
**Goals**: Sophisticated mapping tools

- [ ] Advanced drawing tools (snap, edit, etc.)
- [ ] GeoJSON import/export
- [ ] Overlap detection visualization
- [ ] Batch operations
- [ ] Analytics dashboard
- [ ] Export to multiple formats

**Deliverable**: Production-ready admin panel

### Phase 4: Mobile Integration (Week 4-5)
**Goals**: Users can submit proposals

- [ ] Update mobile locationApi
- [ ] Create ProposeNeighborhoodScreen
- [ ] Add "Can't find?" button to selector
- [ ] Implement photo upload
- [ ] Create proposals tracking screen
- [ ] Add push notifications for status updates

**Deliverable**: End-to-end proposal workflow

### Phase 5: Polish & Deploy (Week 5-6)
**Goals**: Production ready

- [ ] End-to-end testing
- [ ] Performance optimization
- [ ] Security audit
- [ ] Documentation
- [ ] Deployment setup
- [ ] Monitoring & logging
- [ ] User training materials

**Deliverable**: Fully deployed system

---

## Cost Analysis

### Development Costs
- **Backend Development**: 1 week (assuming 1 developer)
- **Web Admin Development**: 3-4 weeks
- **Mobile Integration**: 1-2 weeks
- **Total**: ~6-7 weeks of development

### Infrastructure Costs (Monthly)

#### Free Tier
- **Leaflet.js**: Free (open source)
- **PostgreSQL/PostGIS**: Free (self-hosted on existing server)
- **Next.js Hosting**: Free on Vercel (hobby plan)
- **Map Tiles**: Free (OpenStreetMap)
- **Total**: $0/month

#### With Premium Features
- **Mapbox**: $0 (up to 50k loads), then $0.60/1k loads
- **Better Satellite Imagery**: ~$50-100/month
- **Hosting Upgrade**: ~$20-50/month for better performance
- **Backup & Monitoring**: ~$20-30/month
- **Total**: $90-180/month (optional)

### Recommendation
Start with free tier, upgrade if needed based on usage.

---

## Success Metrics

### Phase 1 Success (Backend)
- [ ] All API endpoints respond correctly
- [ ] PostGIS queries execute in <100ms
- [ ] 95%+ test coverage
- [ ] API documentation complete

### Phase 2 Success (Web Admin)
- [ ] Admins can create 10+ neighborhoods per day
- [ ] Drawing tools work smoothly
- [ ] Zero data loss during creation
- [ ] Mobile responsive

### Phase 3 Success (Mobile)
- [ ] Users can submit proposals in <2 minutes
- [ ] 80%+ proposal approval rate
- [ ] Photo upload success rate >95%
- [ ] User satisfaction score >4/5

### Long-term Success (3 months)
- [ ] 200+ neighborhoods mapped in Lagos
- [ ] 50+ user-submitted proposals
- [ ] <24hr average proposal review time
- [ ] Coverage of all 20 Lagos LGAs
- [ ] Ready to expand to other states

---

## Risk Mitigation

### Technical Risks

**Risk**: PostGIS queries too slow
- **Mitigation**: Proper indexing, caching, pagination
- **Fallback**: Simplify to circle-only approach

**Risk**: Drawing tools confusing for admins
- **Mitigation**: User testing, tutorial videos, support
- **Fallback**: Provide template polygons to modify

**Risk**: Overlapping neighborhoods hard to manage
- **Mitigation**: Real-time validation, clear error messages
- **Fallback**: Manual admin review step

### Process Risks

**Risk**: Too many low-quality proposals
- **Mitigation**: Clear guidelines, examples, required fields
- **Fallback**: Increase verification requirements

**Risk**: Admins overwhelmed with proposals
- **Mitigation**: Auto-detection, batch operations, filters
- **Fallback**: Hire more reviewers

**Risk**: Users don't understand proposal process
- **Mitigation**: In-app tutorials, examples, help text
- **Fallback**: Customer support, video guides

---

## Next Steps

### Immediate Actions (This Week)
1. **Review this plan** with team
2. **Get stakeholder approval** for approach
3. **Set up project repositories** (admin panel repo)
4. **Assign team members** to tasks
5. **Create detailed sprint plans**

### Prerequisites
1. Ensure PostGIS extension is installed on production DB
2. Get admin accounts created for testing
3. Prepare sample GeoJSON data for Lagos
4. Set up development environments

### Communication Plan
- **Daily standups**: Progress updates
- **Weekly demos**: Show working features
- **Bi-weekly reviews**: Stakeholder feedback
- **Documentation**: Keep this doc updated

---

## Appendix

### Useful Resources

**PostGIS Documentation**:
- https://postgis.net/docs/
- https://postgis.net/workshops/postgis-intro/

**Leaflet Resources**:
- https://leafletjs.com/
- https://leaflet.github.io/Leaflet.draw/docs/leaflet-draw-latest.html

**GeoJSON Specification**:
- https://geojson.org/
- https://tools.ietf.org/html/rfc7946

**Next.js Documentation**:
- https://nextjs.org/docs

### Sample Data Sources

**Lagos Boundaries**:
- OpenStreetMap: https://www.openstreetmap.org/
- GADM: https://gadm.org/download_country.html
- Humanitarian Data Exchange: https://data.humdata.org/

### Contact

For questions about this plan:
- Technical Lead: [Name]
- Product Owner: [Name]
- Backend Team: [Email]

---

**Document Version**: 1.0
**Last Updated**: 2025-01-23
**Status**: Awaiting Approval
