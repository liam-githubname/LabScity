"use client";

import { Button, Group, Stack, Textarea } from "@mantine/core";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import {
  createCommentSchema,
  type CreateCommentValues,
} from "@/lib/validations/post";

/**
 * Props for LSCommentComposer.
 *
 * @param postId - Post to attach the comment to (passed to onAddComment).
 * @param onAddComment - Called with postId and form values (content) on submit.
 * @param isSubmitting - When true, submit button shows loading and form can be disabled.
 */
export interface LSCommentComposerProps {
  postId: string;
  onAddComment: (postId: string, values: CreateCommentValues) => void | Promise<void>;
  isSubmitting?: boolean;
}

/**
 * Inline comment form (textarea + Comment button) used inside post cards and on post detail.
 * Resets content on success; on error the hook shows a notification and form is not reset so user can retry.
 */
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
