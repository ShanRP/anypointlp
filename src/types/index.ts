
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

export interface JobPost {
  id: string;
  title: string;
  description: string;
  code?: string;
  user_id: string;
  created_at: string;
  updated_at: string;
  status: 'open' | 'closed';
  username?: string;
}

export interface JobComment {
  id: string;
  post_id: string;
  user_id: string;
  created_at: string;
  comment: string;
  username?: string;
}
