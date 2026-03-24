"use client";

import { Button, Divider, Stack, Text } from "@mantine/core";
import { IconPlus } from "@tabler/icons-react";
import { useRouter } from "next/navigation";
import { LSCommentComposer } from "@/components/feed/ls-comment-composer";
import { LSPostCard } from "@/components/feed/ls-post-card";
import { LSPostComposer } from "@/components/feed/ls-post-composer";
import { LSPostCommentCard } from "@/components/feed/ls-post-comment-card";
import { ReportOverlay } from "@/components/report/report-overlay";
import { useHomeFeed } from "@/components/feed/use-home-feed";
import type { HomeFeedProps } from "@/components/feed/home-feed.types";

/**
 * Home feed: post composer trigger, list of LSPostCards with like/comment/report,
 * ReportOverlay for reporting posts or comments, and post click navigation to /posts/[post_id].
 * All data and mutation logic comes from useHomeFeed; actions are passed from the page as props.
 */
export function HomeFeed(props: HomeFeedProps) {
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
    handleDeletePost,
    currentUserId,
    fetchNextPage,
    hasNextPage,
    isFetchingNextPage,
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


      {/* post composition */}
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
          Loading feed...
        </Text>
      ) : isFeedError ? (
        <Text size="sm" c="red">
          {feedError instanceof Error ? feedError.message : "Failed to load feed"}
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
              setActiveCommentPostId((current) => (current === post.id ? null : post.id))
            }
            onLikeClick={() => handleTogglePostLike(post.id)}
            isLiked={post.isLiked ?? false}
            likeCount={post.likeCount}
            commentCount={post.comments.length}
            onReportClick={() => setReportTarget({ type: "post", postId: post.id })}
            onDeleteClick={post.userId === currentUserId ? () => handleDeletePost(post.id) : undefined}
            onPostClick={() => router.push(`/posts/${post.id}`)}
            shareUrl={`/posts/${post.id}`}
            audienceLabel={post.audienceLabel ?? null}
            menuId={`post-menu-${post.id}`}
          >
            {activeCommentPostId === post.id || post.comments.length > 0 ? (
              <Stack gap="md" w="100%">
                {activeCommentPostId === post.id ? (
                  <>
                    <LSCommentComposer
                      postId={post.id}
                      onAddComment={handleAddComment}
                      isSubmitting={createCommentMutation.isPending}
                    />
                  </>
                ) : null}

                <Divider />

                {post.comments.map((comment) => (
                  <LSPostCommentCard
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
          </LSPostCard>
        ))}
      </Stack>

      {/*This was for testing you can change it, remove it, make it into a scroll to the bottom to autoload. whatever.*/}
      {true && (
        <Button onClick={() => fetchNextPage()} disabled={isFetchingNextPage}>
          {isFetchingNextPage ? "Loading..." : "Load more"}
        </Button>
      )}
    </Stack>
  );
}
