import { Badge, Group, Text } from "@mantine/core";
import { IconStarFilled } from "@tabler/icons-react";

export default function PercentMatchBadge({percentMatch, text}: {percentMatch: number, text?: string}) {
  let similarityColor = 'gray';
  if(percentMatch >= 85)
    similarityColor = 'teal';
  else if(percentMatch >= 60)
    similarityColor = 'blue';

  return (
    <Badge
      bg={`${similarityColor}.1`}
      mt='4px'
      bd={`1px solid ${similarityColor}.3`}
      p='2px 6px'
      tt='none'
    >
      <Group wrap='nowrap' gap='2'>
        <IconStarFilled 
          color={`var(--mantine-color-${similarityColor}-8)`}
          size='12'
        />
        <Text
          fz='0.625rem'
          fw='600'
          c={`${similarityColor}.8`}
        >
          {percentMatch}% {text}
        </Text>
      </Group>
    </Badge>
  );
}