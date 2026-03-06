"use server";

import type { SupabaseClient } from "@supabase/supabase-js";
import { z } from "zod";
import type { User } from "@/lib/types/feed";
import { createClient } from "@/supabase/server";
import type { DataResponse } from "../types/data";
import {
  updateProfileSchema,
  toggleFollowSchema,
  type UpdateProfileValues,
  type ToggleFollowValues,
} from "@/lib/validations/profile";

const profilePictureBucket = "profile_pictures";
const profileHeaderBucket = "profile_header";
const maxProfilePictureBytes = 1024 * 1024;
const maxProfileHeaderBytes = 2 * 1024 * 1024;
const allowedProfilePictureTypes = ["image/jpeg", "image/png", "image/webp", "image/gif"] as const;

const contentTypeSchema = z
  .string()
  .refine((value) => allowedProfilePictureTypes.includes(value as (typeof allowedProfilePictureTypes)[number]), {
    message: "Only JPG, PNG, WEBP, and GIF images are allowed",
  });

const profilePicPathSchema = z.string().min(1, "Profile picture path is required");
const profileHeaderPathSchema = z.string().min(1, "Profile header path is required");

function emptyToNull(s: string | undefined): string | null {
  if (s === undefined || s === "") return null;
  return s;
}

function extensionFromMime(mimeType: string) {
  switch (mimeType) {
    case "image/jpeg":
      return "jpg";
    case "image/png":
      return "png";
    case "image/webp":
      return "webp";
    case "image/gif":
      return "gif";
    default:
      return "bin";
  }
}

function mapUserWithAvatarUrl(user: User, supabase: SupabaseClient): User {
  const avatarUrl = user.profile_pic_path
    ? supabase.storage.from(profilePictureBucket).getPublicUrl(user.profile_pic_path).data.publicUrl
    : null;
  const profileHeaderUrl = user.profile_header_path
    ? supabase.storage.from(profilePictureBucket).getPublicUrl(user.profile_header_path).data.publicUrl
    : null;

  return { ...user, avatar_url: avatarUrl, profile_header_url: profileHeaderUrl };
}

export async function createProfilePictureUploadUrl(contentType: string, supabaseClient?: SupabaseClient) {
  try {
    const validatedContentType = contentTypeSchema.parse(contentType);
    const supabase = supabaseClient || (await createClient());
    const { data: authData } = await supabase.auth.getUser();

    if (!authData.user) {
      return { success: false, error: "Authentication required" };
    }

    const extension = extensionFromMime(validatedContentType);
    const path = `${authData.user.id}/${crypto.randomUUID()}.${extension}`;

    const { data, error } = await supabase.storage
      .from(profilePictureBucket)
      .createSignedUploadUrl(path);

    if (error || !data) {
      return { success: false, error: error?.message ?? "Failed to prepare profile picture upload" };
    }

    return {
      success: true,
      data: {
        bucket: profilePictureBucket,
        path,
        token: data.token,
        maxBytes: maxProfilePictureBytes,
      },
    };
  } catch (error) {
    if (error instanceof z.ZodError) {
      return { success: false, error: error.issues[0]?.message ?? "Invalid content type" };
    }
    return { success: false, error: "Failed to prepare profile picture upload" };
  }
}

export async function updateOwnProfilePicture(profilePicPath: string, supabaseClient?: SupabaseClient) {
  try {
    const validatedPath = profilePicPathSchema.parse(profilePicPath);
    const supabase = supabaseClient || (await createClient());
    const { data: authData } = await supabase.auth.getUser();

    if (!authData.user) {
      return { success: false, error: "Authentication required" };
    }

    if (!validatedPath.startsWith(`${authData.user.id}/`)) {
      return { success: false, error: "Invalid profile picture path" };
    }

    const { data: currentUser, error: currentUserError } = await supabase
      .from("users")
      .select("profile_pic_path")
      .eq("user_id", authData.user.id)
      .maybeSingle();

    if (currentUserError) {
      return { success: false, error: currentUserError.message };
    }

    if (!currentUser) {
      return {
        success: false,
        error: "User profile row was not found in public.users for the authenticated user",
      };
    }

    const { error: updateError } = await supabase
      .from("users")
      .update({ profile_pic_path: validatedPath })
      .eq("user_id", authData.user.id);

    if (updateError) {
      return { success: false, error: updateError.message };
    }

    const { data: updatedUser, error: updatedUserError } = await supabase
      .from("users")
      .select("profile_pic_path")
      .eq("user_id", authData.user.id)
      .maybeSingle();

    if (updatedUserError) {
      return { success: false, error: updatedUserError.message };
    }

    if (!updatedUser || updatedUser.profile_pic_path !== validatedPath) {
      return {
        success: false,
        error: "Profile picture path update did not persist to public.users",
      };
    }

    if (currentUser?.profile_pic_path && currentUser.profile_pic_path !== validatedPath) {
      await supabase.storage.from(profilePictureBucket).remove([currentUser.profile_pic_path]);
    }

    const avatarUrl = supabase.storage.from(profilePictureBucket).getPublicUrl(validatedPath).data.publicUrl;

    return {
      success: true,
      data: {
        profilePicPath: validatedPath,
        avatarUrl,
      },
    };
  } catch (error) {
    if (error instanceof z.ZodError) {
      return { success: false, error: error.issues[0]?.message ?? "Validation failed" };
    }
    return { success: false, error: "Failed to update profile picture" };
  }
}

