"use server";

import { z } from "zod";
import type { FeedPostItem, GetFeedResult } from "@/lib/types/feed";
import {
	createCommentSchema,
	createPostSchema,
	createReportSchema,
	feedFilterSchema,
	type CreateCommentValues,
	type CreatePostValues,
	type CreateReportValues,
	type FeedFilterValues,
} from "@/lib/validations/post";
import { createClient } from "@/supabase/server";

const idSchema = z.string().min(1, "ID is required");
const postMediaBucket = "post_images";
const allowedImageTypes = ["image/jpeg", "image/png", "image/webp", "image/gif"] as const;

function extensionFromMime(mimeType: string) {
	switch (mimeType) {
		case "image/jpeg":
			return "jpg";
		case "image/png":
			return "png";
		case "image/webp":
			return "webp";
		case "image/gif":
			return "gif";
		default:
			return "bin";
	}
}

export async function createPostImageUploadUrl(contentType: string, supabaseClient?: any) {
	try {
		if (!allowedImageTypes.includes(contentType as (typeof allowedImageTypes)[number])) {
			return { success: false, error: "Only image uploads are supported" };
		}

		const supabase = supabaseClient ?? (await createClient());
		const { data: authData } = await supabase.auth.getUser();

		if (!authData.user) {
			return { success: false, error: "Authentication required" };
		}

		const extension = extensionFromMime(contentType);
		const path = `${authData.user.id}/${crypto.randomUUID()}.${extension}`;

		const { data, error } = await supabase.storage
			.from(postMediaBucket)
			.createSignedUploadUrl(path);

		if (error || !data) {
			return { success: false, error: error?.message ?? "Failed to prepare upload" };
		}

		return {
			success: true,
			data: {
				path,
				token: data.token,
			},
		};
	} catch {
		return { success: false, error: "Failed to prepare upload" };
	}
}

/**
 * Insert a new post into the database with the given content and scientific field. The user must be authenticated to create a post.
 *
 * @param input - Object containing the content, scientific field, and category for the new post
 * @param supabaseClient - Optional Supabase client instance (used for testing)
 * @returns Promise resolving to DataResponse with the created post data or error message
 *
 * @example
 * ```typescript
 * const result = await createPost({ content: "This is a new post about science!", scientificField: "Biology", category: "formal" });
 * if (result.success) {
 *   console.log(result.data.id); // ID of the created post
 * }
 * */

export async function createPost(input: CreatePostValues, supabaseClient?: any) {
	try {
		// Re-validate on server
		const parsed = createPostSchema.parse(input);

		// Get authenticated user
		const supabase = supabaseClient ?? (await createClient());
		const { data: authData } = await supabase.auth.getUser();
		
		if (!authData.user) {
			return { success: false, error: "Authentication required" };
		}

		// Insert post into database
		const { data, error } = await supabase
			.from("posts")
			.insert({
				user_id: authData.user.id,
				scientific_field: parsed.scientificField,
				category: parsed.category,
				text: parsed.content,
				media_path: parsed.mediaPath ?? null,
			})
			.select()
			.single();

		if (error) {
			return { success: false, error: error.message };
		}

		return {
			success: true,
			data: { id: data.post_id, ...parsed },
		};
	} catch (error) {
		if (error instanceof z.ZodError) {
			return {
				success: false,
				error: error.issues[0]?.message ?? "Validation failed",
			};
		}
		return { success: false, error: "Failed to create post" };
	}
}

/**
 * Delete a post from the database. The user must be authenticated and must be the owner of the post.
 *
 * @param postId - The ID of the post to delete
 * @param supabaseClient - Optional Supabase client instance (used for testing)
 * @returns Promise resolving to DataResponse with success status or error message
 *
 * @example
 * ```typescript
 * const result = await deletePost("123");
 * if (result.success) {
 *   console.log("Post deleted successfully");
 * }
 * ```
 */
