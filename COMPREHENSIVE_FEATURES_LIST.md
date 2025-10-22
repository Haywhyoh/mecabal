# MeCabal - Comprehensive Features List

**Generated:** 2025-10-22
**Project:** MeCabal - NextDoor for Nigeria
**Description:** Complete listing of all features in the mobile app and backend services

---

## Table of Contents

1. [User Authentication & Onboarding](#1-user-authentication--onboarding)
2. [User Profile & Identity Management](#2-user-profile--identity-management)
3. [Location & Geographic Services](#3-location--geographic-services)
4. [Social & Community Features](#4-social--community-features)
5. [Marketplace](#5-marketplace)
6. [Events Management](#6-events-management)
7. [Business Profiles & Directory](#7-business-profiles--directory)
8. [Messaging & Communication](#8-messaging--communication)
9. [Neighborhood Help System](#9-neighborhood-help-system)
10. [Gamification & Rewards](#10-gamification--rewards)
11. [Trust & Verification System](#11-trust--verification-system)
12. [Cultural & Language Features](#12-cultural--language-features)
13. [Notifications](#13-notifications)
14. [Search & Discovery](#14-search--discovery)
15. [Media Management](#15-media-management)
16. [Moderation & Safety](#16-moderation--safety)
17. [Analytics & Reporting](#17-analytics--reporting)
18. [Admin & Management Features](#18-admin--management-features)

---

## 1. User Authentication & Onboarding

### 1.1 Registration & Login
- **Email Registration**
  - Email-based account creation
  - Email OTP verification (6-digit code)
  - Password-less registration option
  - Email format validation
  - Rate limiting (3 OTP sends per minute)

- **Phone Number Verification**
  - Nigerian phone number support (+234)
  - Automatic carrier detection (MTN, Glo, Airtel, 9mobile)
  - SMS OTP delivery
  - WhatsApp OTP alternative
  - Voice call verification fallback
  - Phone number formatting and validation
  - Resend OTP functionality

- **Social Authentication**
  - Google OAuth integration (Web & Mobile)
  - Google Sign-In for mobile apps using ID tokens
  - Social account linking to existing accounts
  - Social account unlinking
  - Profile picture import from social providers
  - Email verification status from social providers

- **Traditional Login**
  - Email/password login
  - OTP-based passwordless login
  - "Remember me" functionality
  - Session management

### 1.2 Onboarding Flow
- **Welcome Screens**
  - Hero welcome screen with app introduction
  - Feature highlights carousel
  - Join/Login options

- **Progressive Onboarding**
  - Multi-step onboarding process
  - Onboarding step tracking
  - Skip functionality for optional steps
  - Progress indicators

- **Location Setup**
  - GPS-based location detection
  - Manual address entry
  - State, LGA, Ward selection
  - Neighborhood/Estate selection
  - Landmark-based location
  - Map picker interface
  - Location verification
  - Multiple location support

- **Profile Completion**
  - First name and last name entry
  - Profile picture upload
  - Preferred language selection
  - State of origin selection
  - Bio/description entry

### 1.3 Security Features
- **JWT Authentication**
  - Access token with expiration
  - Refresh token rotation
  - Token blacklisting on logout
  - Secure token storage

- **Session Management**
  - Device tracking (device ID, type, IP address, user agent)
  - Multiple device support
  - Session invalidation
  - Active sessions list

- **Password Management**
  - Password reset via email OTP
  - Password strength validation
  - Secure password hashing (bcrypt)
  - Password reset confirmation

- **Rate Limiting**
  - OTP send rate limiting (3 per minute)
  - OTP verification attempts (10 per 5 minutes)
  - Login attempt throttling
  - API request rate limiting

---

## 2. User Profile & Identity Management

### 2.1 Profile Information
- **Basic Information**
  - First name and last name
  - Email address
  - Phone number
  - Date of birth
  - Gender
  - Profile picture/avatar
  - Bio/description
  - Display name/username

- **Location Details**
  - Primary neighborhood/estate
  - Multiple location support
  - Address details
  - Landmark associations
  - GPS coordinates
  - Location visibility settings

- **Cultural Profile**
  - State of origin
  - Nigerian languages spoken (Hausa, Yoruba, Igbo, English, etc.)
  - Language proficiency levels
  - Cultural background information
  - Ethnic group (optional)
  - Traditional titles (optional)

### 2.2 Professional Information
- **Professional Skills**
  - Skill categories (Technical, Creative, Professional Services, etc.)
  - Skill proficiency levels
  - Years of experience
  - Certifications
  - Portfolio/work samples
  - Professional bio

- **Service Provider Profile**
  - Service categories offered
  - Pricing information
  - Availability schedule
  - Service area/coverage
  - Professional credentials

### 2.3 Profile Management
- **Edit Profile**
  - Update personal information
  - Change profile picture
  - Edit bio and description
  - Update contact information
  - Manage visibility settings

- **Privacy Settings**
  - Profile visibility (public, neighbors only, private)
  - Contact information visibility
  - Location sharing preferences
  - Activity visibility
  - Who can message you
  - Who can see your posts
  - Search visibility

- **Account Settings**
  - Email preferences
  - Notification settings
  - Language preferences
  - Theme settings (light/dark mode)
  - Data privacy controls
  - Account deletion

### 2.4 User Dashboard
- **Activity Overview**
  - Recent posts
  - Recent comments
  - Listings activity
  - Events attending/organizing
  - Messages summary
  - Trust score
  - Badge collection
  - Points balance

- **Statistics**
  - Total posts created
  - Total comments made
  - Listings created
  - Events organized
  - Community engagement score
  - Neighbor connections count
  - Endorsements received

---

## 3. Location & Geographic Services

### 3.1 Nigerian Geographic Hierarchy
- **States**
  - All 36 Nigerian states + FCT
  - State information and metadata
  - Major cities per state
  - State search functionality

- **Local Government Areas (LGAs)**
  - Complete LGA database for all states
  - LGA search by state
  - LGA boundaries and coordinates

- **Wards**
  - Ward-level granularity
  - Ward search within LGAs
  - Ward boundary data

- **Neighborhoods/Estates**
  - Neighborhood types (Area, Estate, Community)
  - Gated estate support
  - Estate verification requirements
  - Sub-neighborhood support
  - Estate/compound-specific terminology

### 3.2 Location Discovery
- **GPS Location Services**
  - Automatic location detection
  - Real-time GPS coordinates
  - Location accuracy assessment
  - Background location updates (optional)

- **Landmark-Based Location**
  - Popular landmarks database
  - Landmark search by area
  - Distance calculations from landmarks
  - Landmark verification

- **Neighborhood Recommendations**
  - GPS-based neighborhood suggestions
  - Distance-based sorting
  - Member count display
  - Nearby landmarks
  - Neighborhood characteristics

### 3.3 Location Management
- **User Locations**
  - Primary location setting
  - Multiple location support
  - Location verification status
  - Location history
  - Location privacy controls

- **Map Integration**
  - Interactive map picker
  - Google Maps integration
  - Custom map markers
  - Area boundary visualization
  - Distance calculations

- **Geospatial Features**
  - PostGIS database support
  - Spatial queries (nearby searches)
  - Distance calculations
  - Radius-based searches
  - Geographic filtering

---

## 4. Social & Community Features

### 4.1 Community Feed
- **Post Types**
  - Text posts
  - Image posts (single/multiple)
  - Video posts
  - Link sharing
  - Poll posts
  - Announcement posts
  - Question posts
  - Help request posts

- **Post Features**
  - Create, edit, delete posts
  - Rich text formatting
  - Mentions (@username)
  - Hashtags (#topic)
  - Post visibility (neighborhood, public)
  - Pin posts
  - Post categories
  - Post scheduling (future feature)

- **Feed Filtering**
  - Filter by category
  - Filter by post type
  - Filter by date range
  - Filter by author
  - Search within feed
  - Sort by relevance/recency

### 4.2 Engagement
- **Reactions**
  - Multiple reaction types (like, love, care, helpful, etc.)
  - Reaction counts
  - Who reacted
  - Remove reactions

- **Comments**
  - Threaded comments
  - Comment replies
  - Comment editing
  - Comment deletion
  - Comment reactions
  - Comment media attachments
  - Comment notifications

- **Sharing**
  - Share posts within app
  - Share to external platforms
  - Share via message
  - Copy link

- **Bookmarks**
  - Save posts for later
  - Bookmark collections
  - Bookmark search
  - Remove bookmarks

### 4.3 Community Connections
- **Neighbor Connections**
  - Send connection requests
  - Accept/decline requests
  - Connection list management
  - Mutual connections
  - Connection suggestions
  - Remove connections

- **Following System**
  - Follow neighbors
  - Follower/following counts
  - Follow notifications
  - Unfollow

- **Community Ratings**
  - Rate neighbor interactions
  - Review neighbors (private/public)
  - Rating categories (helpfulness, reliability, etc.)
  - Average rating display
  - Rating history

### 4.4 Community Engagement
- **Endorsements**
  - Endorse neighbors for skills
  - Endorsement categories
  - Endorsement visibility
  - Mutual endorsements
  - Endorsement notifications

- **Community Activity Tracking**
  - Activity log
  - Contribution metrics
  - Engagement score
  - Active member badges
  - Community participation statistics

---

## 5. Marketplace

### 5.1 Listing Management
- **Listing Types**
  - For Sale (new/used items)
  - For Rent (properties, items)
  - Services offered
  - Job postings
  - Property listings (residential, commercial)
  - Vehicle listings
  - Free items (giveaways)

- **Listing Creation**
  - Title and description
  - Price/pricing options
  - Multiple photos upload (up to 10)
  - Category selection
  - Condition (new/used)
  - Availability status
  - Location/delivery options
  - Contact preferences

- **Listing Features**
  - Edit listings
  - Delete listings
  - Mark as sold/rented
  - Pause/unpause listings
  - Bump/promote listings
  - Listing expiration
  - Auto-renewal options

### 5.2 Marketplace Categories
- **Category Hierarchy**
  - Electronics & Gadgets
  - Home & Garden
  - Fashion & Accessories
  - Vehicles & Auto Parts
  - Real Estate
  - Services
  - Jobs
  - Food & Agriculture
  - Health & Beauty
  - Sports & Hobbies
  - Kids & Baby Items
  - Books & Media
  - Pets & Animals
  - Business & Industrial

### 5.3 Search & Discovery
- **Search Features**
  - Keyword search
  - Category filtering
  - Price range filtering
  - Location/distance filtering
  - Condition filtering
  - Listing type filtering
  - Date posted filtering
  - Sort options (price, date, relevance)

- **Advanced Search**
  - Multiple filter combinations
  - Saved searches
  - Search alerts/notifications
  - Property-specific filters (bedrooms, bathrooms, size)
  - Vehicle-specific filters (make, model, year)

- **Nearby Listings**
  - GPS-based discovery
  - Radius search (1km, 5km, 10km, etc.)
  - Map view of listings
  - Distance display

### 5.4 Listing Interaction
- **Saved Listings**
  - Save/bookmark listings
  - My saved items list
  - Save collections/folders
  - Remove saved items

- **Listing Views**
  - View count tracking
  - View history
  - Popular listings
  - Trending items

- **Contact Seller**
  - Direct messaging
  - Phone contact
  - Email contact
  - WhatsApp integration
  - Anonymous contact options

### 5.5 My Listings
- **Listing Management Dashboard**
  - Active listings
  - Sold/rented listings
  - Expired listings
  - Draft listings
  - Listing statistics (views, saves, messages)
  - Performance metrics

---

## 6. Events Management

### 6.1 Event Creation
- **Event Information**
  - Event title
  - Description
  - Event type (community, social, educational, fundraiser, etc.)
  - Category selection
  - Date and time
  - Duration
  - Location (physical/virtual/hybrid)
  - Venue details
  - Map integration

- **Event Settings**
  - Public/private events
  - Free/paid events
  - Ticket pricing
  - Capacity limits
  - RSVP options (going, maybe, not going)
  - Guest list visibility
  - Allow +1s
  - Registration requirements

- **Event Media**
  - Event cover image
  - Event photos
  - Event videos
  - Gallery uploads

### 6.2 Event Discovery
- **Browse Events**
  - Upcoming events
  - Popular events
  - Featured events
  - Category browsing
  - Date filtering
  - Location-based events

- **Search Events**
  - Keyword search
  - Category filtering
  - Date range filtering
  - Free/paid filtering
  - Distance filtering
  - Neighborhood filtering

- **Event Recommendations**
  - Based on interests
  - Based on past attendance
  - Friend/neighbor attending
  - Popular in your area

### 6.3 Event Participation
- **RSVP System**
  - RSVP to events (Going, Maybe, Not Going)
  - Change RSVP status
  - Cancel RSVP
  - RSVP confirmations
  - Waitlist support
  - Guest limits

- **Event Tickets**
  - Purchase tickets
  - Ticket types (General, VIP, Student, etc.)
  - Payment processing
  - Digital ticket delivery
  - Ticket transfers
  - Refund requests

- **My Events**
  - Events I'm organizing
  - Events I'm attending
  - Past events
  - Event calendar view
  - Event reminders

### 6.4 Event Management
- **Organizer Tools**
  - Edit event details
  - Cancel events
  - Postpone events
  - Attendee list
  - Check-in management
  - Send event updates
  - Post event announcements

- **Attendee Management**
  - View attendee list
  - Search attendees
  - Filter by RSVP status
  - Export attendee list
  - Contact attendees
  - Track check-ins

- **Event Analytics**
  - View counts
  - RSVP statistics
  - Ticket sales
  - Revenue tracking
  - Attendee demographics
  - Engagement metrics

### 6.5 Event Features
- **Event Discussion**
  - Event comments
  - Q&A section
  - Event chat/messaging
  - Photo sharing

- **Event Updates**
  - Push notifications
  - Email updates
  - In-app notifications
  - SMS reminders

- **Post-Event**
  - Photo galleries
  - Event recap
  - Feedback collection
  - Attendee reviews
  - Share memories

---

## 7. Business Profiles & Directory

### 7.1 Business Registration
- **Business Profile Creation**
  - Business name
  - Business type/category
  - Description
  - Logo upload
  - Cover photo
  - Contact information (phone, email, website)
  - Business address
  - Operating hours
  - Social media links

- **Business Categories**
  - Food & Dining (Restaurants, Cafes, Catering)
  - Professional Services (Legal, Accounting, Consulting)
  - Home Services (Plumbing, Electrical, Cleaning)
  - Health & Wellness (Clinics, Pharmacies, Fitness)
  - Beauty & Personal Care (Salons, Spas)
  - Education & Training
  - Retail & Shopping
  - Automotive Services
  - Technology & IT Services
  - Construction & Real Estate
  - Entertainment & Events

### 7.2 Business Management
- **Profile Management**
  - Edit business information
  - Update business hours
  - Add/remove services
  - Upload photos/videos
  - Manage team members
  - Business status (online/offline)

- **Services Offered**
  - Service catalog
  - Service descriptions
  - Pricing information
  - Service photos
  - Service availability
  - Package deals

- **Business Verification**
  - Document upload
  - Business license verification
  - CAC registration verification
  - Physical address verification
  - Phone number verification
  - Verified badge

### 7.3 Business Directory
- **Browse Businesses**
  - Category browsing
  - Neighborhood businesses
  - Nearby businesses
  - Featured businesses
  - Recently added
  - Popular businesses

- **Search Businesses**
  - Keyword search
  - Category filtering
  - Location filtering
  - Rating filtering
  - Service type filtering
  - Operating hours filtering
  - Advanced search filters

### 7.4 Business Interaction
- **Inquiries**
  - Send inquiry to business
  - Inquiry form
  - Quote requests
  - Appointment booking
  - Message business owner
  - My inquiries tracking
  - Business inquiry management

- **Reviews & Ratings**
  - Write reviews
  - Star ratings (1-5)
  - Review photos
  - Review categories (quality, service, value, etc.)
  - Review responses from business
  - Helpful review voting
  - Report inappropriate reviews

- **Business Analytics**
  - Profile views
  - Inquiry statistics
  - Review summary
  - Rating trends
  - Customer demographics
  - Popular services
  - Performance insights

---

## 8. Messaging & Communication

### 8.1 Conversation Types
- **Direct Messages**
  - One-on-one conversations
  - Private messaging
  - User-to-user communication

- **Group Messages**
  - Multi-participant conversations
  - Group creation
  - Add/remove participants
  - Group naming
  - Group photo

- **Community Channels**
  - Neighborhood-wide channels
  - Announcement channels
  - Topic-based channels
  - Read-only channels

- **Context-Based Messaging**
  - Event discussions
  - Business inquiries
  - Listing conversations
  - Help request coordination

### 8.2 Messaging Features
- **Message Types**
  - Text messages
  - Image attachments (single/multiple)
  - Video attachments
  - Document attachments
  - Voice messages
  - Location sharing
  - Contact sharing

- **Message Management**
  - Send messages
  - Edit messages (within time limit)
  - Delete messages (for self/everyone)
  - Forward messages
  - Reply to specific messages
  - Quote messages
  - Message search

- **Rich Features**
  - Typing indicators
  - Read receipts
  - Delivery status
  - Online/offline status
  - Last seen
  - Message reactions
  - Link previews
  - Emoji support

### 8.3 Conversation Management
- **Conversation Controls**
  - Archive conversations
  - Pin conversations
  - Mute notifications
  - Delete conversations
  - Mark as read/unread
  - Block users
  - Report conversations

- **Conversation Info**
  - Participant list
  - Media gallery
  - Shared links
  - Conversation settings
  - Conversation history

### 8.4 File Management
- **Media Upload**
  - Single file upload
  - Multiple file upload (up to 10)
  - Image compression
  - Video compression
  - File size limits
  - Supported formats

- **Media Storage**
  - MinIO S3-compatible storage
  - File organization
  - Access control
  - Expiring URLs
  - File deletion
  - Storage quotas

### 8.5 Notifications
- **Message Notifications**
  - Push notifications
  - In-app notifications
  - Email notifications (optional)
  - SMS notifications (optional)
  - Notification customization
  - Mute options
  - Do Not Disturb mode

---

## 9. Neighborhood Help System

### 9.1 Help Request Creation
- **Request Types**
  - General assistance
  - Emergency help
  - Service needed
  - Item needed (borrow)
  - Skill/expertise needed
  - Transportation help
  - Childcare assistance
  - Pet care
  - Home repair

- **Request Details**
  - Title and description
  - Help category
  - Urgency level
  - Location
  - Time needed
  - Duration
  - Compensation (paid/volunteer)
  - Photos/attachments

### 9.2 Help Discovery
- **Browse Help Requests**
  - Active requests
  - Recent requests
  - Urgent requests
  - Nearby requests
  - Category filtering

- **Help Matching**
  - Skill-based matching
  - Location-based matching
  - Availability matching
  - Past help history

### 9.3 Offering Help
- **Respond to Requests**
  - Offer help
  - Message requester
  - Propose solutions
  - Set availability
  - Negotiate terms

- **Help Coordination**
  - Accept help offer
  - Schedule help
  - Track help status
  - Confirm completion
  - Rate helper

### 9.4 My Help Activity
- **Help Given**
  - Active offers
  - Completed help
  - Help history
  - Thanks received
  - Ratings received

- **Help Received**
  - Active requests
  - Completed requests
  - Help received history
  - Ratings given

---

## 10. Gamification & Rewards

### 10.1 Points System
- **Earning Points**
  - Post creation
  - Comments
  - Helpful reactions
  - Event attendance
  - Help given
  - Profile completion
  - Verification completion
  - Daily login streaks
  - Referrals

- **Point Categories**
  - Community engagement points
  - Help & support points
  - Business activity points
  - Event participation points
  - Verification points

- **Point Redemption**
  - Unlock features
  - Profile boosts
  - Listing promotions
  - Event promotion
  - Exclusive badges

### 10.2 Badges & Achievements
- **Badge Types**
  - Profile badges (Verified, Business Owner, Helper, etc.)
  - Activity badges (Active Member, Event Host, Top Poster)
  - Milestone badges (100 Posts, 50 Helps Given)
  - Special badges (Early Adopter, Community Leader)
  - Seasonal badges (Holiday events)

- **Achievement System**
  - Achievement tracking
  - Progress indicators
  - Achievement unlocks
  - Achievement notifications
  - Achievement sharing

### 10.3 Leaderboards
- **Leaderboard Categories**
  - Overall community ranking
  - Monthly rankings
  - Weekly rankings
  - Category-specific rankings
  - Neighborhood rankings

- **Leaderboard Features**
  - Top 10/25/100 display
  - User rank display
  - Rank changes tracking
  - Historical rankings
  - Leaderboard prizes/recognition

### 10.4 Gamification Dashboard
- **User Stats**
  - Total points
  - Current level
  - Badges earned
  - Achievements unlocked
  - Leaderboard position
  - Next milestone
  - Progress visualization

---

## 11. Trust & Verification System

### 11.1 Identity Verification
- **Email Verification**
  - Email confirmation
  - OTP verification
  - Verified email badge

- **Phone Verification**
  - Nigerian phone number verification
  - SMS/WhatsApp OTP
  - Verified phone badge

- **Address Verification**
  - Utility bill upload
  - Proof of residence
  - Address confirmation
  - Verified address badge

- **NIN Verification**
  - Nigerian National Identity Number
  - Government ID verification
  - NIN API integration
  - Bio-data matching
  - Verification status tracking
  - Verified NIN badge

- **Document Upload**
  - Driver's license
  - International passport
  - Voter's card
  - Government-issued IDs
  - Document image capture
  - Document validation

### 11.2 Trust Score System
- **Trust Score Calculation**
  - Verification level
  - Account age
  - Activity consistency
  - Community feedback
  - Transaction history
  - Response rate
  - Reliability metrics

- **Trust Score Display**
  - Numerical score (0-100)
  - Trust level (Low, Medium, High, Verified)
  - Score breakdown
  - Score history
  - Ways to improve

### 11.3 Verification Audit
- **Audit Trail**
  - Verification attempts
  - Verification timestamps
  - Verification methods used
  - IP address tracking
  - Device information
  - API provider references
  - Failure reasons

- **Security Monitoring**
  - Suspicious activity detection
  - Multiple verification attempts
  - Location anomalies
  - Pattern recognition

---

## 12. Cultural & Language Features

### 12.1 Language Support
- **Multiple Languages**
  - English (default)
  - Hausa
  - Yoruba
  - Igbo
  - Nigerian Pidgin

- **Language Features**
  - App interface translation
  - Content translation
  - Language preferences
  - Language-specific content
  - Auto-detect language

### 12.2 Cultural Context
- **Nigerian-Specific Terms**
  - Estate instead of neighborhood
  - Compound instead of area
  - Local terminology throughout

- **Cultural Profiles**
  - State of origin
  - Ethnic background
  - Traditional titles
  - Cultural interests
  - Cultural events

- **Nigerian States & Cities**
  - Complete state database
  - Major cities
  - Local government areas
  - Cultural landmarks

---

## 13. Notifications

### 13.1 Notification Types
- **Social Notifications**
  - New connection requests
  - Connection accepted
  - Post reactions
  - New comments
  - Mentions
  - Shares

- **Marketplace Notifications**
  - Listing inquiries
  - Price changes
  - Saved listing updates
  - Similar listings

- **Event Notifications**
  - Event invitations
  - RSVP confirmations
  - Event reminders
  - Event updates
  - Event cancellations

- **Messaging Notifications**
  - New messages
  - Unread messages
  - Message reactions
  - Typing indicators

- **System Notifications**
  - Account updates
  - Security alerts
  - Verification status
  - Achievement unlocks
  - Policy updates

### 13.2 Notification Management
- **Notification Preferences**
  - Push notifications on/off
  - Email notifications on/off
  - SMS notifications on/off
  - In-app notifications
  - Notification categories
  - Quiet hours

- **Notification Center**
  - All notifications
  - Unread notifications
  - Mark as read
  - Delete notifications
  - Notification filters
  - Notification history

---

## 14. Search & Discovery

### 14.1 Global Search
- **Search Across**
  - Users/profiles
  - Posts
  - Events
  - Listings
  - Businesses
  - Neighborhoods

### 14.2 Advanced Search
- **Filter Options**
  - Category filters
  - Location filters
  - Date filters
  - Price filters
  - Rating filters
  - Verification filters

### 14.3 Search Features
- **Smart Search**
  - Autocomplete
  - Search suggestions
  - Recent searches
  - Popular searches
  - Typo correction
  - Synonyms

- **Saved Searches**
  - Save search criteria
  - Search alerts
  - Scheduled searches
  - Search notifications

---

## 15. Media Management

### 15.1 Image Handling
- **Image Upload**
  - Single/multiple uploads
  - Image cropping
  - Image rotation
  - Image compression
  - Image optimization
  - Format conversion

- **Image Features**
  - Thumbnail generation
  - Multiple sizes
  - CDN delivery
  - Lazy loading
  - Progressive loading

### 15.2 Video Handling
- **Video Upload**
  - Video file upload
  - Video compression
  - Format conversion
  - Video thumbnails
  - Duration limits
  - Size limits

### 15.3 Storage
- **MinIO Storage**
  - S3-compatible storage
  - Bucket organization
  - Access control
  - URL signing
  - Expiring URLs
  - Storage quotas

---

## 16. Moderation & Safety

### 16.1 Content Moderation
- **Automated Moderation**
  - Profanity filtering
  - Spam detection
  - Duplicate content detection
  - Image content analysis

- **Manual Moderation**
  - Report content
  - Report users
  - Flagging system
  - Moderator queue
  - Content removal

### 16.2 User Safety
- **Blocking**
  - Block users
  - Blocked users list
  - Unblock users
  - Blocking visibility

- **Privacy Controls**
  - Profile privacy
  - Location privacy
  - Contact information privacy
  - Activity privacy
  - Search visibility

- **Reporting**
  - Report abuse
  - Report spam
  - Report inappropriate content
  - Report safety concerns
  - Emergency reporting

---

## 17. Analytics & Reporting

### 17.1 User Analytics
- **Personal Insights**
  - Activity summary
  - Engagement metrics
  - Growth tracking
  - Performance metrics

### 17.2 Business Analytics
- **Business Metrics**
  - Profile views
  - Inquiry statistics
  - Review analytics
  - Rating trends
  - Revenue tracking
  - Customer insights

### 17.3 Event Analytics
- **Event Metrics**
  - View counts
  - RSVP statistics
  - Attendance tracking
  - Ticket sales
  - Engagement metrics
  - Post-event analysis

---

## 18. Admin & Management Features

### 18.1 Estate Manager Features
- **Neighborhood Management**
  - Resident verification
  - Announcement posting
  - Access control
  - Visitor management
  - Neighborhood settings

### 18.2 Community Moderation
- **Moderator Tools**
  - Content review queue
  - User management
  - Ban/suspend users
  - Content removal
  - Warning system

### 18.3 System Administration
- **Role-Based Access**
  - Admin roles
  - Super admin
  - Moderators
  - Estate managers
  - Permissions management

- **System Monitoring**
  - Health checks
  - Performance monitoring
  - Error tracking
  - Usage statistics
  - Audit logs

---

## Technical Features

### API & Infrastructure
- **RESTful APIs**
  - Swagger/OpenAPI documentation
  - Versioned endpoints
  - Consistent error handling
  - Rate limiting
  - Caching (Redis)

- **Microservices Architecture**
  - API Gateway (port 3000)
  - Auth Service (port 3001)
  - User Service (port 3002)
  - Social Service (port 3003)
  - Messaging Service (port 3004)
  - Marketplace Service (port 3005)
  - Events Service (port 3006)
  - Notification Service (port 3007)
  - Business Service (port 3008)
  - Location Service (port 3009)

- **Database**
  - PostgreSQL with PostGIS
  - TypeORM migrations
  - Database seeding
  - Backup & recovery

- **Message Queue**
  - RabbitMQ integration
  - Async processing
  - Job scheduling

- **Storage**
  - MinIO (S3-compatible)
  - File uploads
  - CDN integration

- **Security**
  - JWT authentication
  - Role-based access control (RBAC)
  - API rate limiting
  - CORS configuration
  - Helmet.js security
  - SQL injection prevention
  - XSS protection

### Mobile App Technologies
- **React Native + Expo**
  - Cross-platform (iOS, Android, Web)
  - Expo SDK ~53.0.20
  - TypeScript
  - React Navigation v7

- **UI Libraries**
  - React Native Paper
  - React Native Elements
  - Custom design system

- **State Management**
  - React Context API
  - Custom hooks

- **Storage**
  - AsyncStorage
  - Expo SecureStore

- **Location Services**
  - Expo Location
  - React Native Maps
  - GPS integration

---

## Summary Statistics

### Feature Count by Category
1. **Authentication & Onboarding:** 30+ features
2. **User Profile & Identity:** 40+ features
3. **Location & Geographic:** 25+ features
4. **Social & Community:** 50+ features
5. **Marketplace:** 45+ features
6. **Events Management:** 35+ features
7. **Business Profiles:** 30+ features
8. **Messaging:** 40+ features
9. **Help System:** 20+ features
10. **Gamification:** 25+ features
11. **Trust & Verification:** 20+ features
12. **Cultural Features:** 15+ features
13. **Notifications:** 20+ features
14. **Search & Discovery:** 15+ features
15. **Media Management:** 15+ features
16. **Moderation & Safety:** 15+ features
17. **Analytics:** 15+ features
18. **Admin Features:** 15+ features

**Total Features:** 450+ comprehensive features

---

## Mobile App Screens (80+ screens)

### Onboarding Screens (12)
- WelcomeHeroScreen
- WelcomeScreen
- EmailRegistrationScreen
- EmailVerificationScreen
- EmailLoginScreen
- PhoneVerificationScreen
- OTPVerificationScreen
- LocationSetupScreen
- LocationSetupScreenNew
- NeighborhoodRecommendationScreen
- EstateVerificationScreen
- MapPickerScreen

### Main Tab Screens (5)
- HomeScreen
- EventsScreen
- MarketplaceScreen (via navigator)
- HelpNavigator
- ProfileScreen

### Profile & User Screens (15)
- ProfileScreen
- EditProfileScreen
- CulturalProfileScreen
- ProfessionalSkillsScreen
- NINVerificationScreen
- DocumentUploadScreen
- BadgeSystemScreen
- DashboardScreen
- CommunityActivityScreen
- NeighborRatingScreen
- CommunityEngagementScreen
- NeighborConnectionsScreen
- CommunityEndorsementScreen
- BookmarksScreen
- MoreScreen

### Business Screens (10)
- BusinessProfileScreen
- BusinessRegistrationScreen
- EditBusinessProfileScreen
- LocalBusinessDirectoryScreen
- BusinessDetailScreen
- BusinessSearchScreen
- BusinessReviewsScreen
- WriteReviewScreen
- BusinessAnalyticsScreen
- BusinessInquiriesScreen
- MyInquiriesScreen
- AdvancedSearchFiltersScreen

### Marketplace Screens (8)
- MarketplaceScreen
- CreateListingScreen
- ListingDetailsScreen
- MyListingsScreen
- CategoryBrowseScreen
- SearchResultsScreen
- ServiceProviderProfileScreen

### Event Screens (6)
- EventsScreen
- CreateEventScreen
- EventDetailsScreen
- EventAttendeesScreen
- CategoryEventsScreen
- EventPaymentScreen

### Social Screens (4)
- FeedScreen
- CreatePostScreen
- PostScreen
- PostDetailScreen

### Messaging Screens (2)
- MessagingScreen
- ChatScreen

### Help System Screens (5)
- HelpRequestsScreen
- CreateHelpPostScreen
- HelpRequestDetailScreen
- OfferHelpScreen
- MyHelpActivityScreen

### Location Screens (3)
- LocationManagementScreen
- NeighborhoodDiscoveryScreen
- LocationTestScreen

### Other Screens (10)
- NotificationsScreen
- EstateManagerScreen
- DiscoverScreen
- AvatarTestScreen
- NINTestScreen
- DashboardTestScreen

---

## Backend API Endpoints (200+ endpoints)

### Auth Service (~50 endpoints)
- Registration (email, phone, social)
- Login (password, OTP, social)
- Token management (refresh, revoke)
- OTP operations (send, verify, resend)
- Password reset
- Profile management
- Google OAuth (web & mobile)
- Phone verification
- Location setup
- Onboarding tracking

### User Service (~40 endpoints)
- Profile CRUD
- User dashboard
- NIN verification
- Document upload
- Trust score
- Badges & achievements
- Points & leaderboard
- Gamification
- Cultural profile
- User activity logs
- Audit trails

### Social Service (~30 endpoints)
- Posts CRUD
- Comments
- Reactions
- Categories
- Media uploads
- Content moderation
- Post filtering
- Feed generation

### Marketplace Service (~35 endpoints)
- Listings CRUD
- Categories
- Search & filters
- Saved listings
- Nearby search
- Mark sold
- Rate limiting
- Cache management

### Events Service (~25 endpoints)
- Events CRUD
- RSVP management
- Attendee management
- Event categories
- Nearby events
- My events
- Featured events
- View tracking

### Messaging Service (~30 endpoints)
- Conversations CRUD
- Messages CRUD
- Typing indicators
- Read receipts
- File attachments
- Archive/pin
- Context-based messaging

### Business Service (~30 endpoints)
- Business profiles CRUD
- Services management
- Licenses & verification
- Reviews & ratings
- Inquiries
- Analytics
- Search & directory
- Business categories

### Location Service (~25 endpoints)
- States, LGAs, Wards
- Neighborhoods CRUD
- Landmarks
- Location search
- Recommendations
- User locations
- Verification

### Notification Service (~10 endpoints)
- Send notifications
- Preferences
- Notification history
- Mark read
- Delete notifications

---

## Database Entities (55+ entities)

### Core Entities
- User
- UserSession
- Role
- EmailOtp
- OtpVerification

### Profile Entities
- UserPrivacySettings
- UserLanguage
- CulturalBackground
- ProfessionalCategory
- NigerianLanguage
- NigerianState

### Location Entities
- State
- LocalGovernmentArea
- Ward
- Neighborhood
- Landmark
- UserLocation
- UserNeighborhood

### Social Entities
- Post
- PostComment
- PostReaction
- PostCategory
- PostMedia
- CommentMedia
- Media
- UserBookmark

### Marketplace Entities
- Listing
- ListingCategory
- ListingMedia
- ListingSave
- ServiceInquiry

### Event Entities
- Event
- EventCategory
- EventAttendee
- EventMedia

### Business Entities
- BusinessProfile
- BusinessCategory
- BusinessService
- BusinessLicense
- BusinessReview
- BusinessInquiry
- BusinessActivityLog

### Verification Entities
- NinVerification
- IdentityDocument
- VerificationAudit

### Gamification Entities
- Badge
- UserBadge
- Achievement
- UserAchievement
- UserPoints
- GamificationBadge
- LeaderboardSnapshot
- UserActivityLog
- CommunityEndorsement
- UserDashboardStats

---

*This comprehensive list represents the full feature set of MeCabal as of October 2025. The platform is designed specifically for Nigerian communities with culturally relevant features and terminology.*
