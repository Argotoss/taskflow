import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import {
  AddMemberRequest,
  Membership,
  UpdateMemberRoleRequest,
  addMemberRequestSchema,
  membershipSchema,
  updateMemberRoleRequestSchema,
} from '@taskflow/shared';
import { z } from 'zod';

import { useAuth } from '../auth';

const membershipsSchema = z.array(membershipSchema);

export const membershipsQueryKey = (projectId: string) => ['project', projectId, 'memberships'];

export const useMembershipsQuery = (projectId?: string) => {
  const { request } = useAuth();

  return useQuery({
    queryKey: projectId ? membershipsQueryKey(projectId) : ['project', 'memberships'],
    enabled: Boolean(projectId),
    queryFn: async () =>
      request(
        {
          method: 'GET',
          url: `/projects/${projectId}/memberships`,
        },
        membershipsSchema,
      ),
  });
};

export const useInviteMemberMutation = (projectId: string) => {
  const { request } = useAuth();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (payload: AddMemberRequest) =>
      request(
        {
          method: 'POST',
          url: `/projects/${projectId}/memberships`,
          data: addMemberRequestSchema.parse(payload),
        },
        membershipSchema,
      ),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: membershipsQueryKey(projectId) });
    },
  });
};

export const useUpdateMemberRoleMutation = (projectId: string, membershipId: string) => {
  const { request } = useAuth();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (payload: UpdateMemberRoleRequest) =>
      request(
        {
          method: 'PATCH',
          url: `/projects/${projectId}/memberships/${membershipId}`,
          data: updateMemberRoleRequestSchema.parse(payload),
        },
        membershipSchema,
      ),
    onSuccess: (membership: Membership) => {
      queryClient.invalidateQueries({ queryKey: membershipsQueryKey(projectId) });
      queryClient.setQueryData(membershipsQueryKey(projectId), (prev?: Membership[]) => {
        if (!prev) {
          return prev;
        }

        return prev.map((item) => (item.id === membership.id ? membership : item));
      });
    },
  });
};

export const useRemoveMemberMutation = (projectId: string, membershipId: string) => {
  const { request } = useAuth();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async () =>
      request(
        {
          method: 'DELETE',
          url: `/projects/${projectId}/memberships/${membershipId}`,
        },
        z.any(),
      ),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: membershipsQueryKey(projectId) });
    },
  });
};
