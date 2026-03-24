import type { Metadata } from "next";
import { redirect } from "next/navigation";
import {
  canAccessModerationAction,
  getModerationReportsAction,
  getUserReportsAction,
} from "@/lib/actions/moderation";
import { LSModerationQueue } from "@/components/moderation/ls-moderation-queue";
import { Box, Stack, Title } from "@mantine/core";

export const metadata: Metadata = {
  title: "Moderation | LabScity",
  description: "Moderator queue for handling user reports.",
};

/// Checks if we have mod privileges; redirects to home if we try to access this but don't
export default async function ModerationPage() {
  const accessResult = await canAccessModerationAction();

  if (!accessResult.success) {
    return (
      <main>
        <h1>Moderation Queue</h1>
        <p>{accessResult.error}</p>
      </main>
    );
  }

  if (!accessResult.data.isModerator) {
    redirect("/home");
  }

  const [feedResult, userResult] = await Promise.all([
    getModerationReportsAction(25),
    getUserReportsAction(25),
  ]);

  if (!feedResult.success) {
    return (
      <main>
        <h1>Moderation Queue</h1>
        <p>{feedResult.error}</p>
      </main>
    );
  }

  if (!userResult.success) {
    return (
      <main>
        <h1>Moderation Queue</h1>
        <p>{userResult.error}</p>
      </main>
    );
  }

  return (
    <Box maw={1080} mx="auto" p="md">
      <Stack
        gap={0}
        maw={640}
        mx="auto"
        style={{ overflowX: "hidden" }}
      >
        <Title c="gray.8" my={12} fw={"normal"}>Reports</Title>
        <LSModerationQueue
          feedReports={feedResult.data}
          userReports={userResult.data}
        />
      </Stack>
    </Box>
  );
}
