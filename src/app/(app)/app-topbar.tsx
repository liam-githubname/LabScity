"use client";

import {
  Box,
  Button,
  Flex,
  Image,
  Menu,
  Modal,
  Stack,
  Switch,
  Text,
} from "@mantine/core";
import {
  IconBell,
  IconBellFilled,
  IconLogout,
  IconSettings,
  IconSettingsFilled,
} from "@tabler/icons-react";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import { useSetNotificationPreference } from "@/components/notifications/use-notifications";
import { useNotificationStore } from "@/store/notificationStore";
import { createClient } from "@/supabase/client";
import { useIsMobile } from "../use-is-mobile";

type NotificationType =
  | "post_like"
  | "new_comment"
  | "new_message"
  | "group_invite";
type NotificationPreferenceMap = Record<NotificationType, boolean>;

const defaultNotificationPreferences: NotificationPreferenceMap = {
  post_like: true,
  new_comment: true,
  new_message: true,
  group_invite: true,
};

const notificationOptions: Array<{ key: NotificationType; label: string }> = [
  { key: "post_like", label: "Likes" },
  { key: "new_comment", label: "Comments" },
  { key: "new_message", label: "Messages" },
  { key: "group_invite", label: "Group Invites" },
];
const LAST_VISITED_NOTIFICATIONS_KEY = "labscity:last-visited-notifications-at";

