"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Box, Button, Divider, Flex, Stack } from "@mantine/core";
import { useIsMobile } from "@/app/use-is-mobile";
import LSMiniProfileList from "@/components/profile/ls-mini-profile-list";
import LSProfileHero from "@/components/profile/ls-profile-hero";
import { LSPostCard } from "@/components/feed/ls-post-card";
import { LSCommentComposer } from "@/components/feed/ls-comment-composer";
import { LSSpinner } from "@/components/ui/ls-spinner";
import {
  useUserFollowing,
  useUserFriends,
  useUserPosts,
  useUserProfile,
} from "@/components/profile/use-profile";
import { useLSProfileView } from "@/components/profile/use-ls-profile-view";
import type {
  CreateCommentAction,
  CreatePostAction,
  CreateReportAction,
  LikeCommentAction,
  LikePostAction,
} from "@/components/feed/home-feed.types";
import type {
  updateProfileAction,
  toggleFollowAction,
  createProfilePictureUploadUrl,
  updateOwnProfilePicture,
  createProfileHeaderUploadUrl,
  updateOwnProfileHeader,
} from "@/lib/actions/profile";
import type {
  EditProfileHeroProps,
  FollowProfileHeroProps,
  ProfileMediaUploadProps,
  ProfilePostActionsResult,
} from "@/components/profile/use-ls-profile-view";

type UpdateProfileAction = typeof updateProfileAction;
type ToggleFollowAction = typeof toggleFollowAction;
type CreateProfilePictureUploadUrlAction = typeof createProfilePictureUploadUrl;
type UpdateOwnProfilePictureAction = typeof updateOwnProfilePicture;
type CreateProfileHeaderUploadUrlAction = typeof createProfileHeaderUploadUrl;
type UpdateOwnProfileHeaderAction = typeof updateOwnProfileHeader;

/** Public props expected by the server component wrapper. */
export interface LSProfileViewProps {
  userId: string;
  isOwnProfile: boolean;
  /** Current authenticated user id (for deriving isFollowing when viewing others). */
  currentUserId: string | null;
  updateProfileAction: UpdateProfileAction;
  toggleFollowAction: ToggleFollowAction;
  createProfilePictureUploadUrlAction: CreateProfilePictureUploadUrlAction;
  updateOwnProfilePictureAction: UpdateOwnProfilePictureAction;
  createProfileHeaderUploadUrlAction: CreateProfileHeaderUploadUrlAction;
  updateOwnProfileHeaderAction: UpdateOwnProfileHeaderAction;
  createPostAction: CreatePostAction;
  createCommentAction: CreateCommentAction;
  createReportAction: CreateReportAction;
  likePostAction: LikePostAction;
  likeCommentAction: LikeCommentAction;
}

interface LSProfileMobileLayoutProps {
  userId: string;
  isOwnProfile: boolean;
  actions: ProfilePostActionsResult;
  editProfile: EditProfileHeroProps;
  followProfile?: FollowProfileHeroProps;
  mediaUpload?: ProfileMediaUploadProps;
}

