package com.biblioteca.escolarbiblioteca.config;

import com.biblioteca.escolarbiblioteca.model.Rol;
import com.biblioteca.escolarbiblioteca.model.Usuario;
import com.biblioteca.escolarbiblioteca.repository.*;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.mockito.ArgumentCaptor;
import org.springframework.security.crypto.bcrypt.BCryptPasswordEncoder;
import org.springframework.test.util.ReflectionTestUtils;
import java.util.Optional;
import static org.junit.jupiter.api.Assertions.*;
import static org.mockito.Mockito.*;

class DataInitializerTest {
    private RolRepository roles;
    private UsuarioRepository usuarios;
    private LibroRepository libros;
    private DataInitializer initializer;

    @BeforeEach
    void setup() {
        roles = mock(RolRepository.class);
        usuarios = mock(UsuarioRepository.class);
        libros = mock(LibroRepository.class);
        initializer = new DataInitializer(roles, usuarios, libros, new BCryptPasswordEncoder());
        ReflectionTestUtils.setField(initializer, "adminEmail", "admin@example.com");
        ReflectionTestUtils.setField(initializer, "adminPassword", "InicialSegura123!");
        ReflectionTestUtils.setField(initializer, "minimumPasswordLength", 12);
        ReflectionTestUtils.setField(initializer, "seedDemoData", false);
        when(roles.findByNombre(Rol.ERol.ADMIN)).thenReturn(Optional.of(new Rol(1L, Rol.ERol.ADMIN)));
        when(roles.findByNombre(Rol.ERol.ALUMNO)).thenReturn(Optional.of(new Rol(2L, Rol.ERol.ALUMNO)));
    }

    @Test
    void administradorExistenteNoSeModificaNiSeDuplica() {
        when(usuarios.existsByRol_Nombre(Rol.ERol.ADMIN)).thenReturn(true);
        ReflectionTestUtils.setField(initializer, "adminPassword", "");
        initializer.run();
        verify(usuarios, never()).save(any());
        verifyNoInteractions(libros);
    }

    @Test
    void primerAdministradorUsaCredencialesConfiguradasYCifrado() {
        initializer.run();
        var captor = ArgumentCaptor.forClass(Usuario.class);
        verify(usuarios).save(captor.capture());
        assertEquals("admin@example.com", captor.getValue().getEmail());
        assertTrue(new BCryptPasswordEncoder().matches("InicialSegura123!", captor.getValue().getPassword()));
        assertEquals(Rol.ERol.ADMIN, captor.getValue().getRol().getNombre());
    }

    @Test
    void contrasenaInicialVaciaDetieneLaCreacion() {
        ReflectionTestUtils.setField(initializer, "adminPassword", "");
        assertThrows(IllegalStateException.class, () -> initializer.run());
        verify(usuarios, never()).save(any());
    }

    @Test
    void correoInicialInvalidoDetieneLaCreacion() {
        ReflectionTestUtils.setField(initializer, "adminEmail", "correo-invalido");
        assertThrows(IllegalStateException.class, () -> initializer.run());
    }
}
