
import React, { useState, useEffect } from "react";
import { ArrowDownUp, Cpu, Gamepad, Thermometer, Wifi, Zap } from "lucide-react";
import { toast } from "sonner";
import Layout from "@/components/Layout";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { testBackendConnection } from "@/services/api";
import GameCard from "@/components/GameCard";
import OptimizationControls from "@/components/OptimizationControls";

const generateMockData = () => {
  return {
    cpu: {
      usage: Math.floor(Math.random() * 40) + 20,
      temperature: Math.floor(Math.random() * 20) + 50
    },
    gpu: {
      usage: Math.floor(Math.random() * 50) + 30,
      temperature: Math.floor(Math.random() * 15) + 60
    },
    network: {
      latency: Math.floor(Math.random() * 100) + 5,
      jitter: Math.floor(Math.random() * 15),
      packetLoss: (Math.random() * 2).toFixed(1)
    },
    memory: {
      usage: Math.floor(Math.random() * 40) + 30
    }
  };
};

const mockGames = [
  {
    id: "1",
    name: "Counter-Strike 2",
    image: "https://placehold.co/600x400/1A2033/ffffff?text=CS2",
    isOptimized: true,
    genre: "FPS",
    optimizationType: "both" as "both" | "network" | "system" | "none"
  },
  {
    id: "2",
    name: "Valorant",
    image: "https://placehold.co/600x400/1A2033/ffffff?text=Valorant",
    isOptimized: true,
    genre: "FPS",
    optimizationType: "network" as "both" | "network" | "system" | "none"
  },
  {
    id: "3",
    name: "League of Legends",
    image: "https://placehold.co/600x400/1A2033/ffffff?text=LoL",
    isOptimized: false,
    genre: "MOBA",
    optimizationType: "none" as "both" | "network" | "system" | "none"
  },
  {
    id: "4",
    name: "Fortnite",
    image: "https://placehold.co/600x400/1A2033/ffffff?text=Fortnite",
    isOptimized: false,
    genre: "Battle Royale",
    optimizationType: "none" as "both" | "network" | "system" | "none"
  }
];

