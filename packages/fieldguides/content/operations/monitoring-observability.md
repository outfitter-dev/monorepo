---
slug: monitoring-observability
title: 'Monitoring & Observability'
description: 'Comprehensive monitoring patterns for production systems.'
type: guide
---

# Monitoring & Observability

Comprehensive monitoring patterns for production systems.

## Related Documentation

- [Deployment Standards](../standards/deployment-standards.md) - Post-deployment monitoring
- [Configuration Standards](../standards/configuration-standards.md) - Monitoring configuration
- [Testing Standards](../standards/testing-standards.md) - Performance testing
- [TypeScript Standards](../standards/typescript-standards.md) - Type-safe metrics

## Core Principles

### The Three Pillars

1. **Metrics**: Numeric measurements over time
2. **Logs**: Discrete events with context
3. **Traces**: Request flow through distributed systems

### Observability Goals

- **Proactive Detection**: Find issues before users do
- **Rapid Diagnosis**: Quickly identify root causes
- **Business Insights**: Understand usage patterns
- **Performance Optimization**: Identify bottlenecks

## Metrics Collection

### Application Metrics

```typescript
// Prometheus metrics example
import { register, Counter, Histogram, Gauge } from 'prom-client';
import { Request, Response, NextFunction } from 'express';

// Request counter
export const httpRequestTotal = new Counter({
  name: 'http_requests_total',
  help: 'Total number of HTTP requests',
  labelNames: ['method', 'route', 'status_code'],
});

// Request duration histogram
export const httpRequestDuration = new Histogram({
  name: 'http_request_duration_seconds',
  help: 'Duration of HTTP requests in seconds',
  labelNames: ['method', 'route', 'status_code'],
  buckets: [0.1, 0.5, 1, 2, 5, 10],
});

// Active connections gauge
export const activeConnections = new Gauge({
  name: 'active_connections',
  help: 'Number of active connections',
});

// Middleware to collect metrics
export function metricsMiddleware(
  req: Request,
  res: Response,
  next: NextFunction
) {
  const start = Date.now();

  // Increment active connections
  activeConnections.inc();

  res.on('finish', () => {
    const duration = (Date.now() - start) / 1000;
    const labels = {
      method: req.method,
      route: req.route?.path || 'unknown',
      status_code: res.statusCode.toString(),
    };

    httpRequestTotal.inc(labels);
    httpRequestDuration.observe(labels, duration);
    activeConnections.dec();
  });

  next();
}
```

### Business Metrics

```typescript
// Custom business metrics
export const userSignups = new Counter({
  name: 'user_signups_total',
  help: 'Total number of user signups',
  labelNames: ['plan', 'source'],
});

export const revenue = new Counter({
  name: 'revenue_total_cents',
  help: 'Total revenue in cents',
  labelNames: ['product', 'currency'],
});

export const activeUsers = new Gauge({
  name: 'active_users',
  help: 'Number of active users in the last 24 hours',
});

// Track business events
export async function trackSignup(user: User, source: string) {
  userSignups.inc({
    plan: user.plan,
    source: source,
  });

  // Update active users gauge
  const count = await getUserCount({ active: true });
  activeUsers.set(count);
}
```

## Structured Logging

### Log Formats

```typescript
// Structured logger setup
import pino from 'pino';
import { Request } from 'express';

export const logger = pino({
  level: process.env.LOG_LEVEL || 'info',
  formatters: {
    level(label) {
      return { level: label };
    },
  },
  base: {
    env: process.env.NODE_ENV,
    version: process.env.APP_VERSION,
    service: 'api',
  },
  timestamp: pino.stdTimeFunctions.isoTime,
  // Redact sensitive fields
  redact: ['password', 'token', 'apiKey', 'authorization'],
});

// Context-aware logging
export function createRequestLogger(req: Request) {
  return logger.child({
    requestId: req.id,
    userId: req.user?.id,
    method: req.method,
    path: req.path,
    ip: req.ip,
  });
}
```

### Log Levels and When to Use Them

```typescript
// ERROR - Actionable issues that need immediate attention
logger.error(
  {
    err: error,
    userId: user.id,
    action: 'payment_processing',
  },
  'Payment processing failed'
);

// WARN - Potential issues or degraded performance
logger.warn(
  {
    cacheHitRate: 0.3,
    threshold: 0.8,
  },
  'Cache hit rate below threshold'
);

// INFO - Significant business events
logger.info(
  {
    userId: user.id,
    plan: 'premium',
    amount: 9900,
  },
  'User upgraded to premium'
);

// DEBUG - Detailed diagnostic information
logger.debug(
  {
    query: sql,
    params: params,
    duration: queryTime,
  },
  'Database query executed'
);
```

