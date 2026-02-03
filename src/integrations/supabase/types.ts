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
      affiliate_products: {
        Row: {
          affiliate_url: string
          category: string | null
          category_az: string | null
          cons: string[] | null
          created_at: string | null
          currency: string | null
          description: string | null
          description_az: string | null
          id: string
          image_url: string | null
          images: string[] | null
          is_active: boolean | null
          is_featured: boolean | null
          life_stages: string[] | null
          name: string
          name_az: string | null
          original_price: number | null
          platform: string | null
          price: number | null
          price_updated_at: string | null
          pros: string[] | null
          rating: number | null
          review_count: number | null
          review_summary: string | null
          review_summary_az: string | null
          sort_order: number | null
          specifications: Json | null
          store_logo_url: string | null
          store_name: string | null
          tags: string[] | null
          updated_at: string | null
          video_url: string | null
        }
        Insert: {
          affiliate_url: string
          category?: string | null
          category_az?: string | null
          cons?: string[] | null
          created_at?: string | null
          currency?: string | null
          description?: string | null
          description_az?: string | null
          id?: string
          image_url?: string | null
          images?: string[] | null
          is_active?: boolean | null
          is_featured?: boolean | null
          life_stages?: string[] | null
          name: string
          name_az?: string | null
          original_price?: number | null
          platform?: string | null
          price?: number | null
          price_updated_at?: string | null
          pros?: string[] | null
          rating?: number | null
          review_count?: number | null
          review_summary?: string | null
          review_summary_az?: string | null
          sort_order?: number | null
          specifications?: Json | null
          store_logo_url?: string | null
          store_name?: string | null
          tags?: string[] | null
          updated_at?: string | null
          video_url?: string | null
        }
        Update: {
          affiliate_url?: string
          category?: string | null
          category_az?: string | null
          cons?: string[] | null
          created_at?: string | null
          currency?: string | null
          description?: string | null
          description_az?: string | null
          id?: string
          image_url?: string | null
          images?: string[] | null
          is_active?: boolean | null
          is_featured?: boolean | null
          life_stages?: string[] | null
          name?: string
          name_az?: string | null
          original_price?: number | null
          platform?: string | null
          price?: number | null
          price_updated_at?: string | null
          pros?: string[] | null
          rating?: number | null
          review_count?: number | null
          review_summary?: string | null
          review_summary_az?: string | null
          sort_order?: number | null
          specifications?: Json | null
          store_logo_url?: string | null
          store_name?: string | null
          tags?: string[] | null
          updated_at?: string | null
          video_url?: string | null
        }
        Relationships: []
      }
      age_ranges: {
        Row: {
          created_at: string | null
          id: string
          is_active: boolean | null
          label: string
          label_az: string | null
          max_months: number | null
          min_months: number | null
          range_key: string
          sort_order: number | null
        }
        Insert: {
          created_at?: string | null
          id?: string
          is_active?: boolean | null
          label: string
          label_az?: string | null
          max_months?: number | null
          min_months?: number | null
          range_key: string
          sort_order?: number | null
        }
        Update: {
          created_at?: string | null
          id?: string
          is_active?: boolean | null
          label?: string
          label_az?: string | null
          max_months?: number | null
          min_months?: number | null
          range_key?: string
          sort_order?: number | null
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
      app_branding: {
        Row: {
          created_at: string | null
          description: string | null
          id: string
          image_url: string | null
          key: string
          updated_at: string | null
        }
        Insert: {
          created_at?: string | null
          description?: string | null
          id?: string
          image_url?: string | null
          key: string
          updated_at?: string | null
        }
        Update: {
          created_at?: string | null
          description?: string | null
          id?: string
          image_url?: string | null
          key?: string
          updated_at?: string | null
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
      apple_auth_notifications: {
        Row: {
          apple_user_id: string
          created_at: string
          email: string | null
          event_time: string | null
          event_type: string
          id: string
          is_private_email: boolean | null
          raw_payload: string | null
        }
        Insert: {
          apple_user_id: string
          created_at?: string
          email?: string | null
          event_time?: string | null
          event_type: string
          id?: string
          is_private_email?: boolean | null
          raw_payload?: string | null
        }
        Update: {
          apple_user_id?: string
          created_at?: string
          email?: string | null
          event_time?: string | null
          event_type?: string
          id?: string
          is_private_email?: boolean | null
          raw_payload?: string | null
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
      baby_growth: {
        Row: {
          created_at: string
          entry_date: string
          head_cm: number | null
          height_cm: number | null
          id: string
          notes: string | null
          user_id: string
          weight_kg: number | null
        }
        Insert: {
          created_at?: string
          entry_date?: string
          head_cm?: number | null
          height_cm?: number | null
          id?: string
          notes?: string | null
          user_id: string
          weight_kg?: number | null
        }
        Update: {
          created_at?: string
          entry_date?: string
          head_cm?: number | null
          height_cm?: number | null
          id?: string
          notes?: string | null
          user_id?: string
          weight_kg?: number | null
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
      banners: {
        Row: {
          background_color: string | null
          banner_type: string | null
          button_text: string | null
          button_text_az: string | null
          click_count: number | null
          created_at: string | null
          description: string | null
          description_az: string | null
          end_date: string | null
          id: string
          image_url: string | null
          is_active: boolean | null
          is_premium_only: boolean | null
          link_type: string | null
          link_url: string | null
          placement: string
          sort_order: number | null
          start_date: string | null
          text_color: string | null
          title: string
          title_az: string | null
          updated_at: string | null
          view_count: number | null
        }
        Insert: {
          background_color?: string | null
          banner_type?: string | null
          button_text?: string | null
          button_text_az?: string | null
          click_count?: number | null
          created_at?: string | null
          description?: string | null
          description_az?: string | null
          end_date?: string | null
          id?: string
          image_url?: string | null
          is_active?: boolean | null
          is_premium_only?: boolean | null
          link_type?: string | null
          link_url?: string | null
          placement: string
          sort_order?: number | null
          start_date?: string | null
          text_color?: string | null
          title: string
          title_az?: string | null
          updated_at?: string | null
          view_count?: number | null
        }
        Update: {
          background_color?: string | null
          banner_type?: string | null
          button_text?: string | null
          button_text_az?: string | null
          click_count?: number | null
          created_at?: string | null
          description?: string | null
          description_az?: string | null
          end_date?: string | null
          id?: string
          image_url?: string | null
          is_active?: boolean | null
          is_premium_only?: boolean | null
          link_type?: string | null
          link_url?: string | null
          placement?: string
          sort_order?: number | null
          start_date?: string | null
          text_color?: string | null
          title?: string
          title_az?: string | null
          updated_at?: string | null
          view_count?: number | null
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
      blood_sugar_logs: {
        Row: {
          created_at: string | null
          id: string
          logged_at: string | null
          meal_context: string | null
          notes: string | null
          reading_type: string
          reading_value: number
          user_id: string
        }
        Insert: {
          created_at?: string | null
          id?: string
          logged_at?: string | null
          meal_context?: string | null
          notes?: string | null
          reading_type?: string
          reading_value: number
          user_id: string
        }
        Update: {
          created_at?: string | null
          id?: string
          logged_at?: string | null
          meal_context?: string | null
          notes?: string | null
          reading_type?: string
          reading_value?: number
          user_id?: string
        }
        Relationships: []
      }
      breathing_exercises: {
        Row: {
          benefits: string[] | null
          benefits_az: string[] | null
          color: string | null
          created_at: string | null
          description: string | null
          description_az: string | null
          exhale_seconds: number
          hold_after_exhale_seconds: number | null
          hold_seconds: number | null
          icon: string | null
          id: string
          inhale_seconds: number
          is_active: boolean | null
          name: string
          name_az: string | null
          sort_order: number | null
          total_cycles: number | null
        }
        Insert: {
          benefits?: string[] | null
          benefits_az?: string[] | null
          color?: string | null
          created_at?: string | null
          description?: string | null
          description_az?: string | null
          exhale_seconds?: number
          hold_after_exhale_seconds?: number | null
          hold_seconds?: number | null
          icon?: string | null
          id?: string
          inhale_seconds?: number
          is_active?: boolean | null
          name: string
          name_az?: string | null
          sort_order?: number | null
          total_cycles?: number | null
        }
        Update: {
          benefits?: string[] | null
          benefits_az?: string[] | null
          color?: string | null
          created_at?: string | null
          description?: string | null
          description_az?: string | null
          exhale_seconds?: number
          hold_after_exhale_seconds?: number | null
          hold_seconds?: number | null
          icon?: string | null
          id?: string
          inhale_seconds?: number
          is_active?: boolean | null
          name?: string
          name_az?: string | null
          sort_order?: number | null
          total_cycles?: number | null
        }
        Relationships: []
      }
      bulk_push_notifications: {
        Row: {
          body: string
          created_at: string | null
          created_by: string | null
          id: string
          scheduled_at: string | null
          sent_at: string | null
          status: string | null
          target_audience: string
          title: string
          total_failed: number | null
          total_sent: number | null
        }
        Insert: {
          body: string
          created_at?: string | null
          created_by?: string | null
          id?: string
          scheduled_at?: string | null
          sent_at?: string | null
          status?: string | null
          target_audience?: string
          title: string
          total_failed?: number | null
          total_sent?: number | null
        }
        Update: {
          body?: string
          created_at?: string | null
          created_by?: string | null
          id?: string
          scheduled_at?: string | null
          sent_at?: string | null
          status?: string | null
          target_audience?: string
          title?: string
          total_failed?: number | null
          total_sent?: number | null
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
      cry_analyses: {
        Row: {
          analysis_result: Json
          audio_duration_seconds: number | null
          confidence_score: number | null
          created_at: string
          cry_type: string | null
          id: string
          user_id: string
        }
        Insert: {
          analysis_result: Json
          audio_duration_seconds?: number | null
          confidence_score?: number | null
          created_at?: string
          cry_type?: string | null
          id?: string
          user_id: string
        }
        Update: {
          analysis_result?: Json
          audio_duration_seconds?: number | null
          confidence_score?: number | null
          created_at?: string
          cry_type?: string | null
          id?: string
          user_id?: string
        }
        Relationships: []
      }
      cry_type_labels: {
        Row: {
          color: string | null
          created_at: string | null
          cry_type: string
          description_az: string | null
          emoji: string | null
          id: string
          is_active: boolean | null
          label: string
          label_az: string | null
          sort_order: number | null
        }
        Insert: {
          color?: string | null
          created_at?: string | null
          cry_type: string
          description_az?: string | null
          emoji?: string | null
          id?: string
          is_active?: boolean | null
          label: string
          label_az?: string | null
          sort_order?: number | null
        }
        Update: {
          color?: string | null
          created_at?: string | null
          cry_type?: string
          description_az?: string | null
          emoji?: string | null
          id?: string
          is_active?: boolean | null
          label?: string
          label_az?: string | null
          sort_order?: number | null
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
      daily_summaries: {
        Row: {
          contraction_count: number | null
          created_at: string
          id: string
          is_sent: boolean | null
          kick_count: number | null
          mood: number | null
          notes: string | null
          partner_user_id: string
          sent_at: string | null
          summary_date: string
          symptoms: string[] | null
          user_id: string
          water_intake: number | null
        }
        Insert: {
          contraction_count?: number | null
          created_at?: string
          id?: string
          is_sent?: boolean | null
          kick_count?: number | null
          mood?: number | null
          notes?: string | null
          partner_user_id: string
          sent_at?: string | null
          summary_date?: string
          symptoms?: string[] | null
          user_id: string
          water_intake?: number | null
        }
        Update: {
          contraction_count?: number | null
          created_at?: string
          id?: string
          is_sent?: boolean | null
          kick_count?: number | null
          mood?: number | null
          notes?: string | null
          partner_user_id?: string
          sent_at?: string | null
          summary_date?: string
          symptoms?: string[] | null
          user_id?: string
          water_intake?: number | null
        }
        Relationships: []
      }
      day_labels: {
        Row: {
          created_at: string | null
          day_key: string
          day_number: number
          id: string
          is_active: boolean | null
          label: string
          label_az: string | null
          short_label: string | null
          short_label_az: string | null
        }
        Insert: {
          created_at?: string | null
          day_key: string
          day_number: number
          id?: string
          is_active?: boolean | null
          label: string
          label_az?: string | null
          short_label?: string | null
          short_label_az?: string | null
        }
        Update: {
          created_at?: string | null
          day_key?: string
          day_number?: number
          id?: string
          is_active?: boolean | null
          label?: string
          label_az?: string | null
          short_label?: string | null
          short_label_az?: string | null
        }
        Relationships: []
      }
      development_tips: {
        Row: {
          age_group: string
          content: string
          content_az: string | null
          created_at: string | null
          emoji: string
          id: string
          is_active: boolean | null
          sort_order: number | null
          title: string
          title_az: string | null
        }
        Insert: {
          age_group: string
          content: string
          content_az?: string | null
          created_at?: string | null
          emoji: string
          id?: string
          is_active?: boolean | null
          sort_order?: number | null
          title: string
          title_az?: string | null
        }
        Update: {
          age_group?: string
          content?: string
          content_az?: string | null
          created_at?: string | null
          emoji?: string
          id?: string
          is_active?: boolean | null
          sort_order?: number | null
          title?: string
          title_az?: string | null
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
      epds_assessments: {
        Row: {
          answers: Json
          completed_at: string | null
          id: string
          recommendation: string | null
          risk_level: string
          total_score: number
          user_id: string
        }
        Insert: {
          answers: Json
          completed_at?: string | null
          id?: string
          recommendation?: string | null
          risk_level: string
          total_score: number
          user_id: string
        }
        Update: {
          answers?: Json
          completed_at?: string | null
          id?: string
          recommendation?: string | null
          risk_level?: string
          total_score?: number
          user_id?: string
        }
        Relationships: []
      }
      epds_questions: {
        Row: {
          created_at: string | null
          id: string
          is_active: boolean | null
          is_reverse_scored: boolean | null
          options: Json
          question_number: number
          question_text: string
          question_text_az: string | null
          sort_order: number | null
        }
        Insert: {
          created_at?: string | null
          id?: string
          is_active?: boolean | null
          is_reverse_scored?: boolean | null
          options?: Json
          question_number: number
          question_text: string
          question_text_az?: string | null
          sort_order?: number | null
        }
        Update: {
          created_at?: string | null
          id?: string
          is_active?: boolean | null
          is_reverse_scored?: boolean | null
          options?: Json
          question_number?: number
          question_text?: string
          question_text_az?: string | null
          sort_order?: number | null
        }
        Relationships: []
      }
      exercise_daily_tips: {
        Row: {
          created_at: string | null
          emoji: string | null
          id: string
          is_active: boolean | null
          sort_order: number | null
          tip: string
          tip_az: string | null
          trimester: number[] | null
        }
        Insert: {
          created_at?: string | null
          emoji?: string | null
          id?: string
          is_active?: boolean | null
          sort_order?: number | null
          tip: string
          tip_az?: string | null
          trimester?: number[] | null
        }
        Update: {
          created_at?: string | null
          emoji?: string | null
          id?: string
          is_active?: boolean | null
          sort_order?: number | null
          tip?: string
          tip_az?: string | null
          trimester?: number[] | null
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
      fairy_tale_themes: {
        Row: {
          cover_image_url: string | null
          description: string | null
          description_az: string | null
          emoji: string | null
          id: string
          is_active: boolean | null
          name: string
          name_az: string
          sort_order: number | null
        }
        Insert: {
          cover_image_url?: string | null
          description?: string | null
          description_az?: string | null
          emoji?: string | null
          id?: string
          is_active?: boolean | null
          name: string
          name_az: string
          sort_order?: number | null
        }
        Update: {
          cover_image_url?: string | null
          description?: string | null
          description_az?: string | null
          emoji?: string | null
          id?: string
          is_active?: boolean | null
          name?: string
          name_az?: string
          sort_order?: number | null
        }
        Relationships: []
      }
      fairy_tales: {
        Row: {
          audio_url: string | null
          child_name: string | null
          content: string
          cover_image_url: string | null
          created_at: string | null
          duration_minutes: number | null
          hero: string | null
          id: string
          is_favorite: boolean | null
          moral_lesson: string | null
          play_count: number | null
          theme: string | null
          title: string
          user_id: string
        }
        Insert: {
          audio_url?: string | null
          child_name?: string | null
          content: string
          cover_image_url?: string | null
          created_at?: string | null
          duration_minutes?: number | null
          hero?: string | null
          id?: string
          is_favorite?: boolean | null
          moral_lesson?: string | null
          play_count?: number | null
          theme?: string | null
          title: string
          user_id: string
        }
        Update: {
          audio_url?: string | null
          child_name?: string | null
          content?: string
          cover_image_url?: string | null
          created_at?: string | null
          duration_minutes?: number | null
          hero?: string | null
          id?: string
          is_favorite?: boolean | null
          moral_lesson?: string | null
          play_count?: number | null
          theme?: string | null
          title?: string
          user_id?: string
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
      first_aid_scenarios: {
        Row: {
          color: string | null
          description: string | null
          description_az: string | null
          emergency_level: string | null
          icon: string | null
          id: string
          is_active: boolean | null
          sort_order: number | null
          title: string
          title_az: string
        }
        Insert: {
          color?: string | null
          description?: string | null
          description_az?: string | null
          emergency_level?: string | null
          icon?: string | null
          id?: string
          is_active?: boolean | null
          sort_order?: number | null
          title: string
          title_az: string
        }
        Update: {
          color?: string | null
          description?: string | null
          description_az?: string | null
          emergency_level?: string | null
          icon?: string | null
          id?: string
          is_active?: boolean | null
          sort_order?: number | null
          title?: string
          title_az?: string
        }
        Relationships: []
      }
      first_aid_steps: {
        Row: {
          animation_url: string | null
          audio_url: string | null
          duration_seconds: number | null
          id: string
          image_url: string | null
          instruction: string
          instruction_az: string
          is_critical: boolean | null
          scenario_id: string
          step_number: number
          title: string
          title_az: string
        }
        Insert: {
          animation_url?: string | null
          audio_url?: string | null
          duration_seconds?: number | null
          id?: string
          image_url?: string | null
          instruction: string
          instruction_az: string
          is_critical?: boolean | null
          scenario_id: string
          step_number: number
          title: string
          title_az: string
        }
        Update: {
          animation_url?: string | null
          audio_url?: string | null
          duration_seconds?: number | null
          id?: string
          image_url?: string | null
          instruction?: string
          instruction_az?: string
          is_critical?: boolean | null
          scenario_id?: string
          step_number?: number
          title?: string
          title_az?: string
        }
        Relationships: [
          {
            foreignKeyName: "first_aid_steps_scenario_id_fkey"
            columns: ["scenario_id"]
            isOneToOne: false
            referencedRelation: "first_aid_scenarios"
            referencedColumns: ["id"]
          },
        ]
      }
      flow_insights: {
        Row: {
          category: string | null
          content: string
          content_az: string | null
          created_at: string | null
          emoji: string | null
          id: string
          is_active: boolean | null
          phase: string | null
          sort_order: number | null
          title: string
          title_az: string | null
        }
        Insert: {
          category?: string | null
          content: string
          content_az?: string | null
          created_at?: string | null
          emoji?: string | null
          id?: string
          is_active?: boolean | null
          phase?: string | null
          sort_order?: number | null
          title: string
          title_az?: string | null
        }
        Update: {
          category?: string | null
          content?: string
          content_az?: string | null
          created_at?: string | null
          emoji?: string | null
          id?: string
          is_active?: boolean | null
          phase?: string | null
          sort_order?: number | null
          title?: string
          title_az?: string | null
        }
        Relationships: []
      }
      flow_phase_tips: {
        Row: {
          category: string | null
          created_at: string | null
          emoji: string | null
          id: string
          is_active: boolean | null
          phase: string
          sort_order: number | null
          tip_text: string
          tip_text_az: string | null
        }
        Insert: {
          category?: string | null
          created_at?: string | null
          emoji?: string | null
          id?: string
          is_active?: boolean | null
          phase: string
          sort_order?: number | null
          tip_text: string
          tip_text_az?: string | null
        }
        Update: {
          category?: string | null
          created_at?: string | null
          emoji?: string | null
          id?: string
          is_active?: boolean | null
          phase?: string
          sort_order?: number | null
          tip_text?: string
          tip_text_az?: string | null
        }
        Relationships: []
      }
      flow_symptoms: {
        Row: {
          category: string | null
          created_at: string | null
          emoji: string
          id: string
          is_active: boolean | null
          label: string
          label_az: string | null
          sort_order: number | null
          symptom_id: string
        }
        Insert: {
          category?: string | null
          created_at?: string | null
          emoji: string
          id?: string
          is_active?: boolean | null
          label: string
          label_az?: string | null
          sort_order?: number | null
          symptom_id: string
        }
        Update: {
          category?: string | null
          created_at?: string | null
          emoji?: string
          id?: string
          is_active?: boolean | null
          label?: string
          label_az?: string | null
          sort_order?: number | null
          symptom_id?: string
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
      healthcare_providers: {
        Row: {
          accepts_reservations: boolean | null
          address: string | null
          address_az: string | null
          city: string | null
          created_at: string | null
          description: string | null
          description_az: string | null
          email: string | null
          id: string
          image_url: string | null
          is_active: boolean | null
          is_featured: boolean | null
          latitude: number | null
          longitude: number | null
          name: string
          name_az: string | null
          phone: string | null
          provider_type: string
          rating: number | null
          review_count: number | null
          services: Json | null
          sort_order: number | null
          specialty: string | null
          specialty_az: string | null
          updated_at: string | null
          website: string | null
          working_hours: Json | null
        }
        Insert: {
          accepts_reservations?: boolean | null
          address?: string | null
          address_az?: string | null
          city?: string | null
          created_at?: string | null
          description?: string | null
          description_az?: string | null
          email?: string | null
          id?: string
          image_url?: string | null
          is_active?: boolean | null
          is_featured?: boolean | null
          latitude?: number | null
          longitude?: number | null
          name: string
          name_az?: string | null
          phone?: string | null
          provider_type?: string
          rating?: number | null
          review_count?: number | null
          services?: Json | null
          sort_order?: number | null
          specialty?: string | null
          specialty_az?: string | null
          updated_at?: string | null
          website?: string | null
          working_hours?: Json | null
        }
        Update: {
          accepts_reservations?: boolean | null
          address?: string | null
          address_az?: string | null
          city?: string | null
          created_at?: string | null
          description?: string | null
          description_az?: string | null
          email?: string | null
          id?: string
          image_url?: string | null
          is_active?: boolean | null
          is_featured?: boolean | null
          latitude?: number | null
          longitude?: number | null
          name?: string
          name_az?: string | null
          phone?: string | null
          provider_type?: string
          rating?: number | null
          review_count?: number | null
          services?: Json | null
          sort_order?: number | null
          specialty?: string | null
          specialty_az?: string | null
          updated_at?: string | null
          website?: string | null
          working_hours?: Json | null
        }
        Relationships: []
      }
      horoscope_elements: {
        Row: {
          color: string
          created_at: string | null
          element_key: string
          icon: string
          id: string
          is_active: boolean | null
          name: string
          name_az: string | null
          sort_order: number | null
        }
        Insert: {
          color?: string
          created_at?: string | null
          element_key: string
          icon?: string
          id?: string
          is_active?: boolean | null
          name: string
          name_az?: string | null
          sort_order?: number | null
        }
        Update: {
          color?: string
          created_at?: string | null
          element_key?: string
          icon?: string
          id?: string
          is_active?: boolean | null
          name?: string
          name_az?: string | null
          sort_order?: number | null
        }
        Relationships: []
      }
      horoscope_loading_steps: {
        Row: {
          created_at: string | null
          icon: string
          id: string
          is_active: boolean | null
          label: string
          label_az: string | null
          sort_order: number | null
          step_key: string
        }
        Insert: {
          created_at?: string | null
          icon?: string
          id?: string
          is_active?: boolean | null
          label: string
          label_az?: string | null
          sort_order?: number | null
          step_key: string
        }
        Update: {
          created_at?: string | null
          icon?: string
          id?: string
          is_active?: boolean | null
          label?: string
          label_az?: string | null
          sort_order?: number | null
          step_key?: string
        }
        Relationships: []
      }
      horoscope_readings: {
        Row: {
          baby_sign: string | null
          compatibility_result: Json | null
          created_at: string | null
          dad_sign: string | null
          id: string
          mom_sign: string | null
          shared_count: number | null
          user_id: string
        }
        Insert: {
          baby_sign?: string | null
          compatibility_result?: Json | null
          created_at?: string | null
          dad_sign?: string | null
          id?: string
          mom_sign?: string | null
          shared_count?: number | null
          user_id: string
        }
        Update: {
          baby_sign?: string | null
          compatibility_result?: Json | null
          created_at?: string | null
          dad_sign?: string | null
          id?: string
          mom_sign?: string | null
          shared_count?: number | null
          user_id?: string
        }
        Relationships: []
      }
      hospital_bag_items: {
        Row: {
          added_by: string | null
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
          added_by?: string | null
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
          added_by?: string | null
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
      legal_documents: {
        Row: {
          content: string
          content_az: string | null
          created_at: string | null
          document_type: string
          effective_date: string | null
          id: string
          is_active: boolean | null
          title: string
          title_az: string | null
          updated_at: string | null
          version: string | null
        }
        Insert: {
          content: string
          content_az?: string | null
          created_at?: string | null
          document_type: string
          effective_date?: string | null
          id?: string
          is_active?: boolean | null
          title: string
          title_az?: string | null
          updated_at?: string | null
          version?: string | null
        }
        Update: {
          content?: string
          content_az?: string | null
          created_at?: string | null
          document_type?: string
          effective_date?: string | null
          id?: string
          is_active?: boolean | null
          title?: string
          title_az?: string | null
          updated_at?: string | null
          version?: string | null
        }
        Relationships: []
      }
      marketplace_categories: {
        Row: {
          category_key: string
          created_at: string | null
          emoji: string | null
          id: string
          is_active: boolean | null
          label: string
          label_az: string | null
          sort_order: number | null
        }
        Insert: {
          category_key: string
          created_at?: string | null
          emoji?: string | null
          id?: string
          is_active?: boolean | null
          label: string
          label_az?: string | null
          sort_order?: number | null
        }
        Update: {
          category_key?: string
          created_at?: string | null
          emoji?: string | null
          id?: string
          is_active?: boolean | null
          label?: string
          label_az?: string | null
          sort_order?: number | null
        }
        Relationships: []
      }
      marketplace_listings: {
        Row: {
          admin_notes: string | null
          age_range: string | null
          category: string
          condition: string
          created_at: string
          description: string | null
          id: string
          images: string[] | null
          is_free: boolean | null
          location_city: string | null
          price: number | null
          reviewed_at: string | null
          reviewed_by: string | null
          status: string
          title: string
          updated_at: string
          user_id: string
        }
        Insert: {
          admin_notes?: string | null
          age_range?: string | null
          category?: string
          condition?: string
          created_at?: string
          description?: string | null
          id?: string
          images?: string[] | null
          is_free?: boolean | null
          location_city?: string | null
          price?: number | null
          reviewed_at?: string | null
          reviewed_by?: string | null
          status?: string
          title: string
          updated_at?: string
          user_id: string
        }
        Update: {
          admin_notes?: string | null
          age_range?: string | null
          category?: string
          condition?: string
          created_at?: string
          description?: string | null
          id?: string
          images?: string[] | null
          is_free?: boolean | null
          location_city?: string | null
          price?: number | null
          reviewed_at?: string | null
          reviewed_by?: string | null
          status?: string
          title?: string
          updated_at?: string
          user_id?: string
        }
        Relationships: []
      }
      marketplace_messages: {
        Row: {
          content: string
          created_at: string
          id: string
          is_read: boolean | null
          listing_id: string
          receiver_id: string
          sender_id: string
        }
        Insert: {
          content: string
          created_at?: string
          id?: string
          is_read?: boolean | null
          listing_id: string
          receiver_id: string
          sender_id: string
        }
        Update: {
          content?: string
          created_at?: string
          id?: string
          is_read?: boolean | null
          listing_id?: string
          receiver_id?: string
          sender_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "marketplace_messages_listing_id_fkey"
            columns: ["listing_id"]
            isOneToOne: false
            referencedRelation: "marketplace_listings"
            referencedColumns: ["id"]
          },
        ]
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
      mental_health_resources: {
        Row: {
          address: string | null
          address_az: string | null
          description: string | null
          description_az: string | null
          id: string
          is_active: boolean | null
          is_emergency: boolean | null
          name: string
          name_az: string
          phone: string | null
          resource_type: string
          sort_order: number | null
          website: string | null
        }
        Insert: {
          address?: string | null
          address_az?: string | null
          description?: string | null
          description_az?: string | null
          id?: string
          is_active?: boolean | null
          is_emergency?: boolean | null
          name: string
          name_az: string
          phone?: string | null
          resource_type: string
          sort_order?: number | null
          website?: string | null
        }
        Update: {
          address?: string | null
          address_az?: string | null
          description?: string | null
          description_az?: string | null
          id?: string
          is_active?: boolean | null
          is_emergency?: boolean | null
          name?: string
          name_az?: string
          phone?: string | null
          resource_type?: string
          sort_order?: number | null
          website?: string | null
        }
        Relationships: []
      }
      mom_friendly_places: {
        Row: {
          address: string | null
          address_az: string | null
          avg_rating: number | null
          category: Database["public"]["Enums"]["place_category"]
          created_at: string | null
          created_by: string | null
          description: string | null
          description_az: string | null
          has_breastfeeding_room: boolean | null
          has_changing_table: boolean | null
          has_elevator: boolean | null
          has_high_chair: boolean | null
          has_kids_menu: boolean | null
          has_parking: boolean | null
          has_play_area: boolean | null
          has_ramp: boolean | null
          has_stroller_access: boolean | null
          id: string
          image_url: string | null
          is_active: boolean | null
          is_verified: boolean | null
          latitude: number
          longitude: number
          name: string
          name_az: string | null
          phone: string | null
          review_count: number | null
          updated_at: string | null
          verified_count: number | null
          website: string | null
        }
        Insert: {
          address?: string | null
          address_az?: string | null
          avg_rating?: number | null
          category?: Database["public"]["Enums"]["place_category"]
          created_at?: string | null
          created_by?: string | null
          description?: string | null
          description_az?: string | null
          has_breastfeeding_room?: boolean | null
          has_changing_table?: boolean | null
          has_elevator?: boolean | null
          has_high_chair?: boolean | null
          has_kids_menu?: boolean | null
          has_parking?: boolean | null
          has_play_area?: boolean | null
          has_ramp?: boolean | null
          has_stroller_access?: boolean | null
          id?: string
          image_url?: string | null
          is_active?: boolean | null
          is_verified?: boolean | null
          latitude: number
          longitude: number
          name: string
          name_az?: string | null
          phone?: string | null
          review_count?: number | null
          updated_at?: string | null
          verified_count?: number | null
          website?: string | null
        }
        Update: {
          address?: string | null
          address_az?: string | null
          avg_rating?: number | null
          category?: Database["public"]["Enums"]["place_category"]
          created_at?: string | null
          created_by?: string | null
          description?: string | null
          description_az?: string | null
          has_breastfeeding_room?: boolean | null
          has_changing_table?: boolean | null
          has_elevator?: boolean | null
          has_high_chair?: boolean | null
          has_kids_menu?: boolean | null
          has_parking?: boolean | null
          has_play_area?: boolean | null
          has_ramp?: boolean | null
          has_stroller_access?: boolean | null
          id?: string
          image_url?: string | null
          is_active?: boolean | null
          is_verified?: boolean | null
          latitude?: number
          longitude?: number
          name?: string
          name_az?: string | null
          phone?: string | null
          review_count?: number | null
          updated_at?: string | null
          verified_count?: number | null
          website?: string | null
        }
        Relationships: []
      }
      mood_checkins: {
        Row: {
          checked_at: string | null
          created_at: string | null
          id: string
          mood_level: number
          mood_type: string | null
          notes: string | null
          user_id: string
        }
        Insert: {
          checked_at?: string | null
          created_at?: string | null
          id?: string
          mood_level: number
          mood_type?: string | null
          notes?: string | null
          user_id: string
        }
        Update: {
          checked_at?: string | null
          created_at?: string | null
          id?: string
          mood_level?: number
          mood_type?: string | null
          notes?: string | null
          user_id?: string
        }
        Relationships: []
      }
      mood_levels: {
        Row: {
          color: string | null
          created_at: string | null
          emoji: string
          id: string
          is_active: boolean | null
          label: string
          label_az: string | null
          mood_value: number
          sort_order: number | null
        }
        Insert: {
          color?: string | null
          created_at?: string | null
          emoji: string
          id?: string
          is_active?: boolean | null
          label: string
          label_az?: string | null
          mood_value: number
          sort_order?: number | null
        }
        Update: {
          color?: string | null
          created_at?: string | null
          emoji?: string
          id?: string
          is_active?: boolean | null
          label?: string
          label_az?: string | null
          mood_value?: number
          sort_order?: number | null
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
      name_votes: {
        Row: {
          created_at: string
          gender: string
          id: string
          meaning: string | null
          name: string
          origin: string | null
          partner_user_id: string | null
          user_id: string
          vote: string
        }
        Insert: {
          created_at?: string
          gender?: string
          id?: string
          meaning?: string | null
          name: string
          origin?: string | null
          partner_user_id?: string | null
          user_id: string
          vote: string
        }
        Update: {
          created_at?: string
          gender?: string
          id?: string
          meaning?: string | null
          name?: string
          origin?: string | null
          partner_user_id?: string | null
          user_id?: string
          vote?: string
        }
        Relationships: []
      }
      noise_measurements: {
        Row: {
          created_at: string
          decibel_level: number
          id: string
          is_too_loud: boolean | null
          room_name: string | null
          user_id: string
        }
        Insert: {
          created_at?: string
          decibel_level: number
          id?: string
          is_too_loud?: boolean | null
          room_name?: string | null
          user_id: string
        }
        Update: {
          created_at?: string
          decibel_level?: number
          id?: string
          is_too_loud?: boolean | null
          room_name?: string | null
          user_id?: string
        }
        Relationships: []
      }
      noise_thresholds: {
        Row: {
          color: string | null
          created_at: string | null
          description: string | null
          description_az: string | null
          emoji: string | null
          id: string
          is_active: boolean | null
          label: string
          label_az: string | null
          max_db: number | null
          min_db: number
          sort_order: number | null
          threshold_key: string
        }
        Insert: {
          color?: string | null
          created_at?: string | null
          description?: string | null
          description_az?: string | null
          emoji?: string | null
          id?: string
          is_active?: boolean | null
          label: string
          label_az?: string | null
          max_db?: number | null
          min_db: number
          sort_order?: number | null
          threshold_key: string
        }
        Update: {
          color?: string | null
          created_at?: string | null
          description?: string | null
          description_az?: string | null
          emoji?: string | null
          id?: string
          is_active?: boolean | null
          label?: string
          label_az?: string | null
          max_db?: number | null
          min_db?: number
          sort_order?: number | null
          threshold_key?: string
        }
        Relationships: []
      }
      notification_send_log: {
        Row: {
          body: string
          id: string
          notification_id: string | null
          sent_at: string | null
          status: string | null
          title: string
          user_id: string
        }
        Insert: {
          body: string
          id?: string
          notification_id?: string | null
          sent_at?: string | null
          status?: string | null
          title: string
          user_id: string
        }
        Update: {
          body?: string
          id?: string
          notification_id?: string | null
          sent_at?: string | null
          status?: string | null
          title?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "notification_send_log_notification_id_fkey"
            columns: ["notification_id"]
            isOneToOne: false
            referencedRelation: "scheduled_notifications"
            referencedColumns: ["id"]
          },
        ]
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
      partner_achievements: {
        Row: {
          achievement_key: string
          created_at: string | null
          description: string | null
          description_az: string | null
          emoji: string
          id: string
          is_active: boolean | null
          name: string
          name_az: string | null
          sort_order: number | null
          unlock_condition: string | null
          unlock_threshold: number | null
        }
        Insert: {
          achievement_key: string
          created_at?: string | null
          description?: string | null
          description_az?: string | null
          emoji?: string
          id?: string
          is_active?: boolean | null
          name: string
          name_az?: string | null
          sort_order?: number | null
          unlock_condition?: string | null
          unlock_threshold?: number | null
        }
        Update: {
          achievement_key?: string
          created_at?: string | null
          description?: string | null
          description_az?: string | null
          emoji?: string
          id?: string
          is_active?: boolean | null
          name?: string
          name_az?: string | null
          sort_order?: number | null
          unlock_condition?: string | null
          unlock_threshold?: number | null
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
      partner_menu_items: {
        Row: {
          created_at: string | null
          icon_name: string
          id: string
          is_active: boolean | null
          label: string
          label_az: string | null
          menu_key: string
          route: string
          sort_order: number | null
        }
        Insert: {
          created_at?: string | null
          icon_name?: string
          id?: string
          is_active?: boolean | null
          label: string
          label_az?: string | null
          menu_key: string
          route: string
          sort_order?: number | null
        }
        Update: {
          created_at?: string | null
          icon_name?: string
          id?: string
          is_active?: boolean | null
          label?: string
          label_az?: string | null
          menu_key?: string
          route?: string
          sort_order?: number | null
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
      place_amenities: {
        Row: {
          amenity_key: string
          created_at: string | null
          emoji: string | null
          id: string
          is_active: boolean | null
          label: string
          label_az: string | null
          sort_order: number | null
        }
        Insert: {
          amenity_key: string
          created_at?: string | null
          emoji?: string | null
          id?: string
          is_active?: boolean | null
          label: string
          label_az?: string | null
          sort_order?: number | null
        }
        Update: {
          amenity_key?: string
          created_at?: string | null
          emoji?: string | null
          id?: string
          is_active?: boolean | null
          label?: string
          label_az?: string | null
          sort_order?: number | null
        }
        Relationships: []
      }
      place_categories: {
        Row: {
          category_key: string
          color_gradient: string | null
          created_at: string | null
          icon_name: string
          id: string
          is_active: boolean | null
          label: string
          label_az: string | null
          sort_order: number | null
        }
        Insert: {
          category_key: string
          color_gradient?: string | null
          created_at?: string | null
          icon_name?: string
          id?: string
          is_active?: boolean | null
          label: string
          label_az?: string | null
          sort_order?: number | null
        }
        Update: {
          category_key?: string
          color_gradient?: string | null
          created_at?: string | null
          icon_name?: string
          id?: string
          is_active?: boolean | null
          label?: string
          label_az?: string | null
          sort_order?: number | null
        }
        Relationships: []
      }
      place_reviews: {
        Row: {
          accessibility_rating: number | null
          cleanliness_rating: number | null
          comment: string | null
          created_at: string | null
          id: string
          is_verified: boolean | null
          place_id: string
          rating: number
          staff_rating: number | null
          user_id: string
        }
        Insert: {
          accessibility_rating?: number | null
          cleanliness_rating?: number | null
          comment?: string | null
          created_at?: string | null
          id?: string
          is_verified?: boolean | null
          place_id: string
          rating: number
          staff_rating?: number | null
          user_id: string
        }
        Update: {
          accessibility_rating?: number | null
          cleanliness_rating?: number | null
          comment?: string | null
          created_at?: string | null
          id?: string
          is_verified?: boolean | null
          place_id?: string
          rating?: number
          staff_rating?: number | null
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "place_reviews_place_id_fkey"
            columns: ["place_id"]
            isOneToOne: false
            referencedRelation: "mom_friendly_places"
            referencedColumns: ["id"]
          },
        ]
      }
      place_verifications: {
        Row: {
          amenity_verified: string
          created_at: string | null
          id: string
          is_confirmed: boolean
          place_id: string
          user_id: string
        }
        Insert: {
          amenity_verified: string
          created_at?: string | null
          id?: string
          is_confirmed: boolean
          place_id: string
          user_id: string
        }
        Update: {
          amenity_verified?: string
          created_at?: string | null
          id?: string
          is_confirmed?: boolean
          place_id?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "place_verifications_place_id_fkey"
            columns: ["place_id"]
            isOneToOne: false
            referencedRelation: "mom_friendly_places"
            referencedColumns: ["id"]
          },
        ]
      }
      play_activities: {
        Row: {
          created_at: string | null
          description: string | null
          description_az: string | null
          difficulty_level: string | null
          duration_minutes: number | null
          id: string
          image_url: string | null
          instructions: string | null
          instructions_az: string | null
          is_active: boolean | null
          max_age_days: number
          min_age_days: number
          required_items: string[] | null
          skill_tags: string[] | null
          sort_order: number | null
          title: string
          title_az: string
          video_url: string | null
        }
        Insert: {
          created_at?: string | null
          description?: string | null
          description_az?: string | null
          difficulty_level?: string | null
          duration_minutes?: number | null
          id?: string
          image_url?: string | null
          instructions?: string | null
          instructions_az?: string | null
          is_active?: boolean | null
          max_age_days?: number
          min_age_days?: number
          required_items?: string[] | null
          skill_tags?: string[] | null
          sort_order?: number | null
          title: string
          title_az: string
          video_url?: string | null
        }
        Update: {
          created_at?: string | null
          description?: string | null
          description_az?: string | null
          difficulty_level?: string | null
          duration_minutes?: number | null
          id?: string
          image_url?: string | null
          instructions?: string | null
          instructions_az?: string | null
          is_active?: boolean | null
          max_age_days?: number
          min_age_days?: number
          required_items?: string[] | null
          skill_tags?: string[] | null
          sort_order?: number | null
          title?: string
          title_az?: string
          video_url?: string | null
        }
        Relationships: []
      }
      play_activity_logs: {
        Row: {
          activity_id: string
          completed_at: string | null
          id: string
          notes: string | null
          rating: number | null
          user_id: string
        }
        Insert: {
          activity_id: string
          completed_at?: string | null
          id?: string
          notes?: string | null
          rating?: number | null
          user_id: string
        }
        Update: {
          activity_id?: string
          completed_at?: string | null
          id?: string
          notes?: string | null
          rating?: number | null
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "play_activity_logs_activity_id_fkey"
            columns: ["activity_id"]
            isOneToOne: false
            referencedRelation: "play_activities"
            referencedColumns: ["id"]
          },
        ]
      }
      play_inventory_items: {
        Row: {
          category: string | null
          emoji: string | null
          id: string
          is_active: boolean | null
          name: string
          name_az: string
          sort_order: number | null
        }
        Insert: {
          category?: string | null
          emoji?: string | null
          id?: string
          is_active?: boolean | null
          name: string
          name_az: string
          sort_order?: number | null
        }
        Update: {
          category?: string | null
          emoji?: string | null
          id?: string
          is_active?: boolean | null
          name?: string
          name_az?: string
          sort_order?: number | null
        }
        Relationships: []
      }
      poop_analyses: {
        Row: {
          analysis_result: Json
          color_detected: string | null
          concern_level: string | null
          created_at: string
          id: string
          image_url: string | null
          is_normal: boolean | null
          user_id: string
        }
        Insert: {
          analysis_result: Json
          color_detected?: string | null
          concern_level?: string | null
          created_at?: string
          id?: string
          image_url?: string | null
          is_normal?: boolean | null
          user_id: string
        }
        Update: {
          analysis_result?: Json
          color_detected?: string | null
          concern_level?: string | null
          created_at?: string
          id?: string
          image_url?: string | null
          is_normal?: boolean | null
          user_id?: string
        }
        Relationships: []
      }
      poop_color_labels: {
        Row: {
          color_key: string
          created_at: string | null
          description_az: string | null
          emoji: string | null
          hex_color: string | null
          id: string
          is_active: boolean | null
          label: string
          label_az: string | null
          sort_order: number | null
          status: string | null
        }
        Insert: {
          color_key: string
          created_at?: string | null
          description_az?: string | null
          emoji?: string | null
          hex_color?: string | null
          id?: string
          is_active?: boolean | null
          label: string
          label_az?: string | null
          sort_order?: number | null
          status?: string | null
        }
        Update: {
          color_key?: string
          created_at?: string | null
          description_az?: string | null
          emoji?: string | null
          hex_color?: string | null
          id?: string
          is_active?: boolean | null
          label?: string
          label_az?: string | null
          sort_order?: number | null
          status?: string | null
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
      pregnancy_album_photos: {
        Row: {
          caption: string | null
          created_at: string | null
          id: string
          month_number: number
          photo_date: string | null
          photo_url: string
          updated_at: string | null
          user_id: string
          week_number: number
        }
        Insert: {
          caption?: string | null
          created_at?: string | null
          id?: string
          month_number: number
          photo_date?: string | null
          photo_url: string
          updated_at?: string | null
          user_id: string
          week_number: number
        }
        Update: {
          caption?: string | null
          created_at?: string | null
          id?: string
          month_number?: number
          photo_date?: string | null
          photo_url?: string
          updated_at?: string | null
          user_id?: string
          week_number?: number
        }
        Relationships: []
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
      pregnancy_day_notifications: {
        Row: {
          body: string
          created_at: string | null
          day_number: number
          emoji: string | null
          id: string
          is_active: boolean | null
          title: string
          updated_at: string | null
        }
        Insert: {
          body: string
          created_at?: string | null
          day_number: number
          emoji?: string | null
          id?: string
          is_active?: boolean | null
          title: string
          updated_at?: string | null
        }
        Update: {
          body?: string
          created_at?: string | null
          day_number?: number
          emoji?: string | null
          id?: string
          is_active?: boolean | null
          title?: string
          updated_at?: string | null
        }
        Relationships: []
      }
      product_conditions: {
        Row: {
          color: string | null
          condition_key: string
          created_at: string | null
          emoji: string | null
          id: string
          is_active: boolean | null
          label: string
          label_az: string | null
          sort_order: number | null
        }
        Insert: {
          color?: string | null
          condition_key: string
          created_at?: string | null
          emoji?: string | null
          id?: string
          is_active?: boolean | null
          label: string
          label_az?: string | null
          sort_order?: number | null
        }
        Update: {
          color?: string | null
          condition_key?: string
          created_at?: string | null
          emoji?: string | null
          id?: string
          is_active?: boolean | null
          label?: string
          label_az?: string | null
          sort_order?: number | null
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
          apple_email_enabled: boolean | null
          apple_user_id: string | null
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
          pregnancy_day: number | null
          premium_until: string | null
          role: Database["public"]["Enums"]["app_role"]
          start_weight: number | null
          updated_at: string
          user_id: string
        }
        Insert: {
          apple_email_enabled?: boolean | null
          apple_user_id?: string | null
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
          pregnancy_day?: number | null
          premium_until?: string | null
          role?: Database["public"]["Enums"]["app_role"]
          start_weight?: number | null
          updated_at?: string
          user_id: string
        }
        Update: {
          apple_email_enabled?: boolean | null
          apple_user_id?: string | null
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
          pregnancy_day?: number | null
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
      provider_types: {
        Row: {
          color: string | null
          created_at: string | null
          emoji: string | null
          id: string
          is_active: boolean | null
          label: string
          label_az: string | null
          sort_order: number | null
          type_key: string
        }
        Insert: {
          color?: string | null
          created_at?: string | null
          emoji?: string | null
          id?: string
          is_active?: boolean | null
          label: string
          label_az?: string | null
          sort_order?: number | null
          type_key: string
        }
        Update: {
          color?: string | null
          created_at?: string | null
          emoji?: string | null
          id?: string
          is_active?: boolean | null
          label?: string
          label_az?: string | null
          sort_order?: number | null
          type_key?: string
        }
        Relationships: []
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
      quick_actions: {
        Row: {
          age_group: string
          color_from: string
          color_to: string
          created_at: string | null
          icon: string
          id: string
          is_active: boolean | null
          label: string
          label_az: string | null
          life_stage: string
          sort_order: number | null
          tool_key: string
        }
        Insert: {
          age_group?: string
          color_from?: string
          color_to?: string
          created_at?: string | null
          icon: string
          id?: string
          is_active?: boolean | null
          label: string
          label_az?: string | null
          life_stage?: string
          sort_order?: number | null
          tool_key: string
        }
        Update: {
          age_group?: string
          color_from?: string
          color_to?: string
          created_at?: string | null
          icon?: string
          id?: string
          is_active?: boolean | null
          label?: string
          label_az?: string | null
          life_stage?: string
          sort_order?: number | null
          tool_key?: string
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
      saved_affiliate_products: {
        Row: {
          created_at: string | null
          id: string
          product_id: string
          user_id: string
        }
        Insert: {
          created_at?: string | null
          id?: string
          product_id: string
          user_id: string
        }
        Update: {
          created_at?: string | null
          id?: string
          product_id?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "saved_affiliate_products_product_id_fkey"
            columns: ["product_id"]
            isOneToOne: false
            referencedRelation: "affiliate_products"
            referencedColumns: ["id"]
          },
        ]
      }
      scheduled_notifications: {
        Row: {
          body: string
          created_at: string | null
          id: string
          is_active: boolean | null
          notification_type: string | null
          priority: number | null
          target_audience: string
          title: string
          updated_at: string | null
        }
        Insert: {
          body: string
          created_at?: string | null
          id?: string
          is_active?: boolean | null
          notification_type?: string | null
          priority?: number | null
          target_audience?: string
          title: string
          updated_at?: string | null
        }
        Update: {
          body?: string
          created_at?: string | null
          id?: string
          is_active?: boolean | null
          notification_type?: string | null
          priority?: number | null
          target_audience?: string
          title?: string
          updated_at?: string | null
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
      skill_categories: {
        Row: {
          color: string | null
          created_at: string | null
          emoji: string | null
          icon_name: string | null
          id: string
          is_active: boolean | null
          label: string
          label_az: string | null
          skill_key: string
          sort_order: number | null
        }
        Insert: {
          color?: string | null
          created_at?: string | null
          emoji?: string | null
          icon_name?: string | null
          id?: string
          is_active?: boolean | null
          label: string
          label_az?: string | null
          skill_key: string
          sort_order?: number | null
        }
        Update: {
          color?: string | null
          created_at?: string | null
          emoji?: string | null
          icon_name?: string | null
          id?: string
          is_active?: boolean | null
          label?: string
          label_az?: string | null
          skill_key?: string
          sort_order?: number | null
        }
        Relationships: []
      }
      sos_alerts: {
        Row: {
          acknowledged_at: string | null
          alert_type: string
          created_at: string
          id: string
          is_acknowledged: boolean | null
          latitude: number | null
          location_name: string | null
          longitude: number | null
          message: string | null
          receiver_id: string
          sender_id: string
        }
        Insert: {
          acknowledged_at?: string | null
          alert_type?: string
          created_at?: string
          id?: string
          is_acknowledged?: boolean | null
          latitude?: number | null
          location_name?: string | null
          longitude?: number | null
          message?: string | null
          receiver_id: string
          sender_id: string
        }
        Update: {
          acknowledged_at?: string | null
          alert_type?: string
          created_at?: string
          id?: string
          is_acknowledged?: boolean | null
          latitude?: number | null
          location_name?: string | null
          longitude?: number | null
          message?: string | null
          receiver_id?: string
          sender_id?: string
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
      surprise_categories: {
        Row: {
          category_key: string
          color_gradient: string | null
          created_at: string | null
          emoji: string | null
          id: string
          is_active: boolean | null
          label: string
          label_az: string | null
          sort_order: number | null
        }
        Insert: {
          category_key: string
          color_gradient?: string | null
          created_at?: string | null
          emoji?: string | null
          id?: string
          is_active?: boolean | null
          label: string
          label_az?: string | null
          sort_order?: number | null
        }
        Update: {
          category_key?: string
          color_gradient?: string | null
          created_at?: string | null
          emoji?: string | null
          id?: string
          is_active?: boolean | null
          label?: string
          label_az?: string | null
          sort_order?: number | null
        }
        Relationships: []
      }
      surprise_ideas: {
        Row: {
          category: string
          created_at: string | null
          description: string | null
          description_az: string | null
          difficulty: string | null
          emoji: string | null
          icon: string | null
          id: string
          is_active: boolean | null
          points: number | null
          sort_order: number | null
          surprise_key: string | null
          title: string
          title_az: string | null
        }
        Insert: {
          category?: string
          created_at?: string | null
          description?: string | null
          description_az?: string | null
          difficulty?: string | null
          emoji?: string | null
          icon?: string | null
          id?: string
          is_active?: boolean | null
          points?: number | null
          sort_order?: number | null
          surprise_key?: string | null
          title: string
          title_az?: string | null
        }
        Update: {
          category?: string
          created_at?: string | null
          description?: string | null
          description_az?: string | null
          difficulty?: string | null
          emoji?: string | null
          icon?: string | null
          id?: string
          is_active?: boolean | null
          points?: number | null
          sort_order?: number | null
          surprise_key?: string | null
          title?: string
          title_az?: string | null
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
      temperature_emojis: {
        Row: {
          clothing_tip_az: string | null
          created_at: string | null
          emoji: string
          id: string
          is_active: boolean | null
          label: string
          label_az: string | null
          max_temp: number
          min_temp: number
          sort_order: number | null
        }
        Insert: {
          clothing_tip_az?: string | null
          created_at?: string | null
          emoji: string
          id?: string
          is_active?: boolean | null
          label: string
          label_az?: string | null
          max_temp: number
          min_temp: number
          sort_order?: number | null
        }
        Update: {
          clothing_tip_az?: string | null
          created_at?: string | null
          emoji?: string
          id?: string
          is_active?: boolean | null
          label?: string
          label_az?: string | null
          max_temp?: number
          min_temp?: number
          sort_order?: number | null
        }
        Relationships: []
      }
      time_options: {
        Row: {
          created_at: string | null
          hour_value: number | null
          id: string
          is_active: boolean | null
          label: string
          label_az: string | null
          option_key: string
          sort_order: number | null
        }
        Insert: {
          created_at?: string | null
          hour_value?: number | null
          id?: string
          is_active?: boolean | null
          label: string
          label_az?: string | null
          option_key: string
          sort_order?: number | null
        }
        Update: {
          created_at?: string | null
          hour_value?: number | null
          id?: string
          is_active?: boolean | null
          label?: string
          label_az?: string | null
          option_key?: string
          sort_order?: number | null
        }
        Relationships: []
      }
      tool_configs: {
        Row: {
          bg_color: string | null
          bump_active: boolean | null
          bump_locked: boolean | null
          bump_order: number | null
          color: string | null
          created_at: string | null
          description: string | null
          description_az: string | null
          display_name: string | null
          display_name_az: string | null
          flow_active: boolean | null
          flow_locked: boolean | null
          flow_order: number | null
          icon: string
          id: string
          is_active: boolean | null
          is_premium: boolean | null
          life_stages: string[] | null
          min_week: number | null
          mommy_active: boolean | null
          mommy_locked: boolean | null
          mommy_order: number | null
          name: string
          name_az: string | null
          partner_description: string | null
          partner_description_az: string | null
          partner_name: string | null
          partner_name_az: string | null
          premium_limit: number | null
          premium_type: string | null
          requires_partner: boolean | null
          sort_order: number | null
          tool_id: string
          updated_at: string | null
        }
        Insert: {
          bg_color?: string | null
          bump_active?: boolean | null
          bump_locked?: boolean | null
          bump_order?: number | null
          color?: string | null
          created_at?: string | null
          description?: string | null
          description_az?: string | null
          display_name?: string | null
          display_name_az?: string | null
          flow_active?: boolean | null
          flow_locked?: boolean | null
          flow_order?: number | null
          icon?: string
          id?: string
          is_active?: boolean | null
          is_premium?: boolean | null
          life_stages?: string[] | null
          min_week?: number | null
          mommy_active?: boolean | null
          mommy_locked?: boolean | null
          mommy_order?: number | null
          name: string
          name_az?: string | null
          partner_description?: string | null
          partner_description_az?: string | null
          partner_name?: string | null
          partner_name_az?: string | null
          premium_limit?: number | null
          premium_type?: string | null
          requires_partner?: boolean | null
          sort_order?: number | null
          tool_id: string
          updated_at?: string | null
        }
        Update: {
          bg_color?: string | null
          bump_active?: boolean | null
          bump_locked?: boolean | null
          bump_order?: number | null
          color?: string | null
          created_at?: string | null
          description?: string | null
          description_az?: string | null
          display_name?: string | null
          display_name_az?: string | null
          flow_active?: boolean | null
          flow_locked?: boolean | null
          flow_order?: number | null
          icon?: string
          id?: string
          is_active?: boolean | null
          is_premium?: boolean | null
          life_stages?: string[] | null
          min_week?: number | null
          mommy_active?: boolean | null
          mommy_locked?: boolean | null
          mommy_order?: number | null
          name?: string
          name_az?: string | null
          partner_description?: string | null
          partner_description_az?: string | null
          partner_name?: string | null
          partner_name_az?: string | null
          premium_limit?: number | null
          premium_type?: string | null
          requires_partner?: boolean | null
          sort_order?: number | null
          tool_id?: string
          updated_at?: string | null
        }
        Relationships: []
      }
      trimester_info: {
        Row: {
          color_class: string | null
          created_at: string | null
          emoji: string
          id: string
          is_active: boolean | null
          label: string
          label_az: string | null
          trimester_number: number
        }
        Insert: {
          color_class?: string | null
          created_at?: string | null
          emoji?: string
          id?: string
          is_active?: boolean | null
          label: string
          label_az?: string | null
          trimester_number: number
        }
        Update: {
          color_class?: string | null
          created_at?: string | null
          emoji?: string
          id?: string
          is_active?: boolean | null
          label?: string
          label_az?: string | null
          trimester_number?: number
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
      user_badges: {
        Row: {
          badge_type: string
          earned_at: string | null
          id: string
          user_id: string
        }
        Insert: {
          badge_type: string
          earned_at?: string | null
          id?: string
          user_id: string
        }
        Update: {
          badge_type?: string
          earned_at?: string | null
          id?: string
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
      user_play_inventory: {
        Row: {
          created_at: string | null
          id: string
          item_name: string
          item_name_az: string | null
          user_id: string
        }
        Insert: {
          created_at?: string | null
          id?: string
          item_name: string
          item_name_az?: string | null
          user_id: string
        }
        Update: {
          created_at?: string | null
          id?: string
          item_name?: string
          item_name_az?: string | null
          user_id?: string
        }
        Relationships: []
      }
      user_preferences: {
        Row: {
          created_at: string
          daily_push_enabled: boolean | null
          exercise_days: number[] | null
          exercise_reminder: boolean | null
          id: string
          last_push_sent_at: string | null
          last_white_noise_sound: string | null
          notifications_enabled: boolean | null
          push_comments: boolean | null
          push_community: boolean | null
          push_enabled: boolean | null
          push_likes: boolean | null
          push_messages: boolean | null
          silent_hours_enabled: boolean | null
          silent_hours_end: string | null
          silent_hours_start: string | null
          sound_enabled: boolean | null
          updated_at: string
          user_id: string
          vibration_enabled: boolean | null
          vitamin_reminder: boolean | null
          vitamin_time: string | null
          water_reminder: boolean | null
          white_noise_timer: number | null
          white_noise_volume: number | null
        }
        Insert: {
          created_at?: string
          daily_push_enabled?: boolean | null
          exercise_days?: number[] | null
          exercise_reminder?: boolean | null
          id?: string
          last_push_sent_at?: string | null
          last_white_noise_sound?: string | null
          notifications_enabled?: boolean | null
          push_comments?: boolean | null
          push_community?: boolean | null
          push_enabled?: boolean | null
          push_likes?: boolean | null
          push_messages?: boolean | null
          silent_hours_enabled?: boolean | null
          silent_hours_end?: string | null
          silent_hours_start?: string | null
          sound_enabled?: boolean | null
          updated_at?: string
          user_id: string
          vibration_enabled?: boolean | null
          vitamin_reminder?: boolean | null
          vitamin_time?: string | null
          water_reminder?: boolean | null
          white_noise_timer?: number | null
          white_noise_volume?: number | null
        }
        Update: {
          created_at?: string
          daily_push_enabled?: boolean | null
          exercise_days?: number[] | null
          exercise_reminder?: boolean | null
          id?: string
          last_push_sent_at?: string | null
          last_white_noise_sound?: string | null
          notifications_enabled?: boolean | null
          push_comments?: boolean | null
          push_community?: boolean | null
          push_enabled?: boolean | null
          push_likes?: boolean | null
          push_messages?: boolean | null
          silent_hours_enabled?: boolean | null
          silent_hours_end?: string | null
          silent_hours_start?: string | null
          sound_enabled?: boolean | null
          updated_at?: string
          user_id?: string
          vibration_enabled?: boolean | null
          vitamin_reminder?: boolean | null
          vitamin_time?: string | null
          water_reminder?: boolean | null
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
      weather_clothing_logs: {
        Row: {
          city_name: string | null
          clothing_advice: string | null
          created_at: string
          id: string
          location_lat: number | null
          location_lng: number | null
          pollen_advice: string | null
          user_id: string
          weather_data: Json | null
        }
        Insert: {
          city_name?: string | null
          clothing_advice?: string | null
          created_at?: string
          id?: string
          location_lat?: number | null
          location_lng?: number | null
          pollen_advice?: string | null
          user_id: string
          weather_data?: Json | null
        }
        Update: {
          city_name?: string | null
          clothing_advice?: string | null
          created_at?: string
          id?: string
          location_lat?: number | null
          location_lng?: number | null
          pollen_advice?: string | null
          user_id?: string
          weather_data?: Json | null
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
      zodiac_compatibility: {
        Row: {
          compatibility_score: number | null
          description: string | null
          description_az: string | null
          id: string
          relationship_type: string | null
          sign1: string
          sign2: string
        }
        Insert: {
          compatibility_score?: number | null
          description?: string | null
          description_az?: string | null
          id?: string
          relationship_type?: string | null
          sign1: string
          sign2: string
        }
        Update: {
          compatibility_score?: number | null
          description?: string | null
          description_az?: string | null
          id?: string
          relationship_type?: string | null
          sign1?: string
          sign2?: string
        }
        Relationships: []
      }
      zodiac_signs: {
        Row: {
          characteristics: string[] | null
          characteristics_az: string[] | null
          color: string | null
          element: string | null
          end_date: string
          id: string
          name: string
          name_az: string
          ruling_planet: string | null
          sort_order: number | null
          start_date: string
          symbol: string
        }
        Insert: {
          characteristics?: string[] | null
          characteristics_az?: string[] | null
          color?: string | null
          element?: string | null
          end_date: string
          id?: string
          name: string
          name_az: string
          ruling_planet?: string | null
          sort_order?: number | null
          start_date: string
          symbol: string
        }
        Update: {
          characteristics?: string[] | null
          characteristics_az?: string[] | null
          color?: string | null
          element?: string | null
          end_date?: string
          id?: string
          name?: string
          name_az?: string
          ruling_planet?: string | null
          sort_order?: number | null
          start_date?: string
          symbol?: string
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
      place_category:
        | "cafe"
        | "restaurant"
        | "park"
        | "mall"
        | "hospital"
        | "metro"
        | "pharmacy"
        | "playground"
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
      place_category: [
        "cafe",
        "restaurant",
        "park",
        "mall",
        "hospital",
        "metro",
        "pharmacy",
        "playground",
      ],
    },
  },
} as const
