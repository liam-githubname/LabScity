import { Avatar, Box, Card, Group, Text } from "@mantine/core";

export default function ProfilePage() {
  return (
    <div>
      <Card shadow="sm" padding="lg" radius="md" withBorder>
        <Box style={{ display: "flex", alignItems: "center", gap: 12 }} mb={12}>
          <Avatar radius="xl" />
          <Box>
            <Text size="xl" fw={600}>
              Rafael Niebles
            </Text>

            <Box>
              <Text span>University of Central Florida</Text>
              <Text span ml={6} color="gray">
                Student
              </Text>
            </Box>

            <Text>Computer Science</Text>
          </Box>
        </Box>
        <Group mb={12}>
          <Group>
            <Text fw={600}>About</Text>
            <Text size="sm">Hello this is my beautiful account</Text>
          </Group>

          <Group>
            <Text fw={600}>About</Text>
            <Text size="sm">Hello this is my beautiful account</Text>
          </Group>
        </Group>
      </Card>
    </div>
  );
}
