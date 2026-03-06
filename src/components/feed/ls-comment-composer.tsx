"use client";

import { Button, Group, Stack, Textarea } from "@mantine/core";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import {
  createCommentSchema,
  type CreateCommentValues,
} from "@/lib/validations/post";

export interface LSCommentComposerProps {
  postId: string;
  onAddComment: (postId: string, values: CreateCommentValues) => void | Promise<void>;
  isSubmitting?: boolean;
}

export function LSCommentComposer({
  postId,
  onAddComment,
  isSubmitting: isMutationPending = false,
}: LSCommentComposerProps) {
  const {
    handleSubmit,
    register,
    reset,
    formState: { errors, isSubmitting, isValid },
  } = useForm<CreateCommentValues>({
    resolver: zodResolver(createCommentSchema),
    mode: "onChange",
    defaultValues: {
      content: "",
    },
  });

  const onCommentSubmit = handleSubmit(async (values) => {
    try {
      await onAddComment(postId, values);
      reset({
        content: "",
      });
    } catch {
      // Hook's mutation onError already showed notification; don't reset form so user can retry.
    }
  });

  return (
    <form onSubmit={onCommentSubmit}>
      <Stack gap="sm">
        <Textarea
          labelProps={{ fw: "bold" }}
          placeholder="Share a thought..."
          error={errors.content?.message}
          styles={{ label: { color: "var(--mantine-color-navy-7)" } }}
          {...register("content")}
        />
        <Group justify="flex-end">
          <Button
            type="submit"
            disabled={!isValid || isSubmitting || isMutationPending}
            loading={isMutationPending}
          >
            Comment
          </Button>
        </Group>
      </Stack>
    </form>
  );
}
