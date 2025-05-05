class SystemOptimizer:
    @staticmethod
    def analyze_system(metrics, game_id):
        """Analisa métricas do sistema e gera recomendações"""
        return {
            "cpu_bottleneck": False,
            "gpu_bottleneck": False,
            "memory_bottleneck": False,
            "thermal_issues": False,
            "recommendations": [
                {"type": "game_mode", "description": "Enable Game Mode"},
                {"type": "power_plan", "description": "High Performance"}
            ]
        }
        
    @staticmethod
    def generate_system_optimization_steps(recommendations):
        """Gera passos de otimização a partir das recomendações"""
        steps = []
        for rec in recommendations:
            steps.append({
                "type": rec["type"],
                "description": rec["description"],
                "automated": True,
                "priority": "high"
            })
        return steps

class NetworkOptimizer:
    @staticmethod
    def analyze_network(metrics, game_id):
        """Analisa métricas de rede e gera recomendações"""
        return {
            "high_latency": False,
            "high_jitter": False,
            "high_packet_loss": False,
            "recommendations": [
                {"type": "dns_optimization", "description": "Use gaming DNS"},
                {"type": "tcp_optimization", "description": "Optimize TCP settings"}
            ]
        }
        
    @staticmethod
    def generate_network_optimization_steps(recommendations):
        """Gera passos de otimização a partir das recomendações"""
        steps = []
        for rec in recommendations:
            steps.append({
                "type": rec["type"],
                "description": rec["description"],
                "automated": True,
                "priority": "high"
            })
        return steps
