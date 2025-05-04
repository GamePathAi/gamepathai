
import React, { createContext, useState, useContext, useEffect, ReactNode } from "react";
import { toast } from "sonner";

export type PermissionType = 
  | "hardware_monitoring" 
  | "network_tools" 
  | "game_detection"
  | "file_access"
  | "system_optimization";

export interface Permission {
  type: PermissionType;
  granted: boolean;
  lastRequested: Date | null;
  expiresAt: Date | null;
}

interface PermissionsState {
  permissions: Record<PermissionType, Permission>;
  requestPermission: (type: PermissionType) => Promise<boolean>;
  revokePermission: (type: PermissionType) => void;
  hasPermission: (type: PermissionType) => boolean;
}

const defaultPermissionState = (type: PermissionType): Permission => ({
  type,
  granted: false,
  lastRequested: null,
  expiresAt: null
});

const initialPermissions: Record<PermissionType, Permission> = {
  hardware_monitoring: defaultPermissionState("hardware_monitoring"),
  network_tools: defaultPermissionState("network_tools"),
  game_detection: defaultPermissionState("game_detection"),
  file_access: defaultPermissionState("file_access"),
  system_optimization: defaultPermissionState("system_optimization")
};

const PermissionsContext = createContext<PermissionsState | undefined>(undefined);

export const usePermissions = () => {
  const context = useContext(PermissionsContext);
  if (!context) {
    throw new Error("usePermissions must be used within a PermissionsProvider");
  }
  return context;
};

interface PermissionsProviderProps {
  children: ReactNode;
}

export const PermissionsProvider: React.FC<PermissionsProviderProps> = ({ children }) => {
  const [permissions, setPermissions] = useState<Record<PermissionType, Permission>>(initialPermissions);
  
  // Load saved permissions from localStorage on mount
  useEffect(() => {
    try {
      const savedPermissions = localStorage.getItem("gamepath_permissions");
      if (savedPermissions) {
        const parsed = JSON.parse(savedPermissions);
        
        // Ensure we have all permission types (in case new ones were added)
        const updated = { ...initialPermissions };
        
        Object.keys(parsed).forEach((key) => {
          if (key in updated) {
            const typedKey = key as PermissionType;
            updated[typedKey] = {
              ...parsed[key],
              // Convert date strings back to Date objects
              lastRequested: parsed[key].lastRequested ? new Date(parsed[key].lastRequested) : null,
              expiresAt: parsed[key].expiresAt ? new Date(parsed[key].expiresAt) : null
            };
          }
        });
        
        setPermissions(updated);
      }
    } catch (error) {
      console.error("Failed to load permissions from localStorage:", error);
    }
  }, []);
  
  // Save permissions to localStorage whenever they change
  useEffect(() => {
    try {
      localStorage.setItem("gamepath_permissions", JSON.stringify(permissions));
    } catch (error) {
      console.error("Failed to save permissions to localStorage:", error);
    }
  }, [permissions]);
  
  const requestPermission = async (type: PermissionType): Promise<boolean> => {
    // Here we would typically show a permission request dialog
    // For now, we'll just grant the permission immediately
    const expiresAt = new Date();
    expiresAt.setDate(expiresAt.getDate() + 30); // Permissions expire after 30 days
    
    setPermissions((prev) => ({
      ...prev,
      [type]: {
        ...prev[type],
        granted: true,
        lastRequested: new Date(),
        expiresAt
      }
    }));
    
    toast.success(`Permissão concedida: ${getPermissionName(type)}`, {
      description: "Esta permissão será válida por 30 dias."
    });
    
    return true;
  };
  
  const revokePermission = (type: PermissionType) => {
    setPermissions((prev) => ({
      ...prev,
      [type]: {
        ...prev[type],
        granted: false,
        expiresAt: null
      }
    }));
    
    toast.info(`Permissão revogada: ${getPermissionName(type)}`);
  };
  
  const hasPermission = (type: PermissionType): boolean => {
    const permission = permissions[type];
    
    if (!permission.granted) return false;
    
    // Check if permission has expired
    if (permission.expiresAt && new Date() > permission.expiresAt) {
      // Auto-revoke expired permission
      revokePermission(type);
      return false;
    }
    
    return true;
  };
  
  return (
    <PermissionsContext.Provider
      value={{
        permissions,
        requestPermission,
        revokePermission,
        hasPermission
      }}
    >
      {children}
    </PermissionsContext.Provider>
  );
};

// Helper function to get human-readable permission names
export const getPermissionName = (type: PermissionType): string => {
  switch (type) {
    case "hardware_monitoring":
      return "Monitoramento de Hardware";
    case "network_tools":
      return "Ferramentas de Rede";
    case "game_detection":
      return "Detecção de Jogos";
    case "file_access":
      return "Acesso a Arquivos";
    case "system_optimization":
      return "Otimização do Sistema";
    default:
      // Fix: Explicitly cast to string to avoid the 'never' type issue
      return String(type).replace(/_/g, " ");
  }
};

// Helper function to get permission descriptions
export const getPermissionDescription = (type: PermissionType): string => {
  switch (type) {
    case "hardware_monitoring":
      return "Permite monitorar o uso de CPU, GPU, memória e outros componentes de hardware.";
    case "network_tools":
      return "Permite analisar e otimizar conexões de rede para jogos.";
    case "game_detection":
      return "Permite detectar jogos instalados e em execução no sistema.";
    case "file_access":
      return "Permite acessar arquivos de configuração e logs para otimização.";
    case "system_optimization":
      return "Permite ajustar configurações do sistema para melhorar o desempenho.";
    default:
      return "Esta permissão controla o acesso a recursos do sistema.";
  }
};
