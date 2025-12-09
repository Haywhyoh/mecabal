# Business Service - Comprehensive Unit Test Plan
## QA Testing Perspective

This document outlines the comprehensive unit testing strategy for all business services from an experienced QA tester's perspective.

## Test Coverage Summary

### ✅ Already Implemented:
1. **business-profile.service.spec.ts** - Basic tests exist

### 📝 Recommended Additional Tests:

---

## 1. Business Profile Service (`business-profile.service.ts`)

### Current Coverage:
- ✅ create()
- ✅ findById()
- ✅ findByUserId()
- ✅ update()
- ✅ updateStatus()
- ✅ delete()
- ✅ incrementCompletedJobs()

### Recommended Additional Test Cases:
- **Security Tests**:
  - SQL injection prevention
  - Authorization checks across all endpoints
  - Cross-user data access prevention

- **Edge Cases**:
  - Concurrent updates
  - Empty/null field handling
  - Image upload failures (updateProfileImage, updateCoverImage)
  - Character limit validations
  - Special characters in business names

- **Performance**:
  - Multiple concurrent creates
  - Large batch updates
  - Query optimization validation

---

## 2. Booking Service (`booking.service.ts`)

### Functions to Test:
- `create()` - Create new booking
- `findUserBookings()` - Get user's bookings with pagination
- `findBusinessBookings()` - Get business bookings with pagination
- `findById()` - Get booking by ID
- `updateStatus()` - Update booking status
- `cancel()` - Cancel booking
- `findReviewableBookings()` - Get completed bookings that can be reviewed

### Critical Test Cases:

#### create()
- ✅ **Success**: Valid booking creation
- ✅ **Validation**: Business exists
- ✅ **Validation**: Service exists for business
- ✅ **Critical**: Bank account verification check
- ❌ **Error**: Business not found
- ❌ **Error**: Service not found
- ❌ **Error**: No verified bank account
- ⚠️ **Edge**: Double booking prevention
- ⚠️ **Edge**: Booking in the past
- ⚠️ **Edge**: Invalid date ranges

#### findUserBookings()
- ✅ **Success**: Returns paginated bookings
- ✅ **Filter**: Status filtering works
- ✅ **Filter**: Business ID filtering
- ⚠️ **Edge**: Date range filtering
- ⚠️ **Pagination**: Page boundaries
- ⚠️ **Performance**: Large dataset handling

#### updateStatus()
- ✅ **Success**: Business owner can update
- ✅ **Success**: Customer can cancel
- ✅ **Auto-mark**: Completed bookings marked as reviewable
- ✅ **Timestamp**: Completed/cancelled timestamps set
- ❌ **Forbidden**: Non-participants cannot update
- ⚠️ **State**: Invalid state transitions prevented
- ⚠️ **Concurrent**: Handle simultaneous status changes

#### cancel()
- ✅ **Success**: Customer cancels booking
- ✅ **Success**: Business owner cancels
- ❌ **Error**: Cannot cancel completed booking
- ❌ **Error**: Cannot cancel already cancelled
- ❌ **Forbidden**: Third party cannot cancel
- ⚠️ **Refund**: Refund logic triggered (if applicable)

---

## 3. Business Review Service (`business-review.service.ts`)

### Functions to Test:
- `create()` - Create review
- `findByBusiness()` - Get business reviews with pagination
- `findById()` - Get review by ID
- `respondToReview()` - Business owner responds
- `update()` - Update own review
- `delete()` - Delete own review
- `getReviewStats()` - Get aggregated statistics
- `updateBusinessRating()` - Recalculate business rating

### Critical Test Cases:

#### create()
- ✅ **Success**: Customer creates review
- ✅ **Validation**: Booking verification
- ✅ **Auto-update**: Business rating recalculated
- ❌ **Duplicate**: Cannot review same business twice
- ❌ **Forbidden**: Owner cannot review own business
- ❌ **Booking**: Booking already reviewed
- ⚠️ **Integrity**: All rating fields validated (1-5)
- ⚠️ **Content**: Profanity filtering (if implemented)

#### findByBusiness()
- ✅ **Success**: Returns paginated reviews
- ✅ **Filter**: Rating filter works
- ✅ **Sort**: Newest first
- ⚠️ **Performance**: Large review counts
- ⚠️ **Relations**: User data loaded correctly