export async function deletePost(postId: string, supabaseClient?: any) {
	try {
		const postIdStr = String(postId);
		// Validate post ID
		idSchema.parse(postIdStr);

		// Get authenticated user
		const supabase = supabaseClient ?? (await createClient());
		const { data: authData } = await supabase.auth.getUser();
		
		if (!authData.user) {
			return { success: false, error: "Authentication required" };
		}

		const { data: postData, error: postDataError } = await supabase
			.from("posts")
			.select("media_path")
			.eq("post_id", postIdStr)
			.eq("user_id", authData.user.id)
			.maybeSingle();

		if (postDataError) {
			return { success: false, error: postDataError.message };
		}

		if (postData?.media_path) {
			const { error: removeMediaError } = await supabase.storage
				.from(postMediaBucket)
				.remove([postData.media_path]);

			if (removeMediaError) {
				return { success: false, error: removeMediaError.message };
			}
		}

		// Delete post from database (only if user owns it)
		const { error } = await supabase
			.from("posts")
			.delete()
			.eq("post_id", postIdStr)
			.eq("user_id", authData.user.id);

		if (error) {
			return { success: false, error: error.message };
		}

			return { success: true, data: { id: postIdStr } };
	} catch (error) {
		if (error instanceof z.ZodError) {
			return {
				success: false,
				error: error.issues[0]?.message ?? "Validation failed",
			};
		}
		return { success: false, error: "Failed to delete post" };
	}
}

// NOTE: Do last as will call other funcs
// TODO: Dr. Sharonwski wants to have non followed user's posts to enter the feed. This is going to be difficult to test without content on the platform.
// TODO: Dependency Injection possibility here because we have two kinds of feeds
/**
 * Fetch feed posts with optional category filtering and cursor-based pagination.
 * Returns posts sorted by creation date (most recent first).
 *
 * @param input - Feed filter values (category, cursor, limit)
 * @param supabaseClient - Optional Supabase client instance (used for testing)
 * @returns Promise resolving to DataResponse with posts array and nextCursor for pagination
 *
 * @example
 * ```typescript
 * const result = await getFeed({ category: "formal", limit: 20 });
 * if (result.success) {
 *   console.log(result.data.posts); // Array of posts
 * }
 * ```
 */
