"use server";

import { z } from "zod";
import type {
  DataResponse,
  GetUserPostsInput,
  UserPostsResponse,
} from "@/lib/types/data";
import {
  getPostByIdInputSchema,
  getUserPostsInputSchema,
  postSchema,
} from "@/lib/validations/data";
import { createClient } from "@/supabase/server";

// NOTE: Do last as will call other funcs
export async function getFeedPosts() {
  // TODO: Will need to retrieve posts by some metrics
  // TODO: Will need to sort posts (chronological probably - with a filter on followed users posts? - then other posts?)
}

export async function getPostById(postID: string) {
  // make connection to database with supabase client
  // search the tables for posts associated with userID

  const supabase = await createClient();
  // FIXME: remove * with explicit columns before prod
  const { data, error } = await supabase
    .from("posts")
    .select("*")
    .eq("postID", postID)
    .single();
  return { data, error };
}


// NOTE: I want to be able to search all posts by certain filters (e.g. kind of science, by date created )
export async function searchPosts(query: string) { }

// NOTE: will comments be associated with posts objects in the database or held somewhere else?
// They might need to be held somewhere else so accessing them without the post can be done (i.e. moderation)
// export async function getComments() {}


export async function getUserPosts(
  input: GetUserPostsInput,
): Promise<DataResponse<UserPostsResponse>> {
  try {
    // Step 1: Input validation using cursor-based schema
    const validatedInput = getUserPostsInputSchema.parse(input);

    // Step 2: Create Supabase client
    const supabase = await createClient();

    // Step 3: Build query with explicit column selection
    // NOTE: The function signatures the lsp gives me are painful at best and downright damaging at worst, read the supabase docs.
    let query = supabase.from("Posts").select(`
        postid,
        userid,
        created_at,
        category,
        text,
        like_amount
      `);

    // Step 4: Apply filters
    query = query.eq("userID", validatedInput.userID);

    if (validatedInput.category) {
      query = query.eq("category", validatedInput.category);
    }

    // Step 5: Apply sorting based on cursor position

    // NOTE: This ternary is confusingly placed here when it's result will not be used till afterwards on line 84. AI is stupid.
    const sortOrder = validatedInput.sortOrder === "asc" ? "asc" : "desc";
    query = query.order(validatedInput.sortBy, {
      ascending: sortOrder === "asc",
    });

    // Step 6: Apply cursor-based pagination
    if (validatedInput.cursor) {
      // For descending order (newest first), cursor points to last seen timestamp
      // For ascending order (oldest first), cursor points to last seen timestamp
      const operator = sortOrder === "desc" ? "lt" : "gt";
      // NOTE: The function signatures are completely useless, .filter(sortBy is the column to use, operator is either less than or greater than, cursor is the thing being evaluated against)
      query = query.filter(
        validatedInput.sortBy,
        operator,
        validatedInput.cursor,
      );
    }

    // Step 7: Apply limit (cursor pagination doesn't need offset)
    query = query.limit(validatedInput.limit + 1); // +1 to determine if hasMore

    // Step 8: Execute query
    const { data: posts, error: dbError } = await query;

    // Step 9: Handle database errors
    if (dbError) {
      console.error("Database error fetching user posts:", dbError);
      return {
        success: false,
        error: "Failed to retrieve user posts",
      };
    }

    // Step 10: Process cursor pagination results
    // NOTE: In typescript ternary expressions can be defined over a non boolean value and will be evaluated based on whether the variable is null or not.
    // In this case posts either has returned data from the db, or it is null.
    // If it has returned it will be parsed and assigned to validatedPosts.
    const validatedPosts = posts ? postSchema.array().parse(posts) : [];

    // Determine if there are more posts
    const hasMore = validatedPosts.length > validatedInput.limit;

    // Remove the extra item used for hasMore detection
    const returnedPosts = hasMore
      ? validatedPosts.slice(0, validatedInput.limit)
      : validatedPosts;

    // Calculate next cursor from last returned post
    const nextCursor =
      returnedPosts.length > 0
        ? String(
          returnedPosts[returnedPosts.length - 1][
          validatedInput.sortBy as keyof (typeof returnedPosts)[0]
          ],
        )
        : undefined;

    // For backward navigation, you might want prev cursor from first item
    const prevCursor =
      returnedPosts.length > 0
        ? String(
          returnedPosts[0][
          validatedInput.sortBy as keyof (typeof returnedPosts)[0]
          ],
        )
        : undefined;

    return {
      success: true,
      data: {
        posts: returnedPosts,
        pagination: {
          limit: validatedInput.limit,
          hasMore,
          nextCursor: nextCursor,
          prevCursor: validatedInput.cursor ? prevCursor : undefined,
        },
      },
    };
  } catch (error) {
    // Step 11: Comprehensive error handling
    console.error("Error in getUserPosts:", error);

    if (error instanceof z.ZodError) {
      return {
        success: false,
        error: `Invalid input: ${error.issues[0]?.message || "Validation failed"}`,
      };
    }

    return {
      success: false,
      error: "An unexpected error occurred while retrieving user posts",
    };
  }
}
