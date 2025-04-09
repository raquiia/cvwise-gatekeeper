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
      candidates: {
        Row: {
          availability: string | null
          career_objectives: string | null
          certifications: Json | null
          company: string | null
          continuous_training: Json | null
          contract_type: string | null
          created_at: string | null
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
          phone: string | null
          position: string | null
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
          availability?: string | null
          career_objectives?: string | null
          certifications?: Json | null
          company?: string | null
          continuous_training?: Json | null
          contract_type?: string | null
          created_at?: string | null
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
          phone?: string | null
          position?: string | null
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
          availability?: string | null
          career_objectives?: string | null
          certifications?: Json | null
          company?: string | null
          continuous_training?: Json | null
          contract_type?: string | null
          created_at?: string | null
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
          phone?: string | null
          position?: string | null
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
      calculate_candidate_job_match: {
        Args: { p_candidate_id: string; p_job_offer_id: string }
        Returns: string
      }
      check_duplicate_resume: {
        Args: { p_file_name: string; p_user_id: string }
        Returns: boolean
      }
      delete_resume_by_id: {
        Args: { resume_id_param: string }
        Returns: boolean
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
      get_candidates_by_ids: {
        Args: { candidate_ids: string[] }
        Returns: {
          availability: string | null
          career_objectives: string | null
          certifications: Json | null
          company: string | null
          continuous_training: Json | null
          contract_type: string | null
          created_at: string | null
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
          phone: string | null
          position: string | null
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
      get_profile_by_id_no_rls: {
        Args: { profile_id_param: string }
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
      get_profile_by_id_secure: {
        Args: { profile_id_param: string }
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
