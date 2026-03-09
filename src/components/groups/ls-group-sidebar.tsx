"use client";

import {
	Avatar,
	Box,
	Button,
	Group,
	NavLink,
	ScrollArea,
	Stack,
	Text,
	Title,
} from "@mantine/core";
import { IconPlus } from "@tabler/icons-react";
import type { GroupListItem } from "@/lib/types/groups";

function formatMembers(count: number) {
	return `${count} member${count === 1 ? "" : "s"}`;
}

export interface LSGroupSidebarProps {
	groups: GroupListItem[];
	activeGroupId?: number;
	onNewGroupClick: () => void;
	isLoading: boolean;
}

/**
 * Sidebar listing the user's groups with NavLinks. Includes a "New" button
 * that triggers the create-group modal via the parent.
 */
export function LSGroupSidebar({
	groups,
	activeGroupId,
	onNewGroupClick,
	isLoading,
}: LSGroupSidebarProps) {
	return (
		<Stack gap={0} h="100%">
			<Box
				p="md"
				style={{ borderBottom: "1px solid var(--mantine-color-gray-3)" }}
			>
				<Group justify="space-between" align="flex-start">
					<Box>
						<Title order={4} c="navy.7">
							Groups
						</Title>
						<Text size="sm" c="dimmed">
							Switch between your active groups.
						</Text>
					</Box>
					<Button
						variant="light"
						size="compact-sm"
						leftSection={<IconPlus size={14} />}
						onClick={onNewGroupClick}
					>
						New
					</Button>
				</Group>
			</Box>

			<ScrollArea h={{ base: 240, md: "calc(100vh - 60px - 89px)" }}>
				<Stack gap={0}>
					{isLoading ? (
						<Text size="sm" c="dimmed" p="md">
							Loading groups...
						</Text>
					) : groups.length === 0 ? (
						<Text size="sm" c="dimmed" p="md">
							You haven't joined any groups yet.
						</Text>
					) : (
						groups.map((group) => {
							const href = `/groups?group=${group.group_id}`;
							const active = group.group_id === activeGroupId;

							return (
								<NavLink
									key={group.group_id}
									href={href}
									active={active}
									p="md"
									style={{
										borderBottom:
											"1px solid var(--mantine-color-gray-2)",
									}}
									label={
										<Text fw={600} c="navy.7" truncate>
											{group.name}
										</Text>
									}
									description={
										<Text size="xs" c="dimmed">
											{formatMembers(group.memberCount)}
										</Text>
									}
									leftSection={
										<Avatar color="navy" radius="xl">
											{group.name
												.split(" ")
												.map((part) => part[0])
												.join("")
												.slice(0, 2)}
										</Avatar>
									}
								/>
							);
						})
					)}
				</Stack>
			</ScrollArea>
		</Stack>
	);
}
