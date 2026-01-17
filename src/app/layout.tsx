import "@mantine/core/styles.css"; 
import { ColorSchemeScript, MantineProvider } from "@mantine/core";
import { theme } from "@/app/theme"; 

export const metadata = {
  title: "LabScity",
  description: "Social Media for Scientists",
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en">
      <head>
        <ColorSchemeScript />
      </head>
      <body>
        <MantineProvider theme={theme}>
          {children}
        </MantineProvider>
      </body>
    </html>
  );
}