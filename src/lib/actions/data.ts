"use server";

import { success, z } from "zod";
import type {
  Post,
  GetPostByIdInput,
  DataResponse,
  GetUserPostsInput,
  UserPostsResponse,
  searchResult,
  SearchInput,
  Group,
} from "@/lib/types/data";

import { User } from "@/lib/types/feed"

import {
  getPostByIdInputSchema,
  getUserPostsInputSchema,
  postSchema,
  searchResultSchema,
  SearchResultSchema,
} from "@/lib/validations/data";
import { createClient } from "@/supabase/server";
import { SupabaseClient } from "@supabase/supabase-js";


// Returns a Promise<DataResponse<Post>>
// The Promise object represents the eventual completion (or failure) of an asynchronous operation and its resulting value. - mdn 2026
// DataResponse is the interface created to unify all our responses.
// Post is the interface created to represent a Post from our database.

/**
 * Retrieves a single post from the database by its ID.
 *
 * @param input - Object containing the post_id to fetch
 * @param supabaseClient - Optional Supabase client instance (used for testing)
 * @returns Promise resolving to DataResponse with the post data or error message
 *
 * @example
 * ```typescript
 * const result = await getPostById({ post_id: GetPostByIdInput });
 * if (result.success) {
 *   console.log(result.data.text);
 * }
 * */
export async function getPostById(input: GetPostByIdInput, supabaseClient?: any):
  Promise<DataResponse<Post>> {

  try {

    const supabase = supabaseClient || await createClient();

    const validatedInput = getPostByIdInputSchema.parse(input);

    let query = supabase.from('posts').select(`
    post_id,
    user_id,
    created_at,
    category,
    text,
    like_amount
   `);

    query = query.eq('post_id', validatedInput.post_id);
    query = query.eq('taken_down', false);

    const { data: data, error: dbError } = await query;

    if (dbError) {
      console.error("Database error fetching post: ", dbError);
      return {
        success: false,
        error: "Failed to retrieve post",
      }
    }

    if (!data) return { success: false, error: "Nothing returned from database" };

    // NOTE: You can get a mismatch error if the returned object from supabase does not match the zod schema you have for this interaction AND/OR you have mismatched data from the parsed zod object and the defined interface
    // The fields of the Post interface that represented the optional fields of the Post table in the Postgres db had to also be set as optional. During testing I did not have that and was returning an object without one of the fields (- 1 hour)
    const validatedPost: Post = postSchema.parse(data[0]);

    return {
      success: true,
      data: validatedPost,
    }
  } catch (error) {

    console.error("Error in getPostById:", error);

    return {
      success: false,
      error: "An unexpected error occurred while retrieving post",
    };
  }
}

/**
 * Retrieves a paginated list of posts for a specific user with optional filtering.
 *
 * @param input - Object containing user ID, pagination cursor, filters, and sorting options
 * @param supabaseClient - Optional Supabase client instance (used for testing)
 * @returns Promise resolving to DataResponse with posts array and pagination metadata
 *
 * @example
 * ```typescript
 * const result = await getUserPosts({
 *   user_id: "user123",
 *   limit: 10,
 *   sortBy: "created_at",
 *   sortOrder: "desc"
 * });
 * if (result.success) {
 *   console.log(result.data.posts);
 *   console.log(result.data.pagination.hasMore);
 * }
 * */
