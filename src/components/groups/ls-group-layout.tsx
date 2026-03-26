"use client";

import {
  Avatar,
  Box,
  Button,
  Center,
  Drawer,
  Flex,
  Group,
  Menu,
  Modal,
  Paper,
  Stack,
  Text,
} from "@mantine/core";
import {
  IconEdit,
  IconLogout,
  IconMenu2,
  IconMessageCircle,
  IconSettings,
  IconTrash,
  IconUsers,
} from "@tabler/icons-react";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { useIsMobile } from "@/app/use-is-mobile";
import { useAuth } from "@/components/auth/use-auth";
import LSMiniProfileList from "@/components/profile/ls-mini-profile-list";
import { LSSpinner } from "@/components/ui/ls-spinner";
import type { User } from "@/lib/types/feed";
import { LSCreateGroupModal } from "./ls-create-group-modal";
import { LSEditGroupModal } from "./ls-edit-group-modal";
import { LSGroupFeed } from "./ls-group-feed";
import type { LSGroupLayoutProps } from "./ls-group-layout.types";
import { LSGroupSidebar } from "./ls-group-sidebar";
import { LSManageMembersModal } from "./ls-manage-members-modal";
import { useGroupLayout } from "./use-group-layout";

/**
 * Top-level client component for the Groups page.
 * Desktop: sidebar (left) + content (right).
 * Mobile: content only + hamburger drawer for the sidebar.
 */
