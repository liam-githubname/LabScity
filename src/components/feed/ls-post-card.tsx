"use client";

import { ActionIcon, Anchor, Avatar, Box, Button, Card, Flex, Group, Image, Menu, SimpleGrid, Stack, Text, UnstyledButton } from "@mantine/core";
import Link from "next/link";
import {
  IconDots,
  IconHeart,
  IconHeartFilled,
  IconMessageCircle,
  IconShare3,
} from "@tabler/icons-react";

/**
 * Props for LSPostCard.
 *
 * @param userId - When set, author name links to /profile/[userId].
 * @param userName - Display name (used for avatar initials when avatarUrl missing).
 * @param field - Scientific field or category label.
 * @param timeAgo - Relative time string (e.g. "5m ago").
 * @param content - Post body text.
 * @param mediaLabel - Optional label for attached media.
 * @param mediaUrl - Optional image URL; when set with onPostClick, content/media are clickable to navigate to post detail.
 * @param avatarUrl - Author avatar URL; falls back to initials.
 * @param onCommentClick - Toggles comment composer when provided.
 * @param onLikeClick - Like/unlike handler.
 * @param isLiked - Current like state for heart icon.
 * @param onReportClick - Opens report overlay when provided.
 * @param showMenu - Whether to show the options menu (e.g. Report).
 * @param showActions - Whether to show like/comment buttons.
 * @param audienceLabel - Optional label next to name (e.g. audience).
 * @param menuId - Optional id for the menu (accessibility).
 * @param onPostClick - When provided, clicking post content/media navigates to post detail (e.g. router.push).
 * @param children - Optional slot for comment composer and comment list below the card.
 */
interface LSPostCardProps {
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
  likeCount?: number;
  commentCount?: number;
  onReportClick?: () => void;
  showMenu?: boolean;
  showActions?: boolean;
  audienceLabel?: string | null;
  menuId?: string;
  onPostClick?: () => void;
  children?: React.ReactNode;
}

/**
 * Card component for a single post: author avatar/name, field, time, content, optional media,
 * like/comment actions, and optional children (e.g. comment composer and comments).
 * Used on home feed and profile feed; onPostClick enables navigation to post detail page.
 */
export function LSPostCard({
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
  likeCount,
  commentCount,
  onReportClick,
  showMenu = true,
  showActions = true,
  audienceLabel = null,
  menuId,
  onPostClick,
  children,
}: LSPostCardProps) {
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

      <Stack gap={-1}>
        {userId ? (
          <Anchor component={Link} href={`/profile/${userId}`} underline="hover" c="navy.7">
            <Text component="span" fw={700} c="navy.7" lh={1.1} style={{ cursor: "pointer" }}>
              {userName}
              {audienceLabel ? (
                <Text component="span" ml="xs" size="xs" fw={600} c="navy.7">
                  {audienceLabel}
                </Text>
              ) : null}
            </Text>
          </Anchor>
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
    <Card
      bg="gray.0"
      padding="md"
      radius="md"
      shadow="sm"
      style={{ overflow: "hidden" }}
    >
      <Stack gap={16}>
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

        <Text
          fz="sm"
          c="navy.7"
          onClick={onPostClick}
          style={onPostClick ? { cursor: "pointer" } : undefined}
        >
          {content}
        </Text>

        {mediaUrl ? (
          <Flex
            c="navy.0"
            mih={180}
            justify="center"
            align="center"
            fw={600}
            onClick={onPostClick}
            style={{ letterSpacing: "0.3px", overflow: "hidden", cursor: onPostClick ? "pointer" : undefined }}
          >
            <Image src={mediaUrl} alt="Post attachment" radius="md" style={{ width: "100%", height: "100%", objectFit: "cover", display: "block" }} />
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
            onClick={onPostClick}
            style={{ letterSpacing: "0.3px", overflow: "hidden", cursor: onPostClick ? "pointer" : undefined }}
          >
            <Text component="span" style={{ whiteSpace: "pre-line" }}>
              {mediaLabel}
            </Text>
          </Flex>
        ) : null}

        {showActions ? (
          <Flex justify="space-around">

            {/* like button */}
            <Button
              size="compact-xs"
              mr={3} // HACK: small margin here to make things look a bit nicer
              variant="transparent"
              color="navy.6"
              // like icon
              leftSection={
                isLiked ? (
                  <IconHeartFilled size={18} style={{ color: "#e03131" }} />
                ) : (
                  <IconHeart size={18} />
                )
              }
              onClick={onLikeClick}
            >
              {/* like label */}
              <Text span fz="sm" c={isLiked ? "#e03131" : "navy.6"}>
                {
                  typeof likeCount == "number" ? likeCount : ""
                }
              </Text>
            </Button>

            {/* comment button */}
            <Button
              size="compact-xs"
              variant="transparent"
              color="navy.6"
              leftSection={<IconMessageCircle size={18} />}
              onClick={onCommentClick}
            >
              <Text span fz="sm" c="navy.6">
                {typeof commentCount === "number" ? commentCount : ""}
              </Text>
            </Button>

            {/* share button */}
            <Button
              size="compact-xs"
              variant="transparent"
              color="navy.6"
              leftSection={<IconShare3 size={18} />}
            />

          </Flex>
        ) : null}

        {children}

      </Stack>
    </Card >
  );
}
