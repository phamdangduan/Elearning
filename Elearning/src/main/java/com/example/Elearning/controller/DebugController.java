package com.example.Elearning.controller;

import lombok.extern.slf4j.Slf4j;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.Authentication;
import org.springframework.security.core.GrantedAuthority;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.web.bind.annotation.*;

import java.util.HashMap;
import java.util.Map;
import java.util.stream.Collectors;

/**
 * Debug controller to check authentication and authorization
 * Remove this in production!
 */
@Slf4j
@RestController
@RequestMapping("/api/debug")
@CrossOrigin(origins = "*")
public class DebugController {

    @GetMapping("/whoami")
    public ResponseEntity<?> whoami() {
        Authentication auth = SecurityContextHolder.getContext().getAuthentication();
        
        Map<String, Object> response = new HashMap<>();
        
        if (auth == null || !auth.isAuthenticated()) {
            response.put("authenticated", false);
            response.put("message", "Not authenticated");
            return ResponseEntity.ok(response);
        }
        
        response.put("authenticated", true);
        response.put("principal", auth.getPrincipal());
        response.put("authorities", auth.getAuthorities().stream()
                .map(GrantedAuthority::getAuthority)
                .collect(Collectors.toList()));
        response.put("details", auth.getDetails());
        
        log.info("Debug whoami - Principal: {}, Authorities: {}", 
                auth.getPrincipal(), 
                auth.getAuthorities());
        
        return ResponseEntity.ok(response);
    }
    
    @GetMapping("/check-admin")
    public ResponseEntity<?> checkAdmin() {
        Authentication auth = SecurityContextHolder.getContext().getAuthentication();
        
        Map<String, Object> response = new HashMap<>();
        
        if (auth == null || !auth.isAuthenticated()) {
            response.put("isAdmin", false);
            response.put("message", "Not authenticated");
            return ResponseEntity.ok(response);
        }
        
        boolean isAdmin = auth.getAuthorities().stream()
                .anyMatch(a -> a.getAuthority().equals("ROLE_ADMIN"));
        
        response.put("isAdmin", isAdmin);
        response.put("principal", auth.getPrincipal());
        response.put("authorities", auth.getAuthorities().stream()
                .map(GrantedAuthority::getAuthority)
                .collect(Collectors.toList()));
        
        log.info("Debug check-admin - Is Admin: {}, Principal: {}, Authorities: {}", 
                isAdmin,
                auth.getPrincipal(), 
                auth.getAuthorities());
        
        return ResponseEntity.ok(response);
    }
}
