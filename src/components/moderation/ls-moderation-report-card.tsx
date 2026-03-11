import {
  banUserAction,
  deleteReportedPostAction,
  dismissReportAction,
  type ModerationReportItem,
} from "@/lib/actions/moderation";

interface LSModerationReportCardProps {
  report: ModerationReportItem;
}

export function LSModerationReportCard({ report }: LSModerationReportCardProps) {
  return (
    <article className="rounded-xl border border-zinc-200 bg-white p-5 shadow-sm">
      <div className="mb-4 flex flex-wrap items-center gap-2 text-sm">
        <span className="rounded-full border border-zinc-300 bg-zinc-50 px-2.5 py-1 font-medium text-zinc-700">
          {report.type ?? "Unspecified"}
        </span>
        {report.commentId ? (
          <span className="rounded-full border border-zinc-300 bg-zinc-50 px-2.5 py-1 text-zinc-600">
            Comment Report
          </span>
        ) : null}
      </div>

      <div className="mb-4 grid gap-1.5 text-sm text-zinc-700">
        <p>
          <span className="font-medium text-zinc-900">Reporter:</span>{" "}
          {report.reporterName ?? report.reporterId ?? "Unknown"}
        </p>
        <p>
          <span className="font-medium text-zinc-900">Reported user:</span>{" "}
          {report.reportedUserName ?? report.reportedUserId ?? "Unknown"}
        </p>
        <p>
          <span className="font-medium text-zinc-900">Created:</span>{" "}
          {new Date(report.createdAt).toLocaleString()}
        </p>
        <p>
          <span className="font-medium text-zinc-900">Post text:</span>{" "}
          {report.postText ?? "[No post text found]"}
        </p>
        <p>
          <span className="font-medium text-zinc-900">Context:</span>{" "}
          {report.additionalContext ?? "None provided"}
        </p>
      </div>

      {report.postMediaUrl ? (
        <div className="mb-4 overflow-hidden rounded-lg border border-zinc-200 bg-zinc-50">
          <img
            src={report.postMediaUrl}
            alt="Reported post media"
            className="max-h-80 w-full object-cover"
          />
        </div>
      ) : null}

      <div className="flex flex-wrap gap-2">
        <form action={dismissReportAction}>
          <input type="hidden" name="reportId" value={report.reportId} />
          <button
            type="submit"
            className="rounded-md border border-zinc-300 bg-white px-3 py-2 text-sm font-medium text-zinc-800 hover:bg-zinc-100"
          >
            Mark Unsubstantial (Dismiss)
          </button>
        </form>

        <form action={deleteReportedPostAction}>
          <input type="hidden" name="reportId" value={report.reportId} />
          <input type="hidden" name="postId" value={report.postId} />
          <button
            type="submit"
            className="rounded-md border border-red-300 bg-white px-3 py-2 text-sm font-medium text-red-700 hover:bg-red-50"
          >
            Delete Post
          </button>
        </form>

        {report.reportedUserId ? (
          <form action={banUserAction}>
            <input type="hidden" name="reportId" value={report.reportId} />
            <input type="hidden" name="reportedUserId" value={report.reportedUserId} />
            <button
              type="submit"
              className="rounded-md border border-red-500 bg-red-50 px-3 py-2 text-sm font-medium text-red-800 hover:bg-red-100"
            >
              Ban User
            </button>
          </form>
        ) : null}
      </div>
    </article>
  );
}
