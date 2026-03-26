"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import {
  Button,
  Modal,
  Select,
  Stack,
  TagsInput,
  Textarea,
  TextInput,
} from "@mantine/core";
import { notifications } from "@mantine/notifications";
import { Controller, useForm } from "react-hook-form";
import type { z } from "zod";
import { createGroupSchema } from "@/lib/validations/groups";
import type { CreateGroupAction } from "./ls-group-layout.types";

type CreateGroupFormValues = z.input<typeof createGroupSchema>;

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
  } = useForm<CreateGroupFormValues>({
    resolver: zodResolver(createGroupSchema),
    defaultValues: {
      name: "",
      description: "",
      topics: [],
      privacy: "public",
    },
  });

  const onSubmit = async (values: CreateGroupFormValues) => {
    const parsed = createGroupSchema.parse(values);
    const result = await createGroupAction(parsed);

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
      message: `"${parsed.name}" is ready to go.`,
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
      size="lg"
      radius="md"
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

          <Controller
            name="topics"
            control={control}
            render={({ field }) => (
              <TagsInput
                {...field}
                label="Scientific topics"
                placeholder="Type a topic and press Enter (at least one)"
                description="Up to 5 topics — used for discovery and search"
                error={errors.topics?.message}
                maxTags={5}
              />
            )}
          />

          <Controller
            name="privacy"
            control={control}
            render={({ field }) => (
              <Select
                label="Privacy"
                description="Private groups are hidden from discovery"
                data={[
                  { value: "public", label: "Public" },
                  { value: "private", label: "Private" },
                ]}
                value={field.value}
                onChange={(v) => field.onChange(v ?? "public")}
                error={errors.privacy?.message}
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
