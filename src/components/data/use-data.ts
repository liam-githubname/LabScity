import { useInfiniteQuery, useQuery } from "@tanstack/react-query";
import {
  getPostById,
  getUser,
  getUserPosts,
  searchForGroups,
  searchForPosts,
  searchForUsers,
  searchUserContent,
} from "@/lib/actions/data";
import { dataKeys } from "@/lib/query-keys";
import type { GetUserPostsInput } from "@/lib/types/data";

/**
 * React Query hook for fetching a single post by ID.
 *
 * @param postId - The ID of the post to fetch
 * @returns React Query result object with post data
 *
 * @example
 * ```typescript
 * const { data, isLoading } = useGetPostById(123);
 * ```
 */
export function useGetPostById(postId: number) {
  return useQuery({
    queryKey: dataKeys.post(postId),
    queryFn: async () => {
      const result = await getPostById({ post_id: postId });
      if (!result.success || !result.data) {
        throw new Error(result.error ?? "Failed to fetch post");
      }
      return result.data;
    },
  });
}

/**
 * React Query hook for fetching paginated user posts with infinite scroll support.
 *
 * @param userId - The ID of the user whose posts to fetch
 * @param options - Optional parameters including limit, cursor, category, sortBy, sortOrder
 * @returns React Query result object with pages of posts
 *
 * @example
 * ```typescript
 * const { data, fetchNextPage, hasNextPage } = useGetUserPosts("user-123");
 * ```
 */
export function useGetUserPosts(
  userId: string,
  options?: {
    limit?: number;
    cursor?: string;
    category?: string;
    sortBy?: "created_at" | "like_amount";
    sortOrder?: "asc" | "desc";
  },
) {
  return useInfiniteQuery({
    queryKey: dataKeys.userPosts(userId, options?.cursor),
    initialPageParam: undefined as string | undefined,
    queryFn: async ({ pageParam }) => {
      const input: GetUserPostsInput = {
        user_id: userId,
        limit: options?.limit ?? 10,
        cursor: pageParam,
        category: options?.category,
        sortBy: options?.sortBy ?? "created_at",
        sortOrder: options?.sortOrder ?? "desc",
      };
      const result = await getUserPosts(input);
      if (!result.success || !result.data) {
        throw new Error(result.error ?? "Failed to fetch user posts");
      }
      return result.data;
    },
    getNextPageParam: (lastPage) => {
      if (!lastPage.pagination.hasMore) {
        return undefined;
      }
      return lastPage.pagination.nextCursor;
    },
  });
}

/**
 * React Query hook for searching user-generated content (Users, Posts, Articles, Groups).
 *
 * @param query - The search query string
 * @param limit - Optional limit for number of results (default: 10)
 * @returns React Query result object with search results
 *
 * @example
 * ```typescript
 * const { data, isLoading } = useSearchUserContent("science");
 * ```
 */
export function useSearchUserContent(query: string, limit?: number) {
  return useQuery({
    queryKey: dataKeys.search(query, limit),
    queryFn: async () => {
      const result = await searchUserContent({ query, limit });
      if (!result.success) {
        throw new Error(result.error ?? "Failed to search content");
      }
      return result.data ?? [];
    },
    enabled: query.length > 0,
  });
}

/**
 * React Query hook for searching for users.
 *
 * @param query - The search query string
 * @param limit - Optional limit for number of results (default: 10)
 * @returns React Query result object with matching users
 *
 * @example
 * ```typescript
 * const { data, isLoading } = useSearchUsers("john");
 * ```
 */
export function useSearchUsers(query: string, limit?: number) {
  return useQuery({
    queryKey: dataKeys.searchUsers(query, limit),
    queryFn: async () => {
      const result = await searchForUsers({ query, limit });
      if (!result.success) {
        throw new Error(result.error ?? "Failed to search users");
      }
      return result.data ?? [];
    },
    enabled: query.length > 0,
  });
}

/**
 * React Query hook for searching for posts.
 *
 * @param query - The search query string
 * @param limit - Optional limit for number of results (default: 10)
 * @returns React Query result object with matching posts
 *
 * @example
 * ```typescript
 * const { data, isLoading } = useSearchPosts("science");
 * ```
 */
export function useSearchPosts(query: string, limit?: number) {
  return useQuery({
    queryKey: dataKeys.searchPosts(query, limit),
    queryFn: async () => {
      const result = await searchForPosts({ query, limit });
      if (!result.success) {
        throw new Error(result.error ?? "Failed to search posts");
      }
      return result.data ?? [];
    },
    enabled: query.length > 0,
  });
}

/**
 * React Query hook for searching for groups.
 *
 * @param query - The search query string
 * @param limit - Optional limit for number of results (default: 10)
 * @returns React Query result object with matching groups
 *
 * @example
 * ```typescript
 * const { data, isLoading } = useSearchGroups("science");
 * ```
 */
export function useSearchGroups(query: string, limit?: number) {
  return useQuery({
    queryKey: dataKeys.searchGroups(query, limit),
    queryFn: async () => {
      const result = await searchForGroups({ query, limit });
      if (!result.success) {
        throw new Error(result.error ?? "Failed to search groups");
      }
      return result.data ?? [];
    },
    enabled: query.length > 0,
  });
}

/**
 * React Query hook for fetching a user profile by ID.
 *
 * @param userId - The ID of the user to fetch
 * @returns React Query result object with user data
 *
 * @example
 * ```typescript
 * const { data, isLoading } = useGetUser("user-123");
 * ```
 */
export function useGetUser(userId: string) {
  return useQuery({
    queryKey: dataKeys.user(userId),
    queryFn: async () => {
      const result = await getUser(userId);
      if (!result.success || !result.data) {
        throw new Error(result.error ?? "Failed to fetch user");
      }
      return result.data;
    },
  });
}