export async function getFeed(input: FeedFilterValues, supabaseClient?: any) {
	try {
		// Re-validate on server
		const parsed = feedFilterSchema.parse(input);

		// Get authenticated user
		const supabase = supabaseClient ?? (await createClient());
		const { data: authData } = await supabase.auth.getUser();

		// Build the query
		let query = supabase
			.from("posts")
			.select(
				`
				post_id,
				created_at,
				category,
				text,
				like_amount,
				scientific_field,
				user_id,
				media_path,
				users:user_id(user_id, first_name, last_name, profile_pic_path),
				likes(user_id)
			`
			)
			.order("created_at", { ascending: false });

		// Apply category filter if provided
		if (parsed.category) {
			query = query.eq("category", parsed.category);
		}

		// Apply cursor pagination (fetch limit + 1 to detect if more posts exist)
		const pageSize = parsed.limit;
		if (parsed.cursor) {
			query = query.lt("post_id", parsed.cursor);
		}
		query = query.limit(pageSize + 1);

		const { data: posts, error } = await query;

		if (error) {
			return { success: false, error: error.message };
		}

		if (!posts) {
			return { success: true, data: { posts: [], nextCursor: null } };
		}

		// Check if there are more posts beyond the page size
		const hasMore = posts.length > pageSize;
		const postsToReturn = hasMore ? posts.slice(0, pageSize) : posts;

		// Determine next cursor
		const nextCursor = hasMore ? postsToReturn[postsToReturn.length - 1]?.post_id : null;

		// Helper function to calculate time ago
		const getTimeAgo = (date: string): string => {
			const now = new Date();
			const postDate = new Date(date);
			const diffInSeconds = Math.floor((now.getTime() - postDate.getTime()) / 1000);

			if (diffInSeconds < 60) return "just now";
			if (diffInSeconds < 3600) return `${Math.floor(diffInSeconds / 60)}m ago`;
			if (diffInSeconds < 86400) return `${Math.floor(diffInSeconds / 3600)}h ago`;
			if (diffInSeconds < 604800) return `${Math.floor(diffInSeconds / 86400)}d ago`;
			return postDate.toLocaleDateString();
		};

		// Fetch comments for each post
		const postsWithComments = await Promise.all(
			postsToReturn.map(async (post: any) => {
				const { data: comments } = await supabase
					.from("comment")
					.select(
						`
						comment_id,
						text,
						created_at,
						user_id,
						users:user_id(user_id, first_name, last_name, profile_pic_path),
						comment_likes(user_id)
					`
					)
					.eq("post_id", post.post_id)
					.order("created_at", { ascending: false });

				return { post, comments: comments || [] };
			})
		);

		// Format the response
		const formattedPosts = postsWithComments.map(({ post, comments }: any) => {
			const mediaUrl = post.media_path
				? supabase.storage.from(postMediaBucket).getPublicUrl(post.media_path).data.publicUrl
				: null;
			const postAvatarUrl = post.users?.profile_pic_path
				? supabase.storage.from("profile_pictures").getPublicUrl(post.users.profile_pic_path).data.publicUrl
				: null;

			return {
			id: post.post_id,
			userId: post.user_id,
			userName: `${post.users?.first_name} ${post.users?.last_name}`.trim(),
			avatarUrl: postAvatarUrl,
			scientificField: post.scientific_field,
			content: post.text,
			mediaUrl,
			timeAgo: getTimeAgo(post.created_at),
			comments: comments.map((comment: any) => ({
				id: comment.comment_id,
				userId: comment.user_id,
				userName: `${comment.users?.first_name} ${comment.users?.last_name}`.trim(),
				avatarUrl: comment.users?.profile_pic_path
					? supabase.storage.from("profile_pictures").getPublicUrl(comment.users.profile_pic_path).data.publicUrl
					: null,
				content: comment.text,
				timeAgo: getTimeAgo(comment.created_at),
				isLiked: authData.user
					? comment.comment_likes?.some((like: any) => like.user_id === authData.user?.id)
					: false,
			})),
			isLiked: post.likes && post.likes.length > 0 && authData.user
				? post.likes.some((like: any) => like.user_id === authData.user?.id)
				: false,
			likeCount: post.like_amount ?? 0,
			};
		});

		const data: GetFeedResult = {
			posts: formattedPosts,
			nextCursor,
		};
		return { success: true, data };
	} catch (error) {
		if (error instanceof z.ZodError) {
			return {
				success: false,
				error: error.issues[0]?.message ?? "Validation failed",
			};
		}
		return { success: false, error: "Failed to fetch feed" };
	}
}

/**
 * Insert a new comment into the database for a specific post. The user must be authenticated to create a comment.
 *
 * @param postId - The ID of the post to comment on
 * @param values - Object containing the comment content
 * @param supabaseClient - Optional Supabase client instance (used for testing)
 * @returns Promise resolving to DataResponse with the created comment data or error message
 *
 * @example
 * ```typescript
 * const result = await createComment("123", { content: "Great post!", userName: "John" });
 * if (result.success) {
 *   console.log(result.data.id); // ID of the created comment
 * }
 * ```
 */
export async function createComment(postId: string, values: CreateCommentValues, supabaseClient?: any) {
	try {
		const postIdStr = String(postId);
		idSchema.parse(postIdStr);
		const parsed = createCommentSchema.parse(values);

		// Get authenticated user
		const supabase = supabaseClient ?? (await createClient());
		const { data: authData } = await supabase.auth.getUser();
		
		if (!authData.user) {
			return { success: false, error: "Authentication required" };
		}

		// Insert comment into database
		const { data, error } = await supabase
			.from("comment")
			.insert({
				post_id: postIdStr,
				user_id: authData.user.id,
				text: parsed.content,
			})
			.select()
			.single();

		if (error) {
			return { success: false, error: error.message };
		}

		return { success: true, data: { id: data.comment_id, ...parsed } };
	} catch (error) {
		if (error instanceof z.ZodError) {
			return {
				success: false,
				error: error.issues[0]?.message ?? "Validation failed",
			};
		}
		return { success: false, error: "Failed to create comment" };
	}
}

