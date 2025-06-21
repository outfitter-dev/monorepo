# Universal Security Standards

Essential security principles and practices that apply across all projects and technologies. These standards establish a security-first development mindset for 2025 and beyond, addressing modern threats and leveraging contemporary security tools.

## Related Standards

- [Coding Standards](./CODING.md) - Secure coding practices
- [Testing Standards](./TESTING.md) - Security testing requirements
- [TypeScript Standards](./standards/typescript-standards.md) - Type-safe security patterns
- [Configuration Standards](./standards/configuration-standards.md) - Secure configuration

## Foundational Security Principles

### Least Privilege

- Grant only minimum necessary permissions by default
- Regularly review and revoke unused access automatically
- Use role-based access control (RBAC) and attribute-based access control (ABAC)
- Apply to users, services, systems, and API endpoints
- Implement just-in-time (JIT) access for elevated permissions
- Use environment separation with different access levels

### Defense in Depth

- Layer multiple security controls at every level
- Assume any control can fail or be bypassed
- No single point of failure in security architecture
- Combine preventive, detective, and responsive controls
- Implement security at network, application, and data layers
- Use zero-trust architecture principles

### Fail Securely

- Default to denying access (deny by default)
- Handle errors without exposing sensitive information
- Maintain security posture during failures and degraded states
- Log security events for analysis and incident response
- Implement graceful degradation with security intact
- Use circuit breakers for external dependencies

## Authentication & Authorization

### Authentication Requirements

- Use strong, proven authentication methods (OAuth 2.1, OIDC)
- Implement multi-factor authentication (MFA) everywhere
- Support passwordless authentication (WebAuthn, passkeys)
- Secure password policies and bcrypt/argon2 storage
- Regular session validation and token refresh
- Implement account lockout and rate limiting
- Use modern identity providers (Auth0, Clerk, Supabase Auth)

### Authorization Patterns

- Separate authentication from authorization clearly
- Implement consistent access control across all endpoints
- Use established patterns (RBAC, ABAC, ReBAC)
- Audit authorization decisions and access patterns
- Use attribute-based policies for fine-grained control
- Implement resource-based authorization where needed
- Use policy engines for complex authorization logic

### Session Management

- Generate cryptographically secure session tokens
- Implement proper timeout policies (idle and absolute)
- Invalidate sessions on logout and privilege changes
- Protect against session hijacking and fixation
- Use secure, httpOnly, sameSite cookies
- Implement concurrent session limits where appropriate
- Use JWT tokens with proper validation and rotation

## Input Validation & Threat Prevention

### Validation Strategy

- Validate all external inputs with schema validation (Zod, Joi, Yup)
- Use allowlists over denylists for better security
- Validate on multiple layers (client, API, database)
- Reject invalid data early with descriptive errors
- Implement input length and rate limits
- Use type-safe validation with TypeScript integration
- Implement request body size limits

### Common Attack Prevention

- **SQL Injection**: Use parameterized queries, ORMs, and prepared statements
- **XSS**: Encode output, validate input, use CSP headers, sanitize HTML
- **CSRF**: Use anti-CSRF tokens, SameSite cookies, and double-submit cookies
- **Path Traversal**: Validate file paths, use sandboxing, restrict file access
- **NoSQL Injection**: Validate and sanitize NoSQL queries, use ODMs
- **Command Injection**: Avoid shell execution, use safe APIs, validate inputs
- **LDAP Injection**: Escape LDAP special characters, use parameterized queries
- **XXE**: Disable XML external entities, use safe parsers
- **SSRF**: Validate URLs, use allowlists, restrict network access

### Data Sanitization

- Remove or escape dangerous characters contextually
- Validate data types, ranges, and formats strictly
- Check file uploads thoroughly (type, size, content, malware)
- Sanitize before storage and display
- Use content security policies (CSP) for XSS prevention
- Implement proper URL and HTML sanitization
- Use DOMPurify or similar for client-side sanitization

## Secret Management

### Storage Practices

- Never commit secrets to version control (use pre-commit hooks)
- Use dedicated secret management tools (HashiCorp Vault, AWS Secrets Manager, 1Password)
- Encrypt secrets at rest and in transit
- Separate secrets by environment and principle of least access
- Use secret scanning tools in CI/CD (GitGuardian, TruffleHog)
- Implement secret detection in IDEs and editors
- Use environment variables or secure vaults, never hardcode

### Secret Rotation

- Implement regular, automated rotation schedules
- Automate rotation where possible with zero-downtime
- Monitor secret usage and access patterns
- Have rollback procedures and emergency access
- Use versioned secrets for gradual rollout
- Implement secret expiration and renewal alerts
- Use dynamic secrets where possible

