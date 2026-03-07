import { Modal, Stack } from "@mantine/core";
import type { User } from "@/lib/types/feed";
import LSMiniProfile from "@/components/profile/ls-mini-profile";

/**
 * Props for LSProfileListModal.
 *
 * @param title - Modal title (e.g. "Friends", "Following").
 * @param profiles - Full list of User objects to render as LSMiniProfile rows.
 * @param opened - Controlled open state.
 * @param onClose - Called when the modal is closed.
 */
export interface LSProfileListModalProps {
  title: string;
  profiles: User[];
  opened: boolean;
  onClose: () => void;
}

/**
 * Scrollable modal that displays a full list of user profiles (body capped at 60vh with overflow).
 * Shared by the Friends and Following widgets on the profile page when "Show all X" is clicked.
 */
export default function LSProfileListModal({
  title,
  profiles,
  opened,
  onClose,
}: LSProfileListModalProps) {
  return (
    <Modal
      opened={opened}
      onClose={onClose}
      title={title}
      centered
      size="md"
      styles={{ body: { maxHeight: "60vh", overflowY: "auto" } }}
    >
      <Stack gap={12}>
        {profiles.map((profile) => (
          <LSMiniProfile
            key={profile.user_id}
            userId={profile.user_id}
            posterEmail={profile.email}
            posterName={profile.first_name + " " + profile.last_name}
            posterResearchInterest={profile.research_interests?.at(0) ?? ""}
            posterProfilePicURL={profile.avatar_url ?? undefined}
          />
        ))}
      </Stack>
    </Modal>
  );
}
