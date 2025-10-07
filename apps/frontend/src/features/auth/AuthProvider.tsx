import {
  AuthResponse,
  LoginRequest,
  RegisterRequest,
  UserSummary,
  authResponseSchema,
  userSummarySchema,
} from '@taskflow/shared';
import axios, { AxiosInstance, AxiosRequestConfig } from 'axios';
import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useRef,
  useState,
} from 'react';
import { ZodSchema } from 'zod';

const STORAGE_KEY = 'taskflow.auth.v1';
const ACCESS_TOKEN_BUFFER_MS = 5_000;

type AuthTokens = {
  accessToken: string;
  refreshToken: string;
  accessTokenExpiresAt: number;
};

type PersistedAuth = {
  tokens: AuthTokens;
  user: UserSummary | null;
};

type AuthContextValue = {
  user: UserSummary | null;
  isAuthenticated: boolean;
  initializing: boolean;
  login: (payload: LoginRequest) => Promise<void>;
  register: (payload: RegisterRequest) => Promise<void>;
  logout: () => void;
  request: <T>(config: AxiosRequestConfig, schema?: ZodSchema<T>) => Promise<T>;
};

const AuthContext = createContext<AuthContextValue | undefined>(undefined);

const computeExpiry = (seconds: number): number => {
  const buffered = Math.max(seconds - ACCESS_TOKEN_BUFFER_MS / 1000, 1);
  return Date.now() + buffered * 1000;
};

