import { Component, computed, input, signal, viewChild, ElementRef } from '@angular/core';
import { MatTooltipModule } from '@angular/material/tooltip';

/**
 * Texto en celda de tabla: recorte con ellipsis (1 línea) o `-webkit-line-clamp` (varias líneas)
 * y tooltip Material solo si el contenido queda truncado (comprobado en hover).
 */
@Component({
  selector: 'app-sicop-table-cell-clamp',
  standalone: true,
  imports: [MatTooltipModule],
  host: {
    class: 'sicop-table-cell-clamp',
    style: 'display: block; min-width: 0; width: 100%;',
  },
  template: `
    <span
      #inner
      class="sicop-table-cell-clamp__inner"
      [class.sicop-table-cell-clamp__inner--single]="isSingleLine()"
      [style.-webkit-line-clamp]="webkitLineClamp()"
      (mouseenter)="onHover()"
      [matTooltip]="tooltipBody()"
      [matTooltipDisabled]="tooltipDisabled()"
      matTooltipShowDelay="280"
      matTooltipPosition="above"
      matTooltipClass="sicop-table-cell-clamp-tooltip"
      >{{ displayed() }}</span
    >
  `,
  styles: `
    .sicop-table-cell-clamp__inner {
      max-width: 100%;
      line-height: 1.35;
    }

    .sicop-table-cell-clamp__inner--single {
      display: block;
      white-space: nowrap;
      overflow: hidden;
      text-overflow: ellipsis;
    }

    .sicop-table-cell-clamp__inner:not(.sicop-table-cell-clamp__inner--single) {
      display: -webkit-box;
      -webkit-box-orient: vertical;
      overflow: hidden;
      overflow-wrap: anywhere;
      word-break: break-word;
    }
  `,
})
export class SicopTableCellClampComponent {
  text = input<string | null | undefined>('');
  placeholder = input('—');
  /** 1 = una línea con ellipsis horizontal; ≥2 = varias líneas con line-clamp. */
  maxLines = input(2);

  private readonly inner = viewChild<ElementRef<HTMLElement>>('inner');

  readonly isSingleLine = computed(() => this.maxLines() <= 1);

  /** Valor numérico para `-webkit-line-clamp` o null si es modo una línea. */
  readonly webkitLineClamp = computed((): number | null => {
    const n = this.maxLines();
    return n <= 1 ? null : n;
  });

  readonly displayed = computed(() => {
    const t = this.text();
    if (t == null) {
      return this.placeholder();
    }
    const s = String(t);
    return s.trim() === '' ? this.placeholder() : s;
  });

  readonly tooltipBody = computed(() => {
    const t = this.text();
    if (t == null) {
      return '';
    }
    return String(t).trim();
  });

  readonly tooltipDisabled = signal(true);

  onHover(): void {
    const body = this.tooltipBody();
    if (!body) {
      this.tooltipDisabled.set(true);
      return;
    }
    const el = this.inner()?.nativeElement;
    if (!el) {
      this.tooltipDisabled.set(true);
      return;
    }
    if (this.isSingleLine()) {
      this.tooltipDisabled.set(el.scrollWidth <= el.clientWidth + 1);
    } else {
      this.tooltipDisabled.set(el.scrollHeight <= el.clientHeight + 1);
    }
  }
}
