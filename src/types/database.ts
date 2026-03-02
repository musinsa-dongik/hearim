export type Database = {
  public: {
    Tables: {
      profiles: {
        Row: {
          id: string;
          name: string;
          email: string | null;
          avatar_url: string | null;
          created_at: string;
        };
        Insert: {
          id: string;
          name: string;
          email?: string | null;
          avatar_url?: string | null;
          created_at?: string;
        };
        Update: {
          id?: string;
          name?: string;
          email?: string | null;
          avatar_url?: string | null;
          created_at?: string;
        };
      };
      dailies: {
        Row: {
          id: string;
          author_id: string;
          title: string;
          date: string;
          content: string;
          summary: string | null;
          status: "draft" | "published";
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          author_id: string;
          title: string;
          date: string;
          content: string;
          summary?: string | null;
          status?: "draft" | "published";
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          author_id?: string;
          title?: string;
          date?: string;
          content?: string;
          summary?: string | null;
          status?: "draft" | "published";
          created_at?: string;
          updated_at?: string;
        };
      };
      weeklies: {
        Row: {
          id: string;
          title: string;
          week_number: number;
          week_start: string;
          week_end: string;
          content: string;
          summary: string | null;
          daily_count: number;
          contributors: string[];
          status: "draft" | "published";
          created_at: string;
        };
        Insert: {
          id?: string;
          title: string;
          week_number: number;
          week_start: string;
          week_end: string;
          content: string;
          summary?: string | null;
          daily_count?: number;
          contributors?: string[];
          status?: "draft" | "published";
          created_at?: string;
        };
        Update: {
          id?: string;
          title?: string;
          week_number?: number;
          week_start?: string;
          week_end?: string;
          content?: string;
          summary?: string | null;
          daily_count?: number;
          contributors?: string[];
          status?: "draft" | "published";
          created_at?: string;
        };
      };
      allowed_emails: {
        Row: {
          email: string;
        };
        Insert: {
          email: string;
        };
        Update: {
          email?: string;
        };
      };
    };
  };
};
