import { Box, Stack } from "@mantine/core";
import { TrendingWidget } from "@/components/sidebar/trending-widget";
import classes from "./layout.module.css";

export default function HomeLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <Box className={classes.container} bg="gray.0">
      <Box className={classes.grid}>
        <Box className={classes.feed}>
          {children}
        </Box>
        <Box className={classes.rightSidebar}>
          <Stack gap="md">
            <TrendingWidget />
          </Stack>
        </Box>
      </Box>
    </Box>
  );
}
