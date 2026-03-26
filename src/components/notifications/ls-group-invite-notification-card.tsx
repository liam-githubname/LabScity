"use client";

import { ActionIcon, Button, Group, Paper, Stack, Text } from "@mantine/core";
import { notifications } from "@mantine/notifications";
import { IconCircleFilled, IconUsers, IconX } from "@tabler/icons-react";
import Link from "next/link";
import { groupsPath } from "@/lib/utils/groups-url";
import type { Notification } from "@/store/notificationStore";
import { useRespondToGroupInvite } from "./use-notifications";

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

const iconColor = "var(--mantine-color-navy-7)";

export function LSGroupInviteNotificationCard({
  notification,
  groupId,
  isNew,
  onDismiss,
}: {
  notification: Notification;
  groupId: number;
  isNew: boolean;
  onDismiss: (id: string) => void;
}) {
  const respondMutation = useRespondToGroupInvite();
  const groupHref = groupsPath({ tab: "mine", groupId });
  const busy =
    respondMutation.isPending && respondMutation.variables?.groupId === groupId;

  const runRespond = (response: "accepted" | "declined") => {
    respondMutation.mutate(
      { groupId, response },
      {
        onSuccess: () => {
          notifications.show({
            title: response === "accepted" ? "Joined group" : "Invite declined",
            message:
              response === "accepted"
                ? "You're now a member of this group."
                : "You can accept a new invite if you're invited again.",
            color: "green",
          });
          onDismiss(notification.id);
        },
        onError: (err) => {
          notifications.show({
            title: "Something went wrong",
            message: err instanceof Error ? err.message : "Try again later",
            color: "red",
          });
        },
      },
    );
  };

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
        <IconUsers size={24} color={iconColor} />
        <Stack gap="sm" style={{ flex: 1, minWidth: 0 }}>
          <Text size="sm">
            <Text span fw={600} c="navy.7">
              {notification.title}
            </Text>{" "}
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
          <Group gap="xs" wrap="wrap">
            <Button
              component={Link}
              href={groupHref}
              variant="light"
              size="xs"
              color="navy"
            >
              View group
            </Button>
            <Button
              variant="filled"
              size="xs"
              color="navy"
              loading={
                busy && respondMutation.variables?.response === "accepted"
              }
              disabled={busy}
              onClick={() => runRespond("accepted")}
            >
              Accept
            </Button>
            <Button
              variant="default"
              size="xs"
              loading={
                busy && respondMutation.variables?.response === "declined"
              }
              disabled={busy}
              onClick={() => runRespond("declined")}
            >
              Decline
            </Button>
          </Group>
        </Stack>
      </Group>
    </Paper>
  );
}