## Distributed Tracing

### OpenTelemetry Setup

```typescript
import { NodeSDK } from '@opentelemetry/sdk-node';
import { getNodeAutoInstrumentations } from '@opentelemetry/auto-instrumentations-node';
import { Resource } from '@opentelemetry/resources';
import { SemanticResourceAttributes } from '@opentelemetry/semantic-conventions';

// Initialize tracing
const sdk = new NodeSDK({
  resource: new Resource({
    [SemanticResourceAttributes.SERVICE_NAME]: 'api-service',
    [SemanticResourceAttributes.SERVICE_VERSION]: process.env.APP_VERSION,
  }),
  instrumentations: [
    getNodeAutoInstrumentations({
      '@opentelemetry/instrumentation-fs': {
        enabled: false, // Disable noisy instrumentations
      },
    }),
  ],
});

sdk.start();
```

### Custom Spans

```typescript
import { trace, context, SpanStatusCode } from '@opentelemetry/api';

const tracer = trace.getTracer('app-tracer');

export async function processPayment(orderId: string, amount: number) {
  // Create a new span
  return tracer.startActiveSpan('process_payment', async span => {
    try {
      // Add attributes
      span.setAttributes({
        'order.id': orderId,
        'payment.amount': amount,
        'payment.currency': 'USD',
      });

      // Create child spans for sub-operations
      await tracer.startActiveSpan('validate_order', async validateSpan => {
        const order = await validateOrder(orderId);
        validateSpan.setAttributes({
          'order.valid': true,
          'order.items': order.items.length,
        });
        validateSpan.end();
        return order;
      });

      // Process payment
      const result = await chargeCard(amount);

      span.setAttributes({
        'payment.success': result.success,
        'payment.transaction_id': result.transactionId,
      });

      return result;
    } catch (error) {
      span.recordException(error);
      span.setStatus({
        code: SpanStatusCode.ERROR,
        message: error.message,
      });
      throw error;
    } finally {
      span.end();
    }
  });
}
```

## Health Checks

### Comprehensive Health Endpoint

```typescript
interface HealthCheck {
  name: string;
  check: () => Promise<boolean>;
  critical: boolean;
  timeout: number;
}

interface HealthCheckResult {
  name: string;
  status: 'healthy' | 'unhealthy';
  critical: boolean;
  error?: string;
}

interface HealthStatus {
  status: 'healthy' | 'unhealthy';
  timestamp: string;
  version: string;
  uptime: number;
  checks: HealthCheckResult[];
}

const healthChecks: HealthCheck[] = [
  {
    name: 'database',
    check: async () => {
      const result = await db.raw('SELECT 1');
      return !!result;
    },
    critical: true,
    timeout: 5000,
  },
  {
    name: 'redis',
    check: async () => {
      const pong = await redis.ping();
      return pong === 'PONG';
    },
    critical: true,
    timeout: 2000,
  },
  {
    name: 'external_api',
    check: async () => {
      const response = await fetch('https://api.example.com/health');
      return response.ok;
    },
    critical: false,
    timeout: 10000,
  },
];

export async function getHealthStatus(): Promise<HealthStatus> {
  const checks = await Promise.allSettled(
    healthChecks.map(async hc => {
      const timeoutPromise = new Promise((_, reject) =>
        setTimeout(() => reject(new Error('Timeout')), hc.timeout)
      );

      try {
        const result = await Promise.race([hc.check(), timeoutPromise]);
        return { name: hc.name, status: 'healthy', critical: hc.critical };
      } catch (error) {
        return {
          name: hc.name,
          status: 'unhealthy',
          critical: hc.critical,
          error: error.message,
        };
      }
    })
  );

  const results = checks.map((c, i) => ({
    ...healthChecks[i],
    ...(c.status === 'fulfilled'
      ? c.value
      : { status: 'unhealthy', error: c.reason }),
  }));

  const criticalFailures = results.filter(
    r => r.critical && r.status === 'unhealthy'
  );

  return {
    status: criticalFailures.length > 0 ? 'unhealthy' : 'healthy',
    timestamp: new Date().toISOString(),
    version: process.env.APP_VERSION,
    uptime: process.uptime(),
    checks: results,
  };
}
```

## Alerting Rules

### Prometheus Alert Configuration

