import { zodResolver } from '@hookform/resolvers/zod';
import { CreateProjectRequest, createProjectRequestSchema } from '@taskflow/shared';
import { useState } from 'react';
import { useForm } from 'react-hook-form';
import { z } from 'zod';

import { useCreateProjectMutation } from '../api';

const schema = createProjectRequestSchema;
type FormValues = z.infer<typeof schema>;

type CreateProjectModalProps = {
  onClose: () => void;
};

export const CreateProjectModal = ({ onClose }: CreateProjectModalProps): JSX.Element => {
  const [submitError, setSubmitError] = useState<string | null>(null);
  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
    reset,
  } = useForm<FormValues>({
    resolver: zodResolver(schema),
    defaultValues: {
      name: '',
      description: '',
    },
  });

  const mutation = useCreateProjectMutation();

  const onSubmit = async (payload: CreateProjectRequest) => {
    try {
      setSubmitError(null);
      await mutation.mutateAsync(payload);
      reset();
      onClose();
    } catch (error) {
      console.error(error);
      setSubmitError('Unable to create the project. Please try again.');
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
      <div className="modal" role="dialog" aria-modal="true" aria-labelledby="create-project-title">
        <header className="modal__header">
          <h2 id="create-project-title">Create project</h2>
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
            <textarea
              rows={3}
              {...register('description')}
              disabled={isSubmitting}
              placeholder="What is this project about?"
            />
            {errors.description ? <small>{errors.description.message}</small> : null}
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
              {isSubmitting ? 'Creating…' : 'Create project'}
            </button>
          </footer>
        </form>
      </div>
    </div>
  );
};
