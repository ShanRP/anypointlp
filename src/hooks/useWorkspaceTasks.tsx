import { useState, useEffect, useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { v4 as uuidv4 } from 'uuid';
import { toast } from 'sonner';
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
  category: string;
  created_at: string;
  workspace_id: string;
  description?: string;
  input_format?: string;
  input_samples?: any[];
  output_samples?: any[];
  notes?: string;
  generated_scripts?: any[];
  raml_content?: string;
  api_name?: string;
  api_version?: string;
  base_uri?: string;
  documentation?: string;
  flow_implementation?: string;
  flow_description?: string;
  munit_content?: string;
  runtime?: string;
  number_of_scenarios?: number;
  source_format?: string;
  schema_content?: string;
  result_content?: string;
  document_type?: string;
  source_type?: string;
  code?: string;
  flow_diagram?: string;
  connection_steps?: string;
  endpoints?: any[];
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
      
      const { data, error } = await supabase
        .from('apl_sample_data_tasks')
        .select('*')
        .eq('workspace_id', workspaceId);
      
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

  const fetchDocumentTasks = useCallback(async () => {
    if (!workspaceId) return [];
    
    try {
      console.log('Fetching Document tasks for workspace:', workspaceId);
      
      const { data, error } = await supabase
        .from('apl_document_tasks')
        .select('*')
        .eq('workspace_id', workspaceId)
        .order('created_at', { ascending: false });
      
      if (error) {
        console.error('Error fetching Document tasks:', error);
        throw error;
      }
      
      const documentTasks = (data || []).map((task: any) => ({
        id: task.id,
        task_id: task.task_id || `DOC-${task.id.substring(0, 8)}`,
        task_name: task.task_name || 'Document Task',
        created_at: task.created_at,
        workspace_id: workspaceId,
        category: 'document',
        description: task.description || ''
      }));
      
      console.log('Fetched Document tasks:', documentTasks.length);
      return documentTasks;
    } catch (err: any) {
      console.error('Error in fetchDocumentTasks:', err);
      return [];
    }
  }, [workspaceId]);

  const fetchDiagramTasks = useCallback(async () => {
    if (!workspaceId) return [];
    
    try {
      console.log('Fetching Diagram tasks for workspace:', workspaceId);
      
      const { data, error } = await supabase
        .from('apl_diagram_tasks')
        .select('*')
        .eq('workspace_id', workspaceId)
        .order('created_at', { ascending: false });
      
      if (error) {
        console.error('Error fetching Diagram tasks:', error);
        throw error;
      }
      
      const diagramTasks = (data || []).map((task: any) => ({
        id: task.id,
        task_id: task.task_id || `DIA-${task.id.substring(0, 8)}`,
        task_name: task.task_name || 'Diagram Task',
        created_at: task.created_at,
        workspace_id: workspaceId,
        category: 'diagram',
        description: task.description || ''
      }));
      
      console.log('Fetched Diagram tasks:', diagramTasks.length);
      return diagramTasks;
    } catch (err: any) {
      console.error('Error in fetchDiagramTasks:', err);
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
      const documentTasks = await fetchDocumentTasks();
      const diagramTasks = await fetchDiagramTasks();
      
      const uniqueTaskIds = new Set<string>();
      const uniqueTasks: WorkspaceTask[] = [];
      
      const addUniqueTasksToArray = (tasksArray: WorkspaceTask[]) => {
        tasksArray.forEach(task => {
          const uniqueKey = `${task.id}-${task.category}`;
          if (!uniqueTaskIds.has(uniqueKey)) {
            uniqueTaskIds.add(uniqueKey);
            uniqueTasks.push(task);
          }
        });
      };
      
      addUniqueTasksToArray(workspaceTasks);
      addUniqueTasksToArray(integrationTasks);
      addUniqueTasksToArray(ramlTasks);
      addUniqueTasksToArray(munitTasks);
      addUniqueTasksToArray(sampleDataTasks);
      addUniqueTasksToArray(documentTasks);
      addUniqueTasksToArray(diagramTasks);
      
      const sortedTasks = uniqueTasks.sort((a, b) => 
        new Date(b.created_at).getTime() - new Date(a.created_at).getTime()
      );
      
      setTasks(sortedTasks);
      console.log('Total tasks loaded:', sortedTasks.length);
    } catch (err: any) {
      console.error('Error fetching workspace tasks:', err);
      setError(err.message);
      toast.error('Failed to load tasks');
    } finally {
      setLoading(false);
    }
  }, [workspaceId, fetchIntegrationTasks, fetchRamlTasks, fetchMunitTasks, fetchSampleDataTasks, fetchDocumentTasks, fetchDiagramTasks]);

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
          task_id: sampleDataTask.task_id || `SD-${sampleDataTask.id.substring(0, 8)}`,
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

  const fetchDocumentTaskDetails = useCallback(async (taskId: string) => {
    try {
      console.log('Fetching Document task details for:', taskId);
      
      let data;
      let error;
      
      const isUuid = taskId.match(/^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i);
      
      if (isUuid) {
        console.log('Using UUID for Document task lookup:', taskId);
        const result: any = await supabase
          .from('apl_document_tasks')
          .select('*')
          .eq('id', taskId)
          .limit(1);
          
        data = result.data;
        error = result.error;
      } else {
        console.log('Using task_id for Document task lookup:', taskId);
        const result: any = await supabase
          .from('apl_document_tasks')
          .select('*')
          .eq('task_id', taskId)
          .limit(1);
          
        data = result.data;
        error = result.error;
      }
      
      if (error) {
        console.error('Error fetching Document task details:', error);
        throw error;
      }
      
      if (data && data.length > 0) {
        const documentTask = data[0];
        console.log('Found task in Document tasks table');
        
        const taskDetails: TaskDetails = {
          id: documentTask.id,
          task_id: documentTask.task_id || `DOC-${documentTask.id.substring(0, 8)}`,
          task_name: documentTask.task_name || 'Document',
          created_at: documentTask.created_at,
          workspace_id: workspaceId,
          category: 'document',
          description: documentTask.description || '',
          document_type: documentTask.document_type || '',
          source_type: documentTask.source_type || '',
          code: documentTask.code || '',
          result_content: documentTask.result_content || '',
          generated_scripts: [{
            id: `script-${Date.now()}`,
            code: documentTask.result_content || '',
          }]
        };
        
        setSelectedTask(taskDetails);
        return taskDetails;
      }
      
      return null;
    } catch (err: any) {
      console.error('Error in fetchDocumentTaskDetails:', err);
      return null;
    }
  }, [workspaceId]);

  const fetchDiagramTaskDetails = useCallback(async (taskId: string) => {
    try {
      console.log('Fetching Diagram task details for:', taskId);
      
      let data;
      let error;
      
      const isUuid = taskId.match(/^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i);
      
      if (isUuid) {
        console.log('Using UUID for Diagram task lookup:', taskId);
        const result: any = await supabase
          .from('apl_diagram_tasks')
          .select('*')
          .eq('id', taskId)
          .limit(1);
          
        data = result.data;
        error = result.error;
      } else {
        console.log('Using task_id for Diagram task lookup:', taskId);
        const result: any = await supabase
          .from('apl_diagram_tasks')
          .select('*')
          .eq('task_id', taskId)
          .limit(1);
          
        data = result.data;
        error = result.error;
      }
      
      if (error) {
        console.error('Error fetching Diagram task details:', error);
        throw error;
      }
      
      if (data && data.length > 0) {
        const diagramTask = data[0];
        console.log('Found task in Diagram tasks table');
        
        const taskDetails: TaskDetails = {
          id: diagramTask.id,
          task_id: diagramTask.task_id || `DIA-${diagramTask.id.substring(0, 8)}`,
          task_name: diagramTask.task_name || 'Flow Diagram',
          created_at: diagramTask.created_at,
          workspace_id: workspaceId,
          category: 'diagram',
          description: diagramTask.description || '',
          raml_content: diagramTask.raml_content || '',
          flow_diagram: diagramTask.flow_diagram || '',
          connection_steps: diagramTask.connection_steps || '',
          result_content: diagramTask.result_content || '',
          generated_scripts: [{
            id: `script-${Date.now()}`,
            code: diagramTask.result_content || '',
          }]
        };
        
        setSelectedTask(taskDetails);
        return taskDetails;
      }
      
      return null;
    } catch (err: any) {
      console.error('Error in fetchDiagramTaskDetails:', err);
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
        setLoading(false);
        return;
      }
      
      const ramlTaskDetails = await fetchRamlTaskDetails(taskId);
      
      if (ramlTaskDetails) {
        console.log('Found task in RAML tasks table');
        setLoading(false);
        return;
      }
      
      const munitTaskDetails = await fetchMunitTaskDetails(taskId);
      
      if (munitTaskDetails) {
        console.log('Found task in MUnit tasks table');
        setLoading(false);
        return;
      }
      
      const sampleDataTaskDetails = await fetchSampleDataTaskDetails(taskId);
      
      if (sampleDataTaskDetails) {
        console.log('Found task in Sample Data tasks table');
        setLoading(false);
        return;
      }
      
      const documentTaskDetails = await fetchDocumentTaskDetails(taskId);
      
      if (documentTaskDetails) {
        console.log('Found task in Document tasks table');
        setLoading(false);
        return;
      }
      
      const diagramTaskDetails = await fetchDiagramTaskDetails(taskId);
      
      if (diagramTaskDetails) {
        console.log('Found task in Diagram tasks table');
        setLoading(false);
        return;
      }
      
      console.log('Task not found in specific task tables, checking regular tasks');
      
      const { data, error } = await supabase.rpc('apl_get_task_details', { 
        task_id_param: taskId 
      });
      
      if (error) throw error;
      
      if (data && data.length > 0) {
        const taskDetailsData = data[0] as {
          id: string;
          task_id: string;
          task_name: string;
          input_format: string;
          input_samples: any;
          output_samples: any;
          notes: string;
          generated_scripts: any;
          created_at: string;
          category?: string;
          description?: string;
        };
        
        const taskWithWorkspace: TaskDetails = {
          ...taskDetailsData,
          workspace_id: workspaceId,
          category: taskDetailsData.category || 'dataweave',
          description: taskDetailsData.description || '',
          task_id: taskDetailsData.task_id || `T-${taskDetailsData.id.substring(0, 8).toUpperCase()}`,
          input_samples: Array.isArray(taskDetailsData.input_samples) ? taskDetailsData.input_samples : [],
          output_samples: Array.isArray(taskDetailsData.output_samples) ? taskDetailsData.output_samples : [],
          generated_scripts: Array.isArray(taskDetailsData.generated_scripts) ? taskDetailsData.generated_scripts : []
        };
        
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
  }, [workspaceId, fetchIntegrationTaskDetails, fetchRamlTaskDetails, fetchMunitTaskDetails, fetchSampleDataTaskDetails, fetchDocumentTaskDetails, fetchDiagramTaskDetails]);

  const saveDocumentTask = async (documentData: any) => {
    try {
      const taskId = `DOC-${generateId()}`;
      
      const { data, error } = await supabase
        .from('apl_document_tasks')
        .insert([
          {
            task_id: taskId,
            task_name: documentData.task_name || 'Document Task',
            workspace_id: workspaceId,
            user_id: documentData.user_id,
            description: documentData.description || '',
            document_type: documentData.document_type || '',
            source_type: documentData.source_type || '',
            code: documentData.code || '',
            result_content: documentData.result_content || '',
            category: 'document'
          }
        ])
        .select();
      
      if (error) {
        throw error;
      }
      
      await fetchTasks();
      
      return data;
    } catch (error: any) {
      console.error('Error saving document task:', error);
      toast.error('Failed to save document task');
      throw error;
    }
  };

  const saveDiagramTask = async (diagramData: any) => {
    try {
      const taskId = `DIA-${generateId()}`;
      
      const { data, error } = await supabase
        .from('apl_diagram_tasks')
        .insert([
          {
            task_id: taskId,
            task_name: diagramData.task_name || 'Flow Diagram',
            workspace_id: workspaceId,
            user_id: diagramData.user_id,
            description: diagramData.description || '',
            raml_content: diagramData.raml_content || '',
            flow_diagram: diagramData.flow_diagram || '',
            connection_steps: diagramData.connection_steps || '',
            result_content: diagramData.result_content || '',
            category: 'diagram'
          }
        ])
        .select();
      
      if (error) {
        throw error;
      }
      
      await fetchTasks();
      
      return data;
    } catch (error: any) {
      console.error('Error saving diagram task:', error);
      toast.error('Failed to save diagram task');
      throw error;
    }
  };

  const saveSampleDataTask = async (sampleDataInfo: any) => {
    try {
      const taskId = `SD-${generateId()}`;
      
      const { data, error } = await supabase.rpc('apl_insert_sample_data_task', {
        workspace_id: sampleDataInfo.workspace_id,
        task_id: taskId,
        task_name: sampleDataInfo.task_name,
        user_id: sampleDataInfo.user_id,
        description: sampleDataInfo.description || '',
        source_format: sampleDataInfo.source_format || 'JSON',
        schema_content: sampleDataInfo.schema_content || '',
        result_content: sampleDataInfo.result_content || '',
        notes: sampleDataInfo.notes || '',
        category: 'sampledata'
      });
      
      if (error) {
        console.error('Error saving sample data task:', error);
        throw error;
      }
      
      await fetchTasks();
      
      return data;
    } catch (error: any) {
      console.error('Error in saveSampleDataTask:', error);
      toast.error('Failed to save sample data task');
      throw error;
    }
  };

  const saveRamlTask = async (ramlData: any) => {
    try {
      console.log('Saving RAML task:', ramlData);
      
      const { data, error } = await supabase
        .from('apl_raml_tasks')
        .insert({
          task_id: ramlData.task_id,
          task_name: ramlData.task_name,
          workspace_id: ramlData.workspace_id,
          user_id: ramlData.user_id,
          description: ramlData.description || '',
          api_name: ramlData.api_name || '',
          api_version: ramlData.api_version || '',
          base_uri: ramlData.base_uri || '',
          endpoints: ramlData.endpoints || [],
          raml_content: ramlData.raml_content || '',
          documentation: ramlData.documentation || '',
          category: 'raml'
        }).select();
      
      if (error) {
        console.error('Error saving RAML task:', error);
        throw error;
      }
      
      console.log('RAML task saved successfully:', data);
      
      await fetchTasks();
      
      return data;
    } catch (error: any) {
      console.error('Error in saveRamlTask:', error);
      toast.error('Failed to save RAML task');
      throw error;
    }
  };

  const saveMunitTask = async (munitData: any) => {
    try {
      console.log('Saving MUnit task:', munitData);
      
      const { data, error } = await supabase.rpc('apl_insert_munit_task', {
        workspace_id: munitData.workspace_id,
        task_id: munitData.task_id,
        task_name: munitData.task_name,
        user_id: munitData.user_id,
        description: munitData.description || '',
        flow_description: munitData.flow_description || '',
        flow_implementation: munitData.flow_implementation || '',
        munit_content: munitData.munit_content || '',
        runtime: munitData.runtime || '',
        number_of_scenarios: munitData.number_of_scenarios || 1,
        category: 'munit'
      });
      
      if (error) {
        console.error('Error saving MUnit task:', error);
        throw error;
      }
      
      console.log('MUnit task saved successfully:', data);
      
      await fetchTasks();
      
      return data;
    } catch (error: any) {
      console.error('Error in saveMunitTask:', error);
      toast.error('Failed to save MUnit task');
      throw error;
    }
  };

  const getTaskDetails = async (taskId: string, category: string) => {
    try {
      let data = null;
      let error = null;
      
      if (category === 'dataweave') {
        const response = await supabase
          .from('apl_dataweave_tasks')
          .select('*')
          .eq('task_id', taskId)
          .single();
        data = response.data;
        error = response.error;
      } else if (category === 'integration') {
        const response = await supabase
          .from('apl_integration_tasks')
          .select('*')
          .eq('task_id', taskId)
          .single();
        data = response.data;
        error = response.error;
      } else if (category === 'raml') {
        const response = await supabase
          .from('apl_raml_tasks')
          .select('*')
          .eq('task_id', taskId)
          .single();
        data = response.data;
        error = response.error;
      } else if (category === 'munit') {
        const response = await supabase
          .from('apl_munit_tasks')
          .select('*')
          .eq('task_id', taskId)
          .single();
        data = response.data;
        error = response.error;
      } else if (category === 'sampledata') {
        const response = await supabase
          .from('apl_sample_data_tasks')
          .select('*')
          .eq('task_id', taskId)
          .single();
        data = response.data;
        error = response.error;
      } else if (category === 'document') {
        const response = await supabase
          .from('apl_document_tasks')
          .select('*')
          .eq('task_id', taskId)
          .single();
        data = response.data;
        error = response.error;
      } else if (category === 'diagram') {
        const response = await supabase
          .from('apl_diagram_tasks')
          .select('*')
          .eq('task_id', taskId)
          .single();
        data = response.data;
        error = response.error;
      }
      
      if (error) {
        throw error;
      }
      
      return data;
    } catch (error: any) {
      console.error('Error fetching task details:', error);
      toast.error('Failed to fetch task details');
      return null;
    }
  };

  const fetchTasks = useCallback(async () => {
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
      const documentTasks = await fetchDocumentTasks();
      const diagramTasks = await fetchDiagramTasks();
      
      const uniqueTaskIds = new Set<string>();
      const uniqueTasks: WorkspaceTask[] = [];
      
      const addUniqueTasksToArray = (tasksArray: WorkspaceTask[]) => {
        tasksArray.forEach(task => {
          const uniqueKey = `${task.id}-${task.category}`;
          if (!uniqueTaskIds.has(uniqueKey)) {
            uniqueTaskIds.add(uniqueKey);
            uniqueTasks.push(task);
          }
        });
      };
      
      addUniqueTasksToArray(workspaceTasks);
      addUniqueTasksToArray(integrationTasks);
      addUniqueTasksToArray(ramlTasks);
      addUniqueTasksToArray(munitTasks);
      addUniqueTasksToArray(sampleDataTasks);
      addUniqueTasksToArray(documentTasks);
      addUniqueTasksToArray(diagramTasks);
      
      const sortedTasks = uniqueTasks.sort((a, b) => 
        new Date(b.created_at).getTime() - new Date(a.created_at).getTime()
      );
      
      setTasks(sortedTasks);
      console.log('Total tasks loaded:', sortedTasks.length);
    } catch (err: any) {
      console.error('Error fetching workspace tasks:', err);
      setError(err.message);
      toast.error('Failed to load tasks');
    } finally {
      setLoading(false);
    }
  }, [workspaceId, fetchIntegrationTasks, fetchRamlTasks, fetchMunitTasks, fetchSampleDataTasks, fetchDocumentTasks, fetchDiagramTasks]);

  const deleteTask = useCallback(async (taskId: string) => {
    try {
      console.log('Deleting task:', taskId);
      
      const taskToDelete = tasks.find(t => t.task_id === taskId);
      
      if (!taskToDelete) {
        throw new Error('Task not found');
      }
      
      let error = null;
      
      if (taskToDelete.category === 'dataweave') {
        const result = await supabase
          .from('apl_dataweave_tasks')
          .delete()
          .eq('task_id', taskId);
        error = result.error;
      } else if (taskToDelete.category === 'integration') {
        const result = await supabase
          .from('apl_integration_tasks')
          .delete()
          .eq('task_id', taskId);
        error = result.error;
      } else if (taskToDelete.category === 'raml') {
        const result = await supabase
          .from('apl_raml_tasks')
          .delete()
          .eq('task_id', taskId);
        error = result.error;
      } else if (taskToDelete.category === 'munit') {
        const result = await supabase
          .from('apl_munit_tasks')
          .delete()
          .eq('task_id', taskId);
        error = result.error;
      } else if (taskToDelete.category === 'sampledata') {
        const result = await supabase
          .from('apl_sample_data_tasks')
          .delete()
          .eq('task_id', taskId);
        error = result.error;
      } else if (taskToDelete.category === 'document') {
        const result = await supabase
          .from('apl_document_tasks')
          .delete()
          .eq('task_id', taskId);
        error = result.error;
      } else if (taskToDelete.category === 'diagram') {
        const result = await supabase
          .from('apl_diagram_tasks')
          .delete()
          .eq('task_id', taskId);
        error = result.error;
      }
      
      if (error) {
        console.error('Error deleting task:', error);
        throw error;
      }
      
      console.log('Task deleted successfully');
      
      await fetchTasks();
    } catch (error: any) {
      console.error('Error deleting task:', error);
      toast.error('Failed to delete task');
      throw error;
    }
  }, [workspaceId, fetchTasks, tasks]);

  const generateId = () => {
    return Math.random().toString(36).substring(2, 10).toUpperCase();
  };

  useEffect(() => {
    if (workspaceId) {
      fetchWorkspaceTasks();
    }
  }, [workspaceId, fetchWorkspaceTasks]);

  return {
    tasks,
    selectedTask,
    loading,
    error,
    fetchTaskDetails,
    fetchWorkspaceTasks,
    saveDocumentTask,
    saveDiagramTask,
    saveSampleDataTask,
    saveRamlTask,
    saveMunitTask,
    getTaskDetails,
    fetchTasks,
    deleteTask
  };
};
