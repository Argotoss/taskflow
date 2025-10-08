import { zodResolver } from '@hookform/resolvers/zod';
import { Task, UpdateTaskRequest, taskPriorityValues, taskStatusValues } from '@taskflow/shared';
import { ChangeEvent, useMemo, useRef, useState } from 'react';
import { useForm } from 'react-hook-form';
import { z } from 'zod';

import { useMembershipsQuery } from '../../memberships';
import {
  useCreateAttachmentMutation,
  usePresignAttachmentMutation,
  useTaskAttachmentsQuery,
  useUpdateTaskMutation,
} from '../api';

const schema = z.object({
  title: z.string().min(1, 'Title is required'),
  description: z.string().max(5000).optional().nullable(),
  status: z.enum(taskStatusValues),
  priority: z.enum(taskPriorityValues),
  assigneeId: z.string().uuid().nullable().optional(),
  dueAt: z.string().optional().nullable(),
});

type FormValues = z.infer<typeof schema>;

type EditTaskModalProps = {
  projectId: string;
  task: Task;
  onClose: () => void;
};

export const EditTaskModal = ({ projectId, task, onClose }: EditTaskModalProps): JSX.Element => {
  const [submitError, setSubmitError] = useState<string | null>(null);
  const [uploadError, setUploadError] = useState<string | null>(null);
  const membershipsQuery = useMembershipsQuery(projectId);
  const mutation = useUpdateTaskMutation(projectId);
  const attachmentsQuery = useTaskAttachmentsQuery(projectId, task.id);
  const presignAttachment = usePresignAttachmentMutation(projectId, task.id);
  const createAttachment = useCreateAttachmentMutation(projectId, task.id);
  const fileInputRef = useRef<HTMLInputElement | null>(null);

  const members = useMemo(() => membershipsQuery.data ?? [], [membershipsQuery.data]);
  const attachments = useMemo(
    () => attachmentsQuery.data ?? task.attachments ?? [],
    [attachmentsQuery.data, task.attachments],
  );

  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting, isDirty },
  } = useForm<FormValues>({
    resolver: zodResolver(schema),
    defaultValues: {
      title: task.title,
      description: task.description ?? '',
      status: task.status,
      priority: task.priority,
      assigneeId: task.assigneeId ?? null,
      dueAt: task.dueAt ? task.dueAt.toISOString().slice(0, 10) : undefined,
    },
  });

  const onSubmit = async (values: FormValues) => {
    try {
      setSubmitError(null);
      const payload: UpdateTaskRequest = {
        title: values.title,
        description: values.description?.trim() ? values.description : undefined,
        status: values.status,
        priority: values.priority,
        assigneeId: values.assigneeId ?? undefined,
        dueAt: values.dueAt ? new Date(values.dueAt) : undefined,
      };
      await mutation.mutateAsync({ taskId: task.id, input: payload });
      onClose();
    } catch (error) {
      console.error(error);
      setSubmitError('Unable to update the task right now.');
    }
  };

  const isMembersLoading = membershipsQuery.isLoading;
  const isUploading = presignAttachment.isPending || createAttachment.isPending;
  const attachmentsLoading = attachmentsQuery.isLoading && !attachmentsQuery.data;
  const attachmentsError = attachmentsQuery.isError ? 'Unable to load attachments.' : null;

  const formatFileSize = (size: number): string => {
    if (size < 1024) return `${size} B`;
    if (size < 1024 * 1024) return `${(size / 1024).toFixed(1)} KB`;
    return `${(size / (1024 * 1024)).toFixed(1)} MB`;
  };

  const handleFileChange = async (event: ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) {
      return;
    }

    try {
      setUploadError(null);
      const contentType = file.type || 'application/octet-stream';
      const presign = await presignAttachment.mutateAsync({
        fileName: file.name,
        fileSize: file.size,
        contentType,
      });

      const uploadResponse = await fetch(presign.uploadUrl, {
        method: 'PUT',
        headers: {
          ...presign.headers,
          'Content-Type': contentType,
        },
        body: file,
      });

      if (!uploadResponse.ok) {
        throw new Error('Upload failed');
      }

      await createAttachment.mutateAsync({
        fileName: file.name,
        fileSize: file.size,
        contentType,
        s3Key: presign.key,
      });
    } catch (error) {
      console.error(error);
      setUploadError('Unable to upload file right now. Please try again.');
    } finally {
      if (fileInputRef.current) {
        fileInputRef.current.value = '';
      }
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
      <div className="modal" role="dialog" aria-modal="true" aria-labelledby="edit-task-title">
        <header className="modal__header">
          <h2 id="edit-task-title">Edit task</h2>
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
              <select {...register('assigneeId')} disabled={isSubmitting || isMembersLoading}>
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

          <section className="attachments-section">
            <div className="attachments-section__header">
              <h3>Attachments</h3>
              {isUploading ? <span className="chip">Uploading…</span> : null}
            </div>
            {attachmentsError ? <div className="form-error">{attachmentsError}</div> : null}
            {attachmentsLoading ? (
              <p className="muted">Loading attachments…</p>
            ) : attachments.length === 0 ? (
              <p className="muted">No files attached yet.</p>
            ) : (
              <ul className="attachments-list">
                {attachments.map((attachment) => (
                  <li key={attachment.id}>
                    <div className="attachments-list__meta">
                      <span className="attachments-list__name">
                        {attachment.url ? (
                          <a href={attachment.url} target="_blank" rel="noopener noreferrer">
                            {attachment.fileName}
                          </a>
                        ) : (
                          attachment.fileName
                        )}
                      </span>
                      <small>
                        {formatFileSize(attachment.fileSize)} · uploaded by{' '}
                        {attachment.uploader.displayName}
                      </small>
                    </div>
                    {attachment.url ? (
                      <a
                        className="link-button"
                        href={attachment.url}
                        target="_blank"
                        rel="noopener noreferrer"
                      >
                        View
                      </a>
                    ) : null}
                  </li>
                ))}
              </ul>
            )}
            <label className="attachments-upload">
              <span>Add file</span>
              <input
                type="file"
                ref={fileInputRef}
                onChange={handleFileChange}
                disabled={isUploading}
              />
            </label>
            {uploadError ? <small className="form-error">{uploadError}</small> : null}
          </section>

          <footer className="modal__actions">
            <button
              type="button"
              className="secondary-button"
              onClick={onClose}
              disabled={isSubmitting}
            >
              Close
            </button>
            <button type="submit" className="primary-button" disabled={isSubmitting || !isDirty}>
              {isSubmitting ? 'Saving…' : 'Save changes'}
            </button>
          </footer>
        </form>
      </div>
    </div>
  );
};
