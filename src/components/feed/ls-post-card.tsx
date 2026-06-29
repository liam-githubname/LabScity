"use client";

import { 
  ActionIcon, 
  Anchor, 
  Avatar, 
  Box, 
  Button, 
  Card, 
  Flex, 
  Group, 
  SimpleGrid, 
  Image, 
  Menu, 
  Stack, 
  Text, 
  UnstyledButton, 
  AspectRatio,
  Modal,
  Textarea,
  Spoiler
 } from "@mantine/core";
import { useDisclosure } from "@mantine/hooks";
import Link from "next/link";
import NextImage from 'next/image';
import { notifications } from "@mantine/notifications";
import {
  IconDots,
  IconEdit,
  IconHeart,
  IconHeartFilled,
  IconLink,
  IconMessageCircle,
  IconShare3,
  IconTrash,
} from "@tabler/icons-react";
import { useEffect, useRef, useState } from "react";

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
  nameRightSection?: React.ReactNode;
  field: string;
  timeAgo: string;
  content: string;
  mediaLabel?: string | null;
  mediaUrl?: string | null;
  mediaWidth?: number | null;
  mediaHeight?: number | null;
  avatarUrl?: string | null;
  onCommentClick?: () => void;
  onLikeClick?: () => void;
  isLiked?: boolean;
  likeCount?: number;
  commentCount?: number;
  onReportClick?: () => void;
  onDeleteClick?: () => void;
  onEditSubmit?: (values: { content: string }) => Promise<void> | void;
  isEditPending?: boolean;
  showMenu?: boolean;
  showActions?: boolean;
  audienceLabel?: string | null;
  menuId?: string;
  onPostClick?: () => void;
  shareUrl?: string;
  children?: React.ReactNode;
}

// Helper to prevent clicks on things like the like button or profile name from
// bubbling up to handling onPostClick, since post card overlaps with each 
// part 
function noPropagate(fn?: () => void) {
  return (e: React.MouseEvent) => {
    e.stopPropagation();
    fn?.();
  };
}

/**
 * Card component for a single post: author avatar/name, field, time, content, optional media,
 * like/comment actions, and optional children (e.g. comment composer and comments).
 * Used on home feed and profile feed; onPostClick enables navigation to post detail page.
 */
