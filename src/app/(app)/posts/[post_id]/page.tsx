"use client";

import { ActionIcon, Divider, Flex, Stack, Text } from "@mantine/core";
import { notifications } from "@mantine/notifications";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { IconArrowLeft } from "@tabler/icons-react";
import { useParams, useRouter } from "next/navigation";
import { useState } from "react";
import { CommentComposer } from "@/components/feed/comment-composer";
import { PostCard } from "@/components/feed/post-card";
import { PostCommentCard } from "@/components/feed/post-comment-card";
import { usePostDetail } from "@/components/feed/use-post-detail";
import { ReportOverlay } from "@/components/report/report-overlay";
import { LSSpinner } from "@/components/ui/ls-spinner";
import {
  createComment,
  createReport,
  likeComment,
  likePost,
} from "@/lib/actions/feed";
import { postKeys } from "@/lib/query-keys";
import type { CreateReportValues } from "@/lib/validations/post";

export default function PostDetailPage() {
  const { post_id } = useParams<{ post_id: string }>();
  const router = useRouter();
  const queryClient = useQueryClient();
  const { data, isLoading, isError } = usePostDetail(post_id);

  const [reportTarget, setReportTarget] = useState<
    | { type: "post"; postId: string }
    | { type: "comment"; postId: string; commentId: string }
    | null
  >(null);

  const invalidate = () =>
    queryClient.invalidateQueries({ queryKey: postKeys.detail(post_id) });

  const createCommentMutation = useMutation({
    mutationFn: async ({ postId, values }: { postId: string; values: { content: string } }) => {
      const result = await createComment(postId, values);
      if (!result.success) throw new Error(result.error ?? "Failed to create comment");
      return result;
    },
    onSuccess: invalidate,
    onError: (error) => {
      notifications.show({
        title: "Could not add comment",
        message: error instanceof Error ? error.message : "Something went wrong",
        color: "red",
      });
    },
  });

  const likePostMutation = useMutation({
    mutationFn: async (postId: string) => {
      const result = await likePost(postId);
      if (!result.success) throw new Error(result.error ?? "Failed to update like");
      return result;
    },
    onSuccess: invalidate,
    onError: (error) => {
      notifications.show({
        title: "Could not update like",
        message: error instanceof Error ? error.message : "Something went wrong",
        color: "red",
      });
    },
  });

  const likeCommentMutation = useMutation({
    mutationFn: async (commentId: string) => {
      const result = await likeComment(commentId);
      if (!result.success) throw new Error(result.error ?? "Failed to update like");
      return result;
    },
    onSuccess: invalidate,
    onError: (error) => {
      notifications.show({
        title: "Could not update like",
        message: error instanceof Error ? error.message : "Something went wrong",
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
      const result = await createReport(postId, commentId, values);
      if (!result.success) throw new Error(result.error ?? "Failed to submit report");
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
        message: error instanceof Error ? error.message : "Something went wrong",
        color: "red",
      });
    },
  });

  const handleAddComment = async (postId: string, values: { content: string }) => {
    await createCommentMutation.mutateAsync({ postId, values });
  };

  const onSubmitReport = async (values: CreateReportValues) => {
    if (!reportTarget) return;
    await createReportMutation.mutateAsync({
      postId: reportTarget.postId,
      commentId: reportTarget.type === "comment" ? reportTarget.commentId : null,
      values,
    });
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
      <ActionIcon variant="subtle" color="navy.7" size="xl" onClick={() => router.back()} aria-label="Go back">
        <IconArrowLeft size={22} />
      </ActionIcon>
      <ReportOverlay
        open={reportTarget !== null}
        title={reportTarget?.type === "post" ? "Report post" : "Report comment"}
        preview={
          reportTarget?.type === "post"
            ? (
              <PostCard
                userId={post.userId}
                userName={post.userName}
                avatarUrl={post.avatarUrl ?? null}
                field={post.scientificField}
                timeAgo={post.timeAgo}
                content={post.content}
                mediaUrl={post.mediaUrl ?? null}
                showMenu={false}
                showActions={false}
              />
            )
            : post.comments
              .filter((c) => c.id === reportTarget?.commentId)
              .map((c) => (
                <PostCommentCard
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

      <PostCard
        userId={post.userId}
        userName={post.userName}
        avatarUrl={post.avatarUrl ?? null}
        field={post.scientificField}
        timeAgo={post.timeAgo}
        content={post.content}
        mediaUrl={post.mediaUrl ?? null}
        isLiked={post.isLiked ?? false}
        onLikeClick={() => likePostMutation.mutate(post.id)}
        onReportClick={() => setReportTarget({ type: "post", postId: post.id })}
        showActions
        showMenu
        menuId={`post-menu-${post.id}`}
      >
        <Stack gap="md" w="100%">
          <CommentComposer
            postId={post.id}
            onAddComment={handleAddComment}
            isSubmitting={createCommentMutation.isPending}
          />

          {post.comments.length > 0 ? (
            <>
              <Divider />
              {post.comments.map((comment) => (
                <PostCommentCard
                  key={comment.id}
                  comment={comment}
                  onLikeClick={(commentId) => likeCommentMutation.mutate(commentId)}
                  onReportClick={(commentId) =>
                    setReportTarget({ type: "comment", postId: post.id, commentId })
                  }
                  menuId={`comment-menu-${comment.id}`}
                />
              ))}
            </>
          ) : null}
        </Stack>
      </PostCard>
    </Stack>
  );
}
