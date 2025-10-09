# MeCabal User Service - Master Implementation Plan
**Complete Backend Implementation Roadmap**
*From Zero to Production-Ready*

---

## Executive Summary

This master plan provides a complete roadmap for implementing all missing backend functionality for MeCabal's user-related features. The mobile app has sophisticated UI for user profiles, verification, gamification, and cultural features - but the backend is severely underdeveloped.

### Current State
- ✅ Mobile app: Feature-complete with rich UI
- ❌ Backend: User Service is a "Hello World" placeholder
- ❌ Backend: No gamification, verification, or cultural systems

### Goal State
- ✅ Fully functional User Service with all profile features
- ✅ Complete verification system with NIN integration
- ✅ Gamification system with achievements and leaderboards
- ✅ Cultural profile system with Nigerian context
- ✅ Business account system (Gap 5 - separate guide)

---

## Document Structure

This implementation plan consists of **6 comprehensive guides**:

### 📘 Core Documents

1. **USER_SERVICE_FUNCTIONALITY_GAPS.md** (Analysis Document)
   - Identifies all 50+ functionality gaps
   - Compares mobile app features vs backend
   - Provides effort estimates (122 developer days)
   - Prioritizes implementation order

### 📗 Implementation Guides

2. **USER_PROFILE_VERIFICATION_IMPLEMENTATION_GUIDE.md** (Gap 1)
   - User Profile Management (10 days)
   - Dashboard & Statistics
   - Bookmarks system
   - File uploads with avatar processing

3. **VERIFICATION_SYSTEM_IMPLEMENTATION_GUIDE.md** (Gap 2)
   - NIN Verification (10 days)
   - Trust score calculation
   - Identity document management
   - Verification badges
   - Community endorsements

4. **GAMIFICATION_LEADERBOARD_IMPLEMENTATION_GUIDE.md** (Gap 3)
   - Achievements system (20 days)
   - Badges system
   - Points & activity tracking
   - Leaderboard rankings
   - Level progression
   - Nigerian community titles

5. **CULTURAL_PROFILE_IMPLEMENTATION_GUIDE.md** (Gap 4)
   - Nigerian reference data (10 days)
   - Cultural profile management
   - Language support
   - Privacy settings
   - Cultural matching

### 🔧 Supporting Documents

6. **SHARED_FILE_UPLOAD_REFACTOR_GUIDE.md**
   - Refactors existing DigitalOcean Spaces service
   - Creates shared storage library
   - Enables reuse across all services

---

## Implementation Timeline

### Phase 1: Foundation (Weeks 1-2)
**Sprint 1: User Profile Management** (10 days)
- [ ] Set up User Service module structure
- [ ] Create user CRUD endpoints
- [ ] Implement avatar upload with shared storage
- [ ] Build user search functionality
- [ ] Create dashboard statistics system
- [ ] Implement bookmarks

**Sprint 2: File Storage Refactor** (2 days)
- [ ] Create shared storage library
- [ ] Move DigitalOcean Spaces service
- [ ] Add image processing service
- [ ] Update Social Service to use shared storage

**Deliverable:** Functional User Service with profile management

---

### Phase 2: Verification (Weeks 3-4)
**Sprint 3: Verification System** (10 days)
- [ ] Create verification database schema
- [ ] Implement NIN verification API integration
- [ ] Build trust score calculation
- [ ] Create verification badge system
- [ ] Add document upload & management
- [ ] Implement verification audit trail
- [ ] Add community endorsements

**Deliverable:** Complete verification system with NIN integration

---

### Phase 3: Gamification (Weeks 5-8)
**Sprint 4-5: Gamification & Leaderboards** (20 days)
- [ ] Create gamification database schema
- [ ] Seed achievements and badges data
- [ ] Implement points tracking system
- [ ] Build achievement unlock logic
- [ ] Create badge awarding system
- [ ] Implement leaderboard calculations
- [ ] Add level progression
- [ ] Create Nigerian community titles
- [ ] Build CRON jobs for resets

**Deliverable:** Full gamification system with real-time leaderboards

---

