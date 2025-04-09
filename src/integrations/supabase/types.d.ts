
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
      apl_newsletter_subscribers: {
        Row: {
          id: string;
          created_at: string;
          last_email_sent: string | null;
          email: string;
          status: string;
        };
        Insert: {
          id?: string;
          created_at?: string;
          last_email_sent?: string | null;
          email: string;
          status?: string;
        };
        Update: {
          id?: string;
          created_at?: string;
          last_email_sent?: string | null;
          email?: string;
          status?: string;
        };
        Relationships: [];
      };
      apl_munit_tasks: {
        Row: {
          id: string
          task_id: string
          task_name: string
          user_id: string
          workspace_id: string
          description: string
          created_at: string
          updated_at: string
          category: string
          munit_content: string
          flow_implementation: string
          flow_description: string
          runtime: string
          number_of_scenarios: number
        }
        Insert: {
          id?: string
          task_id: string
          task_name: string
          user_id: string
          workspace_id: string
          description?: string
          created_at?: string
          updated_at?: string
          category?: string
          munit_content?: string
          flow_implementation?: string
          flow_description?: string
          runtime?: string
          number_of_scenarios?: number
        }
        Update: {
          id?: string
          task_id?: string
          task_name?: string
          user_id?: string
          workspace_id?: string
          description?: string
          created_at?: string
          updated_at?: string
          category?: string
          munit_content?: string
          flow_implementation?: string
          flow_description?: string
          runtime?: string
          number_of_scenarios?: number
        }
        Relationships: [
          {
            foreignKeyName: "apl_munit_tasks_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "users"
            referencedColumns: ["id"]
          }
        ]
      },
      apl_sample_data_tasks: {
        Row: {
          id: string
          task_id: string
          task_name: string
          user_id: string
          workspace_id: string
          description: string
          created_at: string
          updated_at: string
          category: string
          source_format: string
          schema_content: string
          result_content: string
          notes: string
        }
        Insert: {
          id?: string
          task_id: string
          task_name: string
          user_id: string
          workspace_id: string
          description?: string
          created_at?: string
          updated_at?: string
          category?: string
          source_format: string
          schema_content?: string
          result_content?: string
          notes?: string
        }
        Update: {
          id?: string
          task_id?: string
          task_name?: string
          user_id?: string
          workspace_id?: string
          description?: string
          created_at?: string
          updated_at?: string
          category?: string
          source_format?: string
          schema_content?: string
          result_content?: string
          notes?: string
        }
        Relationships: [
          {
            foreignKeyName: "apl_sample_data_tasks_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "users"
            referencedColumns: ["id"]
          }
        ]
      }
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
      apl_get_munit_tasks: {
        Args: { workspace_id_param: string }
        Returns: {
          id: string
          task_id: string
          task_name: string
          user_id: string
          workspace_id: string
          description: string
          created_at: string
          updated_at: string
          category: string
          munit_content: string
          flow_implementation: string
          flow_description: string
          runtime: string
          number_of_scenarios: number
        }[]
      },
      apl_get_munit_task_details: {
        Args: { task_id_param: string }
        Returns: {
          id: string
          task_id: string
          task_name: string
          user_id: string
          workspace_id: string
          description: string
          created_at: string
          updated_at: string
          category: string
          munit_content: string
          flow_implementation: string
          flow_description: string
          runtime: string
          number_of_scenarios: number
        }[]
      },
      apl_get_sample_data_tasks: {
        Args: { workspace_id_param: string }
        Returns: {
          id: string
          task_id: string
          task_name: string
          user_id: string
          workspace_id: string
          description: string
          created_at: string
          updated_at: string
          category: string
          source_format: string
          schema_content: string
          result_content: string
          notes: string
        }[]
      },
      apl_get_sample_data_task_details: {
        Args: { task_id_param: string }
        Returns: {
          id: string
          task_id: string
          task_name: string
          user_id: string
          workspace_id: string
          description: string
          created_at: string
          updated_at: string
          category: string
          source_format: string
          schema_content: string
          result_content: string
          notes: string
        }[]
      },
      apl_insert_munit_task: {
        Args: {
          workspace_id: string
          task_id: string
          task_name: string
          user_id: string
          description?: string
          flow_implementation?: string
          flow_description?: string
          munit_content?: string
          runtime?: string
          number_of_scenarios?: number
          category?: string
        },
        Returns: string
      },
      apl_insert_sample_data_task: {
        Args: {
          workspace_id: string
          task_id: string
          task_name: string
          user_id: string
          description?: string
          source_format?: string
          schema_content?: string
          result_content?: string
          notes?: string
          category?: string
        },
        Returns: string
      }
    };
  };
}

export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[]

