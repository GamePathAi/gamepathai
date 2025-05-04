
import React, { createContext, useState, useContext, useEffect, ReactNode } from "react";

type OnboardingStep = "welcome" | "connection" | "games" | "performance" | "complete";

interface OnboardingContextType {
  isOnboardingComplete: boolean;
  currentStep: OnboardingStep;
  showOnboarding: boolean;
  nextStep: () => void;
  previousStep: () => void;
  completeOnboarding: () => void;
  skipOnboarding: () => void;
  startOnboarding: () => void;
}

const OnboardingContext = createContext<OnboardingContextType | undefined>(undefined);

interface OnboardingProviderProps {
  children: ReactNode;
}

export const OnboardingProvider: React.FC<OnboardingProviderProps> = ({ children }) => {
  const [isOnboardingComplete, setIsOnboardingComplete] = useState<boolean>(false);
  const [showOnboarding, setShowOnboarding] = useState<boolean>(false);
  const [currentStep, setCurrentStep] = useState<OnboardingStep>("welcome");

  // Verificar se o onboarding já foi concluído ao carregar
  useEffect(() => {
    const onboardingCompleted = localStorage.getItem("onboarding_completed");
    if (onboardingCompleted === "true") {
      setIsOnboardingComplete(true);
    } else {
      // Iniciar onboarding automaticamente na primeira execução
      setShowOnboarding(true);
    }
  }, []);

  const nextStep = () => {
    switch (currentStep) {
      case "welcome":
        setCurrentStep("connection");
        break;
      case "connection":
        setCurrentStep("games");
        break;
      case "games":
        setCurrentStep("performance");
        break;
      case "performance":
        setCurrentStep("complete");
        break;
      case "complete":
        completeOnboarding();
        break;
    }
  };

  const previousStep = () => {
    switch (currentStep) {
      case "connection":
        setCurrentStep("welcome");
        break;
      case "games":
        setCurrentStep("connection");
        break;
      case "performance":
        setCurrentStep("games");
        break;
      case "complete":
        setCurrentStep("performance");
        break;
    }
  };

  const completeOnboarding = () => {
    localStorage.setItem("onboarding_completed", "true");
    setIsOnboardingComplete(true);
    setShowOnboarding(false);
  };

  const skipOnboarding = () => {
    localStorage.setItem("onboarding_completed", "true");
    setIsOnboardingComplete(true);
    setShowOnboarding(false);
  };

  const startOnboarding = () => {
    setCurrentStep("welcome");
    setShowOnboarding(true);
  };

  return (
    <OnboardingContext.Provider
      value={{
        isOnboardingComplete,
        currentStep,
        showOnboarding,
        nextStep,
        previousStep,
        completeOnboarding,
        skipOnboarding,
        startOnboarding
      }}
    >
      {children}
    </OnboardingContext.Provider>
  );
};

export const useOnboarding = () => {
  const context = useContext(OnboardingContext);
  if (context === undefined) {
    throw new Error("useOnboarding must be used within an OnboardingProvider");
  }
  return context;
};
