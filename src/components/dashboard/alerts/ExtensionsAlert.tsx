
import React from "react";
import { AlertTriangle } from "lucide-react";
import { Alert, AlertTitle, AlertDescription } from "@/components/ui/alert";
import { Button } from "@/components/ui/button";

interface ExtensionsAlertProps {
  extensions: string[];
  onShowDiagnostics: () => void;
}

const ExtensionsAlert: React.FC<ExtensionsAlertProps> = ({ extensions, onShowDiagnostics }) => {
  return (
    <Alert variant="destructive" className="mb-4 bg-red-900/20 border-red-500/50">
      <AlertTriangle className="h-4 w-4" />
      <AlertTitle>Possível interferência detectada</AlertTitle>
      <AlertDescription>
        <p>
          Algumas extensões do navegador podem estar interferindo com o GamePath AI.
          Considere desativá-las temporariamente para melhor desempenho.
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

export default ExtensionsAlert;
