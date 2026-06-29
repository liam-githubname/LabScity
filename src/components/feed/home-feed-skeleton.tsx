import { Avatar, Box, Text, Button, Card, Group, SimpleGrid, Skeleton, Stack } from "@mantine/core";
import { IconDots, IconHeart, IconMessageCircle, IconPlus, IconShare3 } from "@tabler/icons-react";
// import { LSSpinner } from "../ui/ls-spinner";

function UserContentSkeleton(){
  return (
    <Group gap="sm" align="center">
      <Avatar size="md" radius="xl" color="navy.7" src={null}></Avatar>
      <Stack gap={1}>
        <Skeleton width={150} height={16} />
        <Skeleton width={100} height={12} />
      </Stack>
    </Group>
  );
} 

function PostCardSkeleton() {
  return (
    <Card
      bg="gray.0"
      padding="md"
      radius="md"
      shadow="sm"
      style={{ overflow: "hidden" }}
      w="100%"
    >
      <Stack gap={16}>
        <Group align="flex-start" justify="space-between">
          <UserContentSkeleton />
          <Group gap="xs" align="center">
            <Skeleton w={50} h={10}/>
            <IconDots size={18} />
          </Group>
        </Group>
        <Stack gap={8}>
          <Skeleton w="100%" h='12'/>
          <Skeleton w="100%" h='12'/>
          <Skeleton w="100%" h='12'/>
        </Stack>
        <SimpleGrid cols={3} spacing="sm" bg="gray.0">
          <Group justify="center">
            <IconHeart size={18} style={{ color: "var(--mantine-color-navy-6)" }} />
            <Text span fw="bold" fz="sm" c="navy.6">
              Like
            </Text>
          </Group>
          <Group justify="center">
            <IconMessageCircle size={18} style={{ color: "var(--mantine-color-navy-6)" }} />
            <Text span fw="bold" fz="sm" c="navy.6">
              Comment
            </Text>
          </Group>
          <Group justify="center">
            <IconShare3 size={18} style={{ color: "var(--mantine-color-navy-6)" }} />
            <Text span fw="bold" fz="sm" c="navy.6">
              Share
            </Text>
          </Group>
        </SimpleGrid>
      </Stack>
    </Card>
  );
}

export default function HomeFeedSkeleton() {
  return (
    <Stack gap="lg" miw='100%'>
      <Button
        leftSection={<IconPlus size={14} />}
        radius="xl"
        variant="filled"
        size="sm"
        c="gray.0"
        fw={700}
        bg="navy.8"
      >
        New Post
      </Button>
      <Stack gap="lg" w="100%" justify="center" align="center">
        {/* <LSSpinner /> */}
        <PostCardSkeleton />
        <PostCardSkeleton />
        <PostCardSkeleton />
        <PostCardSkeleton />
        <PostCardSkeleton />
        <PostCardSkeleton />
      </Stack>
    </Stack>
  )
}