const LSAppTopBar = () => {
  const router = useRouter();

  const handleSignOut = async () => {
    const supabase = createClient(); // TODO: why dont we pass down the client?

    await supabase.auth.signOut(); // call signout

    router.push("/login"); // go to login screen
  };

  const isMobile = useIsMobile();

  const pathname = usePathname();
  const inNotificationsPage = pathname.startsWith("/notifications");
  const notifications = useNotificationStore((state) => state.notifications);

  // Options menu state + local notification preference values
  const [settingsOpen, setSettingsOpen] = useState(false);
  const [optionsOpen, setOptionsOpen] = useState(false);
  const [isLoadingOptions, setIsLoadingOptions] = useState(false);
  const [savingPreference, setSavingPreference] =
    useState<NotificationType | null>(null);
  const [lastVisitedNotificationsAtMs, setLastVisitedNotificationsAtMs] =
    useState<number | null>(null);
  const [notificationPreferences, setNotificationPreferences] =
    useState<NotificationPreferenceMap>(defaultNotificationPreferences);
  const setPreferenceMutation = useSetNotificationPreference();

  useEffect(() => {
    const rawValue = window.localStorage.getItem(
      LAST_VISITED_NOTIFICATIONS_KEY,
    );
    const parsedValue = rawValue ? Number.parseInt(rawValue, 10) : Number.NaN;
    setLastVisitedNotificationsAtMs(
      Number.isFinite(parsedValue) ? parsedValue : null,
    );
  }, []);

  useEffect(() => {
    if (!inNotificationsPage) return;

    const now = Date.now();
    window.localStorage.setItem(LAST_VISITED_NOTIFICATIONS_KEY, String(now));
    setLastVisitedNotificationsAtMs(now);
  }, [inNotificationsPage]);

  const newNotificationsCount = notifications.reduce((count, notification) => {
    if (lastVisitedNotificationsAtMs === null) return count + 1;

    const createdAtMs = Date.parse(notification.created_at);
    if (!Number.isFinite(createdAtMs)) return count;

    return createdAtMs > lastVisitedNotificationsAtMs ? count + 1 : count;
  }, 0);
  const hasNewNotifications = newNotificationsCount > 0;
  const displayedNewNotificationsCount =
    newNotificationsCount > 99 ? "99+" : String(newNotificationsCount);

  // Load saved preferences when the user opens the Options modal
  useEffect(() => {
    const loadPreferences = async () => {
      if (!optionsOpen) return;

      setIsLoadingOptions(true);
      const supabase = createClient();
      const { data: authData } = await supabase.auth.getUser();

      if (!authData.user) {
        setIsLoadingOptions(false);
        return;
      }

      const { data, error } = await supabase
        .from("notification_preferences")
        .select("notification_type, is_enabled")
        .eq("user_id", authData.user.id)
        .in("notification_type", [
          "post_like",
          "new_comment",
          "new_message",
          "group_invite",
        ]);

      if (!error && data) {
        const nextPreferences = { ...defaultNotificationPreferences };
        for (const preference of data) {
          const notificationType =
            preference.notification_type as NotificationType;
          if (notificationType in nextPreferences) {
            nextPreferences[notificationType] = preference.is_enabled;
          }
        }
        setNotificationPreferences(nextPreferences);
      }

      setIsLoadingOptions(false);
    };

    void loadPreferences();
  }, [optionsOpen]);

  // Save one preference at a time
  const updateNotificationPreference = async (
    notificationType: NotificationType,
    newValue: boolean,
  ) => {
    setNotificationPreferences((current) => ({
      ...current,
      [notificationType]: newValue,
    }));
    setSavingPreference(notificationType);
    try {
      await setPreferenceMutation.mutateAsync({
        newValue,
        notificationType,
      });
    } finally {
      setSavingPreference(null);
    }
  };

  return (
    <Flex
      pos="sticky"
      bg="gray.0"
      top={0}
      left={isMobile ? 0 : 60}
      h={60}
      w={"100%"}
      justify="center"
      align="center"
      style={{
        borderBottom: "1px solid var(--mantine-color-gray-3)",
        zIndex: 100,
      }}
    >
      <Image src="/logo-lightgray.png" w="auto" h="64%" />

      <Flex direction="row" pos="absolute" right={0}>
        {/* notifications link */}
        <Button
          href={"/notifications"}
          component={Link}
          variant="transparent"
          size="compact-sm"
          // fill icons if they are active; also shade them darker

          leftSection={
            <Box pos="relative">
              {hasNewNotifications ? (
                <IconBell color="var(--mantine-color-blue-6)" />
              ) : inNotificationsPage ? (
                <IconBellFilled />
              ) : (
                <IconBell />
              )}
              {hasNewNotifications && (
                <Box
                  pos="absolute"
                  bottom={-4}
                  right={-10}
                  bg="blue.6"
                  c="white"
                  px={4}
                  h={14}
                  miw={14}
                  style={{
                    borderRadius: 999,
                    fontSize: "10px",
                    lineHeight: "14px",
                    textAlign: "center",
                    fontWeight: 700,
                  }}
                >
                  {displayedNewNotificationsCount}
                </Box>
              )}
            </Box>
          }
          c={
            hasNewNotifications
              ? "blue.6"
              : inNotificationsPage
                ? "gray.7"
                : "gray.5"
          }
        />

        {/* settings menu */}
        <Menu opened={settingsOpen} onChange={setSettingsOpen}>
          <Menu.Target>
            <Button
              variant="transparent"
              size="compact-sm"
              c={settingsOpen ? "gray.7" : "gray.5"}
              leftSection={
                settingsOpen ? <IconSettingsFilled /> : <IconSettings />
              }
            />
          </Menu.Target>
          <Menu.Dropdown>
            <Menu.Item
              c="navy.6"
              onClick={() => {
                setOptionsOpen(true);
                setSettingsOpen(false);
              }}
            >
              Options
            </Menu.Item>

            <Menu.Item
              c="red"
              leftSection={<IconLogout size={14} />}
              onClick={handleSignOut}
            >
              Sign Out
            </Menu.Item>
          </Menu.Dropdown>
        </Menu>
      </Flex>

      <Modal
        opened={optionsOpen}
        onClose={() => setOptionsOpen(false)}
        title="Notification Options"
        centered
      >
        <Stack>
          <Text size="sm" c="dimmed">
            Choose which notifications you want to receive.
          </Text>

          {/* Render one switch per notification type from a simple config list */}
          {notificationOptions.map((option) => (
            <Switch
              key={option.key}
              label={option.label}
              checked={notificationPreferences[option.key]}
              disabled={isLoadingOptions || savingPreference === option.key}
              onChange={(event) =>
                void updateNotificationPreference(
                  option.key,
                  event.currentTarget.checked,
                )
              }
            />
          ))}
        </Stack>
      </Modal>
    </Flex>
  );
};

export default LSAppTopBar;
