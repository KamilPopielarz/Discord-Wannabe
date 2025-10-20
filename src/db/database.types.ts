export type Json = string | number | boolean | null | { [key: string]: Json | undefined } | Json[];

export interface Database {
  graphql_public: {
    Tables: Record<never, never>;
    Views: Record<never, never>;
    Functions: {
      graphql: {
        Args: {
          extensions?: Json;
          operationName?: string;
          query?: string;
          variables?: Json;
        };
        Returns: Json;
      };
    };
    Enums: Record<never, never>;
    CompositeTypes: Record<never, never>;
  };
  public: {
    Tables: {
      audit_logs: {
        Row: {
          action: string;
          actor_id: string;
          created_at: string;
          id: number;
          metadata: Json | null;
          target_id: string;
          target_type: string;
        };
        Insert: {
          action: string;
          actor_id: string;
          created_at?: string;
          id?: number;
          metadata?: Json | null;
          target_id: string;
          target_type: string;
        };
        Update: {
          action?: string;
          actor_id?: string;
          created_at?: string;
          id?: number;
          metadata?: Json | null;
          target_id?: string;
          target_type?: string;
        };
        Relationships: [];
      };
      auth_sessions: {
        Row: {
          access_token: string;
          created_at: string;
          expires_at: string;
          refresh_token: string;
          session_id: string;
          user_id: string;
          username: string | null;
        };
        Insert: {
          access_token: string;
          created_at?: string;
          expires_at: string;
          refresh_token: string;
          session_id?: string;
          user_id: string;
          username?: string | null;
        };
        Update: {
          access_token?: string;
          created_at?: string;
          expires_at?: string;
          refresh_token?: string;
          session_id?: string;
          user_id?: string;
          username?: string | null;
        };
        Relationships: [];
      };
      email_confirmations: {
        Row: {
          created_at: string;
          expires_at: string;
          id: string;
          token: string;
          used: boolean;
          user_id: string;
        };
        Insert: {
          created_at?: string;
          expires_at: string;
          id?: string;
          token: string;
          used?: boolean;
          user_id: string;
        };
        Update: {
          created_at?: string;
          expires_at?: string;
          id?: string;
          token?: string;
          used?: boolean;
          user_id?: string;
        };
        Relationships: [];
      };
      invitation_links: {
        Row: {
          created_at: string;
          expires_at: string | null;
          id: string;
          link: string;
          max_uses: number | null;
          revoked: boolean;
          room_id: string | null;
          server_id: string | null;
          uses: number;
        };
        Insert: {
          created_at?: string;
          expires_at?: string | null;
          id?: string;
          link: string;
          max_uses?: number | null;
          revoked?: boolean;
          room_id?: string | null;
          server_id?: string | null;
          uses?: number;
        };
        Update: {
          created_at?: string;
          expires_at?: string | null;
          id?: string;
          link?: string;
          max_uses?: number | null;
          revoked?: boolean;
          room_id?: string | null;
          server_id?: string | null;
          uses?: number;
        };
        Relationships: [
          {
            foreignKeyName: "invitation_links_room_id_fkey";
            columns: ["room_id"];
            isOneToOne: false;
            referencedRelation: "rooms";
            referencedColumns: ["id"];
          },
          {
            foreignKeyName: "invitation_links_server_id_fkey";
            columns: ["server_id"];
            isOneToOne: false;
            referencedRelation: "servers";
            referencedColumns: ["id"];
          },
        ];
      };
      messages: {
        Row: {
          content: string;
          created_at: string;
          id: number;
          metadata: Json | null;
          room_id: string;
          session_id: string | null;
          user_id: string | null;
        };
        Insert: {
          content: string;
          created_at?: string;
          id?: number;
          metadata?: Json | null;
          room_id: string;
          session_id?: string | null;
          user_id?: string | null;
        };
        Update: {
          content?: string;
          created_at?: string;
          id?: number;
          metadata?: Json | null;
          room_id?: string;
          session_id?: string | null;
          user_id?: string | null;
        };
        Relationships: [
          {
            foreignKeyName: "messages_room_id_fkey";
            columns: ["room_id"];
            isOneToOne: false;
            referencedRelation: "rooms";
            referencedColumns: ["id"];
          },
          {
            foreignKeyName: "messages_session_id_fkey";
            columns: ["session_id"];
            isOneToOne: false;
            referencedRelation: "sessions";
            referencedColumns: ["session_id"];
          },
        ];
      };
      password_resets: {
        Row: {
          created_at: string;
          expires_at: string;
          id: string;
          token: string;
          used: boolean;
          user_id: string;
        };
        Insert: {
          created_at?: string;
          expires_at: string;
          id?: string;
          token: string;
          used?: boolean;
          user_id: string;
        };
        Update: {
          created_at?: string;
          expires_at?: string;
          id?: string;
          token?: string;
          used?: boolean;
          user_id?: string;
        };
        Relationships: [];
      };
      rate_limits: {
        Row: {
          count: number;
          entity_id: string;
          entity_type: string;
          window_start: string;
        };
        Insert: {
          count?: number;
          entity_id: string;
          entity_type: string;
          window_start: string;
        };
        Update: {
          count?: number;
          entity_id?: string;
          entity_type?: string;
          window_start?: string;
        };
        Relationships: [];
      };
      room_password_attempts: {
        Row: {
          attempts: number;
          blocked_until: string | null;
          id: number;
          ip_address: unknown;
          room_id: string;
        };
        Insert: {
          attempts?: number;
          blocked_until?: string | null;
          id?: number;
          ip_address: unknown;
          room_id: string;
        };
        Update: {
          attempts?: number;
          blocked_until?: string | null;
          id?: number;
          ip_address?: unknown;
          room_id?: string;
        };
        Relationships: [
          {
            foreignKeyName: "room_password_attempts_room_id_fkey";
            columns: ["room_id"];
            isOneToOne: false;
            referencedRelation: "rooms";
            referencedColumns: ["id"];
          },
        ];
      };
      rooms: {
        Row: {
          created_at: string;
          id: string;
          invite_link: string;
          is_permanent: boolean;
          last_activity: string;
          name: string;
          password_hash: string | null;
          server_id: string;
        };
        Insert: {
          created_at?: string;
          id?: string;
          invite_link: string;
          is_permanent?: boolean;
          last_activity?: string;
          name: string;
          password_hash?: string | null;
          server_id: string;
        };
        Update: {
          created_at?: string;
          id?: string;
          invite_link?: string;
          is_permanent?: boolean;
          last_activity?: string;
          name?: string;
          password_hash?: string | null;
          server_id?: string;
        };
        Relationships: [
          {
            foreignKeyName: "rooms_server_id_fkey";
            columns: ["server_id"];
            isOneToOne: false;
            referencedRelation: "servers";
            referencedColumns: ["id"];
          },
        ];
      };
      servers: {
        Row: {
          created_at: string;
          id: string;
          invite_link: string;
          last_activity: string;
        };
        Insert: {
          created_at?: string;
          id?: string;
          invite_link: string;
          last_activity?: string;
        };
        Update: {
          created_at?: string;
          id?: string;
          invite_link?: string;
          last_activity?: string;
        };
        Relationships: [];
      };
      sessions: {
        Row: {
          created_at: string;
          expires_at: string;
          guest_nick: string | null;
          session_id: string;
          user_id: string | null;
        };
        Insert: {
          created_at?: string;
          expires_at: string;
          guest_nick?: string | null;
          session_id?: string;
          user_id?: string | null;
        };
        Update: {
          created_at?: string;
          expires_at?: string;
          guest_nick?: string | null;
          session_id?: string;
          user_id?: string | null;
        };
        Relationships: [];
      };
      user_room: {
        Row: {
          role: string;
          room_id: string;
          user_id: string;
        };
        Insert: {
          role: string;
          room_id: string;
          user_id: string;
        };
        Update: {
          role?: string;
          room_id?: string;
          user_id?: string;
        };
        Relationships: [
          {
            foreignKeyName: "user_room_room_id_fkey";
            columns: ["room_id"];
            isOneToOne: false;
            referencedRelation: "rooms";
            referencedColumns: ["id"];
          },
        ];
      };
      user_server: {
        Row: {
          role: string;
          server_id: string;
          user_id: string;
        };
        Insert: {
          role: string;
          server_id: string;
          user_id: string;
        };
        Update: {
          role?: string;
          server_id?: string;
          user_id?: string;
        };
        Relationships: [
          {
            foreignKeyName: "user_server_server_id_fkey";
            columns: ["server_id"];
            isOneToOne: false;
            referencedRelation: "servers";
            referencedColumns: ["id"];
          },
        ];
      };
    };
    Views: Record<never, never>;
    Functions: Record<never, never>;
    Enums: Record<never, never>;
    CompositeTypes: Record<never, never>;
  };
}

