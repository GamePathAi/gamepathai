
import React from "react";
import { usePermissions, PermissionType, getPermissionName, getPermissionDescription } from "@/contexts/PermissionsContext";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Shield, ShieldCheck, ShieldX } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Switch } from "@/components/ui/switch";
import { toast } from "sonner";
import { useTranslation } from "react-i18next";

interface SettingsChangeProps {
  onChange: () => void;
}

const PermissionsSettings: React.FC<SettingsChangeProps> = ({ onChange }) => {
  const { t } = useTranslation();
  const { permissions, requestPermission, revokePermission, hasPermission } = usePermissions();
  
  const handleTogglePermission = async (type: PermissionType) => {
    try {
      if (hasPermission(type)) {
        await revokePermission(type);
      } else {
        await requestPermission(type);
      }
      onChange(); // Notify settings component that changes were made
    } catch (error) {
      console.error(`Failed to toggle permission ${type}:`, error);
      toast.error(t("permissions.toggleError"), {
        description: t("permissions.tryAgain")
      });
    }
  };
  
  const permissionTypes: PermissionType[] = [
    "hardware_monitoring",
    "network_tools",
    "game_detection",
    "file_access",
    "system_optimization"
  ];
  
  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-lg font-medium text-white mb-2">{t("permissions.title")}</h2>
        <p className="text-sm text-gray-400 mb-6">
          {t("permissions.description")}
        </p>
      </div>
      
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {permissionTypes.map((type) => (
          <PermissionCard 
            key={type}
            type={type} 
            isGranted={hasPermission(type)}
            onToggle={() => handleTogglePermission(type)}
          />
        ))}
      </div>
      
      <div className="bg-cyber-darkblue/50 border border-cyber-blue/20 rounded-md p-4 mt-6">
        <div className="flex items-start gap-3">
          <Shield className="h-5 w-5 text-cyber-blue mt-1" />
          <div>
            <h3 className="text-sm font-medium text-white">{t("permissions.securityNote")}</h3>
            <p className="text-xs text-gray-400 mt-1">
              {t("permissions.securityDescription")}
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};

interface PermissionCardProps {
  type: PermissionType;
  isGranted: boolean;
  onToggle: () => void;
}

const PermissionCard: React.FC<PermissionCardProps> = ({ type, isGranted, onToggle }) => {
  const { t } = useTranslation();
  
  return (
    <Card className="bg-cyber-darkblue/70 border-cyber-blue/30">
      <CardHeader className="pb-2">
        <div className="flex justify-between items-center">
          <CardTitle className="text-md font-tech text-white">
            {getPermissionName(type)}
          </CardTitle>
          {isGranted ? (
            <ShieldCheck className="h-5 w-5 text-cyber-green" />
          ) : (
            <ShieldX className="h-5 w-5 text-gray-500" />
          )}
        </div>
        <CardDescription className="text-gray-400">
          {getPermissionDescription(type)}
        </CardDescription>
      </CardHeader>
      <CardContent>
        <div className="flex items-center space-x-2 py-2">
          <Switch 
            checked={isGranted} 
            onCheckedChange={onToggle} 
            className="data-[state=checked]:bg-cyber-green"
          />
          <span className="text-sm text-gray-300">
            {isGranted ? t("permissions.granted") : t("permissions.notGranted")}
          </span>
        </div>
      </CardContent>
      <CardFooter className="pt-0">
        <Button 
          variant={isGranted ? "outline" : "default"} 
          size="sm" 
          onClick={onToggle}
          className={isGranted ? "border-cyber-red/40 text-cyber-red hover:bg-cyber-red/20" : "bg-cyber-blue hover:bg-cyber-blue/90"}
        >
          {isGranted ? t("permissions.revoke") : t("permissions.grant")}
        </Button>
      </CardFooter>
    </Card>
  );
};

export default PermissionsSettings;
