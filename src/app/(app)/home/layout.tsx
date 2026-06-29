import {
  dehydrate,
  HydrationBoundary,
  QueryClient,
} from "@tanstack/react-query";
import { getGroups, joinGroup, searchPublicGroups } from "@/lib/actions/groups";
import { groupKeys } from "@/lib/query-keys";
import { createClient } from "@/supabase/server";
import { HomeLayoutClient } from "./home-layout-client";

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
