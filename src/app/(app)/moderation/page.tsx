import type { Metadata } from "next";
import { redirect } from "next/navigation";
import { LSModerationReportCard } from "@/components/moderation/ls-moderation-report-card";
import {
  canAccessModerationAction,
  getModerationReportsAction,
} from "@/lib/actions/moderation";

export const metadata: Metadata = {
  title: "Moderation | LabScity",
  description: "Moderator queue for handling user reports.",
};

export default async function ModerationPage() {
  const accessResult = await canAccessModerationAction();

  if (!accessResult.success) {
    return (
      <main className="mx-auto w-full max-w-5xl p-4">
        <h1 className="mb-2 text-2xl font-semibold">Moderation Queue</h1>
        <p className="text-sm text-red-600">{accessResult.error}</p>
      </main>
    );
  }

  if (!accessResult.data.isModerator) {
    redirect("/home");
  }

  const reportsResult = await getModerationReportsAction(25);

  if (!reportsResult.success) {
    return (
      <main className="mx-auto w-full max-w-5xl p-4">
        <h1 className="mb-2 text-2xl font-semibold">Moderation Queue</h1>
        <p className="text-sm text-red-600">{reportsResult.error}</p>
      </main>
    );
  }

  const reports = reportsResult.data;

  return (
    <main className="mx-auto w-full max-w-5xl p-4 sm:p-6">
      <div className="mb-6 rounded-xl border border-zinc-200 bg-white p-5 shadow-sm">
        <h1 className="text-2xl font-semibold">Moderation Queue</h1>
        <p className="mt-2 text-sm text-zinc-500">
          Recent feed reports that moderators can dismiss, remove content for, or escalate by banning users.
        </p>
      </div>

      {reports.length === 0 ? (
        <div className="rounded-xl border border-zinc-200 bg-white p-6 text-sm text-zinc-500 shadow-sm">
          No open reports right now.
        </div>
      ) : (
        <div className="space-y-5">
          {reports.map((report) => (
            <LSModerationReportCard key={report.reportId} report={report} />
          ))}
        </div>
      )}
    </main>
  );
}
