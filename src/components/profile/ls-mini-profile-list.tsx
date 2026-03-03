import { Button, Text, Card, Center, Stack } from "@mantine/core";
import LSMiniProfile, {/*LSMiniProfileProps */ } from "./ls-mini-profile";
import { IconDots } from "@tabler/icons-react";
import { User } from "@/lib/types/feed";

export interface LSMiniProfileListProps {
  widgetTitle: string,
  profiles?: User[]
}

export default function LSMiniProfileList({ widgetTitle, profiles }: LSMiniProfileListProps) {


  const listUsers = profiles?.map(profile =>
    <li key={profile.user_id}>
      <LSMiniProfile
        key={profile.user_id}
        posterEmail={profile.email}
        posterName={profile.first_name + " " + profile.last_name}
        posterResearchInterest={profile.research_interests?.at(0) || ""}
        posterProfilePicURL={profile.avatar_url || undefined}
      />
    </li>
  )

  return (
    <Card shadow="sm" padding="lg" radius="md" h="100%">
      <Center mb={8}>
        <Text c="navy.7" fw={600} size="xl">
          {widgetTitle}
        </Text>
      </Center>
      <Stack gap={12}>
        {
          // We must pass profiles and there must be something in the list
          // Otherwise, the list shouldn't be displayed
          profiles && profiles.length > 0 ?
            listUsers
            : <Center><Text size="sm" c="navy.6">Nothing to see here!</Text></Center>
        }
      </Stack>
    </Card >
  );
};
