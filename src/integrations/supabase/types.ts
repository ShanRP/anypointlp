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
          device: string | null
          id: string
          ip_address: string | null
          user_id: string
        }
        Insert: {
          action: string
          created_at?: string
          device?: string | null
          id?: string
          ip_address?: string | null
          user_id: string
        }
        Update: {
          action?: string
          created_at?: string
          device?: string | null
          id?: string
          ip_address?: string | null
          user_id?: string
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
      apl_dataweave_tasks: {
        Row: {
          created_at: string
          generated_scripts: Json
          id: string
          input_format: string
          input_samples: Json
          notes: string | null
          output_samples: Json
          task_id: string
          task_name: string
          user_id: string
          workspace_id: string
        }
        Insert: {
          created_at?: string
          generated_scripts: Json
          id?: string
          input_format: string
          input_samples: Json
          notes?: string | null
          output_samples: Json
          task_id: string
          task_name: string
          user_id: string
          workspace_id: string
        }
        Update: {
          created_at?: string
          generated_scripts?: Json
          id?: string
          input_format?: string
          input_samples?: Json
          notes?: string | null
          output_samples?: Json
          task_id?: string
          task_name?: string
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
          content: Json
          created_at: string
          description: string | null
          downloads: number | null
          id: string
          likes: number | null
          title: string
          type: string
          updated_at: string
          user_id: string
          username: string | null
        }
        Insert: {
          content: Json
          created_at?: string
          description?: string | null
          downloads?: number | null
          id?: string
          likes?: number | null
          title: string
          type: string
          updated_at?: string
          user_id: string
          username?: string | null
        }
        Update: {
          content?: Json
          created_at?: string
          description?: string | null
          downloads?: number | null
          id?: string
          likes?: number | null
          title?: string
          type?: string
          updated_at?: string
          user_id?: string
          username?: string | null
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
      apl_peer_connections: {
        Row: {
          created_at: string
          id: string
          peer_id: string
          status: string
          updated_at: string
          user_id: string
          username: string
        }
        Insert: {
          created_at?: string
          id?: string
          peer_id: string
          status?: string
          updated_at?: string
          user_id: string
          username: string
        }
        Update: {
          created_at?: string
          id?: string
          peer_id?: string
          status?: string
          updated_at?: string
          user_id?: string
          username?: string
        }
        Relationships: []
      }
      apl_profiles: {
        Row: {
          avatar_url: string | null
          created_at: string
          id: string
          updated_at: string
        }
        Insert: {
          avatar_url?: string | null
          created_at?: string
          id: string
          updated_at?: string
        }
        Update: {
          avatar_url?: string | null
          created_at?: string
          id?: string
          updated_at?: string
        }
        Relationships: []
      }
      apl_user_sessions: {
        Row: {
          created_at: string
          device_info: string | null
          id: string
          last_active: string
          session_id: string
          user_id: string
        }
        Insert: {
          created_at?: string
          device_info?: string | null
          id?: string
          last_active?: string
          session_id: string
          user_id: string
        }
        Update: {
          created_at?: string
          device_info?: string | null
          id?: string
          last_active?: string
          session_id?: string
          user_id?: string
        }
        Relationships: []
      }
      apl_workspaces: {
        Row: {
          created_at: string
          id: string
          initial: string
          invite_enabled: boolean
          invite_link: string | null
          name: string
          session_timeout: string
          updated_at: string
          user_id: string
        }
        Insert: {
          created_at?: string
          id?: string
          initial: string
          invite_enabled?: boolean
          invite_link?: string | null
          name: string
          session_timeout?: string
          updated_at?: string
          user_id: string
        }
        Update: {
          created_at?: string
          id?: string
          initial?: string
          invite_enabled?: boolean
          invite_link?: string | null
          name?: string
          session_timeout?: string
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
      apl_get_task_details: {
        Args: {
          task_id_param: string
        }
        Returns: {
          id: string
          task_id: string
          task_name: string
          input_format: string
          input_samples: Json
          output_samples: Json
          notes: string
          generated_scripts: Json
          created_at: string
        }[]
      }
      apl_get_user_sessions: {
        Args: {
          user_id_param: string
        }
        Returns: Json[]
      }
      apl_get_user_workspaces: {
        Args: {
          user_id_param: string
        }
        Returns: {
          id: string
          name: string
          initial: string
          session_timeout: string
          invite_enabled: boolean
          invite_link: string
          created_at: string
        }[]
      }
      apl_get_workspace_tasks: {
        Args: {
          workspace_id_param: string
        }
        Returns: {
          id: string
          task_id: string
          task_name: string
          created_at: string
        }[]
      }
      apl_increment_exchange_counter: {
        Args: {
          item_id_param: string
          counter_name: string
        }
        Returns: undefined
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
      apl_upsert_peer_connection: {
        Args: {
          p_user_id: string
          p_peer_id: string
          p_username: string
          p_status?: string
        }
        Returns: string
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

type PublicSchema = Database[Extract<keyof Database, "public">]

export type Tables<
  PublicTableNameOrOptions extends
    | keyof (PublicSchema["Tables"] & PublicSchema["Views"])
    | { schema: keyof Database },
  TableName extends PublicTableNameOrOptions extends { schema: keyof Database }
    ? keyof (Database[PublicTableNameOrOptions["schema"]]["Tables"] &
        Database[PublicTableNameOrOptions["schema"]]["Views"])
    : never = never,
> = PublicTableNameOrOptions extends { schema: keyof Database }
  ? (Database[PublicTableNameOrOptions["schema"]]["Tables"] &
      Database[PublicTableNameOrOptions["schema"]]["Views"])[TableName] extends {
      Row: infer R
    }
    ? R
    : never
  : PublicTableNameOrOptions extends keyof (PublicSchema["Tables"] &
        PublicSchema["Views"])
    ? (PublicSchema["Tables"] &
        PublicSchema["Views"])[PublicTableNameOrOptions] extends {
        Row: infer R
      }
      ? R
      : never
    : never

export type TablesInsert<
  PublicTableNameOrOptions extends
    | keyof PublicSchema["Tables"]
    | { schema: keyof Database },
  TableName extends PublicTableNameOrOptions extends { schema: keyof Database }
    ? keyof Database[PublicTableNameOrOptions["schema"]]["Tables"]
    : never = never,
> = PublicTableNameOrOptions extends { schema: keyof Database }
  ? Database[PublicTableNameOrOptions["schema"]]["Tables"][TableName] extends {
      Insert: infer I
    }
    ? I
    : never
  : PublicTableNameOrOptions extends keyof PublicSchema["Tables"]
    ? PublicSchema["Tables"][PublicTableNameOrOptions] extends {
        Insert: infer I
      }
      ? I
      : never
    : never

export type TablesUpdate<
  PublicTableNameOrOptions extends
    | keyof PublicSchema["Tables"]
    | { schema: keyof Database },
  TableName extends PublicTableNameOrOptions extends { schema: keyof Database }
    ? keyof Database[PublicTableNameOrOptions["schema"]]["Tables"]
    : never = never,
> = PublicTableNameOrOptions extends { schema: keyof Database }
  ? Database[PublicTableNameOrOptions["schema"]]["Tables"][TableName] extends {
      Update: infer U
    }
    ? U
    : never
  : PublicTableNameOrOptions extends keyof PublicSchema["Tables"]
    ? PublicSchema["Tables"][PublicTableNameOrOptions] extends {
        Update: infer U
      }
      ? U
      : never
    : never

export type Enums<
  PublicEnumNameOrOptions extends
    | keyof PublicSchema["Enums"]
    | { schema: keyof Database },
  EnumName extends PublicEnumNameOrOptions extends { schema: keyof Database }
    ? keyof Database[PublicEnumNameOrOptions["schema"]]["Enums"]
    : never = never,
> = PublicEnumNameOrOptions extends { schema: keyof Database }
  ? Database[PublicEnumNameOrOptions["schema"]]["Enums"][EnumName]
  : PublicEnumNameOrOptions extends keyof PublicSchema["Enums"]
    ? PublicSchema["Enums"][PublicEnumNameOrOptions]
    : never

export type CompositeTypes<
  PublicCompositeTypeNameOrOptions extends
    | keyof PublicSchema["CompositeTypes"]
    | { schema: keyof Database },
  CompositeTypeName extends PublicCompositeTypeNameOrOptions extends {
    schema: keyof Database
  }
    ? keyof Database[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"]
    : never = never,
> = PublicCompositeTypeNameOrOptions extends { schema: keyof Database }
  ? Database[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"][CompositeTypeName]
  : PublicCompositeTypeNameOrOptions extends keyof PublicSchema["CompositeTypes"]
    ? PublicSchema["CompositeTypes"][PublicCompositeTypeNameOrOptions]
    : never
