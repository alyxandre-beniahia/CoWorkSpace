import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useState,
  type ReactNode,
} from 'react';
import { api } from '@/lib/api';

const TOKEN_KEY = 'coworkspace_token';

export type User = {
  id: string;
  email: string;
  firstname: string;
  lastname: string;
  phone?: string | null;
  role: { slug: string };
};

type AuthState = {
  token: string | null;
  user: User | null;
  loading: boolean;
};

type AuthContextValue = AuthState & {
  login: (email: string, password: string) => Promise<User>;
  logout: () => void;
  setToken: (token: string | null) => void;
  /** Met à jour le user en mémoire (ex. après édition du profil sans refaire GET /me). */
  updateUser: (user: User | null) => void;
};

const AuthContext = createContext<AuthContextValue | null>(null);

function loadToken(): string | null {
  return localStorage.getItem(TOKEN_KEY);
}

function saveToken(token: string) {
  localStorage.setItem(TOKEN_KEY, token);
}

function clearToken() {
  localStorage.removeItem(TOKEN_KEY);
}

/**
 * Contexte d’authentification : token en localStorage, user chargé via GET /auth/me,
 * login / logout / setToken. updateUser permet de mettre à jour le user en mémoire
 * (ex. après un PATCH /auth/me) sans refaire un GET.
 */
export function AuthProvider({ children }: { children: ReactNode }) {
  const [token, setTokenState] = useState<string | null>(() => loadToken());
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!token) {
      setUser(null);
      setLoading(false);
      return;
    }
    api<User>('/auth/me', { token })
      .then(setUser)
      .catch(() => {
        clearToken();
        setTokenState(null);
        setUser(null);
      })
      .finally(() => setLoading(false));
  }, [token]);

  const login = useCallback(async (email: string, password: string): Promise<User> => {
    const { access_token } = await api<{ access_token: string }>('/auth/login', {
      method: 'POST',
      body: JSON.stringify({ email, password }),
    });
    saveToken(access_token);
    setTokenState(access_token);
    const me = await api<User>('/auth/me', { token: access_token });
    setUser(me);
    return me;
  }, []);

  const logout = useCallback(() => {
    clearToken();
    setTokenState(null);
    setUser(null);
  }, []);

  const setToken = useCallback((t: string | null) => {
    if (t) saveToken(t);
    else clearToken();
    setTokenState(t);
  }, []);

  const updateUser = useCallback((u: User | null) => {
    setUser(u);
  }, []);

  const value: AuthContextValue = {
    token,
    user,
    loading,
    login,
    logout,
    setToken,
    updateUser,
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth(): AuthContextValue {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error('useAuth must be used within AuthProvider');
  return ctx;
}
