import { zodResolver } from '@hookform/resolvers/zod';
import { Project, UpdateProjectRequest, projectStatusValues } from '@taskflow/shared';
import { useEffect, useState } from 'react';
import { useForm } from 'react-hook-form';
import { z } from 'zod';

import { useUpdateProjectMutation } from '../api';

const schema = z.object({
  name: z.string().min(1, 'Name is required'),
  description: z.string().max(1000).optional().nullable(),
  status: z.enum(projectStatusValues),
});

type FormValues = z.infer<typeof schema>;

type EditProjectModalProps = {
  project: Project;
  onClose: () => void;
};

export const EditProjectModal = ({ project, onClose }: EditProjectModalProps): JSX.Element => {
  const [submitError, setSubmitError] = useState<string | null>(null);
  const mutation = useUpdateProjectMutation(project.id);

  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
    reset,
  } = useForm<FormValues>({
    resolver: zodResolver(schema),
    defaultValues: {
      name: project.name,
      description: project.description ?? '',
      status: project.status,
    },
  });

  useEffect(() => {
    reset({
      name: project.name,
      description: project.description ?? '',
      status: project.status,
    });
  }, [project, reset]);

  const onSubmit = async (values: FormValues) => {
    try {
      setSubmitError(null);
      const payload: UpdateProjectRequest = {
        name: values.name,
        description: values.description ?? undefined,
        status: values.status,
      };
      await mutation.mutateAsync(payload);
      onClose();
    } catch (error) {
      console.error(error);
      setSubmitError('Unable to update the project right now.');
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
      <div className="modal" role="dialog" aria-modal="true" aria-labelledby="edit-project-title">
        <header className="modal__header">
          <h2 id="edit-project-title">Edit project</h2>
          <button type="button" className="icon-button" onClick={onClose} aria-label="Close">
            ×
          </button>
        </header>

        {submitError ? <div className="form-error">{submitError}</div> : null}

        <form className="modal__form" onSubmit={handleSubmit(onSubmit)}>
          <label className="form-field">
            <span>Name</span>
            <input type="text" {...register('name')} disabled={isSubmitting} />
            {errors.name ? <small>{errors.name.message}</small> : null}
          </label>

          <label className="form-field">
            <span>Description</span>
            <textarea rows={4} {...register('description')} disabled={isSubmitting} />
            {errors.description ? <small>{errors.description.message}</small> : null}
          </label>

          <label className="form-field">
            <span>Status</span>
            <select {...register('status')} disabled={isSubmitting}>
              {projectStatusValues.map((status) => (
                <option key={status} value={status}>
                  {status.replace('_', ' ').toLowerCase()}
                </option>
              ))}
            </select>
          </label>

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
              {isSubmitting ? 'Saving…' : 'Save changes'}
            </button>
          </footer>
        </form>
      </div>
    </div>
  );
};
