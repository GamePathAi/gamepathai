import os
import time
import logging
from datetime import datetime, timedelta
from typing import Dict, List, Optional, Union, Any
import threading
import json
import secrets
import uuid
import boto3
from botocore.exceptions import ClientError
from enum import Enum
import socket
import pickle

import uvicorn
from fastapi import FastAPI, HTTPException, Depends, Header, Request, status, BackgroundTasks
from fastapi.responses import JSONResponse, RedirectResponse
from fastapi.middleware.cors import CORSMiddleware
from fastapi.openapi.docs import get_swagger_ui_html
from fastapi.security import OAuth2PasswordBearer, OAuth2PasswordRequestForm
from pydantic import BaseModel, Field, validator, EmailStr
import jwt
import random

# Importar os routers
from services.metrics_service import metrics_router
from services.optimization_service import optimization_router
from services.subscription_service import router as subscription_router
from services.vpn.router import vpn_router
from utils.game_detection import GameDetectionService
from utils.optimization_utils import SystemOptimizer, NetworkOptimizer

# Setup versão e ambiente
API_VERSION = "1.0.0"
ENVIRONMENT = os.environ.get("ENVIRONMENT", "development")
INSTANCE_ID = socket.gethostname()

# Setup logging
logging.basicConfig(
    level=logging.INFO if ENVIRONMENT != "production" else logging.WARNING,
    format='%(asctime)s - %(name)s - %(levelname)s - %(message)s',
    handlers=[
        logging.FileHandler("logs/gamepathai.log"),
        logging.StreamHandler()
    ]
)
logger = logging.getLogger("gamepathai")

# Se estiver em produção, configurar CloudWatch para logs
if ENVIRONMENT == "production":
    try:
        import watchtower
        cloudwatch_handler = watchtower.CloudWatchLogHandler(
            log_group="gamepathai-api",
            stream_name=f"{ENVIRONMENT}-{INSTANCE_ID}"
        )
        logger.addHandler(cloudwatch_handler)
        logger.info(f"CloudWatch logging configured for instance {INSTANCE_ID}")
    except ImportError:
        logger.warning("watchtower not installed, CloudWatch logging disabled")
    except Exception as e:
        logger.warning(f"Failed to configure CloudWatch logging: {str(e)}")

# Create directories if they don't exist
os.makedirs("logs", exist_ok=True)
os.makedirs("models/pickles", exist_ok=True)

# Carregar secrets do AWS Secrets Manager em produção
def get_secrets():
    """
    Carrega secrets do AWS Secrets Manager em produção.
    Em ambiente de desenvolvimento, usa variáveis de ambiente.
    """
    if ENVIRONMENT != "production":
        return {
            "JWT_SECRET": os.environ.get("JWT_SECRET", "dev-secret-key"),
            "API_KEYS": os.environ.get("API_KEYS", "dev-api-key"),
            "REDIS_PASSWORD": os.environ.get("REDIS_PASSWORD", ""),
        }
    
    try:
        secret_name = os.environ.get("SECRET_NAME", "gamepathai/api/secrets")
        region_name = os.environ.get("AWS_REGION", "us-east-1")
        
        session = boto3.session.Session()
        client = session.client(
            service_name='secretsmanager',
            region_name=region_name
        )
        
        get_secret_value_response = client.get_secret_value(
            SecretId=secret_name
        )
        secret = get_secret_value_response['SecretString']
        return json.loads(secret)
    except Exception as e:
        logger.error(f"Error getting secrets from AWS Secrets Manager: {str(e)}")
        # Fallback para variáveis de ambiente
        return {
            "JWT_SECRET": os.environ.get("JWT_SECRET", "fallback-secret-key"),
            "API_KEYS": os.environ.get("API_KEYS", "fallback-api-key"),
            "REDIS_PASSWORD": os.environ.get("REDIS_PASSWORD", ""),
        }

# Carregar secrets
secrets = get_secrets()

# Configurações de autenticação
SECRET_KEY = secrets.get("JWT_SECRET", "fallback-secret-key")
ALGORITHM = "HS256"
ACCESS_TOKEN_EXPIRE_MINUTES = 30
REFRESH_TOKEN_EXPIRE_DAYS = 7

# API Key authentication
API_KEYS = secrets.get("API_KEYS", "fallback-api-key").split(",")

# Configuração de cache
MODEL_CACHE_TTL = int(os.environ.get("MODEL_CACHE_TTL", "3600"))  # 1 hora default

# Configuração de Redis para cache distribuído
try:
    import redis
    redis_host = os.environ.get("REDIS_HOST")
    
    if redis_host:
        redis_client = redis.Redis(
            host=redis_host,
            port=int(os.environ.get("REDIS_PORT", "6379")),
            password=secrets.get("REDIS_PASSWORD", ""),
            db=0,
            socket_timeout=5,
            socket_connect_timeout=5
        )
        # Testar conexão
        redis_client.ping()
        logger.info(f"Redis connected at {redis_host}")
        REDIS_AVAILABLE = True
    else:
        logger.info("Redis host not configured, using in-memory cache")
        REDIS_AVAILABLE = False
except (ImportError, redis.exceptions.ConnectionError) as e:
    logger.warning(f"Redis not available, using in-memory cache: {str(e)}")
    REDIS_AVAILABLE = False
    # Fallback para cache em memória
    model_cache = {}
    model_cache_lock = threading.Lock()

# Create FastAPI app
app = FastAPI(
    title="GamePath AI API",
    description="API for GamePath AI optimization services",
    version=API_VERSION,
    docs_url="/api/docs" if ENVIRONMENT != "production" else None,
    redoc_url="/api/redoc" if ENVIRONMENT != "production" else None,
)

