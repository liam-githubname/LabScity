import { NextResponse } from "next/server";
import { createClient } from "@/supabase/server";
import type { ApiResponse } from "@/lib/types/api";
import type { Job } from "@/lib/types/data";

// GET /api/jobs/[id]
// returns a single job by id
export async function GET(_request: Request, { params }: { params: Promise<{ id: string }> })
{
    const { id: rawId } = await params;
    const id = Number(rawId);

    if (isNaN(id)) 
        return NextResponse.json<ApiResponse<Job>>({ success: false, error: "Invalid job id" }, { status: 400 });

    const supabase = await createClient();

    const { data, error } = await supabase.from("jobs").select("*").eq("id", id).single();

    if (error) 
        return NextResponse.json<ApiResponse<Job>>({ success: false, error: error.message }, { status: 500 });

    return NextResponse.json<ApiResponse<Job>>({ success: true, data });
}
