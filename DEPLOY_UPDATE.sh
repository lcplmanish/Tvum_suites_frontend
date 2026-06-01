#!/bin/bash

# Contabo Deployment Script - Zero Downtime Update
# Usage: bash DEPLOY_UPDATE.sh

set -e

echo "🚀 Starting Tvum Suites Deployment..."
echo "=================================="

# Colors for output
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
RED='\033[0;31m'
NC='\033[0m' # No Color

# Configuration
PROJECT_PATH="/var/www/tvum-suites-frontend"
BACKUP_PATH="/var/www/tvum-suites-backup-$(date +%Y%m%d-%H%M%S)"
PM2_BACKEND_NAME="tvum-server"
PM2_FRONTEND_NAME="tvum-frontend"

echo -e "${YELLOW}1. Creating backup of current version...${NC}"
cp -r $PROJECT_PATH $BACKUP_PATH
echo -e "${GREEN}✓ Backup created at: $BACKUP_PATH${NC}"

echo -e "${YELLOW}2. Pulling latest code from Git...${NC}"
cd $PROJECT_PATH
git pull origin main
echo -e "${GREEN}✓ Code updated${NC}"

echo -e "${YELLOW}3. Installing dependencies...${NC}"
npm install
echo -e "${GREEN}✓ Dependencies installed${NC}"

echo -e "${YELLOW}4. Building frontend...${NC}"
npm run build
echo -e "${GREEN}✓ Frontend built successfully${NC}"

echo -e "${YELLOW}5. Restarting services with zero downtime...${NC}"

# Restart backend (API server)
pm2 restart $PM2_BACKEND_NAME
echo -e "${GREEN}✓ Backend restarted${NC}"

# Reload Nginx (graceful reload - no downtime)
systemctl reload nginx
echo -e "${GREEN}✓ Nginx reloaded${NC}"

echo -e "${YELLOW}6. Verifying deployment...${NC}"
sleep 2

# Check if services are running
pm2_status=$(pm2 status | grep $PM2_BACKEND_NAME | grep online)
if [ ! -z "$pm2_status" ]; then
    echo -e "${GREEN}✓ Backend service is running${NC}"
else
    echo -e "${RED}✗ Backend service failed to start!${NC}"
    echo "Rolling back..."
    rm -rf $PROJECT_PATH
    mv $BACKUP_PATH $PROJECT_PATH
    cd $PROJECT_PATH
    npm install
    pm2 restart $PM2_BACKEND_NAME
    systemctl restart nginx
    exit 1
fi

echo ""
echo -e "${GREEN}=================================="
echo "✅ Deployment completed successfully!"
echo "==================================${NC}"
echo ""
echo "📋 Service Status:"
pm2 status
echo ""
echo "📝 Server Logs:"
pm2 logs $PM2_BACKEND_NAME --lines 5
echo ""
echo -e "${YELLOW}Rollback command (if needed):${NC}"
echo "rm -rf $PROJECT_PATH && mv $BACKUP_PATH $PROJECT_PATH && cd $PROJECT_PATH && npm install && pm2 restart $PM2_BACKEND_NAME"
