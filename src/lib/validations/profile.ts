import { z } from "zod";

/**
 * Zod schema for the profile edit form.
 * Validates first/last name, about, workplace, occupation, field of interest,
 * skill (array, max 20), and articles (array of { title, url }, max 30).
 * Used by LSProfileHero edit modal and updateProfileAction.
 */
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
  timezone: z
    .string()
    .refine(
      (value) =>
        !value ||
        Intl.supportedValuesOf("timeZone").includes(value),
        { message : "Invalid timezone" }
    )
    .optional(),
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
  skill: z
    .array(
      z
        .string()
        .min(1, { message: "Skill must be at least 1 character" }),
    )
    .max(20, { message: "You can select up to 20 skills" })
    .optional()
    .default([]),
  articles: z
    .array(
      z.object({
        title: z.string().min(1, { message: "Title is required" }),
        url: z.string().url({ message: "Must be a valid URL" }),
      }),
    )
    .max(30, { message: "You can add up to 30 articles" })
    .optional()
    .default([]),
});

/** Inferred type from updateProfileSchema. Use for form values and updateProfileAction input. */
export type UpdateProfileValues = z.infer<typeof updateProfileSchema>;

/**
 * Zod schema for follow/unfollow server action input.
 * Validates targetUserId (the user to follow or unfollow).
 */
export const toggleFollowSchema = z.object({
  targetUserId: z.string().min(1, { message: "Target user is required" }),
});

/** Inferred type from toggleFollowSchema. Use for toggleFollowAction input. */
export type ToggleFollowValues = z.infer<typeof toggleFollowSchema>;

/**
 * Zod schema for user report form.
 * Validates report type (impersonation, inappropriate name, inappropriate banner/picture, harassment, etc.)
 * and optional additional context.
 */
export const createUserReportSchema = z.object({
  type: z
    .enum([
      "Impersonation",
      "Inappropriate Name",
      "Inappropriate Profile Picture",
      "Inappropriate Banner",
      "Harassment/Hate",
      "Spam/Scam",
      "Sexual Content",
      "Other",
    ])
    .or(z.literal("")),
  reason: z
    .string()
    .min(1, { message: "Reason is required" })
    .max(2000, { message: "Reason must be less than 2000 characters" }),
}).refine((values) => values.type !== "", {
  message: "Report type is required",
  path: ["type"],
});

/** Inferred type from createUserReportSchema. Use for user report form values. */
export type CreateUserReportValues = z.infer<typeof createUserReportSchema>;

