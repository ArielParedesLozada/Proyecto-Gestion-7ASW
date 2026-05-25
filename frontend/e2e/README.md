# Pruebas E2E / aceptación — SICOP (Playwright)

## Requisitos

1. **PostgreSQL** con migraciones aplicadas (`dotnet ef database update` en `backend/`).
2. **Backend** en `http://localhost:4780` (`dotnet watch run` en `backend/`).
3. **Frontend** en `http://localhost:4200` (`npm run dev` en `frontend/`).
4. Usuario administrador existente (por defecto `adminpapu` del seed).

## Instalación

Desde `frontend/`:

```bash
npm install
npx playwright install chromium
npm run e2e:fixtures
```

## Variables de entorno

Copia `e2e/.env.example` y define al menos:

| Variable | Descripción |
|----------|-------------|
| `E2E_ADMIN_USER` | Usuario admin (default: `adminpapu`) |
| `E2E_ADMIN_PASSWORD` | Contraseña del admin |
| `E2E_USER_PASSWORD` | Contraseña para usuario USER de PA-USR-03 |
| `E2E_BASE_URL` | URL del frontend (default: `http://localhost:4200`) |
| `E2E_API_URL` | URL del API (default: `http://localhost:4780`) |

En PowerShell:

```powershell
$env:E2E_ADMIN_PASSWORD="tu-clave"
npm run test:e2e
```

## Ejecutar pruebas

```bash
npm run test:e2e
npm run test:e2e:ui
npm run test:e2e:report
```

La configuración está en `e2e/playwright.config.ts`.

## Estructura

| Ruta | Contenido |
|------|-----------|
| `specs/auth.spec.ts` | PA-AUTH-01 … 05 (sin sesión precargada) |
| `specs/dashboard.spec.ts` | PA-DASH-01 … 03 |
| `specs/catalogos.spec.ts` | PA-CAT-01 … 03 |
| `specs/polizas.spec.ts` | PA-POL-01 … 09 |
| `specs/renovaciones.spec.ts` | PA-REN-01 … 02 |
| `specs/reportes.spec.ts` | PA-REP-01 … 02 |
| `specs/usuarios.spec.ts` | PA-USR-03 |
| `helpers/` | Login, navegación, catálogo, póliza, API, Excel |
| `fixtures/` | Datos compartidos y fixture de auth |
| `assets/` | Excel de importación |
| `ACCEPTANCE_TEST_MATRIX.md` | Matriz para informe |

## Notas

- **PA-REN-02** espera hasta 2 minutos el job `CheckRenovaciones` (cron cada minuto en backend).
- **PA-POL-08** genera un Excel dinámico con los nombres del catálogo E2E.
- No se levantan servicios automáticamente: deben estar en ejecución antes de correr las pruebas.
