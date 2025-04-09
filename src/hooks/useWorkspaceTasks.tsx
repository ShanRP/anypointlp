
import { useState, useEffect, useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';
import { Json } from '@/integrations/supabase/types';
import { useAuth } from '@/hooks/useAuth';
import { v4 as uuidv4 } from 'uuid';

export interface WorkspaceTask {
  id: string;
  task_id: string;
  task_name: string;
  created_at: string;
  workspace_id: string; 
  category: string; // Category of the task (dataweave, raml, integration, munit, sampledata, document, diagram)
  description?: string; // Optional description field
}

export interface TaskDetails {
  id: string;
  task_id: string;
  task_name: string;
  input_format?: string;
  input_samples?: any[];
  output_samples?: any[];
  notes?: string;
  generated_scripts?: any[];
  created_at: string;
  workspace_id: string;
  category: string; // Category of the task
  description?: string; // Optional description field
  
  // RAML specific properties
  api_name?: string;
  api_version?: string;
  base_uri?: string;
  endpoints?: any[];
  raml_content?: string;
  documentation?: string;
  
  // MUnit specific properties
  flow_implementation?: string;
  runtime?: string;
  scenario_count?: number;
  generated_tests?: string;
  
  // Sample data specific properties
  dataweave_script?: string;
  input_schema?: string;
  output_schema?: string;
  generated_data?: string;
  sample_count?: number;
  
  // Diagram specific properties
  diagram_type?: string;
  diagram_content?: string;
  generated_diagram?: string;
  
  // Document specific properties
  document_type?: string;
  source_content?: string;
  generated_document?: string;
}

export interface IntegrationGeneratorPayload {
  task_id: string;
  task_name: string;
  workspace_id: string;
  description: string;
  diagrams?: any[];
  runtime?: string;
  category: 'integration';
  flow_summary?: string;
  flow_implementation?: string;
  flow_constants?: string;
  pom_dependencies?: string;
  compilation_check?: string;
}

export interface RAMLGeneratorPayload {
  task_id: string;
  task_name: string;
  workspace_id: string;
  description: string;
  api_name: string;
  api_version?: string;
  base_uri?: string;
  endpoints?: any[];
  raml_content: string;
  documentation?: string;
  category: 'raml';
}

export interface MUnitGeneratorPayload {
  task_id: string;
  task_name: string;
  workspace_id: string;
  user_id: string;
  description: string;
  notes?: string;
  flow_implementation: string;
  runtime: string;
  scenario_count: number;
  generated_tests: string;
  category: 'munit';
}

export interface SampleDataPayload {
  task_id: string;
  task_name: string;
  workspace_id: string;
  user_id: string;
  description: string;
  dataweave_script: string;
  input_schema?: string;
  output_schema?: string;
  generated_data: string;
  sample_count?: number;
  category: 'sampledata';
}

export interface DiagramPayload {
  task_id: string;
  task_name: string;
  workspace_id: string;
  user_id: string;
  description: string;
  diagram_type: string;
  diagram_content: string;
  generated_diagram: string;
  category: 'diagram';
}

export interface DocumentPayload {
  task_id: string;
  task_name: string;
  workspace_id: string;
  user_id: string;
  description: string;
  document_type: string;
  source_content: string;
  generated_document: string;
  category: 'document';
}

export const useWorkspaceTasks = (workspaceId: string) => {
  const [tasks, setTasks] = useState<WorkspaceTask[]>([]);
  const [loading, setLoading] = useState(false);
  const [selectedTask, setSelectedTask] = useState<TaskDetails | null>(null);
  const [selectedTaskLoading, setSelectedTaskLoading] = useState(false);
  const { user } = useAuth();

  // Fetch all tasks for the workspace
  const fetchWorkspaceTasks = useCallback(async () => {
    if (!workspaceId || !user) return;
    
    setLoading(true);
    try {
      const { data, error } = await supabase
        .rpc('apl_get_workspace_tasks', { workspace_id_param: workspaceId });

      if (error) {
        console.error('Error fetching workspace tasks:', error);
        return;
      }

      if (data) {
        setTasks(data as WorkspaceTask[]);
      }
    } catch (error) {
      console.error('Error in fetchWorkspaceTasks:', error);
    } finally {
      setLoading(false);
    }
  }, [workspaceId, user]);

  // Fetch MUnit tasks for the workspace
  const fetchMUnitTasks = useCallback(async () => {
    if (!workspaceId || !user) return [];
    
    try {
      // Try using the function first
      try {
        const { data, error } = await supabase
          .rpc('apl_get_munit_tasks', { workspace_id_param: workspaceId });

        if (!error && data) {
          return data;
        }
      } catch (functionError) {
        console.error('Error calling function apl_get_munit_tasks:', functionError);
      }
      
      // Fall back to direct query if function is not available
      // This has to be a string literal to avoid TypeScript checking
      const { data, error } = await supabase
        .from('apl_munit_tasks')
        .select('*')
        .eq('workspace_id', workspaceId)
        .eq('user_id', user.id)
        .order('created_at', { ascending: false });

      if (error) {
        console.error('Error fetching MUnit tasks:', error);
        return [];
      }

      return data || [];
    } catch (error) {
      console.error('Error in fetchMUnitTasks:', error);
      return [];
    }
  }, [workspaceId, user]);

  // Fetch Sample Data tasks for the workspace
  const fetchSampleDataTasks = useCallback(async () => {
    if (!workspaceId || !user) return [];
    
    try {
      // Try using the function first
      try {
        const { data, error } = await supabase
          .rpc('apl_get_sample_data_tasks', { workspace_id_param: workspaceId });

        if (!error && data) {
          return data;
        }
      } catch (functionError) {
        console.error('Error calling function apl_get_sample_data_tasks:', functionError);
      }
      
      // Fall back to direct query if function is not available
      const { data, error } = await supabase
        .from('apl_sample_data_tasks')
        .select('*')
        .eq('workspace_id', workspaceId)
        .eq('user_id', user.id)
        .order('created_at', { ascending: false });

      if (error) {
        console.error('Error fetching Sample Data tasks:', error);
        return [];
      }

      return data || [];
    } catch (error) {
      console.error('Error in fetchSampleDataTasks:', error);
      return [];
    }
  }, [workspaceId, user]);

  // Fetch Diagram tasks for the workspace
  const fetchDiagramTasks = useCallback(async () => {
    if (!workspaceId || !user) return [];
    
    try {
      // Try using the function first
      try {
        const { data, error } = await supabase
          .rpc('apl_get_diagram_tasks', { workspace_id_param: workspaceId });

        if (!error && data) {
          return data;
        }
      } catch (functionError) {
        console.error('Error calling function apl_get_diagram_tasks:', functionError);
      }
      
      // Fall back to direct query if function is not available
      const { data, error } = await supabase
        .from('apl_diagram_tasks')
        .select('*')
        .eq('workspace_id', workspaceId)
        .eq('user_id', user.id)
        .order('created_at', { ascending: false });

      if (error) {
        console.error('Error fetching Diagram tasks:', error);
        return [];
      }

      return data || [];
    } catch (error) {
      console.error('Error in fetchDiagramTasks:', error);
      return [];
    }
  }, [workspaceId, user]);

  // Fetch Document tasks for the workspace
  const fetchDocumentTasks = useCallback(async () => {
    if (!workspaceId || !user) return [];
    
    try {
      // Try using the function first
      try {
        const { data, error } = await supabase
          .rpc('apl_get_document_tasks', { workspace_id_param: workspaceId });

        if (!error && data) {
          return data;
        }
      } catch (functionError) {
        console.error('Error calling function apl_get_document_tasks:', functionError);
      }
      
      // Fall back to direct query if function is not available
      const { data, error } = await supabase
        .from('apl_document_tasks')
        .select('*')
        .eq('workspace_id', workspaceId)
        .eq('user_id', user.id)
        .order('created_at', { ascending: false });

      if (error) {
        console.error('Error fetching Document tasks:', error);
        return [];
      }

      return data || [];
    } catch (error) {
      console.error('Error in fetchDocumentTasks:', error);
      return [];
    }
  }, [workspaceId, user]);

  // Fetch task details based on task ID
  const fetchTaskDetails = useCallback(async (taskId: string) => {
    if (!taskId || !user) return;
    
    setSelectedTaskLoading(true);
    setSelectedTask(null);
    
    try {
      // First, check which category this task belongs to by looking it up in the tasks list
      const taskFromList = tasks.find(task => task.id === taskId);
      const category = taskFromList?.category || '';
      
      let taskDetails: TaskDetails | null = null;
      
      if (category === 'dataweave') {
        const { data, error } = await supabase
          .rpc('apl_get_task_details', { task_id_param: taskId });
          
        if (error) {
          console.error('Error fetching DataWeave task details:', error);
          return;
        }
        
        if (data && Array.isArray(data) && data.length > 0) {
          const details = data[0];
          // Convert Json to array if needed
          const inputSamples = Array.isArray(details.input_samples) 
            ? details.input_samples 
            : (details.input_samples ? [details.input_samples] : []);
          
          const outputSamples = Array.isArray(details.output_samples) 
            ? details.output_samples 
            : (details.output_samples ? [details.output_samples] : []);
          
          const generatedScripts = Array.isArray(details.generated_scripts) 
            ? details.generated_scripts 
            : (details.generated_scripts ? [details.generated_scripts] : []);
            
          taskDetails = {
            ...details,
            input_samples: inputSamples,
            output_samples: outputSamples,
            generated_scripts: generatedScripts,
            category: 'dataweave',
            workspace_id: workspaceId // Add missing workspace_id property
          };
        }
      } else if (category === 'integration') {
        const { data, error } = await supabase
          .rpc('apl_get_integration_task_details', { task_id_param: taskId });
          
        if (error) {
          console.error('Error fetching Integration task details:', error);
          return;
        }
        
        if (data && Array.isArray(data) && data.length > 0) {
          taskDetails = data[0] as unknown as TaskDetails;
        }
      } else if (category === 'raml') {
        const { data, error } = await supabase
          .rpc('apl_get_raml_task_details', { task_id_param: taskId });
          
        if (error) {
          console.error('Error fetching RAML task details:', error);
          return;
        }
        
        if (data && Array.isArray(data) && data.length > 0) {
          taskDetails = data[0] as unknown as TaskDetails;
        }
      } else if (category === 'munit') {
        try {
          // Try using the function first
          const { data, error } = await supabase
            .rpc('apl_get_munit_task_details', { task_id_param: taskId });
            
          if (!error && data && Array.isArray(data) && data.length > 0) {
            taskDetails = data[0] as unknown as TaskDetails;
          } else {
            throw new Error('Failed to fetch using function');
          }
        } catch (functionError) {
          console.error('Error with function, falling back to direct query:', functionError);
          
          // Fall back to direct query
          const { data, error } = await supabase
            .from('apl_munit_tasks')
            .select('*')
            .eq('id', taskId)
            .eq('user_id', user.id)
            .single();
            
          if (error) {
            console.error('Error fetching MUnit task details:', error);
            return;
          }
          
          if (data) {
            taskDetails = data as unknown as TaskDetails;
          }
        }
      } else if (category === 'sampledata') {
        try {
          // Try using the function first
          const { data, error } = await supabase
            .rpc('apl_get_sample_data_task_details', { task_id_param: taskId });
            
          if (!error && data && Array.isArray(data) && data.length > 0) {
            taskDetails = data[0] as unknown as TaskDetails;
          } else {
            throw new Error('Failed to fetch using function');
          }
        } catch (functionError) {
          console.error('Error with function, falling back to direct query:', functionError);
          
          // Fall back to direct query
          const { data, error } = await supabase
            .from('apl_sample_data_tasks')
            .select('*')
            .eq('id', taskId)
            .eq('user_id', user.id)
            .single();
            
          if (error) {
            console.error('Error fetching Sample Data task details:', error);
            return;
          }
          
          if (data) {
            taskDetails = data as unknown as TaskDetails;
          }
        }
      } else if (category === 'diagram') {
        try {
          // Try using the function first
          const { data, error } = await supabase
            .rpc('apl_get_diagram_task_details', { task_id_param: taskId });
            
          if (!error && data && Array.isArray(data) && data.length > 0) {
            taskDetails = data[0] as unknown as TaskDetails;
          } else {
            throw new Error('Failed to fetch using function');
          }
        } catch (functionError) {
          console.error('Error with function, falling back to direct query:', functionError);
          
          // Fall back to direct query
          const { data, error } = await supabase
            .from('apl_diagram_tasks')
            .select('*')
            .eq('id', taskId)
            .eq('user_id', user.id)
            .single();
            
          if (error) {
            console.error('Error fetching Diagram task details:', error);
            return;
          }
          
          if (data) {
            taskDetails = data as unknown as TaskDetails;
          }
        }
      } else if (category === 'document') {
        try {
          // Try using the function first
          const { data, error } = await supabase
            .rpc('apl_get_document_task_details', { task_id_param: taskId });
            
          if (!error && data && Array.isArray(data) && data.length > 0) {
            taskDetails = data[0] as unknown as TaskDetails;
          } else {
            throw new Error('Failed to fetch using function');
          }
        } catch (functionError) {
          console.error('Error with function, falling back to direct query:', functionError);
          
          // Fall back to direct query
          const { data, error } = await supabase
            .from('apl_document_tasks')
            .select('*')
            .eq('id', taskId)
            .eq('user_id', user.id)
            .single();
            
          if (error) {
            console.error('Error fetching Document task details:', error);
            return;
          }
          
          if (data) {
            taskDetails = data as unknown as TaskDetails;
          }
        }
      }
      
      setSelectedTask(taskDetails);
    } catch (error) {
      console.error('Error in fetchTaskDetails:', error);
    } finally {
      setSelectedTaskLoading(false);
    }
  }, [tasks, user, workspaceId]);

  // Save MUnit task to the database
  const saveMUnitTask = async (payload: MUnitGeneratorPayload) => {
    if (!user) {
      throw new Error('User not authenticated');
    }
    
    try {
      // Use as any to bypass TypeScript table checking
      const { data, error } = await supabase
        .from('apl_munit_tasks')
        .insert({
          user_id: user.id,
          workspace_id: payload.workspace_id,
          task_id: payload.task_id,
          task_name: payload.task_name,
          category: 'munit', 
          description: payload.description,
          notes: payload.notes,
          flow_implementation: payload.flow_implementation,
          runtime: payload.runtime,
          scenario_count: payload.scenario_count,
          generated_tests: payload.generated_tests
        })
        .select();
        
      if (error) {
        throw error;
      }
      
      // Refresh tasks list
      fetchWorkspaceTasks();
      
      return data;
    } catch (error) {
      console.error('Error saving MUnit task:', error);
      throw error;
    }
  };

  // Save Sample Data task to the database
  const saveSampleDataTask = async (payload: SampleDataPayload) => {
    if (!user) {
      throw new Error('User not authenticated');
    }
    
    try {
      // Use as any to bypass TypeScript table checking
      const { data, error } = await supabase
        .from('apl_sample_data_tasks')
        .insert({
          user_id: user.id,
          workspace_id: payload.workspace_id,
          task_id: payload.task_id,
          task_name: payload.task_name,
          category: 'sampledata',
          description: payload.description,
          dataweave_script: payload.dataweave_script,
          input_schema: payload.input_schema,
          output_schema: payload.output_schema,
          generated_data: payload.generated_data,
          sample_count: payload.sample_count || 5
        })
        .select();
        
      if (error) {
        throw error;
      }
      
      // Refresh tasks list
      fetchWorkspaceTasks();
      
      return data;
    } catch (error) {
      console.error('Error saving Sample Data task:', error);
      throw error;
    }
  };

  // Save Diagram task to the database
  const saveDiagramTask = async (payload: DiagramPayload) => {
    if (!user) {
      throw new Error('User not authenticated');
    }
    
    try {
      // Use as any to bypass TypeScript table checking
      const { data, error } = await supabase
        .from('apl_diagram_tasks')
        .insert({
          user_id: user.id,
          workspace_id: payload.workspace_id,
          task_id: payload.task_id,
          task_name: payload.task_name,
          category: 'diagram',
          description: payload.description,
          diagram_type: payload.diagram_type,
          diagram_content: payload.diagram_content,
          generated_diagram: payload.generated_diagram
        })
        .select();
        
      if (error) {
        throw error;
      }
      
      // Refresh tasks list
      fetchWorkspaceTasks();
      
      return data;
    } catch (error) {
      console.error('Error saving Diagram task:', error);
      throw error;
    }
  };

  // Save Document task to the database
  const saveDocumentTask = async (payload: DocumentPayload) => {
    if (!user) {
      throw new Error('User not authenticated');
    }
    
    try {
      // Use as any to bypass TypeScript table checking
      const { data, error } = await supabase
        .from('apl_document_tasks')
        .insert({
          user_id: user.id,
          workspace_id: payload.workspace_id,
          task_id: payload.task_id,
          task_name: payload.task_name,
          category: 'document',
          description: payload.description,
          document_type: payload.document_type,
          source_content: payload.source_content,
          generated_document: payload.generated_document
        })
        .select();
        
      if (error) {
        throw error;
      }
      
      // Refresh tasks list
      fetchWorkspaceTasks();
      
      return data;
    } catch (error) {
      console.error('Error saving Document task:', error);
      throw error;
    }
  };

  // Save RAML task to the database
  const saveRamlTask = async (payload: RAMLGeneratorPayload) => {
    if (!user) {
      throw new Error('User not authenticated');
    }
    
    try {
      const { data, error } = await supabase
        .from('apl_raml_tasks')
        .insert({
          user_id: user.id,
          workspace_id: payload.workspace_id,
          task_id: payload.task_id,
          task_name: payload.task_name,
          category: 'raml',
          description: payload.description,
          api_name: payload.api_name,
          api_version: payload.api_version,
          base_uri: payload.base_uri,
          endpoints: payload.endpoints,
          raml_content: payload.raml_content,
          documentation: payload.documentation
        })
        .select();
        
      if (error) {
        throw error;
      }
      
      // Refresh tasks list
      fetchWorkspaceTasks();
      
      return data;
    } catch (error) {
      console.error('Error saving RAML task:', error);
      throw error;
    }
  };

  // Load initial data when component mounts
  useEffect(() => {
    if (workspaceId && user) {
      fetchWorkspaceTasks();
    }
  }, [workspaceId, user, fetchWorkspaceTasks]);

  return {
    tasks,
    loading,
    selectedTask,
    selectedTaskLoading,
    fetchWorkspaceTasks,
    fetchTaskDetails,
    saveMUnitTask,
    saveSampleDataTask,
    saveDiagramTask,
    saveDocumentTask,
    saveRamlTask
  };
};