/**
 * Delete a comment from the database. The user must be authenticated and must be the owner of the comment.
 *
 * @param commentId - The ID of the comment to delete
 * @param supabaseClient - Optional Supabase client instance (used for testing)
 * @returns Promise resolving to DataResponse with success status or error message
 *
 * @example
 * ```typescript
 * const result = await deleteComment("456");
 * if (result.success) {
 *   console.log("Comment deleted successfully");
 * }
 * ```
 */
export async function deleteComment(commentId: string, supabaseClient?: any) {
	try {
		const commentIdStr = String(commentId);
		// Validate comment ID
		idSchema.parse(commentIdStr);

		// Get authenticated user
		const supabase = supabaseClient ?? (await createClient());
		const { data: authData } = await supabase.auth.getUser();
		
		if (!authData.user) {
			return { success: false, error: "Authentication required" };
		}

		// Delete comment from database (only if user owns it)
		const { error } = await supabase
			.from("comment")
			.delete()
			.eq("comment_id", commentIdStr)
			.eq("user_id", authData.user.id);

		if (error) {
			return { success: false, error: error.message };
		}

			return { success: true, data: { id: commentIdStr } };
	} catch (error) {
		if (error instanceof z.ZodError) {
			return {
				success: false,
				error: error.issues[0]?.message ?? "Validation failed",
			};
		}
		return { success: false, error: "Failed to delete comment" };
	}
}

/**
 * Create a report for a post or comment. The user must be authenticated to submit a report.
 * The reported user is determined based on whether a comment is being reported or the post itself.
 *
 * @param postId - The ID of the post being reported
 * @param commentId - The ID of the comment being reported (null if reporting the post)
 * @param values - Object containing the report type and reason
 * @param supabaseClient - Optional Supabase client instance (used for testing)
 * @returns Promise resolving to DataResponse with success status or error message
 *
 * @example
 * ```typescript
 * const result = await createReport("123", null, { type: "Spam/Scam", reason: "This is spam" });
 * if (result.success) {
 *   console.log("Report submitted successfully");
 * }
 * ```
 */
export async function createReport(
	postId: string,
	commentId: string | null,
	values: CreateReportValues,
	supabaseClient?: any,
) {
	try {
		const postIdStr = String(postId);
		const commentIdStr = commentId ? String(commentId) : null;
		idSchema.parse(postIdStr);
		if (commentIdStr != null) idSchema.parse(commentIdStr);
		const parsed = createReportSchema.parse(values);

		// Get authenticated user
		const supabase = supabaseClient ?? (await createClient());
		const { data: authData } = await supabase.auth.getUser();
		
		if (!authData.user) {
			return { success: false, error: "Authentication required" };
		}

		let reportedUserId: string;

		if (commentIdStr != null) {
			// Report is for a comment - get the comment creator's user_id
			const { data: commentData, error: commentError } = await supabase
				.from("comment")
				.select("user_id")
				.eq("comment_id", commentIdStr)
				.single();

			if (commentError || !commentData) {
				return { success: false, error: "Comment not found" };
			}

			reportedUserId = commentData.user_id;
		} else {
			// Report is for a post - get the post creator's user_id
			const { data: postData, error: postError } = await supabase
				.from("posts")
				.select("user_id")
				.eq("post_id", postIdStr)
				.single();

			if (postError || !postData) {
				return { success: false, error: "Post not found" };
			}

			reportedUserId = postData.user_id;
		}

		// Insert report into database
		const { error } = await supabase
			.from("feed_report")
			.insert({
				reporter_id: authData.user.id,
				reported_id: reportedUserId,
				post_id: postIdStr,
				comment_id: commentIdStr,
				type: parsed.type,
				additional_context: parsed.reason,
			});

		if (error) {
			return { success: false, error: error.message };
		}

		return { success: true };
	} catch (error) {
		if (error instanceof z.ZodError) {
			return {
				success: false,
				error: error.issues[0]?.message ?? "Validation failed",
			};
		}
		return { success: false, error: "Failed to submit report" };
	}
}

