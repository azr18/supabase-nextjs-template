# Google OAuth Setup Guide

This guide walks you through setting up Google OAuth authentication for the Invoice Reconciler SaaS Platform.

## Overview

Google OAuth integration allows users to sign in using their Google accounts, providing a seamless authentication experience. This setup involves:

1. Creating OAuth credentials in Google Cloud Console
2. Configuring the credentials in Supabase
3. Setting up environment variables

## Prerequisites

- Access to Google Cloud Console
- Admin access to Supabase project (Project ID: `hcyteovnllklmvoptxjr`)
- Admin access to this codebase

## Step 1: Google Cloud Console Setup

### 1.1 Create or Select a Project

1. Go to [Google Cloud Console](https://console.cloud.google.com/)
2. Either select an existing project or create a new one:
   - Click the project dropdown at the top
   - Click "New Project" if creating new
   - Name: "Invoice Reconciler SaaS" (or your preferred name)
   - Click "Create"

### 1.2 Enable Google+ API

1. In the Google Cloud Console, go to "APIs & Services" > "Library"
2. Search for "Google+ API"
3. Click on "Google+ API" and click "Enable"
4. Alternatively, search for "Google Identity" and enable "Google Identity"

### 1.3 Configure OAuth Consent Screen

1. Go to "APIs & Services" > "OAuth consent screen"
2. Choose "External" user type (unless you have a Google Workspace account)
3. Click "Create"
4. Fill in the required information:
   - **App name**: "Invoice Reconciler SaaS Platform"
   - **User support email**: Your business email
   - **App logo**: (Optional) Upload your company logo
   - **App domain**:
     - Homepage URL: `https://yourdomain.com` (your production domain)
     - Privacy policy URL: `https://yourdomain.com/legal/privacy`
     - Terms of service URL: `https://yourdomain.com/legal/terms`
   - **Developer contact information**: Your business email
5. Click "Save and Continue"
6. On the "Scopes" page, click "Save and Continue" (default scopes are sufficient)
7. On the "Test users" page, add any email addresses you want to test with during development
8. Click "Save and Continue"

### 1.4 Create OAuth Credentials

1. Go to "APIs & Services" > "Credentials"
2. Click "Create Credentials" > "OAuth 2.0 Client IDs"
3. Choose "Web application" as the application type
4. Fill in the details:
   - **Name**: "Invoice Reconciler Web Client"
   - **Authorized JavaScript origins**:
     - `http://localhost:3000` (for local development)
     - `https://yourdomain.com` (your production domain)
     - `https://hcyteovnllklmvoptxjr.supabase.co` (your Supabase project URL)
   - **Authorized redirect URIs**:
     - `http://localhost:3000/api/auth/callback` (for local development)
     - `https://yourdomain.com/api/auth/callback` (for production)
     - `https://hcyteovnllklmvoptxjr.supabase.co/auth/v1/callback` (for Supabase Auth)
5. Click "Create"
6. **Important**: Copy the Client ID and Client Secret - you'll need these for the next steps

## Step 2: Supabase Configuration

### 2.1 Configure in Supabase Dashboard

1. Go to [Supabase Dashboard](https://app.supabase.com/)
2. Navigate to your project: `hcyteovnllklmvoptxjr`
3. Go to "Authentication" > "Providers"
4. Find "Google" in the list and toggle it ON
5. Enter the credentials from Google Cloud Console:
   - **Client ID**: Paste the Client ID from Step 1.4
   - **Client Secret**: Paste the Client Secret from Step 1.4
6. Click "Save"

### 2.2 Set Environment Variables

You need to set up environment variables for both local development and production.

#### For Local Development

Add these variables to your `.env.local` file in the `nextjs/` directory:

```bash
# Google OAuth Credentials
SUPABASE_AUTH_EXTERNAL_GOOGLE_CLIENT_ID=your_google_client_id_here
SUPABASE_AUTH_EXTERNAL_GOOGLE_SECRET=your_google_client_secret_here
```

#### For Production

Set these environment variables in your production environment (Vercel, Netlify, etc.):

```bash
SUPABASE_AUTH_EXTERNAL_GOOGLE_CLIENT_ID=your_google_client_id_here
SUPABASE_AUTH_EXTERNAL_GOOGLE_SECRET=your_google_client_secret_here
```

## Step 3: Update Production URLs

When you deploy to production, make sure to update:

1. **Google Cloud Console**:
   - Add your production domain to "Authorized JavaScript origins"
   - Add your production callback URL to "Authorized redirect URIs"

2. **Supabase Configuration**:
   - Update the site URL in Supabase Auth settings to your production domain

## Step 4: Testing

### 4.1 Local Testing

1. Start your local development server:
   ```bash
   cd nextjs
   npm run dev
   ```

2. Navigate to `http://localhost:3000/auth/login`
3. Click the "Continue with Google" button
4. Complete the OAuth flow
5. Verify you're redirected to the dashboard (`/app`)

### 4.2 Production Testing

1. Deploy your application to production
2. Navigate to your production login page
3. Test the Google OAuth flow
4. Verify successful authentication and redirection

## Troubleshooting

### Common Issues

1. **"Error 400: redirect_uri_mismatch"**
   - Check that your redirect URIs in Google Cloud Console exactly match the URLs being used
   - Ensure there are no trailing slashes or typos

2. **"This app isn't verified"**
   - This is normal during development
   - Users can click "Advanced" > "Go to [app name] (unsafe)" to proceed
   - For production, consider going through Google's verification process

3. **OAuth consent screen errors**
   - Ensure all required fields are filled in the consent screen configuration
   - Make sure your app domain URLs are accessible

4. **Environment variables not loading**
   - Check that environment variable names match exactly
   - Restart your development server after adding new environment variables
   - For production, ensure environment variables are set in your hosting platform

### Debug Steps

1. Check browser console for error messages
2. Verify environment variables are loaded correctly
3. Check Supabase Auth logs in the dashboard
4. Ensure Google Cloud Console settings match your application URLs

## Security Considerations

1. **Never commit OAuth secrets to version control**
   - Use environment variables for all sensitive credentials
   - Add `.env.local` to your `.gitignore` file

2. **Restrict OAuth credentials**
   - Only add necessary redirect URIs
   - Regularly rotate client secrets if needed

3. **Monitor OAuth usage**
   - Check Google Cloud Console for unusual activity
   - Monitor Supabase Auth logs for suspicious sign-ins

## Next Steps

After successful setup:

1. Test the complete authentication flow
2. Verify user data is properly stored in Supabase
3. Test logout functionality
4. Consider implementing additional OAuth providers if needed

## Support

For additional help:
- [Supabase Auth Documentation](https://supabase.com/docs/guides/auth)
- [Google OAuth Documentation](https://developers.google.com/identity/protocols/oauth2)
- [Google Cloud Console Support](https://cloud.google.com/support) 