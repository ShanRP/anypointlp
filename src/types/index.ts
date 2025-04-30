
export interface TaskDetails {
  id: string;
  task_id: string;
  task_name: string;
  category: string;
  description?: string;
  created_at: string;
  [key: string]: any; // For additional properties specific to different task types
}

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
