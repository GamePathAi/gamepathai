
import React, { useState } from 'react';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { AlertCircle, CheckCircle, Network, ShieldAlert } from "lucide-react";
import { mlUrlDiagnostics } from '@/services/ml/mlUrlDiagnostics';
import { testAWSConnection } from '@/services/api';
import { testBackendConnection } from '@/services/api';
import { detectRedirectScripts, setupNavigationMonitor } from '@/utils/url';

interface RedirectTest {
  url: string;
  redirected: boolean;
  target?: string;
  isGamePathAI?: boolean;
  status?: number;
}

const RedirectsDiagnostic: React.FC = () => {
  const [urlToTest, setUrlToTest] = useState<string>('/health');
  const [isRunningTests, setIsRunningTests] = useState(false);
  const [testResults, setTestResults] = useState<RedirectTest[]>([]);
  const [connectionStatus, setConnectionStatus] = useState<'unknown' | 'online' | 'offline'>('unknown');
  const [diagnoseComplete, setDiagnoseComplete] = useState(false);

  const runDiagnostics = async () => {
    setIsRunningTests(true);
    setTestResults([]);
    
    // First detect any redirect scripts in the DOM
    detectRedirectScripts();
    
    // Test API connection
    const backendConnected = await testBackendConnection();
    setConnectionStatus(backendConnected ? 'online' : 'offline');
    
    // Run URL tests
    const results: RedirectTest[] = [];
    
    // Test standard API endpoint
    try {
      const healthResult = await mlUrlDiagnostics.testUrl('/health');
      results.push({
        url: '/health',
        redirected: healthResult.wasRedirected,
        target: healthResult.finalUrl,
        isGamePathAI: healthResult.isGamePathAI,
        status: healthResult.responseStatus
      });
    } catch (error) {
      results.push({
        url: '/health',
        redirected: true,
        target: 'Error testing URL',
        isGamePathAI: false
      });
    }
    
    // Test API endpoint directly
    try {
      // Use relative path instead of absolute URL
      const apiResult = await mlUrlDiagnostics.testUrl('/health');
      results.push({
        url: 'API Direct (/health)',
        redirected: apiResult.wasRedirected,
        target: apiResult.finalUrl,
        isGamePathAI: apiResult.isGamePathAI,
        status: apiResult.responseStatus
      });
    } catch (error) {
      results.push({
        url: 'API Direct (/health)',
        redirected: true,
        target: 'Error testing URL',
        isGamePathAI: false
      });
    }
    
    // Test localhost directly (common issue source) - only for diagnostic purposes
    try {
      // Using relative path instead of hardcoded URL
      const localhostResult = await mlUrlDiagnostics.testUrl('/health');
      results.push({
        url: 'Local API Test',
        redirected: localhostResult.wasRedirected,
        target: localhostResult.finalUrl,
        isGamePathAI: localhostResult.isGamePathAI,
        status: localhostResult.responseStatus
      });
    } catch (error) {
      results.push({
        url: 'Local API Test',
        redirected: true,
        target: 'Error testing URL',
        isGamePathAI: false
      });
    }
    
    // Test ML endpoint
    try {
      const mlResult = await mlUrlDiagnostics.testUrl('/ml/health');
      results.push({
        url: '/ml/health',
        redirected: mlResult.wasRedirected,
        target: mlResult.finalUrl,
        isGamePathAI: mlResult.isGamePathAI,
        status: mlResult.responseStatus
      });
    } catch (error) {
      results.push({
        url: '/ml/health',
        redirected: true,
        target: 'Error testing URL',
        isGamePathAI: false
      });
    }
    
    // Custom URL test if provided
    if (urlToTest && urlToTest !== '/health' && urlToTest !== '/ml/health') {
      try {
        const customResult = await mlUrlDiagnostics.testUrl(urlToTest);
        results.push({
          url: urlToTest,
          redirected: customResult.wasRedirected,
          target: customResult.finalUrl,
          isGamePathAI: customResult.isGamePathAI,
          status: customResult.responseStatus
        });
      } catch (error) {
        results.push({
          url: urlToTest,
          redirected: true,
          target: 'Error testing URL',
          isGamePathAI: false
        });
      }
    }
    
    setTestResults(results);
    setIsRunningTests(false);
    setDiagnoseComplete(true);
    
    // Setup navigation monitor
    setupNavigationMonitor();
  };

  return (
    <Card className="w-full">
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Network className="h-5 w-5" />
          Diagnóstico de Redirecionamento
        </CardTitle>
        <CardDescription>
          Teste e diagnostique problemas de redirecionamento nas requisições de API
        </CardDescription>
      </CardHeader>
      <CardContent>
        <div className="space-y-4">
          {diagnoseComplete && testResults.some(r => r.redirected && r.isGamePathAI) && (
            <Alert variant="destructive">
              <AlertCircle className="h-4 w-4" />
              <AlertTitle>Redirecionamentos Detectados</AlertTitle>
              <AlertDescription>
                Foram detectados redirecionamentos para gamepathai.com. 
                Isso pode estar causando problemas nas requisições ML.
              </AlertDescription>
            </Alert>
          )}
          
          {diagnoseComplete && connectionStatus === 'offline' && (
            <Alert variant="destructive">
              <ShieldAlert className="h-4 w-4" />
              <AlertTitle>Conexão Backend Indisponível</AlertTitle>
              <AlertDescription>
                Não foi possível estabelecer conexão com o backend. 
                O aplicativo está operando em modo offline com dados mockados.
              </AlertDescription>
            </Alert>
          )}
          
          {diagnoseComplete && !testResults.some(r => r.redirected && r.isGamePathAI) && (
            <Alert variant="default" className="bg-green-900/20 border-green-500">
              <CheckCircle className="h-4 w-4 text-green-500" />
              <AlertTitle className="text-green-500">Sem Redirecionamentos Problemáticos</AlertTitle>
              <AlertDescription>
                Não foram detectados redirecionamentos prejudiciais. 
                As requisições ML devem funcionar corretamente.
              </AlertDescription>
            </Alert>
          )}
          
          <div className="flex space-x-2">
            <Input
              placeholder="URL para testar (ex: /api/health)"
              value={urlToTest}
              onChange={(e) => setUrlToTest(e.target.value)}
            />
            <Button 
              onClick={runDiagnostics}
              disabled={isRunningTests}
              variant="outline"
            >
              {isRunningTests ? 'Testando...' : 'Testar'}
            </Button>
          </div>
          
          <div className="mt-4">
            <h3 className="text-sm font-medium mb-2">Resultados dos testes:</h3>
            
            <div className="space-y-2">
              {testResults.map((result, index) => (
                <div key={index} className="text-xs border rounded-md p-2">
                  <div className="flex justify-between mb-1">
                    <span className="font-medium">{result.url}</span>
                    <span className={result.redirected ? 
                      (result.isGamePathAI ? "text-red-500" : "text-amber-500") : 
                      "text-green-500"}
                    >
                      {result.redirected ? 
                        (result.isGamePathAI ? "Redirecionado (gamepathai.com)" : "Redirecionado") : 
                        "Sem redirecionamento"}
                    </span>
                  </div>
                  {result.redirected && (
                    <div className="text-gray-400">
                      Destino: {result.target}
                    </div>
                  )}
                  {result.status && (
                    <div className="text-gray-400">
                      Status: {result.status}
                    </div>
                  )}
                </div>
              ))}
              
              {testResults.length === 0 && !isRunningTests && diagnoseComplete && (
                <div className="text-center py-2 text-gray-500 text-sm">
                  Nenhum teste realizado
                </div>
              )}
              
              {isRunningTests && (
                <div className="text-center py-2 text-gray-500 text-sm">
                  Executando testes...
                </div>
              )}
            </div>
          </div>
        </div>
      </CardContent>
      <CardFooter className="text-xs text-gray-500">
        Ferramenta para diagnosticar problemas de redirecionamento na aplicação
      </CardFooter>
    </Card>
  );
};

export default RedirectsDiagnostic;