# Add CORS middleware
app.add_middleware(
    CORSMiddleware,
    allow_origins=[
        os.environ.get("FRONTEND_URL", "http://localhost:3000"),
        os.environ.get("API_URL", "http://localhost:8000")
    ] if ENVIRONMENT == "production" else ["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# OAuth2 scheme para tokens JWT
oauth2_scheme = OAuth2PasswordBearer(tokenUrl="api/auth/login")

# DynamoDB client para armazenamento persistente
class DynamoDBClient:
    def __init__(self):
        region = os.environ.get('AWS_REGION', 'us-east-1')
        
        # Configuração diferente para local vs. AWS
        if ENVIRONMENT == "development" and os.environ.get("DYNAMODB_LOCAL", "false").lower() == "true":
            # Endpoint local do DynamoDB para desenvolvimento
            endpoint_url = os.environ.get("DYNAMODB_ENDPOINT", "http://localhost:8000")
            self.dynamodb = boto3.resource('dynamodb', endpoint_url=endpoint_url, region_name=region)
            logger.info(f"Using local DynamoDB at {endpoint_url}")
        else:
            # DynamoDB na AWS
            self.dynamodb = boto3.resource('dynamodb', region_name=region)
            logger.info(f"Using AWS DynamoDB in region {region}")

        # Table names from environment variables with fallbacks
        env_prefix = "gamepathai-" + ENVIRONMENT
        self.users_table_name = os.environ.get('USERS_TABLE', f"{env_prefix}-users")
        self.games_table_name = os.environ.get('GAMES_TABLE', f"{env_prefix}-games")
        self.user_games_table_name = os.environ.get('USER_GAMES_TABLE', f"{env_prefix}-user-games")
        self.metrics_table_name = os.environ.get('METRICS_TABLE', f"{env_prefix}-metrics")
        
        # Get table references
        self.users_table = self.dynamodb.Table(self.users_table_name)
        self.games_table = self.dynamodb.Table(self.games_table_name)
        self.user_games_table = self.dynamodb.Table(self.user_games_table_name)
        self.metrics_table = self.dynamodb.Table(self.metrics_table_name) if ENVIRONMENT == "production" else None

        logger.info(f"DynamoDB tables: Users={self.users_table_name}, Games={self.games_table_name}")

    # User operations
    def get_user_by_id(self, user_id):
        try:
            response = self.users_table.get_item(Key={'id': user_id})
            return response.get('Item')
        except ClientError as e:
            logger.error(f"Error getting user {user_id}: {e}")
            return None

    def get_user_by_email(self, email):
        try:
            response = self.users_table.query(
                IndexName='EmailIndex',
                KeyConditionExpression='email = :email',
                ExpressionAttributeValues={':email': email}
            )
            items = response.get('Items', [])
            return items[0] if items else None
        except ClientError as e:
            logger.error(f"Error querying user by email {email}: {e}")
            return None

    def create_user(self, user_data):
        try:
            self.users_table.put_item(Item=user_data)
            return True
        except ClientError as e:
            logger.error(f"Error creating user: {e}")
            return False

    def update_user(self, user_id, update_data):
        update_expression = "set "
        expression_attribute_values = {}

        for key, value in update_data.items():
            if key != 'id':  # Skip the primary key
                update_expression += f"{key} = :{key}, "
                expression_attribute_values[f":{key}"] = value

        update_expression = update_expression.rstrip(", ")

        try:
            self.users_table.update_item(
                Key={'id': user_id},
                UpdateExpression=update_expression,
                ExpressionAttributeValues=expression_attribute_values
            )
            return True
        except ClientError as e:
            logger.error(f"Error updating user {user_id}: {e}")
            return False

    # Game operations
    def get_game(self, game_id):
        try:
            response = self.games_table.get_item(Key={'id': game_id})
            return response.get('Item')
        except ClientError as e:
            logger.error(f"Error getting game {game_id}: {e}")
            return None

    def list_games(self, limit=100):
        try:
            response = self.games_table.scan(Limit=limit)
            return response.get('Items', [])
        except ClientError as e:
            logger.error(f"Error listing games: {e}")
            return []

    def create_game(self, game_data):
        try:
            self.games_table.put_item(Item=game_data)
            return True
        except ClientError as e:
            logger.error(f"Error creating game: {e}")
            return False

    def update_game(self, game_id, update_data):
        update_expression = "set "
        expression_attribute_values = {}

        for key, value in update_data.items():
            if key != 'id':  # Skip the primary key
                update_expression += f"{key} = :{key}, "
                expression_attribute_values[f":{key}"] = value

        update_expression = update_expression.rstrip(", ")

        try:
            self.games_table.update_item(
                Key={'id': game_id},
                UpdateExpression=update_expression,
                ExpressionAttributeValues=expression_attribute_values
            )
            return True
        except ClientError as e:
            logger.error(f"Error updating game {game_id}: {e}")
            return False

    # User-Game relationships
    def get_user_games(self, user_id):
        try:
            response = self.user_games_table.query(
                KeyConditionExpression='user_id = :user_id',
                ExpressionAttributeValues={':user_id': user_id}
            )
            return response.get('Items', [])
        except ClientError as e:
            logger.error(f"Error getting games for user {user_id}: {e}")
            return []

    def add_user_game(self, user_id, game_id, relationship_data):
        try:
            item = {
                'user_id': user_id,
                'game_id': game_id,
                'timestamp': datetime.now().isoformat(),
                **relationship_data
            }
            self.user_games_table.put_item(Item=item)
            return True
        except ClientError as e:
            logger.error(f"Error adding game {game_id} to user {user_id}: {e}")
            return False

    # Metrics operations
    def store_metrics(self, metrics_data):
        """
        Armazena métricas no DynamoDB em produção ou localmente em desenvolvimento
        """
        if ENVIRONMENT != "production" or not self.metrics_table:
            # Em desenvolvimento, apenas logar as métricas
            logger.debug(f"Metrics data (not stored in dev): {json.dumps(metrics_data)}")
            return True
            
        try:
            # Em produção, armazenar no DynamoDB
            metrics_id = f"metric-{uuid.uuid4()}"
            item = {
                'id': metrics_id,
                'timestamp': datetime.now().isoformat(),
                **metrics_data
            }
            self.metrics_table.put_item(Item=item)
            return True
        except ClientError as e:
            logger.error(f"Error storing metrics: {e}")
            return False

    def get_metrics_by_user(self, user_id, start_time, end_time, limit=100, metric_type=None):
        """
        Get metrics collected for a specific user within a time range.
        """
        if ENVIRONMENT != "production" or not self.metrics_table:
            # Em desenvolvimento, retornar dados simulados
            return self._get_simulated_metrics(user_id, metric_type)
            
        try:
            filter_expression = "user_id = :user_id AND #ts BETWEEN :start AND :end"
            expression_attribute_values = {
                ':user_id': user_id,
                ':start': start_time,
                ':end': end_time
            }
            expression_attribute_names = {
                '#ts': 'timestamp'
            }
            
            if metric_type:
                filter_expression += " AND metric_type = :type"
                expression_attribute_values[':type'] = metric_type
                
            response = self.metrics_table.scan(
                FilterExpression=filter_expression,
                ExpressionAttributeValues=expression_attribute_values,
                ExpressionAttributeNames=expression_attribute_names,
                Limit=limit
            )
            
            return response.get('Items', [])
        except Exception as e:
            logger.error(f"Error getting user metrics: {e}")
            return []
            
    def _get_simulated_metrics(self, user_id, metric_type=None):
        """
        Gera métricas simuladas para ambiente de desenvolvimento
        """
        # Simular 10 entradas de métricas
        metrics = []
        for i in range(10):
            if metric_type == "system" or not metric_type:
                metrics.append({
                    'user_id': user_id,
                    'metric_type': 'system',
                    'game_id': 'valorant' if i % 2 == 0 else 'csgo',
                    'timestamp': (datetime.now() - timedelta(hours=i)).isoformat(),
                    'cpu_usage': random.uniform(50, 95),
                    'gpu_usage': random.uniform(60, 99),
                    'ram_usage': random.uniform(60, 90),
                    'fps': random.uniform(80, 240),
                    'temperature': random.uniform(60, 85)
                })
            
            if metric_type == "network" or not metric_type:
                metrics.append({
                    'user_id': user_id,
                    'metric_type': 'network',
                    'game_id': 'valorant' if i % 2 == 0 else 'csgo',
                    'timestamp': (datetime.now() - timedelta(hours=i)).isoformat(),
                    'ping': random.uniform(20, 80),
                    'jitter': random.uniform(2, 15),
                    'packet_loss': random.uniform(0, 2),
                    'download_speed': random.uniform(50, 150),
                    'upload_speed': random.uniform(10, 50)
                })
                
        return metrics

# Inicializar o cliente DynamoDB
db_client = DynamoDBClient()

# Função para inicializar dados de jogos
def initialize_game_data():
    """
    Initialize game data from detection or samples.
    In production, most games will be detected by client applications.
    """
    # Verify if there are games already in the database
    games = db_client.list_games()
    if games:
        logger.info(f"Found {len(games)} games in DynamoDB. Skipping initialization.")
        return

    # In development mode, try to detect games on the server machine
    detected_games = []
    try:
        if ENVIRONMENT == "development":
            detector = GameDetectionService()
            detected_games = detector.detect_all_games()
            logger.info(f"Detected {len(detected_games)} games on server")

            # Add detected games to the database
            for game in detected_games:
                db_client.create_game(game)

            if detected_games:
                logger.info(f"Initialized {len(detected_games)} detected games in DynamoDB")
                return
    except Exception as e:
        logger.warning(f"Game detection failed: {str(e)}")

    # Fallback to sample games if no games were detected
    sample_games = {
        "valorant": {
            "id": "valorant",
            "name": "Valorant",
            "slug": "valorant",
            "genre": "FPS",
            "publisher": "Riot Games",
            "releaseYear": 2020,
            "platforms": ["PC"],
            "isDetected": True,
            "isOptimized": False,
            "source": "sample"
        },
        "csgo": {
            "id": "csgo",
            "name": "Counter-Strike 2",
            "slug": "cs2",
            "genre": "FPS",
            "publisher": "Valve",
            "releaseYear": 2023,
            "platforms": ["PC"],
            "isDetected": True,
            "isOptimized": True,
            "lastOptimized": (datetime.now() - timedelta(days=2)).isoformat(),
            "optimizationType": "both",
            "performanceMetrics": {
                "latencyImprovement": 15,
                "fpsImprovement": 25,
                "packetLossReduction": 80,
                "jitterReduction": 60
            },
            "source": "sample"
        },
        "fortnite": {
            "id": "fortnite",
            "name": "Fortnite",
            "slug": "fortnite",
            "genre": "Battle Royale",
            "publisher": "Epic Games",
            "releaseYear": 2017,
            "platforms": ["PC", "PlayStation", "Xbox", "Switch"],
            "isDetected": False,
            "isOptimized": False,
            "source": "sample"
        }
    }

    # Add sample games to the database
    for game in sample_games.values():
        db_client.create_game(game)

    logger.info(f"Initialized {len(sample_games)} sample games in DynamoDB")

# Função para obter modelo de ML - com suporte a Redis ou cache em memória
def get_model(model_name: str):
    """Load model from cache (Redis or memory) or from disk"""
    if REDIS_AVAILABLE:
        # Usar Redis para cache distribuído
        cache_key = f"model:{model_name}"
        try:
            model_data = redis_client.get(cache_key)
            if model_data:
                logger.info(f"Loading {model_name} model from Redis cache")
                return pickle.loads(model_data)
        except Exception as e:
            logger.error(f"Error loading model from Redis: {str(e)}")
    else:
        # Usar cache em memória quando Redis não está disponível
        try:
            with model_cache_lock:
                if model_name in model_cache:
                    # Verificar expiração
                    cached_time, model = model_cache[model_name]
                    if time.time() - cached_time < MODEL_CACHE_TTL:
                        logger.info(f"Loading {model_name} model from memory cache")
                        return model
                    else:
                        # Expirado
                        del model_cache[model_name]
        except Exception as e:
            logger.error(f"Error checking memory cache: {str(e)}")

    # Se não encontrado no cache ou expirado, carregar do disco
    try:
        logger.info(f"Loading {model_name} model from disk")
        model_path = f"models/pickles/{model_name}.pkl"
        
        if os.path.exists(model_path):
            with open(model_path, 'rb') as f:
                model = pickle.load(f)
                
            # Salvar no cache
            if REDIS_AVAILABLE:
                try:
                    redis_client.setex(
                        f"model:{model_name}", 
                        MODEL_CACHE_TTL,
                        pickle.dumps(model)
                    )
                except Exception as e:
                    logger.error(f"Error saving model to Redis: {str(e)}")
            else:
                try:
                    with model_cache_lock:
                        model_cache[model_name] = (time.time(), model)
                except Exception as e:
                    logger.error(f"Error saving model to memory cache: {str(e)}")
                    
            return model
        else:
            logger.warning(f"Model file {model_path} not found")
            return None
    except Exception as e:
        logger.error(f"Error loading model {model_name} from disk: {str(e)}")
        return None

# Dependência para autenticação por API Key
def get_api_key(x_api_key: str = Header(..., description="API Key for authentication")):
    if x_api_key not in API_KEYS:
        logger.warning(f"Invalid API key attempt: {x_api_key[:5]}...")
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Invalid API Key",
        )
    return x_api_key

# Dependência para autenticação de cliente
def get_client_auth(x_client_id: str = Header(...), x_client_secret: str = Header(...)):
    """
    Validates client authentication credentials.
    """
    # Em um sistema real, validaríamos contra uma tabela de clientes
    if not x_client_id or not x_client_secret:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Invalid client credentials",
        )

    # Simulação de cliente válido para desenvolvimento
    client = {
        "id": x_client_id,
        "name": "GamePath AI Desktop Client",
        "type": "desktop"
    }

    return client

