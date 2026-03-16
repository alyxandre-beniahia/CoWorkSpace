import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useState,
  type ReactNode,
} from 'react';
import { api } from '@/lib/api';

export type User = {
  id: string;
  email: string;
  firstname: string;
  lastname: string;
  phone?: string | null;
  avatarUrl?: string | null;
  role: { slug: string };
};

type AuthState = {
  user: User | null;
  loading: boolean;
};

type AuthContextValue = AuthState & {
  login: (email: string, password: string) => Promise<User>;
  logout: () => Promise<void>;
  /** Met à jour le user en mémoire (ex. après édition du profil sans refaire GET /me). */
  updateUser: (user: User | null) => void;
};

const AuthContext = createContext<AuthContextValue | null>(null);

/**
 * Contexte d’authentification : token en localStorage, user chargé via GET /auth/me,
 * login / logout / setToken. updateUser permet de mettre à jour le user en mémoire
 * (ex. après un PATCH /auth/me) sans refaire un GET.
 */
export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    api<User>('/auth/me')
      .then(setUser)
      .catch(() => {
        setUser(null);
      })
      .finally(() => setLoading(false));
  }, []);

  const login = useCallback(async (email: string, password: string): Promise<User> => {
    await api<{ access_token: string }>('/auth/login', {
      method: 'POST',
      body: JSON.stringify({ email, password }),
    });
    const me = await api<User>('/auth/me');
    setUser(me);
    return me;
  }, []);

  const logout = useCallback(async () => {
    try {
      await api('/auth/logout', { method: 'POST' });
    } finally {
      setUser(null);
    }
  }, []);

  const updateUser = useCallback((u: User | null) => {
    setUser(u);
  }, []);

  const value: AuthContextValue = {
    user,
    loading,
    login,
    logout,
    updateUser,
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth(): AuthContextValue {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error('useAuth must be used within AuthProvider');
  return ctx;
}
