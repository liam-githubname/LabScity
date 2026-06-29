import { Card, Text, Stack, Flex, Skeleton } from "@mantine/core";

export function TrendingWidgetSkeleton() {
  return (
    <Card
      bg="gray.0"
      p="md"
      w="100%"
      h="100%"
      radius="md"
      shadow="sm"
    >
      <Stack gap="md">
        <Text
          c="gray.7"
          fw="bold"
          fz="xl"
        >
          Trending
        </Text>
        <Flex wrap="wrap" gap={6} justify="flex-start">
          {/* <LSSpinner /> */}
          <Skeleton height={26} width={150} radius='xl'/>
          <Skeleton height={26} width={150} radius='xl'/>
          <Skeleton height={26} width={150} radius='xl'/>
          <Skeleton height={26} width={150} radius='xl'/>
          <Skeleton height={26} width={150} radius='xl'/>
        </Flex>
      </Stack>
    </Card >
  );
}
