import { Menu, Group, Button, Text, Image, Card, Box, Avatar, ActionIcon, TextInput, Textarea, Stack, Grid, Flex, Divider, Center } from "@mantine/core";
import { IconDots, IconHeart, IconHeartFilled, IconLink, IconMessageCircle, IconMessageCircleFilled, IconPencil, IconShare, IconTrash } from "@tabler/icons-react";
import { useState } from "react";

const LSPostActionMenu = () => {
  return (
    <Menu>
      {/* Action button to trigger menu */}
      <Menu.Target>
        <ActionIcon variant="transparent" size="sm">
          <IconDots size={18} style={{ color: "var(--mantine-color-navy-6)" }} />
        </ActionIcon>
      </Menu.Target>

      {/* Menu dropdown itself  */}
      <Menu.Dropdown>
        <Menu.Label c="navy.6">Post Options</Menu.Label>
        {/* Edit */}
        <Menu.Item c="navy.7" leftSection={<IconPencil size={14} />}>
          Edit Post
        </Menu.Item>
        {/* Delete */}
        <Menu.Item
          color="red"
          leftSection={<IconTrash size={14} />}>
          Delete Post
        </Menu.Item>
      </Menu.Dropdown>
    </Menu>
  )
}

const LSLikeButton = () => {
  const [active, setActive] = useState(false)

  return (
    <Button
      c="navy.6"
      variant="transparent"
      leftSection={active ?
        <IconHeartFilled size={18} color="red" /> : // fill with red if active
        <IconHeart size={18} />
      }
      size="compact-sm"
      style={{ alignItems: "center", textAlign: "center" }}
      onClick={() => setActive(!active)} // TODO: add api functionality here
    >
      Like
    </Button>
  )
}

const LSShareButton = () => {
  {/* TODO: fill in the icon while menu active */ }
  return (
    <Menu>
      <Menu.Target>
        <Button
          c="navy.6"
          variant="transparent"
          leftSection={<IconShare size={18} />}
          size="compact-sm"
          style={{ alignItems: "center", textAlign: "center" }}
        >
          Share
        </Button>
      </Menu.Target>

      {/* only one share option for now which is to copy url */}

      <Menu.Dropdown>
        <Menu.Label c="navy.6">Sharing Options</Menu.Label>
        <Menu.Item c="navy.7" leftSection={<IconLink size={14} />}>
          Copy URL
        </Menu.Item>
      </Menu.Dropdown>
    </Menu>
  )
}

interface LSCommentProps {
  commenterName: string
  commenterResearchInterest: string,
  commentContent: string
}

const LSComment = ({ commenterName, commenterResearchInterest, commentContent }: LSCommentProps) => {
  return (
    <Stack gap={0}>
      <Flex >
        {/* poster info */}
        <Avatar mr={8} />
        <Stack gap={0} >
          <Text size="sm" fw={600} c="navy.7">{commenterName}</Text>
          <Text size="sm" c="navy.7 ">{commenterResearchInterest}</Text>

          {/* comment content */}
          <Text
            size="sm"
            mt={8}
            style={{
              wordBreak: 'break-word',
            }}
          >
            {commentContent}
          </Text>

          {/* comment actions ... TODO: add later */}

        </Stack>
      </Flex >
    </Stack >
  );
}

interface LSPostProps {
  posterName: string,
  posterResearchInterest: string,
  posterProfilePicURL: string,
  attachmentPreviewURL: string,
  timestamp: Date,
  postText: string
}

export default function LSPost({
  posterName,
  posterResearchInterest,
  posterProfilePicURL: posterProfilePic,
  attachmentPreviewURL,
  timestamp,
  postText
}: LSPostProps) {
  const [showCommentInput, setShowCommentInput] = useState(false)

  return (
    <Card shadow="sm" padding="lg" radius="md">
      <Box>
        <Box style={{ display: "flex", alignItems: "center", gap: 12 }}>
          <Avatar radius="xl" src={posterProfilePic} />
          <Box style={{ flex: 1 }}>
            <Group mb={2}>
              <Text c="navy.8" size="lg" fw={600} span>
                {posterName}
              </Text>
              <Box
                style={{
                  marginLeft: "auto",
                  display: "flex",
                  flexDirection: "column",
                  alignItems: "center",
                }}
              >
                <LSPostActionMenu />
              </Box>
            </Group>
            <Text c="navy.7" mt={-4} size="sm">
              {posterResearchInterest}
            </Text>
          </Box>
        </Box>
        <Text c="navy.8" size="sm" my={12} style={{ lineHeight: 1.2 }}>
          {postText}
        </Text>
        {/* image preview */}
        <Center>
          <Image radius="md" w="50%" src={attachmentPreviewURL} />
        </Center>
        <Text size="sm" c="navy.5" ml={2} my={12}>
          {timestamp.toLocaleTimeString("en-US", {
            hour: "numeric",
            minute: "2-digit",
            hour12: true,
          })}{" "}
          •{" "}
          {timestamp.toLocaleDateString("en-US", {
            month: "long",
            day: "numeric",
            year: "numeric",
          })}
        </Text>
        <Box
          style={{
            display: "flex",
            justifyContent: "space-between",
            alignItems: "flex-start",
            width: "100%",
          }}
        >
          <LSLikeButton />
          {/* comment section ACTIVATOR BUTTON */}
          <Button
            c="navy.6"
            variant="transparent"
            leftSection={showCommentInput ?
              <IconMessageCircleFilled size={18} /> :
              <IconMessageCircle size={18} />
            }
            size="compact-sm"
            style={{ alignItems: "center", textAlign: "center" }}
            onClick={() => setShowCommentInput(!showCommentInput)}
          >
            Comment
          </Button>
          <LSShareButton />
        </Box>
        {/* comment input */}
        <Box mt={12}>
          {showCommentInput &&
            // TODO: complete form logic
            <form>
              <Stack mb={16}>
                <Textarea label="Write a Comment..." />
                <Button type="submit">Comment</Button>
              </Stack>
            </form>
          }
          {/* comment section entries */}
          <Divider mb={16} c="navy.1" />
          <Stack gap={16}>
            <LSComment
              commenterName={"Brendan Fraser"}
              commenterResearchInterest={"Machine Learning"}
              commentContent="Hello this is a beautiful comment"
            />
            <LSComment
              commenterName={"Brendan Fraser"}
              commenterResearchInterest={"Machine Learning"}
              commentContent="Hello this is another beautiful comment"
            />
          </Stack>
        </Box>
      </Box>
    </Card >
  );
};