/**
 * Toggle like status for a post. If the user has already liked the post, it will be unliked. If not liked, it will be liked.
 * The user must be authenticated to like/unlike a post.
 *
 * @param postId - The ID of the post to like/unlike
 * @param supabaseClient - Optional Supabase client instance (used for testing)
 * @returns Promise resolving to DataResponse with isLiked status (true if liked, false if unliked) or error message
 *
 * @example
 * ```typescript
 * const result = await likePost("123");
 * if (result.success) {
 *   console.log(result.data.isLiked); // true if post was liked, false if unliked
 * }
 * ```
 */
export async function likePost(postId: string, supabaseClient?: any) {
	try {
		const postIdStr = String(postId);
		idSchema.parse(postIdStr);

		// Get authenticated user
		const supabase = supabaseClient ?? (await createClient());
		const { data: authData } = await supabase.auth.getUser();
		
		if (!authData.user) {
			return { success: false, error: "Authentication required" };
		}

		// Check if like already exists
		const { data: existingLike } = await supabase
			.from("likes")
			.select()
			.eq("post_id", postIdStr)
			.eq("user_id", authData.user.id)
			.maybeSingle();

		if (existingLike) {
			// Unlike: Remove like and decrement like_amount
			const { error: deleteError } = await supabase
				.from("likes")
				.delete()
				.eq("post_id", postIdStr)
				.eq("user_id", authData.user.id);

			if (deleteError) {
				return { success: false, error: deleteError.message };
			}

			// Decrement like_amount on the post
			const { error: updateError } = await supabase.rpc("decrement_like_amount", {
				post_id_param: postIdStr,
			});

			if (updateError) {
				return { success: false, error: updateError.message };
			}

			return { success: true, data: { isLiked: false } };
		} else {
			// Like: Insert like and increment like_amount
			const { error: insertError } = await supabase
				.from("likes")
				.insert({
					post_id: postIdStr,
					user_id: authData.user.id,
				});

			if (insertError) {
				return { success: false, error: insertError.message };
			}

			// Increment like_amount on the post
			const { error: updateError } = await supabase.rpc("increment_like_amount", {
				post_id_param: postIdStr,
			});

			if (updateError) {
				return { success: false, error: updateError.message };
			}

			return { success: true, data: { isLiked: true } };
		}
	} catch (error) {
		if (error instanceof z.ZodError) {
			return {
				success: false,
				error: error.issues[0]?.message ?? "Validation failed",
			};
		}
		return { success: false, error: "Failed to update like" };
	}
}


/**
 * Get the top 5 trending scientific fields for the current month based on post count.
 * Returns hashtags formatted with # prefix. If fewer than 5 fields exist, fills remaining slots with #FeedMeMorePosts.
 *
 * @param supabaseClient - Optional Supabase client instance (used for testing)
 * @returns Promise resolving to DataResponse with array of 5 hashtags or error message
 *
 * @example
 * ```typescript
 * const result = await getTrendingScientificFields();
 * if (result.success) {
 *   console.log(result.data.hashtags); // ["#Biology", "#Physics", ...]
 * }
 * ```
 */
