"use client";

import { Button, Modal, Stack, TextInput, Textarea } from "@mantine/core";
import { notifications } from "@mantine/notifications";
import { Controller, useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import {
	createGroupSchema,
	type CreateGroupValues,
} from "@/lib/validations/groups";
import type { CreateGroupAction } from "./ls-group-layout.types";

export interface LSCreateGroupModalProps {
	opened: boolean;
	onClose: () => void;
	createGroupAction: CreateGroupAction;
	/** Called with the new group_id after successful creation. */
	onCreated: (groupId: number) => void;
}

/**
 * Modal form for creating a new group. Uses React Hook Form + Zod validation.
 * On success, calls onCreated so the parent can navigate and invalidate queries.
 */
export function LSCreateGroupModal({
	opened,
	onClose,
	createGroupAction,
	onCreated,
}: LSCreateGroupModalProps) {
	const {
		control,
		handleSubmit,
		reset,
		formState: { isSubmitting, errors },
	} = useForm<CreateGroupValues>({
		resolver: zodResolver(createGroupSchema),
		defaultValues: { name: "", description: "" },
	});

	const onSubmit = async (values: CreateGroupValues) => {
		const result = await createGroupAction(values);

		if (!result.success || !result.data) {
			notifications.show({
				title: "Could not create group",
				message: result.error ?? "Something went wrong",
				color: "red",
			});
			return;
		}

		notifications.show({
			title: "Group created",
			message: `"${values.name}" is ready to go.`,
			color: "green",
		});

		reset();
		onCreated(result.data.group_id);
	};

	const handleClose = () => {
		reset();
		onClose();
	};

	return (
		<Modal
			opened={opened}
			onClose={handleClose}
			title="Create a new group"
			centered
		>
			<form onSubmit={handleSubmit(onSubmit)}>
				<Stack gap="md">
					<Controller
						name="name"
						control={control}
						render={({ field }) => (
							<TextInput
								{...field}
								label="Group name"
								placeholder="e.g. Quantum Physics Lab"
								error={errors.name?.message}
								data-autofocus
							/>
						)}
					/>

					<Controller
						name="description"
						control={control}
						render={({ field }) => (
							<Textarea
								{...field}
								label="Description"
								placeholder="What is this group about?"
								minRows={3}
								error={errors.description?.message}
							/>
						)}
					/>

					<Button type="submit" loading={isSubmitting} fullWidth>
						Create Group
					</Button>
				</Stack>
			</form>
		</Modal>
	);
}
