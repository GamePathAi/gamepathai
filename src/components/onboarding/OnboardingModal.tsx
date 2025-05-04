
import React, { useState, useEffect } from "react";
import {
  Dialog,
  DialogContent,
  DialogFooter,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { useOnboarding } from "@/contexts/OnboardingContext";
import WelcomeStep from "./steps/WelcomeStep";
import ConnectionStep from "./steps/ConnectionStep";
import GamesStep from "./steps/GamesStep";
import PerformanceStep from "./steps/PerformanceStep";
import CompleteStep from "./steps/CompleteStep";
import { ArrowLeft, ArrowRight } from "lucide-react";

const OnboardingModal: React.FC = () => {
  const { 
    currentStep, 
    showOnboarding, 
    nextStep, 
    previousStep, 
    skipOnboarding 
  } = useOnboarding();
  
  // Previne que o modal seja fechado clicando fora
  const [open, setOpen] = useState(false);
  
  useEffect(() => {
    setOpen(showOnboarding);
  }, [showOnboarding]);
  
  const renderStep = () => {
    switch (currentStep) {
      case "welcome":
        return <WelcomeStep />;
      case "connection":
        return <ConnectionStep />;
      case "games":
        return <GamesStep />;
      case "performance":
        return <PerformanceStep />;
      case "complete":
        return <CompleteStep />;
      default:
        return <WelcomeStep />;
    }
  };
  
  const isFirstStep = currentStep === "welcome";
  const isLastStep = currentStep === "complete";
  
  return (
    <Dialog open={open} onOpenChange={(open) => {
      if (!open) {
        // Permitir fechar apenas através dos botões
        return;
      }
      setOpen(open);
    }}>
      <DialogContent className="max-w-4xl bg-cyber-darkblue border-cyber-blue/30 p-0 overflow-hidden">
        <div className="relative h-full w-full">
          {renderStep()}
          
          <DialogFooter className="flex justify-between p-6 border-t border-cyber-blue/20">
            <div className="flex items-center gap-4">
              {!isFirstStep && (
                <Button 
                  variant="outline" 
                  onClick={previousStep}
                  className="gap-2"
                >
                  <ArrowLeft size={16} />
                  Anterior
                </Button>
              )}
              
              <Button 
                variant="link" 
                onClick={skipOnboarding}
                className="text-gray-400 hover:text-white"
              >
                Pular Introdução
              </Button>
            </div>
            
            <Button 
              variant="cyberAction" 
              onClick={nextStep}
              className="gap-2"
            >
              {isLastStep ? "Começar" : "Próximo"}
              {!isLastStep && <ArrowRight size={16} />}
            </Button>
          </DialogFooter>
        </div>
      </DialogContent>
    </Dialog>
  );
};

export default OnboardingModal;
