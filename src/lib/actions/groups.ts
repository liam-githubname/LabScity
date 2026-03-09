"use server";

import { z } from "zod";
import {
	createGroupSchema,
	groupIdSchema,
	type CreateGroupValues,
} from "@/lib/validations/groups";
import { createClient } from "@/supabase/server";
import type { DataResponse } from "@/lib/types/data";
import type {
	GetGroupsResult,
	GroupListItem,
	GroupWithMembers,
} from "@/lib/types/groups";

/**
 * Fetch all groups the authenticated user is a member of, with member counts.
 *
 * @param supabaseClient - Optional Supabase client instance (used for testing)
 * @returns Promise resolving to DataResponse with the user's group list
 */
export async function getGroups(
	supabaseClient?: ReturnType<typeof createClient> extends Promise<infer R> ? R : never,
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
			.select("group_id, name, description, created_at, conversation_id")
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
			memberCount: countMap[g.group_id] ?? 0,
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

/**
 * Fetch a single group with its full member list and count.
 *
 * @param groupId - The ID of the group to fetch
 * @param supabaseClient - Optional Supabase client instance (used for testing)
 * @returns Promise resolving to DataResponse with the group and its members
 */
export async function getGroupDetails(
	groupId: number,
	supabaseClient?: ReturnType<typeof createClient> extends Promise<infer R> ? R : never,
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
			.select("group_id, name, description, created_at, conversation_id")
			.eq("group_id", groupId)
			.single();

		if (groupError || !group) {
			return { success: false, error: groupError?.message ?? "Group not found" };
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

		const formattedMembers = (members ?? []).map((m: any) => ({
			group_id: m.group_id,
			user_id: m.user_id,
			role: m.role ?? "Member",
			created_at: m.created_at,
			first_name: m.users?.first_name ?? null,
			last_name: m.users?.last_name ?? null,
			profile_pic_path: m.users?.profile_pic_path ?? null,
		}));

		const result: GroupWithMembers = {
			group_id: group.group_id,
			name: group.name,
			description: group.description ?? "",
			created_at: group.created_at,
			conversation_id: group.conversation_id,
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
 * Create a new group via the `create_group` RPC. Atomically provisions the
 * group row, its conversation, and the creator's Admin membership.
 *
 * @param values - Object containing name and optional description
 * @param supabaseClient - Optional Supabase client instance (used for testing)
 * @returns Promise resolving to DataResponse with the new group_id
 */
export async function createGroup(
	values: CreateGroupValues,
	supabaseClient?: ReturnType<typeof createClient> extends Promise<infer R> ? R : never,
): Promise<DataResponse<{ group_id: number }>> {
	try {
		const parsed = createGroupSchema.parse(values);

		const supabase = supabaseClient ?? (await createClient());
		const { data: authData } = await supabase.auth.getUser();

		if (!authData.user) {
			return { success: false, error: "Authentication required" };
		}

		const { data: groupId, error } = await supabase.rpc("create_group", {
			group_name: parsed.name,
			group_description: parsed.description ?? "",
			creator_id: authData.user.id,
		});

		if (error) {
			return { success: false, error: error.message };
		}

		return { success: true, data: { group_id: groupId } };
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
	supabaseClient?: ReturnType<typeof createClient> extends Promise<infer R> ? R : never,
): Promise<DataResponse<null>> {
	try {
		groupIdSchema.parse(groupId);

		const supabase = supabaseClient ?? (await createClient());
		const { data: authData } = await supabase.auth.getUser();

		if (!authData.user) {
			return { success: false, error: "Authentication required" };
		}

		const { error: memberError } = await supabase
			.from("group_members")
			.insert({ group_id: groupId, user_id: authData.user.id, role: "Member" });

		if (memberError) {
			return { success: false, error: memberError.message };
		}

		// Add user to the group's conversation
		const { data: group } = await supabase
			.from("groups")
			.select("conversation_id")
			.eq("group_id", groupId)
			.single();

		if (group?.conversation_id) {
			await supabase.from("conversation_participants").insert({
				conversation_id: group.conversation_id,
				user_id: authData.user.id,
			});
		}

		return { success: true, data: null };
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
	supabaseClient?: ReturnType<typeof createClient> extends Promise<infer R> ? R : never,
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
					error: "Cannot leave: you are the only Admin. Transfer admin role first.",
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
