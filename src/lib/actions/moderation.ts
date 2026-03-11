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

		const reportedUserMap = new Map<string, string>();
		const postMap = new Map<number, { text: string | null; media_path: string | null }>();

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

	try {
		const parsed = deleteReportedPostSchema.parse({ reportId, postId });
		const gate = await requireModerator();

		if (!gate.success) {
			console.error(gate.error);
			return;
		}

		const { supabase } = gate;

		const { data: postData, error: postDataError } = await supabase
			.from("posts")
			.select("media_path")
			.eq("post_id", parsed.postId)
			.maybeSingle();

		if (postDataError) {
			console.error(postDataError.message);
			return;
		}

		if (postData?.media_path) {
			await supabase.storage.from("post_images").remove([postData.media_path]);
		}

		const { error: deletePostError } = await supabase
			.from("posts")
			.delete()
			.eq("post_id", parsed.postId);

		if (deletePostError) {
			console.error(deletePostError.message);
			return;
		}

		const { error: resolveReportError } = await supabase
			.from("feed_report")
			.update({ status: "deleted" })
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