```yaml
groups:
  - name: application
    rules:
      - alert: HighErrorRate
        expr: |
          rate(http_requests_total{status_code=~"5.."}[5m]) 
          / rate(http_requests_total[5m]) > 0.05
        for: 5m
        labels:
          severity: critical
        annotations:
          summary: 'High error rate detected'
          description: 'Error rate is {{ $value | humanizePercentage }} for {{ $labels.route }}'

      - alert: HighLatency
        expr: |
          histogram_quantile(0.95, 
            rate(http_request_duration_seconds_bucket[5m])
          ) > 2
        for: 10m
        labels:
          severity: warning
        annotations:
          summary: 'High latency detected'
          description: '95th percentile latency is {{ $value }}s'

      - alert: LowCacheHitRate
        expr: |
          rate(cache_hits_total[5m]) 
          / (rate(cache_hits_total[5m]) + rate(cache_misses_total[5m])) < 0.8
        for: 15m
        labels:
          severity: warning
        annotations:
          summary: 'Cache hit rate below threshold'
          description: 'Cache hit rate is {{ $value | humanizePercentage }}'
```

## Dashboard Examples

### Key Metrics Dashboard

```typescript
// Grafana dashboard as code
export const dashboardConfig = {
  title: 'Application Overview',
  panels: [
    {
      title: 'Request Rate',
      targets: [
        {
          expr: 'rate(http_requests_total[5m])',
          legendFormat: '{{method}} {{route}}',
        },
      ],
      gridPos: { x: 0, y: 0, w: 12, h: 8 },
    },
    {
      title: 'Error Rate',
      targets: [
        {
          expr: 'rate(http_requests_total{status_code=~"5.."}[5m]) / rate(http_requests_total[5m])',
          legendFormat: '{{route}}',
        },
      ],
      gridPos: { x: 12, y: 0, w: 12, h: 8 },
    },
    {
      title: 'Response Time (p95)',
      targets: [
        {
          expr: 'histogram_quantile(0.95, rate(http_request_duration_seconds_bucket[5m]))',
          legendFormat: '{{route}}',
        },
      ],
      gridPos: { x: 0, y: 8, w: 12, h: 8 },
    },
    {
      title: 'Active Users',
      targets: [
        {
          expr: 'active_users',
        },
      ],
      gridPos: { x: 12, y: 8, w: 12, h: 8 },
    },
  ],
};
```

## CI/CD Pipeline Monitoring

### Pipeline Health Metrics

```yaml
# .github/workflows/pipeline-metrics.yml
name: Pipeline Metrics

on:
  workflow_run:
    workflows: ['*']
    types: [completed]

jobs:
  collect-metrics:
    runs-on: ubuntu-latest
    steps:
      - name: Collect Workflow Metrics
        uses: actions/github-script@v6
        with:
          script: |
            const { owner, repo } = context.repo;
            const run = context.payload.workflow_run;

            // Calculate duration
            const startTime = new Date(run.created_at);
            const endTime = new Date(run.updated_at);
            const duration = (endTime - startTime) / 1000; // seconds

            // Send metrics to monitoring system
            const metrics = {
              workflow_name: run.name,
              status: run.conclusion,
              duration: duration,
              branch: run.head_branch,
              attempt: run.run_attempt,
              timestamp: new Date().toISOString()
            };

            // Send to your metrics endpoint
            await fetch(process.env.METRICS_ENDPOINT, {
              method: 'POST',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify(metrics)
            });
```

### Deployment Tracking

```typescript
// Track deployment events
interface DeploymentEvent {
  environment: string;
  version: string;
  status: 'started' | 'completed' | 'failed' | 'rolled_back';
  duration?: number;
  error?: string;
}

export class DeploymentMonitor {
  private deploymentGauge = new Gauge({
    name: 'deployment_info',
    help: 'Current deployment information',
    labelNames: ['environment', 'version', 'status'],
  });

  private deploymentDuration = new Histogram({
    name: 'deployment_duration_seconds',
    help: 'Deployment duration in seconds',
    labelNames: ['environment', 'status'],
    buckets: [30, 60, 120, 300, 600, 1200],
  });

  private deploymentCounter = new Counter({
    name: 'deployments_total',
    help: 'Total number of deployments',
    labelNames: ['environment', 'status'],
  });

  async trackDeployment(event: DeploymentEvent) {
    // Update metrics
    this.deploymentCounter.inc({
      environment: event.environment,
      status: event.status,
    });

    if (event.duration) {
      this.deploymentDuration.observe(
        {
          environment: event.environment,
          status: event.status,
        },
        event.duration
      );
    }

    // Send notification for failures
    if (event.status === 'failed') {
      await this.notifyFailure(event);
    }

    // Log event
    logger.info('Deployment event', {
      ...event,
      timestamp: new Date().toISOString(),
    });
  }

  private async notifyFailure(event: DeploymentEvent) {
    // Send to Slack, PagerDuty, etc.
    await sendSlackAlert({
      channel: '#deployments',
      text: `Deployment failed in ${event.environment}`,
      attachments: [
        {
          color: 'danger',
          fields: [
            { title: 'Environment', value: event.environment },
            { title: 'Version', value: event.version },
            { title: 'Error', value: event.error || 'Unknown' },
          ],
        },
      ],
    });
  }
}
```

