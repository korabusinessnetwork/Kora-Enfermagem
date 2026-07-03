import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';
import type { ITurnoWithUser, TurnoTipo } from '../types';

const TURNO_LABEL: Record<TurnoTipo, string> = {
  manha: 'Manhã',
  tarde: 'Tarde',
  noite: 'Noite',
};

const MESES = [
  'Janeiro', 'Fevereiro', 'Março', 'Abril', 'Maio', 'Junho',
  'Julho', 'Agosto', 'Setembro', 'Outubro', 'Novembro', 'Dezembro',
];

export function exportEscalaPdf(
  hospitalName: string,
  mes: number,
  ano: number,
  turnos: ITurnoWithUser[],
): void {
  const doc = new jsPDF();

  doc.setFontSize(16);
  doc.text(`Escala — ${hospitalName}`, 14, 18);
  doc.setFontSize(11);
  doc.text(`${MESES[mes - 1]}/${ano}`, 14, 26);

  autoTable(doc, {
    startY: 32,
    head: [['Data', 'Turno', 'Enfermeiro', 'Status']],
    body: turnos.map((t) => [t.data, TURNO_LABEL[t.turno], t.users?.name ?? '', t.status]),
  });

  doc.save(`escala-${ano}-${String(mes).padStart(2, '0')}.pdf`);
}
