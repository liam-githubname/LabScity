/**
 * Type definitions for the groups feature.
 * Based on Supabase tables: groups, group_members.
 */

export type GroupPrivacy = "public" | "private";

export type GroupRole = "Admin" | "Moderator" | "Member";

/** Row from the `groups` table. */
/** Resolved public image URL for the group (from storage path or legacy full URL). */
export interface Group {
  group_id: number;
  name: string;
  description: string;
  created_at: string;
  conversation_id: number | null;
  topics: string[];
  privacy: GroupPrivacy;
  avatar_url?: string | null;
}

/** Pending or settled group invitation (public.invites). */
export interface GroupInvite {
  group_id: number;
  user_id: string;
  status: "pending" | "accepted" | "declined";
  created_at: string;
}

/** Row from `group_members` joined with `users` for display info. */
export interface GroupMember {
  group_id: number;
  user_id: string;
  role: string;
  created_at: string;
  first_name: string | null;
  last_name: string | null;
  profile_pic_path: string | null;
  avatar_url?: string | null;
}

/** A group with its full member list and count. */
export interface GroupWithMembers extends Group {
  members: GroupMember[];
  memberCount: number;
}

/** Sidebar-friendly group item with just the member count. */
export interface GroupListItem extends Group {
  memberCount: number;
}

/** Shape returned by getGroups server action on success. */
export type GetGroupsResult = GroupListItem[];

/** Public group row for discovery (no member count required). */
export interface GroupDiscoverItem {
  group_id: number;
  name: string;
  description: string;
  topics: string[];
  privacy: GroupPrivacy;
  avatar_url?: string | null;
}
