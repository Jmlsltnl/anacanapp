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
      ai_chat_messages: {
        Row: {
          chat_type: string
          content: string
          created_at: string
          id: string
          role: string
          user_id: string
        }
        Insert: {
          chat_type?: string
          content: string
          created_at?: string
          id?: string
          role: string
          user_id: string
        }
        Update: {
          chat_type?: string
          content?: string
          created_at?: string
          id?: string
          role?: string
          user_id?: string
        }
        Relationships: []
      }
      ai_suggested_questions: {
        Row: {
          color_from: string | null
          color_to: string | null
          created_at: string | null
          icon: string | null
          id: string
          is_active: boolean | null
          life_stage: string
          question: string
          question_az: string | null
          sort_order: number | null
          user_type: string
        }
        Insert: {
          color_from?: string | null
          color_to?: string | null
          created_at?: string | null
          icon?: string | null
          id?: string
          is_active?: boolean | null
          life_stage?: string
          question: string
          question_az?: string | null
          sort_order?: number | null
          user_type?: string
        }
        Update: {
          color_from?: string | null
          color_to?: string | null
          created_at?: string | null
          icon?: string | null
          id?: string
          is_active?: boolean | null
          life_stage?: string
          question?: string
          question_az?: string | null
          sort_order?: number | null
          user_type?: string
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
      baby_milestones_db: {
        Row: {
          created_at: string | null
          description: string | null
          description_az: string | null
          emoji: string | null
          id: string
          is_active: boolean | null
          label: string
          label_az: string | null
          milestone_key: string
          sort_order: number | null
          week_number: number
        }
        Insert: {
          created_at?: string | null
          description?: string | null
          description_az?: string | null
          emoji?: string | null
          id?: string
          is_active?: boolean | null
          label: string
          label_az?: string | null
          milestone_key: string
          sort_order?: number | null
          week_number: number
        }
        Update: {
          created_at?: string | null
          description?: string | null
          description_az?: string | null
          emoji?: string | null
          id?: string
          is_active?: boolean | null
          label?: string
          label_az?: string | null
          milestone_key?: string
          sort_order?: number | null
          week_number?: number
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
      blog_categories: {
        Row: {
          color: string | null
          created_at: string
          description: string | null
          icon: string | null
          id: string
          is_active: boolean | null
          name: string
          slug: string
          sort_order: number | null
        }
        Insert: {
          color?: string | null
          created_at?: string
          description?: string | null
          icon?: string | null
          id?: string
          is_active?: boolean | null
          name: string
          slug: string
          sort_order?: number | null
        }
        Update: {
          color?: string | null
          created_at?: string
          description?: string | null
          icon?: string | null
          id?: string
          is_active?: boolean | null
          name?: string
          slug?: string
          sort_order?: number | null
        }
        Relationships: []
      }
      blog_comment_likes: {
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
            foreignKeyName: "blog_comment_likes_comment_id_fkey"
            columns: ["comment_id"]
            isOneToOne: false
            referencedRelation: "blog_comments"
            referencedColumns: ["id"]
          },
        ]
      }
      blog_comments: {
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
            foreignKeyName: "blog_comments_parent_comment_id_fkey"
            columns: ["parent_comment_id"]
            isOneToOne: false
            referencedRelation: "blog_comments"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "blog_comments_post_id_fkey"
            columns: ["post_id"]
            isOneToOne: false
            referencedRelation: "blog_posts"
            referencedColumns: ["id"]
          },
        ]
      }
      blog_post_likes: {
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
            foreignKeyName: "blog_post_likes_post_id_fkey"
            columns: ["post_id"]
            isOneToOne: false
            referencedRelation: "blog_posts"
            referencedColumns: ["id"]
          },
        ]
      }
      blog_post_saves: {
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
            foreignKeyName: "blog_post_saves_post_id_fkey"
            columns: ["post_id"]
            isOneToOne: false
            referencedRelation: "blog_posts"
            referencedColumns: ["id"]
          },
        ]
      }
      blog_posts: {
        Row: {
          author_avatar_url: string | null
          author_name: string | null
          category: string
          comments_count: number | null
          content: string
          cover_image_url: string | null
          created_at: string
          excerpt: string | null
          id: string
          is_featured: boolean | null
          is_published: boolean | null
          likes_count: number | null
          reading_time: number | null
          saves_count: number | null
          slug: string
          tags: string[] | null
          title: string
          updated_at: string
          view_count: number | null
        }
        Insert: {
          author_avatar_url?: string | null
          author_name?: string | null
          category?: string
          comments_count?: number | null
          content: string
          cover_image_url?: string | null
          created_at?: string
          excerpt?: string | null
          id?: string
          is_featured?: boolean | null
          is_published?: boolean | null
          likes_count?: number | null
          reading_time?: number | null
          saves_count?: number | null
          slug: string
          tags?: string[] | null
          title: string
          updated_at?: string
          view_count?: number | null
        }
        Update: {
          author_avatar_url?: string | null
          author_name?: string | null
          category?: string
          comments_count?: number | null
          content?: string
          cover_image_url?: string | null
          created_at?: string
          excerpt?: string | null
          id?: string
          is_featured?: boolean | null
          is_published?: boolean | null
          likes_count?: number | null
          reading_time?: number | null
          saves_count?: number | null
          slug?: string
          tags?: string[] | null
          title?: string
          updated_at?: string
          view_count?: number | null
        }
        Relationships: []
      }
      cart_items: {
        Row: {
          created_at: string
          id: string
          product_id: string
          quantity: number
          updated_at: string
          user_id: string
        }
        Insert: {
          created_at?: string
          id?: string
          product_id: string
          quantity?: number
          updated_at?: string
          user_id: string
        }
        Update: {
          created_at?: string
          id?: string
          product_id?: string
          quantity?: number
          updated_at?: string
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
      common_foods: {
        Row: {
          calories: number
          category: string | null
          created_at: string | null
          emoji: string | null
          id: string
          is_active: boolean | null
          name: string
          name_az: string | null
          sort_order: number | null
        }
        Insert: {
          calories: number
          category?: string | null
          created_at?: string | null
          emoji?: string | null
          id?: string
          is_active?: boolean | null
          name: string
          name_az?: string | null
          sort_order?: number | null
        }
        Update: {
          calories?: number
          category?: string | null
          created_at?: string | null
          emoji?: string | null
          id?: string
          is_active?: boolean | null
          name?: string
          name_az?: string | null
          sort_order?: number | null
        }
        Relationships: []
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
      exercises: {
        Row: {
          calories: number
          created_at: string | null
          description: string | null
          duration_minutes: number
          icon: string | null
          id: string
          is_active: boolean | null
          level: string
          name: string
          name_az: string | null
          sort_order: number | null
          steps: Json | null
          trimester: number[] | null
          updated_at: string | null
        }
        Insert: {
          calories?: number
          created_at?: string | null
          description?: string | null
          duration_minutes?: number
          icon?: string | null
          id?: string
          is_active?: boolean | null
          level?: string
          name: string
          name_az?: string | null
          sort_order?: number | null
          steps?: Json | null
          trimester?: number[] | null
          updated_at?: string | null
        }
        Update: {
          calories?: number
          created_at?: string | null
          description?: string | null
          duration_minutes?: number
          icon?: string | null
          id?: string
          is_active?: boolean | null
          level?: string
          name?: string
          name_az?: string | null
          sort_order?: number | null
          steps?: Json | null
          trimester?: number[] | null
          updated_at?: string | null
        }
        Relationships: []
      }
      faqs: {
        Row: {
          answer: string
          answer_az: string | null
          category: string | null
          created_at: string | null
          id: string
          is_active: boolean | null
          question: string
          question_az: string | null
          sort_order: number | null
        }
        Insert: {
          answer: string
          answer_az?: string | null
          category?: string | null
          created_at?: string | null
          id?: string
          is_active?: boolean | null
          question: string
          question_az?: string | null
          sort_order?: number | null
        }
        Update: {
          answer?: string
          answer_az?: string | null
          category?: string | null
          created_at?: string | null
          id?: string
          is_active?: boolean | null
          question?: string
          question_az?: string | null
          sort_order?: number | null
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
      fruit_size_images: {
        Row: {
          created_at: string
          emoji: string
          fruit_name: string
          fruit_name_az: string | null
          id: string
          image_url: string | null
          length_cm: number | null
          updated_at: string
          week_number: number
          weight_g: number | null
        }
        Insert: {
          created_at?: string
          emoji?: string
          fruit_name: string
          fruit_name_az?: string | null
          id?: string
          image_url?: string | null
          length_cm?: number | null
          updated_at?: string
          week_number: number
          weight_g?: number | null
        }
        Update: {
          created_at?: string
          emoji?: string
          fruit_name?: string
          fruit_name_az?: string | null
          id?: string
          image_url?: string | null
          length_cm?: number | null
          updated_at?: string
          week_number?: number
          weight_g?: number | null
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
      meal_logs: {
        Row: {
          calories: number
          created_at: string
          food_name: string
          id: string
          logged_at: string
          meal_type: string
          notes: string | null
          portion: string | null
          user_id: string
        }
        Insert: {
          calories?: number
          created_at?: string
          food_name: string
          id?: string
          logged_at?: string
          meal_type: string
          notes?: string | null
          portion?: string | null
          user_id: string
        }
        Update: {
          calories?: number
          created_at?: string
          food_name?: string
          id?: string
          logged_at?: string
          meal_type?: string
          notes?: string | null
          portion?: string | null
          user_id?: string
        }
        Relationships: []
      }
      meal_types: {
        Row: {
          created_at: string | null
          emoji: string | null
          id: string
          is_active: boolean | null
          life_stages: string[] | null
          meal_id: string
          name: string
          name_az: string | null
          sort_order: number | null
          time_range: string | null
        }
        Insert: {
          created_at?: string | null
          emoji?: string | null
          id?: string
          is_active?: boolean | null
          life_stages?: string[] | null
          meal_id: string
          name: string
          name_az?: string | null
          sort_order?: number | null
          time_range?: string | null
        }
        Update: {
          created_at?: string | null
          emoji?: string | null
          id?: string
          is_active?: boolean | null
          life_stages?: string[] | null
          meal_id?: string
          name?: string
          name_az?: string | null
          sort_order?: number | null
          time_range?: string | null
        }
        Relationships: []
      }
      mood_options: {
        Row: {
          color_class: string | null
          created_at: string | null
          emoji: string
          id: string
          is_active: boolean | null
          label: string
          label_az: string | null
          value: number
        }
        Insert: {
          color_class?: string | null
          created_at?: string | null
          emoji: string
          id?: string
          is_active?: boolean | null
          label: string
          label_az?: string | null
          value: number
        }
        Update: {
          color_class?: string | null
          created_at?: string | null
          emoji?: string
          id?: string
          is_active?: boolean | null
          label?: string
          label_az?: string | null
          value?: number
        }
        Relationships: []
      }
      multiples_options: {
        Row: {
          baby_count: number
          created_at: string | null
          emoji: string
          id: string
          is_active: boolean | null
          label: string
          label_az: string | null
          option_id: string
          sort_order: number | null
        }
        Insert: {
          baby_count?: number
          created_at?: string | null
          emoji: string
          id?: string
          is_active?: boolean | null
          label: string
          label_az?: string | null
          option_id: string
          sort_order?: number | null
        }
        Update: {
          baby_count?: number
          created_at?: string | null
          emoji?: string
          id?: string
          is_active?: boolean | null
          label?: string
          label_az?: string | null
          option_id?: string
          sort_order?: number | null
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
      nutrition_targets: {
        Row: {
          calories: number
          created_at: string | null
          description: string | null
          description_az: string | null
          id: string
          is_active: boolean | null
          life_stage: string
          updated_at: string | null
          water_glasses: number
        }
        Insert: {
          calories?: number
          created_at?: string | null
          description?: string | null
          description_az?: string | null
          id?: string
          is_active?: boolean | null
          life_stage: string
          updated_at?: string | null
          water_glasses?: number
        }
        Update: {
          calories?: number
          created_at?: string | null
          description?: string | null
          description_az?: string | null
          id?: string
          is_active?: boolean | null
          life_stage?: string
          updated_at?: string | null
          water_glasses?: number
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
      onboarding_stages: {
        Row: {
          bg_gradient: string | null
          created_at: string | null
          description: string | null
          description_az: string | null
          emoji: string | null
          icon_name: string | null
          id: string
          is_active: boolean | null
          sort_order: number | null
          stage_id: string
          subtitle: string | null
          subtitle_az: string | null
          title: string
          title_az: string | null
        }
        Insert: {
          bg_gradient?: string | null
          created_at?: string | null
          description?: string | null
          description_az?: string | null
          emoji?: string | null
          icon_name?: string | null
          id?: string
          is_active?: boolean | null
          sort_order?: number | null
          stage_id: string
          subtitle?: string | null
          subtitle_az?: string | null
          title: string
          title_az?: string | null
        }
        Update: {
          bg_gradient?: string | null
          created_at?: string | null
          description?: string | null
          description_az?: string | null
          emoji?: string | null
          icon_name?: string | null
          id?: string
          is_active?: boolean | null
          sort_order?: number | null
          stage_id?: string
          subtitle?: string | null
          subtitle_az?: string | null
          title?: string
          title_az?: string | null
        }
        Relationships: []
      }
      order_items: {
        Row: {
          created_at: string
          id: string
          order_id: string
          product_id: string
          product_name: string
          quantity: number
          total_price: number
          unit_price: number
        }
        Insert: {
          created_at?: string
          id?: string
          order_id: string
          product_id: string
          product_name: string
          quantity?: number
          total_price: number
          unit_price: number
        }
        Update: {
          created_at?: string
          id?: string
          order_id?: string
          product_id?: string
          product_name?: string
          quantity?: number
          total_price?: number
          unit_price?: number
        }
        Relationships: [
          {
            foreignKeyName: "order_items_order_id_fkey"
            columns: ["order_id"]
            isOneToOne: false
            referencedRelation: "orders"
            referencedColumns: ["id"]
          },
        ]
      }
      orders: {
        Row: {
          billing_address: Json | null
          created_at: string
          id: string
          notes: string | null
          order_number: string
          shipping_address: Json | null
          status: string
          total_amount: number
          updated_at: string
          user_id: string
        }
        Insert: {
          billing_address?: Json | null
          created_at?: string
          id?: string
          notes?: string | null
          order_number: string
          shipping_address?: Json | null
          status?: string
          total_amount?: number
          updated_at?: string
          user_id: string
        }
        Update: {
          billing_address?: Json | null
          created_at?: string
          id?: string
          notes?: string | null
          order_number?: string
          shipping_address?: Json | null
          status?: string
          total_amount?: number
          updated_at?: string
          user_id?: string
        }
        Relationships: []
      }
      partner_daily_tips: {
        Row: {
          created_at: string | null
          id: string
          is_active: boolean | null
          life_stage: string
          sort_order: number | null
          tip_emoji: string | null
          tip_text: string
          tip_text_az: string | null
          updated_at: string | null
          week_number: number | null
        }
        Insert: {
          created_at?: string | null
          id?: string
          is_active?: boolean | null
          life_stage?: string
          sort_order?: number | null
          tip_emoji?: string | null
          tip_text: string
          tip_text_az?: string | null
          updated_at?: string | null
          week_number?: number | null
        }
        Update: {
          created_at?: string | null
          id?: string
          is_active?: boolean | null
          life_stage?: string
          sort_order?: number | null
          tip_emoji?: string | null
          tip_text?: string
          tip_text_az?: string | null
          updated_at?: string | null
          week_number?: number | null
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
      partner_missions: {
        Row: {
          completed_at: string | null
          created_at: string
          id: string
          is_completed: boolean
          mission_id: string
          points_earned: number | null
          updated_at: string
          user_id: string
        }
        Insert: {
          completed_at?: string | null
          created_at?: string
          id?: string
          is_completed?: boolean
          mission_id: string
          points_earned?: number | null
          updated_at?: string
          user_id: string
        }
        Update: {
          completed_at?: string | null
          created_at?: string
          id?: string
          is_completed?: boolean
          mission_id?: string
          points_earned?: number | null
          updated_at?: string
          user_id?: string
        }
        Relationships: []
      }
      partner_surprises: {
        Row: {
          completed_date: string | null
          created_at: string
          id: string
          notes: string | null
          planned_date: string
          status: string
          surprise_category: string
          surprise_emoji: string
          surprise_id: string
          surprise_points: number
          surprise_title: string
          updated_at: string
          user_id: string
        }
        Insert: {
          completed_date?: string | null
          created_at?: string
          id?: string
          notes?: string | null
          planned_date: string
          status?: string
          surprise_category: string
          surprise_emoji: string
          surprise_id: string
          surprise_points?: number
          surprise_title: string
          updated_at?: string
          user_id: string
        }
        Update: {
          completed_date?: string | null
          created_at?: string
          id?: string
          notes?: string | null
          planned_date?: string
          status?: string
          surprise_category?: string
          surprise_emoji?: string
          surprise_id?: string
          surprise_points?: number
          surprise_title?: string
          updated_at?: string
          user_id?: string
        }
        Relationships: []
      }
      photoshoot_backgrounds: {
        Row: {
          category_id: string
          category_name: string
          category_name_az: string | null
          created_at: string | null
          gender: string | null
          id: string
          is_active: boolean | null
          preview_url: string | null
          prompt_template: string | null
          sort_order: number | null
          theme_emoji: string | null
          theme_id: string
          theme_name: string
          theme_name_az: string | null
          updated_at: string | null
        }
        Insert: {
          category_id: string
          category_name: string
          category_name_az?: string | null
          created_at?: string | null
          gender?: string | null
          id?: string
          is_active?: boolean | null
          preview_url?: string | null
          prompt_template?: string | null
          sort_order?: number | null
          theme_emoji?: string | null
          theme_id: string
          theme_name: string
          theme_name_az?: string | null
          updated_at?: string | null
        }
        Update: {
          category_id?: string
          category_name?: string
          category_name_az?: string | null
          created_at?: string | null
          gender?: string | null
          id?: string
          is_active?: boolean | null
          preview_url?: string | null
          prompt_template?: string | null
          sort_order?: number | null
          theme_emoji?: string | null
          theme_id?: string
          theme_name?: string
          theme_name_az?: string | null
          updated_at?: string | null
        }
        Relationships: []
      }
      photoshoot_eye_colors: {
        Row: {
          color_id: string
          color_name: string
          color_name_az: string | null
          created_at: string | null
          hex_value: string | null
          id: string
          is_active: boolean | null
          sort_order: number | null
        }
        Insert: {
          color_id: string
          color_name: string
          color_name_az?: string | null
          created_at?: string | null
          hex_value?: string | null
          id?: string
          is_active?: boolean | null
          sort_order?: number | null
        }
        Update: {
          color_id?: string
          color_name?: string
          color_name_az?: string | null
          created_at?: string | null
          hex_value?: string | null
          id?: string
          is_active?: boolean | null
          sort_order?: number | null
        }
        Relationships: []
      }
      photoshoot_hair_colors: {
        Row: {
          color_id: string
          color_name: string
          color_name_az: string | null
          created_at: string | null
          hex_value: string | null
          id: string
          is_active: boolean | null
          sort_order: number | null
        }
        Insert: {
          color_id: string
          color_name: string
          color_name_az?: string | null
          created_at?: string | null
          hex_value?: string | null
          id?: string
          is_active?: boolean | null
          sort_order?: number | null
        }
        Update: {
          color_id?: string
          color_name?: string
          color_name_az?: string | null
          created_at?: string | null
          hex_value?: string | null
          id?: string
          is_active?: boolean | null
          sort_order?: number | null
        }
        Relationships: []
      }
      photoshoot_hair_styles: {
        Row: {
          created_at: string | null
          emoji: string | null
          id: string
          is_active: boolean | null
          sort_order: number | null
          style_id: string
          style_name: string
          style_name_az: string | null
        }
        Insert: {
          created_at?: string | null
          emoji?: string | null
          id?: string
          is_active?: boolean | null
          sort_order?: number | null
          style_id: string
          style_name: string
          style_name_az?: string | null
        }
        Update: {
          created_at?: string | null
          emoji?: string | null
          id?: string
          is_active?: boolean | null
          sort_order?: number | null
          style_id?: string
          style_name?: string
          style_name_az?: string | null
        }
        Relationships: []
      }
      photoshoot_image_styles: {
        Row: {
          created_at: string | null
          emoji: string | null
          id: string
          is_active: boolean | null
          prompt_modifier: string | null
          sort_order: number | null
          style_id: string
          style_name: string
          style_name_az: string | null
        }
        Insert: {
          created_at?: string | null
          emoji?: string | null
          id?: string
          is_active?: boolean | null
          prompt_modifier?: string | null
          sort_order?: number | null
          style_id: string
          style_name: string
          style_name_az?: string | null
        }
        Update: {
          created_at?: string | null
          emoji?: string | null
          id?: string
          is_active?: boolean | null
          prompt_modifier?: string | null
          sort_order?: number | null
          style_id?: string
          style_name?: string
          style_name_az?: string | null
        }
        Relationships: []
      }
      photoshoot_outfits: {
        Row: {
          created_at: string | null
          emoji: string | null
          gender: string | null
          id: string
          is_active: boolean | null
          outfit_id: string
          outfit_name: string
          outfit_name_az: string | null
          sort_order: number | null
        }
        Insert: {
          created_at?: string | null
          emoji?: string | null
          gender?: string | null
          id?: string
          is_active?: boolean | null
          outfit_id: string
          outfit_name: string
          outfit_name_az?: string | null
          sort_order?: number | null
        }
        Update: {
          created_at?: string | null
          emoji?: string | null
          gender?: string | null
          id?: string
          is_active?: boolean | null
          outfit_id?: string
          outfit_name?: string
          outfit_name_az?: string | null
          sort_order?: number | null
        }
        Relationships: []
      }
      photoshoot_themes: {
        Row: {
          category: string
          created_at: string | null
          emoji: string | null
          id: string
          is_active: boolean | null
          is_premium: boolean | null
          name: string
          name_az: string | null
          preview_url: string | null
          prompt_text: string | null
          sort_order: number | null
        }
        Insert: {
          category: string
          created_at?: string | null
          emoji?: string | null
          id?: string
          is_active?: boolean | null
          is_premium?: boolean | null
          name: string
          name_az?: string | null
          preview_url?: string | null
          prompt_text?: string | null
          sort_order?: number | null
        }
        Update: {
          category?: string
          created_at?: string | null
          emoji?: string | null
          id?: string
          is_active?: boolean | null
          is_premium?: boolean | null
          name?: string
          name_az?: string | null
          preview_url?: string | null
          prompt_text?: string | null
          sort_order?: number | null
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
      post_reports: {
        Row: {
          created_at: string
          description: string | null
          id: string
          post_id: string
          reason: string
          reporter_id: string
          reviewed_at: string | null
          reviewed_by: string | null
          status: string
        }
        Insert: {
          created_at?: string
          description?: string | null
          id?: string
          post_id: string
          reason: string
          reporter_id: string
          reviewed_at?: string | null
          reviewed_by?: string | null
          status?: string
        }
        Update: {
          created_at?: string
          description?: string | null
          id?: string
          post_id?: string
          reason?: string
          reporter_id?: string
          reviewed_at?: string | null
          reviewed_by?: string | null
          status?: string
        }
        Relationships: [
          {
            foreignKeyName: "post_reports_post_id_fkey"
            columns: ["post_id"]
            isOneToOne: false
            referencedRelation: "community_posts"
            referencedColumns: ["id"]
          },
        ]
      }
      pregnancy_daily_content: {
        Row: {
          baby_development: string | null
          baby_message: string | null
          baby_size_cm: number | null
          baby_size_fruit: string | null
          baby_weight_gram: number | null
          body_changes: string | null
          created_at: string
          daily_tip: string | null
          day_number: number | null
          days_until_birth: number | null
          doctor_visit_tip: string | null
          emotional_tip: string | null
          exercise_tip: string | null
          foods_to_avoid: string[] | null
          id: string
          image_url: string | null
          is_active: boolean | null
          mother_symptoms: string[] | null
          mother_tips: string | null
          mother_warnings: string | null
          nutrition_tip: string | null
          partner_tip: string | null
          pregnancy_day: number | null
          recommended_exercises: string[] | null
          recommended_foods: string[] | null
          tests_to_do: string[] | null
          updated_at: string
          video_url: string | null
          week_number: number
        }
        Insert: {
          baby_development?: string | null
          baby_message?: string | null
          baby_size_cm?: number | null
          baby_size_fruit?: string | null
          baby_weight_gram?: number | null
          body_changes?: string | null
          created_at?: string
          daily_tip?: string | null
          day_number?: number | null
          days_until_birth?: number | null
          doctor_visit_tip?: string | null
          emotional_tip?: string | null
          exercise_tip?: string | null
          foods_to_avoid?: string[] | null
          id?: string
          image_url?: string | null
          is_active?: boolean | null
          mother_symptoms?: string[] | null
          mother_tips?: string | null
          mother_warnings?: string | null
          nutrition_tip?: string | null
          partner_tip?: string | null
          pregnancy_day?: number | null
          recommended_exercises?: string[] | null
          recommended_foods?: string[] | null
          tests_to_do?: string[] | null
          updated_at?: string
          video_url?: string | null
          week_number: number
        }
        Update: {
          baby_development?: string | null
          baby_message?: string | null
          baby_size_cm?: number | null
          baby_size_fruit?: string | null
          baby_weight_gram?: number | null
          body_changes?: string | null
          created_at?: string
          daily_tip?: string | null
          day_number?: number | null
          days_until_birth?: number | null
          doctor_visit_tip?: string | null
          emotional_tip?: string | null
          exercise_tip?: string | null
          foods_to_avoid?: string[] | null
          id?: string
          image_url?: string | null
          is_active?: boolean | null
          mother_symptoms?: string[] | null
          mother_tips?: string | null
          mother_warnings?: string | null
          nutrition_tip?: string | null
          partner_tip?: string | null
          pregnancy_day?: number | null
          recommended_exercises?: string[] | null
          recommended_foods?: string[] | null
          tests_to_do?: string[] | null
          updated_at?: string
          video_url?: string | null
          week_number?: number
        }
        Relationships: []
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
      public_profile_cards: {
        Row: {
          avatar_url: string | null
          badge_type: string | null
          created_at: string
          is_premium: boolean
          life_stage: string | null
          name: string | null
          updated_at: string
          user_id: string
        }
        Insert: {
          avatar_url?: string | null
          badge_type?: string | null
          created_at?: string
          is_premium?: boolean
          life_stage?: string | null
          name?: string | null
          updated_at?: string
          user_id: string
        }
        Update: {
          avatar_url?: string | null
          badge_type?: string | null
          created_at?: string
          is_premium?: boolean
          life_stage?: string | null
          name?: string | null
          updated_at?: string
          user_id?: string
        }
        Relationships: []
      }
      recipe_categories: {
        Row: {
          category_id: string
          created_at: string | null
          emoji: string | null
          id: string
          is_active: boolean | null
          life_stage: string | null
          name: string
          name_az: string | null
          sort_order: number | null
        }
        Insert: {
          category_id: string
          created_at?: string | null
          emoji?: string | null
          id?: string
          is_active?: boolean | null
          life_stage?: string | null
          name: string
          name_az?: string | null
          sort_order?: number | null
        }
        Update: {
          category_id?: string
          created_at?: string | null
          emoji?: string | null
          id?: string
          is_active?: boolean | null
          life_stage?: string | null
          name?: string
          name_az?: string | null
          sort_order?: number | null
        }
        Relationships: []
      }
      safety_categories: {
        Row: {
          category_id: string
          created_at: string | null
          emoji: string | null
          id: string
          is_active: boolean | null
          name: string
          name_az: string | null
          sort_order: number | null
        }
        Insert: {
          category_id: string
          created_at?: string | null
          emoji?: string | null
          id?: string
          is_active?: boolean | null
          name: string
          name_az?: string | null
          sort_order?: number | null
        }
        Update: {
          category_id?: string
          created_at?: string | null
          emoji?: string | null
          id?: string
          is_active?: boolean | null
          name?: string
          name_az?: string | null
          sort_order?: number | null
        }
        Relationships: []
      }
      safety_items: {
        Row: {
          category: string
          created_at: string
          description: string | null
          description_az: string | null
          id: string
          is_active: boolean | null
          item_name_az: string | null
          name: string
          name_az: string | null
          notes: string | null
          safety_level: string
          trimester_notes: Json | null
          updated_at: string
        }
        Insert: {
          category?: string
          created_at?: string
          description?: string | null
          description_az?: string | null
          id?: string
          is_active?: boolean | null
          item_name_az?: string | null
          name: string
          name_az?: string | null
          notes?: string | null
          safety_level?: string
          trimester_notes?: Json | null
          updated_at?: string
        }
        Update: {
          category?: string
          created_at?: string
          description?: string | null
          description_az?: string | null
          id?: string
          is_active?: boolean | null
          item_name_az?: string | null
          name?: string
          name_az?: string | null
          notes?: string | null
          safety_level?: string
          trimester_notes?: Json | null
          updated_at?: string
        }
        Relationships: []
      }
      shop_categories: {
        Row: {
          category_key: string
          created_at: string | null
          emoji: string | null
          id: string
          is_active: boolean | null
          name: string
          name_az: string | null
          sort_order: number | null
        }
        Insert: {
          category_key: string
          created_at?: string | null
          emoji?: string | null
          id?: string
          is_active?: boolean | null
          name: string
          name_az?: string | null
          sort_order?: number | null
        }
        Update: {
          category_key?: string
          created_at?: string | null
          emoji?: string | null
          id?: string
          is_active?: boolean | null
          name?: string
          name_az?: string | null
          sort_order?: number | null
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
      support_categories: {
        Row: {
          category_key: string
          created_at: string | null
          emoji: string | null
          id: string
          is_active: boolean | null
          name: string
          name_az: string | null
          sort_order: number | null
        }
        Insert: {
          category_key: string
          created_at?: string | null
          emoji?: string | null
          id?: string
          is_active?: boolean | null
          name: string
          name_az?: string | null
          sort_order?: number | null
        }
        Update: {
          category_key?: string
          created_at?: string | null
          emoji?: string | null
          id?: string
          is_active?: boolean | null
          name?: string
          name_az?: string | null
          sort_order?: number | null
        }
        Relationships: []
      }
      support_ticket_replies: {
        Row: {
          created_at: string
          id: string
          is_admin: boolean
          message: string
          ticket_id: string
          user_id: string
        }
        Insert: {
          created_at?: string
          id?: string
          is_admin?: boolean
          message: string
          ticket_id: string
          user_id: string
        }
        Update: {
          created_at?: string
          id?: string
          is_admin?: boolean
          message?: string
          ticket_id?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "support_ticket_replies_ticket_id_fkey"
            columns: ["ticket_id"]
            isOneToOne: false
            referencedRelation: "support_tickets"
            referencedColumns: ["id"]
          },
        ]
      }
      support_tickets: {
        Row: {
          admin_response: string | null
          category: string | null
          created_at: string
          id: string
          message: string
          priority: string | null
          responded_at: string | null
          status: string | null
          subject: string
          updated_at: string
          user_id: string
        }
        Insert: {
          admin_response?: string | null
          category?: string | null
          created_at?: string
          id?: string
          message: string
          priority?: string | null
          responded_at?: string | null
          status?: string | null
          subject: string
          updated_at?: string
          user_id: string
        }
        Update: {
          admin_response?: string | null
          category?: string | null
          created_at?: string
          id?: string
          message?: string
          priority?: string | null
          responded_at?: string | null
          status?: string | null
          subject?: string
          updated_at?: string
          user_id?: string
        }
        Relationships: []
      }
      surprise_ideas: {
        Row: {
          category: string
          created_at: string | null
          description: string | null
          difficulty: string | null
          emoji: string | null
          icon: string | null
          id: string
          is_active: boolean | null
          points: number | null
          sort_order: number | null
          title: string
        }
        Insert: {
          category?: string
          created_at?: string | null
          description?: string | null
          difficulty?: string | null
          emoji?: string | null
          icon?: string | null
          id?: string
          is_active?: boolean | null
          points?: number | null
          sort_order?: number | null
          title: string
        }
        Update: {
          category?: string
          created_at?: string | null
          description?: string | null
          difficulty?: string | null
          emoji?: string | null
          icon?: string | null
          id?: string
          is_active?: boolean | null
          points?: number | null
          sort_order?: number | null
          title?: string
        }
        Relationships: []
      }
      symptoms: {
        Row: {
          created_at: string | null
          icon: string | null
          id: string
          is_active: boolean | null
          label: string
          label_az: string | null
          life_stages: string[] | null
          sort_order: number | null
          symptom_key: string
        }
        Insert: {
          created_at?: string | null
          icon?: string | null
          id?: string
          is_active?: boolean | null
          label: string
          label_az?: string | null
          life_stages?: string[] | null
          sort_order?: number | null
          symptom_key: string
        }
        Update: {
          created_at?: string | null
          icon?: string | null
          id?: string
          is_active?: boolean | null
          label?: string
          label_az?: string | null
          life_stages?: string[] | null
          sort_order?: number | null
          symptom_key?: string
        }
        Relationships: []
      }
      tool_configs: {
        Row: {
          bg_color: string | null
          color: string | null
          created_at: string | null
          description: string | null
          description_az: string | null
          icon: string
          id: string
          is_active: boolean | null
          life_stages: string[] | null
          min_week: number | null
          name: string
          name_az: string | null
          partner_description: string | null
          partner_description_az: string | null
          partner_name: string | null
          partner_name_az: string | null
          requires_partner: boolean | null
          sort_order: number | null
          tool_id: string
          updated_at: string | null
        }
        Insert: {
          bg_color?: string | null
          color?: string | null
          created_at?: string | null
          description?: string | null
          description_az?: string | null
          icon?: string
          id?: string
          is_active?: boolean | null
          life_stages?: string[] | null
          min_week?: number | null
          name: string
          name_az?: string | null
          partner_description?: string | null
          partner_description_az?: string | null
          partner_name?: string | null
          partner_name_az?: string | null
          requires_partner?: boolean | null
          sort_order?: number | null
          tool_id: string
          updated_at?: string | null
        }
        Update: {
          bg_color?: string | null
          color?: string | null
          created_at?: string | null
          description?: string | null
          description_az?: string | null
          icon?: string
          id?: string
          is_active?: boolean | null
          life_stages?: string[] | null
          min_week?: number | null
          name?: string
          name_az?: string | null
          partner_description?: string | null
          partner_description_az?: string | null
          partner_name?: string | null
          partner_name_az?: string | null
          requires_partner?: boolean | null
          sort_order?: number | null
          tool_id?: string
          updated_at?: string | null
        }
        Relationships: []
      }
      trimester_tips: {
        Row: {
          created_at: string | null
          icon: string
          id: string
          is_active: boolean | null
          sort_order: number | null
          tip_text: string
          trimester: number
          updated_at: string | null
        }
        Insert: {
          created_at?: string | null
          icon?: string
          id?: string
          is_active?: boolean | null
          sort_order?: number | null
          tip_text: string
          trimester: number
          updated_at?: string | null
        }
        Update: {
          created_at?: string | null
          icon?: string
          id?: string
          is_active?: boolean | null
          sort_order?: number | null
          tip_text?: string
          trimester?: number
          updated_at?: string | null
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
      vitamins: {
        Row: {
          benefits: string[] | null
          created_at: string
          description: string | null
          description_az: string | null
          dosage: string | null
          food_sources: string[] | null
          icon_emoji: string | null
          id: string
          importance: string | null
          is_active: boolean | null
          life_stage: string | null
          name: string
          name_az: string | null
          sort_order: number | null
          trimester: number | null
          updated_at: string
          week_end: number | null
          week_start: number | null
        }
        Insert: {
          benefits?: string[] | null
          created_at?: string
          description?: string | null
          description_az?: string | null
          dosage?: string | null
          food_sources?: string[] | null
          icon_emoji?: string | null
          id?: string
          importance?: string | null
          is_active?: boolean | null
          life_stage?: string | null
          name: string
          name_az?: string | null
          sort_order?: number | null
          trimester?: number | null
          updated_at?: string
          week_end?: number | null
          week_start?: number | null
        }
        Update: {
          benefits?: string[] | null
          created_at?: string
          description?: string | null
          description_az?: string | null
          dosage?: string | null
          food_sources?: string[] | null
          icon_emoji?: string | null
          id?: string
          importance?: string | null
          is_active?: boolean | null
          life_stage?: string | null
          name?: string
          name_az?: string | null
          sort_order?: number | null
          trimester?: number | null
          updated_at?: string
          week_end?: number | null
          week_start?: number | null
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
      weight_recommendations: {
        Row: {
          bmi_category: string
          created_at: string | null
          description: string | null
          description_az: string | null
          id: string
          is_active: boolean | null
          max_gain_kg: number
          min_gain_kg: number
          trimester: number
          weekly_gain_kg: number | null
        }
        Insert: {
          bmi_category?: string
          created_at?: string | null
          description?: string | null
          description_az?: string | null
          id?: string
          is_active?: boolean | null
          max_gain_kg: number
          min_gain_kg: number
          trimester: number
          weekly_gain_kg?: number | null
        }
        Update: {
          bmi_category?: string
          created_at?: string | null
          description?: string | null
          description_az?: string | null
          id?: string
          is_active?: boolean | null
          max_gain_kg?: number
          min_gain_kg?: number
          trimester?: number
          weekly_gain_kg?: number | null
        }
        Relationships: []
      }
      white_noise_sounds: {
        Row: {
          audio_url: string | null
          color_gradient: string | null
          created_at: string | null
          emoji: string | null
          id: string
          is_active: boolean | null
          name: string
          name_az: string | null
          sort_order: number | null
        }
        Insert: {
          audio_url?: string | null
          color_gradient?: string | null
          created_at?: string | null
          emoji?: string | null
          id?: string
          is_active?: boolean | null
          name: string
          name_az?: string | null
          sort_order?: number | null
        }
        Update: {
          audio_url?: string | null
          color_gradient?: string | null
          created_at?: string | null
          emoji?: string | null
          id?: string
          is_active?: boolean | null
          name?: string
          name_az?: string | null
          sort_order?: number | null
        }
        Relationships: []
      }
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      find_partner_by_code: {
        Args: { p_partner_code: string }
        Returns: {
          id: string
          name: string
          user_id: string
        }[]
      }
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
      is_group_member: {
        Args: { _group_id: string; _user_id: string }
        Returns: boolean
      }
      link_partners: {
        Args: {
          p_my_profile_id: string
          p_partner_profile_id: string
          p_partner_user_id: string
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
