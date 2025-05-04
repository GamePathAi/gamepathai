
import React from "react";
import { MemoryStick } from "lucide-react";
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

interface MemoryCardProps {
  data?: ElectronHardwareData;
  formatMemory: (bytes?: number) => string;
}

const MemoryCard: React.FC<MemoryCardProps> = ({ data, formatMemory }) => {
  const { t } = useTranslation();
  
  return (
    <Card className="bg-cyber-darkblue/70 border-cyber-blue/30">
      <CardHeader className="pb-2">
        <div className="flex justify-between items-center">
          <CardTitle className="text-md font-tech text-white flex items-center gap-2">
            <MemoryStick className="h-4 w-4 text-cyber-blue" />
            {t("hardware.ram")}
          </CardTitle>
          {data && (
            <span className="text-lg font-bold text-cyber-green">
              {data.memory.usage.toFixed(1)}%
            </span>
          )}
        </div>
        <CardDescription className="text-gray-400">
          {data && `${formatMemory(data.memory.used)} / ${formatMemory(data.memory.total)}`}
        </CardDescription>
      </CardHeader>
      <CardContent>
        <Progress 
          value={data?.memory.usage ?? 0} 
          max={100}
          className="h-2 mt-1"
        />
        
        {data && (
          <div className="grid grid-cols-3 gap-2 mt-4">
            <div className="bg-cyber-darkblue/40 p-2 rounded">
              <p className="text-xs text-gray-400">{t("hardware.total")}</p>
              <p className="text-sm font-medium">{formatMemory(data.memory.total)}</p>
            </div>
            <div className="bg-cyber-darkblue/40 p-2 rounded">
              <p className="text-xs text-gray-400">{t("hardware.used")}</p>
              <p className="text-sm font-medium">{formatMemory(data.memory.used)}</p>
            </div>
            <div className="bg-cyber-darkblue/40 p-2 rounded">
              <p className="text-xs text-gray-400">{t("hardware.free")}</p>
              <p className="text-sm font-medium">{formatMemory(data.memory.free)}</p>
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
};

export default MemoryCard;
