import { z } from "zod";

export const reportListLimitSchema = z.number().int().min(1).max(100);
export const reportIdSchema = z.coerce.number().int().positive("Report ID is required");
export const postIdSchema = z.coerce.number().int().positive("Post ID is required");
export const userIdSchema = z.string().uuid("A valid user ID is required");

export const dismissReportSchema = z.object({
	reportId: reportIdSchema,
});

export const deleteReportedPostSchema = z.object({
	reportId: reportIdSchema,
	postId: postIdSchema,
	commentId: z.coerce.number().int().positive("Comment ID is required").optional(),
});

export const banUserSchema = z.object({
	reportedUserId: userIdSchema,
	reportId: reportIdSchema.optional(),
});

export type DismissReportValues = z.infer<typeof dismissReportSchema>;
export type DeleteReportedPostValues = z.infer<typeof deleteReportedPostSchema>;
export type BanUserValues = z.infer<typeof banUserSchema>;
