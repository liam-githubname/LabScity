"use client";

import { ActionIcon, Anchor, Avatar, Box, Group, Menu, Text, UnstyledButton } from "@mantine/core";
import Link from "next/link";
import { IconDots, IconHeart, IconHeartFilled } from "@tabler/icons-react";
import type { FeedCommentItem } from "@/lib/types/feed";

/**
 * Props for LSPostCommentCard.
 *
 * @param comment - FeedCommentItem (userName, userId, content, timeAgo, avatarUrl, isLiked, id).
 * @param onLikeClick - Called with comment id when like is clicked.
 * @param onReportClick - Called with comment id when Report is chosen from menu.
 * @param showMenu - Whether to show the options menu (Report).
 * @param showActions - Whether to show the like button.
 * @param menuId - Optional id for the menu (accessibility).
 */
interface LSPostCommentCardProps {
  comment: FeedCommentItem;
  onLikeClick?: (commentId: string) => void;
  onReportClick?: (commentId: string) => void;
  showMenu?: boolean;
  showActions?: boolean;
  menuId?: string;
}

/**
 * Compact comment row: avatar, author name (link to profile when userId set), content,
 * time, optional like button, and optional menu (Report). Used below posts in feed and post detail.
 */
export function LSPostCommentCard({
  comment,
  onLikeClick,
  onReportClick,
  showMenu = true,
  showActions = true,
  menuId,
}: LSPostCommentCardProps) {
  const initials = comment.userName
    .split(" ")
    .filter(Boolean)
    .map((part) => part[0])
    .slice(0, 2)
    .join("");

  const nameNode = comment.userId ? (
    <Anchor component={Link} href={`/profile/${comment.userId}`} underline="hover" c="navy.7">
      <Text component="span" fw="bold" c="navy.7" size="sm" style={{ cursor: "pointer" }}>
        {comment.userName}
      </Text>
    </Anchor>
  ) : (
    <Text component="span" fw="bold" c="navy.7" size="sm">{comment.userName}</Text>
  );

  return (
    <Group align="flex-start" gap="sm" w="100%" wrap="nowrap">
      <Avatar size={36} radius="xl" color="navy.7" src={comment.avatarUrl || undefined} style={{ flexShrink: 0 }}>
        {initials}
      </Avatar>

      <Box style={{ flex: 1, minWidth: 0 }}>
        <Text size="sm" c="navy.7" fw="normal">
          {nameNode}{" "}{comment.content}
        </Text>

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
