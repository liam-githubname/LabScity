"use client";

import { Card, Text, Stack, Flex, Badge } from "@mantine/core";
import { useEffect, useState } from "react";
import { getTrendingScientificFields } from "@/lib/actions/feed";
import { LSSpinner } from "../ui/ls-spinner";

interface TrendingWidgetProps {
  hashtags?: string[];
}

export function TrendingWidget({ hashtags: initialHashtags }: TrendingWidgetProps) {
  const [hashtags, setHashtags] = useState<string[]>(initialHashtags || []);
  const [isLoading, setIsLoading] = useState(!initialHashtags);

  useEffect(() => {
    if (initialHashtags) return; // Use provided hashtags if available

    const fetchTrendingFields = async () => {
      try {
        const result = await getTrendingScientificFields();
        if (result.success && result.data) {
          setHashtags(result.data.hashtags);
        } else {
          // Fallback if fetch fails
          setHashtags(Array(5).fill("#FeedMeMorePosts"));
        }
      } catch {
        // Fallback if fetch fails
        setHashtags(Array(5).fill("#FeedMeMorePosts"));
      } finally {
        setIsLoading(false);
      }
    };

    fetchTrendingFields();
  }, [initialHashtags]);

  return (
    <Card
      bg="gray.0"
      p="md"
      radius="lg"
      shadow="sm"
    >
      <Stack gap="md">
        <Text
          c="navy.7"
          fw={600}
          fz="xl"
        >
          Trending
        </Text>
        {/* the hashtags */}
        <Flex wrap="wrap" gap={6} justify="flex-start">
          {isLoading ? (
            <LSSpinner />
          ) : (
            hashtags.map((hashtag, index) => (
              <Badge
                color="navy.7"
                fw="normal"
                fz="sm"
                key={index}
                p={12}
                tt="lowercase"
                variant="outline"
              >
                {hashtag}
              </Badge>
            ))
          )}
        </Flex>
      </Stack>
    </Card>
  );
}
