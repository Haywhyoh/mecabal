# Component Reorganization Plan

## Current Structure
All components are in `src/components/` with some subdirectories (auth, location, connection, analytics, design-system).

## Proposed Structure
Organize components by feature/domain for better maintainability and discoverability.

## New Directory Structure

```
src/components/
├── posts/                    # Post-related components
│   ├── PostCard.tsx
│   ├── PostCreator.tsx
│   ├── PostActionMenu.tsx
│   ├── PostFilter.tsx
│   ├── FeedList.tsx
│   ├── HelpPostCard.tsx
│   ├── CommentsList.tsx
│   ├── CommentCreator.tsx
│   ├── RichTextEditor.tsx
│   └── index.ts
│
├── events/                   # Event-related components
│   ├── EventCard.tsx
│   ├── EventCardSkeleton.tsx
│   ├── EventDetailsSkeleton.tsx
│   ├── EventsCalendarView.tsx
│   ├── EventsMapView.tsx
│   ├── EventParticipationTracker.tsx
│   ├── AttendeeCardSkeleton.tsx
│   └── index.ts
│
├── business/                 # Business/Marketplace components
│   ├── BusinessInquiryForm.tsx
│   ├── ReviewCard.tsx
│   ├── ReviewResponseModal.tsx
│   ├── RatingBreakdown.tsx
│   ├── StarRating.tsx
│   ├── SendInquiryModal.tsx
│   ├── ListingCard.tsx
│   ├── ListingFilter.tsx
│   ├── MarketplaceListingCard.tsx
│   └── index.ts
│
├── profile/                  # User/Profile components
│   ├── UserAvatar.tsx
│   ├── UserProfile.tsx
│   ├── UserVerificationBadge.tsx
│   ├── TrustScoreCard.tsx
│   ├── DashboardStatsCard.tsx
│   ├── BadgeSystemComponent.tsx
│   └── index.ts
│
├── community/                # Community/Neighbor components
│   ├── NeighborRatingSystem.tsx
│   ├── NeighborRecommendationSystem.tsx
│   ├── NeighborConnectionComponent.tsx
│   ├── MutualConnectionsDisplay.tsx
│   ├── TrustedNeighborNetwork.tsx
│   ├── SafetyContributionTracker.tsx
│   ├── ActivityTrackingComponent.tsx
│   └── index.ts
│
├── ui/                       # Common UI components
│   ├── LoadingState.tsx
│   ├── ErrorState.tsx
│   ├── ErrorView.tsx
│   ├── ErrorBanner.tsx
│   ├── NetworkErrorView.tsx
│   ├── EmptyState.tsx
│   ├── SkeletonPlaceholder.tsx
│   ├── SegmentedControl.tsx
│   ├── ScreenHeader.tsx
│   ├── BackButton.tsx
│   ├── BookmarkButton.tsx
│   ├── FloatingActionButton.tsx
│   ├── OfflineIndicator.tsx
│   ├── SuccessFeedback.tsx
│   └── index.ts
│
├── feed/                     # Feed-related components
│   ├── UnifiedFeedList.tsx
│   └── index.ts
│
├── auth/                     # Already organized
│   ├── GoogleSignInButton.tsx
│   ├── AuthBackground.tsx
│   ├── AuthGuard.tsx
│   ├── AppWithAuth.tsx
│   ├── SocialButton.tsx
│   └── index.ts
│
├── location/                 # Already organized
│   ├── GPSLocationPicker.tsx
│   ├── HierarchicalLocationSelector.tsx
│   ├── EstateSearchInput.tsx
│   ├── StreetAutocompleteInput.tsx
│   ├── NeighborhoodCard.tsx
│   └── index.ts
│
├── connection/               # Already organized
│   ├── ConnectionStatusBadge.tsx
│   ├── ConnectionActionButtons.tsx
│   ├── NeighborConnectionCard.tsx
│   ├── NetworkAnalysisModal.tsx
│   ├── TrustScoreDisplay.tsx
│   └── index.ts
│
├── analytics/               # Already organized
│   ├── AnalyticsChart.tsx
│   ├── MetricsCard.tsx
│   └── index.ts
│
├── design-system/           # Already organized
│   ├── Badge.tsx
│   ├── Button.tsx
│   ├── Card.tsx
│   ├── Input.tsx
│   └── index.ts
│
└── index.ts                  # Main export file
```

## Migration Steps

1. Create new directory structure
2. Move components to appropriate directories
3. Update component index.ts files in each directory
4. Update main components/index.ts
5. Update all import statements across the codebase
6. Test to ensure no broken imports

## Component Mapping

