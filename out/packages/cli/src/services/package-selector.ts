import type { FieldguideRecommendation } from '../config/fieldguide-mappings.js';
import { getRecommendedFieldguideIds } from '../config/fieldguide-mappings.js';
import {
  CONFIG_PACKAGES,
  PRESET_CONFIGURATIONS,
  UTILITY_PACKAGES,
} from '../constants/packages.js';
import type { PackageSelection, PresetType } from '../types/index.js';
import * as prompts from '../ui/prompts.js';
import type { TerrainFeatures } from '../utils/detect-terrain.js';

/**
 * Retrieves the package selection associated with a given preset.
 *
 * @param preset - The preset type for which to obtain the package selection.
 * @returns The package selection defined by the specified {@link preset}.
 */
export function getPresetSelection(preset: PresetType): PackageSelection {
  return PRESET_CONFIGURATIONS[preset];
}

/**
 * Returns the default package selection based on the provided terrain features.
 *
 * The selection includes all configuration and utility packages marked as selected by default, along with recommended fieldguide IDs determined by the given terrain.
 *
 * @param terrain - The terrain features used to determine recommended fieldguides.
 * @returns The default package selection for the specified terrain.
 */
export function getDefaultSelection(
  terrain: TerrainFeatures
): PackageSelection {
  return {
    configs: CONFIG_PACKAGES.filter((p) => p.selected).map((p) => p.value),
    utils: UTILITY_PACKAGES.filter((p) => p.selected).map((p) => p.value),
    fieldguides: getRecommendedFieldguideIds(terrain),
  };
}

/**
 * Prompts the user to interactively select configuration and utility packages, and displays recommended fieldguides based on the provided terrain.
 *
 * @param terrain - The terrain features used to determine recommended fieldguides.
 * @param recommendedFieldguides - A list of fieldguide recommendations to display to the user.
 * @returns A package selection object containing the user's chosen configuration and utility packages, along with recommended fieldguide IDs for the given terrain.
 */
export async function getInteractiveSelection(
  _terrain: TerrainFeatures,
  recommendedFieldguides: Array<FieldguideRecommendation>
): Promise<PackageSelection> {
  console.log(''); // Add spacing

  const selectedConfigs = await prompts.selectConfigurations(CONFIG_PACKAGES);
  const selectedUtils = await prompts.selectUtilities(UTILITY_PACKAGES);

  // Show recommended fieldguides
  if (recommendedFieldguides.length > 0) {
    prompts.showRecommendedFieldguides(recommendedFieldguides);
  }

  return {
    configs: selectedConfigs,
    utils: selectedUtils,
    fieldguides: recommendedFieldguides.map((fg) => fg.id),
  };
}
