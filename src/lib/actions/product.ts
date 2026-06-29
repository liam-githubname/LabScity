"use server";

import { z } from "zod";
import { createClient } from "@/supabase/server";
import {
    createProductSchema,
    updateProductSchema,
    type CreateProductValues,
    type UpdateProductValues,
} from "@/lib/validations/product";

import type { DataResponse, Product } from "@/lib/types/data";

export async function createProduct(
  input: CreateProductValues
): Promise<DataResponse<Product>> {
    try {
        const parsed = createProductSchema.parse(input);

        const supabase = await createClient();

        const { data: authData } = await supabase.auth.getUser();

        if(!authData.user) {
            return { 
                success: false, error: "Authentication required"
            };
        }

        if (parsed.publication_id !== undefined) {
            const { data: linkedPublication, error: linkedPublicationError } =
                await supabase
                    .from("user_publications")
                    .select("publication_id")
                    .eq("user_id", authData.user.id)
                    .eq("publication_id", parsed.publication_id)
                    .maybeSingle(); // because may receive 0 or 1 row back
                
            if (linkedPublicationError){
                return { 
                    success: false, error: linkedPublicationError.message
                };
            }

            if (!linkedPublication){
                return { 
                    success: false, error: "Publication link is invalid"
                };
            }
        }

        const { data: product, error: productError} = await supabase
            .from("products")
            .insert({
                title: parsed.title,
                short_summary: parsed.short_summary ?? null,
                website_link: parsed.website_link || null,
                publication_id: parsed.publication_id ?? null,
                image_path: parsed.image_path ?? null,
                github_link: parsed.github_link || null,
                other_links: parsed.other_links ?? [],
                contributors: parsed.contributors ?? [],
                is_featured: parsed.is_featured ?? false,
                product_type: parsed.product_type ?? null,
            })
            .select()
            .single();

        if (productError){
            return {
                success: false, 
                error: productError.message
            };
        }

        const { error: linkError } = await supabase
            .from("user_products")
            .insert({
                user_id: authData.user.id,
                product_id: product.product_id,
            });

        if (linkError) {
            return { 
                success: false, error: linkError.message
            };
        }

        return {
            success: true,
            data: product,
        };
    } catch (error){
        if(error instanceof z.ZodError){
            return {
                success: false,
                error: error.issues[0]?.message ?? "Validation failed",
            };
        }
        return {
            success: false, error: "Failed to create product"
        };
    }
} 

// validates the input, with partial letter users update fields optionally
// gets the logged in user, returns early if not authenticated
// make sure the publicationId is a valid positive integer
// confirms that the user owns the publication, and returns unauthorized otherwise
// returns the updated product row
export async function updateProduct(
    productId: number,
    input: UpdateProductValues
): Promise<DataResponse<Product>> {
    try {
        const parsed = updateProductSchema.parse(input);
        const supabase = await createClient();

        const { data: authData } = await supabase.auth.getUser();

        if(!authData.user){
            return {
                success: false,
                error: 'Authentication required'
            }
        }

        if(!Number.isInteger(productId) || productId <= 0){
            return {
                success: false,
                error: 'Invalid product id',
            };
        }

        const { data: existingProduct, error: ownershipError} = await supabase
            .from("user_products")
            .select("product_id")
            .eq("user_id", authData.user.id)
            .eq("product_id", productId)
            .maybeSingle();

        if(ownershipError){
            return {
                success: false,
                error: ownershipError.message,
            }
        }

        if(!existingProduct){
            return {
                success: false,
                error: "Product not found or unauthorized"
            }
        }

        if (parsed.publication_id !== undefined) {
            const { data: linkedPublication, error: linkedPublicationError } = await supabase
                .from("user_publications")
                .select("publication_id")
                .eq("user_id", authData.user.id)
                .eq("publication_id", parsed.publication_id)
                .maybeSingle();

            if (linkedPublicationError) {
                return { 
                    success: false, 
                    error: linkedPublicationError.message 
                };
            }

            if (!linkedPublication) {
                return { 
                    success: false, 
                    error: "Publication link is invalid" 
                };
            }
        }

        const updateData = Object.fromEntries(
            Object.entries({
                title: parsed.title,
                short_summary: parsed.short_summary,
                website_link: parsed.website_link,
                publication_id: parsed.publication_id,
                image_path: parsed.image_path,
                github_link: parsed.github_link,
                other_links: parsed.other_links,
                contributors: parsed.contributors,
                is_featured: parsed.is_featured,
                product_type: parsed.product_type,
            }).filter(([, value]) => value !== undefined)
        );

        const { data: product, error: updateError } = await supabase
            .from("products")
            .update(updateData)
            .eq("product_id", productId)
            .select()
            .single();

        if(updateError){
            return {
                success: false,
                error: updateError.message
            };
        }

        return {
            success: true,
            data: product,
        }
    } catch (error){
        if(error instanceof z.ZodError){
            return {
                success: false,
                error: error.issues[0]?.message ?? "Validation failed"
            };
        }
        return {
            success: false,
            error: "failed to update the product"
        }
    }
}

// gets the logged in user, checks that the product id is valid and also belongs to the user
// also deleted from the join table
// deletes the product row from product table and returns the deleted product id
export async function deleteProduct(
    productId: number
): Promise<DataResponse<{ product_id: number }>> {
    try {
        const supabase = await createClient();

        const { data: authData } = await supabase.auth.getUser();

        if (!authData.user) {
            return {
                success: false,
                error: "Authentication required",
            };
        }

        if (!Number.isInteger(productId) || productId <= 0) {
            return {
                success: false,
                error: "Invalid product id",
            };
        }

        const { data: existingProduct, error: ownershipError } = await supabase
            .from("user_products")
            .select("product_id")
            .eq("user_id", authData.user.id)
            .eq("product_id", productId)
            .maybeSingle();

        if (ownershipError) {
            return {
                success: false,
                error: ownershipError.message,
            };
        }

        if (!existingProduct) {
            return {
                success: false,
                error: "Product not found or unauthorized",
            };
        }

        const { error: deleteError } = await supabase
            .from("products")
            .delete()
            .eq("product_id", productId);

        if (deleteError) {
            return {
                success: false,
                error: deleteError.message,
            };
        }

        return {
            success: true,
            data: {
                product_id: productId,
            },
        };
    } catch {
        return {
            success: false,
            error: "Failed to delete product",
        };
    }
}