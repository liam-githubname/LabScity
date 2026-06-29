import { Text, Flex } from "@mantine/core";
import { IconMoodSad } from "@tabler/icons-react";
import Link from "next/link";

export default function NotFound() {
  return (
    <Flex align="center" justify="center" direction="column" w="100vw" h="100vh" c="navy.7">
      <Text ta="center">Oh no! That's a</Text>
      <Text fz="h1" fw="bolder">404</Text>

      <Flex align="center" justify="center" direction="row" gap="xs">
        <Text>This page does not exist...</Text>
        <IconMoodSad />
      </Flex>

      <Link href='/home'>
        <Text>Return Home</Text>
      </Link>
    </Flex >
  );
}
