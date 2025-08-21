#!/bin/bash
set -e

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Helper functions
log_info() {
    echo -e "${BLUE}ℹ️  $1${NC}"
}

log_success() {
    echo -e "${GREEN}✅ $1${NC}"
}

log_warning() {
    echo -e "${YELLOW}⚠️  $1${NC}"
}

log_error() {
    echo -e "${RED}❌ $1${NC}"
}

# Check if command exists
command_exists() {
    command -v "$1" >/dev/null 2>&1
}

# Main setup function
main() {
    log_info "Setting up Outfitter monorepo development environment..."

    # Check Node.js version
    if command_exists node; then
        NODE_VERSION=$(node --version | cut -d'v' -f2)
        REQUIRED_NODE="20"
        if [ "$(printf '%s\n' "$REQUIRED_NODE" "$NODE_VERSION" | sort -V | head -n1)" != "$REQUIRED_NODE" ]; then
            log_error "Node.js version $NODE_VERSION is too old. Please install Node.js >= $REQUIRED_NODE"
            exit 1
        fi
        log_success "Node.js $NODE_VERSION detected"
    else
        log_error "Node.js not found. Please install Node.js >= 20"
        exit 1
    fi

    # Install Bun if not present
    if ! command_exists bun; then
        log_info "Installing Bun..."
        curl -fsSL https://bun.sh/install | bash
        export PATH="$HOME/.bun/bin:$PATH"
        log_success "Bun installed"
    else
        log_success "Bun $(bun --version) detected"
    fi

    # Install global development tools
    log_info "Installing global development tools..."

    # Install Wrangler (Cloudflare Workers CLI)
    if ! command_exists wrangler; then
        log_info "Installing Wrangler..."
        bun add -g wrangler
        log_success "Wrangler installed"
    else
        log_success "Wrangler $(wrangler --version | head -n1) detected"
    fi

    # Install Graphite CLI
    if ! command_exists gt; then
        log_info "Installing Graphite CLI..."
        npm install -g @withgraphite/graphite-cli
        log_success "Graphite CLI installed"
    else
        log_success "Graphite CLI $(gt --version) detected"
    fi

    # Configure Graphite to use batcat as pager
    if command_exists gt && command_exists batcat; then
        gt user pager --set batcat >/dev/null 2>&1 || true
        log_success "Graphite configured to use bat as pager"
    fi

    # Install other useful global tools
    log_info "Installing additional development tools..."
    bun add -g @biomejs/biome prettier markdownlint-cli2

    # Install bat (better cat with syntax highlighting)
    if ! command_exists batcat && ! command_exists bat; then
        log_info "Installing bat..."
        sudo apt install bat -y >/dev/null 2>&1 || log_warning "Could not install bat"
        if command_exists batcat; then
            echo 'alias bat="batcat"' >> ~/.bashrc
            log_success "bat installed (available as batcat and bat alias)"
        fi
    else
        log_success "bat already available"
    fi

    # Install project dependencies
    log_info "Installing project dependencies..."
    bun install
    log_success "Dependencies installed"

    # Set up direnv if available
    if command_exists direnv; then
        if [ -f ".envrc" ]; then
            log_info "Setting up direnv..."
            direnv allow
            log_success "direnv configured"
        fi
    else
        log_warning "direnv not found. Environment variables from .envrc won't be automatically loaded."
        log_info "Install direnv for automatic environment variable loading: https://direnv.net/"
    fi

    # Verify setup
    log_info "Verifying setup..."

    # Check if linting works
    if bun run lint:md >/dev/null 2>&1; then
        log_success "Markdown linting works"
    else
        log_warning "Markdown linting has issues"
    fi

    # Check TypeScript
    if bun run type-check >/dev/null 2>&1; then
        log_success "TypeScript checking works"
    else
        log_warning "TypeScript checking has issues"
    fi

    # Check CLI tool
    if cd packages/cli && bun run dev --help >/dev/null 2>&1; then
        log_success "CLI tool works"
        cd ../..
    else
        log_warning "CLI tool has issues"
        cd ../.. 2>/dev/null || true
    fi

    echo ""
    log_success "Setup complete! 🎉"
    echo ""
    log_info "Next steps:"
    echo "  • Run 'bun run dev' in packages/cli to use the Outfitter CLI"
    echo "  • Run 'bun run lint:md' to lint markdown files"
    echo "  • Run 'bun run type-check' to check TypeScript"
    echo "  • Use 'gt' for Graphite workflow management"
    echo "  • Use 'wrangler' for Cloudflare Workers development"
    echo ""

    if [ -f ".envrc" ] && command_exists direnv; then
        log_info "Environment variables will be automatically loaded when you cd into this directory"
    fi
}

# Run main function
main "$@"
