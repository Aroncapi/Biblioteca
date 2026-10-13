package com.biblioteca.escolarbiblioteca.controller;

import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RestController;
import javax.sql.DataSource;
import java.sql.Connection;
import java.sql.SQLException;
import java.util.Map;

@RestController
@RequiredArgsConstructor
public class HealthController {
    private final DataSource dataSource;

    @GetMapping("/health")
    public ResponseEntity<Map<String, String>> health() {
        try (Connection connection = dataSource.getConnection()) {
            if (connection.isValid(2)) {
                return ResponseEntity.ok(Map.of("status", "UP"));
            }
        } catch (SQLException ex) {
            return ResponseEntity.status(503).body(Map.of("status", "DOWN"));
        }
        return ResponseEntity.status(503).body(Map.of("status", "DOWN"));
    }
}
