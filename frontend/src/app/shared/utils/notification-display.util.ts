import { NotificacionItem } from '../../services/notificacion.service';
import { formatRelativeTimeEs } from './relative-time.util';

export type NotificationVisualTone = 'warn' | 'success' | 'error' | 'info' | 'pending';

export interface NotificationPopoverRow {
  id: string;
  title: string;
  description: string;
  relativeTime: string;
  icon: string;
  tone: NotificationVisualTone;
  estadoLabel: string;
}

const ESTADO_LABELS: Record<number, string> = {
  0: 'Enviada',
  1: 'Error',
  2: 'Pendiente',
  3: 'Invalidada',
};

export function sortNotificacionesByRecent(items: NotificacionItem[]): NotificacionItem[] {
  return [...items].sort(
    (a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime(),
  );
}

export function hasPendingNotificaciones(items: NotificacionItem[]): boolean {
  return items.some((item) => item.estado === 2);
}

export function toNotificationPopoverRow(item: NotificacionItem): NotificationPopoverRow {
  const toneAndIcon = resolveToneAndIcon(item);
  const obra = item.obra?.trim() || 'Sin obra';
  const obraShort = obra.length > 72 ? `${obra.slice(0, 69)}…` : obra;

  return {
    id: item.id,
    title: resolveTitle(item),
    description: `Póliza ${item.numeroPoliza} — ${obraShort}`,
    relativeTime: formatRelativeTimeEs(item.fechaEnvio ?? item.createdAt),
    icon: toneAndIcon.icon,
    tone: toneAndIcon.tone,
    estadoLabel: ESTADO_LABELS[item.estado] ?? 'Desconocido',
  };
}

function resolveTitle(item: NotificacionItem): string {
  if (item.estado === 1) {
    return 'Error en notificación';
  }
  if (item.tipo === 1) {
    return 'Vencimiento próximo';
  }
  if (item.tipo === 0) {
    return 'Renovación de póliza';
  }
  return 'Notificación del sistema';
}

function resolveToneAndIcon(item: NotificacionItem): { icon: string; tone: NotificationVisualTone } {
  if (item.estado === 1) {
    return { icon: 'error_outline', tone: 'error' };
  }
  if (item.estado === 2) {
    return { icon: 'schedule', tone: 'pending' };
  }
  if (item.tipo === 1) {
    return { icon: 'warning_amber', tone: 'warn' };
  }
  if (item.tipo === 0) {
    return { icon: 'check_circle', tone: 'success' };
  }
  return { icon: 'notifications', tone: 'info' };
}
