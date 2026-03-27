"use server";

import { revalidatePath } from "next/cache";
import { z } from "zod";
import { createClient } from "@/supabase/server";
import {
  banUserSchema,
  deleteReportedPostSchema,
  dismissReportSchema,
  reportListLimitSchema,
} from "@/lib/validations/moderation";

export interface ModerationReportItem {
  reportId: number;
  createdAt: string;
  status: string | null;
  type: string | null;
  additionalContext: string | null;
  postId: number;
  commentId: number | null;
  reporterId: string | null;
  reportedUserId: string | null;
  reporterName: string | null;
  reportedUserName: string | null;
  postText: string | null;
  commentText: string | null;
  postMediaUrl: string | null;
}

async function requireModerator() {
  const supabase = await createClient();
  const { data: authData } = await supabase.auth.getUser();

  if (!authData.user) {
    return { success: false as const, error: "Authentication required" };
  }

  const currentUserId = authData.user.id;

  const { data: moderatorRow, error: moderatorError } = await supabase
    .from("moderators")
    .select("user_id")
    .eq("user_id", currentUserId)
    .maybeSingle();

  if (moderatorError) {
    return { success: false as const, error: moderatorError.message };
  }

  if (moderatorRow) {
    return { success: true as const, supabase, userId: currentUserId };
  }

  return { success: false as const, error: "Moderator access required" };
}

export async function canAccessModerationAction(): Promise<{ success: true; data: { isModerator: boolean } } | { success: false; error: string }> {
  const gate = await requireModerator();
  if (!gate.success) {
    if (gate.error === "Moderator access required") {
      return { success: true, data: { isModerator: false } };
    }

    return { success: false, error: gate.error };
  }

  return { success: true, data: { isModerator: true } };
}

export async function getModerationReportsAction(
  limit = 20,
): Promise<{ success: true; data: ModerationReportItem[] } | { success: false; error: string }> {
  try {
    const parsedLimit = reportListLimitSchema.parse(limit);
    const gate = await requireModerator();

    if (!gate.success) {
      return { success: false, error: gate.error };
    }

    const { supabase } = gate;
    const { data, error } = await supabase
      .from("feed_report")
      .select(
        `
				report_id,
				created_at,
				status,
				type,
				additional_context,
				post_id,
				comment_id,
				reporter_id,
				reported_id,
				reporter:reporter_id(first_name, last_name)
			`,
      )
      .order("created_at", { ascending: false })
      .limit(parsedLimit);

    if (error) {
      return { success: false, error: error.message };
    }

    const unresolvedRows = (data || []).filter((row: any) => {
      if (row.status == null) return true;
      return String(row.status).trim() === "";
    });

    const reportedUserIds = Array.from(
      new Set(
        unresolvedRows
          .map((row: any) => row.reported_id)
          .filter((id: string | null) => Boolean(id)),
      ),
    ) as string[];

    const postIds = Array.from(
      new Set(unresolvedRows.map((row: any) => row.post_id).filter((id: number | null) => Boolean(id))),
    ) as number[];
    const commentIds = Array.from(
      new Set(unresolvedRows.map((row: any) => row.comment_id).filter((id: number | null) => Boolean(id))),
    ) as number[];

    const reportedUserMap = new Map<string, string>();
    const postMap = new Map<number, { text: string | null; media_path: string | null }>();
    const commentMap = new Map<number, { text: string | null }>();

    if (reportedUserIds.length > 0) {
      const { data: reportedUsers, error: reportedUsersError } = await supabase
        .from("users")
        .select("user_id, first_name, last_name")
        .in("user_id", reportedUserIds);

      if (reportedUsersError) {
        return { success: false, error: reportedUsersError.message };
      }

      for (const user of reportedUsers || []) {
        reportedUserMap.set(
          user.user_id,
          `${user.first_name ?? ""} ${user.last_name ?? ""}`.trim(),
        );
      }
    }

    if (postIds.length > 0) {
      const { data: postsData, error: postsError } = await supabase
        .from("posts")
        .select("post_id, text, media_path")
        .in("post_id", postIds);

      if (postsError) {
        return { success: false, error: postsError.message };
      }

      for (const post of postsData || []) {
        postMap.set(post.post_id, {
          text: post.text ?? null,
          media_path: post.media_path ?? null,
        });
      }
    }

    if (commentIds.length > 0) {
      const { data: commentsData, error: commentsError } = await supabase
        .from("comment")
        .select("comment_id, text")
        .in("comment_id", commentIds);

      if (commentsError) {
        return { success: false, error: commentsError.message };
      }

      for (const comment of commentsData || []) {
        commentMap.set(comment.comment_id, {
          text: comment.text ?? null,
        });
      }
    }

    const reports: ModerationReportItem[] = unresolvedRows.map((row: any) => {
      const reporterName = row.reporter
        ? `${row.reporter.first_name ?? ""} ${row.reporter.last_name ?? ""}`.trim()
        : null;
      const reportedUserName = row.reported_id
        ? reportedUserMap.get(row.reported_id) ?? null
        : null;

      return {
        reportId: row.report_id,
        createdAt: row.created_at,
        status: row.status,
        type: row.type,
        additionalContext: row.additional_context,
        postId: row.post_id,
        commentId: row.comment_id,
        reporterId: row.reporter_id,
        reportedUserId: row.reported_id,
        reporterName: reporterName || null,
        reportedUserName: reportedUserName || null,
        postText: postMap.get(row.post_id)?.text ?? null,
        commentText: row.comment_id ? (commentMap.get(row.comment_id)?.text ?? null) : null,
        postMediaUrl: postMap.get(row.post_id)?.media_path
          ? supabase.storage
            .from("post_images")
            .getPublicUrl(postMap.get(row.post_id)?.media_path as string).data.publicUrl
          : null,
      };
    });

    return { success: true, data: reports };
  } catch (error) {
    if (error instanceof z.ZodError) {
      return {
        success: false,
        error: error.issues[0]?.message ?? "Validation failed",
      };
    }
    return { success: false, error: "Failed to fetch moderation reports" };
  }
}

