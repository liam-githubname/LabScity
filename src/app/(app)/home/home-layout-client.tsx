"use client";

import { Box, Flex, Stack } from "@mantine/core";
import { useIsMobile } from "@/app/use-is-mobile";
import { LSPopularGroupsHomeStrip } from "@/components/groups/ls-popular-groups-home-strip";
import { TrendingWidget } from "@/components/sidebar/trending-widget";
import type { getGroups, joinGroup, searchPublicGroups } from "@/lib/actions/groups";

export type HomePopularGroupsActions = {
  searchPublicGroupsAction: typeof searchPublicGroups;
  joinGroupAction: typeof joinGroup;
  getGroupsAction: typeof getGroups;
};

export function HomeLayoutClient({
  children,
  popularGroupsActions,
}: {
  children: React.ReactNode;
  popularGroupsActions?: HomePopularGroupsActions;
}) {
  const isMobile = useIsMobile();

  return (
    <Box mih="100vh" bg="gray.0">
      <Box maw={1080} mx="auto" p="md">
        <Flex
          direction={isMobile ? "column-reverse" : "row"}
          gap="lg"
          align="flex-start"
        >
          <Flex flex={6}>{children}</Flex>

          <Flex
            flex={4}
            {...(isMobile && { miw: "100%" })}
            style={{
              position: "sticky",
              top: "1rem",
              alignSelf: "flex-start",
            }}
          >
            <Stack gap="lg" w="100%">
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
