/**
 * Custom hook that encapsulates all TanStack Query mutations and derived state
 * for the LSProfileView component, keeping the UI layer free of data logic.
 */
import { useCallback, useState } from "react";
import { notifications } from "@mantine/notifications";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { createClient } from "@/supabase/client";
import {
  useUserFollowers,
  useUserProfile,
} from "@/components/profile/use-profile";
import { profileKeys } from "@/lib/query-keys";
import type {
  CreateCommentAction,
  CreateReportAction,
  LikeCommentAction,
  LikePostAction,
} from "@/components/feed/home-feed.types";
import type {
  CreateCommentValues,
  CreateReportValues,
} from "@/lib/validations/post";
import type { UpdateProfileValues } from "@/lib/validations/profile";
import type {
  updateProfileAction,
  toggleFollowAction,
  createProfilePictureUploadUrl,
  updateOwnProfilePicture,
  createProfileHeaderUploadUrl,
  updateOwnProfileHeader,
} from "@/lib/actions/profile";

type UpdateProfileAction = typeof updateProfileAction;
type ToggleFollowAction = typeof toggleFollowAction;
type CreateProfilePictureUploadUrlAction = typeof createProfilePictureUploadUrl;
type UpdateOwnProfilePictureAction = typeof updateOwnProfilePicture;
type CreateProfileHeaderUploadUrlAction = typeof createProfileHeaderUploadUrl;
type UpdateOwnProfileHeaderAction = typeof updateOwnProfileHeader;

/** Props expected by useLSProfileView — mirrors the server-action props of LSProfileViewProps. */
export interface UseLSProfileViewParams {
  userId: string;
  isOwnProfile: boolean;
  currentUserId: string | null;
  updateProfileAction: UpdateProfileAction;
  toggleFollowAction: ToggleFollowAction;
  createProfilePictureUploadUrlAction: CreateProfilePictureUploadUrlAction;
  updateOwnProfilePictureAction: UpdateOwnProfilePictureAction;
  createProfileHeaderUploadUrlAction: CreateProfileHeaderUploadUrlAction;
  updateOwnProfileHeaderAction: UpdateOwnProfileHeaderAction;
  createCommentAction: CreateCommentAction;
  createReportAction: CreateReportAction;
  likePostAction: LikePostAction;
  likeCommentAction: LikeCommentAction;
}

/** Edit modal + form props passed from the hook into the hero. */
export interface EditProfileHeroProps {
  onOpenEditProfile?: () => void;
  editModalOpened?: boolean;
  onEditModalClose?: () => void;
  editInitialValues?: UpdateProfileValues;
  onEditSubmit?: (values: UpdateProfileValues) => void;
  isEditSubmitting?: boolean;
}

/** Follow/unfollow props for the hero when viewing another user's profile. */
export interface FollowProfileHeroProps {
  isFollowing: boolean;
  onToggleFollow: () => void;
  isTogglePending?: boolean;
}

/** Profile picture & banner upload props for the hero. */
export interface ProfileMediaUploadProps {
  onProfilePicSelect: (file: File | null) => void;
  isUploadingProfilePic: boolean;
  onProfileHeaderSelect: (file: File | null) => void;
  isUploadingProfileHeader: boolean;
}

/**
 * Build edit form initial values from profile (User) data.
 *
 * @param profile - User object from useUserProfile (first_name, last_name, about, skills, articles, etc.).
 * @returns UpdateProfileValues for the edit modal defaultValues and reset.
 */
function profileToEditInitialValues(profile: {
  first_name: string;
  last_name: string;
  about?: string | null;
  workplace?: string | null;
  occupation?: string | null;
  research_interests?: string[] | null;
  skills?: string[] | null;
  articles?: { title: string; url: string }[] | null;
}): UpdateProfileValues {
  return {
    firstName: profile.first_name ?? "",
    lastName: profile.last_name ?? "",
    about: profile.about ?? "",
    workplace: profile.workplace ?? "",
    occupation: profile.occupation ?? "",
    fieldOfInterest: profile.research_interests?.[0] ?? "",
    skill: profile.skills ?? [],
    articles: profile.articles ?? [],
  };
}

