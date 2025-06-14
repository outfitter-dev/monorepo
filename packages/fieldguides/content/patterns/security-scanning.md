---
slug: security-scanning
title: 'Security Scanning in CI/CD'
description: 'Comprehensive security scanning patterns for CI/CD pipelines.'
type: pattern
---

# Security Scanning in CI/CD

Comprehensive security scanning patterns for CI/CD pipelines.

## Related Documentation

- [GitHub Actions](./github-actions.md) - CI/CD workflows
- [Git Hooks](./git-hooks.md) - Pre-commit security checks
- [Security Standards](../SECURITY.md) - Security baseline
- [Testing Standards](../standards/testing-standards.md) - Security testing
- [Configuration Standards](../standards/configuration-standards.md) - Secure
  configuration
- [Deployment Standards](../standards/deployment-standards.md) - Security in
  deployment

## Code Security Analysis

### CodeQL Advanced Setup

Advanced semantic code analysis with custom queries:

```yaml
name: CodeQL Analysis

on:
  push:
    branches: [main, develop]
  pull_request:
    branches: [main]
  schedule:
    - cron: '30 5 * * 0' # Weekly scan, offset to avoid peak times
  workflow_dispatch: # Manual trigger

jobs:
  analyze:
    name: Analyze (${{ matrix.language }})
    runs-on: ${{ matrix.os }}
    timeout-minutes: 30
    permissions:
      actions: read
      contents: read
      security-events: write
      pull-requests: write # For PR comments

    strategy:
      fail-fast: false
      matrix:
        include:
          - language: javascript-typescript
            os: ubuntu-latest
            build-mode: none
          - language: python
            os: ubuntu-latest
            build-mode: none
          - language: go
            os: ubuntu-latest
            build-mode: autobuild

    steps:
      - name: Checkout code
        uses: actions/checkout@v4
        with:
          fetch-depth: 2 # For PR analysis

      - name: Initialize CodeQL
        uses: github/codeql-action/init@v3
        with:
          languages: ${{ matrix.language }}
          queries: +security-and-quality,security-experimental
          config: |
            query-filters:
              - exclude:
                  id: js/redundant-assignment
                  id: js/useless-assignment-to-local
            paths-ignore:
              - 'node_modules'
              - 'dist'
              - '**/*.test.ts'

      - name: Build
        if: matrix.build-mode == 'autobuild'
        uses: github/codeql-action/autobuild@v3

      - name: Perform CodeQL Analysis
        uses: github/codeql-action/analyze@v3
        with:
          category: '/language:${{ matrix.language }}'
          output: sarif-results
          upload: true
          add-snippet: true

      - name: Filter SARIF
        uses: advanced-security/filter-sarif@v1
        with:
          patterns: |
            -**/node_modules/**
            -**/test/**
            -**/*.test.ts
          input: sarif-results/${{ matrix.language }}.sarif
          output: sarif-results/${{ matrix.language }}.sarif

      - name: Upload SARIF
        uses: github/codeql-action/upload-sarif@v3
        with:
          sarif_file: sarif-results/${{ matrix.language }}.sarif
```

### Semgrep Advanced Configuration

Pattern-based static analysis with custom rules:

```yaml
name: Semgrep Security Scan

on:
  pull_request: {}
  push:
    branches: [main, develop]
  schedule:
    - cron: '0 14 * * 1-5' # Weekdays at 2 PM UTC

jobs:
  semgrep:
    name: Semgrep Security Scan
    runs-on: ubuntu-latest
    container:
      image: semgrep/semgrep
    permissions:
      contents: read
      security-events: write
      pull-requests: write

    steps:
      - uses: actions/checkout@v4
        with:
          fetch-depth: 0 # Full history for better analysis

      - name: Run Semgrep with custom rules
        run: |
          # Create custom rules file
          cat > .semgrep.yml << 'EOF'
          rules:
            - id: hardcoded-api-key
              patterns:
                - pattern-regex: 'api[_-]?key\s*=\s*["\']\w{20,}["\']'
              message: Hardcoded API key detected
              languages: [javascript, typescript]
              severity: ERROR
              
            - id: console-log-in-production
              patterns:
                - pattern: console.log(...)
                - pattern-not-inside: 
                    - pattern-either:
                        - pattern: if (process.env.NODE_ENV === 'development') { ... }
                        - pattern: if (__DEV__) { ... }
              message: console.log should not be used in production code
              languages: [javascript, typescript]
              severity: WARNING
              
            - id: unsafe-sql-query
              patterns:
                - pattern-either:
                    - pattern: $QUERY = `... ${$VAR} ...`
                    - pattern: $QUERY = "..." + $VAR + "..."
                - metavariable-regex:
                    metavariable: $QUERY
                    regex: '.*(SELECT|INSERT|UPDATE|DELETE).*'
              message: Potential SQL injection vulnerability
              languages: [javascript, typescript]
              severity: ERROR
          EOF

          # Run Semgrep with multiple configs
          semgrep ci \
            --config=.semgrep.yml \
            --config=p/security-audit \
            --config=p/secrets \
            --config=p/owasp-top-ten \
            --config=p/typescript \
            --config=p/react \
            --config=p/nextjs \
            --config=p/nodejs \
            --sarif > semgrep.sarif
        env:
          SEMGREP_APP_TOKEN: ${{ secrets.SEMGREP_APP_TOKEN }}

      - name: Upload SARIF file
        uses: github/codeql-action/upload-sarif@v3
        with:
          sarif_file: semgrep.sarif
        if: always()

      - name: Comment PR
        if: github.event_name == 'pull_request'
        uses: actions/github-script@v7
        with:
          script: |
            const fs = require('fs');
            const sarif = JSON.parse(fs.readFileSync('semgrep.sarif', 'utf8'));
            const issues = sarif.runs[0].results.length;

            if (issues > 0) {
              github.rest.issues.createComment({
                issue_number: context.issue.number,
                owner: context.repo.owner,
                repo: context.repo.repo,
                body: `⚠️ Semgrep found ${issues} potential issue(s). Please review the security scan results.`
              });
            }
```

