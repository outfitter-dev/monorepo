---
slug: github-actions
title: 'GitHub Actions Patterns'
description: 'Production-ready CI/CD workflows for GitHub Actions.'
type: pattern
---

# GitHub Actions Patterns

Production-ready CI/CD workflows for GitHub Actions.

## Related Documentation

- [Git Hooks](./git-hooks.md) - Local automation
- [Security Scanning](./security-scanning.md) - Security integration
- [Testing Standards](../standards/testing-standards.md) - Test automation
- [Deployment Standards](../standards/deployment-standards.md) - Deployment
  practices

## Core Workflow Structure

### Modern CI Pipeline

```yaml
name: CI Pipeline

on:
  push:
    branches: [main, develop]
  pull_request:
    branches: [main]
    types: [opened, synchronize, reopened]
  merge_group:
    types: [checks_requested]

# Cancel in-progress runs for the same PR/branch
concurrency:
  group: ${{ github.workflow }}-${{ github.event.pull_request.number || github.ref }}
  cancel-in-progress: true

# Restrict permissions for security
permissions:
  contents: read
  checks: write
  pull-requests: write
  actions: read

jobs:
  test:
    name: Test (Node ${{ matrix.node-version }})
    runs-on: ${{ matrix.os }}
    timeout-minutes: 15

    strategy:
      fail-fast: false
      matrix:
        os: [ubuntu-latest]
        node-version: [18, 20, 22]
        include:
          - os: ubuntu-latest
            node-version: 20
            coverage: true

    steps:
      - name: Checkout code
        uses: actions/checkout@v4
        with:
          persist-credentials: false
          fetch-depth: 0 # For proper git history

      - name: Setup pnpm
        uses: pnpm/action-setup@v4
        with:
          run_install: false

      - name: Setup Node.js
        uses: actions/setup-node@v4
        with:
          node-version: ${{ matrix.node-version }}
          cache: 'pnpm'

      - name: Get pnpm store directory
        shell: bash
        run: |
          echo "STORE_PATH=$(pnpm store path --silent)" >> $GITHUB_ENV

      - name: Setup pnpm cache
        uses: actions/cache@v4
        with:
          path: ${{ env.STORE_PATH }}
          key: ${{ runner.os }}-pnpm-store-${{ hashFiles('**/pnpm-lock.yaml') }}
          restore-keys: |
            ${{ runner.os }}-pnpm-store-

      - name: Install dependencies
        run: pnpm install --frozen-lockfile --prefer-offline

      - name: Type check
        run: pnpm run typecheck

      - name: Lint
        run: pnpm run lint

      - name: Run tests
        run: pnpm test -- --coverage=${{ matrix.coverage || false }}

      - name: Upload coverage
        if: matrix.coverage
        uses: codecov/codecov-action@v4
        with:
          token: ${{ secrets.CODECOV_TOKEN }}
          flags: unittests
          fail_ci_if_error: true
```

## Security Scanning

### Comprehensive Security Workflow

```yaml
name: Security Scan

on:
  push:
    branches: [main]
  pull_request:
    branches: [main]
  schedule:
    - cron: '0 8 * * MON' # Weekly on Monday
  workflow_dispatch: # Manual trigger

jobs:
  security-scan:
    name: Security Scan
    runs-on: ubuntu-latest
    permissions:
      contents: read
      security-events: write
      actions: read

    steps:
      - name: Checkout code
        uses: actions/checkout@v4
        with:
          fetch-depth: 0 # Full history for better analysis

      - name: Run Trivy vulnerability scanner
        uses: aquasecurity/trivy-action@master
        with:
          scan-type: 'fs'
          scan-ref: '.'
          format: 'sarif'
          output: 'trivy-results.sarif'
          severity: 'CRITICAL,HIGH,MEDIUM'
          ignore-unfixed: true
          vuln-type: 'os,library'

      - name: Upload Trivy scan results
        uses: github/codeql-action/upload-sarif@v3
        if: always()
        with:
          sarif_file: 'trivy-results.sarif'
          category: 'trivy'

      - name: Run OSV Scanner
        uses: google/osv-scanner-action@v1
        with:
          scan-args: |-
            --skip-git
            --recursive
            --format=sarif
            --output=osv-results.sarif
            ./

      - name: Upload OSV results
        uses: github/codeql-action/upload-sarif@v3
        if: always()
        with:
          sarif_file: 'osv-results.sarif'
          category: 'osv-scanner'

      - name: Dependency Review
        if: github.event_name == 'pull_request'
        uses: actions/dependency-review-action@v4
        with:
          fail-on-severity: high
          deny-licenses: GPL-3.0, AGPL-3.0
```

