/** Fecha local en ISO `yyyy-mm-dd` (sin desfase UTC al usar `toISOString()`). */
export function toIsoDateOnlyLocal(d: Date): string {
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, '0');
  const day = String(d.getDate()).padStart(2, '0');
  return `${y}-${m}-${day}`;
}
