import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import App from './App.tsx';
import './styles/globals.css';
import { initSentry, SentryErrorBoundary } from './services/sentry';

initSentry();

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <SentryErrorBoundary
      fallback={
        <div className="min-h-screen flex items-center justify-center p-6 text-center">
          <div>
            <h1 className="text-2xl font-bold">Algo deu errado</h1>
            <p className="mt-2 text-gray-600">Recarregue a página. Se persistir, contate suporte.</p>
          </div>
        </div>
      }
    >
      <App />
    </SentryErrorBoundary>
  </StrictMode>,
);