/**
 * Wraps all post-related server actions in React Query mutations
 * and centralises error handling + cache invalidation.
 *
 * @param userId - Profile owner's user ID (used to invalidate profileKeys.posts(userId) on success).
 * @param actions - Server actions for createComment, createReport, likePost, likeComment.
 * @returns { handleTogglePostLike, handleToggleCommentLike, handleAddComment, submitReport } for use in profile layouts.
 */
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
    onMutate: async (postId: string) => {
      await queryClient.cancelQueries({ queryKey: profileKeys.posts(userId) });
      const snapshot = queryClient.getQueryData(profileKeys.posts(userId));
      queryClient.setQueryData(profileKeys.posts(userId), (old: any) => {
        if (!old) return old;
        return {
          ...old,
          pages: old.pages.map((page: any) => ({
            ...page,
            posts: page.posts.map((p: any) =>
              String(p.post_id) === postId
                ? { ...p, isLiked: !p.isLiked, like_amount: (p.like_amount ?? 0) + (p.isLiked ? -1 : 1) }
                : p
            ),
          })),
        };
      });
      return { snapshot };
    },
    onError: (error: unknown, _postId: string, context: any) => {
      if (context?.snapshot) {
        queryClient.setQueryData(profileKeys.posts(userId), context.snapshot);
      }
      notifications.show({
        title: "Could not update like",
        message:
          error instanceof Error ? error.message : "Something went wrong",
        color: "red",
      });
    },
    onSettled: () => {
      invalidatePosts();
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

export type ProfilePostActionsResult = ReturnType<typeof useProfilePostActions>;

/**
 * Primary hook for LSProfileView.
 *
 * Manages the update-profile mutation, toggle-follow mutation,
 * edit-modal state, the derived `isFollowing` flag, and all
 * post-related action mutations.
 *
 * @returns `actions` (post mutations), `editProfile` (hero edit props),
 *          and `followProfile` (hero follow props).
 */
export function useLSProfileView(params: UseLSProfileViewParams) {
  const {
    userId,
    isOwnProfile,
    currentUserId,
    createCommentAction,
    createReportAction,
    likePostAction,
    likeCommentAction,
  } = params;

  const [editModalOpened, setEditModalOpened] = useState(false);

  const profileQuery = useUserProfile(userId);
  const profile = profileQuery.data;
  const followersQuery = useUserFollowers(userId);
  const followers = followersQuery.data;

  const isFollowing = Boolean(
    currentUserId && followers?.some((f) => f.user_id === currentUserId),
  );

  const queryClient = useQueryClient();

  const updateProfileMutation = useMutation({
    mutationFn: async (values: UpdateProfileValues) => {
      const result = await params.updateProfileAction(values);
      if (!result.success) {
        throw new Error(result.error ?? "Failed to update profile");
      }
      return result;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: profileKeys.user(userId) });
      setEditModalOpened(false);
      notifications.show({
        title: "Profile updated",
        message: "Your profile has been saved.",
        color: "green",
      });
    },
    onError: (error: unknown) => {
      notifications.show({
        title: "Could not update profile",
        message:
          error instanceof Error ? error.message : "Something went wrong",
        color: "red",
      });
    },
  });

  const toggleFollowMutation = useMutation({
    mutationFn: async () => {
      const result = await params.toggleFollowAction({
        targetUserId: userId,
      });
      if (!result.success) {
        throw new Error(result.error ?? "Failed to update follow state");
      }
      return result;
    },
    onSuccess: (data) => {
      // Optimistic update: unfollow removes current user from cached followers so button flips to "Follow" immediately.
      if (data.data?.isFollowing === false && currentUserId) {
        queryClient.setQueryData(
          profileKeys.followers(userId),
          (old: Array<{ user_id: string }> | undefined) =>
            old ? old.filter((f) => f.user_id !== currentUserId) : old,
        );
      }
      queryClient.invalidateQueries({
        queryKey: profileKeys.followers(userId),
      });
      queryClient.invalidateQueries({
        queryKey: profileKeys.following(userId),
      });
      notifications.show({
        title: data.data?.isFollowing ? "Following" : "Unfollowed",
        message: data.data?.isFollowing
          ? "You are now following this user."
          : "You have unfollowed this user.",
        color: "green",
      });
    },
    onError: (error: unknown) => {
      notifications.show({
        title: "Could not update follow state",
        message:
          error instanceof Error ? error.message : "Something went wrong",
        color: "red",
      });
    },
  });

  const editProfile: EditProfileHeroProps = isOwnProfile
    ? {
      onOpenEditProfile: () => setEditModalOpened(true),
      editModalOpened,
      onEditModalClose: () => setEditModalOpened(false),
      editInitialValues: profile
        ? profileToEditInitialValues(profile)
        : undefined,
      onEditSubmit: (values) => updateProfileMutation.mutate(values),
      isEditSubmitting: updateProfileMutation.isPending,
    }
    : {};

  const followProfile: FollowProfileHeroProps | undefined =
    !isOwnProfile && currentUserId
      ? {
        isFollowing,
        onToggleFollow: () => toggleFollowMutation.mutate(),
        isTogglePending: toggleFollowMutation.isPending,
      }
      : undefined;

  const actions = useProfilePostActions(userId, {
    createCommentAction,
    createReportAction,
    likePostAction,
    likeCommentAction,
  });

  // --- Profile picture & banner upload ---

  const allowedImageTypes = new Set([
    "image/jpeg",
    "image/png",
    "image/webp",
    "image/gif",
  ]);
  const maxProfilePicBytes = 1024 * 1024;
  const maxProfileHeaderBytes = 2 * 1024 * 1024;
  const profilePicBucket = "profile_pictures";
  const profileHeaderBucket = "profile_header";

  const [isUploadingProfilePic, setIsUploadingProfilePic] = useState(false);
  const [isUploadingProfileHeader, setIsUploadingProfileHeader] =
    useState(false);

  const handleProfilePicSelect = useCallback(
    async (file: File | null) => {
      if (!file) return;
      if (!allowedImageTypes.has(file.type)) {
        notifications.show({
          title: "Invalid file type",
          message: "Only JPG, PNG, WEBP, and GIF images are allowed",
          color: "red",
        });
        return;
      }
      if (file.size > maxProfilePicBytes) {
        notifications.show({
          title: "File too large",
          message: "Profile picture must be 1 MB or smaller",
          color: "red",
        });
        return;
      }

      setIsUploadingProfilePic(true);
      try {
        const uploadInfo =
          await params.createProfilePictureUploadUrlAction(file.type);
        if (!uploadInfo.success || !uploadInfo.data) {
          throw new Error(
            uploadInfo.error ?? "Could not prepare image upload",
          );
        }

        const supabase = createClient();
        const { error: uploadError } = await supabase.storage
          .from(profilePicBucket)
          .uploadToSignedUrl(
            uploadInfo.data.path,
            uploadInfo.data.token,
            file,
          );
        if (uploadError) {
          throw new Error(uploadError.message || "Image upload failed");
        }

        const updateResult = await params.updateOwnProfilePictureAction(
          uploadInfo.data.path,
        );
        if (!updateResult.success) {
          throw new Error(
            updateResult.error ?? "Failed to save profile picture",
          );
        }

        queryClient.invalidateQueries({ queryKey: profileKeys.user(userId) });
        notifications.show({
          title: "Profile picture updated",
          message: "Your new profile picture has been saved.",
          color: "green",
        });
      } catch (error: unknown) {
        notifications.show({
          title: "Could not update profile picture",
          message:
            error instanceof Error ? error.message : "Something went wrong",
          color: "red",
        });
      } finally {
        setIsUploadingProfilePic(false);
      }
    },
    [params, queryClient, userId],
  );

  const handleProfileHeaderSelect = useCallback(
    async (file: File | null) => {
      if (!file) return;
      if (!allowedImageTypes.has(file.type)) {
        notifications.show({
          title: "Invalid file type",
          message: "Only JPG, PNG, WEBP, and GIF images are allowed",
          color: "red",
        });
        return;
      }
      if (file.size > maxProfileHeaderBytes) {
        notifications.show({
          title: "File too large",
          message: "Banner image must be 2 MB or smaller",
          color: "red",
        });
        return;
      }

      setIsUploadingProfileHeader(true);
      try {
        const uploadInfo =
          await params.createProfileHeaderUploadUrlAction(file.type);
        if (!uploadInfo.success || !uploadInfo.data) {
          throw new Error(
            uploadInfo.error ?? "Could not prepare image upload",
          );
        }

        const supabase = createClient();
        const { error: uploadError } = await supabase.storage
          .from(profileHeaderBucket)
          .uploadToSignedUrl(
            uploadInfo.data.path,
            uploadInfo.data.token,
            file,
          );
        if (uploadError) {
          throw new Error(uploadError.message || "Image upload failed");
        }

        const updateResult = await params.updateOwnProfileHeaderAction(
          uploadInfo.data.path,
        );
        if (!updateResult.success) {
          throw new Error(updateResult.error ?? "Failed to save banner");
        }

        queryClient.invalidateQueries({ queryKey: profileKeys.user(userId) });
        notifications.show({
          title: "Banner updated",
          message: "Your new banner has been saved.",
          color: "green",
        });
      } catch (error: unknown) {
        notifications.show({
          title: "Could not update banner",
          message:
            error instanceof Error ? error.message : "Something went wrong",
          color: "red",
        });
      } finally {
        setIsUploadingProfileHeader(false);
      }
    },
    [params, queryClient, userId],
  );

  const mediaUpload: ProfileMediaUploadProps | undefined = isOwnProfile
    ? {
      onProfilePicSelect: handleProfilePicSelect,
      isUploadingProfilePic,
      onProfileHeaderSelect: handleProfileHeaderSelect,
      isUploadingProfileHeader,
    }
    : undefined;

  return { actions, editProfile, followProfile, mediaUpload };
}
