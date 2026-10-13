package com.biblioteca.escolarbiblioteca.controller;

import org.springframework.stereotype.Controller;
import org.springframework.web.bind.annotation.GetMapping;

/**
 * Sirve la aplicación Angular (SPA).
 * Las rutas del frontend se reenvían a index.html para que Angular Router
 * las resuelva en el navegador (también al recargar la página con F5).
 * Reemplaza a los antiguos ViewController / DashboardRedirectController de Thymeleaf.
 */
@Controller
public class SpaForwardController {

    @GetMapping({
            "/", "/login", "/registro", "/403", "/404", "/500",
            "/catalogo", "/mis-prestamos", "/perfil",
            "/admin", "/admin/{seccion:[^\\.]*}"
    })
    public String forwardToIndex() {
        return "forward:/index.html";
    }
}