export async function getTrendingScientificFields(supabaseClient?: any) {
	try {
		const supabase = supabaseClient ?? (await createClient());

		// Get the date from 30 days ago
		const now = new Date();
		const thirtyDaysAgo = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);

		// Query posts from the last 30 days with their like amounts
		const { data: posts, error } = await supabase
			.from("posts")
			.select("scientific_field, like_amount")
			.gte("created_at", thirtyDaysAgo.toISOString());

		if (error) {
			return { success: false, error: error.message };
		}

		if (!posts || posts.length === 0) {
			// No posts this month, return array filled with #FeedMeMorePosts
			const hashtags = Array(5).fill("#FeedMeMorePosts");
			return { success: true, data: { hashtags } };
		}

		const isTrendingFieldExcluded = (field: unknown) => {
			if (typeof field !== "string") {
				return true;
			}

			const normalizedField = field.trim().replace(/^#+/, "").toLowerCase();
			return !normalizedField || normalizedField === "other" || normalizedField === "null";
		};

		// Aggregate posts and likes by scientific field, excluding placeholder values
		const fieldScores = posts.reduce(
			(acc: Record<string, { postCount: number; totalLikes: number }>, post: any) => {
				const field = post.scientific_field;
				if (isTrendingFieldExcluded(field)) {
					return acc;
				}
				if (!acc[field]) {
					acc[field] = { postCount: 0, totalLikes: 0 };
				}
				acc[field].postCount += 1;
				acc[field].totalLikes += post.like_amount || 0;
				return acc;
			},
			{} as Record<string, { postCount: number; totalLikes: number }>
		);

		// Calculate weighted score: (postCount * 1) + (totalLikes * 0.5)
		// This means 2 likes = 1 post in terms of scoring
		const fieldRankings = Object.entries(fieldScores).map(([field, scores]: any) => ({
			field,
			score: scores.postCount + scores.totalLikes * 0.5,
			postCount: scores.postCount,
			totalLikes: scores.totalLikes,
		}));

		// Sort by score (descending) and get top 5
		const topFields = fieldRankings
			.sort((a, b) => b.score - a.score)
			.slice(0, 5)
			.map(({ field }) => `#${field}`);

		// Fill remaining slots with #FeedMeMorePosts if fewer than 5 fields
		const hashtags = [
			...topFields,
			...Array(Math.max(0, 5 - topFields.length)).fill("#FeedMeMorePosts"),
		];

		return { success: true, data: { hashtags } };
	} catch (error) {
		if (error instanceof z.ZodError) {
			return {
				success: false,
				error: error.issues[0]?.message ?? "Validation failed",
			};
		}
		return { success: false, error: "Failed to fetch trending fields" };
	}
}

/**
 * Toggle like status for a comment. If the user has already liked the comment, it will be unliked. If not liked, it will be liked.
 * The user must be authenticated to like/unlike a comment.
 *
 * @param commentId - The ID of the comment to like/unlike
 * @param supabaseClient - Optional Supabase client instance (used for testing)
 * @returns Promise resolving to DataResponse with isLiked status (true if liked, false if unliked) or error message
 *
 * @example
 * ```typescript
 * const result = await likeComment("456");
 * if (result.success) {
 *   console.log(result.data.isLiked); // true if comment was liked, false if unliked
 * }
 * ```
 */
export async function likeComment(commentId: string, supabaseClient?: any) {
	try {
		const commentIdStr = String(commentId);
		idSchema.parse(commentIdStr);

		// Get authenticated user
		const supabase = supabaseClient ?? (await createClient());
		const { data: authData } = await supabase.auth.getUser();
		
		if (!authData.user) {
			return { success: false, error: "Authentication required" };
		}

		// Check if like already exists
		const { data: existingLike } = await supabase
			.from("comment_likes")
			.select()
			.eq("comment_id", commentIdStr)
			.eq("user_id", authData.user.id)
			.maybeSingle();

		if (existingLike) {
			// Unlike: Remove like and decrement like_count
			const { error: deleteError } = await supabase
				.from("comment_likes")
				.delete()
				.eq("comment_id", commentIdStr)
				.eq("user_id", authData.user.id);

			if (deleteError) {
				return { success: false, error: deleteError.message };
			}

			// Decrement like_count on the comment
			const { error: updateError } = await supabase.rpc("decrement_comment_like_count", {
				comment_id_param: commentIdStr,
			});

			if (updateError) {
				return { success: false, error: updateError.message };
			}

			return { success: true, data: { isLiked: false } };
		} else {
			// Like: Insert like and increment like_count
			const { error: insertError } = await supabase
				.from("comment_likes")
				.insert({
					comment_id: commentIdStr,
					user_id: authData.user.id,
				});

			if (insertError) {
				return { success: false, error: insertError.message };
			}

			// Increment like_count on the comment
			const { error: updateError } = await supabase.rpc("increment_comment_like_count", {
				comment_id_param: commentIdStr,
			});

			if (updateError) {
				return { success: false, error: updateError.message };
			}

			return { success: true, data: { isLiked: true } };
		}
	} catch (error) {
		if (error instanceof z.ZodError) {
			return {
				success: false,
				error: error.issues[0]?.message ?? "Validation failed",
			};
		}
		return { success: false, error: "Failed to update like" };
	}
}

