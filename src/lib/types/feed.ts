/**
 * Type definitions for the feed feature
 * Based on Supabase database schema
 */

export type PostCategory = "formal" | "natural" | "social" | "applied" | "general";

/**
 * User/Profile type from the users/profile tables
 */
export interface User {
  user_id: string;
  first_name: string;
  last_name: string;
  email: string;
  research_interests?: string[];
  profile_pic_path?: string | null;
  profile_header_path?: string | null;
  avatar_url?: string | null;
  // Extended profile fields (from public.profile), all optional so callers
  // can safely consume them even if the current query doesn't join profile.
  about?: string | null;
  occupation?: string | null;
  workplace?: string | null;
  skills?: string[] | null;
  /** Profile articles (title + URL). From public.profile.articles jsonb. */
  articles?: { title: string; url: string }[] | null;
  banner_pic_url?: string | null;
  profile_header_url?: string | null;
}

/**
 * Post type from the posts table
 */
export interface Post {
  id: string;
  user_id: string;
  content: string;
  media_url: string | null;
  category: PostCategory;
  link: string | null;
  created_at: string;
}

/**
 * Comment type from the comments table
 */
export interface Comment {
  id: string;
  user_id: string;
  post_id: string;
  content: string;
  created_at: string;
}

/**
 * Like type from the likes table
 */
export interface Like {
  id: string;
  user_id: string;
  post_id: string;
}

/**
 * Extended Post type with related data (user, comments, likes)
 * Used for feed display
 */
export interface PostWithRelations extends Post {
  user: User;
  comments: Comment[];
  likes: Like[];
  comment_count: number;
  like_count: number;
  is_liked: boolean;
}

/**
 * Local feed display type used by the home feed UI
 */
export interface FeedPostItem {
  id: string;
  userId: string;
  userName: string;
  avatarUrl?: string | null;
  scientificField: string;
  content: string;
  timeAgo: string;
  mediaUrl?: string | null;
  mediaLabel?: string | null;
  comments: FeedCommentItem[];
  isLiked?: boolean;
  likeCount?: number;
  audienceLabel?: string | null;
}

export interface FeedCommentItem {
  id: string;
  userId: string;
  userName: string;
  avatarUrl?: string | null;
  content: string;
  timeAgo: string;
  isLiked?: boolean;
}

/**
 * Shape returned by getFeed server action on success.
 * Used for TanStack Query so the client expects posts as FeedPostItem[].
 */
export interface GetFeedResult {
  posts: FeedPostItem[];
  nextCursor: string | null;
}
