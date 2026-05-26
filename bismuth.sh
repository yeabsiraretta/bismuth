#!/usr/bin/env bash

# Bismuth Development Script
# Combines common development, build, and run commands

set -e  # Exit on error

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Helper functions
print_header() {
    echo -e "${BLUE}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${NC}"
    echo -e "${BLUE}  $1${NC}"
    echo -e "${BLUE}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${NC}"
}

print_success() {
    echo -e "${GREEN}✓ $1${NC}"
}

print_error() {
    echo -e "${RED}✗ $1${NC}"
}

print_info() {
    echo -e "${YELLOW}ℹ $1${NC}"
}

# Check if pnpm is installed
check_pnpm() {
    if ! command -v pnpm &> /dev/null; then
        print_error "pnpm is not installed. Please install it first:"
        echo "  npm install -g pnpm"
        exit 1
    fi
}

# Show usage
show_usage() {
    cat << EOF
${BLUE}Bismuth Development Script${NC}

${YELLOW}Usage:${NC}
  ./bismuth.sh [command]

${YELLOW}Commands:${NC}

  ${GREEN}Development:${NC}
    dev           Start Tauri development server (desktop app)
    dev:web       Start Vite development server (web only)
    start         Alias for 'dev'

  ${GREEN}Building:${NC}
    build         Build web assets only
    build:all     Build both web and desktop app
    build:desktop Build desktop app only
    
  ${GREEN}Testing:${NC}
    test          Run unit tests in watch mode
    test:ci       Run unit tests once with coverage
    test:ui       Run tests with UI
    e2e           Run end-to-end tests
    e2e:ui        Run e2e tests with UI
    e2e:debug     Debug e2e tests

  ${GREEN}Code Quality:${NC}
    check         Run all checks (format, lint, type-check, tests)
    fix           Auto-fix formatting and linting issues
    verify        Run checks and build (pre-commit simulation)
    lint          Run ESLint
    format        Format code with Prettier
    type-check    Run Svelte type checking

  ${GREEN}Maintenance:${NC}
    setup         Install dependencies and setup hooks
    clean         Clean build artifacts
    clean:all     Clean everything and reinstall dependencies
    
  ${GREEN}Git:${NC}
    commit        Interactive commit with commitizen

  ${GREEN}Release:${NC}
    release       Create a new release (auto-versioning)
    release:patch Create a patch release (0.0.x)
    release:minor Create a minor release (0.x.0)
    release:major Create a major release (x.0.0)

  ${GREEN}Help:${NC}
    help          Show this help message

${YELLOW}Examples:${NC}
  ./bismuth.sh dev              # Start development
  ./bismuth.sh build:all        # Build everything
  ./bismuth.sh check            # Run all quality checks
  ./bismuth.sh clean && ./bismuth.sh setup  # Fresh start

EOF
}

# Main command handler
case "${1:-help}" in
    # Development
    dev|start)
        print_header "Starting Bismuth Development Server"
        check_pnpm
        pnpm run start
        ;;
    
    dev:web|start:web)
        print_header "Starting Web Development Server"
        check_pnpm
        pnpm run start:web
        ;;

    # Building
    build)
        print_header "Building Web Assets"
        check_pnpm
        pnpm run build:web
        print_success "Web build complete!"
        ;;
    
    build:all)
        print_header "Building Bismuth (Web + Desktop)"
        check_pnpm
        print_info "Building web assets..."
        pnpm run build:web
        print_success "Web build complete!"
        print_info "Building desktop app..."
        pnpm run build:desktop
        print_success "Desktop build complete!"
        ;;
    
    build:desktop)
        print_header "Building Desktop App"
        check_pnpm
        pnpm run build:desktop
        print_success "Desktop build complete!"
        ;;

    # Testing
    test)
        print_header "Running Unit Tests (Watch Mode)"
        check_pnpm
        pnpm run test
        ;;
    
    test:ci)
        print_header "Running Unit Tests (CI Mode)"
        check_pnpm
        pnpm run test:ci
        print_success "Tests passed!"
        ;;
    
    test:ui)
        print_header "Running Tests with UI"
        check_pnpm
        pnpm run test:ui
        ;;
    
    e2e)
        print_header "Running E2E Tests"
        check_pnpm
        pnpm run e2e
        print_success "E2E tests passed!"
        ;;
    
    e2e:ui)
        print_header "Running E2E Tests with UI"
        check_pnpm
        pnpm run e2e:ui
        ;;
    
    e2e:debug)
        print_header "Debugging E2E Tests"
        check_pnpm
        pnpm run e2e:debug
        ;;

    # Code Quality
    check)
        print_header "Running All Quality Checks"
        check_pnpm
        print_info "Checking code formatting..."
        pnpm run format:check
        print_success "Format check passed!"
        
        print_info "Running linter..."
        pnpm run lint
        print_success "Lint check passed!"
        
        print_info "Running type checker..."
        pnpm run type-check
        print_success "Type check passed!"
        
        print_info "Running tests..."
        pnpm run test:ci
        print_success "All checks passed!"
        ;;
    
    fix)
        print_header "Auto-fixing Code Issues"
        check_pnpm
        print_info "Formatting code..."
        pnpm run format
        print_info "Fixing linting issues..."
        pnpm run lint:fix
        print_success "Code fixed!"
        ;;
    
    verify)
        print_header "Verifying Build (Pre-commit Simulation)"
        check_pnpm
        print_info "Running checks..."
        pnpm run check
        print_info "Building..."
        pnpm run build
        print_success "Verification complete!"
        ;;
    
    lint)
        print_header "Running ESLint"
        check_pnpm
        pnpm run lint
        print_success "Lint check passed!"
        ;;
    
    format)
        print_header "Formatting Code"
        check_pnpm
        pnpm run format
        print_success "Code formatted!"
        ;;
    
    type-check)
        print_header "Running Type Checker"
        check_pnpm
        pnpm run type-check
        print_success "Type check passed!"
        ;;

    # Maintenance
    setup)
        print_header "Setting Up Bismuth"
        check_pnpm
        print_info "Installing dependencies..."
        pnpm install
        print_info "Setting up Git hooks..."
        pnpm run prepare
        print_success "Setup complete!"
        ;;
    
    clean)
        print_header "Cleaning Build Artifacts"
        pnpm run clean
        print_success "Clean complete!"
        ;;
    
    clean:all)
        print_header "Deep Clean and Reinstall"
        print_info "Removing all artifacts and dependencies..."
        pnpm run clean:all
        print_success "Deep clean complete!"
        ;;

    # Git
    commit)
        print_header "Interactive Commit"
        check_pnpm
        pnpm run commit
        ;;

    # Release
    release)
        print_header "Creating Release"
        check_pnpm
        pnpm run release
        print_success "Release created!"
        ;;
    
    release:patch)
        print_header "Creating Patch Release"
        check_pnpm
        pnpm run release:patch
        print_success "Patch release created!"
        ;;
    
    release:minor)
        print_header "Creating Minor Release"
        check_pnpm
        pnpm run release:minor
        print_success "Minor release created!"
        ;;
    
    release:major)
        print_header "Creating Major Release"
        check_pnpm
        pnpm run release:major
        print_success "Major release created!"
        ;;

    # Help
    help|--help|-h)
        show_usage
        ;;

    *)
        print_error "Unknown command: $1"
        echo ""
        show_usage
        exit 1
        ;;
esac
