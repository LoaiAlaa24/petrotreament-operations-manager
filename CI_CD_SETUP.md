# CI/CD Setup Guide

## Overview

This project uses GitHub Actions for Continuous Integration and Continuous Deployment (CI/CD). The pipeline automatically tests, builds, and deploys the application when code is pushed to specific branches.

## Pipeline Structure

### Triggers
- **Push to `main` branch**: Triggers full CI/CD pipeline including production deployment
- **Push to `develop` branch**: Triggers CI/CD pipeline with staging deployment
- **Pull Requests to `main`**: Triggers testing and building (no deployment)

### Jobs

#### 1. Frontend Testing (`test-frontend`)
- Sets up Node.js environment
- Installs dependencies with npm
- Runs ESLint for code quality
- Performs TypeScript compilation and builds the React app
- Uploads build artifacts

#### 2. Backend Testing (`test-backend`)
- Sets up Python environment with PostgreSQL database
- Installs Python dependencies
- Runs pytest for backend API testing
- Tests database connectivity

#### 3. Docker Build (`build-docker`)
- Builds Docker image using the main Dockerfile
- Uses build cache for faster builds
- Validates that the application can be containerized

#### 4. Security Scanning (`security-scan`)
- Runs Trivy vulnerability scanner
- Scans for security issues in dependencies and code
- Uploads results to GitHub Security tab

#### 5. Production Deployment (`deploy-production`)
- **Trigger**: Only runs on `main` branch pushes
- Deploys to Railway using Railway CLI
- Performs health checks after deployment
- Sends notification on completion

#### 6. Staging Deployment (`deploy-staging`)
- **Trigger**: Only runs on `develop` branch pushes
- Deploys to Railway staging environment
- Allows testing changes before production

## Required GitHub Secrets

To enable the CI/CD pipeline, you need to set up the following secrets in your GitHub repository:

### Railway Deployment Secrets
```
RAILWAY_TOKEN          # Production Railway API token
RAILWAY_STAGING_TOKEN  # Staging Railway API token (optional)
PRODUCTION_URL         # Production application URL for health checks
STAGING_URL           # Staging application URL for health checks (optional)
```

### How to Add Secrets

1. Go to your GitHub repository
2. Navigate to **Settings** → **Secrets and variables** → **Actions**
3. Click **New repository secret**
4. Add each secret with its corresponding value

## Railway Setup

### Get Railway Token
1. Install Railway CLI: `curl -fsSL https://railway.app/install.sh | sh`
2. Login: `railway login`
3. Create a new token in Railway dashboard:
   - Go to your Railway dashboard
   - Navigate to Account Settings → API Tokens
   - Create a new token with appropriate permissions
4. Copy the token to GitHub secrets as `RAILWAY_TOKEN`

### Alternative: Project Token
1. In your Railway project dashboard
2. Go to Settings → Environment Variables  
3. Generate a deployment token for the specific project
4. Use this project-specific token for more secure deployments

### Production Deployment
1. Create a new Railway project for production
2. Connect your GitHub repository
3. Set environment variables in Railway dashboard
4. Note the deployment URL for health checks

### Staging Deployment (Optional)
1. Create another Railway project for staging
2. Use a separate token for staging: `RAILWAY_STAGING_TOKEN`
3. Set up with different environment variables

## Environment Variables

### Backend Environment Variables (Set in Railway)
```bash
DATABASE_URL=postgresql://user:password@host:port/dbname
SECRET_KEY=your-secret-key-here
ALGORITHM=HS256
ACCESS_TOKEN_EXPIRE_MINUTES=30
ENVIRONMENT=production
```

### Frontend Environment Variables
```bash
REACT_APP_API_URL=https://your-backend-url.railway.app
```

## Branching Strategy

### Main Branch (`main`)
- **Purpose**: Production-ready code
- **Deployment**: Automatic to production
- **Protection**: Require PR reviews, status checks

### Develop Branch (`develop`)
- **Purpose**: Integration of new features
- **Deployment**: Automatic to staging
- **Testing**: Full test suite runs

### Feature Branches
- **Naming**: `feature/description` or `fix/description`
- **Workflow**: Create PR to `develop` → merge to `develop` → PR to `main`

## Local Development

### Running Tests Locally

#### Frontend
```bash
cd frontend
npm install
npm run lint
npm run build
npm test
```

#### Backend
```bash
cd backend
pip install -r requirements.txt
pytest
```

### Docker Build
```bash
docker build -t petrotreatment-app .
docker run -p 8000:8000 petrotreatment-app
```

## Monitoring and Debugging

### GitHub Actions Logs
- View detailed logs in the **Actions** tab of your repository
- Each job shows real-time progress and error messages

### Common Issues

#### 1. Frontend Build Fails
- Check ESLint errors in the logs
- Ensure all TypeScript types are correct
- Verify all imports are valid

#### 2. Backend Tests Fail
- Check database connection
- Verify all required environment variables
- Review test output for specific failures

#### 3. Deployment Fails
- Verify Railway token is correct and has permissions
- Check Railway project configuration
- Ensure environment variables are set

#### 4. Health Check Fails
- Verify the application URL is correct
- Check if the application started successfully
- Review Railway deployment logs

### Debugging Commands

```bash
# Check Railway status
railway status

# View Railway logs
railway logs

# Check GitHub Actions status
gh run list

# View specific run details
gh run view <run-id>
```

## Security Best Practices

1. **Secrets Management**: Never commit secrets to code
2. **Dependency Scanning**: Trivy scans for vulnerabilities
3. **Access Control**: Use least-privilege principles for tokens
4. **Environment Separation**: Keep staging and production isolated

## Performance Optimizations

1. **Build Caching**: GitHub Actions cache speeds up builds
2. **Parallel Jobs**: Frontend and backend tests run simultaneously
3. **Artifact Sharing**: Build artifacts are reused across jobs
4. **Docker Layer Caching**: Reduces image build time

## Customization

### Adding New Tests
1. Add test files to respective directories
2. Update CI/CD workflow if needed
3. Ensure tests run in the pipeline

### Adding New Environments
1. Create new Railway project
2. Add environment-specific secrets
3. Create new deployment job in workflow

### Notifications
- Add Slack/Discord webhooks for deployment notifications
- Set up email alerts for failed deployments
- Create status badges for README

## Rollback Strategy

### Automatic Rollback
- Railway provides automatic rollback on failed health checks
- Previous deployment remains active if new deployment fails

### Manual Rollback
```bash
# Using Railway CLI
railway rollback <deployment-id>

# Using GitHub
git revert <commit-hash>
git push origin main
```

## Performance Monitoring

1. **Application Metrics**: Monitor in Railway dashboard
2. **GitHub Actions Metrics**: Track build times and success rates
3. **Error Tracking**: Set up application monitoring tools

## Next Steps

1. Set up GitHub repository secrets
2. Configure Railway projects
3. Test the pipeline with a small change
4. Monitor first deployment
5. Set up additional environments as needed

For support or questions, refer to:
- [GitHub Actions Documentation](https://docs.github.com/en/actions)
- [Railway Documentation](https://docs.railway.app/)
- [Docker Documentation](https://docs.docker.com/)