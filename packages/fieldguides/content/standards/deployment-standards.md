---
slug: deployment-standards
title: Deployment Standards
description: Secure, reliable deployment practices for continuous delivery.
type: convention
---

# Deployment Standards

Secure, reliable deployment practices for continuous delivery.

## Related Documentation

- [GitHub Actions Patterns](../patterns/github-actions.md) - CI/CD workflows
- [Security Scanning](../patterns/security-scanning.md) - Security in CI/CD
- [Git Hooks](../patterns/git-hooks.md) - Pre-deployment checks
- [Configuration Standards](./configuration-standards.md) - Environment management
- [Monitoring Standards](../operations/monitoring-observability.md) - Post-deployment monitoring
- [Testing Standards](./testing-standards.md) - Testing in deployment pipelines
- [Documentation Standards](./documentation-standards.md) - Deployment documentation
- [Monorepo Standards](./monorepo-standards.md) - Deploying from monorepos
- [TypeScript Standards](./typescript-standards.md) - TypeScript build configuration

## Version Compatibility

This guide assumes:

- Kubernetes: 1.25+ (for modern deployment strategies)
- GitHub Actions: Latest (for deployment workflows)
- Node.js: 18+ (for deployment scripts)
- Docker: 20.10+ (for container builds)

## Core Principles

### Security First

- **Least Privilege**: Grant minimal necessary permissions
- **Secret Management**: Use secure secret storage and rotation
- **Audit Logging**: Track all deployment activities
- **Access Control**: Restrict deployment permissions

### Reliability

- **Idempotent Operations**: Ensure repeatability
- **Rollback Capability**: Enable quick recovery
- **Environment Parity**: Keep environments consistent
- **Health Checks**: Verify deployment success

### Automation

- **Zero Manual Steps**: Fully automated deployments
- **Self-Documenting**: Clear deployment logs
- **Reproducible**: Same result every time
- **Fast Feedback**: Quick success/failure indication

## Deployment Strategies

### Blue-Green Deployment

```yaml
# ✂️ Production-ready: Blue-green deployment configuration
deployment:
  strategy: blue-green
  stages:
    - name: deploy-green
      steps:
        - deploy to green environment
        - run smoke tests
        - warm up caches

    - name: switch-traffic
      steps:
        - verify green health
        - switch load balancer
        - monitor metrics

    - name: cleanup
      steps:
        - verify green stability
        - terminate blue environment
```

### Canary Deployment

```yaml
# ✂️ Production-ready: Progressive rollout configuration
deployment:
  strategy: canary
  stages:
    - traffic: 10%
      duration: 5m
      metrics:
        - error_rate < 0.1%
        - p99_latency < 500ms

    - traffic: 50%
      duration: 10m
      metrics:
        - error_rate < 0.1%
        - p99_latency < 500ms

    - traffic: 100%
      duration: continuous
```

### Feature Flags

```typescript
// ✂️ Production-ready: Feature flag deployment
interface FeatureFlag {
  name: string;
  enabled: boolean;
  rolloutPercentage?: number;
  userGroups?: string[];
  startDate?: Date;
  endDate?: Date;
}

class FeatureFlagService {
  async isEnabled(flagName: string, userId?: string): Promise<boolean> {
    const flag = await this.getFlag(flagName);

    if (!flag || !flag.enabled) return false;

    if (flag.rolloutPercentage !== undefined) {
      const hash = this.hashUserId(userId || 'anonymous');
      return hash < flag.rolloutPercentage;
    }

    return true;
  }
}
```

## Environment Management

### Configuration Hierarchy

```bash
# 📚 Educational: Configuration precedence (highest to lowest)
1. Runtime environment variables
2. Deployment-specific configs
3. Environment-specific configs
4. Shared/default configs
```

### Environment Promotion

```yaml
# ✂️ Production-ready: Promotion pipeline
environments:
  - name: development
    auto_deploy: true
    branch: develop

  - name: staging
    auto_deploy: true
    branch: main
    approval: false

  - name: production
    auto_deploy: false
    branch: main
    approval: true
    protection_rules:
      - required_reviewers: 2
      - deploy_window: 'Mon-Fri 09:00-17:00'
```

