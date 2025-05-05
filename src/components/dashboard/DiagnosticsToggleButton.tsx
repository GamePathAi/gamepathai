
import React from "react";
import { BarChart2 } from "lucide-react";
import { Button } from "@/components/ui/button";

interface DiagnosticsToggleButtonProps {
  onClick: () => void;
}

const DiagnosticsToggleButton: React.FC<DiagnosticsToggleButtonProps> = ({ onClick }) => {
  return (
    <div className="flex justify-end mb-4">
      <Button 
        variant="outline"
        size="sm"
        onClick={onClick}
        className="text-xs flex items-center"
      >
        <BarChart2 className="h-3 w-3 mr-1" />
        Show ML Diagnostics
      </Button>
    </div>
  );
};

export default DiagnosticsToggleButton;