type DatabaseWithoutInternals = Omit<Database, "__InternalSupabase">;

type DefaultSchema = DatabaseWithoutInternals[Extract<keyof Database, "public">];

export type Tables<
  DefaultSchemaTableNameOrOptions extends
    | keyof (DefaultSchema["Tables"] & DefaultSchema["Views"])
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals;
  }
    ? keyof (DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"] &
        DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Views"])
    : never = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals;
}
  ? (DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"] &
      DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Views"])[TableName] extends {
      Row: infer R;
    }
    ? R
    : never
  : DefaultSchemaTableNameOrOptions extends keyof (DefaultSchema["Tables"] & DefaultSchema["Views"])
    ? (DefaultSchema["Tables"] & DefaultSchema["Views"])[DefaultSchemaTableNameOrOptions] extends {
        Row: infer R;
      }
      ? R
      : never
    : never;

export type TablesInsert<
  DefaultSchemaTableNameOrOptions extends keyof DefaultSchema["Tables"] | { schema: keyof DatabaseWithoutInternals },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals;
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals;
}
  ? DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"][TableName] extends {
      Insert: infer I;
    }
    ? I
    : never
  : DefaultSchemaTableNameOrOptions extends keyof DefaultSchema["Tables"]
    ? DefaultSchema["Tables"][DefaultSchemaTableNameOrOptions] extends {
        Insert: infer I;
      }
      ? I
      : never
    : never;

