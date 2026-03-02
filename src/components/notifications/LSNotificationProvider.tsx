"use client";

import { useEffect, useRef } from "react";
import {
  type Notification,
  useNotificationStore,
} from "@/store/notificationStore";
import { createClient } from "@/supabase/client";

export default function NotificationProvider({
  children,
}: {
  children: React.ReactNode;
}) {
  const { setNotifications, addNotification } = useNotificationStore();
  const supabase = createClient();
  const channelRef = useRef<ReturnType<typeof supabase.channel> | null>(null);

  useEffect(() => {
    const initializeNotifications = async () => {
      const {
        data: { user },
      } = await supabase.auth.getUser();
      if (!user) return;

      const { data } = await supabase
        .from("notifications")
        .select("*")
        .eq("is_read", false)
        .order("created_at", { ascending: false });

      if (data) setNotifications(data);

      channelRef.current = supabase
        .channel(`notifications_${user.id}`)
        .on(
          "postgres_changes",
          {
            event: "INSERT",
            schema: "public",
            table: "notifications",
            filter: `user_id=eq.${user.id}`,
          },
          (payload) => {
            console.log(payload);
            addNotification(payload.new as Notification);
          },
        )
        .subscribe();
    };

    initializeNotifications();

    return () => {
      if (channelRef.current) {
        supabase.removeChannel(channelRef.current);
      }
    };
  }, [supabase, setNotifications, addNotification]);

  return <>{children}</>;
}
