import { ActionIcon, Avatar, Box, Card, Flex, Group, Menu, Paper, SimpleGrid, Stack, Text, UnstyledButton } from "@mantine/core";
import Link from "next/link";
import {
  IconDots,
  IconHeart,
  IconHeartFilled,
  IconMessageCircle,
  IconShare3,
} from "@tabler/icons-react";
import linkClasses from "./user-name-link.module.css";

interface PostCardProps {
  userId?: string;
  userName: string;
  field: string;
  timeAgo: string;
  content: string;
  mediaLabel?: string | null;
  mediaUrl?: string | null;
  avatarUrl?: string | null;
  onCommentClick?: () => void;
  onLikeClick?: () => void;
  isLiked?: boolean;
  onReportClick?: () => void;
  showMenu?: boolean;
  showActions?: boolean;
  audienceLabel?: string | null;
  menuId?: string;
  children?: React.ReactNode;
}

export function PostCard({
  userId,
  userName,
  field,
  timeAgo,
  content,
  mediaLabel,
  mediaUrl,
  avatarUrl,
  onCommentClick,
  onLikeClick,
  isLiked = false,
  onReportClick,
  showMenu = true,
  showActions = true,
  audienceLabel = null,
  menuId,
  children,
}: PostCardProps) {
  const initials = userName
    .split(" ")
    .filter(Boolean)
    .map((part) => part[0])
    .slice(0, 2)
    .join("");

  const userContent = (
    <Group gap="sm" align="center">

      <Avatar size="md" radius="xl" color="navy.7" src={avatarUrl || undefined}>
        {initials}
      </Avatar>

      {/* info about the poster */}
      <Stack gap={-1}>
        {/* name of the poster, audience label ( ??? )*/}
        {userId ? (
          <Link href={`/profile/${userId}`} className={linkClasses.nameLink} style={{ color: "inherit" }}>
            <Text component="span" fw={700} c="navy.7" lh={1.1} style={{ cursor: "pointer" }}>
              {userName}
              {audienceLabel ? (
                <Text component="span" ml="xs" size="xs" fw={600} c="navy.7">
                  {audienceLabel}
                </Text>
              ) : null}
            </Text>
          </Link>
        ) : (
          <Text fw={600} c="navy.7" lh={1.1}>
            {userName}
            {audienceLabel ? (
              <Text component="span" ml="xs" size="xs" fw={600} c="navy.7">
                {audienceLabel}
              </Text>
            ) : null}
          </Text>
        )}
        <Text c="navy.7" size="sm" mt={-4}>{field}</Text>
      </Stack>
    </Group>
  );

  return (
    // post card
    <Card
      bg="gray.0"
      padding="md"
      radius="md"
      shadow="sm"
      style={{ overflow: "hidden" }}
    >
      {/* container for post data */}
      <Stack gap={16}>
        {/* post header (profile, etc.) */}
        <Box>
          <Group align="flex-start" justify="space-between">
            {userContent}
            <Group gap="xs" align="center">
              <Text size="xs" c="navy.5" style={{ whiteSpace: "nowrap" }}>{timeAgo}</Text>
              {showMenu ? (
                <Menu
                  withinPortal
                  position="bottom-end"
                  styles={{
                    dropdown: { padding: "6px" },
                    item: { borderRadius: "var(--mantine-radius-md)", fontWeight: 600, color: "var(--mantine-color-navy-7)" },
                  }}
                  id={menuId}
                >
                  <Menu.Target>
                    <ActionIcon variant="subtle" color="navy.6" aria-label="Post options">
                      <IconDots size={18} />
                    </ActionIcon>
                  </Menu.Target>
                  <Menu.Dropdown>
                    <Menu.Item onClick={onReportClick}>Report</Menu.Item>
                  </Menu.Dropdown>
                </Menu>
              ) : null}
            </Group>
          </Group>
        </Box>

        {/* post content*/}
        <Text fz="sm" c="navy.7">{content}</Text>

        {/* post media */}
        {mediaUrl ? (
          <Flex
            bg="navy.7"
            c="navy.0"
            mih={180}
            justify="center"
            align="center"
            fw={600}
            style={{ letterSpacing: "0.3px", overflow: "hidden" }}
          >
            <img src={mediaUrl} alt="Post attachment" style={{ width: "100%", height: "100%", objectFit: "cover", display: "block" }} />
          </Flex>
        ) : mediaLabel ? (
          <Flex
            bg="navy.7"
            c="navy.0"
            mih={180}
            justify="center"
            align="center"
            ta="center"
            fw={600}
            style={{ letterSpacing: "0.3px", overflow: "hidden" }}
          >
            <Text component="span" style={{ whiteSpace: "pre-line" }}>
              {mediaLabel}
            </Text>
          </Flex>
        ) : null}

        {/* post actions ( like, comment, etc. ) */}
        {showActions ? (
          <SimpleGrid cols={3} spacing="sm" bg="gray.0">
            <UnstyledButton
              c="navy.7"
              fw={600}
              style={{ display: "inline-flex", alignItems: "center", justifyContent: "center", gap: 8, padding: "6px 10px", borderRadius: 999 }}
              onClick={onLikeClick}
            >
              {isLiked ? (
                <IconHeartFilled size={18} style={{ color: "#e03131" }} />
              ) : (
                <IconHeart size={18} style={{ color: "var(--mantine-color-navy-6)" }} />
              )}
              <Text span fw="bold" fz="sm" c={isLiked ? "#e03131" : "navy.6"}>
                {isLiked ? "Liked" : "Like"}
              </Text>
            </UnstyledButton>
            <UnstyledButton
              c="navy.7"
              fw={600}
              style={{ display: "inline-flex", alignItems: "center", justifyContent: "center", gap: 8, padding: "6px 10px", borderRadius: 999 }}
              onClick={onCommentClick}
            >
              <IconMessageCircle size={18} style={{ color: "var(--mantine-color-navy-6)" }} />
              <Text span fw="bold" fz="sm" c="navy.6">Comment</Text>
            </UnstyledButton>
            <UnstyledButton
              c="navy.7"
              fw={600}
              style={{ display: "inline-flex", alignItems: "center", justifyContent: "center", gap: 8, padding: "6px 10px", borderRadius: 999 }}
            >
              <IconShare3 size={18} style={{ color: "var(--mantine-color-navy-6)" }} />
              <Text span fw="bold" fz="sm" c="navy.6">Share</Text>
            </UnstyledButton>
          </SimpleGrid>
        ) : null}

        {children}

      </Stack>
    </Card >
  );
}
