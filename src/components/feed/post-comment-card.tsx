import { ActionIcon, Avatar, Box, Group, Menu, Text, UnstyledButton } from "@mantine/core";
import Link from "next/link";
import { IconDots, IconHeart, IconHeartFilled } from "@tabler/icons-react";
import type { FeedCommentItem } from "@/lib/types/feed";
import linkClasses from "./user-name-link.module.css";

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

  const nameNode = comment.userId ? (
    <Link href={`/profile/${comment.userId}`} className={linkClasses.nameLink} style={{ color: "inherit" }}>
      <Text component="span" fw="bold" c="navy.7" size="sm" style={{ cursor: "pointer" }}>
        {comment.userName}
      </Text>
    </Link>
  ) : (
    <Text component="span" fw="bold" c="navy.7" size="sm">{comment.userName}</Text>
  );

  return (
    <Group align="flex-start" gap="sm" w="100%" wrap="nowrap">
      {/* avatar */}
      <Avatar size={36} radius="xl" color="navy.7" src={comment.avatarUrl || undefined} style={{ flexShrink: 0 }}>
        {initials}
      </Avatar>

      {/* right column */}
      <Box style={{ flex: 1, minWidth: 0 }}>
        {/* username inline with content */}
        <Text size="sm" c="navy.7" fw="normal">
          {nameNode}{" "}{comment.content}
        </Text>

        {/* timestamp + menu */}
        <Group justify="flex-start" gap="xs" mt={4}>
          <Text size="xs" c="navy.5" style={{ whiteSpace: "nowrap" }}>{comment.timeAgo}</Text>
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
                <ActionIcon variant="subtle" color="navy.6" aria-label="Comment options">
                  <IconDots size={16} />
                </ActionIcon>
              </Menu.Target>
              <Menu.Dropdown>
                <Menu.Item onClick={() => onReportClick?.(comment.id)}>Report</Menu.Item>
              </Menu.Dropdown>
            </Menu>
          ) : null}
        </Group>
      </Box>

      {/* like button */}
      {showActions ? (
        <UnstyledButton
          style={{ display: "inline-flex", alignItems: "center", justifyContent: "center", padding: "4px", borderRadius: 999, flexShrink: 0 }}
          onClick={() => onLikeClick?.(comment.id)}
        >
          {comment.isLiked ? (
            <IconHeartFilled size={18} style={{ color: "#e03131" }} />
          ) : (
            <IconHeart size={18} style={{ color: "var(--mantine-color-navy-6)" }} />
          )}
        </UnstyledButton>
      ) : null}
    </Group>
  );
}