export async function createProfileHeaderUploadUrl(contentType: string, supabaseClient?: SupabaseClient) {
  try {
    const validatedContentType = contentTypeSchema.parse(contentType);
    const supabase = supabaseClient || (await createClient());
    const { data: authData } = await supabase.auth.getUser();

    if (!authData.user) {
      return { success: false, error: "Authentication required" };
    }

    const extension = extensionFromMime(validatedContentType);
    const path = `${authData.user.id}/header-${crypto.randomUUID()}.${extension}`;

    const { data, error } = await supabase.storage
      .from(profileHeaderBucket)
      .createSignedUploadUrl(path);

    if (error || !data) {
      return { success: false, error: error?.message ?? "Failed to prepare profile header upload" };
    }

    return {
      success: true,
      data: {
        bucket: profileHeaderBucket,
        path,
        token: data.token,
        maxBytes: maxProfileHeaderBytes,
      },
    };
  } catch (error) {
    if (error instanceof z.ZodError) {
      return { success: false, error: error.issues[0]?.message ?? "Invalid content type" };
    }
    return { success: false, error: "Failed to prepare profile header upload" };
  }
}

export async function updateOwnProfileHeader(profileHeaderPath: string, supabaseClient?: SupabaseClient) {
  try {
    const validatedPath = profileHeaderPathSchema.parse(profileHeaderPath);
    const supabase = supabaseClient || (await createClient());
    const { data: authData } = await supabase.auth.getUser();

    if (!authData.user) {
      return { success: false, error: "Authentication required" };
    }

    if (!validatedPath.startsWith(`${authData.user.id}/`)) {
      return { success: false, error: "Invalid profile header path" };
    }

    const { data: currentUser, error: currentUserError } = await supabase
      .from("profile")
      .select("header_pic_path")
      .eq("user_id", authData.user.id)
      .maybeSingle();

    if (currentUserError) {
      return { success: false, error: currentUserError.message };
    }

    if (!currentUser) {
      return {
        success: false,
        error: "Profile row was not found in public.profile for the authenticated user",
      };
    }

    const { error: updateError } = await supabase
      .from("profile")
      .update({ header_pic_path: validatedPath })
      .eq("user_id", authData.user.id);

    if (updateError) {
      return { success: false, error: updateError.message };
    }

    const { data: updatedUser, error: updatedUserError } = await supabase
      .from("profile")
      .select("header_pic_path")
      .eq("user_id", authData.user.id)
      .maybeSingle();

    if (updatedUserError) {
      return { success: false, error: updatedUserError.message };
    }

    if (!updatedUser || updatedUser.header_pic_path !== validatedPath) {
      return {
        success: false,
        error: "Profile header path update did not persist to public.profile",
      };
    }

    if (currentUser.header_pic_path && currentUser.header_pic_path !== validatedPath) {
      await supabase.storage.from(profileHeaderBucket).remove([currentUser.header_pic_path]);
    }

    const profileHeaderUrl = supabase.storage
      .from(profileHeaderBucket)
      .getPublicUrl(validatedPath).data.publicUrl;

    return {
      success: true,
      data: {
        profileHeaderPath: validatedPath,
        profileHeaderUrl,
      },
    };
  } catch (error) {
    if (error instanceof z.ZodError) {
      return { success: false, error: error.issues[0]?.message ?? "Validation failed" };
    }
    return { success: false, error: "Failed to update profile header" };
  }
}

/**
 * Updates the authenticated user's profile and display name.
 */
export async function updateProfileAction(
  input: UpdateProfileValues,
  supabaseClient?: SupabaseClient,
): Promise<{ success: boolean; error?: string }> {
  try {
    const validated = updateProfileSchema.parse(input);
    const supabase = supabaseClient ?? (await createClient());
    const { data: authData } = await supabase.auth.getUser();

    if (!authData.user) {
      return { success: false, error: "Authentication required" };
    }

    const userId = authData.user.id;

    const profilePayload = {
      user_id: userId,
      about: emptyToNull(validated.about),
      workplace: emptyToNull(validated.workplace),
      occupation: emptyToNull(validated.occupation),
      skill: validated.skill && validated.skill.length ? validated.skill : null,
      articles: validated.articles?.length ? validated.articles : null,
    };

    const { error: profileError } = await supabase
      .from("profile")
      .upsert(profilePayload, { onConflict: "user_id" });

    if (profileError) {
      return { success: false, error: profileError.message };
    }

    const { error: usersError } = await supabase
      .from("users")
      .update({
        first_name: validated.firstName.trim(),
        last_name: validated.lastName.trim(),
      })
      .eq("user_id", userId);

    if (usersError) {
      return { success: false, error: usersError.message };
    }

    return { success: true };
  } catch (err) {
    if (err instanceof z.ZodError) {
      const first = err.issues[0];
      return {
        success: false,
        error: first?.message ?? "Validation failed",
      };
    }
    return {
      success: false,
      error: err instanceof Error ? err.message : "Failed to update profile",
    };
  }
}

