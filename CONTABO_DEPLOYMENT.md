# Contabo Deployment Guide

## Changes Made
✅ Removed Wrangler/Cloudflare deployment scripts  
✅ Updated `package.json` with `start` and `start:prod` scripts  
✅ Updated `server.js` CORS to dynamically accept your production domain  
✅ Added `.env` variables for Contabo deployment  

## Pre-Deployment Checklist
- [ ] Contabo VPS/Server access (SSH)
- [ ] Node.js v18+ installed
- [ ] NPM or Yarn package manager
- [ ] Your production domain (update `PRODUCTION_DOMAIN` in `.env`)

## Step 1: Connect to Contabo Server
```bash
ssh root@your-contabo-ip
# or if you have a domain pointed:
ssh root@your-contabo-domain.com
```

## Step 2: Install Dependencies
```bash
# Update system
apt update && apt upgrade -y

# Install Node.js (v18+)
curl -fsSL https://deb.nodesource.com/setup_18.x | sudo -E bash -
apt install -y nodejs

# Install PM2 (process manager for Node apps)
npm install -g pm2

# Install Nginx (reverse proxy)
apt install -y nginx

# Install Certbot for SSL certificates
apt install -y certbot python3-certbot-nginx
```

## Step 3: Clone/Upload Your Project
```bash
cd /var/www
git clone <your-repo-url> tvum-suites-frontend
# OR upload via SFTP/SCP
cd tvum-suites-frontend
```

## Step 4: Setup Environment Variables
```bash
# Update .env with your Contabo domain
nano .env
```
Set these values:
```
PRODUCTION_DOMAIN=your-domain.com
NODE_ENV=production
PORT=3001
VITE_SUPABASE_URL=https://api.tvumsuites.in
VITE_SUPABASE_ANON_KEY=<your-key>
SUPABASE_URL=https://api.tvumsuites.in
SUPABASE_SERVICE_ROLE_KEY=<your-key>
```

## Step 5: Install Project Dependencies
```bash
npm install
# Build the frontend (optional for production)
npm run build
```

## Step 6: Start Server with PM2
```bash
# Start the server
pm2 start server.js --name "tvum-server"

# Start frontend dev server (optional)
pm2 start "npm run dev" --name "tvum-frontend"

# Save PM2 processes to auto-restart on reboot
pm2 save
pm2 startup

# View running processes
pm2 status
pm2 logs tvum-server
```

## Step 7: Setup Nginx Reverse Proxy
Create/edit `/etc/nginx/sites-available/tvum-suites`:
```nginx
server {
    listen 80;
    listen [::]:80;
    server_name your-domain.com www.your-domain.com;

    # Redirect to HTTPS
    return 301 https://$server_name$request_uri;
}

server {
    listen 443 ssl http2;
    listen [::]:443 ssl http2;
    server_name your-domain.com www.your-domain.com;

    # SSL certificates (added after Certbot setup)
    ssl_certificate /etc/letsencrypt/live/your-domain.com/fullchain.pem;
    ssl_certificate_key /etc/letsencrypt/live/your-domain.com/privkey.pem;

    # Frontend
    location / {
        proxy_pass http://localhost:5173;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host $host;
        proxy_cache_bypass $http_upgrade;
    }

    # Backend API
    location /api/ {
        proxy_pass http://localhost:3001;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host $host;
        proxy_cache_bypass $http_upgrade;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
    }

    # Health check endpoint
    location /health {
        proxy_pass http://localhost:3001;
        access_log off;
    }
}
```

## Step 8: Enable Nginx Configuration
```bash
# Test configuration
nginx -t

# Enable site
ln -s /etc/nginx/sites-available/tvum-suites /etc/nginx/sites-enabled/

# Restart Nginx
systemctl restart nginx
```

## Step 9: Setup SSL Certificate with Certbot
```bash
certbot certonly --nginx -d your-domain.com -d www.your-domain.com
# Follow prompts to verify domain ownership

# Optional: Auto-renew certificates
certbot renew --dry-run
```

## Step 10: Verify Deployment
```bash
# Check PM2 status
pm2 status

# Check Nginx status
systemctl status nginx

# Test endpoints
curl http://localhost:3001/health
curl http://localhost:5173  # Frontend
curl https://your-domain.com  # Via HTTPS
```

## Monitoring & Maintenance

### View Logs
```bash
# Backend server logs
pm2 logs tvum-server

# Nginx logs
tail -f /var/log/nginx/access.log
tail -f /var/log/nginx/error.log

# System logs
journalctl -u nginx -f
```

### Update Code
```bash
cd /var/www/tvum-suites-frontend
git pull origin main
npm install
pm2 restart tvum-server
```

### Restart Services
```bash
# Restart server
pm2 restart tvum-server

# Restart frontend
pm2 restart tvum-frontend

# Restart Nginx
systemctl restart nginx
```

### View Resource Usage
```bash
pm2 monit
```

## Troubleshooting

### Port Already in Use
```bash
# Find process using port 3001
lsof -i :3001
# Kill process
kill -9 <PID>
```

### SSL Certificate Issues
```bash
# Check certificate expiration
openssl x509 -enddate -noout -in /etc/letsencrypt/live/your-domain.com/fullchain.pem

# Renew immediately
certbot renew --force-renewal
```

### CORS Issues
Make sure your `PRODUCTION_DOMAIN` in `.env` matches your actual domain!

## Auto-Update & Backup

### Automatic Updates Script
Create `/usr/local/bin/update-tvum.sh`:
```bash
#!/bin/bash
cd /var/www/tvum-suites-frontend
git pull origin main
npm install
pm2 restart tvum-server
echo "Updated at $(date)" >> /var/log/tvum-updates.log
```

### Schedule with Cron
```bash
crontab -e
# Add this line to update daily at 2 AM:
0 2 * * * /usr/local/bin/update-tvum.sh
```

## Performance Tips
- Enable gzip in Nginx: `gzip on;`
- Add caching headers for static assets
- Use PM2 cluster mode for multi-core systems: `pm2 start server.js -i max`
- Monitor with `pm2 monit`

---
**Need help?** Check PM2 and Nginx logs for debugging.