# Funções auxiliares para autenticação
def get_password_hash(password: str) -> str:
    # Em produção, use algo como bcrypt ou Argon2
    # Simulação simples para desenvolvimento:
    import hashlib
    return hashlib.sha256(password.encode()).hexdigest()

def verify_password(plain_password: str, hashed_password: str) -> bool:
    # Simulação simples para desenvolvimento:
    return get_password_hash(plain_password) == hashed_password

def create_access_token(data: dict, expires_delta: Optional[timedelta] = None):
    to_encode = data.copy()
    if expires_delta:
        expire = datetime.utcnow() + expires_delta
    else:
        expire = datetime.utcnow() + timedelta(minutes=ACCESS_TOKEN_EXPIRE_MINUTES)
    to_encode.update({"exp": expire})
    encoded_jwt = jwt.encode(to_encode, SECRET_KEY, algorithm=ALGORITHM)
    return encoded_jwt

def create_refresh_token(user_id: str) -> str:
    expires = datetime.utcnow() + timedelta(days=REFRESH_TOKEN_EXPIRE_DAYS)
    token = secrets.token_urlsafe(64)
    # Em produção, armazene em banco de dados com expiração
    return token

async def get_current_user(token: str = Depends(oauth2_scheme)):
    credentials_exception = HTTPException(
        status_code=status.HTTP_401_UNAUTHORIZED,
        detail="Could not validate credentials",
        headers={"WWW-Authenticate": "Bearer"},
    )
    try:
        payload = jwt.decode(token, SECRET_KEY, algorithms=[ALGORITHM])
        user_id: str = payload.get("sub")
        if user_id is None:
            raise credentials_exception
    except jwt.PyJWTError:
        raise credentials_exception

    # Buscar usuário no DynamoDB
    user = db_client.get_user_by_id(user_id)
    if not user:
        raise credentials_exception

    return user

# Middleware para adicionar ID da instância
@app.middleware("http")
async def add_instance_id(request: Request, call_next):
    """
    Adiciona headers relacionados à instância para debug em ambiente de load balancing
    """
    response = await call_next(request)
    response.headers["X-Instance-ID"] = INSTANCE_ID
    response.headers["X-API-Version"] = API_VERSION
    return response

# Request/Response logging middleware
@app.middleware("http")
async def log_requests(request: Request, call_next):
    request_id = f"{INSTANCE_ID}-{datetime.now().strftime('%Y%m%d%H%M%S%f')}"
    request.state.request_id = request_id

    # Log request details
    client_ip = request.client.host if request.client else "unknown"
    logger.info(f"Request {request_id}: {request.method} {request.url.path} from {client_ip}")

    # Process request and get response
    start_time = time.time()
    try:
        response = await call_next(request)
        process_time = time.time() - start_time

        # Log response details
        logger.info(f"Response {request_id}: Status {response.status_code}, Time {process_time:.3f}s")

        return response
    except Exception as e:
        process_time = time.time() - start_time
        logger.error(f"Error {request_id}: {str(e)}, Time {process_time:.3f}s")
        return JSONResponse(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            content={"detail": "Internal server error"},
        )

# Health check endpoint for AWS ELB
@app.get("/health", tags=["Health"])
async def health_check():
    """
    Health check endpoint for AWS load balancer.
    Checks database connectivity and returns status.
    """
    try:
        # Verificar conexão com o DynamoDB
        start_time = time.time()
        db_client.list_games(limit=1)
        db_response_time = time.time() - start_time
        
        # Verificar conexão com o Redis se disponível
        cache_status = "disabled"
        if REDIS_AVAILABLE:
            try:
                start_time = time.time()
                redis_client.ping()
                cache_response_time = time.time() - start_time
                cache_status = "connected"
            except Exception as e:
                logger.error(f"Redis health check failed: {str(e)}")
                cache_status = "error"
        
        return {
            "status": "healthy",
            "instance_id": INSTANCE_ID,
            "environment": ENVIRONMENT,
            "database": "connected",
            "database_response_time_ms": round(db_response_time * 1000, 2),
            "cache": cache_status,
            "api_version": API_VERSION,
            "timestamp": datetime.now().isoformat()
        }
    except Exception as e:
        logger.error(f"Health check failed: {str(e)}")
        # Para load balancers, é importante retornar 500 quando o serviço não está saudável
        return JSONResponse(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            content={
                "status": "unhealthy",
                "instance_id": INSTANCE_ID,
                "database": "disconnected",
                "error": str(e),
                "timestamp": datetime.now().isoformat()
            }
        )

# Metrics endpoint for monitoring
@app.get("/metrics", tags=["Monitoring"])
async def get_metrics(api_key: str = Depends(get_api_key)):
    """
    Get metrics about the API service.

    Returns:
        dict: Metrics about the service performance and usage
    """
    # Em produção, estas métricas viriam de um sistema real de monitoramento
    return {
        "service": "gamepathai-api",
        "instance_id": INSTANCE_ID,
        "uptime": "N/A",
        "requests_processed": 0,
        "success_rate": "100%",
        "average_response_time": "10ms",
        "environment": ENVIRONMENT,
        "timestamp": datetime.now().isoformat()
    }

# Definição de modelos Pydantic para API
# Modelos para autenticação
class UserBase(BaseModel):
    email: EmailStr
    username: str

class UserCreate(UserBase):
    password: str

class UserLogin(BaseModel):
    email: EmailStr
    password: str

class UserResponse(UserBase):
    id: str
    tier: str = "free"
    createdAt: str

class Token(BaseModel):
    access_token: str
    refresh_token: str
    token_type: str = "bearer"

class TokenData(BaseModel):
    user_id: str
    email: Optional[str] = None

class PasswordResetRequest(BaseModel):
    email: EmailStr

class PasswordResetComplete(BaseModel):
    token: str
    new_password: str

# User settings models
class UserSettings(BaseModel):
    notifications_enabled: bool = True
    theme: str = "dark"
    language: str = "en-US"
    auto_optimization: bool = True

class UserProfile(BaseModel):
    username: str
    email: EmailStr
    avatar_url: Optional[str] = None
    bio: Optional[str] = None

# Game models
class Game(BaseModel):
    id: str
    name: str
    slug: str
    genre: str
    publisher: str
    releaseYear: int
    platforms: List[str]
    isDetected: bool = False
    isOptimized: bool = False
    lastOptimized: Optional[str] = None
    optimizationType: Optional[str] = None
    performanceMetrics: Optional[Dict[str, Any]] = None

class GameRegistration(BaseModel):
    id: str
    name: str
    slug: str
    source: str
    appId: Optional[str] = None
    genre: Optional[str] = None
    publisher: Optional[str] = None
    releaseYear: Optional[int] = None
    platforms: List[str] = ["PC"]
    installPath: Optional[str] = None
    executablePath: Optional[str] = None
    isDetected: bool = True
    isOptimized: bool = False
    lastOptimized: Optional[str] = None

# Optimization models
class OptimizationRequest(BaseModel):
    """Request model for game optimization"""
    optimizationTypes: List[str]
    settings: Dict[str, Any] = {}
    collect_metrics: bool = True

class OptimizationResponse(BaseModel):
    """Response model for game optimization"""
    success: bool
    optimizationId: str
    estimatedCompletionTime: int
    appliedSettings: Dict[str, Any]
    steps: List[Dict[str, Any]]
    issues_detected: Dict[str, Any]
    requires_client: bool
    game: Optional[Dict[str, Any]] = None

