'use client';

import { GetCollaboratorsResult } from "@/lib/types/collab";
import {
  Button, 
  Card, 
  Flex, 
  Group, 
  Stack, 
  Text, 
  UnstyledButton, 
  Modal,
  ActionIcon,
  TextInput,
  SimpleGrid
} from "@mantine/core";
import { useDisclosure } from "@mantine/hooks";
import { Fragment } from "react/jsx-runtime";
import { 
  IconAdjustmentsHorizontal,
  IconChevronDown,
  IconChevronRight, 
  IconRefresh, 
  IconSearch, 
  IconXFilled
} from "@tabler/icons-react";
import CollabRecommendationsSkeleton from "./collab-recommendations-skeleton";

import classes from './collaborators.module.css';
import { useQuery } from "@tanstack/react-query";
import CollabProfileCard from "./collab-profile-card";
import CollabProfile from "./collab-profile";
import LSChip from "./ls-chip";
import { useAuthContext } from "../auth/auth-provider";
import { useUserFollowing } from "../profile/use-profile";

export default function CollabRecommendations() {
  const [opened, {open, close}] = useDisclosure(false);
  const { user } = useAuthContext();
  const { data: following, isLoading: followingLoading} = useUserFollowing(user?.id ?? '');
  const { data: collabs, isLoading: collabsLoading, error } = useQuery({
    queryKey: ['collaborators'],
    queryFn: async () => {
      const res = await fetch('/api/collaborators');
      if(!res.ok) throw new Error(`Failed to fetch collaborators: ${res.status}`);

      const data: GetCollaboratorsResult[] = await res.json();

      return data;
    },
    select: (collabs) => collabs.map((c, i) => ({
      percentMatch: parseInt((c.cosine_similarity*100).toFixed(2)),
      collabUserId: c.profile_user_id,
      firstName: c.first_name,
      lastName: c.last_name,
      avatarUrl: c.profile_pic_path,
      occupation: c.occupation,
      workplace: c.workplace,
      openToCollab: true,
      about: 'Lorem ipsum dolor sit amet, consectetur adipiscing elit. Sed do eiusmod tempor incididunt ut labore et dolore magna aliqua. Ut enim ad minim veniam, quis nostrud exercitation ullamco laboris nisi ut aliquip ex ea commodo consequat. Duis aute irure dolor in reprehenderit in voluptate velit esse cillum dolore eu fugiat nulla pariatur. Excepteur sint occaecat cupidatat non proident, sunt in culpa qui officia deserunt mollit anim id est laborum.',
      closestTopics: ['Topically 1', 'Topically 2', 'Topically 3'],
      isFollowing: following?.some((f) => f.user_id === c.profile_user_id) ?? false,
      last: i === collabs.length - 1
    }))
  }) 

  if (collabsLoading || followingLoading) {
    return (
      <CollabRecommendationsSkeleton />
    )
  }

  if(error) {
    console.error(error);
  }

  const num_collabs = collabs?.length ?? 0;


  return (
    <Card 
      bg="gray.0" 
      p="0" 
      w="100%" 
      radius="md" 
      bd='1px solid gray.3'
      bdrs="lg"
      shadow="sm"
    >
      <Modal.Root opened={opened} onClose={close} size='900px'>
        <Modal.Overlay />
        <Modal.Content bdrs="lg">
          <Modal.Header p='0'>
            <Group
              p='1rem 1.5rem'
              w='100%'
              wrap='nowrap'
              justify='space-between'
              style={{ borderBottom: '1px solid var(--mantine-color-gray-3)' }}
              gap='0'
            >
              <Stack gap='2'>
                <Text
                  fw="600"
                  fz="md"
                  lh='1.2rem'
                  style={{ wordBreak: 'break-word' }}
                >
                  Recommended Collaborators
                </Text>
                <Text
                  c='dimmed'
                  fz='xs'
                  lh='1rem'
                >
                  Based on your research and skills · {num_collabs} match{num_collabs > 1 && 'es'} found
                </Text>
              </Stack>
              <Group gap='0.5rem'>
                <Button 
                  variant='outline'
                  c='dimmed'
                  bd='1px solid gray.3'
                  bdrs='md'
                  fw='400'
                  p='0.5rem 0.75rem'
                >
                  <Group gap='6px'>
                    <IconAdjustmentsHorizontal size='1rem' stroke='1.5'/>
                    Sort
                    <IconChevronDown size='0.75rem'/>
                  </Group>
                </Button>
                <ActionIcon
                  c='dimmed'
                  bd='1px solid gray.3'
                  bdrs='md'
                  p='4'
                  onClick={close}
                  variant='outline'
                >
                  <IconXFilled size='1rem'/>
                </ActionIcon>
              </Group>
            </Group>
          </Modal.Header>
          <Stack 
            p='0.75rem 1.5rem'
            gap='0.625rem'
            style={{ borderBottom: '1px solid var(--mantine-color-gray-2)' }}
          >
            <TextInput
              leftSection={<IconSearch size='16'/>}
              radius='12px'
              placeholder='Search by name, institution, or skill...'
            />
            <Group gap='0.5rem'>
              <LSChip defaultChecked={true} value='all'>
                All
              </LSChip>
              <LSChip value='open'>
                Open to collaborate
              </LSChip>
              <LSChip value='highMatch'>
                High match (85%+)
              </LSChip>
              <LSChip value='sameField'>
                Same field
              </LSChip>
            </Group>
          </Stack>
          <SimpleGrid 
            p='1.5rem'
            type='container'
            cols={{ base: 1, '400px': 2, }}
          >
            {
              collabs 
              ?
              collabs?.map((c) => 
                <CollabProfileCard 
                  key={c.collabUserId}
                  {...c}
                />
              )
              : undefined
            }
          </SimpleGrid>
        </Modal.Content>
      </Modal.Root>

      <Stack gap='0'>
        <Group
          p='0.875rem 1rem'
          wrap='nowrap'
          justify='space-between'
          style={{ borderBottom: '1px solid var(--mantine-color-gray-3)' }}
          gap='0'
        >
          <Stack gap='2'>
            <Text
              fw="600"
              fz="md"
              lh='1.2rem'
              style={{ wordBreak: 'break-word' }}
            >
              Recommended Collaborators
            </Text>
            <Text
              c='dimmed'
              fz='xs'
              lh='1rem'
            >
              Based on your research and skills
            </Text>
          </Stack>
          <Group wrap='nowrap' gap='4px'>
            <UnstyledButton
              display='flex'
              p='8px'
              bdrs='100px'
              className={classes.headerBtn}
            >
              <IconRefresh
                size='1.25rem'
                color='var(--mantine-color-dimmed)'
                stroke='1.5'
                style={{ flexShrink: 0 }}
              />
            </UnstyledButton>
            {
              !error
              ? 
              <UnstyledButton
                ta='center'
                fz='xs'
                c='indigo.9'
                fw='500'
                p='8px'
                bdrs='100px'
                className={classes.headerBtn}
                onClick={open}
              >
                <Flex 
                  wrap='nowrap'
                  justify='flex-end'
                  align='center'
                >
                  See all
                  <IconChevronRight
                    size='0.75rem'
                    color='currentColor'
                    stroke='2.5'
                    style={{ flexShrink: 0 }}
                  />
                </Flex>
              </UnstyledButton>
              : undefined
            }
          </Group>
        </Group>
        <Stack gap='0'>
          {
            (!error && collabs) 
            ?
            collabs
            .map((c, i) => 
              <Fragment key={c.collabUserId}>
                <CollabProfile 
                  {...c}
                />
              </Fragment>
            )
            : 
            <Stack gap='0' p='0.75rem 1rem'>
              <Text c='red.7' fw='700'>
                Error:
              </Text>
              <Text c='red.7'>
                Unexpected error occurred trying to find collaborators...
              </Text>
            </Stack>
          }
        </Stack>
      </Stack>
    </Card>
  );
}