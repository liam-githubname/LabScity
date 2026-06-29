'use client';

import { Card, Text, Stack, Flex, Badge } from "@mantine/core";
import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import { getTrendingScientificFields } from "@/lib/actions/feed";
interface TrendingWidgetProps {
  hashtags?: string[];
}

export function TrendingWidget({ hashtags: initialHashtags }: TrendingWidgetProps) {
  const router = useRouter();
  const [hashtags, setHashtags] = useState<string[]>(initialHashtags || []);

  useEffect(() => {
    if (initialHashtags) return; // Use provided hashtags if available

    const fetchTrendingFields = async () => {
      try {
        const result = await getTrendingScientificFields();
        if (result.success && result.data) {
          setHashtags(result.data.hashtags);
        } else {
          // Fallback if fetch fails
          setHashtags(Array(5).fill("FeedMeMorePosts"));
        }
      } catch {
        // Fallback if fetch fails
        setHashtags(Array(5).fill("FeedMeMorePosts"));
      } 
    };

    fetchTrendingFields();
  }, [initialHashtags]);

  return (
    <Card bg="gray.0" p="md" w="100%" radius="md" shadow="sm">
      <Stack>

        <Text
          c="gray.7"
          fw="bold"
          fz="xl"
        >
          Trending
        </Text>

        {/* the hashtags */}
          <Flex wrap="wrap" gap={6} mb="lg" justify="flex-start">
            {
              hashtags.map((hashtag, index) => (
                <Badge
                  key={index}
                  component="button"
                  type="button"
                  color="gray.7"
                  fw="normal"
                  fz="sm"
                  p={12}
                  tt="lowercase"
                  variant="outline"
                  style={{ cursor: "pointer" }}
                  onClick={() =>
                    router.push(`/search?q=${encodeURIComponent(hashtag)}`)
                  }
                  aria-label={`Search for ${hashtag}`}
                >
                  #{hashtag}
                </Badge>
              ))
            }
          </Flex>
      </Stack>
    </Card >
  );
}
