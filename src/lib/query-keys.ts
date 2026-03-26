import type { FeedFilterValues } from "@/lib/validations/post";

/**
 * Query key factory for the feed.
 * Use the same keys for server prefetch and client useQuery so hydration matches.
 */
export const feedKeys = {
  all: ["feed"] as const,
  list: (filter: FeedFilterValues) =>
    [...feedKeys.all, "list", filter] as const,
};

export const profileKeys = {
  all: ["profile"] as const,
  user: (user_id: string) => [...profileKeys.all, "user", user_id] as const,
  followers: (user_id: string) =>
    [...profileKeys.all, "followers", user_id] as const,
  friends: (user_id: string) =>
    [...profileKeys.all, "friends", user_id] as const,
  following: (user_id: string) =>
    [...profileKeys.all, "following", user_id] as const,
  posts: (user_id: string) => [...profileKeys.all, "posts", user_id] as const,
  /** Public + private (own profile only) groups visible to the current viewer. */
  groups: (user_id: string) => [...profileKeys.all, "groups", user_id] as const,
};

export const chatKeys = {
  all: ["chat"] as const,
  oldMessages: (conversation_id: number, cursor?: string) =>
    [...chatKeys.all, "oldMessages", conversation_id, cursor] as const,
  chatsWithPreview: () => [...chatKeys.all, "chatsWithPreview"] as const,
};

export const notificationKeys = {
  all: ["notifications"] as const,
  isMuted: (itemId: number, itemType: string) =>
    [...notificationKeys.all, "isMuted", itemId, itemType] as const,
};

export const postKeys = {
  all: ["post"] as const,
  detail: (post_id: string) => [...postKeys.all, "detail", post_id] as const,
};

export const groupKeys = {
  all: ["groups"] as const,
  list: () => [...groupKeys.all, "list"] as const,
  detail: (groupId: number) => [...groupKeys.all, "detail", groupId] as const,
  feed: (groupId: number, filter: FeedFilterValues) =>
    [...groupKeys.all, "feed", groupId, filter] as const,
  discover: (query: string, topicTagsKey: string, limit: number) =>
    [...groupKeys.all, "discover", query, topicTagsKey, limit] as const,
  /** Active public groups for home / discovery highlights (by `last_activity_at`). */
  popular: (limit: number) => [...groupKeys.all, "popular", limit] as const,
};

export const dataKeys = {
  all: ["data"] as const,
  post: (postId: number) => [...dataKeys.all, "post", postId] as const,
  userPosts: (userId: string, cursor?: string) =>
    [...dataKeys.all, "userPosts", userId, cursor] as const,
  search: (query: string, limit?: number) =>
    [...dataKeys.all, "search", query, limit] as const,
  searchUsers: (query: string, limit?: number) =>
    [...dataKeys.all, "searchUsers", query, limit] as const,
  searchPosts: (query: string, limit?: number) =>
    [...dataKeys.all, "searchPosts", query, limit] as const,
  searchGroups: (query: string, limit?: number) =>
    [...dataKeys.all, "searchGroups", query, limit] as const,
  user: (userId: string) => [...dataKeys.all, "user", userId] as const,
};
