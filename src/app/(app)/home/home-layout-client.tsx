"use client";

import { Box, Flex, Stack } from "@mantine/core";
import { useIsMobile } from "@/app/use-is-mobile";
import { LSPopularGroupsHomeStrip } from "@/components/groups/ls-popular-groups-home-strip";
import type {
  getGroups,
  joinGroup,
  searchPublicGroups,
} from "@/lib/actions/groups";
import { Suspense } from "react";
import StickyBox from 'react-sticky-box';
import { TrendingWidget } from "@/components/sidebar/trending-widget";
import { TrendingWidgetSkeleton } from "@/components/sidebar/trending-widget-skeleton";
import CollabRecommendations from "@/components/collaborators/collab-recommendations";
import classes from 'sidebar.module.css';

export type HomePopularGroupsActions = {
  searchPublicGroupsAction: typeof searchPublicGroups;
  joinGroupAction: typeof joinGroup;
  getGroupsAction: typeof getGroups;
};

/** Keep in sync with `LSAppTopBar` (`topBarSize`) and app mobile bottom nav height. */
const APP_TOP_BAR_PX = 60;
// const MOBILE_BOTTOM_NAV_PX = 60;

function SideBar(
  {popularGroupsActions}
  : 
  {popularGroupsActions?: HomePopularGroupsActions;}
) {
  return (
    <Stack 
      gap="lg" 
      w="100%" 
      maw="100%" 
      style={{ 
        minWidth: 0, 
        flexShrink: 0
      }}
    >
      {/* trending + sidecards */}
      <Flex flex={4} miw={{ base: "100%", sm: 'auto'}}>
        <Suspense fallback={<TrendingWidgetSkeleton />}>
          <TrendingWidget />
        </Suspense>
      </Flex>
      {popularGroupsActions ? (
        
        <LSPopularGroupsHomeStrip
          searchPublicGroupsAction={
            popularGroupsActions.searchPublicGroupsAction
          }
          joinGroupAction={popularGroupsActions.joinGroupAction}
          getGroupsAction={popularGroupsActions.getGroupsAction}
        />
      ) : null}
      <CollabRecommendations />
    </Stack>
  )
}

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
          w="100%"
          maw="100%"
        >

          {/* miw={0} so the feed column can shrink; avoids stealing width from the sticky sidebar */}
          <Flex flex={6} miw={0} maw={isMobile ? '100%' : '600'}>
            {children}
          </Flex>

          {
            isMobile 
            ?
            <Flex
              {...(isMobile && { miw: "100%" })}
              style={{
                alignSelf: "flex-start",
                minWidth: 0,
                maxWidth: "100%",
              }}
            >
              <SideBar 
                popularGroupsActions={popularGroupsActions}  
              />
            </Flex>

            :

            <Flex
              component={StickyBox}
              offsetTop={APP_TOP_BAR_PX + 16} 
              offsetBottom={16}
              flex={4}
              style={{
                minWidth: 0,
                maxWidth: '100%'
              }}              
              display={{ base: "flex", sm: "none", md: "flex" }}
            >
              <SideBar 
                popularGroupsActions={popularGroupsActions}  
              />
            </Flex>
          }
        </Flex>
      </Box>
    </Box>
  );
}

