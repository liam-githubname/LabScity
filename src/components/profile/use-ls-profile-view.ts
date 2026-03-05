/**
 * Custom hook that encapsulates all TanStack Query mutations and derived state
 * for the LSProfileView component, keeping the UI layer free of data logic.
 */
import { useState } from "react";
import { notifications } from "@mantine/notifications";
import { useMutation, useQueryClient } from "@tanstack/react-query";
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
} from "@/lib/actions/profile";

type UpdateProfileAction = typeof updateProfileAction;
type ToggleFollowAction = typeof toggleFollowAction;

/** Props expected by useLSProfileView — mirrors the server-action props of LSProfileViewProps. */
export interface UseLSProfileViewParams {
  userId: string;
  isOwnProfile: boolean;
  currentUserId: string | null;
  updateProfileAction: UpdateProfileAction;
  toggleFollowAction: ToggleFollowAction;
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

/** Build edit form initial values from profile (User) data. */
function profileToEditInitialValues(profile: {
  first_name: string;
  last_name: string;
  about?: string | null;
  workplace?: string | null;
  occupation?: string | null;
  research_interests?: string[] | null;
  skills?: string[] | null;
}): UpdateProfileValues {
  return {
    firstName: profile.first_name ?? "",
    lastName: profile.last_name ?? "",
    about: profile.about ?? "",
    workplace: profile.workplace ?? "",
    occupation: profile.occupation ?? "",
    fieldOfInterest: profile.research_interests?.[0] ?? "",
    skills: profile.skills ?? [],
  };
}

/**
 * Wraps all post-related server actions in React Query mutations
 * and centralises error handling + cache invalidation.
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

  return { actions, editProfile, followProfile };
}
