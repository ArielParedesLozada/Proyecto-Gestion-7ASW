import { Component, input, output } from '@angular/core';

export type SicopSegmentedTone = 'default' | 'success' | 'danger' | 'warn';

export interface SicopSegmentedOption<T extends string = string> {
  value: T;
  label: string;
  count?: number;
  tone?: SicopSegmentedTone;
}

@Component({
  selector: 'app-sicop-segmented-control',
  templateUrl: './sicop-segmented-control.html',
  styleUrl: './sicop-segmented-control.scss',
})
export class SicopSegmentedControl<T extends string = string> {
  readonly options = input.required<SicopSegmentedOption<T>[]>();
  readonly value = input.required<T>();
  readonly ariaLabel = input('Seleccionar opción');

  readonly valueChange = output<T>();

  select(optionValue: T): void {
    if (optionValue !== this.value()) {
      this.valueChange.emit(optionValue);
    }
  }
}
