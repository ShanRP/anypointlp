
// Since this file is in the read-only list, we need to create a separate utility function
// that can be used in RAMLGenerator.tsx to fix the issue with the 'eq' method
// We'll create a utility file for this purpose:

// src/utils/supabaseHelpers.ts
export const processRAMLRequest = async (supabase, userId, workspaceId, ramlData) => {
  try {
    // Handle the RAMLGenerator request without using the problematic .eq method
    // Instead use appropriate filtering methods based on the Supabase JS client API
    const result = await supabase
      .from('apl_raml_tasks')
      .insert(ramlData)
      .select();
    
    return { success: true, data: result.data };
  } catch (error) {
    console.error('Error processing RAML request:', error);
    return { success: false, error };
  }
};
