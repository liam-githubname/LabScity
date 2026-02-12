import { Button, Text, Card, Center, Stack } from "@mantine/core";
import LSMiniProfile, { LSMiniProfileProps } from "./ls-mini-profile";
import { IconDots } from "@tabler/icons-react";

export interface LSMiniProfileListProps {
  widgetTitle: string,
  profiles?: LSMiniProfileProps[]
}

export default function LSMiniProfileList({ widgetTitle, profiles }: LSMiniProfileListProps) {
  return (
    <Card shadow="sm" padding="lg" radius="md" h="100%">
      <Center mb={8}>
        <Text c="navy.8" fw={600} size="xl">
          {widgetTitle}
        </Text>
      </Center>
      <Stack gap={12}>
        {
          // We must pass profiles and there must be something in the list
          // Otherwise, the list shouldn't be displayed
          profiles && profiles.length > 0 ?
            /*
               FIXME: the key should come from the loop and not manually?
                      consult backend people!
            */
            profiles.map((otherProfile) => {
              return <LSMiniProfile
                key={otherProfile.key}
                posterName={otherProfile.posterName}
                posterResearchInterest={otherProfile.posterResearchInterest}
                posterProfilePicURL={otherProfile.posterProfilePicURL} />
            }) : <Center><Text size="sm" c="navy.6">Nothing to see here!</Text></Center>
        }
      </Stack>
    </Card>
  );
};
