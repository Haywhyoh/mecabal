# Marketplace API Integration Analysis & Debugging Guide

## Current Status Summary

### ✅ What's Working
1. **API Integration exists** - ListingDetailsScreen calls `listingsService.getListing(listingId)` at line 44
2. **Backend controller exists** - `apps/marketplace-service/src/listings/listings.controller.ts` with full CRUD endpoints
3. **TypeScript interfaces updated** - Recently modified to include all type-specific fields
4. **ListingDetailsScreen updated** - Now has rendering functions for service, job, and property details

### ❌ The Problem
**You're seeing "demo details" which means:**
1. API call is failing silently, OR
2. API is returning data but fields are empty/null, OR
3. API URL is incorrect/unreachable

## Root Cause Analysis

### Issue 1: API URL Configuration
**File:** `Hommie_Mobile/.env`
```bash
EXPO_PUBLIC_API_URL= https://guided-gobbler-outgoing.ngrok-free.app
```

**Problems:**
- ⚠️ Space before URL (` https://...`)
- ⚠️ Ngrok tunnel - may have expired
- ⚠️ Not pointing to specific service port

**Should be:**
```bash
# For local development
EXPO_PUBLIC_API_URL=http://localhost:3000

# Or for ngrok (no space!)
EXPO_PUBLIC_API_URL=https://guided-gobbler-outgoing.ngrok-free.app
```

### Issue 2: API Gateway Not Configured
**Finding:** There's no API Gateway module found at `backend/apps/api-gateway/src/app.module.ts`

The marketplace service controller at port 3005 is NOT proxied through the main gateway (port 3000).

**Current Architecture:**
```
Mobile App → ngrok → ??? → marketplace-service:3005
```

**Should be:**
```
Mobile App → API Gateway:3000 → marketplace-service:3005
```

### Issue 3: API Response Structure Mismatch
**What the frontend expects:** (from `listingsService.ts`)
```typescript
interface Listing {
  id: string;
  userId: string;
  listingType: 'property' | 'item' | 'service' | 'job';
  category: {
    id: number;
    name: string;
    iconUrl?: string;
    colorCode?: string;
  };
  title: string;
  description: string;
  price: number;
  // ... many type-specific fields
  author: {
    id: string;
    firstName: string;
    lastName: string;
    profilePicture?: string;
    isVerified: boolean;
    businessProfile?: { ... };
  };
}
```

**What the backend returns:** Check `ListingResponseDto` in backend

---

## Step-by-Step Debugging Plan

### Step 1: Verify Backend is Running
```bash
cd backend
npm run start:marketplace
```

**Expected Output:**
```
[Nest] Marketplace Service is running on port 3005
```

### Step 2: Test API Directly
```bash
# Get auth token first (if needed)
curl http://localhost:3005/listings

# Or without auth guard (if disabled for testing)
curl http://localhost:3005/listings \
  -H "Authorization: Bearer YOUR_TOKEN"
```

**Expected Response:**
```json
{
  "data": [],
  "total": 0,
  "page": 1,
  "limit": 20,
  "totalPages": 0,
  "hasNext": false,
  "hasPrev": false
}
```

### Step 3: Check Mobile App Console
**In the app, open a listing and check console logs:**

```typescript
// Look for these logs in ListingDetailsScreen.tsx:
console.log('🔧 ListingsService: Getting auth headers...');
console.error('Error fetching listing:', error);
```

**If you see:**
- `No token` → Authentication issue
- `Failed to fetch listing` → Network/API issue
- `Listing not found` → Wrong listing ID or database empty

### Step 4: Verify Database Has Listings
```bash
cd backend
npm run start:dev

# Then in PostgreSQL
psql -d mecabal -c "SELECT id, title, listing_type, status FROM listings LIMIT 5;"
```

**Expected Output:**
Should show actual listings with IDs

### Step 5: Check Network Request
**In Expo Dev Tools:**
1. Open Network tab
2. Click on a listing
3. Look for request to `/listings/{id}`
4. Check:
   - Request URL
   - Response status (200, 404, 401?)
   - Response body

---

## Quick Fixes

### Fix 1: Correct .env File
```bash
cd Hommie_Mobile
```

**Edit `.env`:**
```bash
# Remove space before URL!
EXPO_PUBLIC_API_URL=http://localhost:3000

# Or use ngrok without space
EXPO_PUBLIC_API_URL=https://your-ngrok-url.ngrok-free.app
```

**Then restart Expo:**
```bash
npm start -- --clear
```

### Fix 2: Add Debugging to ListingDetailsScreen
```typescript
// In fetchListing function (around line 41)
const fetchListing = useCallback(async () => {
  try {
    setLoading(true);
    console.log('🔍 Fetching listing:', listingId);
    console.log('🔍 API URL:', ENV.API.BASE_URL);

    const data = await listingsService.getListing(listingId);

    console.log('✅ Listing fetched:', data);
    console.log('📋 Listing type:', data.listingType);
    console.log('👤 Author:', data.author);

    setListing(data);
    setIsSaved(data.isSaved);

    // Increment view count
    await listingsService.incrementView(listingId);
  } catch (error) {
    console.error('❌ Error fetching listing:', error);
    console.error('❌ Error details:', JSON.stringify(error, null, 2));
    Alert.alert('Error', 'Failed to load listing details');
    navigation.goBack();
  } finally {
    setLoading(false);
  }
}, [listingId]);
```

### Fix 3: Test with Mock Listing ID
**In MarketplaceScreen.tsx**, when navigating:
```typescript
// Find line where navigation happens (around line 133)
onPress={() => {
  console.log('📍 Navigating to listing:', item.id);
  navigation?.navigate('ListingDetail', { listingId: item.id })
}}
```

