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
      ai_candidate_scores: {
        Row: {
          breakdown: Json
          calculated_at: string
          candidate_id: string
          created_at: string
          explanation: string
          id: string
          job_offer_id: string | null
          score: number
          updated_at: string
          user_id: string
        }
        Insert: {
          breakdown?: Json
          calculated_at?: string
          candidate_id: string
          created_at?: string
          explanation: string
          id?: string
          job_offer_id?: string | null
          score: number
          updated_at?: string
          user_id: string
        }
        Update: {
          breakdown?: Json
          calculated_at?: string
          candidate_id?: string
          created_at?: string
          explanation?: string
          id?: string
          job_offer_id?: string | null
          score?: number
          updated_at?: string
          user_id?: string
        }
        Relationships: []
      }
      candidate_job_matches: {
        Row: {
          candidate_id: string
          created_at: string | null
          education_match_score: number | null
          experience_match_score: number | null
          id: string
          job_offer_id: string
          location_match_score: number | null
          match_details: Json | null
          match_score: number | null
          skills_match_score: number | null
          updated_at: string | null
        }
        Insert: {
          candidate_id: string
          created_at?: string | null
          education_match_score?: number | null
          experience_match_score?: number | null
          id?: string
          job_offer_id: string
          location_match_score?: number | null
          match_details?: Json | null
          match_score?: number | null
          skills_match_score?: number | null
          updated_at?: string | null
        }
        Update: {
          candidate_id?: string
          created_at?: string | null
          education_match_score?: number | null
          experience_match_score?: number | null
          id?: string
          job_offer_id?: string
          location_match_score?: number | null
          match_details?: Json | null
          match_score?: number | null
          skills_match_score?: number | null
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
      candidate_job_matching_scores: {
        Row: {
          availability_mobility_score: number
          calculated_at: string
          candidate_id: string
          created_at: string
          cultural_fit_score: number
          data_hash: string
          education_match_score: number
          id: string
          interview_notes_bonus: number
          job_offer_id: string
          languages_match_score: number
          last_candidate_update: string | null
          last_job_update: string | null
          last_notes_update: string | null
          location_score: number
          relevant_experience_score: number
          skills_tools_score: number
          total_matching_score: number
          updated_at: string
          user_id: string
        }
        Insert: {
          availability_mobility_score?: number
          calculated_at?: string
          candidate_id: string
          created_at?: string
          cultural_fit_score?: number
          data_hash: string
          education_match_score?: number
          id?: string
          interview_notes_bonus?: number
          job_offer_id: string
          languages_match_score?: number
          last_candidate_update?: string | null
          last_job_update?: string | null
          last_notes_update?: string | null
          location_score?: number
          relevant_experience_score?: number
          skills_tools_score?: number
          total_matching_score?: number
          updated_at?: string
          user_id: string
        }
        Update: {
          availability_mobility_score?: number
          calculated_at?: string
          candidate_id?: string
          created_at?: string
          cultural_fit_score?: number
          data_hash?: string
          education_match_score?: number
          id?: string
          interview_notes_bonus?: number
          job_offer_id?: string
          languages_match_score?: number
          last_candidate_update?: string | null
          last_job_update?: string | null
          last_notes_update?: string | null
          location_score?: number
          relevant_experience_score?: number
          skills_tools_score?: number
          total_matching_score?: number
          updated_at?: string
          user_id?: string
        }
        Relationships: []
      }
      candidate_job_scores: {
        Row: {
          calculated_at: string | null
          candidate_id: string
          education_score: number
          experience_score: number
          id: string
          job_offer_id: string
          match_score: number
          profile_completeness_score: number
          skills_score: number
          updated_at: string | null
        }
        Insert: {
          calculated_at?: string | null
          candidate_id: string
          education_score?: number
          experience_score?: number
          id?: string
          job_offer_id: string
          match_score?: number
          profile_completeness_score?: number
          skills_score?: number
          updated_at?: string | null
        }
        Update: {
          calculated_at?: string | null
          candidate_id?: string
          education_score?: number
          experience_score?: number
          id?: string
          job_offer_id?: string
          match_score?: number
          profile_completeness_score?: number
          skills_score?: number
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "candidate_job_scores_candidate_id_fkey"
            columns: ["candidate_id"]
            isOneToOne: false
            referencedRelation: "candidates"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "candidate_job_scores_job_offer_id_fkey"
            columns: ["job_offer_id"]
            isOneToOne: false
            referencedRelation: "job_offers"
            referencedColumns: ["id"]
          },
        ]
      }
      candidate_notes: {
        Row: {
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
      candidate_scores: {
        Row: {
          calculated_at: string
          candidate_id: string
          created_at: string
          cv_structure_score: number
          data_hash: string
          education_score: number
          experience_score: number
          general_score: number
          id: string
          languages_score: number
          last_candidate_update: string | null
          last_notes_update: string | null
          location_mobility_score: number
          profile_summary_score: number
          skills_score: number
          updated_at: string
          user_id: string
        }
        Insert: {
          calculated_at?: string
          candidate_id: string
          created_at?: string
          cv_structure_score?: number
          data_hash: string
          education_score?: number
          experience_score?: number
          general_score?: number
          id?: string
          languages_score?: number
          last_candidate_update?: string | null
          last_notes_update?: string | null
          location_mobility_score?: number
          profile_summary_score?: number
          skills_score?: number
          updated_at?: string
          user_id: string
        }
        Update: {
          calculated_at?: string
          candidate_id?: string
          created_at?: string
          cv_structure_score?: number
          data_hash?: string
          education_score?: number
          experience_score?: number
          general_score?: number
          id?: string
          languages_score?: number
          last_candidate_update?: string | null
          last_notes_update?: string | null
          location_mobility_score?: number
          profile_summary_score?: number
          skills_score?: number
          updated_at?: string
          user_id?: string
        }
        Relationships: []
      }
      candidates: {
        Row: {
          address: string | null
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
      calculate_and_store_candidate_score: {
        Args: { p_candidate_id: string }
        Returns: number
      }
      calculate_and_store_completeness_score: {
        Args: { p_candidate_id: string }
        Returns: number
      }
      calculate_and_store_job_score: {
        Args: { p_candidate_id: string; p_job_offer_id: string }
        Returns: number
      }
      calculate_candidate_completeness_score: {
        Args: { p_candidate_id: string }
        Returns: {
          education_score: number
          experience_score: number
          skills_score: number
          languages_score: number
          location_mobility_score: number
          profile_summary_score: number
          cv_structure_score: number
          total_score: number
        }[]
      }
      calculate_candidate_data_hash: {
        Args: { p_candidate_id: string }
        Returns: string
      }
      calculate_candidate_job_match: {
        Args: { p_candidate_id: string; p_job_offer_id: string }
        Returns: string
      }
      check_duplicate_resume: {
        Args: { p_file_name: string; p_user_id: string }
        Returns: boolean
      }
      delete_ai_candidate_score: {
        Args: { p_candidate_id: string; p_job_offer_id?: string }
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
      get_ai_candidate_score: {
        Args: { p_candidate_id: string; p_job_offer_id?: string }
        Returns: {
          id: string
          candidate_id: string
          job_offer_id: string
          user_id: string
          score: number
          explanation: string
          breakdown: Json
          calculated_at: string
          created_at: string
          updated_at: string
        }[]
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
          id: string
          user_id: string
          resume_id: string
          first_name: string
          last_name: string
          email: string
          phone: string
          position: string
          years_experience: number
          location: string
          skills: Json
          score: number
          status: string
          company: string
          created_at: string
          updated_at: string
          experiences: Json
          education: Json
          certifications: Json
          languages: Json
          publications: Json
          interests: string
          professional_references: Json
          availability: string
          salary_expectations: string
          mobility: string
          contract_type: string
          remote_preference: string
          travel_willingness: string
          professional_networks: Json
          continuous_training: Json
          career_objectives: string
          professional_values: string
          work_authorization: string
          special_permits: Json
          industries: Json
          projects: Json
          profile_completeness: number
          last_updated_at: string
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
          id: string
          user_id: string
          resume_id: string
          first_name: string
          last_name: string
          email: string
          phone: string
          position: string
          years_experience: number
          location: string
          skills: Json
          score: number
          status: string
          company: string
          created_at: string
          updated_at: string
          experiences: Json
          education: Json
          certifications: Json
          languages: Json
          publications: Json
          interests: string
          professional_references: Json
          availability: string
          salary_expectations: string
          mobility: string
          contract_type: string
          remote_preference: string
          travel_willingness: string
          professional_networks: Json
          continuous_training: Json
          career_objectives: string
          professional_values: string
          work_authorization: string
          special_permits: Json
          industries: Json
          projects: Json
          profile_completeness: number
          last_updated_at: string
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
          p_user_id: string
          p_file_name: string
          p_file_path: string
          p_file_type: string
          p_file_size: number
        }
        Returns: string
      }
      save_ai_candidate_score: {
        Args: {
          p_candidate_id: string
          p_score: number
          p_explanation: string
          p_job_offer_id?: string
          p_breakdown?: Json
        }
        Returns: {
          id: string
          candidate_id: string
          job_offer_id: string
          user_id: string
          score: number
          explanation: string
          breakdown: Json
          calculated_at: string
          created_at: string
          updated_at: string
        }[]
      }
      update_candidate_secure: {
        Args: { p_candidate_id: string; p_data: Json }
        Returns: {
          address: string | null
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

type DefaultSchema = Database[Extract<keyof Database, "public">]

export type Tables<
  DefaultSchemaTableNameOrOptions extends
    | keyof (DefaultSchema["Tables"] & DefaultSchema["Views"])
    | { schema: keyof Database },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof Database
  }
    ? keyof (Database[DefaultSchemaTableNameOrOptions["schema"]]["Tables"] &
        Database[DefaultSchemaTableNameOrOptions["schema"]]["Views"])
    : never = never,
> = DefaultSchemaTableNameOrOptions extends { schema: keyof Database }
  ? (Database[DefaultSchemaTableNameOrOptions["schema"]]["Tables"] &
      Database[DefaultSchemaTableNameOrOptions["schema"]]["Views"])[TableName] extends {
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
    | { schema: keyof Database },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof Database
  }
    ? keyof Database[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never = never,
> = DefaultSchemaTableNameOrOptions extends { schema: keyof Database }
  ? Database[DefaultSchemaTableNameOrOptions["schema"]]["Tables"][TableName] extends {
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
    | { schema: keyof Database },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof Database
  }
    ? keyof Database[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never = never,
> = DefaultSchemaTableNameOrOptions extends { schema: keyof Database }
  ? Database[DefaultSchemaTableNameOrOptions["schema"]]["Tables"][TableName] extends {
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
    | { schema: keyof Database },
  EnumName extends DefaultSchemaEnumNameOrOptions extends {
    schema: keyof Database
  }
    ? keyof Database[DefaultSchemaEnumNameOrOptions["schema"]]["Enums"]
    : never = never,
> = DefaultSchemaEnumNameOrOptions extends { schema: keyof Database }
  ? Database[DefaultSchemaEnumNameOrOptions["schema"]]["Enums"][EnumName]
  : DefaultSchemaEnumNameOrOptions extends keyof DefaultSchema["Enums"]
    ? DefaultSchema["Enums"][DefaultSchemaEnumNameOrOptions]
    : never

export type CompositeTypes<
  PublicCompositeTypeNameOrOptions extends
    | keyof DefaultSchema["CompositeTypes"]
    | { schema: keyof Database },
  CompositeTypeName extends PublicCompositeTypeNameOrOptions extends {
    schema: keyof Database
  }
    ? keyof Database[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"]
    : never = never,
> = PublicCompositeTypeNameOrOptions extends { schema: keyof Database }
  ? Database[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"][CompositeTypeName]
  : PublicCompositeTypeNameOrOptions extends keyof DefaultSchema["CompositeTypes"]
    ? DefaultSchema["CompositeTypes"][PublicCompositeTypeNameOrOptions]
    : never

export const Constants = {
  public: {
    Enums: {},
  },
} as const
