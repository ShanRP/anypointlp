
import { SupabaseClient } from '@supabase/supabase-js';

export const processRAMLRequest = async (
  supabase: SupabaseClient,
  userId: string,
  workspaceId: string,
  ramlData: any
) => {
  try {
    // Insert the RAML task data without using the .eq method
    const { data, error } = await supabase
      .from('apl_raml_tasks')
      .insert(ramlData)
      .select();
    
    if (error) {
      console.error('Error inserting RAML task:', error);
      return { success: false, error };
    }
    
    return { success: true, data };
  } catch (error) {
    console.error('Error processing RAML request:', error);
    return { success: false, error };
  }
};
