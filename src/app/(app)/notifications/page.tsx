"use client";

import {
  ActionIcon,
  Box,
  Divider,
  Flex,
  Group,
  Paper,
  Stack,
  Text,
} from "@mantine/core";
import {
  IconBell,
  IconCircleFilled,
  IconHeartFilled,
  IconMessageCircleFilled,
  IconMessageFilled,
  IconUserFilled,
  IconUsers,
  IconX,
} from "@tabler/icons-react";
import Link from "next/link";
import { useEffect, useMemo, useState } from "react";
import { useIsMobile } from "@/app/use-is-mobile";
import { LSGroupInviteNotificationCard } from "@/components/notifications/ls-group-invite-notification-card";
import { useMarkNotificationAsRead } from "@/components/notifications/use-notifications";
import { parseGroupIdFromNotificationLink } from "@/lib/utils/group-notification";
import { useNotificationStore } from "@/store/notificationStore";

const LAST_VISITED_NOTIFICATIONS_KEY =
  "labscity:last-notifications-page-seen-at";
const PENDING_VISIT_START_KEY =
  "labscity:pending-notifications-page-visit-start-at";

function getNotificationIcon(type: string) {
  switch (type) {
    case "post_like":
      return IconHeartFilled;
    case "new_comment":
      return IconMessageCircleFilled;
    case "new_follow":
      return IconUserFilled;
    case "group_invite":
      return IconUsers;
    case "new_message":
      return IconMessageFilled;
    default:
      return IconBell;
  }
}

function getNotificationIconColor(type: string) {
  return type === "post_like"
    ? "var(--mantine-color-red-6)"
    : "var(--mantine-color-navy-7)";
}

function formatRelativeTime(dateString: string): string {
  const date = new Date(dateString);
  const now = new Date();
  const diffMs = now.getTime() - date.getTime();
  const diffMins = Math.floor(diffMs / (1000 * 60));
  const diffHours = Math.floor(diffMs / (1000 * 60 * 60));
  const diffDays = Math.floor(diffMs / (1000 * 60 * 60 * 24));

  if (diffMins < 1) return "just now";
  if (diffMins < 60) return `${diffMins}m ago`;
  if (diffHours < 24) return `${diffHours}h ago`;
  if (diffDays < 7) return `${diffDays}d ago`;
  return date.toLocaleDateString();
}

function NotificationCard({
  notification,
  isNew,
  onDismiss,
}: {
  notification: ReturnType<
    typeof useNotificationStore.getState
  >["notifications"][number];
  isNew: boolean;
  onDismiss: (id: string) => void;
}) {
  const Icon = getNotificationIcon(notification.type);
  const iconColor = getNotificationIconColor(notification.type);

  return (
    <Paper
      withBorder
      radius="md"
      p="md"
      pr={64}
      pos="relative"
      bg="white"
      style={
        isNew
          ? { borderColor: "var(--mantine-color-navy-7)", borderWidth: 1.5 }
          : undefined
      }
    >
      <ActionIcon
        variant="subtle"
        color="gray"
        size="sm"
        aria-label="Dismiss notification"
        onClick={() => onDismiss(notification.id)}
        pos="absolute"
        top="50%"
        right={10}
        style={{ transform: "translateY(-50%)" }}
      >
        <IconX size={14} />
      </ActionIcon>
      <Group align="flex-start" wrap="nowrap">
        <Icon size={24} color={iconColor} />
        <Stack gap={2}>
          <Text size="sm">
            {notification.link ? (
              <Link href={notification.link} style={{ textDecoration: "none" }}>
                <Text span fw={600} c="navy.7" style={{ cursor: "pointer" }}>
                  {notification.title}
                  {notification.bundleCount && notification.bundleCount > 1 && (
                    <Text span c="dimmed">
                      {" "}
                      (+{notification.bundleCount - 1} more)
                    </Text>
                  )}
                </Text>
              </Link>
            ) : (
              <Text span fw={600}>
                {notification.title}
                {notification.bundleCount && notification.bundleCount > 1 && (
                  <Text span c="dimmed">
                    {" "}
                    (+{notification.bundleCount - 1} more)
                  </Text>
                )}
              </Text>
            )}{" "}
            {notification.content}
          </Text>
          <Text size="xs" c="dimmed">
            {formatRelativeTime(notification.created_at)}
          </Text>
          {isNew && (
            <Group gap={4}>
              <IconCircleFilled size={8} color="var(--mantine-color-navy-7)" />
              <Text size="xs" c="navy.7" fw={600}>
                New
              </Text>
            </Group>
          )}
        </Stack>
      </Group>
    </Paper>
  );
}

function NotificationsHeader({ totalCount }: { totalCount: number }) {
  return (
    <Stack gap={4} align="center">
      <Text c="dimmed" size="sm" ta="center">
        You have {totalCount} notifications.
      </Text>
    </Stack>
  );
}

