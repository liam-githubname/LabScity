"use client";
import { Box, Divider, Flex, Stack } from "@mantine/core";
import { notifications } from "@mantine/notifications";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { useState } from "react";
import { LSSpinner } from "@/components/ui/ls-spinner";
import { useIsMobile } from "@/app/use-is-mobile";
import { useParams, useRouter } from "next/navigation";
import { useAuth } from "@/components/auth/use-auth";
import LSMiniProfileList from "@/components/profile/ls-mini-profile-list";
import { PostCard } from "@/components/feed/post-card";
import { CommentComposer } from "@/components/feed/comment-composer";
import { PostCommentCard } from "@/components/feed/post-comment-card";
// TODO: CREATE THE FOLLOWING/FOLLOWED relationships
// TODO: FIGURE OUT THE ROUTING so that it passes the user_id otw to this profile page
/* TODO: Figure out how to get the comments on each post *I think the right move is to have a join on posts and comments with the same postid* */
// TODO: Figure out profile pictures
// TODO: READ TANSTACK DOCS (Need to understand queries, invalidating queries, and mutations)
// TODO: FIGURE OUT THE OPENGRAPH docs for sharing across whole platform
import LSProfileHero from "@/components/profile/ls-profile-hero";
import {
  createProfileHeaderUploadUrl,
  createProfilePictureUploadUrl,
  updateOwnProfileHeader,
  updateOwnProfilePicture,
} from "@/lib/actions/profile";
import { createComment, likeComment, likePost } from "@/lib/actions/feed";
import { profileKeys } from "@/lib/query-keys";
import { createClient } from "@/supabase/client";
import {
  useUserFollowing,
  useUserFriends,
  useUserPosts,
  useUserProfile,
} from "@/components/profile/use-profile";
import type { CreateCommentValues } from "@/lib/validations/post";

function getTimeAgo(date: string): string {
  const now = new Date();
  const postDate = new Date(date);
  const diffInSeconds = Math.floor((now.getTime() - postDate.getTime()) / 1000);
  if (diffInSeconds < 60) return "just now";
  if (diffInSeconds < 3600) return `${Math.floor(diffInSeconds / 60)}m ago`;
  if (diffInSeconds < 86400) return `${Math.floor(diffInSeconds / 3600)}h ago`;
  if (diffInSeconds < 604800) return `${Math.floor(diffInSeconds / 86400)}d ago`;
  return postDate.toLocaleDateString();
}

const maxProfilePictureBytes = 1024 * 1024;
const maxProfileHeaderBytes = 2 * 1024 * 1024;
const allowedProfilePictureMimeTypes = new Set([
  "image/jpeg",
  "image/png",
  "image/webp",
  "image/gif",
]);

