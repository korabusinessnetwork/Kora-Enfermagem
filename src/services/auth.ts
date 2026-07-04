import { AuthError, FunctionsHttpError } from '@supabase/supabase-js';
import { supabase } from './supabase';
import { addSentryBreadcrumb, clearSentryUser, setSentryUser } from './sentry';
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

interface LoginFunctionResponse {
  access_token?: string;
  refresh_token?: string;
  error?: string;
  message?: string;
  remainingAttempts?: number;
}

export async function login(email: string, password: string): Promise<IUser> {
  // O login passa por uma Edge Function (não supabase.auth.signInWithPassword direto)
  // para aplicar rate limiting server-side: 5 tentativas falhas / 10min por email,
  // contadas em Postgres. Ver supabase/functions/login.
  //
  // supabase.functions.invoke() só popula `data` em respostas 2xx. Em erro (400/429/500)
  // ele joga tudo em `error` como FunctionsHttpError, e o corpo real (com a mensagem
  // e remainingAttempts) fica em error.context, que é a Response bruta — precisa
  // parsear manualmente.
  const { data, error: invokeError } = await supabase.functions.invoke<LoginFunctionResponse>(
    'login',
    { body: { email, password } },
  );

  let result: LoginFunctionResponse | null = data;

  if (invokeError) {
    if (invokeError instanceof FunctionsHttpError) {
      result = await invokeError.context.json().catch(() => null);
    } else {
      throw new Error('Algo deu errado. Contate suporte.');
    }
  }

  if (!result) throw new Error('Algo deu errado. Contate suporte.');

  if (result.message) {
    // Bloqueado por rate limit (429): a function retorna a mensagem já pronta.
    throw new Error(result.message);
  }

  if (result.error || !result.access_token || !result.refresh_token) {
    const base = result.error?.toLowerCase().includes('invalid') ? errorMessages.invalid_credentials
      : result.error?.toLowerCase().includes('confirm') ? errorMessages.email_not_confirmed
      : 'Algo deu errado. Contate suporte.';
    const suffix = typeof result.remainingAttempts === 'number' && result.remainingAttempts > 0
      ? ` Restam ${result.remainingAttempts} tentativa(s) antes do bloqueio temporário.`
      : '';
    throw new Error(base + suffix);
  }

  const { error: sessionError, data: sessionData } = await supabase.auth.setSession({
    access_token: result.access_token,
    refresh_token: result.refresh_token,
  });
  if (sessionError || !sessionData.user) throw new Error('Algo deu errado. Contate suporte.');

  const profile = await fetchUserProfile(sessionData.user.id);

  await supabase
    .from('users')
    .update({ last_login: new Date().toISOString() })
    .eq('id', sessionData.user.id);

  await logAudit(profile.id, profile.hospital_id, 'login');

  setSentryUser(profile.id, profile.hospital_id);
  addSentryBreadcrumb('Usuário fez login', 'auth');

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
  setSentryUser(profile.id, profile.hospital_id);
  addSentryBreadcrumb('Usuário criou conta', 'auth');
  return { needsEmailConfirmation: false, user: profile };
}

export async function logout(user: IUser | null): Promise<void> {
  if (user) {
    await logAudit(user.id, user.hospital_id, 'logout');
  }
  const { error } = await supabase.auth.signOut();
  if (error) throw new Error(`DB Error: ${error.message}`);

  addSentryBreadcrumb('Usuário fez logout', 'auth');
  clearSentryUser();
}
