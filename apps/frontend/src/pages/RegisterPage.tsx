import { zodResolver } from '@hookform/resolvers/zod';
import { registerRequestSchema } from '@taskflow/shared';
import axios from 'axios';
import { useState } from 'react';
import { useForm } from 'react-hook-form';
import { Link, Navigate } from 'react-router-dom';
import { z } from 'zod';

import { LoadingScreen } from '../components/LoadingScreen';
import { useAuth } from '../features/auth';

const schema = registerRequestSchema;
type FormValues = z.infer<typeof schema>;

export const RegisterPage = (): JSX.Element => {
  const { register: registerUser, isAuthenticated, initializing } = useAuth();
  const [submitError, setSubmitError] = useState<string | null>(null);

  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm<FormValues>({
    resolver: zodResolver(schema),
    defaultValues: {
      email: '',
      password: '',
      displayName: '',
      profileColor: '#2563eb',
    },
  });

  const onSubmit = async (values: FormValues) => {
    try {
      setSubmitError(null);
      await registerUser(values);
    } catch (error) {
      if (axios.isAxiosError(error) && error.response?.status === 409) {
        setSubmitError('That email address is already in use.');
        return;
      }

      setSubmitError('Unable to complete registration. Please try again.');
    }
  };

  if (initializing) {
    return <LoadingScreen />;
  }

  if (isAuthenticated) {
    return <Navigate to="/projects" replace />;
  }

  return (
    <div className="auth-page">
      <div className="auth-card" role="form">
        <h1>Create your account</h1>
        <p className="auth-subtitle">Set up TaskFlow and start collaborating.</p>

        {submitError ? (
          <div className="form-error" role="alert">
            {submitError}
          </div>
        ) : null}

        <form className="auth-form" onSubmit={handleSubmit(onSubmit)} noValidate>
          <label className="form-field">
            <span>Display name</span>
            <input
              type="text"
              autoComplete="name"
              {...register('displayName')}
              disabled={isSubmitting}
            />
            {errors.displayName ? <small>{errors.displayName.message}</small> : null}
          </label>

          <label className="form-field">
            <span>Email</span>
            <input
              type="email"
              autoComplete="email"
              {...register('email')}
              disabled={isSubmitting}
            />
            {errors.email ? <small>{errors.email.message}</small> : null}
          </label>

          <label className="form-field">
            <span>Password</span>
            <input
              type="password"
              autoComplete="new-password"
              {...register('password')}
              disabled={isSubmitting}
            />
            <small className="hint">Use at least 8 characters with letters and numbers.</small>
            {errors.password ? <small>{errors.password.message}</small> : null}
          </label>

          <label className="form-field">
            <span>Profile color</span>
            <input type="color" {...register('profileColor')} disabled={isSubmitting} />
          </label>

          <button type="submit" className="primary-button" disabled={isSubmitting}>
            {isSubmitting ? 'Creating account…' : 'Create account'}
          </button>
        </form>

        <p className="auth-footer">
          Already registered? <Link to="/auth/login">Sign in</Link>
        </p>
      </div>
    </div>
  );
};
