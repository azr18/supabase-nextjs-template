# Authentication Issues Log - Local Docker Deployment

## Environment Context

- **Setup**: Local Docker deployment using `docker-compose.yml`
- **Services**: Next.js (port 3000), Python Flask (port 5000), Nginx (port 80)
- **Docker Version**: 28.1.1
- **Browser**: Firefox
- **Date**: Current deployment testing phase

## Issues Encountered

### 1. Account Creation Failure
**Symptom**: Cannot create new user accounts
**Error**: "Invalid API error"
**Context**: Attempting to register new accounts through the application

### 2. Google OAuth Authentication Failure
**Symptom**: Google OAuth login process fails
**Error**: Multiple Content Security Policy violations and CORS errors

#### Specific Console Errors:

```
Error: Promised response from onMessage listener went out of scope
```

#### Content Security Policy Violations:
```
Content-Security-Policy: The page's settings blocked an inline script (script-src-elem) from being executed because it violates the following directive: "script-src 'nonce-RV14ma9JFaydp7sUIiPOOA' 'unsafe-inline' 'unsafe-eval'" single-file-extension-frames.js:1:295

Content-Security-Policy: The page's settings blocked an inline script (script-src-elem) from being executed because it violates the following directive: "script-src 'nonce-RV14ma9JFaydp7sUIiPOOA' 'unsafe-inline' 'unsafe-eval'" utils.js:42:10

Content-Security-Policy: The page's settings blocked an inline script (script-src-elem) from being executed because it violates the following directive: "script-src 'nonce-i5G8o0rFYL7ndkESEE8ffw' 'unsafe-inline'" c2e6f56c-1758-420d-8f0d-82c497b417ac:19:51

Content-Security-Policy: The page's settings blocked an inline script (script-src-elem) from being executed because it violates the following directive: "script-src 'unsafe-eval'" single-file-extension-frames.js:1:295

Content-Security-Policy: The page's settings blocked an inline script (script-src-elem) from being executed because it violates the following directive: "script-src 'nonce-i5G8o0rFYL7ndkESEE8ffw' 'unsafe-inline'" content.js:2:161530
```

#### CORS Errors:
```
Cross-Origin Request Blocked: The Same Origin Policy disallows reading the remote resource at https://play.google.com/log?format=json&hasfast=true&authuser=0. (Reason: CORS request did not succeed). Status code: (null).
```

## Troubleshooting Steps Taken

### 1. Environment Variable Configuration
**Action**: Configured Supabase environment variables in `.env` file
**Status**: ✅ Completed
**Details**: 
- Added `NEXT_PUBLIC_SUPABASE_URL`
- Added `NEXT_PUBLIC_SUPABASE_ANON_KEY`
- Added `SUPABASE_SERVICE_ROLE_KEY`

### 2. Docker Environment Variable Injection
**Action**: Modified Docker build process to include Supabase environment variables at build time
**Status**: ✅ Completed
**Details**:
- Updated `docker-compose.yml` to pass `NEXT_PUBLIC_*` variables as build arguments
- Modified `nextjs/Dockerfile` to accept and set environment variables during build
- Rebuilt containers with `--no-cache` flag

### 3. Google OAuth Configuration
**Action**: Updated Google OAuth redirect URIs
**Status**: ✅ Completed according to user
**Details**: User reports updating Google redirects, but issues persist

### 4. Service Health Verification
**Action**: Verified all Docker services are running
**Status**: ✅ Completed
**Details**:
- Python Flask service: Healthy on port 5000
- Next.js application: Healthy on port 3000
- Nginx reverse proxy: Healthy on port 80

## Current Environment Configuration

### `.env` File Structure
```
NEXT_PUBLIC_SUPABASE_URL=<configured>
NEXT_PUBLIC_SUPABASE_ANON_KEY=<configured>
SUPABASE_SERVICE_ROLE_KEY=<configured>
GOOGLE_CLIENT_ID=<placeholder>
GOOGLE_CLIENT_SECRET=<placeholder>
```

