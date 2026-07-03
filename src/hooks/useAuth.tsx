import { createContext, useContext, useEffect, useState, type ReactNode } from 'react';
import { supabase } from '../services/supabase';
import {
  fetchUserProfile,
  login as loginRequest,
  logout as logoutRequest,
  signup as signupRequest,
} from '../services/auth';
import type { IUser } from '../types';

interface AuthContextValue {
  user: IUser | null;
  loading: boolean;
  login: (email: string, password: string) => Promise<void>;
  signup: (
    email: string,
    password: string,
    name: string,
    hospitalName: string,
  ) => Promise<{ needsEmailConfirmation: boolean }>;
  logout: () => Promise<void>;
}

const AuthContext = createContext<AuthContextValue | undefined>(undefined);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<IUser | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    supabase.auth.getSession().then(({ data }) => {
      const sessionUser = data.session?.user;
      if (!sessionUser) {
        setLoading(false);
        return;
      }
      fetchUserProfile(sessionUser.id)
        .then(setUser)
        .finally(() => setLoading(false));
    });

    const { data: subscription } = supabase.auth.onAuthStateChange((_event, session) => {
      if (!session?.user) {
        setUser(null);
        return;
      }
      fetchUserProfile(session.user.id).then(setUser);
    });

    return () => subscription.subscription.unsubscribe();
  }, []);

  async function login(email: string, password: string) {
    const profile = await loginRequest(email, password);
    setUser(profile);
  }

  async function signup(email: string, password: string, name: string, hospitalName: string) {
    const result = await signupRequest(email, password, name, hospitalName);
    if (result.user) setUser(result.user);
    return { needsEmailConfirmation: result.needsEmailConfirmation };
  }

  async function logout() {
    await logoutRequest(user);
    setUser(null);
  }

  return (
    <AuthContext.Provider value={{ user, loading, login, signup, logout }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth(): AuthContextValue {
  const context = useContext(AuthContext);
  if (!context) throw new Error('useAuth deve ser usado dentro de AuthProvider');
  return context;
}
