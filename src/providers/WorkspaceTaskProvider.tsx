import React, { createContext, useContext, useState, useEffect, useCallback, useRef } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useAuth';
import { toast } from 'sonner';
import { v4 as uuidv4 } from 'uuid';
import { useWorkspaces } from './WorkspaceProvider';

export interface WorkspaceTask {
  id: string;
  task_id: string;
  task_name: string;
  category: string;
  icon?: string;
  workspace_id: string;
  created_at: string;
  description?: string;
  input_format?: string;
  notes?: string;
  generated_scripts?: any[];
  reference_id?: string;
  [key: string]: any; // Allow for additional properties
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
  reference_id?: string;
}

interface WorkspaceTasksContextType {
  workspaceTasks: WorkspaceTask[];
  selectedTask: TaskDetails | null;
  loading: boolean;
  error: string | null;
  refreshWorkspaceTasks: () => Promise<void>;
  fetchTaskDetails: (taskId: string) => Promise<void>;
  deleteTask: (taskId: string) => Promise<boolean>;
  saveDocumentTask: (documentData: any) => Promise<any>;
  saveDiagramTask: (diagramData: any) => Promise<any>;
  saveSampleDataTask: (sampleDataInfo: any) => Promise<any>;
  saveRamlTask: (ramlData: any) => Promise<any>;
  saveMunitTask: (munitData: any) => Promise<any>;
}

const WorkspaceTasksContext = createContext<WorkspaceTasksContextType | undefined>(undefined);

// Constants for caching
const WORKSPACE_TASKS_CACHE_KEY = 'APL_WORKSPACE_TASKS';
const CACHE_EXPIRY = 5 * 60 * 1000; // 5 minutes

