import React, { createContext, useContext, useState, useEffect, useCallback, useRef } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useAuth';
// import { useWorkspaces } from '@/hooks/useWorkspaces';

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

  // Consolidated fetch function that uses a single RPC call instead of multiple table queries
  const fetchWorkspaceTasks = useCallback(async (forceRefresh = false) => {
    // function body...
  }, [user]); // Remove selectedWorkspace from the dependency array

  // Use a single RPC call to get all tasks instead of querying multiple tables
  const fetchTasksFromRPC = async (workspaceId: string, updateLoadingState = true) => {
    if (!user || !workspaceId) return;
    
    console.log('Fetching all workspace tasks with single RPC call for workspace:', workspaceId);
    
    try {
      // Use a single RPC function that consolidates all task types in the database
      const { data, error } = await supabase.rpc('apl_get_all_workspace_tasks', {
        workspace_id_param: workspaceId
      });
      if (error) {
        console.error('Error in RPC call:', error);
        throw error;
      }
      console.log(`Fetched ${data?.length || 0} tasks with single RPC call`);
      
      // Format and normalize the tasks
      const formattedTasks = (data || []).map((task: any) => ({
        id: task.id,
        task_id: task.task_id || `T-${task.id.substring(0, 8).toUpperCase()}`,
        task_name: task.task_name || task.title || 'Untitled Task',
        category: task.category || 'dataweave',
        created_at: task.created_at,
        workspace_id: workspaceId,
        description: task.description || ''
      }));
      // Sort tasks by creation date (newest first)
      const sortedTasks = formattedTasks.sort((a, b) =>
        new Date(b.created_at).getTime() - new Date(a.created_at).getTime()
      );
      // Cache the tasks data
      localStorage.setItem(`${WORKSPACE_TASKS_CACHE_KEY}_${workspaceId}`, JSON.stringify({
        data: sortedTasks,
        timestamp: Date.now()
      }));
      setWorkspaceTasks(sortedTasks);
      initialFetchDone.current = true;
      currentWorkspaceId.current = workspaceId;
    
    } catch (error) {
      console.error('Error fetching workspace tasks from RPC:', error);
      setError('Failed to load workspace tasks');
      
      // If RPC fails, try to use cached data as fallback
      const cacheKey = `${WORKSPACE_TASKS_CACHE_KEY}_${workspaceId}`;
      const cachedData = localStorage.getItem(cacheKey);
      if (cachedData) {
        try {
          const { data } = JSON.parse(cachedData);
          console.log('Using cached data as fallback after RPC failure');
          setWorkspaceTasks(data);
        } catch (e) {
          console.error("Error parsing cached fallback data:", e);
        }
      }
    } finally {
      if (updateLoadingState) {
        setLoading(false);
      }
    }
  };

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
        task_id_param: task.id,
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

  const deleteTask = async (taskId: string): Promise<boolean> => {
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
        task_id_param: task.id,
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

  // Save functions for different task types
  const saveDocumentTask = async (documentData: any) => {
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
      // Update local state with the new task
      const newTask = {
        id: result.id,
        task_id: result.task_id,
        task_name: result.task_name,
        category: 'document',
        created_at: result.created_at,
        workspace_id: selectedWorkspace.id,
        description: result.description || ''
      };
      // Update local state without refetching
      if (documentData.id) {
        setWorkspaceTasks(prev =>
          prev.map(task => task.id === result.id ? newTask : task)
        );
      } else {
        setWorkspaceTasks(prev => [newTask, ...prev]);
      }
      // Update cache
      const cacheKey = `${WORKSPACE_TASKS_CACHE_KEY}_${selectedWorkspace.id}`;
      const cachedData = localStorage.getItem(cacheKey);
      
      if (cachedData) {
        try {
          const { data, timestamp } = JSON.parse(cachedData);
          const updatedCache = documentData.id
            ? data.map((task: any) => task.id === result.id ? newTask : task)
            : [newTask, ...data];
          
          localStorage.setItem(cacheKey, JSON.stringify({
            data: updatedCache,
            timestamp
          }));
        } catch (e) {
          console.error("Error updating task cache:", e);
        }
      }
      
      return result;
    } catch (error) {
      console.error('Error saving document task:', error);
      toast.error('Failed to save document task');
      return null;
    }
  };

  const saveDiagramTask = async (diagramData: any) => {
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
      // Update local state with the new task
      const newTask = {
        id: result.id,
        task_id: result.task_id,
        task_name: result.task_name,
        category: 'diagram',
        created_at: result.created_at,
        workspace_id: selectedWorkspace.id,
        description: result.description || ''
      };
      // Update local state without refetching
      if (diagramData.id) {
        setWorkspaceTasks(prev =>
          prev.map(task => task.id === result.id ? newTask : task)
        );
      } else {
        setWorkspaceTasks(prev => [newTask, ...prev]);
      }
      // Update cache
      const cacheKey = `${WORKSPACE_TASKS_CACHE_KEY}_${selectedWorkspace.id}`;
      const cachedData = localStorage.getItem(cacheKey);
      
      if (cachedData) {
        try {
          const { data, timestamp } = JSON.parse(cachedData);
          const updatedCache = diagramData.id
            ? data.map((task: any) => task.id === result.id ? newTask : task)
            : [newTask, ...data];
          
          localStorage.setItem(cacheKey, JSON.stringify({
            data: updatedCache,
            timestamp
          }));
        } catch (e) {
          console.error("Error updating task cache:", e);
        }
      }
      
      return result;
    } catch (error) {
      console.error('Error saving diagram task:', error);
      toast.error('Failed to save diagram task');
      return null;
    }
  };

  const saveSampleDataTask = async (sampleDataInfo: any) => {
    if (!user || !selectedWorkspace) {
      toast.error('You must be logged in and have a workspace selected to save tasks');
      return null;
    }
    try {
      const taskId = sampleDataInfo.id || uuidv4();
      const taskData = {
        ...sampleDataInfo,
        id: taskId,
        task_id: sampleDataInfo.task_id || `SD-${taskId.substring(0, 8)}`,
        workspace_id: selectedWorkspace.id,
        user_id: user.id,
        created_at: sampleDataInfo.created_at || new Date().toISOString(),
        updated_at: new Date().toISOString()
      };
      let result;
      
      if (sampleDataInfo.id) {
        // Update existing task
        const { data, error } = await supabase
          .from('apl_sample_data_tasks')
          .update(taskData)
          .eq('id', sampleDataInfo.id)
          .select()
          .single();
        
        if (error) throw error;
        result = data;
      } else {
        // Create new task
        const { data, error } = await supabase
          .from('apl_sample_data_tasks')
          .insert([taskData])
          .select()
          .single();
        
        if (error) throw error;
        result = data;
      }
      // Update local state with the new task
      const newTask = {
        id: result.id,
        task_id: result.task_id,
        task_name: result.task_name,
        category: 'sampledata',
        created_at: result.created_at,
        workspace_id: selectedWorkspace.id,
        description: result.description || ''
      };
      // Update local state without refetching
      if (sampleDataInfo.id) {
        setWorkspaceTasks(prev =>
          prev.map(task => task.id === result.id ? newTask : task)
        );
      } else {
        setWorkspaceTasks(prev => [newTask, ...prev]);
      }
      // Update cache
      const cacheKey = `${WORKSPACE_TASKS_CACHE_KEY}_${selectedWorkspace.id}`;
      const cachedData = localStorage.getItem(cacheKey);
      
      if (cachedData) {
        try {
          const { data, timestamp } = JSON.parse(cachedData);
          const updatedCache = sampleDataInfo.id
            ? data.map((task: any) => task.id === result.id ? newTask : task)
            : [newTask, ...data];
          
          localStorage.setItem(cacheKey, JSON.stringify({
            data: updatedCache,
            timestamp
          }));
        } catch (e) {
          console.error("Error updating task cache:", e);
        }
      }
      
      return result;
    } catch (error) {
      console.error('Error saving sample data task:', error);
      toast.error('Failed to save sample data task');
      return null;
    }
  };

  const saveRamlTask = async (ramlData: any) => {
    if (!user || !selectedWorkspace) {
      toast.error('You must be logged in and have a workspace selected to save tasks');
      return null;
    }
    try {
      const taskId = ramlData.id || uuidv4();
      const taskData = {
        ...ramlData,
        id: taskId,
        task_id: ramlData.task_id || `RAML-${taskId.substring(0, 8)}`,
        workspace_id: selectedWorkspace.id,
        user_id: user.id,
        created_at: ramlData.created_at || new Date().toISOString(),
        updated_at: new Date().toISOString()
      };
      let result;
      
      if (ramlData.id) {
        // Update existing task
        const { data, error } = await supabase
          .from('apl_raml_tasks')
          .update(taskData)
          .eq('id', ramlData.id)
          .select()
          .single();
        
        if (error) throw error;
        result = data;
      } else {
        // Create new task
        const { data, error } = await supabase
          .from('apl_raml_tasks')
          .insert([taskData])
          .select()
          .single();
        
        if (error) throw error;
        result = data;
      }
      // Update local state with the new task
      const newTask = {
        id: result.id,
        task_id: result.task_id,
        task_name: result.task_name,
        category: 'raml',
        created_at: result.created_at,
        workspace_id: selectedWorkspace.id,
        description: result.description || ''
      };
      // Update local state without refetching
      if (ramlData.id) {
        setWorkspaceTasks(prev =>
          prev.map(task => task.id === result.id ? newTask : task)
        );
      } else {
        setWorkspaceTasks(prev => [newTask, ...prev]);
      }
      // Update cache
      const cacheKey = `${WORKSPACE_TASKS_CACHE_KEY}_${selectedWorkspace.id}`;
      const cachedData = localStorage.getItem(cacheKey);
      
      if (cachedData) {
        try {
          const { data, timestamp } = JSON.parse(cachedData);
          const updatedCache = ramlData.id
            ? data.map((task: any) => task.id === result.id ? newTask : task)
            : [newTask, ...data];
          
          localStorage.setItem(cacheKey, JSON.stringify({
            data: updatedCache,
            timestamp
          }));
        } catch (e) {
          console.error("Error updating task cache:", e);
        }
      }
      
      return result;
    } catch (error) {
      console.error('Error saving RAML task:', error);
      toast.error('Failed to save RAML task');
      return null;
    }
  };

  const saveMunitTask = async (munitData: any) => {
    if (!user || !selectedWorkspace) {
      toast.error('You must be logged in and have a workspace selected to save tasks');
      return null;
    }
    try {
      const taskId = munitData.id || uuidv4();
      const taskData = {
        ...munitData,
        id: taskId,
        task_id: munitData.task_id || `MU-${taskId.substring(0, 8)}`,
        workspace_id: selectedWorkspace.id,
        user_id: user.id,
        created_at: munitData.created_at || new Date().toISOString(),
        updated_at: new Date().toISOString()
      };
      let result;
      
      if (munitData.id) {
        // Update existing task
        const { data, error } = await supabase
          .from('apl_munit_tasks')
          .update(taskData)
          .eq('id', munitData.id)
          .select()
          .single();
        
        if (error) throw error;
        result = data;
      } else {
        // Create new task
        const { data, error } = await supabase
          .from('apl_munit_tasks')
          .insert([taskData])
          .select()
          .single();
        
        if (error) throw error;
        result = data;
      }
      // Update local state with the new task
      const newTask = {
        id: result.id,
        task_id: result.task_id,
        task_name: result.task_name,
        category: 'munit',
        created_at: result.created_at,
        workspace_id: selectedWorkspace.id,
        description: result.description || ''
      };
      // Update local state without refetching
      if (munitData.id) {
        setWorkspaceTasks(prev =>
          prev.map(task => task.id === result.id ? newTask : task)
        );
      } else {
        setWorkspaceTasks(prev => [newTask, ...prev]);
      }
      // Update cache
      const cacheKey = `${WORKSPACE_TASKS_CACHE_KEY}_${selectedWorkspace.id}`;
      const cachedData = localStorage.getItem(cacheKey);
      
      if (cachedData) {
        try {
          const { data, timestamp } = JSON.parse(cachedData);
          const updatedCache = munitData.id
            ? data.map((task: any) => task.id === result.id ? newTask : task)
            : [newTask, ...data];
          
          localStorage.setItem(cacheKey, JSON.stringify({
            data: updatedCache,
            timestamp
          }));
        } catch (e) {
          console.error("Error updating task cache:", e);
        }
      }
      
      return result;
    } catch (error) {
      console.error('Error saving MUnit task:', error);
      toast.error('Failed to save MUnit task');
      return null;
    }
  };

  // Set up a single realtime subscription for all task changes
  useEffect(() => {
    if (!user || !selectedWorkspace) return;
    
    // Create a single channel to listen for changes to any task table
    const channel = supabase
      .channel('all-tasks-changes')
      .on(
        'postgres_changes',
        [
          {
            event: '*',
            schema: 'public',
            table: 'apl_integration_tasks',
            filter: `workspace_id=eq.${selectedWorkspace.id}`,
          },
          {
            event: '*',
            schema: 'public',
            table: 'apl_raml_tasks',
            filter: `workspace_id=eq.${selectedWorkspace.id}`,
          },
          {
            event: '*',
            schema: 'public',
            table: 'apl_munit_tasks',
            filter: `workspace_id=eq.${selectedWorkspace.id}`,
          },
          {
            event: '*',
            schema: 'public',
            table: 'apl_sample_data_tasks',
            filter: `workspace_id=eq.${selectedWorkspace.id}`,
          },
          {
            event: '*',
            schema: 'public',
            table: 'apl_document_tasks',
            filter: `workspace_id=eq.${selectedWorkspace.id}`,
          },
          {
            event: '*',
            schema: 'public',
            table: 'apl_diagram_tasks',
            filter: `workspace_id=eq.${selectedWorkspace.id}`,
          },
          {
            event: '*',
            schema: 'public',
            table: 'apl_dataweave_history',
            filter: `workspace_id=eq.${selectedWorkspace.id}`,
          }
        ],
        (payload) => {
          console.log('Task change detected:', payload.eventType, payload.table);
          
          // Instead of immediately refreshing, debounce the refresh
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
