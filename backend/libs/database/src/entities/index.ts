// Core User & Authentication Entities
export { User } from './user.entity';
export { OtpVerification } from './otp-verification.entity';
export { EmailOtp } from './email-otp.entity';
export { UserSession } from './user-session.entity';
export { Role } from './role.entity';

// User Dashboard & Bookmarks Entities
export { UserBookmark } from './user-bookmark.entity';
export { UserDashboardStats } from './user-dashboard-stats.entity';

// Location & Neighborhood Entities
export { State } from './state.entity';
export { LocalGovernmentArea } from './local-government-area.entity';
export { Neighborhood } from './neighborhood.entity';
export { UserNeighborhood } from './user-neighborhood.entity';

// Social Feed & Content Entities
export { PostCategory } from './post-category.entity';
export { Post } from './post.entity';
export { PostMedia } from './post-media.entity';
export { PostReaction } from './post-reaction.entity';
export { PostComment } from './post-comment.entity';
export { CommentMedia } from './comment-media.entity';

// Marketplace & Listings Entities
export { ListingCategory } from './listing-category.entity';
export { Listing } from './listing.entity';
export { ListingMedia } from './listing-media.entity';
export { ListingSave } from './listing-save.entity';

// Media Entities
export { Media } from './media.entity';

// Events Entities
export { EventCategory } from './event-category.entity';
export { Event } from './event.entity';
export { EventMedia } from './event-media.entity';
export { EventAttendee } from './event-attendee.entity';

// Verification Entities
export { NinVerification, VerificationStatus, VerificationMethod } from './nin-verification.entity';
export { IdentityDocument, DocumentType } from './identity-document.entity';
export { VerificationAudit } from './verification-audit.entity';
export { UserBadge, BadgeCategory } from './user-badge.entity';
export { CommunityEndorsement, EndorsementType } from './community-endorsement.entity';

// Gamification Entities
export { Achievement, AchievementCategory, AchievementRarity } from './achievement.entity';
export { UserAchievement } from './user-achievement.entity';
export { Badge, BadgeType } from './badge.entity';
export { GamificationBadge } from './gamification-badge.entity';
export { UserActivityLog, ActivityType } from './user-activity-log.entity';
export { UserPoints } from './user-points.entity';
export { LeaderboardSnapshot, LeaderboardCategory, LeaderboardPeriod } from './leaderboard-snapshot.entity';
export type { LeaderboardRanking } from './leaderboard-snapshot.entity';

// Business Account Entities
export { BusinessProfile } from './business-profile.entity';
export { BusinessCategory } from './business-category.entity';
export { BusinessLicense } from './business-license.entity';
export { BusinessService } from './business-service.entity';
export { BusinessReview } from './business-review.entity';
export { BusinessInquiry } from './business-inquiry.entity';
export { BusinessActivityLog } from './business-activity-log.entity';

// Cultural Profile Entities
export { NigerianState } from './nigerian-state.entity';
export { NigerianLanguage } from './nigerian-language.entity';
export { CulturalBackground } from './cultural-background.entity';
export { ProfessionalCategory } from './professional-category.entity';
export { UserPrivacySettings } from './user-privacy-settings.entity';
export { UserLanguage, LanguageProficiency } from './user-language.entity';