# Network optimization models
class NetworkData(BaseModel):
    ping: float
    jitter: float
    packet_loss: float
    download_speed: float
    upload_speed: float
    connection_type: str
    isp: str
    time_of_day: str

    @validator('ping', 'jitter', 'packet_loss', 'download_speed', 'upload_speed')
    def validate_positive_metrics(cls, v, values, **kwargs):
        if v < 0:
            raise ValueError('Value must be non-negative')
        return v

class NetworkOptimizationRequest(BaseModel):
    network_data: NetworkData

class NetworkOptimizationResponse(BaseModel):
    recommendations: Dict[str, Any]
    timestamp: str = Field(default_factory=lambda: datetime.now().isoformat())

# System optimization models
class SystemData(BaseModel):
    cpu_usage: float
    gpu_usage: float
    ram_usage: float
    fps: float
    temperature: float
    game: str
    cpu_model: str
    gpu_model: str

    @validator('cpu_usage', 'gpu_usage', 'ram_usage', 'fps', 'temperature')
    def validate_positive_metrics(cls, v, values, **kwargs):
        if v < 0:
            raise ValueError('Value must be non-negative')
        return v

    @validator('cpu_usage', 'gpu_usage', 'ram_usage')
    def validate_usage_percentage(cls, v, values, **kwargs):
        if v > 100:
            raise ValueError('Usage percentage must be between 0 and 100')
        return v

class SystemOptimizationRequest(BaseModel):
    system_data: SystemData

class SystemOptimizationResponse(BaseModel):
    recommendations: Dict[str, Any]
    timestamp: str = Field(default_factory=lambda: datetime.now().isoformat())

# Server data models
class ServerData(BaseModel):
    name: str
    ping: float
    jitter: float
    packet_loss: float
    server_id: int
    game_id: int

    @validator('ping', 'jitter', 'packet_loss')
    def validate_positive_metrics(cls, v, values, **kwargs):
        if v < 0:
            raise ValueError('Value must be non-negative')
        return v

class ServerRecommendationRequest(BaseModel):
    servers: List[ServerData]

class ServerRecommendationResponse(BaseModel):
    recommendations: List[Dict[str, Any]]
    timestamp: str = Field(default_factory=lambda: datetime.now().isoformat())

# Combined optimization models
class GamingOptimizationRequest(BaseModel):
    network_data: Optional[NetworkData] = None
    system_data: Optional[SystemData] = None
    servers: Optional[List[ServerData]] = None

class GamingOptimizationResponse(BaseModel):
    network_recommendations: Optional[Dict[str, Any]] = None
    system_recommendations: Optional[Dict[str, Any]] = None
    server_recommendations: Optional[List[Dict[str, Any]]] = None
    timestamp: str = Field(default_factory=lambda: datetime.now().isoformat())

# Training models
class TrainingRequest(BaseModel):
    force_retrain: bool = False

class TrainingResponse(BaseModel):
    status: str
    message: str
    model_name: str
    training_time: float
    timestamp: str = Field(default_factory=lambda: datetime.now().isoformat())

# Subscription models
class SubscriptionTier(str, Enum):
    FREE = "free"
    PLAYER = "player"    # Antes era "basic"
    COOP = "coop"        # Antes era "premium"
    ALLIANCE = "alliance"  # Antes era "professional"

class SubscriptionInterval(str, Enum):
    MONTHLY = "monthly"
    QUARTERLY = "quarterly"
    ANNUAL = "annual"

class PlanDetails(BaseModel):
    tier: SubscriptionTier
    interval: SubscriptionInterval
    price: float
    users: int
    features: List[str]

class SubscriptionStatus(BaseModel):
    active: bool
    tier: SubscriptionTier
    interval: SubscriptionInterval
    users: int
    start_date: str
    next_billing_date: Optional[str] = None
    auto_renew: bool = True
    price: float
    payment_method: Optional[str] = None
    features: List[str]

class SubscriptionUpdateRequest(BaseModel):
    tier: SubscriptionTier
    interval: Optional[SubscriptionInterval] = None
    auto_renew: Optional[bool] = None
    payment_method: Optional[str] = None

# Endpoints de autenticação
@app.post("/api/auth/register", response_model=Token, tags=["Authentication"])
async def register_user(user_data: UserCreate, background_tasks: BackgroundTasks):
    """
    Registra um novo usuário.

    Args:
        user_data: Dados do novo usuário (email, senha, nome de usuário)

    Returns:
        Token: Token de acesso e refresh token
    """
    # Verifica se o email já está em uso
    existing_user = db_client.get_user_by_email(user_data.email)
    if existing_user:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Email already registered",
        )

    # Cria o usuário
    user_id = f"user_{uuid.uuid4()}"
    hashed_password = get_password_hash(user_data.password)
    user = {
        "id": user_id,
        "email": user_data.email,
        "username": user_data.username,
        "hashed_password": hashed_password,
        "tier": "free",
        "createdAt": datetime.now().isoformat()
    }

    # Salvar no DynamoDB
    success = db_client.create_user(user)
    if not success:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Failed to create user",
        )

    # Em produção, enviaria email de verificação
    def send_verification_email(email: str, username: str):
        logger.info(f"Sending verification email to {email} for user {username}")
        # Simulação do envio de email

    background_tasks.add_task(send_verification_email, user_data.email, user_data.username)

    # Gera tokens
    access_token = create_access_token(
        data={"sub": user_id, "email": user_data.email},
        expires_delta=timedelta(minutes=ACCESS_TOKEN_EXPIRE_MINUTES)
    )
    refresh_token = create_refresh_token(user_id)

    return {"access_token": access_token, "refresh_token": refresh_token}

@app.post("/api/auth/login", response_model=Token, tags=["Authentication"])
async def login_for_access_token(form_data: UserLogin):
    """
    Faz login e retorna tokens de acesso.

    Args:
        form_data: Credenciais de login (email e senha)

    Returns:
        Token: Token de acesso e refresh token
    """
    # Busca o usuário pelo email no DynamoDB
    user = db_client.get_user_by_email(form_data.email)

    if not user or not verify_password(form_data.password, user["hashed_password"]):
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Incorrect email or password",
            headers={"WWW-Authenticate": "Bearer"},
        )

    # Gera tokens
    access_token = create_access_token(
        data={"sub": user["id"], "email": user["email"]},
        expires_delta=timedelta(minutes=ACCESS_TOKEN_EXPIRE_MINUTES)
    )
    refresh_token = create_refresh_token(user["id"])

    return {"access_token": access_token, "refresh_token": refresh_token}

@app.post("/api/auth/forgot-password", tags=["Authentication"])
async def forgot_password(request: PasswordResetRequest, background_tasks: BackgroundTasks):
    """
    Inicia o processo de redefinição de senha.

    Args:
        request: Email do usuário

    Returns:
        dict: Mensagem de sucesso
    """
    # Busca o usuário pelo email no DynamoDB
    user = db_client.get_user_by_email(request.email)

    if not user:
        # Não informamos se o email existe ou não por segurança
        return {"message": "If your email is registered, you will receive a password reset link."}

    # Gera token para redefinição de senha
    reset_token = secrets.token_urlsafe(32)

    # Em produção, armazenar o token em uma tabela de tokens de redefinição no DynamoDB
    # com tempo de expiração

    # Em produção, enviaria o email com link para redefinição
    def send_reset_email(email: str, token: str):
        logger.info(f"Sending password reset email to {email} with token {token[:10]}...")
        # Simulação do envio de email

    background_tasks.add_task(send_reset_email, request.email, reset_token)

    return {"message": "If your email is registered, you will receive a password reset link."}

@app.post("/api/auth/reset-password", tags=["Authentication"])
async def reset_password(request: PasswordResetComplete):
    """
    Completa o processo de redefinição de senha.

    Args:
        request: Token de redefinição e nova senha

    Returns:
        dict: Mensagem de sucesso
    """
    # Em produção, verificar o token em uma tabela de tokens no DynamoDB
    # Simulação para desenvolvimento:
    if len(request.token) < 32:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Invalid reset token",
        )

    # Em produção, localizar o usuário associado ao token e atualizar sua senha no DynamoDB
    # db_client.update_user(user_id, {"hashed_password": get_password_hash(request.new_password)})

    return {"message": "Password has been reset successfully."}

# Endpoints de perfil de usuário
@app.get("/api/user/profile", tags=["User"])
async def get_user_profile(current_user: dict = Depends(get_current_user)):
    """
    Retorna o perfil do usuário atual.

    Args:
        current_user: Usuário autenticado

    Returns:
        UserProfile: Dados do perfil do usuário
    """
    return {
        "username": current_user["username"],
        "email": current_user["email"],
        "avatar_url": current_user.get("avatar_url"),
        "bio": current_user.get("bio")
    }

