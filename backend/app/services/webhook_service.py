import httpx
import hmac
import hashlib
import json
from typing import List, Optional
from app.models.webhook import Webhook

WEBHOOK_EVENTS = [
    "campaign.sent",
    "campaign.completed",
    "campaign.failed",
    "email.sent",
    "email.failed",
    "email.opened",
    "email.clicked",
    "recipient.unsubscribed",
]

async def fire_webhook(webhook: Webhook, event: str, payload: dict):
    """Send a webhook POST request with optional HMAC signature."""
    body = json.dumps({"event": event, "data": payload})
    headers = {"Content-Type": "application/json", "X-NovaMailer-Event": event}

    if webhook.secret:
        sig = hmac.new(webhook.secret.encode(), body.encode(), hashlib.sha256).hexdigest()
        headers["X-NovaMailer-Signature"] = f"sha256={sig}"

    try:
        async with httpx.AsyncClient(timeout=10) as client:
            await client.post(webhook.url, content=body, headers=headers)
    except Exception as e:
        print(f"Webhook delivery failed for {webhook.url}: {e}")


async def fire_event(db, user_id: int, event: str, payload: dict):
    """Find all active webhooks for user that subscribe to this event and fire them."""
    from sqlalchemy import select
    from app.models.webhook import Webhook

    result = await db.execute(
        select(Webhook).filter(Webhook.user_id == user_id, Webhook.active == True)
    )
    webhooks: List[Webhook] = result.scalars().all()

    for wh in webhooks:
        if event in (wh.events or []):
            await fire_webhook(wh, event, payload)
