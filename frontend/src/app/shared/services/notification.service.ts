import { inject, Injectable } from '@angular/core';
import { MatSnackBar, MatSnackBarConfig } from '@angular/material/snack-bar';
import { Observable, Subject } from 'rxjs';
import { concatMap, take } from 'rxjs/operators';
import { NotificationKind } from '../models/notification.model';
import { extractHttpErrorMessage } from '../utils/http-error-message';

export type { NotificationKind } from '../models/notification.model';

type OpenParams = { message: string; kind: NotificationKind; durationMs: number };

@Injectable({
  providedIn: 'root',
})
export class NotificationService {
  private readonly snackBar = inject(MatSnackBar);
  private readonly opens$ = new Subject<OpenParams>();

  /** Arriba a la derecha: visible, no compite con tablas ni paginadores. */
  private readonly defaults: MatSnackBarConfig = {
    horizontalPosition: 'end',
    verticalPosition: 'top',
  };

  constructor() {
    this.opens$
      .pipe(concatMap((p) => this.openSerialized$(p)))
      .subscribe();
  }

  success(message: string, durationMs = 4500): void {
    this.open(message, 'success', durationMs);
  }

  error(message: string, durationMs = 7200): void {
    this.open(message, 'error', durationMs);
  }

  warn(message: string, durationMs = 5800): void {
    this.open(message, 'warn', durationMs);
  }

  info(message: string, durationMs = 5200): void {
    this.open(message, 'info', durationMs);
  }

  fromHttpError(err: unknown): void {
    this.error(extractHttpErrorMessage(err));
  }

  private open(message: string, kind: NotificationKind, durationMs: number): void {
    this.opens$.next({ message, kind, durationMs });
  }

  /** Cola serializada: un snack visible a la vez (`concatMap`). */
  private openSerialized$(p: OpenParams): Observable<void> {
    return new Observable<void>((subscriber) => {
      const ref = this.snackBar.open(p.message, 'Cerrar', {
        ...this.defaults,
        duration: p.durationMs,
        panelClass: ['sicop-snack-panel', `sicop-snack-panel--${p.kind}`],
      });
      ref
        .afterDismissed()
        .pipe(take(1))
        .subscribe(() => {
          subscriber.next();
          subscriber.complete();
        });
    });
  }
}
