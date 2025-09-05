#!/bin/bash

# MeCabal Supabase Deployment Script
# Deploys database migrations and Edge Functions

set -e  # Exit on error

PROJECT_REF="jjmuogczhcunpehsocly"
SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
PROJECT_ROOT="$(dirname "$SCRIPT_DIR")"

echo "🚀 Starting MeCabal Supabase Deployment"
echo "Project Reference: $PROJECT_REF"
echo "Script Directory: $SCRIPT_DIR"
echo ""

# Check if Supabase CLI is installed
if ! command -v supabase &> /dev/null; then
    echo "❌ Supabase CLI is not installed. Installing..."
    npm install -g supabase
fi

# Check if user is logged in
if ! supabase projects list &> /dev/null; then
    echo "❌ Not logged in to Supabase. Please run 'supabase login' first."
    exit 1
fi

echo "✅ Supabase CLI is ready"

# Link to project if not already linked
if [ ! -f "./.supabase/config.toml" ]; then
    echo "🔗 Linking to Supabase project..."
    cd "$SCRIPT_DIR"
    supabase link --project-ref "$PROJECT_REF"
    echo "✅ Project linked successfully"
else
    echo "✅ Project already linked"
fi

# Deploy database migrations
echo ""
echo "📊 Deploying database migrations..."

# Check if migration file exists
MIGRATION_FILE="$SCRIPT_DIR/database/migrations/20240905_create_email_otps_table.sql"
if [ -f "$MIGRATION_FILE" ]; then
    echo "📄 Found migration file: 20240905_create_email_otps_table.sql"
    
    # Apply migration via SQL (since we don't have a proper Supabase project structure)
    echo "🔄 Applying database migration..."
    echo "⚠️  Please manually run the following SQL in your Supabase dashboard:"
    echo "    1. Go to https://supabase.com/dashboard/project/$PROJECT_REF"
    echo "    2. Navigate to Database > SQL Editor"
    echo "    3. Copy and paste the content from: $MIGRATION_FILE"
    echo "    4. Run the query"
    echo ""
    echo "📋 Migration SQL file location: $MIGRATION_FILE"
    echo ""
    read -p "Press Enter after you've applied the migration manually, or 'q' to quit: " -n 1 -r
    if [[ $REPLY =~ ^[Qq]$ ]]; then
        echo ""
        echo "❌ Deployment cancelled by user"
        exit 1
    fi
    echo ""
    echo "✅ Database migration applied (manual step completed)"
else
    echo "❌ Migration file not found: $MIGRATION_FILE"
    exit 1
fi

# Deploy Edge Functions
echo ""
echo "⚡ Deploying Edge Functions..."

# Deploy email-otp-verify function
EDGE_FUNCTION_DIR="$SCRIPT_DIR/edge-functions/email-otp-verify"
if [ -d "$EDGE_FUNCTION_DIR" ]; then
    echo "📄 Found Edge Function: email-otp-verify"
    cd "$SCRIPT_DIR"
    
    echo "🔄 Deploying email-otp-verify function..."
    supabase functions deploy email-otp-verify --project-ref "$PROJECT_REF"
    
    if [ $? -eq 0 ]; then
        echo "✅ email-otp-verify function deployed successfully"
    else
        echo "❌ Failed to deploy email-otp-verify function"
        exit 1
    fi
else
    echo "❌ Edge Function directory not found: $EDGE_FUNCTION_DIR"
    exit 1
fi

# Check environment variables
echo ""
echo "🔧 Checking environment variables..."

echo "📋 Required environment variables for Edge Functions:"
echo "   1. BREVO_API_KEY - Your Brevo API key for sending emails"
echo "   2. SUPABASE_URL - Your Supabase project URL (should be set automatically)"
echo "   3. SUPABASE_SERVICE_ROLE_KEY - Service role key (should be set automatically)"
echo ""
echo "⚠️  Please ensure BREVO_API_KEY is set in your Supabase project:"
echo "   1. Go to https://supabase.com/dashboard/project/$PROJECT_REF/settings/edge-functions"
echo "   2. Scroll to 'Environment Variables' section"
echo "   3. Add BREVO_API_KEY with your Brevo API key"
echo "   4. Get your API key from: https://app.brevo.com/settings/keys/api"
echo ""

# Test deployment
echo "🧪 Testing deployment..."
echo "You can test the Edge Function with:"
echo "curl -X POST 'https://$PROJECT_REF.supabase.co/functions/v1/email-otp-verify' \\"
echo "  -H 'Authorization: Bearer YOUR_ANON_KEY' \\"
echo "  -H 'Content-Type: application/json' \\"
echo "  -d '{\"email\": \"test@example.com\", \"purpose\": \"registration\"}'"
echo ""

echo "🎉 Deployment completed successfully!"
echo ""
echo "📝 Next steps:"
echo "   1. Set BREVO_API_KEY in Supabase Dashboard"
echo "   2. Test email registration from your mobile app"
echo "   3. Monitor Edge Function logs: supabase functions logs email-otp-verify"
echo "   4. Check email delivery in your Brevo dashboard"
echo ""
echo "🔗 Useful links:"
echo "   - Supabase Dashboard: https://supabase.com/dashboard/project/$PROJECT_REF"
echo "   - Edge Functions: https://supabase.com/dashboard/project/$PROJECT_REF/functions"
echo "   - Database: https://supabase.com/dashboard/project/$PROJECT_REF/editor"
echo "   - Brevo Dashboard: https://app.brevo.com/"