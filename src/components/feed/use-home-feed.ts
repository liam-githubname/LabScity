"use client";

import { notifications } from "@mantine/notifications";
import type { InfiniteData } from "@tanstack/react-query";
import {
  useInfiniteQuery,
  useMutation,
  useQueryClient,
} from "@tanstack/react-query";
import { useState } from "react";
import { getFeed } from "@/lib/actions/feed";
import { feedKeys } from "@/lib/query-keys";
import type { FeedPostItem, GetFeedResult } from "@/lib/types/feed";
import {
  type CreateCommentValues,
  type CreatePostValues,
  type CreateReportValues,
  feedFilterSchema,
} from "@/lib/validations/post";
import { createClient } from "@/supabase/client";
import type { HomeFeedProps } from "./home-feed.types";

const defaultFeedFilter = feedFilterSchema.parse({});
const maxPostImageBytes = 5 * 1024 * 1024;
const allowedImageMimeTypes = new Set([
  "image/jpeg",
  "image/png",
  "image/webp",
  "image/gif",
]);
const postMediaBucket = "post_images";

export function useHomeFeed({
  createPostAction,
  createPostImageUploadUrlAction,
  createCommentAction,
  createReportAction,
  likePostAction,
  likeCommentAction,
  deletePostAction,
  currentUserId,
}: HomeFeedProps) {
  const queryClient = useQueryClient();
  const [isComposerOpen, setIsComposerOpen] = useState(false);
  const [activeCommentPostId, setActiveCommentPostId] = useState<string | null>(
    null,
  );
  const [reportTarget, setReportTarget] = useState<
    | { type: "post"; postId: string }
    | { type: "comment"; postId: string; commentId: string }
    | null
  >(null);

  const {
    data: feedData,
    isLoading: isFeedLoading,
    isError: isFeedError,
    error: feedError,
    fetchNextPage,
    hasNextPage,
    isFetchingNextPage,
  } = useInfiniteQuery({
    queryKey: feedKeys.list(defaultFeedFilter),
    initialPageParam: undefined as string | undefined,
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
    getNextPageParam: (lastPage) => lastPage.nextCursor ?? undefined,
  });

  const createPostMutation = useMutation({
    mutationFn: async (
      values: CreatePostValues & { mediaFile?: File | null },
    ) => {
      let mediaPath: string | undefined;

      if (values.mediaFile) {
        if (!allowedImageMimeTypes.has(values.mediaFile.type)) {
          throw new Error("Only JPG, PNG, WEBP, and GIF images are allowed");
        }

        if (values.mediaFile.size > maxPostImageBytes) {
          throw new Error("Image must be 5MB or smaller");
        }

        const uploadInfo = await createPostImageUploadUrlAction(
          values.mediaFile.type,
        );
        if (!uploadInfo.success || !uploadInfo.data) {
          throw new Error(uploadInfo.error ?? "Could not prepare image upload");
        }

        const supabase = createClient();
        const { error: uploadError } = await supabase.storage
          .from(postMediaBucket)
          .uploadToSignedUrl(
            uploadInfo.data.path,
            uploadInfo.data.token,
            values.mediaFile,
          );

        if (uploadError) {
          throw new Error(uploadError.message || "Image upload failed");
        }

        mediaPath = uploadInfo.data.path;
      }

      const payload = {
        scientificField: values.scientificField,
        content: values.content,
        category: values.category,
        mediaPath,
      };
      const result = await createPostAction(payload);
      if (!result.success) {
        throw new Error(result.error ?? "Failed to create post");
      }
      return result;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: feedKeys.all });
      setIsComposerOpen(false);
    },
    onError: (error) => {
      const message =
        error instanceof Error ? error.message : "Something went wrong";
      const isUploadIssue =
        message.includes("upload") ||
        message.includes("Image") ||
        message.includes("JPG") ||
        message.includes("PNG") ||
        message.includes("WEBP") ||
        message.includes("GIF") ||
        message.includes("5MB");

      notifications.show({
        title: isUploadIssue
          ? "Could not upload image"
          : "Could not create post",
        message,
        color: "red",
      });
    },
  });

  const createCommentMutation = useMutation({
    mutationFn: async ({
      postId,
      values,
    }: {
      postId: string;
      values: CreateCommentValues;
    }) => {
      const result = await createCommentAction(postId, values);
      if (!result.success) {
        throw new Error(result.error ?? "Failed to create comment");
      }
      return result;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: feedKeys.all });
      setActiveCommentPostId(null);
    },
    onError: (error) => {
      notifications.show({
        title: "Could not add comment",
        message:
          error instanceof Error ? error.message : "Something went wrong",
        color: "red",
      });
    },
  });

  const createReportMutation = useMutation({
    mutationFn: async ({
      postId,
      commentId,
      values,
    }: {
      postId: string;
      commentId: string | null;
      values: CreateReportValues;
    }) => {
      const result = await createReportAction(postId, commentId, values);
      if (!result.success) {
        throw new Error(result.error ?? "Failed to submit report");
      }
      return result;
    },
    onSuccess: () => {
      setReportTarget(null);
      notifications.show({
        title: "Report submitted",
        message: "Thank you. We will review this report.",
        color: "green",
      });
    },
    onError: (error) => {
      notifications.show({
        title: "Could not submit report",
        message:
          error instanceof Error ? error.message : "Something went wrong",
        color: "red",
      });
    },
  });

  const likePostMutation = useMutation({
    mutationFn: async (postId: string) => {
      const result = await likePostAction(postId);
      if (!result.success) {
        throw new Error(result.error ?? "Failed to update like");
      }
      return result;
    },
    onMutate: async (postId: string) => {
      await queryClient.cancelQueries({
        queryKey: feedKeys.list(defaultFeedFilter),
      });
      const snapshot = queryClient.getQueryData(
        feedKeys.list(defaultFeedFilter),
      );
      queryClient.setQueryData<InfiniteData<GetFeedResult> | undefined>(
        feedKeys.list(defaultFeedFilter),
        (old) => {
          if (!old || !("pages" in old)) return old;
          return {
            ...old,
            pages: old.pages.map((page) => ({
              ...page,
              posts: page.posts.map((p) =>
                p.id === postId
                  ? {
                      ...p,
                      isLiked: !p.isLiked,
                      likeCount: (p.likeCount ?? 0) + (p.isLiked ? -1 : 1),
                    }
                  : p,
              ),
            })),
          };
        },
      );
      return { snapshot };
    },
    onError: (error, _postId, context) => {
      if (context?.snapshot) {
        queryClient.setQueryData(
          feedKeys.list(defaultFeedFilter),
          context.snapshot,
        );
      }
      notifications.show({
        title: "Could not update like",
        message:
          error instanceof Error ? error.message : "Something went wrong",
        color: "red",
      });
    },
    onSettled: () => {
      queryClient.invalidateQueries({ queryKey: feedKeys.all });
    },
  });

  const deletePostMutation = useMutation({
    mutationFn: async (postId: string) => {
      const result = await deletePostAction(postId);
      if (!result.success)
        throw new Error(result.error ?? "Failed to delete post");
      return result;
    },
    onSuccess: (_result, postId) => {
      queryClient.setQueryData<InfiniteData<GetFeedResult> | undefined>(
        feedKeys.list(defaultFeedFilter),
        (old) => {
          if (!old || !("pages" in old)) return old;
          return {
            ...old,
            pages: old.pages.map((page) => ({
              ...page,
              posts: page.posts.filter((p) => p.id !== postId),
            })),
          };
        },
      );
    },
    onError: (error) => {
      notifications.show({
        title: "Could not delete post",
        message:
          error instanceof Error ? error.message : "Something went wrong",
        color: "red",
      });
    },
    onSettled: () => {
      queryClient.invalidateQueries({ queryKey: feedKeys.all });
    },
  });

  const likeCommentMutation = useMutation({
    mutationFn: async ({ commentId }: { commentId: string }) => {
      void commentId;
      const result = await likeCommentAction(commentId);
      if (!result.success) {
        throw new Error(result.error ?? "Failed to update like");
      }
      return result;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: feedKeys.all });
    },
    onError: (error) => {
      notifications.show({
        title: "Could not update like",
        message:
          error instanceof Error ? error.message : "Something went wrong",
        color: "red",
      });
    },
  });

  const posts: FeedPostItem[] =
    feedData?.pages.flatMap((page) => page.posts) ?? [];

  const handleSubmitPost = (
    values: CreatePostValues & { mediaFile?: File | null },
  ) => {
    createPostMutation.mutate(values);
  };

  const onSubmitReport = async (values: CreateReportValues) => {
    if (!reportTarget) return;
    await createReportMutation.mutateAsync({
      postId:
        reportTarget.type === "post"
          ? reportTarget.postId
          : reportTarget.postId,
      commentId:
        reportTarget.type === "comment" ? reportTarget.commentId : null,
      values,
    });
  };

  const handleAddComment = async (
    postId: string,
    values: CreateCommentValues,
  ) => {
    await createCommentMutation.mutateAsync({ postId, values });
  };

  const handleTogglePostLike = (postId: string) => {
    likePostMutation.mutate(postId);
  };

  const handleToggleCommentLike = (postId: string, commentId: string) => {
    void postId;
    likeCommentMutation.mutate({ commentId });
  };

  const handleDeletePost = (postId: string) => {
    deletePostMutation.mutate(postId);
  };

  return {
    posts,
    isFeedLoading,
    isFeedError,
    feedError,
    fetchNextPage,
    hasNextPage,
    isFetchingNextPage,
    reportTarget,
    setReportTarget,
    activeCommentPostId,
    setActiveCommentPostId,
    isComposerOpen,
    setIsComposerOpen,
    createPostMutation,
    createCommentMutation,
    handleSubmitPost,
    onSubmitReport,
    handleAddComment,
    handleTogglePostLike,
    handleToggleCommentLike,
    handleDeletePost,
    currentUserId,
  };
}
