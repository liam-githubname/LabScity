import type { Metadata } from "next";
import { HomeFeed } from "@/components/feed/home-feed";
import type { FeedPostItem } from "@/lib/types/feed";

export const metadata: Metadata = {
	title: "Home | LabScity",
	description: "Discover research updates from the LabScity community.",
};

export default async function HomePage() {
	// TODO: Replace with server action + TanStack Query hydration.
	const initialPosts: FeedPostItem[] = [
		{
			id: "temp-following",
			userName: "Name",
			scientificField: "Research Interests / Subject of Post",
			content: "Lorem ipsum...",
			timeAgo: "1 HOUR AGO",
			comments: [],
			isLiked: false,
			audienceLabel: "Following",
		},
		{
			id: "temp-for-you",
			userName: "Name",
			scientificField: "Research Interests",
			content: "Another update from the community...",
			timeAgo: "2 HOURS AGO",
			comments: [],
			isLiked: false,
			audienceLabel: "For you",
		},
	];

	return <HomeFeed initialPosts={initialPosts} />;
}
