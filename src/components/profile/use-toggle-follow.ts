import { useMutation, useQueryClient } from '@tanstack/react-query';
import { toggleFollowAction } from '@/lib/actions/profile';
import { profileKeys } from '@/lib/query-keys';
import { User } from '@/lib/types/feed';

export function useToggleFollow(targetUserId: string, currentUserId: string) {
  const queryClient = useQueryClient();
  const userFollowingKeys = profileKeys.following(currentUserId);

  return useMutation({
    mutationFn: async () => {
      const res = await toggleFollowAction({ targetUserId });
      if(!res.success) {
        throw new Error(res.error ?? 'Failed to update follow state');
      }
      return res;
    },
    onMutate: async () => {
      await queryClient.cancelQueries({ queryKey: userFollowingKeys});
      const snapshot = queryClient.getQueryData<User[]>(userFollowingKeys);
      
      queryClient.setQueryData(userFollowingKeys, (old: User[] | undefined) => {
        if(!old) return old;
        const following = old.some((f) => f.user_id === targetUserId);
        if(!following) {
          return [...old, { user_id: targetUserId } as User]
        }
        return old.filter((f) => f.user_id !== targetUserId);
      });

      return { snapshot };
    },
    onSettled: async () => {
      queryClient.invalidateQueries({ queryKey: profileKeys.followers(currentUserId)});
      queryClient.invalidateQueries({ queryKey: userFollowingKeys });
    },
    onError: (err, _vars, context) => {
      if(context?.snapshot) {
        queryClient.setQueryData(userFollowingKeys, context.snapshot);
      }
      console.error(err.message);
    }
  });
}