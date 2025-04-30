
/**
 * Generates a random task ID with a prefix
 * @returns A random task ID string
 */
export const generateTaskId = (): string => {
  const prefix = 'TSK';
  const randomPart = Math.random().toString(36).substring(2, 8).toUpperCase();
  const timestamp = Date.now().toString().slice(-6);
  return `${prefix}-${randomPart}-${timestamp}`;
};
