"use client";

import { Box, Flex, Stack } from "@mantine/core";
import { useIsMobile } from "@/app/use-is-mobile";
import { LSPopularGroupsHomeStrip } from "@/components/groups/ls-popular-groups-home-strip";
import { TrendingWidget } from "@/components/sidebar/trending-widget";
import type {
  getGroups,
  joinGroup,
  searchPublicGroups,
} from "@/lib/actions/groups";

export type HomePopularGroupsActions = {
  searchPublicGroupsAction: typeof searchPublicGroups;
  joinGroupAction: typeof joinGroup;
  getGroupsAction: typeof getGroups;
};

/** Keep in sync with `LSAppTopBar` (`topBarSize`). */
const APP_TOP_BAR_PX = 60;

export function HomeLayoutClient({
  children,
  popularGroupsActions,
}: {
  children: React.ReactNode;
  popularGroupsActions?: HomePopularGroupsActions;
}) {
  const isMobile = useIsMobile();

  const sidebarStyle = isMobile
    ? {
        alignSelf: "stretch" as const,
        minWidth: 0,
        maxWidth: "100%",
      }
    : {
        position: "sticky" as const,
        top: "1rem",
        alignSelf: "flex-start" as const,
        minWidth: 0,
        maxWidth: "100%",
        maxHeight: `calc(100dvh - ${APP_TOP_BAR_PX}px - 1rem)`,
        overflowY: "auto" as const,
        overscrollBehavior: "contain" as const,
      };

  return (
    <Box mih="100vh" bg="gray.0">
      <Box maw={1080} mx="auto" p="md">
        <Flex
          direction={isMobile ? "column-reverse" : "row"}
          gap="lg"
          align="flex-start"
          w="100%"
          maw="100%"
        >
          {/* miw={0} so the feed column can shrink; avoids stealing width from the sticky sidebar */}
          <Flex flex={6} miw={0} maw="100%">
            {children}
          </Flex>

          <Flex
            flex={4}
            {...(isMobile && { miw: "100%" })}
            style={sidebarStyle}
          >
            <Stack gap="lg" w="100%" maw="100%" style={{ minWidth: 0 }}>
              <TrendingWidget />
              {popularGroupsActions ? (
                <LSPopularGroupsHomeStrip
                  searchPublicGroupsAction={
                    popularGroupsActions.searchPublicGroupsAction
                  }
                  joinGroupAction={popularGroupsActions.joinGroupAction}
                  getGroupsAction={popularGroupsActions.getGroupsAction}
                />
              ) : null}
            </Stack>
          </Flex>
        </Flex>
      </Box>
    </Box>
  );
}