const LSProfileMobileLayout = () => {
  const params = useParams<{ user_id: string }>();
  const router = useRouter();
  const queryClient = useQueryClient();
  const { user: authUser } = useAuth();
  const profile = useUserProfile(params.user_id);
  const isOwnProfile = authUser?.id === params.user_id;
  const username =
    profile.userProfile?.first_name + " " + profile.userProfile?.last_name;
  const userPosts = useUserPosts(params.user_id);
  const following = useUserFollowing(params.user_id);
  const friends = useUserFriends(params.user_id);
  const [activeCommentPostId, setActiveCommentPostId] = useState<string | null>(null);

  const invalidatePosts = () =>
    queryClient.invalidateQueries({ queryKey: profileKeys.posts(params.user_id) });

  const likePostMutation = useMutation({
    mutationFn: async (postId: string) => {
      const result = await likePost(postId);
      if (!result.success) throw new Error(result.error ?? "Failed to update like");
      return result;
    },
    onSuccess: invalidatePosts,
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
    onSuccess: invalidatePosts,
    onError: (error) => {
      notifications.show({
        title: "Could not update like",
        message: error instanceof Error ? error.message : "Something went wrong",
        color: "red",
      });
    },
  });

  const createCommentMutation = useMutation({
    mutationFn: async ({ postId, values }: { postId: string; values: CreateCommentValues }) => {
      const result = await createComment(postId, values);
      if (!result.success) throw new Error(result.error ?? "Failed to create comment");
      return result;
    },
    onSuccess: () => {
      setActiveCommentPostId(null);
      invalidatePosts();
    },
    onError: (error) => {
      notifications.show({
        title: "Could not add comment",
        message: error instanceof Error ? error.message : "Something went wrong",
        color: "red",
      });
    },
  });

  const uploadProfilePictureMutation = useMutation({
    mutationFn: async (file: File) => {
      if (!isOwnProfile) {
        throw new Error("You can only update your own profile picture");
      }

      if (!allowedProfilePictureMimeTypes.has(file.type)) {
        throw new Error("Only JPG, PNG, WEBP, and GIF images are allowed");
      }

      if (file.size > maxProfilePictureBytes) {
        throw new Error("Profile picture must be 1MB or smaller");
      }

      const uploadInfo = await createProfilePictureUploadUrl(file.type);
      if (!uploadInfo.success || !uploadInfo.data) {
        throw new Error(uploadInfo.error ?? "Failed to prepare profile picture upload");
      }

      const supabase = createClient();
      const { error: uploadError } = await supabase.storage
        .from(uploadInfo.data.bucket)
        .uploadToSignedUrl(uploadInfo.data.path, uploadInfo.data.token, file);

      if (uploadError) {
        throw new Error(uploadError.message || "Profile picture upload failed");
      }

      const updateResult = await updateOwnProfilePicture(uploadInfo.data.path);
      if (!updateResult.success) {
        throw new Error(updateResult.error ?? "Failed to save profile picture");
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: profileKeys.user(params.user_id) });
      queryClient.invalidateQueries({ queryKey: profileKeys.followers(params.user_id) });
      queryClient.invalidateQueries({ queryKey: profileKeys.following(params.user_id) });
      queryClient.invalidateQueries({ queryKey: profileKeys.friends(params.user_id) });
      notifications.show({
        title: "Profile picture updated",
        message: "Your new profile picture is now live.",
        color: "green",
      });
    },
    onError: (error) => {
      notifications.show({
        title: "Could not update profile picture",
        message: error instanceof Error ? error.message : "Something went wrong",
        color: "red",
      });
    },
  });

  const uploadProfileHeaderMutation = useMutation({
    mutationFn: async (file: File) => {
      if (!isOwnProfile) {
        throw new Error("You can only update your own profile header");
      }

      if (!allowedProfilePictureMimeTypes.has(file.type)) {
        throw new Error("Only JPG, PNG, WEBP, and GIF images are allowed");
      }

      if (file.size > maxProfileHeaderBytes) {
        throw new Error("Profile header must be 2MB or smaller");
      }

      const uploadInfo = await createProfileHeaderUploadUrl(file.type);
      if (!uploadInfo.success || !uploadInfo.data) {
        throw new Error(uploadInfo.error ?? "Failed to prepare profile header upload");
      }

      const supabase = createClient();
      const { error: uploadError } = await supabase.storage
        .from(uploadInfo.data.bucket)
        .uploadToSignedUrl(uploadInfo.data.path, uploadInfo.data.token, file);

      if (uploadError) {
        throw new Error(uploadError.message || "Profile header upload failed");
      }

      const updateResult = await updateOwnProfileHeader(uploadInfo.data.path);
      if (!updateResult.success) {
        throw new Error(updateResult.error ?? "Failed to save profile header");
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: profileKeys.user(params.user_id) });
      notifications.show({
        title: "Profile header updated",
        message: "Your new profile header is now live.",
        color: "green",
      });
    },
    onError: (error) => {
      notifications.show({
        title: "Could not update profile header",
        message: error instanceof Error ? error.message : "Something went wrong",
        color: "red",
      });
    },
  });

  const handleProfilePicSelect = (file: File | null) => {
    if (!file) return;
    uploadProfilePictureMutation.mutate(file);
  };

  const handleProfileHeaderSelect = (file: File | null) => {
    if (!file) return;
    uploadProfileHeaderMutation.mutate(file);
  };

  const listPosts = userPosts.userPosts?.posts.map((post) => {
    const postId = String(post.post_id);
    const isCommentOpen = activeCommentPostId === postId;
    return (
      <li key={post.post_id}>
        <PostCard
          userId={params.user_id}
          userName={username}
          field={post.scientific_field ?? ""}
          mediaUrl={post.media_url ?? undefined}
          avatarUrl={profile.userProfile?.avatar_url ?? ""}
          content={post.text || ""}
          timeAgo={getTimeAgo(post.created_at)}
          isLiked={post.isLiked ?? false}
          onLikeClick={() => likePostMutation.mutate(postId)}
          onCommentClick={() => setActiveCommentPostId(isCommentOpen ? null : postId)}
          showMenu={false}
          showActions
          onPostClick={() => router.push(`/posts/${post.post_id}`)}
        >
          <Stack gap="md" w="100%">
            {isCommentOpen ? (
              <CommentComposer
                postId={postId}
                onAddComment={async (pid, values) => {
                  await createCommentMutation.mutateAsync({ postId: pid, values });
                }}
                isSubmitting={createCommentMutation.isPending}
              />
            ) : null}
            {(post.comments ?? []).length > 0 ? (
              <>
                <Divider />
                {(post.comments ?? []).map((comment) => (
                  <PostCommentCard
                    key={comment.id}
                    comment={comment}
                    onLikeClick={(commentId) => likeCommentMutation.mutate(commentId)}
                    showMenu={false}
                  />
                ))}
              </>
            ) : null}
          </Stack>
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
        profilePicURL={profile.userProfile?.avatar_url ?? undefined}
        profileHeaderImageURL={profile.userProfile?.profile_header_url ?? undefined}
        isOwnProfile={isOwnProfile}
        isUploadingProfilePic={uploadProfilePictureMutation.isPending}
        onProfilePicSelect={handleProfilePicSelect}
        isUploadingProfileHeader={uploadProfileHeaderMutation.isPending}
        onProfileHeaderSelect={handleProfileHeaderSelect}
      />
      {listPosts}
      <LSMiniProfileList widgetTitle="Friends" profiles={friends.data} />
      <LSMiniProfileList
        widgetTitle="Following"
        profiles={following.data}
      />
    </Stack>
  );
};

const LSProfileDesktopLayout = () => {
  const params = useParams<{ user_id: string }>();
  const router = useRouter();
  const queryClient = useQueryClient();
  const { user: authUser } = useAuth();
  const profile = useUserProfile(params.user_id);
  const isOwnProfile = authUser?.id === params.user_id;
  const username =
    profile.userProfile?.first_name + " " + profile.userProfile?.last_name;
  const userPosts = useUserPosts(params.user_id);
  const friends = useUserFriends(params.user_id);
  const following = useUserFollowing(params.user_id);
  const [activeCommentPostId, setActiveCommentPostId] = useState<string | null>(null);

  const invalidatePosts = () =>
    queryClient.invalidateQueries({ queryKey: profileKeys.posts(params.user_id) });

  const likePostMutation = useMutation({
    mutationFn: async (postId: string) => {
      const result = await likePost(postId);
      if (!result.success) throw new Error(result.error ?? "Failed to update like");
      return result;
    },
    onSuccess: invalidatePosts,
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
    onSuccess: invalidatePosts,
    onError: (error) => {
      notifications.show({
        title: "Could not update like",
        message: error instanceof Error ? error.message : "Something went wrong",
        color: "red",
      });
    },
  });

  const createCommentMutation = useMutation({
    mutationFn: async ({ postId, values }: { postId: string; values: CreateCommentValues }) => {
      const result = await createComment(postId, values);
      if (!result.success) throw new Error(result.error ?? "Failed to create comment");
      return result;
    },
    onSuccess: () => {
      setActiveCommentPostId(null);
      invalidatePosts();
    },
    onError: (error) => {
      notifications.show({
        title: "Could not add comment",
        message: error instanceof Error ? error.message : "Something went wrong",
        color: "red",
      });
    },
  });

  const uploadProfilePictureMutation = useMutation({
    mutationFn: async (file: File) => {
      if (!isOwnProfile) {
        throw new Error("You can only update your own profile picture");
      }

      if (!allowedProfilePictureMimeTypes.has(file.type)) {
        throw new Error("Only JPG, PNG, WEBP, and GIF images are allowed");
      }

      if (file.size > maxProfilePictureBytes) {
        throw new Error("Profile picture must be 1MB or smaller");
      }

      const uploadInfo = await createProfilePictureUploadUrl(file.type);
      if (!uploadInfo.success || !uploadInfo.data) {
        throw new Error(uploadInfo.error ?? "Failed to prepare profile picture upload");
      }

      const supabase = createClient();
      const { error: uploadError } = await supabase.storage
        .from(uploadInfo.data.bucket)
        .uploadToSignedUrl(uploadInfo.data.path, uploadInfo.data.token, file);

      if (uploadError) {
        throw new Error(uploadError.message || "Profile picture upload failed");
      }

      const updateResult = await updateOwnProfilePicture(uploadInfo.data.path);
      if (!updateResult.success) {
        throw new Error(updateResult.error ?? "Failed to save profile picture");
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: profileKeys.user(params.user_id) });
      queryClient.invalidateQueries({ queryKey: profileKeys.followers(params.user_id) });
      queryClient.invalidateQueries({ queryKey: profileKeys.following(params.user_id) });
      queryClient.invalidateQueries({ queryKey: profileKeys.friends(params.user_id) });
      notifications.show({
        title: "Profile picture updated",
        message: "Your new profile picture is now live.",
        color: "green",
      });
    },
    onError: (error) => {
      notifications.show({
        title: "Could not update profile picture",
        message: error instanceof Error ? error.message : "Something went wrong",
        color: "red",
      });
    },
  });

  const uploadProfileHeaderMutation = useMutation({
    mutationFn: async (file: File) => {
      if (!isOwnProfile) {
        throw new Error("You can only update your own profile header");
      }

      if (!allowedProfilePictureMimeTypes.has(file.type)) {
        throw new Error("Only JPG, PNG, WEBP, and GIF images are allowed");
      }

      if (file.size > maxProfileHeaderBytes) {
        throw new Error("Profile header must be 2MB or smaller");
      }

      const uploadInfo = await createProfileHeaderUploadUrl(file.type);
      if (!uploadInfo.success || !uploadInfo.data) {
        throw new Error(uploadInfo.error ?? "Failed to prepare profile header upload");
      }

      const supabase = createClient();
      const { error: uploadError } = await supabase.storage
        .from(uploadInfo.data.bucket)
        .uploadToSignedUrl(uploadInfo.data.path, uploadInfo.data.token, file);

      if (uploadError) {
        throw new Error(uploadError.message || "Profile header upload failed");
      }

      const updateResult = await updateOwnProfileHeader(uploadInfo.data.path);
      if (!updateResult.success) {
        throw new Error(updateResult.error ?? "Failed to save profile header");
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: profileKeys.user(params.user_id) });
      notifications.show({
        title: "Profile header updated",
        message: "Your new profile header is now live.",
        color: "green",
      });
    },
    onError: (error) => {
      notifications.show({
        title: "Could not update profile header",
        message: error instanceof Error ? error.message : "Something went wrong",
        color: "red",
      });
    },
  });

  const handleProfilePicSelect = (file: File | null) => {
    if (!file) return;
    uploadProfilePictureMutation.mutate(file);
  };

  const handleProfileHeaderSelect = (file: File | null) => {
    if (!file) return;
    uploadProfileHeaderMutation.mutate(file);
  };

  if (profile.status === "pending") {
    return (
      <Flex justify="center" align="center" h="calc(100vh - 120px)">
        <LSSpinner />
      </Flex>
    );
  }

  if (profile.status === "error") {
    return <div> Error loading Profile... </div>;
  }

  const friendIds = new Set(friends.data?.map(friend => friend.user_id));

  const notFollowedBack = following.data?.filter(user =>
    !friendIds.has(user.user_id)
  );

  const listPosts = userPosts.userPosts?.posts.map((post) => {
    const postId = String(post.post_id);
    const isCommentOpen = activeCommentPostId === postId;
    return (
      <li key={post.post_id}>
        <PostCard
          userId={params.user_id}
          userName={username}
          field={post.scientific_field ?? ""}
          mediaUrl={post.media_url ?? undefined}
          avatarUrl={profile.userProfile?.avatar_url ?? ""}
          content={post.text || "postText n/a"}
          timeAgo={getTimeAgo(post.created_at)}
          isLiked={post.isLiked ?? false}
          onLikeClick={() => likePostMutation.mutate(postId)}
          onCommentClick={() => setActiveCommentPostId(isCommentOpen ? null : postId)}
          showMenu={false}
          showActions
          onPostClick={() => router.push(`/posts/${post.post_id}`)}
        >
          <Stack gap="md" w="100%">
            {isCommentOpen ? (
              <CommentComposer
                postId={postId}
                onAddComment={async (pid, values) => {
                  await createCommentMutation.mutateAsync({ postId: pid, values });
                }}
                isSubmitting={createCommentMutation.isPending}
              />
            ) : null}
            {(post.comments ?? []).length > 0 ? (
              <>
                <Divider />
                {(post.comments ?? []).map((comment) => (
                  <PostCommentCard
                    key={comment.id}
                    comment={comment}
                    onLikeClick={(commentId) => likeCommentMutation.mutate(commentId)}
                    showMenu={false}
                  />
                ))}
              </>
            ) : null}
          </Stack>
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
            profilePicURL={profile.userProfile?.avatar_url ?? undefined}
            profileHeaderImageURL={profile.userProfile?.profile_header_url ?? undefined}
            isOwnProfile={isOwnProfile}
            isUploadingProfilePic={uploadProfilePictureMutation.isPending}
            onProfilePicSelect={handleProfilePicSelect}
            isUploadingProfileHeader={uploadProfileHeaderMutation.isPending}
            onProfileHeaderSelect={handleProfileHeaderSelect}
          />
        </Box>
        <Flex flex={3} direction="column" gap={8}>
          <Box flex={3}>
            <LSMiniProfileList widgetTitle="Friends" profiles={friends.data} />
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

export default function ProfilePage() {
  const isMobile = useIsMobile();

  return isMobile ? <LSProfileMobileLayout /> : <LSProfileDesktopLayout />;
}
