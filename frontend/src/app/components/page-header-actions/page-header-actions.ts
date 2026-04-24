import { Component } from '@angular/core';
import { MatIconModule } from '@angular/material/icon';
import { MatButtonModule } from '@angular/material/button';

@Component({
  selector: 'app-page-header-actions',
  imports: [MatIconModule, MatButtonModule],
  templateUrl: './page-header-actions.html',
  styleUrl: './page-header-actions.scss',
})
export class PageHeaderActions {}