@app.put("/api/user/profile", tags=["User"])
async def update_user_profile(profile: UserProfile, current_user: dict = Depends(get_current_user)):
    """
    Atualiza o perfil do usuário atual.

    Args:
        profile: Novos dados do perfil
        current_user: Usuário autenticado

    Returns:
        UserProfile: Dados atualizados do perfil
    """
    # Atualiza os dados do usuário no DynamoDB
    user_id = current_user["id"]
    update_data = {
        "username": profile.username,
        "email": profile.email,
        "avatar_url": profile.avatar_url,
        "bio": profile.bio
    }

    success = db_client.update_user(user_id, update_data)
    if not success:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Failed to update user profile",
        )

    return profile

@app.get("/api/user/settings", tags=["User"])
async def get_user_settings(current_user: dict = Depends(get_current_user)):
    """
    Retorna as configurações do usuário atual.

    Args:
        current_user: Usuário autenticado

    Returns:
        UserSettings: Configurações do usuário
    """
    # Buscar configurações do usuário no DynamoDB
    return UserSettings(
        notifications_enabled=current_user.get("notifications_enabled", True),
        theme=current_user.get("theme", "dark"),
        language=current_user.get("language", "en-US"),
        auto_optimization=current_user.get("auto_optimization", True)
    )

@app.put("/api/user/settings", tags=["User"])
async def update_user_settings(settings: UserSettings, current_user: dict = Depends(get_current_user)):
    """
    Atualiza as configurações do usuário atual.

    Args:
        settings: Novas configurações
        current_user: Usuário autenticado

    Returns:
        UserSettings: Configurações atualizadas
    """
    # Atualiza as configurações do usuário no DynamoDB
    user_id = current_user["id"]
    update_data = {
        "notifications_enabled": settings.notifications_enabled,
        "theme": settings.theme,
        "language": settings.language,
        "auto_optimization": settings.auto_optimization
    }

    success = db_client.update_user(user_id, update_data)
    if not success:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Failed to update user settings",
        )

    return settings

# Endpoint para servidores de jogos
@app.get("/api/server/recommend", tags=["Recommendation"])
async def recommend_servers(
    game_id: str,
    region: Optional[str] = None,
    max_latency: int = 100,
    max_results: int = 5,
    current_user: dict = Depends(get_current_user)
):
    """
    Recomenda servidores de jogos com base nos parâmetros fornecidos.

    - game_id: Identificador do jogo
    - region: Região do jogador (opcional)
    - max_latency: Latência máxima aceitável em ms
    - max_results: Número máximo de resultados a retornar
    """
    import random

    # Regiões de servidor simuladas
    regions = ["us-east", "us-west", "eu-west", "eu-central", "asia-east", "asia-southeast", "south-america", "australia"]

    # Se uma região específica foi solicitada, priorizá-la
    if region:
        closest_regions = [r for r in regions if region in r]
        closest_regions.extend([r for r in regions if region not in r])
    else:
        closest_regions = regions

    # Gerar servidores recomendados simulados
    recommended_servers = []
    for i in range(min(max_results, 10)):
        # Calcular latência simulada - servidores na região selecionada têm menor latência
        base_latency = 30 if region and region in closest_regions[i % len(closest_regions)] else 70
        latency = base_latency + random.randint(0, 40)

        # Só incluir servidores abaixo da latência máxima
        if latency <= max_latency:
            recommended_servers.append({
                "server_id": f"srv-{game_id}-{closest_regions[i % len(closest_regions)]}-{i+1}",
                "name": f"{game_id.upper()} Server {i+1}",
                "region": closest_regions[i % len(closest_regions)],
                "estimated_latency": latency,
                "player_count": random.randint(10, 500),
                "max_players": 500,
                "reliability_score": round(random.uniform(4.0, 5.0), 1)
            })

    # Registrar esta recomendação como métrica para análise futura
    db_client.store_metrics({
        "metric_type": "server_recommendation",
        "user_id": current_user["id"],
        "game_id": game_id,
        "region_filter": region,
        "max_latency": max_latency,
        "result_count": len(recommended_servers)
    })

    return {
        "game_id": game_id,
        "region_filter": region,
        "max_latency": max_latency,
        "recommended_servers": recommended_servers,
        "total_results": len(recommended_servers),
        "timestamp": datetime.now().isoformat()
    }

# Endpoints para recomendações de servidores via POST
@app.post("/api/recommend-servers", response_model=ServerRecommendationResponse, tags=["Prediction"])
async def recommend_servers_post(
    request: ServerRecommendationRequest,
    api_key: str = Depends(get_api_key)
):
    """
    Recommend the best game servers based on network conditions.

    Args:
        request: Contains a list of servers with their performance metrics
        api_key: API key for authentication

    Returns:
        ServerRecommendationResponse: Ranked list of servers with quality scores
    """
    try:
        logger.info(f"Server recommendation request with {len(request.servers)} servers")
        model = get_model("server_recommender")
        
        if model:
            recommendations = model.predict([server.dict() for server in request.servers])
            logger.info(f"Generated {len(recommendations)} server recommendations using ML model")
            return {"recommendations": recommendations}
        else:
            logger.warning("Model not available, using fallback recommendation logic")
            raise Exception("Model not available")
    except Exception as e:
        logger.error(f"Error in server recommendation: {str(e)}")

        # Fallback: simple ping-based recommendation
        try:
            logger.warning("Using fallback method for server recommendations")
            fallback_recommendations = []
            sorted_servers = sorted(request.servers, key=lambda s: (s.ping, s.jitter, s.packet_loss))

            for i, server in enumerate(sorted_servers):
                fallback_recommendations.append({
                    "server_id": server.server_id,
                    "name": server.name,
                    "predicted_quality": max(0, 100 - server.ping / 2 - server.jitter * 2 - server.packet_loss * 10),
                    "rank": i + 1,
                    "is_fallback": True
                })

            logger.info("Used fallback server recommendation")
            return {"recommendations": fallback_recommendations}
        except Exception as fallback_error:
            logger.error(f"Error in fallback server recommendation: {str(fallback_error)}")
            raise HTTPException(
                status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
                detail=f"Failed to generate server recommendations: {str(e)}",
            )

# Network optimization endpoint
@app.post("/api/optimize-network", response_model=NetworkOptimizationResponse, tags=["Prediction"])
async def optimize_network_post(
    request: NetworkOptimizationRequest,
    api_key: str = Depends(get_api_key)
):
    """
    Provide network optimization recommendations based on current network conditions.

    Args:
        request: Contains network performance metrics and configuration
        api_key: API key for authentication

    Returns:
        NetworkOptimizationResponse: Recommended network settings for optimal gaming
    """
    try:
        logger.info(f"Network optimization request for connection type: {request.network_data.connection_type}")
        model = get_model("network_optimization")
        
        if model:
            recommendations = model.predict(request.network_data.dict())
            logger.info(f"Generated network optimization recommendations using ML model")
            return {"recommendations": recommendations}
        else:
            logger.warning("Model not available, using fallback network optimization logic")
            raise Exception("Model not available")
    except Exception as e:
        logger.error(f"Error in network optimization: {str(e)}")

        # Fallback: basic network recommendations
        try:
            logger.warning("Using fallback method for network optimization")
            network_data = request.network_data

            # Simple heuristics for fallback
            if network_data.ping > 100 or network_data.jitter > 20 or network_data.packet_loss > 2:
                dns_rec = "Cloudflare DNS (1.1.1.1, 1.0.0.1)"
                protocol_rec = "TCP" if network_data.jitter > 10 else "UDP"
                qos_rec = True
                priority = "gaming"
            else:
                dns_rec = "Default DNS"
                protocol_rec = "Auto"
                qos_rec = False
                priority = "balanced"

            fallback_recommendations = {
                "dns_settings": dns_rec,
                "protocol": protocol_rec,
                "qos_enabled": qos_rec,
                "qos_priority": priority,
                "is_fallback": True,
                "message": "Basic recommendations due to model unavailability"
            }

            logger.info("Used fallback network optimization")
            return {"recommendations": fallback_recommendations}
        except Exception as fallback_error:
            logger.error(f"Error in fallback network optimization: {str(fallback_error)}")
            raise HTTPException(
                status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
                detail=f"Failed to generate network recommendations: {str(e)}",
            )

