# Asset Management System - Production Deployment Guide

**Version:** 2.0.0 Enterprise Edition  
**Target:** Production Environment  
**Last Updated:** October 11, 2026

---

## 🎯 Pre-Deployment Checklist

### ✅ Infrastructure Requirements

**Minimum Server Specifications:**
- CPU: 2 cores
- RAM: 4 GB
- Storage: 20 GB SSD
- OS: Ubuntu 20.04 LTS / Windows Server 2019+ / RHEL 8+

**Recommended Server Specifications:**
- CPU: 4+ cores
- RAM: 8 GB+
- Storage: 50 GB+ SSD
- OS: Ubuntu 22.04 LTS

**Required Software:**
- Node.js 18.x or 20.x LTS
- PostgreSQL 14+ (or keep SQLite for small deployments)
- Nginx (reverse proxy)
- PM2 (process manager)
- SSL Certificate (Let's Encrypt)

---

## 🗄️ Database Migration (SQLite to PostgreSQL)

### Step 1: Install PostgreSQL

```bash
# Ubuntu/Debian
sudo apt update
sudo apt install postgresql postgresql-contrib

# Start PostgreSQL
sudo systemctl start postgresql
sudo systemctl enable postgresql
```

### Step 2: Create Database and User

```sql
-- Connect to PostgreSQL
sudo -u postgres psql

-- Create database
CREATE DATABASE asset_management;

-- Create user
CREATE USER assetadmin WITH ENCRYPTED PASSWORD 'YourStrongPassword123!';

-- Grant privileges
GRANT ALL PRIVILEGES ON DATABASE asset_management TO assetadmin;

-- Exit
\q
```

### Step 3: Update Prisma Schema

```prisma
// prisma/schema.prisma
datasource db {
  provider = "postgresql"
  url      = env("DATABASE_URL")
}
```

### Step 4: Update Environment Variables

```bash
# .env.production
DATABASE_URL="postgresql://assetadmin:YourStrongPassword123!@localhost:5432/asset_management?schema=public"
```

### Step 5: Run Migrations

```bash
cd default-app
npx prisma migrate deploy
npx prisma generate
npx prisma db seed
```

---

## 🔐 Security Hardening

### 1. Environment Variables

Create `.env.production`:

```bash
# Database
DATABASE_URL="postgresql://assetadmin:YourStrongPassword@localhost:5432/asset_management"

# Authentication
NEXTAUTH_URL="https://yourdomain.com"
NEXTAUTH_SECRET="your-super-secure-random-secret-min-32-chars"

# Application
NODE_ENV="production"
NEXT_PUBLIC_API_URL="https://yourdomain.com"

# Security
SESSION_TIMEOUT="3600"
MAX_LOGIN_ATTEMPTS="5"
ACCOUNT_LOCK_DURATION="1800"

# Logging
LOG_LEVEL="info"
ENABLE_AUDIT_LOG="true"

# Rate Limiting
RATE_LIMIT_WINDOW="60000"
RATE_LIMIT_MAX_REQUESTS="100"

# File Upload
MAX_UPLOAD_SIZE="10485760"
ALLOWED_FILE_TYPES="pdf,jpg,jpeg,png,xlsx,csv"
```

### 2. Generate Secure Secrets

```bash
# Generate NEXTAUTH_SECRET
node -e "console.log(require('crypto').randomBytes(32).toString('hex'))"

# Or use openssl
openssl rand -base64 32
```

### 3. Database Security

```sql
-- Restrict database user permissions
REVOKE ALL ON SCHEMA public FROM PUBLIC;
GRANT USAGE ON SCHEMA public TO assetadmin;
GRANT CREATE ON SCHEMA public TO assetadmin;

-- Enable SSL connections (recommended)
ALTER DATABASE asset_management SET ssl = on;
```

### 4. Firewall Configuration

```bash
# Ubuntu UFW
sudo ufw allow 22/tcp    # SSH
sudo ufw allow 80/tcp    # HTTP
sudo ufw allow 443/tcp   # HTTPS
sudo ufw enable

# PostgreSQL - only localhost
# (No need to open 5432 externally)
```

---

## 🚀 Deployment Steps

### Step 1: Prepare Server

```bash
# Update system
sudo apt update && sudo apt upgrade -y

# Install Node.js 20 LTS
curl -fsSL https://deb.nodesource.com/setup_20.x | sudo -E bash -
sudo apt install -y nodejs

# Install PM2
sudo npm install -g pm2

# Install Nginx
sudo apt install -y nginx
```

### Step 2: Deploy Application

```bash
# Create application directory
sudo mkdir -p /var/www/asset-management
sudo chown $USER:$USER /var/www/asset-management

# Clone or copy application
cd /var/www/asset-management
# (upload your files here)

# Install dependencies
cd default-app
npm ci --production

# Build Next.js
npm run build

# Setup Prisma
npx prisma generate
npx prisma migrate deploy
```

### Step 3: Configure PM2

Create `ecosystem.config.js`:

```javascript
module.exports = {
  apps: [{
    name: 'asset-management',
    cwd: '/var/www/asset-management/default-app',
    script: 'node_modules/next/dist/bin/next',
    args: 'start -p 3000',
    instances: 2,
    exec_mode: 'cluster',
    env: {
      NODE_ENV: 'production',
    },
    error_file: '/var/log/asset-management/error.log',
    out_file: '/var/log/asset-management/out.log',
    log_date_format: 'YYYY-MM-DD HH:mm:ss Z',
    merge_logs: true,
    autorestart: true,
    watch: false,
    max_memory_restart: '1G',
  }]
};
```

Start application:

```bash
# Create log directory
sudo mkdir -p /var/log/asset-management
sudo chown $USER:$USER /var/log/asset-management

# Start with PM2
pm2 start ecosystem.config.js

# Save PM2 configuration
pm2 save

# Setup PM2 to start on boot
pm2 startup
# Run the command it outputs
```

### Step 4: Configure Nginx

Create `/etc/nginx/sites-available/asset-management`:

```nginx
# HTTP - Redirect to HTTPS
server {
    listen 80;
    listen [::]:80;
    server_name yourdomain.com www.yourdomain.com;

    return 301 https://$server_name$request_uri;
}

# HTTPS
server {
    listen 443 ssl http2;
    listen [::]:443 ssl http2;
    server_name yourdomain.com www.yourdomain.com;

    # SSL Configuration
    ssl_certificate /etc/letsencrypt/live/yourdomain.com/fullchain.pem;
    ssl_certificate_key /etc/letsencrypt/live/yourdomain.com/privkey.pem;
    ssl_protocols TLSv1.2 TLSv1.3;
    ssl_ciphers HIGH:!aNULL:!MD5;
    ssl_prefer_server_ciphers on;

    # Security Headers
    add_header X-Frame-Options "SAMEORIGIN" always;
    add_header X-Content-Type-Options "nosniff" always;
    add_header X-XSS-Protection "1; mode=block" always;
    add_header Referrer-Policy "no-referrer-when-downgrade" always;
    add_header Content-Security-Policy "default-src 'self' http: https: data: blob: 'unsafe-inline'" always;

    # Logging
    access_log /var/log/nginx/asset-management.access.log;
    error_log /var/log/nginx/asset-management.error.log;

    # Client upload size
    client_max_body_size 10M;

    # Proxy to Next.js
    location / {
        proxy_pass http://localhost:3000;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
        proxy_cache_bypass $http_upgrade;
        
        # Timeouts
        proxy_connect_timeout 60s;
        proxy_send_timeout 60s;
        proxy_read_timeout 60s;
    }

    # Static files caching
    location /_next/static {
        proxy_pass http://localhost:3000;
        add_header Cache-Control "public, max-age=31536000, immutable";
    }

    # API routes
    location /api {
        proxy_pass http://localhost:3000;
        proxy_http_version 1.1;
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        
        # No caching for API
        add_header Cache-Control "no-store, no-cache, must-revalidate, proxy-revalidate, max-age=0";
    }
}
```

Enable site:

```bash
# Test Nginx configuration
sudo nginx -t

# Enable site
sudo ln -s /etc/nginx/sites-available/asset-management /etc/nginx/sites-enabled/

# Restart Nginx
sudo systemctl restart nginx
```

### Step 5: Setup SSL with Let's Encrypt

```bash
# Install Certbot
sudo apt install certbot python3-certbot-nginx

# Get certificate
sudo certbot --nginx -d yourdomain.com -d www.yourdomain.com

# Auto-renewal is setup automatically
# Test renewal
sudo certbot renew --dry-run
```

---

## 📊 Monitoring & Maintenance

### PM2 Monitoring

```bash
# View application status
pm2 status

# View logs
pm2 logs asset-management

# Monitor resources
pm2 monit

# Restart application
pm2 restart asset-management

# Reload application (zero-downtime)
pm2 reload asset-management
```

### Database Backups

Create backup script `/opt/scripts/backup-db.sh`:

```bash
#!/bin/bash

# Configuration
BACKUP_DIR="/var/backups/asset-management"
DATE=$(date +%Y-%m-%d_%H-%M-%S)
DB_NAME="asset_management"
DB_USER="assetadmin"
RETENTION_DAYS=30

# Create backup directory
mkdir -p $BACKUP_DIR

# Perform backup
PGPASSWORD="YourStrongPassword123!" pg_dump -U $DB_USER -h localhost $DB_NAME | gzip > $BACKUP_DIR/backup_$DATE.sql.gz

# Remove old backups
find $BACKUP_DIR -name "backup_*.sql.gz" -mtime +$RETENTION_DAYS -delete

# Log
echo "$(date): Database backup completed - backup_$DATE.sql.gz" >> $BACKUP_DIR/backup.log
```

Make executable and schedule:

```bash
# Make executable
chmod +x /opt/scripts/backup-db.sh

# Add to crontab (daily at 2 AM)
crontab -e

# Add this line:
0 2 * * * /opt/scripts/backup-db.sh
```

### Log Rotation

Create `/etc/logrotate.d/asset-management`:

```
/var/log/asset-management/*.log {
    daily
    missingok
    rotate 14
    compress
    delaycompress
    notifempty
    create 0640 www-data adm
    sharedscripts
    postrotate
        pm2 reloadLogs
    endscript
}
```

### Health Check Script

Create `/opt/scripts/health-check.sh`:

```bash
#!/bin/bash

# Check if application is responding
HTTP_CODE=$(curl -s -o /dev/null -w "%{http_code}" http://localhost:3000/api/health)

if [ $HTTP_CODE -ne 200 ]; then
    echo "$(date): Application not responding (HTTP $HTTP_CODE)" >> /var/log/asset-management/health-check.log
    pm2 restart asset-management
fi
```

Schedule every 5 minutes:

```bash
*/5 * * * * /opt/scripts/health-check.sh
```

---

## 🔄 Updates & Rollback

### Deploying Updates

```bash
# 1. Backup database
/opt/scripts/backup-db.sh

# 2. Pull new code
cd /var/www/asset-management
git pull origin main

# 3. Install dependencies
cd default-app
npm ci --production

# 4. Run migrations
npx prisma migrate deploy

# 5. Build application
npm run build

# 6. Reload application (zero-downtime)
pm2 reload asset-management
```

### Rollback Procedure

```bash
# 1. Stop application
pm2 stop asset-management

# 2. Restore previous code version
git checkout <previous-tag>

# 3. Restore database backup
PGPASSWORD="YourPassword" psql -U assetadmin -h localhost asset_management < backup.sql

# 4. Rebuild
cd default-app
npm ci --production
npm run build

# 5. Restart
pm2 start asset-management
```

---

## 📈 Performance Optimization

### Database Optimization

```sql
-- Create indexes
CREATE INDEX CONCURRENTLY idx_items_category ON "Item"(category);
CREATE INDEX CONCURRENTLY idx_items_condition ON "Item"(condition);
CREATE INDEX CONCURRENTLY idx_transactions_date ON "Transaction"(date);
CREATE INDEX CONCURRENTLY idx_audit_timestamp ON "AuditLog"(timestamp);

-- Analyze tables
ANALYZE "Item";
ANALYZE "Transaction";
ANALYZE "User";

-- Setup autovacuum
ALTER DATABASE asset_management SET autovacuum = on;
```

### Application Caching

Consider adding Redis for session storage and caching:

```bash
# Install Redis
sudo apt install redis-server

# Enable and start
sudo systemctl enable redis-server
sudo systemctl start redis-server
```

### Nginx Caching

Add to Nginx configuration:

```nginx
# Cache configuration
proxy_cache_path /var/cache/nginx levels=1:2 keys_zone=asset_cache:10m max_size=1g inactive=60m;

location /_next/static {
    proxy_cache asset_cache;
    proxy_cache_valid 200 1y;
    # ... other proxy settings
}
```

---

## 🔍 Troubleshooting

### Application Won't Start

```bash
# Check logs
pm2 logs asset-management --err

# Check if port is in use
sudo lsof -i :3000

# Check environment variables
pm2 env asset-management
```

### Database Connection Issues

```bash
# Test PostgreSQL connection
psql -U assetadmin -h localhost -d asset_management

# Check PostgreSQL logs
sudo tail -f /var/log/postgresql/postgresql-14-main.log
```

### Nginx Issues

```bash
# Test configuration
sudo nginx -t

# Check logs
sudo tail -f /var/log/nginx/error.log

# Restart Nginx
sudo systemctl restart nginx
```

### High Memory Usage

```bash
# Check PM2 status
pm2 status

# Restart specific instance
pm2 restart asset-management --instance 0

# Adjust max memory restart in ecosystem.config.js
```

---

## 📞 Support & Maintenance

### Regular Maintenance Tasks

**Daily:**
- Monitor application logs
- Check error rates
- Review audit logs

**Weekly:**
- Review database performance
- Check backup integrity
- Monitor disk space

**Monthly:**
- Security updates
- Database optimization
- Review user accounts
- Capacity planning

### Emergency Contacts

- **System Administrator:** admin@abetech.com
- **Database Administrator:** dba@abetech.com
- **Technical Support:** support@abetech.com

---

## 📚 Additional Resources

- [Next.js Deployment](https://nextjs.org/docs/deployment)
- [Prisma Production Best Practices](https://www.prisma.io/docs/guides/performance-and-optimization)
- [PM2 Documentation](https://pm2.keymetrics.io/docs)
- [Nginx Documentation](https://nginx.org/en/docs/)
- [PostgreSQL Documentation](https://www.postgresql.org/docs/)

---

**Deployment completed by:** AbeTech Team  
**Production Ready:** ✅ Yes  
**Last Review:** October 11, 2026