/**
 * Toggles follow state between the authenticated user and a target user.
 */
export async function toggleFollowAction(
  input: ToggleFollowValues,
  supabaseClient?: SupabaseClient,
): Promise<
  | { success: true; data: { isFollowing: boolean } }
  | { success: false; error: string }
> {
  try {
    const validated = toggleFollowSchema.parse(input);
    const supabase = supabaseClient ?? (await createClient());
    const { data: authData } = await supabase.auth.getUser();

    if (!authData.user) {
      return { success: false, error: "Authentication required" };
    }

    const currentUserId = authData.user.id;
    const targetUserId = validated.targetUserId;

    if (currentUserId === targetUserId) {
      return { success: false, error: "You cannot follow yourself" };
    }

    const { data: existing, error: selectError } = await supabase
      .from("follows")
      .select("follower_id")
      .eq("follower_id", currentUserId)
      .eq("following_id", targetUserId)
      .maybeSingle();

    if (selectError) {
      return { success: false, error: selectError.message };
    }

    if (existing) {
      const { data: deleted, error: deleteError } = await supabase
        .from("follows")
        .delete()
        .eq("follower_id", currentUserId)
        .eq("following_id", targetUserId)
        .select("follower_id");

      if (deleteError) {
        return { success: false, error: deleteError.message };
      }
      if (!deleted?.length) {
        return {
          success: false,
          error: "Could not unfollow; the follow relationship may be protected.",
        };
      }
      return { success: true, data: { isFollowing: false } };
    }

    const { error: insertError } = await supabase.from("follows").insert({
      follower_id: currentUserId,
      following_id: targetUserId,
    });

    if (insertError) {
      return { success: false, error: insertError.message };
    }

    return { success: true, data: { isFollowing: true } };
  } catch (err) {
    if (err instanceof z.ZodError) {
      return {
        success: false,
        error: err.issues[0]?.message ?? "Validation failed",
      };
    }
    return {
      success: false,
      error: err instanceof Error ? err.message : "Failed to toggle follow",
    };
  }
}

export async function getUserFollowers(
  user_id: string,
  supabaseClient?: SupabaseClient,
): Promise<DataResponse<User[]>> {
  try {
    const supabase = supabaseClient || (await createClient());

    const { data, error } = await supabase
      .from("follows")
      // TODO: remove the * when table is finalized
      .select(`
    users:follower_id (
          *
    )
  `)
      .eq("following_id", user_id)
      .overrideTypes<User[]>();

    if (error) {
      return { success: false, error: error.message };
    }
    return {
      success: true,
      data:
        (data as unknown as { users: User }[])
          .map((row) => row.users)
          .map((user) => mapUserWithAvatarUrl(user, supabase))
          .filter(Boolean) || [],
    };
  } catch (error) {
    console.error(`error in getfollowers ${error}`);
  }

  return {
    success: false,
    error: `Failed to get user followers`,
  };
}

export async function getUserFollowing(
  user_id: string,
  supabaseClient?: SupabaseClient,
): Promise<DataResponse<User[]>> {
  const supabase = supabaseClient || (await createClient());
  try {
    const { data, error } = await supabase
      .from("follows")
      // TODO: remove the * when table is finalized
      .select(`
    users:following_id (
          *
    )
  `)
      .eq("follower_id", user_id)
      .overrideTypes<User[]>();

    if (error) {
      return { success: false, error: error.message };
    }
    return {
      success: true,
      data:
        (data as unknown as { users: User }[])
          .map((row) => row.users)
          .map((user) => mapUserWithAvatarUrl(user, supabase))
          .filter(Boolean) || [],
    };
  } catch (error) {
    console.error(`error in getfollowers ${error}`);
  }

  return {
    success: false,
    error: `Failed to get user followers`,
  };
}

export async function getUserFriends(
  user_id: string,
  supabaseClient?: SupabaseClient,
): Promise<DataResponse<User[]>> {
  const supabase = supabaseClient || await createClient();

  try {
    const { data, error } = await supabase
      // TODO: remove the * when table is finalized
      .from('friends').select(` friend_id, users:friend_id (*) `).eq('user_id', user_id);
    if (error) {
      return { success: false, error: error.message }
    }

    return {
      success: true,
      data:
        (data as unknown as { users: User }[])
          .map((row) => row.users)
          .map((user) => mapUserWithAvatarUrl(user, supabase))
          .filter(Boolean) || [],
    }

  } catch (error) {
    console.error(`error in getUserFriends ${error}`)
  }
  return {
    success: false,
    error: `Failed to get friends list`
  }
}
