import {
  dehydrate,
  HydrationBoundary,
  QueryClient,
} from "@tanstack/react-query";
import type { Metadata } from "next";
import { HomeFeed } from "@/components/feed/home-feed";
import {
  createComment,
  createPost,
  createPostImageUploadUrl,
  createReport,
  deletePost,
  getFeed,
  likeComment,
  likePost,
} from "@/lib/actions/feed";
import { getGroups, joinGroup, searchPublicGroups } from "@/lib/actions/groups";
import { feedKeys, groupKeys } from "@/lib/query-keys";
import { feedFilterSchema } from "@/lib/validations/post";
import { createClient } from "@/supabase/server";
import type { GetFeedResult } from "@/lib/types/feed";

export const metadata: Metadata = {
  title: "Home | LabScity",
  description: "Discover research updates from the LabScity community.",
};

const defaultFeedFilter = feedFilterSchema.parse({});

export default async function HomePage() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  const queryClient = new QueryClient();

  await queryClient.prefetchInfiniteQuery({
    queryKey: feedKeys.list(defaultFeedFilter),
    queryFn: async ({ pageParam }) => {
      const input = pageParam
        ? { ...defaultFeedFilter, cursor: pageParam }
        : defaultFeedFilter;
      const result = await getFeed(input);
      if (!result.success || !result.data) {
        throw new Error(result.error ?? "Failed to fetch feed");
      }
      return result.data;
    },
    initialPageParam: undefined as string | undefined,
    getNextPageParam: (lastPage: GetFeedResult) => lastPage.nextCursor ?? undefined,
  });

  const popularLimit = 6;
  if (user?.id) {
    await Promise.all([
      queryClient.prefetchQuery({
        queryKey: groupKeys.list(),
        queryFn: async () => {
          const result = await getGroups();
          if (!result.success || !result.data) {
            throw new Error(result.error ?? "Failed to fetch groups");
          }
          return result.data;
        },
      }),
      queryClient.prefetchQuery({
        queryKey: groupKeys.popular(popularLimit),
        queryFn: async () => {
          const result = await searchPublicGroups({
            query: "",
            topicTags: [],
            limit: popularLimit,
          });
          if (!result.success) {
            throw new Error(result.error ?? "Failed to fetch popular groups");
          }
          return result.data ?? [];
        },
      }),
    ]);
  }

  const dehydratedState = dehydrate(queryClient);

  return (
    <HydrationBoundary state={dehydratedState}>
      <HomeFeed
        createPostAction={createPost}
        createPostImageUploadUrlAction={createPostImageUploadUrl}
        createCommentAction={createComment}
        createReportAction={createReport}
        likePostAction={likePost}
        likeCommentAction={likeComment}
        deletePostAction={deletePost}
        currentUserId={user?.id ?? null}
        popularGroupsActions={
          user?.id
            ? {
                searchPublicGroupsAction: searchPublicGroups,
                joinGroupAction: joinGroup,
                getGroupsAction: getGroups,
              }
            : undefined
        }
      />
    </HydrationBoundary>
  );
}
