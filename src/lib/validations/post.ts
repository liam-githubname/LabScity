import { z } from "zod";

export const createPostSchema = z.object({
	userName: z
		.string()
		.min(1, { message: "Name is required" })
		.max(80, { message: "Name must be less than 80 characters" }),
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
	mediaFile: z
		.any()
		.optional()
		.refine(
			(file) =>
				!file ||
				(typeof file === "object" &&
					"type" in file &&
					typeof file.type === "string" &&
					file.type.startsWith("image/")),
			{ message: "Only image uploads are supported" },
		),
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

export const createCommentSchema = z.object({
	userName: z
		.string()
		.min(1, { message: "Name is required" })
		.max(80, { message: "Name must be less than 80 characters" }),
	content: z
		.string()
		.min(1, { message: "Comment is required" })
		.max(2000, { message: "Comment must be less than 2000 characters" }),
});

export type CreatePostValues = z.infer<typeof createPostSchema>;
export type FeedFilterValues = z.infer<typeof feedFilterSchema>;
export type CreateCommentValues = z.infer<typeof createCommentSchema>;
