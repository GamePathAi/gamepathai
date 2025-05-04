
import React from "react";
import { Cpu } from "lucide-react";
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

interface CpuCardProps {
  data?: ElectronHardwareData;
  formatTemperature: (temp?: number) => string;
}

const CpuCard: React.FC<CpuCardProps> = ({ data, formatTemperature }) => {
  const { t } = useTranslation();
  
  return (
    <Card className="bg-cyber-darkblue/70 border-cyber-blue/30">
      <CardHeader className="pb-2">
        <div className="flex justify-between items-center">
          <CardTitle className="text-md font-tech text-white flex items-center gap-2">
            <Cpu className="h-4 w-4 text-cyber-blue" />
            {t("hardware.cpu")}
          </CardTitle>
          {data && (
            <span className="text-lg font-bold text-cyber-green">
              {data.cpu.usage.toFixed(1)}%
            </span>
          )}
        </div>
        <CardDescription className="text-gray-400">
          {formatTemperature(data?.cpu.temperature)}
        </CardDescription>
      </CardHeader>
      <CardContent>
        <Progress 
          value={data?.cpu.usage ?? 0} 
          max={100}
          className="h-2 mt-1"
        />
        
        {data?.cpu.cores && (
          <div className="mt-4">
            <p className="text-xs text-gray-400 mb-1">{t("hardware.cores")}</p>
            <div className="grid grid-cols-4 gap-2">
              {data.cpu.cores.map((usage, index) => (
                <div key={index} className="space-y-1">
                  <Progress value={usage} max={100} className="h-1" />
                  <span className="text-[10px] text-gray-500">{index + 1}</span>
                </div>
              ))}
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
};

export default CpuCard;
