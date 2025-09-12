#!/bin/bash

# SmartSMS Integration Test Script for MeCabal
# This script tests the nigerian-phone-verify edge function with SmartSMS

# Configuration - Update these values
SUPABASE_URL="https://your-project.supabase.co"
SUPABASE_ANON_KEY="your-anon-key-here"
TEST_PHONE="+2348012345678"  # Replace with your test phone number

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

echo -e "${YELLOW}🧪 Testing SmartSMS Integration for MeCabal${NC}"
echo "============================================="
echo ""

# Function to make HTTP requests
make_request() {
    local method=$1
    local endpoint=$2
    local data=$3
    
    curl -s -X "$method" "${SUPABASE_URL}/functions/v1/${endpoint}" \
         -H "Authorization: Bearer ${SUPABASE_ANON_KEY}" \
         -H "Content-Type: application/json" \
         -d "$data"
}

# Test 1: Send OTP
echo -e "${YELLOW}📱 Test 1: Sending OTP to ${TEST_PHONE}${NC}"
echo "Request: Sending OTP for registration..."

SEND_RESPONSE=$(make_request "POST" "nigerian-phone-verify" "{
    \"phone\": \"${TEST_PHONE}\",
    \"purpose\": \"registration\"
}")

echo "Response: $SEND_RESPONSE"
echo ""

# Check if OTP send was successful
if echo "$SEND_RESPONSE" | grep -q '"success":true'; then
    echo -e "${GREEN}✅ OTP Send Test PASSED${NC}"
    
    # Extract carrier info
    CARRIER=$(echo "$SEND_RESPONSE" | grep -o '"carrier":"[^"]*' | cut -d'"' -f4)
    echo "📡 Detected Carrier: $CARRIER"
    
    # Prompt user to enter the OTP they received
    echo ""
    echo -e "${YELLOW}📩 Please check your phone for the OTP message${NC}"
    echo -n "Enter the 4-digit OTP code you received: "
    read OTP_CODE
    
    # Test 2: Verify OTP
    echo ""
    echo -e "${YELLOW}🔐 Test 2: Verifying OTP code${NC}"
    echo "Request: Verifying OTP code..."
    
    VERIFY_RESPONSE=$(make_request "POST" "nigerian-phone-verify" "{
        \"phone\": \"${TEST_PHONE}\",
        \"otp_code\": \"${OTP_CODE}\",
        \"verify\": true,
        \"purpose\": \"registration\"
    }")
    
    echo "Response: $VERIFY_RESPONSE"
    echo ""
    
    # Check if OTP verification was successful
    if echo "$VERIFY_RESPONSE" | grep -q '"success":true'; then
        echo -e "${GREEN}✅ OTP Verification Test PASSED${NC}"
        echo -e "${GREEN}🎉 SmartSMS Integration is working correctly!${NC}"
    else
        echo -e "${RED}❌ OTP Verification Test FAILED${NC}"
        echo "This could be due to:"
        echo "- Incorrect OTP code entered"
        echo "- OTP expired (5 minutes timeout)"
        echo "- Database connection issues"
    fi
    
else
    echo -e "${RED}❌ OTP Send Test FAILED${NC}"
    echo "This could be due to:"
    echo "- Missing SmartSMS environment variables"
    echo "- Invalid SmartSMS API token or template code"
    echo "- Invalid phone number format"
    echo "- Network connectivity issues"
    echo "- SmartSMS account balance or quota issues"
fi

echo ""
echo -e "${YELLOW}🔧 Next Steps:${NC}"
echo "1. If tests failed, check the Supabase edge function logs"
echo "2. Verify your SmartSMS environment variables are set correctly"
echo "3. Check your SmartSMS account balance and template approval"
echo "4. Ensure your phone number is a valid Nigerian mobile number"
echo ""

# Test 3: Error handling test
echo -e "${YELLOW}🚨 Test 3: Testing error handling with invalid phone number${NC}"
ERROR_RESPONSE=$(make_request "POST" "nigerian-phone-verify" "{
    \"phone\": \"+1234567890\",
    \"purpose\": \"registration\"
}")

echo "Response: $ERROR_RESPONSE"
echo ""

if echo "$ERROR_RESPONSE" | grep -q '"error"'; then
    echo -e "${GREEN}✅ Error Handling Test PASSED${NC}"
    echo "Function correctly rejected invalid phone number"
else
    echo -e "${RED}❌ Error Handling Test FAILED${NC}"
    echo "Function should reject non-Nigerian phone numbers"
fi

echo ""
echo -e "${YELLOW}📊 Test Summary Complete${NC}"
echo "============================================="