import { Card, Group, Skeleton, Stack } from "@mantine/core"

function CollabProfileSkeleton() {
  return (
    <>
      <Group
        p='0.75rem 1rem'
        wrap='nowrap' 
        mr='1rem'
      >
        <Group
          gap="sm" 
          align="center" 
          wrap='nowrap' 
          flex='1'
        >
          <Skeleton circle={true} height='38px'/>
          <Stack 
            gap='6px' 
            flex='1'
            style={{ overflow: 'hidden' }}
          >
            <Skeleton radius='100' height='0.875rem' width='100%'/>
            <Skeleton radius='100' height='0.75rem' width='80%'/>
            <Skeleton radius='100' height='0.75rem' width='50%'/>
            <Skeleton radius='100' height='0.75rem' width='70%'/>
            <Skeleton radius='100' height='0.75rem' width='55%'/>
          </Stack>
        </Group>
        <Skeleton radius='100' height='36px' width='75px'/>
      </Group>
    </>
  )
}

export default function CollabRecommendationsSkeleton() {
  return (
    <Card 
      bg="gray.0" 
      p="0" 
      w="100%" 
      radius="md" 
      bd='1px solid gray.3'
      bdrs="lg"
    >
      <Stack gap='0'>
        <Group
          p='0.875rem 1rem'
          wrap='nowrap'
          justify='space-between'
        >
          <Stack gap='6' flex='3'>
            <Skeleton height='20px' width='100%' radius='100' />
            <Skeleton height='16px'width='80%' radius='100'/>
          </Stack>
          <Skeleton height ='20px' width='100%' radius='100' flex='1'/>
        </Group>
        <Stack gap='0'>
          {
            Array.from({ length: 3 }).map((_, i) => 
              <CollabProfileSkeleton key={i}/>
            )
          }
        </Stack>
      </Stack>
    </Card>
  )
}