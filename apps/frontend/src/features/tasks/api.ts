import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import {
  Attachment,
  CreateAttachmentRequest,
  CreateTaskRequest,
  PresignAttachmentRequest,
  Task,
  TaskStatus,
  UpdateTaskRequest,
  attachmentSchema,
  createAttachmentRequestSchema,
  createTaskRequestSchema,
  presignAttachmentRequestSchema,
  presignAttachmentResponseSchema,
  taskSchema,
  updateTaskRequestSchema,
} from '@taskflow/shared';
import { z } from 'zod';

import { useAuth } from '../auth';

const tasksSchema = z.array(taskSchema);
const attachmentsSchema = z.array(attachmentSchema);

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

const taskAttachmentsKey = (projectId: string, taskId: string) => [
  'project',
  projectId,
  'tasks',
  taskId,
  'attachments',
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
      queryClient.setQueryData(tasksQueryKey(projectId), (prev?: Task[]) =>
        prev ? [task, ...prev.filter((item) => item.id !== task.id)] : prev,
      );
    },
  });
};

export const useUpdateTaskMutation = (projectId: string) => {
  const { request } = useAuth();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ taskId, input }: { taskId: string; input: UpdateTaskRequest }) =>
      request(
        {
          method: 'PATCH',
          url: `/projects/${projectId}/tasks/${taskId}`,
          data: updateTaskRequestSchema.parse(input),
        },
        taskSchema,
      ),
    onSuccess: (task: Task) => {
      queryClient.invalidateQueries({ queryKey: tasksQueryKey(projectId) });
      queryClient.setQueryData(tasksQueryKey(projectId), (prev?: Task[]) =>
        prev ? prev.map((item) => (item.id === task.id ? task : item)) : prev,
      );
    },
  });
};

export const useTaskAttachmentsQuery = (projectId?: string, taskId?: string) => {
  const { request } = useAuth();

  return useQuery({
    queryKey: projectId && taskId ? taskAttachmentsKey(projectId, taskId) : ['attachments'],
    enabled: Boolean(projectId && taskId),
    queryFn: async () =>
      request(
        {
          method: 'GET',
          url: `/projects/${projectId}/tasks/${taskId}/attachments`,
        },
        attachmentsSchema,
      ),
  });
};

export const usePresignAttachmentMutation = (projectId: string, taskId: string) => {
  const { request } = useAuth();

  return useMutation({
    mutationFn: async (input: PresignAttachmentRequest) =>
      request(
        {
          method: 'POST',
          url: `/projects/${projectId}/tasks/${taskId}/attachments/presign`,
          data: presignAttachmentRequestSchema.parse(input),
        },
        presignAttachmentResponseSchema,
      ),
  });
};

export const useCreateAttachmentMutation = (projectId: string, taskId: string) => {
  const { request } = useAuth();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (input: CreateAttachmentRequest) =>
      request(
        {
          method: 'POST',
          url: `/projects/${projectId}/tasks/${taskId}/attachments`,
          data: createAttachmentRequestSchema.parse(input),
        },
        attachmentSchema,
      ),
    onSuccess: (attachment: Attachment) => {
      queryClient.invalidateQueries({ queryKey: taskAttachmentsKey(projectId, taskId) });
      queryClient.invalidateQueries({ queryKey: tasksQueryKey(projectId) });
      queryClient.setQueryData(taskAttachmentsKey(projectId, taskId), (prev?: Attachment[]) =>
        prev ? [attachment, ...prev.filter((item) => item.id !== attachment.id)] : [attachment],
      );
    },
  });
};