const LSProfileMobileLayout = ({
  userId,
  isOwnProfile,
  actions,
  editProfile,
  followProfile,
  mediaUpload,
}: LSProfileMobileLayoutProps) => {
  const router = useRouter();
  const profileQuery = useUserProfile(userId);
  const profile = profileQuery.data;
  const username = profile?.first_name + " " + profile?.last_name;
  const userPostsQuery = useUserPosts(userId);
  const posts = userPostsQuery.data?.pages.flatMap((p) => p.posts) ?? [];
  const followingQuery = useUserFollowing(userId);
  const following = followingQuery.data;
  const friendsQuery = useUserFriends(userId);
  const friends = friendsQuery.data;

  const [activeCommentPostId, setActiveCommentPostId] = useState<string | null>(null);

  const hasNextPage = userPostsQuery.hasNextPage ?? false;
  const isFetchingNextPage = userPostsQuery.isFetchingNextPage ?? false;

  const listPosts = posts.map((post) => {
    const postId = String(post.post_id);

    return (
      <li key={postId}>
        <LSPostCard
          userId={post.user_id}
          userName={username ?? "Unknown User"}
          avatarUrl={profile?.avatar_url ?? undefined}
          field={post.category ?? "—"}
          timeAgo={new Date(post.created_at).toLocaleString()}
          content={post.text ?? ""}
          mediaUrl={post.media_url ?? null}
          onLikeClick={() => actions.handleTogglePostLike(postId)}
          onCommentClick={() =>
            setActiveCommentPostId((current) =>
              current === postId ? null : postId,
            )
          }
          onPostClick={() => router.push(`/posts/${postId}`)}
          isLiked={false}
          showMenu={false}
        >
          {activeCommentPostId === postId ? (
            <LSCommentComposer
              postId={postId}
              onAddComment={actions.handleAddComment}
              isSubmitting={false}
            />
          ) : null}
        </LSPostCard>
      </li>
    );
  });

  return (
    <Stack p={8}>
      <LSProfileHero
        profileName={username ?? "Unknown User"}
        profileResearchInterest={profile?.research_interests?.[0] ?? ""}
        profileAbout={profile?.about ?? undefined}
        profileSkill={profile?.skills ?? undefined}
        profileArticles={profile?.articles ?? undefined}
        profilePicURL={profile?.avatar_url ?? undefined}
        profileHeaderImageURL={profile?.profile_header_url ?? undefined}
        occupation={profile?.occupation ?? undefined}
        workplace={profile?.workplace ?? undefined}
        isOwnProfile={isOwnProfile}
        onProfilePicSelect={mediaUpload?.onProfilePicSelect}
        isUploadingProfilePic={mediaUpload?.isUploadingProfilePic}
        onProfileHeaderSelect={mediaUpload?.onProfileHeaderSelect}
        isUploadingProfileHeader={mediaUpload?.isUploadingProfileHeader}
        onOpenEditProfile={editProfile.onOpenEditProfile}
        editModalOpened={editProfile.editModalOpened}
        onEditModalClose={editProfile.onEditModalClose}
        editInitialValues={editProfile.editInitialValues}
        onEditSubmit={editProfile.onEditSubmit}
        isEditSubmitting={editProfile.isEditSubmitting}
        isFollowing={followProfile?.isFollowing}
        onToggleFollow={followProfile?.onToggleFollow}
        isTogglePending={followProfile?.isTogglePending}
      />
      <Box
        component="ul"
        style={{ listStyle: "none", paddingLeft: 0, margin: 0 }}
      >
        {listPosts}
      </Box>
      {hasNextPage ? (
        <Button
          variant="subtle"
          color="navy"
          size="sm"
          radius="xl"
          onClick={() => userPostsQuery.fetchNextPage()}
          loading={isFetchingNextPage}
        >
          Load more posts
        </Button>
      ) : null}
      <LSMiniProfileList widgetTitle="Friends" profiles={friends ?? []} />
      <LSMiniProfileList widgetTitle="Following" profiles={following ?? []} />
    </Stack>
  );
};

interface LSProfileDesktopLayoutProps {
  userId: string;
  isOwnProfile: boolean;
  actions: ProfilePostActionsResult;
  editProfile: EditProfileHeroProps;
  followProfile?: FollowProfileHeroProps;
  mediaUpload?: ProfileMediaUploadProps;
}

