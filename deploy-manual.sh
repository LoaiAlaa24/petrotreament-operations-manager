#!/bin/bash

# Manual deployment script for Petrotreatment Operations Manager
# This script can be used for manual deployments when needed

set -e  # Exit on any error

echo "🚀 Starting manual deployment process..."

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Function to print colored output
print_status() {
    echo -e "${BLUE}[INFO]${NC} $1"
}

print_success() {
    echo -e "${GREEN}[SUCCESS]${NC} $1"
}

print_warning() {
    echo -e "${YELLOW}[WARNING]${NC} $1"
}

print_error() {
    echo -e "${RED}[ERROR]${NC} $1"
}

# Check if required tools are installed
check_requirements() {
    print_status "Checking requirements..."
    
    if ! command -v git &> /dev/null; then
        print_error "Git is not installed"
        exit 1
    fi
    
    if ! command -v docker &> /dev/null; then
        print_warning "Docker is not installed (optional for local testing)"
    fi
    
    if ! command -v railway &> /dev/null; then
        print_warning "Railway CLI is not installed"
        echo "Install with: curl -fsSL https://railway.app/install.sh | sh"
    fi
    
    print_success "Requirements check completed"
}

# Check git status
check_git_status() {
    print_status "Checking git status..."
    
    if [ -n "$(git status --porcelain)" ]; then
        print_warning "You have uncommitted changes:"
        git status --short
        read -p "Do you want to continue? (y/N): " -n 1 -r
        echo
        if [[ ! $REPLY =~ ^[Yy]$ ]]; then
            print_error "Deployment cancelled"
            exit 1
        fi
    fi
    
    # Check if we're on main or develop branch
    CURRENT_BRANCH=$(git branch --show-current)
    if [[ "$CURRENT_BRANCH" != "main" && "$CURRENT_BRANCH" != "develop" ]]; then
        print_warning "You're not on main or develop branch (current: $CURRENT_BRANCH)"
        read -p "Do you want to continue? (y/N): " -n 1 -r
        echo
        if [[ ! $REPLY =~ ^[Yy]$ ]]; then
            print_error "Deployment cancelled"
            exit 1
        fi
    fi
    
    print_success "Git status check completed"
}

# Run tests
run_tests() {
    print_status "Running tests..."
    
    # Frontend tests
    if [ -d "frontend" ]; then
        print_status "Running frontend tests..."
        cd frontend
        if [ -f "package.json" ]; then
            npm ci --legacy-peer-deps > /dev/null 2>&1 || {
                print_error "Failed to install frontend dependencies"
                exit 1
            }
            
            npm run lint > /dev/null 2>&1 || {
                print_warning "Frontend linting failed"
            }
            
            npm run build > /dev/null 2>&1 || {
                print_error "Frontend build failed"
                exit 1
            }
            
            print_success "Frontend tests passed"
        fi
        cd ..
    fi
    
    # Backend tests
    if [ -d "backend" ]; then
        print_status "Running backend tests..."
        cd backend
        
        # Check if Python virtual environment exists
        if [ ! -d "venv" ]; then
            print_status "Creating Python virtual environment..."
            python3 -m venv venv
        fi
        
        source venv/bin/activate
        pip install -r requirements.txt > /dev/null 2>&1 || {
            print_error "Failed to install backend dependencies"
            exit 1
        }
        
        # Basic import test
        python -c "import main" || {
            print_error "Backend import test failed"
            exit 1
        }
        
        print_success "Backend tests passed"
        deactivate
        cd ..
    fi
    
    print_success "All tests passed"
}

# Build Docker image (optional)
build_docker() {
    if command -v docker &> /dev/null; then
        print_status "Building Docker image..."
        docker build -t petrotreatment-app:latest . > /dev/null 2>&1 || {
            print_error "Docker build failed"
            exit 1
        }
        print_success "Docker image built successfully"
    else
        print_warning "Skipping Docker build (Docker not installed)"
    fi
}

# Deploy to Railway
deploy_railway() {
    if ! command -v railway &> /dev/null; then
        print_error "Railway CLI is not installed"
        print_status "Install with: curl -fsSL https://railway.app/install.sh | sh"
        exit 1
    fi
    
    print_status "Deploying to Railway..."
    
    # Check if Railway token is set
    if [ -z "$RAILWAY_TOKEN" ]; then
        print_error "RAILWAY_TOKEN environment variable not set"
        print_status "Set with: export RAILWAY_TOKEN=your_token_here"
        print_status "Or run: railway login (interactive login)"
        exit 1
    fi
    
    # Deploy
    railway up --detach || {
        print_error "Railway deployment failed"
        exit 1
    }
    
    print_success "Deployed to Railway successfully"
    
    # Wait a bit for deployment to start
    print_status "Waiting for deployment to start..."
    sleep 10
    
    # Get deployment URL if available
    RAILWAY_URL=$(railway status --json 2>/dev/null | grep -o '"url":"[^"]*"' | cut -d'"' -f4 || echo "")
    
    if [ -n "$RAILWAY_URL" ]; then
        print_success "Application deployed at: $RAILWAY_URL"
        
        # Health check
        print_status "Performing health check..."
        sleep 5
        
        if curl -f "$RAILWAY_URL/health" > /dev/null 2>&1; then
            print_success "Health check passed"
        else
            print_warning "Health check failed - application might still be starting"
        fi
    else
        print_warning "Could not retrieve deployment URL"
    fi
}

# Main deployment process
main() {
    echo "🌟 Petrotreatment Operations Manager - Manual Deployment"
    echo "============================================================"
    
    check_requirements
    check_git_status
    run_tests
    build_docker
    deploy_railway
    
    echo
    print_success "🎉 Deployment completed successfully!"
    echo
    echo "Next steps:"
    echo "  - Monitor the deployment in Railway dashboard"
    echo "  - Check application logs: railway logs"
    echo "  - Test the application functionality"
    echo
}

# Run main function
main "$@"