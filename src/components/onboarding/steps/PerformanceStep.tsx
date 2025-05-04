
import React, { useState, useEffect } from "react";
import { motion } from "framer-motion";
import { Zap, Activity, Cpu, BarChart2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import { Slider } from "@/components/ui/slider";

const PerformanceStep: React.FC = () => {
  const [optimizationLevel, setOptimizationLevel] = useState([50]);
  const [analyzingSystem, setAnalyzingSystem] = useState(false);
  const [systemAnalyzed, setSystemAnalyzed] = useState(false);
  const [progress, setProgress] = useState(0);
  const [systemSpecs, setSystemSpecs] = useState<{
    cpu: string;
    gpu: string;
    ram: string;
    score: number;
  } | null>(null);
  
  const analyzeSystem = () => {
    setAnalyzingSystem(true);
    setProgress(0);
    
    // Simular análise do sistema
    const interval = setInterval(() => {
      setProgress(prev => {
        const newProgress = prev + 10;
        if (newProgress >= 100) {
          clearInterval(interval);
          setAnalyzingSystem(false);
          setSystemAnalyzed(true);
          
          // Simular detecção de especificações
          setSystemSpecs({
            cpu: "AMD Ryzen 7 5800X",
            gpu: "NVIDIA GeForce RTX 3070",
            ram: "32GB DDR4 3600MHz",
            score: 83
          });
          
          return 100;
        }
        return newProgress;
      });
    }, 250);
  };
  
  return (
    <div className="flex flex-col p-10 h-[500px]">
      <motion.div 
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="mb-8"
      >
        <h2 className="text-2xl font-tech font-bold text-white mb-2">Otimização de Desempenho</h2>
        <p className="text-gray-300">
          Configure como o GamePath AI gerenciará os recursos do seu sistema para obter o melhor desempenho nos jogos.
        </p>
      </motion.div>
      
      <div className="grid grid-cols-2 gap-6 mb-6">
        <div className="col-span-2 md:col-span-1">
          <motion.div 
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.2 }}
            className="bg-cyber-darkblue/30 border border-cyber-blue/20 rounded-lg p-6 h-full"
          >
            <div className="flex items-center gap-3 mb-6">
              <div className="bg-cyber-blue/20 p-2 rounded-full">
                <Activity className="text-cyber-blue h-5 w-5" />
              </div>
              <div>
                <h3 className="font-semibold text-white">Nível de Otimização</h3>
                <p className="text-xs text-gray-400">Ajuste o balanceamento entre desempenho e consumo de energia</p>
              </div>
            </div>
            
            <div className="space-y-6">
              <div>
                <div className="flex justify-between text-xs mb-2">
                  <span className="text-gray-400">Economia de energia</span>
                  <span className="text-gray-400">Desempenho máximo</span>
                </div>
                <Slider
                  value={optimizationLevel}
                  onValueChange={setOptimizationLevel}
                  max={100}
                  step={1}
                  className="my-4"
                />
                <div className="flex justify-center">
                  <div className="bg-cyber-blue/20 text-cyber-blue px-3 py-1 rounded-full text-xs">
                    {optimizationLevel[0] < 25 ? 'Economia de energia' : 
                     optimizationLevel[0] < 50 ? 'Balanceado' : 
                     optimizationLevel[0] < 75 ? 'Performance' : 
                     'Desempenho máximo'}
                  </div>
                </div>
              </div>
              
              <div className="space-y-2">
                <p className="text-sm text-gray-300 font-medium">Recursos a serem otimizados:</p>
                <div className="grid grid-cols-2 gap-2 text-sm">
                  <div className="flex items-center gap-2">
                    <div className="w-3 h-3 rounded-full bg-cyber-purple"></div>
                    <span className="text-gray-300">CPU</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <div className="w-3 h-3 rounded-full bg-cyber-blue"></div>
                    <span className="text-gray-300">GPU</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <div className="w-3 h-3 rounded-full bg-cyber-green"></div>
                    <span className="text-gray-300">Memória</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <div className="w-3 h-3 rounded-full bg-cyber-orange"></div>
                    <span className="text-gray-300">Rede</span>
                  </div>
                </div>
              </div>
            </div>
          </motion.div>
        </div>
        
        <div className="col-span-2 md:col-span-1">
          <motion.div 
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.4 }}
            className="bg-cyber-darkblue/30 border border-cyber-blue/20 rounded-lg p-6 h-full"
          >
            <div className="flex items-center gap-3 mb-6">
              <div className="bg-cyber-blue/20 p-2 rounded-full">
                <Cpu className="text-cyber-blue h-5 w-5" />
              </div>
              <div>
                <h3 className="font-semibold text-white">Hardware Detectado</h3>
                <p className="text-xs text-gray-400">Detecção automática das especificações do seu sistema</p>
              </div>
            </div>
            
            {!systemAnalyzed ? (
              <div className="space-y-4">
                {analyzingSystem && (
                  <div className="mb-6">
                    <div className="flex justify-between text-xs text-gray-400 mb-1">
                      <span>Analisando sistema</span>
                      <span>{progress}%</span>
                    </div>
                    <Progress value={progress} className="h-2" />
                  </div>
                )}
                
                <Button 
                  variant="cyberAction"
                  className="w-full"
                  onClick={analyzeSystem}
                  disabled={analyzingSystem}
                >
                  {analyzingSystem ? (
                    <>
                      <BarChart2 className="mr-2 h-4 w-4 animate-pulse" />
                      Analisando...
                    </>
                  ) : (
                    <>
                      <BarChart2 className="mr-2 h-4 w-4" />
                      Analisar Sistema
                    </>
                  )}
                </Button>
              </div>
            ) : (
              <div className="space-y-4">
                <div className="space-y-3">
                  <div className="flex justify-between">
                    <span className="text-gray-400 text-sm">CPU:</span>
                    <span className="text-white text-sm font-medium">{systemSpecs?.cpu}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-400 text-sm">GPU:</span>
                    <span className="text-white text-sm font-medium">{systemSpecs?.gpu}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-400 text-sm">RAM:</span>
                    <span className="text-white text-sm font-medium">{systemSpecs?.ram}</span>
                  </div>
                </div>
                
                <div className="flex flex-col items-center pt-2">
                  <div className="relative mb-2">
                    <svg className="w-24 h-24">
                      <circle
                        cx="48"
                        cy="48"
                        r="36"
                        stroke="rgba(139, 92, 246, 0.2)"
                        strokeWidth="8"
                        fill="transparent"
                      />
                      <circle
                        cx="48"
                        cy="48"
                        r="36"
                        stroke="#8B5CF6"
                        strokeWidth="8"
                        fill="transparent"
                        strokeDasharray={`${2 * Math.PI * 36}`}
                        strokeDashoffset={`${2 * Math.PI * 36 * (1 - (systemSpecs?.score || 0) / 100)}`}
                        strokeLinecap="round"
                        style={{ transition: "stroke-dashoffset 1s" }}
                      />
                    </svg>
                    <div className="absolute inset-0 flex items-center justify-center">
                      <span className="text-2xl font-bold text-white">{systemSpecs?.score}</span>
                    </div>
                  </div>
                  <p className="text-sm font-medium text-cyber-blue">Pontuação de Desempenho</p>
                  <p className="text-xs text-gray-400">Baseado nas suas especificações de hardware</p>
                </div>
              </div>
            )}
          </motion.div>
        </div>
      </div>
      
      <motion.div 
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 0.6 }}
        className="text-sm text-gray-400"
      >
        <p className="flex items-center">
          <Zap className="h-4 w-4 mr-2 text-cyber-blue" />
          <span>Estas configurações podem ser alteradas posteriormente nas configurações do aplicativo.</span>
        </p>
      </motion.div>
    </div>
  );
};

export default PerformanceStep;
