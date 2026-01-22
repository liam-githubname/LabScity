import { Group, Button, Text, Image, Card, Box, Avatar, ActionIcon } from "@mantine/core";
import { IconDots, IconHeart, IconMessageCircle, IconShare } from "@tabler/icons-react";

interface PostProps {
  posterName: string,
  posterResearchInterest: string,
  posterProfilePicURL: string,
  attachmentPreviewURL: string,
  timestamp: Date,
  postText: string
}

export default function Post({
  posterName,
  posterResearchInterest,
  posterProfilePicURL: posterProfilePic,
  attachmentPreviewURL,
  timestamp,
  postText
}: PostProps) {
  return (
    <Card shadow="sm" padding="lg" radius="md" m={4} withBorder>
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
                <ActionIcon variant="transparent" size="sm">
                  <IconDots size={18} style={{ color: "var(--mantine-color-navy-6)" }} />
                </ActionIcon>
              </Box>
            </Group>
            <Text c="navy.8" mt={-4} size="sm">
              {posterResearchInterest}
            </Text>
          </Box>
        </Box>
        <Text c="navy.8" size="sm" my={12} style={{ lineHeight: 1.2 }}>
          {postText}
        </Text>
        <Image radius="md" w="100%" src={attachmentPreviewURL} />
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
            width: "100%",
          }}
        >
          <Button
            c="navy.6"
            variant="transparent"
            leftSection={<IconHeart size={18} />}
            size="compact-sm"
            style={{ alignItems: "center", textAlign: "center" }}
          >
            Like
          </Button>
          <Button
            c="navy.6"
            variant="transparent"
            leftSection={<IconMessageCircle size={18} />}
            size="compact-sm"
            style={{ alignItems: "center", textAlign: "center" }}
          >
            Comment
          </Button>
          <Button
            c="navy.6"
            variant="transparent"
            leftSection={<IconShare size={18} />}
            size="compact-sm"
            style={{ alignItems: "center", textAlign: "center" }}
          >
            Share
          </Button>
        </Box>
      </Box>
    </Card>
  );
};
