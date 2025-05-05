from fastapi import APIRouter

optimization_router = APIRouter(prefix="/api/opt", tags=["Optimization"])

@optimization_router.get("/status")
async def get_optimization_status():
    return {"status": "active", "optimizations_available": True}
