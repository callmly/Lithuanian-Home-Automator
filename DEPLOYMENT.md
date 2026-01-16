# Deployment Guide for namosistemos.lt

This guide covers deploying the KNX Smart Home application to Hostinger VPS using Coolify.

## Prerequisites

- Hostinger VPS with root access
- Domain: namosistemos.lt pointed to your VPS IP
- Coolify installed on your VPS

---

## 1. Environment Variables Required

Create these environment variables in Coolify:

```
DATABASE_URL=postgresql://username:password@host:5432/database_name
SESSION_SECRET=your-secure-random-string-min-32-chars
NODE_ENV=production
```

### Generate SESSION_SECRET

Run this command to generate a secure secret:
```bash
openssl rand -base64 32
```

---

## 2. Database Setup

### Option A: External PostgreSQL (Recommended)
Use a managed PostgreSQL service like:
- Hostinger managed database
- Neon (neon.tech) - free tier available
- Supabase - free tier available

### Option B: PostgreSQL on Same VPS
If running PostgreSQL on the same VPS, install and configure:

```bash
# Install PostgreSQL
sudo apt update
sudo apt install postgresql postgresql-contrib

# Create database and user
sudo -u postgres psql
CREATE USER knxhome WITH PASSWORD 'your-secure-password';
CREATE DATABASE knxhome OWNER knxhome;
GRANT ALL PRIVILEGES ON DATABASE knxhome TO knxhome;
\q
```

DATABASE_URL format:
```
postgresql://knxhome:your-secure-password@localhost:5432/knxhome
```

---

## 3. Coolify Deployment Setup

### Step 1: Create New Project
1. Open Coolify dashboard
2. Click "New Project"
3. Name: "KNX Smart Home" or "namosistemos"

### Step 2: Add Application
1. Select "Docker Compose" or "Dockerfile" deployment
2. Connect your Git repository (GitHub/GitLab)
3. Select the branch to deploy (usually `main`)

### Step 3: Build Configuration

Create this `Dockerfile` in project root:

```dockerfile
FROM node:20-alpine AS builder

WORKDIR /app

COPY package*.json ./
RUN npm ci

COPY . .
RUN npm run build

FROM node:20-alpine AS runner

WORKDIR /app

ENV NODE_ENV=production

COPY --from=builder /app/dist ./dist
COPY --from=builder /app/package*.json ./
COPY --from=builder /app/node_modules ./node_modules

EXPOSE 5000

CMD ["node", "dist/index.js"]
```

### Step 4: Environment Variables in Coolify
Add these in Coolify's environment settings:
- `DATABASE_URL` - Your PostgreSQL connection string
- `SESSION_SECRET` - Generated secure string
- `NODE_ENV` - Set to `production`

### Step 5: Domain Configuration
1. In Coolify, go to "Domains"
2. Add: `namosistemos.lt`
3. Add: `www.namosistemos.lt`
4. Enable HTTPS (Let's Encrypt)

---

## 4. DNS Configuration (Hostinger)

In your Hostinger DNS settings for namosistemos.lt:

| Type  | Name | Value            | TTL  |
|-------|------|------------------|------|
| A     | @    | YOUR_VPS_IP      | 3600 |
| A     | www  | YOUR_VPS_IP      | 3600 |
| CNAME | www  | namosistemos.lt  | 3600 |

Replace `YOUR_VPS_IP` with your actual VPS IP address.

---

## 5. Post-Deployment Steps

### Run Database Migrations
After first deployment, run migrations:

```bash
# SSH into your VPS
ssh root@YOUR_VPS_IP

# Access the container
docker exec -it <container_id> sh

# Run migrations
npm run db:push
```

Or add this to your Dockerfile build:
```dockerfile
RUN npm run db:push
```

### Create Admin User
Access the application and log in with Replit Auth to create the first admin user.

---

## 6. Email Configuration (Resend)

For lead notifications, add Resend API key:

1. Create account at resend.com
2. Verify your domain (namosistemos.lt)
3. Get API key
4. Add to Coolify environment:
   ```
   RESEND_API_KEY=re_xxxxxxxxxxxx
   ```

### Resend Domain Verification
Add these DNS records for email sending:

| Type | Name                            | Value                          |
|------|---------------------------------|--------------------------------|
| TXT  | resend._domainkey.namosistemos.lt | (provided by Resend)          |

---

## 7. Health Checks

Configure in Coolify:
- Health check path: `/api/health` (or `/`)
- Port: 5000
- Interval: 30 seconds

---

## 8. docker-compose.yml (Alternative)

If using Docker Compose in Coolify:

```yaml
version: '3.8'

services:
  app:
    build: .
    ports:
      - "5000:5000"
    environment:
      - DATABASE_URL=${DATABASE_URL}
      - SESSION_SECRET=${SESSION_SECRET}
      - NODE_ENV=production
    restart: unless-stopped
    healthcheck:
      test: ["CMD", "curl", "-f", "http://localhost:5000/"]
      interval: 30s
      timeout: 10s
      retries: 3
```

---

## 9. SSL/HTTPS

Coolify handles SSL automatically with Let's Encrypt. Ensure:
1. Domain is properly pointed to VPS
2. Ports 80 and 443 are open
3. Let's Encrypt is enabled in Coolify

---

## 10. Backup Strategy

### Database Backups
```bash
# Create backup script
pg_dump -U knxhome -h localhost knxhome > backup_$(date +%Y%m%d).sql

# Schedule with cron (daily at 2 AM)
0 2 * * * /path/to/backup-script.sh
```

---

## Credentials Summary

Keep these secure and private:

| Item | Value |
|------|-------|
| Domain | namosistemos.lt |
| VPS IP | (your Hostinger VPS IP) |
| DATABASE_URL | postgresql://knxhome:PASSWORD@localhost:5432/knxhome |
| SESSION_SECRET | (generate with openssl rand -base64 32) |
| RESEND_API_KEY | (get from resend.com) |

---

## Troubleshooting

### Application won't start
- Check container logs in Coolify
- Verify DATABASE_URL is correct
- Ensure PostgreSQL is accessible

### Database connection errors
- Check PostgreSQL is running
- Verify credentials
- Check firewall allows connection

### Domain not working
- Verify DNS propagation (use dnschecker.org)
- Check Coolify domain configuration
- Ensure SSL certificate is issued

---

## Support

For issues specific to:
- Coolify: docs.coolify.io
- Hostinger VPS: support.hostinger.com
- PostgreSQL: postgresql.org/docs
