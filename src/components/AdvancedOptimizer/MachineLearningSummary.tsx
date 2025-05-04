
import React from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { DeepLearningInsights } from "./DeepLearningInsights";
import { Button } from "@/components/ui/button";
import { Brain, Activity, Cpu, Network, Zap } from "lucide-react";
import MetricCard from "@/components/MetricCard";
import MetricChart from "@/components/MetricChart";
import { AreaChartComponent } from "@/components/charts/AreaChartComponent";
import { LineChartComponent } from "@/components/charts/LineChartComponent";

const learningData = [
  { name: "Week 1", value: 35 },
  { name: "Week 2", value: 52 },
  { name: "Week 3", value: 61 },
  { name: "Week 4", value: 78 },
  { name: "Now", value: 92 }
];

const performanceData = [
  { time: "1d", value: 45 },
  { time: "2d", value: 52 },
  { time: "3d", value: 49 },
  { time: "4d", value: 62 },
  { time: "5d", value: 56 },
  { time: "6d", value: 64 },
  { time: "7d", value: 72 },
];

// Add confidence data for the chart
const confidenceData = [
  { time: "1d", value: 75 },
  { time: "2d", value: 78 },
  { time: "3d", value: 83 },
  { time: "4d", value: 85 },
  { time: "5d", value: 89 },
  { time: "6d", value: 91 },
  { time: "7d", value: 94 },
];

const optimizationData = [
  { name: "CPU", before: 72, after: 58 },
  { name: "GPU", before: 84, after: 65 },
  { name: "Memory", before: 68, after: 42 },
  { name: "Disk", before: 56, after: 31 },
];

export const MachineLearningSummary: React.FC = () => {
  return (
    <div className="space-y-6">
      <Card className="bg-cyber-darkblue border-cyber-purple/30">
        <CardHeader className="pb-2">
          <CardTitle className="text-xl font-tech text-cyber-purple">Machine Learning Insights</CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-sm text-gray-300 mb-4">
            GamePath AI's machine learning engine analyzes your system behavior and game performance patterns to create personalized optimizations.
          </p>
          
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
            <MetricCard
              title="AI Learning Progress"
              value="92"
              unit="%"
              icon={<Brain size={18} />}
              trend="up"
              trendValue="+5% this week"
              chartComponent={
                <MetricChart 
                  data={learningData.map(item => ({ time: item.name, value: item.value }))} 
                  color="#8B5CF6"
                />
              }
            />
            
            <MetricCard
              title="Performance Improvement"
              value="28"
              unit="%"
              icon={<Activity size={18} />}
              trend="up"
              trendValue="+3% this week"
              chartComponent={
                <MetricChart 
                  data={performanceData} 
                  color="#10B981"
                  metricType="fps"
                />
              }
            />
            
            <MetricCard
              title="Optimization Confidence"
              value="High"
              icon={<Zap size={18} />}
              trend="stable"
              trendValue="Consistent"
              chartComponent={
                <MetricChart 
                  data={confidenceData} 
                  color="#EC4899"
                  metricType="cpu"
                />
              }
            />
          </div>
          
          <div className="bg-cyber-darkblue/50 border border-cyber-purple/20 rounded-lg p-4 mb-6">
            <h4 className="text-sm font-tech text-cyber-purple mb-3">AI Learning Progress</h4>
            <div className="h-48">
              <AreaChartComponent
                data={learningData}
                dataKey="value"
                color="#8B5CF6"
                gradientId="learningGradient"
                tooltipFormatter={(value) => [`${value}%`, 'Learning Progress']}
                height={180}
                xAxisDataKey="name"
              />
            </div>
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6">
            <div className="bg-cyber-darkblue/50 border border-cyber-blue/20 rounded-lg p-4">
              <h4 className="text-sm font-tech text-cyber-blue mb-3">Resource Optimization</h4>
              <div className="h-48">
                <LineChartComponent
                  data={optimizationData}
                  lineKeys={[
                    { dataKey: "before", color: "#6c7293", name: "Before" },
                    { dataKey: "after", color: "#33C3F0", name: "After" }
                  ]}
                  height={180}
                  showLegend={true}
                  dot={{ r: 4 }}
                  xAxisDataKey="name"
                />
              </div>
            </div>
            
            <div className="bg-cyber-darkblue/50 border border-cyber-green/20 rounded-lg p-4">
              <h4 className="text-sm font-tech text-cyber-green mb-3">AI Recommendations</h4>
              <ul className="space-y-3">
                <li className="flex items-start gap-2">
                  <div className="h-5 w-5 rounded-full bg-cyber-green/20 flex items-center justify-center mt-0.5">
                    <Cpu size={12} className="text-cyber-green" />
                  </div>
                  <div>
                    <span className="text-gray-300 text-sm">CPU Core Optimization</span>
                    <p className="text-xs text-gray-400">Optimize core allocation for your specific CPU architecture</p>
                  </div>
                </li>
                <li className="flex items-start gap-2">
                  <div className="h-5 w-5 rounded-full bg-cyber-blue/20 flex items-center justify-center mt-0.5">
                    <Activity size={12} className="text-cyber-blue" />
                  </div>
                  <div>
                    <span className="text-gray-300 text-sm">Background Process Management</span>
                    <p className="text-xs text-gray-400">Intelligent management of background processes during gameplay</p>
                  </div>
                </li>
                <li className="flex items-start gap-2">
                  <div className="h-5 w-5 rounded-full bg-cyber-purple/20 flex items-center justify-center mt-0.5">
                    <Network size={12} className="text-cyber-purple" />
                  </div>
                  <div>
                    <span className="text-gray-300 text-sm">Network Traffic Prioritization</span>
                    <p className="text-xs text-gray-400">Prioritize game traffic for reduced latency and packet loss</p>
                  </div>
                </li>
              </ul>
              
              <div className="mt-4">
                <Button 
                  variant="cyberAction" 
                  size="sm" 
                  className="w-full"
                >
                  Apply AI Recommendations
                </Button>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      <DeepLearningInsights />
    </div>
  );
};
