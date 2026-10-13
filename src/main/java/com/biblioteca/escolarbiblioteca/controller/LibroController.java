package com.biblioteca.escolarbiblioteca.controller;

import com.biblioteca.escolarbiblioteca.dto.LibroDTO;
import com.biblioteca.escolarbiblioteca.service.LibroService;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/libros")
@RequiredArgsConstructor
public class LibroController {

    private final LibroService libroService;

    @GetMapping
    public ResponseEntity<List<LibroDTO>> getAllLibros() {

        return ResponseEntity.ok(libroService.findAll());
    }

    @GetMapping("/{id}")
    public ResponseEntity<LibroDTO> getLibroById(@PathVariable Long id) {

        return ResponseEntity.ok(libroService.findById(id));
    }

    @GetMapping("/buscar")
    public ResponseEntity<List<LibroDTO>> buscarLibros(@RequestParam String termino) {

        return ResponseEntity.ok(libroService.buscarPorTermino(termino));
    }

    @GetMapping("/categoria/{categoria}")
    public ResponseEntity<List<LibroDTO>> getLibrosByCategoria(@PathVariable String categoria) {

        return ResponseEntity.ok(libroService.buscarPorCategoria(categoria));
    }

    @PostMapping
    @PreAuthorize("hasRole('ADMIN')")
    public ResponseEntity<LibroDTO> createLibro(@Valid @RequestBody LibroDTO libroDTO) {

        LibroDTO nuevoLibro = libroService.save(libroDTO);
        return ResponseEntity.status(HttpStatus.CREATED).body(nuevoLibro);
    }

    @PutMapping("/{id}")
    @PreAuthorize("hasRole('ADMIN')")
    public ResponseEntity<LibroDTO> updateLibro(@PathVariable Long id, @Valid @RequestBody LibroDTO libroDTO) {

        LibroDTO libroActualizado = libroService.update(id, libroDTO);
        return ResponseEntity.ok(libroActualizado);
    }

    @DeleteMapping("/{id}")
    @PreAuthorize("hasRole('ADMIN')")
    public ResponseEntity<?> deleteLibro(@PathVariable Long id) {
        libroService.deleteById(id);
        return ResponseEntity.ok()
                .body(java.util.Map.of("message", "Libro eliminado correctamente"));
    }
}
