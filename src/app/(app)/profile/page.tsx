"use client" // TODO: Why tf do we need this?

import LSProfileHero from "@/components/profile/ls-profile-hero"
import LSPost from "@/components/profile/ls-post"
import LSMiniProfileList from "@/components/profile/ls-mini-profile-list";
import { Box, Divider, Flex, Stack } from "@mantine/core";
import { useMantineTheme } from '@mantine/core';
import { useMediaQuery } from '@mantine/hooks';

const LSProfileMobileLayout = () => {
  return (
    <Stack p={8}>
      <LSProfileHero
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
      <LSPost
        posterName="Rafael Niebles"
        posterResearchInterest="JavaScript Hater"
        posterProfilePicURL="https://pbs.twimg.com/media/DUzbwUdX4AE5RGO.jpg"
        attachmentPreviewURL="https://s3-eu-west-1.amazonaws.com/images.linnlive.com/d4cf250f63918acf8e5d11b6bfddb6ba/9250355b-75cf-42d8-957b-6d28c6aa930f.jpg"
        timestamp={new Date()}
        postText="I think JavaScript is a crime against humanity and it should be explodonated"
      />
      <LSMiniProfileList widgetTitle="Friends" />
      <LSMiniProfileList
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
  )
}

const LSProfileDesktopLayout = () => {
  return (
    <Box py={24} px={80}>
      <Flex p={8} direction="row" w="100%" gap={8}>
        <Box flex={5}>
          <LSProfileHero
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
        </Box>
        <Flex flex={3} direction="column" gap={8}>
          <Box flex={3}>
            <LSMiniProfileList widgetTitle="Friends" />
          </Box>
          <Box flex={5}>
            <LSMiniProfileList
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
          </Box>
        </Flex>
      </Flex >
      {/* posts */}
      <Divider my={20} color="navy.1" />
      <Stack mt={20} px="20%">
        <LSPost
          posterName="Rafael Niebles"
          posterResearchInterest="JavaScript Hater"
          posterProfilePicURL="https://pbs.twimg.com/media/DUzbwUdX4AE5RGO.jpg"
          attachmentPreviewURL="https://s3-eu-west-1.amazonaws.com/images.linnlive.com/d4cf250f63918acf8e5d11b6bfddb6ba/9250355b-75cf-42d8-957b-6d28c6aa930f.jpg"
          timestamp={new Date()}
          postText="I think JavaScript is a crime against humanity and it should be explodonated"
        />
      </Stack>
    </Box >
  )
}

export default function ProfilePage() {
  const theme = useMantineTheme();
  const isMobile = useMediaQuery(`(max-width: ${theme.breakpoints.sm})`);

  return isMobile ?
    <LSProfileMobileLayout /> :
    <LSProfileDesktopLayout />
}
