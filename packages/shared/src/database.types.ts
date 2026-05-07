export type Json = string | number | boolean | null | { [key: string]: Json | undefined } | Json[];

export type Database = {
  public: {
    Tables: {
      admin_users: {
        Row: { user_id: string; email: string; created_at: string };
        Insert: { user_id: string; email: string; created_at?: string };
        Update: Partial<Database["public"]["Tables"]["admin_users"]["Insert"]>;
      };
      albums: {
        Row: { id: string; title: string; subtitle: string; year: string; location: string; description: string; published: boolean; sort_order: number; created_at: string; updated_at: string };
        Insert: { id: string; title: string; subtitle?: string; year?: string; location?: string; description?: string; published?: boolean; sort_order?: number; created_at?: string; updated_at?: string };
        Update: Partial<Database["public"]["Tables"]["albums"]["Insert"]>;
      };
      album_photos: {
        Row: { id: string; album_id: string; src: string; caption: string; is_cover: boolean; sort_order: number; width: number | null; height: number | null; blur_data_url: string | null; created_at: string; updated_at: string };
        Insert: { id?: string; album_id: string; src: string; caption?: string; is_cover?: boolean; sort_order?: number; width?: number | null; height?: number | null; blur_data_url?: string | null; created_at?: string; updated_at?: string };
        Update: Partial<Database["public"]["Tables"]["album_photos"]["Insert"]>;
      };
      films: {
        Row: { id: string; title: string; subtitle: string; year: string; role: string; description: string; cover: string; published: boolean; sort_order: number; created_at: string; updated_at: string };
        Insert: { id: string; title: string; subtitle?: string; year?: string; role?: string; description?: string; cover?: string; published?: boolean; sort_order?: number; created_at?: string; updated_at?: string };
        Update: Partial<Database["public"]["Tables"]["films"]["Insert"]>;
      };
      journal_entries: {
        Row: { id: string; title: string; content: string; image: string; published: boolean; sort_order: number; created_at: string; updated_at: string };
        Insert: { id: string; title: string; content?: string; image?: string; published?: boolean; sort_order?: number; created_at?: string; updated_at?: string };
        Update: Partial<Database["public"]["Tables"]["journal_entries"]["Insert"]>;
      };
      about_page: {
        Row: { id: boolean; portrait_image: string; content: string; updated_at: string };
        Insert: { id?: boolean; portrait_image?: string; content?: string; updated_at?: string };
        Update: Partial<Database["public"]["Tables"]["about_page"]["Insert"]>;
      };
      about_sections: {
        Row: { id: string; title: string; body: string; sort_order: number; created_at: string; updated_at: string };
        Insert: { id?: string; title: string; body?: string; sort_order?: number; created_at?: string; updated_at?: string };
        Update: Partial<Database["public"]["Tables"]["about_sections"]["Insert"]>;
      };
    };
    Functions: {
      reorder_album_photos: {
        Args: { p_photo_ids: string[] };
        Returns: Database["public"]["Tables"]["album_photos"]["Row"][];
      };
      reorder_content_items: {
        Args: { p_table: string; p_ids: string[] };
        Returns: undefined;
      };
      set_album_cover: {
        Args: { p_album_id: string; p_photo_id: string };
        Returns: undefined;
      };
      sync_about_sections: {
        Args: { p_sections: Json };
        Returns: Database["public"]["Tables"]["about_sections"]["Row"][];
      };
    };
  };
};

