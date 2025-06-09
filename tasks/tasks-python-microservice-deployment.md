# Python Microservice Deployment to Hetzner

## Relevant Files

- `python-pdf-service/app.py` - Main Flask application for complete reconciliation microservice with /health and /reconcile endpoints
- `python-pdf-service/pdf_extraction.py` - AWB and CCA extraction logic ported from docs/app(1).py
- `python-pdf-service/reconciliation.py` - Complete reconciliation workflow ported from docs/app(1).py
- `python-pdf-service/utils.py` - Helper functions (safe_to_numeric, formatting) from docs/app(1).py
- `python-pdf-service/requirements.txt` - Python dependencies matching docs/app(1).py
- `python-pdf-service/test_reconcile.py` - Complete test script for testing the reconciliation service with PDF and Excel files
- `python-pdf-service/test_pdf_only.py` - Test script for PDF-only processing
- `python-pdf-service/Dockerfile` - Docker configuration for the Python service
- `nextjs/src/app/api/reconcile/route.ts` - Updated to call Python microservice instead of local processing
- `nextjs/src/app/api/reconcile/route.ts.backup` - Backup of original reconciliation route implementation
- `python-pdf-service/Dockerfile` - Docker configuration for Python Flask service with security and optimization
- `nextjs/Dockerfile` - Multi-stage Docker build for Next.js application with production optimizations
- `nextjs/next.config.ts` - Updated Next.js config for standalone Docker builds
- `docker-compose.yml` - Docker Compose orchestration for both services with health checks and networking
- `nginx.conf` - Production-ready Nginx reverse proxy with rate limiting and security headers
- `python-pdf-service/.dockerignore` - Docker build context optimization for Python service
- `nextjs/.dockerignore` - Docker build context optimization for Next.js application
- `.env.production` - Production environment template with all required variables for Hetzner deployment
- `setup-production-env.sh` - Interactive script to configure environment variables on production server
- `DEPLOYMENT_INSTRUCTIONS.md` - Complete deployment guide with environment setup and security considerations
- `deploy-and-verify.sh` - Automated deployment script that starts services and verifies external access
- `PRODUCTION_DEPLOYMENT_COMMANDS.md` - Quick reference guide with all deployment and management commands

### Notes

- Python microservice will run on port 5000 internally
- Next.js app will run on port 3000 internally  
- Nginx will handle external traffic on ports 80/443
- All services will be containerized using Docker
- Hetzner server will run Ubuntu with Docker and Docker Compose

## Tasks

- [x] 1.0 Extract and Port Complete Reconciliation Logic from app(1).py
  - [x] 1.1 Create `python-pdf-service/` directory in project root
  - [x] 1.2 Copy `extract_awb_data()` and `extract_cca_data()` functions from `docs/app(1).py` to `python-pdf-service/pdf_extraction.py`
  - [x] 1.3 Copy `process_file()` function and all reconciliation logic from `docs/app(1).py` to `python-pdf-service/reconciliation.py`
  - [x] 1.4 Copy helper functions (`safe_to_numeric()`, date formatting, etc.) from `docs/app(1).py` to `python-pdf-service/utils.py`
  - [x] 1.5 Create `python-pdf-service/requirements.txt` with dependencies: flask, pdfplumber, pandas, openpyxl, xlrd
  - [x] 1.6 Test that all Python functions can be imported without errors

- [x] 2.0 Create Complete Flask Reconciliation Service
  - [x] 2.1 Create `python-pdf-service/app.py` with basic Flask app structure
  - [x] 2.2 Add `/health` endpoint that returns {"status": "ok"}
  - [x] 2.3 Add `/reconcile` POST endpoint that accepts invoice PDF and Excel report files (base64)
  - [x] 2.4 Integrate complete reconciliation workflow from `reconciliation.py` in the endpoint
  - [x] 2.5 Return processed Excel file with all sheets (Summary, Reconciliation, Invoices, CCA) as base64

- [x] 3.0 Test Complete Python Reconciliation Service Locally
  - [x] 3.1 Install Python dependencies: `pip install -r python-pdf-service/requirements.txt`
  - [x] 3.2 Start Flask service: `python python-pdf-service/app.py`
  - [x] 3.3 Test `/health` endpoint returns 200 OK
  - [x] 3.4 Create test script that sends fixture PDF and Excel report to `/reconcile` endpoint
  - [x] 3.5 Verify returned Excel file contains all 4 sheets with same format as original `docs/app(1).py` output

- [x] 4.0 Update TypeScript to Call Python Reconciliation Service
  - [x] 4.1 Backup current reconciliation route: `nextjs/src/app/api/reconcile/route.ts`
  - [x] 4.2 Replace reconciliation logic to call Python service `/reconcile` endpoint at `http://localhost:5000`
  - [x] 4.3 Update route to pass invoice PDF and Excel files to Python service
  - [x] 4.4 Add error handling for Python service connection failures
  - [x] 4.5 Test complete invoice reconciler workflow matches original `docs/app(1).py` behavior

- [x] 5.0 Create Docker Containers
  - [x] 5.1 Create `python-pdf-service/Dockerfile` for Python Flask service
  - [x] 5.2 Create `nextjs/Dockerfile` for Next.js application
  - [x] 5.3 Create `docker-compose.yml` in project root to run both services
  - [x] 5.4 Test containers build successfully: `docker-compose build`
  - [x] 5.5 Test containers run locally: `docker-compose up` and verify both services work

- [x] 6.0 Set Up Hetzner Server and Deploy
  - [x] 6.1 Create Hetzner Cloud server (Ubuntu 24.04, CPX31 - Helsinki)
  - [x] 6.2 Install Docker and Docker Compose on server
  - [x] 6.3 Copy project files to server using SCP or Git
  - [x] 6.4 Configure environment variables for production (Supabase URLs, keys)
  - [x] 6.5 Start services with `docker-compose up -d` and verify external access 