# Deployment Guide: namosistemos.lt on Hostinger VPS with Coolify

## Quick Start Checklist

- [ ] VPS with Coolify installed
- [ ] Domain namosistemos.lt pointing to VPS IP
- [ ] PostgreSQL database (external or on VPS)
- [ ] Resend account for emails (optional)

---

## Step 1: Prepare Database

### Option A: Use Neon.tech (Recommended - Free)
1. Go to https://neon.tech
2. Create account and new project
3. Copy the connection string:
   ```
   postgresql://username:password@ep-xxx.region.aws.neon.tech/neondb?sslmode=require
   ```

### Option B: Use Supabase (Free)
1. Go to https://supabase.com
2. Create new project
3. Go to Settings → Database → Connection string
4. Copy the URI (use "Session mode" for connection pooling)

### Option C: PostgreSQL on VPS
```bash
# SSH into VPS
ssh root@YOUR_VPS_IP

# Install PostgreSQL
apt update && apt install -y postgresql postgresql-contrib

# Create database
sudo -u postgres psql -c "CREATE USER knxhome WITH PASSWORD 'STRONG_PASSWORD_HERE';"
sudo -u postgres psql -c "CREATE DATABASE knxhome OWNER knxhome;"
sudo -u postgres psql -c "GRANT ALL PRIVILEGES ON DATABASE knxhome TO knxhome;"

# Connection string will be:
# postgresql://knxhome:STRONG_PASSWORD_HERE@localhost:5432/knxhome
```

---

## Step 2: Configure DNS

In Hostinger DNS settings for namosistemos.lt:

| Type  | Name | Value           | TTL  |
|-------|------|-----------------|------|
| A     | @    | YOUR_VPS_IP     | 3600 |
| A     | www  | YOUR_VPS_IP     | 3600 |

Wait 5-30 minutes for DNS propagation. Check at https://dnschecker.org

---

## Step 3: Coolify Setup

### 3.1 Create New Project
1. Open Coolify dashboard (usually https://YOUR_VPS_IP:8000)
2. Click **"+ New Project"**
3. Name: `namosistemos`

### 3.2 Add New Resource
1. Click **"+ New"** → **"Application"**
2. Select **"GitHub"** as source
3. Connect your GitHub account if not connected
4. Select repository: `callmly/knx-smart-home`
5. Branch: `main`

### 3.3 Build Configuration
In the application settings:

**Build Pack:** `Dockerfile`

**Dockerfile Location:** `Dockerfile` (root directory)

**Port Mapping:** `5000`

### 3.4 Environment Variables
Click **"Environment Variables"** and add:

```
DATABASE_URL=postgresql://user:password@host:5432/dbname
SESSION_SECRET=your-32-char-random-string-here
NODE_ENV=production
PORT=5000
```

**Generate SESSION_SECRET:**
```bash
openssl rand -base64 32
```
Example output: `K8xP2mN7qR4sT9vW1yB3dF6hJ0kL5nM8pQ2rU4wX7zA=`

### 3.5 Domain Configuration
1. Click **"Domains"** tab
2. Add: `namosistemos.lt`
3. Add: `www.namosistemos.lt`
4. Enable **"Generate SSL"** (Let's Encrypt)

### 3.6 Health Check (Optional but Recommended)
- **Health Check Path:** `/`
- **Health Check Port:** `5000`
- **Interval:** `30`
- **Timeout:** `10`

### 3.7 Deploy
Click **"Deploy"** button and wait for build to complete.

---

## Step 4: Run Database Migrations

After first successful deployment:

### Via SSH (Recommended)
```bash
# Find container ID
docker ps | grep knx

# Execute migration (uses CommonJS config - no import issues)
docker exec -it CONTAINER_ID drizzle-kit push --config=drizzle.config.cjs
```

The container includes `drizzle-kit` globally installed and uses a CommonJS config file (`drizzle.config.cjs`) that doesn't require any module imports.

---

## Step 5: Email Setup (Optional)

For lead notification emails:

1. Create account at https://resend.com
2. Verify domain `namosistemos.lt`:
   - Go to Resend → Domains → Add Domain
   - Add the DNS records Resend provides
3. Get API key from Resend → API Keys
4. Add to Coolify environment:
```
RESEND_API_KEY=re_xxxxxxxxxx
```
5. Redeploy the application

---

## Troubleshooting

### Build Fails
**Check logs in Coolify:**
- Click on deployment
- View build logs

**Common issues:**
- Missing `package-lock.json` - run `npm install` locally and commit
- Node version mismatch - Dockerfile uses Node 20

### App Won't Start
**Check runtime logs:**
```bash
docker logs CONTAINER_ID
```

**Common issues:**
- `DATABASE_URL` not set or incorrect
- Database not accessible (firewall, wrong host)
- `SESSION_SECRET` missing

### Database Connection Errors
- Verify DATABASE_URL format is correct
- Check if database allows external connections
- For Neon/Supabase: ensure `?sslmode=require` is in URL

### Domain Not Working
- Check DNS propagation at dnschecker.org
- Verify A record points to correct VPS IP
- Wait for SSL certificate generation (can take 5 min)

### 502 Bad Gateway
- Application crashed - check container logs
- Port mismatch - ensure app runs on port 5000
- Health check failing - verify app responds at `/`

---

## Environment Variables Summary

| Variable | Required | Description | Example |
|----------|----------|-------------|---------|
| DATABASE_URL | Yes | PostgreSQL connection | `postgresql://user:pass@host:5432/db` |
| SESSION_SECRET | Yes | 32+ char random string | `K8xP2mN7qR4sT9vW...` |
| NODE_ENV | Yes | Set to production | `production` |
| PORT | Yes | Application port | `5000` |
| RESEND_API_KEY | No | For email notifications | `re_xxxxxxxx` |

---

## Useful Commands

```bash
# View running containers
docker ps

# View container logs
docker logs -f CONTAINER_ID

# Restart container
docker restart CONTAINER_ID

# Execute command in container
docker exec -it CONTAINER_ID sh

# Check database connection from container
docker exec -it CONTAINER_ID node -e "require('pg').Client({connectionString: process.env.DATABASE_URL}).connect().then(() => console.log('OK')).catch(e => console.log('FAIL:', e.message))"
```

---

## Important: Admin Panel Access

**Note:** The admin panel uses Replit Auth for authentication, which only works on Replit.com.

When deployed externally (Hostinger/Coolify), the admin panel will NOT be accessible because `REPL_ID` environment variable is not available outside Replit.

**To manage content:**
1. Use Replit development environment for admin tasks
2. Data is synced via the shared PostgreSQL database
3. Changes made in Replit admin will appear on production site

**Alternative:** If you need admin access on production, you'll need to implement a different authentication system (e.g., username/password auth).

---

## After Successful Deployment

1. Visit https://namosistemos.lt to verify site works
2. Public pages work normally (landing page, lead forms, custom pages)
3. Admin panel is NOT accessible on external deployments
4. Use Replit development environment for content management

---

## Support

- Coolify docs: https://coolify.io/docs
- Neon docs: https://neon.tech/docs
- Resend docs: https://resend.com/docs