## Secret Scanning

### Multi-Tool Secret Detection

Comprehensive secret scanning with multiple tools:

```yaml
name: Secret Scanning

on:
  push:
    branches: [main, develop]
  pull_request:
  schedule:
    - cron: '0 4 * * *' # Daily at 4 AM UTC

jobs:
  secret-scan:
    name: Secret Scanning
    runs-on: ubuntu-latest
    permissions:
      contents: read
      security-events: write
      issues: write
      pull-requests: write

    steps:
      - name: Checkout code
        uses: actions/checkout@v4
        with:
          fetch-depth: 0 # Full history for thorough scanning

      - name: TruffleHog OSS
        id: trufflehog
        uses: trufflesecurity/trufflehog@main
        with:
          path: ./
          base: ${{ github.event.repository.default_branch }}
          head: HEAD
          extra_args: --only-verified --json
        continue-on-error: true

      - name: Run Gitleaks
        id: gitleaks
        uses: gitleaks/gitleaks-action@v2
        env:
          GITHUB_TOKEN: ${{ secrets.GITHUB_TOKEN }}
          GITLEAKS_CONFIG: .gitleaks.toml
        continue-on-error: true

      - name: Run detect-secrets
        id: detect-secrets
        run: |
          pip install detect-secrets
          detect-secrets scan --baseline .secrets.baseline
          detect-secrets audit .secrets.baseline
        continue-on-error: true

      - name: Aggregate results
        if: steps.trufflehog.outcome == 'failure' || steps.gitleaks.outcome ==
          'failure' || steps.detect-secrets.outcome == 'failure'
        run: |
          echo "::error::Secrets detected! Please review and remove them."
          exit 1
```

### Enhanced Gitleaks Configuration

`.gitleaks.toml`:

```toml
[extend]
useDefault = true

[[rules]]
id = "custom-api-key"
description = "Custom API Key Pattern"
regex = '''(?i)(api[_-]?key|apikey|api[_-]?token)['"]?\s*[:=]\s*['"]?([a-zA-Z0-9]{32,})['"]?'''
entropy = 3.5
keywords = ["api", "key", "token"]

[[rules]]
id = "jwt-token"
description = "JWT Token"
regex = '''eyJ[a-zA-Z0-9_-]{10,}\.[a-zA-Z0-9_-]{10,}\.[a-zA-Z0-9_-]{10,}'''
keywords = ["jwt", "bearer"]

[[rules]]
id = "private-key"
description = "Private Key"
regex = '''-----BEGIN (RSA |EC |DSA |OPENSSH )?PRIVATE KEY-----'''
keywords = ["private", "key"]

[[rules]]
id = "aws-access-key"
description = "AWS Access Key"
regex = '''AKIA[0-9A-Z]{16}'''
keywords = ["aws", "akia"]

[[rules]]
id = "slack-webhook"
description = "Slack Webhook"
regex = '''https://hooks\.slack\.com/services/[A-Z0-9]+/[A-Z0-9]+/[a-zA-Z0-9]+'''
keywords = ["slack", "webhook"]

[allowlist]
paths = [
  '''fixtures/''',
  '''test/''',
  '''__tests__/''',
  '''\.test\.(ts|js)$''',
  '''\.spec\.(ts|js)$''',
  '''examples/''',
  '''docs/'''
]

regexes = [
  '''EXAMPLE_API_KEY''',
  '''fake[_-]?key''',
  '''dummy[_-]?token'''
]

# Additional configuration
[output]
format = "sarif"
file = "gitleaks-results.sarif"
```