#### getReviewStats()
- ✅ **Accuracy**: Average calculation correct
- ✅ **Distribution**: Rating distribution accurate
- ✅ **Sub-ratings**: Service quality, professionalism, value averages
- ⚠️ **Edge**: No reviews returns zeros
- ⚠️ **Rounding**: Decimal precision
- ⚠️ **Performance**: Large dataset aggregation

#### respondToReview()
- ✅ **Success**: Business owner responds
- ✅ **Timestamp**: Response timestamp set
- ❌ **Forbidden**: Non-owner cannot respond
- ⚠️ **Editable**: Can update response
- ⚠️ **Notification**: Customer notified (if applicable)

#### update() & delete()
- ✅ **Success**: Owner updates/deletes review
- ✅ **Auto-update**: Business rating recalculated
- ❌ **Forbidden**: Cannot modify others' reviews
- ⚠️ **Cascade**: Booking marked as not reviewed (on delete)

---

## 4. Payment Service (`payment.service.ts`)

### Functions to Test:
- `initializePayment()` - Initialize Paystack payment
- `verifyPayment()` - Verify payment with Paystack
- `findUserPayments()` - Get user payments with filters
- (Additional methods from full file)

### Critical Test Cases:

#### initializePayment()
- ✅ **Success**: Payment initialized successfully
- ✅ **Paystack**: Correct API call made
- ✅ **Reference**: Unique reference generated (MCB_*)
- ✅ **Metadata**: User ID, booking ID stored
- ❌ **Error**: Booking not found
- ❌ **Error**: Booking already paid
- ❌ **Paystack**: API failure handled
- ⚠️ **Amount**: Amount validation
- ⚠️ **Currency**: Currency defaults to NGN
- ⚠️ **Idempotency**: Duplicate requests handled

#### verifyPayment()
- ✅ **Success**: Payment verified with Paystack
- ✅ **Status**: Payment status updated correctly
- ✅ **Booking**: Booking status auto-confirmed on payment
- ✅ **Timestamp**: paidAt timestamp set
- ❌ **Error**: Payment not found
- ❌ **Error**: Paystack verification failed
- ⚠️ **Double-verify**: Idempotent verification
- ⚠️ **Webhooks**: Webhook signature verification
- ⚠️ **Race**: Handle concurrent verifications

#### findUserPayments()
- ✅ **Success**: Returns user's payments
- ✅ **Filter**: Type filter works
- ✅ **Filter**: Status filter works
- ✅ **Pagination**: Correct pagination
- ⚠️ **Privacy**: Cannot see other users' payments
- ⚠️ **Performance**: Large payment histories

#### Security & Compliance
- 🔒 **PCI**: No card details stored
- 🔒 **Encryption**: Sensitive data encrypted
- 🔒 **Audit**: Payment events logged
- 🔒 **Webhooks**: Signature verification
- 🔒 **Refunds**: Proper authorization checks

---

## 5. Business Search Service (`business-search.service.ts`)

### Functions to Test:
- `search()` - General search
- `searchByServiceArea()` - Location-based search
- `getFeaturedBusinesses()` - Get top-rated businesses
- `getTrendingBusinesses()` - Get trending businesses

### Critical Test Cases:

#### search()
- ✅ **Success**: Returns active businesses
- ✅ **Filter**: Category filter
- ✅ **Filter**: Location/radius filter
- ✅ **Sort**: Multiple sort options
- ✅ **Pagination**: Correct pagination
- ⚠️ **Query**: Text search in name/description
- ⚠️ **Performance**: Full-text search optimization
- ⚠️ **Relevance**: Result ranking algorithm

#### searchByServiceArea()
- ✅ **Success**: Returns businesses by service area
- ✅ **Radius**: Neighborhood, 2km, 5km, 10km, city, state, nationwide
- ✅ **Category**: Optional category filter
- ⚠️ **Geolocation**: Correct distance calculations
- ⚠️ **Performance**: Spatial index usage
- ⚠️ **Edge**: Boundary cases (near borders)