### API Keys & Tokens

- Use short-lived tokens with refresh token patterns
- Implement automatic key rotation (30-90 days)
- Monitor for exposed keys in code and logs
- Revoke compromised credentials immediately
- Use scoped tokens with minimal permissions
- Implement token binding where possible
- Use API key management services

## Secure Communication & Transport

### TLS/HTTPS Requirements

- Enforce HTTPS for all communications (TLS 1.3 preferred)
- Use current TLS versions (1.2+ minimum, 1.3 recommended)
- Validate certificates properly and implement certificate pinning
- Implement HSTS headers with preload
- Use perfect forward secrecy (PFS)
- Monitor certificate expiration and auto-renewal

### API Security

- Authenticate all API requests with JWT or OAuth 2.1
- Use rate limiting and DDoS protection
- Implement request signing for sensitive operations
- Version APIs securely with backward compatibility
- Use API gateways for centralized security
- Implement proper CORS policies

### Internal Communications

- Encrypt service-to-service traffic with mTLS
- Use mutual TLS for internal API communications
- Secure message queues with authentication
- Protect database connections with encryption
- Implement service mesh for security policies
- Use zero-trust networking principles

## Security Scanning & Monitoring

### Static Analysis (SAST)

- Scan code for vulnerabilities with SAST tools (Snyk, CodeQL, Semgrep)
- Check for security anti-patterns and CWE violations
- Integrate into CI/CD pipeline with quality gates
- Address findings promptly with SLA tracking
- Use semantic analysis for deeper vulnerability detection
- Implement security linting rules (ESLint security plugins)
- Enable IDE security plugins for real-time feedback

### Dynamic Analysis (DAST)

- Test running applications with DAST tools (OWASP ZAP, Burp Suite)
- Perform regular penetration testing (quarterly minimum)
- Scan for runtime vulnerabilities and misconfigurations
- Validate security controls and defense mechanisms
- Use interactive application security testing (IAST)
- Implement chaos engineering for security resilience
- Test API security with specialized tools

### Monitoring & Alerting

- Log security-relevant events with structured logging
- Detect anomalous behavior with ML-based detection
- Alert on security incidents with proper escalation
- Maintain comprehensive audit trails
- Implement security information and event management (SIEM)
- Use threat intelligence feeds for proactive detection
- Monitor for suspicious patterns and behaviors

## Supply Chain & Dependency Security

### Supply Chain Security

- Verify package integrity with checksums and signatures
- Use trusted repositories and private registries
- Review third-party code and licenses before adoption
- Monitor for vulnerabilities with automated scanning (Dependabot, Renovate)
- Implement software bill of materials (SBOM)
- Use dependency pinning and lockfiles
- Implement npm/yarn audit in CI/CD

### Vulnerability Management

- Track known vulnerabilities with CVE monitoring
- Prioritize critical updates using CVSS scoring (fix critical/high immediately)
- Test updates before deployment in staging environments
- Document security patches and maintain changelog
- Implement automated dependency updates where safe
- Use vulnerability databases and threat feeds (NVD, GitHub Advisory)
- Set up security advisory notifications

### License Compliance

- Track dependency licenses automatically (license-checker, FOSSA)
- Ensure license compatibility with project requirements
- Maintain proper attribution and notices
- Avoid security-risk and inappropriate licenses
- Implement license scanning in CI/CD
- Regular license audits and compliance reports
- Document approved license list

## Security Development Practices

### Development Practices

- Regular security training for developers (annual minimum)
- Secure coding standards and guidelines
- Security-focused code review with checklists
- Security-focused testing (SAST, DAST, penetration)
- Threat modeling for new features (STRIDE, PASTA)
- Security champions program
- Secure SDLC implementation

### Operational Security

- Principle of least privilege by default
- Regular security updates and patch management (< 30 days for critical)
- Comprehensive incident response plans
- Detailed security documentation and playbooks
- Security monitoring and alerting 24/7
- Regular security assessments and audits
- Red team/blue team exercises

### Data Protection

- Encrypt sensitive data at rest (AES-256) and in transit (TLS 1.3)
- Implement data classification and labeling
- Secure data deletion and right to be forgotten (GDPR compliance)
- Privacy by design and data minimization
- Use encryption key management systems (KMS)
- Implement data loss prevention (DLP)
- Regular data access reviews

### Infrastructure Security

