import { createContext, useCallback, useContext, useEffect, useMemo, useState, type ReactNode } from 'react';
import { request } from '../services/api';

export type AuthRole = 'SEEKER' | 'EMPLOYER' | 'ADMIN';

export type AuthUser = {
  id: string;
  firstName: string;
  lastName: string;
  email: string;
  phone?: string;
  role: AuthRole;
  isActive?: boolean;
  isVerified?: boolean;
  createdAt?: string;
};

type AuthContextValue = {
  user: AuthUser | null;
  token: string | null;
  isAuthenticated: boolean;
  isLoading: boolean;
  login: (email: string, password: string) => Promise<AuthUser>;
  logout: () => void;
};

const STORAGE_KEY = 'leamjobs_access_token';

const AuthContext = createContext<AuthContextValue | undefined>(undefined);

function readStoredToken() {
  if (typeof window === 'undefined') {
    return null;
  }

  return window.localStorage.getItem(STORAGE_KEY);
}

function writeStoredToken(token: string | null) {
  if (typeof window === 'undefined') {
    return;
  }

  if (token) {
    window.localStorage.setItem(STORAGE_KEY, token);
    return;
  }

  window.localStorage.removeItem(STORAGE_KEY);
}

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<AuthUser | null>(null);
  const [token, setToken] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  const clearSession = useCallback(() => {
    setUser(null);
    setToken(null);
    writeStoredToken(null);
  }, []);

  const loadCurrentUser = useCallback(async (nextToken: string) => {
    const result = await request<AuthUser>({
      method: 'GET',
      endpoint: '/auth/me',
      token: nextToken,
    });

    if (!result.ok) {
      clearSession();
      return null;
    }

    setToken(nextToken);
    setUser(result.data);
    return result.data;
  }, [clearSession]);

  const login = useCallback(async (email: string, password: string) => {
    const result = await request<{ token: string; user: AuthUser }>({
      method: 'POST',
      endpoint: '/auth/login',
      body: {
        email: email.trim(),
        password,
      },
    });

    if (!result.ok) {
      throw new Error(result.error.message || 'Unable to sign in. Please try again.');
    }

    const nextToken = result.data.token;

    if (!nextToken) {
      throw new Error('Authentication token was not returned by the server.');
    }

    writeStoredToken(nextToken);

    const currentUser = await loadCurrentUser(nextToken);

    if (!currentUser) {
      throw new Error('Your session could not be restored. Please sign in again.');
    }

    return currentUser;
  }, [loadCurrentUser]);

  const logout = useCallback(() => {
    clearSession();
  }, [clearSession]);

  useEffect(() => {
    let isMounted = true;

    const bootstrap = async () => {
      const storedToken = readStoredToken();

      if (!storedToken) {
        if (isMounted) {
          setToken(null);
          setUser(null);
          setIsLoading(false);
        }
        return;
      }

      const result = await request<AuthUser>({
        method: 'GET',
        endpoint: '/auth/me',
        token: storedToken,
      });

      if (!isMounted) {
        return;
      }

      if (result.ok) {
        setToken(storedToken);
        setUser(result.data);
      } else {
        clearSession();
      }

      setIsLoading(false);
    };

    void bootstrap();

    return () => {
      isMounted = false;
    };
  }, [clearSession]);

  const value = useMemo<AuthContextValue>(() => ({
    user,
    token,
    isAuthenticated: Boolean(token && user),
    isLoading,
    login,
    logout,
  }), [login, logout, token, user, isLoading]);

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  const context = useContext(AuthContext);

  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }

  return context;
}
