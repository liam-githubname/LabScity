import { Avatar, Box, Paper, Text, UnstyledButton } from "@mantine/core";
import { IconHeart, IconHeartFilled } from "@tabler/icons-react";
import type { FeedCommentItem } from "@/lib/types/feed";
import classes from "./post-comment-card.module.css";

interface PostCommentCardProps {
	comment: FeedCommentItem;
	onLikeClick?: (commentId: string) => void;
}

export function PostCommentCard({ comment, onLikeClick }: PostCommentCardProps) {
	const initials = comment.userName
		.split(" ")
		.filter(Boolean)
		.map((part) => part[0])
		.slice(0, 2)
		.join("");

	return (
		<Paper className={classes.card}>
			<Box className={classes.header}>
				<Box className={classes.headerMeta}>
					<Avatar size={36} radius="xl" color="navy.7">
						{initials}
					</Avatar>
					<Box>
						<Text className={classes.name}>{comment.userName}</Text>
					</Box>
				</Box>
				<Text className={classes.time}>{comment.timeAgo}</Text>
			</Box>

			<Text className={classes.content}>{comment.content}</Text>

			<Box className={classes.actions}>
				<UnstyledButton
					className={classes.actionButton}
					onClick={() => onLikeClick?.(comment.id)}
				>
					{comment.isLiked ? (
						<IconHeartFilled size={16} className={classes.likedIcon} />
					) : (
						<IconHeart size={16} className={classes.actionIcon} />
					)}
					<Text component="span">Like</Text>
				</UnstyledButton>
				{/* <UnstyledButton className={classes.actionButton}>
					<IconMessageCircle size={16} className={classes.actionIcon} />
					<Text component="span">Comment</Text>
				</UnstyledButton> */}
				{/* <UnstyledButton className={classes.actionButton}>
					<IconShare3 size={16} className={classes.actionIcon} />
					<Text component="span">Share</Text>
				</UnstyledButton> */}
			</Box>
		</Paper>
	);
}
