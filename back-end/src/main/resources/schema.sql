CREATE EXTENSION IF NOT EXISTS postgis;

--  vessels commissioned to operation in the ocean
CREATE TABLE IF NOT EXISTS vessels (
    vessel_id SERIAL PRIMARY KEY,
    vessel_name VARCHAR(100) NOT NULL
);

--  registered users (Captain / Manager)
CREATE TABLE IF NOT EXISTS  users (
    user_id SERIAL PRIMARY KEY,
    first_name VARCHAR(50) NOT NULL,
    last_name VARCHAR(50) NOT NULL,
    email VARCHAR(100) UNIQUE NOT NULL,
    password VARCHAR(60) NOT NULL,
    role VARCHAR(20) NOT NULL,
    vessel_id INTEGER NULL REFERENCES vessels(vessel_id)
);

-- spatial registration
CREATE TABLE IF NOT EXISTS  zones (
    zone_id SERIAL PRIMARY KEY,
    name VARCHAR(100) UNIQUE NOT NULL,
    color VARCHAR(20) DEFAULT 'blue',
    coordinates GEOMETRY(POLYGON, 4326)
);

-- Store GPS coordinates of vessel during a trip
CREATE TABLE IF NOT EXISTS vessel_positions (
    id SERIAL PRIMARY KEY,
    vessel_id INTEGER NOT NULL REFERENCES vessels(vessel_id) ON DELETE CASCADE,
    latitude DOUBLE PRECISION NOT NULL,
    longitude DOUBLE PRECISION NOT NULL,
    timestamp TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Log violations when a ship enters a restricted zone
CREATE TABLE IF NOT EXISTS alerts (
    id SERIAL PRIMARY KEY,
    vessel_id INTEGER NOT NULL REFERENCES vessels(vessel_id) ON DELETE CASCADE,
    zone_id INTEGER REFERENCES zones(zone_id) ON DELETE CASCADE,
    alert_type VARCHAR(255) NOT NULL,
    timestamp TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    -- Allow manager to mark true if matter resolved
    resolved BOOLEAN DEFAULT FALSE
);

-- captured / registered species to catch
CREATE TABLE IF NOT EXISTS  fish_types (
    fish_id SERIAL PRIMARY KEY,
    fish_name VARCHAR(100) NOT NULL UNIQUE
);

-- trips recorded
CREATE TABLE IF NOT EXISTS  trips (
    trip_id SERIAL PRIMARY KEY,
    captain_id INTEGER REFERENCES users(user_id),
    vessel_id INTEGER REFERENCES vessels(vessel_id),
    start_time TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    end_time TIMESTAMP,
    status VARCHAR(20) DEFAULT 'active'
);

-- Logbook records
CREATE TABLE IF NOT EXISTS  log_entries (
    log_id SERIAL PRIMARY KEY,
    trip_id INTEGER REFERENCES trips(trip_id) ON DELETE CASCADE,
    vessel_id INTEGER REFERENCES vessels(vessel_id),
    fish_id INTEGER REFERENCES fish_types(fish_id),
    common_name VARCHAR(100) NOT NULL,
    weight_kg DECIMAL(10,2),
    quantity INTEGER,
    log_type VARCHAR(20),
    zone_id INTEGER REFERENCES zones(zone_id)
);

-- quotas for the captains to follow
CREATE TABLE IF NOT EXISTS  quotas (
    quota_id SERIAL PRIMARY KEY,
    user_id INTEGER REFERENCES users(user_id) ON DELETE CASCADE,
    fish_id INTEGER REFERENCES fish_types(fish_id),
    weight_limit_kg DECIMAL(10,2) NOT NULL,
    frequency VARCHAR(20) DEFAULT 'Daily',
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

--Reference seed data (baseline data required for foreign keys)

-- 1) A vessel must exist so trips can reference vessel_id
INSERT INTO vessels (vessel_name)
VALUES ('OceanSense Vessel A')
ON CONFLICT DO NOTHING;

-- Public copy (2026-09-19): create users through the API with your own password.
-- The original account seed omitted the required password column.

-- 3) Fish type must exist so log_entries can reference fish_id
INSERT INTO fish_types (fish_name) VALUES ('Tuna') ON CONFLICT DO NOTHING;
INSERT INTO fish_types (fish_name) VALUES ('Salmon') ON CONFLICT DO NOTHING;
INSERT INTO fish_types (fish_name) VALUES ('Shark') ON CONFLICT DO NOTHING;
INSERT INTO fish_types (fish_name) VALUES ('Cod') ON CONFLICT DO NOTHING;
INSERT INTO fish_types (fish_name) VALUES ('Mackerel') ON CONFLICT DO NOTHING;