class GameDetectionService:
    def __init__(self):
        pass
        
    def detect_all_games(self):
        """Simulação de detecção de jogos"""
        return [
            {
                "id": "valorant",
                "name": "Valorant",
                "slug": "valorant",
                "genre": "FPS",
                "publisher": "Riot Games",
                "releaseYear": 2020,
                "platforms": ["PC"],
                "isDetected": True,
                "isOptimized": False,
                "source": "detection"
            }
        ]
