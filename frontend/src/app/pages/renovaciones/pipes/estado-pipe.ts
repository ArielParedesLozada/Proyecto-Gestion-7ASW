import { Pipe, PipeTransform } from '@angular/core';
import { resolveRenovacionEstadoDisplay } from '../../../shared/utils/renovacion-estado-display.util';

@Pipe({
  name: 'estado',
})
export class EstadoPipe implements PipeTransform {
  transform(value: number | string | null | undefined): string {
    return resolveRenovacionEstadoDisplay(value).label;
  }
}
