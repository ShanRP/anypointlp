export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[]

export type Database = {
  public: {
    Tables: {
      apl_auth_logs: {
        Row: {
          action: string
          created_at: string
          details: Json | null
          device: string | null
          id: string
          user_id: string | null
        }
        Insert: {
          action: string
          created_at?: string
          details?: Json | null
          device?: string | null
          id?: string
          user_id?: string | null
        }
        Update: {
          action?: string
          created_at?: string
          details?: Json | null
          device?: string | null
          id?: string
          user_id?: string | null
        }
        Relationships: []
      }
      apl_coding_assistant_messages: {
        Row: {
          content: string
          id: string
          role: string
          session_id: string
          timestamp: string
        }
        Insert: {
          content: string
          id?: string
          role: string
          session_id: string
          timestamp?: string
        }
        Update: {
          content?: string
          id?: string
          role?: string
          session_id?: string
          timestamp?: string
        }
        Relationships: [
          {
            foreignKeyName: "apl_coding_assistant_messages_session_id_fkey"
            columns: ["session_id"]
            isOneToOne: false
            referencedRelation: "apl_coding_assistant_sessions"
            referencedColumns: ["id"]
          },
        ]
      }
      apl_coding_assistant_sessions: {
        Row: {
          created_at: string
          id: string
          title: string
          updated_at: string
          user_id: string
        }
        Insert: {
          created_at?: string
          id?: string
          title: string
          updated_at?: string
          user_id: string
        }
        Update: {
          created_at?: string
          id?: string
          title?: string
          updated_at?: string
          user_id?: string
        }
        Relationships: []
      }
      apl_dataweave_history: {
        Row: {
          created_at: string
          generated_script: string | null
          id: string
          input_format: string | null
          input_samples: Json | null
          notes: string | null
          output_samples: Json | null
          user_id: string | null
        }
        Insert: {
          created_at?: string
          generated_script?: string | null
          id?: string
          input_format?: string | null
          input_samples?: Json | null
          notes?: string | null
          output_samples?: Json | null
          user_id?: string | null
        }
        Update: {
          created_at?: string
          generated_script?: string | null
          id?: string
          input_format?: string | null
          input_samples?: Json | null
          notes?: string | null
          output_samples?: Json | null
          user_id?: string | null
        }
        Relationships: []
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
        Relationships: []
      }
      apl_diagram_tasks: {
        Row: {
          category: string | null
          created_at: string
          description: string | null
          diagram_content: Json | null
          diagram_type: string | null
          id: string
          svg_output: string | null
          task_id: string
          task_name: string
          updated_at: string
          user_id: string
          workspace_id: string
        }
        Insert: {
          category?: string | null
          created_at?: string
          description?: string | null
          diagram_content?: Json | null
          diagram_type?: string | null
          id?: string
          svg_output?: string | null
          task_id: string
          task_name: string
          updated_at?: string
          user_id: string
          workspace_id: string
        }
        Update: {
          category?: string | null
          created_at?: string
          description?: string | null
          diagram_content?: Json | null
          diagram_type?: string | null
          id?: string
          svg_output?: string | null
          task_id?: string
          task_name?: string
          updated_at?: string
          user_id?: string
          workspace_id?: string
        }
        Relationships: []
      }
      apl_document_tasks: {
        Row: {
          category: string | null
          content: string | null
          created_at: string
          description: string | null
          format: string | null
          id: string
          tags: Json | null
          task_id: string
          task_name: string
          updated_at: string
          user_id: string
          workspace_id: string
        }
        Insert: {
          category?: string | null
          content?: string | null
          created_at?: string
          description?: string | null
          format?: string | null
          id?: string
          tags?: Json | null
          task_id: string
          task_name: string
          updated_at?: string
          user_id: string
          workspace_id: string
        }
        Update: {
          category?: string | null
          content?: string | null
          created_at?: string
          description?: string | null
          format?: string | null
          id?: string
          tags?: Json | null
          task_id?: string
          task_name?: string
          updated_at?: string
          user_id?: string
          workspace_id?: string
        }
        Relationships: []
      }
      apl_exchange_comments: {
        Row: {
          comment: string
          created_at: string
          id: string
          item_id: string
          user_id: string
          username: string | null
        }
        Insert: {
          comment: string
          created_at?: string
          id?: string
          item_id: string
          user_id: string
          username?: string | null
        }
        Update: {
          comment?: string
          created_at?: string
          id?: string
          item_id?: string
          user_id?: string
          username?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "apl_exchange_comments_item_id_fkey"
            columns: ["item_id"]
            isOneToOne: false
            referencedRelation: "apl_exchange_items"
            referencedColumns: ["id"]
          },
        ]
      }
      apl_exchange_items: {
        Row: {
          content: Json | null
          created_at: string
          description: string | null
          id: string
          title: string
          type: string
          updated_at: string
          user_id: string
          username: string | null
          visibility: string | null
          workspace_id: string | null
        }
        Insert: {
          content?: Json | null
          created_at?: string
          description?: string | null
          id?: string
          title: string
          type: string
          updated_at?: string
          user_id: string
          username?: string | null
          visibility?: string | null
          workspace_id?: string | null
        }
        Update: {
          content?: Json | null
          created_at?: string
          description?: string | null
          id?: string
          title?: string
          type?: string
          updated_at?: string
          user_id?: string
          username?: string | null
          visibility?: string | null
          workspace_id?: string | null
        }
        Relationships: []
      }
      apl_exchange_likes: {
        Row: {
          created_at: string
          id: string
          item_id: string
          user_id: string
        }
        Insert: {
          created_at?: string
          id?: string
          item_id: string
          user_id: string
        }
        Update: {
          created_at?: string
          id?: string
          item_id?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "apl_exchange_likes_item_id_fkey"
            columns: ["item_id"]
            isOneToOne: false
            referencedRelation: "apl_exchange_items"
            referencedColumns: ["id"]
          },
        ]
      }
      apl_integration_tasks: {
        Row: {
          category: string | null
          compilation_check: string | null
          created_at: string
          description: string | null
          diagrams: Json | null
          flow_constants: string | null
          flow_implementation: string | null
          flow_summary: string | null
          generated_code: string | null
          id: string
          pom_dependencies: string | null
          raml_content: string | null
          runtime: string | null
          task_id: string | null
          task_name: string | null
          updated_at: string
          user_id: string | null
          workspace_id: string | null
        }
        Insert: {
          category?: string | null
          compilation_check?: string | null
          created_at?: string
          description?: string | null
          diagrams?: Json | null
          flow_constants?: string | null
          flow_implementation?: string | null
          flow_summary?: string | null
          generated_code?: string | null
          id?: string
          pom_dependencies?: string | null
          raml_content?: string | null
          runtime?: string | null
          task_id?: string | null
          task_name?: string | null
          updated_at?: string
          user_id?: string | null
          workspace_id?: string | null
        }
        Update: {
          category?: string | null
          compilation_check?: string | null
          created_at?: string
          description?: string | null
          diagrams?: Json | null
          flow_constants?: string | null
          flow_implementation?: string | null
          flow_summary?: string | null
          generated_code?: string | null
          id?: string
          pom_dependencies?: string | null
          raml_content?: string | null
          runtime?: string | null
          task_id?: string | null
          task_name?: string | null
          updated_at?: string
          user_id?: string | null
          workspace_id?: string | null
        }
        Relationships: []
      }
      apl_job_comments: {
        Row: {
          comment: string
          created_at: string
          id: string
          post_id: string
          user_id: string
          username: string | null
        }
        Insert: {
          comment: string
          created_at?: string
          id?: string
          post_id: string
          user_id: string
          username?: string | null
        }
        Update: {
          comment?: string
          created_at?: string
          id?: string
          post_id?: string
          user_id?: string
          username?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "apl_job_comments_post_id_fkey"
            columns: ["post_id"]
            isOneToOne: false
            referencedRelation: "apl_job_posts"
            referencedColumns: ["id"]
          },
        ]
      }
      apl_job_posts: {
        Row: {
          code: string | null
          created_at: string
          description: string
          id: string
          status: string
          title: string
          updated_at: string
          user_id: string
          username: string | null
        }
        Insert: {
          code?: string | null
          created_at?: string
          description: string
          id?: string
          status?: string
          title: string
          updated_at?: string
          user_id: string
          username?: string | null
        }
        Update: {
          code?: string | null
          created_at?: string
          description?: string
          id?: string
          status?: string
          title?: string
          updated_at?: string
          user_id?: string
          username?: string | null
        }
        Relationships: []
      }
      apl_munit_tasks: {
        Row: {
          category: string | null
          created_at: string
          description: string | null
          flow_description: string | null
          flow_implementation: string | null
          id: string
          munit_content: string | null
          number_of_scenarios: number | null
          runtime: string | null
          task_id: string
          task_name: string
          updated_at: string
          user_id: string
          workspace_id: string
        }
        Insert: {
          category?: string | null
          created_at?: string
          description?: string | null
          flow_description?: string | null
          flow_implementation?: string | null
          id?: string
          munit_content?: string | null
          number_of_scenarios?: number | null
          runtime?: string | null
          task_id: string
          task_name: string
          updated_at?: string
          user_id: string
          workspace_id: string
        }
        Update: {
          category?: string | null
          created_at?: string
          description?: string | null
          flow_description?: string | null
          flow_implementation?: string | null
          id?: string
          munit_content?: string | null
          number_of_scenarios?: number | null
          runtime?: string | null
          task_id?: string
          task_name?: string
          updated_at?: string
          user_id?: string
          workspace_id?: string
        }
        Relationships: []
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
      apl_peer_connections: {
        Row: {
          created_at: string
          id: string
          peer_id: string
          session_id: string
          status: string | null
          updated_at: string
          user_id: string
        }
        Insert: {
          created_at?: string
          id?: string
          peer_id: string
          session_id: string
          status?: string | null
          updated_at?: string
          user_id: string
        }
        Update: {
          created_at?: string
          id?: string
          peer_id?: string
          session_id?: string
          status?: string | null
          updated_at?: string
          user_id?: string
        }
        Relationships: []
      }
      apl_profiles: {
        Row: {
          avatar_url: string | null
          bio: string | null
          company: string | null
          created_at: string
          full_name: string | null
          id: string
          job_title: string | null
          location: string | null
          updated_at: string
          username: string | null
        }
        Insert: {
          avatar_url?: string | null
          bio?: string | null
          company?: string | null
          created_at?: string
          full_name?: string | null
          id: string
          job_title?: string | null
          location?: string | null
          updated_at?: string
          username?: string | null
        }
        Update: {
          avatar_url?: string | null
          bio?: string | null
          company?: string | null
          created_at?: string
          full_name?: string | null
          id?: string
          job_title?: string | null
          location?: string | null
          updated_at?: string
          username?: string | null
        }
        Relationships: []
      }
      apl_raml_tasks: {
        Row: {
          api_name: string | null
          api_version: string | null
          base_uri: string | null
          category: string | null
          created_at: string
          description: string | null
          documentation: string | null
          endpoints: Json | null
          id: string
          raml_content: string | null
          task_id: string
          task_name: string
          updated_at: string
          user_id: string
          workspace_id: string
        }
        Insert: {
          api_name?: string | null
          api_version?: string | null
          base_uri?: string | null
          category?: string | null
          created_at?: string
          description?: string | null
          documentation?: string | null
          endpoints?: Json | null
          id?: string
          raml_content?: string | null
          task_id: string
          task_name: string
          updated_at?: string
          user_id: string
          workspace_id: string
        }
        Update: {
          api_name?: string | null
          api_version?: string | null
          base_uri?: string | null
          category?: string | null
          created_at?: string
          description?: string | null
          documentation?: string | null
          endpoints?: Json | null
          id?: string
          raml_content?: string | null
          task_id?: string
          task_name?: string
          updated_at?: string
          user_id?: string
          workspace_id?: string
        }
        Relationships: []
      }
      apl_sample_data_tasks: {
        Row: {
          category: string | null
          created_at: string
          description: string | null
          id: string
          notes: string | null
          result_content: string | null
          schema_content: string | null
          source_format: string | null
          task_id: string
          task_name: string
          updated_at: string
          user_id: string
          workspace_id: string
        }
        Insert: {
          category?: string | null
          created_at?: string
          description?: string | null
          id?: string
          notes?: string | null
          result_content?: string | null
          schema_content?: string | null
          source_format?: string | null
          task_id: string
          task_name: string
          updated_at?: string
          user_id: string
          workspace_id: string
        }
        Update: {
          category?: string | null
          created_at?: string
          description?: string | null
          id?: string
          notes?: string | null
          result_content?: string | null
          schema_content?: string | null
          source_format?: string | null
          task_id?: string
          task_name?: string
          updated_at?: string
          user_id?: string
          workspace_id?: string
        }
        Relationships: []
      }
      apl_user_credits: {
        Row: {
          created_at: string
          credits_limit: number
          credits_used: number
          id: string
          is_pro: boolean
          reset_date: string
          updated_at: string
          user_id: string
        }
        Insert: {
          created_at?: string
          credits_limit?: number
          credits_used?: number
          id?: string
          is_pro?: boolean
          reset_date?: string
          updated_at?: string
          user_id: string
        }
        Update: {
          created_at?: string
          credits_limit?: number
          credits_used?: number
          id?: string
          is_pro?: boolean
          reset_date?: string
          updated_at?: string
          user_id?: string
        }
        Relationships: []
      }
      apl_user_sessions: {
        Row: {
          created_at: string
          expired_at: string | null
          id: string
          ip_address: string | null
          last_active_at: string
          session_id: string
          user_agent: string | null
          user_id: string
        }
        Insert: {
          created_at?: string
          expired_at?: string | null
          id?: string
          ip_address?: string | null
          last_active_at?: string
          session_id: string
          user_agent?: string | null
          user_id: string
        }
        Update: {
          created_at?: string
          expired_at?: string | null
          id?: string
          ip_address?: string | null
          last_active_at?: string
          session_id?: string
          user_agent?: string | null
          user_id?: string
        }
        Relationships: []
      }
      apl_workspace_invitations: {
        Row: {
          accepted_at: string | null
          accepted_by: string | null
          created_at: string
          created_by: string
          email: string
          id: string
          status: string
          workspace_id: string
        }
        Insert: {
          accepted_at?: string | null
          accepted_by?: string | null
          created_at?: string
          created_by: string
          email: string
          id?: string
          status?: string
          workspace_id: string
        }
        Update: {
          accepted_at?: string | null
          accepted_by?: string | null
          created_at?: string
          created_by?: string
          email?: string
          id?: string
          status?: string
          workspace_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "apl_workspace_invitations_workspace_id_fkey"
            columns: ["workspace_id"]
            isOneToOne: false
            referencedRelation: "apl_workspaces"
            referencedColumns: ["id"]
          },
        ]
      }
      apl_workspace_members: {
        Row: {
          created_at: string
          id: string
          role: string
          updated_at: string
          user_id: string
          workspace_id: string
        }
        Insert: {
          created_at?: string
          id?: string
          role?: string
          updated_at?: string
          user_id: string
          workspace_id: string
        }
        Update: {
          created_at?: string
          id?: string
          role?: string
          updated_at?: string
          user_id?: string
          workspace_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "apl_workspace_members_workspace_id_fkey"
            columns: ["workspace_id"]
            isOneToOne: false
            referencedRelation: "apl_workspaces"
            referencedColumns: ["id"]
          },
        ]
      }
      apl_workspaces: {
        Row: {
          created_at: string
          id: string
          initial: string | null
          invite_enabled: boolean | null
          is_invited_workspace: boolean | null
          name: string
          session_timeout: string | null
          updated_at: string
          user_id: string
        }
        Insert: {
          created_at?: string
          id?: string
          initial?: string | null
          invite_enabled?: boolean | null
          is_invited_workspace?: boolean | null
          name: string
          session_timeout?: string | null
          updated_at?: string
          user_id: string
        }
        Update: {
          created_at?: string
          id?: string
          initial?: string | null
          invite_enabled?: boolean | null
          is_invited_workspace?: boolean | null
          name?: string
          session_timeout?: string | null
          updated_at?: string
          user_id?: string
        }
        Relationships: []
      }
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      add_workspace_member: {
        Args: {
          workspace_id_param: string
          user_id_param: string
          role_param?: string
        }
        Returns: string
      }
      apl_accept_workspace_invitation: {
        Args: { p_invitation_id: string; p_user_id: string }
        Returns: boolean
      }
      apl_get_api_key: {
        Args: { key_name: string }
        Returns: string
      }
      apl_get_integration_task_details: {
        Args: { task_id_param: string }
        Returns: {
          id: string
          task_id: string
          task_name: string
          description: string
          user_id: string
          workspace_id: string
          created_at: string
          updated_at: string
          category: string
          runtime: string
          raml_content: string
          generated_code: string
          flow_summary: string
          flow_implementation: string
          flow_constants: string
          pom_dependencies: string
          compilation_check: string
          diagrams: Json
        }[]
      }
      apl_get_integration_tasks: {
        Args: { workspace_id_param: string }
        Returns: {
          id: string
          task_id: string
          task_name: string
          description: string
          user_id: string
          workspace_id: string
          created_at: string
          updated_at: string
          category: string
          runtime: string
          raml_content: string
          generated_code: string
          flow_summary: string
          flow_implementation: string
          flow_constants: string
          pom_dependencies: string
          compilation_check: string
          diagrams: Json
        }[]
      }
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
      }
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
      }
      apl_get_raml_task_details: {
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
          raml_content: string
          api_name: string
          api_version: string
          base_uri: string
          endpoints: Json
          documentation: string
        }[]
      }
      apl_get_raml_tasks: {
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
          raml_content: string
          api_name: string
          api_version: string
          base_uri: string
          endpoints: Json
          documentation: string
        }[]
      }
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
      }
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
      }
      apl_get_user_sessions: {
        Args: { user_id_param: string }
        Returns: Json[]
      }
      apl_get_user_workspaces: {
        Args: { user_id_param: string }
        Returns: {
          id: string
          name: string
          initial: string
          session_timeout: string
          invite_enabled: boolean
          is_invited_workspace: boolean
          created_at: string
        }[]
      }
      apl_get_workspace_tasks: {
        Args: { workspace_id_param: string; category_param?: string }
        Returns: {
          id: string
          task_id: string
          task_name: string
          category: string
          created_at: string
          updated_at: string
        }[]
      }
      apl_increment_exchange_counter: {
        Args: { p_counter_type: string; p_item_id: string; p_user_id: string }
        Returns: boolean
      }
      apl_insert_dataweave_history: {
        Args: {
          user_id_input: string
          input_format_input: string
          input_samples_input: Json
          output_samples_input: Json
          notes_input: string
          generated_scripts_input: Json
        }
        Returns: string
      }
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
        }
        Returns: string
      }
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
        }
        Returns: string
      }
      apl_save_integration_task: {
        Args: {
          p_task_id: string
          p_task_name: string
          p_description: string
          p_user_id: string
          p_workspace_id: string
          p_category?: string
          p_runtime?: string
          p_raml_content?: string
          p_generated_code?: string
          p_flow_summary?: string
          p_flow_implementation?: string
          p_flow_constants?: string
          p_pom_dependencies?: string
          p_compilation_check?: string
          p_diagrams?: Json
        }
        Returns: string
      }
      bytea_to_text: {
        Args: { data: string }
        Returns: string
      }
      check_workspace_membership: {
        Args: { workspace_id_param: string; user_id_param: string }
        Returns: {
          id: string
          workspace_id: string
          user_id: string
          role: string
          created_at: string
        }[]
      }
      create_default_workspace: {
        Args: { p_user_id: string; p_username?: string }
        Returns: string
      }
      http: {
        Args: { request: Database["public"]["CompositeTypes"]["http_request"] }
        Returns: Database["public"]["CompositeTypes"]["http_response"]
      }
      http_delete: {
        Args:
          | { uri: string }
          | { uri: string; content: string; content_type: string }
        Returns: Database["public"]["CompositeTypes"]["http_response"]
      }
      http_get: {
        Args: { uri: string } | { uri: string; data: Json }
        Returns: Database["public"]["CompositeTypes"]["http_response"]
      }
      http_head: {
        Args: { uri: string }
        Returns: Database["public"]["CompositeTypes"]["http_response"]
      }
      http_header: {
        Args: { field: string; value: string }
        Returns: Database["public"]["CompositeTypes"]["http_header"]
      }
      http_list_curlopt: {
        Args: Record<PropertyKey, never>
        Returns: {
          curlopt: string
          value: string
        }[]
      }
      http_patch: {
        Args: { uri: string; content: string; content_type: string }
        Returns: Database["public"]["CompositeTypes"]["http_response"]
      }
      http_post: {
        Args:
          | { uri: string; content: string; content_type: string }
          | { uri: string; data: Json }
        Returns: Database["public"]["CompositeTypes"]["http_response"]
      }
      http_put: {
        Args: { uri: string; content: string; content_type: string }
        Returns: Database["public"]["CompositeTypes"]["http_response"]
      }
      http_reset_curlopt: {
        Args: Record<PropertyKey, never>
        Returns: boolean
      }
      http_set_curlopt: {
        Args: { curlopt: string; value: string }
        Returns: boolean
      }
      invite_user_to_workspace: {
        Args: { p_workspace_id: string; p_user_id: string; p_role?: string }
        Returns: boolean
      }
      reset_user_credits: {
        Args: Record<PropertyKey, never>
        Returns: undefined
      }
      send_welcome_email: {
        Args: { subscriber_email: string }
        Returns: Json
      }
      text_to_bytea: {
        Args: { data: string }
        Returns: string
      }
      update_peer_connection: {
        Args: {
          p_user_id: string
          p_session_id: string
          p_peer_id: string
          p_status?: string
        }
        Returns: string
      }
      urlencode: {
        Args: { string: string } | { string: string } | { data: Json }
        Returns: string
      }
    }
    Enums: {
      [_ in never]: never
    }
    CompositeTypes: {
      http_header: {
        field: string | null
        value: string | null
      }
      http_request: {
        method: unknown | null
        uri: string | null
        headers: Database["public"]["CompositeTypes"]["http_header"][] | null
        content_type: string | null
        content: string | null
      }
      http_response: {
        status: number | null
        content_type: string | null
        headers: Database["public"]["CompositeTypes"]["http_header"][] | null
        content: string | null
      }
    }
  }
}

