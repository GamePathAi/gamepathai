
import React from "react";
import { HardDrive } from "lucide-react";
import { useTranslation } from "react-i18next";
import { 
  Card, 
  CardContent, 
  CardDescription, 
  CardHeader, 
  CardTitle 
} from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { ElectronHardwareData } from "@/types/metrics";

interface GpuCardProps {
  data?: ElectronHardwareData;
  formatTemperature: (temp?: number) => string;
  formatMemory: (bytes?: number) => string;
}

const GpuCard: React.FC<GpuCardProps> = ({ data, formatTemperature, formatMemory }) => {
  const { t } = useTranslation();
  
  return (
    <Card className="bg-cyber-darkblue/70 border-cyber-blue/30">
      <CardHeader className="pb-2">
        <div className="flex justify-between items-center">
          <CardTitle className="text-md font-tech text-white flex items-center gap-2">
            <HardDrive className="h-4 w-4 text-cyber-blue" />
            {t("hardware.gpu")}
          </CardTitle>
          {data?.gpu && (
            <span className="text-lg font-bold text-cyber-green">
              {data.gpu.usage.toFixed(1)}%
            </span>
          )}
        </div>
        <CardDescription className="text-gray-400">
          {formatTemperature(data?.gpu?.temperature)}
        </CardDescription>
      </CardHeader>
      <CardContent>
        <Progress 
          value={data?.gpu?.usage ?? 0} 
          max={100}
          className="h-2 mt-1"
        />
        
        {data?.gpu && (
          <div className="grid grid-cols-2 gap-2 mt-4">
            <div className="bg-cyber-darkblue/40 p-2 rounded">
              <p className="text-xs text-gray-400">{t("hardware.memory")}</p>
              <p className="text-sm font-medium">
                {formatMemory(data.gpu.memoryUsed)} / {formatMemory(data.gpu.memoryTotal)}
              </p>
            </div>
            <div className="bg-cyber-darkblue/40 p-2 rounded">
              <p className="text-xs text-gray-400">{t("hardware.memoryUsage")}</p>
              <p className="text-sm font-medium">
                {data.gpu.memoryTotal && data.gpu.memoryUsed
                  ? `${((data.gpu.memoryUsed / data.gpu.memoryTotal) * 100).toFixed(1)}%`
                  : t("hardware.notAvailable")}
              </p>
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
};

export default GpuCard;