## Deployment Workflows

### Modern Production Deployment

```yaml
name: Deploy to Production

on:
  push:
    tags:
      - 'v*'
  workflow_dispatch:
    inputs:
      environment:
        description: 'Target environment'
        required: true
        default: 'production'
        type: choice
        options:
          - production
          - staging
      dry-run:
        description: 'Perform a dry run'
        type: boolean
        default: false

jobs:
  build:
    name: Build
    runs-on: ubuntu-latest
    outputs:
      image-tag: ${{ steps.meta.outputs.tags }}
      image-digest: ${{ steps.build.outputs.digest }}

    steps:
      - name: Checkout code
        uses: actions/checkout@v4

      - name: Set up Docker Buildx
        uses: docker/setup-buildx-action@v3

      - name: Log in to Container Registry
        uses: docker/login-action@v3
        with:
          registry: ${{ vars.REGISTRY_URL }}
          username: ${{ github.actor }}
          password: ${{ secrets.GITHUB_TOKEN }}

      - name: Extract metadata
        id: meta
        uses: docker/metadata-action@v5
        with:
          images: ${{ vars.REGISTRY_URL }}/${{ github.repository }}
          tags: |
            type=ref,event=branch
            type=ref,event=pr
            type=semver,pattern={{version}}
            type=semver,pattern={{major}}.{{minor}}
            type=sha,prefix={{branch}}-

      - name: Build and push Docker image
        id: build
        uses: docker/build-push-action@v5
        with:
          context: .
          push: true
          tags: ${{ steps.meta.outputs.tags }}
          labels: ${{ steps.meta.outputs.labels }}
          cache-from: type=gha
          cache-to: type=gha,mode=max
          platforms: linux/amd64,linux/arm64
          provenance: true
          sbom: true

  deploy:
    name: Deploy to ${{ github.event.inputs.environment || 'production' }}
    needs: build
    runs-on: ubuntu-latest
    environment:
      name: ${{ github.event.inputs.environment || 'production' }}
      url: ${{ steps.deploy.outputs.url }}

    steps:
      - name: Checkout code
        uses: actions/checkout@v4

      - name: Configure AWS credentials
        uses: aws-actions/configure-aws-credentials@v4
        with:
          role-to-assume: ${{ secrets.AWS_ROLE_ARN }}
          role-session-name: GitHubActions
          aws-region: ${{ vars.AWS_REGION }}

      - name: Deploy to ECS
        id: deploy
        run: |
          # Update task definition
          TASK_DEF=$(aws ecs describe-task-definition \
            --task-definition ${{ vars.ECS_TASK_FAMILY }} \
            --query 'taskDefinition' \
            --output json)

          NEW_TASK_DEF=$(echo $TASK_DEF | jq \
            --arg IMAGE "${{ needs.build.outputs.image-tag }}" \
            '.containerDefinitions[0].image = $IMAGE | del(.taskDefinitionArn, .revision, .status, .requiresAttributes, .compatibilities, .registeredAt, .registeredBy)')

          # Register new task definition
          TASK_ARN=$(aws ecs register-task-definition \
            --cli-input-json "$NEW_TASK_DEF" \
            --query 'taskDefinition.taskDefinitionArn' \
            --output text)

          # Update service (or dry run)
          if [[ "${{ github.event.inputs.dry-run }}" == "true" ]]; then
            echo "DRY RUN: Would update service with $TASK_ARN"
          else
            aws ecs update-service \
              --cluster ${{ vars.ECS_CLUSTER }} \
              --service ${{ vars.ECS_SERVICE }} \
              --task-definition $TASK_ARN \
              --force-new-deployment
          fi

          echo "url=https://${{ vars.DOMAIN }}" >> $GITHUB_OUTPUT
```

## Advanced Patterns

### Dynamic Matrix Strategy

