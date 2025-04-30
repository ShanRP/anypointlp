
// Export TaskDetails interface
export interface TaskDetails {
  id: string;
  task_id: string;
  task_name: string;
  category: string;
  description?: string;
  created_at: string;
  workspace_id: string;
  user_id: string;
  [key: string]: any; // For additional properties specific to different task types
}

// Export WorkspaceTask interface
export interface WorkspaceTask {
  id: string;
  task_id: string;
  task_name: string;
  category: string;
  description?: string;
  created_at: string;
  workspace_id: string;
  user_id: string;
  [key: string]: any; // For additional properties specific to different task types
}

// Export the useWorkspaceTasks hook type for convenience
export { useWorkspaceTasks } from '@/hooks/useWorkspaceTasks';
