"use client";

import { Box, Button, Divider, Flex, Stack } from "@mantine/core";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { useIsMobile } from "@/app/use-is-mobile";
import { LSCommentComposer } from "@/components/feed/ls-comment-composer";
import { LSPostCard } from "@/components/feed/ls-post-card";
import { LSPostCommentCard } from "@/components/feed/ls-post-comment-card";
import LSMiniProfileList from "@/components/profile/ls-mini-profile-list";
import { LSProfileGroupsWidget } from "@/components/profile/ls-profile-groups-widget";
import LSProfileHero from "@/components/profile/ls-profile-hero";
import { LSSpinner } from "@/components/ui/ls-spinner";
import { LSUserReportOverlay } from "@/components/profile/ls-user-report-overlay";
import { createUserReport } from "@/lib/actions/profile";

/**
 * Formats a date string as a relative time for post/comment display.
 *
 * @param date - ISO date string or parseable date.
 * @returns "just now", "5m ago", "3h ago", "2d ago", or toLocaleDateString() for older dates.
 */
function getTimeAgo(date: string): string {
  const now = new Date();
  const postDate = new Date(date);
  const diffInSeconds = Math.floor((now.getTime() - postDate.getTime()) / 1000);
  if (diffInSeconds < 60) return "just now";
  if (diffInSeconds < 3600) return `${Math.floor(diffInSeconds / 60)}m ago`;
  if (diffInSeconds < 86400) return `${Math.floor(diffInSeconds / 3600)}h ago`;
  if (diffInSeconds < 604800)
    return `${Math.floor(diffInSeconds / 86400)}d ago`;
  return postDate.toLocaleDateString();
}

import type {
  CreateCommentAction,
  CreatePostAction,
  CreateReportAction,
  DeletePostAction,
  LikeCommentAction,
  LikePostAction,
} from "@/components/feed/home-feed.types";
import type {
  EditProfileHeroProps,
  FollowProfileHeroProps,
  ProfileMediaUploadProps,
  ProfilePostActionsResult,
} from "@/components/profile/use-ls-profile-view";
import { useLSProfileView } from "@/components/profile/use-ls-profile-view";
import {
  useUserFollowing,
  useUserFriends,
  useUserPosts,
  useUserProfile,
} from "@/components/profile/use-profile";
import type {
  createProfileHeaderUploadUrl,
  createProfilePictureUploadUrl,
  toggleFollowAction,
  updateOwnProfileHeader,
  updateOwnProfilePicture,
  updateProfileAction,
} from "@/lib/actions/profile";

type UpdateProfileAction = typeof updateProfileAction;
type ToggleFollowAction = typeof toggleFollowAction;
type CreateProfilePictureUploadUrlAction = typeof createProfilePictureUploadUrl;
type UpdateOwnProfilePictureAction = typeof updateOwnProfilePicture;
type CreateProfileHeaderUploadUrlAction = typeof createProfileHeaderUploadUrl;
type UpdateOwnProfileHeaderAction = typeof updateOwnProfileHeader;

/**
 * Props for LSProfileView — passed from the profile page server component.
 *
 * @param userId - Profile owner's user ID (drives all data queries).
 * @param isOwnProfile - Whether the viewer owns this profile (controls edit vs follow UI).
 * @param currentUserId - Authenticated user id; used to derive isFollowing when viewing others.
 * @param updateProfileAction - Server action to update profile (about, workplace, occupation, skill, articles).
 * @param toggleFollowAction - Server action to follow/unfollow the profile owner.
 * @param createProfilePictureUploadUrlAction - Server action to get signed URL for profile pic upload.
 * @param updateOwnProfilePictureAction - Server action to persist profile pic path after upload.
 * @param createProfileHeaderUploadUrlAction - Server action to get signed URL for banner upload.
 * @param updateOwnProfileHeaderAction - Server action to persist banner path after upload.
 * @param createPostAction - Server action to create a post (passed for consistency; profile posts use feed actions).
 * @param createCommentAction - Server action to add a comment.
 * @param createReportAction - Server action to submit a report.
 * @param createUserReportAction - Server action to report a user.
 * @param likePostAction - Server action to toggle post like.
 * @param likeCommentAction - Server action to toggle comment like.
 */
export interface LSProfileViewProps {
  userId: string;
  isOwnProfile: boolean;
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
  createUserReportAction: typeof createUserReport;
  likePostAction: LikePostAction;
  likeCommentAction: LikeCommentAction;
  deletePostAction: DeletePostAction;
}

/** Props for mobile layout — single-column stack of hero, posts, friends, following. */
interface LSProfileMobileLayoutProps {
  userId: string;
  isOwnProfile: boolean;
  actions: ProfilePostActionsResult;
  editProfile: EditProfileHeroProps;
  followProfile?: FollowProfileHeroProps;
  mediaUpload?: ProfileMediaUploadProps;
  onReportClick?: () => void;
}

