import { useEffect, useState, type FormEvent } from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '../../hooks/useAuth';
import { createEscala, listEscalas } from '../../services/escalas';
import type { IEscala } from '../../types';

const MESES = [
  'Janeiro', 'Fevereiro', 'Março', 'Abril', 'Maio', 'Junho',
  'Julho', 'Agosto', 'Setembro', 'Outubro', 'Novembro', 'Dezembro',
];

export function EscalasPage() {
  const { user } = useAuth();
  const [escalas, setEscalas] = useState<IEscala[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const today = new Date();
  const [mes, setMes] = useState(today.getMonth() + 1);
  const [ano, setAno] = useState(today.getFullYear());
  const [creating, setCreating] = useState(false);

  useEffect(() => {
    if (!user) return;
    listEscalas(user.hospital_id)
      .then(setEscalas)
      .catch((err) => setError(err.message))
      .finally(() => setLoading(false));
  }, [user]);

  async function handleCreate(e: FormEvent) {
    e.preventDefault();
    if (!user) return;
    setError(null);
    setCreating(true);
    try {
      const nova = await createEscala(user.hospital_id, mes, ano, user.id);
      setEscalas((prev) => [nova, ...prev]);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Algo deu errado. Contate suporte.');
    } finally {
      setCreating(false);
    }
  }

  if (loading) return <div className="p-6">Carregando...</div>;

  return (
    <div className="min-h-screen p-6">
      <div className="mb-6 flex items-center justify-between">
        <h1 className="text-2xl font-bold">Escalas</h1>
        <Link to="/dashboard" className="text-sm text-blue-600">
          Voltar
        </Link>
      </div>

      {user?.role === 'admin' && (
        <form onSubmit={handleCreate} className="mb-6 flex items-end gap-3">
          <div>
            <label className="block text-sm font-medium">Mês</label>
            <select
              value={mes}
              onChange={(e) => setMes(Number(e.target.value))}
              className="mt-1 rounded border px-3 py-2"
            >
              {MESES.map((nome, i) => (
                <option key={i} value={i + 1}>
                  {nome}
                </option>
              ))}
            </select>
          </div>
          <div>
            <label className="block text-sm font-medium">Ano</label>
            <input
              type="number"
              value={ano}
              onChange={(e) => setAno(Number(e.target.value))}
              className="mt-1 w-24 rounded border px-3 py-2"
            />
          </div>
          <button
            type="submit"
            disabled={creating}
            className="rounded bg-blue-600 px-4 py-2 text-white disabled:opacity-50"
          >
            {creating ? 'Criando...' : 'Nova escala'}
          </button>
        </form>
      )}

      {error && <p className="mb-4 text-sm text-red-600">{error}</p>}

      {escalas.length === 0 ? (
        <p className="text-gray-500">Nenhuma escala criada ainda.</p>
      ) : (
        <ul className="divide-y">
          {escalas.map((escala) => (
            <li key={escala.id} className="py-3">
              <Link to={`/escalas/${escala.id}`} className="text-blue-600">
                {MESES[escala.mes - 1]}/{escala.ano} — {escala.status}
              </Link>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
