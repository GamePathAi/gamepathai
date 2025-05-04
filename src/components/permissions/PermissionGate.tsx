
import React, { useState } from "react";
import { usePermissions, PermissionType } from "@/contexts/PermissionsContext";
import { Button } from "@/components/ui/button";
import { Shield } from "lucide-react";
import PermissionRequestDialog from "./PermissionRequestDialog";

interface PermissionGateProps {
  permissionType: PermissionType;
  children: React.ReactNode;
  fallback?: React.ReactNode;
}

const PermissionGate: React.FC<PermissionGateProps> = ({
  permissionType,
  children,
  fallback
}) => {
  const { hasPermission, requestPermission } = usePermissions();
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  
  if (hasPermission(permissionType)) {
    return <>{children}</>;
  }
  
  if (fallback) {
    return <>{fallback}</>;
  }
  
  // Default fallback UI
  return (
    <>
      <div className="flex flex-col items-center justify-center p-8 border border-dashed border-gray-700 rounded-lg bg-cyber-darkblue/30">
        <Shield className="h-12 w-12 text-gray-500 mb-4" />
        <h3 className="text-lg font-medium text-white mb-2">Permissão necessária</h3>
        <p className="text-sm text-gray-400 text-center mb-4 max-w-md">
          Esta funcionalidade requer permissão para acessar {" "}
          <span className="text-cyber-blue">
            {permissionType.replace(/_/g, " ")}
          </span>
        </p>
        <Button 
          variant="outline" 
          onClick={() => setIsDialogOpen(true)}
          className="border-cyber-blue/40 text-cyber-blue hover:bg-cyber-blue/20"
        >
          Solicitar Permissão
        </Button>
      </div>
      
      <PermissionRequestDialog
        open={isDialogOpen}
        onOpenChange={setIsDialogOpen}
        permissionType={permissionType}
        onAllow={async () => {
          await requestPermission(permissionType);
          setIsDialogOpen(false);
        }}
        onDeny={() => setIsDialogOpen(false)}
      />
    </>
  );
};

export default PermissionGate;
