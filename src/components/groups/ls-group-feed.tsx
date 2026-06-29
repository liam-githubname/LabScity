"use client";

import { Button, Divider, Stack, Text } from "@mantine/core";
import { IconPlus } from "@tabler/icons-react";
import { useRouter } from "next/navigation";
import { LSCommentComposer } from "@/components/feed/ls-comment-composer";
import { LSPostCard } from "@/components/feed/ls-post-card";
import { LSPostCommentCard } from "@/components/feed/ls-post-comment-card";
import { LSPostComposer } from "@/components/feed/ls-post-composer";
import type { LSGroupFeedProps } from "@/components/groups/ls-group-layout.types";
import { useGroupFeed } from "@/components/groups/use-group-feed";
import { ReportOverlay } from "@/components/report/report-overlay";

/**
 * Group-scoped feed: identical UI to HomeFeed but backed by useGroupFeed,
 * which filters posts to the active group and bakes groupId into mutations.
 */
export function LSGroupFeed(props: LSGroupFeedProps) {
  const router = useRouter();
  const {
    posts,
    isFeedLoading,
    isFeedError,
    feedError,
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
    handleEditPost,
    updatePostMutation,
    currentUserId,
  } = useGroupFeed(props);

  return (
    <Stack gap="lg">
      <ReportOverlay
        open={reportTarget !== null}
        title={reportTarget?.type === "post" ? "Report post" : "Report comment"}
        preview={
          reportTarget?.type === "post"
            ? posts
                .filter((post) => post.id === reportTarget.postId)
                .map((post) => (
                  <LSPostCard
                    key={post.id}
                    userId={post.userId}
                    userName={post.userName}
                    avatarUrl={post.avatarUrl ?? null}
                    field={post.scientificField}
                    timeAgo={post.timeAgo}
                    content={post.content}
                    mediaUrl={post.mediaUrl ?? null}
                    mediaLabel={post.mediaLabel ?? null}
                    isLiked={post.isLiked ?? false}
                    showMenu={false}
                    showActions={false}
                  />
                ))
            : posts
                .filter((post) => post.id === reportTarget?.postId)
                .flatMap((post) => post.comments)
                .filter((comment) => comment.id === reportTarget?.commentId)
                .map((comment) => (
                  <LSPostCommentCard
                    key={comment.id}
                    comment={comment}
                    showMenu={false}
                    showActions={false}
                  />
                ))
        }
        onClose={() => setReportTarget(null)}
        onSubmit={onSubmitReport}
      />

      <Button
        leftSection={<IconPlus size={14} />}
        radius="xl"
        variant="filled"
        size="sm"
        c="gray.0"
        fw={700}
        bg="navy.8"
        onClick={() => setIsComposerOpen((open) => !open)}
      >
        New Post
      </Button>

      {isComposerOpen ? (
        <LSPostComposer
          key="open"
          onSubmit={handleSubmitPost}
          isPending={createPostMutation.isPending}
        />
      ) : null}

      {isFeedLoading ? (
        <Text size="sm" c="dimmed">
          Loading posts...
        </Text>
      ) : isFeedError ? (
        <Text size="sm" c="red">
          {feedError instanceof Error
            ? feedError.message
            : "Failed to load group posts"}
        </Text>
      ) : null}

      <Stack gap="lg" w="100%">
        {posts.map((post) => (
          <LSPostCard
            key={post.id}
            userId={post.userId}
            userName={post.userName}
            avatarUrl={post.avatarUrl ?? null}
            field={post.scientificField}
            timeAgo={post.timeAgo}
            content={post.content}
            mediaUrl={post.mediaUrl ?? null}
            mediaLabel={post.mediaLabel ?? null}
            onCommentClick={() =>
              setActiveCommentPostId((current) =>
                current === post.id ? null : post.id,
              )
            }
            onLikeClick={() => handleTogglePostLike(post.id)}
            isLiked={post.isLiked ?? false}
            onEditSubmit={
              post.userId === currentUserId
                ? (values) => handleEditPost(post.id, values)
                : undefined
            }
            isEditPending={updatePostMutation.isPending}
            onReportClick={() =>
              setReportTarget({ type: "post", postId: post.id })
            }
            onPostClick={() => router.push(`/posts/${post.id}`)}
            audienceLabel={post.audienceLabel ?? null}
            menuId={`group-post-menu-${post.id}`}
          >
            {activeCommentPostId === post.id || post.comments.length > 0 ? (
              <Stack gap="md" w="100%">
                {activeCommentPostId === post.id ? (
                  <LSCommentComposer
                    postId={post.id}
                    onAddComment={handleAddComment}
                    isSubmitting={createCommentMutation.isPending}
                  />
                ) : null}

                <Divider />

                {post.comments.map((comment) => (
                  <LSPostCommentCard
                    key={comment.id}
                    comment={comment}
                    onLikeClick={ () =>
                      handleToggleCommentLike(post.id, comment.id)
                    }
                    onReportClick={() =>
                      setReportTarget({
                        type: "comment",
                        postId: post.id,
                        commentId: comment.id,
                      })
                    }
                    menuId={`group-comment-menu-${comment.id}`}
                  />
                ))}
              </Stack>
            ) : null}
          </LSPostCard>
        ))}
      </Stack>
    </Stack>
  );
}
