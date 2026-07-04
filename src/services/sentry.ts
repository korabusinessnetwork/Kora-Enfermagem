import * as Sentry from '@sentry/react';

export function initSentry(): void {
  const dsn = import.meta.env.VITE_SENTRY_DSN;
  if (!dsn) {
    console.warn('[sentry] VITE_SENTRY_DSN não configurado — monitoramento de erro desativado.');
    return;
  }

  Sentry.init({
    dsn,
    environment: import.meta.env.MODE,
    tracesSampleRate: 0.1,
    integrations: [Sentry.browserTracingIntegration()],
  });
}

// Só id + hospital_id — nunca email, para minimizar PII enviado a um processador
// terceiro (Sentry), consistente com a postura LGPD do restante do projeto.
export function setSentryUser(userId: string, hospitalId: string): void {
  Sentry.setUser({ id: userId, hospital_id: hospitalId });
}

export function clearSentryUser(): void {
  Sentry.setUser(null);
}

export function addSentryBreadcrumb(message: string, category: string): void {
  Sentry.addBreadcrumb({ message, category, level: 'info' });
}

export const SentryErrorBoundary = Sentry.ErrorBoundary;
