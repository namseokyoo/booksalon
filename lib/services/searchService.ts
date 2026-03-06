/**
 * Search Service - Supabase 마이그레이션
 *
 * 북살롱 v0.4.0 - Firebase searchService.ts → Supabase searchService.ts
 *
 * @description
 * 통합 검색 서비스. PostgreSQL의 ilike 검색 및 Full-text search 활용.
 */

import { supabase } from '../supabase'
import type { Database } from '../database.types'

// 테이블 타입 직접 정의 (타입 추론 문제 해결)
type BookRow = Database['public']['Tables']['books']['Row']
type ForumRow = Database['public']['Tables']['forums']['Row']
type PostRow = Database['public']['Tables']['posts']['Row']
type CommentRow = Database['public']['Tables']['comments']['Row']
type ForumTagRow = Database['public']['Tables']['forum_tags']['Row']

// 검색 결과 인터페이스 (기존 types.ts 호환)
export interface CommunitySearchResult {
  forums: ForumSearchResult[]
  posts: PostSearchResult[]
  comments: CommentSearchResult[]
}

export interface ForumSearchResult {
  isbn: string
  book: {
    isbn: string
    title: string
    authors: string[]
    publisher: string
    thumbnail: string
    contents: string
  }
  postCount: number
  lastActivityAt?: string
  category?: string
  tags?: string[]
  popularity?: number
  averageRating?: number
  totalRatings?: number
}

export interface PostSearchResult {
  id: string
  title: string
  content: string
  authorId: string
  forumIsbn: string
  forumTitle: string
  createdAt: string
  commentCount: number
  likeCount: number
  tags?: string[]
}

export interface CommentSearchResult {
  id: string
  content: string
  authorId: string
  postId: string
  postTitle: string
  forumIsbn: string
  forumTitle: string
  createdAt: string
}

// 인기 검색어 (추후 DB 기반으로 변경 가능)
const POPULAR_SEARCH_TERMS = [
  '데미안',
  '어린왕자',
  '1984',
  '해리포터',
  '삼체',
  '도리안 그레이',
  '죄와 벌',
  '노르웨이의 숲',
  '호밀밭의 파수꾼',
  '위대한 개츠비',
]

export class SearchService {
  /**
   * searchText 필드 생성 유틸
   * 제목, 내용, 작성자 이메일을 조합하여 검색용 텍스트 생성
   */
  static generateSearchText(title: string, content: string, authorEmail?: string): string {
    const parts = [title.toLowerCase().trim(), content.toLowerCase().trim()]

    if (authorEmail) {
      // 이메일에서 @ 앞부분만 추출
      const emailPrefix = authorEmail.split('@')[0].toLowerCase()
      parts.push(emailPrefix)
    }

    return parts.filter(Boolean).join(' ')
  }

  /**
   * 검색어 하이라이트 유틸
   * 텍스트에서 검색어를 <mark> 태그로 감쌈
   */
  static highlightText(text: string, term: string): string {
    if (!term.trim() || !text) {
      return text
    }

    const escapedTerm = term.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')
    const regex = new RegExp(`(${escapedTerm})`, 'gi')

    return text.replace(
      regex,
      '<mark class="bg-highlight text-highlight-foreground font-medium">$1</mark>'
    )
  }

  /**
   * 인기 검색어 조회
   */
  static async getPopularSearchTerms(maxCount: number = 5): Promise<string[]> {
    // TODO: 검색 통계 테이블 기반으로 변경
    return POPULAR_SEARCH_TERMS.slice(0, maxCount)
  }

  /**
   * 검색어 자동완성 (포럼/게시물 제목 기반)
   */
  static async getSuggestions(term: string, maxCount: number = 5): Promise<string[]> {
    if (!term.trim()) {
      return []
    }

    const normalized = term.toLowerCase()
    const suggestions: string[] = []

    // 책 제목에서 제안
    const { data: books } = await supabase
      .from('books')
      .select('title')
      .ilike('title', `%${normalized}%`)
      .limit(10)

    const bookData = (books || []) as Pick<BookRow, 'title'>[]
    bookData.forEach((book) => {
      if (!suggestions.includes(book.title)) {
        suggestions.push(book.title)
      }
    })

    // 인기 검색어에서 매칭되는 것 추가
    POPULAR_SEARCH_TERMS.forEach((popular) => {
      if (popular.toLowerCase().includes(normalized) && !suggestions.includes(popular)) {
        suggestions.push(popular)
      }
    })

    return suggestions.slice(0, maxCount)
  }

