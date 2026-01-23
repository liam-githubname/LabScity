"use client";

import {
  ActionIcon,
  Avatar,
  Badge,
  Box,
  Button,
  Card,
  Center,
  Group,
  Image,
  Text,
  Container,
  Grid,
  Stack,
} from "@mantine/core";
import {
  IconDots,
  IconHeart,
  IconMessageCircle,
  IconPencil,
  IconShare,
} from "@tabler/icons-react";

interface ProfileWidgetProps {
  profileName: string,
  profileInstitution: string,
  profileRole: string,
  profileResearchInterest: string,
  profileAbout?: string,
  profileSkills?: string[],
  profileHeaderImageURL?: string,
  profilePicURL?: string
}

const ProfileWidget = ({ profileName, profileInstitution, profileRole, profileResearchInterest, profileAbout, profileSkills, profileHeaderImageURL, profilePicURL }: ProfileWidgetProps) => {
  return (
    <Card shadow="sm" padding="none" radius="md" m={4} withBorder>
      <Image
        bg="gray"
        w="100%"
        h={100}
        mb={-64}
        src={profileHeaderImageURL}
      />
      <Box p="lg">
        <Box
          style={{
            display: "flex",
            flexDirection: "column",
            alignItems: "flex-start",
            gap: 12,
          }}
          mb={12}
        >
          <Avatar
            src={profilePicURL}
            radius="xl"
            size="xl"
          />
          <Box>
            <Text c="navy.8" size="xl" fw={600} mb={-4}>
              {profileName}
            </Text>

            <Text c="navy.8">{profileResearchInterest}</Text>

            <Box>
              <Text span c="navy.6">{profileRole}, {profileInstitution}</Text>
            </Box>


          </Box>
        </Box>
        <Box mb={12}>
          {profileAbout &&
            <Box mb={12}>
              <Text c="navy.8" fw={600}>About</Text>
              <Text c="navy.8">{profileAbout}</Text>
            </Box>
          }
          {(profileSkills && profileSkills.length > 0) &&
            <Box mb={12}>
              <Text c="navy.8" fw={600} mb={8}>
                Skills
              </Text>
              <Group gap={8}>
                {(profileSkills.map((skill, i) => {
                  return (
                    <Badge key={i} color="navy.6" variant="light">
                      {skill}
                    </Badge>
                  )
                }))}
              </Group>
            </Box>
          }
          <Box
            mt={24}
            mb={12}
            w="100%"
            style={{ display: "flex", justifyContent: "flex-end" }}
          >
            <Button radius="xl" variant="filled" color="navy.6"><IconPencil size={18} /></Button>
          </Box>
        </Box>
      </Box>
    </Card>
  );
};

interface PostProps {
  posterName: string;
  posterResearchInterest: string;
  posterProfilePicURL: string;
  attachmentPreviewURL: string;
  timestamp: Date,
  postText: string
}