export async function getUserPosts(input: GetUserPostsInput, supabaseClient?: SupabaseClient):
  Promise<DataResponse<UserPostsResponse>> {
  try {
    // Step 1: Input validation using cursor-based schema
    const validatedInput = getUserPostsInputSchema.parse(input);

    // Step 2: Create Supabase client
    const supabase = supabaseClient || await createClient();

    // Get current user to compute isLiked
    const { data: authData } = await supabase.auth.getUser();
    const currentUserId = authData?.user?.id;

    // Step 3: Build query with explicit column selection
    let query = supabase.from("posts").select(`
        post_id,
        user_id,
        created_at,
        category,
        scientific_field,
        text,
        media_path,
        media_width,
        media_height,
        like_amount,
        likes(user_id)
      `);

    // Step 4: Apply filters
    query = query.eq("user_id", validatedInput.user_id);
    query = query.eq("taken_down", false);

    if (validatedInput.category) {
      query = query.eq("category", validatedInput.category);
    }

    // Omit group posts from profile feeds (group content stays in group feeds only)
    query = query.is("group_id", null);

    // Step 5: Apply sorting based on cursor position

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
    // Helper to format relative time
    const getTimeAgo = (date: string): string => {
      const now = new Date();
      const d = new Date(date);
      const s = Math.floor((now.getTime() - d.getTime()) / 1000);
      if (s < 60) return "just now";
      if (s < 3600) return `${Math.floor(s / 60)}m ago`;
      if (s < 86400) return `${Math.floor(s / 3600)}h ago`;
      if (s < 604800) return `${Math.floor(s / 86400)}d ago`;
      return d.toLocaleDateString();
    };

    // Fetch comments for each post
    const postsWithComments = await Promise.all(
      (posts ?? []).map(async (post: any) => {
        const { likes, ...rest } = post;
        const { data: comments } = await supabase
          .from("comment")
          .select(`
            comment_id,
            text,
            created_at,
            user_id,
            users:user_id(user_id, first_name, last_name, profile_pic_path),
            comment_likes(user_id)
          `)
          .eq("post_id", post.post_id)
          .eq("taken_down", false)
          .order("created_at", { ascending: false });

        return {
          ...rest,
          isLiked: currentUserId
            ? (likes ?? []).some((l: any) => l.user_id === currentUserId)
            : false,
          comments: (comments ?? []).map((c: any) => ({
            id: String(c.comment_id),
            userId: c.user_id,
            userName: `${c.users?.first_name} ${c.users?.last_name}`.trim(),
            avatarUrl: c.users?.profile_pic_path
              ? supabase.storage.from("profile_pictures").getPublicUrl(c.users.profile_pic_path).data.publicUrl
              : null,
            content: c.text,
            timeAgo: getTimeAgo(c.created_at),
            isLiked: currentUserId
              ? (c.comment_likes ?? []).some((l: any) => l.user_id === currentUserId)
              : false,
          })),
        };
      })
    );
    const validatedPosts = postSchema.array().parse(postsWithComments);

    // Determine if there are more posts
    const hasMore = validatedPosts.length > validatedInput.limit;

    // Remove the extra item used for hasMore detection
    const returnedPosts = hasMore
      ? validatedPosts.slice(0, validatedInput.limit)
      : validatedPosts;

    const returnedPostsWithMedia = returnedPosts.map((post) => ({
      ...post,
      media_url: post.media_path
        ? supabase.storage.from("post_images").getPublicUrl(post.media_path).data.publicUrl
        : null,
    }));

    // Only expose nextCursor when another page exists (matches main feed pagination).
    const nextCursor =
      hasMore && returnedPostsWithMedia.length > 0
        ? String(
            returnedPostsWithMedia[returnedPostsWithMedia.length - 1][
              validatedInput.sortBy as keyof (typeof returnedPosts)[0]
            ],
          )
        : undefined;

    // For backward navigation, you might want prev cursor from first item
    const prevCursor =
      returnedPostsWithMedia.length > 0
        ? String(
          returnedPostsWithMedia[0][
          validatedInput.sortBy as keyof (typeof returnedPosts)[0]
          ],
        )
        : undefined;

    return {
      success: true,
      data: {
        posts: returnedPostsWithMedia,
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

function formatQuery(query: string) {
  if (!query) {
    return '';
  }
  const words = query.split(/\s+/);
  const formattedQuery = words.map(w => `${w}'':*`).join(' & ');
  return formattedQuery;
}

// TODO: ADD pagination for search

/**
 * Retrieves a list user generated content (Users, Posts, Articles, and Groups)
 *
 * @param searchQuery - string representing the query in plain english
 * @param supabaseClient - Optional Supabase client instance (used for testing)
 * @return Promise resolving to DataResponse with matching content or an empty array
 *
 * @example
 * ```typescript
 * const data = await searchUserContent("foo");
 * if (result.success) {
 *   console.log(data);
 * }
 * */
export async function searchUserContent(input: SearchInput, supabaseClient?: SupabaseClient):
  Promise<DataResponse<searchResult[]>> {

  try {

    const supabase = supabaseClient || await createClient();
    // Default to a limit of ten?
    const querylimit = input.limit || 10;
    const formattedQuery = formatQuery(input.query);

    const { data, error: dbError } = await supabase.rpc('search_all_content', { search_query: formattedQuery }).limit(querylimit);

    if (dbError) {
      console.error("Failed to retreive search results: ", dbError);
      return {
        success: false,
        error: "Failed to retrieve user posts",
      };
    }

    const validatedSearchResults = searchResultSchema.array().parse(data);

    const postIds = validatedSearchResults
      .filter((row) => row.content_type?.toLowerCase() === "post")
      .map((row) => Number(row.id))
      .filter((id) => Number.isFinite(id));

    if (postIds.length === 0) {
      return {
        success: true,
        data: validatedSearchResults,
      }
    }

    const { data: visiblePosts, error: visiblePostsError } = await supabase
      .from("posts")
      .select("post_id")
      .in("post_id", postIds)
      .eq("taken_down", false);

    if (visiblePostsError) {
      return { success: false, error: `Failed to filter search results: ${visiblePostsError.message}` };
    }

    const visiblePostIdSet = new Set((visiblePosts ?? []).map((post: any) => Number(post.post_id)));
    const filteredSearchResults = validatedSearchResults.filter((row) => {
      if (row.content_type?.toLowerCase() !== "post") return true;
      return visiblePostIdSet.has(Number(row.id));
    });

    return {
      success: true,
      data: filteredSearchResults,
    }

  } catch (error) {

    if (error instanceof z.ZodError) {
      return {
        success: false,
        error: `Invalid input: ${error.issues[0]?.message || "Validation failed"}`,
      };
    }

    return {
      success: false,
      error: "an unexpected error ocurred when retrieving search results",
    };
  }
}

/**
 * Searches for users matching the given query.
 * Uses the 'search_users' RPC function for full-text search.
 *
 * @param input - Object containing search query and optional limit
 * @param supabaseClient - Optional Supabase client instance (used for testing)
 * @returns Promise resolving to DataResponse with matching User array
 *
 * @example
 * ```typescript
 * const result = await searchForUsers({ query: "john" });
 * if (result.success) {
 *   console.log(result.data);
 * }
 * ```
 */
export async function searchForUsers(input: SearchInput, supabaseClient?: SupabaseClient): Promise<DataResponse<User[]>> {
  try {
    const supabase = supabaseClient || await createClient();
    // Default to a limit of ten?
    const querylimit = input.limit || 10;
    const formattedQuery = formatQuery(input.query);
    const { data, error } = await supabase.rpc('search_users', { search_query: formattedQuery }).limit(querylimit)
    if (error) {
      return { success: false, error: "Failed to search for users: " + error.message }
    }
    return { success: true, data: data as User[] }
  } catch (error) {
    return { success: false, error: "An unexpected error occurred in searchForUsers: " + error }
  }
}

/**
 * Searches for posts matching the given query.
 * Uses the 'search_posts' RPC function for full-text search.
 *
 * @param input - Object containing search query and optional limit
 * @param supabaseClient - Optional Supabase client instance (used for testing)
 * @returns Promise resolving to DataResponse with matching Post array
 *
 * @example
 * ```typescript
 * const result = await searchForPosts({ query: "science" });
 * if (result.success) {
 *   console.log(result.data);
 * }
 * ```
 */
export async function searchForPosts(input: SearchInput, supabaseClient?: SupabaseClient): Promise<DataResponse<Post[]>> {
  try {
    const supabase = supabaseClient || await createClient();
    // Default to a limit of ten?
    const querylimit = input.limit || 10;
    const formattedQuery = formatQuery(input.query);
    const { data, error } = await supabase.rpc('search_posts', { search_query: formattedQuery }).limit(querylimit)
    if (error) {
      return { success: false, error: "Failed to search for posts: " + error.message }
    }

    const rawPosts = (data as Post[]) ?? [];
    const postIds = rawPosts
      .map((post) => Number(post.post_id))
      .filter((id) => Number.isFinite(id));

    if (postIds.length === 0) {
      return { success: true, data: [] }
    }

    const { data: visiblePosts, error: visiblePostsError } = await supabase
      .from("posts")
      .select("post_id")
      .in("post_id", postIds)
      .eq("taken_down", false);

    if (visiblePostsError) {
      return { success: false, error: "Failed to filter taken down posts: " + visiblePostsError.message }
    }

    const visiblePostIdSet = new Set((visiblePosts ?? []).map((post: any) => Number(post.post_id)));
    return {
      success: true,
      data: rawPosts.filter((post) => visiblePostIdSet.has(Number(post.post_id))),
    }
  } catch (error) {
    return { success: false, error: "An unexpected error occurred in searchForPosts: " + error }
  }
}

/**
 * Searches for groups matching the given query.
 * Uses the 'search_groups' RPC function for full-text search.
 *
 * @param input - Object containing search query and optional limit
 * @param supabaseClient - Optional Supabase client instance (used for testing)
 * @returns Promise resolving to DataResponse with matching Group array
 *
 * @example
 * ```typescript
 * const result = await searchForGroups({ query: "science" });
 * if (result.success) {
 *   console.log(result.data);
 * }
 * ```
 */
export async function searchForGroups(input: SearchInput, supabaseClient?: SupabaseClient): Promise<DataResponse<Group[]>> {
  try {
    const supabase = supabaseClient || await createClient();
    // Default to a limit of ten?
    const querylimit = input.limit || 10;
    const formattedQuery = formatQuery(input.query);
    const { data, error } = await supabase.rpc('search_groups', { search_query: formattedQuery }).limit(querylimit)
    if (error) {
      return { success: false, error: "Failed to search for groups: " + error.message }
    }
    return { success: true, data: data as Group[] }
  } catch (error) {
    return { success: false, error: "An unexpected error occurred in searchForGroups: " + error }
  }
}

/**
 * Fetches a single user by id, joining public.users with public.profile.
 * Resolves avatar_url and profile_header_url from storage (profile_pictures and profile_header buckets).
 * Maps profile.skill (DB column) to User.skills and includes profile.articles.
 *
 * @param user_id - The user ID to fetch.
 * @param supabaseClient - Optional Supabase client (e.g. for tests).
 * @returns DataResponse with User including profile fields (about, workplace, occupation, skills, articles).
 */
// FIXME: Take in an explicitly typed parameter.
export async function getUser(user_id: string, supabaseClient?: SupabaseClient): Promise<DataResponse<User>> {

  try {

    const supabase = supabaseClient || await createClient();

    // TODO: remove * when table gets finalized
    let query = supabase.from("users").select('*').eq('user_id', user_id).overrideTypes<User[]>();

    const { data, error } = await query;

    if (error) {
      return { success: false, error: `Error fr in getUser ${error.message}` }
    }


    const user = data[0];
    const { data: profileData, error: profileError } = await supabase
      .from("profile")
      .select("header_pic_path, about, workplace, profession, occupation, skill, articles")
      .eq("user_id", user_id)
      .maybeSingle();

    if (profileError) {
      return { success: false, error: `Error in getUser profile lookup ${profileError.message}` };
    }

    const avatarUrl = user.profile_pic_path
      ? supabase.storage.from("profile_pictures").getPublicUrl(user.profile_pic_path).data.publicUrl
      : null;
    const profileHeaderUrl = profileData?.header_pic_path
      ? supabase.storage.from("profile_header").getPublicUrl(profileData.header_pic_path).data.publicUrl
      : null;

    // Map profile.skill (DB column) to User.skills; merge extended profile fields.
    const profileSkill = profileData?.skill;
    const skills = Array.isArray(profileSkill) ? profileSkill : null;

    return {
      success: true,
      data: {
        ...user,
        profile_header_path: profileData?.header_pic_path ?? null,
        avatar_url: avatarUrl,
        profile_header_url: profileHeaderUrl,
        about: profileData?.about ?? null,
        workplace: profileData?.workplace ?? null,
        occupation: profileData?.occupation ?? null,
        skills,
        articles: Array.isArray(profileData?.articles) ? profileData.articles : null,
      },
    }

  } catch (error) {
    console.error("Error getting User ", error)
  }

  return { success: false, error: `Failed to get user` }

}


