import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import {
  CreateTaskRequest,
  Task,
  TaskStatus,
  createTaskRequestSchema,
  taskSchema,
} from '@taskflow/shared';
import { z } from 'zod';

import { useAuth } from '../auth';

const tasksSchema = z.array(taskSchema);

type TaskFilters = {
  status?: TaskStatus;
  assigneeId?: string;
  search?: string;
};

export const tasksQueryKey = (projectId: string, filters?: TaskFilters) => [
  'project',
  projectId,
  'tasks',
  filters ?? {},
];

export const useProjectTasksQuery = (projectId?: string, filters?: TaskFilters) => {
  const { request } = useAuth();

  return useQuery({
    queryKey: projectId ? tasksQueryKey(projectId, filters) : ['project', 'tasks'],
    enabled: Boolean(projectId),
    queryFn: async () =>
      request(
        {
          method: 'GET',
          url: `/projects/${projectId}/tasks`,
          params: filters,
        },
        tasksSchema,
      ),
  });
};

export const useCreateTaskMutation = (projectId: string) => {
  const { request } = useAuth();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (payload: CreateTaskRequest) =>
      request(
        {
          method: 'POST',
          url: `/projects/${projectId}/tasks`,
          data: createTaskRequestSchema.parse(payload),
        },
        taskSchema,
      ),
    onSuccess: (task: Task) => {
      queryClient.invalidateQueries({ queryKey: tasksQueryKey(projectId) });
      queryClient.setQueryData(tasksQueryKey(projectId), (prev?: Task[]) => {
        if (!prev) {
          return prev;
        }

        return prev.some((item) => item.id === task.id) ? prev : [task, ...prev];
      });
    },
  });
};
