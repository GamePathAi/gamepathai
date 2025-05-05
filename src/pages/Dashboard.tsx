
import React, { useState, useEffect } from "react";
import { toast } from "sonner";
import { testBackendConnection } from "@/services/api";
import { mlDiagnostics } from "@/services/mlApiClient";
import { detectRedirectScripts, setupNavigationMonitor } from "@/utils/url";
import ConnectionOptimizer from "@/components/ConnectionOptimizer";
import RouteOptimizer from "@/components/RouteOptimizer";

// Import refactored dashboard components
import DashboardMetrics from "@/components/dashboard/DashboardMetrics";
import GamesList from "@/components/dashboard/GamesList";
import SystemMetrics from "@/components/dashboard/SystemMetrics";
import PremiumFeatures from "@/components/dashboard/PremiumFeatures";
import MLDiagnosticsPanel from "@/components/diagnostics/MLDiagnosticsPanel";

// Import newly created components
import BackendStatusAlert from "@/components/dashboard/alerts/BackendStatusAlert";
import RedirectsAlert from "@/components/dashboard/alerts/RedirectsAlert";
import ExtensionsAlert from "@/components/dashboard/alerts/ExtensionsAlert";
import DashboardHeader from "@/components/dashboard/DashboardHeader";
import DiagnosticsToggleButton from "@/components/dashboard/DiagnosticsToggleButton";

const Dashboard: React.FC = () => {
  const [isOptimizing, setIsOptimizing] = useState(false);
  const [backendStatus, setBackendStatus] = useState<'online' | 'offline' | 'checking'>('checking');
  const [showMlDiagnostics, setShowMlDiagnostics] = useState(false);
  const [interfereingExtensions, setInterfereingExtensions] = useState<string[]>([]);
  const [redirectsDetected, setRedirectsDetected] = useState(false);
  
  useEffect(() => {
    const checkBackendStatus = async () => {
      const isConnected = await testBackendConnection();
      setBackendStatus(isConnected ? 'online' : 'offline');
    };
    
    checkBackendStatus();
    
    // Check for redirect scripts in the page
    detectRedirectScripts();
    
    // Setup navigation monitor to detect URL changes
    setupNavigationMonitor();
    
    // Check periodically
    const interval = setInterval(checkBackendStatus, 60000); // every minute
    
    // Check for interfering extensions
    const extensionsCheck = mlDiagnostics.checkForInterfereingExtensions();
    if (extensionsCheck.detected) {
      setInterfereingExtensions(extensionsCheck.extensions);
      // If extensions that might interfere are detected, show a notification
      if (extensionsCheck.extensions.length > 0) {
        toast.warning("Browser extensions detected", {
          description: "Some browser extensions might interfere with GamePath AI operations",
          action: {
            label: "Diagnostics",
            onClick: () => setShowMlDiagnostics(true)
          }
        });
      }
    }
    
    // Check for redirect URLs
    const checkForRedirects = () => {
      // Fix the selector to use proper DOM methods
      const hasRedirect = document.querySelectorAll('script[src*="redirect"]').length > 0 || 
                          Array.from(document.querySelectorAll('script')).some(script => 
                            script.textContent && script.textContent.includes('redirect')
                          );
      
      if (hasRedirect) {
        setRedirectsDetected(true);
        toast.warning("Redirecionamentos detectados", {
          description: "Scripts de redirecionamento foram encontrados na página",
          action: {
            label: "Diagnósticos",
            onClick: () => setShowMlDiagnostics(true)
          }
        });
      }
    };
    
    // Run the redirect check after a short delay to let page finish loading
    setTimeout(checkForRedirects, 1000);
    
    return () => clearInterval(interval);
  }, []);
  
  const handleOptimizeAll = () => {
    if (isOptimizing) return;
    
    setIsOptimizing(true);
    toast.success("Otimização global iniciada", {
      description: "Otimizando todos os jogos detectados e rotas de rede"
    });
    
    // Simular processo de otimização
    setTimeout(() => {
      setIsOptimizing(false);
      toast.success("Otimização concluída", {
        description: "Todos os jogos e rotas foram otimizados"
      });
    }, 3000);
  };
  
  const handleRetryConnection = async () => {
    setBackendStatus('checking');
    const isConnected = await testBackendConnection();
    setBackendStatus(isConnected ? 'online' : 'offline');
    
    if (isConnected) {
      toast.success("Conexão com o servidor restabelecida", {
        description: "Usando dados reais do servidor"
      });
    } else {
      toast.error("Servidor indisponível", {
        description: "Continuando com dados simulados"
      });
    }
  };

  return (
    <div className="container mx-auto">
      {/* Backend Status Alert */}
      {backendStatus === 'offline' && (
        <BackendStatusAlert handleRetryConnection={handleRetryConnection} />
      )}
      
      {/* Redirects Alert */}
      {redirectsDetected && (
        <RedirectsAlert onShowDiagnostics={() => setShowMlDiagnostics(true)} />
      )}
      
      {/* Extensions Alert */}
      {interfereingExtensions.length > 0 && (
        <ExtensionsAlert 
          extensions={interfereingExtensions} 
          onShowDiagnostics={() => setShowMlDiagnostics(true)} 
        />
      )}
      
      {/* Dashboard Header */}
      <DashboardHeader 
        backendStatus={backendStatus}
        isOptimizing={isOptimizing}
        handleOptimizeAll={handleOptimizeAll}
      />
      
      {/* Show ML diagnostics panel if requested */}
      {showMlDiagnostics && (
        <div className="mb-6">
          <MLDiagnosticsPanel />
        </div>
      )}
      
      {/* Main Metrics Section */}
      <DashboardMetrics />
      
      {/* Games and System Metrics Section */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-3">
        <GamesList />
        <SystemMetrics />
      </div>
      
      {/* Optimization Tools Section */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
        <ConnectionOptimizer />
        <RouteOptimizer />
      </div>
      
      {/* Toggle ML Diagnostics Button */}
      {!showMlDiagnostics && (
        <DiagnosticsToggleButton onClick={() => setShowMlDiagnostics(true)} />
      )}
      
      {/* Premium Features Banner */}
      <PremiumFeatures />
    </div>
  );
};

export default Dashboard;