export const AuthProvider = ({ children }: { children: React.ReactNode }): JSX.Element => {
  const baseUrl = import.meta.env.VITE_API_URL;

  if (!baseUrl) {
    throw new Error('VITE_API_URL is not configured');
  }

  const client = useMemo<AxiosInstance>(() => {
    return axios.create({
      baseURL: baseUrl,
      timeout: 12_000,
    });
  }, [baseUrl]);

  const [state, setState] = useState<{
    tokens: AuthTokens | null;
    user: UserSummary | null;
    initializing: boolean;
  }>(() => ({ tokens: null, user: null, initializing: true }));
  const tokenRef = useRef<AuthTokens | null>(null);
  const refreshPromiseRef = useRef<Promise<AuthTokens | null> | null>(null);

  const persistState = useCallback((payload: PersistedAuth | null) => {
    if (!payload) {
      localStorage.removeItem(STORAGE_KEY);
      return;
    }

    localStorage.setItem(STORAGE_KEY, JSON.stringify(payload));
  }, []);

  const applyAuthResponse = useCallback(
    (response: AuthResponse): AuthTokens => {
      const tokens: AuthTokens = {
        accessToken: response.accessToken,
        refreshToken: response.refreshToken,
        accessTokenExpiresAt: computeExpiry(response.accessTokenExpiresIn),
      };

      tokenRef.current = tokens;
      setState({ tokens, user: response.user, initializing: false });
      persistState({ tokens, user: response.user });
      return tokens;
    },
    [persistState],
  );

  const clearAuth = useCallback(() => {
    tokenRef.current = null;
    setState({ tokens: null, user: null, initializing: false });
    persistState(null);
  }, [persistState]);

  const refreshTokens = useCallback(async (): Promise<AuthTokens | null> => {
    const current = tokenRef.current;

    if (!current?.refreshToken) {
      clearAuth();
      return null;
    }

    if (!refreshPromiseRef.current) {
      refreshPromiseRef.current = client
        .post('/auth/refresh', { refreshToken: current.refreshToken })
        .then((res) => {
          const parsed = authResponseSchema.parse(res.data);
          return applyAuthResponse(parsed);
        })
        .catch((error) => {
          clearAuth();
          throw error;
        })
        .finally(() => {
          refreshPromiseRef.current = null;
        });
    }

    try {
      return await refreshPromiseRef.current;
    } catch {
      return null;
    }
  }, [applyAuthResponse, clearAuth, client]);

  const ensureFreshTokens = useCallback(async (): Promise<AuthTokens | null> => {
    const current = tokenRef.current;

    if (!current) {
      return null;
    }

    if (Date.now() < current.accessTokenExpiresAt - ACCESS_TOKEN_BUFFER_MS) {
      return current;
    }

    return refreshTokens();
  }, [refreshTokens]);

  const request = useCallback(
    async <T,>(config: AxiosRequestConfig, schema?: ZodSchema<T>): Promise<T> => {
      const tokens = await ensureFreshTokens();

      if (!tokens) {
        throw new Error('Not authenticated');
      }

      const headers = {
        Accept: 'application/json',
        ...(config.headers ?? {}),
        Authorization: `Bearer ${tokens.accessToken}`,
      };

      const attempt = async (): Promise<T> => {
        const response = await client.request({ ...config, headers });
        const data = response.data;
        return schema ? schema.parse(data) : (data as T);
      };

      try {
        return await attempt();
      } catch (error) {
        if (axios.isAxiosError(error) && error.response?.status === 401) {
          const refreshed = await refreshTokens();
          if (!refreshed) {
            throw error;
          }

          const retryHeaders = {
            ...headers,
            Authorization: `Bearer ${refreshed.accessToken}`,
          };

          const response = await client.request({ ...config, headers: retryHeaders });
          const data = response.data;
          return schema ? schema.parse(data) : (data as T);
        }

        throw error;
      }
    },
    [client, ensureFreshTokens, refreshTokens],
  );

  const handleAuth = useCallback(
    async (path: '/auth/login' | '/auth/register', payload: LoginRequest | RegisterRequest) => {
      const response = await client.post(path, payload);
      const parsed = authResponseSchema.parse(response.data);
      applyAuthResponse(parsed);
    },
    [applyAuthResponse, client],
  );

  const login = useCallback(
    (payload: LoginRequest) => handleAuth('/auth/login', payload),
    [handleAuth],
  );

  const register = useCallback(
    (payload: RegisterRequest) => handleAuth('/auth/register', payload),
    [handleAuth],
  );

  useEffect(() => {
    let isActive = true;
    const raw = localStorage.getItem(STORAGE_KEY);

    if (!raw) {
      setState({ tokens: null, user: null, initializing: false });
      return () => {
        isActive = false;
      };
    }

    try {
      const parsed = JSON.parse(raw) as PersistedAuth;
      if (!parsed.tokens) {
        throw new Error('Invalid auth state');
      }

      tokenRef.current = parsed.tokens;
      setState({ tokens: parsed.tokens, user: parsed.user ?? null, initializing: true });

      const bootstrap = async () => {
        try {
          const response = await client.get('/auth/me', {
            headers: {
              Authorization: `Bearer ${parsed.tokens.accessToken}`,
            },
          });

          const user = userSummarySchema.parse(response.data);

          if (!isActive) {
            return;
          }

          setState({ tokens: parsed.tokens, user, initializing: false });
          persistState({ tokens: parsed.tokens, user });
        } catch (error) {
          if (axios.isAxiosError(error) && error.response?.status === 401) {
            try {
              if (isActive) {
                await refreshTokens();
              }
            } catch {
              if (isActive) {
                clearAuth();
              }
            }
          } else if (isActive) {
            clearAuth();
          }
        } finally {
          if (isActive) {
            setState((current) => ({ ...current, initializing: false }));
          }
        }
      };

      void bootstrap();
    } catch {
      clearAuth();
    }

    return () => {
      isActive = false;
    };
  }, [client, clearAuth, persistState, refreshTokens]);

  const value = useMemo<AuthContextValue>(
    () => ({
      user: state.user,
      isAuthenticated: Boolean(state.tokens && state.user),
      initializing: state.initializing,
      login,
      register,
      logout: clearAuth,
      request,
    }),
    [clearAuth, login, register, request, state.initializing, state.tokens, state.user],
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
};

export const useAuthContext = (): AuthContextValue => {
  const ctx = useContext(AuthContext);
  if (!ctx) {
    throw new Error('useAuthContext must be used within an AuthProvider');
  }

  return ctx;
};
