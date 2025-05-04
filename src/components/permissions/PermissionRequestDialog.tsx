
import React from "react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Shield, Info, AlertTriangle } from "lucide-react";
import { PermissionType, getPermissionName, getPermissionDescription } from "@/contexts/PermissionsContext";

interface PermissionRequestDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  permissionType: PermissionType;
  onAllow: () => void;
  onDeny: () => void;
}

const PermissionRequestDialog: React.FC<PermissionRequestDialogProps> = ({
  open,
  onOpenChange,
  permissionType,
  onAllow,
  onDeny
}) => {
  const permissionName = getPermissionName(permissionType);
  const description = getPermissionDescription(permissionType);
  
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="bg-cyber-darkblue border-cyber-blue/30 max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2 text-lg">
            <Shield className="h-5 w-5 text-cyber-blue" />
            <span>Permissão Necessária</span>
          </DialogTitle>
          <DialogDescription className="text-gray-400">
            GamePath AI precisa da seguinte permissão:
          </DialogDescription>
        </DialogHeader>
        
        <div className="bg-cyber-darkblue/40 border border-cyber-blue/20 rounded-lg p-4 my-2">
          <h4 className="font-medium text-white flex items-center gap-2">
            <Info className="h-4 w-4 text-cyber-blue" />
            {permissionName}
          </h4>
          <p className="text-sm text-gray-300 mt-1">{description}</p>
        </div>
        
        <div className="flex items-start gap-2 text-xs text-amber-400/80 bg-amber-900/20 p-2 rounded border border-amber-500/30">
          <AlertTriangle className="h-4 w-4 mt-0.5 flex-shrink-0" />
          <p>
            Esta permissão é necessária apenas para o funcionamento adequado do GamePath AI e não será compartilhada com terceiros.
          </p>
        </div>
        
        <DialogFooter className="flex gap-2 mt-4">
          <Button variant="outline" onClick={onDeny}>
            Recusar
          </Button>
          <Button variant="cyberAction" onClick={onAllow}>
            Permitir
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};

export default PermissionRequestDialog;
