BIBLIOTECA ESCOLAR

Aplicación web para gestionar usuarios, libros, préstamos, devoluciones y reportes.
Frontend: Angular 21, Bootstrap 5 y Chart.js.
Backend: Spring Boot 3.2.3, Java 21, Spring Security y JPA.
Base de datos: MySQL 8.0.46 con migraciones Flyway.

EJECUCIÓN LOCAL

Crear una base MySQL llamada biblioteca_escolar. Los valores de desarrollo son localhost:3306, usuario root y contraseña mysql; se pueden sustituir con DB_URL, DB_USERNAME y DB_PASSWORD.
Ejecutar mvnw.cmd spring-boot:run en Windows o ./mvnw spring-boot:run en Linux.
Abrir http://localhost:8080.
El modo de desarrollo crea datos de ejemplo y un administrador con correo admin@biblioteca.com y contraseña admin123 únicamente cuando no existe ningún administrador.

FRONTEND

En frontend, ejecutar npm ci y npm run build:spring para generar los recursos de Spring Boot.
Para desarrollo, iniciar el backend y ejecutar npm start en frontend. Abrir http://localhost:4200.
Utilizar Node.js 22.12 o superior de la rama 22, o una versión compatible con Angular 21.

DOCKER

Copiar .env.example a .env y completar los valores requeridos.
Ejecutar docker compose up --build -d y abrir http://localhost:8080.
Ejecutar docker compose down para detener los servicios conservando el volumen de MySQL.

PRODUCCIÓN

El Dockerfile recompila Angular y genera el JAR con Java 21. railway.json configura la construcción y el healthcheck /health.
Definir SPRING_PROFILES_ACTIVE=prod, DB_URL, DB_USERNAME, DB_PASSWORD y JWT_SECRET.
DB_URL debe tener formato JDBC: jdbc:mysql://HOST:PUERTO/BASE?serverTimezone=UTC&allowPublicKeyRetrieval=true
JWT_SECRET requiere al menos 32 bytes aleatorios.
ADMIN_EMAIL y ADMIN_PASSWORD definen el administrador inicial. ADMIN_PASSWORD requiere al menos 12 caracteres. Los administradores existentes conservan sus credenciales.
SEED_DEMO_DATA=false desactiva los datos de ejemplo. PORT define el puerto HTTP y utiliza 8080 por defecto.
No guardar .env ni credenciales reales en el repositorio.

PRUEBAS

mvnw.cmd verify ejecuta las pruebas unitarias y comprueba una cobertura mínima de líneas del 60%.
mvnw.cmd -Pmysql-it verify añade la integración HTTP con MySQL y la migración real.
La integración utiliza localhost:33317/biblioteca_test, usuario root y contraseña biblioteca_test_local por defecto. MYSQL_TEST_URL, MYSQL_TEST_USERNAME y MYSQL_TEST_PASSWORD permiten cambiar estos valores. Utilizar exclusivamente una base de pruebas.

Definir LOAD_ADMIN_EMAIL y LOAD_ADMIN_PASSWORD y ejecutar python scripts/load_test.py --url http://localhost:8080 --users 10 --requests 20 para medir rendimiento en un entorno de pruebas. El reporte se guarda en artifacts/performance.json.

.github/workflows/verify.yml compila Angular, ejecuta pruebas con MySQL, comprueba cobertura y construye Docker.
