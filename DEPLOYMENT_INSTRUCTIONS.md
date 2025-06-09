# Production Deployment Instructions for Hetzner Server

## Step 1: Configure Environment Variables

You need to set up several environment variables for the production deployment. The application requires Supabase credentials and Google OAuth configuration.

### 🔑 Required Credentials

Before proceeding, gather these credentials:

1. **Supabase Service Role Key**
   - Go to [Supabase Dashboard](https://app.supabase.com/project/hcyteovnllklmvoptxjr/settings/api)
   - Copy the `service_role` key (not the anon key)

2. **Google OAuth Credentials**
   - Go to [Google Cloud Console](https://console.cloud.google.com/)
   - Navigate to APIs & Services > Credentials
   - Create or find your OAuth 2.0 Client ID
   - Copy the Client ID and Client Secret

### 🚀 Automated Setup (Recommended)

1. **Run the setup script on your Hetzner server:**
   ```bash
   chmod +x setup-production-env.sh
   ./setup-production-env.sh
   ```

2. **Follow the prompts to enter:**
   - Supabase Service Role Key
   - Google OAuth Client ID
   - Google OAuth Client Secret
   - Google Analytics Tag (optional)

### 📝 Manual Setup (Alternative)

If you prefer to configure manually:

1. **Copy the environment template:**
   ```bash
   cp .env.production .env
   ```

2. **Edit the .env file:**
   ```bash
   nano .env
   ```

3. **Update these required variables:**
   ```env
   # Replace with your actual Supabase service role key
   PRIVATE_SUPABASE_SERVICE_KEY=your_service_role_key_here
   SUPABASE_SERVICE_ROLE_KEY=your_service_role_key_here

   # Replace with your Google OAuth credentials
   SUPABASE_AUTH_EXTERNAL_GOOGLE_CLIENT_ID=your_google_client_id.apps.googleusercontent.com
   SUPABASE_AUTH_EXTERNAL_GOOGLE_SECRET=your_google_client_secret

   # Optional: Replace with your Google Analytics tag
   NEXT_PUBLIC_GOOGLE_TAG=G-XXXXXXXXXX
   ```

## Step 2: Update Google OAuth Configuration

**Important:** After deployment, you must update your Google OAuth settings:

1. **Go to Google Cloud Console > APIs & Services > Credentials**
2. **Edit your OAuth 2.0 Client ID**
3. **Add your production URLs to Authorized redirect URIs:**
   ```
   https://your-domain.com/auth/callback
   https://your-server-ip/auth/callback
   ```
4. **Add your production URLs to Authorized JavaScript origins:**
   ```
   https://your-domain.com
   https://your-server-ip
   ```

## Step 3: Update Supabase Auth Configuration

1. **Go to [Supabase Dashboard](https://app.supabase.com/project/hcyteovnllklmvoptxjr/settings/auth)**
2. **Update the Site URL:**
   ```
   https://your-domain.com
   ```
3. **Add redirect URLs:**
   ```
   https://your-domain.com/**
   https://your-server-ip/**
   ```

## Step 4: Security Considerations

### 🔒 Environment Variables Security

- **Never commit .env files to Git**
- **Set proper file permissions:**
  ```bash
  chmod 600 .env
  ```
- **Backup your .env file securely**

### 🛡️ Server Security

1. **Configure firewall (UFW):**
   ```bash
   sudo ufw allow 22    # SSH
   sudo ufw allow 80    # HTTP
   sudo ufw allow 443   # HTTPS
   sudo ufw enable
   ```

2. **Set up SSL certificates (recommended):**
   ```bash
   # Using Let's Encrypt with Certbot
   sudo apt install certbot python3-certbot-nginx
   sudo certbot --nginx -d your-domain.com
   ```

## Step 5: Start the Application

1. **Start the services:**
   ```bash
   docker-compose up -d
   ```

2. **Check service status:**
   ```bash
   docker-compose ps
   docker-compose logs -f
   ```

3. **Test the application:**
   - Visit `http://your-server-ip` or `https://your-domain.com`
   - Test the health endpoints:
     - `http://your-server-ip:5000/health` (Python service)
     - `http://your-server-ip:3000` (Next.js app)

## Step 6: Monitoring and Maintenance

### 📊 Check Application Health

```bash
# Check container status
docker-compose ps

# View logs
docker-compose logs -f nextjs-app
docker-compose logs -f python-service
docker-compose logs -f nginx

# Check resource usage
docker stats
```

### 🔄 Updates and Restarts

```bash
# Restart services
docker-compose restart

# Update and rebuild
git pull
docker-compose build
docker-compose up -d
```

## Troubleshooting

### 🐛 Common Issues

1. **"Service Unavailable" Error**
   - Check if all environment variables are set correctly
   - Verify Supabase credentials
   - Check Docker container logs

2. **Google OAuth Not Working**
   - Verify redirect URLs in Google Cloud Console
   - Check Google OAuth credentials in .env file
   - Ensure HTTPS is configured for production

3. **Database Connection Issues**
   - Verify Supabase URL and keys
   - Check network connectivity from server to Supabase

### 📋 Validation Checklist

- [ ] All environment variables configured
- [ ] Google OAuth redirect URLs updated
- [ ] Supabase auth settings updated
- [ ] SSL certificates configured (for HTTPS)
- [ ] Firewall rules configured
- [ ] Docker containers running successfully
- [ ] Application accessible via browser
- [ ] Google sign-in working
- [ ] File upload and reconciliation working

## Support

For additional help:
- Check the logs: `docker-compose logs -f`
- Review the setup script output
- Verify all credential configurations
- Test with a simple curl request to health endpoints

## Environment Variables Reference

### Required Variables
| Variable | Description | Source |
|----------|-------------|--------|
| `PRIVATE_SUPABASE_SERVICE_KEY` | Supabase service role key | Supabase Dashboard |
| `SUPABASE_SERVICE_ROLE_KEY` | Same as above (for Docker) | Supabase Dashboard |
| `SUPABASE_AUTH_EXTERNAL_GOOGLE_CLIENT_ID` | Google OAuth Client ID | Google Cloud Console |
| `SUPABASE_AUTH_EXTERNAL_GOOGLE_SECRET` | Google OAuth Client Secret | Google Cloud Console |

### Optional Variables
| Variable | Description | Default |
|----------|-------------|---------|
| `NEXT_PUBLIC_GOOGLE_TAG` | Google Analytics tracking ID | None |
| `NEXT_PUBLIC_PRODUCTNAME` | Application name | "Invoice Reconciler" |

### Pre-configured Variables
| Variable | Value | Description |
|----------|-------|-------------|
| `NEXT_PUBLIC_SUPABASE_URL` | `https://hcyteovnllklmvoptxjr.supabase.co` | Supabase project URL |
| `NEXT_PUBLIC_SUPABASE_ANON_KEY` | (Pre-configured) | Supabase anonymous key |
| `PYTHON_SERVICE_URL` | `http://python-service:5000` | Internal Docker network URL | 