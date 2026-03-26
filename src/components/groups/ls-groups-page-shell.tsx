"use client";

import { Tabs } from "@mantine/core";
import { useRouter, useSearchParams } from "next/navigation";
import { useCallback, useMemo } from "react";
import type { getGroups, searchPublicGroups } from "@/lib/actions/groups";
import { groupsPath } from "@/lib/utils/groups-url";
import { LSDiscoverGroupsPanel } from "./ls-discover-groups-panel";
import { LSGroupLayout } from "./ls-group-layout";
import type { LSGroupLayoutProps } from "./ls-group-layout.types";

export interface LSGroupsPageShellProps extends LSGroupLayoutProps {
  searchPublicGroupsAction: typeof searchPublicGroups;
  getGroupsAction: typeof getGroups;
}

/**
 * Groups route shell: My groups (existing layout) vs Discover (public search).
 * Tabs are controlled from the URL so client navigations (e.g. join from Discover)
 * can switch to My groups without remounting the route.
 */
export function LSGroupsPageShell({
  searchPublicGroupsAction,
  getGroupsAction,
  ...layoutProps
}: LSGroupsPageShellProps) {
  const router = useRouter();
  const searchParams = useSearchParams();

  const tabValue = useMemo(() => {
    const q = searchParams.get("tab");
    if (q === "discover") return "discover" as const;
    return "mine" as const;
  }, [searchParams]);

  const setTabInUrl = useCallback(
    (next: "mine" | "discover") => {
      if (next === "discover") {
        router.replace(groupsPath({ tab: "discover" }));
        return;
      }
      const groupRaw = searchParams.get("group");
      const gid =
        groupRaw != null &&
        groupRaw !== "" &&
        Number.isFinite(Number(groupRaw)) &&
        Number(groupRaw) > 0
          ? Number(groupRaw)
          : undefined;
      router.replace(groupsPath({ tab: "mine", groupId: gid }));
    },
    [router, searchParams],
  );

  return (
    <Tabs
      value={tabValue}
      onChange={(v) => {
        if (v === "mine" || v === "discover") setTabInUrl(v);
      }}
      color="navy"
      radius="md"
    >
      <Tabs.List grow>
        <Tabs.Tab value="mine">My groups</Tabs.Tab>
        <Tabs.Tab value="discover">Discover</Tabs.Tab>
      </Tabs.List>

      <Tabs.Panel value="mine" pt="md">
        <LSGroupLayout {...layoutProps} />
      </Tabs.Panel>

      <Tabs.Panel value="discover" pt="md">
        <LSDiscoverGroupsPanel
          searchPublicGroupsAction={searchPublicGroupsAction}
          joinGroupAction={layoutProps.joinGroupAction}
          getGroupsAction={getGroupsAction}
        />
      </Tabs.Panel>
    </Tabs>
  );
}
