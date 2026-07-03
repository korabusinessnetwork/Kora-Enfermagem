export type UserRole = 'admin' | 'gerente' | 'enfermeiro';

export interface IUser {
  id: string;
  email: string;
  name: string;
  role: UserRole;
  hospital_id: string;
  avatar_url: string | null;
  is_active: boolean;
  last_login: string | null;
}

export type EscalaStatus = 'draft' | 'published' | 'archived';
export type TurnoTipo = 'manha' | 'tarde' | 'noite';
export type TurnoStatus = 'confirmado' | 'pendente' | 'recusado';

export interface IEscala {
  id: string;
  hospital_id: string;
  mes: number;
  ano: number;
  status: EscalaStatus;
  created_by: string;
}

export interface ITurno {
  id: string;
  escala_id: string;
  user_id: string;
  data: string;
  turno: TurnoTipo;
  status: TurnoStatus;
}

export interface ITurnoWithUser extends ITurno {
  users: { name: string };
}
