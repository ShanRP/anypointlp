
import type { Database } from './types';
import { Json } from './types';

export interface IntegrationTask {
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
  user_id: string;
  username: string;
  category: string;
  description?: string;
  flow_summary?: string;
  flow_implementation?: string;
  flow_constants?: string;
  pom_dependencies?: string;
  compilation_check?: string;
}

export interface CustomTypeDatabase extends Database {
  public: {
    Tables: Database['public']['Tables'] & {
      apl_integration_tasks: {
        Row: IntegrationTask;
        Insert: Omit<IntegrationTask, 'id' | 'created_at'> & { id?: string; created_at?: string };
        Update: Partial<IntegrationTask>;
        Relationships: [
          {
            foreignKeyName: "apl_integration_tasks_user_id_fkey";
            columns: ["user_id"];
            isOneToOne: false;
            referencedRelation: "users";
            referencedColumns: ["id"];
          }
        ];
      };
    };
    Views: Database['public']['Views'];
    Functions: Database['public']['Functions'];
    Enums: Database['public']['Enums'];
    CompositeTypes: Database['public']['CompositeTypes'];
  };
}

// Helper function for type casting
export function createCustomSupabaseClient(supabaseClient: any) {
  return supabaseClient as unknown as ReturnType<typeof createClient<CustomTypeDatabase>>;
}

// This is just for importing the createClient type properly
import { createClient } from '@supabase/supabase-js';
