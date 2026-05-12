/** Estados de póliza para UI y filtro. */
export type PolizaEstado = 'vigente' | 'porVencer' | 'expirado';

export interface PolizaListRow {
  id: string;
  numero: string;
  contratista: string;
  obra: string;
  ramo: string;
  ramoId: string;
  aseguradora: string;
  /** ISO yyyy-MM-dd */
  fechaExpiracion: string;
  valor: number;
  estado: PolizaEstado;
}

/** Filtro sobre `PolizaListRow.estado` (mapeado desde el API: 0/1/2). */
export const ESTADO_FILTRO_OPTIONS: { value: PolizaEstado | 'todos'; label: string }[] = [
  { value: 'todos', label: 'Todos los estados' },
  { value: 'vigente', label: 'Vigente' },
  { value: 'porVencer', label: 'Por vencer' },
  { value: 'expirado', label: 'Expirado' },
];
