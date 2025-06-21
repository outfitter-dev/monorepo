// Runtime validation utilities

interface TerminologyItem {
  incorrect: string;
  correct: string;
}

export function isTerminologyConfig(value: unknown): value is TerminologyItem[] {
  if (!Array.isArray(value)) {
    return false;
  }

  return value.every(
    (item) =>
      typeof item === 'object' &&
      item !== null &&
      'incorrect' in item &&
      'correct' in item &&
      typeof item.incorrect === 'string' &&
      typeof item.correct === 'string',
  );
}

export function parseTerminologyConfig(value: unknown): TerminologyItem[] {
  if (!value) {
    return [];
  }

  if (!isTerminologyConfig(value)) {
    console.warn('Invalid terminology configuration provided to consistent-terminology rule');
    return [];
  }

  return value;
}
