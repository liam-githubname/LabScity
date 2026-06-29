import { NextResponse } from "next/server";
import { createClient } from "@/supabase/server";

export async function POST(request: Request) {
  const { skills } = await request.json();

  if(skills == null || skills.length == 0)
  {
    return NextResponse.json(
        { error: "skill ids missing"},
        { status: 400}
    );
  }

  const supabase = await createClient();

  const { data: skillRows, error: skillError} = await supabase.from("profile_skills").select("profile_user_id").in("skill_id", skills);

  if(skillError)
  {
    return NextResponse.json(
        { error: skillError.message },
        { status: 500}
    );
  }

  const userSkillCount: Record<string, number> = {};

  for(const row of skillRows as { profile_user_id: string }[])
  {
    userSkillCount[row.profile_user_id] = (userSkillCount[row.profile_user_id] ?? 0) + 1;
  }

  const sortedUsers = Object.entries(userSkillCount).sort((a, b) => b[1] - a[1]).map(([profile_user_id, count]) => ({ profile_user_id, skills_found: count }));

  return NextResponse.json({ ok: true, users: sortedUsers });
}