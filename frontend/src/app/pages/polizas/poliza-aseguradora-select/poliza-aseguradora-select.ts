import { Component, computed, ElementRef, forwardRef, input, output, signal, viewChild } from '@angular/core';
import { ControlValueAccessor, FormControl, NG_VALUE_ACCESSOR, ReactiveFormsModule } from '@angular/forms';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatSelectModule } from '@angular/material/select';
import { AseguradoraListRow } from '../../aseguradoras/models/aseguradora-list-row';
import { takeUntilDestroyed, toSignal } from '@angular/core/rxjs-interop';
import { startWith } from 'rxjs';
import { MatIconModule } from '@angular/material/icon';

@Component({
  selector: 'app-poliza-aseguradora-select',
  standalone: true,
  imports: [ReactiveFormsModule, MatFormFieldModule, MatSelectModule, MatIconModule],
  templateUrl: './poliza-aseguradora-select.html',
  styleUrl: './poliza-aseguradora-select.scss',
  providers: [
    {
      provide: NG_VALUE_ACCESSOR,
      useExisting: forwardRef(() => PolizaAseguradoraSelect),
      multi: true,
    },
  ],
})
export class PolizaAseguradoraSelect implements ControlValueAccessor {
  /** Listado de aseguradoras desde el padre. */
  readonly aseguradoras = input.required<AseguradoraListRow[]>();

  /** Texto del `placeholder` del `mat-select` (campo cerrado). */
  readonly selectPlaceholder = input('Seleccione aseguradora');

  /** Muestra la primera opción vacía deshabilitada (p. ej. alta de póliza). */
  readonly showPlaceholderOption = input(false);

  /** Etiqueta de la opción vacía inicial. */
  readonly placeholderOptionLabel = input('Seleccione aseguradora');

  /* modal crear*/
  readonly agregar = output<void>()

  readonly innerCtrl = new FormControl<string>('', { nonNullable: true });
  readonly filterCtrl = new FormControl('', { nonNullable: true });

  private readonly filterText = toSignal(this.filterCtrl.valueChanges.pipe(startWith('')), {
    initialValue: '',
  });

  /** Valor seleccionado (id); se actualiza también en `writeValue` sin depender de `valueChanges`). */
  private readonly selectedId = signal(this.innerCtrl.value);

  readonly hasActiveFilter = computed(() => this.filterText().trim().length > 0);

  readonly filteredAseguradoras = computed(() => {
    const rows = this.aseguradoras();
    const q = this.filterText().trim().toLowerCase();
    const sel = this.selectedId();
    let list = !q ? [...rows] : rows.filter((a) => a.nombre.toLowerCase().includes(q));
    if (sel && !list.some((a) => a.id === sel)) {
      const picked = rows.find((a) => a.id === sel);
      if (picked) {
        list = [picked, ...list];
      }
    }
    return list;
  });

  readonly panelClass = 'sicop-poliza-aseguradora-panel';

  private readonly searchInput = viewChild<ElementRef<HTMLInputElement>>('searchInput');

  private cvaOnChange: (value: string) => void = () => void 0;
  private cvaOnTouched: () => void = () => void 0;

  constructor() {
    this.innerCtrl.valueChanges.pipe(takeUntilDestroyed()).subscribe((id) => {
      this.selectedId.set(id);
      this.cvaOnChange(id);
    });
  }

  openedChange(open: boolean): void {
    if (open) {
      this.filterCtrl.setValue('');
      queueMicrotask(() => this.searchInput()?.nativeElement?.focus());
    } else {
      this.cvaOnTouched();
    }
  }

  filterKeydown(ev: KeyboardEvent): void {
    ev.stopPropagation();
  }

  filterClick(ev: MouseEvent): void {
    ev.stopPropagation();
  }

  writeValue(value: string | null): void {
    const v = value ?? '';
    this.innerCtrl.setValue(v, { emitEvent: false });
    this.selectedId.set(v);
  }

  registerOnChange(fn: (value: string) => void): void {
    this.cvaOnChange = fn;
  }

  registerOnTouched(fn: () => void): void {
    this.cvaOnTouched = fn;
  }

  setDisabledState(isDisabled: boolean): void {
    if (isDisabled) {
      this.innerCtrl.disable({ emitEvent: false });
      this.filterCtrl.disable({ emitEvent: false });
    } else {
      this.innerCtrl.enable({ emitEvent: false });
      this.filterCtrl.enable({ emitEvent: false });
    }
  }

  agregarNuevo(ev: MouseEvent): void {
    ev.stopPropagation();
    this.agregar.emit();
  }
}
