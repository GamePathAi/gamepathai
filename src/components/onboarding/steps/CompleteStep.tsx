
import React from "react";
import { motion } from "framer-motion";
import { Check, Sparkles } from "lucide-react";
import GamePathLogo from "@/components/GamePathLogo";
import { cn } from "@/lib/utils";

const CompleteStep: React.FC = () => {
  const completedSteps = [
    { title: "Conexão com Servidores", description: "Conectado com sucesso" },
    { title: "Detecção de Jogos", description: "4 jogos detectados" },
    { title: "Análise de Sistema", description: "Hardware analisado" },
    { title: "Otimização Configurada", description: "Pronto para usar" }
  ];
  
  return (
    <div className="flex flex-col items-center justify-center p-10 h-[500px] relative overflow-hidden">
      {/* Background animation */}
      <div className="absolute inset-0 bg-gradient-to-br from-cyber-purple/20 to-cyber-blue/30 opacity-30" />
      
      {/* Particles */}
      {Array.from({ length: 20 }).map((_, i) => (
        <motion.div
          key={i}
          className="absolute bg-cyber-blue rounded-full w-1 h-1"
          initial={{ 
            x: Math.random() * 800 - 400, 
            y: Math.random() * 600 - 300,
            opacity: 0 
          }}
          animate={{ 
            x: Math.random() * 800 - 400, 
            y: Math.random() * 600 - 300,
            opacity: [0, 0.5, 0],
            scale: [0, 1, 0]
          }}
          transition={{ 
            duration: 3 + Math.random() * 2, 
            repeat: Infinity,
            repeatType: "loop",
            ease: "easeInOut",
            delay: Math.random() * 2
          }}
        />
      ))}
      
      <motion.div 
        initial={{ scale: 0.8, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        transition={{ duration: 0.6 }}
        className="relative z-10"
      >
        <div className="rounded-full bg-gradient-to-br from-cyber-purple to-cyber-blue p-6 mb-6">
          <Sparkles className="h-12 w-12 text-white" />
        </div>
      </motion.div>
      
      <motion.h2 
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5, delay: 0.3 }}
        className="text-3xl font-tech font-bold text-white mb-4 text-center relative z-10"
      >
        Configuração Concluída!
      </motion.h2>
      
      <motion.p 
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ duration: 0.5, delay: 0.5 }}
        className="text-gray-300 max-w-lg mb-8 text-center relative z-10"
      >
        O GamePath AI está pronto para otimizar sua experiência de jogo. Você pode começar a usar todas as funcionalidades agora.
      </motion.p>
      
      <motion.div 
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5, delay: 0.7 }}
        className="grid grid-cols-2 gap-4 w-full max-w-lg relative z-10"
      >
        {completedSteps.map((step, index) => (
          <motion.div
            key={step.title}
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.3, delay: 0.8 + index * 0.1 }}
            className={cn(
              "flex items-start gap-3 rounded-lg p-4",
              "border border-cyber-blue/30 bg-cyber-darkblue/40 backdrop-blur-sm"
            )}
          >
            <div className="bg-cyber-green/20 rounded-full p-1 mt-0.5">
              <Check className="h-4 w-4 text-cyber-green" />
            </div>
            <div>
              <h3 className="text-sm font-medium text-white">{step.title}</h3>
              <p className="text-xs text-gray-400">{step.description}</p>
            </div>
          </motion.div>
        ))}
      </motion.div>
      
      <motion.div 
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ duration: 0.5, delay: 1.2 }}
        className="mt-8 text-center relative z-10"
      >
        <GamePathLogo size={40} className="mx-auto mb-2" />
        <p className="text-sm text-cyber-blue">
          Aproveite o GamePath AI!
        </p>
      </motion.div>
    </div>
  );
};

export default CompleteStep;
