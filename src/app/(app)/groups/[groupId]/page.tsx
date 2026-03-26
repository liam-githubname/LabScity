import { redirect } from "next/navigation";

interface GroupIdRedirectPageProps {
  params: Promise<{ groupId: string }>;
}

/**
 * Normalizes `/groups/:id` (e.g. from DB notification links) to the main
 * groups UI at `/groups?tab=mine&group=:id`.
 */
export default async function GroupIdRedirectPage({
  params,
}: GroupIdRedirectPageProps) {
  const { groupId } = await params;
  const id = Number(groupId);
  if (!Number.isFinite(id) || id <= 0) {
    redirect("/groups");
  }
  redirect(`/groups?tab=mine&group=${id}`);
}
