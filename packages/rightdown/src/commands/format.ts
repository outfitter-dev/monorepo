import { readFileSync, writeFileSync, existsSync } from 'node:fs';
import { resolve } from 'node:path';
import type { ArgumentsCamelCase } from 'yargs';
import { colors } from '../utils/colors.js';
import { ConfigReader } from '../core/config-reader.js';
import { Orchestrator } from '../core/orchestrator.js';
import { PrettierFormatter } from '../formatters/prettier.js';
import { BiomeFormatter } from '../formatters/biome.js';
import type { IFormatter } from '../formatters/base.js';

interface FormatCommandArgs {
  files?: Array<string>;
  write?: boolean;
  fix?: boolean;
  check?: boolean;
  dryRun?: boolean;
  config?: string;
  writeConfigs?: boolean;
  checkDrift?: boolean;
  quiet?: boolean;
  verbose?: boolean;
}

export async function formatCommand(argv: ArgumentsCamelCase<FormatCommandArgs>): Promise<void> {
  const {
    files = ['.'],
    write = false,
    fix = false,
    check = false,
    dryRun = false,
    config: configPath,
    writeConfigs = false,
    checkDrift = false,
    quiet = false,
    verbose = false,
  } = argv;
  
  // Handle --fix as alias for --write
  const shouldWrite = write || fix;

  try {
    // Read configuration
    const configReader = new ConfigReader();
    const configResult = await configReader.read(
      configPath || resolve(process.cwd(), '.rightdown.config.yaml'),
    );

    if (!configResult.success) {
      console.error(colors.error(`Failed to read config: ${configResult.error.message}`));
      process.exit(3);
    }

    const config = configResult.data;

    // Initialize formatters
    const formatters = new Map<string, IFormatter>();

    // Check and add Prettier
    const prettierFormatter = new PrettierFormatter();
    const prettierAvailable = await prettierFormatter.isAvailable();
    if (prettierAvailable.success && prettierAvailable.data) {
      formatters.set('prettier', prettierFormatter);
      if (verbose) {
        const version = await prettierFormatter.getVersion();
        if (version.success) {
          console.log(colors.info(`Using Prettier v${version.data}`));
        }
      }
    }

    // Check and add Biome
    const biomeFormatter = new BiomeFormatter();
    const biomeAvailable = await biomeFormatter.isAvailable();
    if (biomeAvailable.success && biomeAvailable.data) {
      formatters.set('biome', biomeFormatter);
      if (verbose) {
        const version = await biomeFormatter.getVersion();
        if (version.success) {
          console.log(colors.info(`Using Biome v${version.data}`));
        }
      }
    }

    // Handle --write-configs
    if (writeConfigs) {
      const { ConfigCompiler } = await import('../core/config-compiler.js');
      const compiler = new ConfigCompiler();
      
      const prettierConfig = compiler.generatePrettierConfig(config);
      const biomeConfig = compiler.generateBiomeConfig(config);
      
      writeFileSync('.prettierrc', JSON.stringify(prettierConfig, null, 2));
      writeFileSync('biome.json', JSON.stringify(biomeConfig, null, 2));
      
      if (!quiet) {
        console.log(colors.success('Generated .prettierrc and biome.json'));
      }
      process.exit(0);
    }
    
    // Handle --check-drift
    if (checkDrift) {
      const { ConfigCompiler } = await import('../core/config-compiler.js');
      const compiler = new ConfigCompiler();
      
      let hasDrift = false;
      
      // Check Prettier config
      if (existsSync('.prettierrc')) {
        const existing = JSON.parse(readFileSync('.prettierrc', 'utf-8'));
        const expected = compiler.generatePrettierConfig(config);
        if (JSON.stringify(existing) !== JSON.stringify(expected)) {
          hasDrift = true;
          if (!quiet) {
            console.log(colors.error('.prettierrc has drifted from expected configuration'));
          }
        }
      }
      
      // Check Biome config
      if (existsSync('biome.json')) {
        const existing = JSON.parse(readFileSync('biome.json', 'utf-8'));
        const expected = compiler.generateBiomeConfig(config);
        if (JSON.stringify(existing) !== JSON.stringify(expected)) {
          hasDrift = true;
          if (!quiet) {
            console.log(colors.error('biome.json has drifted from expected configuration'));
          }
        }
      }
      
      process.exit(hasDrift ? 2 : 0);
    }

    // Create orchestrator
    const orchestrator = new Orchestrator({ config, formatters });

    // Process files
    let totalFiles = 0;
    let filesChanged = 0;
    let hasErrors = false;

    for (const filePattern of files) {
      // For now, just handle single files
      // TODO: Add glob support
      if (!existsSync(filePattern)) {
        console.error(colors.error(`File not found: ${filePattern}`));
        hasErrors = true;
        continue;
      }

      totalFiles++;
      const filePath = resolve(filePattern);

      if (!quiet) {
        console.log(colors.info(`Processing ${filePath}...`));
      }

      // Format the file
      const result = await orchestrator.formatFile(filePath);

      if (!result.success) {
        console.error(colors.error(`Failed to format ${filePath}: ${result.error.message}`));
        hasErrors = true;
        continue;
      }

      const { content, stats } = result.data;
      const originalContent = readFileSync(filePath, 'utf-8');
      const hasChanges = content !== originalContent;

      if (check) {
        // Check mode: report if file would change
        if (hasChanges) {
          filesChanged++;
          if (!quiet) {
            console.log(colors.warning(`${filePath} would be reformatted`));
          }
        }
      } else if (dryRun) {
        // Dry-run mode: show what would change
        if (hasChanges) {
          filesChanged++;
          if (!quiet) {
            console.log(colors.info(`Would format ${filePath}`));
            console.log(colors.dim(`  ${stats.blocksProcessed} blocks processed, ${stats.blocksFormatted} formatted`));
          }
        } else if (verbose) {
          console.log(colors.dim(`${filePath} is already formatted`));
        }
      } else if (shouldWrite && hasChanges) {
        // Write mode: update the file
        writeFileSync(filePath, content);
        filesChanged++;
        if (!quiet) {
          console.log(colors.success(`✅ Formatted ${filePath}`));
        }
      } else if (!shouldWrite && !dryRun) {
        // Default: output to stdout
        console.log(content);
      }

      if (verbose) {
        console.log(colors.info(`  Blocks processed: ${stats.blocksProcessed}`));
        console.log(colors.info(`  Blocks formatted: ${stats.blocksFormatted}`));
        console.log(colors.info(`  Duration: ${stats.formattingDuration}ms`));
      }
    }

    // Clean up formatters
    if (formatters.has('biome')) {
      await (formatters.get('biome') as BiomeFormatter).shutdown();
    }

    // Summary
    if (!quiet && totalFiles > 0) {
      console.log();
      if (check) {
        if (filesChanged === 0) {
          console.log(colors.success('✅ All files are properly formatted'));
          process.exit(0);
        } else {
          console.log(colors.error(`❌ ${filesChanged} file(s) need formatting`));
          process.exit(1);
        }
      } else if (shouldWrite || dryRun) {
        console.log(colors.success(`✅ Formatted ${filesChanged} of ${totalFiles} file(s)`));
      }
    }

    if (hasErrors) {
      process.exit(1);
    }
  } catch (error) {
    console.error(colors.error('Error:'), error instanceof Error ? error.message : error);
    process.exit(1);
  }
}