const LSNotificationsMobileLayout = ({
  isNotificationNew,
}: {
  isNotificationNew: (notificationCreatedAt: string) => boolean;
}) => {
  const notifications = useNotificationStore((state) => state.notifications);
  const dismissNotification = useNotificationStore(
    (state) => state.dismissNotification,
  );
  const markAsReadMutation = useMarkNotificationAsRead();
  const totalCount = notifications.length;

  const handleDismiss = (id: string) => {
    markAsReadMutation.mutate(id);
    dismissNotification(id);
  };

  return (
    <Stack p={8} gap={12}>
      <NotificationsHeader totalCount={totalCount} />
      {notifications.map((notification) => {
        const groupId =
          notification.type === "group_invite"
            ? parseGroupIdFromNotificationLink(notification.link)
            : null;
        if (groupId !== null) {
          return (
            <LSGroupInviteNotificationCard
              key={notification.id}
              notification={notification}
              groupId={groupId}
              isNew={isNotificationNew(notification.created_at)}
              onDismiss={handleDismiss}
            />
          );
        }
        return (
          <NotificationCard
            key={notification.id}
            notification={notification}
            isNew={isNotificationNew(notification.created_at)}
            onDismiss={handleDismiss}
          />
        );
      })}
    </Stack>
  );
};

const LSNotificationsDesktopLayout = ({
  isNotificationNew,
}: {
  isNotificationNew: (notificationCreatedAt: string) => boolean;
}) => {
  const notifications = useNotificationStore((state) => state.notifications);
  const dismissNotification = useNotificationStore(
    (state) => state.dismissNotification,
  );
  const markAsReadMutation = useMarkNotificationAsRead();
  const totalCount = notifications.length;

  const handleDismiss = (id: string) => {
    markAsReadMutation.mutate(id);
    dismissNotification(id);
  };

  return (
    <Box py={24} px={80}>
      <Flex p={8} direction="row" w="100%" gap={8}>
        <Box flex={5}>
          <NotificationsHeader totalCount={totalCount} />
        </Box>
      </Flex>
      <Divider my={20} color="navy.1" />
      <Stack mt={20} px="20%" gap={12}>
        {notifications.map((notification) => {
          const groupId =
            notification.type === "group_invite"
              ? parseGroupIdFromNotificationLink(notification.link)
              : null;
          if (groupId !== null) {
            return (
              <LSGroupInviteNotificationCard
                key={notification.id}
                notification={notification}
                groupId={groupId}
                isNew={isNotificationNew(notification.created_at)}
                onDismiss={handleDismiss}
              />
            );
          }
          return (
            <NotificationCard
              key={notification.id}
              notification={notification}
              isNew={isNotificationNew(notification.created_at)}
              onDismiss={handleDismiss}
            />
          );
        })}
      </Stack>
    </Box>
  );
};

export default function NotificationsPage() {
  const isMobile = useIsMobile();
  const [previousVisitAtMs, setPreviousVisitAtMs] = useState<number | null>(
    null,
  );

  useEffect(() => {
    const currentVisitStartedAtMs = Date.now();

    const committedSeenAtRaw = window.localStorage.getItem(
      LAST_VISITED_NOTIFICATIONS_KEY,
    );
    const pendingVisitStartRaw = window.localStorage.getItem(
      PENDING_VISIT_START_KEY,
    );

    const parsedCommittedSeenAtMs = committedSeenAtRaw
      ? Number.parseInt(committedSeenAtRaw, 10)
      : Number.NaN;
    const parsedPendingVisitStartMs = pendingVisitStartRaw
      ? Number.parseInt(pendingVisitStartRaw, 10)
      : Number.NaN;

    const effectivePreviousVisitAtMs = Number.isFinite(
      parsedPendingVisitStartMs,
    )
      ? parsedPendingVisitStartMs
      : Number.isFinite(parsedCommittedSeenAtMs)
        ? parsedCommittedSeenAtMs
        : null;

    setPreviousVisitAtMs(effectivePreviousVisitAtMs);

    if (Number.isFinite(parsedPendingVisitStartMs)) {
      window.localStorage.setItem(
        LAST_VISITED_NOTIFICATIONS_KEY,
        String(parsedPendingVisitStartMs),
      );
    }

    // Mark this visit as pending; it becomes "seen" on a future visit.
    window.localStorage.setItem(
      PENDING_VISIT_START_KEY,
      String(currentVisitStartedAtMs),
    );
  }, []);

  const isNotificationNew = useMemo(
    () => (notificationCreatedAt: string) => {
      const notificationCreatedAtMs = Date.parse(notificationCreatedAt);
      if (!Number.isFinite(notificationCreatedAtMs)) {
        return false;
      }

      if (previousVisitAtMs === null) {
        return true;
      }

      return notificationCreatedAtMs > previousVisitAtMs;
    },
    [previousVisitAtMs],
  );

  return isMobile ? (
    <LSNotificationsMobileLayout isNotificationNew={isNotificationNew} />
  ) : (
    <LSNotificationsDesktopLayout isNotificationNew={isNotificationNew} />
  );
}
