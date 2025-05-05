
import React from "react";
import { AlertTriangle } from "lucide-react";
import { Alert, AlertTitle, AlertDescription } from "@/components/ui/alert";
import { Button } from "@/components/ui/button";

interface RedirectsAlertProps {
  onShowDiagnostics: () => void;
}

const RedirectsAlert: React.FC<RedirectsAlertProps> = ({ onShowDiagnostics }) => {
  return (
    <Alert variant="destructive" className="mb-4 bg-red-900/20 border-red-500/50">
      <AlertTriangle className="h-4 w-4" />
      <AlertTitle>Scripts de redirecionamento detectados</AlertTitle>
      <AlertDescription>
        <p>
          Foram detectados scripts que podem estar causando redirecionamentos.
          Isso pode afetar o funcionamento das otimizações ML.
        </p>
        <Button 
          variant="link" 
          className="text-red-400 p-0 mt-1" 
          onClick={onShowDiagnostics}
        >
          Ver diagnósticos
        </Button>
      </AlertDescription>
    </Alert>
  );
};

export default RedirectsAlert;
