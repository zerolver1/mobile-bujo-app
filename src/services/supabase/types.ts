// Generated types for Supabase database schema
// Following BuJo methodology

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
      profiles: {
        Row: {
          id: string
          username: string | null
          full_name: string | null
          avatar_url: string | null
          bullet_style: 'classic' | 'modern' | 'handwritten'
          paper_texture: 'dot' | 'grid' | 'lined' | 'blank'
          theme_preference: 'light' | 'dark' | 'auto'
          auto_sync: boolean
          sync_reminders: boolean
          sync_calendar: boolean
          haptic_feedback: boolean
          daily_notifications: boolean
          created_at: string
          updated_at: string
          last_sync_at: string | null
          subscription_tier: 'free' | 'pro' | 'premium'
        }
        Insert: {
          id: string
          username?: string | null
          full_name?: string | null
          avatar_url?: string | null
          bullet_style?: 'classic' | 'modern' | 'handwritten'
          paper_texture?: 'dot' | 'grid' | 'lined' | 'blank'
          theme_preference?: 'light' | 'dark' | 'auto'
          auto_sync?: boolean
          sync_reminders?: boolean
          sync_calendar?: boolean
          haptic_feedback?: boolean
          daily_notifications?: boolean
          subscription_tier?: 'free' | 'pro' | 'premium'
        }
        Update: {
          username?: string | null
          full_name?: string | null
          avatar_url?: string | null
          bullet_style?: 'classic' | 'modern' | 'handwritten'
          paper_texture?: 'dot' | 'grid' | 'lined' | 'blank'
          theme_preference?: 'light' | 'dark' | 'auto'
          auto_sync?: boolean
          sync_reminders?: boolean
          sync_calendar?: boolean
          haptic_feedback?: boolean
          daily_notifications?: boolean
          last_sync_at?: string | null
          subscription_tier?: 'free' | 'pro' | 'premium'
        }
      }
      collections: {
        Row: {
          id: string
          user_id: string
          type: 'daily' | 'monthly' | 'future' | 'custom'
          collection_date: string
          name: string | null
          description: string | null
          color: string | null
          icon: string | null
          smart_match: boolean
          is_archived: boolean
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          user_id: string
          type: 'daily' | 'monthly' | 'future' | 'custom'
          collection_date: string
          name?: string | null
          description?: string | null
          color?: string | null
          icon?: string | null
          smart_match?: boolean
          is_archived?: boolean
        }
        Update: {
          type?: 'daily' | 'monthly' | 'future' | 'custom'
          collection_date?: string
          name?: string | null
          description?: string | null
          color?: string | null
          icon?: string | null
          smart_match?: boolean
          is_archived?: boolean
        }
      }
      entries: {
        Row: {
          id: string
          user_id: string
          collection_id: string | null
          type: 'task' | 'event' | 'note' | 'idea' | 'research' | 'memory' | 'custom'
          content: string
          status: 'incomplete' | 'complete' | 'migrated' | 'scheduled' | 'cancelled' | 'irrelevant'
          priority: 'none' | 'low' | 'medium' | 'high'
          is_priority: boolean
          created_at: string
          updated_at: string
          collection_date: string
          due_date: string | null
          scheduled_date: string | null
          completed_at: string | null
          page_number: number | null
          line_number: number | null
          indent_level: number
          parent_entry_id: string | null
          source: 'manual' | 'scan' | 'import' | 'api' | 'migration' | null
          ocr_confidence: number | null
        }
        Insert: {
          id?: string
          user_id: string
          collection_id?: string | null
          type: 'task' | 'event' | 'note' | 'idea' | 'research' | 'memory' | 'custom'
          content: string
          status?: 'incomplete' | 'complete' | 'migrated' | 'scheduled' | 'cancelled' | 'irrelevant'
          priority?: 'none' | 'low' | 'medium' | 'high'
          is_priority?: boolean
          collection_date: string
          due_date?: string | null
          scheduled_date?: string | null
          completed_at?: string | null
          page_number?: number | null
          line_number?: number | null
          indent_level?: number
          parent_entry_id?: string | null
          source?: 'manual' | 'scan' | 'import' | 'api' | 'migration' | null
          ocr_confidence?: number | null
        }
        Update: {
          collection_id?: string | null
          type?: 'task' | 'event' | 'note' | 'idea' | 'research' | 'memory' | 'custom'
          content?: string
          status?: 'incomplete' | 'complete' | 'migrated' | 'scheduled' | 'cancelled' | 'irrelevant'
          priority?: 'none' | 'low' | 'medium' | 'high'
          is_priority?: boolean
          collection_date?: string
          due_date?: string | null
          scheduled_date?: string | null
          completed_at?: string | null
          page_number?: number | null
          line_number?: number | null
          indent_level?: number
          parent_entry_id?: string | null
          source?: 'manual' | 'scan' | 'import' | 'api' | 'migration' | null
          ocr_confidence?: number | null
        }
      }
      tags: {
        Row: {
          id: string
          user_id: string
          name: string
          type: 'tag' | 'context'
          color: string | null
          description: string | null
          usage_count: number
          created_at: string
        }
        Insert: {
          id?: string
          user_id: string
          name: string
          type?: 'tag' | 'context'
          color?: string | null
          description?: string | null
          usage_count?: number
        }
        Update: {
          name?: string
          type?: 'tag' | 'context'
          color?: string | null
          description?: string | null
          usage_count?: number
        }
      }
      entry_tags: {
        Row: {
          entry_id: string
          tag_id: string
          created_at: string
        }
        Insert: {
          entry_id: string
          tag_id: string
        }
        Update: {}
      }
      custom_signifiers: {
        Row: {
          id: string
          user_id: string
          symbol: string
          label: string
          description: string | null
          color: string | null
          usage_count: number
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          user_id: string
          symbol: string
          label: string
          description?: string | null
          color?: string | null
          usage_count?: number
        }
        Update: {
          symbol?: string
          label?: string
          description?: string | null
          color?: string | null
          usage_count?: number
        }
      }
      page_scans: {
        Row: {
          id: string
          user_id: string
          image_url: string
          image_hash: string
          file_size: number | null
          ocr_text: string | null
          ocr_provider: 'openai' | 'mistral' | 'ocr_space' | 'manual' | null
          ocr_confidence: number | null
          ocr_metadata: Json | null
          processed_at: string | null
          processing_status: 'pending' | 'processing' | 'completed' | 'failed'
          error_message: string | null
          page_date: string | null
          page_number: number | null
          created_at: string
        }
        Insert: {
          id?: string
          user_id: string
          image_url: string
          image_hash: string
          file_size?: number | null
          ocr_text?: string | null
          ocr_provider?: 'openai' | 'mistral' | 'ocr_space' | 'manual' | null
          ocr_confidence?: number | null
          ocr_metadata?: Json | null
          processed_at?: string | null
          processing_status?: 'pending' | 'processing' | 'completed' | 'failed'
          error_message?: string | null
          page_date?: string | null
          page_number?: number | null
        }
        Update: {
          image_url?: string
          image_hash?: string
          file_size?: number | null
          ocr_text?: string | null
          ocr_provider?: 'openai' | 'mistral' | 'ocr_space' | 'manual' | null
          ocr_confidence?: number | null
          ocr_metadata?: Json | null
          processed_at?: string | null
          processing_status?: 'pending' | 'processing' | 'completed' | 'failed'
          error_message?: string | null
          page_date?: string | null
          page_number?: number | null
        }
      }
      scan_entries: {
        Row: {
          scan_id: string
          entry_id: string
          bounding_box: Json | null
          confidence: number | null
        }
        Insert: {
          scan_id: string
          entry_id: string
          bounding_box?: Json | null
          confidence?: number | null
        }
        Update: {
          bounding_box?: Json | null
          confidence?: number | null
        }
      }
      entry_migrations: {
        Row: {
          id: string
          from_entry_id: string
          to_entry_id: string
          migration_type: 'migrate' | 'schedule' | 'reference'
          migration_reason: string | null
          created_at: string
        }
        Insert: {
          id?: string
          from_entry_id: string
          to_entry_id: string
          migration_type: 'migrate' | 'schedule' | 'reference'
          migration_reason?: string | null
        }
        Update: {
          migration_type?: 'migrate' | 'schedule' | 'reference'
          migration_reason?: string | null
        }
      }
      indexes: {
        Row: {
          id: string
          user_id: string
          type: 'monthly' | 'future' | 'yearly' | 'custom'
          period_start: string
          period_end: string
          title: string | null
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          user_id: string
          type: 'monthly' | 'future' | 'yearly' | 'custom'
          period_start: string
          period_end: string
          title?: string | null
        }
        Update: {
          type?: 'monthly' | 'future' | 'yearly' | 'custom'
          period_start?: string
          period_end?: string
          title?: string | null
        }
      }
      index_entries: {
        Row: {
          index_id: string
          entry_id: string
          position: number | null
        }
        Insert: {
          index_id: string
          entry_id: string
          position?: number | null
        }
        Update: {
          position?: number | null
        }
      }
      habits: {
        Row: {
          id: string
          user_id: string
          name: string
          description: string | null
          frequency: 'daily' | 'weekly' | 'monthly' | null
          target_count: number
          color: string | null
          icon: string | null
          is_active: boolean
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          user_id: string
          name: string
          description?: string | null
          frequency?: 'daily' | 'weekly' | 'monthly' | null
          target_count?: number
          color?: string | null
          icon?: string | null
          is_active?: boolean
        }
        Update: {
          name?: string
          description?: string | null
          frequency?: 'daily' | 'weekly' | 'monthly' | null
          target_count?: number
          color?: string | null
          icon?: string | null
          is_active?: boolean
        }
      }
      habit_logs: {
        Row: {
          id: string
          habit_id: string
          log_date: string
          completed: boolean
          count: number
          notes: string | null
          created_at: string
        }
        Insert: {
          id?: string
          habit_id: string
          log_date: string
          completed?: boolean
          count?: number
          notes?: string | null
        }
        Update: {
          completed?: boolean
          count?: number
          notes?: string | null
        }
      }
      mood_logs: {
        Row: {
          id: string
          user_id: string
          entry_id: string | null
          log_date: string
          mood: 'excellent' | 'good' | 'neutral' | 'poor' | 'terrible' | null
          energy_level: number | null
          gratitude_items: string[] | null
          notes: string | null
          created_at: string
        }
        Insert: {
          id?: string
          user_id: string
          entry_id?: string | null
          log_date: string
          mood?: 'excellent' | 'good' | 'neutral' | 'poor' | 'terrible' | null
          energy_level?: number | null
          gratitude_items?: string[] | null
          notes?: string | null
        }
        Update: {
          entry_id?: string | null
          log_date?: string
          mood?: 'excellent' | 'good' | 'neutral' | 'poor' | 'terrible' | null
          energy_level?: number | null
          gratitude_items?: string[] | null
          notes?: string | null
        }
      }
      sync_queue: {
        Row: {
          id: string
          user_id: string
          operation: 'create' | 'update' | 'delete'
          table_name: string
          record_id: string
          payload: Json
          synced: boolean
          sync_attempts: number
          error_message: string | null
          created_at: string
          synced_at: string | null
        }
        Insert: {
          id?: string
          user_id: string
          operation: 'create' | 'update' | 'delete'
          table_name: string
          record_id: string
          payload: Json
          synced?: boolean
          sync_attempts?: number
          error_message?: string | null
          synced_at?: string | null
        }
        Update: {
          operation?: 'create' | 'update' | 'delete'
          table_name?: string
          record_id?: string
          payload?: Json
          synced?: boolean
          sync_attempts?: number
          error_message?: string | null
          synced_at?: string | null
        }
      }
    }
    Views: {}
    Functions: {}
    Enums: {}
  }
}