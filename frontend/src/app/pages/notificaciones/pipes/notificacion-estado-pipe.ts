import { Pipe, PipeTransform } from '@angular/core';

@Pipe({
  name: 'notificacionEstado'
})
export class NotificacionEstadoPipe implements PipeTransform {
  private estadoMap: Map<number, string> = new Map([
    [0, 'Enviada'],
    [1, 'Error'],
    [2, 'Pendiente'],
    [3, 'Invalidada']
  ]);

  transform(value: number): string {
    if (value === undefined || value === null) {
      return 'Desconocido';
    }
    return this.estadoMap.get(value) || `Estado ${value}`;
  }
}
