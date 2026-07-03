import { AuthError } from '@supabase/supabase-js';
import { supabase } from './supabase';
import type { IUser } from '../types';

const errorMessages: Record<string, string> = {
  invalid_credentials: 'Email ou senha inválidos.',
  email_not_confirmed: 'Confirme seu email antes de entrar.',
  user_already_exists: 'Este email já está cadastrado.',
  rate_limit: 'Muitas tentativas. Aguarde alguns minutos e tente novamente.',
};

function translateAuthError(error: AuthError): string {
  if (error.status === 429) return errorMessages.rate_limit;

  const lower = error.message.toLowerCase();
  if (lower.includes('invalid login credentials')) return errorMessages.invalid_credentials;
  if (lower.includes('email not confirmed')) return errorMessages.email_not_confirmed;
  if (lower.includes('already registered') || lower.includes('already exists')) {
    return errorMessages.user_already_exists;
  }
  if (lower.includes('rate limit')) return errorMessages.rate_limit;
  return 'Algo deu errado. Contate suporte.';
}

async function logAudit(userId: string, hospitalId: string, action: 'login' | 'logout') {
  await supabase.from('audit_logs').insert({
    user_id: userId,
    hospital_id: hospitalId,
    action,
    table_name: 'auth',
    record_id: userId,
  });
}

export async function fetchUserProfile(userId: string): Promise<IUser> {
  const { data, error } = await supabase.from('users').select('*').eq('id', userId).single();
  if (error) throw new Error(`DB Error: ${error.message}`);
  return data as IUser;
}

export async function login(email: string, password: string): Promise<IUser> {
  const { data, error } = await supabase.auth.signInWithPassword({ email, password });
  if (error) throw new Error(translateAuthError(error));
  if (!data.user) throw new Error('Algo deu errado. Contate suporte.');

  const profile = await fetchUserProfile(data.user.id);

  await supabase
    .from('users')
    .update({ last_login: new Date().toISOString() })
    .eq('id', data.user.id);

  await logAudit(profile.id, profile.hospital_id, 'login');

  return profile;
}

interface SignupResult {
  needsEmailConfirmation: boolean;
  user: IUser | null;
}

export async function signup(
  email: string,
  password: string,
  name: string,
  hospitalName: string,
): Promise<SignupResult> {
  const { data, error } = await supabase.auth.signUp({
    email,
    password,
    options: { data: { name, hospital_name: hospitalName } },
  });
  if (error) throw new Error(translateAuthError(error));
  if (!data.user) throw new Error('Algo deu errado. Contate suporte.');

  if (!data.session) {
    return { needsEmailConfirmation: true, user: null };
  }

  const profile = await fetchUserProfile(data.user.id);
  return { needsEmailConfirmation: false, user: profile };
}

export async function logout(user: IUser | null): Promise<void> {
  if (user) {
    await logAudit(user.id, user.hospital_id, 'logout');
  }
  const { error } = await supabase.auth.signOut();
  if (error) throw new Error(`DB Error: ${error.message}`);
}
