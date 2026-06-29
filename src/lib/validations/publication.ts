import { z } from "zod";
import { PUBLICATION_TYPE_VALUES } from "../constants/publications";

export const createPublicationSchema = z.object({
    title: z
        .string()
        .min(1, { 
            message: "Title is required" })
        .max(120, { 
            message: "Title must be less than 120 characters" }),
    doi: z
        .string()
        .optional(),
    journal: z
        .string()
        .optional()
        .nullable(),
    datePublished: z
        .iso.date()
        .optional()
        .nullable(),
    authors: z // making an authors array for now, later creating a table to link authors to current users
       .array(z.string().min(1, { message: "Author name is required" }))
        .min(1, {
            message: "At least one author is required",
       }), // must contain 1 or more items
    publicationType: z
       .enum(PUBLICATION_TYPE_VALUES),

    previewPath: z
      .string()
      .optional(),

    isOA: z
      .boolean()
      .optional(),

    pdfUrl: z
      .string()
      .optional()
      .nullable(),
});

export const doiSchema = z
  .string()
  .trim()
  .transform((s) => s.replace(/^(https?:\/\/)?(dx\.)?doi\.org\//i, ''))
  .pipe(
    z.string().regex(
      /^10\.\d{4,9}\/[-._;()/:A-Z0-9]+$/i, 
      "Invalid DOI Format"
    )  
  );

export const updatePublicationSchema = createPublicationSchema.partial();

export const doiFormSchema = z.object({ doi: doiSchema });

export type DoiFormValues = z.infer<typeof doiFormSchema>;
export type CreatePublicationValues = z.infer<typeof createPublicationSchema>;
export type UpdatePublicationValues = z.infer<typeof updatePublicationSchema>;