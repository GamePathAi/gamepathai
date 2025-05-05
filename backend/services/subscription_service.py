from fastapi import APIRouter

router = APIRouter(prefix="/api/subscription", tags=["Subscription"])

@router.get("/plans")
async def get_subscription_plans():
    return {
        "plans": [
            {
                "tier": "free",
                "price": 0,
                "features": ["Basic optimization"]
            },
            {
                "tier": "player",
                "price": 9.99,
                "features": ["Advanced optimization", "VPN access"]
            },
            {
                "tier": "alliance",
                "price": 19.99,
                "features": ["All features", "Priority support"]
            }
        ]
    }

@router.get("/status")
async def get_subscription_status():
    return {
        "active": True,
        "tier": "free",
        "expires_at": "2025-06-05T00:00:00Z"
    }