  /**
   * 통합 검색 (포럼, 게시물, 댓글)
   * PostgreSQL의 ilike 검색 활용
   */
  static async searchAll(
    term: string,
    options: {
      forumLimit?: number
      postLimit?: number
      commentLimit?: number
    } = {}
  ): Promise<CommunitySearchResult> {
    const { forumLimit = 50, postLimit = 50, commentLimit = 50 } = options

    const normalized = term.toLowerCase().trim()

    if (!normalized) {
      return { forums: [], posts: [], comments: [] }
    }

    // 병렬로 검색 실행
    const [forumsResult, postsResult, commentsResult] = await Promise.all([
      this.searchForums(normalized, forumLimit),
      this.searchPosts(normalized, postLimit),
      this.searchComments(normalized, commentLimit),
    ])

    return {
      forums: forumsResult,
      posts: postsResult,
      comments: commentsResult,
    }
  }

  /**
   * 포럼(책) 검색
   */
  static async searchForums(term: string, limitCount: number = 50): Promise<ForumSearchResult[]> {
    // 책 제목으로 검색
    const { data: books } = await supabase
      .from('books')
      .select('isbn, title, authors, publisher, thumbnail, contents')
      .or(`title.ilike.%${term}%,publisher.ilike.%${term}%`)
      .limit(limitCount)

    const bookData = (books || []) as BookRow[]

    if (bookData.length === 0) {
      return []
    }

    const bookIsbns = bookData.map((b) => b.isbn)

    // 포럼 정보 조회
    const { data: forums } = await supabase
      .from('forums')
      .select('*')
      .in('isbn', bookIsbns)
      .order('last_activity_at', { ascending: false })

    const forumData = (forums || []) as ForumRow[]

    // 태그 조회
    const { data: allTags } = await supabase
      .from('forum_tags')
      .select('*')
      .in('forum_isbn', bookIsbns)

    const tagData = (allTags || []) as ForumTagRow[]

    // 결과 조합
    const forumMap = new Map(forumData.map((f) => [f.isbn, f]))
    const bookMap = new Map(bookData.map((b) => [b.isbn, b]))

    return bookIsbns
      .filter((isbn) => forumMap.has(isbn) && bookMap.has(isbn))
      .map((isbn) => {
        const forum = forumMap.get(isbn)!
        const book = bookMap.get(isbn)!
        const tags = tagData.filter((t) => t.forum_isbn === isbn)

        return {
          isbn: forum.isbn,
          book: {
            isbn: book.isbn,
            title: book.title,
            authors: book.authors || [],
            publisher: book.publisher || '',
            thumbnail: book.thumbnail || '',
            contents: book.contents || '',
          },
          postCount: forum.post_count,
          lastActivityAt: forum.last_activity_at,
          category: forum.category || undefined,
          tags: tags.map((t) => t.tag_name),
          popularity: forum.popularity,
          averageRating: forum.average_rating,
          totalRatings: forum.total_ratings,
        }
      })
  }

  /**
   * 게시물 검색
   */
  static async searchPosts(term: string, limitCount: number = 50): Promise<PostSearchResult[]> {
    // 게시물 검색
    const { data: posts } = await supabase
      .from('posts')
      .select('*')
      .or(`title.ilike.%${term}%,content.ilike.%${term}%`)
      .order('created_at', { ascending: false })
      .limit(limitCount)

    const postData = (posts || []) as PostRow[]

    if (postData.length === 0) {
      return []
    }

    // 포럼 ISBN 목록
    const forumIsbns = [...new Set(postData.map((p) => p.forum_isbn))]

    // 책 정보 조회
    const { data: books } = await supabase
      .from('books')
      .select('isbn, title')
      .in('isbn', forumIsbns)

    const bookData = (books || []) as Pick<BookRow, 'isbn' | 'title'>[]
    const bookMap = new Map(bookData.map((b) => [b.isbn, b.title]))

    // 태그 조회
    const postIds = postData.map((p) => p.id)
    const { data: postTags } = await supabase
      .from('post_tags')
      .select('post_id, tag_name')
      .in('post_id', postIds)

    type PostTagData = { post_id: string; tag_name: string }
    const tagData = (postTags || []) as PostTagData[]

    return postData.map((post) => {
      const tags = tagData.filter((t) => t.post_id === post.id).map((t) => t.tag_name)

      return {
        id: post.id,
        title: post.title,
        content: post.content,
        authorId: post.author_id,
        forumIsbn: post.forum_isbn,
        forumTitle: bookMap.get(post.forum_isbn) || '',
        createdAt: post.created_at,
        commentCount: post.comment_count,
        likeCount: post.like_count,
        tags,
      }
    })
  }

