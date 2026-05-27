-- Enable PostGIS extension
CREATE EXTENSION IF NOT EXISTS postgis;

-- 1. Create Users Table
CREATE TABLE users (
    id UUID PRIMARY KEY,
    name VARCHAR(255) NOT NULL,
    email VARCHAR(255),
    phone VARCHAR(50),
    aadhar_number VARCHAR(50),
    is_aadhar_verified BOOLEAN DEFAULT FALSE,
    role VARCHAR(50) DEFAULT 'CITIZEN',
    language VARCHAR(10) DEFAULT 'en',
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- 2. Create Jurisdictions Table
CREATE TABLE jurisdictions (
    id UUID PRIMARY KEY,
    name VARCHAR(255) NOT NULL,
    level VARCHAR(50) NOT NULL, -- WARD, DIVISION, CIRCLE, DISTRICT, STATE, NATIONAL
    authority_type VARCHAR(50) NOT NULL, -- MUNICIPAL, PWD, NHAI, BRO, PMGSY, FOREST
    geometry GEOMETRY(MULTIPOLYGON, 4326),
    parent_id UUID REFERENCES jurisdictions(id)
);

CREATE INDEX idx_jurisdictions_geometry ON jurisdictions USING gist(geometry);

-- 3. Create Officers Table
CREATE TABLE officers (
    id UUID PRIMARY KEY, -- Matches Keycloak User ID
    name VARCHAR(255) NOT NULL,
    email VARCHAR(255),
    phone VARCHAR(50),
    role VARCHAR(50) NOT NULL, -- JE, AE, EE, SE, CE, COMMISSIONER, GM
    jurisdiction_id UUID REFERENCES jurisdictions(id),
    authority_type VARCHAR(50),
    is_active BOOLEAN DEFAULT TRUE
);

-- 4. Create Contractors Table
CREATE TABLE contractors (
    id UUID PRIMARY KEY,
    firm_name VARCHAR(255) NOT NULL,
    contact_person VARCHAR(255),
    phone VARCHAR(50),
    is_active BOOLEAN DEFAULT TRUE
);

-- 5. Create Master Tickets Table
CREATE TABLE master_tickets (
    id UUID PRIMARY KEY,
    title VARCHAR(255) NOT NULL,
    description TEXT,
    status VARCHAR(50) DEFAULT 'OPEN', -- OPEN, ASSIGNED, IN_PROGRESS, RESOLVED, ESCALATED, CLOSED
    priority VARCHAR(50) DEFAULT 'NORMAL', -- NORMAL, HIGH, BLACKSPOT
    category VARCHAR(50) NOT NULL, -- POTHOLE, LIGHTING, SIGNAGE, ROAD_QUALITY, OTHER
    location GEOMETRY(POINT, 4326) NOT NULL,
    cluster_radius_m INTEGER DEFAULT 50,
    photo_urls TEXT[],
    is_anonymous BOOLEAN DEFAULT FALSE,
    contributor_count INTEGER DEFAULT 1,
    citizen_id UUID REFERENCES users(id),
    assigned_to UUID REFERENCES officers(id),
    jurisdiction_id UUID REFERENCES jurisdictions(id),
    authority_type VARCHAR(50),
    sla_deadline TIMESTAMP,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX idx_master_tickets_location ON master_tickets USING gist(location);

-- 6. Create Ticket Contributions Table
CREATE TABLE ticket_contributions (
    id UUID PRIMARY KEY,
    master_ticket_id UUID REFERENCES master_tickets(id) ON DELETE CASCADE,
    citizen_id UUID REFERENCES users(id),
    description TEXT,
    photo_urls TEXT[],
    lat DOUBLE PRECISION NOT NULL,
    lng DOUBLE PRECISION NOT NULL,
    submitted_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- 7. Create Ticket Events Table
CREATE TABLE ticket_events (
    id UUID PRIMARY KEY,
    ticket_id UUID REFERENCES master_tickets(id) ON DELETE CASCADE,
    actor_id UUID,
    event_type VARCHAR(50) NOT NULL, -- CREATED, ASSIGNED, COMMENTED, ESCALATED, RESOLVED, CLOSED
    payload JSONB,
    timestamp TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- 8. Create Work Orders Table
CREATE TABLE work_orders (
    id UUID PRIMARY KEY,
    ticket_id UUID REFERENCES master_tickets(id),
    contractor_id UUID REFERENCES contractors(id),
    status VARCHAR(50) DEFAULT 'ASSIGNED', -- ASSIGNED, IN_PROGRESS, SUBMITTED, APPROVED, REJECTED
    description TEXT,
    proof_photo_urls TEXT[],
    estimated_cost DECIMAL(15, 2),
    actual_cost DECIMAL(15, 2),
    assigned_by UUID,
    approved_by UUID,
    assigned_at TIMESTAMP,
    submitted_at TIMESTAMP,
    approved_at TIMESTAMP
);

-- 9. Create Budget Schemes Table
CREATE TABLE budget_schemes (
    id UUID PRIMARY KEY,
    scheme_name VARCHAR(255) NOT NULL, -- PMGSY, BHARATMALA, SMART_CITIES
    jurisdiction_id UUID REFERENCES jurisdictions(id),
    authority_type VARCHAR(50) NOT NULL, -- MUNICIPAL, PWD, NHAI, BRO, PMGSY, FOREST
    sanctioned_amount DECIMAL(15, 2) NOT NULL,
    released_amount DECIMAL(15, 2) NOT NULL,
    utilized_amount DECIMAL(15, 2) DEFAULT 0.00,
    financial_year VARCHAR(20) NOT NULL, -- e.g. "2025-26"
    source_ref VARCHAR(255)
);

-- 10. Create Blackspots Table
CREATE TABLE blackspots (
    id UUID PRIMARY KEY,
    name VARCHAR(255),
    location GEOMETRY(POINT, 4326) NOT NULL,
    radius_m INTEGER DEFAULT 200,
    severity VARCHAR(50) DEFAULT 'HIGH' -- HIGH, CRITICAL
);

CREATE INDEX idx_blackspots_location ON blackspots USING gist(location);
