
import React from "react";

interface OptimizationStatusProps {
  optimizationType?: "network" | "system" | "both" | "none";
}

const OptimizationStatus: React.FC<OptimizationStatusProps> = ({ optimizationType = "none" }) => {
  if (optimizationType === "none") {
    return <div className="text-xs text-gray-400">Não otimizado</div>;
  }
  
  let statusText = "";
  let statusClass = "";
  
  switch (optimizationType) {
    case "network":
      statusText = "Otimização de Rede";
      statusClass = "bg-cyber-blue/20 text-cyber-blue border-cyber-blue/50";
      break;
    case "system":
      statusText = "Otimização de Sistema";
      statusClass = "bg-cyber-purple/20 text-cyber-purple border-cyber-purple/50";
      break;
    case "both":
      statusText = "Otimização Completa";
      statusClass = "bg-cyber-green/20 text-cyber-green border-cyber-green/50";
      break;
    default:
      statusText = "Não otimizado";
      statusClass = "bg-gray-700/30 text-gray-400 border-gray-600/50";
  }
  
  return (
    <div className={`text-xs px-2 py-1 rounded border inline-block ${statusClass}`}>
      {statusText}
    </div>
  );
};

export default OptimizationStatus;