export async function dismissReportAction(formData: FormData): Promise<void> {
  const reportId = formData.get("reportId");

  try {
    const parsed = dismissReportSchema.parse({ reportId });
    const gate = await requireModerator();

    if (!gate.success) {
      console.error(gate.error);
      return;
    }

    const { supabase } = gate;

    const { error } = await supabase
      .from("feed_report")
      .update({ status: "dismissed" })
      .eq("report_id", parsed.reportId);

    if (error) {
      console.error(error.message);
      return;
    }

    revalidatePath("/moderation");
  } catch (error) {
    if (error instanceof z.ZodError) {
      console.error(error.issues[0]?.message ?? "Validation failed");
      return;
    }
    console.error("Failed to dismiss report");
  }
}

export async function deleteReportedPostAction(formData: FormData): Promise<void> {
  const reportId = formData.get("reportId");
  const postId = formData.get("postId");
  const commentId = formData.get("commentId");

  try {
    const parsed = deleteReportedPostSchema.parse({
      reportId,
      postId,
      commentId: commentId == null || commentId === "" ? undefined : commentId,
    });
    const gate = await requireModerator();

    if (!gate.success) {
      console.error(gate.error);
      return;
    }

    const { supabase } = gate;

    if (parsed.commentId) {
      const { error: takedownCommentError } = await supabase
        .from("comment")
        .update({ taken_down: true })
        .eq("comment_id", parsed.commentId);

      if (takedownCommentError) {
        console.error(takedownCommentError.message);
        return;
      }

      const { error: resolveCommentReportError } = await supabase
        .from("feed_report")
        .update({ status: "taken down" })
        .eq("report_id", parsed.reportId);

      if (resolveCommentReportError) {
        console.error(resolveCommentReportError.message);
        return;
      }

      revalidatePath("/moderation");
      return;
    }

    const { error: takedownPostError } = await supabase
      .from("posts")
      .update({ taken_down: true })
      .eq("post_id", parsed.postId);

    if (takedownPostError) {
      console.error(takedownPostError.message);
      return;
    }

    const { error: resolveReportError } = await supabase
      .from("feed_report")
      .update({ status: "taken down" })
      .eq("report_id", parsed.reportId);

    if (resolveReportError) {
      console.error(resolveReportError.message);
      return;
    }

    revalidatePath("/moderation");
  } catch (error) {
    if (error instanceof z.ZodError) {
      console.error(error.issues[0]?.message ?? "Validation failed");
      return;
    }
    console.error("Failed to delete reported post");
  }
}

