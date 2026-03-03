import { useQuery } from "@tanstack/react-query";
import { getUser, getUserPosts } from "@/lib/actions/data";
import { profileKeys } from "@/lib/query-keys";
import { Post, User } from "@/lib/types/feed";
import { UserPostsResponse } from "@/lib/types/data";
import { getUserFollowers, getUserFollowing, getUserFriends } from "@/lib/actions/profile";

interface UserProfileQueryResponse {
  status: "success" | "pending" | "error",
  userProfile?: User,
  error?: Error,
};

interface UserPostsQueryResponse {
  status: "success" | "pending" | "error",
  userPosts?: UserPostsResponse,
  error?: Error
}

// FIXME: This is probably a bad way of doing this, but it does just pass the error up to the parent component which can handle it more gracefully?
export function useUserProfile(user_id: string, options?: { enabled?: boolean }): UserProfileQueryResponse {

  // TANSTACK QUERY format that
  const { status, data, error } = useQuery({
    queryKey: profileKeys.user(user_id),
    // NOTE: USEFUL INFO FOR future reference
    // You have to use an arrow function with getUser because getUser has a return value.
    // So you aren't assigning queryFn to the function you're assigning it to the return value.
    queryFn: () => getUser(user_id)
  });

  return {
    status: status,
    error: error || undefined,
    userProfile: data?.data
  }
}



export function useUserPosts(user_id: string): UserPostsQueryResponse {
  const { status, data, error } = useQuery({
    queryKey: profileKeys.posts(user_id),
    queryFn: async () => getUserPosts({ user_id: user_id })
  });

  return {
    status: status,
    userPosts: data?.data,
    error: error || undefined,
  }
}


export function useUserFollowers(user_id: string) {
  const { status, data, error } = useQuery({
    queryKey: profileKeys.followers(user_id),
    queryFn: async () => getUserFollowers(user_id)
  });

  return {
    status: status,
    error: error || undefined,
    data: data?.data
  }
}

export function useUserFollowing(user_id: string) {
  const { status, data, error } = useQuery({
    queryKey: profileKeys.following(user_id),
    queryFn: async () => getUserFollowing(user_id)
  })

  return {
    status: status,
    error: error || undefined,
    data: data?.data
  }
}

export function useUserFriends(user_id: string) {
  const { status, data, error } = useQuery({
    queryKey: profileKeys.friends(user_id),
    queryFn: async () => getUserFriends(user_id)
  })


  return {
    status: status,
    error: error || undefined,
    data: data?.data
  }
}
