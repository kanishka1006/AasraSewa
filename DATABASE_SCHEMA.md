# AasraSewa - Database Schema Design (PostgreSQL)

This document details the relational database schema designed for the AasraSewa platform. It utilizes **PostgreSQL** with the **PostGIS** extension for geospatial capabilities (essential for shelter/rescue operations).

## 1. Entity-Relationship Overview

*   **Users** are the central entity. They can be citizens, volunteers, or admins (defined by **Roles**).
*   **Groups** link Users together (e.g., Families or Tour Groups) for easier tracking and bulk alerts.
*   **Smart Bands** are IoT hardware assigned to Users via **Rentals**. This tracks who has which device and the **Deposit** status.
*   **Shelters** are static safe zones with capacity management.
*   **Rescue Teams** are dynamic entities dispatched to handle incidents.

---

## 2. Table Definitions (SQL)

```sql
-- Enable PostGIS for location features
CREATE EXTENSION IF NOT EXISTS postgis;
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- 1. ROLES
-- Static lookup for permissions (e.g., 'Admin', 'Volunteer', 'Pilgrim', 'Citizen')
CREATE TABLE roles (
    id SERIAL PRIMARY KEY,
    name VARCHAR(50) UNIQUE NOT NULL,
    description TEXT,
    permissions JSONB DEFAULT '{}'::jsonb -- Flexible permission flags
);

-- 2. GROUPS
-- Links families or tour groups together.
CREATE TABLE groups (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    name VARCHAR(100), -- e.g., "Sharma Family" or "Trek Group Alpha"
    type VARCHAR(50) CHECK (type IN ('FAMILY', 'TOUR_GROUP', 'OFFICIAL')),
    primary_contact_user_id UUID, -- distinct from FK to separate concerns
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 3. USERS
-- Core user identity.
CREATE TABLE users (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    full_name VARCHAR(100) NOT NULL,
    phone_number VARCHAR(20) UNIQUE NOT NULL,
    role_id INTEGER REFERENCES roles(id),
    group_id UUID REFERENCES groups(id) ON DELETE SET NULL, -- Family linking
    
    -- Status & Safety
    is_safe BOOLEAN DEFAULT TRUE,
    last_known_location GEOMETRY(POINT, 4326), -- PostGIS Geo Point
    last_location_update TIMESTAMP WITH TIME ZONE,
    
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Add self-reference constraints after table creation if needed
ALTER TABLE groups 
ADD CONSTRAINT fk_group_leader 
FOREIGN KEY (primary_contact_user_id) REFERENCES users(id);

-- 4. SMART BANDS (Inventory)
-- IoT Devices hardware inventory
CREATE TABLE smart_bands (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    mac_address VARCHAR(17) UNIQUE NOT NULL, -- Hardware ID
    qr_code_hash VARCHAR(255) UNIQUE, -- For quick scanning
    firmware_version VARCHAR(20),
    battery_level INTEGER CHECK (battery_level BETWEEN 0 AND 100),
    status VARCHAR(50) DEFAULT 'AVAILABLE' CHECK (status IN ('AVAILABLE', 'RENTED', 'MAINTENANCE', 'LOST')),
    last_ping TIMESTAMP WITH TIME ZONE
);

-- 5. RENTALS & DEPOSITS
-- Transaction log of who has which band.
CREATE TABLE band_rentals (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID REFERENCES users(id) NOT NULL,
    band_id UUID REFERENCES smart_bands(id) NOT NULL,
    
    -- Transaction Validations
    rental_start_time TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    rental_end_time TIMESTAMP WITH TIME ZONE, -- NULL means currently active
    
    -- Financials
    deposit_amount DECIMAL(10, 2) NOT NULL DEFAULT 0.00,
    deposit_status VARCHAR(50) DEFAULT 'HELD' CHECK (deposit_status IN ('HELD', 'REFUNDED', 'FORFEITED')),
    is_active BOOLEAN GENERATED ALWAYS AS (rental_end_time IS NULL) STORED
);

-- 6. SHELTERS
-- Safe locations
CREATE TABLE shelters (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    name VARCHAR(100) NOT NULL,
    location GEOMETRY(POINT, 4326) NOT NULL,
    address TEXT,
    
    -- Capacity Management
    total_capacity INTEGER NOT NULL DEFAULT 0,
    current_occupancy INTEGER NOT NULL DEFAULT 0,
    
    -- Resources (simplified JSON for inventory like water, meds)
    resources_inventory JSONB DEFAULT '{}'::jsonb,
    
    status VARCHAR(50) DEFAULT 'OPEN' CHECK (status IN ('OPEN', 'FULL', 'CLOSED')),
    contact_phone VARCHAR(20)
);

-- 7. RESCUE TEAMS
-- Operational units
CREATE TABLE rescue_teams (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    team_name VARCHAR(100) NOT NULL,
    specialization VARCHAR(100), -- e.g., 'Flood Rescue', 'Medical', 'K9 Unit'
    base_location_id UUID REFERENCES shelters(id), -- Team stationed at a shelter
    
    current_location GEOMETRY(POINT, 4326),
    status VARCHAR(50) DEFAULT 'IDLE' CHECK (status IN ('IDLE', 'DEPLOYED', 'OFF_DUTY'))
);
```

---

## 3. Indexing Strategy

To ensure scalability and fast query performance under load:

1.  **Spatial Indexes (GIST)**:
    *   `ST_DWithin` queries are critical for "Find nearest shelter" or "Find users in danger zone".
    *   `CREATE INDEX idx_users_location ON users USING GIST (last_known_location);`
    *   `CREATE INDEX idx_shelters_location ON shelters USING GIST (location);`
    *   `CREATE INDEX idx_teams_location ON rescue_teams USING GIST (current_location);`

2.  **Unique & Lookup Indexes (B-Tree)**:
    *   `users.phone_number`: Critical for faster login/lookup.
    *   `smart_bands.mac_address`: Essential for IoT ingestion pipeline lookups.
    *   `band_rentals.is_active`: Filter for locating all currently active rentals implies filtering where `rental_end_time` is NULL.

3.  **Foreign Key Indexes**:
    *   PostgreSQL does not automatically index FKs. We must add them to prevent table scans during joins.
    *   `CREATE INDEX idx_users_group_id ON users(group_id);`
    *   `CREATE INDEX idx_rentals_user_id ON band_rentals(user_id);`
    *   `CREATE INDEX idx_rentals_band_id ON band_rentals(band_id);`

## 4. Key Design Decisions

*   **UUIDs**: Used everywhere instead of Integers to allow offline ID generation on mobile devices (synced later without collision) and to obscure count metrics.
*   **JSONB for Inventory/Permissions**: Allows schema flexibility (e.g., adding "blankets" to shelter inventory) without running expensive migration scripts on millions of rows.
*   **PostGIS Geometry**: Storing locations as native Geometry types (instead of separate lat/long float columns) allows utilizing specialized high-performance spatial algorithms inside the database.