export async function banUserAction(formData: FormData): Promise<void> {
  const reportedUserId = formData.get("reportedUserId");
  const reportId = formData.get("reportId");

  try {
    const parsed = banUserSchema.parse({
      reportedUserId,
      reportId: reportId == null || reportId === "" ? undefined : reportId,
    });
    const gate = await requireModerator();

    if (!gate.success) {
      console.error(gate.error);
      return;
    }

    const { supabase, userId } = gate;

    const { error: banError } = await supabase
      .from("users")
      .update({
        is_banned: true,
        banned_at: new Date().toISOString(),
        banned_by: userId,
      })
      .eq("user_id", parsed.reportedUserId);

    if (banError) {
      console.error(banError.message);
      return;
    }

    if (parsed.reportId) {
      const { data: reportRow, error: reportRowError } = await supabase
        .from("feed_report")
        .select("post_id, comment_id")
        .eq("report_id", parsed.reportId)
        .maybeSingle();

      if (reportRowError) {
        console.error(reportRowError.message);
        return;
      }

      if (reportRow?.comment_id) {
        const { error: takedownCommentError } = await supabase
          .from("comment")
          .update({ taken_down: true })
          .eq("comment_id", reportRow.comment_id);

        if (takedownCommentError) {
          console.error(takedownCommentError.message);
          return;
        }
      } else if (reportRow?.post_id) {
        const { error: takedownPostError } = await supabase
          .from("posts")
          .update({ taken_down: true })
          .eq("post_id", reportRow.post_id);

        if (takedownPostError) {
          console.error(takedownPostError.message);
          return;
        }
      }

      const { error: resolveError } = await supabase
        .from("feed_report")
        .update({ status: "banned" })
        .eq("report_id", parsed.reportId);

      if (resolveError) {
        console.error(resolveError.message);
        return;
      }
    }

    revalidatePath("/moderation");
  } catch (error) {
    if (error instanceof z.ZodError) {
      console.error(error.issues[0]?.message ?? "Validation failed");
      return;
    }
    console.error("Failed to ban user");
  }
}

// ─── User Report types & actions ──────────────────────────────────────────────

export interface UserModerationReportItem {
  reportId: number;
  createdAt: string;
  status: string | null;
  type: string | null;
  additionalContext: string | null;
  reporterId: string | null;
  reportedUserId: string | null;
  reporterName: string | null;
  reportedUserName: string | null;
}

async function fetchUserNameMap(
  supabase: Awaited<ReturnType<typeof createClient>>,
  userIds: string[],
): Promise<Map<string, string>> {
  const map = new Map<string, string>();
  if (userIds.length === 0) return map;
  const { data } = await supabase
    .from("users")
    .select("user_id, first_name, last_name")
    .in("user_id", userIds);
  for (const user of data || []) {
    map.set(user.user_id, `${user.first_name ?? ""} ${user.last_name ?? ""}`.trim());
  }
  return map;
}

