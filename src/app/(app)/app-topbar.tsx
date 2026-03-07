"use client";

import {
  ActionIcon,
  Avatar,
  Box,
  Button,
  Divider,
  Flex,
  Group,
  Image,
  Menu,
  Modal,
  Paper,
  Stack,
  Switch,
  Text,
  TextInput,
  UnstyledButton,
} from "@mantine/core";
import { useDebouncedValue } from "@mantine/hooks";
import {
  IconBell,
  IconBellFilled,
  IconLogout,
  IconSearch,
  IconSettings,
  IconSettingsFilled,
  IconX,
} from "@tabler/icons-react";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { useEffect, useRef, useState } from "react";
import { useSetNotificationPreference } from "@/components/notifications/use-notifications";
import { useNotificationStore } from "@/store/notificationStore";
import { createClient } from "@/supabase/client";
import { searchUserContent } from "@/lib/actions/data";
import type { searchResult } from "@/lib/types/data";
import { useIsMobile } from "../use-is-mobile";
import { LSSpinner } from "@/components/ui/ls-spinner";

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

  // Search state
  const [searchOpen, setSearchOpen] = useState(false);
  const [query, setQuery] = useState("");
  const [debounced] = useDebouncedValue(query, 300);
  const [results, setResults] = useState<searchResult[]>([]);
  const [searching, setSearching] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);

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

  useEffect(() => {
    if (!debounced.trim()) {
      setResults([]);
      return;
    }
    setSearching(true);
    searchUserContent({ query: debounced }).then((res) => {
      setResults(res.success ? (res.data ?? []) : []);
      setSearching(false);
    });
  }, [debounced]);

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

  const closeSearch = () => {
    setSearchOpen(false);
    setQuery("");
    setResults([]);
  };

  const groupedUsers = results.filter((r) => r.content_type === "user");
  const groupedPosts = results.filter((r) => r.content_type === "post");
  const groupedGroups = results.filter((r) => r.content_type === "group");

  const showDropdown = searchOpen && query.trim().length > 0;

  useEffect(() => {
    document.body.style.overflow = showDropdown && isMobile ? "hidden" : "";
    return () => { document.body.style.overflow = ""; };
  }, [showDropdown]);

  /* to fix layout stuff */

  const topBarSize = 60 // honestly im not sure what to name this but whatever
  const desktopSearchDropdownSize = 512

  /*---------------------*/

  return (
    <Flex
      pos="sticky"
      bg="gray.0"
      top={0}
      left={isMobile ? 0 : topBarSize}
      h={topBarSize}
      w={"100%"}
      justify="center"
      align="center"
      style={{ borderBottom: "1px solid var(--mantine-color-gray-3)", zIndex: 200 /* keeps topbar above profile hero banner when scrolling */ }}
    >
      {searchOpen ? (
        /* Search mode: full-width input */
        <Flex h={topBarSize} w="100%" align="center" gap="xs" px="md">
          {/* NOTE: there used to be a search icon here but i nuked it cuz it looks bad */}

          {/* search input field */}
          <TextInput
            ref={inputRef}
            flex={1}
            variant="unstyled"
            placeholder="Search..."
            value={query}
            onChange={(e) => setQuery(e.currentTarget.value)}
            styles={{
              input: { color: "var(--mantine-color-navy-7)" }
            }}
          />

          {/* search close*/}
          <ActionIcon variant="transparent" c="gray.5" onClick={closeSearch}>
            <IconX size={24} />
          </ActionIcon>

        </Flex>
      ) : (
        /* Normal mode: logo + right controls */
        <>
          {/* anchored to left of topbar */}
          <Flex direction="row" pos="absolute" left={8} align="center">
            {/* search icon */}
            <Button
              leftSection={<IconSearch />}
              size="compact-sm"
              variant="transparent"
              c="gray.5"
              onClick={() => {
                setSearchOpen(true);
                setTimeout(() => inputRef.current?.focus(), 0);
              }}
            >
            </Button>
          </Flex>

          {/* logo */}
          <Image src="/logo-lightgray.png" w="auto" h="64%" />

          {/* anchored to right of topbar */}
          <Flex direction="row" pos="absolute" right={0} align="center">
            {/* notifications link */}
            <Button
              href={"/notifications"}
              component={Link}
              variant="transparent"
              size="compact-sm"
              styles={{
                root: { overflow: "visible" },
                inner: { overflow: "visible" },
                section: { overflow: "visible" },
              }}
              // fill icons if they are active; also shade them darker
              leftSection={
                <Box
                  pos="relative"
                  w={28}
                  h={24}
                  style={{ display: "inline-flex", alignItems: "center" }}
                >
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
                      bottom={0}
                      right={0}
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
        </>
      )
      }

      {/* Search results dropdown */}
      {
        showDropdown && (
          <Paper
            pos="absolute"
            top={topBarSize}
            shadow="xl"
            w={isMobile ? "100%" : desktopSearchDropdownSize}
            mah="60vh"
            p="sm"
            style={{ zIndex: 99, overflowY: "auto" }}
          >
            {searching && (
              <Flex justify="center" py="sm">
                <LSSpinner />
              </Flex>
            )}

            {!searching && results.length === 0 && (
              <Text size="sm" c="dimmed" ta="center" py="sm">
                No results
              </Text>
            )}

            {!searching && groupedUsers.length > 0 && (
              <>
                <Text size="xs" fw={700} c="gray.5" tt="uppercase" mb={4}>
                  Users
                </Text>
                {groupedUsers.map((r) => (
                  <UnstyledButton
                    key={r.id}
                    w="100%"
                    px="xs"
                    py={6}
                    style={{ borderRadius: 4 }}
                    onClick={() => {
                      router.push(`/profile/${r.id}`);
                      closeSearch();
                    }}
                  >
                    <Group gap="sm">
                      <Avatar size="sm" radius="xl">
                        {r.names?.[0]}
                      </Avatar>
                      <Text size="sm" fw={500} c="navy.7">
                        {r.names}
                      </Text>
                    </Group>
                  </UnstyledButton>
                ))}
              </>
            )}

            {!searching && groupedPosts.length > 0 && (
              <>
                {groupedUsers.length > 0 && <Divider my="xs" />}
                <Text size="xs" fw={700} c="gray.5" tt="uppercase" mb={4}>
                  Posts
                </Text>
                {groupedPosts.map((r) => (
                  <Box
                    key={r.id}
                    px="xs"
                    py={6}
                    style={{ opacity: 0.5, cursor: "default" }}
                  >
                    <Text size="sm" c="navy.7" lineClamp={2}>
                      {r.content}
                    </Text>
                  </Box>
                ))}
              </>
            )}

            {!searching && groupedGroups.length > 0 && (
              <>
                {(groupedUsers.length > 0 || groupedPosts.length > 0) && (
                  <Divider my="xs" />
                )}
                <Text size="xs" fw={700} c="gray.5" tt="uppercase" mb={4}>
                  Groups
                </Text>
                {groupedGroups.map((r) => (
                  <Box
                    key={r.id}
                    px="xs"
                    py={6}
                    style={{ opacity: 0.5, cursor: "default" }}
                  >
                    <Text size="sm" c="navy.7">
                      {r.names}
                    </Text>
                  </Box>
                ))}
              </>
            )}
          </Paper>
        )
      }

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
    </Flex >
  );
};

export default LSAppTopBar;
