# Migración Thymeleaf → Angular

Las 16 vistas Thymeleaf se reemplazaron por una SPA Angular 21 (standalone components) en `frontend/`,
con Bootstrap 5, Bootstrap Icons, Chart.js y SweetAlert2 (lo que promete el informe AVANCE 1).
El backend ahora es solo API REST + JWT.

## Equivalencias

| Thymeleaf (antes)            | Angular (ahora)                                   |
|------------------------------|---------------------------------------------------|
| auth/login.html              | `/login` → pages/auth/login                       |
| auth/register.html           | `/registro` → pages/auth/register                 |
| admin/dashboard.html         | `/admin/dashboard` (Chart.js con datos reales)    |
| admin/libros.html            | `/admin/libros`                                   |
| admin/usuarios.html          | `/admin/usuarios` (ahora sí permite editar)       |
| admin/prestamos.html         | `/admin/prestamos`                                |
| admin/reportes.html          | `/admin/reportes` (PDF / Excel / CSV reales)      |
| admin/perfil.html            | `/admin/perfil`                                   |
| alumno/catalogo.html         | `/catalogo`                                       |
| alumno/mis-prestamos.html    | `/mis-prestamos`                                  |
| alumno/perfil.html           | `/perfil`                                         |
| error/403, 404, 500.html     | `/403`, `/404`, `/500`                            |
| layout/header + footer       | `shared/navbar`, `shared/footer`, `shared/shell`  |

## Cambios en el backend
- `pom.xml`: se quitaron `spring-boot-starter-thymeleaf` y `thymeleaf-extras-springsecurity6`.
- Eliminados: `templates/`, `ViewController`, `DashboardRedirectController`, `ViewControllerTest`.
- Nuevo `SpaForwardController`: reenvía las rutas de Angular a `index.html` (para que F5 funcione).
- `SecurityConfig`: sin formLogin/sesión/remember-me; ahora STATELESS + JWT, 401 para no autenticados,
  y todo lo que no es `/api/**` (Angular) es público. `/api/**` conserva las reglas por rol.
- `AdminController.updateUsuario`: la contraseña es opcional al editar (antes `@Valid` la exigía).
- `application.properties`: se quitó `remember.me.key`.

## Cómo ejecutarlo

**Opción A – todo en :8080 (el build de Angular ya está en `src/main/resources/static`)**
```
.\mvnw.cmd spring-boot:run
```
Abrir http://localhost:8080

**Opción B – desarrollo del frontend (recarga en vivo)**
```
.\mvnw.cmd spring-boot:run          # terminal 1 (backend :8080)
cd frontend
npm install
npm start                           # terminal 2 → http://localhost:4200 (proxy /api → :8080)
```

**Regenerar el build para Spring Boot** (después de cambiar algo en `frontend/`):
```
cd frontend
npm run build:spring                # escribe en ../src/main/resources/static
```

Credenciales de prueba: ver `RESUMEN-SESION.txt` / `DataInitializer` (p. ej. `admin@biblioteca.com` / `admin123`).
Requiere Node 20.19+, 22.12+ o 24+.
