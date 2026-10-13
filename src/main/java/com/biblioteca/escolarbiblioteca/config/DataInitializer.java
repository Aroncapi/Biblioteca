package com.biblioteca.escolarbiblioteca.config;

import com.biblioteca.escolarbiblioteca.model.Libro;
import com.biblioteca.escolarbiblioteca.model.Rol;
import com.biblioteca.escolarbiblioteca.model.Usuario;
import com.biblioteca.escolarbiblioteca.repository.LibroRepository;
import com.biblioteca.escolarbiblioteca.repository.RolRepository;
import com.biblioteca.escolarbiblioteca.repository.UsuarioRepository;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.boot.CommandLineRunner;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Component;
import org.springframework.transaction.annotation.Transactional;
import java.util.Arrays;
import java.util.List;

@Component
@RequiredArgsConstructor
@Slf4j
public class DataInitializer implements CommandLineRunner {
    private final RolRepository rolRepository;
    private final UsuarioRepository usuarioRepository;
    private final LibroRepository libroRepository;
    private final PasswordEncoder passwordEncoder;

    @Value("${app.bootstrap.admin-email:admin@biblioteca.com}")
    private String adminEmail;

    @Value("${app.bootstrap.admin-password:admin123}")
    private String adminPassword;

    @Value("${app.bootstrap.minimum-password-length:6}")
    private int minimumPasswordLength;

    @Value("${app.seed-demo-data:true}")
    private boolean seedDemoData;

    @Override
    @Transactional
    public void run(String... args) {
        for (Rol.ERol nombre : Rol.ERol.values()) {
            if (rolRepository.findByNombre(nombre).isEmpty()) {
                rolRepository.save(new Rol(null, nombre));
            }
        }
        if (!usuarioRepository.existsByRol_Nombre(Rol.ERol.ADMIN)) {
            if (adminEmail == null || !adminEmail.matches("^[^\\s@]+@[^\\s@]+\\.[^\\s@]+$")) {
                throw new IllegalStateException("ADMIN_EMAIL debe ser un correo válido");
            }
            if (adminPassword == null || adminPassword.isBlank() || adminPassword.length() < minimumPasswordLength) {
                throw new IllegalStateException("ADMIN_PASSWORD debe tener al menos " + minimumPasswordLength + " caracteres para crear el administrador inicial");
            }
            usuarioRepository.save(Usuario.builder()
                    .nombre("Admin").apellido("Principal").email(adminEmail)
                    .password(passwordEncoder.encode(adminPassword))
                    .rol(rolRepository.findByNombre(Rol.ERol.ADMIN).orElseThrow()).build());
            log.info("Administrador inicial creado");
        }
        if (seedDemoData) {
            crearDatosDemo();
        }
        log.info("Inicialización completada");
    }

    private void crearDatosDemo() {
        if (!usuarioRepository.existsByEmail("alumno.prueba@biblioteca.com")) {
            usuarioRepository.save(Usuario.builder()
                    .nombre("Alumno").apellido("Prueba").email("alumno.prueba@biblioteca.com")
                    .password(passwordEncoder.encode("alumno123"))
                    .rol(rolRepository.findByNombre(Rol.ERol.ALUMNO).orElseThrow())
                    .nivel(Usuario.Nivel.SECUNDARIA).grado(3).seccion("A").build());
        }
        if (libroRepository.count() == 0) {
            List<Libro> libros = Arrays.asList(
                Libro.builder()
                    .nombre("Cien años de soledad")
                    .categoria("Novela")
                    .codigoLibro("LIB-001")
                    .stockTotal(5)
                    .stockDisponible(5)
                    .build(),
                Libro.builder()
                    .nombre("El principito")
                    .categoria("Infantil")
                    .codigoLibro("LIB-002")
                    .stockTotal(3)
                    .stockDisponible(3)
                    .build(),
                Libro.builder()
                    .nombre("Don Quijote de la Mancha")
                    .categoria("Clásico")
                    .codigoLibro("LIB-003")
                    .stockTotal(2)
                    .stockDisponible(2)
                    .build(),
                Libro.builder()
                    .nombre("Harry Potter y la piedra filosofal")
                    .categoria("Fantasía")
                    .codigoLibro("LIB-004")
                    .stockTotal(4)
                    .stockDisponible(4)
                    .build(),
                Libro.builder()
                    .nombre("1984")
                    .categoria("Ciencia ficción")
                    .codigoLibro("LIB-005")
                    .stockTotal(3)
                    .stockDisponible(3)
                    .build(),
                Libro.builder()
                    .nombre("Rayuela")
                    .categoria("Novela")
                    .codigoLibro("LIB-006")
                    .stockTotal(2)
                    .stockDisponible(2)
                    .build(),
                Libro.builder()
                    .nombre("El hobbit")
                    .categoria("Fantasía")
                    .codigoLibro("LIB-007")
                    .stockTotal(3)
                    .stockDisponible(3)
                    .build()
            );

            libroRepository.saveAll(libros);
        }
    }
}
