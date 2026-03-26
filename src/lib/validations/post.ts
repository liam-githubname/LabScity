import { z } from "zod";

export const createPostSchema = z.object({
	scientificField: z
		.string()
		.min(1, { message: "Scientific field is required" })
		.max(120, { message: "Scientific field must be less than 120 characters" }),
	content: z
		.string()
		.min(1, { message: "Content is required" })
		.max(5000, { message: "Content must be less than 5000 characters" }),
	category: z.enum(["formal", "natural", "social", "applied", "general"], {
		message: "Category is required",
	}),
	mediaPath: z.string().min(1).optional(),
	groupId: z.number().int().positive().optional(),
});

export const feedFilterSchema = z.object({
	category: z
		.enum(["formal", "natural", "social", "applied", "general"])
		.optional(),
	cursor: z.string().optional(),
	limit: z.number().int().positive().max(50).optional().default(20),
	groupId: z.number().int().positive().optional(),
});

export const createCommentSchema = z.object({
	content: z
		.string()
		.min(1, { message: "Comment is required" })
		.max(2000, { message: "Comment must be less than 2000 characters" }),
});

export const createReportSchema = z.object({
	type: z
		.enum([
			"Harassment/Hate",
			"Spam/Scam",
			"Violence/Harm",
			"Sexual Content",
			"Misinformation",
			"Impersonation/Stolen Intellectual Property",
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

export type CreatePostValues = z.infer<typeof createPostSchema>;
export type FeedFilterValues = z.infer<typeof feedFilterSchema>;
export type CreateCommentValues = z.infer<typeof createCommentSchema>;
export type CreateReportValues = z.infer<typeof createReportSchema>;
