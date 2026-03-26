import { Box, Center } from "@mantine/core";
import {
  dehydrate,
  HydrationBoundary,
  QueryClient,
} from "@tanstack/react-query";
import type { Metadata } from "next";
import { Suspense } from "react";
import { LSGroupsPageShell } from "@/components/groups/ls-groups-page-shell";
import { LSSpinner } from "@/components/ui/ls-spinner";
import {
  createComment,
  createPost,
  createPostImageUploadUrl,
  createReport,
  getFeed,
  likeComment,
  likePost,
} from "@/lib/actions/feed";
import {
  addMemberByEmail,
  createGroup,
  createGroupAvatarUploadUrl,
  deleteGroup,
  getGroupDetails,
  getGroups,
  inviteUsersToGroup,
  joinGroup,
  leaveGroup,
  removeMember,
  searchPublicGroups,
  updateGroup,
} from "@/lib/actions/groups";
import { groupKeys } from "@/lib/query-keys";
import { feedFilterSchema } from "@/lib/validations/post";

export const metadata: Metadata = {
  title: "Groups | LabScity",
  description: "Collaborate with your research groups on LabScity.",
};

export default async function GroupsPage({
  searchParams,
}: {
  searchParams: Promise<{ group?: string; tab?: string }>;
}) {
  const { group } = await searchParams;
  const activeGroupId = group ? Number(group) : undefined;

  const queryClient = new QueryClient();

  // Prefetch the user's group list (sidebar)
  await queryClient.prefetchQuery({
    queryKey: groupKeys.list(),
    queryFn: async () => {
      const result = await getGroups();
      if (!result.success || !result.data) {
        throw new Error(result.error ?? "Failed to fetch groups");
      }
      return result.data;
    },
  });

  // If a group is selected, prefetch its details and feed in parallel
  if (activeGroupId) {
    const groupFeedFilter = feedFilterSchema.parse({ groupId: activeGroupId });

    await Promise.all([
      queryClient.prefetchQuery({
        queryKey: groupKeys.detail(activeGroupId),
        queryFn: async () => {
          const result = await getGroupDetails(activeGroupId);
          if (!result.success || !result.data) {
            throw new Error(result.error ?? "Failed to fetch group details");
          }
          return result.data;
        },
      }),
      queryClient.prefetchQuery({
        queryKey: groupKeys.feed(activeGroupId, groupFeedFilter),
        queryFn: async () => {
          const result = await getFeed(groupFeedFilter);
          if (!result.success || !result.data) {
            throw new Error(result.error ?? "Failed to fetch group feed");
          }
          return result.data;
        },
      }),
    ]);
  }

  const dehydratedState = dehydrate(queryClient);

  return (
    <HydrationBoundary state={dehydratedState}>
      <Suspense
        fallback={
          <Box p="xl">
            <Center>
              <LSSpinner />
            </Center>
          </Box>
        }
      >
        <LSGroupsPageShell
          activeGroupId={activeGroupId}
          createGroupAvatarUploadUrlAction={createGroupAvatarUploadUrl}
          createGroupAction={createGroup}
          joinGroupAction={joinGroup}
          leaveGroupAction={leaveGroup}
          deleteGroupAction={deleteGroup}
          addMemberByEmailAction={addMemberByEmail}
          inviteUsersToGroupAction={inviteUsersToGroup}
          removeMemberAction={removeMember}
          updateGroupAction={updateGroup}
          createPostAction={createPost}
          createPostImageUploadUrlAction={createPostImageUploadUrl}
          createCommentAction={createComment}
          createReportAction={createReport}
          likePostAction={likePost}
          likeCommentAction={likeComment}
          searchPublicGroupsAction={searchPublicGroups}
          getGroupsAction={getGroups}
        />
      </Suspense>
    </HydrationBoundary>
  );
}