export function LSGroupLayout(props: LSGroupLayoutProps) {
  const {
    activeGroupId,
    createGroupAvatarUploadUrlAction,
    createGroupAction,
    joinGroupAction,
    leaveGroupAction,
    deleteGroupAction,
    addMemberByEmailAction,
    inviteUsersToGroupAction,
    removeMemberAction,
    updateGroupAction,
    createPostAction,
    createPostImageUploadUrlAction,
    createCommentAction,
    createReportAction,
    likePostAction,
    likeCommentAction,
  } = props;

  const isMobile = useIsMobile();
  const router = useRouter();
  const { user } = useAuth();
  const [leaveConfirmOpened, setLeaveConfirmOpened] = useState(false);
  const [deleteConfirmOpened, setDeleteConfirmOpened] = useState(false);
  const {
    groups,
    isGroupsLoading,
    groupDetails,
    isDetailsLoading,
    createModalOpened,
    openCreateModal,
    closeCreateModal,
    drawerOpened,
    openDrawer,
    closeDrawer,
    manageMembersOpened,
    openManageMembers,
    closeManageMembers,
    editGroupOpened,
    openEditGroup,
    closeEditGroup,
    updateGroupMutation,
    leaveMutation,
    deleteGroupMutation,
    addMemberMutation,
    inviteUsersMutation,
    removeMemberMutation,
    handleGroupCreated,
  } = useGroupLayout({
    activeGroupId,
    joinGroupAction,
    leaveGroupAction,
    deleteGroupAction,
    addMemberByEmailAction,
    inviteUsersToGroupAction,
    removeMemberAction,
    updateGroupAction,
  });

  const currentMember = groupDetails?.members.find(
    (m) => m.user_id === user?.id,
  );
  const isAdmin = currentMember?.role === "Admin";

  const handleNewGroupClick = () => {
    closeDrawer();
    openCreateModal();
  };

  const handleLeaveConfirm = () => {
    if (!activeGroupId) return;
    leaveMutation.mutate(activeGroupId);
    setLeaveConfirmOpened(false);
  };

  const handleDeleteConfirm = () => {
    if (!activeGroupId) return;
    deleteGroupMutation.mutate(activeGroupId);
    setDeleteConfirmOpened(false);
  };

  const memberProfiles: User[] = (groupDetails?.members ?? []).map((m) => ({
    user_id: m.user_id,
    first_name: m.first_name ?? "",
    last_name: m.last_name ?? "",
    email: "",
    research_interests: [m.role],
    avatar_url: m.avatar_url ?? null,
  }));

  const sidebarNode = (
    <LSGroupSidebar
      groups={groups}
      activeGroupId={activeGroupId}
      onNewGroupClick={handleNewGroupClick}
      isLoading={isGroupsLoading}
    />
  );

  const groupInitials =
    groupDetails?.name
      .split(" ")
      .filter(Boolean)
      .map((w) => w[0])
      .slice(0, 2)
      .join("") ?? "";

  const contentNode =
    activeGroupId && groupDetails ? (
      <Stack gap="md">
        <Flex p={8} direction={{ base: "column", lg: "row" }} w="100%" gap={8}>
          <Box flex={5}>
            <Paper p="lg" radius="md" shadow="sm" bg="white">
              <Group gap="md" align="flex-start">
                <Avatar
                  size={72}
                  radius="xl"
                  color="navy.7"
                  bg={groupDetails.avatar_url ? undefined : "navy.7"}
                  src={groupDetails.avatar_url ?? undefined}
                >
                  {groupInitials}
                </Avatar>
                <Stack gap={4} style={{ flex: 1 }}>
                  <Text size="xl" fw={600} c="navy.7">
                    {groupDetails.name}
                  </Text>
                  {groupDetails.description && (
                    <Text c="navy.7">{groupDetails.description}</Text>
                  )}
                </Stack>
              </Group>
            </Paper>
          </Box>
          <Box flex={3}>
            <Stack gap="xs">
              <LSMiniProfileList
                widgetTitle={`Members - ${groupDetails.memberCount}`}
                profiles={memberProfiles}
              />
              {groupDetails.conversation_id && (
                <Button
                  variant="light"
                  leftSection={<IconMessageCircle size={16} />}
                  fullWidth
                  onClick={() =>
                    router.push(`/chat/${groupDetails.conversation_id}`)
                  }
                >
                  Group Chat
                </Button>
              )}
              {currentMember && (
                <Group gap="xs" wrap="wrap">
                  {isAdmin ? (
                    <Menu shadow="md" width={260} position="bottom-end">
                      <Menu.Target>
                        <Button
                          variant="light"
                          color="navy"
                          fullWidth
                          leftSection={<IconSettings size={16} />}
                          aria-label="Group settings"
                        >
                          Settings
                        </Button>
                      </Menu.Target>
                      <Menu.Dropdown>
                        <Menu.Item
                          leftSection={<IconEdit size={16} />}
                          onClick={openEditGroup}
                        >
                          Edit group
                        </Menu.Item>
                        <Menu.Item
                          leftSection={<IconUsers size={16} />}
                          onClick={openManageMembers}
                        >
                          Manage members
                        </Menu.Item>
                        <Menu.Divider />
                        <Menu.Item
                          color="red"
                          leftSection={<IconTrash size={16} />}
                          onClick={() => setDeleteConfirmOpened(true)}
                          disabled={deleteGroupMutation.isPending}
                        >
                          Delete group
                        </Menu.Item>
                      </Menu.Dropdown>
                    </Menu>
                  ) : (
                    <Button
                      variant="light"
                      color="red"
                      fullWidth
                      leftSection={<IconLogout size={16} />}
                      onClick={() => setLeaveConfirmOpened(true)}
                      loading={leaveMutation.isPending}
                    >
                      Leave
                    </Button>
                  )}
                </Group>
              )}
            </Stack>
          </Box>
        </Flex>

        <Box px={8}>
          <LSGroupFeed
            groupId={activeGroupId}
            createPostAction={createPostAction}
            createPostImageUploadUrlAction={createPostImageUploadUrlAction}
            createCommentAction={createCommentAction}
            createReportAction={createReportAction}
            likePostAction={likePostAction}
            likeCommentAction={likeCommentAction}
          />
        </Box>
      </Stack>
    ) : activeGroupId && isDetailsLoading ? (
      <Center h="100%">
        <LSSpinner />
      </Center>
    ) : activeGroupId && !isDetailsLoading && !groupDetails ? (
      <Center h="100%">
        <Stack align="center" gap="sm">
          <Text c="dimmed" size="lg">
            Group not found.
          </Text>
          <Button variant="light" onClick={() => router.push("/groups")}>
            Back to Groups
          </Button>
        </Stack>
      </Center>
    ) : (
      <Center h="100%">
        <Text c="dimmed" size="lg">
          Select a group from the sidebar to get started.
        </Text>
      </Center>
    );

  return (
    <>
      <LSCreateGroupModal
        opened={createModalOpened}
        onClose={closeCreateModal}
        createGroupAction={createGroupAction}
        onCreated={handleGroupCreated}
      />

      {/* Leave group confirmation */}
      <Modal
        opened={leaveConfirmOpened}
        onClose={() => setLeaveConfirmOpened(false)}
        title="Leave Group"
        size="sm"
        centered
      >
        <Stack gap="md">
          <Text size="sm">
            Are you sure you want to leave{" "}
            <Text span fw={600}>
              {groupDetails?.name}
            </Text>
            ? You will lose access to the group feed and chat.
          </Text>
          <Group justify="flex-end" gap="xs">
            <Button
              variant="default"
              onClick={() => setLeaveConfirmOpened(false)}
            >
              Cancel
            </Button>
            <Button
              color="red"
              onClick={handleLeaveConfirm}
              loading={leaveMutation.isPending}
            >
              Leave Group
            </Button>
          </Group>
        </Stack>
      </Modal>

      {/* Delete group confirmation */}
      <Modal
        opened={deleteConfirmOpened}
        onClose={() => setDeleteConfirmOpened(false)}
        title="Delete Group"
        size="sm"
        centered
      >
        <Stack gap="md">
          <Text size="sm">
            Are you sure you want to permanently delete{" "}
            <Text span fw={600}>
              {groupDetails?.name}
            </Text>
            ? All posts, comments, messages, and members will be removed. This
            action cannot be undone.
          </Text>
          <Group justify="flex-end" gap="xs">
            <Button
              variant="default"
              onClick={() => setDeleteConfirmOpened(false)}
            >
              Cancel
            </Button>
            <Button
              color="red"
              onClick={handleDeleteConfirm}
              loading={deleteGroupMutation.isPending}
            >
              Delete Group
            </Button>
          </Group>
        </Stack>
      </Modal>

      {/* Admin member management */}
      {activeGroupId && groupDetails && (
        <LSManageMembersModal
          opened={manageMembersOpened}
          onClose={closeManageMembers}
          groupId={activeGroupId}
          members={groupDetails.members}
          addMemberMutation={addMemberMutation}
          inviteUsersMutation={inviteUsersMutation}
          removeMemberMutation={removeMemberMutation}
        />
      )}

      {activeGroupId && groupDetails && (
        <LSEditGroupModal
          opened={editGroupOpened}
          onClose={closeEditGroup}
          group={groupDetails}
          updateGroupMutation={updateGroupMutation}
          createGroupAvatarUploadUrlAction={createGroupAvatarUploadUrlAction}
        />
      )}

      {isMobile ? (
        <>
          <Drawer
            opened={drawerOpened}
            onClose={closeDrawer}
            padding={0}
            size="xs"
            title=""
            withCloseButton
          >
            {sidebarNode}
          </Drawer>

          <Stack gap={0} h="calc(100vh - 60px)" bg="gray.0">
            <Box p="xs">
              <Button
                variant="subtle"
                size="compact-sm"
                leftSection={<IconMenu2 size={18} />}
                onClick={openDrawer}
                c="navy.7"
              >
                Groups
              </Button>
            </Box>

            <Box flex={1} py="md" px="md" style={{ overflow: "auto" }}>
              {contentNode}
            </Box>
          </Stack>
        </>
      ) : (
        <Flex h="calc(100vh - 60px)" bg="gray.0">
          <Paper
            w={320}
            miw={320}
            radius={0}
            bg="gray.1"
            style={{
              borderRight: "1px solid var(--mantine-color-gray-3)",
            }}
          >
            {sidebarNode}
          </Paper>

          <Box
            flex={1}
            py={24}
            px={{ base: "md", md: "xl", lg: 80 }}
            style={{ overflow: "auto" }}
          >
            {contentNode}
          </Box>
        </Flex>
      )}
    </>
  );
}
