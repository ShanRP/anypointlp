
/**
 * Generates a unique task ID based on the task category
 * @param category The category of the task
 * @returns A unique task ID with category prefix
 */
export const generateTaskId = (category: string): string => {
  const prefixMap: Record<string, string> = {
    dataweave: 'DWL',
    integration: 'INT',
    raml: 'APL',
    munit: 'MUT',
    sampleData: 'DAT',
    document: 'DOC',
    diagram: 'DIA',
    default: 'TSK'
  };
  
  const categoryPrefix = prefixMap[category] || prefixMap.default;
  const randomId = Math.random().toString(36).substring(2, 7).toUpperCase();
  
  return `${categoryPrefix}-${randomId}`;
};

/**
 * Gets the appropriate icon name for a task category
 * @param category The category of the task
 * @returns The icon name for the task category
 */
export const getTaskCategoryIcon = (category: string): string => {
  const iconMap: Record<string, string> = {
    dataweave: 'database',
    integration: 'file-code-2',
    raml: 'file-code',
    munit: 'test-tube-2',
    sampleData: 'database',
    document: 'file-text',
    diagram: 'file-question',
    default: 'file'
  };
  
  return iconMap[category] || iconMap.default;
};
