# Frontend - SICOP

Frontend desarrollado en Angular 20.1.0 con Standalone Components, Signals y RxJS.

## Tecnologías

- Angular 20.1.0
- TypeScript 5.6
- SASS/SCSS
- RxJS 7.8.0
- Signals (Angular Signals)

## Estructura del Proyecto

```
frontend/src/app
│
├── components      # Componentes reutilizables
├── pages          # Páginas/Views
├── services       # Servicios HTTP
├── interfaces     # Interfaces TypeScript
└── shared         # Recursos compartidos
```

## Características

- **Standalone Components**: Sin módulos, cada componente es independiente
- **Signals**: Manejo de estado reactivo con Signals
- **RxJS Observables**: Para peticiones HTTP asíncronas
- **Angular Router**: Navegación entre páginas
- **HttpClient**: Consumo de API REST del backend

## Instalación

```bash
npm install
```

## Desarrollo

```bash
npm start
```

La aplicación se ejecutará en `http://localhost:4200`

## Build

```bash
npm run build
```

## Configuración de API

El frontend está configurado para consumir la API del backend en:
- `http://localhost:5000/api`

Puedes modificar la URL base en los servicios HTTP:
- `src/app/services/blog-http.service.ts`
- `src/app/shared/services/project-http.service.ts`

