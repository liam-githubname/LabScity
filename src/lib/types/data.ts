// Core post type - aligned with current database schema
export interface Post {
  postID: string;
  userID: string;
  text: string;
  created_at: string;
  category: string;
  like_amount: number;
}

// Extended post with optional user information (for future expansion)
export interface PostWithAuthor extends Post {
  author?: {
    id: string;
    firstName?: string;
    lastName?: string;
    email?: string;
  };
}

// Response wrapper for consistent API responses
export interface DataResponse<T> {
  success: boolean;
  data?: T;
  error?: string;
}

// Input types for our actions
export interface GetPostByIdInput {
  postID: string;
}

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

export interface GetFeedInput {
  limit?: number;
  offset?: number;
  category?: string;
  userId?: string;
  sortBy?: "created_at" | "like_amount";
  sortOrder?: "asc" | "desc";
}

export interface SearchFeedInput {
  query: string;
  limit?: number;
  offset?: number;
  filters?: {
    category?: string;
    userId?: string;
    dateRange?: {
      from?: string;
      to?: string;
    };
  };
}

export interface GetUserPostsInput {
  userID: string;
  limit?: number;
  cursor?: string; // ISO datetime string for cursor position
  category?: string;
  sortBy?: "created_at" | "like_amount";
  sortOrder?: "asc" | "desc";
}

export interface UserPostsResponse {
  posts: Post[];
  pagination: {
    limit: number;
    hasMore: boolean;
    nextCursor?: string;
    prevCursor?: string;
  };
}
