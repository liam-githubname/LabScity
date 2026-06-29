"use client"

import LSAppNavbar from "./app-navbar"
import LSAppTopBar from "./app-topbar"
import { Box, Flex, Space } from "@mantine/core"
import { useIsMobile } from "../use-is-mobile"

const mobileNavbarHeight = 60
const desktopNavbarWidth = 164

const LSAppLayout = ({ userId, isModerator, children }: { userId: string, isModerator: boolean, children: React.ReactNode }) => {
  const isMobile = useIsMobile()

  return (
    <Flex direction={isMobile ? "column" : "row"} w="100%" mih="100vh">

      <LSAppNavbar
        userId={userId}
        isModerator={isModerator}
        desktopWidth={desktopNavbarWidth}
        mobileHeight={mobileNavbarHeight}
      />

      {/* needed to make room for navbar; 164 is the navbar size */}
      {!isMobile && <Space w={desktopNavbarWidth} />}
      <Flex direction="column" w="100%" miw={0}>
        <LSAppTopBar />

        <Box maw="100%" style={{ overflowX: "clip" }}>
          {children}
        </Box>

        {/* footer; only needed on mobile */}
        {isMobile && <Space h={mobileNavbarHeight} />}

      </Flex>
    </Flex>
  )
}

export default LSAppLayout
