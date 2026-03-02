import { ActionIcon, Avatar, Box, Group, Menu, Card, Text, UnstyledButton } from "@mantine/core";
import Link from "next/link";
import { IconDots, IconHeart, IconHeartFilled } from "@tabler/icons-react";
import type { FeedCommentItem } from "@/lib/types/feed";

interface PostCommentCardProps {
  comment: FeedCommentItem;
  onLikeClick?: (commentId: string) => void;
  onReportClick?: (commentId: string) => void;
  showMenu?: boolean;
  showActions?: boolean;
  menuId?: string;
}

export function PostCommentCard({
  comment,
  onLikeClick,
  onReportClick,
  showMenu = true,
  showActions = true,
  menuId,
}: PostCommentCardProps) {
  const initials = comment.userName
    .split(" ")
    .filter(Boolean)
    .map((part) => part[0])
    .slice(0, 2)
    .join("");

  return (
    <Card radius="xl" bg="gray.0" shadow="sm" py="sm" px="md" w="100%">
      <Group justify="space-between" gap="sm">
        <Group gap="sm">
          <Avatar size={36} radius="xl" color="navy.7">
            {initials}
          </Avatar>
          <Box>
            {comment.userId ? (
              <Link href={`/profile/${comment.userId}`} style={{ textDecoration: "none", color: "inherit" }}>
                <Text component="span" fw={700} c="navy.7" lh={1.1} style={{ cursor: "pointer" }}>
                  {comment.userName}
                </Text>
              </Link>
            ) : (
              <Text fw={700} c="navy.7" lh={1.1}>{comment.userName}</Text>
            )}
          </Box>
        </Group>
        <Group gap="xs" align="center">
          <Text size="xs" fw={600} c="navy.7" style={{ whiteSpace: "nowrap" }}>{comment.timeAgo}</Text>
          {showMenu ? (
            <Menu
              withinPortal
              position="bottom-end"
              styles={{
                dropdown: { padding: "6px" },
                item: { borderRadius: "var(--mantine-radius-md)", fontWeight: 600 },
              }}
              id={menuId}
            >
              <Menu.Target>
                <ActionIcon variant="subtle" color="navy.7" aria-label="Comment options">
                  <IconDots size={18} />
                </ActionIcon>
              </Menu.Target>
              <Menu.Dropdown>
                <Menu.Item onClick={() => onReportClick?.(comment.id)}>Report</Menu.Item>
              </Menu.Dropdown>
            </Menu>
          ) : null}
        </Group>
      </Group>

      <Text mt="xs" c="navy.7" fw={600} size="sm">{comment.content}</Text>

      {showActions ? (
        <Group justify="center" gap="xs" mt="xs">
          <UnstyledButton
            c="navy.7"
            fw={600}
            fz="xs"
            style={{ display: "inline-flex", alignItems: "center", justifyContent: "center", gap: 6, padding: "4px 8px", borderRadius: 999 }}
            onClick={() => onLikeClick?.(comment.id)}
          >
            {comment.isLiked ? (
              <IconHeartFilled size={16} style={{ color: "#e03131" }} />
            ) : (
              <IconHeart size={16} style={{ color: "var(--mantine-color-navy-7)" }} />
            )}
            <Text component="span">Like</Text>
          </UnstyledButton>
        </Group>
      ) : null}
    </Card>
  );
}
