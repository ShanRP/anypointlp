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
  input_format: string;
  input_samples: any[];
  output_samples: any[];
  notes: string;
  generated_scripts: any[];
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
      
      const { data, error } = await supabase.rpc('apl_get_raml_tasks', { 
        workspace_id_param: workspaceId 
      });
      
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
  
  const fetchMUnitTasks = useCallback(async () => {
    if (!workspaceId) return [];
    
    try {
      console.log('Fetching MUnit tasks for workspace:', workspaceId);
      
      const { data, error } = await supabase.rpc('apl_get_munit_tasks', { 
        workspace_id_param: workspaceId 
      });
      
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
      console.error('Error in fetchMUnitTasks:', err);
      return [];
    }
  }, [workspaceId]);
  
  const fetchSampleDataTasks = useCallback(async () => {
    if (!workspaceId) return [];
    
    try {
      console.log('Fetching Sample Data tasks for workspace:', workspaceId);
      
      const { data, error } = await supabase.rpc('apl_get_sample_data_tasks', { 
        workspace_id_param: workspaceId 
      });
      
      if (error) {
        console.error('Error fetching Sample Data tasks:', error);
        throw error;
      }
      
      const sampleDataTasks = Array.isArray(data) ? data.map((task: any) => ({
        id: task.id,
        task_id: task.task_id,
        task_name: task.task_name,
        created_at: task.created_at,
        workspace_id: workspaceId,
        category: 'sampledata',
        description: task.description || ''
      })) : [];
      
      console.log('Fetched Sample Data tasks:', sampleDataTasks.length);
      return sampleDataTasks;
    } catch (err: any) {
      console.error('Error in fetchSampleDataTasks:', err);
      return [];
    }
  }, [workspaceId]);
  
  const fetchDiagramTasks = useCallback(async () => {
    if (!workspaceId) return [];
    
    try {
      console.log('Fetching Diagram tasks for workspace:', workspaceId);
      
      const { data, error } = await supabase.rpc('apl_get_diagram_tasks', { 
        workspace_id_param: workspaceId 
      });
      
      if (error) {
        console.error('Error fetching Diagram tasks:', error);
        throw error;
      }
      
      const diagramTasks = Array.isArray(data) ? data.map((task: any) => ({
        id: task.id,
        task_id: task.task_id,
        task_name: task.task_name,
        created_at: task.created_at,
        workspace_id: workspaceId,
        category: 'diagram',
        description: task.description || ''
      })) : [];
      
      console.log('Fetched Diagram tasks:', diagramTasks.length);
      return diagramTasks;
    } catch (err: any) {
      console.error('Error in fetchDiagramTasks:', err);
      return [];
    }
  }, [workspaceId]);
  
  const fetchDocumentTasks = useCallback(async () => {
    if (!workspaceId) return [];
    
    try {
      console.log('Fetching Document tasks for workspace:', workspaceId);
      
      const { data, error } = await supabase.rpc('apl_get_document_tasks', { 
        workspace_id_param: workspaceId 
      });
      
      if (error) {
        console.error('Error fetching Document tasks:', error);
        throw error;
      }
      
      const documentTasks = Array.isArray(data) ? data.map((task: any) => ({
        id: task.id,
        task_id: task.task_id,
        task_name: task.task_name,
        created_at: task.created_at,
        workspace_id: workspaceId,
        category: 'document',
        description: task.description || ''
      })) : [];
      
      console.log('Fetched Document tasks:', documentTasks.length);
      return documentTasks;
    } catch (err: any) {
      console.error('Error in fetchDocumentTasks:', err);
      return [];
    }
  }, [workspaceId]);

  const fetchWorkspaceTasks = useCallback(async () => {
    if (!workspaceId) return;
    
    setLoading(true);
    setError(null);
    
    try {
      const dataweavePromise = supabase
        .from('apl_dataweave_tasks')
        .select('id, task_id, task_name, created_at, category, description')
        .eq('workspace_id', workspaceId)
        .eq('user_id', user?.id || '');

      const integrationPromise = fetchIntegrationTasks();
      const ramlPromise = fetchRamlTasks();
      const munitPromise = fetchMUnitTasks();
      const sampleDataPromise = fetchSampleDataTasks();
      const diagramPromise = fetchDiagramTasks();
      const documentPromise = fetchDocumentTasks();
      
      const [
        { data: dataweaveData, error: dataweaveError },
        integrationTasks,
        ramlTasks,
        munitTasks,
        sampleDataTasks,
        diagramTasks,
        documentTasks
      ] = await Promise.all([
        dataweavePromise,
        integrationPromise,
        ramlPromise,
        munitPromise,
        sampleDataPromise,
        diagramPromise,
        documentPromise
      ]);
      
      if (dataweaveError) throw dataweaveError;
      
      const dataweaveTasksFormatted = (dataweaveData || []).map(task => ({
        ...task,
        workspace_id: workspaceId,
        description: task.description || '',
        category: task.category || 'dataweave',
        task_id: task.task_id || `T-${task.id.substring(0, 8).toUpperCase()}`
      }));
      
      const allTasks = [
        ...dataweaveTasksFormatted, 
        ...integrationTasks, 
        ...ramlTasks,
        ...munitTasks,
        ...sampleDataTasks,
        ...diagramTasks,
        ...documentTasks
      ].sort((a, b) => 
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
  }, [workspaceId, fetchIntegrationTasks, fetchRamlTasks, fetchMUnitTasks, fetchSampleDataTasks, fetchDiagramTasks, fetchDocumentTasks, user?.id]);

  const fetchIntegrationTaskDetails = async (taskId: string) => {
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
  };

  const fetchRamlTaskDetails = async (taskId: string) => {
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
  };

  const fetchMUnitTaskDetails = async (taskId: string) => {
    try {
      console.log('Fetching MUnit task details for:', taskId);
      
      let data;
      let error;
      
      const isUuid = taskId.match(/^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i);
      
      if (isUuid) {
        console.log('Using UUID for MUnit task lookup:', taskId);
        ({ data, error } = await supabase
          .from('apl_munit_tasks')
          .select('*')
          .eq('id', taskId)
          .limit(1));
      } else {
        console.log('Using task_id for MUnit task lookup:', taskId);
        ({ data, error } = await supabase
          .from('apl_munit_tasks')
          .select('*')
          .eq('task_id', taskId)
          .limit(1));
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
          input_format: 'Flow Implementation',
          input_samples: [],
          output_samples: [],
          notes: munitTask.notes || '',
          generated_scripts: [{
            id: `script-${Date.now()}`,
            code: munitTask.generated_tests || '',
          }],
          created_at: munitTask.created_at,
          workspace_id: workspaceId,
          category: 'munit',
          description: munitTask.description || '',
          flow_implementation: munitTask.flow_implementation,
          runtime: munitTask.runtime,
          scenario_count: munitTask.scenario_count,
          generated_tests: munitTask.generated_tests
        };
        
        setSelectedTask(taskDetails);
        return taskDetails;
      }
      
      return null;
    } catch (err: any) {
      console.error('Error in fetchMUnitTaskDetails:', err);
      return null;
    }
  };
  
  const fetchSampleDataTaskDetails = async (taskId: string) => {
    try {
      console.log('Fetching Sample Data task details for:', taskId);
      
      let data;
      let error;
      
      const isUuid = taskId.match(/^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i);
      
      if (isUuid) {
        console.log('Using UUID for Sample Data task lookup:', taskId);
        ({ data, error } = await supabase
          .from('apl_sample_data_tasks')
          .select('*')
          .eq('id', taskId)
          .limit(1));
      } else {
        console.log('Using task_id for Sample Data task lookup:', taskId);
        ({ data, error } = await supabase
          .from('apl_sample_data_tasks')
          .select('*')
          .eq('task_id', taskId)
          .limit(1));
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
          input_format: 'DataWeave Script',
          input_samples: [],
          output_samples: [],
          notes: sampleDataTask.description || '',
          generated_scripts: [{
            id: `script-${Date.now()}`,
            code: sampleDataTask.generated_data || '',
          }],
          created_at: sampleDataTask.created_at,
          workspace_id: workspaceId,
          category: 'sampledata',
          description: sampleDataTask.description || '',
          dataweave_script: sampleDataTask.dataweave_script,
          input_schema: sampleDataTask.input_schema,
          output_schema: sampleDataTask.output_schema,
          generated_data: sampleDataTask.generated_data,
          sample_count: sampleDataTask.sample_count
        };
        
        setSelectedTask(taskDetails);
        return taskDetails;
      }
      
      return null;
    } catch (err: any) {
      console.error('Error in fetchSampleDataTaskDetails:', err);
      return null;
    }
  };
  
  const fetchDiagramTaskDetails = async (taskId: string) => {
    try {
      console.log('Fetching Diagram task details for:', taskId);
      
      let data;
      let error;
      
      const isUuid = taskId.match(/^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i);
      
      if (isUuid) {
        console.log('Using UUID for Diagram task lookup:', taskId);
        ({ data, error } = await supabase
          .from('apl_diagram_tasks')
          .select('*')
          .eq('id', taskId)
          .limit(1));
      } else {
        console.log('Using task_id for Diagram task lookup:', taskId);
        ({ data, error } = await supabase
          .from('apl_diagram_tasks')
          .select('*')
          .eq('task_id', taskId)
          .limit(1));
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
          task_id: diagramTask.task_id,
          task_name: diagramTask.task_name || 'Diagram',
          input_format: 'Diagram Content',
          input_samples: [],
          output_samples: [],
          notes: diagramTask.description || '',
          generated_scripts: [{
            id: `script-${Date.now()}`,
            code: diagramTask.generated_diagram || '',
          }],
          created_at: diagramTask.created_at,
          workspace_id: workspaceId,
          category: 'diagram',
          description: diagramTask.description || '',
          diagram_type: diagramTask.diagram_type,
          diagram_content: diagramTask.diagram_content,
          generated_diagram: diagramTask.generated_diagram
        };
        
        setSelectedTask(taskDetails);
        return taskDetails;
      }
      
      return null;
    } catch (err: any) {
      console.error('Error in fetchDiagramTaskDetails:', err);
      return null;
    }
  };
  
  const fetchDocumentTaskDetails = async (taskId: string) => {
    try {
      console.log('Fetching Document task details for:', taskId);
      
      let data;
      let error;
      
      const isUuid = taskId.match(/^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i);
      
      if (isUuid) {
        console.log('Using UUID for Document task lookup:', taskId);
        ({ data, error } = await supabase
          .from('apl_document_tasks')
          .select('*')
          .eq('id', taskId)
          .limit(1));
      } else {
        console.log('Using task_id for Document task lookup:', taskId);
        ({ data, error } = await supabase
          .from('apl_document_tasks')
          .select('*')
          .eq('task_id', taskId)
          .limit(1));
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
          task_id: documentTask.task_id,
          task_name: documentTask.task_name || 'Document',
          input_format: 'Source Content',
          input_samples: [],
          output_samples: [],
          notes: documentTask.description || '',
          generated_scripts: [{
            id: `script-${Date.now()}`,
            code: documentTask.generated_document || '',
          }],
          created_at: documentTask.created_at,
          workspace_id: workspaceId,
          category: 'document',
          description: documentTask.description || '',
          document_type: documentTask.document_type,
          source_content: documentTask.source_content,
          generated_document: documentTask.generated_document
        };
        
        setSelectedTask(taskDetails);
        return taskDetails;
      }
      
      return null;
    } catch (err: any) {
      console.error('Error in fetchDocumentTaskDetails:', err);
      return null;
    }
  };

  const fetchTaskDetails = async (taskId: string) => {
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
      
      const munitTaskDetails = await fetchMUnitTaskDetails(taskId);
      
      if (munitTaskDetails) {
        console.log('Found task in MUnit tasks table');
        return;
      }
      
      const sampleDataTaskDetails = await fetchSampleDataTaskDetails(taskId);
      
      if (sampleDataTaskDetails) {
        console.log('Found task in Sample Data tasks table');
        return;
      }
      
      const diagramTaskDetails = await fetchDiagramTaskDetails(taskId);
      
      if (diagramTaskDetails) {
        console.log('Found task in Diagram tasks table');
        return;
      }
      
      const documentTaskDetails = await fetchDocumentTaskDetails(taskId);
      
      if (documentTaskDetails) {
        console.log('Found task in Document tasks table');
        return;
      }
      
      console.log('Task not found in specialized task tables, checking regular tasks');
      
      const { data, error } = await supabase
        .from('apl_dataweave_tasks')
        .select('*')
        .eq('id', taskId)
        .limit(1);
      
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
  };

  const saveTask = async (task: {
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
        username: user?.user_metadata?.name || user?.email?.split('@')[0] || 'Anonymous',
        category: task.category,
        description: task.description || ''
      };

      const { data, error } = await supabase
        .from('apl_dataweave_tasks')
        .insert([taskData])
        .select();
      
      if (error) throw error;
      
      await fetchWorkspaceTasks();
      return data;
    } catch (err: any) {
      console.error('Error saving task:', err);
      toast.error('Failed to save task');
      throw err;
    }
  };

  const saveRamlTask = async (task: {
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
  };
  
  const saveMUnitTask = async (task: {
    workspace_id: string;
    task_id?: string;
    task_name: string;
    user_id: string;
    description?: string;
    notes?: string;
    flow_implementation?: string;
    runtime?: string;
    scenario_count?: number;
    generated_tests?: string;
  }) => {
    try {
      const taskId = task.task_id || `M-${crypto.randomUUID().substring(0, 8).toUpperCase()}`;
      
      const taskData = {
        workspace_id: task.workspace_id,
        task_id: taskId,
        task_name: task.task_name,
        user_id: task.user_id,
        description: task.description || '',
        notes: task.notes || '',
        flow_implementation: task.flow_implementation || '',
        runtime: task.runtime || '',
        scenario_count: task.scenario_count || 1,
        generated_tests: task.generated_tests || '',
        category: 'munit'
      };

      const { data, error } = await supabase
        .from('apl_munit_tasks')
        .insert([taskData])
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
  };
  
  const saveSampleDataTask = async (task: {
    workspace_id: string;
    task_id?: string;
    task_name: string;
    user_id: string;
    description?: string;
    dataweave_script?: string;
    input_schema?: string;
    output_schema?: string;
    generated_data?: string;
    sample_count?: number;
  }) => {
    try {
      const taskId = task.task_id || `S-${crypto.randomUUID().substring(0, 8).toUpperCase()}`;
      
      const taskData = {
        workspace_id: task.workspace_id,
        task_id: taskId,
        task_name: task.task_name,
        user_id: task.user_id,
        description: task.description || '',
        dataweave_script: task.dataweave_script || '',
        input_schema: task.input_schema || '',
        output_schema: task.output_schema || '',
        generated_data: task.generated_data || '',
        sample_count: task.sample_count || 5,
        category: 'sampledata'
      };

      const { data, error } = await supabase
        .from('apl_sample_data_tasks')
        .insert([taskData])
        .select();
      
      if (error) throw error;
      
      await fetchWorkspaceTasks();
      
      toast.success('Sample data task saved successfully!');
      return data;
    } catch (err: any) {
      console.error('Error saving sample data task:', err);
      toast.error('Failed to save sample data task');
      throw err;
    }
  };
  
  const saveDiagramTask = async (task: {
    workspace_id: string;
    task_id?: string;
    task_name: string;
    user_id: string;
    description?: string;
    diagram_type: string;
    diagram_content?: string;
    generated_diagram?: string;
  }) => {
    try {
      const taskId = task.task_id || `D-${crypto.randomUUID().substring(0, 8).toUpperCase()}`;
      
      const taskData = {
        workspace_id: task.workspace_id,
        task_id: taskId,
        task_name: task.task_name,
        user_id: task.user_id,
        description: task.description || '',
        diagram_type: task.diagram_type,
        diagram_content: task.diagram_content || '',
        generated_diagram: task.generated_diagram || '',
        category: 'diagram'
      };

      const { data, error } = await supabase
        .from('apl_diagram_tasks')
        .insert([taskData])
        .select();
      
      if (error) throw error;
      
      await fetchWorkspaceTasks();
      
      toast.success('Diagram task saved successfully!');
      return data;
    } catch (err: any) {
      console.error('Error saving diagram task:', err);
      toast.error('Failed to save diagram task');
      throw err;
    }
  };
  
  const saveDocumentTask = async (task: {
    workspace_id: string;
    task_id?: string;
    task_name: string;
    user_id: string;
    description?: string;
    document_type: string;
    source_content?: string;
    generated_document?: string;
  }) => {
    try {
      const taskId = task.task_id || `DOC-${crypto.randomUUID().substring(0, 8).toUpperCase()}`;
      
      const taskData = {
        workspace_id: task.workspace_id,
        task_id: taskId,
        task_name: task.task_name,
        user_id: task.user_id,
        description: task.description || '',
        document_type: task.document_type,
        source_content: task.source_content || '',
        generated_document: task.generated_document || '',
        category: 'document'
      };

      const { data, error } = await supabase
        .from('apl_document_tasks')
        .insert([taskData])
        .select();
      
      if (error) throw error;
      
      await fetchWorkspaceTasks();
      
      toast.success('Document task saved successfully!');
      return data;
    } catch (err: any) {
      console.error('Error saving document task:', err);
      toast.error('Failed to save document task');
      throw err;
    }
  };

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
    saveMUnitTask,
    saveSampleDataTask,
    saveDiagramTask,
    saveDocumentTask
  };
};