/**
 * Fetch a single post with its comments, user data, and like status.
 * Reuses the same query/formatting logic as getFeed, scoped to one post.
 *
 * @param postId - The ID of the post to fetch
 * @param supabaseClient - Optional Supabase client instance (used for testing)
 * @returns Promise resolving to DataResponse with FeedPostItem or null if not found
 */
export async function getPostDetail(postId: string, supabaseClient?: any): Promise<{ success: true; data: FeedPostItem | null } | { success: false; error: string }> {
	try {
		const postIdStr = String(postId);
		idSchema.parse(postIdStr);

		const supabase = supabaseClient ?? (await createClient());
		const { data: authData } = await supabase.auth.getUser();

		const { data: post, error } = await supabase
			.from("posts")
			.select(
				`
				post_id,
				created_at,
				category,
				text,
				like_amount,
				scientific_field,
				user_id,
				media_path,
				users:user_id(user_id, first_name, last_name, profile_pic_path),
				likes(user_id)
			`
			)
			.eq("post_id", postIdStr)
			.maybeSingle();

		if (error) {
			return { success: false, error: error.message };
		}

		if (!post) {
			return { success: true, data: null };
		}

		const getTimeAgo = (date: string): string => {
			const now = new Date();
			const postDate = new Date(date);
			const diffInSeconds = Math.floor((now.getTime() - postDate.getTime()) / 1000);

			if (diffInSeconds < 60) return "just now";
			if (diffInSeconds < 3600) return `${Math.floor(diffInSeconds / 60)}m ago`;
			if (diffInSeconds < 86400) return `${Math.floor(diffInSeconds / 3600)}h ago`;
			if (diffInSeconds < 604800) return `${Math.floor(diffInSeconds / 86400)}d ago`;
			return postDate.toLocaleDateString();
		};

		const { data: comments } = await supabase
			.from("comment")
			.select(
				`
				comment_id,
				text,
				created_at,
				user_id,
				users:user_id(user_id, first_name, last_name, profile_pic_path),
				comment_likes(user_id)
			`
			)
			.eq("post_id", postIdStr)
			.order("created_at", { ascending: false });

		const mediaUrl = post.media_path
			? supabase.storage.from(postMediaBucket).getPublicUrl(post.media_path).data.publicUrl
			: null;
		const postAvatarUrl = post.users?.profile_pic_path
			? supabase.storage.from("profile_pictures").getPublicUrl(post.users.profile_pic_path).data.publicUrl
			: null;

		const formatted: FeedPostItem = {
			id: post.post_id,
			userId: post.user_id,
			userName: `${post.users?.first_name} ${post.users?.last_name}`.trim(),
			avatarUrl: postAvatarUrl,
			scientificField: post.scientific_field,
			content: post.text,
			mediaUrl,
			timeAgo: getTimeAgo(post.created_at),
			comments: (comments || []).map((comment: any) => ({
				id: comment.comment_id,
				userId: comment.user_id,
				userName: `${comment.users?.first_name} ${comment.users?.last_name}`.trim(),
				avatarUrl: comment.users?.profile_pic_path
					? supabase.storage.from("profile_pictures").getPublicUrl(comment.users.profile_pic_path).data.publicUrl
					: null,
				content: comment.text,
				timeAgo: getTimeAgo(comment.created_at),
				isLiked: authData.user
					? comment.comment_likes?.some((like: any) => like.user_id === authData.user?.id)
					: false,
			})),
			isLiked: post.likes && post.likes.length > 0 && authData.user
				? post.likes.some((like: any) => like.user_id === authData.user?.id)
				: false,
			likeCount: post.like_amount ?? 0,
		};

		return { success: true, data: formatted };
	} catch (error) {
		if (error instanceof z.ZodError) {
			return {
				success: false,
				error: error.issues[0]?.message ?? "Validation failed",
			};
		}
		return { success: false, error: "Failed to fetch post" };
	}
}
