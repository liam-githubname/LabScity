"use server";

// TODO: remove the console.logs (MOVE THEM TO CONSOLE.ERRORS PRO)

import { createClient } from "@/supabase/server";

/**
 * Sets a notification preference for the current user.
 * This is a generic function that can set any notification type.
 *
 * @param newValue - Whether to enable (true) or disable (false) the notification type
 * @param notification_type - The type of notification to configure (e.g., 'post_like', 'new_comment', 'new_follow', 'group_invite', 'new_message')
 * @returns Promise resolving to success status
 *
 * @example
 * ```typescript
 * // Disable likes notifications
 * await setNotificationPreference(false, 'post_like');
 *
 * // Enable comment notifications
 * await setNotificationPreference(true, 'new_comment');
 * ```
 */
export async function setNotificationPreference(
  newValue: boolean,
  notification_type: string,
) {
  const supabase = await createClient();
  const { data: authData } = await supabase.auth.getUser();
  if (!authData.user) {
    return { success: false, error: "Authentication required" };
  }

  const { error } = await supabase.from("notification_preferences").upsert({
    user_id: authData.user.id,
    notification_type: notification_type,
    is_enabled: newValue,
  });

  if (error) {
    console.log("DisableNotification is ERRORING", error);
  }
  console.log("Did not receive error setting preference: ", notification_type);
  return { success: true };
}

/**
 * Enables or disables notifications when someone likes the user's posts.
 *
 * @param newValue - Whether to enable (true) or disable (false) like notifications
 * @returns Promise resolving to success status
 *
 * @example
 * ```typescript
 * // Disable like notifications
 * await setNotificationPreferenceAllLikes(false);
 * ```
 */

// mutation
export async function setNotificationPreferenceAllLikes(newValue: boolean) {
  const supabase = await createClient();
  const { data: authData } = await supabase.auth.getUser();
  if (!authData.user) {
    return { success: false, error: "Authentication required" };
  }

  const { error } = await supabase.from("notification_preferences").upsert({
    user_id: authData.user,
    notification_type: "post_like",
    is_enabled: newValue,
  });

  if (error) {
    console.log("Enabling/Disabling post_likes failed ", error);
  }
  console.log("Did not receive error while setting post_likes");
  return { success: true };
}

export async function setNotificationPreferenceComments(newValue: boolean) {
  const supabase = await createClient();
  const { data: authData } = await supabase.auth.getUser();
  if (!authData.user) {
    return { success: false, error: "Authentication required" };
  }

  const { error } = await supabase.from("notification_preferences").upsert({
    user_id: authData.user,
    notification_type: "new_comment",
    is_enabled: newValue,
  });

  if (error) {
    console.log("Enabling/Disabling new_comment failed ", error);
  }
  console.log("Did not receive error while setting new_comment");
  return { success: true };
}

/**
 * Enables or disables notifications when someone follows the user.
 *
 * @param newValue - Whether to enable (true) or disable (false) follow notifications
 * @returns Promise resolving to success status
 *
 * @example
 * ```typescript
 * // Disable follow notifications
 * await setNotificationPreferenceFollows(false);
 * ```
 */
export async function setNotificationPreferenceFollows(newValue: boolean) {
  const supabase = await createClient();
  const { data: authData } = await supabase.auth.getUser();
  if (!authData.user) {
    return { success: false, error: "Authentication required" };
  }

  const { error } = await supabase.from("notification_preferences").upsert({
    user_id: authData.user,
    notification_type: "new_follow",
    is_enabled: newValue,
  });

  if (error) {
    console.log("Enabling/Disabling new_follow failed ", error);
  }
  console.log("Did not receive error while setting new_follow");
  return { success: true };
}

/**
 * Enables or disables notifications when the user is invited to join a group.
 *
 * @param newValue - Whether to enable (true) or disable (false) group invite notifications
 * @returns Promise resolving to success status
 *
 * @example
 * ```typescript
 * // Disable group invite notifications
 * await setNotificationPreferenceGroupInvites(false);
 * ```
 */
export async function setNotificationPreferenceGroupInvites(newValue: boolean) {
  const supabase = await createClient();
  const { data: authData } = await supabase.auth.getUser();
  if (!authData.user) {
    return { success: false, error: "Authentication required" };
  }

  const { error } = await supabase.from("notification_preferences").upsert({
    user_id: authData.user,
    notification_type: "group_invite",
    is_enabled: newValue,
  });

  if (error) {
    console.log("Enabling/Disabling group_invite failed ", error);
  }
  console.log("Did not receive error while setting group_invite");
  return { success: true };
}

/**
 * Enables or disables notifications for new messages in conversations.
 *
 * @param newValue - Whether to enable (true) or disable (false) message notifications
 * @returns Promise resolving to success status
 *
 * @example
 * ```typescript
 * // Disable message notifications
 * await setNotificationPreferenceMessages(false);
 * ```
 */
