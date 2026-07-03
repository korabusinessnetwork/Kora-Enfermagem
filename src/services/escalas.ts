import { supabase } from './supabase';
import type { IEscala, ITurnoWithUser, TurnoTipo } from '../types';

export async function listEscalas(hospitalId: string): Promise<IEscala[]> {
  const { data, error } = await supabase
    .from('escalas')
    .select('*')
    .eq('hospital_id', hospitalId)
    .order('ano', { ascending: false })
    .order('mes', { ascending: false });
  if (error) throw new Error(`DB Error: ${error.message}`);
  return data as IEscala[];
}

export async function fetchEscala(id: string): Promise<IEscala> {
  if (!id) throw new Error('Invalid ID');
  const { data, error } = await supabase.from('escalas').select('*').eq('id', id).single();
  if (error) throw new Error(`DB Error: ${error.message}`);
  return data as IEscala;
}

export async function createEscala(
  hospitalId: string,
  mes: number,
  ano: number,
  createdBy: string,
): Promise<IEscala> {
  const { data, error } = await supabase
    .from('escalas')
    .insert({ hospital_id: hospitalId, mes, ano, created_by: createdBy })
    .select()
    .single();
  if (error) throw new Error(`DB Error: ${error.message}`);
  return data as IEscala;
}

export async function listTurnos(escalaId: string): Promise<ITurnoWithUser[]> {
  const { data, error } = await supabase
    .from('turnos')
    .select('*, users(name)')
    .eq('escala_id', escalaId)
    .order('data', { ascending: true });
  if (error) throw new Error(`DB Error: ${error.message}`);
  return data as unknown as ITurnoWithUser[];
}

export async function createTurno(
  escalaId: string,
  userId: string,
  data: string,
  turno: TurnoTipo,
): Promise<void> {
  const { error } = await supabase
    .from('turnos')
    .insert({ escala_id: escalaId, user_id: userId, data, turno });
  if (error) throw new Error(`DB Error: ${error.message}`);
}

export async function bulkCreateTurnos(
  escalaId: string,
  turnos: { userId: string; data: string; turno: TurnoTipo }[],
): Promise<void> {
  const { error } = await supabase.from('turnos').insert(
    turnos.map((t) => ({ escala_id: escalaId, user_id: t.userId, data: t.data, turno: t.turno })),
  );
  if (error) throw new Error(`DB Error: ${error.message}`);
}

export async function deleteTurno(id: string): Promise<void> {
  const { error } = await supabase.from('turnos').delete().eq('id', id);
  if (error) throw new Error(`DB Error: ${error.message}`);
}

export async function fetchHospitalName(hospitalId: string): Promise<string> {
  const { data, error } = await supabase
    .from('hospitals')
    .select('name')
    .eq('id', hospitalId)
    .single();
  if (error) throw new Error(`DB Error: ${error.message}`);
  return data.name;
}

export async function listHospitalUsers(hospitalId: string): Promise<{ id: string; name: string }[]> {
  const { data, error } = await supabase
    .from('users')
    .select('id, name')
    .eq('hospital_id', hospitalId)
    .eq('is_active', true)
    .order('name');
  if (error) throw new Error(`DB Error: ${error.message}`);
  return data;
}
