
/**
 * ML Diagnostics Service
 * Handles ML diagnostics and system checks
 */
import { toast } from "sonner";
import { mlDiagnostics } from './mlDiagnostics';
import { MLConnectivityTestResult } from './types';

export const diagnosticService = {
  /**
   * Run diagnostics and return results
   */
  runDiagnostics: async (): Promise<MLConnectivityTestResult> => {
    toast.loading("Executando diagnósticos ML...");
    try {
      const results = await mlDiagnostics.runDiagnostics();
      
      toast.success("Diagnósticos concluídos", {
        description: `Conectividade ML: ${results.success ? 'OK' : 'Falha'}`
      });
      
      return results;
    } catch (error) {
      toast.error("Falha nos diagnósticos", {
        description: "Não foi possível executar os diagnósticos ML"
      });
      throw error;
    }
  }
};
