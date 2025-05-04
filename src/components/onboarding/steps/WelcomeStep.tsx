
import React from "react";
import { motion } from "framer-motion";
import { useOnboarding } from "@/contexts/OnboardingContext";
import GamePathLogo from "@/components/GamePathLogo";

const WelcomeStep: React.FC = () => {
  const { nextStep } = useOnboarding();
  
  return (
    <div className="flex flex-col items-center justify-center p-10 text-center h-[500px]">
      <motion.div 
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
        className="mb-8 scale-150"
      >
        <GamePathLogo size={80} />
      </motion.div>
      
      <motion.h2 
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ duration: 0.5, delay: 0.2 }}
        className="text-3xl font-tech font-bold text-white mb-4"
      >
        Bem-vindo ao GamePath AI
      </motion.h2>
      
      <motion.p 
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ duration: 0.5, delay: 0.4 }}
        className="text-gray-300 max-w-lg mb-8"
      >
        Sua solução definitiva para otimizar sua experiência de jogo e melhorar sua conexão com servidores de jogos. Vamos configurar rapidamente o GamePath AI para você começar.
      </motion.p>
      
      <motion.div 
        initial={{ opacity: 0, scale: 0.9 }}
        animate={{ opacity: 1, scale: 1 }}
        transition={{ duration: 0.5, delay: 0.6 }}
        className="grid grid-cols-4 gap-4 w-full max-w-2xl"
      >
        {["Otimização de Rotas", "Detecção de Jogos", "Monitoramento de Desempenho", "Integração AWS"].map((feature, index) => (
          <div 
            key={feature} 
            className="bg-cyber-darkblue/50 border border-cyber-blue/20 rounded-lg p-3 text-center"
          >
            <p className="text-sm text-cyber-blue font-tech">{feature}</p>
          </div>
        ))}
      </motion.div>
    </div>
  );
};

export default WelcomeStep;