- Harden server configurations with CIS benchmarks
- Network segmentation and micro-segmentation
- Dynamic firewall rules and network policies
- Regular security audits and compliance scans
- Container security scanning (Trivy, Clair)
- Infrastructure as code with security scanning
- Kubernetes security policies (PSP, OPA)

## Incident Response

### Preparation

- Comprehensive incident response plan with playbooks
- Up-to-date contact information and communication channels
- Clear escalation procedures and decision trees
- Regular drills and tabletop exercises (quarterly)
- Incident response team with defined roles (RACI matrix)
- Integration with monitoring and alerting systems
- Pre-configured incident response tooling

### Detection & Response

- Monitor for indicators of compromise (IoCs)
- Quick incident triage and severity assessment (P1-P4)
- Contain threats rapidly with automated responses
- Preserve evidence for forensic analysis
- Coordinate with threat intelligence sources
- Implement automated response for common incidents
- Follow kill chain methodology for response

### Recovery & Lessons

- Restore normal operations with validation
- Document incidents with detailed timelines
- Conduct thorough post-incident reviews (within 48 hours)
- Update procedures and improve defenses
- Share lessons learned with the security community
- Update threat models based on incidents
- Track metrics (MTTD, MTTR, incident frequency)

## Compliance & Auditing

### Audit Requirements

- Regular security audits with external assessors (annual)
- Compliance assessments for relevant standards (SOC 2, ISO 27001, PCI DSS)
- Continuous vulnerability assessments (weekly scans)
- Regular penetration testing and red team exercises (quarterly)
- Automated compliance monitoring (continuous)
- Third-party security assessments (annual)
- Supply chain security audits

### Documentation

- Comprehensive security policies and procedures
- Detailed access logs and audit trails (retained 1+ year)
- Change records with security impact analysis
- Incident reports with lessons learned
- Risk assessments and mitigation plans
- Compliance evidence and attestations
- Security architecture documentation

### Continuous Improvement

- Track security metrics and KPIs (monthly review)
- Regular security posture reviews (quarterly)
- Update based on evolving threats and intelligence
- Learn from incidents and industry best practices
- Implement security maturity models (NIST, BSIMM)
- Benchmark against industry standards
- Regular security roadmap updates

## 2025 Security Landscape

### TypeScript Security Features

- Use strict type checking to prevent injection attacks
- Leverage branded types for sensitive data (passwords, tokens)
- Implement runtime validation with Zod schemas
- Use const assertions for secure configurations
- Utilize template literal types for safe SQL building
- Enable strict null checks to prevent vulnerabilities
- Use discriminated unions for secure state management

### AI/ML Security Considerations

- Secure AI model endpoints and APIs with authentication
- Implement prompt injection protection (input sanitization)
- Validate AI-generated content before use
- Monitor AI system behavior for anomalies
- Protect training data and model privacy
- Implement rate limiting for AI endpoints
- Use content filtering for AI outputs
- Regular AI security audits

### Cloud-Native Security

- Implement cloud security posture management (CSPM)
- Use cloud workload protection platforms (CWPP)
- Secure container images and runtime (admission controllers)
- Implement policy as code for security (OPA, Kyverno)
- Use service mesh for microservices security (Istio, Linkerd)
- Enable cloud provider security features (GuardDuty, Security Center)
- Implement workload identity and IRSA/OIDC
- Use managed security services where appropriate

### Zero Trust Architecture

- Implement identity-based perimeters
- Continuous verification of all connections
- Least privilege access by default
- Encrypt all communications
- Assume breach mentality
- Microsegmentation of networks
- Strong device identity and health checks

### Runtime Security

- Runtime application self-protection (RASP)
- Container runtime security (Falco, Sysdig)
- Serverless function security
- API runtime protection
- Real-time threat detection
- Behavioral analysis and anomaly detection
- Memory-safe language adoption where critical

## Summary

Security is not a feature but a fundamental requirement that must be integrated into every aspect of modern software development. These standards provide a comprehensive baseline for secure software development and operations in 2025 and beyond.

Key principles for modern security:

- **Security by design**: Build security into every component from the start
- **Zero trust**: Never trust, always verify at every layer
- **Continuous monitoring**: Security is an ongoing process, not a checkpoint
- **Automation first**: Automate security wherever possible for consistency
- **Shared responsibility**: Security is everyone's responsibility, not just the security team
- **Adaptive defense**: Security must evolve with threats and new attack vectors
- **Defense in depth**: Multiple layers of security controls at every level

Remember: Security requires constant vigilance, continuous learning, and proactive adaptation to emerging threats and technologies. The goal is not perfect security but resilient systems that can detect, respond to, and recover from security incidents quickly.
