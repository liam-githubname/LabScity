"use client";

import { Button, Card, FileInput, Group, Paper, Select, Stack, TextInput, Textarea } from "@mantine/core";
import { Controller, useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import {
  createPostSchema,
  type CreatePostValues,
} from "@/lib/validations/post";

const postComposerSchema = createPostSchema.extend({
  mediaFile: z.any().optional().nullable(),
});

const SCIENCE_CATEGORIES = [
  "Acoustics",
  "Aerodynamics",
  "Anatomy",
  "Anthropology",
  "Archaeology",
  "Astronomy",
  "Astrophysics",
  "Biochemistry",
  "Biology",
  "Biophysics",
  "Biotechnology",
  "Botany",
  "Chemistry",
  "Climatology",
  "Cognitive Science",
  "Computer Science",
  "Data Science",
  "Ecology",
  "Economics",
  "Engineering",
  "Entomology",
  "Environmental Science",
  "Epidemiology",
  "General Sciences",
  "Genetics",
  "Geography",
  "Geology",
  "Geophysics",
  "Immunology",
  "Machine Learning",
  "Marine Biology",
  "Materials Science",
  "Mathematics",
  "Meteorology",
  "Microbiology",
  "Molecular Biology",
  "Neuroscience",
  "Oceanography",
  "Paleontology",
  "Pathology",
  "Pharmacology",
  "Physics",
  "Physiology",
  "Psychology",
  "Quantum Physics",
  "Robotics",
  "Seismology",
  "Sociology",
  "Statistics",
  "Toxicology",
  "Virology",
  "Zoology",
  "Other",
];

export interface PostComposerProps {
  onSubmit: (values: CreatePostValues & { mediaFile?: File | null }) => void | Promise<void>;
  isPending: boolean;
}

export function PostComposer({ onSubmit: onSubmitProp, isPending }: PostComposerProps) {
  const {
    control,
    handleSubmit,
    formState: { errors, isSubmitting, isValid },
    register,
  } = useForm<CreatePostValues & { mediaFile?: File | null }>({
    resolver: zodResolver(postComposerSchema),
    mode: "onChange",
    defaultValues: {
      scientificField: "",
      content: "",
      category: "general",
      mediaFile: undefined,
      mediaPath: undefined,
    },
  });

  const onSubmit = handleSubmit((values) => {
    onSubmitProp(values);
  });

  return (
    <Card radius="md" shadow="sm" bg="gray.0" p="lg">
      <form onSubmit={onSubmit}>
        <Stack gap="sm">
          <Controller
            control={control}
            name="scientificField"
            render={({ field }) => (
              <Select
                label="Scientific Field"
                placeholder="Select a scientific field"
                data={SCIENCE_CATEGORIES}
                searchable
                value={field.value}
                onChange={field.onChange}
                error={errors.scientificField?.message}
                styles={{ label: { color: "var(--mantine-color-navy-7)" } }}
              />
            )}
          />
          <Textarea
            label="Post"
            placeholder="Share an update with the community..."
            minRows={3}
            error={errors.content?.message}
            styles={{ label: { color: "var(--mantine-color-navy-7)" } }}
            {...register("content")}
          />
          <Controller
            control={control}
            name="mediaFile"
            render={({ field }) => (
              <FileInput
                label="Picture (optional)"
                placeholder="Upload an image"
                accept="image/*"
                value={field.value ? (field.value as File) : null}
                onChange={field.onChange}
                error={errors.mediaFile?.message as string | undefined}
                styles={{ label: { color: "var(--mantine-color-navy-7)" } }}
              />
            )}
          />
          <Group justify="flex-end">
            <Button
              type="submit"
              disabled={!isValid || isSubmitting || isPending}
              loading={isPending}
            >
              Post
            </Button>
          </Group>
        </Stack>
      </form>
    </Card>
  );
}
