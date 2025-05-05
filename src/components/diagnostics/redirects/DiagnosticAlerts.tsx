
import React from 'react';
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { AlertCircle, CheckCircle, ShieldAlert } from "lucide-react";
import { RedirectTest } from './RedirectTestResult';

interface DiagnosticAlertsProps {
  testResults: RedirectTest[];
  connectionStatus: 'unknown' | 'online' | 'offline';
  diagnoseComplete: boolean;
}

const DiagnosticAlerts: React.FC<DiagnosticAlertsProps> = ({ 
  testResults, 
  connectionStatus, 
  diagnoseComplete 
}) => {
  if (!diagnoseComplete) return null;
  
  const hasRedirects = testResults.some(r => r.redirected && r.isGamePathAI);
  const isOffline = connectionStatus === 'offline';
  const hasSafeStatus = !hasRedirects && diagnoseComplete;
  
  return (
    <div className="space-y-4">
      {hasRedirects && (
        <Alert variant="destructive">
          <AlertCircle className="h-4 w-4" />
          <AlertTitle>Redirecionamentos Detectados</AlertTitle>
          <AlertDescription>
            Foram detectados redirecionamentos para gamepathai.com. 
            Isso pode estar causando problemas nas requisições ML.
          </AlertDescription>
        </Alert>
      )}
      
      {isOffline && (
        <Alert variant="destructive">
          <ShieldAlert className="h-4 w-4" />
          <AlertTitle>Conexão Backend Indisponível</AlertTitle>
          <AlertDescription>
            Não foi possível estabelecer conexão com o backend. 
            O aplicativo está operando em modo offline com dados mockados.
          </AlertDescription>
        </Alert>
      )}
      
      {hasSafeStatus && (
        <Alert variant="default" className="bg-green-900/20 border-green-500">
          <CheckCircle className="h-4 w-4 text-green-500" />
          <AlertTitle className="text-green-500">Sem Redirecionamentos Problemáticos</AlertTitle>
          <AlertDescription>
            Não foram detectados redirecionamentos prejudiciais. 
            As requisições ML devem funcionar corretamente.
          </AlertDescription>
        </Alert>
      )}
    </div>
  );
};

export default DiagnosticAlerts;