### Phase 4: Cultural Features (Weeks 9-10)
**Sprint 6: Cultural Profile System** (10 days)
- [ ] Create cultural database schema
- [ ] Seed Nigerian reference data (states, languages, cultures)
- [ ] Implement cultural profile management
- [ ] Build privacy settings system
- [ ] Create cultural matching algorithms
- [ ] Add professional networking features
- [ ] Implement multi-language support

**Deliverable:** Nigerian-specific cultural features

---

## Total Timeline Summary

| Phase | Duration | Sprints | Developer Days |
|-------|----------|---------|----------------|
| Phase 1 | 2 weeks | 1-2 | 12 days |
| Phase 2 | 2 weeks | 3 | 10 days |
| Phase 3 | 4 weeks | 4-5 | 20 days |
| Phase 4 | 2 weeks | 6 | 10 days |
| **TOTAL** | **10 weeks** | **6 sprints** | **52 days** |

### Resource Options:
- **1 Developer:** 10 weeks (2.5 months)
- **2 Developers:** 5 weeks (1.25 months)
- **3 Developers:** 3.5 weeks (less than 1 month)

---

## Database Schema Overview

### New Tables Created

#### Gap 1: User Profile Management (3 tables)
- `user_bookmarks` - Save posts, listings, events
- `user_dashboard_stats` - Cached user statistics
- Extended: `users` table (existing)

#### Gap 2: Verification System (6 tables)
- `nin_verifications` - NIN verification records
- `identity_documents` - Document uploads
- `verification_audit` - Audit trail
- `user_badges` - Verification badges (distinct from gamification badges)
- `community_endorsements` - Neighbor endorsements

#### Gap 3: Gamification System (7 tables)
- `achievements` - Achievement definitions
- `user_achievements` - User achievement progress
- `badges` - Badge definitions
- `gamification_badges` - Awarded badges
- `user_activity_log` - Activity tracking
- `user_points` - Points and levels
- `leaderboard_snapshots` - Cached rankings

#### Gap 4: Cultural Profile System (6 tables)
- `nigerian_states` - State reference data
- `nigerian_languages` - Language reference data
- `cultural_backgrounds` - Cultural group data
- `professional_categories` - Professional titles
- `user_privacy_settings` - Privacy controls
- `user_languages` - User language associations

**Total New Tables: 22**

---

## Technology Stack

### Backend Framework
- **NestJS** - TypeScript framework
- **TypeORM** - Database ORM
- **PostgreSQL** - Primary database
- **Redis** (optional) - Caching for leaderboards

### File Storage
- **DigitalOcean Spaces** (S3-compatible)
- **Sharp** - Image processing
- **AWS SDK** - S3 operations

### External Services
- **NIN Verification API** (Youverify/Dojah/NIMC)
- **Email Service** (Brevo) - Already configured
- **SMS Service** (for phone verification)

### Development Tools
- **Jest** - Testing framework
- **Swagger** - API documentation
- **ESLint/Prettier** - Code quality

---

## API Endpoints Summary

### User Profile (Gap 1) - 12 endpoints
```
GET    /users/me
GET    /users/:id
PUT    /users/me
POST   /users/me/avatar
DELETE /users/me/avatar
GET    /users/search
GET    /users/nearby
GET    /users/verified
GET    /users/me/completion
GET    /users/dashboard/stats
POST   /users/dashboard/bookmarks
DELETE /users/dashboard/bookmarks/:type/:id
```

### Verification (Gap 2) - 9 endpoints
```
POST   /verification/nin/initiate
GET    /verification/nin/status/:userId
POST   /verification/document/upload
GET    /verification/documents
GET    /verification/trust-score
POST   /verification/badges/award
GET    /verification/badges/:userId
POST   /verification/endorse/:userId
GET    /verification/endorsements/:userId
```

