import type {
	createGroup,
	joinGroup,
	leaveGroup,
} from "@/lib/actions/groups";
import type {
	createComment,
	createPost,
	createPostImageUploadUrl,
	createReport,
	likeComment,
	likePost,
} from "@/lib/actions/feed";

export type CreateGroupAction = typeof createGroup;
export type JoinGroupAction = typeof joinGroup;
export type LeaveGroupAction = typeof leaveGroup;
export type CreatePostAction = typeof createPost;
export type CreatePostImageUploadUrlAction = typeof createPostImageUploadUrl;
export type CreateCommentAction = typeof createComment;
export type CreateReportAction = typeof createReport;
export type LikePostAction = typeof likePost;
export type LikeCommentAction = typeof likeComment;

export interface LSGroupLayoutProps {
	activeGroupId?: number;
	createGroupAction: CreateGroupAction;
	joinGroupAction: JoinGroupAction;
	leaveGroupAction: LeaveGroupAction;
	createPostAction: CreatePostAction;
	createPostImageUploadUrlAction: CreatePostImageUploadUrlAction;
	createCommentAction: CreateCommentAction;
	createReportAction: CreateReportAction;
	likePostAction: LikePostAction;
	likeCommentAction: LikeCommentAction;
}

export interface LSGroupFeedProps {
	groupId: number;
	createPostAction: CreatePostAction;
	createPostImageUploadUrlAction: CreatePostImageUploadUrlAction;
	createCommentAction: CreateCommentAction;
	createReportAction: CreateReportAction;
	likePostAction: LikePostAction;
	likeCommentAction: LikeCommentAction;
}