export const WorkspaceTasksProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const { user } = useAuth();
  const { selectedWorkspace } = useWorkspaces();
  const [workspaceTasks, setWorkspaceTasks] = useState<WorkspaceTask[]>([]);
  const [selectedTask, setSelectedTask] = useState<TaskDetails | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [isRefreshing, setIsRefreshing] = useState(false);
  
  // Use refs to track initialization and prevent redundant fetches
  const initialFetchDone = useRef(false);
  const currentWorkspaceId = useRef<string | null>(null);
  const fetchInProgress = useRef(false);
  const backgroundRefreshTimeout = useRef<NodeJS.Timeout | null>(null);

  // Fetch workspace tasks using the new consolidated table
  const fetchWorkspaceTasks = useCallback(async (forceRefresh = false) => {
    if (!user || !selectedWorkspace) return;
    if (fetchInProgress.current && !forceRefresh) return;
    
    // Don't fetch if we've already fetched for this workspace unless force refresh
    if (!forceRefresh && 
        initialFetchDone.current && 
        currentWorkspaceId.current === selectedWorkspace.id) {
      return;
    }
    
    fetchInProgress.current = true;
    
    if (!isRefreshing) {
      setLoading(true);
    }
    
    setError(null);
    
    try {
      console.log('Fetching workspace tasks for workspace:', selectedWorkspace.id);
      
      // Try to use cached data first if not forcing refresh
      if (!forceRefresh) {
        const cacheKey = `${WORKSPACE_TASKS_CACHE_KEY}_${selectedWorkspace.id}`;
        const cachedData = localStorage.getItem(cacheKey);
        
        if (cachedData) {
          try {
            const { data, timestamp } = JSON.parse(cachedData);
            const now = Date.now();
            
            if (now - timestamp < CACHE_EXPIRY) {
              console.log('Using cached workspace tasks data');
              setWorkspaceTasks(data);
              initialFetchDone.current = true;
              currentWorkspaceId.current = selectedWorkspace.id;
              return;
            }
          } catch (e) {
            console.warn('Error parsing cached data:', e);
          }
        }
      }
      
      // Fetch tasks from the new consolidated table using the RPC function
      const { data, error } = await supabase.rpc('apl_get_workspace_tasks', {
        workspace_id_param: selectedWorkspace.id
      });
      
      if (error) {
        throw error;
      }
      
      const formattedTasks = (data || []).map((task: any) => ({
        id: task.id,
        task_id: task.task_id || `T-${task.id.substring(0, 8).toUpperCase()}`,
        task_name: task.task_name || 'Untitled Task',
        category: task.category || 'dataweave',
        created_at: task.created_at,
        workspace_id: selectedWorkspace.id,
        description: task.description || '',
        reference_id: task.reference_id
      }));
      
      // Sort tasks by creation date (newest first)
      const sortedTasks = formattedTasks.sort((a, b) =>
        new Date(b.created_at).getTime() - new Date(a.created_at).getTime()
      );
      
      // Cache the tasks data
      const cacheKey = `${WORKSPACE_TASKS_CACHE_KEY}_${selectedWorkspace.id}`;
      localStorage.setItem(cacheKey, JSON.stringify({
        data: sortedTasks,
        timestamp: Date.now()
      }));
      
      setWorkspaceTasks(sortedTasks);
      initialFetchDone.current = true;
      currentWorkspaceId.current = selectedWorkspace.id;
      
    } catch (err: any) {
      console.error('Error fetching workspace tasks:', err);
      setError('Failed to load workspace tasks');
      
      // Try to use cached data as fallback
      const cacheKey = `${WORKSPACE_TASKS_CACHE_KEY}_${selectedWorkspace.id}`;
      const cachedData = localStorage.getItem(cacheKey);
      
      if (cachedData) {
        try {
          const { data } = JSON.parse(cachedData);
          console.log('Using cached data as fallback after error');
          setWorkspaceTasks(data);
        } catch (e) {
          console.error("Error parsing cached fallback data:", e);
        }
      }
    } finally {
      fetchInProgress.current = false;
      setLoading(false);
      setIsRefreshing(false);
    }
  }, [user, selectedWorkspace, isRefreshing]);

  // Reset state when user changes or logs out
  useEffect(() => {
    if (!user) {
      // Clear tasks when user logs out
      setWorkspaceTasks([]);
      initialFetchDone.current = false;
      currentWorkspaceId.current = null;
      
      if (backgroundRefreshTimeout.current) {
        clearTimeout(backgroundRefreshTimeout.current);
        backgroundRefreshTimeout.current = null;
      }
    }
  }, [user]);

  // Fetch tasks when selected workspace changes
  useEffect(() => {
    if (selectedWorkspace) {
      // Only fetch if workspace changed or we haven't fetched yet
      if (currentWorkspaceId.current !== selectedWorkspace.id || !initialFetchDone.current) {
        fetchWorkspaceTasks();
      }
    } else {
      setWorkspaceTasks([]);
    }
    
    // Cleanup on unmount or workspace change
    return () => {
      if (backgroundRefreshTimeout.current) {
        clearTimeout(backgroundRefreshTimeout.current);
        backgroundRefreshTimeout.current = null;
      }
    };
  }, [selectedWorkspace, fetchWorkspaceTasks]);

  const refreshWorkspaceTasks = async () => {
    if (isRefreshing || !selectedWorkspace) return; // Prevent multiple simultaneous refreshes
    
    setIsRefreshing(true);
    console.log('Manually refreshing workspace tasks...');
    await fetchWorkspaceTasks(true); // Force refresh
  };

  // Keep the existing task details fetch mechanism for backward compatibility
  const fetchTaskDetails = async (taskId: string) => {
    if (!user || !selectedWorkspace) {
      setError('You must be logged in and have a workspace selected to view task details');
      return;
    }
    setLoading(true);
    setError(null);
    try {
      // First, find the task in our local state to determine its category
      const task = workspaceTasks.find(t => t.id === taskId || t.task_id === taskId);
      
      if (!task) {
        throw new Error('Task not found');
      }
      // Use a single RPC call to get task details by ID and category
      const { data, error } = await supabase.rpc('apl_get_task_details', {
        task_id_param: task.reference_id || task.id,
        category_param: task.category
      });
      if (error) throw error;
      if (!data) {
        throw new Error('Task details not found');
      }
      setSelectedTask({
        ...data,
        category: task.category
      });
    } catch (error) {
      console.error('Error fetching task details:', error);
      setError('Failed to load task details');
    } finally {
      setLoading(false);
    }
  };

  // Keep existing delete, save methods the same
  const deleteTask = async (taskId: string): Promise<boolean> => {
    // ... keep existing code
    if (!user || !selectedWorkspace) {
      toast.error('You must be logged in and have a workspace selected to delete tasks');
      return false;
    }
    try {
      // First, find the task in our local state to determine its category
      const task = workspaceTasks.find(t => t.id === taskId || t.task_id === taskId);
      
      if (!task) {
        throw new Error('Task not found');
      }
      // Use a single RPC call to delete the task
      const { error } = await supabase.rpc('apl_delete_task', {
        task_id_param: task.reference_id || task.id,
        category_param: task.category
      });
      if (error) throw error;
      // Update local state
      setWorkspaceTasks(prev => prev.filter(t => t.id !== task.id));
      // Update cache
      const cacheKey = `${WORKSPACE_TASKS_CACHE_KEY}_${selectedWorkspace.id}`;
      const cachedData = localStorage.getItem(cacheKey);
      
      if (cachedData) {
        try {
          const { timestamp } = JSON.parse(cachedData);
          localStorage.setItem(cacheKey, JSON.stringify({
            data: workspaceTasks.filter(t => t.id !== task.id),
            timestamp
          }));
        } catch (e) {
          console.error("Error updating task cache after deletion:", e);
        }
      }
      return true;
    } catch (error) {
      console.error('Error deleting task:', error);
      toast.error('Failed to delete task');
      return false;
    }
  };

  // Keep existing save methods but add code to update the cache
  const saveDocumentTask = async (documentData: any) => {
    // ... keep existing code
    if (!user || !selectedWorkspace) {
      toast.error('You must be logged in and have a workspace selected to save tasks');
      return null;
    }
    try {
      const taskId = documentData.id || uuidv4();
      const taskData = {
        ...documentData,
        id: taskId,
        task_id: documentData.task_id || `DOC-${taskId.substring(0, 8)}`,
        workspace_id: selectedWorkspace.id,
        user_id: user.id,
        created_at: documentData.created_at || new Date().toISOString(),
        updated_at: new Date().toISOString()
      };
      let result;
      
      if (documentData.id) {
        // Update existing task
        const { data, error } = await supabase
          .from('apl_document_tasks')
          .update(taskData)
          .eq('id', documentData.id)
          .select()
          .single();
        
        if (error) throw error;
        result = data;
      } else {
        // Create new task
        const { data, error } = await supabase
          .from('apl_document_tasks')
          .insert([taskData])
          .select()
          .single();
        
        if (error) throw error;
        result = data;
      }
      
      // The trigger will automatically update the apl_workspace_tasks table
      // Just need to refresh our local state
      refreshWorkspaceTasks();
      
      return result;
    } catch (error) {
      console.error('Error saving document task:', error);
      toast.error('Failed to save document task');
      return null;
    }
  };

  const saveDiagramTask = async (diagramData: any) => {
    // ... keep existing code with similar changes to refresh cache after save
    if (!user || !selectedWorkspace) {
      toast.error('You must be logged in and have a workspace selected to save tasks');
      return null;
    }
    try {
      const taskId = diagramData.id || uuidv4();
      const taskData = {
        ...diagramData,
        id: taskId,
        task_id: diagramData.task_id || `DIA-${taskId.substring(0, 8)}`,
        workspace_id: selectedWorkspace.id,
        user_id: user.id,
        created_at: diagramData.created_at || new Date().toISOString(),
        updated_at: new Date().toISOString()
      };
      let result;
      
      if (diagramData.id) {
        // Update existing task
        const { data, error } = await supabase
          .from('apl_diagram_tasks')
          .update(taskData)
          .eq('id', diagramData.id)
          .select()
          .single();
        
        if (error) throw error;
        result = data;
      } else {
        // Create new task
        const { data, error } = await supabase
          .from('apl_diagram_tasks')
          .insert([taskData])
          .select()
          .single();
        
        if (error) throw error;
        result = data;
      }
      
      // The trigger will automatically update the apl_workspace_tasks table
      // Just need to refresh our local state
      refreshWorkspaceTasks();
      
      return result;
    } catch (error) {
      console.error('Error saving diagram task:', error);
      toast.error('Failed to save diagram task');
      return null;
    }
  };

  const saveSampleDataTask = async (sampleDataInfo: any) => {
    // ... keep existing code with similar changes to refresh cache after save
    if (!user || !selectedWorkspace) {
      toast.error('You must be logged in and have a workspace selected to save tasks');
      return null;
    }
    try {
      const taskId = sampleDataInfo.id || uuidv4();
      const taskData = {
        ...sampleDataInfo,
        task_id: sampleDataInfo.task_id || `SD-${taskId.substring(0, 8)}`,
        workspace_id: selectedWorkspace.id,
        user_id: user.id
      };

      const { data, error } = await supabase.rpc('apl_insert_sample_data_task', taskData);
      
      if (error) {
        console.error('Error saving sample data task:', error);
        throw error;
      }
      
      // The trigger will automatically update the apl_workspace_tasks table
      // Just need to refresh our local state
      refreshWorkspaceTasks();
      
      return data;
    } catch (error) {
      console.error('Error in saveSampleDataTask:', error);
      toast.error('Failed to save sample data task');
      return null;
    }
  };

  const saveRamlTask = async (ramlData: any) => {
    // ... keep existing code with similar changes to refresh cache after save
    if (!user || !selectedWorkspace) {
      toast.error('You must be logged in and have a workspace selected to save tasks');
      return null;
    }
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
      
      // The trigger will automatically update the apl_workspace_tasks table
      // Just need to refresh our local state
      refreshWorkspaceTasks();
      
      return data;
    } catch (error) {
      console.error('Error in saveRamlTask:', error);
      toast.error('Failed to save RAML task');
      return null;
    }
  };

  const saveMunitTask = async (munitData: any) => {
    // ... keep existing code with similar changes to refresh cache after save
    if (!user || !selectedWorkspace) {
      toast.error('You must be logged in and have a workspace selected to save tasks');
      return null;
    }
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
      
      // The trigger will automatically update the apl_workspace_tasks table
      // Just need to refresh our local state
      refreshWorkspaceTasks();
      
      return data;
    } catch (error) {
      console.error('Error in saveMunitTask:', error);
      toast.error('Failed to save MUnit task');
      return null;
    }
  };

  // Set up a single realtime subscription for all task changes
  useEffect(() => {
    if (!user || !selectedWorkspace) return;
    
    // Create a single channel to listen for changes to the consolidated task table
    const channel = supabase
      .channel('apl-workspace-tasks-changes')
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'apl_workspace_tasks',
          filter: `workspace_id=eq.${selectedWorkspace.id}`,
        },
        (payload) => {
          console.log('Workspace tasks change detected:', payload.eventType);
          
          // Debounce the refresh to avoid multiple refreshes for batch operations
          if (backgroundRefreshTimeout.current) {
            clearTimeout(backgroundRefreshTimeout.current);
          }
          
          backgroundRefreshTimeout.current = setTimeout(() => {
            refreshWorkspaceTasks();
          }, 2000); // Debounce for 2 seconds
        }
      )
      .subscribe();
    
    return () => {
      // Clean up channel on unmount
      supabase.removeChannel(channel);
      
      if (backgroundRefreshTimeout.current) {
        clearTimeout(backgroundRefreshTimeout.current);
        backgroundRefreshTimeout.current = null;
      }
    };
  }, [user, selectedWorkspace, refreshWorkspaceTasks]);

  const value = {
    workspaceTasks,
    selectedTask,
    loading,
    error,
    refreshWorkspaceTasks,
    fetchTaskDetails,
    deleteTask,
    saveDocumentTask,
    saveDiagramTask,
    saveSampleDataTask,
    saveRamlTask,
    saveMunitTask
  };

  return (
    <WorkspaceTasksContext.Provider value={value}>
      {children}
    </WorkspaceTasksContext.Provider>
  );
};

export const useWorkspaceTasks = () => {
  const context = useContext(WorkspaceTasksContext);
  if (context === undefined) {
    throw new Error('useWorkspaceTasks must be used within a WorkspaceTasksProvider');
  }
  return context;
};
