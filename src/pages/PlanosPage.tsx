import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '../hooks/useAuth';
import { createCheckoutSession, listPlans, type IPlan } from '../services/billing';

export function PlanosPage() {
  const { user } = useAuth();
  const [plans, setPlans] = useState<IPlan[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [checkoutLoadingId, setCheckoutLoadingId] = useState<string | null>(null);

  useEffect(() => {
    listPlans()
      .then(setPlans)
      .catch((err) => setError(err.message))
      .finally(() => setLoading(false));
  }, []);

  async function handleAssinar(plan: IPlan) {
    if (!plan.stripe_price_id) return;
    setError(null);
    setCheckoutLoadingId(plan.id);
    try {
      const url = await createCheckoutSession(plan.stripe_price_id);
      window.location.href = url;
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Algo deu errado. Contate suporte.');
      setCheckoutLoadingId(null);
    }
  }

  if (loading) return <div className="p-6">Carregando...</div>;

  return (
    <div className="min-h-screen p-6">
      <div className="mb-6 flex items-center justify-between">
        <h1 className="text-2xl font-bold">Planos</h1>
        <Link to="/dashboard" className="text-sm text-blue-600">
          Voltar
        </Link>
      </div>

      {error && <p className="mb-4 text-sm text-red-600">{error}</p>}

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 sm:max-w-2xl">
        {plans.map((plan) => (
          <div key={plan.id} className="rounded border p-6">
            <h2 className="text-lg font-bold capitalize">{plan.name}</h2>
            <p className="mt-2 text-3xl font-bold">
              R$ {Number(plan.price_brl).toFixed(2)}
              <span className="text-sm font-normal">/mês</span>
            </p>
            <ul className="mt-4 space-y-1 text-sm text-gray-600">
              <li>Até {plan.max_users} usuários</li>
              {Object.entries(plan.features)
                .filter(([, enabled]) => enabled)
                .map(([feature]) => (
                  <li key={feature}>✓ {feature.split('_').join(' ')}</li>
                ))}
            </ul>

            {plan.stripe_price_id && user?.role === 'admin' && (
              <button
                onClick={() => handleAssinar(plan)}
                disabled={checkoutLoadingId === plan.id}
                className="mt-4 w-full rounded bg-blue-600 py-2 text-white disabled:opacity-50"
              >
                {checkoutLoadingId === plan.id ? 'Redirecionando...' : 'Assinar'}
              </button>
            )}
          </div>
        ))}
      </div>
    </div>
  );
}
