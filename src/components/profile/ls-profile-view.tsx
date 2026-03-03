"use client";

// Renders the full profile view (hero, posts, friends/following)
// for a given userId using TanStack Query hooks, with server actions
// for posts (like, comment, report) threaded from the page.
import { useState } from "react";
import { Box, Divider, Flex, Stack } from "@mantine/core";
import { notifications } from "@mantine/notifications";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { useIsMobile } from "@/app/use-is-mobile";
import LSMiniProfileList from "@/components/profile/ls-mini-profile-list";
import LSProfileHero from "@/components/profile/ls-profile-hero";
import { PostCard } from "@/components/feed/post-card";
import { CommentComposer } from "@/components/feed/comment-composer";
import { LSSpinner } from "@/components/ui/ls-spinner";
import {
  useUserFollowing,
  useUserFriends,
  useUserPosts,
  useUserProfile,
} from "@/components/profile/use-profile";
import { profileKeys } from "@/lib/query-keys";
import type {
  CreateCommentAction,
  CreatePostAction,
  CreateReportAction,
  LikeCommentAction,
  LikePostAction,
} from "@/components/feed/home-feed.types";
import type {
  CreateCommentValues,
  CreateReportValues,
} from "@/lib/validations/post";

// Public props expected by the server component wrapper.
interface LSProfileViewProps {
  userId: string;
  isOwnProfile: boolean;
  createPostAction: CreatePostAction;
  createCommentAction: CreateCommentAction;
  createReportAction: CreateReportAction;
  likePostAction: LikePostAction;
  likeCommentAction: LikeCommentAction;
}

type ProfilePostActionsResult = ReturnType<typeof useProfilePostActions>;

// Helper hook that wraps all post-related server actions in
// React Query mutations and centralizes error handling + cache invalidation.
function useProfilePostActions(
  userId: string,
  actions: {
    createCommentAction: CreateCommentAction;
    createReportAction: CreateReportAction;
    likePostAction: LikePostAction;
    likeCommentAction: LikeCommentAction;
  },
) {
  const queryClient = useQueryClient();

  const invalidatePosts = () =>
    queryClient.invalidateQueries({ queryKey: profileKeys.posts(userId) });

  const likePostMutation = useMutation({
    mutationFn: async (postId: string) => {
      const result = await actions.likePostAction(postId);
      if (!result.success) {
        throw new Error(result.error ?? "Failed to update like");
      }
      return result;
    },
    onSuccess: () => {
      invalidatePosts();
    },
    onError: (error: unknown) => {
      notifications.show({
        title: "Could not update like",
        message:
          error instanceof Error ? error.message : "Something went wrong",
        color: "red",
      });
    },
  });

  const likeCommentMutation = useMutation({
    mutationFn: async (commentId: string) => {
      const result = await actions.likeCommentAction(commentId);
      if (!result.success) {
        throw new Error(result.error ?? "Failed to update like");
      }
      return result;
    },
    onSuccess: () => {
      invalidatePosts();
    },
    onError: (error: unknown) => {
      notifications.show({
        title: "Could not update like",
        message:
          error instanceof Error ? error.message : "Something went wrong",
        color: "red",
      });
    },
  });

  const createCommentMutation = useMutation({
    mutationFn: async (params: {
      postId: string;
      values: CreateCommentValues;
    }) => {
      const result = await actions.createCommentAction(
        params.postId,
        params.values,
      );
      if (!result.success) {
        throw new Error(result.error ?? "Failed to create comment");
      }
      return result;
    },
    onSuccess: () => {
      invalidatePosts();
    },
    onError: (error: unknown) => {
      notifications.show({
        title: "Could not add comment",
        message:
          error instanceof Error ? error.message : "Something went wrong",
        color: "red",
      });
    },
  });

  const createReportMutation = useMutation({
    mutationFn: async (params: {
      postId: string;
      commentId: string | null;
      values: CreateReportValues;
    }) => {
      const result = await actions.createReportAction(
        params.postId,
        params.commentId,
        params.values,
      );
      if (!result.success) {
        throw new Error(result.error ?? "Failed to submit report");
      }
      return result;
    },
    onError: (error: unknown) => {
      notifications.show({
        title: "Could not submit report",
        message:
          error instanceof Error ? error.message : "Something went wrong",
        color: "red",
      });
    },
  });

  const handleTogglePostLike = (postId: string) => {
    likePostMutation.mutate(postId);
  };

  const handleToggleCommentLike = (commentId: string) => {
    likeCommentMutation.mutate(commentId);
  };

  const handleAddComment = (postId: string, values: CreateCommentValues) => {
    createCommentMutation.mutate({ postId, values });
  };

  const submitReport = (
    postId: string,
    commentId: string | null,
    values: CreateReportValues,
  ) => {
    createReportMutation.mutate({ postId, commentId, values });
  };

  return {
    handleTogglePostLike,
    handleToggleCommentLike,
    handleAddComment,
    submitReport,
  };
}

// Mobile layout: stacks hero, posts, and relationship widgets in a column.
interface LSProfileMobileLayoutProps {
  userId: string;
  actions: ProfilePostActionsResult;
}

