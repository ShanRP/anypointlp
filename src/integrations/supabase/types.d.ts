
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
      apl_auth_logs: {
        Row: {
          id: string
          user_id: string
          action: string
          device: string
          created_at: string
        }
        Insert: {
          id?: string
          user_id: string
          action: string
          device: string
          created_at?: string
        }
        Update: {
          id?: string
          user_id?: string
          action?: string
          device?: string
          created_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "apl_auth_logs_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "users"
            referencedColumns: ["id"]
          }
        ]
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
        Relationships: [
          {
            foreignKeyName: "apl_coding_assistant_sessions_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "users"
            referencedColumns: ["id"]
          }
        ]
      }
      apl_dataweave_tasks: {
        Row: {
          id: string
          task_id: string | null
          task_name: string | null
          username: string | null
          user_id: string | null
          workspace_id: string | null
          description: string | null
          input_format: string | null
          input_samples: Json | null
          output_samples: Json | null
          notes: string | null
          generated_scripts: Json | null
          category: string | null
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          task_id?: string | null
          task_name?: string | null
          username?: string | null
          user_id?: string | null
          workspace_id?: string | null
          description?: string | null
          input_format?: string | null
          input_samples?: Json | null
          output_samples?: Json | null
          notes?: string | null
          generated_scripts?: Json | null
          category?: string | null
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          task_id?: string | null
          task_name?: string | null
          username?: string | null
          user_id?: string | null
          workspace_id?: string | null
          description?: string | null
          input_format?: string | null
          input_samples?: Json | null
          output_samples?: Json | null
          notes?: string | null
          generated_scripts?: Json | null
          category?: string | null
          created_at?: string
          updated_at?: string
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
      apl_diagram_tasks: {
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
          diagram_type: string
          content: Json
          image_url: string | null
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
          diagram_type: string
          content: Json
          image_url?: string | null
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
          diagram_type?: string
          content?: Json
          image_url?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "apl_diagram_tasks_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "users"
            referencedColumns: ["id"]
          }
        ]
      }
      apl_document_tasks: {
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
          document_type: string
          content: string
          source_content: string | null
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
          document_type: string
          content: string
          source_content?: string | null
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
          document_type?: string
          content?: string
          source_content?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "apl_document_tasks_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "users"
            referencedColumns: ["id"]
          }
        ]
      }
      apl_exchange_comments: {
        Row: {
          id: string
          item_id: string
          user_id: string
          username: string | null
          comment: string
          created_at: string
        }
        Insert: {
          id?: string
          item_id: string
          user_id: string
          username?: string | null
          comment: string
          created_at?: string
        }
        Update: {
          id?: string
          item_id?: string
          user_id?: string
          username?: string | null
          comment?: string
          created_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "apl_exchange_comments_item_id_fkey"
            columns: ["item_id"]
            isOneToOne: false
            referencedRelation: "apl_exchange_items"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "apl_exchange_comments_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "users"
            referencedColumns: ["id"]
          }
        ]
      }
      apl_exchange_items: {
        Row: {
          id: string
          title: string
          description: string | null
          content: Json | null
          type: string
          user_id: string
          username: string | null
          visibility: string
          workspace_id: string | null
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          title: string
          description?: string | null
          content?: Json | null
          type: string
          user_id: string
          username?: string | null
          visibility?: string
          workspace_id?: string | null
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          title?: string
          description?: string | null
          content?: Json | null
          type?: string
          user_id?: string
          username?: string | null
          visibility?: string
          workspace_id?: string | null
          created_at?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "apl_exchange_items_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "users"
            referencedColumns: ["id"]
          }
        ]
      }
      apl_exchange_likes: {
        Row: {
          id: string
          item_id: string
          user_id: string
          created_at: string
        }
        Insert: {
          id?: string
          item_id: string
          user_id: string
          created_at?: string
        }
        Update: {
          id?: string
          item_id?: string
          user_id?: string
          created_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "apl_exchange_likes_item_id_fkey"
            columns: ["item_id"]
            isOneToOne: false
            referencedRelation: "apl_exchange_items"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "apl_exchange_likes_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "users"
            referencedColumns: ["id"]
          }
        ]
      }
      apl_integration_tasks: {
        Row: {
          id: string
          task_id: string | null
          task_name: string | null
          description: string | null
          user_id: string | null
          workspace_id: string | null
          created_at: string
          updated_at: string
          category: string | null
          runtime: string | null
          raml_content: string | null
          generated_code: string | null
          flow_summary: string | null
          flow_implementation: string | null
          flow_constants: string | null
          pom_dependencies: string | null
          compilation_check: string | null
          diagrams: Json | null
        }
        Insert: {
          id?: string
          task_id?: string | null
          task_name?: string | null
          description?: string | null
          user_id?: string | null
          workspace_id?: string | null
          created_at?: string
          updated_at?: string
          category?: string | null
          runtime?: string | null
          raml_content?: string | null
          generated_code?: string | null
          flow_summary?: string | null
          flow_implementation?: string | null
          flow_constants?: string | null
          pom_dependencies?: string | null
          compilation_check?: string | null
          diagrams?: Json | null
        }
        Update: {
          id?: string
          task_id?: string | null
          task_name?: string | null
          description?: string | null
          user_id?: string | null
          workspace_id?: string | null
          created_at?: string
          updated_at?: string
          category?: string | null
          runtime?: string | null
          raml_content?: string | null
          generated_code?: string | null
          flow_summary?: string | null
          flow_implementation?: string | null
          flow_constants?: string | null
          pom_dependencies?: string | null
          compilation_check?: string | null
          diagrams?: Json | null
        }
        Relationships: [
          {
            foreignKeyName: "apl_integration_tasks_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "users"
            referencedColumns: ["id"]
          }
        ]
      }
      apl_job_comments: {
        Row: {
          id: string
          job_id: string
          user_id: string
          comment: string
          created_at: string
        }
        Insert: {
          id?: string
          job_id: string
          user_id: string
          comment: string
          created_at?: string
        }
        Update: {
          id?: string
          job_id?: string
          user_id?: string
          comment?: string
          created_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "apl_job_comments_job_id_fkey"
            columns: ["job_id"]
            isOneToOne: false
            referencedRelation: "apl_job_posts"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "apl_job_comments_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "users"
            referencedColumns: ["id"]
          }
        ]
      }
      apl_job_posts: {
        Row: {
          id: string
          title: string
          description: string
          requirements: string
          location: string
          salary_range: string | null
          job_type: string
          user_id: string
          company_name: string
          contact_email: string
          created_at: string
          is_active: boolean
        }
        Insert: {
          id?: string
          title: string
          description: string
          requirements: string
          location: string
          salary_range?: string | null
          job_type: string
          user_id: string
          company_name: string
          contact_email: string
          created_at?: string
          is_active?: boolean
        }
        Update: {
          id?: string
          title?: string
          description?: string
          requirements?: string
          location?: string
          salary_range?: string | null
          job_type?: string
          user_id?: string
          company_name?: string
          contact_email?: string
          created_at?: string
          is_active?: boolean
        }
        Relationships: [
          {
            foreignKeyName: "apl_job_posts_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "users"
            referencedColumns: ["id"]
          }
        ]
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
          id: string
          created_at: string
          last_email_sent: string | null
          email: string
          status: string
        }
        Insert: {
          id?: string
          created_at?: string
          last_email_sent?: string | null
          email: string
          status?: string
        }
        Update: {
          id?: string
          created_at?: string
          last_email_sent?: string | null
          email?: string
          status?: string
        }
        Relationships: []
      }
      apl_peer_connections: {
        Row: {
          id: string
          user_id: string
          peer_id: string
          connection_data: Json | null
          created_at: string
          updated_at: string
          is_active: boolean
        }
        Insert: {
          id?: string
          user_id: string
          peer_id: string
          connection_data?: Json | null
          created_at?: string
          updated_at?: string
          is_active?: boolean
        }
        Update: {
          id?: string
          user_id?: string
          peer_id?: string
          connection_data?: Json | null
          created_at?: string
          updated_at?: string
          is_active?: boolean
        }
        Relationships: [
          {
            foreignKeyName: "apl_peer_connections_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "users"
            referencedColumns: ["id"]
          }
        ]
      }
      apl_profiles: {
        Row: {
          id: string
          user_id: string
          username: string | null
          full_name: string | null
          avatar_url: string | null
          title: string | null
          company: string | null
          bio: string | null
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          user_id: string
          username?: string | null
          full_name?: string | null
          avatar_url?: string | null
          title?: string | null
          company?: string | null
          bio?: string | null
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          user_id?: string
          username?: string | null
          full_name?: string | null
          avatar_url?: string | null
          title?: string | null
          company?: string | null
          bio?: string | null
          created_at?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "apl_profiles_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: true
            referencedRelation: "users"
            referencedColumns: ["id"]
          }
        ]
      }
      apl_raml_tasks: {
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
          raml_content: string
          api_name: string
          api_version: string
          base_uri: string
          endpoints: Json | null
          documentation: string
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
          raml_content?: string
          api_name?: string
          api_version?: string
          base_uri?: string
          endpoints?: Json | null
          documentation?: string
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
          raml_content?: string
          api_name?: string
          api_version?: string
          base_uri?: string
          endpoints?: Json | null
          documentation?: string
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
          source_format?: string
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
      apl_user_credits: {
        Row: {
          id: string
          user_id: string
          credits_used: number
          credits_limit: number
          reset_date: string
          is_pro: boolean
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          user_id: string
          credits_used?: number
          credits_limit?: number
          reset_date?: string
          is_pro?: boolean
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          user_id?: string
          credits_used?: number
          credits_limit?: number
          reset_date?: string
          is_pro?: boolean
          created_at?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "apl_user_credits_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: true
            referencedRelation: "users"
            referencedColumns: ["id"]
          }
        ]
      }
      apl_user_sessions: {
        Row: {
          id: string
          user_id: string
          session_id: string
          ip_address: string
          user_agent: string
          created_at: string
          last_active: string
          is_active: boolean
        }
        Insert: {
          id?: string
          user_id: string
          session_id: string
          ip_address: string
          user_agent: string
          created_at?: string
          last_active?: string
          is_active?: boolean
        }
        Update: {
          id?: string
          user_id?: string
          session_id?: string
          ip_address?: string
          user_agent?: string
          created_at?: string
          last_active?: string
          is_active?: boolean
        }
        Relationships: [
          {
            foreignKeyName: "apl_user_sessions_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "users"
            referencedColumns: ["id"]
          }
        ]
      }
      apl_workspace_invitations: {
        Row: {
          id: string
          workspace_id: string
          email: string
          status: string
          created_at: string
          created_by: string
          accepted_at: string | null
          accepted_by: string | null
        }
        Insert: {
          id?: string
          workspace_id: string
          email: string
          status?: string
          created_at?: string
          created_by: string
          accepted_at?: string | null
          accepted_by?: string | null
        }
        Update: {
          id?: string
          workspace_id?: string
          email?: string
          status?: string
          created_at?: string
          created_by?: string
          accepted_at?: string | null
          accepted_by?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "apl_workspace_invitations_accepted_by_fkey"
            columns: ["accepted_by"]
            isOneToOne: false
            referencedRelation: "users"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "apl_workspace_invitations_created_by_fkey"
            columns: ["created_by"]
            isOneToOne: false
            referencedRelation: "users"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "apl_workspace_invitations_workspace_id_fkey"
            columns: ["workspace_id"]
            isOneToOne: false
            referencedRelation: "apl_workspaces"
            referencedColumns: ["id"]
          }
        ]
      }
      apl_workspace_members: {
        Row: {
          id: string
          workspace_id: string
          user_id: string
          role: string
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          workspace_id: string
          user_id: string
          role?: string
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          workspace_id?: string
          user_id?: string
          role?: string
          created_at?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "apl_workspace_members_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "users"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "apl_workspace_members_workspace_id_fkey"
            columns: ["workspace_id"]
            isOneToOne: false
            referencedRelation: "apl_workspaces"
            referencedColumns: ["id"]
          }
        ]
      }
      apl_workspaces: {
        Row: {
          id: string
          user_id: string
          name: string
          initial: string | null
          session_timeout: string | null
          invite_enabled: boolean | null
          is_invited_workspace: boolean | null
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          user_id: string
          name: string
          initial?: string | null
          session_timeout?: string | null
          invite_enabled?: boolean | null
          is_invited_workspace?: boolean | null
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          user_id?: string
          name?: string
          initial?: string | null
          session_timeout?: string | null
          invite_enabled?: boolean | null
          is_invited_workspace?: boolean | null
          created_at?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "apl_workspaces_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "users"
            referencedColumns: ["id"]
          }
        ]
      }
    },
    Views: {
      [_ in never]: never
    },
    Functions: {
      apl_get_munit_task_details: {
        Args: {
          task_id_param: string
        },
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
      apl_get_munit_tasks: {
        Args: {
          workspace_id_param: string
        },
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
      apl_get_raml_task_details: {
        Args: {
          task_id_param: string
        },
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
          endpoints: Json | null
          documentation: string
        }[]
      },
      apl_get_raml_tasks: {
        Args: {
          workspace_id_param: string
        },
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
          endpoints: Json | null
          documentation: string
        }[]
      },
      apl_get_sample_data_task_details: {
        Args: {
          task_id_param: string
        },
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
      apl_get_sample_data_tasks: {
        Args: {
          workspace_id_param: string
        },
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
      apl_get_user_workspaces: {
        Args: {
          user_id_param: string
        },
        Returns: {
          id: string
          name: string
          initial: string
          session_timeout: string
          invite_enabled: boolean
          is_invited_workspace: boolean
          created_at: string
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
      },
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
        },
        Returns: string
      }
    },
    Enums: {
      [_ in never]: never
    },
    CompositeTypes: {
      [_ in never]: never
    }
  }
}

export type Tables<T extends keyof Database['public']['Tables']> = Database['public']['Tables'][T]['Row']
export type TablesInsert<T extends keyof Database['public']['Tables']> = Database['public']['Tables'][T]['Insert']
export type TablesUpdate<T extends keyof Database['public']['Tables']> = Database['public']['Tables'][T]['Update']
export type Functions<T extends keyof Database['public']['Functions']> = Database['public']['Functions'][T]
