
from fastapi import FastAPI, Request, Depends, HTTPException, status
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import JSONResponse
import uvicorn
import os
from dotenv import load_dotenv

# Carregar variáveis de ambiente
load_dotenv()

# Configuração do ambiente
ENVIRONMENT = os.getenv("ENVIRONMENT", "development")
JWT_SECRET = os.getenv("JWT_SECRET", "dev-secret-key-for-gamepathai")
API_KEYS = os.getenv("API_KEYS", "dev-api-key").split(",")

# Iniciar aplicação FastAPI
app = FastAPI(
    title="GamePathAI API",
    description="API de backend para o GamePathAI",
    version="1.0.0",
)

# Configuração de CORS - crucial para evitar problemas de redirecionamento
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],  # Em produção, defina origens específicas
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
    expose_headers=["X-Original-Location", "X-Redirect-Blocked", "X-Request-Path"],
)

# Endpoint de saúde básico
@app.get("/health")
async def health():
    return {"status": "healthy", "version": "1.0.0", "environment": ENVIRONMENT}

# Endpoint de API para saúde
@app.get("/api/health")
async def api_health():
    return {"status": "healthy", "version": "1.0.0", "environment": ENVIRONMENT}

# Endpoint de Games
@app.get("/api/games")
@app.get("/games")
async def games():
    # Dados mockados para testes
    return [
        {"id": "valorant", "name": "Valorant", "isOptimized": False},
        {"id": "csgo", "name": "Counter-Strike 2", "isOptimized": True},
        {"id": "fortnite", "name": "Fortnite", "isOptimized": False}
    ]

# Endpoint ML de detecção de jogos
@app.get("/ml/game-detection")
async def ml_game_detection():
    # Dados mockados para testes
    return [
        {"id": "valorant", "name": "Valorant", "isDetected": True},
        {"id": "csgo", "name": "Counter-Strike 2", "isDetected": True}
    ]

# Endpoint para métricas de ping
@app.get("/api/metrics/ping")
async def metrics_ping():
    return {"value": 35, "unit": "ms", "timestamp": "2025-05-05T12:00:00Z"}

# Endpoint para métricas de jitter
@app.get("/api/metrics/jitter")
async def metrics_jitter():
    return {"value": 5, "unit": "ms", "timestamp": "2025-05-05T12:00:00Z"}

# Endpoint para métricas do sistema
@app.get("/api/metrics/system")
async def metrics_system():
    return {"cpu": 45, "memory": 60, "gpu": 50, "timestamp": "2025-05-05T12:00:00Z"}

# Middleware para adicionar cabeçalhos anti-redirecionamento a todas as respostas
@app.middleware("http")
async def anti_redirect_middleware(request: Request, call_next):
    response = await call_next(request)
    response.headers["X-No-Redirect"] = "1"
    response.headers["Cache-Control"] = "no-cache, no-store, must-revalidate"
    response.headers["Pragma"] = "no-cache"
    response.headers["Expires"] = "0"
    response.headers["X-Content-Type-Options"] = "nosniff"
    response.headers["X-Frame-Options"] = "DENY"
    return response

# Manipulador de exceções global
@app.exception_handler(Exception)
async def global_exception_handler(request: Request, exc: Exception):
    return JSONResponse(
        status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
        content={"message": f"Erro interno: {str(exc)}"}
    )

# Rota principal para servir o frontend
@app.get("/")
@app.get("/{rest_of_path:path}")
async def catch_all(rest_of_path: str = ""):
    # Esta rota é um fallback para rotas não encontradas
    # Em produção, isto seria manipulado pelo servidor web (Nginx)
    return {"message": "Esta rota deve ser servida pelo frontend"}

if __name__ == "__main__":
    # Iniciar o servidor com uvicorn
    port = int(os.getenv("PORT", "8000"))
    uvicorn.run("main:app", host="0.0.0.0", port=port, reload=True)
