import { Text, Box, Avatar, Anchor } from "@mantine/core";
import Link from "next/link";

// TODO: It needs to show the name and email. We don't want usernames, but user needs a way to differentiate profiles.
export interface LSMiniProfileProps {
  posterName: string;
  posterEmail: string;
  posterResearchInterest: string;
  posterProfilePicURL?: string;
  userId?: string;
}

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
      <Avatar size="md" radius="xl" color="navy.7" src={posterProfilePicURL || undefined}>
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
