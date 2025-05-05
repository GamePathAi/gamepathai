
import React, { useState, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import { Activity, Server, Wifi, WifiOff, RefreshCw, Shield, AlertCircle } from 'lucide-react';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import { testBackendConnection, testAWSConnection } from '@/services/api';
import { mlDiagnostics } from '@/services/ml/mlService';
import { toast } from "sonner";
import { detectRedirectScripts } from '@/utils/url/navigationMonitor';

const ConnectionDiagnostics = () => {
  const { t } = useTranslation();
  const [isRunningTests, setIsRunningTests] = useState(false);
  const [progress, setProgress] = useState(0);
  const [results, setResults] = useState<{
    backendConnected: boolean;
    awsConnected: boolean;
    mlConnected: boolean;
    redirectsDetected: boolean;
    interfereingExtensions: string[];
    lastChecked: Date | null;
  }>({
    backendConnected: false,
    awsConnected: false,
    mlConnected: false,
    redirectsDetected: false,
    interfereingExtensions: [],
    lastChecked: null
  });

  // Run diagnostics on component mount
  useEffect(() => {
    runDiagnostics();
  }, []);
  
  const runSingleTest = async <T extends any>(
    testFn: () => Promise<T>,
    progressIncrement: number = 25
  ): Promise<T> => {
    try {
      const result = await testFn();
      setProgress(prev => Math.min(prev + progressIncrement, 100));
      return result;
    } catch (error) {
      console.error('Test failed:', error);
      setProgress(prev => Math.min(prev + progressIncrement, 100));
      throw error;
    }
  };

  const runDiagnostics = async () => {
    setIsRunningTests(true);
    setProgress(0);
    
    try {
      // Run series of tests with progress updates
      const backendConnected = await runSingleTest(() => testBackendConnection(), 20);
      const awsConnected = await runSingleTest(() => testAWSConnection(), 20);
      const mlConnectivity = await runSingleTest(() => mlDiagnostics.testConnectivity(), 20);
      const extensions = await runSingleTest(() => mlDiagnostics.checkForInterfereingExtensions(), 20);
      
      // Check for redirect scripts
      const redirectsDetected = await runSingleTest(() => {
        const hasRedirects = detectRedirectScripts();
        return Promise.resolve(hasRedirects);
      }, 20);
      
      // Update results
      setResults({
        backendConnected,
        awsConnected,
        mlConnected: mlConnectivity,
        redirectsDetected,
        interfereingExtensions: extensions.extensions,
        lastChecked: new Date()
      });
      
      // Show summary toast
      const connectedCount = [backendConnected, awsConnected, mlConnectivity]
        .filter(Boolean).length;
      
      if (connectedCount === 3) {
        toast.success(t("diagnostics.allServicesConnected"));
      } else if (connectedCount > 0) {
        toast.warning(t("diagnostics.someServicesConnected", {count: connectedCount, total: 3}));
      } else {
        toast.error(t("diagnostics.noServicesConnected"));
      }
      
      // Show warning about redirect scripts if detected
      if (redirectsDetected) {
        toast.warning(t("diagnostics.redirectsDetected"), {
          description: t("diagnostics.redirectsWarning")
        });
      }
      
      // Show warning about extensions if detected
      if (extensions.extensions.length > 0) {
        toast.warning(t("diagnostics.extensionsDetected"), {
          description: t("diagnostics.extensionsWarning", {
            extensions: extensions.extensions.join(", ")
          })
        });
      }
    } catch (error) {
      console.error('Diagnostics failed:', error);
      toast.error(t("diagnostics.error"), {
        description: t("diagnostics.errorDetails")
      });
    } finally {
      setIsRunningTests(false);
      setProgress(100);
    }
  };
  
  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Activity className="h-5 w-5" />
          {t("diagnostics.title")}
        </CardTitle>
        <CardDescription>{t("diagnostics.description")}</CardDescription>
      </CardHeader>
      
      <CardContent>
        {isRunningTests && (
          <div className="mb-4">
            <p className="text-sm mb-1">{t("diagnostics.running")}</p>
            <Progress value={progress} />
          </div>
        )}
        
        <div className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {/* Backend Connection */}
            <div className="p-4 border rounded-md">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <Server className="h-4 w-4" />
                  <span className="font-medium">{t("diagnostics.backend")}</span>
                </div>
                <span className={`px-2 py-0.5 rounded-full text-xs ${
                  results.backendConnected ? 'bg-green-100 text-green-800 dark:bg-green-900/20 dark:text-green-400' : 
                  'bg-red-100 text-red-800 dark:bg-red-900/20 dark:text-red-400'
                }`}>
                  {results.backendConnected ? t("diagnostics.connected") : t("diagnostics.disconnected")}
                </span>
              </div>
            </div>
            
            {/* AWS Connection */}
            <div className="p-4 border rounded-md">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <Wifi className="h-4 w-4" />
                  <span className="font-medium">{t("diagnostics.aws")}</span>
                </div>
                <span className={`px-2 py-0.5 rounded-full text-xs ${
                  results.awsConnected ? 'bg-green-100 text-green-800 dark:bg-green-900/20 dark:text-green-400' : 
                  'bg-red-100 text-red-800 dark:bg-red-900/20 dark:text-red-400'
                }`}>
                  {results.awsConnected ? t("diagnostics.connected") : t("diagnostics.disconnected")}
                </span>
              </div>
            </div>
            
            {/* ML Connection */}
            <div className="p-4 border rounded-md">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <Activity className="h-4 w-4" />
                  <span className="font-medium">{t("diagnostics.ml")}</span>
                </div>
                <span className={`px-2 py-0.5 rounded-full text-xs ${
                  results.mlConnected ? 'bg-green-100 text-green-800 dark:bg-green-900/20 dark:text-green-400' : 
                  'bg-red-100 text-red-800 dark:bg-red-900/20 dark:text-red-400'
                }`}>
                  {results.mlConnected ? t("diagnostics.connected") : t("diagnostics.disconnected")}
                </span>
              </div>
            </div>
            
            {/* Redirect Scripts */}
            <div className="p-4 border rounded-md">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <Shield className="h-4 w-4" />
                  <span className="font-medium">{t("diagnostics.redirects")}</span>
                </div>
                <span className={`px-2 py-0.5 rounded-full text-xs ${
                  !results.redirectsDetected ? 'bg-green-100 text-green-800 dark:bg-green-900/20 dark:text-green-400' : 
                  'bg-red-100 text-red-800 dark:bg-red-900/20 dark:text-red-400'
                }`}>
                  {results.redirectsDetected ? t("diagnostics.detected") : t("diagnostics.notDetected")}
                </span>
              </div>
            </div>
          </div>
          
          {/* Interfering Extensions */}
          {results.interfereingExtensions.length > 0 && (
            <div className="p-4 border border-amber-200 dark:border-amber-900/50 rounded-md bg-amber-50 dark:bg-amber-900/20">
              <div className="flex items-start gap-2">
                <AlertCircle className="h-5 w-5 text-amber-500 dark:text-amber-400 mt-0.5" />
                <div>
                  <h4 className="font-medium text-amber-800 dark:text-amber-300">
                    {t("diagnostics.extensionsDetected")}
                  </h4>
                  <p className="text-sm text-amber-700 dark:text-amber-400">
                    {t("diagnostics.extensionsDetail")}
                  </p>
                  <ul className="mt-2 list-disc list-inside text-sm text-amber-700 dark:text-amber-400">
                    {results.interfereingExtensions.map((ext, i) => (
                      <li key={i}>{ext}</li>
                    ))}
                  </ul>
                </div>
              </div>
            </div>
          )}
          
          <Button 
            onClick={runDiagnostics} 
            disabled={isRunningTests} 
            className="w-full"
          >
            <RefreshCw className={`mr-2 h-4 w-4 ${isRunningTests ? 'animate-spin' : ''}`} />
            {t("diagnostics.runTests")}
          </Button>
        </div>
      </CardContent>
      
      <CardFooter className="text-xs text-gray-500">
        {results.lastChecked && t("diagnostics.lastRun", {
          time: new Intl.DateTimeFormat(undefined, { 
            dateStyle: 'short', 
            timeStyle: 'short' 
          }).format(results.lastChecked)
        })}
      </CardFooter>
    </Card>
  );
};

export default ConnectionDiagnostics;
