import { createComment, createPost, createPostImageUploadUrl, createReport, deletePost, getFeed, likeComment, likePost, updatePost } from "@/lib/actions/feed";
import { feedKeys } from "@/lib/query-keys";
import { GetFeedResult } from "@/lib/types/feed";
import { feedFilterSchema } from "@/lib/validations/post";
import { dehydrate, HydrationBoundary, QueryClient } from "@tanstack/react-query";
import { HomeFeed } from "./home-feed";
import { createClient } from "@/supabase/server";

const defaultFeedFilter = feedFilterSchema.parse({});

export default async function HomeFeedServer() {
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
    getNextPageParam: (lastPage: GetFeedResult) =>
      lastPage.nextCursor ?? undefined,
  });

  return (
    <HydrationBoundary state={dehydrate(queryClient)}>
      <HomeFeed
        createPostAction={createPost}
        createPostImageUploadUrlAction={createPostImageUploadUrl}
        createCommentAction={createComment}
        createReportAction={createReport}
        likePostAction={likePost}
        likeCommentAction={likeComment}
        currentUserId={user?.id ?? null}
        deletePostAction={deletePost}
        updatePostAction={updatePost}
      />
    </HydrationBoundary>
  )
}