## Security Practices

### Secret Management

```yaml
# ✂️ Production-ready: Using external secret stores
apiVersion: v1
kind: Secret
metadata:
  name: app-secrets
type: Opaque
data:
  # Reference to external secret
  database-url: vault:secret/data/app/database#url
  api-key: aws:secretsmanager:app-api-key
```

### Access Control

```yaml
# ✂️ Production-ready: RBAC for deployments
roles:
  - name: developer
    permissions:
      - deploy:staging
      - rollback:staging
      - view:all

  - name: lead
    permissions:
      - deploy:all
      - rollback:all
      - view:all
      - approve:production

  - name: sre
    permissions:
      - deploy:all
      - rollback:all
      - view:all
      - emergency:all
```

## Health Checks

### Readiness Checks

```typescript
// ✂️ Production-ready: Health check endpoint
export async function readinessCheck(): Promise<HealthStatus> {
  const checks = await Promise.allSettled([
    checkDatabase(),
    checkRedis(),
    checkExternalAPIs(),
  ]);

  const failures = checks.filter(c => c.status === 'rejected');

  if (failures.length > 0) {
    return {
      status: 'unhealthy',
      checks: formatCheckResults(checks),
      timestamp: new Date(),
    };
  }

  return {
    status: 'healthy',
    checks: formatCheckResults(checks),
    version: process.env.APP_VERSION,
    timestamp: new Date(),
  };
}
```

### Liveness Checks

```typescript
// ✂️ Production-ready: Simple liveness check
export function livenessCheck(): HealthStatus {
  // Check basic app responsiveness
  return {
    status: 'alive',
    uptime: process.uptime(),
    memory: process.memoryUsage(),
    timestamp: new Date(),
  };
}
```

## Rollback Procedures

### Automated Rollback

```yaml
# ✂️ Production-ready: Rollback triggers
rollback:
  triggers:
    - metric: error_rate
      threshold: 5%
      duration: 2m

    - metric: p99_latency
      threshold: 1000ms
      duration: 5m

    - metric: health_check_failures
      threshold: 10
      duration: 1m

  actions:
    - revert_deployment
    - notify_team
    - create_incident
```

### Manual Rollback

```bash
#!/bin/bash
# ✂️ Production-ready: rollback.sh - Emergency rollback script

set -euo pipefail

ENVIRONMENT="${1:-staging}"
VERSION="${2:-previous}"

echo "Starting rollback to $VERSION in $ENVIRONMENT"

# Get previous stable version
if [ "$VERSION" = "previous" ]; then
  VERSION=$(kubectl get deployment app -o jsonpath='{.metadata.annotations.previous-version}')
fi

# Perform rollback
kubectl set image deployment/app app="registry.example.com/app:$VERSION"
kubectl rollout status deployment/app

# Verify rollback
./scripts/verify-deployment.sh "$ENVIRONMENT"

echo "Rollback complete"
```

## Deployment Checklist

### Pre-Deployment

- [ ] All tests passing
- [ ] Security scans completed
- [ ] Dependencies up to date
- [ ] Database migrations ready
- [ ] Feature flags configured
- [ ] Rollback plan documented

### During Deployment

- [ ] Monitor error rates
- [ ] Check system resources
- [ ] Verify health checks
- [ ] Watch deployment logs
- [ ] Test critical paths

### Post-Deployment

- [ ] Verify all services healthy
- [ ] Check integration points
- [ ] Monitor performance metrics
- [ ] Update documentation
- [ ] Notify stakeholders
- [ ] Close deployment ticket

## Best Practices

1. **Always Use Automation**: Manual deployments introduce errors
2. **Version Everything**: Code, configs, infrastructure
3. **Test Rollbacks**: Regularly verify rollback procedures
4. **Monitor Continuously**: Watch metrics during and after deployment
5. **Document Changes**: Keep deployment logs and runbooks updated
6. **Practice Deployments**: Use staging to test deployment processes
7. **Gradual Rollouts**: Start small, increase gradually
8. **Maintain Backwards Compatibility**: Support old clients during transition
