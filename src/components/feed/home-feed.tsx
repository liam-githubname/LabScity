"use client";

import { Box, Button, Stack, Text } from "@mantine/core";
import { IconPlus } from "@tabler/icons-react";
import { CommentComposer } from "@/components/feed/comment-composer";
import { PostCard } from "@/components/feed/post-card";
import { PostComposer } from "@/components/feed/post-composer";
import { PostCommentCard } from "@/components/feed/post-comment-card";
import { ReportOverlay } from "@/components/report/report-overlay";
import { useHomeFeed } from "@/components/feed/use-home-feed";
import type { HomeFeedProps } from "@/components/feed/home-feed.types";

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
          <Stack key={post.id} pos="relative" gap="md" w="100%">
            <PostCard
              userId={post.userId}
              userName={post.userName}
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
            />

            {activeCommentPostId === post.id || post.comments.length > 0 ? (
              <Box
                pos="relative"
                w="100%"
                pl={22}
                style={{ display: "flex", flexDirection: "column", gap: 12, alignSelf: "stretch", boxSizing: "border-box" }}
              >
                {/* Vertical thread line */}
                <Box
                  pos="absolute"
                  style={{ left: 0, top: -14, bottom: 0, width: 2, background: "var(--mantine-color-navy-7)", borderRadius: 999 }}
                />

                {activeCommentPostId === post.id ? (
                  <Box pos="relative" w="100%" style={{ alignSelf: "stretch", display: "flex", boxSizing: "border-box" }}>
                    {/* Horizontal connector */}
                    <Box pos="absolute" style={{ left: -22, top: "50%", width: 18, height: 2, background: "var(--mantine-color-navy-7)", borderRadius: 999, transform: "translateY(-50%)" }} />
                    {/* Cover tail of vertical line if this is the only item */}
                    {post.comments.length === 0 && (
                      <Box pos="absolute" style={{ left: -2, top: "50%", width: 4, height: "calc(50% + 20px)", background: "var(--mantine-color-gray-2)", borderRadius: 999 }} />
                    )}
                    <Box style={{ width: "calc(100% - 12px)" }}>
                      <CommentComposer
                        postId={post.id}
                        onAddComment={handleAddComment}
                        isSubmitting={createCommentMutation.isPending}
                      />
                    </Box>
                  </Box>
                ) : null}

                {post.comments.map((comment, index) => {
                  const isLast = index === post.comments.length - 1;
                  return (
                    <Box key={comment.id} pos="relative" w="100%" style={{ alignSelf: "stretch", display: "flex", boxSizing: "border-box" }}>
                      {/* Horizontal connector */}
                      <Box pos="absolute" style={{ left: -22, top: "50%", width: 18, height: 2, background: "var(--mantine-color-navy-7)", borderRadius: 999, transform: "translateY(-50%)" }} />
                      {/* Cover tail of vertical line on last comment */}
                      {isLast && (
                        <Box pos="absolute" style={{ left: -2, top: "50%", width: 4, height: "calc(50% + 20px)", background: "var(--mantine-color-gray-2)", borderRadius: 999 }} />
                      )}
                      <Box style={{ width: "calc(100% - 12px)" }}>
                        <PostCommentCard
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
                      </Box>
                    </Box>
                  );
                })}
              </Box>
            ) : null}
          </Stack>
        ))}
      </Stack>
    </Stack>
  );
}
