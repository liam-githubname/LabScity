/**
 * Type definitions for the feed feature
 * Based on Supabase database schema
 */

export type PostCategory = "formal" | "natural" | "social" | "applied" | "general";

/**
 * User/Profile type from the profiles table
 */
export interface User {
	id: string;
	first_name: string;
	last_name: string;
	research_interests: string[];
	avatar_url: string | null;
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
	userName: string;
	scientificField: string;
	content: string;
	timeAgo: string;
	mediaUrl?: string | null;
	mediaLabel?: string | null;
	comments: FeedCommentItem[];
	isLiked?: boolean;
}

export interface FeedCommentItem {
	id: string;
	userName: string;
	content: string;
	timeAgo: string;
	isLiked?: boolean;
}
