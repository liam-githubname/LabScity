"use client";
import { useQuery } from "@tanstack/react-query";
import { getPostDetail } from "@/lib/actions/feed";
import { postKeys } from "@/lib/query-keys";

export function usePostDetail(post_id: string) {
  return useQuery({
    queryKey: postKeys.detail(post_id),
    queryFn: () => getPostDetail(post_id),
    enabled: !!post_id,
  });
}
