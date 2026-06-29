"use server"

import { createClient } from "@/supabase/server";

type SkillActionResponse = {
    success: boolean;
    error?: string;
}

type GetSkillsResponse = {
    success: boolean;
    error?: string;
    skills?: { skill_id: string }[];
}

export async function addSkillToUserAction(skillID: string): Promise<SkillActionResponse>
{
    if (!skillID)
    {
        return { success: false, error: "A skill ID is required to add a skill" };
    }

    const supabase = await createClient();
    const { data: authData } = await supabase.auth.getUser();

    if (!authData.user)
    {
        return { success: false, error: "Authentication required" };
    }

    const { error } = await supabase.from("profile_skills").upsert({ profile_user_id: authData.user.id, skill_id: skillID }, { onConflict: "profile_user_id,skill_id", ignoreDuplicates: true },);

    if (error)
    {
        return { success: false, error: error.message };
    }

    return { success: true };
}

export async function deleteSkillFromUserAction(skillID: string): Promise<SkillActionResponse>
{
    if (!skillID)
    {
        return { success: false, error: "A skill ID is required to remove a skill" };
    }

    const supabase = await createClient();
    const { data: authData } = await supabase.auth.getUser();

    if (!authData.user)
    {
        return { success: false, error: "Authentication required" };
    }

    const { error } = await supabase.from("profile_skills").delete().eq("profile_user_id", authData.user.id).eq("skill_id", skillID);

    if (error)
    {
        return { success: false, error: error.message };
    }

    return { success: true };
}

export async function getUserSkillsAction(userID: string): Promise<GetSkillsResponse>
{
    if (!userID)
    {
        return { success: false, error: "A user ID is required to get the skills of a user" };
    }

    const supabase = await createClient();

    const { data, error } = await supabase.from("profile_skills").select("skill_id").eq("profile_user_id", userID);

    if (error)
    {
        return { success: false, error: error.message };
    }

    return { success: true, skills: data };
}
