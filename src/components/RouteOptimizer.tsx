
import React, { useState } from "react";
import { Button } from "@/components/ui/button";
import { Network, ChevronRight, RefreshCw, Zap, Info } from "lucide-react";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";
import { cn } from "@/lib/utils";

const RouteOptimizer = () => {
  const [isOptimizing, setIsOptimizing] = useState(false);
  const [progress, setProgress] = useState(0);
  const [isOptimized, setIsOptimized] = useState(false);
  
  const handleOptimize = () => {
    setIsOptimizing(true);
    setProgress(0);
    setIsOptimized(false);
    
    const interval = setInterval(() => {
      setProgress(prevProgress => {
        if (prevProgress >= 100) {
          clearInterval(interval);
          setIsOptimizing(false);
          setIsOptimized(true);
          return 100;
        }
        return prevProgress + 4;
      });
    }, 120);
  };
  
  const handleReset = () => {
    setIsOptimized(false);
    setProgress(0);
  };

  const renderStatusIndicator = () => {
    if (isOptimized) {
      return (
        <div className="mb-3 flex items-center justify-between bg-cyber-green/10 rounded-md px-3 py-2 border border-cyber-green/30">
          <div className="flex items-center">
            <Zap size={14} className="text-cyber-green mr-2" />
            <span className="text-cyber-green text-sm">Routes optimized</span>
          </div>
          <span className="text-cyber-green text-xs font-tech">-28% latency</span>
        </div>
      );
    }
    return null;
  };
  
  return (
    <div className="bg-cyber-darkblue border border-cyber-blue/30 rounded-lg p-5">
      <div className="flex items-center mb-4">
        <Network className="text-cyber-purple mr-2" size={20} />
        <h2 className="text-lg font-cyber text-white">Route Optimizer</h2>
        <TooltipProvider>
          <Tooltip>
            <TooltipTrigger asChild>
              <Button variant="ghost" size="icon" className="w-6 h-6 ml-1 text-gray-400 hover:text-white">
                <Info size={14} />
              </Button>
            </TooltipTrigger>
            <TooltipContent>
              <p className="text-xs max-w-60">
                Optimize network routes to game servers for better ping and stability
              </p>
            </TooltipContent>
          </Tooltip>
        </TooltipProvider>
      </div>
      
      <div className="mb-4 space-y-1">
        <div className="text-gray-400 text-sm">Optimize network routes to game servers</div>
        
        <div className="flex items-center space-x-2 text-sm">
          <span className="text-gray-400">Current status:</span>
          {isOptimized ? (
            <span className="text-cyber-green flex items-center">
              <Zap size={14} className="mr-1" />
              Optimized
            </span>
          ) : (
            <span className="text-gray-400">Not optimized</span>
          )}
        </div>
      </div>
      
      {renderStatusIndicator()}
      
      {isOptimizing && (
        <div className="mb-4">
          <div className="flex justify-between text-xs mb-1">
            <span className="text-gray-400">Finding optimal routes...</span>
            <span className="text-cyber-purple">{progress}%</span>
          </div>
          <div className="progress-container">
            <div 
              className={cn("progress-bar bg-gradient-to-r from-cyber-blue to-cyber-purple")}
              style={{ width: `${progress}%` }}
            ></div>
          </div>
        </div>
      )}
      
      <div className="flex flex-col space-y-2">
        {!isOptimized ? (
          <Button 
            className="bg-cyber-purple hover:bg-cyber-purple/90 text-white"
            disabled={isOptimizing}
            onClick={handleOptimize}
          >
            {isOptimizing ? (
              <RefreshCw size={16} className="mr-2 animate-spin" />
            ) : (
              <Zap size={16} className="mr-2" />
            )}
            {isOptimizing ? "Optimizing..." : "Optimize Routes"}
          </Button>
        ) : (
          <Button 
            variant="outline"
            className="border-cyber-purple text-cyber-purple hover:bg-cyber-purple/10"
            onClick={handleReset}
          >
            <RefreshCw size={16} className="mr-2" />
            Reset Optimization
          </Button>
        )}
        
        <Button 
          variant="ghost" 
          className="text-gray-400 hover:text-white flex justify-between w-full"
        >
          <span>Game Servers</span>
          <ChevronRight size={16} />
        </Button>
      </div>
    </div>
  );
};

export default RouteOptimizer;
