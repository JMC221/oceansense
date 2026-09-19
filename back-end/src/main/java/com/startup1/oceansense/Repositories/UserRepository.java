package com.startup1.oceansense.Repositories;

import com.startup1.oceansense.Models.User;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.Optional;

public interface UserRepository extends JpaRepository<User, Integer> {

    // Used in UserService to enforce unique emails on create/update
    boolean existsByEmail(String email);

    // Used in UserService.login() to look up a user by their email address
    Optional<User> findByEmail(String email);
}