type DefaultSchema = Database[Extract<keyof Database, "public">]

export type Tables<
  DefaultSchemaTableNameOrOptions extends
    | keyof (DefaultSchema["Tables"] & DefaultSchema["Views"])
    | { schema: keyof Database },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof Database
  }
    ? keyof (Database[DefaultSchemaTableNameOrOptions["schema"]]["Tables"] &
        Database[DefaultSchemaTableNameOrOptions["schema"]]["Views"])
    : never = never,
> = DefaultSchemaTableNameOrOptions extends { schema: keyof Database }
  ? (Database[DefaultSchemaTableNameOrOptions["schema"]]["Tables"] &
      Database[DefaultSchemaTableNameOrOptions["schema"]]["Views"])[TableName] extends {
      Row: infer R
    }
    ? R
    : never
  : DefaultSchemaTableNameOrOptions extends keyof (DefaultSchema["Tables"] &
        DefaultSchema["Views"])
    ? (DefaultSchema["Tables"] &
        DefaultSchema["Views"])[DefaultSchemaTableNameOrOptions] extends {
        Row: infer R
      }
      ? R
      : never
    : never

export type TablesInsert<
  DefaultSchemaTableNameOrOptions extends
    | keyof DefaultSchema["Tables"]
    | { schema: keyof Database },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof Database
  }
    ? keyof Database[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never = never,
> = DefaultSchemaTableNameOrOptions extends { schema: keyof Database }
  ? Database[DefaultSchemaTableNameOrOptions["schema"]]["Tables"][TableName] extends {
      Insert: infer I
    }
    ? I
    : never
  : DefaultSchemaTableNameOrOptions extends keyof DefaultSchema["Tables"]
    ? DefaultSchema["Tables"][DefaultSchemaTableNameOrOptions] extends {
        Insert: infer I
      }
      ? I
      : never
    : never

export type TablesUpdate<
  DefaultSchemaTableNameOrOptions extends
    | keyof DefaultSchema["Tables"]
    | { schema: keyof Database },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof Database
  }
    ? keyof Database[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never = never,
> = DefaultSchemaTableNameOrOptions extends { schema: keyof Database }
  ? Database[DefaultSchemaTableNameOrOptions["schema"]]["Tables"][TableName] extends {
      Update: infer U
    }
    ? U
    : never
  : DefaultSchemaTableNameOrOptions extends keyof DefaultSchema["Tables"]
    ? DefaultSchema["Tables"][DefaultSchemaTableNameOrOptions] extends {
        Update: infer U
      }
      ? U
      : never
    : never

export type Enums<
  DefaultSchemaEnumNameOrOptions extends
    | keyof DefaultSchema["Enums"]
    | { schema: keyof Database },
  EnumName extends DefaultSchemaEnumNameOrOptions extends {
    schema: keyof Database
  }
    ? keyof Database[DefaultSchemaEnumNameOrOptions["schema"]]["Enums"]
    : never = never,
> = DefaultSchemaEnumNameOrOptions extends { schema: keyof Database }
  ? Database[DefaultSchemaEnumNameOrOptions["schema"]]["Enums"][EnumName]
  : DefaultSchemaEnumNameOrOptions extends keyof DefaultSchema["Enums"]
    ? DefaultSchema["Enums"][DefaultSchemaEnumNameOrOptions]
    : never

export type CompositeTypes<
  PublicCompositeTypeNameOrOptions extends
    | keyof DefaultSchema["CompositeTypes"]
    | { schema: keyof Database },
  CompositeTypeName extends PublicCompositeTypeNameOrOptions extends {
    schema: keyof Database
  }
    ? keyof Database[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"]
    : never = never,
> = PublicCompositeTypeNameOrOptions extends { schema: keyof Database }
  ? Database[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"][CompositeTypeName]
  : PublicCompositeTypeNameOrOptions extends keyof DefaultSchema["CompositeTypes"]
    ? DefaultSchema["CompositeTypes"][PublicCompositeTypeNameOrOptions]
    : never

export const Constants = {
  public: {
    Enums: {},
  },
} as const
