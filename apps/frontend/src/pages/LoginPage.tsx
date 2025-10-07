import { zodResolver } from '@hookform/resolvers/zod';
import { loginRequestSchema } from '@taskflow/shared';
import axios from 'axios';
import { useState } from 'react';
import { useForm } from 'react-hook-form';
import { Link, Navigate, useLocation, type Location } from 'react-router-dom';
import { z } from 'zod';

import { LoadingScreen } from '../components/LoadingScreen';
import { useAuth } from '../features/auth';

const schema = loginRequestSchema;
type FormValues = z.infer<typeof schema>;

export const LoginPage = (): JSX.Element => {
  const { login, isAuthenticated, initializing } = useAuth();
  const location = useLocation();
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
    },
  });

  const onSubmit = async (values: FormValues) => {
    try {
      setSubmitError(null);
      await login(values);
    } catch (error) {
      if (axios.isAxiosError(error) && error.response?.status === 401) {
        setSubmitError('Invalid email or password');
        return;
      }

      setSubmitError('Unable to sign in, please try again.');
    }
  };

  if (initializing) {
    return <LoadingScreen />;
  }

  if (isAuthenticated) {
    const redirectTo = (location.state as { from?: Location })?.from?.pathname ?? '/projects';
    return <Navigate to={redirectTo} replace />;
  }

  return (
    <div className="auth-page">
      <div className="auth-card" role="form">
        <h1>Welcome back</h1>
        <p className="auth-subtitle">Sign in to access your workspaces and tasks.</p>

        {submitError ? (
          <div className="form-error" role="alert">
            {submitError}
          </div>
        ) : null}

        <form className="auth-form" onSubmit={handleSubmit(onSubmit)} noValidate>
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
              autoComplete="current-password"
              {...register('password')}
              disabled={isSubmitting}
            />
            {errors.password ? <small>{errors.password.message}</small> : null}
          </label>

          <button type="submit" disabled={isSubmitting} className="primary-button">
            {isSubmitting ? 'Signing in…' : 'Sign in'}
          </button>
        </form>

        <p className="auth-footer">
          Need an account? <Link to="/auth/register">Create one</Link>
        </p>
      </div>
    </div>
  );
};
