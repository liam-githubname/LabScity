"use client";

import { ActionIcon, Divider, Flex, Stack, Text } from "@mantine/core";
import { notifications } from "@mantine/notifications";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { IconArrowLeft } from "@tabler/icons-react";
import { useParams, useRouter } from "next/navigation";
import { useState } from "react";
import { useAuth } from "@/components/auth/use-auth";
import { LSCommentComposer } from "@/components/feed/ls-comment-composer";
import { LSPostCard } from "@/components/feed/ls-post-card";
import { LSPostCommentCard } from "@/components/feed/ls-post-comment-card";
import { usePostDetail } from "@/components/feed/use-post-detail";
import { ReportOverlay } from "@/components/report/report-overlay";
import { LSSpinner } from "@/components/ui/ls-spinner";
import {
  createComment,
  createReport,
  likeComment,
  likePost,
  updatePost,
} from "@/lib/actions/feed";
import { feedKeys, postKeys } from "@/lib/query-keys";
import { feedFilterSchema, type CreateReportValues, type UpdatePostValues } from "@/lib/validations/post";
import { FeedPostItem, GetFeedPaginatedResult, GetFeedResult, GetPostDetailResult } from "@/lib/types/feed";
import { keyof } from "zod";

const defaultFeedFilter = feedFilterSchema.parse({});

/**
 * Post detail page: single post with comments, like/comment/report actions, and ReportOverlay.
 * Uses usePostDetail for data; mutations invalidate post detail so the view refetches after like/comment.
 */
