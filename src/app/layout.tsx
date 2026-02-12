import "@mantine/core/styles.css";
import "@mantine/notifications/styles.css";
import { ColorSchemeScript, MantineProvider } from "@mantine/core";
import { Notifications } from "@mantine/notifications";
import { theme } from "@/lib/constants/theme";
import { QueryProvider } from "@/components/providers/query-provider";
import { Metadata } from "next"

export const metadata: Metadata = {
  title: "LabScity",
  description: "Social Media for Scientists",
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en" suppressHydrationWarning>
      <head>
        <ColorSchemeScript defaultColorScheme="light" />
      </head>
      <body>
        <QueryProvider>
          <MantineProvider theme={theme} defaultColorScheme="light">
            <Notifications />
            {children}
          </MantineProvider>
        </QueryProvider>
      </body >
    </html >
  );
}
