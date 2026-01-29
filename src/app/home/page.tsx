import type { Metadata } from "next";
import { HomeFeed } from "@/components/feed/home-feed";
import type { FeedPostItem } from "@/lib/types/feed";

export const metadata: Metadata = {
	title: "Home | LabScity",
	description: "Discover research updates from the LabScity community.",
};

export default async function HomePage() {
	// TODO: Replace with server action + TanStack Query hydration.
	const initialPosts: FeedPostItem[] = [];

	return <HomeFeed initialPosts={initialPosts} />;
}
