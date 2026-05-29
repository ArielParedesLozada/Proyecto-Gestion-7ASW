import { Component, input, output } from '@angular/core';
import { PageEvent } from '@angular/material/paginator';
import { MatIconModule } from '@angular/material/icon';
import { MatButtonModule } from '@angular/material/button';
import { SicopDataTable } from '../../../shared/components/sicop-data-table/sicop-data-table';
import { AppUserRole, UserListRow, roleLabelEs } from '../models/user-list.model';

@Component({
  selector: 'app-users-table',
  imports: [MatIconModule, MatButtonModule, SicopDataTable],
  templateUrl: './users-table.html',
  styleUrl: './users-table.scss',
})
export class UsersTable {
  rows = input.required<UserListRow[]>();

  paginatorLength = input.required<number>();
  pageIndex = input.required<number>();
  pageSize = input(10);

  pageChange = output<PageEvent>();
  editar = output<UserListRow>();

  rolEs(role: AppUserRole): string {
    return roleLabelEs(role);
  }

  onEditar(row: UserListRow): void {
    this.editar.emit(row);
  }
}
