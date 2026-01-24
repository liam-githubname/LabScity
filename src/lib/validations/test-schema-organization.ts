// Verification test for schema reorganization
// This file demonstrates the organized validation schemas usage

import {
  type FeedResponseSchema,
  // Server Response Schemas
  feedResponseSchema,
  type GetFeedInput,
  // Type Exports
  type GetPostByIdInput,
  type GetUserPostsInput,
  getFeedInputSchema,
  // Client Input Schemas
  getPostByIdInputSchema,
  getUserPostsInputSchema,
  type PostData,
  // Dual-Purpose Schemas
  postSchema,
  type SearchFeedInput,
  searchFeedInputSchema,
  type UserPostsResponseSchema,
  userPostsResponseSchema,
} from "@/lib/validations/data";

// Test client input validation
const testClientInput = {
  postID: "test-post-id",
  limit: 10,
  category: "science",
};

const validatedInput = getPostByIdInputSchema.parse(testClientInput);
console.log("✅ Client input validation works:", validatedInput);

// Test server response validation
const testServerResponse = {
  posts: [
    postSchema.parse({
      postID: "test-id",
      userID: "user-id",
      text: "Test post content",
      created_at: "2024-01-01T00:00:00Z",
      category: "science",
      like_amount: 42,
    }),
  ],
  pagination: {
    limit: 10,
    cursor: "2024-01-01T00:00:00Z",
    hasMore: true,
  },
};

const validatedResponse = feedResponseSchema.parse(testServerResponse);
console.log("✅ Server response validation works:", validatedResponse);

console.log("🎉 Schema reorganization verification complete!");