```yaml
jobs:
  setup:
    runs-on: ubuntu-latest
    outputs:
      matrix: ${{ steps.set-matrix.outputs.matrix }}
    steps:
      - uses: actions/checkout@v4
      - id: set-matrix
        run: |
          # Dynamically generate matrix based on files changed
          if [[ "${{ github.event_name }}" == "pull_request" ]]; then
            # Limited matrix for PRs
            echo 'matrix={"os":["ubuntu-latest"],"node":[20]}' >> $GITHUB_OUTPUT
          else
            # Full matrix for main branch
            echo 'matrix={"os":["ubuntu-latest","windows-latest","macos-latest"],"node":[18,20,22]}' >> $GITHUB_OUTPUT
          fi

  test:
    needs: setup
    strategy:
      fail-fast: false
      matrix: ${{ fromJSON(needs.setup.outputs.matrix) }}

    runs-on: ${{ matrix.os }}
    timeout-minutes: 30

    steps:
      - uses: actions/checkout@v4

      - uses: actions/setup-node@v4
        with:
          node-version: ${{ matrix.node }}

      - name: Cache dependencies
        uses: actions/cache@v4
        with:
          path: |
            ~/.npm
            ~/.cache
          key: ${{ runner.os }}-node-${{ matrix.node }}-${{
            hashFiles('**/package-lock.json') }}

      - name: Install and test
        run: |
          npm ci
          npm test -- --reporter=github-actions
```

### Reusable Workflows

```yaml
# .github/workflows/reusable-test.yml
name: Reusable Test Workflow

on:
  workflow_call:
    inputs:
      node-version:
        required: false
        type: string
        default: '20'
      environment:
        required: false
        type: string
        default: 'test'
      coverage:
        required: false
        type: boolean
        default: true
      package-manager:
        required: false
        type: string
        default: 'pnpm'
        enum: ['npm', 'yarn', 'pnpm']
    secrets:
      npm-token:
        required: false
      codecov-token:
        required: false
    outputs:
      coverage-percentage:
        description: 'Test coverage percentage'
        value: ${{ jobs.test.outputs.coverage }}

jobs:
  test:
    runs-on: ubuntu-latest
    environment: ${{ inputs.environment }}
    outputs:
      coverage: ${{ steps.coverage.outputs.percentage }}

    steps:
      - uses: actions/checkout@v4

      - name: Setup package manager
        if: inputs.package-manager == 'pnpm'
        uses: pnpm/action-setup@v4

      - uses: actions/setup-node@v4
        with:
          node-version: ${{ inputs.node-version }}
          cache: ${{ inputs.package-manager }}
          registry-url: 'https://registry.npmjs.org'

      - name: Install dependencies
        run: |
          if [[ "${{ inputs.package-manager }}" == "pnpm" ]]; then
            pnpm install --frozen-lockfile
          elif [[ "${{ inputs.package-manager }}" == "yarn" ]]; then
            yarn install --frozen-lockfile
          else
            npm ci
          fi
        env:
          NODE_AUTH_TOKEN: ${{ secrets.npm-token }}

      - name: Run tests
        run: |
          ${{ inputs.package-manager }} test -- --coverage=${{ inputs.coverage }}

      - name: Extract coverage
        id: coverage
        if: inputs.coverage
        run: |
          COVERAGE=$(cat coverage/coverage-summary.json | jq '.total.lines.pct')
          echo "percentage=$COVERAGE" >> $GITHUB_OUTPUT

      - name: Upload coverage
        if: inputs.coverage && secrets.codecov-token
        uses: codecov/codecov-action@v4
        with:
          token: ${{ secrets.codecov-token }}
```

### Using Reusable Workflows

```yaml
name: CI

on: [push, pull_request]

jobs:
  test-node-20:
    uses: ./.github/workflows/reusable-test.yml
    with:
      node-version: '20'
      coverage: true
    secrets:
      npm-token: ${{ secrets.NPM_TOKEN }}
      codecov-token: ${{ secrets.CODECOV_TOKEN }}

  test-node-18:
    uses: ./.github/workflows/reusable-test.yml
    with:
      node-version: '18'
      coverage: false
```

### Composite Actions

