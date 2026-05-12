import { Pipe, PipeTransform } from '@angular/core';

@Pipe({
  name: 'estado'
})
export class EstadoPipe implements PipeTransform {
  private estadoMap: Map<number, string> = new Map([
    [0, 'Vigente'],
    [1, 'Por Vencer'],
    [2, 'Vencida'],
    [3, 'Pendiente']
  ]);

  transform(value: any): string {
    if (value === undefined || value === null) {
      return 'Desconocido';
    }

    const estadoTexto = this.estadoMap.get(value);
    return estadoTexto || `Estado ${value} no válido`;
  }

}
