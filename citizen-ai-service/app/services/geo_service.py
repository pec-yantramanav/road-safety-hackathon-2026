from sqlalchemy import text
from sqlalchemy.ext.asyncio import AsyncSession
from app.db.orm import Jurisdiction, Blackspot

async def resolve_jurisdiction(lat: float, lng: float, db: AsyncSession):
    # Find most specific jurisdiction containing the point
    # Ordered by level: WARD has priority over DIVISION
    point_wkt = f"POINT({lng} {lat})"
    
    query = text("""
        SELECT id, name, level, authority_type 
        FROM jurisdictions 
        WHERE ST_Contains(geometry, ST_SetSRID(ST_GeomFromText(:wkt), 4326))
        ORDER BY 
            CASE level
                WHEN 'WARD' THEN 1
                WHEN 'DIVISION' THEN 2
                WHEN 'CIRCLE' THEN 3
                WHEN 'DISTRICT' THEN 4
                WHEN 'STATE' THEN 5
                ELSE 6
            END ASC
        LIMIT 1
    """)
    
    res = await db.execute(query, {"wkt": point_wkt})
    row = res.first()
    
    if not row:
        # Default fallback to central Central Ward Central division
        return {
            "authority_type": "MUNICIPAL",
            "jurisdiction_id": "447192dc-e3a5-4e78-bc4a-9eb4c5c76ab1",
            "jurisdiction_name": "Ward 42 - Chennai Central",
            "is_blackspot": False
        }
        
    jurisdiction_id, name, level, authority_type = row
    
    # Check blackspots
    blackspot_query = text("""
        SELECT id 
        FROM blackspots 
        WHERE ST_DWithin(location, ST_SetSRID(ST_GeomFromText(:wkt), 4326)::geography, radius_m)
        LIMIT 1
    """)
    blackspot_res = await db.execute(blackspot_query, {"wkt": point_wkt})
    is_blackspot = blackspot_res.first() is not None
    
    return {
        "authority_type": authority_type,
        "jurisdiction_id": str(jurisdiction_id),
        "jurisdiction_name": name,
        "is_blackspot": is_blackspot
    }
