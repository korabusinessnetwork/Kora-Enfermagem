import type { TurnoTipo } from '../types';

export interface TurnoGerado {
  userId: string;
  data: string;
  turno: TurnoTipo;
}

const TURNOS: TurnoTipo[] = ['manha', 'tarde', 'noite'];

function diasNoMes(mes: number, ano: number): number {
  return new Date(ano, mes, 0).getDate();
}

/**
 * Distribui 3 turnos/dia entre os enfermeiros ativos do hospital por rotação de
 * deslocamento: no dia `d`, o turno de índice `i` vai para enfermeiros[(d + i) % N].
 * Isso garante matematicamente (para N >= 2) que nenhum enfermeiro repete o mesmo
 * turno em dois dias seguidos, sem precisar de lógica de tentativa-e-erro.
 *
 * Limitação conhecida: com N < 3 enfermeiros ativos, é impossível cobrir os 3 turnos
 * do dia sem que alguém trabalhe mais de um turno no mesmo dia — a rotação não
 * evita isso, só reduz ao mínimo possível dado o quadro de pessoal.
 *
 * Não implementa a regra de "folga mínima 6-8 dias" do CLAUDE.md original: é
 * incompatível com a meta de ~10 turnos/enfermeiro/mês em 30 dias (exigiria só
 * ~3-4 turnos/mês por enfermeiro). Ajustar a spec com o time de produto antes de
 * tentar reintroduzir essa regra.
 */
export function gerarTurnos(
  enfermeiros: { id: string }[],
  mes: number,
  ano: number,
): TurnoGerado[] {
  const n = enfermeiros.length;
  if (n === 0) return [];

  const totalDias = diasNoMes(mes, ano);
  const turnos: TurnoGerado[] = [];

  for (let dia = 1; dia <= totalDias; dia++) {
    const data = `${ano}-${String(mes).padStart(2, '0')}-${String(dia).padStart(2, '0')}`;

    TURNOS.forEach((turno, i) => {
      const enfermeiro = enfermeiros[(dia + i) % n];
      turnos.push({ userId: enfermeiro.id, data, turno });
    });
  }

  return turnos;
}
