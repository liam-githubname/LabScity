import type {
  createComment,
  createPost,
  createPostImageUploadUrl,
  createReport,
  likeComment,
  likePost,
} from "@/lib/actions/feed";
import type {
  addMemberByEmail,
  createGroup,
  createGroupAvatarUploadUrl,
  deleteGroup,
  inviteUsersToGroup,
  joinGroup,
  leaveGroup,
  removeMember,
  updateGroup,
} from "@/lib/actions/groups";

export type CreateGroupAction = typeof createGroup;
export type JoinGroupAction = typeof joinGroup;
export type LeaveGroupAction = typeof leaveGroup;
export type AddMemberByEmailAction = typeof addMemberByEmail;
export type InviteUsersToGroupAction = typeof inviteUsersToGroup;
export type DeleteGroupAction = typeof deleteGroup;
export type RemoveMemberAction = typeof removeMember;
export type UpdateGroupAction = typeof updateGroup;
export type CreateGroupAvatarUploadUrlAction =
  typeof createGroupAvatarUploadUrl;
export type CreatePostAction = typeof createPost;
export type CreatePostImageUploadUrlAction = typeof createPostImageUploadUrl;
export type CreateCommentAction = typeof createComment;
export type CreateReportAction = typeof createReport;
export type LikePostAction = typeof likePost;
export type LikeCommentAction = typeof likeComment;

export interface LSGroupLayoutProps {
  activeGroupId?: number;
  createGroupAvatarUploadUrlAction: CreateGroupAvatarUploadUrlAction;
  createGroupAction: CreateGroupAction;
  joinGroupAction: JoinGroupAction;
  leaveGroupAction: LeaveGroupAction;
  addMemberByEmailAction: AddMemberByEmailAction;
  inviteUsersToGroupAction: InviteUsersToGroupAction;
  deleteGroupAction: DeleteGroupAction;
  removeMemberAction: RemoveMemberAction;
  updateGroupAction: UpdateGroupAction;
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
