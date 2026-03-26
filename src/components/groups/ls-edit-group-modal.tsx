"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import {
  Avatar,
  Button,
  FileInput,
  Group,
  Modal,
  Select,
  Stack,
  TagsInput,
  Textarea,
  TextInput,
} from "@mantine/core";
import { notifications } from "@mantine/notifications";
import type { UseMutationResult } from "@tanstack/react-query";
import { useEffect, useState } from "react";
import { Controller, useForm } from "react-hook-form";
import type { z } from "zod";
import type { DataResponse } from "@/lib/types/data";
import type { GroupWithMembers } from "@/lib/types/groups";
import {
  editGroupFormSchema,
  type UpdateGroupValues,
  updateGroupSchema,
} from "@/lib/validations/groups";
import { createClient } from "@/supabase/client";
import type { CreateGroupAvatarUploadUrlAction } from "./ls-group-layout.types";

type EditGroupFormInput = z.input<typeof editGroupFormSchema>;

const groupAvatarBucket = "profile_pictures";
const allowedGroupAvatarTypes = new Set([
  "image/jpeg",
  "image/png",
  "image/webp",
  "image/gif",
]);
const maxGroupAvatarBytes = 1024 * 1024;

function groupNameInitials(name: string) {
  return (name || "?")
    .split(" ")
    .filter(Boolean)
    .map((part) => part[0])
    .join("")
    .slice(0, 2)
    .toUpperCase();
}

export interface LSEditGroupModalProps {
  opened: boolean;
  onClose: () => void;
  group: GroupWithMembers | null | undefined;
  updateGroupMutation: UseMutationResult<
    DataResponse<null>,
    Error,
    UpdateGroupValues
  >;
  createGroupAvatarUploadUrlAction: CreateGroupAvatarUploadUrlAction;
}

/**
 * Admin-only modal to edit group name, description, topics, privacy, and photo.
 */
export function LSEditGroupModal({
  opened,
  onClose,
  group,
  updateGroupMutation,
  createGroupAvatarUploadUrlAction,
}: LSEditGroupModalProps) {
  const [isAvatarUploading, setIsAvatarUploading] = useState(false);

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

  const handleAvatarFile = async (file: File | null) => {
    if (!file || !group) return;
    if (!allowedGroupAvatarTypes.has(file.type)) {
      notifications.show({
        title: "Invalid file type",
        message: "Only JPG, PNG, WEBP, and GIF images are allowed",
        color: "red",
      });
      return;
    }
    if (file.size > maxGroupAvatarBytes) {
      notifications.show({
        title: "File too large",
        message: "Group photo must be 1 MB or smaller",
        color: "red",
      });
      return;
    }

    setIsAvatarUploading(true);
    try {
      const uploadInfo = await createGroupAvatarUploadUrlAction(
        group.group_id,
        file.type,
      );
      if (!uploadInfo.success || !uploadInfo.data) {
        throw new Error(uploadInfo.error ?? "Could not prepare image upload");
      }

      const supabase = createClient();
      const { error: uploadError } = await supabase.storage
        .from(groupAvatarBucket)
        .uploadToSignedUrl(uploadInfo.data.path, uploadInfo.data.token, file);
      if (uploadError) {
        throw new Error(uploadError.message || "Image upload failed");
      }

      await updateGroupMutation.mutateAsync({
        groupId: group.group_id,
        avatarStoragePath: uploadInfo.data.path,
      });
    } catch (error: unknown) {
      notifications.show({
        title: "Could not update group photo",
        message:
          error instanceof Error ? error.message : "Something went wrong",
        color: "red",
      });
    } finally {
      setIsAvatarUploading(false);
    }
  };

  return (
    <Modal
      opened={opened}
      onClose={onClose}
      title="Edit group"
      size="lg"
      radius="md"
      centered
    >
      <form onSubmit={handleSubmit(onSubmit)}>
        <Stack gap="md">
          {group ? (
            <Group align="flex-start" gap="md" wrap="nowrap">
              <Avatar
                size={72}
                radius="md"
                color="navy.7"
                bg={group.avatar_url ? undefined : "navy.7"}
                src={group.avatar_url ?? undefined}
              >
                {groupNameInitials(group.name)}
              </Avatar>
              <FileInput
                flex={1}
                label="Group photo"
                placeholder="Choose image"
                accept="image/jpeg,image/png,image/webp,image/gif"
                disabled={isAvatarUploading || updateGroupMutation.isPending}
                onChange={handleAvatarFile}
              />
            </Group>
          ) : null}

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
            loading={updateGroupMutation.isPending && !isAvatarUploading}
          >
            Save changes
          </Button>
        </Stack>
      </form>
    </Modal>
  );
}
