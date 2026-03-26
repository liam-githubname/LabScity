"use client";

import {
  Avatar,
  Badge,
  Box,
  Button,
  Card,
  Group,
  Stack,
  Text,
  Title,
} from "@mantine/core";
import { useElementSize } from "@mantine/hooks";
import { notifications } from "@mantine/notifications";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { LSSpinner } from "@/components/ui/ls-spinner";
import type {
  getGroups,
  joinGroup,
  searchPublicGroups,
} from "@/lib/actions/groups";
import { groupKeys } from "@/lib/query-keys";
import { groupsPath } from "@/lib/utils/groups-url";

/** Max groups in this strip; API returns the top N by `last_activity_at` (see `searchPublicGroups`). */
const POPULAR_LIMIT = 6;
/** Inner width (px) at which two columns fit in the sidebar without horizontal overflow. */
const TWO_COLUMN_MIN_WIDTH_PX = 340;

function stripInitials(name: string) {
  return (name || "?")
    .split(" ")
    .filter(Boolean)
    .map((part) => part[0])
    .join("")
    .slice(0, 2)
    .toUpperCase();
}

export interface LSPopularGroupsHomeStripProps {
  searchPublicGroupsAction: typeof searchPublicGroups;
  joinGroupAction: typeof joinGroup;
  getGroupsAction: typeof getGroups;
}

/**
 * Home sidebar: public groups ordered by `groups.last_activity_at` desc (see
 * `searchPublicGroups` with empty query/filters)—i.e. recently active public
 * groups, not a separate popularity score.
 */
