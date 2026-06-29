import "@mantine/core/styles.css";
import "@mantine/notifications/styles.css";

import { Inter } from "next/font/google";
import { ColorSchemeScript, Flex, MantineProvider, Space } from "@mantine/core";
import { Notifications } from "@mantine/notifications";
import { theme, cssVariablesResolver } from "@/lib/constants/theme";
import { QueryProvider } from "@/components/providers/query-provider";
import { Metadata } from "next"
// import { ReactQueryDevtools } from '@tanstack/react-query-devtools'
import { ReactQueryDevtools, ReactQueryDevtoolsPanel } from '@tanstack/react-query-devtools'
import { AuthProvider } from "@/components/auth/auth-provider";

const inter = Inter({ subsets: ["latin"] }); // due to bundler ordering, globals.css doesnt import font; this does

export const metadata: Metadata = {
  title: "LabScity",
  description: "Social Media for Scientists",
  icons: {
    icon: "/logo-sm.png",
  },
};

/**
 * Root layout: HTML shell, MantineProvider with app theme and light color scheme, and global metadata.
 * @param props - Layout props
 * @param props.children - Page content
 */
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

      <body className={inter.className}>
        <QueryProvider>
          <AuthProvider>
            <MantineProvider theme={theme} cssVariablesResolver={cssVariablesResolver} defaultColorScheme="light">
              <ReactQueryDevtools initialIsOpen={false} position="right"/>
              <Notifications />
              {children}
            </MantineProvider>
          </AuthProvider>
        </QueryProvider>
      </body >
    </html >
  );
}
