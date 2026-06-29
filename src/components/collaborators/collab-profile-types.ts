export interface CollabProfileProps {
  percentMatch: number;
  collabUserId: string;
  firstName: string;
  lastName: string;
  avatarUrl?: string | null;
  occupation?: string | null;
  workplace?: string | null;
  openToCollab: boolean;
  about?: string | null;
  last?: boolean;
  isFollowing: boolean;
  closestTopics: string[];
}