export function LSPostCard({
  userId,
  userName,
  nameRightSection,
  field,
  timeAgo,
  content,
  mediaLabel,
  mediaUrl,
  mediaWidth,
  mediaHeight,
  avatarUrl,
  onCommentClick,
  onLikeClick,
  isLiked = false,
  likeCount,
  commentCount,
  onReportClick,
  onDeleteClick,
  onEditSubmit,
  isEditPending = false,
  showMenu = true,
  showActions = true,
  audienceLabel = null,
  menuId,
  onPostClick,
  shareUrl,
  children,
}: LSPostCardProps) {
  const [
    confirmDeleteOpen,
    { open: openConfirmDelete, close: closeConfirmDelete },
  ] = useDisclosure(false);
  const [editOpen, { open: openEdit, close: closeEdit }] = useDisclosure(false);
  const [draftContent, setDraftContent] = useState(content);

  const spoilerControlRef = useRef<HTMLButtonElement>(null);

  const initials = userName
    .split(" ")
    .filter(Boolean)
    .map((part) => part[0])
    .slice(0, 2)
    .join("");

  useEffect(() => {
    if (!editOpen) {
      setDraftContent(content);
    }
  }, [content, editOpen]);

  const handleEditSubmit = async () => {
    const nextContent = draftContent.trim();
    if (!nextContent) {
      notifications.show({
        title: "Could not update post",
        message: "Content is required",
        color: "red",
      });
      return;
    }

    try {
      await onEditSubmit?.({ content: nextContent });
      closeEdit();
    } catch {
      // Parent mutation handles the notification; keep the modal open.
    }
  };

  const postHeader = (
    <Group gap="sm" align="center">
      <Avatar
        size="md"
        radius="xl"
        color="navy.7"
        bg="navy.7"
        src={avatarUrl || undefined}
      >
        {initials}
      </Avatar>

      <Stack gap={-1}>
        <Group gap="xs" wrap="nowrap" align="center">
          {userId ? (
            <Anchor
              component={Link}
              href={`/profile/${userId}`}
              underline="hover"
              c="navy.7"
              onClick={noPropagate()}
            >
              <Text
                component="span"
                fw={700}
                c="navy.7"
                lh={1.1}
                style={{ cursor: "pointer" }}
              >
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
          {nameRightSection}
        </Group>
        <Text c="navy.7" size="sm" mt={-4}>
          {field}
        </Text>
      </Stack>
    </Group>
  );

  return (
    <>
      <Modal
        opened={confirmDeleteOpen}
        onClose={closeConfirmDelete}
        title="Delete post"
        centered
      >
        <Stack gap="md">
          <Text size="sm">
            Are you sure you want to delete this post? This action cannot be
            undone.
          </Text>
          <Group justify="flex-end">
            <Button variant="default" onClick={closeConfirmDelete}>
              Cancel
            </Button>
            <Button
              color="red"
              onClick={
                noPropagate(() => {
                  closeConfirmDelete();
                  onDeleteClick?.();
                })
              }
            >
              Delete
            </Button>
          </Group>
        </Stack>
      </Modal>
      <Modal opened={editOpen} onClose={closeEdit} title="Edit post" centered>
        <Stack gap="md">
          <Textarea
            label="Post"
            minRows={4}
            value={draftContent}
            onChange={(event) => setDraftContent(event.currentTarget.value)}
          />
          <Group justify="flex-end">
            <Button
              variant="default"
              onClick={closeEdit}
              disabled={isEditPending}
            >
              Cancel
            </Button>
            <Button
              onClick={() => void handleEditSubmit()}
              loading={isEditPending}
              disabled={
                draftContent.trim().length === 0 || draftContent === content
              }
            >
              Save
            </Button>
          </Group>
        </Stack>
      </Modal>
      <Card
        bg="gray.0"
        padding="md"
        radius="md"
        shadow="sm"
        onClick={onPostClick}
        style={{ 
          cursor: onPostClick ? 'pointer' : undefined, 
          overflow: "hidden", 
        }}
      >
        <Stack gap="lg">
          <Box>
            <Group align="flex-start" justify="space-between">
              {postHeader}
              <Group gap="xs" align="center">
                <Text size="xs" c="navy.5" style={{ whiteSpace: "nowrap" }}>
                  {timeAgo}
                </Text>
                {showMenu ? (
                  <Menu
                    withinPortal
                    position="bottom-end"
                    styles={{
                      dropdown: { padding: "6px" },
                      item: {
                        borderRadius: "var(--mantine-radius-md)",
                        fontWeight: 600,
                        color: "var(--mantine-color-navy-7)",
                      },
                    }}
                    id={menuId}
                  >
                    <Menu.Target>
                      <ActionIcon onClick={noPropagate()} variant="subtle" color="navy.6" aria-label="Post options">
                        <IconDots size={18} />
                      </ActionIcon>
                    </Menu.Target>
                    <Menu.Dropdown>
                      {onEditSubmit ? (
                        <Menu.Item
                          leftSection={<IconEdit size={14} />}
                          onClick={noPropagate(openEdit)}
                        >
                          Edit post
                        </Menu.Item>
                      ) : null}
                      {onDeleteClick ? (
                        <>
                          {onEditSubmit ? <Menu.Divider /> : null}
                          <Menu.Item
                            color="red"
                            leftSection={<IconTrash size={14} />}
                            onClick={noPropagate(openConfirmDelete)}
                          >
                            Delete post
                          </Menu.Item>
                          {onReportClick ? <Menu.Divider /> : null}
                        </>
                      ) : null}
                      {onReportClick ? (
                        <Menu.Item onClick={noPropagate(onReportClick)}>Report</Menu.Item>
                      ) : null}
                    </Menu.Dropdown>
                  </Menu>
                ) : null}
              </Group>
            </Group>
          </Box>
        
          <Box
            onClick={(e) => {
              if (spoilerControlRef.current?.contains(e.target as Node)) {
                e.stopPropagation();
              }
            }}
          >
            <Spoiler
              controlRef={spoilerControlRef}
              fz="sm"
              c="navy.7"
              maxHeight={176} // Enough for about 8 lines worth of content
              showLabel='Show more'
              hideLabel='Hide'
              style={{ wordBreak: 'break-word', whiteSpace: 'pre-wrap' }}
              styles={{
                control: {
                  color: 'var(--mantine-color-indigo-7)',
                  fontSize: 'var(--mantine-font-size-sm)',
                  fontWeight: 600
                }
              }}
            >
              {content}
            </Spoiler>
          </Box>

          {mediaUrl ? (
            <Box
              pos="relative"
              mah={600}
              maw='100%'
              fw={600}
              style={{
                aspectRatio: `${(mediaWidth ?? 1) / (mediaHeight ?? 1)}`,
                overflow: "hidden",
                letterSpacing: "0.3px",
              }}
            >
              <Image
                component={NextImage}
                src={mediaUrl}
                alt="Post attachment"
                bdrs="lg"
                bg='navy.0'
                fill
                mah={600}
                style={{ objectFit: "contain" }}
              />
            </Box>

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

          {showActions ? (
            <SimpleGrid cols={3}>

              {/* like button */}
              <Flex justify="center">
              <Button
                size="compact-md"
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
                onClick={noPropagate(onLikeClick)}
              >
                <Text span fz="sm" c={isLiked ? "#e03131" : "navy.6"}>
                  {typeof likeCount === "number" ? likeCount : ""}
                </Text>
              </Button>
              </Flex>

              {/* comment button */}
              <Flex justify="center">
              <Button
                size="compact-md"
                variant="transparent"
                color="navy.6"
                leftSection={<IconMessageCircle size={18} />}
                onClick={noPropagate(onCommentClick)}
              >
                <Text span fz="sm" c="navy.6">
                  {typeof commentCount === "number" ? commentCount : ""}
                </Text>
              </Button>
              </Flex>

              {/* share button */}
              <Flex justify="center">
              <Menu
                withinPortal
                position="top"
                styles={{
                  dropdown: { padding: "6px" },
                  item: {
                    borderRadius: "var(--mantine-radius-md)",
                    fontWeight: 600,
                    color: "var(--mantine-color-navy-7)",
                  },
                }}
              >
                <Menu.Target>
                  <Button
                    size="compact-xs"
                    variant="transparent"
                    color="navy.6"
                    leftSection={<IconShare3 size={18} />}
                    onClick={noPropagate()}
                  />
                </Menu.Target>
                <Menu.Dropdown>
                  <Menu.Item
                    leftSection={<IconLink size={14} />}
                    onClick={noPropagate(() => {
                      const url = shareUrl
                        ? window.location.origin + shareUrl
                        : window.location.href;
                      navigator.clipboard.writeText(url);
                    })}
                  >
                    Copy link
                  </Menu.Item>
                </Menu.Dropdown>
              </Menu>
              </Flex>
            </SimpleGrid>
          ) : null }
        </Stack>
          {children}
      </Card>
    </>
  );
}