### detect-secrets Baseline

`.secrets.baseline`:

```json
{
  "version": "1.4.0",
  "plugins_used": [
    {
      "name": "ArtifactoryDetector"
    },
    {
      "name": "AWSKeyDetector"
    },
    {
      "name": "AzureStorageKeyDetector"
    },
    {
      "name": "Base64HighEntropyString",
      "limit": 4.5
    },
    {
      "name": "BasicAuthDetector"
    },
    {
      "name": "CloudantDetector"
    },
    {
      "name": "DiscordBotTokenDetector"
    },
    {
      "name": "GitHubTokenDetector"
    },
    {
      "name": "HexHighEntropyString",
      "limit": 3.0
    },
    {
      "name": "IbmCloudIamDetector"
    },
    {
      "name": "IbmCosHmacDetector"
    },
    {
      "name": "JwtTokenDetector"
    },
    {
      "name": "KeywordDetector",
      "keyword_exclude": ""
    },
    {
      "name": "MailchimpDetector"
    },
    {
      "name": "NpmDetector"
    },
    {
      "name": "PrivateKeyDetector"
    },
    {
      "name": "SendGridDetector"
    },
    {
      "name": "SlackDetector"
    },
    {
      "name": "SoftlayerDetector"
    },
    {
      "name": "SquareOAuthDetector"
    },
    {
      "name": "StripeDetector"
    },
    {
      "name": "TwilioKeyDetector"
    }
  ],
  "filters_used": [
    {
      "path": "node_modules"
    },
    {
      "path": "\.secrets\.baseline$"
    },
    {
      "path": "\.git"
    }
  ],
  "exclude": {
    "files": "^(node_modules|dist|build|coverage)/.*",
    "lines": null
  }
}
```

## Container Security

### Comprehensive Container Scanning

Multi-tool container security scanning with SBOM:

```yaml
name: Container Security

on:
  push:
    branches: [main]
    tags: ['v*']
  pull_request:
    paths:
      - 'Dockerfile*'
      - 'docker-compose*.yml'
      - '.dockerignore'

jobs:
  scan:
    name: Container Security Scan
    runs-on: ubuntu-latest
    permissions:
      contents: read
      security-events: write
      packages: write

    steps:
      - name: Checkout code
        uses: actions/checkout@v4

      - name: Set up Docker Buildx
        uses: docker/setup-buildx-action@v3

      - name: Build Image
        uses: docker/build-push-action@v5
        with:
          context: .
          load: true
          tags: |
            app:${{ github.sha }}
            app:latest
          cache-from: type=gha
          cache-to: type=gha,mode=max

      - name: Run Trivy vulnerability scanner
        uses: aquasecurity/trivy-action@master
        with:
          image-ref: app:${{ github.sha }}
          format: 'sarif'
          output: 'trivy-results.sarif'
          severity: 'CRITICAL,HIGH,MEDIUM'
          vuln-type: 'os,library'
          ignore-unfixed: true
          timeout: '10m'

      - name: Run Grype scanner
        id: grype
        uses: anchore/scan-action@v3
        with:
          image: app:${{ github.sha }}
          output-format: sarif
          severity-cutoff: medium

      - name: Generate SBOM with Syft
        uses: anchore/sbom-action@v0
        with:
          image: app:${{ github.sha }}
          format: spdx-json
          output-file: sbom.spdx.json

      - name: Scan SBOM for vulnerabilities
        run: |
          # Install grype
          curl -sSfL https://raw.githubusercontent.com/anchore/grype/main/install.sh | sh -s -- -b /usr/local/bin

          # Scan SBOM
          grype sbom:sbom.spdx.json -o sarif > sbom-scan.sarif

      - name: Docker Scout
        if: github.event_name != 'pull_request'
        uses: docker/scout-action@v1
        with:
          command: cves
          image: app:${{ github.sha }}
          only-severities: critical,high
          exit-code: true

      - name: Upload scan results
        uses: github/codeql-action/upload-sarif@v3
        if: always()
        with:
          sarif_file: |
            trivy-results.sarif
            ${{ steps.grype.outputs.sarif }}
            sbom-scan.sarif

      - name: Upload SBOM
        uses: actions/upload-artifact@v4
        with:
          name: sbom
          path: sbom.spdx.json
          retention-days: 30
```

### Dockerfile Security Best Practices

