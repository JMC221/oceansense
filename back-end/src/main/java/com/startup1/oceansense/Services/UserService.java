package com.startup1.oceansense.Services;

import com.startup1.oceansense.Models.User;
import com.startup1.oceansense.Models.Vessel;
import com.startup1.oceansense.Repositories.UserRepository;
import com.startup1.oceansense.Repositories.VesselRepository;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Service;

import java.util.List;

@Service
public class UserService {

    private final UserRepository userRepository;
    private final VesselRepository vesselRepository;
    private final PasswordEncoder passwordEncoder;

    public UserService(UserRepository userRepository,
                       VesselRepository vesselRepository,
                       PasswordEncoder passwordEncoder) {
        this.userRepository  = userRepository;
        this.vesselRepository = vesselRepository;
        this.passwordEncoder  = passwordEncoder;
    }

    //READ: all users
    public List<User> getAllUsers() {
        return userRepository.findAll();
    }

    //READ: one user by id
    public User getUserById(Integer id) {
        return userRepository.findById(id)
                .orElseThrow(() -> new RuntimeException("User not found"));
    }

    //READ: user by email (used internally)
    public User getUserByEmail(String email) {
        return userRepository.findByEmail(email)
                .orElseThrow(() -> new RuntimeException("User not found"));
    }

    //LOGIN
    // Looks up the user by email, then uses BCrypt to check the supplied password
    // against the stored hash. Never compares plain-text passwords directly.
    public User login(String email, String rawPassword) {
        User user = userRepository.findByEmail(email)
                .orElseThrow(() -> new RuntimeException("Invalid email or password"));

        if (!passwordEncoder.matches(rawPassword, user.getPassword())) {
            throw new RuntimeException("Invalid email or password");
        }

        return user;
    }

    //CREATE
    public User createUser(User user) {
        if (user.getEmail() == null || user.getEmail().isBlank()) {
            throw new RuntimeException("Email is required");
        }
        if (userRepository.existsByEmail(user.getEmail())) {
            throw new RuntimeException("Email already exists");
        }
        if (user.getPassword() == null || user.getPassword().isBlank()) {
            throw new RuntimeException("Password is required");
        }

        // Resolve vessel FK if provided
        if (user.getVessel() != null && user.getVessel().getVesselId() != null) {
            Vessel vessel = vesselRepository.findById(user.getVessel().getVesselId())
                    .orElseThrow(() -> new RuntimeException("Vessel not found"));
            user.setVessel(vessel);
        } else {
            user.setVessel(null);
        }

        // Hash password before saving — never store plain text
        user.setPassword(passwordEncoder.encode(user.getPassword()));
        return userRepository.save(user);
    }

    //UPDATE
    public User updateUser(Integer id, User updatedUser) {
        User existing = userRepository.findById(id)
                .orElseThrow(() -> new RuntimeException("User not found"));

        // Email uniqueness check (only if email is changing)
        if (updatedUser.getEmail() != null
                && !updatedUser.getEmail().equals(existing.getEmail())
                && userRepository.existsByEmail(updatedUser.getEmail())) {
            throw new RuntimeException("Email already exists");
        }

        // Apply non-null fields (partial update pattern)
        if (updatedUser.getFirstName()  != null) existing.setFirstName(updatedUser.getFirstName());
        if (updatedUser.getLastName()   != null) existing.setLastName(updatedUser.getLastName());
        if (updatedUser.getEmail()      != null) existing.setEmail(updatedUser.getEmail());
        if (updatedUser.getRole()       != null) existing.setRole(updatedUser.getRole());

        // Vessel re-link
        if (updatedUser.getVessel() != null) {
            if (updatedUser.getVessel().getVesselId() != null) {
                Vessel vessel = vesselRepository.findById(updatedUser.getVessel().getVesselId())
                        .orElseThrow(() -> new RuntimeException("Vessel not found"));
                existing.setVessel(vessel);
            } else {
                existing.setVessel(null);
            }
        }

        // Only re-hash if a new password was explicitly supplied
        if (updatedUser.getPassword() != null && !updatedUser.getPassword().isBlank()) {
            existing.setPassword(passwordEncoder.encode(updatedUser.getPassword()));
        }

        return userRepository.save(existing);
    }

    //DELETE
    public void deleteUser(Integer id) {
        if (!userRepository.existsById(id)) {
            throw new RuntimeException("User not found");
        }
        userRepository.deleteById(id);
    }
}