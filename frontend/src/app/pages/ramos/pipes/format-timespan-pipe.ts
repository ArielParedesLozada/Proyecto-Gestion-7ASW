import { Pipe, PipeTransform } from '@angular/core';

@Pipe({
  name: 'formatTimespan'
})
export class FormatTimespanPipe implements PipeTransform {

  transform(value: string | null | undefined): string {
    if (!value) return '—';
    const parts = value.split('.');
    let days = 0;
    let rest = value;
    if (parts.length === 2) {
      days = parseInt(parts[0], 10);
      rest = parts[1];
    }
    const timeParts = rest.split(':');
    const hours = parseInt(timeParts[0], 10);
    const minutes = parseInt(timeParts[1], 10);
    if (days > 0) {
      return `${days} día${days !== 1 ? 's' : ''}`;
    }
    if (hours > 0) {
      return `${hours} hora${hours !== 1 ? 's' : ''}`;
    }
    if (minutes > 0) {
      return `${minutes} minuto${minutes !== 1 ? 's' : ''}`;
    }
    return '0 días';
  }
}