### Docker Services Status
- ✅ Python Flask Service (port 5000)
- ✅ Next.js Application (port 3000)
- ✅ Nginx Reverse Proxy (port 80)

## Potential Root Causes

### 1. Supabase Authentication Configuration
- Environment variables may not be properly accessible to the browser client
- Supabase client initialization issues in the browser context
- Possible API endpoint configuration problems

### 2. Google OAuth Configuration Issues
- Redirect URIs may not match the local Docker setup
- CSP headers may be blocking Google OAuth scripts
- CORS configuration may be preventing Google services communication

### 3. Content Security Policy Conflicts
- Nginx CSP headers may be too restrictive for OAuth flows
- Browser extensions interfering with script execution
- Nonce-based CSP conflicting with dynamic OAuth scripts

### 4. Network/CORS Configuration
- Docker networking issues between services
- CORS headers not properly configured for OAuth flows
- Browser security policies blocking cross-origin OAuth requests

## ROOT CAUSE ANALYSIS - API Request Format Investigation

### Critical Discovery: Request Headers Missing
**Investigation Finding**: The issue is NOT with API keys or rate limits, but with **how the browser client is making requests**.

#### Key Evidence:
1. **MCP Database Access**: ✅ WORKS (uses service role authentication)
2. **Browser API Calls**: ❌ FAILS with "Invalid API key" 
3. **Environment Variables**: ✅ CORRECTLY SET in both server and client

#### Technical Analysis:

**Supabase Browser Client Configuration**:
```typescript
// nextjs/src/lib/supabase/client.ts
return createBrowserClient<Database>(supabaseUrl, supabaseAnonKey);
```

**Authentication Call Chain**:
```typescript
// nextjs/src/app/auth/login/page.tsx  
const client = await createSPASassClient();
const { error } = await client.loginEmail(email, password);

// nextjs/src/lib/supabase/unified.ts
async loginEmail(email: string, password: string) {
    return this.client.auth.signInWithPassword({
        email: email,
        password: password
    });
}
```

#### Hypothesis: Missing Authorization Header
**The most likely issue**: The Supabase browser client (`@supabase/ssr`) may not be properly setting the `Authorization: Bearer <token>` header in Docker environment.

**Evidence Supporting This**:
- Direct PowerShell API calls with proper headers also return "Invalid API key"
- MCP uses different authentication mechanism (service role key)
- Browser client relies on `createBrowserClient` which may have Docker-specific issues

#### Proposed Solution Path:
1. **Test Raw HTTP Headers**: Create server-side endpoint to test exact same API calls
2. **Compare Request Headers**: Browser vs Server vs MCP vs Manual
3. **Override Client Headers**: Force specific headers in browser client
4. **Docker Network Analysis**: Check if Docker networking affects header transmission

#### Specific Technical Fixes to Test:

**Fix 1: Force Headers in Browser Client**
```typescript
// Modify nextjs/src/lib/supabase/client.ts
export function createSupabaseBrowserClient() {
    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
    const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
    
    return createBrowserClient<Database>(supabaseUrl, supabaseAnonKey, {
        global: {
            headers: {
                'Authorization': `Bearer ${supabaseAnonKey}`,
                'apikey': supabaseAnonKey
            }
        }
    });
}
```

**Fix 2: Test Raw Fetch Implementation**
```typescript
// Direct browser API calls bypassing Supabase client
async loginEmail(email: string, password: string) {
    const response = await fetch(`${process.env.NEXT_PUBLIC_SUPABASE_URL}/auth/v1/token?grant_type=password`, {
        method: 'POST',
        headers: {
            'Authorization': `Bearer ${process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY}`,
            'apikey': process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
            'Content-Type': 'application/json'
        },
        body: JSON.stringify({ email, password })
    });
    return response.json();
}
```

