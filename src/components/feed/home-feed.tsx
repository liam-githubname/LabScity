"use client";

import { Button, Divider, Stack, Text } from "@mantine/core";
import { IconPlus } from "@tabler/icons-react";
import { CommentComposer } from "@/components/feed/comment-composer";
import { PostCard } from "@/components/feed/post-card";
import { PostComposer } from "@/components/feed/post-composer";
import { PostCommentCard } from "@/components/feed/post-comment-card";
import { ReportOverlay } from "@/components/report/report-overlay";
import { useHomeFeed } from "@/components/feed/use-home-feed";
import type { HomeFeedProps } from "@/components/feed/home-feed.types";
import { TrendingWidget } from "../sidebar/trending-widget";

export function HomeFeed(props: HomeFeedProps) {
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
  } = useHomeFeed(props);

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
                <PostCard
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
                <PostCommentCard
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


      {/* post composition */}
      <Button
        leftSection={<IconPlus size={14} />}
        radius="xl"
        variant="default"
        size="sm"
        c="gray.0"
        fw={700}
        bg="navy.8"
        onClick={() => setIsComposerOpen((open) => !open)}
      >
        New Post
      </Button>

      {isComposerOpen ? (
        <PostComposer
          key="open"
          onSubmit={handleSubmitPost}
          isPending={createPostMutation.isPending}
        />
      ) : null}

      {isFeedLoading ? (
        <Text size="sm" c="dimmed">
          Loading feed...
        </Text>
      ) : isFeedError ? (
        <Text size="sm" c="red">
          {feedError instanceof Error ? feedError.message : "Failed to load feed"}
        </Text>
      ) : null}

      <Stack gap="lg" w="100%">
        {posts.map((post) => (
          <PostCard
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
              setActiveCommentPostId((current) => (current === post.id ? null : post.id))
            }
            onLikeClick={() => handleTogglePostLike(post.id)}
            isLiked={post.isLiked ?? false}
            onReportClick={() => setReportTarget({ type: "post", postId: post.id })}
            audienceLabel={post.audienceLabel ?? null}
            menuId={`post-menu-${post.id}`}
          >
            {activeCommentPostId === post.id || post.comments.length > 0 ? (
              <Stack gap="md" w="100%">
                {activeCommentPostId === post.id ? (
                  <>
                    <CommentComposer
                      postId={post.id}
                      onAddComment={handleAddComment}
                      isSubmitting={createCommentMutation.isPending}
                    />
                  </>
                ) : null}

                <Divider />

                {post.comments.map((comment) => (
                  <PostCommentCard
                    key={comment.id}
                    comment={comment}
                    onLikeClick={(commentId) =>
                      handleToggleCommentLike(post.id, commentId)
                    }
                    onReportClick={(commentId) =>
                      setReportTarget({
                        type: "comment",
                        postId: post.id,
                        commentId,
                      })
                    }
                    menuId={`comment-menu-${comment.id}`}
                  />
                ))}
              </Stack>
            ) : null}
          </PostCard>
        ))}
      </Stack>
    </Stack>
  );
}
