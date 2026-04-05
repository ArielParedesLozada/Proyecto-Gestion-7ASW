import { CommonModule } from '@angular/common';
import { Component, computed, input, Input, signal } from '@angular/core';

export interface TableColumn<T = any> {
  key: string;
  label: string;
  type?: 'text' | 'badge' | 'custom';
  template?: any; // TemplateRef
}

export type TableRow = Record<string, any>;

@Component({
  selector: 'app-table',
  imports: [CommonModule],
  templateUrl: './table.html',
  styleUrl: './table.scss',
})
export class Table<T> {
  columns = input<TableColumn<T>[]>([])
  data = input<TableRow[]>([]);

  page = signal(1);
  pageSize = signal(5);

  paginatedData = computed(() => {
    const start = (this.page() - 1) * this.pageSize();
    return this.data().slice(start, start + this.pageSize());
  });
}
