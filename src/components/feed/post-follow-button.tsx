"use client";

import { Button } from "@mantine/core";
import { notifications } from "@mantine/notifications";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { getUserFollowing, toggleFollowAction } from "@/lib/actions/profile";
import { profileKeys } from "@/lib/query-keys";

interface PostFollowButtonProps {
  currentUserId: string | null;
  targetUserId: string;
}

function noPropagate(fn?: () => void) {
  return (e: React.MouseEvent) => {
    e.stopPropagation();
    fn?.();
  };
}

export function PostFollowButton({
  currentUserId,
  targetUserId,
}: PostFollowButtonProps) {
  const queryClient = useQueryClient();

  const followingQuery = useQuery({
    queryKey: currentUserId
      ? profileKeys.following(currentUserId)
      : ["profile", "following", "anonymous"],
    queryFn: async () => {
      if (!currentUserId) {
        return [];
      }

      const result = await getUserFollowing(currentUserId);
      if (!result.success || !result.data) {
        throw new Error(result.error ?? "Failed to fetch following");
      }

      return result.data;
    },
    enabled: Boolean(currentUserId),
  });

  const toggleFollowMutation = useMutation({
    mutationFn: async () => {
      const result = await toggleFollowAction({ targetUserId });
      if (!result.success) {
        throw new Error(result.error ?? "Failed to update follow state");
      }
      return result;
    },
    onSuccess: (result) => {
      queryClient.invalidateQueries({
        queryKey: currentUserId
          ? profileKeys.following(currentUserId)
          : ["profile", "following", "anonymous"],
      });
      queryClient.invalidateQueries({
        queryKey: profileKeys.followers(targetUserId),
      });

      if (result.data.isFollowing) {
        notifications.show({
          title: "Following",
          message: "You are now following this user.",
          color: "green",
        });
      }
    },
    onError: (error) => {
      notifications.show({
        title: "Could not update follow state",
        message:
          error instanceof Error ? error.message : "Something went wrong",
        color: "red",
      });
    },
  });

  const isFollowing =
    Boolean(
      currentUserId &&
        followingQuery.data?.some((user) => user.user_id === targetUserId),
    ) || toggleFollowMutation.data?.data.isFollowing === true;

  if (
    !currentUserId ||
    currentUserId === targetUserId ||
    followingQuery.isPending ||
    isFollowing
  ) {
    return null;
  }

  return (
    <Button
      size="compact-xs"
      radius="xl"
      variant="light"
      color="navy"
      onClick={noPropagate(toggleFollowMutation.mutate)}
      loading={toggleFollowMutation.isPending}
    >
      Follow
    </Button>
  );
}
