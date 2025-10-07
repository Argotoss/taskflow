import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import {
  CreateProjectRequest,
  Project,
  ProjectStatus,
  createProjectRequestSchema,
  projectSchema,
} from '@taskflow/shared';
import { z } from 'zod';

import { useAuth } from '../auth';

const projectsSchema = z.array(projectSchema);

export const projectsQueryKey = (filters?: { status?: ProjectStatus }) => [
  'projects',
  filters ?? {},
];

export const projectQueryKey = (projectId: string) => ['project', projectId];

export const useProjectsQuery = (filters?: { status?: ProjectStatus }) => {
  const { request } = useAuth();

  return useQuery({
    queryKey: projectsQueryKey(filters),
    queryFn: async () =>
      request(
        {
          method: 'GET',
          url: '/projects',
          params: filters,
        },
        projectsSchema,
      ),
  });
};

export const useProjectQuery = (projectId?: string) => {
  const { request } = useAuth();

  return useQuery({
    queryKey: projectId ? projectQueryKey(projectId) : ['project'],
    enabled: Boolean(projectId),
    queryFn: async () =>
      request(
        {
          method: 'GET',
          url: `/projects/${projectId}`,
        },
        projectSchema,
      ),
  });
};

export const useCreateProjectMutation = () => {
  const { request } = useAuth();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (payload: CreateProjectRequest) =>
      request(
        {
          method: 'POST',
          url: '/projects',
          data: createProjectRequestSchema.parse(payload),
        },
        projectSchema,
      ),
    onSuccess: (project: Project) => {
      queryClient.invalidateQueries({ queryKey: projectsQueryKey() });
      queryClient.setQueryData(projectQueryKey(project.id), project);
    },
  });
};
