from fastapi import APIRouter

metrics_router = APIRouter(prefix="/api/metrics", tags=["Metrics"])

@metrics_router.get("/ping")
async def get_ping_metrics():
    return {"average_ping": 30, "jitter": 5, "timestamp": "2025-05-05T12:00:00Z"}

@metrics_router.get("/system")
async def get_system_metrics():
    return {
        "cpu_usage": 45,
        "gpu_usage": 60,
        "ram_usage": 70,
        "temperature": 65,
        "timestamp": "2025-05-05T12:00:00Z"
    }
