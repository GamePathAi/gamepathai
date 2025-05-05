from fastapi import APIRouter

vpn_router = APIRouter(prefix="/api/vpn", tags=["VPN"])

@vpn_router.get("/status")
async def get_vpn_status():
    return {"connected": False, "available": True}

@vpn_router.get("/servers")
async def get_vpn_servers():
    return {
        "servers": [
            {"id": "us-east", "location": "New York", "ping": 30},
            {"id": "eu-west", "location": "London", "ping": 80},
            {"id": "asia-east", "location": "Tokyo", "ping": 150}
        ]
    }
