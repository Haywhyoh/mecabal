#!/bin/bash

# Script to verify estate search endpoint is working correctly
# This should be run after the backend container is running

set -e

API_BASE_URL="${API_BASE_URL:-http://localhost:3000}"
AUTH_SERVICE_URL="${AUTH_SERVICE_URL:-http://localhost:3001}"

echo "🧪 Testing Estate Search Endpoint"
echo "=================================="
echo ""

# Test 1: Basic search with query
echo "Test 1: Basic estate search with query parameter"
echo "GET ${AUTH_SERVICE_URL}/auth/location/estates?query=test&limit=10"
RESPONSE1=$(curl -s -w "\nHTTP_CODE:%{http_code}" "${AUTH_SERVICE_URL}/auth/location/estates?query=test&limit=10" || echo "HTTP_CODE:000")
HTTP_CODE1=$(echo "$RESPONSE1" | grep "HTTP_CODE" | cut -d: -f2)
BODY1=$(echo "$RESPONSE1" | sed '/HTTP_CODE/d')

if [ "$HTTP_CODE1" = "200" ]; then
    echo "✅ Test 1 PASSED - Status: $HTTP_CODE1"
    echo "Response preview:"
    echo "$BODY1" | head -c 200
    echo "..."
    echo ""
else
    echo "❌ Test 1 FAILED - Status: $HTTP_CODE1"
    echo "Response: $BODY1"
    echo ""
fi

# Test 2: Search with stateId
echo "Test 2: Estate search with stateId (if available)"
echo "GET ${AUTH_SERVICE_URL}/auth/location/estates?limit=5"
RESPONSE2=$(curl -s -w "\nHTTP_CODE:%{http_code}" "${AUTH_SERVICE_URL}/auth/location/estates?limit=5" || echo "HTTP_CODE:000")
HTTP_CODE2=$(echo "$RESPONSE2" | grep "HTTP_CODE" | cut -d: -f2)
BODY2=$(echo "$RESPONSE2" | sed '/HTTP_CODE/d')

if [ "$HTTP_CODE2" = "200" ]; then
    echo "✅ Test 2 PASSED - Status: $HTTP_CODE2"
    echo "Response preview:"
    echo "$BODY2" | head -c 200
    echo "..."
    echo ""
else
    echo "❌ Test 2 FAILED - Status: $HTTP_CODE2"
    echo "Response: $BODY2"
    echo ""
fi

# Test 3: Invalid limit (should return 400)
echo "Test 3: Invalid limit parameter (should return 400)"
echo "GET ${AUTH_SERVICE_URL}/auth/location/estates?limit=200"
RESPONSE3=$(curl -s -w "\nHTTP_CODE:%{http_code}" "${AUTH_SERVICE_URL}/auth/location/estates?limit=200" || echo "HTTP_CODE:000")
HTTP_CODE3=$(echo "$RESPONSE3" | grep "HTTP_CODE" | cut -d: -f2)
BODY3=$(echo "$RESPONSE3" | sed '/HTTP_CODE/d')

if [ "$HTTP_CODE3" = "400" ]; then
    echo "✅ Test 3 PASSED - Status: $HTTP_CODE3 (correctly rejected invalid limit)"
    echo ""
else
    echo "⚠️  Test 3 - Status: $HTTP_CODE3 (expected 400 for invalid limit)"
    echo "Response: $BODY3"
    echo ""
fi

# Test 4: Check for "Method not implemented" error
echo "Test 4: Checking for 'Method not implemented' error"
if echo "$BODY1" | grep -qi "method not implemented"; then
    echo "❌ Test 4 FAILED - Still getting 'Method not implemented' error"
    echo "The endpoint is not properly implemented in production"
    echo ""
else
    echo "✅ Test 4 PASSED - No 'Method not implemented' error found"
    echo ""
fi

# Summary
echo "=================================="
echo "Test Summary:"
echo "  Test 1 (Basic search): $([ "$HTTP_CODE1" = "200" ] && echo "✅ PASSED" || echo "❌ FAILED")"
echo "  Test 2 (List estates): $([ "$HTTP_CODE2" = "200" ] && echo "✅ PASSED" || echo "❌ FAILED")"
echo "  Test 3 (Invalid limit): $([ "$HTTP_CODE3" = "400" ] && echo "✅ PASSED" || echo "⚠️  UNEXPECTED")"
echo "  Test 4 (No 'not implemented'): $([ -z "$(echo "$BODY1" | grep -i "method not implemented")" ] && echo "✅ PASSED" || echo "❌ FAILED")"
echo ""

if [ "$HTTP_CODE1" = "200" ] && [ -z "$(echo "$BODY1" | grep -i "method not implemented")" ]; then
    echo "✅ Estate search endpoint is working correctly!"
    exit 0
else
    echo "❌ Estate search endpoint has issues. Please check the logs:"
    echo "   docker logs mecabal-backend --tail 100"
    exit 1
fi

