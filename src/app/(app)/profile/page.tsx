import { Avatar, Badge, Box, Button, Card, Center, Group, Text, Image, ActionIcon } from "@mantine/core";
import { IconDots, IconHeart, IconMessageCircle, IconShare, IconPointFilled } from "@tabler/icons-react"

const MyProfileWidget = () => {
  return (
    <Card shadow="sm" padding="none" radius="md" m={4} withBorder>
      <Image bg="gray" w="100%" h={100} mb={-64} src="https://ih1.redbubble.net/image.5595885630.8128/bg,f8f8f8-flat,750x,075,f-pad,750x1000,f8f8f8.jpg" />
      <Box p="lg">
        <Box style={{ display: "flex", flexDirection: "column", alignItems: "flex-start", gap: 12 }} mb={12}>
          <Avatar src="https://pbs.twimg.com/media/DUzbwUdX4AE5RGO.jpg" radius="xl" size="xl" />
          <Box>
            <Text size="xl" fw={600} mb={-4}>
              Rafael Niebles
            </Text>

            <Box>
              <Text span>University of Central Florida</Text>
              <Text span ml={6} c="gray">
                Student
              </Text>
            </Box>

            <Text>Computer Science</Text>
          </Box>
        </Box>
        <Box mb={12}>
          <Box mb={12}>
            <Text fw={600}>About</Text>
            <Text>Hello this is my beautiful account</Text>
          </Box>
          <Box mb={12}>
            <Text fw={600} mb={8}>
              Skills
            </Text>
            <Group gap={8}>
              <Badge color="blue" variant="light">
                JavaScript
              </Badge>
              <Badge color="blue" variant="light">
                JavaScript
              </Badge>
              <Badge color="blue" variant="light">
                More JavaScript
              </Badge>
              <Badge color="blue" variant="light">
                More More JavaScript More
              </Badge>
              <Badge color="blue" variant="light">
                Ooh Yeah JavaScript!
              </Badge>
            </Group>
          </Box>
          <Box mt={24} mb={12} w="100%" style={{ display: "flex", justifyContent: "flex-end" }}>
            <Button variant="default">Edit Profile</Button>
          </Box>
        </Box>
      </Box>
    </Card>

  )
}

const APost = () => {
  return (
    <Card shadow="sm" padding="lg" radius="md" m={4} withBorder>
      <Box>
        <Box style={{ display: "flex", alignItems: "center", gap: 12 }}>
          <Avatar radius="xl" />
          <Box style={{ flex: 1 }}>
            <Group mb={2}>
              <Text size="lg" fw={600} span>
                Rafael Niebles
              </Text>
              <Box style={{ marginLeft: "auto", display: "flex", flexDirection: "column", alignItems: "center" }}>
                <ActionIcon variant="transparent" size="sm">
                  <IconDots size={18} />
                </ActionIcon>
              </Box>
            </Group>
            <Text mt={-4} size="sm" c="gray">Computer Science</Text>
          </Box>
        </Box>
        <Text size="sm" my={12} style={{ lineHeight: 1.2 }}>I think that JavaScript is a crime against humanity and it should be explodonated</Text>
        <Image
          radius="md"
          w="100%"
          src="https://www.reachabovemedia.com/wp-content/uploads/2017/11/why-js-sucks.jpg"
        />
        <Text size="sm" c="gray" ml={2} my={12}>2:30PM • January 21, 2025</Text>
        <Box style={{ display: "flex", justifyContent: "space-between", width: "100%" }}>
          <Button variant="transparent" leftSection={<IconHeart size={18} />} size="compact-sm" style={{ alignItems: "center", textAlign: "center" }}>
            Like
          </Button>
          <Button variant="transparent" leftSection={<IconMessageCircle size={18} />} size="compact-sm" style={{ alignItems: "center", textAlign: "center" }}>
            Comment
          </Button>
          <Button variant="transparent" leftSection={<IconShare size={18} />} size="compact-sm" style={{ alignItems: "center", textAlign: "center" }}>
            Share
          </Button>
        </Box>
      </Box>
    </Card>
  )
}

const OtherProfile = () => {
  return (
    <Box style={{ display: "flex", alignItems: "center", gap: 12 }} mb={12}>
      <Avatar radius="xl" />
      <Box>
        <Text size="md" fw={600}>
          Julia Brown
        </Text>
        <Text size="sm" mt={-4}>Microbiology</Text>
      </Box>
    </Box>
  )
}

const FriendsWidget = () => {
  return (
    <Card shadow="sm" padding="lg" radius="md" m={4} withBorder >
      <Center mb={8}>
        <Text fw={600} size="xl">
          Friends
        </Text>
      </Center>
      <Box>
        <OtherProfile />
        <OtherProfile />
      </Box>
      <Center>
        <Button variant="transparent">
          <IconDots />
        </Button>
      </Center>
    </Card>
  )
}

const FollowingWidget = () => {
  return (
    <Card shadow="sm" padding="lg" radius="md" m={4} withBorder >
      <Center mb={8}>
        <Text fw={600} size="xl">
          Following
        </Text>
      </Center>
      <Box>
        <OtherProfile />
        <OtherProfile />
      </Box>
      <Center>
        <Button variant="transparent">
          <IconDots />
        </Button>
      </Center>
    </Card>
  )
}

export default function ProfilePage() {
  return (
    <div>
      <MyProfileWidget />
      <APost />
      <FriendsWidget />
      <FollowingWidget />
    </div>
  );
}