### Gamification (Gap 3) - 15 endpoints
```
GET    /gamification/achievements
GET    /gamification/achievements/user/:userId
POST   /gamification/achievements/:id/unlock
GET    /gamification/badges
GET    /gamification/badges/user/:userId
POST   /gamification/badges/:id/claim
GET    /gamification/leaderboard/:category
GET    /gamification/leaderboard/:category/:period
GET    /gamification/user/:userId/level
GET    /gamification/user/:userId/stats
POST   /gamification/activities/track
GET    /gamification/activities/:userId
POST   /gamification/endorse/:userId
GET    /gamification/community-titles
GET    /gamification/streak/:userId
```

### Cultural Profile (Gap 4) - 12 endpoints
```
GET    /reference/states
GET    /reference/states/:id/lgas
GET    /reference/languages
GET    /reference/cultures
GET    /reference/professions
GET    /users/:id/cultural-profile
PUT    /users/:id/cultural-profile
POST   /users/:id/languages
DELETE /users/:id/languages/:langId
GET    /users/:id/privacy-settings
PUT    /users/:id/privacy-settings
GET    /cultural-matching/by-language/:langId
```

**Total API Endpoints: 48**

---

## Testing Strategy

### Unit Tests (Required)
- Service methods (business logic)
- Utility functions
- Data transformations
- Target: 80% coverage

### Integration Tests (Required)
- API endpoint behavior
- Database operations
- File upload functionality
- Authentication flows

### E2E Tests (Recommended)
- Complete user journeys
- Critical path testing
- Mobile app integration

---

## Security Considerations

### Data Protection
- ✅ Encrypt NIN numbers at rest (AES-256-GCM)
- ✅ Secure document storage (private S3 buckets)
- ✅ JWT token authentication
- ✅ Rate limiting on sensitive endpoints
- ✅ Input validation with DTOs

### Privacy
- ✅ User-controlled privacy settings
- ✅ GDPR-compliant data deletion
- ✅ Audit trails for verification
- ✅ Anonymization after account deletion

### Access Control
- ✅ Role-based access control (RBAC)
- ✅ Users can only modify their own data
- ✅ Admin-only verification endpoints
- ✅ Verified-user-only endorsements

---

## Environment Variables Required

```env
# Database
DATABASE_HOST=localhost
DATABASE_PORT=5432
DATABASE_NAME=mecabal
DATABASE_USER=postgres
DATABASE_PASSWORD=your_password

# DigitalOcean Spaces
DO_SPACES_KEY=your_access_key
DO_SPACES_SECRET=your_secret_key
DO_SPACES_BUCKET=mecabal-uploads
DO_SPACES_REGION=nyc3
DO_SPACES_ENDPOINT=https://nyc3.digitaloceanspaces.com
DO_SPACES_CDN_ENABLED=true

# NIN Verification
NIN_VERIFICATION_PROVIDER=youverify
YOUVERIFY_API_KEY=your_api_key
YOUVERIFY_API_SECRET=your_api_secret

# Encryption
ENCRYPTION_KEY=your_32_byte_encryption_key
ENCRYPTION_ALGORITHM=aes-256-gcm

# File Upload Limits
MAX_FILE_SIZE=5242880
ALLOWED_IMAGE_TYPES=image/jpeg,image/png,image/webp

# Redis (Optional)
REDIS_HOST=localhost
REDIS_PORT=6379
REDIS_PASSWORD=

# Other Services
BREVO_API_KEY=your_brevo_key (already configured)
```

---

## Deployment Checklist

### Pre-Deployment
- [ ] All tests passing
- [ ] Code reviewed and approved
- [ ] Environment variables configured
- [ ] Database migrations ready
- [ ] S3 buckets created and configured
- [ ] NIN verification API credentials obtained
- [ ] Swagger documentation complete

### Database Migration
```bash
npm run migration:run
npm run db:seed
```

### Service Deployment
```bash
npm run build
npm run start:prod
```

### Post-Deployment
- [ ] Health checks passing
- [ ] API endpoints responding
- [ ] File uploads working
- [ ] Database connections stable
- [ ] Monitoring configured
- [ ] Error tracking enabled (Sentry)
- [ ] Load testing completed

---

## Success Metrics

### Functionality
- ✅ All 48 API endpoints operational
- ✅ Mobile app can successfully call all endpoints
- ✅ No "demo data" in production
- ✅ All database operations working

