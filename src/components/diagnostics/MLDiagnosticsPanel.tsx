
import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { AlertCircle, CheckCircle, Network, Laptop, Braces, Loader2, WifiOff } from 'lucide-react';
import { mlDiagnostics } from '@/services/mlApiClient';
import { Alert, AlertTitle, AlertDescription } from '@/components/ui/alert';

const MLDiagnosticsPanel: React.FC = () => {
  const [isRunningTests, setIsRunningTests] = useState(false);
  const [testResults, setTestResults] = useState<Record<string, { success: boolean; error?: string }> | null>(null);
  const [interfereingExtensions, setInterfereingExtensions] = useState<string[]>([]);
  
  const runDiagnostics = async () => {
    setIsRunningTests(true);
    
    try {
      // Check for extensions that might interfere
      const extensionsCheck = mlDiagnostics.checkForInterfereingExtensions();
      setInterfereingExtensions(extensionsCheck.extensions);
      
      // Run connectivity tests
      const connResults = await mlDiagnostics.testConnectivity();
      setTestResults(connResults.results);
    } catch (error) {
      console.error('Diagnostics error:', error);
    } finally {
      setIsRunningTests(false);
    }
  };
  
  const getOverallStatus = () => {
    if (!testResults) return null;
    
    const allServices = Object.values(testResults);
    const allSuccess = allServices.every(result => result.success);
    
    if (allSuccess) {
      return (
        <div className="flex items-center text-green-500">
          <CheckCircle className="mr-2 h-5 w-5" />
          <span className="font-medium">All services are operating normally</span>
        </div>
      );
    }
    
    const failedCount = allServices.filter(result => !result.success).length;
    return (
      <div className="flex items-center text-amber-500">
        <AlertCircle className="mr-2 h-5 w-5" />
        <span className="font-medium">{failedCount} service(s) experiencing issues</span>
      </div>
    );
  };
  
  return (
    <Card className="border-cyber-purple/30 bg-cyber-darkblue/80">
      <CardHeader className="pb-2">
        <CardTitle className="text-xl flex items-center">
          <Network className="mr-2 text-cyber-purple" />
          ML Connection Diagnostics
        </CardTitle>
      </CardHeader>
      <CardContent>
        <div className="mb-4 text-sm text-gray-300">
          This tool helps diagnose problems with connections to our AI/ML services. 
          Use it if you're experiencing issues with game optimizations or performance predictions.
        </div>
        
        {interfereingExtensions.length > 0 && (
          <Alert variant="destructive" className="mb-4 bg-red-900/20 border-red-500/50">
            <AlertCircle className="h-4 w-4" />
            <AlertTitle>Potential interference detected</AlertTitle>
            <AlertDescription>
              <p className="mb-2">The following software might be interfering with ML connections:</p>
              <ul className="list-disc pl-5 space-y-1">
                {interfereingExtensions.map((ext, i) => (
                  <li key={i}>{ext}</li>
                ))}
              </ul>
              <p className="mt-2 text-sm">Try disabling these extensions or security software temporarily.</p>
            </AlertDescription>
          </Alert>
        )}
        
        <div className="space-y-3 mb-5">
          <div className="p-3 border border-cyber-blue/30 rounded bg-cyber-darkblue/50">
            <h3 className="text-sm font-semibold flex items-center mb-1">
              <Network className="mr-2 h-4 w-4 text-cyber-blue" />
              Network Routing
            </h3>
            <p className="text-xs text-gray-300">
              Tests connections to the ML route optimization service
            </p>
            
            {testResults && testResults['routeOptimizer'] && (
              <div className="mt-2 flex justify-between items-center">
                <span className="text-xs">Status:</span>
                {testResults['routeOptimizer'].success ? (
                  <Badge variant="outline" className="bg-green-900/20 text-green-500 border-green-500">
                    <CheckCircle className="h-3 w-3 mr-1" /> Available
                  </Badge>
                ) : (
                  <Badge variant="outline" className="bg-red-900/20 text-red-500 border-red-500">
                    <AlertCircle className="h-3 w-3 mr-1" /> Unavailable
                  </Badge>
                )}
              </div>
            )}
          </div>
          
          <div className="p-3 border border-cyber-purple/30 rounded bg-cyber-darkblue/50">
            <h3 className="text-sm font-semibold flex items-center mb-1">
              <Laptop className="mr-2 h-4 w-4 text-cyber-purple" />
              Performance Prediction
            </h3>
            <p className="text-xs text-gray-300">
              Tests connections to the ML performance prediction service
            </p>
            
            {testResults && testResults['performancePredictor'] && (
              <div className="mt-2 flex justify-between items-center">
                <span className="text-xs">Status:</span>
                {testResults['performancePredictor'].success ? (
                  <Badge variant="outline" className="bg-green-900/20 text-green-500 border-green-500">
                    <CheckCircle className="h-3 w-3 mr-1" /> Available
                  </Badge>
                ) : (
                  <Badge variant="outline" className="bg-red-900/20 text-red-500 border-red-500">
                    <AlertCircle className="h-3 w-3 mr-1" /> Unavailable
                  </Badge>
                )}
              </div>
            )}
          </div>
          
          <div className="p-3 border border-cyber-orange/30 rounded bg-cyber-darkblue/50">
            <h3 className="text-sm font-semibold flex items-center mb-1">
              <Braces className="mr-2 h-4 w-4 text-cyber-orange" />
              Game Detection
            </h3>
            <p className="text-xs text-gray-300">
              Tests connections to the ML game detection service
            </p>
            
            {testResults && testResults['gameDetection'] && (
              <div className="mt-2 flex justify-between items-center">
                <span className="text-xs">Status:</span>
                {testResults['gameDetection'].success ? (
                  <Badge variant="outline" className="bg-green-900/20 text-green-500 border-green-500">
                    <CheckCircle className="h-3 w-3 mr-1" /> Available
                  </Badge>
                ) : (
                  <Badge variant="outline" className="bg-red-900/20 text-red-500 border-red-500">
                    <AlertCircle className="h-3 w-3 mr-1" /> Unavailable
                  </Badge>
                )}
              </div>
            )}
          </div>
        </div>
        
        {testResults && (
          <div className="mb-4 p-3 border border-cyber-blue/30 rounded bg-cyber-darkblue/50">
            <h3 className="font-semibold mb-2">Overall Status</h3>
            {getOverallStatus()}
            
            {Object.values(testResults).some(result => !result.success) && (
              <div className="mt-3 text-sm">
                <h4 className="font-semibold text-amber-400 mb-1">Troubleshooting Steps</h4>
                <ol className="list-decimal pl-5 space-y-1 text-xs">
                  <li>Try using private/incognito browsing mode</li>
                  <li>Disable browser extensions, especially security software</li>
                  <li>Clear browser cache and cookies</li>
                  <li>Try a different browser</li>
                  <li>Check your network connection and firewall settings</li>
                </ol>
              </div>
            )}
          </div>
        )}
        
        <div className="flex items-center justify-between">
          <Button
            variant="cyberOutline"
            className="gap-2"
            onClick={runDiagnostics}
            disabled={isRunningTests}
          >
            {isRunningTests ? (
              <>
                <Loader2 className="h-4 w-4 animate-spin" />
                Running Tests...
              </>
            ) : (
              <>
                <Network className="h-4 w-4" />
                Run Diagnostics
              </>
            )}
          </Button>
          
          {!testResults && !isRunningTests && (
            <div className="text-xs text-gray-400 flex items-center">
              <WifiOff className="h-3 w-3 mr-1" />
              No diagnostics run yet
            </div>
          )}
        </div>
      </CardContent>
    </Card>
  );
};

export default MLDiagnosticsPanel;
