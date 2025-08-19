/**
 * Demo file showing const vs let patterns
 * This demonstrates the CodeRabbit pattern: "Use const instead of let"
 */

/**
 * Process array data by adding a processed flag
 * @param input - Array of unknown items to process
 * @returns Object with processed result and count
 */
export function processData(input: unknown[]): { result: unknown[]; count: number } {
  const result = input.map((item) => ({ ...item, processed: true })); // Should be const
  let mutableCounter = 0; // This one is correct as let
  
  for (const item of result) {
    mutableCounter++;
  }
  
  return { result, count: mutableCounter };
}