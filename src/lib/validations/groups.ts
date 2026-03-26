import { z } from "zod";

const topicTagSchema = z
  .string()
  .trim()
  .min(1, { message: "Each topic must be non-empty" })
  .max(80, { message: "Each topic must be 80 characters or less" });

export const createGroupSchema = z.object({
  name: z
    .string()
    .min(1, { message: "Group name is required" })
    .max(100, { message: "Group name must be less than 100 characters" }),
  description: z
    .string()
    .max(500, { message: "Description must be less than 500 characters" })
    .optional()
    .default(""),
  topics: z
    .array(topicTagSchema)
    .min(1, { message: "Select at least one scientific topic" })
    .max(5, { message: "At most 5 topics" }),
  privacy: z.enum(["public", "private"]).default("public"),
});

/** Reusable schema for actions that take a group_id (join, leave, details). */
export const groupIdSchema = z.number().int().positive("Invalid group ID");

export const addMemberSchema = z.object({
  groupId: z.number().int().positive("Invalid group ID"),
  email: z.email("Valid email required"),
});

export const removeMemberSchema = z.object({
  groupId: z.number().int().positive("Invalid group ID"),
  targetUserId: z.uuid("Invalid user ID"),
});

export const inviteMembersSchema = z.object({
  groupId: z.number().int().positive("Invalid group ID"),
  userIds: z
    .array(z.uuid("Invalid user ID"))
    .min(1, "Select at least one person"),
});

export const respondToInviteSchema = z.object({
  groupId: z.number().int().positive("Invalid group ID"),
  response: z.enum(["accepted", "declined"]),
});

export const updateGroupSchema = z
  .object({
    groupId: z.number().int().positive("Invalid group ID"),
    name: z
      .string()
      .min(1, { message: "Group name is required" })
      .max(100, { message: "Group name must be less than 100 characters" })
      .optional(),
    description: z
      .string()
      .max(500, { message: "Description must be less than 500 characters" })
      .optional(),
    topics: z
      .array(topicTagSchema)
      .min(1, { message: "Select at least one scientific topic" })
      .max(5, { message: "At most 5 topics" })
      .optional(),
    privacy: z.enum(["public", "private"]).optional(),
    /** Storage path under `profile_pictures` (see `createGroupAvatarUploadUrl`). */
    avatarStoragePath: z
      .string()
      .min(1)
      .max(512, { message: "Avatar path is too long" })
      .optional(),
  })
  .refine(
    (data) =>
      data.name !== undefined ||
      data.description !== undefined ||
      data.topics !== undefined ||
      data.privacy !== undefined ||
      data.avatarStoragePath !== undefined,
    { message: "Provide at least one field to update", path: ["groupId"] },
  );

/** Admin edit modal: all fields; combined with `groupId` for `updateGroup`. */
export const editGroupFormSchema = z.object({
  name: z
    .string()
    .min(1, { message: "Group name is required" })
    .max(100, { message: "Group name must be less than 100 characters" }),
  description: z
    .string()
    .max(500, { message: "Description must be less than 500 characters" }),
  topics: z
    .array(topicTagSchema)
    .min(1, { message: "Select at least one scientific topic" })
    .max(5, { message: "At most 5 topics" }),
  privacy: z.enum(["public", "private"]),
});

export type CreateGroupValues = z.infer<typeof createGroupSchema>;
export type AddMemberValues = z.infer<typeof addMemberSchema>;
export type RemoveMemberValues = z.infer<typeof removeMemberSchema>;
export type InviteMembersValues = z.infer<typeof inviteMembersSchema>;
export type RespondToInviteValues = z.infer<typeof respondToInviteSchema>;
export type UpdateGroupValues = z.infer<typeof updateGroupSchema>;
export type EditGroupFormValues = z.infer<typeof editGroupFormSchema>;

/** Public group discovery (authenticated browse / search). */
export const discoverGroupsSchema = z.object({
  query: z.string().max(200).optional().default(""),
  topicTags: z
    .array(topicTagSchema)
    .max(5, { message: "At most 5 topic filters" })
    .optional()
    .default([]),
  limit: z.number().int().min(1).max(50).optional().default(24),
});

export type DiscoverGroupsValues = z.infer<typeof discoverGroupsSchema>;
