
import React from "react";
import { Brain, DownloadCloud, Activity, X } from "lucide-react";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogClose } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { BarChartComponent } from "@/components/charts/BarChartComponent";
import { LineChartComponent } from "@/components/charts/LineChartComponent";
import { beforeAfterData, analyzedGames, learningData } from "../data";
import { CheckCircle2 } from "lucide-react";

interface DetailsDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export const DetailsDialog: React.FC<DetailsDialogProps> = ({ open, onOpenChange }) => {
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="bg-cyber-darkblue border border-cyber-purple/40 text-white max-w-4xl max-h-[85vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="text-xl font-tech text-cyber-purple flex items-center gap-2">
            <Brain size={20} className="text-cyber-purple" />
            AI Optimization Details
          </DialogTitle>
          <DialogDescription className="text-gray-300">
            Deep learning analysis of your system based on 30 days of usage patterns
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-6">
          <div className="bg-cyber-darkblue/70 border border-cyber-purple/20 rounded-lg p-4">
            <h4 className="text-md font-tech text-cyber-purple mb-3">Performance Improvement</h4>
            <div className="h-60">
              <BarChartComponent
                data={beforeAfterData}
                barKeys={["before", "after"]}
                xAxisDataKey="name"
                colors={["#6c7293", "#8b5cf6"]}
                showLegend
                legendFormatter={(value) => value === "before" ? "Before Optimization" : "After Optimization"}
              />
            </div>
            <div className="mt-4 grid grid-cols-3 sm:grid-cols-5 gap-2">
              {beforeAfterData.map((item) => (
                <div key={item.name} className="text-center p-1 border border-cyber-purple/20 rounded">
                  <div className="text-xs text-gray-400">{item.name}</div>
                  <div className="text-lg font-tech text-cyber-green">{item.gain}</div>
                </div>
              ))}
            </div>
          </div>

          <div className="bg-cyber-darkblue/70 border border-cyber-blue/20 rounded-lg p-4">
            <h4 className="text-md font-tech text-cyber-blue mb-3">Analyzed Games</h4>
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead className="border-b border-cyber-blue/30">
                  <tr>
                    <th className="text-left p-2 text-sm text-gray-400">Game</th>
                    <th className="text-left p-2 text-sm text-gray-400">Improvement</th>
                    <th className="text-left p-2 text-sm text-gray-400">Optimal Settings</th>
                    <th className="text-left p-2 text-sm text-gray-400">Confidence</th>
                  </tr>
                </thead>
                <tbody>
                  {analyzedGames.map((game, index) => (
                    <tr key={game.name} className={index % 2 === 0 ? "bg-cyber-blue/5" : ""}>
                      <td className="p-2 text-cyber-blue">{game.name}</td>
                      <td className="p-2 text-cyber-green">{game.improvement}</td>
                      <td className="p-2 text-gray-300">{game.settings}</td>
                      <td className="p-2">
                        <div className="flex items-center">
                          <div className="w-full bg-gray-700 rounded-full h-1.5 mr-2">
                            <div 
                              className="bg-cyber-purple h-1.5 rounded-full" 
                              style={{ width: `${game.confidence}%` }}
                            ></div>
                          </div>
                          <span className="text-xs text-gray-400">{game.confidence}%</span>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>

          <div className="bg-cyber-darkblue/70 border border-cyber-green/20 rounded-lg p-4">
            <h4 className="text-md font-tech text-cyber-green mb-3">Learning Process</h4>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <h5 className="text-sm font-tech text-gray-300 mb-2">AI Learning Curve</h5>
                <div className="h-40">
                  <LineChartComponent
                    data={learningData}
                    lineKeys={[{ 
                      dataKey: "value", 
                      color: "#10b981", 
                      strokeWidth: 2 
                    }]}
                    xAxisDataKey="name"
                    tooltipFormatter={(value) => [`${value}%`, "Learning"]}
                  />
                </div>
              </div>
              <div>
                <h5 className="text-sm font-tech text-gray-300 mb-2">Key Learning Areas</h5>
                <ul className="space-y-2">
                  <li className="flex items-start gap-2 text-sm">
                    <div className="h-5 w-5 rounded-full bg-cyber-green/20 flex items-center justify-center mt-0.5">
                      <CheckCircle2 size={12} className="text-cyber-green" />
                    </div>
                    <span className="text-gray-300">Game-specific optimization patterns</span>
                  </li>
                  <li className="flex items-start gap-2 text-sm">
                    <div className="h-5 w-5 rounded-full bg-cyber-green/20 flex items-center justify-center mt-0.5">
                      <CheckCircle2 size={12} className="text-cyber-green" />
                    </div>
                    <span className="text-gray-300">Hardware performance characteristics</span>
                  </li>
                  <li className="flex items-start gap-2 text-sm">
                    <div className="h-5 w-5 rounded-full bg-cyber-green/20 flex items-center justify-center mt-0.5">
                      <CheckCircle2 size={12} className="text-cyber-green" />
                    </div>
                    <span className="text-gray-300">Peak usage time patterns</span>
                  </li>
                  <li className="flex items-start gap-2 text-sm">
                    <div className="h-5 w-5 rounded-full bg-cyber-green/20 flex items-center justify-center mt-0.5">
                      <CheckCircle2 size={12} className="text-cyber-green" />
                    </div>
                    <span className="text-gray-300">Thermal management behaviors</span>
                  </li>
                  <li className="flex items-start gap-2 text-sm">
                    <div className="h-5 w-5 rounded-full bg-cyber-green/20 flex items-center justify-center mt-0.5">
                      <CheckCircle2 size={12} className="text-cyber-green" />
                    </div>
                    <span className="text-gray-300">System resource allocation priorities</span>
                  </li>
                </ul>
              </div>
            </div>
          </div>
        </div>

        <DialogFooter className="flex sm:justify-between sm:flex-row flex-col gap-3">
          <div className="flex gap-2">
            <Button 
              variant="outline" 
              className="border-cyber-purple/30 text-cyber-purple hover:bg-cyber-purple/10"
            >
              <DownloadCloud size={16} className="mr-1" />
              Export Report
            </Button>
            <Button 
              variant="outline" 
              className="border-cyber-blue/30 text-cyber-blue hover:bg-cyber-blue/10"
            >
              <Activity size={16} className="mr-1" />
              Refresh Data
            </Button>
          </div>
          <DialogClose asChild>
            <Button className="bg-cyber-purple text-white hover:bg-cyber-purple/80">
              <X size={16} className="mr-1" />
              Close
            </Button>
          </DialogClose>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};
