import { useInfiniteQuery, useQuery } from "@tanstack/react-query";
import { getUser, getUserPosts } from "@/lib/actions/data";
import { profileKeys } from "@/lib/query-keys";
import { getUserFollowers, getUserFollowing, getUserFriends } from "@/lib/actions/profile";

// NOTE: Profile hooks now return the full React Query result objects
// so server prefetch and client usage share the same data shape.

/**
 * Fetches a single user profile. Uses profileKeys.user(user_id); same key as server prefetch.
 *
 * @param user_id - Profile owner's user ID.
 * @param options - Optional { enabled } to pause the query.
 * @returns Full React Query result (data, status, error, etc.).
 */
export function useUserProfile(user_id: string, options?: { enabled?: boolean }) {
  return useQuery({
    queryKey: profileKeys.user(user_id),
    queryFn: async () => {
      const result = await getUser(user_id);
      if (!result?.success || !result.data) {
        throw new Error(result?.error ?? "Failed to fetch user profile");
      }
      return result.data;
    },
    ...options,
  });
}

const PROFILE_POSTS_PAGE_SIZE = 10;

/**
 * Fetches profile posts with cursor-based pagination. Uses profileKeys.posts(user_id).
 *
 * @param user_id - Profile owner's user ID.
 * @returns Infinite query result (data.pages, hasNextPage, fetchNextPage, etc.).
 */
export function useUserPosts(user_id: string) {
  return useInfiniteQuery({
    queryKey: profileKeys.posts(user_id),
    queryFn: async ({ pageParam }) => {
      const result = await getUserPosts({
        user_id,
        cursor: pageParam,
        limit: PROFILE_POSTS_PAGE_SIZE,
      });
      if (!result.success || !result.data) {
        throw new Error(result.error ?? "Failed to fetch user posts");
      }
      return result.data;
    },
    initialPageParam: undefined as string | undefined,
    getNextPageParam: (lastPage) => lastPage.pagination.nextCursor ?? undefined,
  });
}

/**
 * Fetches the list of users who follow the given user. Uses profileKeys.followers(user_id).
 *
 * @param user_id - Profile owner's user ID.
 * @returns Full React Query result with User[] on success.
 */
export function useUserFollowers(user_id: string) {
  return useQuery({
    queryKey: profileKeys.followers(user_id),
    queryFn: async () => {
      const result = await getUserFollowers(user_id);
      if (!result.success || !result.data) {
        throw new Error(result.error ?? "Failed to fetch user followers");
      }
      return result.data;
    },
  });
}

/**
 * Fetches the list of users that the given user follows. Uses profileKeys.following(user_id).
 *
 * @param user_id - Profile owner's user ID.
 * @returns Full React Query result with User[] on success.
 */
export function useUserFollowing(user_id: string) {
  return useQuery({
    queryKey: profileKeys.following(user_id),
    queryFn: async () => {
      const result = await getUserFollowing(user_id);
      if (!result.success || !result.data) {
        throw new Error(result.error ?? "Failed to fetch user following");
      }
      return result.data;
    },
  });
}

/**
 * Fetches the given user's friends list. Uses profileKeys.friends(user_id).
 *
 * @param user_id - Profile owner's user ID.
 * @returns Full React Query result with User[] on success.
 */
export function useUserFriends(user_id: string) {
  return useQuery({
    queryKey: profileKeys.friends(user_id),
    queryFn: async () => {
      const result = await getUserFriends(user_id);
      if (!result.success || !result.data) {
        throw new Error(result.error ?? "Failed to fetch user friends");
      }
      return result.data;
    },
  });
}