export default function PostDetailPage() {
  const { post_id } = useParams<{ post_id: string }>();
  const router = useRouter();
  const queryClient = useQueryClient();
  const { user } = useAuth();
  const { data, isLoading, isError } = usePostDetail(post_id);

  /** Tracks which post or comment is being reported; null when report overlay is closed. */
  const [reportTarget, setReportTarget] = useState<
    | { type: "post"; postId: string }
    | { type: "comment"; postId: string; commentId: string }
    | null
  >(null);

  /** Refetches post detail after successful like or comment so counts and list stay in sync. */
  const invalidate = () => {
    queryClient.invalidateQueries({ queryKey: postKeys.detail(post_id) });
    queryClient.invalidateQueries({ queryKey: feedKeys.all });
  }

  const optimisticPostUpdate = async (
    detailUpdater: (post: FeedPostItem) =>  FeedPostItem,
    feedUpdater: (post: FeedPostItem) =>  FeedPostItem = detailUpdater
  ) => {
    await queryClient.cancelQueries({ queryKey: postKeys.detail(post_id) });
    await queryClient.cancelQueries({ queryKey: feedKeys.all });

    console.log(feedKeys.all);

    const detailSnapshot = queryClient.getQueryData<GetPostDetailResult>(postKeys.detail(post_id));
    const feedSnapshots = queryClient.getQueriesData<GetFeedPaginatedResult>({ queryKey: feedKeys.all });

    queryClient.setQueryData<GetPostDetailResult>(
      postKeys.detail(post_id),
      (old) => (old ? { ...old, data: detailUpdater(old.data) }: old)
    )

    queryClient.setQueriesData<GetFeedPaginatedResult>({ queryKey: feedKeys.all }, (old) => {
      if (!old) return old;
      return {
        ...old,
        pages: old.pages.map((page) => ({
          ...page,
          posts: page.posts.map((p) =>
            p.id === post_id ? feedUpdater(p) : p,
          ) 
        }))
      }
    })

    return { detailSnapshot, feedSnapshots }
  }

  const rollback = (context: Awaited<ReturnType<typeof optimisticPostUpdate>>) => {
    if(context.detailSnapshot) {
      queryClient.setQueryData<GetPostDetailResult>(
        postKeys.detail(post_id), 
        context.detailSnapshot
      );
    }
    context.feedSnapshots?.forEach(([key, data]) => 
      queryClient.setQueryData<GetFeedPaginatedResult>(key, data)
    )
  }

  const createCommentMutation = useMutation({
    mutationFn: async ({
      postId,
      values,
    }: {
      postId: string;
      values: { content: string };
    }) => {
      const result = await createComment(postId, values);
      if (!result.success)
        throw new Error(result.error ?? "Failed to create comment");
      return result;
    },
    onSuccess: invalidate,
    onError: (error) => {
      notifications.show({
        title: "Could not add comment",
        message:
          error instanceof Error ? error.message : "Something went wrong",
        color: "red",
      });
    },
  });

  const likePostMutation = useMutation({
    mutationFn: async (postId: string) => {
      const result = await likePost(postId);
      if (!result.success) {
        throw new Error(result.error ?? "Failed to update like");
      }
      return result;
    },
    onMutate: () => 
      optimisticPostUpdate((post) => ({
        ...post,
        isLiked: !post.isLiked,
        likeCount: (post.likeCount ?? 0) + (post.isLiked ? -1 : 1),
      })),
    onError: (error, _vars, context) => {
      if (context) rollback(context);
      notifications.show({
        title: "Could not update like",
        message:
          error instanceof Error ? error.message : "Something went wrong",
        color: "red",
      });
    },
    onSettled: invalidate
  });

  const likeCommentMutation = useMutation({
    mutationFn: async (commentId: string) => {
      const result = await likeComment(commentId);
      if (!result.success) {
        throw new Error(result.error ?? "Failed to update like");
      }
      return result;
    },
    onMutate: async (commentId) => {
      await queryClient.cancelQueries({ queryKey: postKeys.detail(post_id) });
      const snapshot = queryClient.getQueryData<GetPostDetailResult>(postKeys.detail(post_id));
      queryClient.setQueryData<GetPostDetailResult>(postKeys.detail(post_id), (old) => {
        if (!old) return old;
        const post = old.data;
        return {
          ...old,
          data: {
            ...post,
            comments: post.comments.map((c) => 
              c.id === commentId
                ? { ...c, isLiked: !c.isLiked }
                : c
            )
          }
        };
      });
      return { snapshot };
    },
    onError: (error, _postId, context) => {
      if (context?.snapshot) {
        queryClient.setQueryData(postKeys.detail(post_id), context.snapshot);
      }
      notifications.show({
        title: "Could not update comment like",
        message: error instanceof Error ? error.message : "Something went wrong",
        color: "red",
      });
    },
    onSettled: () => {
      queryClient.invalidateQueries({ queryKey: feedKeys.all });
      invalidate();
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
      const result = await createReport(postId, commentId, values);
      if (!result.success)
        throw new Error(result.error ?? "Failed to submit report");
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

  const updatePostMutation = useMutation({
    mutationFn: async ({
      postId,
      values,
    }: {
      postId: string;
      values: UpdatePostValues;
    }) => {
      const result = await updatePost(postId, values);
      if (!result.success)
        throw new Error(result.error ?? "Failed to update post");
      return result;
    },
    onSuccess: () => {
      invalidate();
      notifications.show({
        title: "Post updated",
        message: "Your post has been saved.",
        color: "green",
      });
    },
    onError: (error) => {
      notifications.show({
        title: "Could not update post",
        message:
          error instanceof Error ? error.message : "Something went wrong",
        color: "red",
      });
    },
  });

  const handleAddComment = async (
    postId: string,
    values: { content: string },
  ) => {
    await createCommentMutation.mutateAsync({ postId, values });
  };

  const onSubmitReport = async (values: CreateReportValues) => {
    if (!reportTarget) return;
    await createReportMutation.mutateAsync({
      postId: reportTarget.postId,
      commentId:
        reportTarget.type === "comment" ? reportTarget.commentId : null,
      values,
    });
  };

  const handleEditPost = async (postId: string, values: UpdatePostValues) => {
    await updatePostMutation.mutateAsync({ postId, values });
  };

  if (isLoading) {
    return (
      <Flex justify="center" align="center" h="calc(100vh - 120px)">
        <LSSpinner />
      </Flex>
    );
  }

  if (isError || !data?.success) {
    return (
      <Flex justify="center" align="center" h="calc(100vh - 120px)">
        <Text c="red">Failed to load post.</Text>
      </Flex>
    );
  }

  const post = data.data;

  if (!post) {
    return (
      <Flex justify="center" align="center" h="calc(100vh - 120px)">
        <Text c="navy.7">Post not found.</Text>
      </Flex>
    );
  }
  
  return (
    <Stack p="md" maw={700} mx="auto">
      <ActionIcon
        variant="subtle"
        color="navy.7"
        size="xl"
        onClick={() => router.back()}
        aria-label="Go back"
      >
        <IconArrowLeft size={22} />
      </ActionIcon>
      <ReportOverlay
        open={reportTarget !== null}
        title={reportTarget?.type === "post" ? "Report post" : "Report comment"}
        preview={
          reportTarget?.type === "post"
            ? (
              <LSPostCard
                userId={post.userId}
                userName={post.userName}
                avatarUrl={post.avatarUrl ?? null}
                field={post.scientificField}
                timeAgo={post.timeAgo}
                content={post.content}
                mediaUrl={post.mediaUrl ?? null}
                mediaHeight={post.mediaHeight}
                mediaWidth={post.mediaWidth}
                showMenu={false}
                showActions={false}
              />
            )
            : post.comments
              .filter((c) => c.id === reportTarget?.commentId)
              .map((c) => (
                <LSPostCommentCard
                  key={c.id}
                  comment={c}
                  showMenu={false}
                  showActions={false}
                />
              ))
        }
        onClose={() => setReportTarget(null)}
        onSubmit={onSubmitReport}
      />

      <LSPostCard
        userId={post.userId}
        userName={post.userName}
        avatarUrl={post.avatarUrl ?? null}
        field={post.scientificField}
        timeAgo={post.timeAgo}
        content={post.content}
        mediaUrl={post.mediaUrl ?? null}
        isLiked={post.isLiked ?? false}
        onLikeClick={() => likePostMutation.mutate(post.id)}
        onEditSubmit={
          post.userId === user?.id
            ? (values) => handleEditPost(post.id, values)
            : undefined
        }
        isEditPending={updatePostMutation.isPending}
        onReportClick={() => setReportTarget({ type: "post", postId: post.id })}
        showActions
        showMenu
        menuId={`post-menu-${post.id}`}
        mediaHeight={post.mediaHeight}
        mediaWidth={post.mediaWidth}
        likeCount={post.likeCount}
        commentCount={post.comments.length}
      >
        <Stack gap="md" w="100%">
          <LSCommentComposer
            postId={post.id}
            onAddComment={handleAddComment}
            isSubmitting={createCommentMutation.isPending}
          />

          
          {post.comments.length > 0 ? (
            <>
              <Divider />
              {post.comments.map((comment) => (
                <LSPostCommentCard
                  key={comment.id}
                  comment={comment}
                  onLikeClick={() => likeCommentMutation.mutate(comment.id)}
                  onReportClick={() =>
                    setReportTarget({ type: "comment", postId: post.id, commentId: comment.id })
                  }
                  menuId={`comment-menu-${comment.id}`}
                />
              ))}
            </>
          ) : null}
        </Stack>
      </LSPostCard>
    </Stack>
  );
}