# System optimization endpoint
@app.post("/api/optimize-system", response_model=SystemOptimizationResponse, tags=["Prediction"])
async def optimize_system_post(
    request: SystemOptimizationRequest,
    api_key: str = Depends(get_api_key)
):
    """
    Provide system optimization recommendations based on hardware and current performance.

    Args:
        request: Contains system performance metrics and hardware information
        api_key: API key for authentication

    Returns:
        SystemOptimizationResponse: Recommended system and in-game settings for optimal performance
    """
    try:
        logger.info(f"System optimization request for game: {request.system_data.game}")
        model = get_model("system_optimization")
        
        if model:
            recommendations = model.predict(request.system_data.dict())
            logger.info(f"Generated system optimization recommendations using ML model")
            return {"recommendations": recommendations}
        else:
            logger.warning("Model not available, using fallback system optimization logic")
            raise Exception("Model not available")
    except Exception as e:
        logger.error(f"Error in system optimization: {str(e)}")

        # Fallback: basic system recommendations based on hardware tier
        try:
            logger.warning("Using fallback method for system optimization")
            system_data = request.system_data

            # Simple hardware tier detection
            if "i9" in system_data.cpu_model.lower() or "ryzen 9" in system_data.cpu_model.lower() or \
               "rtx 30" in system_data.gpu_model.lower() or "rtx 40" in system_data.gpu_model.lower():
                tier = "high_end"
            elif "i7" in system_data.cpu_model.lower() or "ryzen 7" in system_data.cpu_model.lower() or \
                 "rtx 20" in system_data.gpu_model.lower() or "gtx 16" in system_data.gpu_model.lower():
                tier = "mid_range"
            else:
                tier = "low_end"

            # Recommendations based on tier
            if tier == "high_end":
                graphics = "high"
                resolution = "1440p"
                vsync = "adaptive"
                priority = "high"
                bottleneck = "none" if system_data.fps > 100 else "check cooling"
            elif tier == "mid_range":
                graphics = "medium"
                resolution = "1080p"
                vsync = "on" if system_data.fps < 100 else "adaptive"
                priority = "high"
                bottleneck = "GPU" if system_data.gpu_usage > 90 else "CPU" if system_data.cpu_usage > 90 else "none"
            else:
                graphics = "low"
                resolution = "1080p" if system_data.fps > 60 else "720p"
                vsync = "off"
                priority = "high"
                bottleneck = "hardware limitations"

            fallback_recommendations = {
                "graphics_settings": graphics,
                "resolution": resolution,
                "vsync": vsync,
                "process_priority": priority,
                "bottleneck_diagnosis": bottleneck,
                "hardware_tier": tier,
                "is_fallback": True,
                "message": "Basic recommendations due to model unavailability"
            }

            logger.info("Used fallback system optimization")
            return {"recommendations": fallback_recommendations}
        except Exception as fallback_error:
            logger.error(f"Error in fallback system optimization: {str(fallback_error)}")
            raise HTTPException(
                status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
                detail=f"Failed to generate system recommendations: {str(e)}",
            )

# Combined optimization endpoint
@app.post("/api/optimize-gaming", response_model=GamingOptimizationResponse, tags=["Prediction"])
async def optimize_gaming(
    request: GamingOptimizationRequest,
    api_key: str = Depends(get_api_key)
):
    """
    Unified endpoint for all types of gaming optimizations.

    This endpoint combines server recommendations, network optimization,
    and system optimization in a single call.

    Args:
        request: Contains optional network data, system data, and server list
        api_key: API key for authentication

    Returns:
        GamingOptimizationResponse: Combined recommendations for all requested optimizations
    """
    response = GamingOptimizationResponse()

    # Process server recommendations if provided
    if request.servers:
        try:
            server_req = ServerRecommendationRequest(servers=request.servers)
            server_response = await recommend_servers_post(server_req, api_key)
            response.server_recommendations = server_response.recommendations
        except Exception as e:
            logger.error(f"Error in combined server recommendation: {str(e)}")
            # Continue with other optimizations

    # Process network optimization if provided
    if request.network_data:
        try:
            network_req = NetworkOptimizationRequest(network_data=request.network_data)
            network_response = await optimize_network_post(network_req, api_key)
            response.network_recommendations = network_response.recommendations
        except Exception as e:
            logger.error(f"Error in combined network optimization: {str(e)}")
            # Continue with other optimizations

    # Process system optimization if provided
    if request.system_data:
        try:
            system_req = SystemOptimizationRequest(system_data=request.system_data)
            system_response = await optimize_system_post(system_req, api_key)
            response.system_recommendations = system_response.recommendations
        except Exception as e:
            logger.error(f"Error in combined system optimization: {str(e)}")
            # Continue with other optimizations

    # Check if at least one optimization was successful
    if not any([response.server_recommendations, response.network_recommendations, response.system_recommendations]):
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="All optimization attempts failed",
        )

    return response

# Endpoints de gerenciamento de jogos
@app.get("/api/games", response_model=List[Game], tags=["Games"])
async def list_games(
    current_user: dict = Depends(get_current_user)
):
    """
    Lista todos os jogos suportados.

    Args:
        current_user: Usuário autenticado

    Returns:
        List[Game]: Lista de jogos suportados
    """
    # Buscar jogos do DynamoDB
    games = db_client.list_games()
    return games

@app.get("/api/games/{game_id}", response_model=Game, tags=["Games"])
async def get_game(
    game_id: str, 
    current_user: dict = Depends(get_current_user)
):
    """
    Retorna detalhes de um jogo específico.

    Args:
        game_id: ID do jogo
        current_user: Usuário autenticado

    Returns:
        Game: Detalhes do jogo
    """
    # Buscar jogo do DynamoDB
    game = db_client.get_game(game_id)
    if not game:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Game not found",
        )

    return game

@app.get("/api/games/detected", response_model=List[Game], tags=["Games"])
async def get_detected_games(
    current_user: dict = Depends(get_current_user)
):
    """
    Lista jogos detectados no sistema do usuário.

    Args:
        current_user: Usuário autenticado

    Returns:
        List[Game]: Lista de jogos detectados
    """
    # Buscar jogos do usuário do DynamoDB
    user_games = db_client.get_user_games(current_user["id"])
    
    # Se não encontramos jogos associados ao usuário, retornamos jogos detectados genéricos
    if not user_games:
        all_games = db_client.list_games()
        detected_games = [game for game in all_games if game.get("isDetected", False)]
        return detected_games
    
    # Se temos jogos associados ao usuário, buscamos detalhes completos de cada jogo
    detected_games = []
    for user_game in user_games:
        game_id = user_game.get("game_id")
        if game_id:
            game = db_client.get_game(game_id)
            if game:
                detected_games.append(game)
    
    return detected_games

@app.post("/api/games/register", response_model=List[Game], tags=["Games"])
async def register_games(
    games: List[GameRegistration],
    current_user: dict = Depends(get_current_user)
):
    """
    Register games detected by client application.

    This endpoint allows client applications to send information about
    games detected on the user's system. These games are stored in the
    database and associated with the current user.
    """
    registered_games = []

    for game_data in games:
        # Check if game already exists
        existing_game = db_client.get_game(game_data.id)

        if existing_game:
            # Update existing game with new detection data
            update_data = game_data.dict()
            update_data["lastDetectedAt"] = datetime.now().isoformat()
            success = db_client.update_game(game_data.id, update_data)
            if success:
                registered_games.append({**existing_game, **update_data})
            else:
                logger.error(f"Failed to update existing game: {game_data.id}")
        else:
            # Create new game
            new_game = game_data.dict()
            new_game["detectedAt"] = datetime.now().isoformat()
            success = db_client.create_game(new_game)
            if success:
                registered_games.append(new_game)
                
                # Create relationship between user and game
                db_client.add_user_game(current_user["id"], new_game["id"], {
                    "detected_at": datetime.now().isoformat(),
                    "detection_method": "client"
                })
            else:
                logger.error(f"Failed to create new game: {game_data.id}")

    return registered_games

