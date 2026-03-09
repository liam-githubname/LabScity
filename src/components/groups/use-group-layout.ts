"use client";

import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { notifications } from "@mantine/notifications";
import { useDisclosure } from "@mantine/hooks";
import { useRouter } from "next/navigation";
import { getGroups, getGroupDetails } from "@/lib/actions/groups";
import { chatKeys, groupKeys } from "@/lib/query-keys";
import type { GroupListItem, GroupWithMembers } from "@/lib/types/groups";
import type { AddMemberValues, RemoveMemberValues } from "@/lib/validations/groups";
import type { LSGroupLayoutProps } from "./ls-group-layout.types";

/**
 * Hook that drives LSGroupLayout: fetches the group list and active group
 * details, manages modals/drawers, and exposes join/leave/add/remove mutations.
 */
export function useGroupLayout({
	activeGroupId,
	joinGroupAction,
	leaveGroupAction,
	deleteGroupAction,
	addMemberByEmailAction,
	removeMemberAction,
}: Pick<
	LSGroupLayoutProps,
	| "activeGroupId"
	| "joinGroupAction"
	| "leaveGroupAction"
	| "deleteGroupAction"
	| "addMemberByEmailAction"
	| "removeMemberAction"
>) {
	const queryClient = useQueryClient();
	const router = useRouter();
	const [createModalOpened, { open: openCreateModal, close: closeCreateModal }] =
		useDisclosure(false);
	const [drawerOpened, { open: openDrawer, close: closeDrawer }] =
		useDisclosure(false);
	const [manageMembersOpened, { open: openManageMembers, close: closeManageMembers }] =
		useDisclosure(false);

	const {
		data: groups,
		isLoading: isGroupsLoading,
	} = useQuery({
		queryKey: groupKeys.list(),
		queryFn: async () => {
			const result = await getGroups();
			if (!result.success || !result.data) {
				throw new Error(result.error ?? "Failed to fetch groups");
			}
			return result.data;
		},
	});

	const {
		data: groupDetails,
		isLoading: isDetailsLoading,
	} = useQuery({
		queryKey: groupKeys.detail(activeGroupId!),
		queryFn: async () => {
			const result = await getGroupDetails(activeGroupId!);
			if (!result.success || !result.data) {
				throw new Error(result.error ?? "Failed to fetch group details");
			}
			return result.data;
		},
		enabled: !!activeGroupId,
	});

	const joinMutation = useMutation({
		mutationFn: async (groupId: number) => {
			const result = await joinGroupAction(groupId);
			if (!result.success) {
				throw new Error(result.error ?? "Failed to join group");
			}
			return result;
		},
		onSuccess: () => {
			queryClient.invalidateQueries({ queryKey: groupKeys.all });
			notifications.show({
				title: "Joined group",
				message: "You are now a member of this group.",
				color: "green",
			});
		},
		onError: (error) => {
			notifications.show({
				title: "Could not join group",
				message: error instanceof Error ? error.message : "Something went wrong",
				color: "red",
			});
		},
	});

	const leaveMutation = useMutation({
		mutationFn: async (groupId: number) => {
			const result = await leaveGroupAction(groupId);
			if (!result.success) {
				throw new Error(result.error ?? "Failed to leave group");
			}
			return result;
		},
		onSuccess: () => {
			queryClient.invalidateQueries({ queryKey: groupKeys.all });
			router.push("/groups");
			notifications.show({
				title: "Left group",
				message: "You are no longer a member of this group.",
				color: "green",
			});
		},
		onError: (error) => {
			notifications.show({
				title: "Could not leave group",
				message: error instanceof Error ? error.message : "Something went wrong",
				color: "red",
			});
		},
	});

	const deleteGroupMutation = useMutation({
		mutationFn: async (groupId: number) => {
			const result = await deleteGroupAction(groupId);
			if (!result.success) {
				throw new Error(result.error ?? "Failed to delete group");
			}
			return result;
		},
		onSuccess: () => {
			queryClient.invalidateQueries({ queryKey: groupKeys.all });
			queryClient.invalidateQueries({ queryKey: chatKeys.all });
			router.push("/groups");
			notifications.show({
				title: "Group deleted",
				message: "The group and all its content have been permanently removed.",
				color: "green",
			});
		},
		onError: (error) => {
			notifications.show({
				title: "Could not delete group",
				message: error instanceof Error ? error.message : "Something went wrong",
				color: "red",
			});
		},
	});

	const addMemberMutation = useMutation({
		mutationFn: async (values: AddMemberValues) => {
			const result = await addMemberByEmailAction(values);
			if (!result.success) {
				throw new Error(result.error ?? "Failed to add member");
			}
			return result;
		},
		onSuccess: () => {
			if (activeGroupId) {
				queryClient.invalidateQueries({ queryKey: groupKeys.detail(activeGroupId) });
				queryClient.invalidateQueries({ queryKey: groupKeys.list() });
			}
			notifications.show({
				title: "Member added",
				message: "The user has been added to this group.",
				color: "green",
			});
		},
		onError: (error) => {
			notifications.show({
				title: "Could not add member",
				message: error instanceof Error ? error.message : "Something went wrong",
				color: "red",
			});
		},
	});

	const removeMemberMutation = useMutation({
		mutationFn: async (values: RemoveMemberValues) => {
			const result = await removeMemberAction(values);
			if (!result.success) {
				throw new Error(result.error ?? "Failed to remove member");
			}
			return result;
		},
		onMutate: async (values: RemoveMemberValues) => {
			await queryClient.cancelQueries({ queryKey: groupKeys.detail(values.groupId) });

			const previousDetails = queryClient.getQueryData<GroupWithMembers>(
				groupKeys.detail(values.groupId),
			);
			const previousList = queryClient.getQueryData<GroupListItem[]>(
				groupKeys.list(),
			);

			if (previousDetails) {
				queryClient.setQueryData<GroupWithMembers>(
					groupKeys.detail(values.groupId),
					{
						...previousDetails,
						members: previousDetails.members.filter(
							(m) => m.user_id !== values.targetUserId,
						),
						memberCount: previousDetails.memberCount - 1,
					},
				);
			}

			if (previousList) {
				queryClient.setQueryData<GroupListItem[]>(
					groupKeys.list(),
					previousList.map((g) =>
						g.group_id === values.groupId
							? { ...g, memberCount: g.memberCount - 1 }
							: g,
					),
				);
			}

			return { previousDetails, previousList };
		},
		onError: (error, _values, context) => {
			if (context?.previousDetails && activeGroupId) {
				queryClient.setQueryData(
					groupKeys.detail(activeGroupId),
					context.previousDetails,
				);
			}
			if (context?.previousList) {
				queryClient.setQueryData(groupKeys.list(), context.previousList);
			}
			notifications.show({
				title: "Could not remove member",
				message: error instanceof Error ? error.message : "Something went wrong",
				color: "red",
			});
		},
		onSuccess: () => {
			notifications.show({
				title: "Member removed",
				message: "The user has been removed from this group.",
				color: "green",
			});
		},
		onSettled: () => {
			if (activeGroupId) {
				queryClient.invalidateQueries({ queryKey: groupKeys.detail(activeGroupId) });
			}
			queryClient.invalidateQueries({ queryKey: groupKeys.list() });
		},
	});

	/** Called after a group is successfully created in the modal. */
	const handleGroupCreated = (groupId: number) => {
		closeCreateModal();
		queryClient.invalidateQueries({ queryKey: groupKeys.all });
		router.push(`/groups?group=${groupId}`);
	};

	return {
		groups: groups ?? [],
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
		joinMutation,
		leaveMutation,
		deleteGroupMutation,
		addMemberMutation,
		removeMemberMutation,
		handleGroupCreated,
	};
}
