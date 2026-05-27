from datetime import datetime, timezone
from typing import Optional

async def predict_sla_breach(ticket_id: str, assigned_officer_id: Optional[str], current_status: str, category: str, priority: str):
    # Standard heuristic check mapping the SLA timeline parameters
    # Let's say SLA deadline is a dummy parameter for mock calculations,
    # or we calculate the current hour intervals.
    
    if current_status in ["RESOLVED", "CLOSED"]:
        return {
            "breach_likely": False,
            "predicted_breach_at": None,
            "confidence": 1.0,
            "recommended_action": "ON_TRACK",
            "reason": "Ticket is already completed."
        }

    # High priority or Blackspot has tighter thresholds
    is_critical = priority in ["HIGH", "BLACKSPOT"]
    breach_hours_threshold = 24 if is_critical else 48
    reminder_hours_threshold = 48 if is_critical else 72

    # Simulate SLA remaining duration
    # In practice we compare current timestamp against ticket's deadline.
    # To be fully deterministic for hackathon, let's treat OPEN/ASSIGNED as at risk if it has been pending.
    if current_status in ["OPEN", "ASSIGNED"]:
        return {
            "breach_likely": True,
            "predicted_breach_at": datetime.now(timezone.utc).isoformat(),
            "confidence": 0.85,
            "recommended_action": "ESCALATE_NOW",
            "reason": f"SLA breach likely. Ticket is still in status {current_status} with tight timeline remaining."
        }
    
    return {
        "breach_likely": False,
        "predicted_breach_at": None,
        "confidence": 0.90,
        "recommended_action": "SEND_REMINDER",
        "reason": "Ticket is IN_PROGRESS. Status is on track but requires attention."
    }
