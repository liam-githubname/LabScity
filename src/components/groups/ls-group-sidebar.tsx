"use client";

import {
  Avatar,
  Box,
  Button,
  Center,
  Group,
  NavLink,
  ScrollArea,
  Stack,
  Text,
  Title,
} from "@mantine/core";
import { IconPlus } from "@tabler/icons-react";
import { LSSpinner } from "@/components/ui/ls-spinner";
import type { GroupListItem } from "@/lib/types/groups";
import { groupsPath } from "@/lib/utils/groups-url";

function formatMembers(count: number) {
  return `${count} member${count === 1 ? "" : "s"}`;
}

export interface LSGroupSidebarProps {
  groups: GroupListItem[];
  activeGroupId?: number;
  onNewGroupClick: () => void;
  isLoading: boolean;
}

/**
 * Sidebar listing the user's groups with NavLinks. Includes a "New" button
 * that triggers the create-group modal via the parent.
 */
export function LSGroupSidebar({
  groups,
  activeGroupId,
  onNewGroupClick,
  isLoading,
}: LSGroupSidebarProps) {
  return (
    <Stack gap={0} h="100%">
      <Box
        p="md"
        style={{
          borderBottom: "1px solid var(--mantine-color-navy-1)",
        }}
      >
        <Group justify="space-between" align="flex-start">
          <Box>
            <Title order={4} c="navy.7">
              Groups
            </Title>
            <Text size="sm" c="dimmed">
              Switch between your active groups.
            </Text>
          </Box>
          <Button
            variant="light"
            size="compact-sm"
            leftSection={<IconPlus size={14} />}
            onClick={onNewGroupClick}
          >
            New
          </Button>
        </Group>
      </Box>

      <ScrollArea h={{ base: 240, md: "calc(100vh - 60px - 89px)" }}>
        <Stack gap={0}>
          {isLoading ? (
            <Center h={100}>
              <LSSpinner />
            </Center>
          ) : groups.length === 0 ? (
            <Text size="sm" c="dimmed" p="md">
              You haven't joined any groups yet.
            </Text>
          ) : (
            groups.map((group) => {
              const href = groupsPath({
                tab: "mine",
                groupId: group.group_id,
              });
              const active = group.group_id === activeGroupId;

              return (
                <NavLink
                  key={group.group_id}
                  href={href}
                  active={active}
                  p="md"
                  style={{
                    borderBottom: "1px solid var(--mantine-color-navy-1)",
                  }}
                  label={
                    <Text fw={600} c="navy.7" truncate>
                      {group.name}
                    </Text>
                  }
                  description={
                    <Text size="xs" c="dimmed">
                      {formatMembers(group.memberCount)}
                    </Text>
                  }
                  leftSection={
                    <Avatar
                      color="navy.7"
                      bg={group.avatar_url ? undefined : "navy.7"}
                      radius="xl"
                      src={group.avatar_url ?? undefined}
                    >
                      {(group.name || "?")
                        .split(" ")
                        .filter(Boolean)
                        .map((part) => part[0])
                        .join("")
                        .slice(0, 2)
                        .toUpperCase()}
                    </Avatar>
                  }
                />
              );
            })
          )}
        </Stack>
      </ScrollArea>
    </Stack>
  );
}
