import { Button, Text, Card, Box, Center } from "@mantine/core";
import OtherProfile, { OtherProfileProps } from "./other-profile";
import { IconDots } from "@tabler/icons-react";

export interface ProfileListWidgetProps {
  widgetTitle: string,
  profiles?: OtherProfileProps[]
}

export default function ProfileListWidget({ widgetTitle, profiles }: ProfileListWidgetProps) {
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
