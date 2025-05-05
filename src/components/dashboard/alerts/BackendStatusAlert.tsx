
import React from "react";
import { AlertTriangle } from "lucide-react";
import { Alert, AlertTitle, AlertDescription } from "@/components/ui/alert";
import { Button } from "@/components/ui/button";

interface BackendStatusAlertProps {
  handleRetryConnection: () => void;
}

const BackendStatusAlert: React.FC<BackendStatusAlertProps> = ({ handleRetryConnection }) => {
  return (
    <Alert variant="default" className="mb-4 alert-offline">
      <AlertTriangle className="h-4 w-4 alert-offline-text" />
      <AlertTitle className="alert-offline-text">Modo offline ativado</AlertTitle>
      <AlertDescription className="flex items-center justify-between">
        <span>
          Não foi possível conectar ao servidor. Usando dados simulados temporariamente.
        </span>
        <Button variant="outline" size="sm" onClick={handleRetryConnection} className="border-amber-500/50 text-amber-500">
          Tentar Reconectar
        </Button>
      </AlertDescription>
    </Alert>
  );
};

export default BackendStatusAlert;
