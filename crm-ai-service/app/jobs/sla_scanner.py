import httpx
from datetime import datetime, timedelta, timezone
from sqlalchemy import text
from app.dependencies import AsyncSessionLocal
from app.config import settings

async def scan_at_risk_tickets():
    async with AsyncSessionLocal() as db:
        # Query tickets nearing SLA (OPEN/ASSIGNED, deadline within 48h)
        query = text("""
            SELECT id, assigned_to, status, category, priority, sla_deadline 
            FROM master_tickets 
            WHERE status IN ('OPEN', 'ASSIGNED')
              AND sla_deadline < NOW() + INTERVAL '48 HOURS'
        """)
        
        res = await db.execute(query)
        tickets = res.all()
        
        if not tickets:
            return

        async with httpx.AsyncClient() as client:
            for row in tickets:
                ticket_id, assigned_to, status, category, priority, sla_deadline = row
                
                # Auto escalate
                try:
                    url = f"{settings.CORE_API_BASE_URL}/tickets/{ticket_id}/escalate?reason=AUTO_SLA_BREACH"
                    response = await client.post(url)
                    print(f"Auto-escalated ticket {ticket_id}: Status Code {response.status_code}")
                except Exception as e:
                    print(f"Failed to auto-escalate ticket {ticket_id}: {str(e)}")