```dockerfile
# Use specific version tags, not latest
FROM node:20.11.0-alpine3.19 AS base

# Run security updates
RUN apk update && apk upgrade && apk add --no-cache \
    dumb-init \
    && rm -rf /var/cache/apk/*

# Create non-root user
RUN addgroup -g 1001 -S nodejs
RUN adduser -S nodejs -u 1001

# Use multi-stage build
FROM base AS deps
WORKDIR /app
COPY package*.json ./
RUN npm ci --only=production

FROM base AS build
WORKDIR /app
COPY package*.json ./
RUN npm ci
COPY . .
RUN npm run build

# Final stage
FROM base AS runtime
WORKDIR /app

# Copy built application
COPY --from=deps --chown=nodejs:nodejs /app/node_modules ./node_modules
COPY --from=build --chown=nodejs:nodejs /app/dist ./dist

# Switch to non-root user
USER nodejs

# Add security headers
EXPOSE 3000
ENV NODE_ENV=production

# Use dumb-init to handle signals properly
ENTRYPOINT ["dumb-init", "--"]
CMD ["node", "dist/index.js"]

# Add labels for better tracking
LABEL org.opencontainers.image.source="https://github.com/org/repo"
LABEL org.opencontainers.image.description="Production application"
LABEL org.opencontainers.image.licenses="MIT"
```

## Dependency Scanning

### Advanced License Compliance

Comprehensive license checking with reporting:

```yaml
name: License Compliance

on:
  push:
    branches: [main]
  pull_request:
  schedule:
    - cron: '0 9 * * 1' # Weekly on Monday

jobs:
  license-check:
    name: License Compliance Check
    runs-on: ubuntu-latest
    steps:
      - name: Checkout code
        uses: actions/checkout@v4

      - name: Setup Node.js
        uses: actions/setup-node@v4
        with:
          node-version: 20
          cache: 'npm'

      - name: Install dependencies
        run: npm ci

      - name: Check licenses with license-checker
        id: license-checker
        run: |
          # Install license-checker
          npm install -g license-checker

          # Generate license report
          license-checker --production --json > licenses.json

          # Check for disallowed licenses
          license-checker --production --onlyAllow \
            'MIT;Apache-2.0;BSD-2-Clause;BSD-3-Clause;ISC;CC0-1.0;CC-BY-3.0;CC-BY-4.0;Unlicense;0BSD;BlueOak-1.0.0' \
            --excludePackages 'package1;package2' || echo "LICENSE_ISSUES=true" >> $GITHUB_ENV

      - name: Generate license report with licensed
        run: |
          # Install licensed
          curl -sSL https://github.com/github/licensed/releases/latest/download/licensed-linux-x64.tar.gz | tar -xz
          sudo mv licensed /usr/local/bin/

          # Configure licensed
          cat > .licensed.yml << 'EOF'
          sources:
            npm: true
            bower: false
            go: false

          allowed:
            - mit
            - apache-2.0
            - bsd-2-clause
            - bsd-3-clause
            - isc
            - cc0-1.0
            - unlicense

          reviewed:
            npm:
              - some-package-with-special-license

          ignored:
            npm:
              - development-only-package
          EOF

          # Run licensed
          licensed cache
          licensed status || echo "LICENSED_ISSUES=true" >> $GITHUB_ENV

      - name: FOSSA scan
        uses: fossas/fossa-action@main
        with:
          api-key: ${{ secrets.FOSSA_API_KEY }}
          run-tests: false

      - name: Generate compliance report
        if: env.LICENSE_ISSUES == 'true' || env.LICENSED_ISSUES == 'true'
        run: |
          echo "## License Compliance Report" > compliance-report.md
          echo "" >> compliance-report.md
          echo "### Issues Found" >> compliance-report.md
          echo "" >> compliance-report.md

          # Parse and format license issues
          node -e "
            const licenses = require('./licenses.json');
            const problematic = [];
            
            Object.entries(licenses).forEach(([pkg, info]) => {
              const license = info.licenses || 'UNKNOWN';
              if (!['MIT', 'Apache-2.0', 'BSD-2-Clause', 'BSD-3-Clause', 'ISC'].includes(license)) {
                problematic.push({pkg, license, repository: info.repository});
              }
            });
            
            if (problematic.length > 0) {
              console.log('| Package | License | Repository |');
              console.log('|---------|---------|------------|');
              problematic.forEach(({pkg, license, repository}) => {
                console.log(`| ${pkg} | ${license} | ${repository || 'N/A'} |`);
              });
            }
          " >> compliance-report.md

      - name: Upload compliance report
        if: env.LICENSE_ISSUES == 'true' || env.LICENSED_ISSUES == 'true'
        uses: actions/upload-artifact@v4
        with:
          name: license-compliance-report
          path: |
            compliance-report.md
            licenses.json

      - name: Comment on PR
        if: github.event_name == 'pull_request' && (env.LICENSE_ISSUES == 'true'
          || env.LICENSED_ISSUES == 'true')
        uses: actions/github-script@v7
        with:
          script: |
            const fs = require('fs');
            const report = fs.readFileSync('compliance-report.md', 'utf8');

            github.rest.issues.createComment({
              issue_number: context.issue.number,
              owner: context.repo.owner,
              repo: context.repo.repo,
              body: report
            });
```

