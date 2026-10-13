FRONTEND DE BIBLIOTECA ESCOLAR

REQUISITOS
Node.js 22.12 o superior de la rama 22 y npm.

INSTALACIÓN
npm ci

DESARROLLO
Iniciar Spring Boot en el puerto 8080 y ejecutar npm start.
Abrir http://localhost:4200. El proxy envía las solicitudes /api al backend.

COMPILACIÓN
npm run build:spring genera los recursos en ../src/main/resources/static.
El Dockerfile de la raíz realiza esta compilación durante el despliegue.

ESTRUCTURA
src/app/core contiene autenticación, servicios HTTP y guards.
src/app/pages contiene las pantallas de administración y alumnos.
src/app/shared contiene los elementos de interfaz reutilizables.
