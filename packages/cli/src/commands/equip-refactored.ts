import { Command } from 'commander';
import type { EquipOptions } from '../types/index.js';
import * as packageManager from '../services/package-manager.js';
import * as configApplier from '../services/configuration-applier.js';
import * as packageSelector from '../services/package-selector.js';
import * as ui from '../ui/console.js';
import * as prompts from '../ui/prompts.js';
import { detectTerrain } from '../utils/detect-terrain.js';
import { getRecommendedFieldguides } from '../config/fieldguide-mappings.js';

export const equipCommand = new Command('equip')
  .alias('init')
  .description('Interactively install Outfitter configurations and utilities')
  .option(
    '--preset <type>',
    'Use a preset configuration (minimal, standard, full)'
  )
  .option('-y, --yes', 'Skip prompts and use defaults')
  .action(async (options: EquipOptions) => {
    ui.showWelcome();

    // Detect project terrain
    const terrainSpinner = ui.createSpinner('Analyzing project terrain...');
    terrainSpinner.start();
    const terrain = await detectTerrain();
    terrainSpinner.succeed('Project terrain analyzed');

    ui.showTerrainSummary(terrain);

    // Get & show recommended fieldguides
    const recommendedFieldguides = getRecommendedFieldguides(terrain);
    prompts.showRecommendedFieldguides(recommendedFieldguides);

    // Determine package selection
    let selection;
    if (options.preset) {
      selection = packageSelector.getPresetSelection(options.preset);
    } else if (options.yes) {
      selection = packageSelector.getDefaultSelection(terrain);
    } else {
      selection = await packageSelector.getInteractiveSelection(
        terrain,
        recommendedFieldguides
      );
    }

    // Detect and show package manager
    const pm = await packageManager.detectPackageManager();
    ui.showPackageManager(pm);

    // Install packages
    const allPackages = [...selection.configs, ...selection.utils];
    if (allPackages.length > 0) {
      const installSpinner = ui.createSpinner('Installing packages...');
      installSpinner.start();
      try {
        await packageManager.installPackages(allPackages, pm);
        installSpinner.succeed('Packages installed');
      } catch (error) {
        installSpinner.fail('Failed to install packages');
        throw error;
      }
    }

    // Apply configurations
    if (selection.configs.length > 0) {
      const configSpinner = ui.createSpinner('Applying configurations...');
      configSpinner.start();
      try {
        await configApplier.applyConfigurations(selection.configs);
        configSpinner.succeed('Configurations applied');
      } catch (error) {
        configSpinner.fail('Failed to apply configurations');
        throw error;
      }
    }

    // Initialize git hooks if husky was selected
    if (selection.configs.includes('@outfitter/husky-config')) {
      const gitHooks = options.yes || (await prompts.confirmGitHooks());

      if (gitHooks) {
        const hooksSpinner = ui.createSpinner('Setting up git hooks...');
        hooksSpinner.start();
        try {
          await configApplier.initializeHusky(process.cwd());
          hooksSpinner.succeed('Git hooks initialized');
        } catch {
          hooksSpinner.fail('Failed to initialize git hooks');
        }
      }
    }

    ui.showNextSteps(pm, selection);
  });
