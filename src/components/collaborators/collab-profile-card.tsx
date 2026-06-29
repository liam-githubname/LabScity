import { Avatar, Badge, Button, Card, Group, Stack, Text } from "@mantine/core";
import { IconMessageCircle, IconUserPlus } from "@tabler/icons-react";
import classes from './collaborators.module.css';

import { CollabProfileProps } from "./collab-profile-types";
import PercentMatchBadge from "./percent-match-badge";
import FollowButton from "./follow-button";

export default function CollabProfileCard(
  {
    percentMatch, 
    collabUserId, 
    firstName, 
    lastName, 
    avatarUrl, 
    occupation,
    workplace,
    openToCollab,
    about,
    isFollowing,
    closestTopics
  }
  : 
  CollabProfileProps 
) {
  const userName = `${firstName} ${lastName}`.trim()
  const initials = `${firstName[0]}${lastName[0]}`
  const hasMiddot = occupation && workplace;

  return (
    <Card
      w='100%'
      bd='1px solid gray.3'
      p='0'
      bdrs='0.75rem'
      c='navy.7'
    >
      <Group 
        p='1rem' 
        gap='0.875rem' 
        wrap='nowrap'
        align="flex-start"
      >
        {/* Avatar and Open Badge */}
        <Stack gap='0.5rem' align='center'>
          <Avatar
            size="48"
            radius="xl"
            bg="navy.7"
            src={avatarUrl || undefined}
          >
            {initials}
          </Avatar>
          {
            openToCollab &&
            <Badge
              color='green.2'
              c='green.9'
              tt='none'
              p='2px 6px'
            >
              Open
            </Badge>
          }
        </Stack>
        
        {/* Profile Details */}
        <Stack w='100%' gap='0'>
          {/* Full Name and Percent Match Badge */}
          <Group justify='space-between' wrap='nowrap'>
            <Text 
              fw='600'
              fz='0.875rem'
              lh='1.25rem '
              style={{ display: 'inline' }}
              className={classes.headerName}
            >
              {userName}
            </Text>
            <PercentMatchBadge percentMatch={percentMatch} text='Match'/>
          </Group>
          {/* Occupation + Workplace */}
          <Text
            fz='0.75rem'
            fw='400'
            lh='1.125rem'
            c='dimmed'
            truncate='end'
            mb='6px'
          >
            {`${occupation || ''}${hasMiddot ? ' · ': ''}${workplace || ''}`}
          </Text>
          <Text
            fz='0.75rem'
            fw='400'
            lh='1.25rem'
            lineClamp={3}
            mb='8px'
          >
            {about}
          </Text>
          {/* Closest Topics */}
          <Group gap='0 4px' mb='10px'>
            {
              closestTopics.map((topic, i) => 
                <Badge
                  key={i}
                  bg='gray.2'
                  p='1.5px 8px 2.5px 8px'
                  c='var(--mantine-color-text)'
                  fw='500'
                  tt='none'
                  fz='0.625rem'
                >
                  {topic}
                </Badge>
              )
            }
          </Group>
          {/* Follow and DM Buttons */}
          <Group gap='8'>
            <FollowButton 
              targetUserId={collabUserId}
              isFollowing={isFollowing}
            />
            <Button
              variant='outline'
              bdrs='8px'
              p='6px 12px'
              leftSection={<IconMessageCircle size='0.875rem' stroke='2.2'/>}
              styles={{ section: { marginInlineEnd: '4px'} }}
              c='navy.7'
              bd='1px solid gray.3'
            >
              <Text fz='0.75rem' fw='500'>
                Message
              </Text>
            </Button>
          </Group>
        </Stack>
      </Group>
    </Card>
  )
}