### Comprehensive Dependency Vulnerability Scanning

```yaml
name: Dependency Security

on:
  push:
    branches: [main]
  pull_request:
  schedule:
    - cron: '0 0 * * *' # Daily
  workflow_dispatch:
    inputs:
      auto-fix:
        description: 'Attempt to auto-fix vulnerabilities'
        type: boolean
        default: false

jobs:
  audit:
    name: Dependency Vulnerability Scan
    runs-on: ubuntu-latest
    permissions:
      contents: read
      security-events: write
      pull-requests: write
      issues: write

    steps:
      - name: Checkout code
        uses: actions/checkout@v4
        with:
          token: ${{ secrets.GITHUB_TOKEN }}

      - name: Setup Node.js
        uses: actions/setup-node@v4
        with:
          node-version: 20
          cache: 'npm'

      - name: Run npm audit
        id: npm-audit
        run: |
          # Run audit and capture results
          npm audit --json > npm-audit.json || true

          # Parse results
          CRITICAL=$(jq '.metadata.vulnerabilities.critical' npm-audit.json)
          HIGH=$(jq '.metadata.vulnerabilities.high' npm-audit.json)
          MODERATE=$(jq '.metadata.vulnerabilities.moderate' npm-audit.json)

          echo "critical=$CRITICAL" >> $GITHUB_OUTPUT
          echo "high=$HIGH" >> $GITHUB_OUTPUT
          echo "moderate=$MODERATE" >> $GITHUB_OUTPUT

          # Fail if critical or high vulnerabilities
          if [ "$CRITICAL" -gt 0 ] || [ "$HIGH" -gt 0 ]; then
            echo "VULNERABILITIES_FOUND=true" >> $GITHUB_ENV
          fi

      - name: Run Snyk test
        uses: snyk/actions/node@master
        continue-on-error: true
        env:
          SNYK_TOKEN: ${{ secrets.SNYK_TOKEN }}
        with:
          args: --severity-threshold=medium --json-file-output=snyk-results.json

      - name: Check with OSV Scanner
        uses: google/osv-scanner-action@v1
        continue-on-error: true
        with:
          scan-args: |-
            --skip-git
            --recursive
            --format=json
            --output=osv-results.json
            ./

      - name: Run Nancy (for Go dependencies)
        if: hashFiles('go.mod') != ''
        run: |
          go list -json -deps ./... | nancy sleuth
        continue-on-error: true

      - name: Run Safety (for Python dependencies)
        if: hashFiles('requirements.txt') != ''
        run: |
          pip install safety
          safety check --json > safety-results.json
        continue-on-error: true

      - name: Generate unified report
        run: |
          cat > vulnerability-report.md << 'EOF'
          # Dependency Vulnerability Report

          ## Summary

          | Scanner | Critical | High | Medium | Low |
          |---------|----------|------|--------|-----|
          | npm audit | ${{ steps.npm-audit.outputs.critical }} | ${{ steps.npm-audit.outputs.high }} | ${{ steps.npm-audit.outputs.moderate }} | - |

          ## Detailed Results

          EOF

          # Add detailed findings from each scanner
          if [ -f npm-audit.json ]; then
            echo "### NPM Audit" >> vulnerability-report.md
            jq -r '.advisories | to_entries[] | "- **\(.value.title)** (\(.value.severity)): \(.value.module_name)@\(.value.findings[0].version)"' npm-audit.json >> vulnerability-report.md || true
          fi

      - name: Auto-fix vulnerabilities
        if: github.event.inputs.auto-fix == 'true' || github.event.schedule
        run: |
          # Attempt to fix npm vulnerabilities
          npm audit fix --force

          # Update dependencies to latest minor/patch versions
          npx npm-check-updates -u --target minor
          npm install

          # Commit changes if any
          if [[ -n $(git status -s) ]]; then
            git config user.name github-actions
            git config user.email github-actions@github.com
            git add package*.json
            git commit -m "fix(deps): auto-fix security vulnerabilities"
            git push
          fi

      - name: Create issue for vulnerabilities
        if: env.VULNERABILITIES_FOUND == 'true' && github.event_name == 'schedule'
        uses: actions/github-script@v7
        with:
          script: |
            const title = 'Security: Dependency vulnerabilities detected';
            const body = `Automated security scan found vulnerabilities:

- Critical: ${{ steps.npm-audit.outputs.critical }}
- High: ${{ steps.npm-audit.outputs.high }}
- Moderate: ${{ steps.npm-audit.outputs.moderate }}

Please review and fix these vulnerabilities.`;

            // Check if issue already exists
            const issues = await github.rest.issues.listForRepo({
              owner: context.repo.owner,
              repo: context.repo.repo,
              state: 'open',
              labels: 'security,dependencies'
            });

            const existingIssue = issues.data.find(issue => issue.title === title);

            if (!existingIssue) {
              await github.rest.issues.create({
                owner: context.repo.owner,
                repo: context.repo.repo,
                title,
                body,
                labels: ['security', 'dependencies', 'automated']
              });
            }
```