```yaml
# .github/actions/setup-project/action.yml
name: 'Setup Project'
description: 'Setup Node.js and install dependencies with caching'

inputs:
  node-version:
    description: 'Node.js version'
    required: false
    default: '20'
  package-manager:
    description: 'Package manager (npm, yarn, pnpm)'
    required: false
    default: 'pnpm'
  install-args:
    description: 'Additional install arguments'
    required: false
    default: ''

outputs:
  cache-hit:
    description: 'Whether the cache was hit'
    value: ${{ steps.cache.outputs.cache-hit }}

runs:
  using: 'composite'
  steps:
    - name: Detect package manager
      id: detect-pm
      shell: bash
      run: |
        if [[ -f "pnpm-lock.yaml" ]]; then
          echo "manager=pnpm" >> $GITHUB_OUTPUT
          echo "lockfile=pnpm-lock.yaml" >> $GITHUB_OUTPUT
        elif [[ -f "yarn.lock" ]]; then
          echo "manager=yarn" >> $GITHUB_OUTPUT
          echo "lockfile=yarn.lock" >> $GITHUB_OUTPUT
        else
          echo "manager=npm" >> $GITHUB_OUTPUT
          echo "lockfile=package-lock.json" >> $GITHUB_OUTPUT
        fi

    - name: Setup pnpm
      if: steps.detect-pm.outputs.manager == 'pnpm'
      uses: pnpm/action-setup@v4

    - name: Setup Node.js
      uses: actions/setup-node@v4
      with:
        node-version: ${{ inputs.node-version }}
        cache: ${{ steps.detect-pm.outputs.manager }}

    - name: Get cache directory
      id: cache-dir
      shell: bash
      run: |
        if [[ "${{ steps.detect-pm.outputs.manager }}" == "pnpm" ]]; then
          echo "path=$(pnpm store path)" >> $GITHUB_OUTPUT
        elif [[ "${{ steps.detect-pm.outputs.manager }}" == "yarn" ]]; then
          echo "path=$(yarn cache dir)" >> $GITHUB_OUTPUT
        else
          echo "path=~/.npm" >> $GITHUB_OUTPUT
        fi

    - name: Cache dependencies
      id: cache
      uses: actions/cache@v4
      with:
        path: |
          ${{ steps.cache-dir.outputs.path }}
          node_modules
          .next/cache
        key: ${{ runner.os }}-${{ steps.detect-pm.outputs.manager }}-${{
          hashFiles(format('**/{0}', steps.detect-pm.outputs.lockfile)) }}
        restore-keys: |
          ${{ runner.os }}-${{ steps.detect-pm.outputs.manager }}-

    - name: Install dependencies
      shell: bash
      run: |
        if [[ "${{ steps.detect-pm.outputs.manager }}" == "pnpm" ]]; then
          pnpm install --frozen-lockfile ${{ inputs.install-args }}
        elif [[ "${{ steps.detect-pm.outputs.manager }}" == "yarn" ]]; then
          yarn install --frozen-lockfile ${{ inputs.install-args }}
        else
          npm ci ${{ inputs.install-args }}
        fi

    - name: Verify installation
      shell: bash
      run: |
        echo "Package manager: ${{ steps.detect-pm.outputs.manager }}"
        echo "Node version: $(node -v)"
        echo "NPM version: $(npm -v)"
        ${{ steps.detect-pm.outputs.manager }} ls --depth=0 || true
```

## Caching Strategies

### Advanced Caching Patterns

