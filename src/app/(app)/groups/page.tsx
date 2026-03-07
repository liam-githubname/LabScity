import {
  Avatar,
  Badge,
  Box,
  Button,
  Flex,
  Group,
  NavLink,
  Paper,
  ScrollArea,
  Stack,
  Text,
  Title,
} from "@mantine/core";
import { IconHash, IconPlus } from "@tabler/icons-react";

type GroupItem = {
  id: string;
  name: string;
  handle: string;
  memberCount: number;
  unreadCount: number;
  summary: string;
  activity: string;
  tags: string[];
};

type GroupMember = {
  id: string;
  name: string;
};

// Static content for design
const groups: Array<GroupItem & { members: GroupMember[] }> = [
  {
    id: "cell-biology-circle",
    name: "Cell Biology Circle",
    handle: "cell-biology",
    memberCount: 148,
    unreadCount: 4,
    summary: "Weekly protocol swaps, microscopy tips, and shared review notes.",
    activity: "New imaging thread 12m ago",
    tags: ["Microscopy", "Protocols", "Peer Review"],
    members: [
      { id: "m1", name: "Avery Chen" },
      { id: "m2", name: "Jordan Patel" },
      { id: "m3", name: "Morgan Diaz" },
      { id: "m4", name: "Taylor Brooks" },
    ],
  },
  {
    id: "materials-lab",
    name: "Materials Lab",
    handle: "materials-lab",
    memberCount: 92,
    unreadCount: 0,
    summary:
      "A focused group for composites, test data, and fabrication feedback.",
    activity: "Pinned tensile test template updated",
    tags: ["Composites", "Testing", "Manufacturing"],
    members: [
      { id: "m5", name: "Sam Rivera" },
      { id: "m6", name: "Casey Nguyen" },
      { id: "m7", name: "Alex Monroe" },
      { id: "m8", name: "Riley Foster" },
    ],
  },
  {
    id: "ai-research-club",
    name: "AI Research Club",
    handle: "ai-research",
    memberCount: 231,
    unreadCount: 9,
    summary:
      "Paper discussions, benchmark results, and model implementation notes.",
    activity: "9 unread messages",
    tags: ["Papers", "Benchmarks", "ML Systems"],
    members: [
      { id: "m9", name: "Elliot Park" },
      { id: "m10", name: "Cameron Lee" },
      { id: "m11", name: "Quinn Howard" },
      { id: "m12", name: "Parker Reed" },
    ],
  },
  {
    id: "water-quality-team",
    name: "Water Quality Team",
    handle: "water-quality",
    memberCount: 64,
    unreadCount: 2,
    summary:
      "Field readings, lab coordination, and environmental compliance checklists.",
    activity: "Sampling schedule posted 1h ago",
    tags: ["Field Work", "Lab Ops", "Compliance"],
    members: [
      { id: "m13", name: "Jamie Torres" },
      { id: "m14", name: "Dakota Kim" },
      { id: "m15", name: "Rowan Bell" },
      { id: "m16", name: "Skyler James" },
    ],
  },
];

// If group has one member make it show member lol 
function formatMembers(count: number) {
  return `${count} member${count === 1 ? "" : "s"}`;
}

