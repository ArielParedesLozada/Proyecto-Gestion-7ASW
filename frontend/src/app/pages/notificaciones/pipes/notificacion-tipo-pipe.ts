import { Pipe, PipeTransform } from '@angular/core';

@Pipe({
  name: 'notificacionTipo'
})
export class NotificacionTipoPipe implements PipeTransform {
  private tipoMap: Map<number, string> = new Map([
    [0, 'Renovación'],
    [1, 'Expiración']
  ]);
  
  transform(value: number): string {
    if (value === undefined || value === null) {
      return 'Desconocido';
    }
    return this.tipoMap.get(value) || `Tipo ${value}`;
  }
}
