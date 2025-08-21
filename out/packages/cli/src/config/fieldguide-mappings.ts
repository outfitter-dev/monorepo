import type { TerrainFeatures } from '../utils/detect-terrain.js';

export interface FieldguideRecommendation {
  id: string;
  name: string;
  description: string;
  priority: 'essential' | 'recommended' | 'optional';
}

/**
 * Returns a prioritized list of recommended fieldguides based on detected terrain features.
 *
 * Generates fieldguide recommendations tailored to the provided {@link TerrainFeatures}, including core language, framework, testing, state management, monorepo, Docker, and security guides. Handles special cases such as Next.js implying React, and advanced combinations like Next.js with TypeScript and monorepo. Duplicate recommendations are deduplicated by retaining the highest priority, and the final list is sorted by priority.
 *
 * @param terrain - The detected terrain features of the project.
 * @returns An array of unique {@link FieldguideRecommendation} objects, sorted by descending priority.
 */
export function getRecommendedFieldguides(
  terrain: TerrainFeatures
): Array<FieldguideRecommendation> {
  const recommendations: Array<FieldguideRecommendation> = [];

  // Core language guides
  if (terrain.typescript) {
    recommendations.push({
      id: 'typescript-standards',
      name: 'TypeScript Standards',
      description: 'Core TypeScript patterns and conventions',
      priority: 'essential',
    });
  }

  // Framework-specific guides
  if (terrain.nextjs) {
    recommendations.push({
      id: 'nextjs-patterns',
      name: 'Next.js Patterns',
      description: 'Next.js specific patterns and best practices',
      priority: 'essential',
    });
    // Next.js implies React
    recommendations.push({
      id: 'react-patterns',
      name: 'React Patterns',
      description: 'React component and hook patterns',
      priority: 'essential',
    });
  } else if (terrain.react) {
    recommendations.push({
      id: 'react-patterns',
      name: 'React Patterns',
      description: 'React component and hook patterns',
      priority: 'essential',
    });
  }

  if (terrain.vue) {
    recommendations.push({
      id: 'vue-patterns',
      name: 'Vue Patterns',
      description: 'Vue 3 composition API and best practices',
      priority: 'essential',
    });
  }

  // Testing guides
  if (terrain.vitest || terrain.jest) {
    recommendations.push({
      id: 'testing-standards',
      name: 'Testing Standards',
      description: 'Comprehensive testing methodology',
      priority: 'essential',
    });
  }

  if (terrain.vitest) {
    recommendations.push({
      id: 'vitest-guide',
      name: 'Vitest Guide',
      description: 'Testing with Vitest',
      priority: 'recommended',
    });
  }

  if (terrain.playwright) {
    recommendations.push({
      id: 'playwright-guide',
      name: 'Playwright Guide',
      description: 'E2E testing with Playwright',
      priority: 'recommended',
    });
  }

  // State management
  if (terrain.zustand) {
    recommendations.push({
      id: 'zustand-guide',
      name: 'Zustand Guide',
      description: 'State management with Zustand',
      priority: 'recommended',
    });
  }

  if (terrain.redux) {
    recommendations.push({
      id: 'redux-guide',
      name: 'Redux Guide',
      description: 'State management with Redux Toolkit',
      priority: 'recommended',
    });
  }

  // Special terrain combinations
  if (terrain.monorepo) {
    recommendations.push({
      id: 'monorepo-patterns',
      name: 'Monorepo Patterns',
      description: 'Managing monorepo projects effectively',
      priority: 'essential',
    });
  }

  if (terrain.docker) {
    recommendations.push({
      id: 'docker-guide',
      name: 'Docker Guide',
      description: 'Containerization best practices',
      priority: 'recommended',
    });
  }

  // Security guide for Node.js projects
  if (terrain.node && !terrain.nextjs && !terrain.react) {
    recommendations.push({
      id: 'security-standards',
      name: 'Security Standards',
      description: 'Security baseline and best practices',
      priority: 'essential',
    });
  }

  // Advanced combinations
  if (terrain.nextjs && terrain.typescript && terrain.monorepo) {
    recommendations.push({
      id: 'advanced-nextjs-monorepo',
      name: 'Advanced Next.js Monorepo',
      description: 'Enterprise Next.js monorepo patterns',
      priority: 'optional',
    });
  }

  // Remove duplicates (keeping highest priority)
  const seen = new Map<string, FieldguideRecommendation>();
  for (const rec of recommendations) {
    const existing = seen.get(rec.id);
    if (
      !existing ||
      getPriorityWeight(rec.priority) > getPriorityWeight(existing.priority)
    ) {
      seen.set(rec.id, rec);
    }
  }

  // Sort by priority
  return Array.from(seen.values()).sort((a, b) => {
    const diff = getPriorityWeight(b.priority) - getPriorityWeight(a.priority);
    return diff !== 0 ? diff : a.name.localeCompare(b.name);
  });
}

/**
 * Returns the numeric weight corresponding to a given priority level.
 *
 * @param priority - The priority level: 'essential', 'recommended', or 'optional'.
 * @returns The numeric weight for the specified {@link priority} ('essential' = 3, 'recommended' = 2, 'optional' = 1).
 */
function getPriorityWeight(
  priority: 'essential' | 'recommended' | 'optional'
): number {
  switch (priority) {
    case 'essential':
      return 3;
    case 'recommended':
      return 2;
    case 'optional':
      return 1;
    default:
      return 0;
  }
}

/**
 * Returns the IDs of essential or recommended fieldguides for the given terrain features.
 *
 * @param terrain - The detected terrain features of the project.
 * @returns An array of fieldguide IDs with priority 'essential' or 'recommended'.
 */
export function getRecommendedFieldguideIds(
  terrain: TerrainFeatures
): Array<string> {
  return getRecommendedFieldguides(terrain)
    .filter(
      (fg) => fg.priority === 'essential' || fg.priority === 'recommended'
    )
    .map((fg) => fg.id);
}
