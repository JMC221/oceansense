package com.startup1.oceansense.Security;

import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;
import org.springframework.security.config.Customizer;
import org.springframework.security.config.annotation.web.builders.HttpSecurity;
import org.springframework.security.crypto.bcrypt.BCryptPasswordEncoder;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.security.web.SecurityFilterChain;
import org.springframework.web.servlet.config.annotation.CorsRegistry;
import org.springframework.web.servlet.config.annotation.WebMvcConfigurer;

@Configuration
public class SecurityConfig {

    //HTTP Security
    @Bean
    public SecurityFilterChain filterChain(HttpSecurity http) throws Exception {
        return http
                .cors(Customizer.withDefaults())
                // Disable CSRF — the React SPA uses stateless JSON requests, not browser form posts
                .csrf(csrf -> csrf.disable())

                // Allow all API endpoints for now (development phase).
                // Replace with role-based rules (e.g. .hasRole("MANAGER")) when adding JWT auth.
                .authorizeHttpRequests(auth -> auth.anyRequest().permitAll())

                // Keep HTTP Basic enabled so Thunder Client / Postman tests still work
                .httpBasic(Customizer.withDefaults())

                .build();
    }

    //Global CORS
    // This global bean covers every endpoint including Spring Security's own filter
    // chain, which @CrossOrigin on controllers alone does not reach.
    @Bean
    public WebMvcConfigurer corsConfigurer() {
        return new WebMvcConfigurer() {
            @Override
            public void addCorsMappings(CorsRegistry registry) {
                registry.addMapping("/api/**")
                        .allowedOriginPatterns("*")
                        .allowedMethods("*")
                        .allowedHeaders("*")
                        .allowCredentials(false);
            }
        };
        // code before global integration
//        return new WebMvcConfigurer() {
//            @Override
//            public void addCorsMappings(CorsRegistry registry) {
//                registry.addMapping("/api/**")
//                        .allowedOrigins("http://localhost:5173")   // Vite dev server
//                        .allowedMethods("GET", "POST", "PUT", "DELETE", "OPTIONS")
//                        .allowedHeaders("*");
//            }
//        };
    }

    //Password encoder
    @Bean
    public PasswordEncoder passwordEncoder() {
        // BCrypt: industry-standard adaptive hashing — salted automatically,
        // work factor increases as hardware gets faster.
        return new BCryptPasswordEncoder();
    }
}