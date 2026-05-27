-- 1. Seed Jurisdictions
-- Root state level (Tamil Nadu PWD or Corporation)
INSERT INTO jurisdictions (id, name, level, authority_type, geometry, parent_id)
VALUES (
    'b9b9a674-ec0a-4fb4-bbab-fb605eb8716b',
    'Chennai Division - Corporation',
    'DIVISION',
    'MUNICIPAL',
    ST_Multi(ST_GeomFromText('POLYGON((80.20 13.00, 80.35 13.00, 80.35 13.15, 80.20 13.15, 80.20 13.00))', 4326)),
    NULL
);

-- Child Ward Level
INSERT INTO jurisdictions (id, name, level, authority_type, geometry, parent_id)
VALUES (
    '447192dc-e3a5-4e78-bc4a-9eb4c5c76ab1',
    'Ward 42 - Chennai Central',
    'WARD',
    'MUNICIPAL',
    ST_Multi(ST_GeomFromText('POLYGON((80.25 13.05, 80.30 13.05, 80.30 13.10, 80.25 13.10, 80.25 13.05))', 4326)),
    'b9b9a674-ec0a-4fb4-bbab-fb605eb8716b'
);

-- 2. Seed Officers (IDs match our realm-export.json users)
-- officer_je: Junior Engineer assigned to Ward 42
INSERT INTO officers (id, name, email, phone, role, jurisdiction_id, authority_type, is_active)
VALUES (
    '447192dc-e3a5-4e78-bc4a-9eb4c5c76ab1',
    'Junior Engineer',
    'je@roadwatch.gov',
    '+919876543210',
    'JE',
    '447192dc-e3a5-4e78-bc4a-9eb4c5c76ab1',
    'MUNICIPAL',
    TRUE
);

-- officer_ee: Executive Engineer assigned to Division
INSERT INTO officers (id, name, email, phone, role, jurisdiction_id, authority_type, is_active)
VALUES (
    'b9b9a674-ec0a-4fb4-bbab-fb605eb8716b',
    'Executive Engineer',
    'ee@roadwatch.gov',
    '+919876543211',
    'EE',
    'b9b9a674-ec0a-4fb4-bbab-fb605eb8716b',
    'MUNICIPAL',
    TRUE
);

-- 3. Seed Contractors
INSERT INTO contractors (id, firm_name, contact_person, phone, is_active)
VALUES (
    'a78370dd-3e28-4ad0-b8ea-6a2c91834241',
    'Apex Infrastructure Ltd.',
    'Rahul Contractor',
    '+919876543212',
    TRUE
);

-- 4. Seed Budget Schemes
-- Scheme for Ward 42 (MUNICIPAL, Smart Cities Mission)
INSERT INTO budget_schemes (id, scheme_name, jurisdiction_id, authority_type, sanctioned_amount, released_amount, utilized_amount, financial_year, source_ref)
VALUES (
    '15eb07e4-23db-4cb8-8c10-2f9b8c734b41',
    'SMART_CITIES',
    '447192dc-e3a5-4e78-bc4a-9eb4c5c76ab1',
    'MUNICIPAL',
    5000000.00,
    3500000.00,
    1200000.00,
    '2025-26',
    'PFMS-SC-90921'
);

-- Scheme for Division (MUNICIPAL, PMGSY or local scheme)
INSERT INTO budget_schemes (id, scheme_name, jurisdiction_id, authority_type, sanctioned_amount, released_amount, utilized_amount, financial_year, source_ref)
VALUES (
    '33a0fc35-f09c-4977-873b-53cbb62e92c2',
    'PMGSY',
    'b9b9a674-ec0a-4fb4-bbab-fb605eb8716b',
    'MUNICIPAL',
    12000000.00,
    8000000.00,
    3000000.00,
    '2025-26',
    'PFMS-PM-80122'
);

-- 5. Seed Blackspots
INSERT INTO blackspots (id, name, location, radius_m, severity)
VALUES (
    'c2be4987-a2eb-4de4-b9b2-321fa4c90d56',
    'Marina Beach Junction Blackspot',
    ST_GeomFromText('POINT(80.28 13.06)', 4326),
    200,
    'CRITICAL'
);
