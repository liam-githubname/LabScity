import {
  QueryClient,
  dehydrate,
  HydrationBoundary,
} from "@tanstack/react-query";
import { getUser, getUserPosts } from "@/lib/actions/data";
import type { UserPostsResponse } from "@/lib/types/data";
import {
  getUserFollowers,
  getUserFollowing,
  getUserFriends,
  updateProfileAction,
  toggleFollowAction,
  createProfilePictureUploadUrl,
  updateOwnProfilePicture,
  createProfileHeaderUploadUrl,
  updateOwnProfileHeader,
} from "@/lib/actions/profile";
import {
  createComment,
  createPost,
  createReport,
  likeComment,
  likePost,
} from "@/lib/actions/feed";
import { profileKeys } from "@/lib/query-keys";
import {
  LSProfileView,
  type LSProfileViewProps,
} from "@/components/profile/ls-profile-view";
import { createClient } from "@/supabase/server";

/**
 * Props for the profile page route.
 * In React 19 / Next.js 15+, `params` is a Promise and must be awaited.
 */
interface ProfilePageProps {
  params: Promise<{
    user_id: string;
  }>;
}

/**
 * Profile page — server component that prefetches profile data and hydrates the client.
 *
 * - Derives `userId` from the dynamic route; uses Supabase auth to compute `isOwnProfile`.
 * - Prefetches user, posts (infinite), followers, following, and friends via TanStack Query.
 * - Dehydrates the query client and wraps LSProfileView in HydrationBoundary.
 * - Passes all server actions (profile update, follow, media upload, feed actions) as props
 *   so the client component never imports actions directly.
 */
export default async function ProfilePage({ params }: ProfilePageProps) {
  const { user_id } = await params;
  const userId = user_id;

  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  const isOwnProfile = user?.id === userId;

  const queryClient = new QueryClient();

  await Promise.all([
    queryClient.prefetchQuery({
      queryKey: profileKeys.user(userId),
      queryFn: async () => {
        const result = await getUser(userId);
        if (!result?.success || !result.data) {
          throw new Error(result?.error ?? "Failed to fetch user profile");
        }
        return result.data;
      },
    }),
    queryClient.prefetchInfiniteQuery({
      queryKey: profileKeys.posts(userId),
      queryFn: async ({ pageParam }) => {
        const result = await getUserPosts({
          user_id: userId,
          cursor: pageParam,
          limit: 10,
        });
        if (!result.success || !result.data) {
          throw new Error(result.error ?? "Failed to fetch user posts");
        }
        return result.data;
      },
      initialPageParam: undefined as string | undefined,
      getNextPageParam: (lastPage: UserPostsResponse) =>
        lastPage.pagination.nextCursor ?? undefined,
    }),
    queryClient.prefetchQuery({
      queryKey: profileKeys.followers(userId),
      queryFn: async () => {
        const result = await getUserFollowers(userId);
        if (!result.success || !result.data) {
          throw new Error(result.error ?? "Failed to fetch user followers");
        }
        return result.data;
      },
    }),
    queryClient.prefetchQuery({
      queryKey: profileKeys.following(userId),
      queryFn: async () => {
        const result = await getUserFollowing(userId);
        if (!result.success || !result.data) {
          throw new Error(result.error ?? "Failed to fetch user following");
        }
        return result.data;
      },
    }),
    queryClient.prefetchQuery({
      queryKey: profileKeys.friends(userId),
      queryFn: async () => {
        const result = await getUserFriends(userId);
        if (!result.success || !result.data) {
          throw new Error(result.error ?? "Failed to fetch user friends");
        }
        return result.data;
      },
    }),
  ]);

  const dehydratedState = dehydrate(queryClient);

  const profileViewProps: LSProfileViewProps = {
    userId,
    isOwnProfile,
    currentUserId: user?.id ?? null,
    updateProfileAction,
    toggleFollowAction,
    createProfilePictureUploadUrlAction: createProfilePictureUploadUrl,
    updateOwnProfilePictureAction: updateOwnProfilePicture,
    createProfileHeaderUploadUrlAction: createProfileHeaderUploadUrl,
    updateOwnProfileHeaderAction: updateOwnProfileHeader,
    createPostAction: createPost,
    createCommentAction: createComment,
    createReportAction: createReport,
    likePostAction: likePost,
    likeCommentAction: likeComment,
  };

  return (
    <HydrationBoundary state={dehydratedState}>
      <LSProfileView {...profileViewProps} />
    </HydrationBoundary>
  );
}
