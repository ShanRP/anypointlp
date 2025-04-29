
import { useState, useCallback } from 'react';
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/components/ui/use-toast";

export interface Task {
  id: string;
  task_id: string;
  task_name: string;
  description?: string;
  category: string;
  created_at: string;
  updated_at: string;
  workspace_id: string;
  user_id: string;
}

export interface TaskDetails extends Task {
  content?: any;
  result_content?: string;
}

export const useTasks = () => {
  const [tasks, setTasks] = useState<Task[]>([]);
  const [selectedTask, setSelectedTask] = useState<TaskDetails | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string>('');
  const { toast } = useToast();

  const fetchWorkspaceTasks = useCallback(async (workspaceId: string) => {
    if (!workspaceId) {
      setError("No workspace selected");
      return [];
    }

    setLoading(true);
    try {
      const { data: dwData, error: dwError } = await supabase
        .from('apl_dataweave_tasks')
        .select('*')
        .eq('workspace_id', workspaceId);
      
      const { data: integrationData, error: integrationError } = await supabase
        .from('apl_integration_tasks')
        .select('*')
        .eq('workspace_id', workspaceId);

      const { data: ramlData, error: ramlError } = await supabase
        .from('apl_raml_tasks')
        .select('*')
        .eq('workspace_id', workspaceId);

      const { data: munitData, error: munitError } = await supabase
        .from('apl_munit_tasks')
        .select('*')
        .eq('workspace_id', workspaceId);

      const { data: sampleData, error: sampleError } = await supabase
        .from('apl_sample_data_tasks')
        .select('*')
        .eq('workspace_id', workspaceId);
        
      const { data: documentData, error: documentError } = await supabase
        .from('apl_document_tasks')
        .select('*')
        .eq('workspace_id', workspaceId);
        
      const { data: diagramData, error: diagramError } = await supabase
        .from('apl_diagram_tasks')
        .select('*')
        .eq('workspace_id', workspaceId);

      // Check for errors
      if (dwError || integrationError || ramlError || munitError || sampleError || documentError || diagramError) {
        throw new Error("Error fetching tasks");
      }

      // Combine all task types
      const allTasks = [
        ...(dwData || []).map(task => ({ ...task, category: 'dataweave' })),
        ...(integrationData || []),
        ...(ramlData || []),
        ...(munitData || []),
        ...(sampleData || []),
        ...(documentData || []),
        ...(diagramData || [])
      ];

      // Sort by creation date, newest first
      const sortedTasks = allTasks.sort((a, b) => 
        new Date(b.created_at).getTime() - new Date(a.created_at).getTime()
      );

      setTasks(sortedTasks);
      return sortedTasks;
    } catch (error) {
      console.error("Error fetching tasks:", error);
      setError("Failed to fetch tasks");
      return [];
    } finally {
      setLoading(false);
    }
  }, []);

  const fetchTaskDetails = useCallback(async (taskId: string) => {
    if (!taskId) return;
    
    setLoading(true);
    try {
      // First, find which category the task belongs to
      const task = tasks.find(t => t.id === taskId);
      
      if (!task) {
        throw new Error("Task not found");
      }
      
      const category = task.category;
      let tableName;
      
      // Map category to table name
      switch (category) {
        case 'dataweave':
          tableName = 'apl_dataweave_tasks';
          break;
        case 'integration':
          tableName = 'apl_integration_tasks';
          break;
        case 'raml':
          tableName = 'apl_raml_tasks';
          break;
        case 'munit':
          tableName = 'apl_munit_tasks';
          break;
        case 'sampledata':
          tableName = 'apl_sample_data_tasks';
          break;
        case 'document':
          tableName = 'apl_document_tasks';
          break;
        case 'diagram':
          tableName = 'apl_diagram_tasks';
          break;
        default:
          throw new Error(`Unknown task category: ${category}`);
      }
      
      // Fetch detailed task data
      const { data, error } = await supabase
        .from(tableName)
        .select('*')
        .eq('id', taskId)
        .single();
      
      if (error) {
        throw error;
      }
      
      setSelectedTask(data);
    } catch (error) {
      console.error("Error fetching task details:", error);
      setError("Failed to load task details");
      toast({
        variant: "destructive",
        title: "Error",
        description: "Failed to load task details"
      });
    } finally {
      setLoading(false);
    }
  }, [tasks, toast]);

  const createTask = useCallback(async (taskData: Partial<Task>) => {
    try {
      const { category } = taskData;
      let tableName;
      
      switch (category) {
        case 'dataweave':
          tableName = 'apl_dataweave_tasks';
          break;
        case 'integration':
          tableName = 'apl_integration_tasks';
          break;
        case 'raml':
          tableName = 'apl_raml_tasks';
          break;
        case 'munit':
          tableName = 'apl_munit_tasks';
          break;
        case 'sampledata':
          tableName = 'apl_sample_data_tasks';
          break;
        case 'document':
          tableName = 'apl_document_tasks';
          break;
        case 'diagram':
          tableName = 'apl_diagram_tasks';
          break;
        default:
          throw new Error(`Unknown task category: ${category}`);
      }
      
      const { data, error } = await supabase
        .from(tableName)
        .insert([taskData])
        .select()
        .single();
      
      if (error) {
        throw error;
      }
      
      // Update local tasks state
      setTasks(prev => [data, ...prev]);
      
      return data;
    } catch (error) {
      console.error("Error creating task:", error);
      setError("Failed to create task");
      return null;
    }
  }, []);

  const updateTask = useCallback(async (taskId: string, updates: Partial<Task>) => {
    try {
      const task = tasks.find(t => t.id === taskId);
      
      if (!task) {
        throw new Error("Task not found");
      }
      
      const category = task.category;
      let tableName;
      
      switch (category) {
        case 'dataweave':
          tableName = 'apl_dataweave_tasks';
          break;
        case 'integration':
          tableName = 'apl_integration_tasks';
          break;
        case 'raml':
          tableName = 'apl_raml_tasks';
          break;
        case 'munit':
          tableName = 'apl_munit_tasks';
          break;
        case 'sampledata':
          tableName = 'apl_sample_data_tasks';
          break;
        case 'document':
          tableName = 'apl_document_tasks';
          break;
        case 'diagram':
          tableName = 'apl_diagram_tasks';
          break;
        default:
          throw new Error(`Unknown task category: ${category}`);
      }
      
      const { data, error } = await supabase
        .from(tableName)
        .update(updates)
        .eq('id', taskId)
        .select()
        .single();
      
      if (error) {
        throw error;
      }
      
      // Update local tasks state
      setTasks(prev => prev.map(t => t.id === taskId ? { ...t, ...updates } : t));
      
      // Update selected task if it's the one being updated
      if (selectedTask && selectedTask.id === taskId) {
        setSelectedTask({ ...selectedTask, ...updates });
      }
      
      return data;
    } catch (error) {
      console.error("Error updating task:", error);
      setError("Failed to update task");
      return null;
    }
  }, [tasks, selectedTask]);

  const deleteTask = useCallback(async (taskId: string) => {
    try {
      const task = tasks.find(t => t.id === taskId);
      
      if (!task) {
        throw new Error("Task not found");
      }
      
      const category = task.category;
      let tableName;
      
      switch (category) {
        case 'dataweave':
          tableName = 'apl_dataweave_tasks';
          break;
        case 'integration':
          tableName = 'apl_integration_tasks';
          break;
        case 'raml':
          tableName = 'apl_raml_tasks';
          break;
        case 'munit':
          tableName = 'apl_munit_tasks';
          break;
        case 'sampledata':
          tableName = 'apl_sample_data_tasks';
          break;
        case 'document':
          tableName = 'apl_document_tasks';
          break;
        case 'diagram':
          tableName = 'apl_diagram_tasks';
          break;
        default:
          throw new Error(`Unknown task category: ${category}`);
      }
      
      const { error } = await supabase
        .from(tableName)
        .delete()
        .eq('id', taskId);
      
      if (error) {
        throw error;
      }
      
      // Update local tasks state
      setTasks(prev => prev.filter(t => t.id !== taskId));
      
      // Clear selected task if it's the one being deleted
      if (selectedTask && selectedTask.id === taskId) {
        setSelectedTask(null);
      }
      
      return true;
    } catch (error) {
      console.error("Error deleting task:", error);
      setError("Failed to delete task");
      return false;
    }
  }, [tasks, selectedTask]);

  return {
    tasks,
    selectedTask,
    loading,
    error,
    fetchTaskDetails,
    fetchWorkspaceTasks,
    createTask,
    updateTask,
    deleteTask
  };
};
