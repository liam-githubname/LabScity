import { z } from "zod";

export const updateProfileSchema = z.object({
  firstName: z
    .string()
    .min(2, { message: "First name must be at least 2 characters" }),
  lastName: z
    .string()
    .min(2, { message: "Last name must be at least 2 characters" }),
  about: z
    .string()
    .max(256, { message: "About must be at most 256 characters" })
    .optional()
    .or(z.literal("")),
  workplace: z
    .string()
    .min(2, { message: "Workplace must be at least 2 characters" })
    .optional()
    .or(z.literal("")),
  occupation: z
    .string()
    .min(2, { message: "Occupation must be at least 2 characters" })
    .optional()
    .or(z.literal("")),
  fieldOfInterest: z
    .string()
    .min(2, { message: "Field of interest must be at least 2 characters" })
    .optional()
    .or(z.literal("")),
  skills: z
    .array(
      z
        .string()
        .min(1, { message: "Skill must be at least 1 character" }),
    )
    .max(20, { message: "You can select up to 20 skills" })
    .optional()
    .default([]),
});

export type UpdateProfileValues = z.infer<typeof updateProfileSchema>;

