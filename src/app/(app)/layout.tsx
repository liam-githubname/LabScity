import { AppNavbar } from "@/components/layout/app-navbar";
import { Box, Space } from "@mantine/core";

export default function AuthenticatedLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <Box style={{ minHeight: "100vh" }}>
      <AppNavbar />
      <Box>
        {children}
      </Box>
      { /* add some empty space at footer to make space for navbar */}
      <Space h={70} />
    </Box>
  );
}
