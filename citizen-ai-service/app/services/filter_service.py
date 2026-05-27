import uuid
from sqlalchemy import text
from sqlalchemy.ext.asyncio import AsyncSession

async def filter_complaint(lat: float, lng: float, category: str, description: str, citizen_id: str, db: AsyncSession):
    score = 1.0
    flags = []

    # 1. Description Quality Check
    if not description or len(description.strip()) < 5:
        score -= 0.2
        flags.append("LOW_QUALITY_CONTENT")

    # 2. Heuristic duplicate check: Open tickets within 50m of same category in DB
    point_wkt = f"POINT({lng} {lat})"
    dup_query = text("""
        SELECT id 
        FROM master_tickets 
        WHERE status = 'OPEN' 
          AND category = :category 
          AND ST_DWithin(location, ST_SetSRID(ST_GeomFromText(:wkt), 4326)::geography, 50)
        LIMIT 1
    """)
    dup_res = await db.execute(dup_query, {"wkt": point_wkt, "category": category})
    dup_row = dup_res.first()
    
    if dup_row:
        return {
            "verdict": "HOLD",
            "confidence": 0.95,
            "flags": ["DUPLICATE_NEARBY"],
            "duplicate_ticket_id": str(dup_row[0])
        }

    # 3. Rate limiting check (e.g. 10 complaints in 24h for a single citizen)
    if citizen_id:
        count_query = text("""
            SELECT COUNT(*) 
            FROM master_tickets 
            WHERE citizen_id = :citizen_id 
              AND created_at > NOW() - INTERVAL '24 HOURS'
        """)
        try:
            citizen_uuid = uuid.UUID(citizen_id)
            count_res = await db.execute(count_query, {"citizen_id": citizen_uuid})
            count = count_res.scalar() or 0
            if count >= 10:
                score -= 0.5
                flags.append("RATE_LIMIT_EXCEEDED")
        except ValueError:
            pass

    # Verdict assignment
    if score >= 0.6:
        verdict = "PASS"
    elif score >= 0.3:
        verdict = "HOLD"
    else:
        verdict = "REJECT"

    return {
        "verdict": verdict,
        "confidence": round(score, 2),
        "flags": flags,
        "duplicate_ticket_id": None
    }
