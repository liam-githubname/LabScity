import { useInfiniteQuery, useQuery } from "@tanstack/react-query";
import { getUser, getUserPosts } from "@/lib/actions/data";
import { profileKeys } from "@/lib/query-keys";
import { getUserFollowers, getUserFollowing, getUserFriends } from "@/lib/actions/profile";

// NOTE: Profile hooks now return the full React Query result objects
// so server prefetch and client usage share the same data shape.
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
