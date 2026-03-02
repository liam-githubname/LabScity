import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import {
  checkIsMuted,
  markNotificationAsRead,
  muteItem,
  setNotificationPreference,
  setNotificationPreferenceAllLikes,
  setNotificationPreferenceComments,
  setNotificationPreferenceFollows,
  setNotificationPreferenceGroupInvites,
  setNotificationPreferenceMessages,
  unmarkNotificationAsRead,
  unmuteItem,
} from "@/lib/actions/notifications";
import { notificationKeys } from "@/lib/query-keys";

/**
 * React Query hook for checking if an item is muted.
 *
 * @param itemId - The ID of the item to check
 * @param itemType - The type of item ('post', 'conversation', or 'group')
 * @returns React Query result object with boolean value
 *
 * @example
 * ```typescript
 * const { data, isLoading } = useCheckIsMuted(123, 'post');
 * ```
 */
export function useCheckIsMuted(itemId: number, itemType: string) {
  return useQuery({
    queryKey: notificationKeys.isMuted(itemId, itemType),
    queryFn: async () => checkIsMuted(itemId, itemType),
  });
}

/**
 * React Query hook for setting a notification preference.
 * This is a generic mutation that can set any notification type.
 *
 * @returns React Query mutation object
 *
 * @example
 * ```typescript
 * const mutation = useSetNotificationPreference();
 * mutation.mutate({ newValue: false, notificationType: 'post_like' });
 * ```
 */
export function useSetNotificationPreference() {
  return useMutation({
    mutationFn: async ({
      newValue,
      notificationType,
    }: {
      newValue: boolean;
      notificationType: string;
    }) => setNotificationPreference(newValue, notificationType),
  });
}

/**
 * React Query hook for enabling/disabling like notifications.
 *
 * @returns React Query mutation object
 *
 * @example
 * ```typescript
 * const mutation = useSetNotificationPreferenceAllLikes();
 * mutation.mutate(false); // Disable like notifications
 * ```
 */
export function useSetNotificationPreferenceAllLikes() {
  return useMutation({
    mutationFn: async (newValue: boolean) =>
      setNotificationPreferenceAllLikes(newValue),
  });
}

/**
 * React Query hook for enabling/disabling comment notifications.
 *
 * @returns React Query mutation object
 *
 * @example
 * ```typescript
 * const mutation = useSetNotificationPreferenceComments();
 * mutation.mutate(true); // Enable comment notifications
 * ```
 */
export function useSetNotificationPreferenceComments() {
  return useMutation({
    mutationFn: async (newValue: boolean) =>
      setNotificationPreferenceComments(newValue),
  });
}

/**
 * React Query hook for enabling/disabling follow notifications.
 *
 * @returns React Query mutation object
 *
 * @example
 * ```typescript
 * const mutation = useSetNotificationPreferenceFollows();
 * mutation.mutate(false); // Disable follow notifications
 * ```
 */
export function useSetNotificationPreferenceFollows() {
  return useMutation({
    mutationFn: async (newValue: boolean) =>
      setNotificationPreferenceFollows(newValue),
  });
}

/**
 * React Query hook for enabling/disabling group invite notifications.
 *
 * @returns React Query mutation object
 *
 * @example
 * ```typescript
 * const mutation = useSetNotificationPreferenceGroupInvites();
 * mutation.mutate(true); // Enable group invite notifications
 * ```
 */
export function useSetNotificationPreferenceGroupInvites() {
  return useMutation({
    mutationFn: async (newValue: boolean) =>
      setNotificationPreferenceGroupInvites(newValue),
  });
}

/**
 * React Query hook for enabling/disabling message notifications.
 *
 * @returns React Query mutation object
 *
 * @example
 * ```typescript
 * const mutation = useSetNotificationPreferenceMessages();
 * mutation.mutate(false); // Disable message notifications
 * ```
 */
export function useSetNotificationPreferenceMessages() {
  return useMutation({
    mutationFn: async (newValue: boolean) =>
      setNotificationPreferenceMessages(newValue),
  });
}

/**
 * React Query hook for muting an item.
 * On success, invalidates the isMuted query to reflect the change.
 *
 * @returns React Query mutation object
 *
 * @example
 * ```typescript
 * const mutation = useMuteItem();
 * mutation.mutate({ itemId: 123, itemType: 'post' });
 * ```
 */
export function useMuteItem() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({
      itemId,
      itemType,
    }: {
      itemId: number;
      itemType: string;
    }) => muteItem(itemId, itemType),
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({
        queryKey: notificationKeys.isMuted(
          variables.itemId,
          variables.itemType,
        ),
      });
    },
  });
}

/**
 * React Query hook for unmuting an item.
 * On success, invalidates the isMuted query to reflect the change.
 *
 * @returns React Query mutation object
 *
 * @example
 * ```typescript
 * const mutation = useUnmuteItem();
 * mutation.mutate({ itemId: 123, itemType: 'post' });
 * ```
 */
export function useUnmuteItem() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({
      itemId,
      itemType,
    }: {
      itemId: number;
      itemType: string;
    }) => unmuteItem(itemId, itemType),
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({
        queryKey: notificationKeys.isMuted(
          variables.itemId,
          variables.itemType,
        ),
      });
    },
  });
}

/**
 * React Query hook for marking a notification as read.
 *
 * @returns React Query mutation object
 *
 * @example
 * ```typescript
 * const mutation = useMarkNotificationAsRead();
 * mutation.mutate("notification-uuid-here");
 * ```
 */
export function useMarkNotificationAsRead() {
  return useMutation({
    mutationFn: async (notificationId: string) =>
      markNotificationAsRead(notificationId),
  });
}

/**
 * React Query hook for marking a notification as unread.
 *
 * @returns React Query mutation object
 *
 * @example
 * ```typescript
 * const mutation = useUnmarkNotificationAsRead();
 * mutation.mutate("notification-uuid-here");
 * ```
 */
export function useUnmarkNotificationAsRead() {
  return useMutation({
    mutationFn: async (notificationId: string) =>
      unmarkNotificationAsRead(notificationId),
  });
}
