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
      guest_users: {
        Row: {
          id: string
          device_id: string
          created_at: string
          last_active: string
          app_version: string | null
          platform: string | null
        }
        Insert: {
          id?: string
          device_id: string
          created_at?: string
          last_active?: string
          app_version?: string | null
          platform?: string | null
        }
        Update: {
          id?: string
          device_id?: string
          created_at?: string
          last_active?: string
          app_version?: string | null
          platform?: string | null
        }
      }
      entries: {
        Row: {
          id: string
          user_id: string | null
          guest_user_id: string | null
          collection_id: string | null
          type: 'task' | 'event' | 'note' | 'idea' | 'research' | 'memory' | 'custom'
          content: string
          status: 'incomplete' | 'complete' | 'migrated' | 'scheduled' | 'cancelled'
          priority: 'none' | 'low' | 'medium' | 'high'
          is_priority: boolean
          collection_date: string
          due_date: string | null
          scheduled_date: string | null
          completed_at: string | null
          source: string
          ocr_confidence: number | null
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          user_id?: string | null
          guest_user_id?: string | null
          collection_id?: string | null
          type: 'task' | 'event' | 'note' | 'idea' | 'research' | 'memory' | 'custom'
          content: string
          status?: 'incomplete' | 'complete' | 'migrated' | 'scheduled' | 'cancelled'
          priority?: 'none' | 'low' | 'medium' | 'high'
          is_priority?: boolean
          collection_date: string
          due_date?: string | null
          scheduled_date?: string | null
          completed_at?: string | null
          source?: string
          ocr_confidence?: number | null
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          user_id?: string | null
          guest_user_id?: string | null
          collection_id?: string | null
          type?: 'task' | 'event' | 'note' | 'idea' | 'research' | 'memory' | 'custom'
          content?: string
          status?: 'incomplete' | 'complete' | 'migrated' | 'scheduled' | 'cancelled'
          priority?: 'none' | 'low' | 'medium' | 'high'
          is_priority?: boolean
          collection_date?: string
          due_date?: string | null
          scheduled_date?: string | null
          completed_at?: string | null
          source?: string
          ocr_confidence?: number | null
          created_at?: string
          updated_at?: string
        }
      }
      collections: {
        Row: {
          id: string
          user_id: string | null
          guest_user_id: string | null
          type: 'daily' | 'monthly' | 'future' | 'custom'
          collection_date: string
          name: string | null
          description: string | null
          color: string | null
          smart_match: boolean
          is_archived: boolean
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          user_id?: string | null
          guest_user_id?: string | null
          type: 'daily' | 'monthly' | 'future' | 'custom'
          collection_date: string
          name?: string | null
          description?: string | null
          color?: string | null
          smart_match?: boolean
          is_archived?: boolean
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          user_id?: string | null
          guest_user_id?: string | null
          type?: 'daily' | 'monthly' | 'future' | 'custom'
          collection_date?: string
          name?: string | null
          description?: string | null
          color?: string | null
          smart_match?: boolean
          is_archived?: boolean
          created_at?: string
          updated_at?: string
        }
      }
      tags: {
        Row: {
          id: string
          user_id: string | null
          guest_user_id: string | null
          name: string
          type: 'tag' | 'context'
          color: string | null
          created_at: string
        }
        Insert: {
          id?: string
          user_id?: string | null
          guest_user_id?: string | null
          name: string
          type: 'tag' | 'context'
          color?: string | null
          created_at?: string
        }
        Update: {
          id?: string
          user_id?: string | null
          guest_user_id?: string | null
          name?: string
          type?: 'tag' | 'context'
          color?: string | null
          created_at?: string
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
          created_at?: string
        }
        Update: {
          entry_id?: string
          tag_id?: string
          created_at?: string
        }
      }
      custom_signifiers: {
        Row: {
          id: string
          user_id: string | null
          guest_user_id: string | null
          symbol: string
          label: string
          description: string | null
          color: string | null
          created_at: string
        }
        Insert: {
          id?: string
          user_id?: string | null
          guest_user_id?: string | null
          symbol: string
          label: string
          description?: string | null
          color?: string | null
          created_at?: string
        }
        Update: {
          id?: string
          user_id?: string | null
          guest_user_id?: string | null
          symbol?: string
          label?: string
          description?: string | null
          color?: string | null
          created_at?: string
        }
      }
      page_scans: {
        Row: {
          id: string
          user_id: string | null
          guest_user_id: string | null
          image_url: string
          image_hash: string
          ocr_text: string
          ocr_confidence: number
          processed_at: string
          processing_status: string
          created_at: string
        }
        Insert: {
          id?: string
          user_id?: string | null
          guest_user_id?: string | null
          image_url: string
          image_hash: string
          ocr_text: string
          ocr_confidence: number
          processed_at: string
          processing_status: string
          created_at?: string
        }
        Update: {
          id?: string
          user_id?: string | null
          guest_user_id?: string | null
          image_url?: string
          image_hash?: string
          ocr_text?: string
          ocr_confidence?: number
          processed_at?: string
          processing_status?: string
          created_at?: string
        }
      }
      entry_transitions: {
        Row: {
          id: string
          user_id: string | null
          guest_user_id: string | null
          entry_id: string
          parent_entry_id: string | null
          transition_type: string
          from_state: Json | null
          to_state: Json | null
          from_status: string | null
          to_status: string | null
          from_type: string | null
          to_type: string | null
          from_collection_date: string | null
          to_collection_date: string | null
          from_collection_id: string | null
          to_collection_id: string | null
          transition_reason: string | null
          device_info: Json | null
          sync_metadata: Json | null
          created_at: string
        }
        Insert: {
          id?: string
          user_id?: string | null
          guest_user_id?: string | null
          entry_id: string
          parent_entry_id?: string | null
          transition_type: string
          from_state?: Json | null
          to_state?: Json | null
          from_status?: string | null
          to_status?: string | null
          from_type?: string | null
          to_type?: string | null
          from_collection_date?: string | null
          to_collection_date?: string | null
          from_collection_id?: string | null
          to_collection_id?: string | null
          transition_reason?: string | null
          device_info?: Json | null
          sync_metadata?: Json | null
          created_at?: string
        }
        Update: {
          id?: string
          user_id?: string | null
          guest_user_id?: string | null
          entry_id?: string
          parent_entry_id?: string | null
          transition_type?: string
          from_state?: Json | null
          to_state?: Json | null
          from_status?: string | null
          to_status?: string | null
          from_type?: string | null
          to_type?: string | null
          from_collection_date?: string | null
          to_collection_date?: string | null
          from_collection_id?: string | null
          to_collection_id?: string | null
          transition_reason?: string | null
          device_info?: Json | null
          sync_metadata?: Json | null
          created_at?: string
        }
      }
      migration_chains: {
        Row: {
          id: string
          user_id: string | null
          guest_user_id: string | null
          chain_id: string
          original_entry_id: string
          current_entry_id: string
          migration_count: number
          migration_path: string[] | null
          migration_reasons: string[] | null
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          user_id?: string | null
          guest_user_id?: string | null
          chain_id: string
          original_entry_id: string
          current_entry_id: string
          migration_count?: number
          migration_path?: string[] | null
          migration_reasons?: string[] | null
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          user_id?: string | null
          guest_user_id?: string | null
          chain_id?: string
          original_entry_id?: string
          current_entry_id?: string
          migration_count?: number
          migration_path?: string[] | null
          migration_reasons?: string[] | null
          created_at?: string
          updated_at?: string
        }
      }
      ios_sync_state: {
        Row: {
          id: string
          user_id: string | null
          guest_user_id: string | null
          entry_id: string
          apple_reminder_id: string | null
          apple_calendar_id: string | null
          apple_note_id: string | null
          last_synced_at: string | null
          sync_direction: string | null
          sync_status: string | null
          conflict_data: Json | null
          local_version: number
          remote_version: number
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          user_id?: string | null
          guest_user_id?: string | null
          entry_id: string
          apple_reminder_id?: string | null
          apple_calendar_id?: string | null
          apple_note_id?: string | null
          last_synced_at?: string | null
          sync_direction?: string | null
          sync_status?: string | null
          conflict_data?: Json | null
          local_version?: number
          remote_version?: number
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          user_id?: string | null
          guest_user_id?: string | null
          entry_id?: string
          apple_reminder_id?: string | null
          apple_calendar_id?: string | null
          apple_note_id?: string | null
          last_synced_at?: string | null
          sync_direction?: string | null
          sync_status?: string | null
          conflict_data?: Json | null
          local_version?: number
          remote_version?: number
          created_at?: string
          updated_at?: string
        }
      }
      sync_queue: {
        Row: {
          id: string
          user_id: string | null
          guest_user_id: string | null
          operation: string
          table_name: string
          record_id: string
          payload: Json
          priority: number
          sync_status: string
          retry_count: number
          max_retries: number
          error_message: string | null
          created_at: string
          synced_at: string | null
        }
        Insert: {
          id?: string
          user_id?: string | null
          guest_user_id?: string | null
          operation: string
          table_name: string
          record_id: string
          payload: Json
          priority?: number
          sync_status?: string
          retry_count?: number
          max_retries?: number
          error_message?: string | null
          created_at?: string
          synced_at?: string | null
        }
        Update: {
          id?: string
          user_id?: string | null
          guest_user_id?: string | null
          operation?: string
          table_name?: string
          record_id?: string
          payload?: Json
          priority?: number
          sync_status?: string
          retry_count?: number
          max_retries?: number
          error_message?: string | null
          created_at?: string
          synced_at?: string | null
        }
      }
      sync_conflicts: {
        Row: {
          id: string
          user_id: string | null
          guest_user_id: string | null
          record_id: string
          table_name: string
          local_version: Json
          remote_version: Json
          conflict_fields: string[] | null
          resolution_strategy: string | null
          resolved_version: Json | null
          created_at: string
          resolved_at: string | null
        }
        Insert: {
          id?: string
          user_id?: string | null
          guest_user_id?: string | null
          record_id: string
          table_name: string
          local_version: Json
          remote_version: Json
          conflict_fields?: string[] | null
          resolution_strategy?: string | null
          resolved_version?: Json | null
          created_at?: string
          resolved_at?: string | null
        }
        Update: {
          id?: string
          user_id?: string | null
          guest_user_id?: string | null
          record_id?: string
          table_name?: string
          local_version?: Json
          remote_version?: Json
          conflict_fields?: string[] | null
          resolution_strategy?: string | null
          resolved_version?: Json | null
          created_at?: string
          resolved_at?: string | null
        }
      }
      entry_snapshots: {
        Row: {
          id: string
          entry_id: string
          transition_id: string | null
          snapshot: Json
          snapshot_type: string | null
          created_at: string
        }
        Insert: {
          id?: string
          entry_id: string
          transition_id?: string | null
          snapshot: Json
          snapshot_type?: string | null
          created_at?: string
        }
        Update: {
          id?: string
          entry_id?: string
          transition_id?: string | null
          snapshot?: Json
          snapshot_type?: string | null
          created_at?: string
        }
      }
    }
    Views: {}
    Functions: {}
    Enums: {}
    CompositeTypes: {}
  }
}