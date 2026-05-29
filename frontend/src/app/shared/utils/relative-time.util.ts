/** Texto relativo en español para timestamps de notificaciones. */
export function formatRelativeTimeEs(isoDate: string | null | undefined, now = new Date()): string {
  if (!isoDate) {
    return '';
  }

  const date = new Date(isoDate);
  if (Number.isNaN(date.getTime())) {
    return '';
  }

  const diffMs = now.getTime() - date.getTime();
  if (diffMs < 0) {
    return 'Ahora';
  }

  const diffSec = Math.floor(diffMs / 1000);
  if (diffSec < 60) {
    return 'Hace un momento';
  }

  const diffMin = Math.floor(diffSec / 60);
  if (diffMin < 60) {
    return diffMin === 1 ? 'Hace 1 min' : `Hace ${diffMin} min`;
  }

  const diffHours = Math.floor(diffMin / 60);
  if (diffHours < 24) {
    return diffHours === 1 ? 'Hace 1 hora' : `Hace ${diffHours} horas`;
  }

  const startOfToday = new Date(now.getFullYear(), now.getMonth(), now.getDate());
  const startOfDate = new Date(date.getFullYear(), date.getMonth(), date.getDate());
  if (startOfDate.getTime() === startOfToday.getTime()) {
    return 'Hoy';
  }

  const diffDays = Math.floor((startOfToday.getTime() - startOfDate.getTime()) / 86_400_000);
  if (diffDays === 1) {
    return 'Ayer';
  }
  if (diffDays < 7) {
    return `Hace ${diffDays} días`;
  }

  return date.toLocaleDateString('es-EC', { day: '2-digit', month: 'short' });
}
