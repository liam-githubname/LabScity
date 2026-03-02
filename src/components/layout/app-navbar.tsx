"use client";

import {
  ActionIcon,
  Box,
  Button,
  Divider,
  Flex,
  Group,
  Menu,
  Stack,
  Text,
} from "@mantine/core";
import {
  IconBell,
  IconFlaskFilled,
  IconHeartFilled,
  IconMessageCircleFilled,
  IconMessageFilled,
  IconUser,
  IconUserFilled,
  IconX,
} from "@tabler/icons-react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { useIsMobile } from "@/app/use-is-mobile";
import { useMarkNotificationAsRead } from "@/components/notifications/use-notifications";
import { useNotificationStore } from "@/store/notificationStore";

const navigation = [
  { href: "/home", icon: IconFlaskFilled, label: "Home" },
  { href: "/profile", icon: IconUser, label: "Profile" },
  { href: "/chat", icon: IconMessageFilled, label: "Chat" },
  { href: "/notifications", icon: IconBell, label: "Notifications" },
];

function getNotificationIcon(type: string) {
  switch (type) {
    case "post_like":
      return IconHeartFilled;
    case "new_comment":
      return IconMessageCircleFilled;
    case "new_follow":
      return IconUserFilled;
    case "group_invite":
      return IconUserFilled;
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

function NotificationsDropdown({
  active,
  isMobile,
}: {
  active: boolean;
  isMobile: boolean;
}) {
  const { notifications, dismissNotification } = useNotificationStore();
  const markAsReadMutation = useMarkNotificationAsRead();
  const visibleNotifications = notifications.slice(0, 5);

  const handleDismiss = (id: string) => {
    markAsReadMutation.mutate(id);
    dismissNotification(id);
  };

  return (
    <Menu
      shadow="md"
      width={360}
      position="bottom"
      offset={8}
      zIndex={999999999}
    >
      {/* notifications navbar entry */}
      <Menu.Target>
        <Button
          leftSection={<IconBell />}
          c={active ? "gray.0" : "navy.5"}
          variant="transparent"
        >
          {!isMobile && "Notifications"}
        </Button>
      </Menu.Target>

      {/* actual dropdown stuff */}
      <Menu.Dropdown>
        <Stack gap={8} p={8}>
          <Text fw={700} size="sm" ta="center">
            Recent notifications
          </Text>
          {visibleNotifications.length === 0 ? (
            <Text size="sm" c="dimmed" ta="center">
              No notifications.
            </Text>
          ) : (
            visibleNotifications.map((notification) => (
              <Group
                key={notification.id}
                justify="space-between"
                align="flex-start"
                wrap="nowrap"
              >
                <Group align="flex-start" wrap="nowrap" gap={8}>
                  {(() => {
                    const NotificationIcon = getNotificationIcon(
                      notification.type,
                    );
                    return (
                      <NotificationIcon
                        size={18}
                        color={getNotificationIconColor(notification.type)}
                      />
                    );
                  })()}
                  <Box>
                    {notification.link ? (
                      <Link
                        href={notification.link}
                        style={{ textDecoration: "none" }}
                      >
                        <Text size="sm" fw={600} style={{ cursor: "pointer" }}>
                          {notification.title}
                          {notification.bundleCount &&
                            notification.bundleCount > 1 && (
                              <Text span c="dimmed">
                                {" "}
                                (+{notification.bundleCount - 1} more)
                              </Text>
                            )}
                        </Text>
                      </Link>
                    ) : (
                      <Text size="sm" fw={600}>
                        {notification.title}
                        {notification.bundleCount &&
                          notification.bundleCount > 1 && (
                            <Text span c="dimmed">
                              {" "}
                              (+{notification.bundleCount - 1} more)
                            </Text>
                          )}
                      </Text>
                    )}
                    <Text size="sm">{notification.content}</Text>
                    <Text size="xs" c="dimmed">
                      {formatRelativeTime(notification.created_at)}
                    </Text>
                  </Box>
                </Group>
                <ActionIcon
                  variant="subtle"
                  color="gray"
                  size="sm"
                  aria-label="Dismiss notification"
                  onClick={() => handleDismiss(notification.id)}
                >
                  <IconX size={14} />
                </ActionIcon>
              </Group>
            ))
          )}
        </Stack>
        <Divider my={4} />
        <Box p={8}>
          <Button
            component={Link}
            href="/notifications"
            fullWidth
            variant="filled"
            bg="navy.7"
            c="white"
          >
            View all
          </Button>
        </Box>
      </Menu.Dropdown>
    </Menu>
  );
}

export function AppNavbar({ userId }: { userId: string }) {
  const isMobile = useIsMobile();
  const pathname = usePathname();

  function getHref(item: (typeof navigation)[number]): string {
    if (item.href === "/profile") {
      return `/profile/${userId}`;
    }
    return item.href;
  }

  function isActive(item: (typeof navigation)[number]) {
    if (item.href === "/profile") {
      return pathname.startsWith("/profile");
    }
    return pathname === item.href;
  }

  return (
    <Flex
      bg="navy.7"
      pos="fixed"
      w={isMobile ? "100%" : 164}
      h={isMobile ? 60 : "100%"}
      direction={isMobile ? "row" : "column"}
      justify="center"
      align={isMobile ? "center" : "flex-start"}
      p={8}
      gap={16}
      {...(isMobile && { bottom: 0 })}
      style={{ zIndex: 99999999 }}
    >
      {navigation.map((item) => {
        const active = isActive(item);
        const href = getHref(item);

        // Desktop notifications open a dropdown, mobile goes to /notifications
        if (!isMobile && item.href === "/notifications") {
          return (
            <NotificationsDropdown
              key={item.href}
              active={active}
              isMobile={isMobile}
            />
          );
        }

        return (
          <Button
            key={item.href}
            href={href}
            component={Link}
            leftSection={<item.icon size={28} />}
            c={active ? "gray.0" : "navy.5"}
            variant="transparent"
          >
            {!isMobile && item.label}
          </Button>
        );
      })}
    </Flex>
  );
}
