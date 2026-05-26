#!/bin/bash

# Setup script for Git workflow, hooks, and tooling
# Run this after cloning the repository

set -e

echo "🚀 Setting up Bismuth Git workflow..."

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

# Check if we're in the right directory
if [ ! -f "package.json" ]; then
    echo -e "${RED}❌ Error: package.json not found. Run this script from the project root.${NC}"
    exit 1
fi

# Check prerequisites
echo "📋 Checking prerequisites..."

# Check Node.js
if ! command -v node &> /dev/null; then
    echo -e "${RED}❌ Node.js not found. Please install Node.js 20+${NC}"
    exit 1
fi
echo -e "${GREEN}✅ Node.js $(node --version)${NC}"

# Check pnpm
if ! command -v pnpm &> /dev/null; then
    echo -e "${YELLOW}⚠️  pnpm not found. Installing...${NC}"
    npm install -g pnpm
fi
echo -e "${GREEN}✅ pnpm $(pnpm --version)${NC}"

# Check Rust
if ! command -v cargo &> /dev/null; then
    echo -e "${RED}❌ Rust not found. Please install Rust 1.75+${NC}"
    echo "Visit: https://rustup.rs/"
    exit 1
fi
echo -e "${GREEN}✅ Rust $(rustc --version)${NC}"

# Check Git
if ! command -v git &> /dev/null; then
    echo -e "${RED}❌ Git not found. Please install Git 2.40+${NC}"
    exit 1
fi
echo -e "${GREEN}✅ Git $(git --version)${NC}"

# Install dependencies
echo ""
echo "📦 Installing dependencies..."
pnpm install

# Install Rust dependencies
echo ""
echo "📦 Installing Rust dependencies..."
cd src-tauri
cargo build
cd ..

# Setup Husky
echo ""
echo "🪝 Setting up Git hooks with Husky..."
pnpm husky install

# Make hooks executable
chmod +x .husky/pre-commit
chmod +x .husky/commit-msg
chmod +x .husky/pre-push

echo -e "${GREEN}✅ Git hooks installed${NC}"

# Configure Git (optional)
echo ""
echo "⚙️  Configuring Git..."

# Check if user.name is set
if [ -z "$(git config user.name)" ]; then
    echo -e "${YELLOW}⚠️  Git user.name not set${NC}"
    read -p "Enter your name: " git_name
    git config user.name "$git_name"
fi

# Check if user.email is set
if [ -z "$(git config user.email)" ]; then
    echo -e "${YELLOW}⚠️  Git user.email not set${NC}"
    read -p "Enter your email: " git_email
    git config user.email "$git_email"
fi

# Enable commit signing (optional)
read -p "Enable GPG commit signing? (y/N): " enable_signing
if [[ $enable_signing =~ ^[Yy]$ ]]; then
    if command -v gpg &> /dev/null; then
        echo "Available GPG keys:"
        gpg --list-secret-keys --keyid-format=long
        read -p "Enter your GPG key ID: " gpg_key
        git config user.signingkey "$gpg_key"
        git config commit.gpgsign true
        echo -e "${GREEN}✅ GPG signing enabled${NC}"
    else
        echo -e "${YELLOW}⚠️  GPG not found. Skipping signing setup.${NC}"
    fi
fi

# Set default branch
git config init.defaultBranch main

# Set pull strategy
git config pull.rebase false

# Enable auto-stash for rebase
git config rebase.autoStash true

echo -e "${GREEN}✅ Git configured${NC}"

# Verify setup
echo ""
echo "🔍 Verifying setup..."

# Test pre-commit hook
echo "Testing pre-commit hook..."
if [ -x .husky/pre-commit ]; then
    echo -e "${GREEN}✅ Pre-commit hook is executable${NC}"
else
    echo -e "${RED}❌ Pre-commit hook is not executable${NC}"
    exit 1
fi

# Test commitlint
echo "Testing commitlint..."
if pnpm exec commitlint --version &> /dev/null; then
    echo -e "${GREEN}✅ Commitlint installed${NC}"
else
    echo -e "${RED}❌ Commitlint not found${NC}"
    exit 1
fi

# Test lint-staged
echo "Testing lint-staged..."
if pnpm exec lint-staged --version &> /dev/null; then
    echo -e "${GREEN}✅ Lint-staged installed${NC}"
else
    echo -e "${RED}❌ Lint-staged not found${NC}"
    exit 1
fi

# Summary
echo ""
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo -e "${GREEN}✅ Setup complete!${NC}"
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo ""
echo "📚 Next steps:"
echo "  1. Read CONTRIBUTING.md for workflow guidelines"
echo "  2. Read docs/GIT_WORKFLOW.md for detailed Git instructions"
echo "  3. Create a feature branch: git checkout -b feature/your-feature"
echo "  4. Make changes and commit: git commit -m 'feat: your feature'"
echo ""
echo "🔗 Useful commands:"
echo "  pnpm test          - Run tests"
echo "  pnpm lint          - Run linters"
echo "  pnpm format        - Format code"
echo "  cargo test         - Run Rust tests"
echo "  cargo clippy       - Run Rust linter"
echo ""
echo "🪝 Git hooks enabled:"
echo "  ✅ pre-commit  - Runs linters and formatters"
echo "  ✅ commit-msg  - Validates commit message format"
echo "  ✅ pre-push    - Runs tests before push"
echo ""
echo -e "${GREEN}Happy coding! 🚀${NC}"
