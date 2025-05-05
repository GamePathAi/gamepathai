
/**
 * Utility for fixing common ML network issues
 */

import { testMlEndpoint } from "../api/connectionTester";
import { toast } from "sonner";

interface NetworkFixerResult {
  success: boolean;
  message: string;
  recommendedAction?: string;
}

/**
 * Service to diagnose and fix common ML network issues
 */
export const mlNetworkFixer = {
  /**
   * Diagnose and try to fix ML connection issues
   */
  async diagnoseAndFix(): Promise<NetworkFixerResult> {
    console.log("🔍 Diagnosing ML network issues...");

    // Step 1: Test basic health endpoint
    const healthResult = await testMlEndpoint("/health");
    if (healthResult.success) {
      console.log("✅ Health endpoint is reachable");
    } else {
      console.error("❌ Health endpoint is not reachable:", healthResult.error);
    }
    
    // Step 2: Test ML-specific endpoint
    const mlResult = await testMlEndpoint("/ml/health");
    if (mlResult.success) {
      console.log("✅ ML health endpoint is reachable");
    } else {
      console.error("❌ ML health endpoint is not reachable:", mlResult.error);
    }
    
    // Step 3: If both failed, try connectivity fixes
    if (!healthResult.success && !mlResult.success) {
      console.log("❌ All connectivity tests failed, attempting fixes...");
      
      // Try a simple fetch with different settings
      try {
        const fixResult = await fetch("/health", {
          method: "GET",
          headers: {
            "X-No-Redirect": "1",
            "Accept": "application/json"
          },
          mode: "no-cors", // Try with no-cors as last resort
          cache: "no-store"
        });
        
        if (fixResult.type === "opaque") {
          console.log("ℹ️ Received opaque response, which is normal for no-cors mode");
        }
        
        // Re-test after fix attempt
        const retestResult = await testMlEndpoint("/health");
        if (retestResult.success) {
          return {
            success: true,
            message: "Conexão restaurada após intervenção"
          };
        }
      } catch (error) {
        console.error("❌ Fix attempt failed:", error);
      }
      
      // If we got here, the fix failed
      return {
        success: false,
        message: "Não foi possível estabelecer conexão com o backend",
        recommendedAction: "Verifique sua conexão de internet ou tente novamente mais tarde"
      };
    }
    
    // If only ML endpoint failed but health is ok
    if (healthResult.success && !mlResult.success) {
      toast.warning("Problemas com endpoints ML específicos", {
        description: "O servidor está online mas os endpoints ML não estão respondendo"
      });
      
      return {
        success: false,
        message: "Server health OK, ML endpoints falando",
        recommendedAction: "Os serviços ML podem estar em manutenção"
      };
    }
    
    // If we got here, basic connectivity is working
    return {
      success: true,
      message: "Conexão de rede ML verificada e funcionando"
    };
  },
  
  /**
   * Try to recover ML connection with multiple approaches
   */
  async attemptRecovery(): Promise<boolean> {
    console.log("🔄 Attempting ML connection recovery...");
    
    // Approaches to try, in order
    const approaches = [
      // First approach: Standard API request
      async () => {
        try {
          const response = await fetch("/api/health", { 
            headers: { "X-No-Redirect": "1" },
            cache: "no-store"
          });
          return response.ok;
        } catch (e) {
          return false;
        }
      },
      
      // Second approach: No-cors mode
      async () => {
        try {
          await fetch("/health", { 
            mode: "no-cors", 
            cache: "no-store" 
          });
          // For no-cors we can't check .ok, so just succeed if no exception
          return true;
        } catch (e) {
          return false;
        }
      },
      
      // Third approach: Try a different endpoint
      async () => {
        try {
          const response = await fetch("/api/v1/health", {
            headers: { "X-No-Redirect": "1" },
            cache: "no-store"
          });
          return response.ok;
        } catch (e) {
          return false;
        }
      }
    ];
    
    // Try each approach in sequence
    for (let i = 0; i < approaches.length; i++) {
      console.log(`Trying recovery approach ${i+1}...`);
      const success = await approaches[i]();
      
      if (success) {
        console.log(`✅ Recovery approach ${i+1} succeeded`);
        toast.success("Conexão ML recuperada", {
          description: "A conexão com o backend foi restabelecida"
        });
        return true;
      }
    }
    
    console.log("❌ All recovery approaches failed");
    toast.error("Recuperação falhou", {
      description: "Não foi possível restabelecer conexão com o backend"
    });
    return false;
  }
};
