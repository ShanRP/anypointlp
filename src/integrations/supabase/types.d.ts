import { Database as OriginalDatabase } from './types';

// Extend the original Database type to include our new tables
export interface ExtendedDatabase extends OriginalDatabase {
  public: {
    Tables: OriginalDatabase['public']['Tables'] & {
      apl_coding_assistant_sessions: {
        Row: {
          id: string;
          user_id: string;
          title: string;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          user_id: string;
          title: string;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          user_id?: string;
          title?: string;
          created_at?: string;
          updated_at?: string;
        };
        Relationships: [];
      };
      apl_coding_assistant_messages: {
        Row: {
          id: string;
          session_id: string;
          role: string;
          content: string;
          timestamp: string;
        };
        Insert: {
          id?: string;
          session_id: string;
          role: string;
          content: string;
          timestamp?: string;
        };
        Update: {
          id?: string;
          session_id?: string;
          role?: string;
          content?: string;
          timestamp?: string;
        };
        Relationships: [
          {
            foreignKeyName: "apl_coding_assistant_messages_session_id_fkey";
            columns: ["session_id"];
            isOneToOne: false;
            referencedRelation: "apl_coding_assistant_sessions";
            referencedColumns: ["id"];
          }
        ];
      };
      apl_raml_tasks: {
        Row: {
          id: string;
          task_id: string;
          task_name: string;
          user_id: string;
          workspace_id: string;
          description: string;
          created_at: string;
          updated_at: string;
          category: string;
          raml_content: string;
          api_name: string;
          api_version: string;
          base_uri: string;
          endpoints: Json;
          documentation: string;
        };
        Insert: {
          id?: string;
          task_id: string;
          task_name: string;
          user_id: string;
          workspace_id: string;
          description?: string;
          created_at?: string;
          updated_at?: string;
          category?: string;
          raml_content?: string;
          api_name?: string;
          api_version?: string;
          base_uri?: string;
          endpoints?: Json;
          documentation?: string;
        };
        Update: {
          id?: string;
          task_id?: string;
          task_name?: string;
          user_id?: string;
          workspace_id?: string;
          description?: string;
          created_at?: string;
          updated_at?: string;
          category?: string;
          raml_content?: string;
          api_name?: string;
          api_version?: string;
          base_uri?: string;
          endpoints?: Json;
          documentation?: string;
        };
        Relationships: [
          {
            foreignKeyName: "apl_raml_tasks_user_id_fkey";
            columns: ["user_id"];
            isOneToOne: false;
            referencedRelation: "users";
            referencedColumns: ["id"];
          }
        ];
      };
    };
    Functions: OriginalDatabase['public']['Functions'] & {
      apl_get_raml_tasks: {
        Args: { workspace_id_param: string };
        Returns: {
          id: string;
          task_id: string;
          task_name: string;
          user_id: string;
          workspace_id: string;
          description: string;
          created_at: string;
          updated_at: string;
          category: string;
          raml_content: string;
          api_name: string;
          api_version: string;
          base_uri: string;
          endpoints: Json;
          documentation: string;
        }[];
      };
      apl_get_raml_task_details: {
        Args: { task_id_param: string };
        Returns: {
          id: string;
          task_id: string;
          task_name: string;
          user_id: string;
          workspace_id: string;
          description: string;
          created_at: string;
          updated_at: string;
          category: string;
          raml_content: string;
          api_name: string;
          api_version: string;
          base_uri: string;
          endpoints: Json;
          documentation: string;
        }[];
      };
    };
  };
}
