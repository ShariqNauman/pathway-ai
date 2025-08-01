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
      chat_conversations: {
        Row: {
          created_at: string
          id: string
          title: string | null
          updated_at: string
          user_id: string
        }
        Insert: {
          created_at?: string
          id?: string
          title?: string | null
          updated_at?: string
          user_id: string
        }
        Update: {
          created_at?: string
          id?: string
          title?: string | null
          updated_at?: string
          user_id?: string
        }
        Relationships: []
      }
      chat_messages: {
        Row: {
          content: string
          conversation_id: string
          created_at: string
          id: string
          sender: string
        }
        Insert: {
          content: string
          conversation_id: string
          created_at?: string
          id?: string
          sender: string
        }
        Update: {
          content?: string
          conversation_id?: string
          created_at?: string
          id?: string
          sender?: string
        }
        Relationships: [
          {
            foreignKeyName: "chat_messages_conversation_id_fkey"
            columns: ["conversation_id"]
            isOneToOne: false
            referencedRelation: "chat_conversations"
            referencedColumns: ["id"]
          },
        ]
      }
      essay_analyses: {
        Row: {
          created_at: string
          essay: string
          essay_type: string
          feedback: string
          id: string
          overall_score: number | null
          prompt: string
          user_id: string
        }
        Insert: {
          created_at?: string
          essay: string
          essay_type: string
          feedback: string
          id?: string
          overall_score?: number | null
          prompt: string
          user_id: string
        }
        Update: {
          created_at?: string
          essay?: string
          essay_type?: string
          feedback?: string
          id?: string
          overall_score?: number | null
          prompt?: string
          user_id?: string
        }
        Relationships: []
      }
      message_limits: {
        Row: {
          essay_count: number | null
          last_reset: string | null
          last_reset_essays: string | null
          last_reset_recommender: string | null
          last_reset_smart_recommender: string | null
          message_count: number | null
          recommender_count: number | null
          smart_recommender_count: number | null
          user_id: string
        }
        Insert: {
          essay_count?: number | null
          last_reset?: string | null
          last_reset_essays?: string | null
          last_reset_recommender?: string | null
          last_reset_smart_recommender?: string | null
          message_count?: number | null
          recommender_count?: number | null
          smart_recommender_count?: number | null
          user_id: string
        }
        Update: {
          essay_count?: number | null
          last_reset?: string | null
          last_reset_essays?: string | null
          last_reset_recommender?: string | null
          last_reset_smart_recommender?: string | null
          message_count?: number | null
          recommender_count?: number | null
          smart_recommender_count?: number | null
          user_id?: string
        }
        Relationships: []
      }
      profiles: {
        Row: {
          act_score: number | null
          address: string | null
          budget: number | null
          countryofresidence: string | null
          created_at: string
          curriculum_grades: Json | null
          curriculum_subjects: string[] | null
          date_of_birth: string | null
          email: string | null
          english_test_score: number | null
          english_test_type: string | null
          extracurricular_activities: Json[] | null
          high_school_curriculum: string | null
          id: string
          intended_major: string | null
          name: string | null
          nationality: string | null
          phone: string | null
          preferred_country: string | null
          preferred_university_type: string | null
          sat_score: number | null
          selected_domains: string[] | null
          study_level: string | null
          updated_at: string
        }
        Insert: {
          act_score?: number | null
          address?: string | null
          budget?: number | null
          countryofresidence?: string | null
          created_at?: string
          curriculum_grades?: Json | null
          curriculum_subjects?: string[] | null
          date_of_birth?: string | null
          email?: string | null
          english_test_score?: number | null
          english_test_type?: string | null
          extracurricular_activities?: Json[] | null
          high_school_curriculum?: string | null
          id: string
          intended_major?: string | null
          name?: string | null
          nationality?: string | null
          phone?: string | null
          preferred_country?: string | null
          preferred_university_type?: string | null
          sat_score?: number | null
          selected_domains?: string[] | null
          study_level?: string | null
          updated_at?: string
        }
        Update: {
          act_score?: number | null
          address?: string | null
          budget?: number | null
          countryofresidence?: string | null
          created_at?: string
          curriculum_grades?: Json | null
          curriculum_subjects?: string[] | null
          date_of_birth?: string | null
          email?: string | null
          english_test_score?: number | null
          english_test_type?: string | null
          extracurricular_activities?: Json[] | null
          high_school_curriculum?: string | null
          id?: string
          intended_major?: string | null
          name?: string | null
          nationality?: string | null
          phone?: string | null
          preferred_country?: string | null
          preferred_university_type?: string | null
          sat_score?: number | null
          selected_domains?: string[] | null
          study_level?: string | null
          updated_at?: string
        }
        Relationships: []
      }
      saved_universities: {
        Row: {
          created_at: string
          id: string
          university_data: Json
          university_name: string
          updated_at: string
          user_id: string
        }
        Insert: {
          created_at?: string
          id?: string
          university_data: Json
          university_name: string
          updated_at?: string
          user_id: string
        }
        Update: {
          created_at?: string
          id?: string
          university_data?: Json
          university_name?: string
          updated_at?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "saved_universities_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      subscriptions: {
        Row: {
          created_at: string
          current_period_end: string | null
          id: string
          plan_type: string
          stripe_customer_id: string | null
          stripe_subscription_id: string | null
          updated_at: string
          user_id: string
        }
        Insert: {
          created_at?: string
          current_period_end?: string | null
          id?: string
          plan_type?: string
          stripe_customer_id?: string | null
          stripe_subscription_id?: string | null
          updated_at?: string
          user_id: string
        }
        Update: {
          created_at?: string
          current_period_end?: string | null
          id?: string
          plan_type?: string
          stripe_customer_id?: string | null
          stripe_subscription_id?: string | null
          updated_at?: string
          user_id?: string
        }
        Relationships: []
      }
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      check_and_reset_smart_recommender_limit: {
        Args: { user_uuid: string }
        Returns: {
          current_count: number
          limit_reached: boolean
        }[]
      }
      increment_smart_recommender_usage: {
        Args: { user_uuid: string }
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
