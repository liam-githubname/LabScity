import { Avatar, Box, Group, Paper, Text, UnstyledButton } from "@mantine/core";
import { IconHeart, IconHeartFilled, IconMessageCircle, IconShare3 } from "@tabler/icons-react";
import classes from "./post-card.module.css";

interface PostCardProps {
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
}

export function PostCard({
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
}: PostCardProps) {
  const initials = userName
    .split(" ")
    .filter(Boolean)
    .map((part) => part[0])
    .slice(0, 2)
    .join("");

  return (
    <Paper className={classes.card}>
      <Box className={classes.header}>
        <Group align="flex-start" justify="space-between">
          <Group gap="sm" align="center">
            <Avatar size={44} radius="xl" color="navy.7" src={avatarUrl || undefined}>
              {initials}
            </Avatar>
            <Box>
              <Text className={classes.name}>{userName}</Text>
              <Text className={classes.field}>{field}</Text>
            </Box>
          </Group>
          <Text className={classes.time}>{timeAgo}</Text>
        </Group>
      </Box>

      <Text className={classes.content}>{content}</Text>

      {mediaUrl ? (
        <Box className={classes.media}>
          <img src={mediaUrl} alt="Post attachment" className={classes.mediaImage} />
        </Box>
      ) : mediaLabel ? (
        <Box className={classes.media}>
          <Text component="span" className={classes.mediaLabel}>
            {mediaLabel}
          </Text>
        </Box>
      ) : null}

      <Box className={classes.actions}>
        <UnstyledButton className={classes.actionButton} onClick={onLikeClick}>
          {isLiked ? (
            <IconHeartFilled size={18} className={classes.likedIcon} />
          ) : (
            <IconHeart size={18} className={classes.actionIcon} />
          )}
          <Text component="span">Like</Text>
        </UnstyledButton>
        <UnstyledButton className={classes.actionButton} onClick={onCommentClick}>
          <IconMessageCircle size={18} className={classes.actionIcon} />
          <Text component="span">Comment</Text>
        </UnstyledButton>
        <UnstyledButton className={classes.actionButton}>
          <IconShare3 size={18} className={classes.actionIcon} />
          <Text component="span">Share</Text>
        </UnstyledButton>
      </Box>
    </Paper>
  );
}
