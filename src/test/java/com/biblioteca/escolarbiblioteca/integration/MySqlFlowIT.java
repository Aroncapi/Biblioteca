package com.biblioteca.escolarbiblioteca.integration;

import com.biblioteca.escolarbiblioteca.config.DataInitializer;
import com.biblioteca.escolarbiblioteca.repository.UsuarioRepository;
import com.fasterxml.jackson.databind.JsonNode;
import org.junit.jupiter.api.*;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.boot.test.web.client.TestRestTemplate;
import org.springframework.http.*;
import org.springframework.jdbc.core.JdbcTemplate;
import org.springframework.http.client.JdkClientHttpRequestFactory;
import org.springframework.security.crypto.bcrypt.BCryptPasswordEncoder;
import java.util.Map;
import java.util.UUID;
import static org.junit.jupiter.api.Assertions.*;

@SpringBootTest(webEnvironment = SpringBootTest.WebEnvironment.RANDOM_PORT, properties = {
        "spring.datasource.url=${MYSQL_TEST_URL:jdbc:mysql://localhost:33317/biblioteca_test?allowPublicKeyRetrieval=true&useSSL=false}",
        "spring.datasource.username=${MYSQL_TEST_USERNAME:root}",
        "spring.datasource.password=${MYSQL_TEST_PASSWORD:biblioteca_test_local}",
        "spring.datasource.driver-class-name=com.mysql.cj.jdbc.Driver",
        "spring.jpa.hibernate.ddl-auto=validate",
        "spring.flyway.enabled=true",
        "spring.flyway.baseline-on-migrate=false",
        "app.bootstrap.admin-email=admin@biblioteca.com",
        "app.bootstrap.admin-password=admin123",
        "app.seed-demo-data=false"
})
@TestMethodOrder(MethodOrderer.OrderAnnotation.class)
class MySqlFlowIT {
    @Autowired private TestRestTemplate http;
    @Autowired private JdbcTemplate jdbc;
    @Autowired private DataInitializer initializer;
    @Autowired private UsuarioRepository usuarios;

    @BeforeEach
    void configureClient() {
        http.getRestTemplate().setRequestFactory(new JdkClientHttpRequestFactory());
    }

    private ResponseEntity<JsonNode> request(HttpMethod method, String path, Object body, String token) {
        HttpHeaders headers = new HttpHeaders();
        if (token != null) headers.setBearerAuth(token);
        return http.exchange(path, method, new HttpEntity<>(body, headers), JsonNode.class);
    }

    private String login(String email, String password) {
        ResponseEntity<JsonNode> response = request(HttpMethod.POST, "/api/auth/login",
                Map.of("email", email, "password", password), null);
        assertEquals(HttpStatus.OK, response.getStatusCode(), response.toString());
        assertNotNull(response.getBody());
        return response.getBody().get("token").asText();
    }

    private String register(String suffix) {
        String email = "alumno-" + suffix + "-" + UUID.randomUUID() + "@example.com";
        ResponseEntity<JsonNode> response = request(HttpMethod.POST, "/api/auth/register/alumno",
                Map.of("nombre", "Alumno", "apellido", "Prueba", "email", email,
                        "password", "AlumnoTest123!", "nivel", "SECUNDARIA", "grado", 3, "seccion", "A"), null);
        assertEquals(HttpStatus.CREATED, response.getStatusCode(), response.toString());
        return login(email, "AlumnoTest123!");
    }

