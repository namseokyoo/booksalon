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
      activities: {
        Row: {
          activity_type: string
          created_at: string | null
          forum_isbn: string | null
          id: string
          metadata: Json | null
          target_id: string
          target_title: string | null
          user_id: string
        }
        Insert: {
          activity_type: string
          created_at?: string | null
          forum_isbn?: string | null
          id?: string
          metadata?: Json | null
          target_id: string
          target_title?: string | null
          user_id: string
        }
        Update: {
          activity_type?: string
          created_at?: string | null
          forum_isbn?: string | null
          id?: string
          metadata?: Json | null
          target_id?: string
          target_title?: string | null
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "activities_forum_isbn_fkey"
            columns: ["forum_isbn"]
            isOneToOne: false
            referencedRelation: "forums"
            referencedColumns: ["isbn"]
          },
          {
            foreignKeyName: "activities_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "users"
            referencedColumns: ["id"]
          },
        ]
      }
      admins: {
        Row: {
          created_at: string | null
          id: string
          permissions: string[] | null
          role: string
          updated_at: string | null
          user_id: string
        }
        Insert: {
          created_at?: string | null
          id?: string
          permissions?: string[] | null
          role: string
          updated_at?: string | null
          user_id: string
        }
        Update: {
          created_at?: string | null
          id?: string
          permissions?: string[] | null
          role?: string
          updated_at?: string | null
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "admins_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: true
            referencedRelation: "users"
            referencedColumns: ["id"]
          },
        ]
      }
      bookmarks: {
        Row: {
          created_at: string | null
          forum_isbn: string
          id: string
          user_id: string
        }
        Insert: {
          created_at?: string | null
          forum_isbn: string
          id?: string
          user_id: string
        }
        Update: {
          created_at?: string | null
          forum_isbn?: string
          id?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "bookmarks_forum_isbn_fkey"
            columns: ["forum_isbn"]
            isOneToOne: false
            referencedRelation: "forums"
            referencedColumns: ["isbn"]
          },
          {
            foreignKeyName: "bookmarks_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "users"
            referencedColumns: ["id"]
          },
        ]
      }
      books: {
        Row: {
          authors: string[]
          contents: string | null
          created_at: string | null
          isbn: string
          publisher: string | null
          thumbnail: string | null
          title: string
          updated_at: string | null
        }
        Insert: {
          authors?: string[]
          contents?: string | null
          created_at?: string | null
          isbn: string
          publisher?: string | null
          thumbnail?: string | null
          title: string
          updated_at?: string | null
        }
        Update: {
          authors?: string[]
          contents?: string | null
          created_at?: string | null
          isbn?: string
          publisher?: string | null
          thumbnail?: string | null
          title?: string
          updated_at?: string | null
        }
        Relationships: []
      }
      chat_room_participants: {
        Row: {
          chat_room_id: string
          id: string
          joined_at: string | null
          unread_count: number | null
          user_id: string
        }
        Insert: {
          chat_room_id: string
          id?: string
          joined_at?: string | null
          unread_count?: number | null
          user_id: string
        }
        Update: {
          chat_room_id?: string
          id?: string
          joined_at?: string | null
          unread_count?: number | null
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "chat_room_participants_chat_room_id_fkey"
            columns: ["chat_room_id"]
            isOneToOne: false
            referencedRelation: "chat_rooms"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "chat_room_participants_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "users"
            referencedColumns: ["id"]
          },
        ]
      }
      chat_rooms: {
        Row: {
          created_at: string | null
          id: string
          last_message_at: string | null
          updated_at: string | null
        }
        Insert: {
          created_at?: string | null
          id?: string
          last_message_at?: string | null
          updated_at?: string | null
        }
        Update: {
          created_at?: string | null
          id?: string
          last_message_at?: string | null
          updated_at?: string | null
        }
        Relationships: []
      }
      comment_likes: {
        Row: {
          comment_id: string
          created_at: string | null
          id: string
          user_id: string
        }
        Insert: {
          comment_id: string
          created_at?: string | null
          id?: string
          user_id: string
        }
        Update: {
          comment_id?: string
          created_at?: string | null
          id?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "comment_likes_comment_id_fkey"
            columns: ["comment_id"]
            isOneToOne: false
            referencedRelation: "comments"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "comment_likes_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "users"
            referencedColumns: ["id"]
          },
        ]
      }
      comments: {
        Row: {
          author_id: string
          content: string
          created_at: string | null
          id: string
          like_count: number | null
          post_id: string
          updated_at: string | null
        }
        Insert: {
          author_id: string
          content: string
          created_at?: string | null
          id?: string
          like_count?: number | null
          post_id: string
          updated_at?: string | null
        }
        Update: {
          author_id?: string
          content?: string
          created_at?: string | null
          id?: string
          like_count?: number | null
          post_id?: string
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "comments_author_id_fkey"
            columns: ["author_id"]
            isOneToOne: false
            referencedRelation: "users"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "comments_post_id_fkey"
            columns: ["post_id"]
            isOneToOne: false
            referencedRelation: "posts"
            referencedColumns: ["id"]
          },
        ]
      }
      follows: {
        Row: {
          created_at: string | null
          follower_id: string
          following_id: string
          id: string
        }
        Insert: {
          created_at?: string | null
          follower_id: string
          following_id: string
          id?: string
        }
        Update: {
          created_at?: string | null
          follower_id?: string
          following_id?: string
          id?: string
        }
        Relationships: [
          {
            foreignKeyName: "follows_follower_id_fkey"
            columns: ["follower_id"]
            isOneToOne: false
            referencedRelation: "users"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "follows_following_id_fkey"
            columns: ["following_id"]
            isOneToOne: false
            referencedRelation: "users"
            referencedColumns: ["id"]
          },
        ]
      }
      forum_tags: {
        Row: {
          created_at: string | null
          forum_isbn: string
          id: string
          tag_name: string
        }
        Insert: {
          created_at?: string | null
          forum_isbn: string
          id?: string
          tag_name: string
        }
        Update: {
          created_at?: string | null
          forum_isbn?: string
          id?: string
          tag_name?: string
        }
        Relationships: [
          {
            foreignKeyName: "forum_tags_forum_isbn_fkey"
            columns: ["forum_isbn"]
            isOneToOne: false
            referencedRelation: "forums"
            referencedColumns: ["isbn"]
          },
        ]
      }
      forums: {
        Row: {
          average_rating: number | null
          category: string | null
          created_at: string | null
          isbn: string
          last_activity_at: string | null
          popularity: number | null
          post_count: number | null
          total_ratings: number | null
        }
        Insert: {
          average_rating?: number | null
          category?: string | null
          created_at?: string | null
          isbn: string
          last_activity_at?: string | null
          popularity?: number | null
          post_count?: number | null
          total_ratings?: number | null
        }
        Update: {
          average_rating?: number | null
          category?: string | null
          created_at?: string | null
          isbn?: string
          last_activity_at?: string | null
          popularity?: number | null
          post_count?: number | null
          total_ratings?: number | null
        }
        Relationships: [
          {
            foreignKeyName: "forums_isbn_fkey"
            columns: ["isbn"]
            isOneToOne: true
            referencedRelation: "books"
            referencedColumns: ["isbn"]
          },
        ]
      }
      messages: {
        Row: {
          chat_room_id: string
          content: string
          created_at: string | null
          id: string
          message_type: string | null
          metadata: Json | null
          read_at: string | null
          receiver_id: string
          sender_id: string
        }
        Insert: {
          chat_room_id: string
          content: string
          created_at?: string | null
          id?: string
          message_type?: string | null
          metadata?: Json | null
          read_at?: string | null
          receiver_id: string
          sender_id: string
        }
        Update: {
          chat_room_id?: string
          content?: string
          created_at?: string | null
          id?: string
          message_type?: string | null
          metadata?: Json | null
          read_at?: string | null
          receiver_id?: string
          sender_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "messages_chat_room_id_fkey"
            columns: ["chat_room_id"]
            isOneToOne: false
            referencedRelation: "chat_rooms"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "messages_receiver_id_fkey"
            columns: ["receiver_id"]
            isOneToOne: false
            referencedRelation: "users"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "messages_sender_id_fkey"
            columns: ["sender_id"]
            isOneToOne: false
            referencedRelation: "users"
            referencedColumns: ["id"]
          },
        ]
      }
      notifications: {
        Row: {
          content: string
          created_at: string | null
          id: string
          is_read: boolean | null
          metadata: Json | null
          notification_type: string
          read_at: string | null
          title: string
          user_id: string
        }
        Insert: {
          content: string
          created_at?: string | null
          id?: string
          is_read?: boolean | null
          metadata?: Json | null
          notification_type: string
          read_at?: string | null
          title: string
          user_id: string
        }
        Update: {
          content?: string
          created_at?: string | null
          id?: string
          is_read?: boolean | null
          metadata?: Json | null
          notification_type?: string
          read_at?: string | null
          title?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "notifications_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "users"
            referencedColumns: ["id"]
          },
        ]
      }
      post_images: {
        Row: {
          created_at: string | null
          display_order: number | null
          height: number
          id: string
          post_id: string
          thumbnail_url: string | null
          url: string
          width: number
        }
        Insert: {
          created_at?: string | null
          display_order?: number | null
          height: number
          id?: string
          post_id: string
          thumbnail_url?: string | null
          url: string
          width: number
        }
        Update: {
          created_at?: string | null
          display_order?: number | null
          height?: number
          id?: string
          post_id?: string
          thumbnail_url?: string | null
          url?: string
          width?: number
        }
        Relationships: [
          {
            foreignKeyName: "post_images_post_id_fkey"
            columns: ["post_id"]
            isOneToOne: false
            referencedRelation: "posts"
            referencedColumns: ["id"]
          },
        ]
      }
      post_likes: {
        Row: {
          created_at: string | null
          id: string
          post_id: string
          user_id: string
        }
        Insert: {
          created_at?: string | null
          id?: string
          post_id: string
          user_id: string
        }
        Update: {
          created_at?: string | null
          id?: string
          post_id?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "post_likes_post_id_fkey"
            columns: ["post_id"]
            isOneToOne: false
            referencedRelation: "posts"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "post_likes_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "users"
            referencedColumns: ["id"]
          },
        ]
      }
      post_tags: {
        Row: {
          created_at: string | null
          id: string
          post_id: string
          tag_name: string
        }
        Insert: {
          created_at?: string | null
          id?: string
          post_id: string
          tag_name: string
        }
        Update: {
          created_at?: string | null
          id?: string
          post_id?: string
          tag_name?: string
        }
        Relationships: [
          {
            foreignKeyName: "post_tags_post_id_fkey"
            columns: ["post_id"]
            isOneToOne: false
            referencedRelation: "posts"
            referencedColumns: ["id"]
          },
        ]
      }
      posts: {
        Row: {
          author_id: string
          comment_count: number | null
          content: string
          created_at: string | null
          forum_isbn: string
          id: string
          like_count: number | null
          search_text: string | null
          title: string
          updated_at: string | null
          view_count: number | null
        }
        Insert: {
          author_id: string
          comment_count?: number | null
          content: string
          created_at?: string | null
          forum_isbn: string
          id?: string
          like_count?: number | null
          search_text?: string | null
          title: string
          updated_at?: string | null
          view_count?: number | null
        }
        Update: {
          author_id?: string
          comment_count?: number | null
          content?: string
          created_at?: string | null
          forum_isbn?: string
          id?: string
          like_count?: number | null
          search_text?: string | null
          title?: string
          updated_at?: string | null
          view_count?: number | null
        }
        Relationships: [
          {
            foreignKeyName: "posts_author_id_fkey"
            columns: ["author_id"]
            isOneToOne: false
            referencedRelation: "users"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "posts_forum_isbn_fkey"
            columns: ["forum_isbn"]
            isOneToOne: false
            referencedRelation: "forums"
            referencedColumns: ["isbn"]
          },
        ]
      }
      reading_logs: {
        Row: {
          id: string
          user_id: string
          forum_isbn: string
          status: string
          started_at: string | null
          finished_at: string | null
          note: string | null
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          user_id: string
          forum_isbn: string
          status: string
          started_at?: string | null
          finished_at?: string | null
          note?: string | null
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          user_id?: string
          forum_isbn?: string
          status?: string
          started_at?: string | null
          finished_at?: string | null
          note?: string | null
          created_at?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "reading_logs_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "users"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "reading_logs_forum_isbn_fkey"
            columns: ["forum_isbn"]
            isOneToOne: false
            referencedRelation: "forums"
            referencedColumns: ["isbn"]
          },
        ]
      }
      ratings: {
        Row: {
          book_isbn: string
          created_at: string | null
          id: string
          rating: number
          updated_at: string | null
          user_id: string
        }
        Insert: {
          book_isbn: string
          created_at?: string | null
          id?: string
          rating: number
          updated_at?: string | null
          user_id: string
        }
        Update: {
          book_isbn?: string
          created_at?: string | null
          id?: string
          rating?: number
          updated_at?: string | null
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "ratings_book_isbn_fkey"
            columns: ["book_isbn"]
            isOneToOne: false
            referencedRelation: "books"
            referencedColumns: ["isbn"]
          },
          {
            foreignKeyName: "ratings_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "users"
            referencedColumns: ["id"]
          },
        ]
      }
      reports: {
        Row: {
          created_at: string | null
          description: string | null
          id: string
          reason: string
          report_type: string
          reported_comment_id: string | null
          reported_forum_isbn: string | null
          reported_post_id: string | null
          reported_user_id: string | null
          reporter_id: string
          resolution: string | null
          resolved_at: string | null
          resolved_by: string | null
          status: string | null
        }
        Insert: {
          created_at?: string | null
          description?: string | null
          id?: string
          reason: string
          report_type: string
          reported_comment_id?: string | null
          reported_forum_isbn?: string | null
          reported_post_id?: string | null
          reported_user_id?: string | null
          reporter_id: string
          resolution?: string | null
          resolved_at?: string | null
          resolved_by?: string | null
          status?: string | null
        }
        Update: {
          created_at?: string | null
          description?: string | null
          id?: string
          reason?: string
          report_type?: string
          reported_comment_id?: string | null
          reported_forum_isbn?: string | null
          reported_post_id?: string | null
          reported_user_id?: string | null
          reporter_id?: string
          resolution?: string | null
          resolved_at?: string | null
          resolved_by?: string | null
          status?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "reports_reported_comment_id_fkey"
            columns: ["reported_comment_id"]
            isOneToOne: false
            referencedRelation: "comments"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "reports_reported_forum_isbn_fkey"
            columns: ["reported_forum_isbn"]
            isOneToOne: false
            referencedRelation: "forums"
            referencedColumns: ["isbn"]
          },
          {
            foreignKeyName: "reports_reported_post_id_fkey"
            columns: ["reported_post_id"]
            isOneToOne: false
            referencedRelation: "posts"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "reports_reported_user_id_fkey"
            columns: ["reported_user_id"]
            isOneToOne: false
            referencedRelation: "users"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "reports_reporter_id_fkey"
            columns: ["reporter_id"]
            isOneToOne: false
            referencedRelation: "users"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "reports_resolved_by_fkey"
            columns: ["resolved_by"]
            isOneToOne: false
            referencedRelation: "users"
            referencedColumns: ["id"]
          },
        ]
      }
      tags: {
        Row: {
          count: number | null
          id: string
          last_used_at: string | null
          name: string
          tag_type: string
        }
        Insert: {
          count?: number | null
          id?: string
          last_used_at?: string | null
          name: string
          tag_type: string
        }
        Update: {
          count?: number | null
          id?: string
          last_used_at?: string | null
          name?: string
          tag_type?: string
        }
        Relationships: []
      }
      user_favorite_genres: {
        Row: {
          created_at: string | null
          genre: string
          id: string
          user_id: string
        }
        Insert: {
          created_at?: string | null
          genre: string
          id?: string
          user_id: string
        }
        Update: {
          created_at?: string | null
          genre?: string
          id?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "user_favorite_genres_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "users"
            referencedColumns: ["id"]
          },
        ]
      }
      user_notification_settings: {
        Row: {
          created_at: string | null
          email_notifications: boolean | null
          follows: boolean | null
          forum_updates: boolean | null
          id: string
          likes: boolean | null
          new_comments: boolean | null
          new_posts: boolean | null
          updated_at: string | null
          user_id: string
        }
        Insert: {
          created_at?: string | null
          email_notifications?: boolean | null
          follows?: boolean | null
          forum_updates?: boolean | null
          id?: string
          likes?: boolean | null
          new_comments?: boolean | null
          new_posts?: boolean | null
          updated_at?: string | null
          user_id: string
        }
        Update: {
          created_at?: string | null
          email_notifications?: boolean | null
          follows?: boolean | null
          forum_updates?: boolean | null
          id?: string
          likes?: boolean | null
          new_comments?: boolean | null
          new_posts?: boolean | null
          updated_at?: string | null
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "user_notification_settings_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: true
            referencedRelation: "users"
            referencedColumns: ["id"]
          },
        ]
      }
      user_social_links: {
        Row: {
          created_at: string | null
          id: string
          platform: string
          url: string
          user_id: string
        }
        Insert: {
          created_at?: string | null
          id?: string
          platform: string
          url: string
          user_id: string
        }
        Update: {
          created_at?: string | null
          id?: string
          platform?: string
          url?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "user_social_links_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "users"
            referencedColumns: ["id"]
          },
        ]
      }
      users: {
        Row: {
          auth_id: string
          bio: string | null
          comment_count: number | null
          created_at: string | null
          deactivated_at: string | null
          deactivated_by: string | null
          display_name: string | null
          email: string
          forum_count: number | null
          id: string
          is_active: boolean | null
          last_login_at: string | null
          location: string | null
          nickname: string | null
          post_count: number | null
          profile_image_url: string | null
          reading_goal: number | null
          website: string | null
        }
        Insert: {
          auth_id: string
          bio?: string | null
          comment_count?: number | null
          created_at?: string | null
          deactivated_at?: string | null
          deactivated_by?: string | null
          display_name?: string | null
          email: string
          forum_count?: number | null
          id?: string
          is_active?: boolean | null
          last_login_at?: string | null
          location?: string | null
          nickname?: string | null
          post_count?: number | null
          profile_image_url?: string | null
          reading_goal?: number | null
          website?: string | null
        }
        Update: {
          auth_id?: string
          bio?: string | null
          comment_count?: number | null
          created_at?: string | null
          deactivated_at?: string | null
          deactivated_by?: string | null
          display_name?: string | null
          email?: string
          forum_count?: number | null
          id?: string
          is_active?: boolean | null
          last_login_at?: string | null
          location?: string | null
          nickname?: string | null
          post_count?: number | null
          profile_image_url?: string | null
          reading_goal?: number | null
          website?: string | null
        }
        Relationships: []
      }
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      get_current_user_id: { Args: never; Returns: string }
      increment_view_count: { Args: { post_id: string }; Returns: undefined }
      is_admin: { Args: never; Returns: boolean }
      is_super_admin: { Args: never; Returns: boolean }
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