## Infrastructure as Code Security

### Comprehensive IaC Scanning

```yaml
name: Infrastructure Security

on:
  pull_request:
    paths:
      - 'terraform/**'
      - 'kubernetes/**'
      - 'helm/**'
      - 'cloudformation/**'
      - '.github/workflows/iac-security.yml'
  push:
    branches: [main]
    paths:
      - 'terraform/**'
      - 'kubernetes/**'

jobs:
  iac-scan:
    name: IaC Security Scan
    runs-on: ubuntu-latest
    permissions:
      contents: read
      security-events: write
      pull-requests: write

    steps:
      - name: Checkout code
        uses: actions/checkout@v4

      - name: Run Trivy for IaC
        uses: aquasecurity/trivy-action@master
        with:
          scan-type: 'config'
          hide-progress: false
          format: 'sarif'
          output: 'trivy-iac-results.sarif'
          severity: 'CRITICAL,HIGH,MEDIUM'

      - name: Run tfsec for Terraform
        if: hashFiles('terraform/**') != ''
        uses: aquasecurity/tfsec-action@v1.0.0
        with:
          soft_fail: false
          format: sarif
          out: tfsec-results.sarif

      - name: Run Checkov
        id: checkov
        uses: bridgecrewio/checkov-action@master
        with:
          directory: .
          quiet: true
          soft_fail: false
          framework: all
          output_format: sarif
          output_file_path: checkov-results.sarif
          download_external_modules: true
          log_level: INFO

      - name: Run Terrascan
        run: |
          # Install terrascan
          curl -L "https://github.com/tenable/terrascan/releases/latest/download/terrascan_$(uname -s)_$(uname -m).tar.gz" | tar -xz
          sudo mv terrascan /usr/local/bin/

          # Run scan
          terrascan scan -i terraform -d terraform/ -o sarif > terrascan-results.sarif || true

      - name: Run KICS
        uses: checkmarx/kics-github-action@v1.7.0
        with:
          path: .
          output_path: .
          output_formats: 'sarif'
          fail_on: high
          disable_secrets: false
          queries: |
            - "Sensitive Data Exposure"
            - "Insecure Configurations"
            - "Best Practices"

      - name: Run Kubesec for Kubernetes
        if: hashFiles('kubernetes/**/*.yaml') != ''
        run: |
          # Install kubesec
          curl -sSL https://github.com/controlplaneio/kubesec/releases/latest/download/kubesec_linux_amd64.tar.gz | tar -xz
          sudo mv kubesec /usr/local/bin/

          # Scan all Kubernetes files
          find kubernetes -name '*.yaml' -o -name '*.yml' | while read file; do
            echo "Scanning $file"
            kubesec scan "$file" >> kubesec-results.json
          done

      - name: Upload all results
        uses: github/codeql-action/upload-sarif@v3
        if: always()
        with:
          sarif_file: |
            trivy-iac-results.sarif
            tfsec-results.sarif
            checkov-results.sarif
            terrascan-results.sarif
            kics-results.sarif

      - name: Comment PR with summary
        if: github.event_name == 'pull_request'
        uses: actions/github-script@v7
        with:
          script: |
            const fs = require('fs');
            let comment = '## Infrastructure Security Scan Results\n\n';

            // Parse results from various scanners
            const scanners = [
              { name: 'Trivy', file: 'trivy-iac-results.sarif' },
              { name: 'tfsec', file: 'tfsec-results.sarif' },
              { name: 'Checkov', file: 'checkov-results.sarif' },
              { name: 'KICS', file: 'kics-results.sarif' }
            ];

            for (const scanner of scanners) {
              if (fs.existsSync(scanner.file)) {
                const sarif = JSON.parse(fs.readFileSync(scanner.file, 'utf8'));
                const issues = sarif.runs[0].results.length;
                comment += `- **${scanner.name}**: ${issues} issue(s) found\n`;
              }
            }

            comment += '\nPlease review the security scan results in the Actions tab.';

            github.rest.issues.createComment({
              issue_number: context.issue.number,
              owner: context.repo.owner,
              repo: context.repo.repo,
              body: comment
            });
```

### Policy as Code with OPA