export function LSPopularGroupsHomeStrip({
  searchPublicGroupsAction,
  joinGroupAction,
  getGroupsAction,
}: LSPopularGroupsHomeStripProps) {
  const router = useRouter();
  const queryClient = useQueryClient();
  const { ref: gridMeasureRef, width: gridInnerWidth } = useElementSize();
  const useTwoColumns =
    gridInnerWidth > 0 && gridInnerWidth >= TWO_COLUMN_MIN_WIDTH_PX;

  const { data: myGroups = [] } = useQuery({
    queryKey: groupKeys.list(),
    queryFn: async () => {
      const r = await getGroupsAction();
      if (!r.success || !r.data) {
        throw new Error(r.error ?? "Failed to load your groups");
      }
      return r.data;
    },
  });

  const myGroupIds = new Set(myGroups.map((g) => g.group_id));

  const popularQuery = useQuery({
    queryKey: groupKeys.popular(POPULAR_LIMIT),
    queryFn: async () => {
      const r = await searchPublicGroupsAction({
        query: "",
        topicTags: [],
        limit: POPULAR_LIMIT,
      });
      if (!r.success) {
        throw new Error(r.error ?? "Failed to load groups");
      }
      const rows = r.data ?? [];
      return rows.slice(0, POPULAR_LIMIT);
    },
  });

  const joinMutation = useMutation({
    mutationFn: async (groupId: number) => {
      const r = await joinGroupAction(groupId);
      if (!r.success) {
        throw new Error(r.error ?? "Could not join");
      }
      return groupId;
    },
    onSuccess: (groupId) => {
      queryClient.invalidateQueries({ queryKey: groupKeys.list() });
      queryClient.invalidateQueries({ queryKey: groupKeys.all });
      notifications.show({
        title: "Joined group",
        message: "Open it from Groups anytime.",
        color: "green",
      });
      router.push(groupsPath({ tab: "mine", groupId }));
    },
    onError: (err: Error) => {
      notifications.show({
        title: "Could not join",
        message: err.message,
        color: "red",
      });
    },
  });

  if (popularQuery.isLoading) {
    return (
      <Card
        withBorder
        shadow="sm"
        radius="md"
        p="md"
        bg="white"
        w="100%"
        maw="100%"
        styles={{ root: { minWidth: 0, maxWidth: "100%" } }}
      >
        <Group justify="center" py="sm">
          <LSSpinner />
        </Group>
      </Card>
    );
  }

  if (popularQuery.isError || !popularQuery.data?.length) {
    return null;
  }

  return (
    <Card
      withBorder
      shadow="sm"
      radius="md"
      p="lg"
      w="100%"
      maw="100%"
      styles={{
        root: {
          minWidth: 0,
          maxWidth: "100%",
          background:
            "linear-gradient(180deg, var(--mantine-color-gray-0) 0%, white 100%)",
        },
      }}
    >
      <Group
        justify="space-between"
        align="flex-start"
        wrap="wrap"
        gap="sm"
        mb="md"
        w="100%"
        maw="100%"
      >
        <Box style={{ flex: 1, minWidth: 0 }}>
          <Title order={5} c="navy.7">
            Popular groups
          </Title>
          <Text size="xs" c="dimmed">
            Recently active public groups you can join
          </Text>
        </Box>
        <Button
          component={Link}
          href="/groups?tab=discover"
          variant="light"
          color="navy"
          size="xs"
          radius="xl"
        >
          Discover more
        </Button>
      </Group>
      <Box ref={gridMeasureRef} w="100%" maw="100%" miw={0}>
        <Box
          style={{
            display: "grid",
            gap: "var(--mantine-spacing-sm)",
            gridTemplateColumns: useTwoColumns
              ? "repeat(2, minmax(0, 1fr))"
              : "minmax(0, 1fr)",
            width: "100%",
            maxWidth: "100%",
            minWidth: 0,
          }}
        >
          {popularQuery.data.map((g) => {
            const member = myGroupIds.has(g.group_id);
            return (
              <Box
                key={g.group_id}
                p="sm"
                maw="100%"
                style={{
                  minWidth: 0,
                  borderRadius: "var(--mantine-radius-md)",
                  border: "1px solid var(--mantine-color-gray-2)",
                  backgroundColor: "white",
                }}
              >
                <Stack gap={6}>
                  <Group
                    gap="xs"
                    align="center"
                    wrap="nowrap"
                    w="100%"
                    maw="100%"
                    miw={0}
                  >
                    <Avatar
                      size={36}
                      radius="md"
                      color="navy.7"
                      bg={g.avatar_url ? undefined : "navy.7"}
                      src={g.avatar_url ?? undefined}
                    >
                      {stripInitials(g.name)}
                    </Avatar>
                    <Text
                      fw={600}
                      c="navy.7"
                      size="sm"
                      lineClamp={2}
                      style={{ flex: 1, minWidth: 0 }}
                    >
                      {g.name}
                    </Text>
                  </Group>
                  {g.topics.length > 0 ? (
                    <Group gap={4} wrap="wrap" w="100%" maw="100%">
                      {g.topics.slice(0, 2).map((t) => (
                        <Badge
                          key={t}
                          size="xs"
                          variant="light"
                          color="navy"
                          maw="calc(100% - 4px)"
                          styles={{
                            root: { maxWidth: "100%" },
                            label: {
                              overflow: "hidden",
                              textOverflow: "ellipsis",
                              whiteSpace: "nowrap",
                              display: "block",
                              maxWidth: "100%",
                            },
                          }}
                        >
                          {t}
                        </Badge>
                      ))}
                    </Group>
                  ) : null}
                  {member ? (
                    <Button
                      size="xs"
                      variant="light"
                      color="navy"
                      fullWidth
                      component={Link}
                      href={groupsPath({ tab: "mine", groupId: g.group_id })}
                    >
                      View
                    </Button>
                  ) : (
                    <Button
                      size="xs"
                      color="navy"
                      fullWidth
                      loading={
                        joinMutation.isPending &&
                        joinMutation.variables === g.group_id
                      }
                      onClick={() => joinMutation.mutate(g.group_id)}
                    >
                      Join
                    </Button>
                  )}
                </Stack>
              </Box>
            );
          })}
        </Box>
      </Box>
    </Card>
  );
}