---

## Backend Configuration Checklist

### Check 1: Marketplace Service Running
**File:** `backend/apps/marketplace-service/src/main.ts`

Should have:
```typescript
async function bootstrap() {
  const app = await NestFactory.create(AppModule);
  app.enableCors();
  await app.listen(3005);
  console.log('Marketplace Service running on port 3005');
}
bootstrap();
```

### Check 2: Auth Guard Configuration
**File:** `backend/apps/marketplace-service/src/guards/marketplace-auth.guard.ts`

**Option A: Temporarily Disable for Testing**
```typescript
@Injectable()
export class MarketplaceAuthGuard implements CanActivate {
  canActivate(context: ExecutionContext): boolean {
    // TODO: Remove this bypass
    return true; // TEMPORARY: Allow all requests

    // Real implementation:
    // const request = context.switchToHttp().getRequest();
    // return !!request.user;
  }
}
```

### Check 3: Database Has Sample Data
```bash
cd backend
npm run db:seed
```

Or create test listing manually:
```bash
psql -d mecabal
```

```sql
INSERT INTO listings (
  id, user_id, neighborhood_id, listing_type, category_id,
  title, description, price, currency, price_type,
  latitude, longitude, address, status
) VALUES (
  'test-listing-001',
  'user-001',
  'neighborhood-001',
  'item',
  5,
  'iPhone 12 Pro Max 256GB',
  'Gently used iPhone 12 Pro Max in excellent condition',
  450000,
  'NGN',
  'negotiable',
  6.5244,
  3.3792,
  'Victoria Island, Lagos',
  'active'
);
```

---

## Expected Frontend Behavior

### When API Works Correctly:

1. **Loading State:**
   - Shows ActivityIndicator
   - Shows "Loading..." text

2. **Success State:**
   - Image gallery displays
   - Price and title show
   - Category, location, and basic details render
   - Type-specific sections appear (if data exists):
     * Service details (availability, credentials)
     * Job details (salary, skills, company info)
     * Property details (amenities, utilities, security)
   - Seller information displays
   - Contact button appears

3. **Error State:**
   - Shows error icon
   - Shows "Listing not found" message
   - Navigates back

### Current Behavior (Your Issue):
- Shows "demo details" → **Likely falling back to mock data or empty response**

---

## Testing Checklist

### ✅ Frontend Checks
- [ ] .env file has correct API URL (no leading space)
- [ ] Expo dev server restarted after .env change
- [ ] Console shows API request being made
- [ ] Console shows response data
- [ ] Network tab shows 200 response
- [ ] Token is being sent in Authorization header

### ✅ Backend Checks
- [ ] Marketplace service is running on port 3005
- [ ] Database has at least one listing
- [ ] Auth guard allows requests (or is bypassed for testing)
- [ ] Controller methods are not throwing errors
- [ ] DTOs are properly transforming data
- [ ] Relations (category, user, media) are being loaded

### ✅ Data Flow Checks
- [ ] Mobile app can reach backend URL
- [ ] Listing ID passed to API matches database ID
- [ ] API response includes all required fields
- [ ] Frontend TypeScript interfaces match backend DTOs
- [ ] Media URLs are accessible

---

## Common Issues & Solutions

### Issue: "Network request failed"
**Cause:** Mobile app can't reach backend

**Solutions:**
1. Use ngrok tunnel for testing
2. Or use your computer's local IP (not localhost)
   ```bash
   # Find your IP
   ipconfig  # Windows
   ifconfig  # Mac/Linux

   # Then in .env
   EXPO_PUBLIC_API_URL=http://192.168.1.100:3000
   ```

### Issue: "401 Unauthorized"
**Cause:** Missing or invalid auth token

**Solutions:**
1. Check `MeCabalAuth.getAuthToken()` returns valid token
2. Temporarily disable auth guard for testing
3. Ensure token is not expired

### Issue: "404 Not Found"
**Cause:** Listing doesn't exist in database

**Solutions:**
1. Verify listing ID is correct
2. Check database has the listing
3. Ensure status is 'active'

### Issue: Data loads but type-specific fields missing
**Cause:** Backend not returning all fields OR frontend rendering not working

**Solutions:**
1. Check ListingResponseDto includes all fields
2. Verify database columns have data
3. Check `renderServiceDetails()`, `renderJobDetails()` conditions

---

## Next Steps (Priority Order)

### 1. IMMEDIATE (5 minutes)
```bash
# Fix .env file
cd Hommie_Mobile
# Edit .env - remove space before URL
# Restart
npm start -- --clear
```

### 2. VERIFY API (10 minutes)
```bash
# Test backend directly
cd backend
npm run start:marketplace

# In another terminal
curl http://localhost:3005/listings
```

### 3. ADD LOGGING (5 minutes)
Add console.logs to `fetchListing` function as shown in Fix 2 above

### 4. TEST & DEBUG (15 minutes)
- Open app
- Click on listing
- Watch console
- Check Network tab
- Verify response data

### 5. REPORT FINDINGS
Based on console output, you'll know exactly what's wrong:
- API not reachable → Fix network/URL
- 401 error → Fix authentication
- 404 error → Add sample data
- Empty fields → Check backend response
- Data renders → Success! ✅

---

## Contact for Support

If still seeing issues after these steps, provide:

1. **Console logs** from mobile app
2. **Backend logs** from marketplace service
3. **Network request/response** from browser dev tools
4. **Database query result:** `SELECT * FROM listings LIMIT 1;`
5. **Environment config:** Value of `EXPO_PUBLIC_API_URL`

This will help diagnose the exact issue quickly.
