"use client";

import {
  Avatar,
  Badge,
  Box,
  Button,
  Card,
  Center,
  Group,
  Stack,
  Text,
  UnstyledButton,
} from "@mantine/core";
import Link from "next/link";
import { useAuth } from "@/components/auth/use-auth";
import { useProfileGroups } from "@/components/profile/use-profile";
import { LSSpinner } from "@/components/ui/ls-spinner";
import { groupsPath } from "@/lib/utils/groups-url";

function groupInitials(name: string) {
  return (name || "?")
    .split(" ")
    .filter(Boolean)
    .map((part) => part[0])
    .join("")
    .slice(0, 2)
    .toUpperCase();
}

const MAX_INLINE_GROUPS = 6;

/**
 * Profile sidebar widget: groups this user belongs to (public-only for visitors).
 * Hidden when the viewer is not signed in.
 */
export function LSProfileGroupsWidget({
  userId,
  isOwnProfile,
}: {
  userId: string;
  isOwnProfile: boolean;
}) {
  const { user } = useAuth();
  const { data, isPending, isError, error, isFetching } =
    useProfileGroups(userId);

  if (!user?.id) {
    return null;
  }

  if (isPending && isFetching) {
    return (
      <Card shadow="sm" padding="lg" radius="md">
        <Center py="md">
          <LSSpinner />
        </Center>
      </Card>
    );
  }

  if (isError) {
    return (
      <Card shadow="sm" padding="lg" radius="md">
        <Text size="sm" c="red">
          {error instanceof Error ? error.message : "Could not load groups"}
        </Text>
      </Card>
    );
  }

  const groups = data ?? [];
  const visibleGroups = groups.slice(0, MAX_INLINE_GROUPS);

  return (
    <Card shadow="sm" padding="lg" radius="md">
      <Center mb={8}>
        <Text c="navy.7" fw={600} size="xl">
          Groups
        </Text>
      </Center>
      <Stack gap={12}>
        {groups.length > 0 ? (
          <Stack gap={12}>
            {visibleGroups.map((g) => (
              <UnstyledButton
                key={g.group_id}
                component={Link}
                href={groupsPath({ tab: "mine", groupId: g.group_id })}
                w="100%"
              >
                <Box
                  p="sm"
                  bg="white"
                  style={{
                    borderRadius: "var(--mantine-radius-md)",
                    border: "1px solid var(--mantine-color-navy-1)",
                    boxShadow: "var(--mantine-shadow-xs)",
                  }}
                >
                  <Group
                    justify="flex-start"
                    wrap="nowrap"
                    gap="sm"
                    align="flex-start"
                  >
                    <Avatar
                      size={40}
                      radius="md"
                      color="navy.7"
                      bg={g.avatar_url ? undefined : "navy.7"}
                      src={g.avatar_url ?? undefined}
                    >
                      {groupInitials(g.name)}
                    </Avatar>
                    <Box style={{ flex: 1, minWidth: 0 }}>
                      <Group justify="space-between" wrap="nowrap" gap="xs">
                        <Text fw={600} c="navy.7" size="sm" lineClamp={2}>
                          {g.name}
                        </Text>
                        {isOwnProfile && g.privacy === "private" ? (
                          <Badge size="xs" variant="light" color="gray">
                            Private
                          </Badge>
                        ) : null}
                      </Group>
                      <Text size="xs" c="dimmed" mt={4}>
                        {g.memberCount} member{g.memberCount === 1 ? "" : "s"}
                      </Text>
                    </Box>
                  </Group>
                </Box>
              </UnstyledButton>
            ))}
          </Stack>
        ) : (
          <Center>
            <Text size="sm" c="navy.6">
              Nothing to see here!
            </Text>
          </Center>
        )}
        <Stack gap={4} align="center">
          {isOwnProfile && groups.length > 0 ? (
            <Button
              component={Link}
              href={groupsPath({ tab: "mine" })}
              variant="subtle"
              color="navy"
              size="xs"
            >
              {groups.length > MAX_INLINE_GROUPS
                ? `See all ${groups.length} in Groups`
                : "See all in Groups"}
            </Button>
          ) : null}
          <Button
            component={Link}
            href={groupsPath({ tab: "discover" })}
            variant="subtle"
            color="navy"
            size="xs"
          >
            Browse groups
          </Button>
        </Stack>
      </Stack>
    </Card>
  );
}