### Posts (9 components)
- PostCard.tsx → posts/PostCard.tsx
- PostCreator.tsx → posts/PostCreator.tsx
- PostActionMenu.tsx → posts/PostActionMenu.tsx
- PostFilter.tsx → posts/PostFilter.tsx
- FeedList.tsx → posts/FeedList.tsx
- HelpPostCard.tsx → posts/HelpPostCard.tsx
- CommentsList.tsx → posts/CommentsList.tsx
- CommentCreator.tsx → posts/CommentCreator.tsx
- RichTextEditor.tsx → posts/RichTextEditor.tsx

### Events (7 components)
- EventCard.tsx → events/EventCard.tsx
- EventCardSkeleton.tsx → events/EventCardSkeleton.tsx
- EventDetailsSkeleton.tsx → events/EventDetailsSkeleton.tsx
- EventsCalendarView.tsx → events/EventsCalendarView.tsx
- EventsMapView.tsx → events/EventsMapView.tsx
- EventParticipationTracker.tsx → events/EventParticipationTracker.tsx
- AttendeeCardSkeleton.tsx → events/AttendeeCardSkeleton.tsx

### Business (9 components)
- BusinessInquiryForm.tsx → business/BusinessInquiryForm.tsx
- ReviewCard.tsx → business/ReviewCard.tsx
- ReviewResponseModal.tsx → business/ReviewResponseModal.tsx
- RatingBreakdown.tsx → business/RatingBreakdown.tsx
- StarRating.tsx → business/StarRating.tsx
- SendInquiryModal.tsx → business/SendInquiryModal.tsx
- ListingCard.tsx → business/ListingCard.tsx
- ListingFilter.tsx → business/ListingFilter.tsx
- MarketplaceListingCard.tsx → business/MarketplaceListingCard.tsx

### Profile (6 components)
- UserAvatar.tsx → profile/UserAvatar.tsx
- UserProfile.tsx → profile/UserProfile.tsx
- UserVerificationBadge.tsx → profile/UserVerificationBadge.tsx
- TrustScoreCard.tsx → profile/TrustScoreCard.tsx
- DashboardStatsCard.tsx → profile/DashboardStatsCard.tsx
- BadgeSystemComponent.tsx → profile/BadgeSystemComponent.tsx

### Community (7 components)
- NeighborRatingSystem.tsx → community/NeighborRatingSystem.tsx
- NeighborRecommendationSystem.tsx → community/NeighborRecommendationSystem.tsx
- NeighborConnectionComponent.tsx → community/NeighborConnectionComponent.tsx
- MutualConnectionsDisplay.tsx → community/MutualConnectionsDisplay.tsx
- TrustedNeighborNetwork.tsx → community/TrustedNeighborNetwork.tsx
- SafetyContributionTracker.tsx → community/SafetyContributionTracker.tsx
- ActivityTrackingComponent.tsx → community/ActivityTrackingComponent.tsx

### UI (13 components)
- LoadingState.tsx → ui/LoadingState.tsx
- ErrorState.tsx → ui/ErrorState.tsx
- ErrorView.tsx → ui/ErrorView.tsx
- ErrorBanner.tsx → ui/ErrorBanner.tsx
- NetworkErrorView.tsx → ui/NetworkErrorView.tsx
- EmptyState.tsx → ui/EmptyState.tsx
- SkeletonPlaceholder.tsx → ui/SkeletonPlaceholder.tsx
- SegmentedControl.tsx → ui/SegmentedControl.tsx
- ScreenHeader.tsx → ui/ScreenHeader.tsx
- BackButton.tsx → ui/BackButton.tsx
- BookmarkButton.tsx → ui/BookmarkButton.tsx
- FloatingActionButton.tsx → ui/FloatingActionButton.tsx
- OfflineIndicator.tsx → ui/OfflineIndicator.tsx
- SuccessFeedback.tsx → ui/SuccessFeedback.tsx

### Feed (1 component)
- UnifiedFeedList.tsx → feed/UnifiedFeedList.tsx

### Special Cases
- NigerianComponents.tsx → Keep in root or move to ui/ (contains multiple Nigerian-specific UI components)

## Import Path Updates

### Before
```typescript
import { UserAvatar } from '../components/UserAvatar';
import PostCard from '../components/PostCard';
import EventCard from '../components/EventCard';
```

### After
```typescript
import { UserAvatar } from '../components/profile';
import { PostCard } from '../components/posts';
import { EventCard } from '../components/events';
```

## Benefits

1. **Better Organization**: Components grouped by feature/domain
2. **Easier Navigation**: Developers can quickly find related components
3. **Clearer Dependencies**: Feature boundaries are more obvious
4. **Scalability**: Easy to add new components to appropriate directories
5. **Maintainability**: Related components are co-located