  /**
   * 댓글 검색
   */
  static async searchComments(
    term: string,
    limitCount: number = 50
  ): Promise<CommentSearchResult[]> {
    // 댓글 검색
    const { data: comments } = await supabase
      .from('comments')
      .select('*')
      .ilike('content', `%${term}%`)
      .order('created_at', { ascending: false })
      .limit(limitCount)

    const commentData = (comments || []) as CommentRow[]

    if (commentData.length === 0) {
      return []
    }

    // 게시물 ID 목록
    const postIds = [...new Set(commentData.map((c) => c.post_id))]

    // 게시물 정보 조회
    const { data: posts } = await supabase
      .from('posts')
      .select('id, title, forum_isbn')
      .in('id', postIds)

    type PostInfoData = { id: string; title: string; forum_isbn: string }
    const postData = (posts || []) as PostInfoData[]
    const postMap = new Map(postData.map((p) => [p.id, p]))

    // 포럼 ISBN 목록
    const forumIsbns = [...new Set(postData.map((p) => p.forum_isbn))]

    // 책 정보 조회
    const { data: books } = await supabase
      .from('books')
      .select('isbn, title')
      .in('isbn', forumIsbns)

    const bookData = (books || []) as Pick<BookRow, 'isbn' | 'title'>[]
    const bookMap = new Map(bookData.map((b) => [b.isbn, b.title]))

    return commentData.map((comment) => {
      const post = postMap.get(comment.post_id)

      return {
        id: comment.id,
        content: comment.content,
        authorId: comment.author_id,
        postId: comment.post_id,
        postTitle: post?.title || '',
        forumIsbn: post?.forum_isbn || '',
        forumTitle: post ? (bookMap.get(post.forum_isbn) || '') : '',
        createdAt: comment.created_at,
      }
    })
  }

  /**
   * 태그로 검색
   */
  static async searchByTag(
    tagName: string,
    type: 'forum' | 'post',
    limitCount: number = 50
  ): Promise<ForumSearchResult[] | PostSearchResult[]> {
    if (type === 'forum') {
      // 포럼 태그 검색
      const { data: forumTags } = await supabase
        .from('forum_tags')
        .select('forum_isbn')
        .eq('tag_name', tagName)
        .limit(limitCount)

      const tagData = (forumTags || []) as Pick<ForumTagRow, 'forum_isbn'>[]
      const forumIsbns = tagData.map((t) => t.forum_isbn)

      if (forumIsbns.length === 0) {
        return []
      }

      // 포럼 및 책 정보 조회
      const { data: forums } = await supabase
        .from('forums')
        .select('*')
        .in('isbn', forumIsbns)

      const forumData = (forums || []) as ForumRow[]

      const { data: books } = await supabase
        .from('books')
        .select('*')
        .in('isbn', forumIsbns)

      const bookData = (books || []) as BookRow[]
      const bookMap = new Map(bookData.map((b) => [b.isbn, b]))

      return forumData.map((forum) => {
        const book = bookMap.get(forum.isbn)

        return {
          isbn: forum.isbn,
          book: {
            isbn: book?.isbn || forum.isbn,
            title: book?.title || '',
            authors: book?.authors || [],
            publisher: book?.publisher || '',
            thumbnail: book?.thumbnail || '',
            contents: book?.contents || '',
          },
          postCount: forum.post_count,
          lastActivityAt: forum.last_activity_at,
          category: forum.category || undefined,
          popularity: forum.popularity,
          averageRating: forum.average_rating,
          totalRatings: forum.total_ratings,
        }
      })
    } else {
      // 게시물 태그 검색
      type PostTagData = { post_id: string; tag_name: string }
      const { data: postTags } = await supabase
        .from('post_tags')
        .select('post_id')
        .eq('tag_name', tagName)
        .limit(limitCount)

      const tagData = (postTags || []) as Pick<PostTagData, 'post_id'>[]
      const postIds = tagData.map((t) => t.post_id)

      if (postIds.length === 0) {
        return []
      }

      // 게시물 정보 조회
      const { data: posts } = await supabase
        .from('posts')
        .select('*')
        .in('id', postIds)

      const postData = (posts || []) as PostRow[]

      // 포럼 ISBN 목록
      const forumIsbns = [...new Set(postData.map((p) => p.forum_isbn))]

      // 책 정보 조회
      const { data: books } = await supabase
        .from('books')
        .select('isbn, title')
        .in('isbn', forumIsbns)

      const bookData = (books || []) as Pick<BookRow, 'isbn' | 'title'>[]
      const bookMap = new Map(bookData.map((b) => [b.isbn, b.title]))

      return postData.map((post) => ({
        id: post.id,
        title: post.title,
        content: post.content,
        authorId: post.author_id,
        forumIsbn: post.forum_isbn,
        forumTitle: bookMap.get(post.forum_isbn) || '',
        createdAt: post.created_at,
        commentCount: post.comment_count,
        likeCount: post.like_count,
      }))
    }
  }