```yaml
name: Policy Validation

on:
  pull_request:
    paths:
      - 'policies/**'
      - 'terraform/**'
      - 'kubernetes/**'

jobs:
  opa-validation:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4

      - name: Setup OPA
        run: |
          curl -L -o opa https://openpolicyagent.org/downloads/latest/opa_linux_amd64
          chmod +x opa
          sudo mv opa /usr/local/bin/

      - name: Validate policies
        run: |
          # Test OPA policies
          find policies -name '*.rego' | while read policy; do
            echo "Testing $policy"
            opa test "$policy" -v
          done

      - name: Evaluate Terraform against policies
        if: hashFiles('terraform/**') != ''
        run: |
          # Convert Terraform to JSON
          cd terraform
          terraform init
          terraform plan -out=tfplan
          terraform show -json tfplan > tfplan.json

          # Evaluate against policies
          opa eval -d ../policies/terraform/ -i tfplan.json "data.terraform.deny[x]"
```

## Security Reporting and Governance

### Automated Security Dashboard

```yaml
name: Security Dashboard

on:
  workflow_run:
    workflows: ["CodeQL Analysis", "Semgrep Security Scan", "Container Security", "Dependency Security"]
    types: [completed]
  schedule:
    - cron: '0 6 * * 1' # Weekly summary

jobs:
  security-report:
    name: Generate Security Report
    runs-on: ubuntu-latest
    permissions:
      contents: read
      security-events: read
      actions: read
      issues: write
      pages: write
      id-token: write

    steps:
      - name: Checkout code
        uses: actions/checkout@v4

      - name: Collect security data
        id: collect
        run: |
          # Create report directory
          mkdir -p security-reports/{sarif,json,markdown}

          # Download artifacts from recent workflow runs
          WORKFLOWS=("CodeQL Analysis" "Semgrep Security Scan" "Container Security" "Dependency Security")

          for workflow in "${WORKFLOWS[@]}"; do
            echo "Collecting data from $workflow"

            # Get latest run
            RUN_ID=$(gh run list --workflow="$workflow" --status=completed --limit=1 --json databaseId --jq '.[0].databaseId')

            if [ -n "$RUN_ID" ]; then
              # Download artifacts
              gh run download "$RUN_ID" --dir "security-reports/artifacts/$workflow" || true
            fi
          done

          # Collect GitHub Advanced Security data
          gh api repos/${{ github.repository }}/code-scanning/alerts --paginate > security-reports/json/code-scanning.json
          gh api repos/${{ github.repository }}/secret-scanning/alerts --paginate > security-reports/json/secret-scanning.json
          gh api repos/${{ github.repository }}/dependabot/alerts --paginate > security-reports/json/dependabot.json
        env:
          GITHUB_TOKEN: ${{ secrets.GITHUB_TOKEN }}

      - name: Generate comprehensive report
        run: |
          cat > security-reports/markdown/summary.md << 'EOF'
          # Security Report

          Generated: $(date -u +"%Y-%m-%d %H:%M:%S UTC")

          ## Executive Summary

          EOF

          # Parse and summarize results
          node << 'SCRIPT'
          const fs = require('fs');
          const path = require('path');

          // Read JSON data
          const codeScanningAlerts = JSON.parse(fs.readFileSync('security-reports/json/code-scanning.json', 'utf8'));
          const secretAlerts = JSON.parse(fs.readFileSync('security-reports/json/secret-scanning.json', 'utf8'));
          const dependabotAlerts = JSON.parse(fs.readFileSync('security-reports/json/dependabot.json', 'utf8'));

          // Count by severity
          const severityCounts = {
            critical: 0,
            high: 0,
            medium: 0,
            low: 0
          };

          // Process alerts
          [...codeScanningAlerts, ...dependabotAlerts].forEach(alert => {
            const severity = alert.rule?.severity || alert.security_advisory?.severity || 'low';
            severityCounts[severity.toLowerCase()]++;
          });

          // Generate summary
          let summary = `
          | Severity | Count | Status |
          |----------|-------|--------|
          | Critical | ${severityCounts.critical} | ${severityCounts.critical > 0 ? '🔴' : '✅'} |
          | High | ${severityCounts.high} | ${severityCounts.high > 0 ? '🟠' : '✅'} |
          | Medium | ${severityCounts.medium} | ${severityCounts.medium > 0 ? '🟡' : '✅'} |
          | Low | ${severityCounts.low} | ${severityCounts.low > 0 ? '🟢' : '✅'} |

          ## Detailed Findings

          ### Code Scanning (${codeScanningAlerts.length} alerts)
          `;

          // Add detailed findings
          codeScanningAlerts.slice(0, 10).forEach(alert => {
            summary += `
- **${alert.rule.description}** (${alert.rule.severity})
  - File: ${alert.most_recent_instance.location.path}:${alert.most_recent_instance.location.start_line}
  - Status: ${alert.state}
