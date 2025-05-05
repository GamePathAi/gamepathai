import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Loader2, Shield, AlertTriangle, CheckCircle } from 'lucide-react';
import { toast } from 'sonner';
import { mlDiagnostics, MLRedirectProtectionResult, MLConnectivityTestResult } from '@/services/ml';
import { mlNetworkFixer } from '@/services/ml/networkFixer';

interface ConnectionDiagnosticsProps {
  onClose?: () => void;
}

const ConnectionDiagnostics: React.FC<ConnectionDiagnosticsProps> = ({ onClose }) => {
  const [isLoading, setIsLoading] = useState(false);
  const [testResults, setTestResults] = useState<MLConnectivityTestResult | null>(null);
  const [redirectProtection, setRedirectProtection] = useState<MLRedirectProtectionResult | null>(null);
  const [isFixing, setIsFixing] = useState(false);

  useEffect(() => {
    runDiagnostics();
  }, []);

  const runDiagnostics = async () => {
    setIsLoading(true);
    try {
      // Run connectivity tests
      const results = await mlDiagnostics.runDiagnostics();
      setTestResults(results);
      
      // Test redirect protection
      const protectionTest = await mlDiagnostics.testRedirectProtection('/api/ml/health');
      setRedirectProtection(protectionTest);
      
      if (!results.success) {
        toast.error("Problemas de conectividade detectados", {
          description: "Verifique os resultados do diagnóstico para mais detalhes"
        });
      } else {
        toast.success("Diagnóstico concluído", {
          description: "Todos os testes de conectividade passaram"
        });
      }
    } catch (error) {
      console.error("Erro ao executar diagnósticos:", error);
      toast.error("Erro ao executar diagnósticos", {
        description: "Não foi possível completar os testes de conectividade"
      });
    } finally {
      setIsLoading(false);
    }
  };

  const attemptFix = async () => {
    setIsFixing(true);
    toast.loading("Tentando corrigir problemas de conectividade...");
    
    try {
      const result = await mlNetworkFixer.diagnoseAndFix();
      
      if (result.success) {
        toast.success("Problemas corrigidos", {
          description: result.message
        });
        // Re-run diagnostics to confirm fix
        await runDiagnostics();
      } else {
        toast.error("Não foi possível corrigir todos os problemas", {
          description: result.recommendedAction || result.message
        });
      }
    } catch (error) {
      console.error("Erro ao tentar corrigir problemas:", error);
      toast.error("Erro ao tentar corrigir problemas", {
        description: "Ocorreu um erro inesperado durante a tentativa de correção"
      });
    } finally {
      setIsFixing(false);
    }
  };

  const getStatusIcon = (success: boolean) => {
    if (success) {
      return <CheckCircle className="h-4 w-4 text-green-500" />;
    }
    return <AlertTriangle className="h-4 w-4 text-amber-500" />;
  };

  return (
    <Card className="border-cyber-blue/30 bg-cyber-darkblue/90">
      <CardHeader className="pb-2">
        <CardTitle className="flex items-center text-cyber-blue">
          <Shield className="mr-2" size={18} />
          Diagnóstico de Conectividade ML
        </CardTitle>
      </CardHeader>
      <CardContent>
        <div className="space-y-4">
          {isLoading ? (
            <div className="flex flex-col items-center justify-center py-8">
              <Loader2 className="h-8 w-8 animate-spin text-cyber-blue mb-2" />
              <p className="text-sm text-gray-400">Executando diagnósticos...</p>
            </div>
          ) : (
            <>
              <div className="space-y-3">
                <h3 className="text-sm font-semibold text-gray-200">Resultados do Teste</h3>
                
                {testResults && (
                  <div className="space-y-2">
                    <div className="flex items-center justify-between text-xs">
                      <span>Conectividade Geral:</span>
                      <span className={`flex items-center ${testResults.success ? 'text-green-500' : 'text-amber-500'}`}>
                        {testResults.success ? 'Conectado' : 'Problemas Detectados'}
                        {getStatusIcon(testResults.success)}
                      </span>
                    </div>
                    
                    {testResults.results && Object.entries(testResults.results).map(([key, value]) => (
                      <div key={key} className="flex items-center justify-between text-xs">
                        <span>{key}:</span>
                        <span className={`flex items-center ${value.success ? 'text-green-500' : 'text-amber-500'}`}>
                          {value.success ? 'OK' : value.error || 'Falha'}
                          {getStatusIcon(value.success)}
                        </span>
                      </div>
                    ))}
                  </div>
                )}
                
                {redirectProtection && (
                  <div className="mt-4 space-y-2">
                    <h3 className="text-sm font-semibold text-gray-200">Proteção contra Redirecionamentos</h3>
                    <div className="flex items-center justify-between text-xs">
                      <span>Status:</span>
                      <span className={`flex items-center ${redirectProtection.protected ? 'text-green-500' : 'text-red-500'}`}>
                        {redirectProtection.protected ? 'Protegido' : 'Vulnerável'}
                        {getStatusIcon(redirectProtection.protected)}
                      </span>
                    </div>
                    <div className="text-xs text-gray-400 mt-1">
                      {redirectProtection.details}
                    </div>
                  </div>
                )}
              </div>
              
              <div className="flex justify-between pt-4">
                <Button 
                  variant="outline" 
                  size="sm" 
                  onClick={runDiagnostics}
                  disabled={isLoading || isFixing}
                >
                  Executar Novamente
                </Button>
                
                {testResults && !testResults.success && (
                  <Button 
                    variant="default" 
                    size="sm"
                    onClick={attemptFix}
                    disabled={isLoading || isFixing}
                    className="bg-cyber-blue hover:bg-cyber-blue/80"
                  >
                    {isFixing ? (
                      <>
                        <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                        Corrigindo...
                      </>
                    ) : (
                      'Tentar Corrigir'
                    )}
                  </Button>
                )}
                
                {onClose && (
                  <Button 
                    variant="ghost" 
                    size="sm"
                    onClick={onClose}
                  >
                    Fechar
                  </Button>
                )}
              </div>
            </>
          )}
        </div>
      </CardContent>
    </Card>
  );
};

export default ConnectionDiagnostics;
