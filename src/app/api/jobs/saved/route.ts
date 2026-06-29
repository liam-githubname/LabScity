import { NextResponse } from "next/server";
import { createClient } from "@/supabase/server";
import type { ApiResponse } from "@/lib/types/api";
import type { Job } from "@/lib/types/data";

// GET /api/jobs/saved
// returns all saved jobs for the authenticated user
export async function GET(request: Request) {
    const supabase = await createClient();

    const { data: authData } = await supabase.auth.getUser();

    if (!authData.user) return NextResponse.json<ApiResponse<Job[]>>(
        { success: false, error: "Authentication required" },
        { status: 401 }
    );

    const { data, error } = await supabase
        .from("saved_jobs")
        .select("jobs(*)")
        .eq("profile_user_id", authData.user.id)
        .returns<{ jobs: Job }[]>();

    if (error) return NextResponse.json<ApiResponse<Job[]>>(
        { success: false, error: error.message },
        { status: 500 }
    );

    return NextResponse.json<ApiResponse<Job[]>>(
        { success: true, data: data.map((row) => row.jobs) }
    );
}
