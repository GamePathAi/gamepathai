
import React, { useState } from 'react';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Network } from "lucide-react";
import { mlUrlDiagnostics } from '@/services/ml/mlUrlDiagnostics';
import { testAWSConnection, testBackendConnection } from '@/services/api';
import { detectRedirectScripts, setupNavigationMonitor } from '@/utils/url';

// Import the newly created components
import DiagnosticAlerts from './redirects/DiagnosticAlerts';
import DiagnosticForm from './redirects/DiagnosticForm';
import TestResultsList from './redirects/TestResultsList';
import { RedirectTest } from './redirects/RedirectTestResult';

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
          {/* Diagnostic alerts component */}
          <DiagnosticAlerts 
            testResults={testResults}
            connectionStatus={connectionStatus}
            diagnoseComplete={diagnoseComplete}
          />
          
          {/* Diagnostic form component */}
          <DiagnosticForm 
            urlToTest={urlToTest}
            setUrlToTest={setUrlToTest}
            runDiagnostics={runDiagnostics}
            isRunningTests={isRunningTests}
          />
          
          {/* Test results list component */}
          <TestResultsList 
            results={testResults}
            isRunningTests={isRunningTests}
            diagnoseComplete={diagnoseComplete}
          />
        </div>
      </CardContent>
      <CardFooter className="text-xs text-gray-500">
        Ferramenta para diagnosticar problemas de redirecionamento na aplicação
      </CardFooter>
    </Card>
  );
};

export default RedirectsDiagnostic;
