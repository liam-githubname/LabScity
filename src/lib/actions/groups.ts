"use server";

import { z } from "zod";
import type { DataResponse } from "@/lib/types/data";
import type {
  GetGroupsResult,
  GroupDiscoverItem,
  GroupListItem,
  GroupWithMembers,
} from "@/lib/types/groups";
import {
  type AddMemberValues,
  addMemberSchema,
  type CreateGroupValues,
  createGroupSchema,
  type DiscoverGroupsValues,
  discoverGroupsSchema,
  groupIdSchema,
  type InviteMembersValues,
  inviteMembersSchema,
  type RemoveMemberValues,
  type RespondToInviteValues,
  removeMemberSchema,
  respondToInviteSchema,
  type UpdateGroupValues,
  updateGroupSchema,
} from "@/lib/validations/groups";
import { createClient } from "@/supabase/server";

type ServerSupabase = Awaited<ReturnType<typeof createClient>>;

/** Group avatars live in `profile_pictures`; resolve paths with getPublicUrl like `getFeed` / `getUser`. */
const groupAvatarBucket = "profile_pictures";
const allowedGroupAvatarMime = [
  "image/jpeg",
  "image/png",
  "image/webp",
  "image/gif",
] as const;

function extensionFromGroupAvatarMime(mimeType: string) {
  switch (mimeType) {
    case "image/jpeg":
      return "jpg";
    case "image/png":
      return "png";
    case "image/webp":
      return "webp";
    case "image/gif":
      return "gif";
    default:
      return "bin";
  }
}