`;
          });

          fs.appendFileSync('security-reports/markdown/summary.md', summary);
          SCRIPT

      - name: Generate HTML report
        run: |
          # Install report generator
          npm install -g @bkimminich/security-report

          # Generate HTML report
          security-report \
            --input security-reports \
            --output security-reports/dashboard.html \
            --format html \
            --theme dark

      - name: Deploy to GitHub Pages
        if: github.ref == 'refs/heads/main'
        uses: peaceiris/actions-gh-pages@v3
        with:
          github_token: ${{ secrets.GITHUB_TOKEN }}
          publish_dir: ./security-reports
          destination_dir: security
          keep_files: true

      - name: Create/Update tracking issue
        uses: actions/github-script@v7
        with:
          script: |
            const fs = require('fs');
            const summary = fs.readFileSync('security-reports/markdown/summary.md', 'utf8');

            // Search for existing issue
            const issues = await github.rest.issues.listForRepo({
              owner: context.repo.owner,
              repo: context.repo.repo,
              labels: 'security-report',
              state: 'open'
            });

            const title = `Security Report - ${new Date().toISOString().split('T')[0]}`;
            const body = summary + `

[View Full Dashboard](https://${context.repo.owner}.github.io/${context.repo.repo}/security/dashboard.html)`;

            if (issues.data.length > 0) {
              // Update existing issue
              await github.rest.issues.update({
                owner: context.repo.owner,
                repo: context.repo.repo,
                issue_number: issues.data[0].number,
                title,
                body
              });
            } else {
              // Create new issue
              await github.rest.issues.create({
                owner: context.repo.owner,
                repo: context.repo.repo,
                title,
                body,
                labels: ['security-report', 'automated']
              });
            }
```

### Security Metrics and Trends

```yaml
name: Security Metrics

on:
  schedule:
    - cron: '0 0 * * *' # Daily
  workflow_dispatch:

jobs:
  collect-metrics:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4

      - name: Collect security metrics
        run: |
          # Initialize metrics file
          METRICS_FILE="security-metrics-$(date +%Y-%m-%d).json"

          # Collect various metrics
          cat > "$METRICS_FILE" << EOF
          {
            "timestamp": "$(date -u +"%Y-%m-%dT%H:%M:%SZ")",
            "repository": "${{ github.repository }}",
            "metrics": {
              "code_scanning_alerts": $(gh api repos/${{ github.repository }}/code-scanning/alerts --jq 'length'),
              "secret_scanning_alerts": $(gh api repos/${{ github.repository }}/secret-scanning/alerts --jq 'length'),
              "dependabot_alerts": $(gh api repos/${{ github.repository }}/dependabot/alerts --jq 'length'),
              "open_security_issues": $(gh issue list --label security --state open --json number --jq 'length')
            }
          }
          EOF
        env:
          GITHUB_TOKEN: ${{ secrets.GITHUB_TOKEN }}

      - name: Update metrics database
        uses: actions/upload-artifact@v4
        with:
          name: security-metrics-${{ github.run_id }}
          path: security-metrics-*.json
          retention-days: 90
```

## Best Practices

1. **Defense in Depth**:

   - Layer multiple security tools
   - Scan at multiple stages (commit, PR, deploy)
   - Use both SAST and DAST approaches
   - Implement runtime protection

2. **Shift Left Security**:

   - Pre-commit hooks for secret detection
   - IDE plugins for security linting
   - Developer security training
   - Security requirements in design

3. **Automation First**:

   - Automated dependency updates
   - Auto-fix for safe vulnerabilities
   - Automated security testing
   - Self-healing infrastructure

4. **Zero Trust Approach**:

   - OIDC for cloud authentication
   - Minimal permissions (POLP)
   - Regular credential rotation
   - Network segmentation

5. **Continuous Monitoring**:

   - Real-time security alerts
   - Trend analysis and reporting
   - Anomaly detection
   - Compliance tracking

6. **Incident Response**:

   - Clear escalation procedures
   - Automated issue creation
   - Response time SLAs
   - Post-mortem reviews

7. **Supply Chain Security**:

   - SBOM generation and scanning
   - Dependency pinning
   - License compliance
   - Vendor security assessments

8. **Security as Code**:
   - Policy as Code (OPA/Rego)
   - Infrastructure as Code scanning
   - Automated compliance checks
   - Version-controlled policies

## Security Scanning Checklist

### Repository Setup

- [ ] Enable GitHub Advanced Security
- [ ] Configure secret scanning
- [ ] Enable Dependabot
- [ ] Set up branch protection rules
- [ ] Configure CODEOWNERS

### CI/CD Pipeline

- [ ] Code scanning (CodeQL, Semgrep)
- [ ] Secret detection (multiple tools)
- [ ] Dependency scanning
- [ ] Container scanning
- [ ] IaC scanning
- [ ] License compliance
- [ ] SBOM generation

### Monitoring

- [ ] Security dashboards
- [ ] Automated reporting
- [ ] Trend analysis
- [ ] Alert notifications
- [ ] Compliance tracking

### Response

- [ ] Issue templates
- [ ] Escalation procedures
- [ ] Fix SLAs defined
- [ ] Regular reviews
