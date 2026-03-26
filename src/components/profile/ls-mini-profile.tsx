import { Text, Box, Avatar, Anchor } from "@mantine/core";
import Link from "next/link";

/**
 * Props for LSMiniProfile.
 *
 * @param posterName - Display name (used for avatar initials when posterProfilePicURL missing).
 * @param posterEmail - Email (reserved for future use; see TODO below).
 * @param posterResearchInterest - Subtitle line (e.g. first research interest).
 * @param posterProfilePicURL - Optional avatar URL.
 * @param userId - When set, name is rendered as a link to /profile/[userId]; otherwise plain text.
 */
// TODO: It needs to show the name and email. We don't want usernames, but user needs a way to differentiate profiles.
export interface LSMiniProfileProps {
  posterName: string;
  posterEmail: string;
  posterResearchInterest: string;
  posterProfilePicURL?: string;
  userId?: string;
}

/**
 * Compact user card: avatar (or initials), name, and research interest.
 * Used in Friends/Following lists; when userId is provided, the name links to that user's profile.
 */
export default function LSMiniProfile({
  posterName,
  posterResearchInterest,
  posterProfilePicURL,
  userId,
}: LSMiniProfileProps) {
  const initials = posterName
    .split(" ")
    .filter(Boolean)
    .map((part) => part[0])
    .slice(0, 2)
    .join("");

  return (
    <Box style={{ display: "flex", alignItems: "center", gap: 12 }}>
      <Avatar
        size="md"
        radius="xl"
        color="navy.7"
        bg="navy.7"
        src={posterProfilePicURL || undefined}
      >
        {initials}
      </Avatar>
      <Box>
        {userId ? (
          <Anchor component={Link} href={`/profile/${userId}`} underline="hover" c="navy.7">
            <Text component="span" c="navy.7" size="md" fw={600} style={{ cursor: "pointer" }}>
              {posterName}
            </Text>
          </Anchor>
        ) : (
          <Text c="navy.7" size="md" fw={600}>
            {posterName}
          </Text>
        )}
        <Text c="navy.7" size="sm" mt={-4}>
          {posterResearchInterest}
        </Text>
      </Box>
    </Box>
  );
}
