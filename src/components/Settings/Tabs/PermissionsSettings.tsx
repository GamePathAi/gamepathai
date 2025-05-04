
import React, { useState } from "react";
import { usePermissions, PermissionType } from "@/contexts/PermissionsContext";
import { Switch } from "@/components/ui/switch";
import { Button } from "@/components/ui/button";
import {
  Shield,
  Cpu,
  Network,
  Gamepad2,
  FileText,
  Settings2,
  RefreshCw,
  Info,
} from "lucide-react";
import { toast } from "sonner";
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from "@/components/ui/tooltip";

interface SettingsChangeProps {
  onChange: () => void;
}

const PermissionsSettings: React.FC<SettingsChangeProps> = ({ onChange }) => {
  const { permissions, requestPermission, revokePermission, hasPermission } = usePermissions();
  const [isRefreshing, setIsRefreshing] = useState(false);

  const handleTogglePermission = async (type: PermissionType) => {
    if (hasPermission(type)) {
      revokePermission(type);
      onChange();
    } else {
      const granted = await requestPermission(type);
      if (granted) {
        onChange();
      }
    }
  };

  const refreshAllPermissions = async () => {
    setIsRefreshing(true);
    
    const permissionTypes: PermissionType[] = [
      "hardware_monitoring",
      "network_tools",
      "game_detection",
      "file_access",
      "system_optimization"
    ];
    
    const results = await Promise.all(
      permissionTypes.map(async type => {
        if (!hasPermission(type)) {
          return await requestPermission(type);
        }
        return true;
      })
    );
    
    const allGranted = results.every(result => result === true);
    
    if (allGranted) {
      toast.success("Todas as permissões atualizadas", {
        description: "O GamePath AI agora tem acesso a todos os recursos necessários"
      });
    } else {
      toast.warning("Algumas permissões foram negadas", {
        description: "Algumas funcionalidades podem não estar disponíveis"
      });
    }
    
    onChange();
    setIsRefreshing(false);
  };

  const getPermissionIcon = (type: PermissionType) => {
    switch (type) {
      case "hardware_monitoring":
        return <Cpu className="h-5 w-5" />;
      case "network_tools":
        return <Network className="h-5 w-5" />;
      case "game_detection":
        return <Gamepad2 className="h-5 w-5" />;
      case "file_access":
        return <FileText className="h-5 w-5" />;
      case "system_optimization":
        return <Settings2 className="h-5 w-5" />;
      default:
        return <Shield className="h-5 w-5" />;
    }
  };

  // Calculate days remaining for each permission
  const getDaysRemaining = (permission: typeof permissions[PermissionType]) => {
    if (!permission.expiresAt) return null;
    
    const now = new Date();
    const expiresAt = new Date(permission.expiresAt);
    const diffTime = expiresAt.getTime() - now.getTime();
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
    
    return diffDays;
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col lg:flex-row justify-between items-start lg:items-center mb-6 gap-4">
        <div>
          <h3 className="text-lg font-medium text-white mb-1">Gerenciamento de Permissões</h3>
          <p className="text-sm text-gray-400">
            Controle quais recursos o GamePath AI pode acessar no seu sistema
          </p>
        </div>
        <Button 
          variant="outline" 
          onClick={refreshAllPermissions}
          disabled={isRefreshing}
          className="flex items-center gap-2"
        >
          <RefreshCw className={`h-4 w-4 ${isRefreshing ? 'animate-spin' : ''}`} />
          Atualizar Todas as Permissões
        </Button>
      </div>

      <div className="bg-cyber-darkblue/40 border border-cyber-blue/20 p-4 rounded-lg mb-6">
        <div className="flex items-center gap-2 text-sm text-yellow-400 mb-4">
          <Info className="h-4 w-4" />
          <p>As permissões expiram após 30 dias e precisarão ser renovadas</p>
        </div>
        
        <div className="space-y-4">
          {(Object.keys(permissions) as PermissionType[]).map((type) => {
            const permission = permissions[type];
            const isGranted = hasPermission(type);
            const daysRemaining = getDaysRemaining(permission);
            
            return (
              <div 
                key={type} 
                className="flex items-center justify-between py-3 border-b border-cyber-blue/10 last:border-0"
              >
                <div className="flex items-center gap-3">
                  <div className={`p-2 rounded-full ${isGranted ? 'bg-cyber-green/20 text-cyber-green' : 'bg-gray-700/50 text-gray-400'}`}>
                    {getPermissionIcon(type)}
                  </div>
                  
                  <div>
                    <h4 className="font-medium text-white">
                      {permission.type.split('_').map(word => 
                        word.charAt(0).toUpperCase() + word.slice(1)
                      ).join(' ')}
                    </h4>
                    
                    {isGranted && daysRemaining !== null ? (
                      <p className="text-xs text-cyber-green">
                        Ativo • Expira em {daysRemaining} dias
                      </p>
                    ) : (
                      <p className="text-xs text-gray-400">
                        {isGranted ? "Ativo" : "Inativo"}
                      </p>
                    )}
                  </div>
                </div>
                
                <Tooltip>
                  <TooltipTrigger asChild>
                    <Switch
                      checked={isGranted}
                      onCheckedChange={() => handleTogglePermission(type)}
                    />
                  </TooltipTrigger>
                  <TooltipContent side="left">
                    {isGranted ? "Revogar permissão" : "Conceder permissão"}
                  </TooltipContent>
                </Tooltip>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
};

export default PermissionsSettings;
