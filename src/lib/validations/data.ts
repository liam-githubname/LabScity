import { z } from "zod";

// =============================================================================
// CLIENT INPUT SCHEMAS
// =============================================================================
// These schemas validate data coming FROM the frontend/client.
// Used in server actions to sanitize and validate input parameters.
// Usage: const validated = schema.parse(inputData);

/**
 * Validates input for getting a single post by ID
 * Used when client requests a specific post
 */
export const getPostByIdInputSchema = z.object({
  postID: z.string().min(1, "Post ID is required"),
});

/**
 * Validates input for retrieving feed posts
 * Supports pagination, filtering by category/user, and sorting options
 */
export const getFeedInputSchema = z.object({
  limit: z.number().min(1).max(100).default(10),
  offset: z.number().min(0).default(0),
  category: z.string().optional(),
  userId: z.string().optional(),
  sortBy: z.enum(["created_at", "like_amount"]).default("created_at"),
  sortOrder: z.enum(["asc", "desc"]).default("desc"),
});

/**
 * Validates input for searching posts with natural language queries
 * Supports complex filtering including date ranges and category/user filters
 */
export const searchFeedInputSchema = z.object({
  query: z.string().min(1).max(500),
  limit: z.number().min(1).max(100).default(10),
  offset: z.number().min(0).default(0),
  filters: z
    .object({
      category: z.string().optional(),
      userId: z.string().optional(),
      dateRange: z
        .object({
          from: z.iso.datetime(),
          to: z.iso.datetime(),
        })
        .optional(),
    })
    .optional(),
});

/**
 * Validates input for retrieving posts from a specific user using cursor pagination
 * Used for profile pages and user-specific content views
 * Cursor-based pagination provides better performance for real-time feeds
 */
export const getUserPostsInputSchema = z.object({
  userID: z.string(),
  limit: z.number().min(1).max(100).default(10),
  cursor: z.iso.datetime(), // ISO datetime string for cursor position
  category: z.string().optional(),
  sortBy: z.enum(["created_at", "like_amount"]).default("created_at"),
  sortOrder: z.enum(["asc", "desc"]).default("desc"),
});

// =============================================================================
// DUAL-PURPOSE SCHEMAS
// =============================================================================
// These schemas are used both for client input validation and server response validation.
// They represent the core data model and ensure consistency across the application.

/**
 * Core post data structure
 * Used both for validating post data from database and post input from client
 */
export const postSchema = z.object({
  postID: z.string(),
  userID: z.string(),
  text: z
    .string()
    .min(1, "Post text is required")
    .max(5000, "Post text too long"),
  created_at: z.string(),
  category: z
    .string()
    .min(1, "Category is required")
    .max(50, "Category too long"),
  like_amount: z.number().min(0, "Like amount cannot be negative"),
});

// =============================================================================
// SERVER RESPONSE SCHEMAS
// =============================================================================
// These schemas validate data being returned TO the frontend/client.
// Used to ensure API responses match the expected contract.

/**
 * Validates feed response structure with posts and pagination metadata
 * Ensures consistent pagination information for client-side state management
 */
export const feedResponseSchema = z.object({
  posts: z.array(postSchema),
  pagination: z.object({
    limit: z.number().min(1),
    cursor: z.iso.datetime(),
    hasMore: z.boolean(),
  }),
  filters: z
    .object({
      category: z.string().optional(),
      userId: z.string().optional(),
    })
    .optional(),
});

/**
 * Validates user posts response structure with cursor-based pagination
 * Includes cursor metadata for efficient real-time feed navigation
 */
export const userPostsResponseSchema = z.object({
  posts: z.array(postSchema),
  pagination: z.object({
    limit: z.number().min(1),
    hasMore: z.boolean(),
    nextCursor: z.iso.datetime(),
    prevCursor: z.iso.datetime(),
  }),
});

// =============================================================================
// TYPE EXPORTS
// =============================================================================
// TypeScript types inferred from schemas for convenience and type safety

// Client Input Types
export type GetPostByIdInput = z.infer<typeof getPostByIdInputSchema>;
export type GetFeedInput = z.infer<typeof getFeedInputSchema>;
export type SearchFeedInput = z.infer<typeof searchFeedInputSchema>;
export type GetUserPostsInput = z.infer<typeof getUserPostsInputSchema>;

// Server Response Types
export type PostData = z.infer<typeof postSchema>;
export type FeedResponseSchema = z.infer<typeof feedResponseSchema>;
export type UserPostsResponseSchema = z.infer<typeof userPostsResponseSchema>;
