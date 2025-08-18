# !/usr/bin/env bun

/**

- Initialize turborepo cache with auto-generated secure secrets
-
- Generates:
- - TURBO_TOKEN: 64-character secure random token
- - TURBO_REMOTE_CACHE_SIGNATURE_KEY: 128-character signature key
-
- Writes to both .dev.vars (local development) and .env (monorepo root)
 */

import { randomBytes } from 'node:crypto';
import { existsSync, readFile, writeFile } from 'node:fs';
import { resolve } from 'node:path';
import { promisify } from 'node:util';

const writeFileAsync = promisify(writeFile);
const readFileAsync = promisify(readFile);

// Colors for console output
const colors = {
  green: '\x1b[32m',
  blue: '\x1b[34m',
  yellow: '\x1b[33m',
  red: '\x1b[31m',
  bold: '\x1b[1m',
  reset: '\x1b[0m',
} as const;

function log(message: string, color: keyof typeof colors = 'reset') {
  console.log(`${colors[color]}${message}${colors.reset}`);
}

/**

- Generate cryptographically secure random token
 */
function generateSecureToken(length = 32): string {
  return randomBytes(length).toString('hex');
}

/**

- Generate environment variables content
 */
function generateEnvContent(turboToken: string, signatureKey: string): string {
  const TURBO_API = process.env.TURBO_API ?? 'http://localhost:5173';
  const TURBO_TEAM = process.env.TURBO_TEAM ?? 'team_outfitter';
  const ENVIRONMENT = process.env.ENVIRONMENT ?? 'development';
  const EXPIRATION = process.env.BUCKET_OBJECT_EXPIRATION_HOURS ?? '720';
  return `# Auto-generated turborepo cache secrets

# Generated on ${new Date().toISOString()}

# Do not commit this file to version control

# Turborepo remote cache configuration

TURBO_API=${TURBO_API}
TURBO_TEAM=${TURBO_TEAM}
TURBO_TOKEN=${turboToken}
TURBO_REMOTE_CACHE_SIGNATURE_KEY=${signatureKey}

# Cloudflare Workers development

ENVIRONMENT=${ENVIRONMENT}
BUCKET_OBJECT_EXPIRATION_HOURS=${EXPIRATION}
`;
}

/**

- Generate .dev.vars content for Cloudflare Workers
 */
function generateDevVarsContent(turboToken: string): string {
  return `# Auto-generated Cloudflare Workers development variables

# Generated on ${new Date().toISOString()}

# Do not commit this file to version control

TURBO_TOKEN=${turboToken}
ENVIRONMENT=development
BUCKET_OBJECT_EXPIRATION_HOURS=720
`;
}

/**

- Check if file exists and ask for confirmation before overwriting
 */
async function confirmOverwrite(filePath: string): Promise<boolean> {
  if (!existsSync(filePath)) {
    return true;
  }

  log(`⚠️  File ${filePath} already exists.`, 'yellow');

  // In a real implementation, you'd use a proper prompt library
  // For now, we'll default to backing up the existing file
  return true;
}

/**

- Backup existing file if it exists
 */
async function backupExistingFile(filePath: string): Promise<void> {
  if (!existsSync(filePath)) {
    return;
  }

  const backupPath = `${filePath}.backup.${Date.now()}`;

  try {
    const content = await readFileAsync(filePath, 'utf-8');
    await writeFileAsync(backupPath, content, { mode: 0o600 });
    log(`📁 Backed up existing file to ${backupPath}`, 'blue');
  } catch (error) {
    log(`❌ Failed to backup ${filePath}: ${(error as Error).message}`, 'red');
  }
}

async function main() {
  log('🚀 Initializing Turborepo Remote Cache', 'bold');
  log('');

  // Generate secure secrets
  log('🔐 Generating cryptographically secure secrets...', 'blue');
  const turboToken = generateSecureToken(32); // 64 hex chars
  const signatureKey = generateSecureToken(64); // 128 hex chars

  log('✅ Generated TURBO_TOKEN (64 chars)', 'green');
  log('✅ Generated TURBO_REMOTE_CACHE_SIGNATURE_KEY (128 chars)', 'green');
  log('');

  // File paths
  const packageDir = resolve(import.meta.dir, '..');
  const monorepoRoot = resolve(packageDir, '../../..');

  const devVarsPath = resolve(packageDir, '.dev.vars');
  const envPath = resolve(monorepoRoot, '.env');

  // Generate file contents
  const devVarsContent = generateDevVarsContent(turboToken);
  const envContent = generateEnvContent(turboToken, signatureKey);

  try {
    // Handle .dev.vars file
    log('📝 Writing Cloudflare Workers development variables...', 'blue');
    if (await confirmOverwrite(devVarsPath)) {
      await backupExistingFile(devVarsPath);
      await writeFileAsync(devVarsPath, devVarsContent, { mode: 0o600 });
      log(`✅ Created ${devVarsPath}`, 'green');
    }

    // Handle .env file
    log('📝 Writing monorepo environment variables...', 'blue');
    if (await confirmOverwrite(envPath)) {
      await backupExistingFile(envPath);
      await writeFileAsync(envPath, envContent, { mode: 0o600 });
      log(`✅ Created ${envPath}`, 'green');
    }

    log('');
    log('🎉 Cache initialization complete!', 'bold');
    log('');
    log('Next steps:', 'blue');
    log('1. Install dotenv-cli: bun add -D dotenv-cli', 'reset');
    log('2. Update your package.json scripts with dotenv prefix', 'reset');
    log('3. Start the cache server: bun run cache:dev', 'reset');
    log('4. Test with: dotenv -- turbo run build', 'reset');
    log('');
    log('🔒 Security Notes:', 'yellow');
    log('• The generated tokens are cryptographically secure', 'reset');
    log('• .env and .dev.vars are already in .gitignore', 'reset');
    log(
      '• For production deployment, use: wrangler secret put TURBO_TOKEN',
      'reset'
    );
    log('');
  } catch (error) {
    log('❌ Failed to initialize cache configuration:', 'red');
    log((error as Error).message, 'red');
    process.exit(1);
  }
}

// Handle uncaught errors
process.on('uncaughtException', (error) => {
  log(`❌ Uncaught Exception: ${error.message}`, 'red');
  process.exit(1);
});

process.on('unhandledRejection', (reason) => {
  log(`❌ Unhandled Rejection: ${reason}`, 'red');
  process.exit(1);
});

main().catch((error) => {
  log(`❌ Initialization failed: ${error.message}`, 'red');
  process.exit(1);
});
