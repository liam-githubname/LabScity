import { User } from '@/lib/types/feed'

/** Core post type aligned with database schema */
export interface Post {
  post_id: number;
  user_id: string;
  text?: string;
  media_path?: string | null;
  media_url?: string | null;
  created_at: string;
  category?: string;
  like_amount: number;
}

/** Extended post with optional author information */
export interface PostWithAuthor extends Post {
  author?: {
    id: string;
    firstName?: string;
    lastName?: string;
    email?: string;
  };
}

/** Generic wrapper for consistent API responses */
export interface DataResponse<T> {
  success: boolean;
  data?: T;
  error?: string;
}

/** Input for fetching a single post by ID */
export interface GetPostByIdInput {
  post_id: number;
}

/** Response containing posts with pagination and filters */
export interface FeedResponse {
  posts: Post[];
  pagination: {
    total: number;
    limit: number;
    offset: number;
    hasMore: boolean;
    nextOffset?: number;
  };
  filters?: {
    category?: string;
    userId?: string;
  };
}

/** Input parameters for retrieving feed posts */
export interface GetFeedInput {
  limit?: number;
  offset?: number;
  category?: string;
  userId?: string;
  sortBy?: "created_at" | "like_amount";
  sortOrder?: "asc" | "desc";
}

/** Input for searching posts with filters and pagination */
export interface SearchInput {
  query: string;
  limit?: number;
};

/** Input for fetching user-specific posts with pagination */
export interface GetUserPostsInput {
  user_id: string;
  limit?: number;
  cursor?: string; // ISO datetime string for cursor position
  category?: string;
  sortBy?: "created_at" | "like_amount";
  sortOrder?: "asc" | "desc";
}

/** Response for user posts with cursor-based pagination */
export interface UserPostsResponse {
  posts: Post[];
  pagination: {
    limit: number;
    hasMore: boolean;
    nextCursor?: string;
    prevCursor?: string;
  };
}

// NOTE: This is extremely fragile. Will need to be updated if changes are made to search view on db
/** Holds a single response from search function */
export interface searchResult {
  content_type: string,
  content: string,
  category: string,
  id: string,
  names: string,
  tsv: string,
};

