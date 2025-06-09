#!/bin/bash

# Production Environment Setup Script for Hetzner Server
# This script helps configure environment variables for the Invoice Reconciler deployment

set -e

echo "🚀 Setting up production environment for Invoice Reconciler"
echo "============================================================"

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

# Check if running as root
if [[ $EUID -eq 0 ]]; then
   echo -e "${RED}This script should not be run as root${NC}"
   exit 1
fi

# Create .env file from template
if [ ! -f ".env" ]; then
    echo -e "${YELLOW}Creating .env file from template...${NC}"
    cp .env.production .env
    echo -e "${GREEN}✅ Created .env file${NC}"
else
    echo -e "${YELLOW}⚠️  .env file already exists, backing up to .env.backup${NC}"
    cp .env .env.backup
fi

echo ""
echo "📋 You need to configure the following environment variables:"
echo "============================================================"

# Function to prompt for environment variable
prompt_env_var() {
    local var_name=$1
    local description=$2
    local current_value=$(grep "^$var_name=" .env | cut -d'=' -f2-)
    
    echo ""
    echo -e "${YELLOW}$var_name${NC}"
    echo "Description: $description"
    echo "Current value: $current_value"
    
    if [[ $current_value == REPLACE_WITH_* ]]; then
        echo -e "${RED}❌ REQUIRED: This value must be updated${NC}"
        read -p "Enter new value: " new_value
        if [ ! -z "$new_value" ]; then
            # Escape special characters for sed
            escaped_value=$(printf '%s\n' "$new_value" | sed 's/[[\.*^$()+?{|]/\\&/g')
            sed -i "s|^$var_name=.*|$var_name=$escaped_value|" .env
            echo -e "${GREEN}✅ Updated $var_name${NC}"
        fi
    else
        echo -e "${GREEN}✅ Already configured${NC}"
    fi
}

# Required environment variables
echo -e "${YELLOW}🔑 REQUIRED VARIABLES${NC}"
echo "These must be configured for the application to work:"

prompt_env_var "PRIVATE_SUPABASE_SERVICE_KEY" "Get from Supabase Dashboard -> Project Settings -> API -> service_role key"
prompt_env_var "SUPABASE_SERVICE_ROLE_KEY" "Same as PRIVATE_SUPABASE_SERVICE_KEY (used by Docker Compose)"

echo ""
echo -e "${YELLOW}🔐 GOOGLE OAUTH VARIABLES${NC}"
echo "Required for Google Sign-in functionality:"

prompt_env_var "SUPABASE_AUTH_EXTERNAL_GOOGLE_CLIENT_ID" "Get from Google Cloud Console OAuth 2.0 credentials"
prompt_env_var "SUPABASE_AUTH_EXTERNAL_GOOGLE_SECRET" "Get from Google Cloud Console OAuth 2.0 credentials"

echo ""
echo -e "${YELLOW}📊 OPTIONAL VARIABLES${NC}"
echo "These can be configured later:"

current_gtag=$(grep "^NEXT_PUBLIC_GOOGLE_TAG=" .env | cut -d'=' -f2-)
if [[ $current_gtag == REPLACE_WITH_* ]]; then
    echo ""
    echo "NEXT_PUBLIC_GOOGLE_TAG (Google Analytics)"
    echo "Current value: $current_gtag"
    read -p "Enter Google Analytics tag (or press Enter to skip): " gtag_value
    if [ ! -z "$gtag_value" ]; then
        sed -i "s|^NEXT_PUBLIC_GOOGLE_TAG=.*|NEXT_PUBLIC_GOOGLE_TAG=$gtag_value|" .env
        echo -e "${GREEN}✅ Updated Google Analytics tag${NC}"
    fi
fi

echo ""
echo "🔍 Validating configuration..."
echo "============================="

# Check required variables
errors=0

check_required_var() {
    local var_name=$1
    local value=$(grep "^$var_name=" .env | cut -d'=' -f2-)
    
    if [[ $value == REPLACE_WITH_* ]] || [ -z "$value" ]; then
        echo -e "${RED}❌ $var_name is not configured${NC}"
        ((errors++))
    else
        echo -e "${GREEN}✅ $var_name is configured${NC}"
    fi
}

check_required_var "PRIVATE_SUPABASE_SERVICE_KEY"
check_required_var "SUPABASE_SERVICE_ROLE_KEY"
check_required_var "SUPABASE_AUTH_EXTERNAL_GOOGLE_CLIENT_ID"
check_required_var "SUPABASE_AUTH_EXTERNAL_GOOGLE_SECRET"

echo ""
if [ $errors -eq 0 ]; then
    echo -e "${GREEN}🎉 All required environment variables are configured!${NC}"
    echo ""
    echo "Next steps:"
    echo "1. Start the services: docker-compose up -d"
    echo "2. Check logs: docker-compose logs -f"
    echo "3. Test the application at http://your-server-ip"
    echo ""
    echo -e "${YELLOW}📝 Remember to:${NC}"
    echo "- Update Google OAuth redirect URLs to include your production domain"
    echo "- Configure SSL certificates for HTTPS (recommended)"
    echo "- Set up proper firewall rules"
else
    echo -e "${RED}⚠️  $errors required environment variable(s) still need configuration${NC}"
    echo "Please run this script again after getting the required values."
fi

echo ""
echo -e "${YELLOW}📚 Documentation:${NC}"
echo "- Google OAuth setup: docs/google-oauth-setup.md"
echo "- Supabase configuration: https://app.supabase.com/project/hcyteovnllklmvoptxjr/settings/api"
echo "- Deployment guide: tasks/tasks-python-microservice-deployment.md" 