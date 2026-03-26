"use client";

import {
  Center,
  Paper,
  SimpleGrid,
  Stack,
  TagsInput,
  Text,
  TextInput,
  Title,
} from "@mantine/core";
import { useDebouncedValue } from "@mantine/hooks";
import { notifications } from "@mantine/notifications";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useRouter } from "next/navigation";
import { useMemo, useState } from "react";
import { LSSpinner } from "@/components/ui/ls-spinner";
import type {
  getGroups,
  joinGroup,
  searchPublicGroups,
} from "@/lib/actions/groups";
import { groupKeys } from "@/lib/query-keys";
import { groupsPath } from "@/lib/utils/groups-url";
import { LSGroupCard } from "./ls-group-card";

export interface LSDiscoverGroupsPanelProps {
  searchPublicGroupsAction: typeof searchPublicGroups;
  joinGroupAction: typeof joinGroup;
  getGroupsAction: typeof getGroups;
}

/**
 * Discover tab: debounced search + topic filters over public groups.
 *
 * **Parity with the top bar:** Same interaction pattern (debounced input → server action), not the
 * same search backend. Discover uses `searchPublicGroups` (public groups, `ilike` + topic contains);
 * global search uses `searchUserContent` (users, posts, groups). A single SQL path (e.g. `search_groups`)
 * would be a separate product/DB decision.
 */
export function LSDiscoverGroupsPanel({
  searchPublicGroupsAction,
  joinGroupAction,
  getGroupsAction,
}: LSDiscoverGroupsPanelProps) {
  const router = useRouter();
  const queryClient = useQueryClient();

  const [searchInput, setSearchInput] = useState("");
  const [debouncedSearch] = useDebouncedValue(searchInput, 300);

  const [topicInput, setTopicInput] = useState<string[]>([]);
  const [debouncedTopics] = useDebouncedValue(topicInput, 300);

  const topicKey = useMemo(
    () => [...debouncedTopics].sort().join("|"),
    [debouncedTopics],
  );

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

  const myGroupIds = useMemo(
    () => new Set(myGroups.map((g) => g.group_id)),
    [myGroups],
  );

  const discoverQuery = useQuery({
    queryKey: groupKeys.discover(debouncedSearch.trim(), topicKey, 24),
    queryFn: async () => {
      const r = await searchPublicGroupsAction({
        query: debouncedSearch,
        topicTags: debouncedTopics,
        limit: 24,
      });
      if (!r.success) {
        throw new Error(r.error ?? "Search failed");
      }
      return r.data ?? [];
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
        message: "You can open it from My groups.",
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

  return (
    <Stack gap="lg" w="100%" px={{ base: "md" }}>
      <Paper radius="md" p="md" withBorder bg="white">
        <Stack gap="md">
          <div>
            <Title order={5} c="navy.7">
              Find a group
            </Title>
            <Text size="xs" c="dimmed">
              Search by name, description, or narrow with topic tags.
            </Text>
          </div>
          <TextInput
            label="Search"
            placeholder="Group name or description"
            value={searchInput}
            onChange={(e) => setSearchInput(e.currentTarget.value)}
          />
          <TagsInput
            label="Filter by topics"
            placeholder="Type a topic and press Enter"
            description="Groups must include all listed topics"
            value={topicInput}
            onChange={setTopicInput}
            maxTags={5}
          />
        </Stack>
      </Paper>

      {discoverQuery.isLoading ? (
        <Center py="xl">
          <LSSpinner />
        </Center>
      ) : discoverQuery.isError ? (
        <Text c="red" size="sm">
          {discoverQuery.error instanceof Error
            ? discoverQuery.error.message
            : "Something went wrong"}
        </Text>
      ) : discoverQuery.data?.length === 0 ? (
        <Text c="dimmed" size="sm">
          No public groups match your filters. Try different keywords or topics.
        </Text>
      ) : (
        <SimpleGrid cols={{ base: 1, sm: 2, lg: 3 }} spacing="md">
          {discoverQuery.data?.map((g) => (
            <LSGroupCard
              key={g.group_id}
              group={g}
              isMember={myGroupIds.has(g.group_id)}
              isJoining={
                joinMutation.isPending && joinMutation.variables === g.group_id
              }
              onJoin={(id) => joinMutation.mutate(id)}
              onView={(id) =>
                router.push(groupsPath({ tab: "mine", groupId: id }))
              }
            />
          ))}
        </SimpleGrid>
      )}
    </Stack>
  );
}