@app.post("/api/games/{game_id}/optimize", response_model=OptimizationResponse, tags=["Games"])
async def optimize_game(
    game_id: str,
    request: OptimizationRequest,
    current_user: dict = Depends(get_current_user)
):
    """
    Apply real optimizations to a game based on collected metrics.

    This endpoint analyzes real metrics data and generates specific
    optimizations tailored to the user's system and game performance.
    The optimizations can be applied through the desktop client app.
    """
    # Get the game
    game = db_client.get_game(game_id)
    if not game:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Game not found"
        )

    # Get recent metrics for this game and user
    now = datetime.now()
    start_time = (now - timedelta(days=7)).isoformat()  # Last 7 days

    try:
        # Get system metrics if needed
        system_metrics = []
        if "system" in request.optimizationTypes or "both" in request.optimizationTypes:
            system_metrics = db_client.get_metrics_by_user(
                current_user["id"], start_time, now.isoformat(), 100, metric_type="system"
            )
            system_metrics = [m for m in system_metrics if m.get("game_id") == game_id]

        # Get network metrics if needed
        network_metrics = []
        if "network" in request.optimizationTypes or "both" in request.optimizationTypes:
            network_metrics = db_client.get_metrics_by_user(
                current_user["id"], start_time, now.isoformat(), 100, metric_type="network"
            )
            network_metrics = [m for m in network_metrics if m.get("game_id") == game_id]

        # Analyze the metrics and generate recommendations
        system_analysis = {}
        network_analysis = {}
        all_steps = []

        if system_metrics:
            system_analysis = SystemOptimizer.analyze_system(system_metrics, game_id)
            system_steps = SystemOptimizer.generate_system_optimization_steps(system_analysis["recommendations"])
            all_steps.extend(system_steps)

        if network_metrics:
            network_analysis = NetworkOptimizer.analyze_network(network_metrics, game_id)
            network_steps = NetworkOptimizer.generate_network_optimization_steps(network_analysis["recommendations"])
            all_steps.extend(network_steps)

        # If we don't have metrics, provide general recommendations
        if not system_metrics and ("system" in request.optimizationTypes or "both" in request.optimizationTypes):
            # Provide default system recommendations
            default_system_recs = [
                {"type": "game_mode", "description": "Enable Windows Game Mode"},
                {"type": "power_plan", "description": "Set power plan to High Performance"}
            ]
            system_steps = SystemOptimizer.generate_system_optimization_steps(default_system_recs)
            all_steps.extend(system_steps)

            system_analysis = {
                "cpu_bottleneck": False,
                "gpu_bottleneck": False,
                "memory_bottleneck": False,
                "thermal_issues": False,
                "recommendations": default_system_recs,
                "note": "Using default recommendations - no metrics available"
            }

        if not network_metrics and ("network" in request.optimizationTypes or "both" in request.optimizationTypes):
            # Provide default network recommendations
            default_network_recs = [
                {"type": "dns_optimization", "description": "Use gaming-optimized DNS servers"},
                {"type": "network_priority", "description": "Set network adapter to prioritize gaming traffic"}
            ]
            network_steps = NetworkOptimizer.generate_network_optimization_steps(default_network_recs)
            all_steps.extend(network_steps)

            network_analysis = {
                "high_latency": False,
                "high_jitter": False,
                "high_packet_loss": False,
                "recommendations": default_network_recs,
                "note": "Using default recommendations - no metrics available"
            }

        # Generate optimization ID
        optimization_id = f"opt-{uuid.uuid4()}"

        # Flag for whether client app is required
        requires_client = any(step.get("automated", False) for step in all_steps)

        # Update game optimization status
        optimization_type = "both"
        if "network" in request.optimizationTypes and "system" not in request.optimizationTypes:
            optimization_type = "network"
        elif "system" in request.optimizationTypes and "network" not in request.optimizationTypes:
            optimization_type = "system"

        update_data = {
            "isOptimized": True,
            "lastOptimized": now.isoformat(),
            "optimizationType": optimization_type,
        }

        db_client.update_game(game_id, update_data)

        # Store optimization in user-game relationship
        optimization_data = {
            "timestamp": now.isoformat(),
            "optimizationType": optimization_type,
            "settings": request.settings,
            "optimizationId": optimization_id,
            "steps": all_steps,
            "systemAnalysis": system_analysis,
            "networkAnalysis": network_analysis,
            "requiresClient": requires_client
        }

        db_client.add_user_game(current_user["id"], game_id, optimization_data)

        # Update the game object with new data
        game.update(update_data)

        # Return the response
        return {
            "success": True,
            "optimizationId": optimization_id,
            "estimatedCompletionTime": 30 if requires_client else 5,
            "appliedSettings": request.settings,
            "steps": all_steps,
            "issues_detected": {
                "system": system_analysis,
                "network": network_analysis
            },
            "requires_client": requires_client,
            "game": game
        }

    except Exception as e:
        logger.error(f"Error during game optimization: {str(e)}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Failed to optimize game: {str(e)}"
        )

# Endpoint para cliente detectar jogos
@app.post("/api/client/detect-games", tags=["Desktop Client"])
async def client_detect_games(
    client: dict = Depends(get_client_auth)
):
    """
    Inicia detecção de jogos no cliente.

    Cria um comando para o cliente desktop executar a detecção de jogos
    utilizando métodos nativos do sistema operacional do cliente.
    """
    try:
        # Criar comando para detecção de jogos
        command = {
            "id": f"cmd-{uuid.uuid4()}",
            "client_id": client["id"],
            "status": "pending",
            "created_at": datetime.now().isoformat(),
            "command_type": "detect_games",
            "parameters": {
                "include_platforms": ["steam", "epic", "battlenet", "xbox", "microsoft_store"]
            }
        }

        return {
            "success": True,
            "command_id": command["id"],
            "message": "Game detection initiated on client"
        }
    except Exception as e:
        logger.error(f"Error starting game detection: {str(e)}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Failed to start game detection: {str(e)}"
        )

# Endpoints de treinamento de modelo ML
@app.post("/api/train/network", response_model=TrainingResponse, tags=["Training"])
async def train_network_model(
    request: TrainingRequest,
    api_key: str = Depends(get_api_key)
):
    """
    Train or retrain the network optimization model.

    Args:
        request: Training request with options like force_retrain
        api_key: API key for authentication

    Returns:
        TrainingResponse: Status and details of the training process
    """
    try:
        start_time = time.time()
        
        # Simular treinamento para desenvolvimento
        # Em produção, invocar treinamento real do modelo
        logger.info(f"Starting network model training with force_retrain={request.force_retrain}")
        time.sleep(2)  # Simular tempo de processamento
        
        # Limpar cache
        if REDIS_AVAILABLE:
            redis_client.delete("model:network_optimization")
        else:
            with model_cache_lock:
                if "network_optimization" in model_cache:
                    del model_cache["network_optimization"]

        training_time = time.time() - start_time

        return {
            "status": "success",
            "message": "Network optimization model trained successfully",
            "model_name": "network_optimization",
            "training_time": training_time
        }
    except Exception as e:
        logger.error(f"Error training network model: {str(e)}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Failed to train network model: {str(e)}",
        )

@app.post("/api/train/system", response_model=TrainingResponse, tags=["Training"])
async def train_system_model(
    request: TrainingRequest,
    api_key: str = Depends(get_api_key)
):
    """
    Train or retrain the system optimization model.

    Args:
        request: Training request with options like force_retrain
        api_key: API key for authentication

    Returns:
        TrainingResponse: Status and details of the training process
    """
    try:
        start_time = time.time()
        
        # Simular treinamento para desenvolvimento
        logger.info(f"Starting system model training with force_retrain={request.force_retrain}")
        time.sleep(2)  # Simular tempo de processamento
        
        # Limpar cache
        if REDIS_AVAILABLE:
            redis_client.delete("model:system_optimization")
        else:
            with model_cache_lock:
                if "system_optimization" in model_cache:
                    del model_cache["system_optimization"]

        training_time = time.time() - start_time

        return {
            "status": "success",
            "message": "System optimization model trained successfully",
            "model_name": "system_optimization",
            "training_time": training_time
        }
    except Exception as e:
        logger.error(f"Error training system model: {str(e)}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Failed to train system model: {str(e)}",
        )

@app.post("/api/train/server-recommender", response_model=TrainingResponse, tags=["Training"])
async def train_server_model(
    request: TrainingRequest,
    api_key: str = Depends(get_api_key)
):
    """
    Train or retrain the server recommender model.

    Args:
        request: Training request with options like force_retrain
        api_key: API key for authentication

    Returns:
        TrainingResponse: Status and details of the training process
    """
    try:
        start_time = time.time()
        
        # Simular treinamento para desenvolvimento
        logger.info(f"Starting server recommender model training with force_retrain={request.force_retrain}")
        time.sleep(2)  # Simular tempo de processamento
        
        # Limpar cache
        if REDIS_AVAILABLE:
            redis_client.delete("model:server_recommender")
        else:
            with model_cache_lock:
                if "server_recommender" in model_cache:
                    del model_cache["server_recommender"]

        training_time = time.time() - start_time

        return {
            "status": "success",
            "message": "Server recommender model trained successfully",
            "model_name": "server_recommender",
            "training_time": training_time
        }
    except Exception as e:
        logger.error(f"Error training server model: {str(e)}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Failed to train server model: {str(e)}",
        )

@app.post("/api/train/all", response_model=List[TrainingResponse], tags=["Training"])
async def train_all_models(
    request: TrainingRequest,
    api_key: str = Depends(get_api_key)
):
    """
    Train or retrain all machine learning models.

    This is a convenience endpoint to trigger training for all models in one call.

    Args:
        request: Training request with options like force_retrain
        api_key: API key for authentication

    Returns:
        List[TrainingResponse]: List of training results for each model
    """
    results = []

    # Train network model
    try:
        network_result = await train_network_model(request, api_key)
        results.append(network_result)
    except HTTPException as e:
        results.append({
            "status": "error",
            "message": e.detail,
            "model_name": "network_optimization",
            "training_time": 0,
            "timestamp": datetime.now().isoformat()
        })

    # Train system model
    try:
        system_result = await train_system_model(request, api_key)
        results.append(system_result)
    except HTTPException as e:
        results.append({
            "status": "error",
            "message": e.detail,
            "model_name": "system_optimization",
            "training_time": 0,
            "timestamp": datetime.now().isoformat()
        })

    # Train server model
    try:
        server_result = await train_server_model(request, api_key)
        results.append(server_result)
    except HTTPException as e:
        results.append({
            "status": "error",
            "message": e.detail,
            "model_name": "server_recommender",
            "training_time": 0,
            "timestamp": datetime.now().isoformat()
        })

    return results

