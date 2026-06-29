import { z } from "zod";

// id, title, description, summary, location, 
// department, organization, work_mode, job_type, academia_role, application_link, 
export const createJobSchema = z.object({
    title: z
        .string()
        .min(1, {
            message: "Title is required" })
        .max(120, {
            message: "Title must not exceed 120 characters"}),
    description: z
        .string()
        .min(1, {
            message: "A description is required "}),
    summary: z
        .string()
        .optional(),
    location: z
        .string()
        .optional(),
    department: z
        .string()
        .optional(),
    organization: z
        .string()
        .optional(),
    work_mode: z
        .enum([
            "on-site",
            "remote",
            "hybrid",
        ])
        .optional(),
    job_type: z
        .enum([
            "Full-time",
            "Part-time",
            "Internship",
            "Contract",
        ])
        .optional(),
    academia_role: z
        .enum([
            "Postdoc",
            "Faculty",
            "PhD",
            "Grad Student",
        ])
        .optional(),
    application_link: z
        .string()
        .optional(),
});

export type CreateJobValues = z.infer<typeof createJobSchema>;
