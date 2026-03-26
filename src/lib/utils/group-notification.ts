/**
 * Extracts a numeric group id from notification `link` values such as
 * `/groups?group=12` (app) or `/groups/12` (DB trigger).
 */
export function parseGroupIdFromNotificationLink(
  link: string | null | undefined,
): number | null {
  if (!link) return null;
  const fromQuery = /[?&]group=(\d+)/.exec(link);
  if (fromQuery) {
    const n = Number(fromQuery[1]);
    return Number.isFinite(n) ? n : null;
  }
  const fromPath = /\/groups\/(\d+)(?:\/|$|\?)/.exec(link);
  if (fromPath) {
    const n = Number(fromPath[1]);
    return Number.isFinite(n) ? n : null;
  }
  return null;
}