  /**
   * 최근 활동이 있는 포럼 조회
   */
  static async getRecentlyActiveForums(limitCount: number = 10): Promise<ForumSearchResult[]> {
    const { data: forums } = await supabase
      .from('forums')
      .select('*')
      .order('last_activity_at', { ascending: false })
      .limit(limitCount)

    const forumData = (forums || []) as ForumRow[]

    if (forumData.length === 0) {
      return []
    }

    const forumIsbns = forumData.map((f) => f.isbn)

    // 책 정보 조회
    const { data: books } = await supabase
      .from('books')
      .select('*')
      .in('isbn', forumIsbns)

    const bookData = (books || []) as BookRow[]
    const bookMap = new Map(bookData.map((b) => [b.isbn, b]))

    return forumData.map((forum) => {
      const book = bookMap.get(forum.isbn)

      return {
        isbn: forum.isbn,
        book: {
          isbn: book?.isbn || forum.isbn,
          title: book?.title || '',
          authors: book?.authors || [],
          publisher: book?.publisher || '',
          thumbnail: book?.thumbnail || '',
          contents: book?.contents || '',
        },
        postCount: forum.post_count,
        lastActivityAt: forum.last_activity_at,
        category: forum.category || undefined,
        popularity: forum.popularity,
        averageRating: forum.average_rating,
        totalRatings: forum.total_ratings,
      }
    })
  }

  /**
   * 인기 포럼 조회
   */
  static async getPopularForums(limitCount: number = 10): Promise<ForumSearchResult[]> {
    const { data: forums } = await supabase
      .from('forums')
      .select('*')
      .order('popularity', { ascending: false })
      .order('post_count', { ascending: false })
      .limit(limitCount)

    const forumData = (forums || []) as ForumRow[]

    if (forumData.length === 0) {
      return []
    }

    const forumIsbns = forumData.map((f) => f.isbn)

    // 책 정보 조회
    const { data: books } = await supabase
      .from('books')
      .select('*')
      .in('isbn', forumIsbns)

    const bookData = (books || []) as BookRow[]
    const bookMap = new Map(bookData.map((b) => [b.isbn, b]))

    return forumData.map((forum) => {
      const book = bookMap.get(forum.isbn)

      return {
        isbn: forum.isbn,
        book: {
          isbn: book?.isbn || forum.isbn,
          title: book?.title || '',
          authors: book?.authors || [],
          publisher: book?.publisher || '',
          thumbnail: book?.thumbnail || '',
          contents: book?.contents || '',
        },
        postCount: forum.post_count,
        lastActivityAt: forum.last_activity_at,
        category: forum.category || undefined,
        popularity: forum.popularity,
        averageRating: forum.average_rating,
        totalRatings: forum.total_ratings,
      }
    })
  }
}

export default SearchService
