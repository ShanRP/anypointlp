
import { useState, useEffect, useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';
import { Json } from '@/integrations/supabase/types';
import { useAuth } from '@/hooks/useAuth';

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
  flow_description?: string;
  munit_content?: string;
  runtime?: string;
  number_of_scenarios?: number;
  
  // Sample Data specific properties
  source_format?: string;
  schema_content?: string;
  result_content?: string;
}

export interface IntegrationGeneratorProps {
  onTaskCreated?: (task: any) => void;
  selectedWorkspaceId?: string;
  onBack?: () => void;
  onSaveTask?: (taskId: string) => void;
}

export const useWorkspaceTasks = (workspaceId: string) => {
  const [tasks, setTasks] = useState<WorkspaceTask[]>([]);
  const [selectedTask, setSelectedTask] = useState<TaskDetails | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const { user } = useAuth();

  const fetchIntegrationTasks = useCallback(async () => {
    if (!workspaceId) return [];
    
    try {
      console.log('Fetching integration tasks for workspace:', workspaceId);
      
      const { data, error } = await supabase
        .from('apl_integration_tasks')
        .select('*')
        .eq('workspace_id', workspaceId)
        .order('created_at', { ascending: false });
      
      if (error) {
        console.error('Error fetching integration tasks:', error);
        throw error;
      }
      
      const integrationTasks = (data || []).map((task: any) => ({
        id: task.id,
        task_id: task.task_id,
        task_name: task.task_name,
        created_at: task.created_at,
        workspace_id: workspaceId,
        category: 'integration',
        description: task.description || ''
      }));
      
      console.log('Fetched integration tasks:', integrationTasks.length);
      return integrationTasks;
    } catch (err: any) {
      console.error('Error in fetchIntegrationTasks:', err);
      return [];
    }
  }, [workspaceId]);

  const fetchRamlTasks = useCallback(async () => {
    if (!workspaceId) return [];
    
    try {
      console.log('Fetching RAML tasks for workspace:', workspaceId);
      
      const { data, error } = await supabase
        .from('apl_raml_tasks')
        .select('*')
        .eq('workspace_id', workspaceId)
        .order('created_at', { ascending: false });
      
      if (error) {
        console.error('Error fetching RAML tasks:', error);
        throw error;
      }
      
      const ramlTasks = Array.isArray(data) ? data.map((task: any) => ({
        id: task.id,
        task_id: task.task_id,
        task_name: task.task_name,
        created_at: task.created_at,
        workspace_id: workspaceId,
        category: 'raml',
        description: task.description || ''
      })) : [];
      
      console.log('Fetched RAML tasks:', ramlTasks.length);
      return ramlTasks;
    } catch (err: any) {
      console.error('Error in fetchRamlTasks:', err);
      return [];
    }
  }, [workspaceId]);

  const fetchMunitTasks = useCallback(async () => {
    if (!workspaceId) return [];
    
    try {
      console.log('Fetching MUnit tasks for workspace:', workspaceId);
      
      const { data, error } = await supabase
        .from('apl_munit_tasks')
        .select('*')
        .eq('workspace_id', workspaceId)
        .order('created_at', { ascending: false });
      
      if (error) {
        console.error('Error fetching MUnit tasks:', error);
        throw error;
      }
      
      const munitTasks = Array.isArray(data) ? data.map((task: any) => ({
        id: task.id,
        task_id: task.task_id,
        task_name: task.task_name,
        created_at: task.created_at,
        workspace_id: workspaceId,
        category: 'munit',
        description: task.description || ''
      })) : [];
      
      console.log('Fetched MUnit tasks:', munitTasks.length);
      return munitTasks;
    } catch (err: any) {
      console.error('Error in fetchMunitTasks:', err);
      return [];
    }
  }, [workspaceId]);

  const fetchSampleDataTasks = useCallback(async () => {
    if (!workspaceId) return [];
    
    try {
      console.log('Fetching Sample Data tasks for workspace:', workspaceId);
      
      // Using direct query instead of RPC function to avoid type issues
      const { data, error } = await supabase
        .from('apl_sample_data_tasks')
        .select('*')
        .eq('workspace_id', workspaceId)
        .order('created_at', { ascending: false });
      
      if (error) {
        console.error('Error fetching Sample Data tasks:', error);
        throw error;
      }
      
      const sampleDataTasks = (data || []).map((task: any) => ({
        id: task.id,
        task_id: task.task_id,
        task_name: task.task_name,
        created_at: task.created_at,
        workspace_id: workspaceId,
        category: 'sampledata',
        description: task.description || ''
      }));
      
      console.log('Fetched Sample Data tasks:', sampleDataTasks.length);
      return sampleDataTasks;
    } catch (err: any) {
      console.error('Error in fetchSampleDataTasks:', err);
      return [];
    }
  }, [workspaceId]);

  const fetchWorkspaceTasks = useCallback(async () => {
    if (!workspaceId) return;
    
    setLoading(true);
    setError(null);
    
    try {
      const { data, error } = await supabase.rpc('apl_get_workspace_tasks', { 
        workspace_id_param: workspaceId 
      });
      
      if (error) throw error;
      
      const workspaceTasks = (data as Array<{
        id: string;
        task_id: string;
        task_name: string;
        created_at: string;
        description?: string;
        category?: string;
      }> || []).map(task => ({
        ...task,
        workspace_id: workspaceId,
        description: task.description || '',
        category: task.category || 'dataweave',
        task_id: task.task_id || `T-${task.id.substring(0, 8).toUpperCase()}`
      }));
      
      const integrationTasks = await fetchIntegrationTasks();
      const ramlTasks = await fetchRamlTasks();
      const munitTasks = await fetchMunitTasks();
      const sampleDataTasks = await fetchSampleDataTasks();
      
      const allTasks = [...workspaceTasks, ...integrationTasks, ...ramlTasks, ...munitTasks, ...sampleDataTasks].sort((a, b) => 
        new Date(b.created_at).getTime() - new Date(a.created_at).getTime()
      );
      
      setTasks(allTasks);
      console.log('Total tasks loaded:', allTasks.length);
    } catch (err: any) {
      console.error('Error fetching workspace tasks:', err);
      setError(err.message);
      toast.error('Failed to load tasks');
    } finally {
      setLoading(false);
    }
  }, [workspaceId, fetchIntegrationTasks, fetchRamlTasks, fetchMunitTasks, fetchSampleDataTasks]);

  const fetchIntegrationTaskDetails = useCallback(async (taskId: string) => {
    try {
      console.log('Fetching integration task details for:', taskId);
      
      let { data, error } = await supabase
        .from('apl_integration_tasks')
        .select('*')
        .eq('task_id', taskId)
        .limit(1);
      
      if ((!data || data.length === 0) && taskId.match(/^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i)) {
        console.log('Task not found by task_id, trying UUID:', taskId);
        ({ data, error } = await supabase
          .from('apl_integration_tasks')
          .select('*')
          .eq('id', taskId)
          .limit(1));
      }
      
      if (error) {
        console.error('Error fetching integration task details:', error);
        throw error;
      }
      
      if (data && data.length > 0) {
        const integrationTask = data[0];
        console.log('Found task in integration tasks table');
        
        const taskDetails: TaskDetails = {
          id: integrationTask.id,
          task_id: integrationTask.task_id,
          task_name: integrationTask.task_name || 'Integration Flow',
          input_format: 'Flow Specification',
          input_samples: [{ id: 'input1', value: integrationTask.description, isValid: true }],
          output_samples: [],
          notes: integrationTask.description || '',
          generated_scripts: [{
            id: `script-${Date.now()}`,
            code: integrationTask.generated_code || '',
          }],
          created_at: integrationTask.created_at,
          workspace_id: workspaceId,
          category: 'integration',
          description: integrationTask.description || ''
        };
        
        setSelectedTask(taskDetails);
        return taskDetails;
      }
      
      return null;
    } catch (err: any) {
      console.error('Error in fetchIntegrationTaskDetails:', err);
      return null;
    }
  }, [workspaceId]);

  const fetchRamlTaskDetails = useCallback(async (taskId: string) => {
    try {
      console.log('Fetching RAML task details for:', taskId);
      
      let data;
      let error;
      
      const isUuid = taskId.match(/^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i);
      
      if (isUuid) {
        console.log('Using UUID for RAML task lookup:', taskId);
        ({ data, error } = await supabase
          .from('apl_raml_tasks')
          .select('*')
          .eq('id', taskId)
          .limit(1));
      } else {
        console.log('Using task_id for RAML task lookup:', taskId);
        ({ data, error } = await supabase
          .from('apl_raml_tasks')
          .select('*')
          .eq('task_id', taskId)
          .limit(1));
      }
      
      if (error) {
        console.error('Error fetching RAML task details:', error);
        throw error;
      }
      
      if (data && data.length > 0) {
        const ramlTask = data[0];
        console.log('Found task in RAML tasks table');
        
        const taskDetails: TaskDetails = {
          id: ramlTask.id,
          task_id: ramlTask.task_id,
          task_name: ramlTask.task_name || 'RAML Specification',
          input_format: 'RAML Specification',
          input_samples: [],
          output_samples: [],
          notes: ramlTask.description || '',
          generated_scripts: [{
            id: `script-${Date.now()}`,
            code: ramlTask.raml_content || '',
          }],
          created_at: ramlTask.created_at,
          workspace_id: workspaceId,
          category: 'raml',
          description: ramlTask.description || '',
          api_name: ramlTask.api_name,
          api_version: ramlTask.api_version,
          base_uri: ramlTask.base_uri,
          endpoints: ramlTask.endpoints,
          raml_content: ramlTask.raml_content,
          documentation: ramlTask.documentation
        };
        
        setSelectedTask(taskDetails);
        return taskDetails;
      }
      
      return null;
    } catch (err: any) {
      console.error('Error in fetchRamlTaskDetails:', err);
      return null;
    }
  }, [workspaceId]);

  const fetchMunitTaskDetails = useCallback(async (taskId: string) => {
    try {
      console.log('Fetching MUnit task details for:', taskId);
      
      let data;
      let error;
      
      const isUuid = taskId.match(/^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i);
      
      if (isUuid) {
        console.log('Using UUID for MUnit task lookup:', taskId);
        const result = await supabase
          .from('apl_munit_tasks')
          .select('*')
          .eq('id', taskId)
          .limit(1);
          
        data = result.data;
        error = result.error;
      } else {
        console.log('Using task_id for MUnit task lookup:', taskId);
        const result = await supabase
          .from('apl_munit_tasks')
          .select('*')
          .eq('task_id', taskId)
          .limit(1);
          
        data = result.data;
        error = result.error;
      }
      
      if (error) {
        console.error('Error fetching MUnit task details:', error);
        throw error;
      }
      
      if (data && data.length > 0) {
        const munitTask = data[0];
        console.log('Found task in MUnit tasks table');
        
        const taskDetails: TaskDetails = {
          id: munitTask.id,
          task_id: munitTask.task_id,
          task_name: munitTask.task_name || 'MUnit Test',
          created_at: munitTask.created_at,
          workspace_id: workspaceId,
          category: 'munit',
          description: munitTask.description || '',
          flow_implementation: munitTask.flow_implementation || '',
          flow_description: munitTask.flow_description || '',
          munit_content: munitTask.munit_content || '',
          runtime: munitTask.runtime || '',
          number_of_scenarios: munitTask.number_of_scenarios || 1,
          generated_scripts: [{
            id: `script-${Date.now()}`,
            code: munitTask.munit_content || '',
          }]
        };
        
        setSelectedTask(taskDetails);
        return taskDetails;
      }
      
      return null;
    } catch (err: any) {
      console.error('Error in fetchMunitTaskDetails:', err);
      return null;
    }
  }, [workspaceId]);

  const fetchSampleDataTaskDetails = useCallback(async (taskId: string) => {
    try {
      console.log('Fetching Sample Data task details for:', taskId);
      
      let data;
      let error;
      
      const isUuid = taskId.match(/^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i);
      
      if (isUuid) {
        console.log('Using UUID for Sample Data task lookup:', taskId);
        const result = await supabase
          .from('apl_sample_data_tasks')
          .select('*')
          .eq('id', taskId)
          .limit(1);
          
        data = result.data;
        error = result.error;
      } else {
        console.log('Using task_id for Sample Data task lookup:', taskId);
        const result = await supabase
          .from('apl_sample_data_tasks')
          .select('*')
          .eq('task_id', taskId)
          .limit(1);
          
        data = result.data;
        error = result.error;
      }
      
      if (error) {
        console.error('Error fetching Sample Data task details:', error);
        throw error;
      }
      
      if (data && data.length > 0) {
        const sampleDataTask = data[0];
        console.log('Found task in Sample Data tasks table');
        
        const taskDetails: TaskDetails = {
          id: sampleDataTask.id,
          task_id: sampleDataTask.task_id,
          task_name: sampleDataTask.task_name || 'Sample Data',
          created_at: sampleDataTask.created_at,
          workspace_id: workspaceId,
          category: 'sampledata',
          description: sampleDataTask.description || '',
          source_format: sampleDataTask.source_format || 'JSON',
          schema_content: sampleDataTask.schema_content || '',
          result_content: sampleDataTask.result_content || '',
          notes: sampleDataTask.notes || '',
          generated_scripts: [{
            id: `script-${Date.now()}`,
            code: sampleDataTask.result_content || '',
          }]
        };
        
        setSelectedTask(taskDetails);
        return taskDetails;
      }
      
      return null;
    } catch (err: any) {
      console.error('Error in fetchSampleDataTaskDetails:', err);
      return null;
    }
  }, [workspaceId]);

  const fetchTaskDetails = useCallback(async (taskId: string) => {
    setLoading(true);
    setError(null);
    
    try {
      const integrationTaskDetails = await fetchIntegrationTaskDetails(taskId);
      
      if (integrationTaskDetails) {
        console.log('Found task in integration tasks table');
        return;
      }
      
      const ramlTaskDetails = await fetchRamlTaskDetails(taskId);
      
      if (ramlTaskDetails) {
        console.log('Found task in RAML tasks table');
        return;
      }
      
      const munitTaskDetails = await fetchMunitTaskDetails(taskId);
      
      if (munitTaskDetails) {
        console.log('Found task in MUnit tasks table');
        return;
      }
      
      const sampleDataTaskDetails = await fetchSampleDataTaskDetails(taskId);
      
      if (sampleDataTaskDetails) {
        console.log('Found task in Sample Data tasks table');
        return;
      }
      
      console.log('Task not found in integration, RAML, MUnit, or Sample Data tasks, checking regular tasks');
      
      const { data, error } = await supabase.rpc('apl_get_task_details', { 
        task_id_param: taskId 
      });
      
      if (error) throw error;
      
      if (data && data.length > 0) {
        const taskDetails = data[0] as {
          id: string;
          task_id: string;
          task_name: string;
          input_format: string;
          input_samples: Json;
          output_samples: Json;
          notes: string;
          generated_scripts: Json;
          created_at: string;
          category?: string;
          description?: string;
        };
        
        const taskWithWorkspace = {
          ...taskDetails,
          workspace_id: workspaceId,
          category: taskDetails.category || 'dataweave',
          description: taskDetails.description || '',
          task_id: taskDetails.task_id || `T-${taskDetails.id.substring(0, 8).toUpperCase()}`
        } as TaskDetails;
        
        setSelectedTask(taskWithWorkspace);
        console.log('Found task in regular tasks table');
      } else {
        setSelectedTask(null);
        toast.warning('Task not found');
      }
    } catch (err: any) {
      console.error('Error fetching task details:', err);
      setError(err.message);
      toast.error('Failed to load task details');
    } finally {
      setLoading(false);
    }
  }, [workspaceId, fetchIntegrationTaskDetails, fetchRamlTaskDetails, fetchMunitTaskDetails, fetchSampleDataTaskDetails]);

  const saveTask = useCallback(async (task: {
    workspace_id: string;
    task_id?: string;
    task_name: string;
    input_format: string;
    input_samples: any[];
    output_samples: any[];
    notes?: string;
    generated_scripts: any[];
    user_id: string;
    category: string;
    description?: string;
  }) => {
    try {
      const taskId = task.task_id || `T-${crypto.randomUUID().substring(0, 8).toUpperCase()}`;
      
      const taskData = {
        workspace_id: task.workspace_id,
        task_id: taskId,
        task_name: task.task_name,
        input_format: task.input_format,
        input_samples: JSON.parse(JSON.stringify(task.input_samples)) as Json,
        output_samples: JSON.parse(JSON.stringify(task.output_samples)) as Json,
        notes: task.notes || '',
        generated_scripts: JSON.parse(JSON.stringify(task.generated_scripts)) as Json,
        user_id: task.user_id,
        category: task.category,
        description: task.description || ''
      };

      const { data, error } = await supabase
        .from('apl_dataweave_tasks')
        .insert([taskData])
        .select();
      
      if (error) throw error;
      
      await fetchWorkspaceTasks();
      
      toast.success('Task saved successfully!');
      return data;
    } catch (err: any) {
      console.error('Error saving task:', err);
      toast.error('Failed to save task');
      throw err;
    }
  }, [fetchWorkspaceTasks]);

  const saveRamlTask = useCallback(async (task: {
    workspace_id: string;
    task_id?: string;
    task_name: string;
    user_id: string;
    description?: string;
    raml_content?: string;
    api_name?: string;
    api_version?: string;
    base_uri?: string;
    endpoints?: any;
    documentation?: string;
  }) => {
    try {
      const taskId = task.task_id || `R-${crypto.randomUUID().substring(0, 8).toUpperCase()}`;
      
      const taskData = {
        workspace_id: task.workspace_id,
        task_id: taskId,
        task_name: task.task_name,
        user_id: task.user_id,
        description: task.description || '',
        raml_content: task.raml_content || '',
        api_name: task.api_name || '',
        api_version: task.api_version || '',
        base_uri: task.base_uri || '',
        endpoints: task.endpoints || [],
        documentation: task.documentation || '',
        category: 'raml'
      };

      const { data, error } = await supabase
        .from('apl_raml_tasks')
        .insert([taskData])
        .select();
      
      if (error) throw error;
      
      await fetchWorkspaceTasks();
      
      toast.success('RAML task saved successfully!');
      return data;
    } catch (err: any) {
      console.error('Error saving RAML task:', err);
      toast.error('Failed to save RAML task');
      throw err;
    }
  }, [fetchWorkspaceTasks]);

  const saveMunitTask = useCallback(async (task: {
    workspace_id: string;
    task_id?: string;
    task_name: string;
    user_id: string;
    description?: string;
    flow_implementation?: string;
    flow_description?: string;
    munit_content?: string;
    runtime?: string;
    number_of_scenarios?: number;
  }) => {
    try {
      const taskId = task.task_id || `M-${crypto.randomUUID().substring(0, 8).toUpperCase()}`;
      
      // Direct insert instead of using RPC to avoid type issues
      const { data, error } = await supabase
        .from('apl_munit_tasks')
        .insert([{
          workspace_id: task.workspace_id,
          task_id: taskId,
          task_name: task.task_name,
          user_id: task.user_id,
          description: task.description || '',
          flow_implementation: task.flow_implementation || '',
          flow_description: task.flow_description || '',
          munit_content: task.munit_content || '',
          runtime: task.runtime || '',
          number_of_scenarios: task.number_of_scenarios || 1,
          category: 'munit'
        }])
        .select();
      
      if (error) throw error;
      
      await fetchWorkspaceTasks();
      
      toast.success('MUnit task saved successfully!');
      return data;
    } catch (err: any) {
      console.error('Error saving MUnit task:', err);
      toast.error('Failed to save MUnit task');
      throw err;
    }
  }, [fetchWorkspaceTasks]);

  const saveSampleDataTask = useCallback(async (task: {
    workspace_id: string;
    task_id?: string;
    task_name: string;
    user_id: string;
    description?: string;
    source_format?: string;
    schema_content?: string;
    result_content?: string;
    notes?: string;
  }) => {
    try {
      const taskId = task.task_id || `S-${crypto.randomUUID().substring(0, 8).toUpperCase()}`;
      
      console.log('Saving sample data task with ID:', taskId);
      
      // Direct insert instead of using RPC to avoid type issues
      const { data, error } = await supabase
        .from('apl_sample_data_tasks')
        .insert([{
          workspace_id: task.workspace_id,
          task_id: taskId,
          task_name: task.task_name,
          user_id: task.user_id,
          description: task.description || '',
          source_format: task.source_format || 'JSON',
          schema_content: task.schema_content || '',
          result_content: task.result_content || '',
          notes: task.notes || '',
          category: 'sampledata'
        }])
        .select();
      
      if (error) {
        console.error('Error saving Sample Data task:', error);
        throw error;
      }
      
      console.log('Sample data task saved successfully:', data);
      
      // Fetch tasks immediately after saving to update the list
      await fetchWorkspaceTasks();
      
      toast.success('Sample Data task saved successfully!');
      return data;
    } catch (err: any) {
      console.error('Error saving Sample Data task:', err);
      toast.error('Failed to save Sample Data task');
      throw err;
    }
  }, [fetchWorkspaceTasks]);

  useEffect(() => {
    if (workspaceId) {
      fetchWorkspaceTasks();
    } else {
      setTasks([]);
    }
  }, [workspaceId, fetchWorkspaceTasks]);

  return {
    tasks,
    selectedTask,
    loading,
    error,
    fetchWorkspaceTasks,
    fetchTaskDetails,
    saveTask,
    saveRamlTask,
    saveMunitTask,
    saveSampleDataTask
  };
};
