"use client";

import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { notifications } from "@mantine/notifications";
import { useDisclosure } from "@mantine/hooks";
import { useRouter } from "next/navigation";
import { getGroups, getGroupDetails } from "@/lib/actions/groups";
import { groupKeys } from "@/lib/query-keys";
import type { LSGroupLayoutProps } from "./ls-group-layout.types";

/**
 * Hook that drives LSGroupLayout: fetches the group list and active group
 * details, manages the create-group modal, and exposes join/leave mutations.
 */
export function useGroupLayout({
	activeGroupId,
	joinGroupAction,
	leaveGroupAction,
}: Pick<LSGroupLayoutProps, "activeGroupId" | "joinGroupAction" | "leaveGroupAction">) {
	const queryClient = useQueryClient();
	const router = useRouter();
	const [createModalOpened, { open: openCreateModal, close: closeCreateModal }] =
		useDisclosure(false);
	const [drawerOpened, { open: openDrawer, close: closeDrawer }] =
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
		joinMutation,
		leaveMutation,
		handleGroupCreated,
	};
}
