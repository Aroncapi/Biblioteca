package com.biblioteca.escolarbiblioteca.controller;

import org.springframework.stereotype.Controller;
import org.springframework.web.bind.annotation.GetMapping;

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