```yaml
jobs:
  build:
    runs-on: ubuntu-latest

    steps:
      - uses: actions/checkout@v4

      # Restore multiple caches
      - name: Restore caches
        uses: actions/cache/restore@v4
        id: cache
        with:
          path: |
            ~/.pnpm-store
            node_modules
            .next/cache
            .turbo
            .eslintcache
          key: ${{ runner.os }}-build-${{ hashFiles('**/pnpm-lock.yaml') }}-${{
            hashFiles('**.[jt]s', '**.[jt]sx') }}
          restore-keys: |
            ${{ runner.os }}-build-${{ hashFiles('**/pnpm-lock.yaml') }}-
            ${{ runner.os }}-build-

      # Setup with built-in caching
      - uses: pnpm/action-setup@v4
      - uses: actions/setup-node@v4
        with:
          node-version: '20'
          cache: 'pnpm'

      - name: Install dependencies
        if: steps.cache.outputs.cache-hit != 'true'
        run: pnpm install --frozen-lockfile

      - name: Build with Turbo
        run: |
          # Use remote caching with Turbo
          pnpm turbo build --cache-dir=.turbo --api="${{ secrets.TURBO_API }}" --token="${{ secrets.TURBO_TOKEN }}" --team="${{ vars.TURBO_TEAM }}"

      # Save caches
      - name: Save caches
        uses: actions/cache/save@v4
        if: always()
        with:
          path: |
            ~/.pnpm-store
            node_modules
            .next/cache
            .turbo
            .eslintcache
          key: ${{ steps.cache.outputs.cache-primary-key }}

      # Docker layer caching with multiple strategies
      - name: Set up Docker Buildx
        uses: docker/setup-buildx-action@v3

      - name: Build Docker image
        uses: docker/build-push-action@v5
        with:
          context: .
          push: false
          tags: |
            app:latest
            app:${{ github.sha }}
          cache-from: |
            type=gha
            type=registry,ref=app:buildcache
            type=registry,ref=app:latest
          cache-to: |
            type=gha,mode=max
            type=registry,ref=app:buildcache,mode=max
          build-args: |
            BUILDKIT_INLINE_CACHE=1
```

### Intelligent Cache Invalidation

```yaml
jobs:
  smart-cache:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4

      - name: Generate cache keys
        id: cache-keys
        run: |
          # Generate multiple cache keys for fallback
          echo "deps-hash=${{ hashFiles('**/pnpm-lock.yaml') }}" >> $GITHUB_OUTPUT
          echo "src-hash=${{ hashFiles('src/**/*.[jt]s', 'src/**/*.[jt]sx') }}" >> $GITHUB_OUTPUT
          echo "week=$(date +%Y-%U)" >> $GITHUB_OUTPUT
          echo "month=$(date +%Y-%m)" >> $GITHUB_OUTPUT

      - name: Cache with fallback
        uses: actions/cache@v4
        with:
          path: |
            node_modules
            .build-cache
          key: cache-${{ steps.cache-keys.outputs.deps-hash }}-${{
            steps.cache-keys.outputs.src-hash }}
          restore-keys: |
            cache-${{ steps.cache-keys.outputs.deps-hash }}-
            cache-${{ steps.cache-keys.outputs.week }}-
            cache-${{ steps.cache-keys.outputs.month }}-
            cache-
```

## Environment Management

### Environment-Specific Deployments

```yaml
jobs:
  deploy:
    runs-on: ubuntu-latest
    # Use GitHub Environments for approval and secrets
    environment:
      name: ${{ github.ref == 'refs/heads/main' && 'production' || 'staging' }}
      url: ${{ steps.deploy.outputs.url }}

    steps:
      - uses: actions/checkout@v4

      - name: Set environment variables
        run: |
          if [[ "${{ github.ref }}" == "refs/heads/main" ]]; then
            echo "DEPLOY_ENV=production" >> $GITHUB_ENV
            echo "API_URL=${{ vars.PROD_API_URL }}" >> $GITHUB_ENV
          else
            echo "DEPLOY_ENV=staging" >> $GITHUB_ENV
            echo "API_URL=${{ vars.STAGING_API_URL }}" >> $GITHUB_ENV
          fi

      - name: Deploy
        id: deploy
        run: |
          # Deploy based on environment
          ./deploy.sh $DEPLOY_ENV
          echo "url=https://$DEPLOY_ENV.example.com" >> $GITHUB_OUTPUT
```

## Conditional Execution

### Smart Job Skipping

```yaml
jobs:
  changes:
    runs-on: ubuntu-latest
    outputs:
      backend: ${{ steps.filter.outputs.backend }}
      frontend: ${{ steps.filter.outputs.frontend }}
      docs: ${{ steps.filter.outputs.docs }}

    steps:
      - uses: actions/checkout@v4
      - uses: dorny/paths-filter@v2
        id: filter
        with:
          filters: |
            backend:
              - 'backend/**'
              - 'package.json'
            frontend:
              - 'frontend/**'
              - 'package.json'
            docs:
              - 'docs/**'
              - '*.md'

  test-backend:
    needs: changes
    if: ${{ needs.changes.outputs.backend == 'true' }}
    runs-on: ubuntu-latest
    steps:
      - run: echo "Running backend tests..."

  test-frontend:
    needs: changes
    if: ${{ needs.changes.outputs.frontend == 'true' }}
    runs-on: ubuntu-latest
    steps:
      - run: echo "Running frontend tests..."
```

