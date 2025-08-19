export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[]

export type Database = {
  // Allows to automatically instantiate createClient with right options
  // instead of createClient<Database, { PostgrestVersion: 'XX' }>(URL, KEY)
  __InternalSupabase: {
    PostgrestVersion: "12.2.3 (519615d)"
  }
  public: {
    Tables: {
      candidate_job_matches: {
        Row: {
          calculation_version: number | null
          candidate_id: string
          candidate_updated_at: string | null
          created_at: string | null
          education_match_score: number | null
          experience_match_score: number | null
          global_score: number | null
          id: string
          job_offer_id: string
          job_offer_updated_at: string | null
          local_score: number | null
          location_match_score: number | null
          match_details: Json | null
          match_score: number | null
          skills_match_score: number | null
          skills_only_score: number | null
          updated_at: string | null
        }
        Insert: {
          calculation_version?: number | null
          candidate_id: string
          candidate_updated_at?: string | null
          created_at?: string | null
          education_match_score?: number | null
          experience_match_score?: number | null
          global_score?: number | null
          id?: string
          job_offer_id: string
          job_offer_updated_at?: string | null
          local_score?: number | null
          location_match_score?: number | null
          match_details?: Json | null
          match_score?: number | null
          skills_match_score?: number | null
          skills_only_score?: number | null
          updated_at?: string | null
        }
        Update: {
          calculation_version?: number | null
          candidate_id?: string
          candidate_updated_at?: string | null
          created_at?: string | null
          education_match_score?: number | null
          experience_match_score?: number | null
          global_score?: number | null
          id?: string
          job_offer_id?: string
          job_offer_updated_at?: string | null
          local_score?: number | null
          location_match_score?: number | null
          match_details?: Json | null
          match_score?: number | null
          skills_match_score?: number | null
          skills_only_score?: number | null
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "candidate_job_matches_candidate_id_fkey"
            columns: ["candidate_id"]
            isOneToOne: false
            referencedRelation: "candidates"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "candidate_job_matches_job_offer_id_fkey"
            columns: ["job_offer_id"]
            isOneToOne: false
            referencedRelation: "job_offers"
            referencedColumns: ["id"]
          },
        ]
      }
      candidate_notes: {
        Row: {
          business_manager: string | null
          candidate_id: string
          content: string
          created_at: string
          enhanced_content: string | null
          id: string
          note_type: string
          updated_at: string
          user_id: string
        }
        Insert: {
          business_manager?: string | null
          candidate_id: string
          content: string
          created_at?: string
          enhanced_content?: string | null
          id?: string
          note_type?: string
          updated_at?: string
          user_id: string
        }
        Update: {
          business_manager?: string | null
          candidate_id?: string
          content?: string
          created_at?: string
          enhanced_content?: string | null
          id?: string
          note_type?: string
          updated_at?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "candidate_notes_candidate_id_fkey"
            columns: ["candidate_id"]
            isOneToOne: false
            referencedRelation: "candidates"
            referencedColumns: ["id"]
          },
        ]
      }
      candidates: {
        Row: {
          address: string | null
          ai_analyzed_at: string | null
          ai_breakdown: Json | null
          ai_explanation: string | null
          ai_recommendations: Json | null
          ai_score: number | null
          ai_strengths: Json | null
          ai_weaknesses: Json | null
          availability: string | null
          career_objectives: string | null
          certifications: Json | null
          city: string | null
          company: string | null
          continuous_training: Json | null
          contract_type: string | null
          country: string | null
          created_at: string | null
          detailed_status: string | null
          education: Json | null
          email: string | null
          experiences: Json | null
          first_name: string
          id: string
          industries: Json | null
          interests: string | null
          languages: Json | null
          last_name: string
          last_updated_at: string | null
          location: string | null
          mobility: string | null
          notes: string | null
          phone: string | null
          position: string | null
          postal_code: string | null
          professional_networks: Json | null
          professional_references: Json | null
          professional_values: string | null
          profile_completeness: number | null
          projects: Json | null
          publications: Json | null
          remote_preference: string | null
          resume_id: string | null
          salary_expectations: string | null
          score: number | null
          skills: Json | null
          source: string | null
          special_permits: Json | null
          status: string | null
          travel_willingness: string | null
          updated_at: string | null
          user_id: string
          work_authorization: string | null
          years_experience: number | null
        }
        Insert: {
          address?: string | null
          ai_analyzed_at?: string | null
          ai_breakdown?: Json | null
          ai_explanation?: string | null
          ai_recommendations?: Json | null
          ai_score?: number | null
          ai_strengths?: Json | null
          ai_weaknesses?: Json | null
          availability?: string | null
          career_objectives?: string | null
          certifications?: Json | null
          city?: string | null
          company?: string | null
          continuous_training?: Json | null
          contract_type?: string | null
          country?: string | null
          created_at?: string | null
          detailed_status?: string | null
          education?: Json | null
          email?: string | null
          experiences?: Json | null
          first_name: string
          id?: string
          industries?: Json | null
          interests?: string | null
          languages?: Json | null
          last_name: string
          last_updated_at?: string | null
          location?: string | null
          mobility?: string | null
          notes?: string | null
          phone?: string | null
          position?: string | null
          postal_code?: string | null
          professional_networks?: Json | null
          professional_references?: Json | null
          professional_values?: string | null
          profile_completeness?: number | null
          projects?: Json | null
          publications?: Json | null
          remote_preference?: string | null
          resume_id?: string | null
          salary_expectations?: string | null
          score?: number | null
          skills?: Json | null
          source?: string | null
          special_permits?: Json | null
          status?: string | null
          travel_willingness?: string | null
          updated_at?: string | null
          user_id: string
          work_authorization?: string | null
          years_experience?: number | null
        }
        Update: {
          address?: string | null
          ai_analyzed_at?: string | null
          ai_breakdown?: Json | null
          ai_explanation?: string | null
          ai_recommendations?: Json | null
          ai_score?: number | null
          ai_strengths?: Json | null
          ai_weaknesses?: Json | null
          availability?: string | null
          career_objectives?: string | null
          certifications?: Json | null
          city?: string | null
          company?: string | null
          continuous_training?: Json | null
          contract_type?: string | null
          country?: string | null
          created_at?: string | null
          detailed_status?: string | null
          education?: Json | null
          email?: string | null
          experiences?: Json | null
          first_name?: string
          id?: string
          industries?: Json | null
          interests?: string | null
          languages?: Json | null
          last_name?: string
          last_updated_at?: string | null
          location?: string | null
          mobility?: string | null
          notes?: string | null
          phone?: string | null
          position?: string | null
          postal_code?: string | null
          professional_networks?: Json | null
          professional_references?: Json | null
          professional_values?: string | null
          profile_completeness?: number | null
          projects?: Json | null
          publications?: Json | null
          remote_preference?: string | null
          resume_id?: string | null
          salary_expectations?: string | null
          score?: number | null
          skills?: Json | null
          source?: string | null
          special_permits?: Json | null
          status?: string | null
          travel_willingness?: string | null
          updated_at?: string | null
          user_id?: string
          work_authorization?: string | null
          years_experience?: number | null
        }
        Relationships: [
          {
            foreignKeyName: "candidates_resume_id_fkey"
            columns: ["resume_id"]
            isOneToOne: false
            referencedRelation: "resumes"
            referencedColumns: ["id"]
          },
        ]
      }
      job_offers: {
        Row: {
          benefits: string[] | null
          company: string | null
          contract_type: string | null
          created_at: string | null
          description: string | null
          education_level: string | null
          experience_years_max: number | null
          experience_years_min: number | null
          id: string
          industry_sectors: string[] | null
          location: string | null
          mobility: string | null
          preferred_companies: string[] | null
          preferred_skills: Json | null
          remote_preference: string | null
          required_degrees: string[] | null
          required_languages: Json | null
          required_schools: string[] | null
          required_skills: Json | null
          salary_currency: string | null
          salary_max: number | null
          salary_min: number | null
          status: string | null
          title: string
          updated_at: string | null
          user_id: string
          valid_until: string | null
        }
        Insert: {
          benefits?: string[] | null
          company?: string | null
          contract_type?: string | null
          created_at?: string | null
          description?: string | null
          education_level?: string | null
          experience_years_max?: number | null
          experience_years_min?: number | null
          id?: string
          industry_sectors?: string[] | null
          location?: string | null
          mobility?: string | null
          preferred_companies?: string[] | null
          preferred_skills?: Json | null
          remote_preference?: string | null
          required_degrees?: string[] | null
          required_languages?: Json | null
          required_schools?: string[] | null
          required_skills?: Json | null
          salary_currency?: string | null
          salary_max?: number | null
          salary_min?: number | null
          status?: string | null
          title: string
          updated_at?: string | null
          user_id: string
          valid_until?: string | null
        }
        Update: {
          benefits?: string[] | null
          company?: string | null
          contract_type?: string | null
          created_at?: string | null
          description?: string | null
          education_level?: string | null
          experience_years_max?: number | null
          experience_years_min?: number | null
          id?: string
          industry_sectors?: string[] | null
          location?: string | null
          mobility?: string | null
          preferred_companies?: string[] | null
          preferred_skills?: Json | null
          remote_preference?: string | null
          required_degrees?: string[] | null
          required_languages?: Json | null
          required_schools?: string[] | null
          required_skills?: Json | null
          salary_currency?: string | null
          salary_max?: number | null
          salary_min?: number | null
          status?: string | null
          title?: string
          updated_at?: string | null
          user_id?: string
          valid_until?: string | null
        }
        Relationships: []
      }
      job_positions: {
        Row: {
          created_at: string | null
          description: string | null
          id: string
          requirements: string | null
          skills: Json | null
          title: string
          updated_at: string | null
          user_id: string
        }
        Insert: {
          created_at?: string | null
          description?: string | null
          id?: string
          requirements?: string | null
          skills?: Json | null
          title: string
          updated_at?: string | null
          user_id: string
        }
        Update: {
          created_at?: string | null
          description?: string | null
          id?: string
          requirements?: string | null
          skills?: Json | null
          title?: string
          updated_at?: string | null
          user_id?: string
        }
        Relationships: []
      }
      pending_registrations: {
        Row: {
          company: string | null
          created_at: string
          email: string
          first_name: string
          id: string
          last_name: string
          password_hash: string
          rejection_reason: string | null
          reviewed_at: string | null
          reviewed_by: string | null
          status: string
          updated_at: string
        }
        Insert: {
          company?: string | null
          created_at?: string
          email: string
          first_name: string
          id?: string
          last_name: string
          password_hash: string
          rejection_reason?: string | null
          reviewed_at?: string | null
          reviewed_by?: string | null
          status?: string
          updated_at?: string
        }
        Update: {
          company?: string | null
          created_at?: string
          email?: string
          first_name?: string
          id?: string
          last_name?: string
          password_hash?: string
          rejection_reason?: string | null
          reviewed_at?: string | null
          reviewed_by?: string | null
          status?: string
          updated_at?: string
        }
        Relationships: []
      }
      profiles: {
        Row: {
          avatar_url: string | null
          company: string | null
          created_at: string | null
          first_name: string | null
          id: string
          is_admin: boolean | null
          last_name: string | null
          title: string | null
          updated_at: string | null
        }
        Insert: {
          avatar_url?: string | null
          company?: string | null
          created_at?: string | null
          first_name?: string | null
          id: string
          is_admin?: boolean | null
          last_name?: string | null
          title?: string | null
          updated_at?: string | null
        }
        Update: {
          avatar_url?: string | null
          company?: string | null
          created_at?: string | null
          first_name?: string | null
          id?: string
          is_admin?: boolean | null
          last_name?: string | null
          title?: string | null
          updated_at?: string | null
        }
        Relationships: []
      }
      recruiter_tasks: {
        Row: {
          business_manager: string | null
          candidate_id: string | null
          candidate_profile_url: string | null
          created_at: string
          description: string | null
          id: string
          interview_type: string | null
          priority: string
          scheduled_date: string
          status: string
          task_type: string
          title: string
          updated_at: string
          user_id: string
        }
        Insert: {
          business_manager?: string | null
          candidate_id?: string | null
          candidate_profile_url?: string | null
          created_at?: string
          description?: string | null
          id?: string
          interview_type?: string | null
          priority?: string
          scheduled_date: string
          status?: string
          task_type: string
          title: string
          updated_at?: string
          user_id: string
        }
        Update: {
          business_manager?: string | null
          candidate_id?: string | null
          candidate_profile_url?: string | null
          created_at?: string
          description?: string | null
          id?: string
          interview_type?: string | null
          priority?: string
          scheduled_date?: string
          status?: string
          task_type?: string
          title?: string
          updated_at?: string
          user_id?: string
        }
        Relationships: []
      }
      resumes: {
        Row: {
          created_at: string | null
          file_name: string
          file_path: string
          file_size: number
          file_type: string
          id: string
          parsed: boolean | null
          updated_at: string | null
          user_id: string
        }
        Insert: {
          created_at?: string | null
          file_name: string
          file_path: string
          file_size: number
          file_type: string
          id?: string
          parsed?: boolean | null
          updated_at?: string | null
          user_id: string
        }
        Update: {
          created_at?: string | null
          file_name?: string
          file_path?: string
          file_size?: number
          file_type?: string
          id?: string
          parsed?: boolean | null
          updated_at?: string | null
          user_id?: string
        }
        Relationships: []
      }
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      calculate_all_candidates_job_matches: {
        Args: { p_job_offer_id: string }
        Returns: string[]
      }
      calculate_candidate_job_match: {
        Args: { p_candidate_id: string; p_job_offer_id: string }
        Returns: string
      }
      check_duplicate_resume: {
        Args: { p_file_name: string; p_user_id: string }
        Returns: boolean
      }
      delete_candidate_secure: {
        Args: { candidate_id_param: string }
        Returns: boolean
      }
      delete_resume_by_id: {
        Args: { resume_id_param: string }
        Returns: boolean
      }
      get_all_matches_for_job_offer: {
        Args: { p_job_offer_id: string }
        Returns: Json[]
      }
      get_all_profiles_secure: {
        Args: Record<PropertyKey, never>
        Returns: {
          avatar_url: string | null
          company: string | null
          created_at: string | null
          first_name: string | null
          id: string
          is_admin: boolean | null
          last_name: string | null
          title: string | null
          updated_at: string | null
        }[]
      }
      get_auth_user_id: {
        Args: Record<PropertyKey, never>
        Returns: string
      }
      get_auth_user_profile: {
        Args: Record<PropertyKey, never>
        Returns: {
          avatar_url: string | null
          company: string | null
          created_at: string | null
          first_name: string | null
          id: string
          is_admin: boolean | null
          last_name: string | null
          title: string | null
          updated_at: string | null
        }[]
      }
      get_candidate_by_id: {
        Args: { candidate_id_param: string }
        Returns: Json[]
      }
      get_candidate_by_id_bypassing_rls: {
        Args: { candidate_id_param: string }
        Returns: {
          address: string
          ai_analyzed_at: string
          ai_breakdown: Json
          ai_explanation: string
          ai_recommendations: Json
          ai_score: number
          ai_strengths: Json
          ai_weaknesses: Json
          availability: string
          career_objectives: string
          certifications: Json
          city: string
          company: string
          continuous_training: Json
          contract_type: string
          country: string
          created_at: string
          education: Json
          email: string
          experiences: Json
          first_name: string
          id: string
          industries: Json
          interests: string
          languages: Json
          last_name: string
          last_updated_at: string
          location: string
          mobility: string
          phone: string
          position: string
          postal_code: string
          professional_networks: Json
          professional_references: Json
          professional_values: string
          profile_completeness: number
          projects: Json
          publications: Json
          remote_preference: string
          resume_id: string
          salary_expectations: string
          score: number
          skills: Json
          special_permits: Json
          status: string
          travel_willingness: string
          updated_at: string
          user_id: string
          work_authorization: string
          years_experience: number
        }[]
      }
      get_candidate_status: {
        Args: { p_candidate_id: string }
        Returns: string
      }
      get_candidate_status_direct: {
        Args: { p_candidate_id: string }
        Returns: string
      }
      get_candidates_by_ids: {
        Args: { candidate_ids: string[] }
        Returns: {
          address: string | null
          ai_analyzed_at: string | null
          ai_breakdown: Json | null
          ai_explanation: string | null
          ai_recommendations: Json | null
          ai_score: number | null
          ai_strengths: Json | null
          ai_weaknesses: Json | null
          availability: string | null
          career_objectives: string | null
          certifications: Json | null
          city: string | null
          company: string | null
          continuous_training: Json | null
          contract_type: string | null
          country: string | null
          created_at: string | null
          detailed_status: string | null
          education: Json | null
          email: string | null
          experiences: Json | null
          first_name: string
          id: string
          industries: Json | null
          interests: string | null
          languages: Json | null
          last_name: string
          last_updated_at: string | null
          location: string | null
          mobility: string | null
          notes: string | null
          phone: string | null
          position: string | null
          postal_code: string | null
          professional_networks: Json | null
          professional_references: Json | null
          professional_values: string | null
          profile_completeness: number | null
          projects: Json | null
          publications: Json | null
          remote_preference: string | null
          resume_id: string | null
          salary_expectations: string | null
          score: number | null
          skills: Json | null
          source: string | null
          special_permits: Json | null
          status: string | null
          travel_willingness: string | null
          updated_at: string | null
          user_id: string
          work_authorization: string | null
          years_experience: number | null
        }[]
      }
      get_matches_for_job_offer: {
        Args: { p_job_offer_id: string }
        Returns: Json[]
      }
      get_pending_registrations: {
        Args: Record<PropertyKey, never>
        Returns: {
          company: string | null
          created_at: string
          email: string
          first_name: string
          id: string
          last_name: string
          password_hash: string
          rejection_reason: string | null
          reviewed_at: string | null
          reviewed_by: string | null
          status: string
          updated_at: string
        }[]
      }
      get_profile_by_id: {
        Args: { _id: string }
        Returns: {
          avatar_url: string | null
          company: string | null
          created_at: string | null
          first_name: string | null
          id: string
          is_admin: boolean | null
          last_name: string | null
          title: string | null
          updated_at: string | null
        }[]
      }
      get_resume_by_id: {
        Args: { p_resume_id: string }
        Returns: {
          created_at: string | null
          file_name: string
          file_path: string
          file_size: number
          file_type: string
          id: string
          parsed: boolean | null
          updated_at: string | null
          user_id: string
        }[]
      }
      get_user_candidates: {
        Args: { user_id_param: string }
        Returns: {
          availability: string
          career_objectives: string
          certifications: Json
          company: string
          continuous_training: Json
          contract_type: string
          created_at: string
          education: Json
          email: string
          experiences: Json
          first_name: string
          id: string
          industries: Json
          interests: string
          languages: Json
          last_name: string
          last_updated_at: string
          location: string
          mobility: string
          phone: string
          position: string
          professional_networks: Json
          professional_references: Json
          professional_values: string
          profile_completeness: number
          projects: Json
          publications: Json
          remote_preference: string
          resume_id: string
          salary_expectations: string
          score: number
          skills: Json
          special_permits: Json
          status: string
          travel_willingness: string
          updated_at: string
          user_id: string
          work_authorization: string
          years_experience: number
        }[]
      }
      get_user_job_offers: {
        Args: Record<PropertyKey, never>
        Returns: Json[]
      }
      get_user_resume_by_id: {
        Args: { resume_id_param: string }
        Returns: {
          created_at: string | null
          file_name: string
          file_path: string
          file_size: number
          file_type: string
          id: string
          parsed: boolean | null
          updated_at: string | null
          user_id: string
        }[]
      }
      get_user_resumes: {
        Args: { user_id_param: string }
        Returns: Json[]
      }
      insert_resume: {
        Args: {
          p_file_name: string
          p_file_path: string
          p_file_size: number
          p_file_type: string
          p_user_id: string
        }
        Returns: string
      }
      update_candidate_secure: {
        Args: { p_candidate_id: string; p_data: Json }
        Returns: {
          address: string | null
          ai_analyzed_at: string | null
          ai_breakdown: Json | null
          ai_explanation: string | null
          ai_recommendations: Json | null
          ai_score: number | null
          ai_strengths: Json | null
          ai_weaknesses: Json | null
          availability: string | null
          career_objectives: string | null
          certifications: Json | null
          city: string | null
          company: string | null
          continuous_training: Json | null
          contract_type: string | null
          country: string | null
          created_at: string | null
          detailed_status: string | null
          education: Json | null
          email: string | null
          experiences: Json | null
          first_name: string
          id: string
          industries: Json | null
          interests: string | null
          languages: Json | null
          last_name: string
          last_updated_at: string | null
          location: string | null
          mobility: string | null
          notes: string | null
          phone: string | null
          position: string | null
          postal_code: string | null
          professional_networks: Json | null
          professional_references: Json | null
          professional_values: string | null
          profile_completeness: number | null
          projects: Json | null
          publications: Json | null
          remote_preference: string | null
          resume_id: string | null
          salary_expectations: string | null
          score: number | null
          skills: Json | null
          source: string | null
          special_permits: Json | null
          status: string | null
          travel_willingness: string | null
          updated_at: string | null
          user_id: string
          work_authorization: string | null
          years_experience: number | null
        }[]
      }
      update_candidate_status: {
        Args: { p_candidate_id: string; p_detailed_status: string }
        Returns: boolean
      }
      update_candidate_status_direct: {
        Args: { p_candidate_id: string; p_detailed_status: string }
        Returns: boolean
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

type DatabaseWithoutInternals = Omit<Database, "__InternalSupabase">

type DefaultSchema = DatabaseWithoutInternals[Extract<keyof Database, "public">]

export type Tables<
  DefaultSchemaTableNameOrOptions extends
    | keyof (DefaultSchema["Tables"] & DefaultSchema["Views"])
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof (DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"] &
        DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Views"])
    : never = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? (DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"] &
      DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Views"])[TableName] extends {
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
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"][TableName] extends {
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
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"][TableName] extends {
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
    | { schema: keyof DatabaseWithoutInternals },
  EnumName extends DefaultSchemaEnumNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaEnumNameOrOptions["schema"]]["Enums"]
    : never = never,
> = DefaultSchemaEnumNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[DefaultSchemaEnumNameOrOptions["schema"]]["Enums"][EnumName]
  : DefaultSchemaEnumNameOrOptions extends keyof DefaultSchema["Enums"]
    ? DefaultSchema["Enums"][DefaultSchemaEnumNameOrOptions]
    : never

export type CompositeTypes<
  PublicCompositeTypeNameOrOptions extends
    | keyof DefaultSchema["CompositeTypes"]
    | { schema: keyof DatabaseWithoutInternals },
  CompositeTypeName extends PublicCompositeTypeNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"]
    : never = never,
> = PublicCompositeTypeNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"][CompositeTypeName]
  : PublicCompositeTypeNameOrOptions extends keyof DefaultSchema["CompositeTypes"]
    ? DefaultSchema["CompositeTypes"][PublicCompositeTypeNameOrOptions]
    : never

export const Constants = {
  public: {
    Enums: {},
  },
} as const
