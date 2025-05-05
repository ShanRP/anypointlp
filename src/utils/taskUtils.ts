
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';

/**
 * Validates if the provided JSON string is valid
 * @param json String to validate as JSON
 * @returns boolean indicating if the string is valid JSON
 */
export const isValidJson = (json: string): boolean => {
  if (!json || json.trim() === '') return false;
  try {
    JSON.parse(json);
    return true;
  } catch (e) {
    return false;
  }
};

/**
 * Validates if the provided XML string is valid
 * @param xml String to validate as XML
 * @returns boolean indicating if the string is valid XML
 */
export const isValidXml = (xml: string): boolean => {
  if (!xml || xml.trim() === '') return false;
  try {
    const parser = new DOMParser();
    const doc = parser.parseFromString(xml, "application/xml");
    const errorNode = doc.querySelector('parsererror');
    return !errorNode;
  } catch (e) {
    return false;
  }
};

/**
 * Fetches a task from the database by its ID and category
 * @param taskId ID of the task to fetch
 * @param category Category of the task
 */
export const fetchTaskById = async (taskId: string, category: string) => {
  try {
    const { data, error } = await supabase.rpc('apl_get_task_details', {
      task_id_param: taskId,
      category_param: category
    });
    
    if (error) throw error;
    return data;
  } catch (error) {
    console.error('Error fetching task by ID:', error);
    toast.error('Failed to fetch task details');
    return null;
  }
};

/**
 * Generates a short ID for task identification
 * @returns A short alphanumeric ID
 */
export const generateShortId = (): string => {
  return Math.random().toString(36).substring(2, 10).toUpperCase();
};

/**
 * Formats a task category for display
 * @param category The task category
 * @returns Formatted category string
 */
export const formatTaskCategory = (category: string): string => {
  switch (category.toLowerCase()) {
    case 'dataweave':
      return 'DataWeave';
    case 'integration':
      return 'Integration';
    case 'raml':
      return 'RAML';
    case 'munit':
      return 'MUnit';
    case 'sampledata':
      return 'Sample Data';
    case 'document':
      return 'Document';
    case 'diagram':
      return 'Diagram';
    default:
      return category.charAt(0).toUpperCase() + category.slice(1);
  }
};
