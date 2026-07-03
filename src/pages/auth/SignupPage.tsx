import { useState, type FormEvent } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../../hooks/useAuth';
import { signupSchema } from '../../utils/validation';

export function SignupPage() {
  const { signup } = useAuth();
  const navigate = useNavigate();
  const [name, setName] = useState('');
  const [hospitalName, setHospitalName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [info, setInfo] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);

  async function handleSubmit(e: FormEvent) {
    e.preventDefault();
    setError(null);
    setInfo(null);

    const result = signupSchema.safeParse({ name, hospitalName, email, password });
    if (!result.success) {
      setError(result.error.issues[0].message);
      return;
    }

    setSubmitting(true);
    try {
      const { needsEmailConfirmation } = await signup(email, password, name, hospitalName);
      if (needsEmailConfirmation) {
        setInfo('Cadastro criado! Verifique seu email para confirmar a conta antes de entrar.');
      } else {
        navigate('/dashboard');
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Algo deu errado. Contate suporte.');
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <div className="min-h-screen flex items-center justify-center">
      <form onSubmit={handleSubmit} className="w-full max-w-sm space-y-4 p-6">
        <h1 className="text-2xl font-bold text-center">Criar conta</h1>

        <div>
          <label htmlFor="hospitalName" className="block text-sm font-medium">
            Nome do hospital
          </label>
          <input
            id="hospitalName"
            type="text"
            value={hospitalName}
            onChange={(e) => setHospitalName(e.target.value)}
            className="mt-1 w-full rounded border px-3 py-2"
          />
        </div>

        <div>
          <label htmlFor="name" className="block text-sm font-medium">
            Seu nome
          </label>
          <input
            id="name"
            type="text"
            value={name}
            onChange={(e) => setName(e.target.value)}
            className="mt-1 w-full rounded border px-3 py-2"
            autoComplete="name"
          />
        </div>

        <div>
          <label htmlFor="email" className="block text-sm font-medium">
            Email
          </label>
          <input
            id="email"
            type="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            className="mt-1 w-full rounded border px-3 py-2"
            autoComplete="email"
          />
        </div>

        <div>
          <label htmlFor="password" className="block text-sm font-medium">
            Senha
          </label>
          <input
            id="password"
            type="password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            className="mt-1 w-full rounded border px-3 py-2"
            autoComplete="new-password"
          />
        </div>

        {error && <p className="text-sm text-red-600">{error}</p>}
        {info && <p className="text-sm text-green-600">{info}</p>}

        <button
          type="submit"
          disabled={submitting}
          className="w-full rounded bg-blue-600 py-2 text-white disabled:opacity-50"
        >
          {submitting ? 'Criando...' : 'Criar conta'}
        </button>

        <p className="text-center text-sm">
          Já tem conta? <Link to="/login" className="text-blue-600">Entrar</Link>
        </p>
      </form>
    </div>
  );
}
