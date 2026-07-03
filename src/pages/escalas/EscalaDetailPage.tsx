import { useEffect, useState, type FormEvent } from 'react';
import { Link, useParams } from 'react-router-dom';
import { useAuth } from '../../hooks/useAuth';
import {
  bulkCreateTurnos,
  createTurno,
  deleteTurno,
  fetchEscala,
  fetchHospitalName,
  listHospitalUsers,
  listTurnos,
} from '../../services/escalas';
import { gerarTurnos } from '../../services/gerarEscala';
import { exportEscalaPdf } from '../../services/exportEscala';
import type { IEscala, ITurnoWithUser, TurnoTipo } from '../../types';

const TURNO_LABEL: Record<TurnoTipo, string> = {
  manha: 'Manhã',
  tarde: 'Tarde',
  noite: 'Noite',
};

export function EscalaDetailPage() {
  const { id } = useParams<{ id: string }>();
  const { user } = useAuth();
  const [escala, setEscala] = useState<IEscala | null>(null);
  const [turnos, setTurnos] = useState<ITurnoWithUser[]>([]);
  const [enfermeiros, setEnfermeiros] = useState<{ id: string; name: string }[]>([]);
  const [hospitalName, setHospitalName] = useState('');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const [novoUserId, setNovoUserId] = useState('');
  const [novaData, setNovaData] = useState('');
  const [novoTurno, setNovoTurno] = useState<TurnoTipo>('manha');
  const [adding, setAdding] = useState(false);
  const [gerando, setGerando] = useState(false);

  useEffect(() => {
    if (!id || !user) return;
    Promise.all([
      fetchEscala(id),
      listTurnos(id),
      listHospitalUsers(user.hospital_id),
      fetchHospitalName(user.hospital_id),
    ])
      .then(([escalaData, turnosData, users, hospital]) => {
        setEscala(escalaData);
        setTurnos(turnosData);
        setEnfermeiros(users);
        setHospitalName(hospital);
        if (users.length > 0) setNovoUserId(users[0].id);
      })
      .catch((err) => setError(err.message))
      .finally(() => setLoading(false));
  }, [id, user]);

  async function handleAddTurno(e: FormEvent) {
    e.preventDefault();
    if (!id || !novoUserId || !novaData) return;
    setError(null);
    setAdding(true);
    try {
      await createTurno(id, novoUserId, novaData, novoTurno);
      const atualizados = await listTurnos(id);
      setTurnos(atualizados);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Algo deu errado. Contate suporte.');
    } finally {
      setAdding(false);
    }
  }

  async function handleGerarAutomatico() {
    if (!id || !escala || enfermeiros.length === 0) return;
    if (turnos.length > 0) {
      const confirmar = window.confirm(
        'Essa escala já tem turnos. Gerar automaticamente vai ADICIONAR turnos por cima dos existentes, podendo criar duplicatas no mesmo dia/turno. Continuar?',
      );
      if (!confirmar) return;
    }

    setError(null);
    setGerando(true);
    try {
      const gerados = gerarTurnos(enfermeiros, escala.mes, escala.ano);
      await bulkCreateTurnos(id, gerados);
      const atualizados = await listTurnos(id);
      setTurnos(atualizados);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Algo deu errado. Contate suporte.');
    } finally {
      setGerando(false);
    }
  }

  async function handleDelete(turnoId: string) {
    setError(null);
    try {
      await deleteTurno(turnoId);
      setTurnos((prev) => prev.filter((t) => t.id !== turnoId));
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Algo deu errado. Contate suporte.');
    }
  }

  if (loading) return <div className="p-6">Carregando...</div>;
  if (!escala) return <div className="p-6">Escala não encontrada.</div>;

  return (
    <div className="min-h-screen p-6">
      <div className="mb-6 flex items-center justify-between">
        <h1 className="text-2xl font-bold">
          Escala {escala.mes}/{escala.ano}
        </h1>
        <Link to="/escalas" className="text-sm text-blue-600">
          Voltar
        </Link>
      </div>

      {error && <p className="mb-4 text-sm text-red-600">{error}</p>}

      <button
        onClick={() => exportEscalaPdf(hospitalName, escala.mes, escala.ano, turnos)}
        disabled={turnos.length === 0}
        className="mb-4 mr-3 rounded bg-gray-700 px-4 py-2 text-white disabled:opacity-50"
      >
        Exportar PDF
      </button>

      {user?.role === 'admin' && (
        <button
          onClick={handleGerarAutomatico}
          disabled={gerando || enfermeiros.length === 0}
          className="mb-4 rounded bg-green-600 px-4 py-2 text-white disabled:opacity-50"
        >
          {gerando ? 'Gerando...' : 'Gerar turnos automaticamente'}
        </button>
      )}

      {user?.role === 'admin' && (
        <form onSubmit={handleAddTurno} className="mb-6 flex flex-wrap items-end gap-3">
          <div>
            <label className="block text-sm font-medium">Enfermeiro</label>
            <select
              value={novoUserId}
              onChange={(e) => setNovoUserId(e.target.value)}
              className="mt-1 rounded border px-3 py-2"
            >
              {enfermeiros.map((u) => (
                <option key={u.id} value={u.id}>
                  {u.name}
                </option>
              ))}
            </select>
          </div>
          <div>
            <label className="block text-sm font-medium">Data</label>
            <input
              type="date"
              value={novaData}
              onChange={(e) => setNovaData(e.target.value)}
              className="mt-1 rounded border px-3 py-2"
            />
          </div>
          <div>
            <label className="block text-sm font-medium">Turno</label>
            <select
              value={novoTurno}
              onChange={(e) => setNovoTurno(e.target.value as TurnoTipo)}
              className="mt-1 rounded border px-3 py-2"
            >
              <option value="manha">Manhã</option>
              <option value="tarde">Tarde</option>
              <option value="noite">Noite</option>
            </select>
          </div>
          <button
            type="submit"
            disabled={adding || enfermeiros.length === 0}
            className="rounded bg-blue-600 px-4 py-2 text-white disabled:opacity-50"
          >
            {adding ? 'Adicionando...' : 'Adicionar turno'}
          </button>
        </form>
      )}

      <table className="w-full text-left text-sm">
        <thead>
          <tr className="border-b">
            <th className="py-2">Data</th>
            <th className="py-2">Turno</th>
            <th className="py-2">Enfermeiro</th>
            <th className="py-2">Status</th>
            {user?.role === 'admin' && <th className="py-2" />}
          </tr>
        </thead>
        <tbody>
          {turnos.map((t) => (
            <tr key={t.id} className="border-b">
              <td className="py-2">{t.data}</td>
              <td className="py-2">{TURNO_LABEL[t.turno]}</td>
              <td className="py-2">{t.users?.name}</td>
              <td className="py-2">{t.status}</td>
              {user?.role === 'admin' && (
                <td className="py-2">
                  <button onClick={() => handleDelete(t.id)} className="text-red-600">
                    Remover
                  </button>
                </td>
              )}
            </tr>
          ))}
        </tbody>
      </table>

      {turnos.length === 0 && <p className="mt-4 text-gray-500">Nenhum turno cadastrado ainda.</p>}
    </div>
  );
}
