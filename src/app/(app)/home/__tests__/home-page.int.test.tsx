import { dehydrate, HydrationBoundary } from "@tanstack/react-query";
import { screen, waitFor } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";
import { HomeFeed } from "@/components/feed/home-feed";
import {
	createComment,
	createPost,
	createPostImageUploadUrl,
	createReport,
	deletePost,
	getFeed,
	likeComment,
	likePost,
} from "@/lib/actions/feed";
import { feedKeys } from "@/lib/query-keys";
import { feedFilterSchema } from "@/lib/validations/post";
import { createTestQueryClient } from "@/tests/utils/TestProviders";
import { renderWithProviders } from "@/tests/utils/render";
import { makeFeedPost } from "@/tests/fixtures/feed";
import { resetFeedStore } from "@/tests/mocks/feedActions.mock";

const defaultFeedFilter = feedFilterSchema.parse({});

async function prefetchAndDehydrate() {
	const queryClient = createTestQueryClient();
	await queryClient.prefetchQuery({
		queryKey: feedKeys.list(defaultFeedFilter),
		queryFn: async () => {
			const result = await getFeed(defaultFeedFilter);
			if (!result.success || !result.data) {
				throw new Error(result.error ?? "Failed to fetch feed");
			}
			return result.data;
		},
	});
	return { queryClient, dehydratedState: dehydrate(queryClient) };
}

describe("HomePage / HomeFeed hydration", () => {
	it("shows initial hydrated feed with New Post button and post cards and no loading state", async () => {
		resetFeedStore([
			makeFeedPost({
				id: "hydrated-post-1",
				content: "First hydrated post content",
				userName: "Dr. Jane Smith",
			}),
			makeFeedPost({
				id: "hydrated-post-2",
				content: "Second hydrated post content",
				userName: "Dr. John Doe",
			}),
		]);

		const { queryClient, dehydratedState } = await prefetchAndDehydrate();

		renderWithProviders(
			<HydrationBoundary state={dehydratedState}>
				<HomeFeed
					createPostAction={createPost}
					createPostImageUploadUrlAction={createPostImageUploadUrl}
					createCommentAction={createComment}
					createReportAction={createReport}
					likePostAction={likePost}
					likeCommentAction={likeComment}
					deletePostAction={deletePost}
					currentUserId={null}
				/>
			</HydrationBoundary>,
			{ queryClient },
		);

		expect(
			screen.getByRole("button", { name: /new post/i }),
		).toBeInTheDocument();
		expect(screen.getByText("First hydrated post content")).toBeInTheDocument();
		expect(screen.getByText("Second hydrated post content")).toBeInTheDocument();
		expect(screen.queryByText("Loading feed...")).not.toBeInTheDocument();
	});

	it("shows error message and no posts when prefetch fails", async () => {
		const failResult = Promise.resolve({
			success: false,
			error: "Failed to fetch feed",
		} as const);
		// Prefetch and refetchOnMount both call getFeed; mock both to fail.
		vi.mocked(getFeed).mockImplementationOnce(() => failResult);
		vi.mocked(getFeed).mockImplementationOnce(() => failResult);

		const queryClient = createTestQueryClient();
		await queryClient.prefetchQuery({
			queryKey: feedKeys.list(defaultFeedFilter),
			queryFn: async () => {
				const result = await getFeed(defaultFeedFilter);
				if (!result.success || !result.data) {
					throw new Error(result.error ?? "Failed to fetch feed");
				}
				return result.data;
			},
		});

		renderWithProviders(
			<HomeFeed
				createPostAction={createPost}
				createPostImageUploadUrlAction={createPostImageUploadUrl}
				createCommentAction={createComment}
				createReportAction={createReport}
				likePostAction={likePost}
				likeCommentAction={likeComment}
				deletePostAction={deletePost}
				currentUserId={null}
			/>,
			{ queryClient },
		);

		await waitFor(() => {
			expect(screen.getByText("Failed to fetch feed")).toBeInTheDocument();
		});
		expect(screen.queryByText("Loading feed...")).not.toBeInTheDocument();
		expect(
			document.querySelectorAll('[class*="postStack"]'),
		).toHaveLength(0);
	});
});