const Post = ({
  posterName,
  posterResearchInterest,
  posterProfilePicURL: posterProfilePic,
  attachmentPreviewURL,
  timestamp,
  postText
}: PostProps) => {
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

interface OtherProfileProps {
  key: number,
  posterName: string,
  posterResearchInterest: string,
  posterProfilePicURL?: string,
}

const OtherProfile = ({ posterName, posterResearchInterest, posterProfilePicURL }: OtherProfileProps) => {
  return (
    <Box style={{ display: "flex", alignItems: "center", gap: 12 }} mb={12}>
      <Avatar src={posterProfilePicURL} radius="xl" />
      <Box>
        <Text c="navy.8" size="md" fw={600}>
          {posterName}
        </Text>
        <Text c="navy.8" size="sm" mt={-4}>
          {posterResearchInterest}
        </Text>
      </Box>
    </Box>
  );
};

interface ProfileListWidgetProps {
  widgetTitle: string,
  profiles?: OtherProfileProps[]
}

const ProfileListWidget = ({ widgetTitle, profiles }: ProfileListWidgetProps) => {
  return (
    <Card shadow="sm" padding="lg" radius="md" m={4} withBorder>
      <Center mb={8}>
        <Text c="navy.8" fw={600} size="xl">
          {widgetTitle}
        </Text>
      </Center>
      <Box>
        {
          // We must pass profiles and there must be something in the list
          // Otherwise, the list shouldn't be displayed
          profiles && profiles.length > 0 ?
            /*
               FIXME: The key should come from the loop and not manually?
                      consult backend people!
            */
            profiles.map((otherProfile) => {
              return <OtherProfile
                key={otherProfile.key}
                posterName={otherProfile.posterName}
                posterResearchInterest={otherProfile.posterResearchInterest}
                posterProfilePicURL={otherProfile.posterProfilePicURL} />
            }) : <Center><Text size="sm" c="navy.6">Nothing to see here!</Text></Center>
        }
      </Box>
      <Center>
        <Button variant="transparent">
          <IconDots style={{ color: "var(--mantine-color-navy-6)" }} />
        </Button>
      </Center>
    </Card>
  );
};

const ViewSelector = () => {
  // TODO: Finish this!!!
  return (
    <Box
      my={14}
      px={14}
      style={{
        display: "flex",
        justifyContent: "space-between",
        width: "100%",
      }}
    >
      <Button variant="transparent" c="navy.8" size="md">Posts</Button>
      <Button variant="transparent" c="navy.6" size="md">Publications</Button>
      <Button variant="transparent" c="navy.6" size="md">Projects</Button>
    </Box>
  )
}

export default function ProfilePage() {
  return (
    <Container size="xl" my="lg">
      <Grid gutter="lg">
        <Grid.Col span={{ base: 12, md: 8 }}>
          <Stack gap="lg">
            <ProfileWidget
              profileName="Rafael Niebles"
              profileInstitution="Univ. of Central Florida"
              profileRole="Student"
              profileResearchInterest="Machine Learning"
              profileAbout="Hello this is my beautiful account"
              profileSkills={[
                "JavaScript",
                "More JavaScript",
                "Even MORE JavaScript!",
                "More More JAVASCRIPT More!!!",
                "php...!?",
              ]}
              profilePicURL="https://ih1.redbubble.net/image.5595885630.8128/bg,f8f8f8-flat,750x,075,f-pad,750x1000,f8f8f8.jpg"
              profileHeaderImageURL="https://external-preview.redd.it/r6g38aXSaQWtd1KxwJbQ-Fs5jtSVDxX3wtLHJEdqixw.jpg?width=1080&crop=smart&auto=webp&s=87a2c94cb3e1561e2b6abd467ea68d81b9901720"
            />

            <ViewSelector />

            <Post
              posterName="Rafael Niebles"
              posterResearchInterest="JavaScript Hater"
              posterProfilePicURL="https://pbs.twimg.com/media/DUzbwUdX4AE5RGO.jpg"
              attachmentPreviewURL="https://s3-eu-west-1.amazonaws.com/images.linnlive.com/d4cf250f63918acf8e5d11b6bfddb6ba/9250355b-75cf-42d8-957b-6d28c6aa930f.jpg"
              timestamp={new Date()}
              postText="I think JavaScript is a crime against humanity and it should be explodonated"
            />
          </Stack>
        </Grid.Col>

        <Grid.Col span={{ base: 12, md: 4 }}>
          <Stack gap="lg">
            <ProfileListWidget widgetTitle="Friends" />
            <ProfileListWidget
              widgetTitle="Following"
              profiles={[
                {
                  key: 0,
                  posterName: "Beethoven",
                  posterResearchInterest: "European Music",
                  posterProfilePicURL:
                    "https://encrypted-tbn0.gstatic.com/images?q=tbn:ANd9GcRsxuN8XD4da9_EVO8m6ZP4aECjlYM8mBkbTg&s",
                },
                {
                  key: 1,
                  posterName: "2Pac Shakur",
                  posterResearchInterest: "Rap",
                  posterProfilePicURL:
                    "https://npr.brightspotcdn.com/dims4/default/3ef5a7e/2147483647/strip/true/crop/2814x2110+0+0/resize/880x660!/quality/90/",
                },
              ]}
            />
          </Stack>
        </Grid.Col>
      </Grid>
    </Container>
  );
}
