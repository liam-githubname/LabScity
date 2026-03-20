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
import type { UseMutationResult } from "@tanstack/react-query";
import { useEffect } from "react";
import { Controller, useForm } from "react-hook-form";
import type { z } from "zod";
import type { DataResponse } from "@/lib/types/data";
import type { GroupWithMembers } from "@/lib/types/groups";
import {
  editGroupFormSchema,
  type UpdateGroupValues,
  updateGroupSchema,
} from "@/lib/validations/groups";

type EditGroupFormInput = z.input<typeof editGroupFormSchema>;

export interface LSEditGroupModalProps {
  opened: boolean;
  onClose: () => void;
  group: GroupWithMembers | null | undefined;
  updateGroupMutation: UseMutationResult<
    DataResponse<null>,
    Error,
    UpdateGroupValues
  >;
}

/**
 * Admin-only modal to edit group name, description, topics, and privacy.
 */
export function LSEditGroupModal({
  opened,
  onClose,
  group,
  updateGroupMutation,
}: LSEditGroupModalProps) {
  const {
    control,
    handleSubmit,
    reset,
    formState: { errors },
  } = useForm<EditGroupFormInput>({
    resolver: zodResolver(editGroupFormSchema),
    defaultValues: {
      name: "",
      description: "",
      topics: [],
      privacy: "public",
    },
  });

  useEffect(() => {
    if (opened && group) {
      reset({
        name: group.name,
        description: group.description ?? "",
        topics:
          group.topics && group.topics.length > 0 ? group.topics : ["General"],
        privacy: group.privacy,
      });
    }
  }, [opened, group, reset]);

  const onSubmit = (values: EditGroupFormInput) => {
    if (!group) return;
    const parsedForm = editGroupFormSchema.parse(values);
    const payload = updateGroupSchema.parse({
      groupId: group.group_id,
      name: parsedForm.name,
      description: parsedForm.description,
      topics: parsedForm.topics,
      privacy: parsedForm.privacy,
    });
    updateGroupMutation.mutate(payload, {
      onSettled: (_d, err) => {
        if (!err) onClose();
      },
    });
  };

  return (
    <Modal
      opened={opened}
      onClose={onClose}
      title="Edit group"
      size="md"
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
                error={errors.name?.message}
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
                placeholder="Type a topic and press Enter"
                description="Up to 5 topics"
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
                description="Private groups are hidden from Discover"
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
          <Button
            type="submit"
            color="navy"
            fullWidth
            loading={updateGroupMutation.isPending}
          >
            Save changes
          </Button>
        </Stack>
      </form>
    </Modal>
  );
}
