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
      organizations: {
        Row: {
          id: string
          name: string
          slug: string
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          name: string
          slug: string
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          name?: string
          slug?: string
          created_at?: string
          updated_at?: string
        }
      }
      forms: {
        Row: {
          id: string
          org_id: string
          project_id: string | null
          name: string
          slug: string
          description: string | null
          status: 'draft' | 'published' | 'archived'
          theme: Json
          current_version_id: string | null
          created_by: string | null
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          org_id: string
          project_id?: string | null
          name: string
          slug: string
          description?: string | null
          status?: 'draft' | 'published' | 'archived'
          theme?: Json
          current_version_id?: string | null
          created_by?: string | null
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          org_id?: string
          project_id?: string | null
          name?: string
          slug?: string
          description?: string | null
          status?: 'draft' | 'published' | 'archived'
          theme?: Json
          current_version_id?: string | null
          created_by?: string | null
          created_at?: string
          updated_at?: string
        }
      }
      form_versions: {
        Row: {
          id: string
          form_id: string
          version_number: number
          schema: Json
          published_by: string | null
          published_at: string
        }
        Insert: {
          id?: string
          form_id: string
          version_number: number
          schema: Json
          published_by?: string | null
          published_at?: string
        }
        Update: {
          id?: string
          form_id?: string
          version_number?: number
          schema?: Json
          published_by?: string | null
          published_at?: string
        }
      }
      submissions: {
        Row: {
          id: string
          form_id: string
          form_version_id: string
          data: Json
          utm_data: Json | null
          client_info: Json | null
          pdf_export_id: string | null
          status: 'submitted' | 'processing' | 'completed' | 'failed'
          submitted_at: string
        }
        Insert: {
          id?: string
          form_id: string
          form_version_id: string
          data: Json
          utm_data?: Json | null
          client_info?: Json | null
          pdf_export_id?: string | null
          status?: 'submitted' | 'processing' | 'completed' | 'failed'
          submitted_at?: string
        }
        Update: {
          id?: string
          form_id?: string
          form_version_id?: string
          data?: Json
          utm_data?: Json | null
          client_info?: Json | null
          pdf_export_id?: string | null
          status?: 'submitted' | 'processing' | 'completed' | 'failed'
          submitted_at?: string
        }
      }
      webhooks: {
        Row: {
          id: string
          form_id: string
          name: string
          url: string
          secret: string
          events: string[]
          headers: Json
          retry_config: Json
          is_active: boolean
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          form_id: string
          name: string
          url: string
          secret: string
          events?: string[]
          headers?: Json
          retry_config?: Json
          is_active?: boolean
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          form_id?: string
          name?: string
          url?: string
          secret?: string
          events?: string[]
          headers?: Json
          retry_config?: Json
          is_active?: boolean
          created_at?: string
          updated_at?: string
        }
      }
      recordings: {
        Row: {
          id: string
          org_id: string
          form_id: string
          form_version_id: string | null
          submission_id: string | null
          field_key: string | null
          kind: 'field' | 'meeting'
          storage_path: string
          duration_seconds: number | null
          mime_type: string | null
          created_at: string
        }
        Insert: {
          id?: string
          org_id: string
          form_id: string
          form_version_id?: string | null
          submission_id?: string | null
          field_key?: string | null
          kind: 'field' | 'meeting'
          storage_path: string
          duration_seconds?: number | null
          mime_type?: string | null
          created_at?: string
        }
        Update: {
          id?: string
          org_id?: string
          form_id?: string
          form_version_id?: string | null
          submission_id?: string | null
          field_key?: string | null
          kind?: 'field' | 'meeting'
          storage_path?: string
          duration_seconds?: number | null
          mime_type?: string | null
          created_at?: string
        }
      }
      transcriptions: {
        Row: {
          id: string
          recording_id: string
          status: 'queued' | 'processing' | 'succeeded' | 'failed'
          provider: string
          language: string | null
          text: string | null
          error: string | null
          started_at: string | null
          completed_at: string | null
          created_at: string
        }
        Insert: {
          id?: string
          recording_id: string
          status?: 'queued' | 'processing' | 'succeeded' | 'failed'
          provider?: string
          language?: string | null
          text?: string | null
          error?: string | null
          started_at?: string | null
          completed_at?: string | null
          created_at?: string
        }
        Update: {
          id?: string
          recording_id?: string
          status?: 'queued' | 'processing' | 'succeeded' | 'failed'
          provider?: string
          language?: string | null
          text?: string | null
          error?: string | null
          started_at?: string | null
          completed_at?: string | null
          created_at?: string
        }
      }
    }
  }
}