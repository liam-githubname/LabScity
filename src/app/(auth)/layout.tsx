import { Flex } from "@mantine/core";

/**
 * Centered full-height layout for auth routes (login, signup). Uses navy.2 background.
 * @param props - Layout props
 * @param props.children - Auth page content (e.g. LSLoginForm or LSSignupForm)
 */
export default function AuthLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <Flex
      mih="100vh"
      align="center"
      justify="center"
      bg="navy.7"
      py="xl"
    >
      {children}
    </Flex>
  );
}
