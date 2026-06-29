import { FeedCommentItem, User } from '@/lib/types/feed'
import { PublicationType } from './publication';

/** Core post type aligned with database schema */
export interface Post {
  post_id: number;
  user_id: string;
  text?: string;
  media_path?: string | null;
  media_url?: string | null;
  media_height?: number | null;
  media_width?: number | null;
  created_at: string;
  category?: string;
  scientific_field?: string | null;
  like_amount: number;
  isLiked?: boolean;
  comments?: FeedCommentItem[];
}

export interface Group {
  group_id: number;
  name: string;
  description: string | null;
  created_at: string; // ISO 8601 string from 'timestamp with time zone'
  conversation_id: number | null;
  topics: string[] | null;
  last_activity_at: string | null;
  privacy: 'public' | 'private' | null;
  avatar_url: string | null;
  cover_photo_url: string | null;
  rules: string | null;
}

export interface Product {
  product_id: number;
  title: string;
  short_summary: string | null;
  website_link: string | null;
  publication_id: number | null;
  image_path: string | null;
  github_link: string | null;
  other_links: string[] | null;
  contributors: string[] | null;
  is_featured: boolean | null;
  product_type: string | null;
}

export interface Publication {
  publication_id: number;
  title: string;
  doi: string | null;
  journal: string | null;
  date_published: string | null;
  authors: string[] | null;
  preview_path: string | null;
  is_oa: boolean;
  pdf_url: string | null;
  type: PublicationType | null;
  is_featured: boolean;
  topics: Array<string> | null;
}

export interface Job {
  id: number;
  title: string;
  description: string;
  created_at: string;
  poster_id: string;
  summary: string | null;
  location: string | null;
  department: string | null;
  organization: string | null;
  work_mode: "on-site" | "remote" | "hybrid" | null;
  job_type: "Full-time" | "Part-time" | "Internship" | "Contract" | null;
  academia_role: "Postdoc" | "Faculty" | "PhD" | "Grad Student"  | null;
  application_link: string | null;
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