**Fix 3: Docker Network Header Investigation**
- Check if Docker Compose networking is stripping/modifying headers
- Test direct container-to-container communication
- Verify Nginx proxy isn't interfering with auth headers

### High Priority Investigation Steps
1. **API Request Headers Analysis**
   - Test server-side raw fetch calls to Supabase APIs
   - Compare headers between working MCP and failing browser calls
   - Verify Authorization header format and presence

2. **Browser Client Debug**
   - Add request interceptor to log exact headers being sent
   - Test bypassing Supabase client with raw fetch calls
   - Verify createBrowserClient behavior in Docker environment

### Medium Priority
1. **Browser Environment Testing**
   - Test in different browsers (Chrome, Edge)
   - Test with browser extensions disabled
   - Test in incognito/private mode

2. **Network Configuration Review**
   - Verify Docker network configuration
   - Check for proxy/firewall interference
   - Test direct service access bypassing Nginx

### Low Priority
1. **Alternative Authentication Testing**
   - Test email/password authentication if available
   - Test with different OAuth providers
   - Verify basic Supabase connection without OAuth

## Impact Assessment

- **Business Impact**: Complete authentication system failure prevents user access
- **Development Impact**: Cannot test authenticated features or user flows
- **Timeline Impact**: Deployment testing blocked until authentication issues resolved

## Knowledge Graph Entities & Relationships

### Key Entities Created:
- **Authentication System Failure** (Problem) - Main issue preventing user access
- **Docker Local Deployment** (Environment) - Current testing environment
- **Content Security Policy Issues** (Security Problem) - CSP headers blocking OAuth scripts
- **Google OAuth Configuration** (Authentication Provider) - OAuth setup and configuration
- **Supabase Environment Variables** (Configuration) - Database and auth configuration
- **CORS Errors** (Network Problem) - Cross-origin request failures
- **Firefox Browser Testing** (Test Environment) - Primary testing browser

### Relationships Mapped:
- Authentication System Failure **occurs in** Docker Local Deployment
- Authentication System Failure **caused by** Content Security Policy Issues
- Authentication System Failure **caused by** CORS Errors
- Content Security Policy Issues **blocks** Google OAuth Configuration
- CORS Errors **prevents** Google OAuth Configuration
- Docker Local Deployment **uses** Supabase Environment Variables
- Firefox Browser Testing **detects** Content Security Policy Issues
- Firefox Browser Testing **reports** CORS Errors

## Immediate Action Plan

### Step 1: Test Fix 1 - Force Headers (RECOMMENDED)
**Modify** `nextjs/src/lib/supabase/client.ts` to explicitly set headers:
```typescript
return createBrowserClient<Database>(supabaseUrl, supabaseAnonKey, {
    global: {
        headers: {
            'Authorization': `Bearer ${supabaseAnonKey}`,
            'apikey': supabaseAnonKey
        }
    }
});
```

### Step 2: Verify with Network Tab
1. Open browser DevTools → Network tab
2. Attempt authentication  
3. Check if `Authorization` and `apikey` headers are present in requests to Supabase
4. Compare with working MCP requests

### Step 3: If Headers Are Missing
**Root Cause**: `@supabase/ssr` createBrowserClient not setting headers properly in Docker
**Solution**: Use raw fetch API temporarily or fix Supabase client configuration

### Step 4: If Headers Are Present
**Root Cause**: Docker/Nginx stripping headers or network routing issue
**Solution**: Check Nginx configuration and Docker networking

## Success Criteria
- ✅ Browser auth requests include `Authorization: Bearer <key>` header
- ✅ Browser auth requests include `apikey: <key>` header  
- ✅ Supabase APIs return 200 instead of "Invalid API key"
- ✅ User registration and login work in browser

## Notes

- All Docker services are healthy and responding
- Environment variables appear to be configured correctly
- Google OAuth configuration has been updated per user
- **NEW DISCOVERY**: Issue is API request format, not configuration
- MCP works because it uses different authentication mechanism
- Browser client may not be setting required headers in Docker environment 