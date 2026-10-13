package com.biblioteca.escolarbiblioteca.controller;

import com.biblioteca.escolarbiblioteca.dto.PrestamoDTO;
import com.biblioteca.escolarbiblioteca.security.UserDetailsImpl;
import com.biblioteca.escolarbiblioteca.service.PrestamoService;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.*;

@RestController
@RequestMapping("/api/prestamos")
@RequiredArgsConstructor
public class PrestamoController {
    private final PrestamoService prestamoService;

    @GetMapping("/{id}")
    public ResponseEntity<PrestamoDTO> getPrestamoById(@PathVariable Long id,
            @AuthenticationPrincipal UserDetailsImpl userDetails) {
        if (userDetails == null) {
            return ResponseEntity.status(401).build();
        }
        return ResponseEntity.ok(prestamoService.getPrestamoById(id, userDetails.getUsuario()));
    }
}
