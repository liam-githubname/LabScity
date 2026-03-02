"use client";

import { create } from "zustand";

/**
 * Represents a notification received from the Supabase backend.
 */
export interface Notification {
  /** Unique identifier for the notification (uuid) */
  id: string;
  /** ID of the user who received the notification (uuid) */
  user_id: string;
  /** Type of notification (e.g., 'post_like', 'new_comment', 'new_follow', 'group_invite', 'new_message') */
  type: string;
  /** Title of the notification */
  title: string;
  /** Body content of the notification */
  content: string;
  /** Optional link associated with the notification */
  link: string | null;
  /** Whether the notification has been read */
  is_read: boolean;
  /** Timestamp when the notification was created */
  created_at: string;
  /** Key to group notifications together (e.g., "chat_123" for message bundling) */
  bundleKey?: string;
  /** Number of bundled notifications (1 = not bundled, 4+ = bundled) */
  bundleCount?: number;
}

/**
 * Global store for managing notifications across the application.
 * This store is populated by the LSNotificationProvider component which
 * subscribes to Supabase realtime updates.
 *
 * @example
 * ```typescript
 * import { useNotificationStore } from "@/store/notificationStore";
 *
 * function MyComponent() {
 *   const notifications = useNotificationStore((state) => state.notifications);
 *   // ...
 * }
 * ```
 */
interface NotificationStore {
  /** Array of all current notifications */
  notifications: Notification[];
  /** Sets the notifications to the provided array (used for initial fetch) */
  setNotifications: (notifications: Notification[]) => void;
  /** Adds a single notification to the beginning of the list (used for realtime inserts) */
  addNotification: (notification: Notification) => void;
  /** Dismisses a notification by removing it from the UI */
  dismissNotification: (id: string) => void;
}

/**
 * Zustand store for managing global application notifications.
 * Subscribe to this store to access notifications from any component.
 *
 * @example
 * ```typescript
 * const notifications = useNotificationStore((state) => state.notifications);
 * ```
 */
export const useNotificationStore = create<NotificationStore>((set) => ({
  notifications: [],
  setNotifications: (notifications) => set({ notifications }),
  addNotification: (notification) =>
    set((state) => {
      // Check if this is a chat message notification that should be bundled
      if (
        notification.type === "new_message" &&
        notification.link?.startsWith("/chat/")
      ) {
        const chatId = notification.link.replace("/chat/", "");
        const bundleKey = `chat_${chatId}`;

        // Check if there's already a bundled notification for this chat
        const existingBundle = state.notifications.find(
          (n) => n.bundleKey === bundleKey && n.type === "new_message",
        );

        if (existingBundle) {
          // Already have a bundled notification - increment count
          const newCount = (existingBundle.bundleCount || 1) + 1;
          return {
            notifications: state.notifications.map((n) =>
              n.id === existingBundle.id ? { ...n, bundleCount: newCount } : n,
            ),
          };
        }

        // No existing bundle - add as new with bundleKey and bundleCount: 1
        return {
          notifications: [
            { ...notification, bundleKey, bundleCount: 1 },
            ...state.notifications,
          ],
        };
      }

      // For non-message types, add normally
      return {
        notifications: [notification, ...state.notifications],
      };
    }),
  dismissNotification: (id: string) =>
    set((state) => ({
      notifications: state.notifications.filter((n) => n.id !== id),
    })),
}));
