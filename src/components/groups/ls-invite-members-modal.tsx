"use client";

import { Button, Group, MultiSelect, Stack, Text } from "@mantine/core";
import type { UseMutationResult } from "@tanstack/react-query";
import { useMemo, useState } from "react";
import { useAuth } from "@/components/auth/use-auth";
import { useUserFriends } from "@/components/profile/use-profile";
import type { DataResponse } from "@/lib/types/data";
import type { GroupMember } from "@/lib/types/groups";
import type { InviteMembersValues } from "@/lib/validations/groups";

export interface LSInviteFriendsSectionProps {
  groupId: number;
  members: GroupMember[];
  inviteMutation: UseMutationResult<
    DataResponse<{ invitedCount: number }>,
    Error,
    InviteMembersValues
  >;
}

/**
 * Friend-picker for group invites: MultiSelect from current user's friends,
 * excluding existing members. Used inside Manage Members (Friends tab).
 */
export function LSInviteFriendsSection({
  groupId,
  members,
  inviteMutation,
}: LSInviteFriendsSectionProps) {
  const { user } = useAuth();
  const [selectedIds, setSelectedIds] = useState<string[]>([]);

  const friendsQuery = useUserFriends(user?.id ?? "");

  const memberIdSet = useMemo(
    () => new Set(members.map((m) => m.user_id)),
    [members],
  );

  const friendOptions = useMemo(() => {
    const list = friendsQuery.data ?? [];
    return list
      .filter((f) => !memberIdSet.has(f.user_id))
      .map((f) => ({
        value: f.user_id,
        label: `${f.first_name ?? ""} ${f.last_name ?? ""}`.trim() || f.email,
      }));
  }, [friendsQuery.data, memberIdSet]);

  const handleSend = () => {
    if (selectedIds.length === 0) return;
    inviteMutation.mutate(
      { groupId, userIds: selectedIds },
      {
        onSettled: (_data, error) => {
          if (!error) setSelectedIds([]);
        },
      },
    );
  };

  return (
    <Stack gap="sm">
      <Text size="sm" c="dimmed">
        Choose friends to notify. They get an in-app invite they can accept or
        decline.
      </Text>
      <MultiSelect
        label="Friends"
        placeholder={
          friendsQuery.isLoading ? "Loading friends…" : "Select friends"
        }
        data={friendOptions}
        value={selectedIds}
        onChange={setSelectedIds}
        searchable
        nothingFoundMessage="No friends match"
        disabled={friendsQuery.isLoading || friendOptions.length === 0}
      />
      {friendOptions.length === 0 && !friendsQuery.isLoading ? (
        <Text size="xs" c="dimmed">
          No friends available to invite (everyone here may already be in this
          group).
        </Text>
      ) : null}
      <Group justify="flex-end">
        <Button
          color="navy"
          onClick={handleSend}
          loading={inviteMutation.isPending}
          disabled={selectedIds.length === 0}
        >
          Send invites
        </Button>
      </Group>
    </Stack>
  );
}
