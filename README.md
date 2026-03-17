# PROYECTO DE GESTION DE PROYECTOS
Proyecto de la materia de Gestion de proyectos, Grupo 5, 7A SW

## INSTALACION
**Backend**
1. Clonar proyecto
1. Ejecutar estos comandos:
```python
cd backend
openssl genpkey -algorithm RSA -out private_key.pem -pkeyopt rsa_keygen_bits:2048
openssl rsa -pubout -in private_key.pem -out public_key.pem
```
1. Generar un .env correspondiente para conectarse a una base de datos
1. Ejecutar el comando: `dotnet ef database update`
1. Ejecutar con: `dotnet watch run`
**Frontend**
1. Clonar proyecto
1. Instalar dependencias con: `npm install`

## REQUERIMIENTOS FUNCIONALES
1. Login de usuario + Registro de usuario normal
1. Registro de polizas en el sistema
1. Generacion automatica de registros de renovacion mensual en base a la fecha de renovacion
1. Envio de notificacion a la empresa 3 dias antes de expirar
1. Generacion automatica de oficio y notificacion a las empresas
1. Registro de nueva renovacion
1. Envio automatico de correo recordatorio a la empresa si la poliza se vence
1. Reportes (de control maestro, cada mes). Exportable
1. Importacion de informacion desde el Excel (Excel estrictamente estructurado)
## REQUERIMIENTOS NO FUNCIONALES
1. Seguridad
1. Eficiencia
1. Facilidad de uso