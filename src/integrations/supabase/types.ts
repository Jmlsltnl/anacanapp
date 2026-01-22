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
    PostgrestVersion: "14.1"
  }
  public: {
    Tables: {
      admin_recipes: {
        Row: {
          category: string
          cook_time: number | null
          created_at: string
          description: string | null
          id: string
          image_url: string | null
          ingredients: Json
          instructions: Json
          is_active: boolean | null
          prep_time: number | null
          servings: number | null
          title: string
          updated_at: string
        }
        Insert: {
          category?: string
          cook_time?: number | null
          created_at?: string
          description?: string | null
          id?: string
          image_url?: string | null
          ingredients?: Json
          instructions?: Json
          is_active?: boolean | null
          prep_time?: number | null
          servings?: number | null
          title: string
          updated_at?: string
        }
        Update: {
          category?: string
          cook_time?: number | null
          created_at?: string
          description?: string | null
          id?: string
          image_url?: string | null
          ingredients?: Json
          instructions?: Json
          is_active?: boolean | null
          prep_time?: number | null
          servings?: number | null
          title?: string
          updated_at?: string
        }
        Relationships: []
      }
      app_settings: {
        Row: {
          created_at: string
          description: string | null
          id: string
          key: string
          updated_at: string
          value: Json
        }
        Insert: {
          created_at?: string
          description?: string | null
          id?: string
          key: string
          updated_at?: string
          value: Json
        }
        Update: {
          created_at?: string
          description?: string | null
          id?: string
          key?: string
          updated_at?: string
          value?: Json
        }
        Relationships: []
      }
      appointments: {
        Row: {
          created_at: string
          description: string | null
          event_date: string
          event_time: string | null
          event_type: string
          id: string
          reminder_enabled: boolean | null
          title: string
          user_id: string
        }
        Insert: {
          created_at?: string
          description?: string | null
          event_date: string
          event_time?: string | null
          event_type?: string
          id?: string
          reminder_enabled?: boolean | null
          title: string
          user_id: string
        }
        Update: {
          created_at?: string
          description?: string | null
          event_date?: string
          event_time?: string | null
          event_type?: string
          id?: string
          reminder_enabled?: boolean | null
          title?: string
          user_id?: string
        }
        Relationships: []
      }
      baby_logs: {
        Row: {
          created_at: string
          diaper_type: string | null
          end_time: string | null
          feed_type: string | null
          id: string
          log_type: string
          notes: string | null
          start_time: string
          user_id: string
        }
        Insert: {
          created_at?: string
          diaper_type?: string | null
          end_time?: string | null
          feed_type?: string | null
          id?: string
          log_type: string
          notes?: string | null
          start_time?: string
          user_id: string
        }
        Update: {
          created_at?: string
          diaper_type?: string | null
          end_time?: string | null
          feed_type?: string | null
          id?: string
          log_type?: string
          notes?: string | null
          start_time?: string
          user_id?: string
        }
        Relationships: []
      }
      baby_milestones: {
        Row: {
          achieved_at: string
          created_at: string
          id: string
          milestone_id: string
          notes: string | null
          user_id: string
        }
        Insert: {
          achieved_at?: string
          created_at?: string
          id?: string
          milestone_id: string
          notes?: string | null
          user_id: string
        }
        Update: {
          achieved_at?: string
          created_at?: string
          id?: string
          milestone_id?: string
          notes?: string | null
          user_id?: string
        }
        Relationships: []
      }
      baby_names_db: {
        Row: {
          created_at: string
          gender: string
          id: string
          is_active: boolean | null
          meaning: string | null
          meaning_az: string | null
          name: string
          origin: string | null
          popularity: number | null
        }
        Insert: {
          created_at?: string
          gender?: string
          id?: string
          is_active?: boolean | null
          meaning?: string | null
          meaning_az?: string | null
          name: string
          origin?: string | null
          popularity?: number | null
        }
        Update: {
          created_at?: string
          gender?: string
          id?: string
          is_active?: boolean | null
          meaning?: string | null
          meaning_az?: string | null
          name?: string
          origin?: string | null
          popularity?: number | null
        }
        Relationships: []
      }
      baby_photos: {
        Row: {
          background_theme: string
          created_at: string
          id: string
          prompt: string
          storage_path: string
          user_id: string
        }
        Insert: {
          background_theme: string
          created_at?: string
          id?: string
          prompt: string
          storage_path: string
          user_id: string
        }
        Update: {
          background_theme?: string
          created_at?: string
          id?: string
          prompt?: string
          storage_path?: string
          user_id?: string
        }
        Relationships: []
      }
      comment_likes: {
        Row: {
          comment_id: string
          created_at: string
          id: string
          user_id: string
        }
        Insert: {
          comment_id: string
          created_at?: string
          id?: string
          user_id: string
        }
        Update: {
          comment_id?: string
          created_at?: string
          id?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "comment_likes_comment_id_fkey"
            columns: ["comment_id"]
            isOneToOne: false
            referencedRelation: "post_comments"
            referencedColumns: ["id"]
          },
        ]
      }
      community_groups: {
        Row: {
          auto_join_criteria: Json | null
          cover_image_url: string | null
          created_at: string
          created_by: string | null
          description: string | null
          group_type: string
          icon_emoji: string | null
          id: string
          is_active: boolean | null
          is_auto_join: boolean | null
          member_count: number | null
          name: string
          updated_at: string
        }
        Insert: {
          auto_join_criteria?: Json | null
          cover_image_url?: string | null
          created_at?: string
          created_by?: string | null
          description?: string | null
          group_type?: string
          icon_emoji?: string | null
          id?: string
          is_active?: boolean | null
          is_auto_join?: boolean | null
          member_count?: number | null
          name: string
          updated_at?: string
        }
        Update: {
          auto_join_criteria?: Json | null
          cover_image_url?: string | null
          created_at?: string
          created_by?: string | null
          description?: string | null
          group_type?: string
          icon_emoji?: string | null
          id?: string
          is_active?: boolean | null
          is_auto_join?: boolean | null
          member_count?: number | null
          name?: string
          updated_at?: string
        }
        Relationships: []
      }
      community_posts: {
        Row: {
          comments_count: number | null
          content: string
          created_at: string
          group_id: string | null
          id: string
          is_active: boolean | null
          is_pinned: boolean | null
          likes_count: number | null
          media_urls: string[] | null
          updated_at: string
          user_id: string
        }
        Insert: {
          comments_count?: number | null
          content: string
          created_at?: string
          group_id?: string | null
          id?: string
          is_active?: boolean | null
          is_pinned?: boolean | null
          likes_count?: number | null
          media_urls?: string[] | null
          updated_at?: string
          user_id: string
        }
        Update: {
          comments_count?: number | null
          content?: string
          created_at?: string
          group_id?: string | null
          id?: string
          is_active?: boolean | null
          is_pinned?: boolean | null
          likes_count?: number | null
          media_urls?: string[] | null
          updated_at?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "community_posts_group_id_fkey"
            columns: ["group_id"]
            isOneToOne: false
            referencedRelation: "community_groups"
            referencedColumns: ["id"]
          },
        ]
      }
      community_stories: {
        Row: {
          background_color: string | null
          created_at: string
          expires_at: string
          group_id: string | null
          id: string
          media_type: string
          media_url: string
          text_overlay: string | null
          user_id: string
          view_count: number | null
        }
        Insert: {
          background_color?: string | null
          created_at?: string
          expires_at?: string
          group_id?: string | null
          id?: string
          media_type?: string
          media_url: string
          text_overlay?: string | null
          user_id: string
          view_count?: number | null
        }
        Update: {
          background_color?: string | null
          created_at?: string
          expires_at?: string
          group_id?: string | null
          id?: string
          media_type?: string
          media_url?: string
          text_overlay?: string | null
          user_id?: string
          view_count?: number | null
        }
        Relationships: [
          {
            foreignKeyName: "community_stories_group_id_fkey"
            columns: ["group_id"]
            isOneToOne: false
            referencedRelation: "community_groups"
            referencedColumns: ["id"]
          },
        ]
      }
      contractions: {
        Row: {
          created_at: string
          duration_seconds: number
          id: string
          interval_seconds: number | null
          start_time: string
          user_id: string
        }
        Insert: {
          created_at?: string
          duration_seconds?: number
          id?: string
          interval_seconds?: number | null
          start_time?: string
          user_id: string
        }
        Update: {
          created_at?: string
          duration_seconds?: number
          id?: string
          interval_seconds?: number | null
          start_time?: string
          user_id?: string
        }
        Relationships: []
      }
      daily_logs: {
        Row: {
          bleeding: string | null
          created_at: string
          id: string
          log_date: string
          mood: number | null
          notes: string | null
          symptoms: string[] | null
          temperature: number | null
          user_id: string
          water_intake: number | null
        }
        Insert: {
          bleeding?: string | null
          created_at?: string
          id?: string
          log_date?: string
          mood?: number | null
          notes?: string | null
          symptoms?: string[] | null
          temperature?: number | null
          user_id: string
          water_intake?: number | null
        }
        Update: {
          bleeding?: string | null
          created_at?: string
          id?: string
          log_date?: string
          mood?: number | null
          notes?: string | null
          symptoms?: string[] | null
          temperature?: number | null
          user_id?: string
          water_intake?: number | null
        }
        Relationships: []
      }
      device_tokens: {
        Row: {
          created_at: string
          device_name: string | null
          id: string
          platform: string
          token: string
          updated_at: string
          user_id: string
        }
        Insert: {
          created_at?: string
          device_name?: string | null
          id?: string
          platform?: string
          token: string
          updated_at?: string
          user_id: string
        }
        Update: {
          created_at?: string
          device_name?: string | null
          id?: string
          platform?: string
          token?: string
          updated_at?: string
          user_id?: string
        }
        Relationships: []
      }
      exercise_logs: {
        Row: {
          calories_burned: number
          completed_at: string
          duration_minutes: number
          exercise_id: string
          exercise_name: string
          id: string
          user_id: string
        }
        Insert: {
          calories_burned: number
          completed_at?: string
          duration_minutes: number
          exercise_id: string
          exercise_name: string
          id?: string
          user_id: string
        }
        Update: {
          calories_burned?: number
          completed_at?: string
          duration_minutes?: number
          exercise_id?: string
          exercise_name?: string
          id?: string
          user_id?: string
        }
        Relationships: []
      }
      favorite_names: {
        Row: {
          created_at: string
          gender: string
          id: string
          meaning: string | null
          name: string
          origin: string | null
          user_id: string
        }
        Insert: {
          created_at?: string
          gender: string
          id?: string
          meaning?: string | null
          name: string
          origin?: string | null
          user_id: string
        }
        Update: {
          created_at?: string
          gender?: string
          id?: string
          meaning?: string | null
          name?: string
          origin?: string | null
          user_id?: string
        }
        Relationships: []
      }
      group_memberships: {
        Row: {
          group_id: string
          id: string
          joined_at: string
          role: string | null
          user_id: string
        }
        Insert: {
          group_id: string
          id?: string
          joined_at?: string
          role?: string | null
          user_id: string
        }
        Update: {
          group_id?: string
          id?: string
          joined_at?: string
          role?: string | null
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "group_memberships_group_id_fkey"
            columns: ["group_id"]
            isOneToOne: false
            referencedRelation: "community_groups"
            referencedColumns: ["id"]
          },
        ]
      }
      hospital_bag_items: {
        Row: {
          category: string
          created_at: string
          id: string
          is_checked: boolean
          item_id: string
          item_name: string
          updated_at: string
          user_id: string
        }
        Insert: {
          category: string
          created_at?: string
          id?: string
          is_checked?: boolean
          item_id: string
          item_name: string
          updated_at?: string
          user_id: string
        }
        Update: {
          category?: string
          created_at?: string
          id?: string
          is_checked?: boolean
          item_id?: string
          item_name?: string
          updated_at?: string
          user_id?: string
        }
        Relationships: []
      }
      hospital_bag_templates: {
        Row: {
          category: string
          created_at: string
          id: string
          is_active: boolean | null
          is_essential: boolean | null
          item_name: string
          item_name_az: string | null
          sort_order: number | null
          updated_at: string
        }
        Insert: {
          category: string
          created_at?: string
          id?: string
          is_active?: boolean | null
          is_essential?: boolean | null
          item_name: string
          item_name_az?: string | null
          sort_order?: number | null
          updated_at?: string
        }
        Update: {
          category?: string
          created_at?: string
          id?: string
          is_active?: boolean | null
          is_essential?: boolean | null
          item_name?: string
          item_name_az?: string | null
          sort_order?: number | null
          updated_at?: string
        }
        Relationships: []
      }
      kick_sessions: {
        Row: {
          created_at: string
          duration_seconds: number
          id: string
          kick_count: number
          session_date: string
          user_id: string
        }
        Insert: {
          created_at?: string
          duration_seconds?: number
          id?: string
          kick_count?: number
          session_date?: string
          user_id: string
        }
        Update: {
          created_at?: string
          duration_seconds?: number
          id?: string
          kick_count?: number
          session_date?: string
          user_id?: string
        }
        Relationships: []
      }
      notifications: {
        Row: {
          created_at: string
          id: string
          is_read: boolean | null
          message: string
          notification_type: string
          title: string
          user_id: string
        }
        Insert: {
          created_at?: string
          id?: string
          is_read?: boolean | null
          message: string
          notification_type?: string
          title: string
          user_id: string
        }
        Update: {
          created_at?: string
          id?: string
          is_read?: boolean | null
          message?: string
          notification_type?: string
          title?: string
          user_id?: string
        }
        Relationships: []
      }
      nutrition_tips: {
        Row: {
          calories: number | null
          category: string
          content: string
          created_at: string
          id: string
          is_active: boolean | null
          nutrients: Json | null
          title: string
          trimester: number | null
          updated_at: string
        }
        Insert: {
          calories?: number | null
          category?: string
          content: string
          created_at?: string
          id?: string
          is_active?: boolean | null
          nutrients?: Json | null
          title: string
          trimester?: number | null
          updated_at?: string
        }
        Update: {
          calories?: number | null
          category?: string
          content?: string
          created_at?: string
          id?: string
          is_active?: boolean | null
          nutrients?: Json | null
          title?: string
          trimester?: number | null
          updated_at?: string
        }
        Relationships: []
      }
      partner_messages: {
        Row: {
          content: string | null
          created_at: string
          id: string
          is_read: boolean | null
          message_type: string
          receiver_id: string
          sender_id: string
        }
        Insert: {
          content?: string | null
          created_at?: string
          id?: string
          is_read?: boolean | null
          message_type: string
          receiver_id: string
          sender_id: string
        }
        Update: {
          content?: string | null
          created_at?: string
          id?: string
          is_read?: boolean | null
          message_type?: string
          receiver_id?: string
          sender_id?: string
        }
        Relationships: []
      }
      post_comments: {
        Row: {
          content: string
          created_at: string
          id: string
          is_active: boolean | null
          likes_count: number | null
          parent_comment_id: string | null
          post_id: string
          updated_at: string
          user_id: string
        }
        Insert: {
          content: string
          created_at?: string
          id?: string
          is_active?: boolean | null
          likes_count?: number | null
          parent_comment_id?: string | null
          post_id: string
          updated_at?: string
          user_id: string
        }
        Update: {
          content?: string
          created_at?: string
          id?: string
          is_active?: boolean | null
          likes_count?: number | null
          parent_comment_id?: string | null
          post_id?: string
          updated_at?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "post_comments_parent_comment_id_fkey"
            columns: ["parent_comment_id"]
            isOneToOne: false
            referencedRelation: "post_comments"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "post_comments_post_id_fkey"
            columns: ["post_id"]
            isOneToOne: false
            referencedRelation: "community_posts"
            referencedColumns: ["id"]
          },
        ]
      }
      post_likes: {
        Row: {
          created_at: string
          id: string
          post_id: string
          user_id: string
        }
        Insert: {
          created_at?: string
          id?: string
          post_id: string
          user_id: string
        }
        Update: {
          created_at?: string
          id?: string
          post_id?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "post_likes_post_id_fkey"
            columns: ["post_id"]
            isOneToOne: false
            referencedRelation: "community_posts"
            referencedColumns: ["id"]
          },
        ]
      }
      products: {
        Row: {
          category: string
          created_at: string
          description: string | null
          id: string
          image_url: string | null
          is_active: boolean | null
          name: string
          price: number
          rating: number | null
          stock: number | null
          updated_at: string
        }
        Insert: {
          category: string
          created_at?: string
          description?: string | null
          id?: string
          image_url?: string | null
          is_active?: boolean | null
          name: string
          price?: number
          rating?: number | null
          stock?: number | null
          updated_at?: string
        }
        Update: {
          category?: string
          created_at?: string
          description?: string | null
          id?: string
          image_url?: string | null
          is_active?: boolean | null
          name?: string
          price?: number
          rating?: number | null
          stock?: number | null
          updated_at?: string
        }
        Relationships: []
      }
      profiles: {
        Row: {
          avatar_url: string | null
          baby_birth_date: string | null
          baby_count: number | null
          baby_gender: string | null
          baby_name: string | null
          badge_type: string | null
          bio: string | null
          created_at: string
          cycle_length: number | null
          due_date: string | null
          email: string | null
          id: string
          is_premium: boolean | null
          last_period_date: string | null
          life_stage: string | null
          linked_partner_id: string | null
          multiples_type: string | null
          name: string
          partner_code: string | null
          period_length: number | null
          premium_until: string | null
          role: Database["public"]["Enums"]["app_role"]
          start_weight: number | null
          updated_at: string
          user_id: string
        }
        Insert: {
          avatar_url?: string | null
          baby_birth_date?: string | null
          baby_count?: number | null
          baby_gender?: string | null
          baby_name?: string | null
          badge_type?: string | null
          bio?: string | null
          created_at?: string
          cycle_length?: number | null
          due_date?: string | null
          email?: string | null
          id?: string
          is_premium?: boolean | null
          last_period_date?: string | null
          life_stage?: string | null
          linked_partner_id?: string | null
          multiples_type?: string | null
          name: string
          partner_code?: string | null
          period_length?: number | null
          premium_until?: string | null
          role?: Database["public"]["Enums"]["app_role"]
          start_weight?: number | null
          updated_at?: string
          user_id: string
        }
        Update: {
          avatar_url?: string | null
          baby_birth_date?: string | null
          baby_count?: number | null
          baby_gender?: string | null
          baby_name?: string | null
          badge_type?: string | null
          bio?: string | null
          created_at?: string
          cycle_length?: number | null
          due_date?: string | null
          email?: string | null
          id?: string
          is_premium?: boolean | null
          last_period_date?: string | null
          life_stage?: string | null
          linked_partner_id?: string | null
          multiples_type?: string | null
          name?: string
          partner_code?: string | null
          period_length?: number | null
          premium_until?: string | null
          role?: Database["public"]["Enums"]["app_role"]
          start_weight?: number | null
          updated_at?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "profiles_linked_partner_id_fkey"
            columns: ["linked_partner_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      safety_items: {
        Row: {
          category: string
          created_at: string
          description: string | null
          description_az: string | null
          id: string
          is_active: boolean | null
          name: string
          name_az: string | null
          notes: string | null
          safety_level: string
          updated_at: string
        }
        Insert: {
          category?: string
          created_at?: string
          description?: string | null
          description_az?: string | null
          id?: string
          is_active?: boolean | null
          name: string
          name_az?: string | null
          notes?: string | null
          safety_level?: string
          updated_at?: string
        }
        Update: {
          category?: string
          created_at?: string
          description?: string | null
          description_az?: string | null
          id?: string
          is_active?: boolean | null
          name?: string
          name_az?: string | null
          notes?: string | null
          safety_level?: string
          updated_at?: string
        }
        Relationships: []
      }
      shopping_items: {
        Row: {
          added_by: string | null
          created_at: string
          id: string
          is_checked: boolean | null
          name: string
          partner_id: string | null
          priority: string | null
          quantity: number | null
          user_id: string
        }
        Insert: {
          added_by?: string | null
          created_at?: string
          id?: string
          is_checked?: boolean | null
          name: string
          partner_id?: string | null
          priority?: string | null
          quantity?: number | null
          user_id: string
        }
        Update: {
          added_by?: string | null
          created_at?: string
          id?: string
          is_checked?: boolean | null
          name?: string
          partner_id?: string | null
          priority?: string | null
          quantity?: number | null
          user_id?: string
        }
        Relationships: []
      }
      story_views: {
        Row: {
          id: string
          story_id: string
          user_id: string
          viewed_at: string
        }
        Insert: {
          id?: string
          story_id: string
          user_id: string
          viewed_at?: string
        }
        Update: {
          id?: string
          story_id?: string
          user_id?: string
          viewed_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "story_views_story_id_fkey"
            columns: ["story_id"]
            isOneToOne: false
            referencedRelation: "community_stories"
            referencedColumns: ["id"]
          },
        ]
      }
      subscriptions: {
        Row: {
          created_at: string
          expires_at: string | null
          id: string
          plan_type: string
          started_at: string
          status: string
          updated_at: string
          user_id: string
        }
        Insert: {
          created_at?: string
          expires_at?: string | null
          id?: string
          plan_type?: string
          started_at?: string
          status?: string
          updated_at?: string
          user_id: string
        }
        Update: {
          created_at?: string
          expires_at?: string | null
          id?: string
          plan_type?: string
          started_at?: string
          status?: string
          updated_at?: string
          user_id?: string
        }
        Relationships: []
      }
      usage_tracking: {
        Row: {
          created_at: string
          feature_type: string
          id: string
          updated_at: string
          usage_count: number
          usage_date: string
          usage_seconds: number
          user_id: string
        }
        Insert: {
          created_at?: string
          feature_type: string
          id?: string
          updated_at?: string
          usage_count?: number
          usage_date?: string
          usage_seconds?: number
          user_id: string
        }
        Update: {
          created_at?: string
          feature_type?: string
          id?: string
          updated_at?: string
          usage_count?: number
          usage_date?: string
          usage_seconds?: number
          user_id?: string
        }
        Relationships: []
      }
      user_achievements: {
        Row: {
          achieved_at: string
          achievement_id: string
          achievement_type: string
          created_at: string
          id: string
          notified: boolean | null
          user_id: string
        }
        Insert: {
          achieved_at?: string
          achievement_id: string
          achievement_type: string
          created_at?: string
          id?: string
          notified?: boolean | null
          user_id: string
        }
        Update: {
          achieved_at?: string
          achievement_id?: string
          achievement_type?: string
          created_at?: string
          id?: string
          notified?: boolean | null
          user_id?: string
        }
        Relationships: []
      }
      user_blocks: {
        Row: {
          block_type: string
          blocked_by: string
          created_at: string
          expires_at: string | null
          id: string
          is_active: boolean | null
          reason: string | null
          user_id: string
        }
        Insert: {
          block_type?: string
          blocked_by: string
          created_at?: string
          expires_at?: string | null
          id?: string
          is_active?: boolean | null
          reason?: string | null
          user_id: string
        }
        Update: {
          block_type?: string
          blocked_by?: string
          created_at?: string
          expires_at?: string | null
          id?: string
          is_active?: boolean | null
          reason?: string | null
          user_id?: string
        }
        Relationships: []
      }
      user_preferences: {
        Row: {
          created_at: string
          id: string
          last_white_noise_sound: string | null
          push_comments: boolean | null
          push_community: boolean | null
          push_enabled: boolean | null
          push_likes: boolean | null
          push_messages: boolean | null
          updated_at: string
          user_id: string
          white_noise_timer: number | null
          white_noise_volume: number | null
        }
        Insert: {
          created_at?: string
          id?: string
          last_white_noise_sound?: string | null
          push_comments?: boolean | null
          push_community?: boolean | null
          push_enabled?: boolean | null
          push_likes?: boolean | null
          push_messages?: boolean | null
          updated_at?: string
          user_id: string
          white_noise_timer?: number | null
          white_noise_volume?: number | null
        }
        Update: {
          created_at?: string
          id?: string
          last_white_noise_sound?: string | null
          push_comments?: boolean | null
          push_community?: boolean | null
          push_enabled?: boolean | null
          push_likes?: boolean | null
          push_messages?: boolean | null
          updated_at?: string
          user_id?: string
          white_noise_timer?: number | null
          white_noise_volume?: number | null
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
      weekly_tips: {
        Row: {
          content: string
          created_at: string
          id: string
          image_url: string | null
          is_active: boolean | null
          life_stage: string
          tips: Json | null
          title: string
          updated_at: string
          week_number: number
        }
        Insert: {
          content: string
          created_at?: string
          id?: string
          image_url?: string | null
          is_active?: boolean | null
          life_stage?: string
          tips?: Json | null
          title: string
          updated_at?: string
          week_number: number
        }
        Update: {
          content?: string
          created_at?: string
          id?: string
          image_url?: string | null
          is_active?: boolean | null
          life_stage?: string
          tips?: Json | null
          title?: string
          updated_at?: string
          week_number?: number
        }
        Relationships: []
      }
      weight_entries: {
        Row: {
          created_at: string
          entry_date: string
          id: string
          notes: string | null
          user_id: string
          weight: number
        }
        Insert: {
          created_at?: string
          entry_date?: string
          id?: string
          notes?: string | null
          user_id: string
          weight: number
        }
        Update: {
          created_at?: string
          entry_date?: string
          id?: string
          notes?: string | null
          user_id?: string
          weight?: number
        }
        Relationships: []
      }
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      get_user_linked_partner_id: {
        Args: { _user_id: string }
        Returns: string
      }
      has_role: {
        Args: {
          _role: Database["public"]["Enums"]["app_role"]
          _user_id: string
        }
        Returns: boolean
      }
    }
    Enums: {
      app_role: "admin" | "user" | "moderator"
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
      app_role: ["admin", "user", "moderator"],
    },
  },
} as const
