import { Button, Group, Text } from "@mantine/core";
import { IconUserPlus } from "@tabler/icons-react";
import classes from './collaborators.module.css';
import { useAuthContext } from "@/components/auth/auth-provider";
import { useToggleFollow } from "@/components/profile/use-toggle-follow";

export default function FollowButton(
  {targetUserId, isFollowing}
  :
  {targetUserId: string, isFollowing: boolean}
) {
  const { user } = useAuthContext();
 
  const { 
    mutate: followMutate, 
  } = useToggleFollow(targetUserId, user?.id ?? '');

  return (
    <Button
      bg={isFollowing ? 'navy.3' : 'navy.7'}
      c={isFollowing ? 'navy.7' : undefined}
      bdrs='8px'
      p='6px 10px'
      fz='0.75rem'
      onClick={() => followMutate()}
      className={classes.followBtn}
    >
      <Group 
        gap='4px' 
        wrap='nowrap' 
      >
        {
          !isFollowing && 
          <IconUserPlus size='0.875rem' stroke='2.2'/>
        }
        <Text fz='0.75rem' fw='500'>
          {isFollowing ? 'Following' : 'Follow' }
        </Text>
      </Group>
    </Button>
  );
}