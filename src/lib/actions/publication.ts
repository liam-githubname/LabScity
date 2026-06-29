"use server";

import { z } from "zod";
import { createClient } from "@/supabase/server";
import {
    createPublicationSchema,
    doiSchema,
    updatePublicationSchema,
    type CreatePublicationValues,
    type UpdatePublicationValues
} from "@/lib/validations/publication";

import type { DataResponse, Publication } from "@/lib/types/data";
import { OpenAlexWork, ParsedOpenAlexWork } from "../types/publication";
import { MAX_FEATURED_PUBLICATIONS, OPENALEX_TYPE_MAP } from "../constants/publications";

export async function addPublicationByDoi(
  doi: string
): Promise<DataResponse<Publication>> {
  try{
    const supabase = await createClient();
    const { data: authData } = await supabase.auth.getUser();

    if (!authData.user){
        return { success: false, error: "Authentication required"}
    }

    const parsedDoi = doiSchema.parse(doi);
    const res = await fetch(`https://api.openalex.org/works/doi:${parsedDoi}`);
    if(!res.ok) throw new Error(`OpenAlex Error: ${res.status}`);
    const data: OpenAlexWork = await res.json();

    const pubType = OPENALEX_TYPE_MAP[data.type ?? ''] ?? 'other';

    const parsed: ParsedOpenAlexWork = {
      doi: parsedDoi,
      title: data.title ?? '',
      authors: data.authorships.map((a) => a.author.display_name),
      type: pubType,
      journal: data.primary_location?.source?.display_name ?? null,
      publicationDate: data.publication_date,
      isOA: data.open_access?.is_oa ?? false,
      pdfUrl: data.open_access?.oa_url ?? null,
      openAlexTopicIds: (data.topics ?? []).map((t) =>
        t.id.replace("https://openalex.org/", "")
      ),
    }

    const { data: existing } = await supabase
      .from("user_publications")
      .select("publication_id, publications!inner(doi)")
      .eq("user_id", authData.user.id)
      .eq("publications.doi", parsedDoi)
      .maybeSingle();

    if (existing) {
      return { success: false, error: "You've already added this publication" };
    }

    const createPubResult = await createPublication({
      title: parsed.title,
      doi: parsed.doi,
      journal: parsed.journal,
      datePublished: parsed.publicationDate,
      authors: parsed.authors,
      isOA: parsed.isOA,
      pdfUrl: parsed.pdfUrl,
      publicationType: parsed.type,
    });

    if(!createPubResult.success) return createPubResult;

    if(parsed?.openAlexTopicIds && parsed.openAlexTopicIds.length > 0) {
      await linkPublicationTopics(
        createPubResult.data!.publication_id,
        parsed.openAlexTopicIds
      )
    }

    return createPubResult;
  } catch(err) {
    if (err instanceof z.ZodError) {
      return { success: false, error: err.issues[0]?.message ?? "Invalid DOI"};
    }
    return { success: false, error: 'Failed to add publication'};
  }
}

async function linkPublicationTopics(
  publicationId: number,
  openAlexTopicIds: string[],
): Promise<void> {
  const supabase = await createClient();

  const { data: tagRows, error: tagError } = await supabase
    .from('tags')
    .select('id, openalex_id')
    .in('openalex_id', openAlexTopicIds);

  if(tagError) {
    console.warn('Failed to look up tags: ', tagError.message);
    return;
  }

  if(!tagRows || tagRows.length == 0) return;

  const links = tagRows.map((tag) => ({
    publication_id: publicationId,
    tag_id: tag.id
  }));

  const { error: linkError } = await supabase
    .from('publication_tags')
    .upsert(links, { onConflict: 'publication_id,tag_id'});

  if(linkError) {
    console.warn('Failed to link topics:', linkError.message);
  }
}

export async function createPublication(
  input: CreatePublicationValues
): Promise<DataResponse<Publication>> {
    try {
        const parsed = createPublicationSchema.parse(input);
        const supabase = await createClient();
        
        const { data: authData } = await supabase.auth.getUser();

        if (!authData.user){
            return { success: false, error: "Authentication required"}
        }

        const { data: publication, error: publicationError } = await supabase
            .from("publications")
            .insert({
                title: parsed.title,
                doi: parsed.doi || null,
                journal: parsed.journal || null,
                date_published: parsed.datePublished ?? null,
                authors: parsed.authors ?? null,
                preview_path: parsed.previewPath ?? null,
                is_oa: parsed.isOA ?? false,
                pdf_url: parsed.pdfUrl || null,
                type: parsed.publicationType ?? "other",
            })
            .select()
            .single();

        if(publicationError){
            return { success: false, error: publicationError.message}
        }

        const { error: linkError } = await supabase
            .from("user_publications")
            .insert({
                user_id: authData.user.id,
                publication_id: publication.publication_id
            });

        if(linkError){
            return { success: false, error: linkError.message };
        }

        return {
            success: true,
            data: publication,
        };

    } catch (error ){
        if(error instanceof z.ZodError){
            return {
                success: false,
                error: error.issues[0]?.message ?? "Validation failed",
            }
        }
        return {success: false, error: "Failed to create publication"};
    }
}

