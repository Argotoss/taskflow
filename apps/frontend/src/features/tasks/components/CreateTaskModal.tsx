import { zodResolver } from '@hookform/resolvers/zod';
import { CreateTaskRequest, taskPriorityValues, taskStatusValues } from '@taskflow/shared';
import { useMemo, useState } from 'react';
import { useForm } from 'react-hook-form';
import { z } from 'zod';

import { useMembershipsQuery } from '../../memberships';
import { useCreateTaskMutation } from '../api';

const formSchema = z.object({
  title: z.string().min(1),
  description: z.string().max(5000).optional(),
  status: z.enum(taskStatusValues),
  priority: z.enum(taskPriorityValues),
  assigneeId: z.string().uuid().nullable().optional(),
  dueAt: z.string().optional(),
});

type FormValues = z.infer<typeof formSchema>;

type CreateTaskModalProps = {
  projectId: string;
  onClose: () => void;
};

export const CreateTaskModal = ({ projectId, onClose }: CreateTaskModalProps): JSX.Element => {
  const [submitError, setSubmitError] = useState<string | null>(null);
  const mutation = useCreateTaskMutation(projectId);
  const membershipsQuery = useMembershipsQuery(projectId);

  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
    reset,
  } = useForm<FormValues>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      title: '',
      description: '',
      status: 'BACKLOG',
      priority: 'MEDIUM',
      assigneeId: null,
      dueAt: undefined,
    },
  });

  const members = useMemo(() => membershipsQuery.data ?? [], [membershipsQuery.data]);
  const membersLoading = membershipsQuery.isLoading;

  const onSubmit = async (payload: FormValues) => {
    try {
      setSubmitError(null);
      const taskPayload: CreateTaskRequest = {
        title: payload.title,
        description: payload.description?.trim() ? payload.description : undefined,
        status: payload.status,
        priority: payload.priority,
        assigneeId: payload.assigneeId ?? undefined,
        dueAt: payload.dueAt ? new Date(payload.dueAt) : undefined,
      };

      await mutation.mutateAsync(taskPayload);
      reset();
      onClose();
    } catch (error) {
      console.error(error);
      setSubmitError('Unable to create the task. Please try again.');
    }
  };

  return (
    <div className="modal-backdrop">
      <button
        type="button"
        className="modal-backdrop__overlay"
        aria-label="Close dialog"
        onClick={onClose}
      />
      <div className="modal" role="dialog" aria-modal="true" aria-labelledby="create-task-title">
        <header className="modal__header">
          <h2 id="create-task-title">Create task</h2>
          <button type="button" className="icon-button" onClick={onClose} aria-label="Close">
            ×
          </button>
        </header>

        {submitError ? <div className="form-error">{submitError}</div> : null}

        <form className="modal__form" onSubmit={handleSubmit(onSubmit)}>
          <label className="form-field">
            <span>Title</span>
            <input type="text" {...register('title')} disabled={isSubmitting} />
            {errors.title ? <small>{errors.title.message}</small> : null}
          </label>

          <label className="form-field">
            <span>Description</span>
            <textarea rows={4} {...register('description')} disabled={isSubmitting} />
            {errors.description ? <small>{errors.description.message}</small> : null}
          </label>

          <div className="form-grid">
            <label className="form-field">
              <span>Status</span>
              <select {...register('status')} disabled={isSubmitting}>
                {taskStatusValues.map((status) => (
                  <option key={status} value={status}>
                    {status.replace('_', ' ').toLowerCase()}
                  </option>
                ))}
              </select>
            </label>

            <label className="form-field">
              <span>Priority</span>
              <select {...register('priority')} disabled={isSubmitting}>
                {taskPriorityValues.map((priority) => (
                  <option key={priority} value={priority}>
                    {priority.toLowerCase()}
                  </option>
                ))}
              </select>
            </label>

            <label className="form-field">
              <span>Assignee</span>
              <select {...register('assigneeId')} disabled={isSubmitting || membersLoading}>
                <option value="">Unassigned</option>
                {members.map((member) => (
                  <option key={member.id} value={member.id}>
                    {member.user.displayName}
                  </option>
                ))}
              </select>
            </label>

            <label className="form-field">
              <span>Due date</span>
              <input type="date" {...register('dueAt')} disabled={isSubmitting} />
            </label>
          </div>

          <footer className="modal__actions">
            <button
              type="button"
              className="secondary-button"
              onClick={onClose}
              disabled={isSubmitting}
            >
              Cancel
            </button>
            <button type="submit" className="primary-button" disabled={isSubmitting}>
              {isSubmitting ? 'Creating…' : 'Create task'}
            </button>
          </footer>
        </form>
      </div>
    </div>
  );
};