export interface Database {
  public: {
    Tables: {
      apl_coding_assistant_sessions: {
        Row: {
          id: string
          user_id: string
          title: string
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          user_id: string
          title: string
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          user_id?: string
          title?: string
          created_at?: string
          updated_at?: string
        }
        Relationships: []
      }
      apl_coding_assistant_messages: {
        Row: {
          id: string
          session_id: string
          role: string
          content: string
          timestamp: string
        }
        Insert: {
          id?: string
          session_id: string
          role: string
          content: string
          timestamp?: string
        }
        Update: {
          id?: string
          session_id?: string
          role?: string
          content?: string
          timestamp?: string
        }
        Relationships: [
          {
            foreignKeyName: "apl_coding_assistant_messages_session_id_fkey"
            columns: ["session_id"]
            isOneToOne: false
            referencedRelation: "apl_coding_assistant_sessions"
            referencedColumns: ["id"]
          }
        ]
      }
      apl_dataweave_tasks: {
        Row: {
          category: string | null
          created_at: string
          description: string | null
          generated_scripts: Json | null
          id: string
          input_format: string | null
          input_samples: Json | null
          notes: string | null
          output_samples: Json | null
          task_id: string | null
          task_name: string | null
          updated_at: string
          user_id: string | null
          username: string | null
          workspace_id: string | null
        }
        Insert: {
          category?: string | null
          created_at?: string
          description?: string | null
          generated_scripts?: Json | null
          id?: string
          input_format?: string | null
          input_samples?: Json | null
          notes?: string | null
          output_samples?: Json | null
          task_id?: string | null
          task_name?: string | null
          updated_at?: string
          user_id?: string | null
          username?: string | null
          workspace_id?: string | null
        }
        Update: {
          category?: string | null
          created_at?: string
          description?: string | null
          generated_scripts?: Json | null
          id?: string
          input_format?: string | null
          input_samples?: Json | null
          notes?: string | null
          output_samples?: Json | null
          task_id?: string | null
          task_name?: string | null
          updated_at?: string
          user_id?: string | null
          username?: string | null
          workspace_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "apl_dataweave_tasks_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "users"
            referencedColumns: ["id"]
          }
        ]
      }
      apl_integration_tasks: {
        Row: {
          created_at: string
          description: string | null
          generated_code: string | null
          id: string
          task_id: string | null
          task_name: string | null
          updated_at: string
          workspace_id: string | null
        }
        Insert: {
          created_at?: string
          description?: string | null
          generated_code?: string | null
          id?: string
          task_id?: string | null
          task_name?: string | null
          updated_at?: string
          workspace_id?: string | null
        }
        Update: {
          created_at?: string
          description?: string | null
          generated_code?: string | null
          id?: string
          task_id?: string | null
          task_name?: string | null
          updated_at?: string
          workspace_id?: string | null
        }
        Relationships: []
      }
      apl_munit_tasks: {
        Row: {
          id: string
          task_id: string
          task_name: string
          user_id: string
          workspace_id: string
          description: string
          created_at: string
          updated_at: string
          category: string
          munit_content: string
          flow_implementation: string
          flow_description: string
          runtime: string
          number_of_scenarios: number
        }
        Insert: {
          id?: string
          task_id: string
          task_name: string
          user_id: string
          workspace_id: string
          description?: string
          created_at?: string
          updated_at?: string
          category?: string
          munit_content?: string
          flow_implementation?: string
          flow_description?: string
          runtime?: string
          number_of_scenarios?: number
        }
        Update: {
          id?: string
          task_id?: string
          task_name?: string
          user_id?: string
          workspace_id?: string
          description?: string
          created_at?: string
          updated_at?: string
          category?: string
          munit_content?: string
          flow_implementation?: string
          flow_description?: string
          runtime?: string
          number_of_scenarios?: number
        }
        Relationships: [
          {
            foreignKeyName: "apl_munit_tasks_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "users"
            referencedColumns: ["id"]
          }
        ]
      }
      apl_newsletter_subscribers: {
        Row: {
          created_at: string
          email: string
          id: string
          last_email_sent: string | null
          status: string
        }
        Insert: {
          created_at?: string
          email: string
          id?: string
          last_email_sent?: string | null
          status?: string
        }
        Update: {
          created_at?: string
          email?: string
          id?: string
          last_email_sent?: string | null
          status?: string
        }
        Relationships: []
      }
      apl_raml_tasks: {
        Row: {
          api_name: string
          api_version: string
          base_uri: string
          category: string
          created_at: string
          description: string
          documentation: string
          endpoints: Json | null
          id: string
          raml_content: string
          task_id: string
          task_name: string
          updated_at: string
          user_id: string
          workspace_id: string
        }
        Insert: {
          api_name: string
          api_version: string
          base_uri: string
          category?: string
          created_at?: string
          description?: string
          documentation?: string
          endpoints?: Json | null
          id?: string
          raml_content: string
          task_id: string
          task_name: string
          updated_at?: string
          user_id: string
          workspace_id: string
        }
        Update: {
          api_name?: string
          api_version?: string
          base_uri?: string
          category?: string
          created_at?: string
          description?: string
          documentation?: string
          endpoints?: Json | null
          id?: string
          raml_content?: string
          task_id?: string
          task_name?: string
          updated_at?: string
          user_id?: string
          workspace_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "apl_raml_tasks_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "users"
            referencedColumns: ["id"]
          }
        ]
      }
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      apl_get_raml_task_details: {
        Args: {
          task_id_param: string
        }
        Returns: {
          api_name: string
          api_version: string
          base_uri: string
          category: string
          created_at: string
          description: string
          documentation: string
          endpoints: Json | null
          id: string
          raml_content: string
          task_id: string
          task_name: string
          updated_at: string
          user_id: string
          workspace_id: string
        }[]
      }
      apl_get_raml_tasks: {
        Args: {
          workspace_id_param: string
        }
        Returns: {
          api_name: string
          api_version: string
          base_uri: string
          category: string
          created_at: string
          description: string
          documentation: string
          endpoints: Json | null
          id: string
          raml_content: string
          task_id: string
          task_name: string
          updated_at: string
          user_id: string
          workspace_id: string
        }[]
      }
      get_customer_id_from_email: {
        Args: {
          customer_email: string
        }
        Returns: {
          id: string
          stripe_customer_id: string
        }[]
      }
    }
    Enums: {
      [_ in never]: never
    }
    CompositeTypes: {
      [_ in never]: never
    }
  }
}
