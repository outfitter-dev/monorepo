import { failure, isFailure, type Result, success } from '@outfitter/contracts';
import { writeJSON } from '../utils/file-system.js';

/**

- Generates commitlint configuration for conventional commits
 */
export async function generateCommitlintConfig(): Promise<Result<void, Error>> {
  try {
    const config = {
      extends: ['@commitlint/config-conventional'],
      rules: {
        'type-enum': [
          2,
          'always',
          [
            'build', // Changes that affect the build system or external dependencies
            'chore', // Other changes that don't modify src or test files
            'ci', // Changes to CI configuration files and scripts
            'docs', // Documentation only changes
            'feat', // A new feature
            'fix', // A bug fix
            'perf', // A code change that improves performance
            'refactor', // A code change that neither fixes a bug nor adds a feature
            'revert', // Reverts a previous commit
            'style', // Changes that do not affect the meaning of the code
            'test', // Adding missing tests or correcting existing tests
          ],
        ],
        'type-case': [2, 'always', 'lower-case'],
        'type-empty': [2, 'never'],
        'scope-case': [2, 'always', 'lower-case'],
        'subject-case': [
          2,
          'never',
          ['sentence-case', 'start-case', 'pascal-case', 'upper-case'],
        ],
        'subject-empty': [2, 'never'],
        'subject-full-stop': [2, 'never', '.'],
        'header-max-length': [2, 'always', 100],
        'body-leading-blank': [2, 'always'],
        'body-max-line-length': [2, 'always', 100],
        'footer-leading-blank': [2, 'always'],
        'footer-max-line-length': [2, 'always', 100],
      },
      prompt: {
        questions: {
          type: {
            description: "Select the type of change that you're committing",
            enum: {
              feat: {
                description: 'A new feature',
                title: 'Features',
                emoji: '✨',
              },
              fix: {
                description: 'A bug fix',
                title: 'Bug Fixes',
                emoji: '🐛',
              },
              docs: {
                description: 'Documentation only changes',
                title: 'Documentation',
                emoji: '📚',
              },
              style: {
                description:
                  'Changes that do not affect the meaning of the code (white-space, formatting, missing semi-colons, etc)',
                title: 'Styles',
                emoji: '💎',
              },
              refactor: {
                description:
                  'A code change that neither fixes a bug nor adds a feature',
                title: 'Code Refactoring',
                emoji: '📦',
              },
              perf: {
                description: 'A code change that improves performance',
                title: 'Performance Improvements',
                emoji: '🚀',
              },
              test: {
                description:
                  'Adding missing tests or correcting existing tests',
                title: 'Tests',
                emoji: '🚨',
              },
              build: {
                description:
                  'Changes that affect the build system or external dependencies (example scopes: gulp, broccoli, npm)',
                title: 'Builds',
                emoji: '🛠',
              },
              ci: {
                description:
                  'Changes to our CI configuration files and scripts (example scopes: Travis, Circle, BrowserStack, SauceLabs)',
                title: 'Continuous Integrations',
                emoji: '⚙️',
              },
              chore: {
                description:
                  "Other changes that don't modify src or test files",
                title: 'Chores',
                emoji: '♻️',
              },
              revert: {
                description: 'Reverts a previous commit',
                title: 'Reverts',
                emoji: '🗑',
              },
            },
          },
          scope: {
            description:
              'What is the scope of this change (e.g. component or file name)',
          },
          subject: {
            description:
              'Write a short, imperative tense description of the change',
          },
          body: {
            description: 'Provide a longer description of the change',
          },
          isBreaking: {
            description: 'Are there any breaking changes?',
          },
          breakingBody: {
            description:
              'A BREAKING CHANGE commit requires a body. Please enter a longer description of the commit itself',
          },
          breaking: {
            description: 'Describe the breaking changes',
          },
          isIssueAffected: {
            description: 'Does this change affect any open issues?',
          },
          issuesBody: {
            description:
              'If issues are closed, the commit requires a body. Please enter a longer description of the commit itself',
          },
          issues: {
            description: 'Add issue references (e.g. "fix #123", "re #123".)',
          },
        },
      },
    };

    const writeResult = await writeJSON('.commitlintrc.json', config);
    if (isFailure(writeResult)) {
      return failure(new Error(writeResult.error.message));
    }
    return success(undefined);
  } catch (error) {
    return failure(error as Error);
  }
}