/**
 * Mobile profile layout — stacks hero, friends, following, groups, then posts.
 *
 * @param userId        - Profile owner's user ID (drives all data queries).
 * @param isOwnProfile  - Whether the viewer owns this profile (controls edit UI).
 * @param actions       - Post-related mutation handlers (like, comment, report).
 * @param editProfile   - Edit-modal state & callbacks for the hero section.
 * @param followProfile - Follow/unfollow state & callback (omitted for own profile).
 * @param mediaUpload   - Profile pic & banner upload handlers (omitted for other users).
 */
const LSProfileMobileLayout = ({
  userId,
  isOwnProfile,
  actions,
  editProfile,
  followProfile,
  mediaUpload,
  onReportClick,
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

  const friendIds = new Set(friends?.map((friend) => friend.user_id));
  const notFollowedBack = following?.filter(
    (u) => !friendIds.has(u.user_id),
  );

  const [activeCommentPostId, setActiveCommentPostId] = useState<string | null>(
    null,
  );

  const hasNextPage = userPostsQuery.hasNextPage ?? false;
  const isFetchingNextPage = userPostsQuery.isFetchingNextPage ?? false;

  const listPosts = posts.map((post) => {
    const postId = String(post.post_id);
    const comments = post.comments ?? [];

    return (
      <li key={postId}>
        <LSPostCard
          userId={post.user_id}
          userName={username ?? "Unknown User"}
          avatarUrl={profile?.avatar_url ?? undefined}
          field={post.scientific_field ?? post.category ?? "—"}
          timeAgo={getTimeAgo(post.created_at)}
          content={post.text ?? ""}
          mediaUrl={post.media_url ?? null}
          onLikeClick={() => actions.handleTogglePostLike(postId)}
          onCommentClick={() =>
            setActiveCommentPostId((current) =>
              current === postId ? null : postId,
            )
          }
          isLiked={post.isLiked ?? false}
          likeCount={post.like_amount ?? 0}
          commentCount={post.comments?.length ?? 0}
          showMenu={isOwnProfile}
          onDeleteClick={
            isOwnProfile ? () => actions.handleDeletePost(postId) : undefined
          }
          onPostClick={() => router.push(`/posts/${post.post_id}`)}
          shareUrl={`/posts/${post.post_id}`}
        >
          <Stack gap="md" w="100%">
            {activeCommentPostId === postId ? (
              <LSCommentComposer
                postId={postId}
                onAddComment={actions.handleAddComment}
                isSubmitting={false}
              />
            ) : null}

            {comments.length > 0 ? (
              <>
                <Divider />
                {comments.map((comment) => (
                  <LSPostCommentCard
                    key={comment.id}
                    comment={comment}
                    onLikeClick={(commentId) =>
                      actions.handleToggleCommentLike(commentId)
                    }
                    showMenu={false}
                  />
                ))}
              </>
            ) : null}
          </Stack>
        </LSPostCard>
      </li>
    );
  });

  return (
    <Stack p={8} gap="lg">
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
        onReportClick={onReportClick}
      />
      <LSMiniProfileList
        widgetTitle="Friends"
        profiles={friends ?? []}
        maxInline={6}
        listGap="lg"
      />
      <LSMiniProfileList
        widgetTitle="Following"
        profiles={notFollowedBack}
        maxInline={6}
        listGap="lg"
      />
      <LSProfileGroupsWidget userId={userId} isOwnProfile={isOwnProfile} />
      <Stack
        component="ul"
        gap="lg"
        w="100%"
        style={{ listStyle: "none", paddingLeft: 0, margin: 0 }}
      >
        {listPosts}
      </Stack>
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
  );
};

/** Props for desktop layout — hero + side widgets in a row; posts below divider. */
interface LSProfileDesktopLayoutProps {
  userId: string;
  isOwnProfile: boolean;
  actions: ProfilePostActionsResult;
  editProfile: EditProfileHeroProps;
  followProfile?: FollowProfileHeroProps;
  mediaUpload?: ProfileMediaUploadProps;
  onReportClick?: () => void;
}

/**
 * Desktop profile layout — hero and a column of friends, following, then groups;
 * the post feed renders below a divider at a narrower width.
 *
 * @param userId        - Profile owner's user ID (drives all data queries).
 * @param isOwnProfile  - Whether the viewer owns this profile (controls edit UI).
 * @param actions       - Post-related mutation handlers (like, comment, report).
 * @param editProfile   - Edit-modal state & callbacks for the hero section.
 * @param followProfile - Follow/unfollow state & callback (omitted for own profile).
 * @param mediaUpload   - Profile pic & banner upload handlers (omitted for other users).
 */
const LSProfileDesktopLayout = ({
  userId,
  isOwnProfile,
  actions,
  editProfile,
  followProfile,
  mediaUpload,
  onReportClick,
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

  const [activeCommentPostId, setActiveCommentPostId] = useState<string | null>(
    null,
  );

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
    const comments = post.comments ?? [];

    return (
      <li key={postId}>
        <LSPostCard
          userId={post.user_id}
          userName={username ?? "Unknown User"}
          avatarUrl={profile?.avatar_url ?? undefined}
          field={post.scientific_field ?? post.category ?? "—"}
          timeAgo={getTimeAgo(post.created_at)}
          content={post.text ?? ""}
          mediaUrl={post.media_url ?? null}
          onLikeClick={() => actions.handleTogglePostLike(postId)}
          onCommentClick={() =>
            setActiveCommentPostId((current) =>
              current === postId ? null : postId,
            )
          }
          isLiked={post.isLiked ?? false}
          likeCount={post.like_amount ?? 0}
          commentCount={post.comments?.length ?? 0}
          showMenu={isOwnProfile}
          onDeleteClick={
            isOwnProfile ? () => actions.handleDeletePost(postId) : undefined
          }
          onPostClick={() => router.push(`/posts/${post.post_id}`)}
          shareUrl={`/posts/${post.post_id}`}
        >
          <Stack gap="md" w="100%">
            {activeCommentPostId === postId ? (
              <LSCommentComposer
                postId={postId}
                onAddComment={actions.handleAddComment}
                isSubmitting={false}
              />
            ) : null}

            {comments.length > 0 ? (
              <>
                <Divider />
                {comments.map((comment) => (
                  <LSPostCommentCard
                    key={comment.id}
                    comment={comment}
                    onLikeClick={(commentId) =>
                      actions.handleToggleCommentLike(commentId)
                    }
                    showMenu={false}
                  />
                ))}
              </>
            ) : null}
          </Stack>
        </LSPostCard>
      </li>
    );
  });

  return (
    <Box py={24} px={80}>
      <Flex p={8} direction="row" w="100%" gap={28} align="flex-start">
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
            onReportClick={onReportClick}
          />
        </Box>
        <Flex flex={3} direction="column" gap="lg" miw={0} maw="100%">
          <Box miw={0}>
            <LSMiniProfileList
              widgetTitle="Friends"
              profiles={friends ?? []}
              maxInline={6}
              listGap="lg"
            />
          </Box>
          <Box miw={0}>
            <LSMiniProfileList
              widgetTitle="Following"
              profiles={notFollowedBack}
              maxInline={6}
              listGap="lg"
            />
          </Box>
          <Box miw={0}>
            <LSProfileGroupsWidget
              userId={userId}
              isOwnProfile={isOwnProfile}
            />
          </Box>
        </Flex>
      </Flex>
      <Divider my={20} color="navy.1" />
      <Stack mt={20} px="20%">
        <Stack
          component="ul"
          gap="lg"
          w="100%"
          style={{ listStyle: "none", paddingLeft: 0, margin: 0 }}
        >
          {listPosts}
        </Stack>
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
 * Full profile page view: hero, friends/following widgets, and post feed.
 * Client component; all data and mutation logic comes from useLSProfileView.
 * Renders LSProfileMobileLayout or LSProfileDesktopLayout based on useIsMobile().
 */
export function LSProfileView(props: LSProfileViewProps) {
  const isMobile = useIsMobile();
  const { actions, editProfile, followProfile, mediaUpload } =
    useLSProfileView(props);

  const [reportOverlayOpen, setReportOverlayOpen] = useState(false);

  const profileQuery = useUserProfile(props.userId);
  const profile = profileQuery.data;
  const profileName = profile
    ? profile.first_name + " " + profile.last_name
    : "Unknown User";

  return (
    <Box bg="gray.0" mih="100vh">
      {!props.isOwnProfile && (
        <LSUserReportOverlay
          open={reportOverlayOpen}
          targetUserId={props.userId}
          targetUserName={profileName}
          onClose={() => setReportOverlayOpen(false)}
        />
      )}
      {isMobile ? (
        <LSProfileMobileLayout
          userId={props.userId}
          isOwnProfile={props.isOwnProfile}
          actions={actions}
          editProfile={editProfile}
          followProfile={followProfile}
          mediaUpload={mediaUpload}
          onReportClick={() => setReportOverlayOpen(true)}
        />
      ) : (
        <LSProfileDesktopLayout
          userId={props.userId}
          isOwnProfile={props.isOwnProfile}
          actions={actions}
          editProfile={editProfile}
          followProfile={followProfile}
          mediaUpload={mediaUpload}
          onReportClick={() => setReportOverlayOpen(true)}
        />
      )}
    </Box>
  );
}