export default async function GroupsPage({
  searchParams,
}: {
  searchParams?: Promise<{ group?: string }>;
}) {
  const params = (await searchParams) ?? {};
  const selectedGroup =
    groups.find((group) => group.id === params.group) ?? groups[0];
  const visibleMembers = selectedGroup.members.slice(0, 3);

  return (
    <Flex
      h="calc(100vh - 60px)"
      direction={{ base: "column", md: "row" }}
      bg="gray.0"
    >
      <Paper
        w={{ base: "100%", md: 320 }}
        miw={{ md: 320 }}
        radius={0}
        bg="gray.1"
        style={{ borderRight: "1px solid var(--mantine-color-gray-3)" }}
      >
        <Stack gap={0} h="100%">
          <Box
            p="md"
            style={{
              borderBottom: "1px solid var(--mantine-color-gray-3)",
            }}
          >
            <Group justify="space-between" align="flex-start">
              <Box>
                <Title order={4}>Groups</Title>
                <Text size="sm" c="dimmed">
                  Switch between your active groups.
                </Text>
              </Box>
              <Button
                variant="light"
                size="compact-sm"
                leftSection={<IconPlus size={14} />}
              >
                New
              </Button>
            </Group>
          </Box>

          <ScrollArea h={{ base: 240, md: "calc(100vh - 60px - 89px)" }}>
            <Stack gap={0}>
              {groups.map((group) => {
                const href = `/groups?group=${group.id}`;
                const active = group.id === selectedGroup.id;

                return (
                  <NavLink
                    key={group.id}
                    href={href}
                    active={active}
                    p="md"
                    style={{
                      borderBottom: "1px solid var(--mantine-color-gray-2)",
                    }}
                    label={
                      <Group justify="space-between" gap="xs" wrap="nowrap">
                        <Text fw={600} c="navy.7" truncate>
                          {group.name}
                        </Text>
                        {group.unreadCount > 0 ? (
                          <Badge color="blue" radius="xl" size="sm">
                            {group.unreadCount}
                          </Badge>
                        ) : null}
                      </Group>
                    }
                    description={
                      <Stack gap={2}>
                        <Text size="xs" c="dimmed">
                          {group.activity}
                        </Text>
                        <Text size="xs" c="dimmed">
                          {formatMembers(group.memberCount)}
                        </Text>
                      </Stack>
                    }
                    leftSection={
                      <Avatar color="navy" radius="xl">
                        {group.name
                          .split(" ")
                          .map((part) => part[0])
                          .join("")
                          .slice(0, 2)}
                      </Avatar>
                    }
                  />
                );
              })}
            </Stack>
          </ScrollArea>
        </Stack>
      </Paper>

      <Flex flex={1} direction="column">
        <Paper
          radius={0}
          p="lg"
          bg="white"
          style={{ borderBottom: "1px solid var(--mantine-color-gray-3)" }}
        >
          <Group justify="space-between" align="flex-start" wrap="nowrap">
            <Group align="flex-start" gap="md" wrap="nowrap">
              <Avatar color="blue" radius="xl" size="lg">
                {selectedGroup.name
                  .split(" ")
                  .map((part) => part[0])
                  .join("")
                  .slice(0, 2)}
              </Avatar>
              <Box>
                <Group gap="xs">
                  <Title order={3}>{selectedGroup.name}</Title>
                </Group>
                <Text size="sm" c="dimmed">
                  #{selectedGroup.handle}
                </Text>
                <Text mt="sm" maw={720}>
                  {selectedGroup.summary}
                </Text>
              </Box>
            </Group>
            <Paper withBorder radius="md" p="md" miw={280} maw={340}>
              <Text c="navy.7" fw={600} size="lg" mb="sm" ta="center">
                Members
              </Text>
              <Stack gap="sm">
                {visibleMembers.map((member) => (
                  <Group key={member.id} wrap="nowrap">
                    <Avatar color="navy" radius="xl">
                      {member.name
                        .split(" ")
                        .map((part) => part[0])
                        .join("")
                        .slice(0, 2)}
                    </Avatar>
                    <Box style={{ minWidth: 0 }}>
                      <Text c="navy.7" fw={500} truncate>
                        {member.name}
                      </Text>
                    </Box>
                  </Group>
                ))}
                <Button
                  variant="subtle"
                  color="navy"
                  size="xs"
                  justify="center"
                  disabled
                >
                  {`View all ${selectedGroup.memberCount} members`}
                </Button>
              </Stack>
            </Paper>
          </Group>
        </Paper>

        <ScrollArea flex={1}>
          <Stack p="lg" gap="lg">
            <Paper withBorder radius="lg" p="lg">
              <Text size="sm" fw={700} tt="uppercase" c="dimmed">
                Current Activity
              </Text>
              <Text mt="sm">
                {selectedGroup.activity}. Use the left sidebar to move between
                groups the same way you switch conversations in chat.
              </Text>
            </Paper>

            <Paper withBorder radius="lg" p="lg">
              <Text size="sm" fw={700} tt="uppercase" c="dimmed">
                Topics
              </Text>
              <Group mt="sm">
                {selectedGroup.tags.map((tag) => (
                  <Badge
                    key={tag}
                    variant="light"
                    color="navy"
                    leftSection={<IconHash size={12} />}
                  >
                    {tag}
                  </Badge>
                ))}
              </Group>
            </Paper>

            <Paper withBorder radius="lg" p="lg">
              <Text size="sm" fw={700} tt="uppercase" c="dimmed">
                Placeholder Content
              </Text>
              <Text mt="sm" c="dimmed">
                The page layout is ready for real group feeds, member lists, or
                discussion threads. When a groups data source is added, the
                sidebar list and selected panel can be wired into it directly.
              </Text>
            </Paper>
          </Stack>
        </ScrollArea>
      </Flex>
    </Flex>
  );
}
