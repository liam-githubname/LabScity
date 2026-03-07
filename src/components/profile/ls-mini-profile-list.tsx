"use client";

import { useState } from "react";
import { Box, Text, Card, Center, Stack, Button } from "@mantine/core";
import LSMiniProfile from "@/components/profile/ls-mini-profile";
import LSProfileListModal from "@/components/profile/ls-profile-list-modal";
import type { User } from "@/lib/types/feed";

/** Max profiles shown inline before "Show all X" opens the modal. */
const INLINE_LIMIT = 6;

/**
 * Props for LSMiniProfileList.
 *
 * @param widgetTitle - Title shown above the list (e.g. "Friends", "Following").
 * @param profiles - List of users to display; when length > INLINE_LIMIT, only first INLINE_LIMIT shown inline.
 */
export interface LSMiniProfileListProps {
  widgetTitle: string;
  profiles?: User[];
}

/**
 * Compact profile-list widget for the profile sidebar.
 * Shows up to INLINE_LIMIT (6) profiles inline; when more exist, a "Show all X" button opens
 * LSProfileListModal with the full list.
 */
export default function LSMiniProfileList({ widgetTitle, profiles }: LSMiniProfileListProps) {
  const [modalOpened, setModalOpened] = useState(false);

  const hasOverflow = (profiles?.length ?? 0) > INLINE_LIMIT;

  const visibleProfiles = hasOverflow
    ? profiles!.slice(0, INLINE_LIMIT)
    : profiles;

  const listUsers = visibleProfiles?.map((profile) => (
    <li key={profile.user_id}>
      <LSMiniProfile
        key={profile.user_id}
        userId={profile.user_id}
        posterEmail={profile.email}
        posterName={profile.first_name + " " + profile.last_name}
        posterResearchInterest={profile.research_interests?.at(0) ?? ""}
        posterProfilePicURL={profile.avatar_url ?? undefined}
      />
    </li>
  ));

  return (
    <Card shadow="sm" padding="lg" radius="md" h="100%">
      <Center mb={8}>
        <Text c="navy.7" fw={600} size="xl">
          {widgetTitle}
        </Text>
      </Center>
      <Stack gap={12}>
        {profiles && profiles.length > 0 ? (
          <>
            <Box component="ul" style={{ listStyle: "none", paddingLeft: 0, margin: 0 }}>
              {listUsers}
            </Box>
            {hasOverflow && (
              <Center>
                <Button
                  variant="subtle"
                  color="navy"
                  size="xs"
                  onClick={() => setModalOpened(true)}
                >
                  {`Show all ${profiles.length}`}
                </Button>
              </Center>
            )}
          </>
        ) : (
          <Center><Text size="sm" c="navy.6">Nothing to see here!</Text></Center>
        )}
      </Stack>
      {profiles && hasOverflow && (
        <LSProfileListModal
          title={widgetTitle}
          profiles={profiles}
          opened={modalOpened}
          onClose={() => setModalOpened(false)}
        />
      )}
    </Card>
  );
}
