"use server";

import type { SupabaseClient } from "@supabase/supabase-js";
import { z } from "zod";
import type { User } from "@/lib/types/feed";
import { createClient } from "@/supabase/server";
import type { DataResponse } from "../types/data";
import {
  updateProfileSchema,
  toggleFollowSchema,
  createUserReportSchema,
  type UpdateProfileValues,
  type ToggleFollowValues,
  type CreateUserReportValues,
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

/** Shape returned by Supabase join queries on follows/friends with `users:... (*)`. */
interface UserJoinResult {
  users: User | null;
}

/**
 * Builds public storage URLs for avatar and profile header from path columns.
 * Uses profilePictureBucket for avatar and profileHeaderBucket for header (not profilePictureBucket).
 *
 * @param user - User row with profile_pic_path and/or profile_header_path.
 * @param supabase - Supabase client for storage.getPublicUrl.
 * @returns User with avatar_url and profile_header_url set.
 */
function mapUserWithAvatarUrl(user: User, supabase: SupabaseClient): User {
  const avatarUrl = user.profile_pic_path
    ? supabase.storage.from(profilePictureBucket).getPublicUrl(user.profile_pic_path).data.publicUrl
    : null;
  const profileHeaderUrl = user.profile_header_path
    ? supabase.storage.from(profileHeaderBucket).getPublicUrl(user.profile_header_path).data.publicUrl
    : null;

  return { ...user, avatar_url: avatarUrl, profile_header_url: profileHeaderUrl };
}

/**
 * Creates a signed upload URL for the authenticated user's profile picture.
 *
 * @param contentType - MIME type (image/jpeg, image/png, image/webp, image/gif).
 * @param supabaseClient - Optional Supabase client (e.g. for tests).
 * @returns On success: { success: true, data: { bucket, path, token, maxBytes } }. On failure: { success: false, error }.
 */
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

/**
 * Persists the profile picture path for the authenticated user after client upload.
 * Validates path, checks auth, updates public.users, removes previous file from storage if replaced.
 *
 * @param profilePicPath - Storage path returned from createProfilePictureUploadUrl (must be under user id).
 * @param supabaseClient - Optional Supabase client (e.g. for tests).
 * @returns On success: { success: true, data: { profilePicPath, avatarUrl } }. On failure: { success: false, error }.
 */
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

/**
 * Creates a signed upload URL for the authenticated user's profile header (banner).
 * Same flow as profile picture but uses profileHeaderBucket and a header- prefixed path.
 *
 * @param contentType - MIME type (image/jpeg, image/png, image/webp, image/gif).
 * @param supabaseClient - Optional Supabase client (e.g. for tests).
 * @returns On success: { success: true, data: { bucket, path, token, maxBytes } }. On failure: { success: false, error }.
 */
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

/**
 * Persists the profile header (banner) path for the authenticated user after client upload.
 * Validates path, checks auth, updates public.profile.header_pic_path, removes previous file from storage if replaced.
 *
 * @param profileHeaderPath - Storage path returned from createProfileHeaderUploadUrl (must be under user id).
 * @param supabaseClient - Optional Supabase client (e.g. for tests).
 * @returns On success: { success: true, data: { profileHeaderPath, profileHeaderUrl } }. On failure: { success: false, error }.
 */
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

/** Normalize optional string to null when empty for DB storage. */
function emptyToNull(s: string | undefined): string | null {
  if (s === undefined || s === "") return null;
  return s;
}

/**
 * Updates the authenticated user's profile and display name.
 *
 * 1. Validates `input` against `updateProfileSchema`.
 * 2. Checks authentication via `supabase.auth.getUser()`.
 * 3. Upserts `about`, `workplace`, `occupation`, and `skill` into `public.profile`
 *    (keyed on `user_id`). Empty strings are normalised to `null`.
 * 4. Updates `first_name` and `last_name` in `public.users`.
 *
 * @param input           - Form values conforming to {@link UpdateProfileValues}.
 * @param supabaseClient  - Optional pre-built Supabase client (used in tests).
 * @returns `{ success: true }` on success, or `{ success: false, error: string }`.
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
      skill: validated.skill.length ? validated.skill : null,
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
 * Toggles the follow relationship between the authenticated user and
 * `targetUserId` in `public.follows`.
 *
 * - If a row `(follower_id = currentUser, following_id = target)` exists,
 *   it is deleted (unfollow).
 * - Otherwise a new row is inserted (follow).
 *
 * The client uses optimistic cache updates; on success the returned
 * `isFollowing` flag tells the UI the authoritative state.
 *
 * @param input           - `{ targetUserId }` validated by `toggleFollowSchema`.
 * @param supabaseClient  - Optional pre-built Supabase client (used in tests).
 * @returns `{ success: true, data: { isFollowing: boolean } }` on success,
 *          or `{ success: false, error: string }`.
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
      const first = err.issues[0];
      return {
        success: false,
        error: first?.message ?? "Validation failed",
      };
    }
    return {
      success: false,
      error: err instanceof Error ? err.message : "Failed to update follow state",
    };
  }
}

/**
 * Fetches users who follow the given user. Returns User[] with avatar_url and profile_header_url
 * resolved via profilePictureBucket and profileHeaderBucket (mapUserWithAvatarUrl).
 *
 * @param user_id - The user whose followers to fetch (following_id in follows).
 * @param supabaseClient - Optional Supabase client (e.g. for tests).
 * @returns DataResponse with array of User objects.
 */
export async function getUserFollowers(
  user_id: string,
  supabaseClient?: SupabaseClient,
): Promise<DataResponse<User[]>> {
  try {
    const supabase = supabaseClient || (await createClient());

    const { data, error } = await supabase
      .from("follows")
      .select(`
    users:follower_id (
          *
    )
  `)
      .eq("following_id", user_id)
      .overrideTypes<UserJoinResult[]>();

    if (error) {
      return { success: false, error: error.message };
    }
    return {
      success: true,
      data: data
        .map((row) => row.users)
        .filter((u): u is User => u !== null)
        .map((user) => mapUserWithAvatarUrl(user, supabase)),
    };
  } catch (error) {
    console.error(`error in getfollowers ${error}`);
  }

  return {
    success: false,
    error: `Failed to get user followers`,
  };
}

/**
 * Fetches users that the given user follows. Returns User[] with avatar_url and profile_header_url
 * resolved via mapUserWithAvatarUrl (profileHeaderBucket for header, not profilePictureBucket).
 *
 * @param user_id - The user whose following list to fetch (follower_id in follows).
 * @param supabaseClient - Optional Supabase client (e.g. for tests).
 * @returns DataResponse with array of User objects.
 */
export async function getUserFollowing(
  user_id: string,
  supabaseClient?: SupabaseClient,
): Promise<DataResponse<User[]>> {
  const supabase = supabaseClient || (await createClient());
  try {
    const { data, error } = await supabase
      .from("follows")
      .select(`
    users:following_id (
          *
    )
  `)
      .eq("follower_id", user_id)
      .overrideTypes<UserJoinResult[]>();

    if (error) {
      return { success: false, error: error.message };
    }
    return {
      success: true,
      data: data
        .map((row) => row.users)
        .filter((u): u is User => u !== null)
        .map((user) => mapUserWithAvatarUrl(user, supabase)),
    };
  } catch (error) {
    console.error(`error in getfollowers ${error}`);
  }

  return {
    success: false,
    error: `Failed to get user followers`,
  };
}

/**
 * Fetches the given user's friends. Returns User[] with avatar_url and profile_header_url
 * resolved via mapUserWithAvatarUrl.
 *
 * @param user_id - The user whose friends list to fetch.
 * @param supabaseClient - Optional Supabase client (e.g. for tests).
 * @returns DataResponse with array of User objects.
 */
export async function getUserFriends(
  user_id: string,
  supabaseClient?: SupabaseClient,
): Promise<DataResponse<User[]>> {
  const supabase = supabaseClient || await createClient();

  try {
    const { data, error } = await supabase
      .from('friends')
      .select(` friend_id, users:friend_id (*) `)
      .eq('user_id', user_id)
      .overrideTypes<UserJoinResult[]>();

    if (error) {
      return { success: false, error: error.message };
    }

    return {
      success: true,
      data: data
        .map((row) => row.users)
        .filter((u): u is User => u !== null)
        .map((user) => mapUserWithAvatarUrl(user, supabase)),
    };

  } catch (error) {
    console.error(`error in getUserFriends ${error}`)
  }
  return {
    success: false,
    error: `Failed to get friends list`
  }
}

/**
 * Create a report for a user. The user must be authenticated to submit a report.
 * Reports are stored in a user_report table for moderators to review.
 *
 * @param targetUserId - The ID of the user being reported
 * @param values - Object containing the report type and reason
 * @param supabaseClient - Optional Supabase client instance (used for testing)
 * @returns Promise resolving to DataResponse with success status or error message
 *
 * @example
 * ```typescript
 * const result = await createUserReport("user-id", { type: "Impersonation", reason: "This is not who they claim to be" });
 * if (result.success) {
 *   console.log("Report submitted successfully");
 * }
 * ```
 */
export async function createUserReport(
  targetUserId: string,
  values: CreateUserReportValues,
  supabaseClient?: SupabaseClient,
): Promise<{ success: boolean; error?: string }> {
  try {
    const targetIdSchema = z.string().uuid("A valid user ID is required");
    targetIdSchema.parse(targetUserId);
    const parsed = createUserReportSchema.parse(values);

    const supabase = supabaseClient || (await createClient());
    const { data: authData } = await supabase.auth.getUser();

    if (!authData.user) {
      return { success: false, error: "Authentication required" };
    }

    if (authData.user.id === targetUserId) {
      return { success: false, error: "You cannot report yourself" };
    }

    const { error } = await supabase
      .from("user_report")
      .insert({
        reporter_id: authData.user.id,
         reported_id: targetUserId,
        type: parsed.type,
        additional_context: parsed.reason,
      });

    if (error) {
      return { success: false, error: error.message };
    }

    return { success: true };
  } catch (error) {
    if (error instanceof z.ZodError) {
      return {
        success: false,
        error: error.issues[0]?.message ?? "Validation failed",
      };
    }
    return { success: false, error: "Failed to submit report" };
  }
}