export type TablesUpdate<
  DefaultSchemaTableNameOrOptions extends keyof DefaultSchema["Tables"] | { schema: keyof DatabaseWithoutInternals },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals;
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals;
}
  ? DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"][TableName] extends {
      Update: infer U;
    }
    ? U
    : never
  : DefaultSchemaTableNameOrOptions extends keyof DefaultSchema["Tables"]
    ? DefaultSchema["Tables"][DefaultSchemaTableNameOrOptions] extends {
        Update: infer U;
      }
      ? U
      : never
    : never;

export type Enums<
  DefaultSchemaEnumNameOrOptions extends keyof DefaultSchema["Enums"] | { schema: keyof DatabaseWithoutInternals },
  EnumName extends DefaultSchemaEnumNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals;
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaEnumNameOrOptions["schema"]]["Enums"]
    : never = never,
> = DefaultSchemaEnumNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals;
}
  ? DatabaseWithoutInternals[DefaultSchemaEnumNameOrOptions["schema"]]["Enums"][EnumName]
  : DefaultSchemaEnumNameOrOptions extends keyof DefaultSchema["Enums"]
    ? DefaultSchema["Enums"][DefaultSchemaEnumNameOrOptions]
    : never;

export type CompositeTypes<
  PublicCompositeTypeNameOrOptions extends
    | keyof DefaultSchema["CompositeTypes"]
    | { schema: keyof DatabaseWithoutInternals },
  CompositeTypeName extends PublicCompositeTypeNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals;
  }
    ? keyof DatabaseWithoutInternals[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"]
    : never = never,
> = PublicCompositeTypeNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals;
}
  ? DatabaseWithoutInternals[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"][CompositeTypeName]
  : PublicCompositeTypeNameOrOptions extends keyof DefaultSchema["CompositeTypes"]
    ? DefaultSchema["CompositeTypes"][PublicCompositeTypeNameOrOptions]
    : never;

export const Constants = {
  graphql_public: {
    Enums: {},
  },
  public: {
    Enums: {},
  },
} as const;
