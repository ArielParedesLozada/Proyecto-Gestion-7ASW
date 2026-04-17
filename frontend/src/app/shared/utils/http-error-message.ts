import { HttpErrorResponse } from '@angular/common/http';

/**
 * Mensaje legible a partir de `HttpErrorResponse`, cuerpo del API o `Error`.
 * @param fallback Mensaje si no se puede inferir nada más específico.
 */
export function extractHttpErrorMessage(
  err: unknown,
  fallback = 'No se pudo completar la operación. Intenta de nuevo.',
): string {
  if (err instanceof HttpErrorResponse) {
    if (err.status === 403) {
      return 'Acceso denegado por la sesión. Cierra sesión y vuelve a entrar para renovar el token.';
    }
    if (err.status === 409) {
      return readBodyMessage(err.error) ?? 'El recurso ya existe o hay un conflicto (por ejemplo, un dato duplicado).';
    }
    if (err.status === 0) {
      return 'No se pudo conectar con el servidor. Comprueba tu conexión.';
    }
    const fromBody = readBodyMessage(err.error);
    if (fromBody) {
      return fromBody;
    }
    const fromDetails = readDetailsField(err.error);
    if (fromDetails) {
      return truncateForUser(fromDetails, 400);
    }
    if (err.status >= 500) {
      return 'Error en el servidor. Intenta más tarde.';
    }
    if (err.status >= 400) {
      return `No se pudo completar la solicitud (${err.status}).`;
    }
  }

  if (err instanceof Error && err.message) {
    return err.message;
  }

  if (err && typeof err === 'object' && 'error' in err) {
    const msg = readBodyMessage((err as { error?: unknown }).error);
    if (msg) {
      return msg;
    }
  }

  return fallback;
}

function readBodyMessage(body: unknown): string | null {
  if (!body || typeof body !== 'object') {
    return null;
  }
  const o = body as Record<string, unknown>;
  const msg = o['message'] ?? o['Message'];
  if (typeof msg === 'string' && msg.length > 0) {
    if (msg === 'An internal error occurred') {
      const d = readDetailsField(body);
      if (d) {
        return truncateForUser(d, 400);
      }
    }
    return msg;
  }
  const title = o['title'];
  if (typeof title === 'string' && title.length > 0) {
    return title;
  }
  const errors = o['errors'];
  if (errors && typeof errors === 'object') {
    const firstKey = Object.keys(errors as object)[0];
    if (firstKey) {
      const arr = (errors as Record<string, unknown>)[firstKey];
      if (Array.isArray(arr) && typeof arr[0] === 'string') {
        return arr[0];
      }
    }
  }
  return null;
}

function readDetailsField(body: unknown): string | null {
  if (!body || typeof body !== 'object') {
    return null;
  }
  const d = (body as Record<string, unknown>)['details'] ?? (body as Record<string, unknown>)['Details'];
  return typeof d === 'string' && d.length > 0 ? d : null;
}

function truncateForUser(text: string, max: number): string {
  const t = text.trim();
  if (t.length <= max) {
    return t;
  }
  return `${t.slice(0, max)}…`;
}