function resolveGroupAvatarUrl(
  supabase: ServerSupabase,
  stored: string | null | undefined,
): string | null {
  if (stored == null || String(stored).trim() === "") return null;
  const s = String(stored).trim();
  if (/^https?:\/\//i.test(s)) return s;
  return supabase.storage.from(groupAvatarBucket).getPublicUrl(s).data.publicUrl;
}

/** Direct insert when `join_public_group` RPC is not applicable (e.g. private group + invite). */
async function insertDirectGroupMembership(
  supabase: ServerSupabase,
  groupId: number,
  userId: string,
): Promise<DataResponse<null>> {
  const { error: memberError } = await supabase.from("group_members").insert({
    group_id: groupId,
    user_id: userId,
    role: "Member",
  });

  if (memberError) {
    return { success: false, error: memberError.message };
  }

  const { data: group } = await supabase
    .from("groups")
    .select("conversation_id")
    .eq("group_id", groupId)
    .single();

  if (group?.conversation_id) {
    await supabase.from("conversation_participants").insert({
      conversation_id: group.conversation_id,
      user_id: userId,
    });
  }

  return { success: true, data: null };
}

/**
 * Fetch all groups the authenticated user is a member of, with member counts.
 *
 * @param supabaseClient - Optional Supabase client instance (used for testing)
 * @returns Promise resolving to DataResponse with the user's group list
 */
export async function getGroups(
  supabaseClient?: ReturnType<typeof createClient> extends Promise<infer R>
    ? R
    : never,
): Promise<DataResponse<GetGroupsResult>> {
  try {
    const supabase = supabaseClient ?? (await createClient());
    const { data: authData } = await supabase.auth.getUser();

    if (!authData.user) {
      return { success: false, error: "Authentication required" };
    }

    const { data: memberships, error: membershipError } = await supabase
      .from("group_members")
      .select("group_id")
      .eq("user_id", authData.user.id);

    if (membershipError) {
      return { success: false, error: membershipError.message };
    }

    if (!memberships || memberships.length === 0) {
      return { success: true, data: [] };
    }

    const groupIds = memberships.map((m) => m.group_id);

    const { data: groups, error: groupsError } = await supabase
      .from("groups")
      .select(
        "group_id, name, description, created_at, conversation_id, topics, privacy, avatar_url",
      )
      .in("group_id", groupIds)
      .order("name");

    if (groupsError) {
      return { success: false, error: groupsError.message };
    }

    if (!groups || groups.length === 0) {
      return { success: true, data: [] };
    }

    // Fetch member counts per group in a single query
    const { data: memberCounts, error: countError } = await supabase
      .from("group_members")
      .select("group_id")
      .in("group_id", groupIds);

    if (countError) {
      return { success: false, error: countError.message };
    }

    const countMap = (memberCounts ?? []).reduce<Record<number, number>>(
      (acc, row) => {
        acc[row.group_id] = (acc[row.group_id] ?? 0) + 1;
        return acc;
      },
      {},
    );

    const result: GroupListItem[] = groups.map((g) => ({
      group_id: g.group_id,
      name: g.name,
      description: g.description ?? "",
      created_at: g.created_at,
      conversation_id: g.conversation_id,
      topics: Array.isArray(g.topics) ? (g.topics as string[]) : [],
      privacy: g.privacy === "private" ? "private" : "public",
      memberCount: countMap[g.group_id] ?? 0,
      avatar_url: resolveGroupAvatarUrl(supabase, g.avatar_url),
    }));

    return { success: true, data: result };
  } catch (error) {
    if (error instanceof z.ZodError) {
      return {
        success: false,
        error: error.issues[0]?.message ?? "Validation failed",
      };
    }
    return { success: false, error: "Failed to fetch groups" };
  }
}

const profileUserIdSchema = z.string().uuid("Invalid profile user id");

/**
 * Groups the profile subject belongs to, as visible to the **current** viewer.
 * - **Own profile:** all memberships (public and private).
 * - **Someone else:** only **public** groups (private memberships stay hidden).
 */
export async function getProfileVisibleGroups(
  profileUserId: string,
  supabaseClient?: ReturnType<typeof createClient> extends Promise<infer R>
    ? R
    : never,
): Promise<DataResponse<GetGroupsResult>> {
  try {
    profileUserIdSchema.parse(profileUserId);

    const supabase = supabaseClient ?? (await createClient());
    const { data: authData } = await supabase.auth.getUser();

    if (!authData.user) {
      return { success: false, error: "Authentication required" };
    }

    const viewerId = authData.user.id;

    const { data: memberships, error: membershipError } = await supabase
      .from("group_members")
      .select("group_id")
      .eq("user_id", profileUserId);

    if (membershipError) {
      return { success: false, error: membershipError.message };
    }

    if (!memberships || memberships.length === 0) {
      return { success: true, data: [] };
    }

    const groupIds = memberships.map((m) => m.group_id);

    const { data: groups, error: groupsError } = await supabase
      .from("groups")
      .select(
        "group_id, name, description, created_at, conversation_id, topics, privacy, avatar_url",
      )
      .in("group_id", groupIds)
      .order("name");

    if (groupsError) {
      return { success: false, error: groupsError.message };
    }

    let visible = groups ?? [];
    if (viewerId !== profileUserId) {
      visible = visible.filter((g) => g.privacy === "public");
    }

    if (visible.length === 0) {
      return { success: true, data: [] };
    }

    const visibleIds = visible.map((g) => g.group_id);

    const { data: memberCounts, error: countError } = await supabase
      .from("group_members")
      .select("group_id")
      .in("group_id", visibleIds);

    if (countError) {
      return { success: false, error: countError.message };
    }

    const countMap = (memberCounts ?? []).reduce<Record<number, number>>(
      (acc, row) => {
        acc[row.group_id] = (acc[row.group_id] ?? 0) + 1;
        return acc;
      },
      {},
    );

    const result: GroupListItem[] = visible.map((g) => ({
      group_id: g.group_id,
      name: g.name,
      description: g.description ?? "",
      created_at: g.created_at,
      conversation_id: g.conversation_id,
      topics: Array.isArray(g.topics) ? (g.topics as string[]) : [],
      privacy: g.privacy === "private" ? "private" : "public",
      memberCount: countMap[g.group_id] ?? 0,
      avatar_url: resolveGroupAvatarUrl(supabase, g.avatar_url),
    }));

    return { success: true, data: result };
  } catch (error) {
    if (error instanceof z.ZodError) {
      return {
        success: false,
        error: error.issues[0]?.message ?? "Validation failed",
      };
    }
    return { success: false, error: "Failed to fetch profile groups" };
  }
}

/**
 * Fetch a single group with its full member list and count.
 *
 * @param groupId - The ID of the group to fetch
 * @param supabaseClient - Optional Supabase client instance (used for testing)
 * @returns Promise resolving to DataResponse with the group and its members
 */
export async function getGroupDetails(
  groupId: number,
  supabaseClient?: ReturnType<typeof createClient> extends Promise<infer R>
    ? R
    : never,
): Promise<DataResponse<GroupWithMembers>> {
  try {
    groupIdSchema.parse(groupId);

    const supabase = supabaseClient ?? (await createClient());
    const { data: authData } = await supabase.auth.getUser();

    if (!authData.user) {
      return { success: false, error: "Authentication required" };
    }

    const { data: group, error: groupError } = await supabase
      .from("groups")
      .select(
        "group_id, name, description, created_at, conversation_id, topics, privacy, avatar_url",
      )
      .eq("group_id", groupId)
      .single();

    if (groupError || !group) {
      return {
        success: false,
        error: groupError?.message ?? "Group not found",
      };
    }

    const { data: members, error: membersError } = await supabase
      .from("group_members")
      .select(
        `
				group_id,
				user_id,
				role,
				created_at,
				users:user_id(first_name, last_name, profile_pic_path)
			`,
      )
      .eq("group_id", groupId)
      .order("created_at");

    if (membersError) {
      return { success: false, error: membersError.message };
    }

    // Supabase join returns users as object (FK) or array depending on client version
    type RawUser = {
      first_name: string | null;
      last_name: string | null;
      profile_pic_path: string | null;
    };
    type RawMember = {
      group_id: number;
      user_id: string;
      role: string | null;
      created_at: string;
      users: RawUser | RawUser[] | null;
    };
    const toUser = (u: RawUser | RawUser[] | null): RawUser | null =>
      Array.isArray(u) ? (u[0] ?? null) : u;
    const formattedMembers = (members ?? []).map((m: RawMember) => {
      const u = toUser(m.users);
      const picPath = u?.profile_pic_path ?? null;
      return {
        group_id: m.group_id,
        user_id: m.user_id,
        role: m.role ?? "Member",
        created_at: m.created_at,
        first_name: u?.first_name ?? null,
        last_name: u?.last_name ?? null,
        profile_pic_path: picPath,
        avatar_url: picPath
          ? supabase.storage.from("profile_pictures").getPublicUrl(picPath).data
              .publicUrl
          : null,
      };
    });

    const result: GroupWithMembers = {
      group_id: group.group_id,
      name: group.name,
      description: group.description ?? "",
      created_at: group.created_at,
      conversation_id: group.conversation_id,
      topics: Array.isArray(group.topics) ? (group.topics as string[]) : [],
      privacy: group.privacy === "private" ? "private" : "public",
      avatar_url: resolveGroupAvatarUrl(supabase, group.avatar_url),
      members: formattedMembers,
      memberCount: formattedMembers.length,
    };

    return { success: true, data: result };
  } catch (error) {
    if (error instanceof z.ZodError) {
      return {
        success: false,
        error: error.issues[0]?.message ?? "Validation failed",
      };
    }
    return { success: false, error: "Failed to fetch group details" };
  }
}

/**
 * Browse/search **public** groups (discovery tab).
 *
 * Results are ordered by `last_activity_at` descending (see query below)—used
 * as-is for the home “Popular groups” strip when query/filters are empty.
 *
 * **RLS:** If this always returns empty, add a `SELECT` policy on `public.groups`
 * allowing authenticated users to read rows where `privacy = 'public'` (in
 * addition to any member-only policy).
 */
export async function searchPublicGroups(
  input: DiscoverGroupsValues,
  supabaseClient?: ReturnType<typeof createClient> extends Promise<infer R>
    ? R
    : never,
): Promise<DataResponse<GroupDiscoverItem[]>> {
  try {
    const parsed = discoverGroupsSchema.parse(input);

    const supabase = supabaseClient ?? (await createClient());
    const { data: authData } = await supabase.auth.getUser();

    if (!authData.user) {
      return { success: false, error: "Authentication required" };
    }

    let q = supabase
      .from("groups")
      .select("group_id, name, description, topics, privacy, avatar_url")
      .eq("privacy", "public");

    const term = parsed.query.trim();
    if (term.length > 0) {
      const escaped = term
        .replace(/\\/g, "\\\\")
        .replace(/%/g, "\\%")
        .replace(/_/g, "\\_");
      const pattern = `%${escaped}%`;
      q = q.or(`name.ilike.${pattern},description.ilike.${pattern}`);
    }

    if (parsed.topicTags.length > 0) {
      q = q.contains("topics", parsed.topicTags);
    }

    const { data: rows, error } = await q
      .order("last_activity_at", { ascending: false })
      .limit(parsed.limit);

    if (error) {
      return { success: false, error: error.message };
    }

    const result: GroupDiscoverItem[] = (rows ?? []).map((g) => ({
      group_id: g.group_id,
      name: g.name,
      description: g.description ?? "",
      topics: Array.isArray(g.topics) ? (g.topics as string[]) : [],
      privacy: g.privacy === "private" ? "private" : "public",
      avatar_url: resolveGroupAvatarUrl(supabase, g.avatar_url),
    }));

    return { success: true, data: result };
  } catch (error) {
    if (error instanceof z.ZodError) {
      return {
        success: false,
        error: error.issues[0]?.message ?? "Validation failed",
      };
    }
    return { success: false, error: "Failed to search public groups" };
  }
}

/**
 * Create a new group via the `create_group` RPC. Atomically provisions the
 * group row, its conversation, and the creator's Admin membership.
 *
 * @param values - Object containing name and optional description
 * @param supabaseClient - Optional Supabase client instance (used for testing)
 * @returns Promise resolving to DataResponse with the new group_id
 */
export async function createGroup(
  values: CreateGroupValues,
  supabaseClient?: ReturnType<typeof createClient> extends Promise<infer R>
    ? R
    : never,
): Promise<DataResponse<{ group_id: number }>> {
  try {
    const parsed = createGroupSchema.parse(values);

    const supabase = supabaseClient ?? (await createClient());
    const { data: authData } = await supabase.auth.getUser();

    if (!authData.user) {
      return { success: false, error: "Authentication required" };
    }

    const extended = await supabase.rpc("create_group", {
      p_name: parsed.name,
      p_description: parsed.description ?? "",
      p_privacy: parsed.privacy,
      p_topics: parsed.topics,
      p_rules: "",
    });

    let newGroupId: number | null = null;

    if (!extended.error && extended.data != null) {
      newGroupId = Number(extended.data);
      if (!Number.isFinite(newGroupId)) {
        return { success: false, error: "Invalid group id from server" };
      }
      return { success: true, data: { group_id: newGroupId } };
    }

    const { data: legacyId, error: legacyError } = await supabase.rpc(
      "create_group",
      {
        group_name: parsed.name,
        group_description: parsed.description ?? "",
        creator_id: authData.user.id,
      },
    );

    if (legacyError) {
      return {
        success: false,
        error: legacyError.message,
      };
    }

    if (legacyId === null || legacyId === undefined) {
      return { success: false, error: "Group was not created" };
    }

    newGroupId = Number(legacyId);
    if (!Number.isFinite(newGroupId)) {
      return { success: false, error: "Invalid group id from server" };
    }

    const { error: metaError } = await supabase
      .from("groups")
      .update({
        topics: parsed.topics,
        privacy: parsed.privacy,
      })
      .eq("group_id", newGroupId);

    if (metaError) {
      return { success: false, error: metaError.message };
    }

    return { success: true, data: { group_id: newGroupId } };
  } catch (error) {
    if (error instanceof z.ZodError) {
      return {
        success: false,
        error: error.issues[0]?.message ?? "Validation failed",
      };
    }
    return { success: false, error: "Failed to create group" };
  }
}

/**
 * Join an existing group. Inserts the user into `group_members` and
 * the group's conversation participants.
 *
 * @param groupId - The ID of the group to join
 * @param supabaseClient - Optional Supabase client instance (used for testing)
 * @returns Promise resolving to DataResponse indicating success or failure
 */
export async function joinGroup(
  groupId: number,
  supabaseClient?: ReturnType<typeof createClient> extends Promise<infer R>
    ? R
    : never,
): Promise<DataResponse<null>> {
  try {
    groupIdSchema.parse(groupId);

    const supabase = supabaseClient ?? (await createClient());
    const { data: authData } = await supabase.auth.getUser();

    if (!authData.user) {
      return { success: false, error: "Authentication required" };
    }

    const userId = authData.user.id;

    const { error: rpcError } = await supabase.rpc("join_public_group", {
      target_group_id: groupId,
    });

    if (!rpcError) {
      return { success: true, data: null };
    }

    const msg = rpcError.message ?? "";
    if (
      msg.includes("already a member") ||
      msg.includes("You are already a member")
    ) {
      return { success: true, data: null };
    }
    if (msg.includes("banned")) {
      return { success: false, error: rpcError.message };
    }
    if (
      msg.includes("private") ||
      msg.includes("does not exist") ||
      msg.includes("Group is private")
    ) {
      return insertDirectGroupMembership(supabase, groupId, userId);
    }

    return { success: false, error: rpcError.message };
  } catch (error) {
    if (error instanceof z.ZodError) {
      return {
        success: false,
        error: error.issues[0]?.message ?? "Validation failed",
      };
    }
    return { success: false, error: "Failed to join group" };
  }
}

/**
 * Leave a group. Removes the user from `group_members` and the group's
 * conversation participants. Prevents the last Admin from leaving.
 *
 * @param groupId - The ID of the group to leave
 * @param supabaseClient - Optional Supabase client instance (used for testing)
 * @returns Promise resolving to DataResponse indicating success or failure
 */
export async function leaveGroup(
  groupId: number,
  supabaseClient?: ReturnType<typeof createClient> extends Promise<infer R>
    ? R
    : never,
): Promise<DataResponse<null>> {
  try {
    groupIdSchema.parse(groupId);

    const supabase = supabaseClient ?? (await createClient());
    const { data: authData } = await supabase.auth.getUser();

    if (!authData.user) {
      return { success: false, error: "Authentication required" };
    }

    // Check if user is the last admin
    const { data: membership } = await supabase
      .from("group_members")
      .select("role")
      .eq("group_id", groupId)
      .eq("user_id", authData.user.id)
      .single();

    if (membership?.role === "Admin") {
      const { data: admins } = await supabase
        .from("group_members")
        .select("user_id")
        .eq("group_id", groupId)
        .eq("role", "Admin");

      if (!admins || admins.length <= 1) {
        return {
          success: false,
          error:
            "Cannot leave: you are the only Admin. Transfer admin role first.",
        };
      }
    }

    const { error: leaveError } = await supabase
      .from("group_members")
      .delete()
      .eq("group_id", groupId)
      .eq("user_id", authData.user.id);

    if (leaveError) {
      return { success: false, error: leaveError.message };
    }

    // Remove from group conversation
    const { data: group } = await supabase
      .from("groups")
      .select("conversation_id")
      .eq("group_id", groupId)
      .single();

    if (group?.conversation_id) {
      await supabase
        .from("conversation_participants")
        .delete()
        .eq("conversation_id", group.conversation_id)
        .eq("user_id", authData.user.id);
    }

    return { success: true, data: null };
  } catch (error) {
    if (error instanceof z.ZodError) {
      return {
        success: false,
        error: error.issues[0]?.message ?? "Validation failed",
      };
    }
    return { success: false, error: "Failed to leave group" };
  }
}

const groupAvatarContentTypeSchema = z
  .string()
  .refine(
    (v) =>
      allowedGroupAvatarMime.includes(
        v as (typeof allowedGroupAvatarMime)[number],
      ),
    { message: "Only JPG, PNG, WEBP, and GIF images are allowed" },
  );

/**
 * Signed upload URL for a group avatar (stored under `profile_pictures` as
 * `{uid}/{uuid}.ext`, same shape as profile pictures). Admin only.
 */
export async function createGroupAvatarUploadUrl(
  groupId: number,
  contentType: string,
): Promise<DataResponse<{ path: string; token: string; maxBytes: number }>> {
  try {
    groupIdSchema.parse(groupId);
    const validatedType = groupAvatarContentTypeSchema.parse(contentType);

    const supabase = await createClient();
    const { data: authData } = await supabase.auth.getUser();

    if (!authData.user) {
      return { success: false, error: "Authentication required" };
    }

    const { data: roleRow, error: roleError } = await supabase
      .from("group_members")
      .select("role")
      .eq("group_id", groupId)
      .eq("user_id", authData.user.id)
      .maybeSingle();

    if (roleError) {
      return { success: false, error: roleError.message };
    }
    if (roleRow?.role !== "Admin") {
      return {
        success: false,
        error: "Only group admins can change the group photo",
      };
    }

    const extension = extensionFromGroupAvatarMime(validatedType);
    const path = `${authData.user.id}/${crypto.randomUUID()}.${extension}`;

    const { data, error } = await supabase.storage
      .from(groupAvatarBucket)
      .createSignedUploadUrl(path);

    if (error || !data) {
      return {
        success: false,
        error: error?.message ?? "Failed to prepare image upload",
      };
    }

    return {
      success: true,
      data: {
        path,
        token: data.token,
        maxBytes: 1024 * 1024,
      },
    };
  } catch (error) {
    if (error instanceof z.ZodError) {
      return {
        success: false,
        error: error.issues[0]?.message ?? "Validation failed",
      };
    }
    return { success: false, error: "Failed to prepare image upload" };
  }
}

/**
 * Updates group fields (name, description, topics, privacy, avatar path). Only Admins may call.
 */
export async function updateGroup(
  values: UpdateGroupValues,
): Promise<DataResponse<null>> {
  try {
    const parsed = updateGroupSchema.parse(values);

    const supabase = await createClient();
    const { data: authData } = await supabase.auth.getUser();

    if (!authData.user) {
      return { success: false, error: "Authentication required" };
    }

    const { data: roleRow, error: roleError } = await supabase
      .from("group_members")
      .select("role")
      .eq("group_id", parsed.groupId)
      .eq("user_id", authData.user.id)
      .maybeSingle();

    if (roleError) {
      return { success: false, error: roleError.message };
    }
    if (roleRow?.role !== "Admin") {
      return {
        success: false,
        error: "Only group admins can edit group details",
      };
    }

    if (parsed.avatarStoragePath !== undefined) {
      const uidPrefix = `${authData.user.id}/`;
      if (!parsed.avatarStoragePath.startsWith(uidPrefix)) {
        return {
          success: false,
          error: "Invalid avatar image path",
        };
      }
    }

    let previousAvatarPathToRemove: string | null = null;
    if (parsed.avatarStoragePath !== undefined) {
      const { data: existingGroup, error: existingErr } = await supabase
        .from("groups")
        .select("avatar_url")
        .eq("group_id", parsed.groupId)
        .maybeSingle();

      if (existingErr) {
        return { success: false, error: existingErr.message };
      }

      const oldPath = existingGroup?.avatar_url?.trim();
      if (
        oldPath &&
        oldPath !== parsed.avatarStoragePath &&
        !/^https?:\/\//i.test(oldPath) &&
        oldPath.startsWith(`${authData.user.id}/`)
      ) {
        previousAvatarPathToRemove = oldPath;
      }
    }

    const patch: {
      name?: string;
      description?: string;
      topics?: string[];
      privacy?: "public" | "private";
      avatar_url?: string;
    } = {};
    if (parsed.name !== undefined) patch.name = parsed.name;
    if (parsed.description !== undefined) {
      patch.description = parsed.description;
    }
    if (parsed.topics !== undefined) patch.topics = parsed.topics;
    if (parsed.privacy !== undefined) patch.privacy = parsed.privacy;
    if (parsed.avatarStoragePath !== undefined) {
      patch.avatar_url = parsed.avatarStoragePath;
    }

    const { error: updateError } = await supabase
      .from("groups")
      .update(patch)
      .eq("group_id", parsed.groupId);

    if (updateError) {
      return { success: false, error: updateError.message };
    }

    if (previousAvatarPathToRemove) {
      const legacyBuckets = ["profile_pictures", "post_images"] as const;
      for (const bucket of legacyBuckets) {
        const { error: rmErr } = await supabase.storage
          .from(bucket)
          .remove([previousAvatarPathToRemove]);
        void rmErr;
      }
    }

    return { success: true, data: null };
  } catch (error) {
    if (error instanceof z.ZodError) {
      return {
        success: false,
        error: error.issues[0]?.message ?? "Validation failed",
      };
    }
    return { success: false, error: "Failed to update group" };
  }
}

/**
 * Sends invites via `invite_user_to_group` RPC (admin + not already member).
 * `handle_group_invite` trigger inserts `notifications` — do not duplicate here.
 * Re-opening a **declined** invite uses `UPDATE` only (no second notification).
 */
export async function inviteUsersToGroup(
  values: InviteMembersValues,
): Promise<DataResponse<{ invitedCount: number }>> {
  try {
    const parsed = inviteMembersSchema.parse(values);

    const supabase = await createClient();
    const { data: authData } = await supabase.auth.getUser();

    if (!authData.user) {
      return { success: false, error: "Authentication required" };
    }

    const { data: roleRow, error: roleError } = await supabase
      .from("group_members")
      .select("role")
      .eq("group_id", parsed.groupId)
      .eq("user_id", authData.user.id)
      .maybeSingle();

    if (roleError) {
      return { success: false, error: roleError.message };
    }
    if (roleRow?.role !== "Admin") {
      return { success: false, error: "Only group admins can send invites" };
    }

    const { data: groupExists, error: groupError } = await supabase
      .from("groups")
      .select("group_id")
      .eq("group_id", parsed.groupId)
      .maybeSingle();

    if (groupError || !groupExists) {
      return {
        success: false,
        error: groupError?.message ?? "Group not found",
      };
    }

    const inviterId = authData.user.id;
    const uniqueIds = [...new Set(parsed.userIds)].filter(
      (id) => id !== inviterId,
    );

    let invitedCount = 0;

    for (const targetUserId of uniqueIds) {
      const { data: existingMember } = await supabase
        .from("group_members")
        .select("user_id")
        .eq("group_id", parsed.groupId)
        .eq("user_id", targetUserId)
        .maybeSingle();

      if (existingMember) {
        continue;
      }

      const { data: priorInvite } = await supabase
        .from("invites")
        .select("status")
        .eq("group_id", parsed.groupId)
        .eq("user_id", targetUserId)
        .maybeSingle();

      if (priorInvite?.status === "pending") {
        continue;
      }

      if (priorInvite?.status === "declined") {
        const { error: updErr } = await supabase
          .from("invites")
          .update({ status: "pending" })
          .eq("group_id", parsed.groupId)
          .eq("user_id", targetUserId);

        if (updErr) {
          return { success: false, error: updErr.message };
        }
        invitedCount += 1;
        continue;
      }

      const { error: rpcError } = await supabase.rpc("invite_user_to_group", {
        p_group_id: parsed.groupId,
        p_target_user_id: targetUserId,
      });

      if (rpcError) {
        if (rpcError.message.includes("already a member")) {
          continue;
        }
        return { success: false, error: rpcError.message };
      }

      invitedCount += 1;
    }

    return { success: true, data: { invitedCount } };
  } catch (error) {
    if (error instanceof z.ZodError) {
      return {
        success: false,
        error: error.issues[0]?.message ?? "Validation failed",
      };
    }
    return { success: false, error: "Failed to send invites" };
  }
}

/**
 * Accept or decline a pending group invite. Accept joins via `joinGroup` (same
 * self-join path as open groups); `add_group_member` is admin-only and cannot
 * be called by the invitee.
 */
export async function respondToGroupInvite(
  values: RespondToInviteValues,
): Promise<DataResponse<null>> {
  try {
    const parsed = respondToInviteSchema.parse(values);

    const supabase = await createClient();
    const { data: authData } = await supabase.auth.getUser();

    if (!authData.user) {
      return { success: false, error: "Authentication required" };
    }

    const userId = authData.user.id;

    const { data: invite, error: inviteError } = await supabase
      .from("invites")
      .select("status")
      .eq("group_id", parsed.groupId)
      .eq("user_id", userId)
      .maybeSingle();

    if (inviteError) {
      return { success: false, error: inviteError.message };
    }

    const isPending =
      invite?.status === "pending" || invite?.status == null;
    if (!invite || !isPending) {
      return {
        success: false,
        error: "No pending invitation for this group",
      };
    }

    if (parsed.response === "declined") {
      const { error } = await supabase
        .from("invites")
        .update({ status: "declined" })
        .eq("group_id", parsed.groupId)
        .eq("user_id", userId);

      if (error) {
        return { success: false, error: error.message };
      }
      return { success: true, data: null };
    }

    const { error: acceptErr } = await supabase.rpc("accept_group_invite", {
      target_group_id: parsed.groupId,
    });
    if (acceptErr) {
      return { success: false, error: acceptErr.message };
    }

    return { success: true, data: null };
  } catch (error) {
    if (error instanceof z.ZodError) {
      return {
        success: false,
        error: error.issues[0]?.message ?? "Validation failed",
      };
    }
    return { success: false, error: "Failed to respond to invite" };
  }
}

/**
 * Add a member to a group by their email address. Only group Admins may call
 * this. Uses the `add_group_member` RPC which verifies admin status via
 * `auth.uid()` and handles both `group_members` and `conversation_participants`.
 *
 * @param values - Object containing groupId and email
 * @returns Promise resolving to DataResponse indicating success or failure
 */
export async function addMemberByEmail(
  values: AddMemberValues,
): Promise<DataResponse<null>> {
  try {
    const parsed = addMemberSchema.parse(values);

    const supabase = await createClient();
    const { data: authData } = await supabase.auth.getUser();

    if (!authData.user) {
      return { success: false, error: "Authentication required" };
    }

    const { data: targetUser, error: lookupError } = await supabase
      .from("users")
      .select("user_id")
      .eq("email", parsed.email)
      .single();

    if (lookupError || !targetUser) {
      return { success: false, error: "No user found with that email address" };
    }

    const { data: existingMember } = await supabase
      .from("group_members")
      .select("user_id")
      .eq("group_id", parsed.groupId)
      .eq("user_id", targetUser.user_id)
      .single();

    if (existingMember) {
      return {
        success: false,
        error: "This user is already a member of the group",
      };
    }

    const { error: rpcError } = await supabase.rpc("add_group_member", {
      target_group_id: parsed.groupId,
      target_user_id: targetUser.user_id,
    });

    if (rpcError) {
      return { success: false, error: rpcError.message };
    }

    return { success: true, data: null };
  } catch (error) {
    if (error instanceof z.ZodError) {
      return {
        success: false,
        error: error.issues[0]?.message ?? "Validation failed",
      };
    }
    return { success: false, error: "Failed to add member" };
  }
}

/**
 * Remove a member from a group. Only group Admins may call this, and Admins
 * cannot be removed. Uses the `remove_group_member` RPC which verifies admin
 * status via `auth.uid()` and handles both `group_members` and
 * `conversation_participants`.
 *
 * @param values - Object containing groupId and targetUserId
 * @returns Promise resolving to DataResponse indicating success or failure
 */
export async function removeMember(
  values: RemoveMemberValues,
): Promise<DataResponse<null>> {
  try {
    const parsed = removeMemberSchema.parse(values);

    const supabase = await createClient();
    const { data: authData } = await supabase.auth.getUser();

    if (!authData.user) {
      return { success: false, error: "Authentication required" };
    }

    const { error: rpcError } = await supabase.rpc("remove_group_member", {
      target_group_id: parsed.groupId,
      target_user_id: parsed.targetUserId,
    });

    if (rpcError) {
      return { success: false, error: rpcError.message };
    }

    return { success: true, data: null };
  } catch (error) {
    if (error instanceof z.ZodError) {
      return {
        success: false,
        error: error.issues[0]?.message ?? "Validation failed",
      };
    }
    return { success: false, error: "Failed to remove member" };
  }
}

/**
 * Permanently delete a group. Admin-only destructive action that removes all
 * group posts (and their comments, likes, reports), members, invites, the
 * linked conversation (with messages), and finally the group row itself.
 * Uses the `delete_group` RPC which enforces admin authorization via
 * `auth.uid()` and handles the full FK-safe cascading delete.
 *
 * @param groupId - The ID of the group to delete
 * @returns Promise resolving to DataResponse indicating success or failure
 */
export async function deleteGroup(
  groupId: number,
): Promise<DataResponse<null>> {
  try {
    groupIdSchema.parse(groupId);

    const supabase = await createClient();
    const { data: authData } = await supabase.auth.getUser();

    if (!authData.user) {
      return { success: false, error: "Authentication required" };
    }

    const { error: rpcError } = await supabase.rpc("delete_group", {
      target_group_id: groupId,
    });

    if (rpcError) {
      return { success: false, error: rpcError.message };
    }

    return { success: true, data: null };
  } catch (error) {
    if (error instanceof z.ZodError) {
      return {
        success: false,
        error: error.issues[0]?.message ?? "Validation failed",
      };
    }
    return { success: false, error: "Failed to delete group" };
  }
}
