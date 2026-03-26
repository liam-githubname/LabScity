import {
  dehydrate,
  HydrationBoundary,
  QueryClient,
} from "@tanstack/react-query";
import { getFeed } from "@/lib/actions/feed";
import { getGroups, joinGroup, searchPublicGroups } from "@/lib/actions/groups";
import { feedKeys, groupKeys } from "@/lib/query-keys";
import { feedFilterSchema } from "@/lib/validations/post";
import { createClient } from "@/supabase/server";
import type { GetFeedResult } from "@/lib/types/feed";
import { HomeLayoutClient } from "./home-layout-client";

const defaultFeedFilter = feedFilterSchema.parse({});

/**
 * Prefetch + hydrate the whole home shell (feed + sidebar) from one QueryClient
 * so client components outside the page subtree (e.g. Popular groups) SSR with
 * the same cache as HomeFeed and avoid hydration mismatches.
 */
export default async function HomeLayout({
  children,
}: {
  children: React.ReactNode;
}) {
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

  const popularGroupsActions =
    user?.id != null
      ? {
          searchPublicGroupsAction: searchPublicGroups,
          joinGroupAction: joinGroup,
          getGroupsAction: getGroups,
        }
      : undefined;

  return (
    <HydrationBoundary state={dehydratedState}>
      <HomeLayoutClient popularGroupsActions={popularGroupsActions}>
        {children}
      </HomeLayoutClient>
    </HydrationBoundary>
  );
}