### Pipeline Failure Analysis

```typescript
// Analyze and categorize pipeline failures
export class PipelineAnalyzer {
  private failurePatterns = [
    { pattern: /timeout|timed out/i, category: 'timeout' },
    { pattern: /test.*fail/i, category: 'test_failure' },
    { pattern: /lint.*error/i, category: 'lint_error' },
    { pattern: /build.*fail/i, category: 'build_failure' },
    { pattern: /deploy.*fail/i, category: 'deploy_failure' },
    { pattern: /connection.*refused/i, category: 'network_error' },
  ];

  analyzeLogs(logs: string): FailureAnalysis {
    for (const { pattern, category } of this.failurePatterns) {
      if (pattern.test(logs)) {
        return {
          category,
          confidence: 0.8,
          suggestedAction: this.getSuggestedAction(category),
        };
      }
    }

    return {
      category: 'unknown',
      confidence: 0.3,
      suggestedAction: 'Manual investigation required',
    };
  }

  private getSuggestedAction(category: string): string {
    const actions: Record<string, string> = {
      timeout: 'Increase timeout or optimize slow operations',
      test_failure: 'Review failing tests and recent code changes',
      lint_error: 'Run linter locally and fix issues',
      build_failure: 'Check build logs and dependencies',
      deploy_failure: 'Verify deployment configuration and target environment',
      network_error: 'Check network connectivity and service availability',
    };

    return actions[category] || 'Review logs for more details';
  }
}
```

### Key Pipeline Metrics

1. **Lead Time**: Time from commit to production
2. **Deployment Frequency**: How often code reaches production
3. **Mean Time to Recovery (MTTR)**: Time to recover from failures
4. **Change Failure Rate**: Percentage of deployments causing failures

```typescript
// Calculate DORA metrics
export class DORAMetrics {
  async calculateLeadTime(
    commitSha: string,
    environment: string
  ): Promise<number> {
    const commitTime = await this.getCommitTime(commitSha);
    const deployTime = await this.getDeploymentTime(commitSha, environment);

    return (deployTime.getTime() - commitTime.getTime()) / 1000 / 60; // minutes
  }

  async getDeploymentFrequency(
    environment: string,
    days: number = 30
  ): Promise<number> {
    const deployments = await this.getDeployments(environment, days);
    return deployments.length / days; // deployments per day
  }

  async getMTTR(environment: string, days: number = 30): Promise<number> {
    const incidents = await this.getIncidents(environment, days);
    const totalRecoveryTime = incidents.reduce((sum, incident) => {
      return sum + (incident.resolvedAt - incident.startedAt);
    }, 0);

    return totalRecoveryTime / incidents.length / 1000 / 60; // minutes
  }

  async getChangeFailureRate(
    environment: string,
    days: number = 30
  ): Promise<number> {
    const deployments = await this.getDeployments(environment, days);
    const failures = deployments.filter(d => d.status === 'failed');

    return (failures.length / deployments.length) * 100; // percentage
  }
}
```

## Best Practices

1. **Use Structured Logging**: JSON format for easy parsing
2. **Implement Correlation IDs**: Track requests across services
3. **Set Retention Policies**: Balance cost vs debugging needs
4. **Create Actionable Alerts**: Avoid alert fatigue
5. **Monitor Business Metrics**: Not just technical metrics
6. **Use Sampling**: For high-volume tracing
7. **Secure Sensitive Data**: Redact PII from logs
8. **Regular Reviews**: Update dashboards and alerts based on incidents
9. **Track CI/CD Health**: Monitor pipeline performance and reliability
10. **Measure DORA Metrics**: Track key engineering performance indicators
