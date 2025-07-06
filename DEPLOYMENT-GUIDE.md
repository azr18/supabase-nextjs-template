# 🚀 Production Deployment Guide

This guide provides two deployment options: **Manual** (immediate fix) and **Automated** (GitHub Actions).

## 🔧 **Prerequisites**

### 1. Google OAuth Setup
Get your Google OAuth credentials from [Google Cloud Console](https://console.cloud.google.com/):
1. Go to APIs & Services > Credentials
2. Create OAuth 2.0 Client ID
3. Set authorized redirect URIs:
   - `https://mynewagent.ai/auth/callback`
   - `https://www.mynewagent.ai/auth/callback`
   - `https://hcyteovnllklmvoptxjr.supabase.co/auth/v1/callback`

### 2. SSL Certificate
Ensure your Let's Encrypt certificate is installed:
```bash
certbot certonly --standalone -d mynewagent.ai -d www.mynewagent.ai
```

## 🛠️ **Option 1: Manual Deployment (Recommended)**

### On Your Server (SSH):

1. **Navigate to project directory:**
   ```bash
   cd /root/supabase-nextjs-template
   ```

2. **Update code:**
   ```bash
   git pull origin main
   ```

3. **Run deployment script:**
   ```bash
   chmod +x deploy.sh
   ./deploy.sh
   ```

4. **Update Google OAuth credentials:**
   ```bash
   nano .env.production
   ```
   Replace:
   - `SUPABASE_AUTH_EXTERNAL_GOOGLE_CLIENT_ID=your-google-client-id`
   - `SUPABASE_AUTH_EXTERNAL_GOOGLE_SECRET=your-google-client-secret`

5. **Restart services:**
   ```bash
   docker-compose -f docker-compose.production.yml down
   docker-compose -f docker-compose.production.yml --env-file .env.production up -d
   ```

### Verification:
- ✅ HTTP redirects to HTTPS: `curl -I http://mynewagent.ai`
- ✅ HTTPS works: `curl -I https://mynewagent.ai`
- ✅ OAuth redirects to production domain (not localhost)

## 🤖 **Option 2: GitHub Actions Deployment**

### Setup GitHub Secrets:
1. Go to your GitHub repository
2. Settings > Secrets and variables > Actions
3. Add these secrets:

```
SSH_KEY=your-private-ssh-key
HOST=your-server-ip
USERNAME=root
DOMAIN=mynewagent.ai
NEXT_PUBLIC_SITE_URL=https://mynewagent.ai
NEXT_PUBLIC_SUPABASE_URL=https://hcyteovnllklmvoptxjr.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImhjeXRlb3ZubGxrbG12b3B0eGpyIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NDg1MDI5MTcsImV4cCI6MjA2NDA3ODkxN30.QEoxsRXBGSiZYFk7Y8f7fOinpL4ExkdbEGYtY_CQj0A
SUPABASE_AUTH_EXTERNAL_GOOGLE_CLIENT_ID=your-google-client-id
SUPABASE_AUTH_EXTERNAL_GOOGLE_SECRET=your-google-client-secret
```

### Run Deployment:
1. Go to Actions tab in GitHub
2. Select "Deploy to Production"
3. Click "Run workflow"

## 🔍 **Troubleshooting**

### OAuth Still Redirecting to Localhost?
1. Check Supabase Dashboard > Authentication > URL Configuration
2. Ensure Site URL is `https://mynewagent.ai`
3. Verify redirect URLs don't contain localhost

### SSL Certificate Issues?
```bash
# Check certificate validity
openssl x509 -in /etc/letsencrypt/live/mynewagent.ai/fullchain.pem -text -noout

# Renew certificate
certbot renew
```

### Container Issues?
```bash
# Check container logs
docker-compose -f docker-compose.production.yml logs -f

# Restart specific service
docker-compose -f docker-compose.production.yml restart nextjs
```

## 📋 **Configuration Files Fixed**

✅ **Supabase config.toml**: Fixed wildcard redirect URLs (`*` instead of `**`)
✅ **GitHub Actions**: Fixed typo and removed hardcoded values
✅ **Docker Compose**: Created production-ready configuration
✅ **Environment Variables**: Proper management system

## 🎯 **Success Indicators**

- ✅ Site loads at `https://mynewagent.ai`
- ✅ HTTP automatically redirects to HTTPS
- ✅ Google OAuth works without localhost redirects
- ✅ No SSL certificate errors
- ✅ All services running in Docker containers

## 📞 **Support**

If you encounter issues:
1. Check the deployment logs: `docker-compose -f docker-compose.production.yml logs -f`
2. Verify environment variables: `cat .env.production`
3. Test individual services: `docker-compose -f docker-compose.production.yml ps` 