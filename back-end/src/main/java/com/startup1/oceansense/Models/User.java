package com.startup1.oceansense.Models; // entity classes live here

import com.fasterxml.jackson.annotation.JsonProperty; // customize JSON field names / access (e.g., write-only password)
import jakarta.persistence.*;                        // JPA annotations (@Entity, @Id, etc.)

@Entity                       // mark as JPA entity → Hibernate maps this to a table
@Table(name = "users")        // explicit table name (matches schema.sql)
public class User {

    @Id                                           // primary key
    @GeneratedValue(strategy = GenerationType.IDENTITY) // auto-increment (SERIAL in Postgres)
    @Column(name = "user_id")                     // column name in DB
    @JsonProperty("user_id")                      // JSON key when sending to frontend
    private Integer userId;

    @JsonProperty("first_name")                   // JSON key for UI/front-end consistency
    @Column(name = "first_name", nullable = false, length = 50) // DB column, required
    private String firstName;

    @JsonProperty("last_name")
    @Column(name = "last_name", nullable = false, length = 50)  // DB column, required
    private String lastName;

    @Column(nullable = false, length = 100, unique = true) // unique email at DB level
    private String email;

    // IMPORTANT: never send password back to client → write-only
    @JsonProperty(access = JsonProperty.Access.WRITE_ONLY) // deserialize from JSON, but never serialize to JSON
    @Column(name = "password", nullable = false, length = 60) // 60 chars fits BCrypt hashes
    private String password;

    @Column(nullable = false, length = 20) // e.g., "captain", "manager", "admin" …
    private String role;

    @ManyToOne                                   // many users can reference one vessel
    @JoinColumn(name = "vessel_id", referencedColumnName = "vessel_id") // FK column in users table
    private Vessel vessel;                        // optional association (can be null)

    // --- JPA needs a public no-arg constructor ---
    public User() {}

    // --- Getters & Setters (needed for JPA + JSON serialization) ---

    public Integer getUserId() { return userId; }
    public void setUserId(Integer userId) { this.userId = userId; }

    public String getFirstName() { return firstName; }
    public void setFirstName(String firstName) { this.firstName = firstName; }

    public String getLastName() { return lastName; }
    public void setLastName(String lastName) { this.lastName = lastName; }

    public String getEmail() { return email; }
    public void setEmail(String email) { this.email = email; }

    // keep getter for service-layer hashing / comparisons if needed
    public String getPassword() { return password; }
    // setter used on create + update (service will hash before saving)
    public void setPassword(String password) { this.password = password; }

    public String getRole() { return role; }
    public void setRole(String role) { this.role = role; }

    public Vessel getVessel() { return vessel; }
    public void setVessel(Vessel vessel) { this.vessel = vessel; }
}