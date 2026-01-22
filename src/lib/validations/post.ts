import { z } from "zod";

export const createPostSchema = z.object({
	content: z
		.string()
		.min(1, { message: "Content is required" })
		.max(5000, { message: "Content must be less than 5000 characters" }),
	category: z.enum(["formal", "natural", "social", "applied", "general"], {
		message: "Category is required",
	}),
	mediaUrl: z
		.union([z.url({ message: "Invalid media URL" }), z.literal("")])
		.optional(),
	link: z
		.union([z.url({ message: "Invalid link URL" }), z.literal("")])
		.optional(),
});

export const feedFilterSchema = z.object({
	category: z
		.enum(["formal", "natural", "social", "applied", "general"])
		.optional(),
	cursor: z.string().optional(),
	limit: z.number().int().positive().max(50).optional().default(20),
});

export type CreatePostValues = z.infer<typeof createPostSchema>;
export type FeedFilterValues = z.infer<typeof feedFilterSchema>;