# Endpoint para otimização de sistema
@app.get("/api/system/optimize", tags=["Optimization"])
async def optimize_system(
    game_id: Optional[str] = None,
    prioritize_performance: bool = True,
    cpu_priority: int = 3,
    memory_usage_limit: int = 80,
    auto_resource_management: bool = True,
    current_user: dict = Depends(get_current_user)
):
    """
    Otimiza configurações do sistema com base nos parâmetros fornecidos.

    - game_id: Identificador do jogo (opcional)
    - prioritize_performance: Priorizar desempenho em vez de economia de energia
    - cpu_priority: Nível de prioridade da CPU (1-5)
    - memory_usage_limit: Limite de uso de memória em porcentagem
    - auto_resource_management: Ativar gerenciamento automático de recursos
    """
    # Em uma implementação completa, aqui chamaríamos o modelo ML
    # Por enquanto, retornamos uma resposta simulada

    # Registrar a otimização nas métricas
    db_client.store_metrics({
        "metric_type": "system_optimization",
        "user_id": current_user["id"],
        "game_id": game_id,
        "prioritize_performance": prioritize_performance,
        "cpu_priority": cpu_priority,
        "memory_usage_limit": memory_usage_limit
    })

    optimization_results = {
        "success": True,
        "optimized_settings": {
            "cpu_settings": {
                "power_plan": "High Performance" if prioritize_performance else "Balanced",
                "priority_boost": True if cpu_priority > 3 else False,
                "process_priority": cpu_priority
            },
            "memory_settings": {
                "max_usage_percent": memory_usage_limit,
                "page_file_optimization": True,
                "standby_list_optimization": True
            },
            "system_services": {
                "disabled_services": [
                    "superfetch",
                    "windows_search",
                    "print_spooler"
                ],
                "delayed_services": [
                    "windows_update"
                ]
            },
            "auto_management": auto_resource_management
        },
        "expected_improvements": {
            "fps_increase": "10-20%",
            "stuttering_reduction": "30-40%",
            "loading_time_reduction": "15-25%"
        },
        "game_specific": game_id is not None,
        "game_id": game_id,
        "timestamp": datetime.now().isoformat()
    }

    return optimization_results

# Endpoint para otimização de rede
@app.get("/api/network/optimize", tags=["Optimization"])
async def optimize_network(
    game_id: str = None,
    latency_threshold: int = 100,
    packet_loss_threshold: float = 0.5,
    current_user: dict = Depends(get_current_user)
):
    """
    Otimiza configurações de rede com base nos parâmetros fornecidos.

    - game_id: Identificador do jogo (opcional)
    - latency_threshold: Limite aceitável de latência em ms
    - packet_loss_threshold: Limite aceitável de perda de pacotes em percentual
    """
    # Registrar a otimização nas métricas
    db_client.store_metrics({
        "metric_type": "network_optimization",
        "user_id": current_user["id"],
        "game_id": game_id,
        "latency_threshold": latency_threshold,
        "packet_loss_threshold": packet_loss_threshold
    })

    optimization_results = {
        "success": True,
        "optimized_settings": {
            "tcp_nodelay": True,
            "buffer_size": 65536,
            "qos_enabled": True,
            "priority_traffic": True
        },
        "expected_improvements": {
            "latency_reduction": "15-25%",
            "packet_loss_reduction": "30-40%",
            "jitter_reduction": "20-30%"
        },
        "game_specific": game_id is not None,
        "game_id": game_id,
        "timestamp": datetime.now().isoformat()
    }

    return optimization_results

# Endpoints para otimizações disponíveis
@app.get("/api/optimizations/available", tags=["Optimizations"])
async def get_optimizations_available(
    current_user: dict = Depends(get_current_user)
):
    """
    Returns available optimizations for the current user
    """
    # Verificar nível de assinatura do usuário para determinar otimizações disponíveis
    user_tier = current_user.get("tier", "free")
    
    optimizations = [
        {
            "id": "network",
            "name": "Network Optimization",
            "description": "Optimizes network settings for online games",
            "availability": "all"
        },
        {
            "id": "system",
            "name": "System Optimization",
            "description": "Optimizes system settings for better performance",
            "availability": "all"
        }
    ]
    
    # Otimizações exclusivas para assinantes
    if user_tier != "free":
        optimizations.extend([
            {
                "id": "resources",
                "name": "Resource Management",
                "description": "Manages system resources during gameplay",
                "availability": "premium"
            },
            {
                "id": "thermal",
                "name": "Thermal Management",
                "description": "Controls temperature during gameplay",
                "availability": "premium"
            }
        ])

    return {
        "optimizations": optimizations,
        "user_tier": user_tier
    }

@app.post("/api/optimizations/apply", tags=["Optimizations"])
async def apply_optimizations(
    optimization_types: List[str],
    settings: Dict[str, Any],
    game_id: str,
    current_user: dict = Depends(get_current_user)
):
    """
    Applies selected optimizations to a game
    """
    # Verificar se o jogo existe
    game = db_client.get_game(game_id)
    if not game:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Game not found"
        )
    
    # Registrar a otimização nas métricas
    db_client.store_metrics({
        "metric_type": "optimizations_apply",
        "user_id": current_user["id"],
        "game_id": game_id,
        "optimization_types": optimization_types,
        "settings": settings
    })
    
    # Gerar ID único para esta otimização
    optimization_id = f"opt-{uuid.uuid4()}"
    
    # Atualizar status do jogo
    update_data = {
        "isOptimized": True,
        "lastOptimized": datetime.now().isoformat(),
        "optimizationType": ",".join(optimization_types)
    }
    
    db_client.update_game(game_id, update_data)

    return {
        "success": True,
        "optimizationId": optimization_id,
        "estimatedCompletionTime": 30,
        "appliedSettings": settings
    }

@app.get("/api/optimizations/status/{optimization_id}", tags=["Optimizations"])
async def get_optimization_status(
    optimization_id: str,
    current_user: dict = Depends(get_current_user)
):
    """
    Checks the status of an optimization
    """
    # Em produção, buscar status real da otimização no banco de dados
    # Aqui, simulamos uma otimização concluída
    
    return {
        "status": "completed",
        "progress": 100,
        "optimizationId": optimization_id,
        "completedAt": datetime.now().isoformat(),
        "results": {
            "performanceImprovement": "15%",
            "networkLatencyReduction": "30ms"
        }
    }

@app.get("/api/optimizations/history", tags=["Optimizations"])
async def get_optimization_history(
    current_user: dict = Depends(get_current_user)
):
    """
    Returns optimization history for the current user
    """
    # Em produção, buscar histórico real no banco de dados
    # Aqui, simulamos um histórico
    
    # Obter jogos do usuário
    user_games = db_client.get_user_games(current_user["id"])
    
    # Gerar histórico de otimizações
    optimizations = []
    
    for game_rel in user_games[:5]:  # Limitar a 5 para não sobrecarregar
        game_id = game_rel.get("game_id")
        if game_id:
            game = db_client.get_game(game_id)
            if game and game.get("isOptimized"):
                optimizations.append({
                    "id": f"opt-{uuid.uuid4()}",
                    "gameId": game_id,
                    "gameName": game.get("name", "Unknown Game"),
                    "timestamp": game.get("lastOptimized", datetime.now().isoformat()),
                    "status": "completed",
                    "types": game.get("optimizationType", "both").split(","),
                    "results": {
                        "performanceImprovement": "10%",
                        "networkLatencyReduction": "25ms"
                    }
                })
    
    return {
        "optimizations": optimizations
    }

# Incluir os routers
app.include_router(metrics_router)
app.include_router(optimization_router)
app.include_router(subscription_router)
app.include_router(vpn_router)

# Inicializar dados de jogos ao iniciar (somente em desenvolvimento)
@app.on_event("startup")
async def startup_event():
    """
    Initialize the application at startup.
    """
    logger.info(f"Starting GamePath AI API v{API_VERSION} on {INSTANCE_ID} in {ENVIRONMENT} environment")
    
    # Tentar inicializar dados de jogos em ambiente de desenvolvimento
    if ENVIRONMENT == "development":
        try:
            logger.info("Initializing sample game data for development")
            initialize_game_data()
        except Exception as e:
            logger.error(f"Error initializing game data: {str(e)}")

# Limpeza ao desligar
@app.on_event("shutdown")
async def shutdown_event():
    """
    Perform cleanup at shutdown.
    """
    logger.info(f"Shutting down GamePath AI API on {INSTANCE_ID}")
    
    # Fechar conexões do Redis se estiver usando
    if REDIS_AVAILABLE:
        try:
            redis_client.close()
            logger.info("Redis connection closed")
        except Exception as e:
            logger.error(f"Error closing Redis connection: {str(e)}")

# Se o arquivo for executado diretamente
if __name__ == "__main__":
    try:
        import uvicorn
        port = int(os.environ.get("PORT", "8000"))
        logger.info(f"Starting uvicorn server on port {port}")
        uvicorn.run("service:app", host="0.0.0.0", port=port, reload=(ENVIRONMENT == "development"))
    except Exception as e:
        logger.error(f"Error starting application: {str(e)}")
        import traceback
        traceback.print_exc()
