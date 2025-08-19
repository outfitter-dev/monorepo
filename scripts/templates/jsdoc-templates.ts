/**
 * JSDoc Templates for consistent documentation across the monorepo
 * Use these templates to ensure all code is properly documented
 */

export const templates = {
  /**
   * Template for functions that return Result
   */
  resultFunction: `/**
 * [Description of what the function does]
 * 
 * @param paramName - [Description of the parameter]
 * @returns Success with [describe success value] or failure with [describe error types]
 * 
 * @example
 * \`\`\`typescript
 * const result = functionName(param);
 * if (result.success) {
 *   console.log(result.data);
 * } else {
 *   console.error(result.error);
 * }
 * \`\`\`
 */`,

  /**
   * Template for async functions
   */
  asyncFunction: `/**
 * [Description of what the async function does]
 * 
 * @param paramName - [Description of the parameter]
 * @returns Promise resolving to Result with [success type] or [error type]
 * @throws Never throws - all errors are captured in Result
 * 
 * @example
 * \`\`\`typescript
 * const result = await functionName(param);
 * if (result.success) {
 *   // Handle success
 * } else {
 *   // Handle error
 * }
 * \`\`\`
 */`,

  /**
   * Template for classes
   */
  class: `/**
 * [Description of what the class represents/does]
 * 
 * @remarks
 * [Additional context about the class, its purpose, and usage patterns]
 * 
 * @example
 * \`\`\`typescript
 * const instance = new ClassName(params);
 * instance.method();
 * \`\`\`
 */`,

  /**
   * Template for interfaces
   */
  interface: `/**
 * [Description of what the interface represents]
 * 
 * @remarks
 * [When and how this interface should be used]
 */`,

  /**
   * Template for type aliases
   */
  typeAlias: `/**
 * [Description of what this type represents]
 * 
 * @remarks
 * [Additional context about when to use this type]
 */`,

  /**
   * Template for constants
   */
  constant: `/**
 * [Description of what this constant represents]
 * @constant
 * @default [default value if applicable]
 */`,

  /**
   * Template for enums
   */
  enum: `/**
 * [Description of what this enum represents]
 * 
 * @enum {[type]}
 * @readonly
 */`,

  /**
   * Template for complex/critical functions
   */
  complexFunction: `/**
 * [Detailed description of what the function does]
 * 
 * @param paramName - [Detailed parameter description]
 * @returns [Detailed return value description]
 * 
 * @remarks
 * [Implementation notes, performance considerations, edge cases]
 * 
 * @example
 * \`\`\`typescript
 * // Example 1: Basic usage
 * const result = functionName(param);
 * 
 * // Example 2: Edge case handling
 * const edgeResult = functionName(edgeParam);
 * \`\`\`
 * 
 * @see {@link RelatedFunction} for related functionality
 * @since [version]
 */`,

  /**
   * Template for deprecated items
   */
  deprecated: `/**
 * @deprecated Since version [X.Y.Z]. Use {@link NewFunction} instead.
 * 
 * [Original description]
 * 
 * @param paramName - [Description]
 * @returns [Description]
 */`,

  /**
   * Template for internal/private items
   */
  internal: `/**
 * @internal
 * [Description - this is internal API and should not be used by consumers]
 * 
 * @param paramName - [Description]
 * @returns [Description]
 */`,
};

/**
 * Generate a JSDoc comment based on function signature
 * 
 * @param signature - The function signature to generate docs for
 * @returns Generated JSDoc comment string
 */
export function generateJSDoc(signature: string): string {
  // Detect if it's async
  const isAsync = signature.includes('async');
  
  // Detect if it returns Result
  const returnsResult = signature.includes('Result<');
  
  // Extract function name
  const functionNameMatch = signature.match(/function\s+(\w+)/);
  const functionName = functionNameMatch ? functionNameMatch[1] : 'functionName';
  
  // Extract parameters
  const paramsMatch = signature.match(/\(([^)]*)\)/);
  const params = paramsMatch ? paramsMatch[1].split(',').map(p => p.trim()) : [];
  
  let jsdoc = '/**\n';
  jsdoc += ` * ${functionName} - [Description]\n`;
  jsdoc += ' *\n';
  
  // Add parameter documentation
  params.forEach(param => {
    if (param) {
      const paramName = param.split(':')[0].trim();
      jsdoc += ` * @param ${paramName} - [Description]\n`;
    }
  });
  
  // Add return documentation
  if (returnsResult) {
    jsdoc += ' * @returns Success with [type] or failure with AppError\n';
  } else if (isAsync) {
    jsdoc += ' * @returns Promise resolving to [type]\n';
  } else {
    jsdoc += ' * @returns [Description]\n';
  }
  
  jsdoc += ' */';
  
  return jsdoc;
}

/**
 * Snippets for VS Code integration
 * Add these to .vscode/typescript.code-snippets
 */
export const vscodeSnippets = {
  "Result Function": {
    prefix: "jsdoc-result",
    body: [
      "/**",
      " * ${1:Description}",
      " *",
      " * @param ${2:paramName} - ${3:Parameter description}",
      " * @returns Success with ${4:success type} or failure with ${5:error type}",
      " *",
      " * @example",
      " * ```typescript",
      " * const result = ${TM_FILENAME_BASE}($2);",
      " * if (result.success) {",
      " *   console.log(result.data);",
      " * } else {",
      " *   console.error(result.error);",
      " * }",
      " * ```",
      " */"
    ],
    description: "JSDoc for Result-returning function"
  },
  
  "Async Function": {
    prefix: "jsdoc-async",
    body: [
      "/**",
      " * ${1:Description}",
      " *",
      " * @param ${2:paramName} - ${3:Parameter description}",
      " * @returns Promise resolving to ${4:return type}",
      " * @throws ${5:Never throws - errors handled via Result}",
      " */"
    ],
    description: "JSDoc for async function"
  },
  
  "Complex Function": {
    prefix: "jsdoc-complex",
    body: [
      "/**",
      " * ${1:Detailed description}",
      " *",
      " * @param ${2:paramName} - ${3:Detailed parameter description}",
      " * @returns ${4:Detailed return description}",
      " *",
      " * @remarks",
      " * ${5:Implementation notes, performance considerations}",
      " *",
      " * @example",
      " * ```typescript",
      " * ${6:// Example usage}",
      " * ```",
      " *",
      " * @see {@link ${7:RelatedFunction}}",
      " */"
    ],
    description: "JSDoc for complex function with full documentation"
  }
};