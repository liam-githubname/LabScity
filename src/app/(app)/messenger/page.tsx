/*
 * TODO: who sent the last message in a gc
 */

"use client"

import { Text, Card, Stack, Avatar, Flex, Box, Divider } from "@mantine/core"

interface LSDirectMessageSender {
  name: string,
  avatarURL?: string
}

interface LSDirectMessagePreviewProps {
  senders: LSDirectMessageSender[],
  lastMessagePreview: string
  pending?: boolean
}

const LSDirectMessagePreview = ({ senders, lastMessagePreview, pending }: LSDirectMessagePreviewProps,) => {
  // make profile preview pfps SMALLER if more than 1 sender
  // TODO: when does this code run in the render pipeline?

  let avatarPreviewSize = "lg"
  if (senders.length > 1) {
    avatarPreviewSize = "sm"
  }

  return (
    <Stack px="sm">

      {/* an individual dm */}
      <Card shadow="sm" p={0} radius="md" withBorder>

        {/* pending badge */}
        {pending &&
          <Box bg="navy.5" pos="absolute" ml="3%" mt="3%" w={5} style={{ aspectRatio: "1/1", borderRadius: "50%" }} />
        }

        {/* actual card content */}
        <Flex p="md" direction="row" align="center" w="100%" h="100%">

          {/* sender avatars */}
          <Flex flex={1} mr={12} gap={2} wrap="wrap" justify="center" align="center" h={55} style={{ minWidth: 0 }}>
            {
              // only grab the first 4; no more than 4 preview pfps should be shown
              senders
                .slice(0, 4)
                .map((sender, i) =>
                  <Avatar key={i} src={sender.avatarURL} color="navy.7" size={avatarPreviewSize}>{sender.name.slice(0, 2).toUpperCase()}</Avatar>
                )
            }
          </Flex>

          {/* info abt. the message */}
          {/* NOTE: minWidth in flex -> allow this to shrink */}
          {/* TODO: make sure name doesn't move down with message */}
          <Flex flex={4} gap={0} direction="column" justify="flex-start" style={{ height: "100%", minWidth: 0 }}>

            {/* comma-separate sender names */}
            <Text size="sm" fw={600} c="navy.7" truncate="end">
              {
                senders
                  .map(sender => sender.name)
                  .join(', ')
              }
            </Text>

            {/* last message preview */}
            <Text
              c="navy.6"
              size="sm"
              lineClamp={2}
              flex={1}
              style={{
                wordBreak: "break-word"
              }}
            >
              {lastMessagePreview}
            </Text>
          </Flex>

        </Flex >
      </Card>
    </Stack>
  )
}

const LSMessengerPage = () => {
  // NOTE: dummy data, may remove
  const dummySendersA: LSDirectMessageSender[] = [
    { name: "Rafael", avatarURL: "https://i.pinimg.com/1200x/ba/d9/b3/bad9b3b661a0043caf83b058c1dcebba.jpg" },
    { name: "Matt" },
    { name: "Liam", avatarURL: "https://i.pinimg.com/736x/a1/13/0c/a1130c5d03ffbc2e2485b82bea9254c2.jpg" },
    { name: "Chris" },
    { name: "Simran" },
    { name: "Colton" },
  ]

  const dummySendersB: LSDirectMessageSender[] = [
    { name: "Simran" },
    { name: "Colton", avatarURL: "https://i.pinimg.com/736x/01/6f/85/016f857f1467a90e9fba6339a639c1d0.jpg" },
  ]

  const dummySendersC: LSDirectMessageSender[] = [
    { name: "Jenna", avatarURL: "https://i.pinimg.com/736x/0a/81/fe/0a81febe58fa253116d13d13dcf0cc89.jpg" },
  ]


  return (
    <Stack>
      <Text size="xl" mx="lg" mt="lg" fw={400} c="navy.7">Direct Messages</Text>
      <Divider c="navy.4" />
      <Stack gap={6}>
        <LSDirectMessagePreview senders={dummySendersA} lastMessagePreview="we are doing great!!!" pending />
        <LSDirectMessagePreview senders={dummySendersB} lastMessagePreview="lorem impsum dolor sita met or whatever" />
        <LSDirectMessagePreview senders={dummySendersC} lastMessagePreview="Hello this is my last message I hope you got it and that you are a happy person" pending />
      </Stack>
    </Stack>
  )
}

export default LSMessengerPage
