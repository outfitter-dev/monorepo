/**
 * Demo file showing missing await patterns
 * This demonstrates the CodeRabbit pattern: "Add missing await keyword"
 */

/**
 * Fetch user data from API
 * @param id - User identifier
 * @returns Promise with user data
 */
export async function fetchUserData(id: string): Promise<unknown> {
  // Missing await keyword here - should be: await fetch(...)
  const response = fetch(`/api/users/${id}`);
  return response.then((res) => res.json());
}