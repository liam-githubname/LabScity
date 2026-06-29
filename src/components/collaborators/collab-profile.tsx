import { Anchor, Text, Avatar, Group, Stack, Badge, Button, UnstyledButton, Divider } from "@mantine/core";
import { CollabProfileProps } from "./collab-profile-types";
import Link from "next/link";
import PercentMatchBadge from "./percent-match-badge";
import { IconMessageCircle, IconUserPlus } from "@tabler/icons-react";
import classes from './collaborators.module.css'

import { useToggleFollow } from "@/components/profile/use-toggle-follow";
import { useAuthContext } from "@/components/auth/auth-provider";
import FollowButton from "./follow-button";

export default function CollabProfile (
  {
    percentMatch, 
    collabUserId, 
    firstName, 
    lastName, 
    avatarUrl, 
    occupation,
    workplace,
    openToCollab = false,
    isFollowing,
    last,
    closestTopics
  }
  : 
  CollabProfileProps 
) {
  const userName = `${firstName} ${lastName}`.trim()
  const initials = `${firstName[0]}${lastName[0]}`
  const hasMiddot = occupation && workplace;

  return (
    <>
      <Group
        p='0.75rem 1rem'
        wrap='nowrap' 
        mr='1rem'
        style={{ 
          overflow: 'hidden' 
        }}
      >
        <Anchor
          component={Link}
          href={`/profile/${collabUserId}`}
          underline='never'
          miw='0'
          draggable={false}
        >
          <Group 
            gap="sm" 
            align="center" 
            wrap='nowrap' 
            style={{ overflow: 'hidden' }}
          >
            <Avatar
              size="md"
              radius="xl"
              bg="navy.7"
              src={avatarUrl || undefined}
            >
              {initials}
            </Avatar>
            <Stack 
              gap='0' 
              flex='1'
              style={{ overflow: 'hidden' }}
            >
              <Group gap='6' wrap='nowrap'>
                <Text 
                  component="span" 
                  fw='600'
                  fz='0.875rem'
                  lh='0.875rem'
                  style={{ display: 'inline' }}
                  c='var(--mantine-color-text)'
                  className={classes.headerName}
                >
                  {userName}
                </Text>
                {
                  openToCollab &&
                  <Badge
                    color='green.2'
                    c='green.9'
                    tt='none'
                    p='2px 6px'
                    style={{flexShrink: 0}}
                  >
                    Open
                  </Badge>
                }
              </Group>
              <Text
                fz='0.6875rem'
                fw='400'
                c='dimmed'
                truncate='end'
                mt='2px'
              >
                {`${occupation || ''}${hasMiddot ? ' · ': ''}${workplace || ''}`}
              </Text>
              <Group 
                gap='4px' 
                mt='4px'
              >
                {
                  closestTopics.map((topic, i) => 
                    <Badge
                      key={i}
                      bg='gray.2'
                      c='var(--mantine-color-text)'
                      fw='500'
                      tt='none'
                      fz='0.625rem'
                      p='1.5px 8px 2.5px 8px'
                      style={{ cursor: 'pointer' }}
                    >
                      {topic}
                    </Badge>
                  )
                }
              </Group>
              <PercentMatchBadge percentMatch={percentMatch}/>
            </Stack>
          </Group>
        </Anchor>
        <Stack 
          flex='1'
          align='flex-end'
          gap='6px'
        >
          <FollowButton 
            targetUserId={collabUserId}
            isFollowing={isFollowing}
          />
          <UnstyledButton p='4px'>
            <IconMessageCircle 
              size='1.25rem'
              stroke='1.5'
              color='var(--mantine-color-dimmed)'
            />
          </UnstyledButton>
        </Stack>
      </Group>
      { !last && <Divider mr='1rem' color='gray.2'/> }
    </>
  )
};