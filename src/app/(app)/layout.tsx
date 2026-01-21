import { AppNavbar } from "@/components/layout/app-navbar";
import { Box } from "@mantine/core";

export default function AuthenticatedLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <Box style={{ height: "100vh", position: "relative" }}>
      <Box style={{ paddingBottom: 60, height: "100%", overflow: "auto" }}>
        {children}
      </Box>
      <AppNavbar />
    </Box>
  );
}