export async function getUserReportsAction(
  limit = 20,
): Promise<{ success: true; data: UserModerationReportItem[] } | { success: false; error: string }> {
  try {
    const parsedLimit = reportListLimitSchema.parse(limit);
    const gate = await requireModerator();
    if (!gate.success) return { success: false, error: gate.error };

    const { supabase } = gate;
    const { data, error } = await supabase
      .from("user_report")
      .select("report_id, created_at, status, type, additional_context, reporter_id, reported_id")
      .order("created_at", { ascending: false })
      .limit(parsedLimit);

    if (error) return { success: false, error: error.message };

    const rows = (data || []).filter(
      (row: any) => row.status == null || String(row.status).trim() === "",
    );

    const userIds = Array.from(
      new Set([
        ...rows.map((r: any) => r.reporter_id).filter(Boolean),
        ...rows.map((r: any) => r.reported_id).filter(Boolean),
      ]),
    ) as string[];

    const userMap = await fetchUserNameMap(supabase, userIds);

    return {
      success: true,
      data: rows.map((row: any) => ({
        reportId: row.report_id,
        createdAt: row.created_at,
        status: row.status,
        type: row.type,
        additionalContext: row.additional_context,
        reporterId: row.reporter_id,
        reportedUserId: row.reported_id,
        reporterName: row.reporter_id ? (userMap.get(row.reporter_id) ?? null) : null,
        reportedUserName: row.reported_id ? (userMap.get(row.reported_id) ?? null) : null,
      })),
    };
  } catch (error) {
    if (error instanceof z.ZodError) {
      return { success: false, error: error.issues[0]?.message ?? "Validation failed" };
    }
    return { success: false, error: "Failed to fetch user reports" };
  }
}

export async function getResolvedFeedReportsAction(
  limit = 100,
): Promise<{ success: true; data: ModerationReportItem[] } | { success: false; error: string }> {
  try {
    const gate = await requireModerator();
    if (!gate.success) return { success: false, error: gate.error };

    const { supabase } = gate;
    const { data, error } = await supabase
      .from("feed_report")
      .select(
        `report_id, created_at, status, type, additional_context,
				post_id, comment_id, reporter_id, reported_id,
				reporter:reporter_id(first_name, last_name)`,
      )
      .not("status", "is", null)
      .neq("status", "")
      .order("created_at", { ascending: false })
      .limit(limit);

    if (error) return { success: false, error: error.message };

    const rows = data || [];
    const reportedUserIds = Array.from(
      new Set(rows.map((r: any) => r.reported_id).filter(Boolean)),
    ) as string[];
    const postIds = Array.from(
      new Set(rows.map((r: any) => r.post_id).filter(Boolean)),
    ) as number[];
    const commentIds = Array.from(
      new Set(rows.map((r: any) => r.comment_id).filter(Boolean)),
    ) as number[];

    const reportedUserMap = await fetchUserNameMap(supabase, reportedUserIds);
    const postMap = new Map<number, { text: string | null; media_path: string | null }>();
    const commentMap = new Map<number, { text: string | null }>();

    if (postIds.length > 0) {
      const { data: postsData } = await supabase
        .from("posts")
        .select("post_id, text, media_path")
        .in("post_id", postIds);
      for (const post of postsData || []) {
        postMap.set(post.post_id, { text: post.text ?? null, media_path: post.media_path ?? null });
      }
    }

    if (commentIds.length > 0) {
      const { data: commentsData } = await supabase
        .from("comment")
        .select("comment_id, text")
        .in("comment_id", commentIds);
      for (const comment of commentsData || []) {
        commentMap.set(comment.comment_id, { text: comment.text ?? null });
      }
    }

    return {
      success: true,
      data: rows.map((row: any) => {
        const reporterName = row.reporter
          ? `${row.reporter.first_name ?? ""} ${row.reporter.last_name ?? ""}`.trim()
          : null;
        return {
          reportId: row.report_id,
          createdAt: row.created_at,
          status: row.status,
          type: row.type,
          additionalContext: row.additional_context,
          postId: row.post_id,
          commentId: row.comment_id,
          reporterId: row.reporter_id,
          reportedUserId: row.reported_id,
          reporterName: reporterName || null,
          reportedUserName: row.reported_id ? (reportedUserMap.get(row.reported_id) ?? null) : null,
          postText: postMap.get(row.post_id)?.text ?? null,
          commentText: row.comment_id ? (commentMap.get(row.comment_id)?.text ?? null) : null,
          postMediaUrl: postMap.get(row.post_id)?.media_path
            ? supabase.storage
              .from("post_images")
              .getPublicUrl(postMap.get(row.post_id)?.media_path as string).data.publicUrl
            : null,
        };
      }),
    };
  } catch {
    return { success: false, error: "Failed to fetch resolved feed reports" };
  }
}

