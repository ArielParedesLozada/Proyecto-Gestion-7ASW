import {
  Component,
  ViewEncapsulation,
  computed,
  forwardRef,
  input,
  signal,
  viewChild,
  ElementRef,
} from '@angular/core';
import { takeUntilDestroyed, toSignal } from '@angular/core/rxjs-interop';
import { ControlValueAccessor, FormControl, NG_VALUE_ACCESSOR, ReactiveFormsModule } from '@angular/forms';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatSelectModule } from '@angular/material/select';
import { startWith } from 'rxjs';
import { EmpresaListRow } from '../../empresas/models/empresa-list.model';

@Component({
  selector: 'app-poliza-contratista-select',
  standalone: true,
  encapsulation: ViewEncapsulation.None,
  imports: [ReactiveFormsModule, MatFormFieldModule, MatSelectModule],
  templateUrl: './poliza-contratista-select.component.html',
  styleUrl: './poliza-contratista-select.component.scss',
  providers: [
    {
      provide: NG_VALUE_ACCESSOR,
      useExisting: forwardRef(() => PolizaContratistaSelectComponent),
      multi: true,
    },
  ],
})
export class PolizaContratistaSelectComponent implements ControlValueAccessor {
  /** Listado de empresas (contratistas) desde el padre. */
  readonly empresas = input.required<EmpresaListRow[]>();

  /** Texto del `placeholder` del `mat-select` (campo cerrado). */
  readonly selectPlaceholder = input('Seleccione empresa');

  /** Muestra la primera opción vacía deshabilitada (p. ej. alta de póliza). */
  readonly showPlaceholderOption = input(false);

  /** Etiqueta de la opción vacía inicial. */
  readonly placeholderOptionLabel = input('Seleccione contratista');

  readonly innerCtrl = new FormControl<string>('', { nonNullable: true });
  readonly filterCtrl = new FormControl('', { nonNullable: true });

  private readonly filterText = toSignal(this.filterCtrl.valueChanges.pipe(startWith('')), {
    initialValue: '',
  });

  /** Valor seleccionado (id); se actualiza también en `writeValue` sin depender de `valueChanges`). */
  private readonly selectedId = signal(this.innerCtrl.value);

  readonly hasActiveFilter = computed(() => this.filterText().trim().length > 0);

  readonly filteredEmpresas = computed(() => {
    const rows = this.empresas();
    const q = this.filterText().trim().toLowerCase();
    const sel = this.selectedId();
    let list = !q ? [...rows] : rows.filter((e) => e.nombre.toLowerCase().includes(q));
    if (sel && !list.some((e) => e.id === sel)) {
      const picked = rows.find((e) => e.id === sel);
      if (picked) {
        list = [picked, ...list];
      }
    }
    return list;
  });

  readonly panelClass = 'sicop-poliza-contratista-panel';

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
}
