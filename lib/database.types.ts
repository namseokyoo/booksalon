/**
 * Supabase Database Types
 *
 * 북살롱 v0.4.0 - PostgreSQL 스키마 TypeScript 타입 정의
 *
 * @description
 * Supabase CLI의 `supabase gen types typescript` 명령어로 생성하는 것이 이상적이지만,
 * 초기 설정 단계에서는 수동으로 기본 타입을 정의합니다.
 *
 * 실제 배포 전에 Supabase CLI로 자동 생성된 타입으로 교체하세요.
 */

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
      // =====================================================
      // Users 관련 테이블
      // =====================================================
      users: {
        Row: {
          id: string
          auth_id: string
          email: string
          display_name: string | null
          nickname: string | null
          bio: string | null
          profile_image_url: string | null
          location: string | null
          website: string | null
          reading_goal: number
          post_count: number
          comment_count: number
          forum_count: number
          created_at: string
          last_login_at: string
          is_active: boolean
          deactivated_at: string | null
          deactivated_by: string | null
        }
        Insert: {
          id?: string
          auth_id: string
          email: string
          display_name?: string | null
          nickname?: string | null
          bio?: string | null
          profile_image_url?: string | null
          location?: string | null
          website?: string | null
          reading_goal?: number
          post_count?: number
          comment_count?: number
          forum_count?: number
          created_at?: string
          last_login_at?: string
          is_active?: boolean
          deactivated_at?: string | null
          deactivated_by?: string | null
        }
        Update: {
          id?: string
          auth_id?: string
          email?: string
          display_name?: string | null
          nickname?: string | null
          bio?: string | null
          profile_image_url?: string | null
          location?: string | null
          website?: string | null
          reading_goal?: number
          post_count?: number
          comment_count?: number
          forum_count?: number
          created_at?: string
          last_login_at?: string
          is_active?: boolean
          deactivated_at?: string | null
          deactivated_by?: string | null
        }
      }
      user_social_links: {
        Row: {
          id: string
          user_id: string
          platform: string
          url: string
          created_at: string
        }
        Insert: {
          id?: string
          user_id: string
          platform: string
          url: string
          created_at?: string
        }
        Update: {
          id?: string
          user_id?: string
          platform?: string
          url?: string
          created_at?: string
        }
      }
      user_notification_settings: {
        Row: {
          id: string
          user_id: string
          new_posts: boolean
          new_comments: boolean
          forum_updates: boolean
          follows: boolean
          likes: boolean
          email_notifications: boolean
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          user_id: string
          new_posts?: boolean
          new_comments?: boolean
          forum_updates?: boolean
          follows?: boolean
          likes?: boolean
          email_notifications?: boolean
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          user_id?: string
          new_posts?: boolean
          new_comments?: boolean
          forum_updates?: boolean
          follows?: boolean
          likes?: boolean
          email_notifications?: boolean
          created_at?: string
          updated_at?: string
        }
      }
      user_favorite_genres: {
        Row: {
          id: string
          user_id: string
          genre: string
          created_at: string
        }
        Insert: {
          id?: string
          user_id: string
          genre: string
          created_at?: string
        }
        Update: {
          id?: string
          user_id?: string
          genre?: string
          created_at?: string
        }
      }

      // =====================================================
      // Books & Forums 테이블
      // =====================================================
      books: {
        Row: {
          isbn: string
          title: string
          authors: string[]
          publisher: string | null
          thumbnail: string | null
          contents: string | null
          created_at: string
          updated_at: string
        }
        Insert: {
          isbn: string
          title: string
          authors?: string[]
          publisher?: string | null
          thumbnail?: string | null
          contents?: string | null
          created_at?: string
          updated_at?: string
        }
        Update: {
          isbn?: string
          title?: string
          authors?: string[]
          publisher?: string | null
          thumbnail?: string | null
          contents?: string | null
          created_at?: string
          updated_at?: string
        }
      }
      forums: {
        Row: {
          isbn: string
          category: string | null
          popularity: number
          post_count: number
          average_rating: number
          total_ratings: number
          last_activity_at: string
          created_at: string
        }
        Insert: {
          isbn: string
          category?: string | null
          popularity?: number
          post_count?: number
          average_rating?: number
          total_ratings?: number
          last_activity_at?: string
          created_at?: string
        }
        Update: {
          isbn?: string
          category?: string | null
          popularity?: number
          post_count?: number
          average_rating?: number
          total_ratings?: number
          last_activity_at?: string
          created_at?: string
        }
      }
      forum_tags: {
        Row: {
          id: string
          forum_isbn: string
          tag_name: string
          created_at: string
        }
        Insert: {
          id?: string
          forum_isbn: string
          tag_name: string
          created_at?: string
        }
        Update: {
          id?: string
          forum_isbn?: string
          tag_name?: string
          created_at?: string
        }
      }

      // =====================================================
      // Posts & Comments 테이블
      // =====================================================
      posts: {
        Row: {
          id: string
          forum_isbn: string
          author_id: string
          title: string
          content: string
          comment_count: number
          like_count: number
          search_text: string | null
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          forum_isbn: string
          author_id: string
          title: string
          content: string
          comment_count?: number
          like_count?: number
          search_text?: string | null
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          forum_isbn?: string
          author_id?: string
          title?: string
          content?: string
          comment_count?: number
          like_count?: number
          search_text?: string | null
          created_at?: string
          updated_at?: string
        }
      }
      post_tags: {
        Row: {
          id: string
          post_id: string
          tag_name: string
          created_at: string
        }
        Insert: {
          id?: string
          post_id: string
          tag_name: string
          created_at?: string
        }
        Update: {
          id?: string
          post_id?: string
          tag_name?: string
          created_at?: string
        }
      }
      post_images: {
        Row: {
          id: string
          post_id: string
          url: string
          thumbnail_url: string | null
          width: number
          height: number
          display_order: number
          created_at: string
        }
        Insert: {
          id?: string
          post_id: string
          url: string
          thumbnail_url?: string | null
          width: number
          height: number
          display_order?: number
          created_at?: string
        }
        Update: {
          id?: string
          post_id?: string
          url?: string
          thumbnail_url?: string | null
          width?: number
          height?: number
          display_order?: number
          created_at?: string
        }
      }
      post_likes: {
        Row: {
          id: string
          post_id: string
          user_id: string
          created_at: string
        }
        Insert: {
          id?: string
          post_id: string
          user_id: string
          created_at?: string
        }
        Update: {
          id?: string
          post_id?: string
          user_id?: string
          created_at?: string
        }
      }
      comments: {
        Row: {
          id: string
          post_id: string
          author_id: string
          content: string
          like_count: number
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          post_id: string
          author_id: string
          content: string
          like_count?: number
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          post_id?: string
          author_id?: string
          content?: string
          like_count?: number
          created_at?: string
          updated_at?: string
        }
      }
      comment_likes: {
        Row: {
          id: string
          comment_id: string
          user_id: string
          created_at: string
        }
        Insert: {
          id?: string
          comment_id: string
          user_id: string
          created_at?: string
        }
        Update: {
          id?: string
          comment_id?: string
          user_id?: string
          created_at?: string
        }
      }

      // =====================================================
      // Ratings & Tags 테이블
      // =====================================================
      ratings: {
        Row: {
          id: string
          book_isbn: string
          user_id: string
          rating: number
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          book_isbn: string
          user_id: string
          rating: number
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          book_isbn?: string
          user_id?: string
          rating?: number
          created_at?: string
          updated_at?: string
        }
      }
      tags: {
        Row: {
          id: string
          name: string
          tag_type: 'forum' | 'post'
          count: number
          last_used_at: string
        }
        Insert: {
          id?: string
          name: string
          tag_type: 'forum' | 'post'
          count?: number
          last_used_at?: string
        }
        Update: {
          id?: string
          name?: string
          tag_type?: 'forum' | 'post'
          count?: number
          last_used_at?: string
        }
      }

      // =====================================================
      // Social 테이블 (Bookmarks, Follows)
      // =====================================================
      bookmarks: {
        Row: {
          id: string
          user_id: string
          forum_isbn: string
          created_at: string
        }
        Insert: {
          id?: string
          user_id: string
          forum_isbn: string
          created_at?: string
        }
        Update: {
          id?: string
          user_id?: string
          forum_isbn?: string
          created_at?: string
        }
      }
      follows: {
        Row: {
          id: string
          follower_id: string
          following_id: string
          created_at: string
        }
        Insert: {
          id?: string
          follower_id: string
          following_id: string
          created_at?: string
        }
        Update: {
          id?: string
          follower_id?: string
          following_id?: string
          created_at?: string
        }
      }

      // =====================================================
      // Activities & Notifications 테이블
      // =====================================================
      activities: {
        Row: {
          id: string
          activity_type: 'post' | 'comment' | 'like' | 'follow' | 'bookmark'
          user_id: string
          target_id: string
          target_title: string | null
          forum_isbn: string | null
          metadata: Json | null
          created_at: string
        }
        Insert: {
          id?: string
          activity_type: 'post' | 'comment' | 'like' | 'follow' | 'bookmark'
          user_id: string
          target_id: string
          target_title?: string | null
          forum_isbn?: string | null
          metadata?: Json | null
          created_at?: string
        }
        Update: {
          id?: string
          activity_type?: 'post' | 'comment' | 'like' | 'follow' | 'bookmark'
          user_id?: string
          target_id?: string
          target_title?: string | null
          forum_isbn?: string | null
          metadata?: Json | null
          created_at?: string
        }
      }
      notifications: {
        Row: {
          id: string
          user_id: string
          notification_type: 'message' | 'like' | 'comment' | 'follow' | 'forum_invite' | 'system'
          title: string
          content: string
          is_read: boolean
          read_at: string | null
          metadata: Json | null
          created_at: string
        }
        Insert: {
          id?: string
          user_id: string
          notification_type: 'message' | 'like' | 'comment' | 'follow' | 'forum_invite' | 'system'
          title: string
          content: string
          is_read?: boolean
          read_at?: string | null
          metadata?: Json | null
          created_at?: string
        }
        Update: {
          id?: string
          user_id?: string
          notification_type?: 'message' | 'like' | 'comment' | 'follow' | 'forum_invite' | 'system'
          title?: string
          content?: string
          is_read?: boolean
          read_at?: string | null
          metadata?: Json | null
          created_at?: string
        }
      }

      // =====================================================
      // Chat 테이블
      // =====================================================
      chat_rooms: {
        Row: {
          id: string
          created_at: string
          updated_at: string
          last_message_at: string | null
        }
        Insert: {
          id?: string
          created_at?: string
          updated_at?: string
          last_message_at?: string | null
        }
        Update: {
          id?: string
          created_at?: string
          updated_at?: string
          last_message_at?: string | null
        }
      }
      chat_room_participants: {
        Row: {
          id: string
          chat_room_id: string
          user_id: string
          unread_count: number
          joined_at: string
        }
        Insert: {
          id?: string
          chat_room_id: string
          user_id: string
          unread_count?: number
          joined_at?: string
        }
        Update: {
          id?: string
          chat_room_id?: string
          user_id?: string
          unread_count?: number
          joined_at?: string
        }
      }
      messages: {
        Row: {
          id: string
          chat_room_id: string
          sender_id: string
          receiver_id: string
          content: string
          message_type: 'text' | 'image' | 'file'
          metadata: Json | null
          read_at: string | null
          created_at: string
        }
        Insert: {
          id?: string
          chat_room_id: string
          sender_id: string
          receiver_id: string
          content: string
          message_type?: 'text' | 'image' | 'file'
          metadata?: Json | null
          read_at?: string | null
          created_at?: string
        }
        Update: {
          id?: string
          chat_room_id?: string
          sender_id?: string
          receiver_id?: string
          content?: string
          message_type?: 'text' | 'image' | 'file'
          metadata?: Json | null
          read_at?: string | null
          created_at?: string
        }
      }

      // =====================================================
      // Admin 테이블
      // =====================================================
      admins: {
        Row: {
          id: string
          user_id: string
          role: 'admin' | 'moderator'
          permissions: string[]
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          user_id: string
          role: 'admin' | 'moderator'
          permissions?: string[]
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          user_id?: string
          role?: 'admin' | 'moderator'
          permissions?: string[]
          created_at?: string
          updated_at?: string
        }
      }
      reports: {
        Row: {
          id: string
          reporter_id: string
          reported_user_id: string | null
          reported_post_id: string | null
          reported_comment_id: string | null
          reported_forum_isbn: string | null
          report_type: 'spam' | 'harassment' | 'inappropriate_content' | 'fake_news' | 'other'
          reason: string
          description: string | null
          status: 'pending' | 'reviewing' | 'resolved' | 'dismissed'
          resolved_at: string | null
          resolved_by: string | null
          resolution: string | null
          created_at: string
        }
        Insert: {
          id?: string
          reporter_id: string
          reported_user_id?: string | null
          reported_post_id?: string | null
          reported_comment_id?: string | null
          reported_forum_isbn?: string | null
          report_type: 'spam' | 'harassment' | 'inappropriate_content' | 'fake_news' | 'other'
          reason: string
          description?: string | null
          status?: 'pending' | 'reviewing' | 'resolved' | 'dismissed'
          resolved_at?: string | null
          resolved_by?: string | null
          resolution?: string | null
          created_at?: string
        }
        Update: {
          id?: string
          reporter_id?: string
          reported_user_id?: string | null
          reported_post_id?: string | null
          reported_comment_id?: string | null
          reported_forum_isbn?: string | null
          report_type?: 'spam' | 'harassment' | 'inappropriate_content' | 'fake_news' | 'other'
          reason?: string
          description?: string | null
          status?: 'pending' | 'reviewing' | 'resolved' | 'dismissed'
          resolved_at?: string | null
          resolved_by?: string | null
          resolution?: string | null
          created_at?: string
        }
      }
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      is_admin: {
        Args: Record<PropertyKey, never>
        Returns: boolean
      }
      is_super_admin: {
        Args: Record<PropertyKey, never>
        Returns: boolean
      }
    }
    Enums: {
      activity_type: 'post' | 'comment' | 'like' | 'follow' | 'bookmark'
      notification_type: 'message' | 'like' | 'comment' | 'follow' | 'forum_invite' | 'system'
      message_type: 'text' | 'image' | 'file'
      admin_role: 'admin' | 'moderator'
      report_type: 'spam' | 'harassment' | 'inappropriate_content' | 'fake_news' | 'other'
      report_status: 'pending' | 'reviewing' | 'resolved' | 'dismissed'
      tag_type: 'forum' | 'post'
    }
    CompositeTypes: {
      [_ in never]: never
    }
  }
}

// =====================================================
// 편의 타입 별칭
// =====================================================

export type Tables<T extends keyof Database['public']['Tables']> = Database['public']['Tables'][T]['Row']
export type InsertTables<T extends keyof Database['public']['Tables']> = Database['public']['Tables'][T]['Insert']
export type UpdateTables<T extends keyof Database['public']['Tables']> = Database['public']['Tables'][T]['Update']
export type Enums<T extends keyof Database['public']['Enums']> = Database['public']['Enums'][T]

// 자주 사용하는 타입
export type User = Tables<'users'>
export type UserInsert = InsertTables<'users'>
export type UserUpdate = UpdateTables<'users'>

export type Post = Tables<'posts'>
export type PostInsert = InsertTables<'posts'>
export type PostUpdate = UpdateTables<'posts'>

export type Comment = Tables<'comments'>
export type CommentInsert = InsertTables<'comments'>
export type CommentUpdate = UpdateTables<'comments'>

export type Forum = Tables<'forums'>
export type Book = Tables<'books'>
export type Rating = Tables<'ratings'>
export type Notification = Tables<'notifications'>
export type Activity = Tables<'activities'>
export type Message = Tables<'messages'>
export type Admin = Tables<'admins'>
export type Report = Tables<'reports'>
