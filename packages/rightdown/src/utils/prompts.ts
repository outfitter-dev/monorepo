/**
 * Lightweight prompts utility
 * Replaces inquirer dependency with native readline
 */

import { createInterface } from 'node:readline/promises';
import { colors } from './colors.js';

export interface Choice {
  name: string;
  value: string;
  description?: string;
}

export interface SelectOptions {
  message: string;
  choices: Choice[];
  default?: string;
}

export interface ConfirmOptions {
  message: string;
  default?: boolean;
}

export interface InputOptions {
  message: string;
  default?: string;
  validate?: (input: string) => boolean | string;
}

/**
 * Present a list of choices and return the selected value
 */
export async function select(options: SelectOptions): Promise<string> {
  const rl = createInterface({
    input: process.stdin,
    output: process.stdout,
  });

  try {
    console.log(colors.cyan(options.message));

    options.choices.forEach((choice, index) => {
      const marker = choice.value === options.default ? '●' : '○';
      console.log(`  ${colors.dim(`${index + 1})`)} ${marker} ${choice.name}`);
      if (choice.description) {
        console.log(`      ${colors.gray(choice.description)}`);
      }
    });

    while (true) {
      const answer = await rl.question(colors.gray(`Select (1-${options.choices.length}): `));

      if (!answer && options.default) {
        return options.default;
      }

      const index = parseInt(answer) - 1;
      if (index >= 0 && index < options.choices.length) {
        return options.choices[index].value;
      }

      console.log(colors.error('Invalid selection. Please try again.'));
    }
  } finally {
    rl.close();
  }
}

/**
 * Ask a yes/no question
 */
export async function confirm(options: ConfirmOptions): Promise<boolean> {
  const rl = createInterface({
    input: process.stdin,
    output: process.stdout,
  });

  try {
    const defaultText =
      options.default !== undefined ? colors.gray(` (${options.default ? 'Y/n' : 'y/N'})`) : '';

    while (true) {
      const answer = await rl.question(`${colors.cyan(options.message)}${defaultText}: `);

      if (!answer && options.default !== undefined) {
        return options.default;
      }

      const normalized = answer.toLowerCase().trim();
      if (['y', 'yes', 'true'].includes(normalized)) {
        return true;
      }
      if (['n', 'no', 'false'].includes(normalized)) {
        return false;
      }

      console.log(colors.error('Please answer yes or no (y/n).'));
    }
  } finally {
    rl.close();
  }
}

/**
 * Ask for text input with optional validation
 */
export async function input(options: InputOptions): Promise<string> {
  const rl = createInterface({
    input: process.stdin,
    output: process.stdout,
  });

  try {
    const defaultText = options.default ? colors.gray(` (${options.default})`) : '';

    while (true) {
      const answer = await rl.question(`${colors.cyan(options.message)}${defaultText}: `);

      const value = answer || options.default || '';

      if (options.validate) {
        const validation = options.validate(value);
        if (validation === true) {
          return value;
        }
        if (typeof validation === 'string') {
          console.log(colors.error(validation));
          continue;
        }
        console.log(colors.error('Invalid input. Please try again.'));
        continue;
      }

      return value;
    }
  } finally {
    rl.close();
  }
}