// validates the input, with partial letter users update fields optionally
// gets the logged in user, returns early if not authenticated
// make sure the publicationId is a valid positive integer
// confirms that the user owns the publication, and returns unauthorized otherwise
// returns the updated publication row

export async function updatePublication(
    publicationId: number,
    input: UpdatePublicationValues
): Promise<DataResponse<Publication>> {
    try {
        const parsed = updatePublicationSchema.parse(input); 
        const supabase = await createClient(); 

        const { data: authData } = await supabase.auth.getUser(); 

        if(!authData.user){ // will return early if it's not authenticated
            return {
                success: false,
                error: 'Authentication Required',
            }
        }
        
        if (!Number.isInteger(publicationId) || publicationId <= 0) {
            return {
                success: false,
                error: "Invalid publication id",
            };
        }

        const { data: existingPublication, error: ownershipError } = await supabase
            .from("user_publications")
            .select("publication_id")
            .eq("user_id", authData.user.id)
            .eq("publication_id", publicationId)
            .maybeSingle(); 

        if (ownershipError) {
            return {
                success: false,
                error: ownershipError.message,
            };
        }

        if (!existingPublication) {
            return { 
                success: false, 
                error: "Publication not found or unauthorized" 
            };
        }

        const updateData = Object.fromEntries(
            Object.entries({
                title: parsed.title,
                doi: parsed.doi,
                journal: parsed.journal,
                date_published: parsed.datePublished,
                authors: parsed.authors,
                preview_path: parsed.previewPath,
                is_oa: parsed.isOA,
                pdf_url: parsed.pdfUrl,
                type: parsed.publicationType ?? "other",
            }).filter(([, value]) => value !== undefined)
        );

        const { data: publication, error: updateError } = await supabase
            .from("publications")
            .update(updateData)
            .eq("publication_id", publicationId)
            .select()
            .single();

        if (updateError){
            return {
                success: false,
                error: updateError.message
            };
        }    

        return {
            success: true,
            data: publication,
        };

    } catch (error){
        if(error instanceof z.ZodError){
            return {
                success: false,
                error: error.issues[0]?.message ?? "Validation failed",
            };
        }
        return { 
            success: false, 
            error: "failed to update the publication"
        };
    }
}

// gets the logged in user, checks that the publication id is valid and belongs to the user, then deletes the row
// also deleted from the join table
// returns the deleted publication id

export async function deletePublication(
    publicationId: number
): Promise<DataResponse<{ publication_id: number }>> {
    try {
        const supabase = await createClient();

        const { data: authData } = await supabase.auth.getUser();

        if (!authData.user) {
            return {
                success: false,
                error: "Authentication required",
            };
        }

        if (!Number.isInteger(publicationId) || publicationId <= 0) {
            return {
                success: false,
                error: "Invalid publication id",
            };
        }

        const { data: existingPublication, error: ownershipError } =
            await supabase
                .from("user_publications")
                .select("publication_id")
                .eq("user_id", authData.user.id)
                .eq("publication_id", publicationId)
                .maybeSingle();

        if (ownershipError) {
            return {
                success: false,
                error: ownershipError.message,
            };
        }

        if (!existingPublication) {
            return {
                success: false,
                error: "Publication not found or unauthorized",
            };
        }

        const { error: deleteError } = await supabase
            .from("publications")
            .delete()
            .eq("publication_id", publicationId);

        if (deleteError) {
            return {
                success: false,
                error: deleteError.message,
            };
        }

        return {
            success: true,
            data: {
                publication_id: publicationId,
            },
        };
    } catch {
        return {
            success: false,
            error: "Failed to delete publication",
        };
    }
}

export async function setFeaturedPublication(
  publicationId: number,
  isFeatured: boolean
){
  try {
    if (!Number.isInteger(publicationId) || publicationId <= 0) {
        return {
            success: false,
            error: "Invalid publication id",
        };
    }
    
    const supabase = await createClient();

    const { data: authData } = await supabase.auth.getUser();

    if (!authData.user) {
        return {
            success: false,
            error: "Authentication required",
        };
    }

    if(isFeatured) {
      const { count, error: validationError } = 
        await supabase
          .from("user_publications")
          .select("*", { count: 'exact', head: true })
          .eq("user_id", authData.user.id)
          .eq("is_featured", true)
        
      if (validationError) {
        return {
          success: false,
          error: validationError.message
        }
      }

      if((count ?? 0) >= 3) {
        return { 
          success: false,
          error: `You can only feature up to ${MAX_FEATURED_PUBLICATIONS} publications`
        }
      }
    }

    const { data: publication, error } =
      await supabase
        .from("user_publications")
        .update({ is_featured: isFeatured })
        .eq("user_id", authData.user.id)
        .eq("publication_id", publicationId)
        .select()
        .maybeSingle();

    if (error){
        return {
            success: false,
            error: error.message
        };
    }    

    if(!publication) {
      return {
        success: false,
        error: 'Publication does not exist or user not authorized'
      }
    }

    return {success: true};
    
  } catch(error) {
    console.error("[setFeaturedPublication] error:", error);
    return {
      success: false,
      error: "Failed to set featured publication"
    }
  }
}