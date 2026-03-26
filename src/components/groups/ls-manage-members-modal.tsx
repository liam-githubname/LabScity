"use client";

import {
  ActionIcon,
  Avatar,
  Badge,
  Box,
  Button,
  Group,
  Modal,
  ScrollArea,
  Stack,
  Tabs,
  Text,
  TextInput,
} from "@mantine/core";
import { useForm } from "@mantine/form";
import { IconTrash, IconUserPlus } from "@tabler/icons-react";
import type { UseMutationResult } from "@tanstack/react-query";
import { useState } from "react";
import { z } from "zod";
import type { DataResponse } from "@/lib/types/data";
import type { GroupMember } from "@/lib/types/groups";
import type {
  AddMemberValues,
  InviteMembersValues,
  RemoveMemberValues,
} from "@/lib/validations/groups";
import { LSInviteFriendsSection } from "./ls-invite-members-modal";

interface LSManageMembersModalProps {
  opened: boolean;
  onClose: () => void;
  groupId: number;
  members: GroupMember[];
  addMemberMutation: UseMutationResult<
    DataResponse<null>,
    Error,
    AddMemberValues
  >;
  inviteUsersMutation: UseMutationResult<
    DataResponse<{ invitedCount: number }>,
    Error,
    InviteMembersValues
  >;
  removeMemberMutation: UseMutationResult<
    DataResponse<null>,
    Error,
    RemoveMemberValues
  >;
}

/**
 * Admin-only modal: invite friends, add by email, remove non-Admin members.
 */
export function LSManageMembersModal({
  opened,
  onClose,
  groupId,
  members,
  addMemberMutation,
  inviteUsersMutation,
  removeMemberMutation,
}: LSManageMembersModalProps) {
  const [removeConfirmUserId, setRemoveConfirmUserId] = useState<string | null>(
    null,
  );

  const form = useForm({
    initialValues: { email: "" },
    validate: {
      email: (v) => {
        const t = (v ?? "").trim();
        if (!t) return "Email is required";
        const r = z.string().email().safeParse(t);
        return r.success ? null : "Valid email required";
      },
    },
  });

  const handleAddMember = (values: { email: string }) => {
    addMemberMutation.mutate(
      { groupId, email: values.email.trim() },
      { onSuccess: () => form.reset() },
    );
  };

  const handleConfirmRemove = () => {
    if (!removeConfirmUserId) return;
    removeMemberMutation.mutate(
      { groupId, targetUserId: removeConfirmUserId },
      { onSettled: () => setRemoveConfirmUserId(null) },
    );
  };

  const memberToRemove = members.find((m) => m.user_id === removeConfirmUserId);

  return (
    <>
      <Modal
        opened={opened}
        onClose={onClose}
        title="Manage members"
        size="lg"
        radius="md"
        centered
      >
        <Stack gap="lg">
          <Tabs defaultValue="friends" color="navy" radius="md">
            <Tabs.List>
              <Tabs.Tab value="friends">Invite friends</Tabs.Tab>
              <Tabs.Tab value="email">Add by email</Tabs.Tab>
            </Tabs.List>

            <Tabs.Panel value="friends" pt="md">
              <LSInviteFriendsSection
                groupId={groupId}
                members={members}
                inviteMutation={inviteUsersMutation}
              />
            </Tabs.Panel>

            <Tabs.Panel value="email" pt="md">
              <form onSubmit={form.onSubmit(handleAddMember)}>
                <Stack gap="xs">
                  <Text fw={600} size="sm" c="navy.7">
                    Add a member directly
                  </Text>
                  <Group gap="xs" align="flex-start">
                    <TextInput
                      placeholder="user@university.edu"
                      style={{ flex: 1 }}
                      {...form.getInputProps("email")}
                    />
                    <Button
                      type="submit"
                      leftSection={<IconUserPlus size={16} />}
                      loading={addMemberMutation.isPending}
                    >
                      Add
                    </Button>
                  </Group>
                </Stack>
              </form>
            </Tabs.Panel>
          </Tabs>

          <Box>
            <Text fw={600} size="sm" c="navy.7" mb="xs">
              Members ({members.length})
            </Text>
            <ScrollArea.Autosize mah={320}>
              <Stack gap={4}>
                {members.map((member) => (
                  <Group
                    key={member.user_id}
                    justify="space-between"
                    p="xs"
                    style={{
                      borderRadius: "var(--mantine-radius-sm)",
                      border: "1px solid var(--mantine-color-gray-2)",
                    }}
                  >
                    <Group gap="sm">
                      <Avatar
                        color="navy.7"
                        bg="navy.7"
                        radius="xl"
                        size="sm"
                        src={member.profile_pic_path}
                      >
                        {(member.first_name?.[0] ?? "").toUpperCase()}
                      </Avatar>
                      <Box>
                        <Text size="sm" fw={500}>
                          {member.first_name} {member.last_name}
                        </Text>
                      </Box>
                      {member.role === "Admin" && (
                        <Badge size="xs" variant="light" color="navy">
                          Admin
                        </Badge>
                      )}
                    </Group>
                    {member.role !== "Admin" && (
                      <ActionIcon
                        variant="subtle"
                        color="red"
                        size="sm"
                        onClick={() => setRemoveConfirmUserId(member.user_id)}
                        loading={
                          removeMemberMutation.isPending &&
                          removeMemberMutation.variables?.targetUserId ===
                            member.user_id
                        }
                      >
                        <IconTrash size={14} />
                      </ActionIcon>
                    )}
                  </Group>
                ))}
              </Stack>
            </ScrollArea.Autosize>
          </Box>
        </Stack>
      </Modal>

      {/* Remove confirmation modal */}
      <Modal
        opened={!!removeConfirmUserId}
        onClose={() => setRemoveConfirmUserId(null)}
        title="Remove Member"
        size="sm"
        centered
      >
        <Stack gap="md">
          <Text size="sm">
            Are you sure you want to remove{" "}
            <Text span fw={600}>
              {memberToRemove?.first_name} {memberToRemove?.last_name}
            </Text>{" "}
            from this group?
          </Text>
          <Group justify="flex-end" gap="xs">
            <Button
              variant="default"
              onClick={() => setRemoveConfirmUserId(null)}
            >
              Cancel
            </Button>
            <Button
              color="red"
              onClick={handleConfirmRemove}
              loading={removeMemberMutation.isPending}
            >
              Remove
            </Button>
          </Group>
        </Stack>
      </Modal>
    </>
  );
}
