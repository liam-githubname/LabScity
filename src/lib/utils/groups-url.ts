export type GroupsAppTab = "mine" | "discover";

/**
 * Builds `/groups` with query params the shell understands.
 * Always use `tab=mine` when linking to a specific group so the My groups panel opens.
 */
export function groupsPath(options?: {
  tab?: GroupsAppTab;
  groupId?: number;
}): string {
  const { tab, groupId } = options ?? {};
  const params = new URLSearchParams();
  if (tab === "discover") {
    params.set("tab", "discover");
  } else if (tab === "mine" || groupId != null) {
    params.set("tab", "mine");
  }
  if (groupId != null && tab !== "discover") {
    params.set("group", String(groupId));
  }
  const qs = params.toString();
  return qs ? `/groups?${qs}` : "/groups";
}