const LSProfileDesktopLayout = ({
  userId,
  isOwnProfile,
  actions,
  editProfile,
  followProfile,
  mediaUpload,
}: LSProfileDesktopLayoutProps) => {
  const router = useRouter();
  const profileQuery = useUserProfile(userId);
  const profile = profileQuery.data;
  const username = profile?.first_name + " " + profile?.last_name;
  const userPostsQuery = useUserPosts(userId);
  const posts = userPostsQuery.data?.pages.flatMap((p) => p.posts) ?? [];
  const friendsQuery = useUserFriends(userId);
  const friends = friendsQuery.data;
  const followingQuery = useUserFollowing(userId);
  const following = followingQuery.data;

  const [activeCommentPostId, setActiveCommentPostId] = useState<string | null>(null);

  const hasNextPage = userPostsQuery.hasNextPage ?? false;
  const isFetchingNextPage = userPostsQuery.isFetchingNextPage ?? false;

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

  const listPosts = posts.map((post) => {
    const postId = String(post.post_id);

    return (
      <li key={postId}>
        <LSPostCard
          userId={post.user_id}
          userName={username ?? "Unknown User"}
          avatarUrl={profile?.avatar_url ?? undefined}
          field={post.category ?? "—"}
          timeAgo={new Date(post.created_at).toLocaleString()}
          content={post.text ?? ""}
          mediaUrl={post.media_url ?? null}
          onLikeClick={() => actions.handleTogglePostLike(postId)}
          onCommentClick={() =>
            setActiveCommentPostId((current) =>
              current === postId ? null : postId,
            )
          }
          onPostClick={() => router.push(`/posts/${postId}`)}
          isLiked={false}
          showMenu={false}
        >
          {activeCommentPostId === postId ? (
            <LSCommentComposer
              postId={postId}
              onAddComment={actions.handleAddComment}
              isSubmitting={false}
            />
          ) : null}
        </LSPostCard>
      </li>
    );
  });

  return (
    <Box py={24} px={80}>
      <Flex p={8} direction="row" w="100%" gap={8}>
        <Box flex={5}>
          <LSProfileHero
            profileName={username ?? "Unknown User"}
            profileResearchInterest={profile?.research_interests?.[0] ?? ""}
            profileAbout={profile?.about ?? undefined}
            profileSkill={profile?.skills ?? undefined}
            profileArticles={profile?.articles ?? undefined}
            profilePicURL={profile?.avatar_url ?? undefined}
            profileHeaderImageURL={profile?.profile_header_url ?? undefined}
            occupation={profile?.occupation ?? undefined}
            workplace={profile?.workplace ?? undefined}
            isOwnProfile={isOwnProfile}
            onProfilePicSelect={mediaUpload?.onProfilePicSelect}
            isUploadingProfilePic={mediaUpload?.isUploadingProfilePic}
            onProfileHeaderSelect={mediaUpload?.onProfileHeaderSelect}
            isUploadingProfileHeader={mediaUpload?.isUploadingProfileHeader}
            onOpenEditProfile={editProfile.onOpenEditProfile}
            editModalOpened={editProfile.editModalOpened}
            onEditModalClose={editProfile.onEditModalClose}
            editInitialValues={editProfile.editInitialValues}
            onEditSubmit={editProfile.onEditSubmit}
            isEditSubmitting={editProfile.isEditSubmitting}
            isFollowing={followProfile?.isFollowing}
            onToggleFollow={followProfile?.onToggleFollow}
            isTogglePending={followProfile?.isTogglePending}
          />
        </Box>
        <Flex flex={3} direction="column" gap={8}>
          <Box flex={3}>
            <LSMiniProfileList
              widgetTitle="Friends"
              profiles={friends ?? []}
            />
          </Box>
          <Box flex={5}>
            <LSMiniProfileList
              widgetTitle="Following"
              profiles={notFollowedBack}
            />
          </Box>
        </Flex>
      </Flex>
      <Divider my={20} color="navy.1" />
      <Stack mt={20} px="20%">
        <Box
          component="ul"
          style={{ listStyle: "none", paddingLeft: 0, margin: 0 }}
        >
          {listPosts}
        </Box>
        {hasNextPage ? (
          <Button
            variant="subtle"
            color="navy"
            size="sm"
            radius="xl"
            onClick={() => userPostsQuery.fetchNextPage()}
            loading={isFetchingNextPage}
          >
            Load more posts
          </Button>
        ) : null}
      </Stack>
    </Box>
  );
};

/**
 * Full profile page view — renders the hero, posts, and relationship widgets.
 * All TanStack Query mutation logic is delegated to `useLSProfileView`.
 */
export function LSProfileView(props: LSProfileViewProps) {
  const isMobile = useIsMobile();
  const { actions, editProfile, followProfile, mediaUpload } =
    useLSProfileView(props);

  return (
    <Box bg="gray.0" mih="100vh">
      {isMobile ? (
        <LSProfileMobileLayout
          userId={props.userId}
          isOwnProfile={props.isOwnProfile}
          actions={actions}
          editProfile={editProfile}
          followProfile={followProfile}
          mediaUpload={mediaUpload}
        />
      ) : (
        <LSProfileDesktopLayout
          userId={props.userId}
          isOwnProfile={props.isOwnProfile}
          actions={actions}
          editProfile={editProfile}
          followProfile={followProfile}
          mediaUpload={mediaUpload}
        />
      )}
    </Box>
  );
}
