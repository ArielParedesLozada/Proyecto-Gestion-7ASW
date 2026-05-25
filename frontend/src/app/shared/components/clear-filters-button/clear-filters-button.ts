import { Component, input, output } from '@angular/core';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';

/** Botón «Limpiar» con estilo unificado del toolbar SICOP. */
@Component({
  selector: 'app-clear-filters-button',
  imports: [MatButtonModule, MatIconModule],
  templateUrl: './clear-filters-button.html',
})
export class ClearFiltersButton {
  readonly label = input('Limpiar');
  readonly clear = output<void>();

  onClick(): void {
    this.clear.emit();
  }
}