### Performance
- 📊 API response time < 200ms (95th percentile)
- 📊 File upload time < 5s for 5MB files
- 📊 Leaderboard calculation < 1s
- 📊 Search results < 500ms

### Quality
- 📊 Test coverage > 80%
- 📊 Zero critical bugs
- 📊 API uptime > 99.5%
- 📊 Error rate < 1%

---

## Risk Mitigation

### Technical Risks

**Risk 1: NIN Verification API Integration**
- **Mitigation:** Start with test/sandbox environment
- **Fallback:** Implement manual verification workflow
- **Timeline Impact:** +2 days if issues occur

**Risk 2: Performance with Large Leaderboards**
- **Mitigation:** Implement Redis caching early
- **Fallback:** Pre-calculated snapshots
- **Timeline Impact:** +1 day

**Risk 3: File Storage Costs**
- **Mitigation:** Implement file size limits and compression
- **Fallback:** Cleanup old files, implement storage tiers
- **Timeline Impact:** None

### Process Risks

**Risk 1: Scope Creep**
- **Mitigation:** Stick to documented requirements
- **Action:** Any new features go to backlog

**Risk 2: Resource Availability**
- **Mitigation:** Clear sprint planning
- **Action:** Buffer time in estimates (already included)

---

## Next Steps

### Immediate Actions (Week 1)

1. **Review All Documents** (1 day)
   - Read all implementation guides
   - Clarify any questions
   - Set up development environment

2. **Create Shared Storage Library** (0.5 days)
   - Refactor DigitalOcean Spaces service
   - Test with Social Service
   - Deploy shared library

3. **Start Sprint 1: User Profile** (Day 3-10)
   - Follow USER_PROFILE_VERIFICATION_IMPLEMENTATION_GUIDE.md
   - Complete all tasks in sequence
   - Run tests after each task

### Developer Onboarding

**Day 1: Setup**
- Clone repository
- Install dependencies
- Set up database
- Configure environment variables
- Run existing services

**Day 2: Understanding**
- Review mobile app features
- Read gap analysis document
- Understand database schema
- Review existing code patterns

**Day 3: Start Coding**
- Begin Sprint 1 tasks
- Follow implementation guide step-by-step
- Ask questions early

---

## Support & Resources

### Documentation
- 📘 Gap Analysis: `USER_SERVICE_FUNCTIONALITY_GAPS.md`
- 📗 Implementation Guides: 5 detailed guides (1200+ lines each)
- 📙 Shared Storage: `SHARED_FILE_UPLOAD_REFACTOR_GUIDE.md`
- 📕 This Master Plan: `IMPLEMENTATION_MASTER_PLAN.md`

### Code Examples
- ✅ Complete service implementations
- ✅ Full DTOs with validation
- ✅ Controller endpoints with Swagger
- ✅ Database migrations ready to run
- ✅ Entity classes with relationships

### Best Practices
- ✅ NestJS module patterns
- ✅ TypeORM best practices
- ✅ Error handling patterns
- ✅ Security measures
- ✅ Testing strategies

---

## Conclusion

This master plan provides a **complete, actionable roadmap** for implementing all missing backend functionality for MeCabal's user-related features.

### What You Have
- ✅ **6 comprehensive guides** with 1500+ lines of production-ready code
- ✅ **48 API endpoints** fully specified
- ✅ **22 database tables** with complete migrations
- ✅ **52 developer days** of work broken into manageable tasks
- ✅ **Step-by-step instructions** for every feature

### What You'll Build
- ✅ Fully functional User Service
- ✅ Complete verification system
- ✅ Sophisticated gamification with leaderboards
- ✅ Nigerian-specific cultural features
- ✅ Production-ready backend infrastructure

### Timeline
- **1 Developer:** 2.5 months
- **2 Developers:** 1.25 months
- **3 Developers:** Less than 1 month

---

**The mobile app has been beautifully built. Now it's time to give it the backend it deserves!** 🚀

---

*Last Updated: 2025-10-09*
*Version: 1.0*