export async function getResolvedUserReportsAction(
  limit = 100,
): Promise<{ success: true; data: UserModerationReportItem[] } | { success: false; error: string }> {
  try {
    const gate = await requireModerator();
    if (!gate.success) return { success: false, error: gate.error };

    const { supabase } = gate;
    const { data, error } = await supabase
      .from("user_report")
      .select("report_id, created_at, status, type, additional_context, reporter_id, reported_id")
      .not("status", "is", null)
      .neq("status", "")
      .order("created_at", { ascending: false })
      .limit(limit);

    if (error) return { success: false, error: error.message };

    const rows = data || [];
    const userIds = Array.from(
      new Set([
        ...rows.map((r: any) => r.reporter_id).filter(Boolean),
        ...rows.map((r: any) => r.reported_id).filter(Boolean),
      ]),
    ) as string[];

    const userMap = await fetchUserNameMap(supabase, userIds);

    return {
      success: true,
      data: rows.map((row: any) => ({
        reportId: row.report_id,
        createdAt: row.created_at,
        status: row.status,
        type: row.type,
        additionalContext: row.additional_context,
        reporterId: row.reporter_id,
        reportedUserId: row.reported_id,
        reporterName: row.reporter_id ? (userMap.get(row.reporter_id) ?? null) : null,
        reportedUserName: row.reported_id ? (userMap.get(row.reported_id) ?? null) : null,
      })),
    };
  } catch {
    return { success: false, error: "Failed to fetch resolved user reports" };
  }
}

export async function dismissUserReportAction(formData: FormData): Promise<void> {
  const reportId = formData.get("reportId");
  try {
    const parsed = dismissReportSchema.parse({ reportId });
    const gate = await requireModerator();
    if (!gate.success) { console.error(gate.error); return; }

    const { supabase } = gate;
    const { error } = await supabase
      .from("user_report")
      .update({ status: "dismissed" })
      .eq("report_id", parsed.reportId);
    if (error) { console.error(error.message); return; }
    revalidatePath("/moderation");
  } catch (error) {
    if (error instanceof z.ZodError) { console.error(error.issues[0]?.message ?? "Validation failed"); return; }
    console.error("Failed to dismiss user report");
  }
}

export async function banUserFromUserReportAction(formData: FormData): Promise<void> {
  const reportedUserId = formData.get("reportedUserId");
  const reportId = formData.get("reportId");
  try {
    const parsed = banUserSchema.parse({
      reportedUserId,
      reportId: reportId == null || reportId === "" ? undefined : reportId,
    });
    const gate = await requireModerator();
    if (!gate.success) { console.error(gate.error); return; }

    const { supabase, userId } = gate;
    const { error: banError } = await supabase
      .from("users")
      .update({ is_banned: true, banned_at: new Date().toISOString(), banned_by: userId })
      .eq("user_id", parsed.reportedUserId);
    if (banError) { console.error(banError.message); return; }

    if (parsed.reportId) {
      const { error: resolveError } = await supabase
        .from("user_report")
        .update({ status: "banned" })
        .eq("report_id", parsed.reportId);
      if (resolveError) { console.error(resolveError.message); return; }
    }
    revalidatePath("/moderation");
  } catch (error) {
    if (error instanceof z.ZodError) { console.error(error.issues[0]?.message ?? "Validation failed"); return; }
    console.error("Failed to ban user from user report");
  }
}