const LSProfileMobileLayout = ({ userId, actions }: LSProfileMobileLayoutProps) => {
  const profileQuery = useUserProfile(userId);
  const profile = profileQuery.data;
  const username =
    profile?.first_name + " " + profile?.last_name;
  const userPostsQuery = useUserPosts(userId);
  const userPosts = userPostsQuery.data;
  const followingQuery = useUserFollowing(userId);
  const following = followingQuery.data;
  const friendsQuery = useUserFriends(userId);
  const friends = friendsQuery.data;

  const [activeCommentPostId, setActiveCommentPostId] = useState<string | null>(null);

  const listPosts = userPosts?.posts.map((post) => {
    const postId = String(post.post_id);

    return (
      <li key={postId}>
        <PostCard
          userId={post.user_id}
          userName={username ?? "Unknown User"}
          field={post.category ?? "profileResearchInterest n/a"}
          timeAgo={new Date(post.created_at).toLocaleString()}
          content={post.text ?? ""}
          onLikeClick={() => actions.handleTogglePostLike(postId)}
          onCommentClick={() =>
            setActiveCommentPostId((current) =>
              current === postId ? null : postId,
            )
          }
          isLiked={false}
          showMenu={false}
        >
          {activeCommentPostId === postId ? (
            <CommentComposer
              postId={postId}
              onAddComment={actions.handleAddComment}
              isSubmitting={false}
            />
          ) : null}
        </PostCard>
      </li>
    );
  });

  return (
    <Stack p={8}>
      <LSProfileHero
        profileName={username}
        profileInstitution="profileInstitution n/a"
        profileRole="profileRole n/a"
        profileResearchInterest="profileResearchInterest n/a"
        profileAbout="profileAbout n/a"
        profileSkills={["profileSkills n/a"]}
        profilePicURL="profilePicURL n/a"
        profileHeaderImageURL="profileHeaderImageURL n/a"
      />
      {listPosts}
      <LSMiniProfileList widgetTitle="Friends" profiles={friends ?? []} />
      <LSMiniProfileList
        widgetTitle="Following"
        profiles={following ?? []}
      />
    </Stack>
  );
};

interface LSProfileDesktopLayoutProps {
  userId: string;
  actions: ProfilePostActionsResult;
}

// Desktop layout: hero + side widgets row, feed of posts below.
const LSProfileDesktopLayout = ({ userId, actions }: LSProfileDesktopLayoutProps) => {
  const profileQuery = useUserProfile(userId);
  const profile = profileQuery.data;
  const username =
    profile?.first_name + " " + profile?.last_name;
  const userPostsQuery = useUserPosts(userId);
  const userPosts = userPostsQuery.data;
  const friendsQuery = useUserFriends(userId);
  const friends = friendsQuery.data;
  const followingQuery = useUserFollowing(userId);
  const following = followingQuery.data;

  const [activeCommentPostId, setActiveCommentPostId] = useState<string | null>(null);

  if (profileQuery.status === "pending") {
    return (
      <Flex justify="center" align="center" h="calc(100vh - 120px)">
        <LSSpinner />
      </Flex>
    );
  }

  if (profileQuery.status === "error") {
    return <div> Error loading Profile... </div>;
  }

  const friendIds = new Set(friends?.map((friend) => friend.user_id));

  const notFollowedBack = following?.filter(
    (user) => !friendIds.has(user.user_id),
  );

  const listPosts = userPosts?.posts.map((post) => {
    const postId = String(post.post_id);

    return (
      <li key={postId}>
        <PostCard
          userId={post.user_id}
          userName={username ?? "Unknown User"}
          field={post.category ?? "profileResearchInterest n/a"}
          timeAgo={new Date(post.created_at).toLocaleString()}
          content={post.text ?? "postText n/a"}
          onLikeClick={() => actions.handleTogglePostLike(postId)}
          onCommentClick={() =>
            setActiveCommentPostId((current) =>
              current === postId ? null : postId,
            )
          }
          isLiked={false}
          showMenu={false}
        >
          {activeCommentPostId === postId ? (
            <CommentComposer
              postId={postId}
              onAddComment={actions.handleAddComment}
              isSubmitting={false}
            />
          ) : null}
        </PostCard>
      </li>
    );
  });

  return (
    <Box py={24} px={80}>
      <Flex p={8} direction="row" w="100%" gap={8}>
        <Box flex={5}>
          <LSProfileHero
            profileName={username}
            profileInstitution="profileInstitution n/a"
            profileRole="profileRole n/a"
            profileResearchInterest="profileResearchInterest n/a"
            profileAbout="profileAbout n/a"
            profileSkills={["profileSkills n/a"]}
            profilePicURL="profilePicURL n/a"
            profileHeaderImageURL="profileHeaderImageURL n/a"
          />
        </Box>
        <Flex flex={3} direction="column" gap={8}>
          <Box flex={3}>
            <LSMiniProfileList widgetTitle="Friends" profiles={friends ?? []} />
          </Box>
          <Box flex={5}>
            <LSMiniProfileList
              widgetTitle="Following"
              profiles={notFollowedBack}
            />
          </Box>
        </Flex>
      </Flex>
      {/* posts */}
      <Divider my={20} color="navy.1" />
      <Stack mt={20} px="20%">
        {listPosts}
      </Stack>
    </Box>
  );
};

export function LSProfileView({
  userId,
  isOwnProfile,
  createPostAction,
  createCommentAction,
  createReportAction,
  likePostAction,
  likeCommentAction,
}: LSProfileViewProps) {
  const isMobile = useIsMobile();

  const actions = useProfilePostActions(userId, {
    createCommentAction,
    createReportAction,
    likePostAction,
    likeCommentAction,
  });

  return isMobile ? (
    <LSProfileMobileLayout userId={userId} actions={actions} />
  ) : (
    <LSProfileDesktopLayout userId={userId} actions={actions} />
  );
}
