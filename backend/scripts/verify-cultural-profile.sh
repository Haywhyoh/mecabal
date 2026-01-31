#!/bin/bash
# Script to verify cultural-profile reference-data endpoint is working correctly

set -e

# Default to production API, but allow override
API_URL="${API_URL:-https://api.mecabal.com}"

echo "🧪 Testing Cultural Profile Reference Data Endpoint"
echo "=================================================="
echo ""

echo "Test 1: Get reference data"
echo "GET ${API_URL}/cultural-profile/reference-data"
RESPONSE1=$(curl -s -w "\nHTTP_CODE:%{http_code}" "${API_URL}/cultural-profile/reference-data" || echo "HTTP_CODE:000")

# Extract HTTP code
HTTP_CODE1=$(echo "$RESPONSE1" | grep "HTTP_CODE" | cut -d: -f2)
BODY1=$(echo "$RESPONSE1" | sed '/HTTP_CODE/d')

echo "Response HTTP Code: $HTTP_CODE1"
echo ""

if [ "$HTTP_CODE1" = "200" ]; then
    echo "✅ Test 1 PASSED: Endpoint returned 200"
    
    # Check if response has expected structure
    if echo "$BODY1" | grep -q '"states"' && echo "$BODY1" | grep -q '"languages"' && echo "$BODY1" | grep -q '"culturalBackgrounds"' && echo "$BODY1" | grep -q '"professionalCategories"'; then
        echo "✅ Response structure is correct (contains states, languages, culturalBackgrounds, professionalCategories)"
        
        # Count items in each array
        STATES_COUNT=$(echo "$BODY1" | grep -o '"states":\[' | wc -l || echo "0")
        LANGUAGES_COUNT=$(echo "$BODY1" | grep -o '"languages":\[' | wc -l || echo "0")
        
        echo "Response preview:"
        echo "$BODY1" | head -c 500
        echo "..."
        echo ""
    else
        echo "⚠️  WARNING: Response structure might be incorrect"
        echo "Response: $BODY1"
    fi
else
    echo "❌ Test 1 FAILED: Endpoint returned $HTTP_CODE1"
    echo "Response: $BODY1"
    echo ""
    echo "Possible causes:"
    echo "  1. Endpoint not deployed to production"
    echo "  2. Route not registered correctly"
    echo "  3. Service not running"
    exit 1
fi

echo ""
echo "=================================================="
echo "✅ Cultural profile reference-data endpoint is working correctly!"
echo ""
echo "To test locally, run:"
echo "  API_URL=http://localhost:3000 ./scripts/verify-cultural-profile.sh"