export async function setNotificationPreferenceMessages(newValue: boolean) {
  const supabase = await createClient();
  const { data: authData } = await supabase.auth.getUser();

  if (!authData.user) {
    return { success: false, error: "Authentication required" };
  }

  const { error } = await supabase.from("notification_preferences").upsert({
    user_id: authData.user,
    notification_type: "new_message",
    is_enabled: newValue,
  });

  if (error) {
    console.log("Enabling/Disabling new_message failed ", error);
  }

  console.log("Did not receive error while setting new_message");
  return { success: true };
}

/**
 * Checks if a specific item is muted for the current user.
 *
 * @param itemId - The ID of the item to check (e.g., post ID, conversation ID, or group ID)
 * @param itemType - The type of item ('post', 'conversation', or 'group')
 * @returns Promise resolving to true if the item is muted, false otherwise
 *
 * @example
 * ```typescript
 * // Check if a post is muted
 * const isMuted = await checkIsMuted(123, 'post');
 *
 * // Check if a conversation is muted
 * const isConvoMuted = await checkIsMuted(456, 'conversation');
 * ```
 */
export async function checkIsMuted(
  itemId: number,
  itemType: string,
): Promise<boolean> {
  const supabase = await createClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return false;

  const { data, error } = await supabase
    .from("muted_items")
    .select("item_id")
    .eq("user_id", user.id)
    .eq("item_id", itemId)
    .eq("item_type", itemType)
    .maybeSingle();

  if (error) {
    console.error("Error checking mute status:", error);
    return false;
  }

  return data !== null;
}

/**
 * Mutes a specific item for the current user.
 * Muted items will not trigger notifications to the user.
 *
 * @param itemId - The ID of the item to mute (e.g., post ID, conversation ID, or group ID)
 * @param itemType - The type of item to mute ('post', 'conversation', or 'group')
 * @returns Promise resolving to an object with success status and optional error message
 *
 * @example
 * ```typescript
 * // Mute a post
 * await muteItem(123, 'post');
 *
 * // Mute a conversation
 * await muteItem(456, 'conversation');
 * ```
 */
export async function muteItem(
  itemId: number,
  itemType: string,
): Promise<{ success: boolean; error?: string }> {
  const supabase = await createClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return { success: false, error: "Not authenticated" };

  const { error } = await supabase.from("muted_items").insert({
    user_id: user.id,
    item_id: itemId,
    item_type: itemType,
  });

  if (error) {
    console.error(`Failed to mute ${itemType}:`, error.message);
    return { success: false, error: error.message };
  }

  return { success: true };
}

/**
 * Unmutes a specific item for the current user.
 * Previously muted items will resume triggering notifications.
 *
 * @param itemId - The ID of the item to unmute (e.g., post ID, conversation ID, or group ID)
 * @param itemType - The type of item to unmute ('post', 'conversation', or 'group')
 * @returns Promise resolving to an object with success status and optional error message
 *
 * @example
 * ```typescript
 * // Unmute a post
 * await unmuteItem(123, 'post');
 *
 * // Unmute a conversation
 * await unmuteItem(456, 'conversation');
 * ```
 */
export async function unmuteItem(
  itemId: number,
  itemType: string,
): Promise<{ success: boolean; error?: string }> {
  const supabase = await createClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return { success: false, error: "Not authenticated" };

  const { error } = await supabase
    .from("muted_items")
    .delete()
    .eq("user_id", user.id)
    .eq("item_id", itemId)
    .eq("item_type", itemType);

  if (error) {
    console.error(`Failed to unmute ${itemType}:`, error.message);
    return { success: false, error: error.message };
  }

  return { success: true };
}

/**
 * Marks a notification as read by updating its is_read status to true.
 *
 * @param notificationId - The ID of the notification to mark as read
 * @returns Promise resolving to an object with success status and optional error message
 *
 * @example
 * ```typescript
 * await markNotificationAsRead("notification-uuid-here");
 * ```
 */
export async function markNotificationAsRead(
  notificationId: string,
): Promise<{ success: boolean; error?: string }> {
  const supabase = await createClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return { success: false, error: "Not authenticated" };

  const { error } = await supabase
    .from("notifications")
    .update({ is_read: true })
    .eq("id", notificationId)
    .eq("user_id", user.id);

  if (error) {
    console.error("Failed to mark notification as read:", error.message);
    return { success: false, error: error.message };
  }

  return { success: true };
}

/**
 * Marks a notification as unread by updating its is_read status to false.
 *
 * @param notificationId - The ID of the notification to mark as unread
 * @returns Promise resolving to an object with success status and optional error message
 *
 * @example
 * ```typescript
 * await unmarkNotificationAsRead("notification-uuid-here");
 * ```
 */
export async function unmarkNotificationAsRead(
  notificationId: string,
): Promise<{ success: boolean; error?: string }> {
  const supabase = await createClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return { success: false, error: "Not authenticated" };

  const { error } = await supabase
    .from("notifications")
    .update({ is_read: false })
    .eq("id", notificationId)
    .eq("user_id", user.id);

  if (error) {
    console.error("Failed to mark notification as unread:", error.message);
    return { success: false, error: error.message };
  }

  return { success: true };
}