#### getFeaturedBusinesses()
- ✅ **Success**: Returns top-rated verified businesses
- ✅ **Sort**: By rating and review count
- ✅ **Filter**: Only active and verified
- ⚠️ **Limit**: Respects limit parameter
- ⚠️ **Diversity**: Category distribution

#### getTrendingBusinesses()
- ✅ **Success**: Returns recently active businesses
- ✅ **Time**: Last 30 days activity
- ✅ **Sort**: By reviews and completed jobs
- ⚠️ **Algorithm**: Trending score calculation
- ⚠️ **Freshness**: Recent activity weighted

---

## QA Testing Best Practices Applied

### 1. **Test Organization**
```typescript
describe('ServiceName', () => {
  describe('methodName', () => {
    describe('Success Scenarios', () => {
      it('should handle X correctly', () => {});
    });

    describe('Error Scenarios', () => {
      it('should throw X error when Y', () => {});
    });

    describe('Edge Cases', () => {
      it('should handle Z edge case', () => {});
    });

    describe('Security', () => {
      it('should prevent unauthorized access', () => {});
    });
  });
});
```

### 2. **Test Data Management**
- Use factories for test data generation
- Separate constants for reusable test data
- Clear, descriptive test data names

### 3. **Assertion Strategies**
- Test both happy and unhappy paths
- Verify side effects (database updates, notifications)
- Check error messages and types
- Validate all response fields

### 4. **Mock Strategies**
- Mock external dependencies (Paystack, file storage)
- Verify mock interactions
- Test error scenarios by mocking failures
- Clear mocks between tests

### 5. **Coverage Targets**
- **Statements**: 80%+
- **Branches**: 75%+
- **Functions**: 85%+
- **Lines**: 80%+

### 6. **Integration Points to Test**
- Repository interactions
- External API calls (Paystack)
- File upload service
- Event emission/handling
- Transaction management

### 7. **Performance Testing**
- Query optimization (N+1 prevention)
- Pagination limits
- Large dataset handling
- Concurrent operations

### 8. **Security Testing**
- Authorization checks
- Input validation
- SQL injection prevention
- XSS prevention
- Rate limiting (if applicable)

---

## Test Execution Commands

```bash
# Run all business service tests
npm run test:business

# Run with coverage
npm run test:business:cov

# Run specific service tests
npm test -- business-profile.service.spec.ts
npm test -- booking.service.spec.ts
npm test -- business-review.service.spec.ts
npm test -- payment.service.spec.ts
npm test -- business-search.service.spec.ts

# Watch mode
npm run test:business:watch
```

---

## Priority Test Implementation Order

1. **🔴 Critical (P0)** - Business Logic & Security
   - Payment verification
   - Booking creation with bank account check
   - Authorization checks across all services
   - Review creation and rating calculation

2. **🟡 High (P1)** - Core Functionality
   - CRUD operations for all services
   - Pagination and filtering
   - Status transitions
   - Search functionality

3. **🟢 Medium (P2)** - Edge Cases & Validation
   - Input validation
   - Error handling
   - Concurrent operations
   - Date/time handling

4. **🔵 Low (P3)** - Nice to Have
   - Performance tests
   - Load testing
   - Stress testing
   - UI integration tests

---

## Metrics to Track

1. **Test Coverage**
   - Line coverage per service
   - Branch coverage per service
   - Uncovered critical paths

2. **Test Quality**
   - Number of assertions per test
   - Test execution time
   - Flaky test count
   - Test maintainability score

3. **Bug Detection**
   - Bugs found in testing vs production
   - Regression bug count
   - Critical bugs prevented

4. **Test Maintenance**
   - Time to fix broken tests
   - Test code duplication
   - Mock complexity

---

## Next Steps

1. ✅ Review existing business-profile tests
2. ⏳ Implement comprehensive booking service tests
3. ⏳ Implement comprehensive review service tests
4. ⏳ Implement payment service tests with Paystack mocking
5. ⏳ Implement search service tests
6. ⏳ Run full test suite and generate coverage report
7. ⏳ Address any gaps in coverage
8. ⏳ Document any integration test requirements

---

**Document Created**: December 9, 2025
**QA Lead**: Claude (AI QA Tester)
**Status**: In Progress
**Last Updated**: December 9, 2025
