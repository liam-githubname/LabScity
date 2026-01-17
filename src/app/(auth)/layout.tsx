import { Flex } from "@mantine/core";

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
      bg="#EFF4F6" 
    >
      {children}
    </Flex>
  );
}