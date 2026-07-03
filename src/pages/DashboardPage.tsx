import { Link } from 'react-router-dom';
import { useAuth } from '../hooks/useAuth';

export function DashboardPage() {
  const { user, logout } = useAuth();

  return (
    <div className="min-h-screen p-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold">Olá, {user?.name}</h1>
        <button onClick={() => logout()} className="rounded bg-gray-200 px-4 py-2">
          Sair
        </button>
      </div>
      <nav className="mt-6 space-x-4">
        <Link to="/escalas" className="text-blue-600">
          Ver escalas
        </Link>
        <Link to="/planos" className="text-blue-600">
          Planos
        </Link>
      </nav>
    </div>
  );
}
