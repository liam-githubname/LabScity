import {
  useInfiniteQuery,
  useMutation,
  useQuery,
  useQueryClient,
} from "@tanstack/react-query";
import {
  addUsersToChat,
  createChat,
  editMessage,
  getChatsWithPreview,
  getOldMessages,
  leaveConversation,
  updateConversationName,
} from "@/lib/actions/chat";
import { chatKeys } from "@/lib/query-keys";

/**
 * React Query hook for fetching paginated messages from a conversation.
 * Supports infinite scroll for loading older messages.
 *
 * @param conversation_id - The ID of the conversation to fetch messages from
 * @returns React Query result object with pages of messages
 *
 * @example
 * ```typescript
 * const { data, fetchNextPage, hasNextPage, isFetchingNextPage } = useGetInfiniteMessages(123);
 * ```
 */
export function useGetInfiniteMessages(conversation_id: number) {
  return useInfiniteQuery({
    queryKey: chatKeys.oldMessages(conversation_id),
    initialPageParam: undefined as string | undefined,

    queryFn: async ({ pageParam }) => {
      const result = await getOldMessages(conversation_id, pageParam);
      if (!result.success || !result.data) {
        throw new Error("Failed to fetch messages");
      }
      return result.data;
    },

    getNextPageParam: (lastPage) => {
      if (!lastPage || lastPage.length < 50) {
        return undefined;
      }
      const oldestMessageInBatch = lastPage[0];
      return oldestMessageInBatch.created_at;
    },
  });
}

/**
 * React Query hook for fetching a single batch of older messages with cursor-based pagination.
 *
 * @param conversation_id - The ID of the conversation to fetch messages from
 * @param cursor - Optional timestamp of the oldest message currently loaded
 * @returns React Query result object with messages array
 *
 * @example
 * ```typescript
 * const { data, isLoading, error } = useGetOldMessages(123, "2024-01-15T10:30:00Z");
 * ```
 */
export function useGetOldMessages(conversation_id: number, cursor?: string) {
  return useQuery({
    queryKey: chatKeys.oldMessages(conversation_id, cursor),
    queryFn: async () => getOldMessages(conversation_id, cursor),
  });
}

/**
 * React Query hook for fetching all conversations with their most recent message.
 * Used for the chat sidebar.
 *
 * @returns React Query result object with array of ChatPreview objects
 *
 * @example
 * ```typescript
 * const { data, isLoading, error } = useGetChatsWithPreview();
 * ```
 */
export function useGetChatsWithPreview() {
  return useQuery({
    queryKey: chatKeys.chatsWithPreview(),
    queryFn: async () => getChatsWithPreview(),
  });
}

/**
 * React Query hook for leaving a conversation.
 * On success, invalidates the chats sidebar query to remove the conversation from the list.
 *
 * @returns React Query mutation object
 *
 * @example
 * ```typescript
 * const leaveMutation = useLeaveConversation();
 * leaveMutation.mutate(123);
 * ```
 */
export function useLeaveConversation() {
  const queryClient = useQueryClient();

  return useMutation({
    // Notice how the variable goes HERE now, not in the main hook definition
    mutationFn: async (conversation_id: number) =>
      leaveConversation(conversation_id),
    onSuccess: () => {
      // Benefit! If we leave a chat, we invalidate the sidebar query
      // so the chat immediately disappears from the user's screen.
      queryClient.invalidateQueries({ queryKey: chatKeys.chatsWithPreview() });
    },
  });
}

/**
 * React Query hook for adding users to an existing conversation.
 * On success, invalidates the chats sidebar query to refresh the participant list.
 *
 * @returns React Query mutation object
 *
 * @example
 * ```typescript
 * const mutation = useAddUsersToChat();
 * mutation.mutate({ conversation_id: 123, invitees: ['user-1', 'user-2'] });
 * ```
 */
export function useAddUsersToChat() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({
      conversation_id,
      invitees,
    }: {
      conversation_id: number;
      invitees: string[];
    }) => addUsersToChat(conversation_id, invitees),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: chatKeys.chatsWithPreview() });
    },
  });
}

/**
 * React Query hook for creating a new conversation.
 * On success, invalidates the chats sidebar query to show the new conversation.
 *
 * @returns React Query mutation object
 *
 * @example
 * ```typescript
 * const mutation = useCreateChat();
 * mutation.mutate(['user-1', 'user-2']);
 * ```
 */
export function useCreateChat() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (invitees: string[]) => createChat(invitees),
    onSuccess: () => {
      // Benefit! If we make a new chat, refresh the sidebar!
      queryClient.invalidateQueries({ queryKey: chatKeys.chatsWithPreview() });
    },
  });
}

/**
 * React Query hook for updating a conversation's name.
 * On success, invalidates the chats sidebar query to reflect the name change.
 *
 * @returns React Query mutation object
 *
 * @example
 * ```typescript
 * const mutation = useUpdateConversationName();
 * mutation.mutate({ id: 123, newName: "Project Team" });
 * ```
 */
export function useUpdateConversationName() {
  const queryClient = useQueryClient();

  return useMutation({
    // For multiple variables, pass an object!
    mutationFn: async ({ id, newName }: { id: number; newName: string }) =>
      updateConversationName(id, newName),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: chatKeys.chatsWithPreview() });
    },
  });
}

/**
 * React Query hook for editing a message's content.
 * On success, invalidates the messages query for that conversation to reflect the edit.
 *
 * @returns React Query mutation object
 *
 * @example
 * ```typescript
 * const mutation = useEditMessage();
 * mutation.mutate({ id: 456, newContent: "Updated message content" });
 * ```
 */
export function useEditMessage() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async ({
      id,
      newContent,
    }: {
      id: number;
      newContent: string;
    }) => editMessage(id, newContent),
    onSuccess: (results) => {
      if (results.success && results.data) {
        queryClient.invalidateQueries({
          queryKey: chatKeys.oldMessages(results.data.conversation_id),
        });
      }
    },
  });
}
