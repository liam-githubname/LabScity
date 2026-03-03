"use client";

// Renders the full profile view (hero, posts, friends/following)
// for a given userId using TanStack Query hooks.
import { Box, Divider, Flex, Stack } from "@mantine/core";
import { LSSpinner } from "@/components/ui/ls-spinner";
import { useIsMobile } from "@/app/use-is-mobile";
import { useUserFollowing, useUserFriends, useUserPosts, useUserProfile } from "@/components/profile/use-profile";
import LSMiniProfileList from "@/components/profile/ls-mini-profile-list";
import LSPost from "@/components/profile/ls-post";
import LSProfileHero from "@/components/profile/ls-profile-hero";
import type {
  CreateCommentAction,
  CreatePostAction,
  CreateReportAction,
  LikeCommentAction,
  LikePostAction,
} from "@/components/feed/home-feed.types";

interface LSProfileViewProps {
  userId: string;
  isOwnProfile: boolean;
  createPostAction: CreatePostAction;
  createCommentAction: CreateCommentAction;
  createReportAction: CreateReportAction;
  likePostAction: LikePostAction;
  likeCommentAction: LikeCommentAction;
}

const LSProfileMobileLayout = ({ userId }: { userId: string }) => {
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

  const listPosts = userPosts?.posts.map((post) => (
    <li key={post.post_id}>
      <LSPost
        posterName={username}
        posterResearchInterest="This isn't in the database"
        attachmentPreviewURL="urlurl"
        posterProfilePicURL="profilepicurl"
        postText={post.text || ""}
        timestamp={post.created_at}
      />
    </li>
  ));

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

const LSProfileDesktopLayout = ({ userId }: { userId: string }) => {
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

  const listPosts = userPosts?.posts.map((post) => (
    <li key={post.post_id}>
      <LSPost
        posterName={username}
        posterResearchInterest="posterResearchInterest n/a"
        attachmentPreviewURL="attachmentPreviewURL n/a"
        posterProfilePicURL="posterProfilePicURL n/a"
        postText={post.text || "postText n/a"}
        timestamp={post.created_at}
      />
    </li>
  ));

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

  return isMobile ? (
    <LSProfileMobileLayout userId={userId} />
  ) : (
    <LSProfileDesktopLayout userId={userId} />
  );
}
