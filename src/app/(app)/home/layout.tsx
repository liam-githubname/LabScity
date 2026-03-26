"use client"; // NOTE: required for grid to work

// this is fine because there's no datafetching here
// aka no benefit to making server component

import { Box, Flex } from "@mantine/core";
import { useIsMobile } from "@/app/use-is-mobile";
import { TrendingWidget } from "@/components/sidebar/trending-widget";


export default function HomeLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const isMobile = useIsMobile();

  return (
    <Box mih="100vh" bg="gray.0">
      <Box maw={1080} mx="auto" p="md">
        <Flex direction={isMobile ? "column-reverse" : "row"} gap="lg" align="flex-start">

          {/* new post button + posts */}
          <Flex flex={6}>
            {children}
          </Flex>

          <Flex flex={4} {...isMobile && { miw: "100%" }} style={{ position: "sticky", top: "1rem", alignSelf: "flex-start" }}> {/* mobile miw makes box take full width */}
            <TrendingWidget />
          </Flex>

        </Flex>
      </Box>
    </Box >
  );
}