    @Test
    @Order(1)
    void migracionYFlujoCompletoRespetanRolesStockYExportaciones() {
        assertEquals("1", jdbc.queryForObject("select version from flyway_schema_history where success = 1 order by installed_rank desc limit 1", String.class));
        assertEquals(HttpStatus.OK, http.getForEntity("/health", String.class).getStatusCode());
        for (String path : new String[]{"/", "/login", "/catalogo", "/admin/reportes"}) {
            var page = http.getForEntity(path, String.class);
            assertEquals(HttpStatus.OK, page.getStatusCode(), path);
            assertTrue(page.getBody().contains("<app-root"), path);
        }
        assertEquals(HttpStatus.UNAUTHORIZED, request(HttpMethod.GET, "/api/libros", null, null).getStatusCode());
        assertEquals(HttpStatus.UNAUTHORIZED, request(HttpMethod.GET, "/api/libros", null, "token-invalido").getStatusCode());
        jdbc.update("update usuarios set password=? where email=?", new BCryptPasswordEncoder().encode("admin123"), "admin@biblioteca.com");
        String admin = login("admin@biblioteca.com", "admin123");
        String alumno = register("propietario");
        String otro = register("otro");
        assertEquals(HttpStatus.FORBIDDEN, request(HttpMethod.GET, "/api/admin/usuarios", null, alumno).getStatusCode());
        var create = request(HttpMethod.POST, "/api/libros", Map.of("nombre", "Libro Integración", "categoria", "Novela",
                "codigoLibro", "IT-" + UUID.randomUUID().toString().toUpperCase(), "stockTotal", 2, "stockDisponible", 2), admin);
        assertTrue(create.getStatusCode().is2xxSuccessful(), create.toString());
        long libroId = create.getBody().get("id").asLong();
        var loan = request(HttpMethod.POST, "/api/alumno/prestamos/solicitar/" + libroId, Map.of(), alumno);
        assertEquals(HttpStatus.OK, loan.getStatusCode(), loan.toString());
        long loanId = loan.getBody().get("id").asLong();
        assertEquals(1, request(HttpMethod.GET, "/api/libros/" + libroId, null, alumno).getBody().get("stockDisponible").asInt());
        assertEquals(HttpStatus.OK, request(HttpMethod.GET, "/api/prestamos/" + loanId, null, alumno).getStatusCode());
        assertEquals(HttpStatus.OK, request(HttpMethod.GET, "/api/prestamos/" + loanId, null, admin).getStatusCode());
        assertEquals(HttpStatus.FORBIDDEN, request(HttpMethod.GET, "/api/prestamos/" + loanId, null, otro).getStatusCode());
        assertEquals(HttpStatus.UNAUTHORIZED, request(HttpMethod.GET, "/api/prestamos/" + loanId, null, null).getStatusCode());
        assertEquals(loanId, request(HttpMethod.GET, "/api/alumno/mis-prestamos", null, alumno).getBody().get(0).get("id").asLong());
        for (String format : new String[]{"pdf", "xlsx", "csv"}) {
            HttpHeaders headers = new HttpHeaders();
            headers.setBearerAuth(admin);
            var export = http.exchange("/api/admin/reportes/prestamos-activos/export/" + format,
                    HttpMethod.GET, new HttpEntity<>(headers), byte[].class);
            assertEquals(HttpStatus.OK, export.getStatusCode(), format);
            assertNotNull(export.getBody());
            assertTrue(export.getBody().length > 0, format);
            assertTrue(export.getHeaders().containsKey(HttpHeaders.CONTENT_DISPOSITION));
            if (format.equals("pdf")) assertEquals('%', export.getBody()[0]);
            if (format.equals("xlsx")) assertEquals('P', export.getBody()[0]);
        }
        jdbc.update("update prestamos set estado='VENCIDO', fecha_devolucion_estimada = DATE_SUB(NOW(), INTERVAL 1 DAY) where id=?", loanId);
        var returned = request(HttpMethod.PUT, "/api/alumno/prestamos/devolver/" + loanId, Map.of(), alumno);
        assertEquals(HttpStatus.OK, returned.getStatusCode(), returned.toString());
        assertEquals("DEVUELTO", returned.getBody().get("estado").asText());
        assertEquals(2, request(HttpMethod.GET, "/api/libros/" + libroId, null, alumno).getBody().get("stockDisponible").asInt());
        assertEquals(HttpStatus.BAD_REQUEST, request(HttpMethod.PUT, "/api/alumno/prestamos/devolver/" + loanId, Map.of(), alumno).getStatusCode());
        assertEquals(2, jdbc.queryForObject("select stock_disponible from libros where id=?", Integer.class, libroId));
    }

    @Test
    @Order(2)
    void nuevaContrasenaDelAdministradorSeConservaAlReinicializar() {
        String token = login("admin@biblioteca.com", "admin123");
        assertEquals(HttpStatus.BAD_REQUEST, request(HttpMethod.POST, "/api/usuarios/cambiar-password",
                Map.of("passwordActual", "admin123", "passwordNueva", "a"), token).getStatusCode());
        assertEquals(HttpStatus.OK, request(HttpMethod.POST, "/api/usuarios/cambiar-password",
                Map.of("passwordActual", "admin123", "passwordNueva", "AdminNueva123!"), token).getStatusCode());
        String saved = usuarios.findByEmail("admin@biblioteca.com").orElseThrow().getPassword();
        long count = usuarios.count();
        initializer.run();
        assertEquals(saved, usuarios.findByEmail("admin@biblioteca.com").orElseThrow().getPassword());
        assertEquals(count, usuarios.count());
        assertNotNull(login("admin@biblioteca.com", "AdminNueva123!"));
        assertEquals(HttpStatus.UNAUTHORIZED, request(HttpMethod.POST, "/api/auth/login",
                Map.of("email", "admin@biblioteca.com", "password", "admin123"), null).getStatusCode());
    }
}
