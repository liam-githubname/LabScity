"use client";
import { useQuery } from "@tanstack/react-query";
import { getPostDetail } from "@/lib/actions/feed";
import { postKeys } from "@/lib/query-keys";

/**
 * Fetches a single post with full detail (used on the post detail page).
 *
 * @param post_id - The post ID from the route (e.g. from useParams).
 * @returns TanStack Query result (data, isLoading, isError, etc.). Disabled when post_id is falsy.
 */
export function usePostDetail(post_id: string) {
  return useQuery({
    queryKey: postKeys.detail(post_id),
    queryFn: () => getPostDetail(post_id),
    enabled: !!post_id,
  });
}
