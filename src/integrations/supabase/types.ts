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
    PostgrestVersion: "14.4"
  }
  public: {
    Tables: {
      extra_predictions: {
        Row: {
          category: string
          created_at: string
          id: string
          player_name: string
          submitted_at: string
          team_id: string | null
          user_id: string
        }
        Insert: {
          category: string
          created_at?: string
          id?: string
          player_name: string
          submitted_at?: string
          team_id?: string | null
          user_id: string
        }
        Update: {
          category?: string
          created_at?: string
          id?: string
          player_name?: string
          submitted_at?: string
          team_id?: string | null
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "extra_predictions_team_id_fkey"
            columns: ["team_id"]
            isOneToOne: false
            referencedRelation: "teams"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "extra_predictions_team_id_fkey"
            columns: ["team_id"]
            isOneToOne: false
            referencedRelation: "v_group_standings"
            referencedColumns: ["team_id"]
          },
          {
            foreignKeyName: "extra_predictions_team_id_fkey"
            columns: ["team_id"]
            isOneToOne: false
            referencedRelation: "v_matches_with_teams"
            referencedColumns: ["away_team_id"]
          },
          {
            foreignKeyName: "extra_predictions_team_id_fkey"
            columns: ["team_id"]
            isOneToOne: false
            referencedRelation: "v_matches_with_teams"
            referencedColumns: ["home_team_id"]
          },
        ]
      }
      knockout_predictions: {
        Row: {
          created_at: string
          id: string
          stage: Database["public"]["Enums"]["knockout_stage"]
          submitted_at: string
          team_id: string
          user_id: string
        }
        Insert: {
          created_at?: string
          id?: string
          stage: Database["public"]["Enums"]["knockout_stage"]
          submitted_at?: string
          team_id: string
          user_id: string
        }
        Update: {
          created_at?: string
          id?: string
          stage?: Database["public"]["Enums"]["knockout_stage"]
          submitted_at?: string
          team_id?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "knockout_predictions_team_id_fkey"
            columns: ["team_id"]
            isOneToOne: false
            referencedRelation: "teams"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "knockout_predictions_team_id_fkey"
            columns: ["team_id"]
            isOneToOne: false
            referencedRelation: "v_group_standings"
            referencedColumns: ["team_id"]
          },
          {
            foreignKeyName: "knockout_predictions_team_id_fkey"
            columns: ["team_id"]
            isOneToOne: false
            referencedRelation: "v_matches_with_teams"
            referencedColumns: ["away_team_id"]
          },
          {
            foreignKeyName: "knockout_predictions_team_id_fkey"
            columns: ["team_id"]
            isOneToOne: false
            referencedRelation: "v_matches_with_teams"
            referencedColumns: ["home_team_id"]
          },
          {
            foreignKeyName: "knockout_predictions_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      knockout_results: {
        Row: {
          confirmed_at: string
          created_at: string
          id: string
          stage: Database["public"]["Enums"]["knockout_stage"]
          team_id: string
        }
        Insert: {
          confirmed_at?: string
          created_at?: string
          id?: string
          stage: Database["public"]["Enums"]["knockout_stage"]
          team_id: string
        }
        Update: {
          confirmed_at?: string
          created_at?: string
          id?: string
          stage?: Database["public"]["Enums"]["knockout_stage"]
          team_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "knockout_results_team_id_fkey"
            columns: ["team_id"]
            isOneToOne: false
            referencedRelation: "teams"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "knockout_results_team_id_fkey"
            columns: ["team_id"]
            isOneToOne: false
            referencedRelation: "v_group_standings"
            referencedColumns: ["team_id"]
          },
          {
            foreignKeyName: "knockout_results_team_id_fkey"
            columns: ["team_id"]
            isOneToOne: false
            referencedRelation: "v_matches_with_teams"
            referencedColumns: ["away_team_id"]
          },
          {
            foreignKeyName: "knockout_results_team_id_fkey"
            columns: ["team_id"]
            isOneToOne: false
            referencedRelation: "v_matches_with_teams"
            referencedColumns: ["home_team_id"]
          },
        ]
      }
      leaderboard: {
        Row: {
          exact_hits: number
          points_knockout: number
          points_matches: number
          points_total: number
          updated_at: string
          user_id: string
        }
        Insert: {
          exact_hits?: number
          points_knockout?: number
          points_matches?: number
          points_total?: number
          updated_at?: string
          user_id: string
        }
        Update: {
          exact_hits?: number
          points_knockout?: number
          points_matches?: number
          points_total?: number
          updated_at?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "leaderboard_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: true
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      match_predictions: {
        Row: {
          created_at: string
          id: string
          match_id: string
          points_awarded: number
          predicted_away_score: number
          predicted_home_score: number
          rule_applied: Database["public"]["Enums"]["prediction_rule"]
          scored_at: string | null
          submitted_at: string
          updated_at: string
          user_id: string
        }
        Insert: {
          created_at?: string
          id?: string
          match_id: string
          points_awarded?: number
          predicted_away_score: number
          predicted_home_score: number
          rule_applied?: Database["public"]["Enums"]["prediction_rule"]
          scored_at?: string | null
          submitted_at?: string
          updated_at?: string
          user_id: string
        }
        Update: {
          created_at?: string
          id?: string
          match_id?: string
          points_awarded?: number
          predicted_away_score?: number
          predicted_home_score?: number
          rule_applied?: Database["public"]["Enums"]["prediction_rule"]
          scored_at?: string | null
          submitted_at?: string
          updated_at?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "match_predictions_match_id_fkey"
            columns: ["match_id"]
            isOneToOne: false
            referencedRelation: "matches"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "match_predictions_match_id_fkey"
            columns: ["match_id"]
            isOneToOne: false
            referencedRelation: "v_matches_with_teams"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "match_predictions_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      matches: {
        Row: {
          away_team_id: string
          city: string | null
          created_at: string
          external_id: string | null
          home_team_id: string
          id: string
          kickoff_at: string
          match_number: number | null
          official_away_score: number | null
          official_home_score: number | null
          source_name: string
          stage: Database["public"]["Enums"]["match_stage"]
          status: Database["public"]["Enums"]["match_status"]
          synced_at: string | null
          updated_at: string
          venue: string | null
          winner_team_id: string | null
        }
        Insert: {
          away_team_id: string
          city?: string | null
          created_at?: string
          external_id?: string | null
          home_team_id: string
          id?: string
          kickoff_at: string
          match_number?: number | null
          official_away_score?: number | null
          official_home_score?: number | null
          source_name?: string
          stage: Database["public"]["Enums"]["match_stage"]
          status?: Database["public"]["Enums"]["match_status"]
          synced_at?: string | null
          updated_at?: string
          venue?: string | null
          winner_team_id?: string | null
        }
        Update: {
          away_team_id?: string
          city?: string | null
          created_at?: string
          external_id?: string | null
          home_team_id?: string
          id?: string
          kickoff_at?: string
          match_number?: number | null
          official_away_score?: number | null
          official_home_score?: number | null
          source_name?: string
          stage?: Database["public"]["Enums"]["match_stage"]
          status?: Database["public"]["Enums"]["match_status"]
          synced_at?: string | null
          updated_at?: string
          venue?: string | null
          winner_team_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "matches_away_team_id_fkey"
            columns: ["away_team_id"]
            isOneToOne: false
            referencedRelation: "teams"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "matches_away_team_id_fkey"
            columns: ["away_team_id"]
            isOneToOne: false
            referencedRelation: "v_group_standings"
            referencedColumns: ["team_id"]
          },
          {
            foreignKeyName: "matches_away_team_id_fkey"
            columns: ["away_team_id"]
            isOneToOne: false
            referencedRelation: "v_matches_with_teams"
            referencedColumns: ["away_team_id"]
          },
          {
            foreignKeyName: "matches_away_team_id_fkey"
            columns: ["away_team_id"]
            isOneToOne: false
            referencedRelation: "v_matches_with_teams"
            referencedColumns: ["home_team_id"]
          },
          {
            foreignKeyName: "matches_home_team_id_fkey"
            columns: ["home_team_id"]
            isOneToOne: false
            referencedRelation: "teams"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "matches_home_team_id_fkey"
            columns: ["home_team_id"]
            isOneToOne: false
            referencedRelation: "v_group_standings"
            referencedColumns: ["team_id"]
          },
          {
            foreignKeyName: "matches_home_team_id_fkey"
            columns: ["home_team_id"]
            isOneToOne: false
            referencedRelation: "v_matches_with_teams"
            referencedColumns: ["away_team_id"]
          },
          {
            foreignKeyName: "matches_home_team_id_fkey"
            columns: ["home_team_id"]
            isOneToOne: false
            referencedRelation: "v_matches_with_teams"
            referencedColumns: ["home_team_id"]
          },
          {
            foreignKeyName: "matches_winner_team_id_fkey"
            columns: ["winner_team_id"]
            isOneToOne: false
            referencedRelation: "teams"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "matches_winner_team_id_fkey"
            columns: ["winner_team_id"]
            isOneToOne: false
            referencedRelation: "v_group_standings"
            referencedColumns: ["team_id"]
          },
          {
            foreignKeyName: "matches_winner_team_id_fkey"
            columns: ["winner_team_id"]
            isOneToOne: false
            referencedRelation: "v_matches_with_teams"
            referencedColumns: ["away_team_id"]
          },
          {
            foreignKeyName: "matches_winner_team_id_fkey"
            columns: ["winner_team_id"]
            isOneToOne: false
            referencedRelation: "v_matches_with_teams"
            referencedColumns: ["home_team_id"]
          },
        ]
      }
      players: {
        Row: {
          created_at: string
          id: string
          name: string
          position: string | null
          shirt_number: number | null
          team_id: string
        }
        Insert: {
          created_at?: string
          id?: string
          name: string
          position?: string | null
          shirt_number?: number | null
          team_id: string
        }
        Update: {
          created_at?: string
          id?: string
          name?: string
          position?: string | null
          shirt_number?: number | null
          team_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "players_team_id_fkey"
            columns: ["team_id"]
            isOneToOne: false
            referencedRelation: "teams"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "players_team_id_fkey"
            columns: ["team_id"]
            isOneToOne: false
            referencedRelation: "v_group_standings"
            referencedColumns: ["team_id"]
          },
          {
            foreignKeyName: "players_team_id_fkey"
            columns: ["team_id"]
            isOneToOne: false
            referencedRelation: "v_matches_with_teams"
            referencedColumns: ["away_team_id"]
          },
          {
            foreignKeyName: "players_team_id_fkey"
            columns: ["team_id"]
            isOneToOne: false
            referencedRelation: "v_matches_with_teams"
            referencedColumns: ["home_team_id"]
          },
        ]
      }
      profiles: {
        Row: {
          approved: boolean
          created_at: string
          display_name: string
          id: string
          pix_key: string | null
        }
        Insert: {
          approved?: boolean
          created_at?: string
          display_name: string
          id: string
          pix_key?: string | null
        }
        Update: {
          approved?: boolean
          created_at?: string
          display_name?: string
          id?: string
          pix_key?: string | null
        }
        Relationships: []
      }
      push_subscriptions: {
        Row: {
          auth: string
          created_at: string
          endpoint: string
          id: string
          p256dh: string
          user_id: string
        }
        Insert: {
          auth: string
          created_at?: string
          endpoint: string
          id?: string
          p256dh: string
          user_id: string
        }
        Update: {
          auth?: string
          created_at?: string
          endpoint?: string
          id?: string
          p256dh?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "push_subscriptions_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      teams: {
        Row: {
          created_at: string
          external_id: string | null
          fifa_code: string | null
          flag_url: string | null
          group_name: string | null
          id: string
          name: string
          short_name: string | null
        }
        Insert: {
          created_at?: string
          external_id?: string | null
          fifa_code?: string | null
          flag_url?: string | null
          group_name?: string | null
          id?: string
          name: string
          short_name?: string | null
        }
        Update: {
          created_at?: string
          external_id?: string | null
          fifa_code?: string | null
          flag_url?: string | null
          group_name?: string | null
          id?: string
          name?: string
          short_name?: string | null
        }
        Relationships: []
      }
      user_roles: {
        Row: {
          id: string
          role: Database["public"]["Enums"]["app_role"]
          user_id: string
        }
        Insert: {
          id?: string
          role: Database["public"]["Enums"]["app_role"]
          user_id: string
        }
        Update: {
          id?: string
          role?: Database["public"]["Enums"]["app_role"]
          user_id?: string
        }
        Relationships: []
      }
    }
    Views: {
      v_group_standings: {
        Row: {
          draws: number | null
          flag_url: string | null
          goal_difference: number | null
          goals_against: number | null
          goals_for: number | null
          group_name: string | null
          losses: number | null
          played: number | null
          points: number | null
          team_id: string | null
          team_name: string | null
          wins: number | null
        }
        Relationships: []
      }
      v_matches_with_teams: {
        Row: {
          away_team_flag_url: string | null
          away_team_id: string | null
          away_team_name: string | null
          city: string | null
          external_id: string | null
          home_team_flag_url: string | null
          home_team_id: string | null
          home_team_name: string | null
          id: string | null
          kickoff_at: string | null
          match_number: number | null
          official_away_score: number | null
          official_home_score: number | null
          source_name: string | null
          stage: Database["public"]["Enums"]["match_stage"] | null
          status: Database["public"]["Enums"]["match_status"] | null
          venue: string | null
        }
        Relationships: []
      }
      v_ranking: {
        Row: {
          display_name: string | null
          exact_hits: number | null
          points_knockout: number | null
          points_matches: number | null
          points_total: number | null
          updated_at: string | null
          user_id: string | null
        }
        Relationships: [
          {
            foreignKeyName: "leaderboard_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: true
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
    }
    Functions: {
      calculate_match_prediction_points: {
        Args: {
          pred_away: number
          pred_home: number
          real_away: number
          real_home: number
        }
        Returns: {
          points: number
          rule_applied: Database["public"]["Enums"]["prediction_rule"]
        }[]
      }
      get_result_label: {
        Args: { away_goals: number; home_goals: number }
        Returns: string
      }
      has_role: {
        Args: {
          _role: Database["public"]["Enums"]["app_role"]
          _user_id: string
        }
        Returns: boolean
      }
      refresh_leaderboard: { Args: never; Returns: undefined }
      score_finished_matches: { Args: never; Returns: undefined }
      submit_match_prediction: {
        Args: {
          p_match_id: string
          p_predicted_away_score: number
          p_predicted_home_score: number
        }
        Returns: {
          created_at: string
          id: string
          match_id: string
          points_awarded: number
          predicted_away_score: number
          predicted_home_score: number
          rule_applied: Database["public"]["Enums"]["prediction_rule"]
          scored_at: string | null
          submitted_at: string
          updated_at: string
          user_id: string
        }
        SetofOptions: {
          from: "*"
          to: "match_predictions"
          isOneToOne: true
          isSetofReturn: false
        }
      }
    }
    Enums: {
      app_role: "admin" | "user"
      knockout_stage:
        | "ROUND_OF_16"
        | "QUARTER_FINAL"
        | "SEMI_FINAL"
        | "FINAL"
        | "CHAMPION"
        | "ROUND_OF_32"
      match_stage:
        | "GROUP_STAGE"
        | "ROUND_OF_32"
        | "ROUND_OF_16"
        | "QUARTER_FINAL"
        | "SEMI_FINAL"
        | "FINAL"
      match_status:
        | "SCHEDULED"
        | "LIVE"
        | "FINISHED"
        | "CANCELLED"
        | "POSTPONED"
      prediction_rule:
        | "EXACT_SCORE"
        | "RESULT_ONLY"
        | "WINNER_AND_WINNER_GOALS"
        | "WINNER_AND_LOSER_GOALS"
        | "DRAW_RESULT_ONLY"
        | "MISS"
        | "PENDING"
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
    Enums: {
      app_role: ["admin", "user"],
      knockout_stage: [
        "ROUND_OF_16",
        "QUARTER_FINAL",
        "SEMI_FINAL",
        "FINAL",
        "CHAMPION",
        "ROUND_OF_32",
      ],
      match_stage: [
        "GROUP_STAGE",
        "ROUND_OF_32",
        "ROUND_OF_16",
        "QUARTER_FINAL",
        "SEMI_FINAL",
        "FINAL",
      ],
      match_status: ["SCHEDULED", "LIVE", "FINISHED", "CANCELLED", "POSTPONED"],
      prediction_rule: [
        "EXACT_SCORE",
        "RESULT_ONLY",
        "WINNER_AND_WINNER_GOALS",
        "WINNER_AND_LOSER_GOALS",
        "DRAW_RESULT_ONLY",
        "MISS",
        "PENDING",
      ],
    },
  },
} as const