const MonitoringDashboard: React.FC = () => {
  const [systemData, setSystemData] = useState(generateMockData());
  const [backendStatus, setBackendStatus] = useState<'online' | 'offline' | 'checking'>('checking');
  const [isOptimizing, setIsOptimizing] = useState(false);
  const [games, setGames] = useState(mockGames);

  useEffect(() => {
    // Check backend connection status
    const checkConnection = async () => {
      const isConnected = await testBackendConnection();
      setBackendStatus(isConnected ? 'online' : 'offline');
    };
    
    checkConnection();
    
    // Update system stats periodically
    const interval = setInterval(() => {
      setSystemData(generateMockData());
    }, 3000);
    
    return () => clearInterval(interval);
  }, []);

  const handleOptimizeAll = () => {
    setIsOptimizing(true);
    toast.loading("Otimizando sistema e jogos...");
    
    // Simulate optimization process
    setTimeout(() => {
      setIsOptimizing(false);
      toast.success("Otimização concluída com sucesso!", {
        description: "Todos os jogos e configurações do sistema foram otimizados."
      });
      
      // Update games with optimized status
      setGames(prev => prev.map(game => ({...game, isOptimized: true, optimizationType: "both"})));
    }, 3000);
  };
  
  const handleScanForGames = () => {
    toast.loading("Escaneando sistema por jogos instalados...");
    
    // Simulate game scanning
    setTimeout(() => {
      toast.success("Escaneamento concluído!", {
        description: "4 jogos encontrados no seu sistema."
      });
    }, 2000);
  };

  return (
    <Layout>
      <div className="container mx-auto p-4">
        {/* Header with status */}
        <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-6">
          <div>
            <h1 className="text-3xl font-cyber font-bold text-white mb-1">GamePath AI Dashboard</h1>
            <p className="text-gray-400">Monitoramento e otimização em tempo real do seu sistema</p>
          </div>
          
          <div className="flex items-center gap-4 mt-4 md:mt-0">
            <div className={`flex items-center ${backendStatus === 'online' ? 'text-cyber-green' : 'text-red-500'}`}>
              <div className={`w-2 h-2 rounded-full mr-2 ${backendStatus === 'online' ? 'bg-cyber-green' : 'bg-red-500'}`}></div>
              <span className="text-sm font-tech">{backendStatus === 'online' ? 'Conectado' : 'Offline'}</span>
            </div>
            
            <Button 
              variant="cyber"
              onClick={handleOptimizeAll}
              disabled={isOptimizing}
              className="bg-cyber-blue/20 text-cyber-blue border border-cyber-blue/50 hover:bg-cyber-blue/30"
            >
              <Zap className="mr-2" size={16} />
              {isOptimizing ? "Otimizando..." : "Otimizar Tudo"}
            </Button>
            
            <Button 
              variant="outline" 
              onClick={handleScanForGames}
              className="border-cyber-purple/50 text-cyber-purple hover:bg-cyber-purple/20"
            >
              <Gamepad className="mr-2" size={16} />
              Escanear Jogos
            </Button>
          </div>
        </div>
        
        {/* System metrics */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
          <Card className="border-cyber-blue/30 bg-cyber-darkblue shadow-lg">
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-tech flex items-center">
                <Cpu className="mr-2 text-cyber-blue" size={16} />
                CPU
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-tech font-bold text-white">{systemData.cpu.usage}%</div>
              <Progress value={systemData.cpu.usage} className="h-1 mt-2 mb-1" />
              <div className="flex justify-between text-xs">
                <span className="text-gray-400">Temperatura</span>
                <span className="text-cyber-orange">{systemData.cpu.temperature}°C</span>
              </div>
            </CardContent>
          </Card>
          
          <Card className="border-cyber-purple/30 bg-cyber-darkblue shadow-lg">
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-tech flex items-center">
                <svg className="mr-2 text-cyber-purple" width="16" height="16" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                  <path d="M20 14V18C20 19.1046 19.1046 20 18 20H6C4.89543 20 4 19.1046 4 18V6C4 4.89543 4.89543 4 6 4H10" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                  <path d="M16 4H20V8" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                  <path d="M14 10L20 4" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                </svg>
                GPU
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-tech font-bold text-white">{systemData.gpu.usage}%</div>
              <Progress value={systemData.gpu.usage} className="h-1 mt-2 mb-1 bg-gray-700">
                <div className="h-full bg-gradient-to-r from-cyber-purple to-cyber-blue rounded-full"></div>
              </Progress>
              <div className="flex justify-between text-xs">
                <span className="text-gray-400">Temperatura</span>
                <span className="text-cyber-orange">{systemData.gpu.temperature}°C</span>
              </div>
            </CardContent>
          </Card>
          
          <Card className="border-cyber-green/30 bg-cyber-darkblue shadow-lg">
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-tech flex items-center">
                <Wifi className="mr-2 text-cyber-green" size={16} />
                Rede
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-tech font-bold text-white">{systemData.network.latency}ms</div>
              <div className="flex justify-between text-xs mt-3">
                <span className="text-gray-400">Jitter</span>
                <span className="text-cyber-green">{systemData.network.jitter}ms</span>
              </div>
              <div className="flex justify-between text-xs mt-1">
                <span className="text-gray-400">Perda de pacotes</span>
                <span className="text-cyber-green">{systemData.network.packetLoss}%</span>
              </div>
            </CardContent>
          </Card>
          
          <Card className="border-cyber-orange/30 bg-cyber-darkblue shadow-lg">
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-tech flex items-center">
                <svg className="mr-2 text-cyber-orange" width="16" height="16" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                  <path d="M3 5V19M3 5H21V19H3M3 5L9 12M3 19L9 12M21 5L15 12M21 19L15 12" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                </svg>
                Memória
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-tech font-bold text-white">{systemData.memory.usage}%</div>
              <Progress value={systemData.memory.usage} className="h-1 mt-2 mb-1 bg-gray-700">
                <div className="h-full bg-gradient-to-r from-cyber-orange to-cyber-green rounded-full"></div>
              </Progress>
              <div className="flex justify-between text-xs mt-1">
                <span className="text-gray-400">Uso</span>
                <span className="text-cyber-orange">{Math.round(16 * systemData.memory.usage / 100)} GB / 16 GB</span>
              </div>
            </CardContent>
          </Card>
        </div>
        
        {/* Main content tabs */}
        <Tabs defaultValue="games" className="mb-6">
          <TabsList className="mb-4">
            <TabsTrigger value="games" className="flex items-center">
              <Gamepad className="mr-2" size={16} />
              Jogos Detectados
            </TabsTrigger>
            <TabsTrigger value="system" className="flex items-center">
              <Cpu className="mr-2" size={16} />
              Otimização de Sistema
            </TabsTrigger>
            <TabsTrigger value="network" className="flex items-center">
              <ArrowDownUp className="mr-2" size={16} />
              Otimização de Rede
            </TabsTrigger>
            <TabsTrigger value="thermal" className="flex items-center">
              <Thermometer className="mr-2" size={16} />
              Gestão Térmica
            </TabsTrigger>
          </TabsList>
          
          <TabsContent value="games">
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
              {games.map(game => (
                <GameCard key={game.id} game={game} />
              ))}
            </div>
          </TabsContent>
          
          <TabsContent value="system">
            <OptimizationControls />
          </TabsContent>
          
          <TabsContent value="network">
            <Card className="border-cyber-blue/30 bg-cyber-darkblue shadow-lg">
              <CardHeader>
                <CardTitle>Otimização de Rede</CardTitle>
                <CardDescription>
                  Configure a otimização de rede para seus jogos
                </CardDescription>
              </CardHeader>
              <CardContent>
                <p className="text-gray-400 mb-4">
                  As configurações de rede serão implementadas em uma próxima iteração.
                </p>
                <Button variant="outline">Configurar</Button>
              </CardContent>
            </Card>
          </TabsContent>
          
          <TabsContent value="thermal">
            <Card className="border-cyber-orange/30 bg-cyber-darkblue shadow-lg">
              <CardHeader>
                <CardTitle>Gestão Térmica</CardTitle>
                <CardDescription>
                  Configure os perfis térmicos para balancear performance e temperatura
                </CardDescription>
              </CardHeader>
              <CardContent>
                <p className="text-gray-400 mb-4">
                  Os controles de gestão térmica serão implementados em uma próxima iteração.
                </p>
                <Button variant="outline">Configurar</Button>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </div>
    </Layout>
  );
};

export default MonitoringDashboard;
