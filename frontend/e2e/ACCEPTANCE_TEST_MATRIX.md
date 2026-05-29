# Matriz de pruebas de aceptación automatizadas (Playwright)

| ID | Módulo | Prueba | Objetivo | Resultado esperado | Posible mejora si falla | Prioridad |
|----|--------|--------|----------|-------------------|-------------------------|-----------|
| PA-AUTH-01 | Autenticación | Login exitoso con administrador | Validar acceso admin al sistema | Redirige al dashboard; menú lateral visible; no permanece en login | Mejorar redirección posterior al login | P0 |
| PA-AUTH-02 | Autenticación | Login con credenciales incorrectas | Rechazar usuario/contraseña inválidos | Permanece en login; mensaje de error claro | Mejorar mensajes de error en autenticación | P0 |
| PA-AUTH-03 | Autenticación | Acceso directo sin sesión | Proteger rutas privadas | Redirige a `/login` al abrir `/polizas` o `/reportes` | Reforzar protección de rutas privadas | P0 |
| PA-AUTH-04 | Autenticación | Recuperación de contraseña (UI) | Flujo forgot-password sin validar correo real | Permite ingresar email; muestra confirmación o error controlado | Validar correctamente correos en recuperación de contraseña | P1 |
| PA-AUTH-05 | Autenticación | Cierre de sesión | Cerrar sesión correctamente | Vuelve a login; no accede a rutas protegidas | Limpiar sesión al cerrar sesión | P0 |
| PA-DASH-01 | Dashboard | Carga del dashboard | Confirmar pantalla principal | Dashboard, tarjetas y menú visibles | Optimizar carga del dashboard | P1 |
| PA-DASH-02 | Dashboard | Ir a nueva póliza | Acceso rápido desde dashboard | Navega a `/polizas/nueva` | Corregir accesos rápidos del dashboard | P1 |
| PA-DASH-03 | Dashboard | Ir a reportes | Acceso rápido a reportes | Navega a `/reportes` | Mejorar navegación hacia reportes | P1 |
| PA-CAT-01 | Catálogos | Crear empresa | Alta de contratista | Empresa única visible en listado | Validar creación de empresas | P0 |
| PA-CAT-02 | Catálogos | Crear aseguradora | Alta de aseguradora | Aseguradora única visible en listado | Validar creación de aseguradoras | P0 |
| PA-CAT-03 | Catálogos | Crear ramo | Alta de ramo para pólizas | Ramo único visible y seleccionable en nueva póliza | Validar creación de ramos | P0 |
| PA-POL-01 | Pólizas | Crear póliza completa | Registro end-to-end | Póliza creada; número visible en listado | Mejorar formulario de registro de pólizas | P0 |
| PA-POL-02 | Pólizas | Ver en listado | Confirmar persistencia | Número, contratista y obra visibles | Actualizar listado después de guardar | P0 |
| PA-POL-03 | Pólizas | Buscar por número | Filtro de búsqueda | Tabla filtra por número de póliza | Mejorar búsqueda de pólizas | P1 |
| PA-POL-04 | Pólizas | Filtrar por estado | Filtro vigente | Muestra póliza con filtro Vigente | Mejorar filtros por estado | P1 |
| PA-POL-05 | Pólizas | Ver detalle | Vista detalle coherente | Datos completos de la póliza | Mejorar vista de detalle | P0 |
| PA-POL-06 | Pólizas | Editar póliza | Modificar observaciones | Cambio visible tras guardar | Mejorar edición de pólizas | P1 |
| PA-POL-07 | Pólizas | Exportar PDF | Descarga PDF individual | Archivo `.pdf` descargado no vacío | Mejorar generación de PDF | P1 |
| PA-POL-08 | Pólizas | Importar Excel válido | Importación con vista previa | Diálogo de preview; póliza importada en listado | Mejorar importación desde Excel | P1 |
| PA-POL-09 | Pólizas | Importar Excel inválido | Rechazo de archivo mal formado | Mensaje de error; sin datos corruptos | Mejorar manejo de Excel inválido | P1 |
| PA-REN-01 | Renovaciones | Listado renovaciones | Pantalla operativa | Tabla o mensaje vacío adecuado | Mejorar vista de renovaciones vacías | P1 |
| PA-REN-02 | Renovaciones | Aprobar renovación pendiente | Flujo de aprobación | Botón Aprobar tras job; notificación de éxito | Mejorar aprobación de renovaciones | P0 |
| PA-REP-01 | Reportes | Abrir control maestro | Cargar módulo reportes | Título Control Maestro; tablas o vacío | Mejorar diseño/carga del módulo de reportes | P0 |
| PA-REP-02 | Reportes | Calcular con saldo inicial | Cuadre financiero | Tarjetas actualizadas tras Calcular con saldo 10000 | Mejorar cálculo del control maestro | P0 |
| PA-USR-03 | Usuarios | Menú restringido USER | Control de permisos por rol | Sin Usuarios/Auditoría; `/users` redirige a login | Mejorar control de permisos por rol | P1 |