## Error Handling

### Retry Logic

```yaml
jobs:
  deploy:
    runs-on: ubuntu-latest

    steps:
      - uses: actions/checkout@v4

      - name: Deploy with retry
        uses: nick-fields/retry@v2
        with:
          timeout_minutes: 10
          max_attempts: 3
          retry_wait_seconds: 30
          command: |
            ./deploy.sh

      - name: Notify on failure
        if: failure()
        uses: 8398a7/action-slack@v3
        with:
          status: ${{ job.status }}
          webhook_url: ${{ secrets.SLACK_WEBHOOK }}
          text: 'Deployment failed after 3 attempts'
```

## Best Practices

1. **Security First**:

   - Pin actions to specific SHAs for security
   - Use OIDC for cloud authentication
   - Minimize permissions with least privilege
   - Enable Dependabot for action updates

2. **Performance Optimization**:

   - Use matrix builds strategically
   - Implement smart caching strategies
   - Cancel outdated workflow runs
   - Use `workflow_dispatch` for manual control

3. **Reliability**:

   - Set appropriate timeouts (job and step level)
   - Implement retry logic for flaky operations
   - Use `continue-on-error` for non-critical steps
   - Add health checks and smoke tests

4. **Cost Management**:

   - Use self-hosted runners for heavy workloads
   - Optimize matrix strategies
   - Clean up old artifacts and caches
   - Monitor Actions usage and set budgets

5. **Developer Experience**:

   - Provide clear job names and descriptions
   - Use job summaries for better visibility
   - Implement PR comments for results
   - Create reusable workflows for common tasks

6. **Maintenance**:
   - Regular security audits of workflows
   - Document complex workflows
   - Version your reusable workflows
   - Monitor and alert on workflow failures

## Example: Complete CI/CD Pipeline

```yaml
name: Complete CI/CD

on:
  push:
    branches: [main, develop]
  pull_request:
    types: [opened, synchronize, reopened]
  release:
    types: [published]

permissions:
  contents: read
  issues: write
  pull-requests: write

jobs:
  # Shared setup job
  setup:
    runs-on: ubuntu-latest
    outputs:
      should-deploy: ${{ steps.check.outputs.deploy }}
      affected-services: ${{ steps.check.outputs.services }}
    steps:
      - uses: actions/checkout@v4
      - id: check
        run: |
          # Determine what changed and what to deploy
          echo "deploy=${{ github.event_name == 'release' }}" >> $GITHUB_OUTPUT
          echo "services=[\"api\",\"web\"]" >> $GITHUB_OUTPUT

  # Parallel quality checks
  quality:
    needs: setup
    strategy:
      matrix:
        check: [lint, typecheck, test, security]
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4
      - uses: ./.github/actions/setup-project
      - run: pnpm run ${{ matrix.check }}

  # Build artifacts
  build:
    needs: quality
    strategy:
      matrix:
        service: ${{ fromJSON(needs.setup.outputs.affected-services) }}
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4
      - uses: ./.github/actions/setup-project
      - run: pnpm turbo build --filter=${{ matrix.service }}
      - uses: actions/upload-artifact@v4
        with:
          name: ${{ matrix.service }}-build
          path: apps/${{ matrix.service }}/dist

  # Deploy if needed
  deploy:
    if: needs.setup.outputs.should-deploy == 'true'
    needs: [setup, build]
    strategy:
      matrix:
        service: ${{ fromJSON(needs.setup.outputs.affected-services) }}
        environment: [staging, production]
        exclude:
          - environment: production
            service: ${{ github.event_name != 'release' && '*' || '' }}
    runs-on: ubuntu-latest
    environment: ${{ matrix.environment }}
    steps:
      - uses: actions/download-artifact@v4
        with:
          name: ${{ matrix.service }}-build
      - run: echo "Deploying ${{ matrix.service }} to ${{ matrix.environment }}"
```
