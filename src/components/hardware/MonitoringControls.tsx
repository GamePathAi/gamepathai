
import React from "react";
import { Button } from "@/components/ui/button";
import { useTranslation } from "react-i18next";

interface MonitoringControlsProps {
  isMonitoring: boolean;
  startMonitoring: () => void;
  stopMonitoring: () => void;
}

const MonitoringControls: React.FC<MonitoringControlsProps> = ({
  isMonitoring,
  startMonitoring,
  stopMonitoring
}) => {
  const { t } = useTranslation();
  
  return (
    <div className="flex justify-end space-x-2">
      {!isMonitoring ? (
        <Button 
          size="sm"
          onClick={() => startMonitoring()}
          className="bg-cyber-blue hover:bg-cyber-blue/80"
        >
          {t("hardware.startMonitoring")}
        </Button>
      ) : (
        <Button 
          size="sm"
          variant="outline"
          onClick={() => stopMonitoring()}
          className="border-cyber-blue/40 text-cyber-blue"
        >
          {t("hardware.stopMonitoring")}
        </Button>
      )}
    </div>
  );
};

export default MonitoringControls;
