
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
    };
  };
}
