import React, { useState, useEffect } from "react";
import { AreaChartComponent } from "@/components/charts/AreaChartComponent";
import { LineChartComponent } from "@/components/charts/LineChartComponent";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import { Select, SelectTrigger, SelectValue, SelectContent, SelectItem } from "@/components/ui/select";
import { performanceHistoryService } from "@/services/history/performanceHistoryService";
import type { HistoricalAnalysis, PerformanceHistory as PerformanceHistoryType, PerformanceHistoryPoint } from "@/types/history";
import { Button } from "@/components/ui/button";
import { Alert, AlertTitle, AlertDescription } from "@/components/ui/alert";
import { ChartBar, TrendingUp, TrendingDown, Cpu, Thermometer, Timer } from "lucide-react";
import { HardDrive as MemoryIcon } from "lucide-react";
import { formatRelativeTime } from "@/utils/dateUtils";

interface PerformanceHistoryProps {
  gameFilter?: string;
  timeRange?: '1h' | '24h' | '7d' | '30d' | 'all';
}

export const PerformanceHistory: React.FC<PerformanceHistoryProps> = ({ 
  gameFilter,
  timeRange = 'all'
}) => {
  const [history, setHistory] = useState<PerformanceHistoryType | null>(null);
  const [analysis, setAnalysis] = useState<HistoricalAnalysis | null>(null);
  const [selectedTimeRange, setSelectedTimeRange] = useState<string>(timeRange);
  const [chartData, setChartData] = useState<PerformanceHistoryPoint[]>([]);
  
  useEffect(() => {
    // Load history data
    const historyData = performanceHistoryService.getHistory();
    setHistory(historyData);
    
    // Calculate the time range based on selection
    const now = Date.now();
    let startTime = 0;
    
    switch(selectedTimeRange) {
      case '1h':
        startTime = now - (60 * 60 * 1000); // 1 hour in ms
        break;
      case '24h':
        startTime = now - (24 * 60 * 60 * 1000); // 24 hours in ms
        break;
      case '7d':
        startTime = now - (7 * 24 * 60 * 60 * 1000); // 7 days in ms
        break;
      case '30d':
        startTime = now - (30 * 24 * 60 * 60 * 1000); // 30 days in ms
        break;
      default:
        startTime = 0; // All time
    }
    
    // Get filtered data
    let filteredData = performanceHistoryService.getHistoryForTimeRange(
      startTime, 
      now,
      gameFilter
    );
    
    // If we have too many points, sample them to reduce chart density
    if (filteredData.length > 100) {
      filteredData = sampleData(filteredData, 100);
    }
    
    setChartData(filteredData);
    
    // Get analysis for the selected time range
    const timeRangeObj = selectedTimeRange !== 'all' ? { start: startTime, end: now } : undefined;
    const analysisData = performanceHistoryService.analyzeHistory(timeRangeObj, gameFilter);
    setAnalysis(analysisData);
    
  }, [selectedTimeRange, gameFilter]);
  
  // Sample data for large datasets
  const sampleData = (data: PerformanceHistoryPoint[], sampleCount: number): PerformanceHistoryPoint[] => {
    if (data.length <= sampleCount) return data;
    
    const result = [];
    const step = data.length / sampleCount;
    
    for (let i = 0; i < data.length; i += step) {
      result.push(data[Math.floor(i)]);
    }
    
    return result;
  };
  
  // Format data for charts
  const formatChartData = (data: PerformanceHistoryPoint[]) => {
    return data.map(point => ({
      time: formatRelativeTime(point.timestamp),
      cpuUsage: point.cpu.usage,
      cpuTemp: point.cpu.temperature,
      memUsage: point.memory.usage,
      gpuUsage: point.gpu?.usage,
      gpuTemp: point.gpu?.temperature,
      score: point.performanceScore
    }));
  };
  
  const formattedData = formatChartData(chartData);
  
  const getTrendIcon = (trend: 'increasing' | 'decreasing' | 'stable') => {
    switch (trend) {
      case 'increasing':
        return <TrendingUp className="h-4 w-4 text-cyber-green" />;
      case 'decreasing':
        return <TrendingDown className="h-4 w-4 text-cyber-red" />;
      default:
        return <ChartBar className="h-4 w-4 text-cyber-blue" />;
    }
  };
  
  const getTrendText = (trend: 'increasing' | 'decreasing' | 'stable', isPositive: boolean) => {
    // For metrics where increasing is bad (usage, temperature)
    if (!isPositive) {
      switch (trend) {
        case 'increasing':
          return "Getting worse";
        case 'decreasing':
          return "Improving";
        default:
          return "Stable";
      }
    } else {
      // For metrics where increasing is good (performance score)
      switch (trend) {
        case 'increasing':
          return "Improving";
        case 'decreasing':
          return "Getting worse";
        default:
          return "Stable";
      }
    }
  };
  
  const getStatusColor = (trend: 'increasing' | 'decreasing' | 'stable', isPositive: boolean) => {
    if (!isPositive) {
      switch (trend) {
        case 'increasing':
          return "text-cyber-red";
        case 'decreasing':
          return "text-cyber-green";
        default:
          return "text-cyber-blue";
      }
    } else {
      switch (trend) {
        case 'increasing':
          return "text-cyber-green";
        case 'decreasing':
          return "text-cyber-red";
        default:
          return "text-cyber-blue";
      }
    }
  };
  
  return (
    <div className="space-y-4">
      <div className="flex justify-between items-center">
        <h2 className="text-lg font-tech">Performance History</h2>
        
        <div className="flex items-center gap-2">
          <Select
            value={selectedTimeRange}
            onValueChange={setSelectedTimeRange}
          >
            <SelectTrigger className="w-[140px] bg-cyber-darkblue border-cyber-blue/30">
              <SelectValue placeholder="Time Range" />
            </SelectTrigger>
            <SelectContent className="bg-cyber-darkblue border-cyber-blue/30">
              <SelectItem value="1h">Last Hour</SelectItem>
              <SelectItem value="24h">Last 24 Hours</SelectItem>
              <SelectItem value="7d">Last 7 Days</SelectItem>
              <SelectItem value="30d">Last 30 Days</SelectItem>
              <SelectItem value="all">All Time</SelectItem>
            </SelectContent>
          </Select>
          
          <Button 
            variant="outline" 
            size="sm" 
            className="border-cyber-red/30 text-cyber-red"
            onClick={() => {
              if (gameFilter) {
                performanceHistoryService.clearGameHistory(gameFilter);
              } else {
                performanceHistoryService.clearHistory();
              }
              // Reload data
              setHistory(performanceHistoryService.getHistory());
              setChartData([]);
              setAnalysis(null);
            }}
          >
            Clear History
          </Button>
        </div>
      </div>
      
      {chartData.length === 0 ? (
        <Alert className="bg-cyber-darkblue/50 border border-cyber-blue/30">
          <AlertTitle>No historical data</AlertTitle>
          <AlertDescription>
            No performance history data available for the selected time range.
            {gameFilter ? ` Try selecting a different game or time range.` : ` Start monitoring to collect data.`}
          </AlertDescription>
        </Alert>
      ) : (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
          {/* Historical Charts */}
          <div className="col-span-1 lg:col-span-2">
            <Tabs defaultValue="cpu" className="w-full">
              <TabsList className="bg-cyber-darkblue border border-cyber-blue/20 mb-4">
                <TabsTrigger value="cpu" className="font-tech data-[state=active]:bg-cyber-purple/20 data-[state=active]:text-cyber-purple">
                  <Cpu size={16} className="mr-2" />
                  CPU 
                </TabsTrigger>
                <TabsTrigger value="gpu" className="font-tech data-[state=active]:bg-cyber-pink/20 data-[state=active]:text-cyber-pink">
                  <Thermometer size={16} className="mr-2" />
                  GPU
                </TabsTrigger>
                <TabsTrigger value="memory" className="font-tech data-[state=active]:bg-cyber-blue/20 data-[state=active]:text-cyber-blue">
                  <MemoryIcon size={16} className="mr-2" />
                  Memory
                </TabsTrigger>
                <TabsTrigger value="score" className="font-tech data-[state=active]:bg-cyber-green/20 data-[state=active]:text-cyber-green">
                  <ChartBar size={16} className="mr-2" />
                  Score
                </TabsTrigger>
              </TabsList>
              
              {/* CPU Tab */}
              <TabsContent value="cpu" className="mt-0">
                <Card className="cyber-panel">
                  <CardContent className="p-4">
                    <h3 className="text-sm font-tech text-gray-400 mb-3">CPU USAGE & TEMPERATURE OVER TIME</h3>
                    <div className="h-64">
                      <LineChartComponent
                        data={formattedData}
                        lineKeys={[
                          { dataKey: "cpuUsage", color: "#8B5CF6", name: "CPU Usage %" },
                          { dataKey: "cpuTemp", color: "#F97316", name: "CPU Temp °C", yAxisId: "right" }
                        ]}
                        xAxisDataKey="time"
                        height={250}
                        tooltipFormatter={(value, name) => {
                          if (name?.includes("Usage")) return [`${value}%`, name];
                          if (name?.includes("Temp")) return [`${value}°C`, name];
                          return [value, name || ""];
                        }}
                        showLegend={true}
                        showGrid={true}
                        useRightYAxis={true}
                        rightYAxisDomain={[20, 100]}
                      />
                    </div>
                  </CardContent>
                </Card>
              </TabsContent>
              
              {/* GPU Tab */}
              <TabsContent value="gpu" className="mt-0">
                <Card className="cyber-panel">
                  <CardContent className="p-4">
                    <h3 className="text-sm font-tech text-gray-400 mb-3">GPU USAGE & TEMPERATURE OVER TIME</h3>
                    <div className="h-64">
                      {analysis?.trends?.gpu ? (
                        <LineChartComponent
                          data={formattedData}
                          lineKeys={[
                            { dataKey: "gpuUsage", color: "#D946EF", name: "GPU Usage %" },
                            { dataKey: "gpuTemp", color: "#F97316", name: "GPU Temp °C", yAxisId: "right" }
                          ]}
                          xAxisDataKey="time"
                          height={250}
                          tooltipFormatter={(value, name) => {
                            if (name?.includes("Usage")) return [`${value}%`, name];
                            if (name?.includes("Temp")) return [`${value}°C`, name];
                            return [value, name || ""];
                          }}
                          showLegend={true}
                          showGrid={true}
                          useRightYAxis={true}
                          rightYAxisDomain={[20, 100]}
                        />
                      ) : (
                        <div className="flex items-center justify-center h-full text-gray-400">
                          No GPU data available
                        </div>
                      )}
                    </div>
                  </CardContent>
                </Card>
              </TabsContent>
              
              {/* Memory Tab */}
              <TabsContent value="memory" className="mt-0">
                <Card className="cyber-panel">
                  <CardContent className="p-4">
                    <h3 className="text-sm font-tech text-gray-400 mb-3">MEMORY USAGE OVER TIME</h3>
                    <div className="h-64">
                      <AreaChartComponent
                        data={formattedData}
                        dataKey="memUsage"
                        xAxisDataKey="time"
                        color="#33C3F0"
                        gradientId="memoryGradient"
                        height={250}
                        tooltipFormatter={(value) => [`${value}%`, 'Memory Usage']}
                      />
                    </div>
                  </CardContent>
                </Card>
              </TabsContent>
              
              {/* Score Tab */}
              <TabsContent value="score" className="mt-0">
                <Card className="cyber-panel">
                  <CardContent className="p-4">
                    <h3 className="text-sm font-tech text-gray-400 mb-3">PERFORMANCE SCORE OVER TIME</h3>
                    <div className="h-64">
                      <LineChartComponent
                        data={formattedData}
                        lineKeys={[
                          { dataKey: "score", color: "#10B981", name: "Performance Score" }
                        ]}
                        xAxisDataKey="time"
                        height={250}
                        tooltipFormatter={(value) => [`${value}`, 'Performance Score']}
                        showLegend={true}
                        showGrid={true}
                      />
                    </div>
                  </CardContent>
                </Card>
              </TabsContent>
            </Tabs>
          </div>
          
          {/* Analysis Panel */}
          <div className="col-span-1">
            <Card className="h-full cyber-panel">
              <CardContent className="p-4">
                <h3 className="text-sm font-tech text-cyber-purple mb-3">HISTORICAL ANALYSIS</h3>
                
                {analysis && (
                  <>
                    {/* Trend Summary */}
                    <div className="bg-cyber-darkblue/50 border border-cyber-purple/20 rounded-md p-3 mb-4">
                      <h4 className="text-xs font-tech mb-2 text-cyber-blue">PERFORMANCE TRENDS</h4>
                      
                      <div className="space-y-3">
                        <div className="flex items-center justify-between">
                          <div className="flex items-center gap-1.5">
                            <Cpu size={14} className="text-cyber-purple" />
                            <span className="text-sm">CPU Usage</span>
                          </div>
                          <div className={`flex items-center gap-1 ${getStatusColor(analysis.trends.cpu.usageTrend, false)}`}>
                            {getTrendIcon(analysis.trends.cpu.usageTrend)}
                            <span className="text-xs">{getTrendText(analysis.trends.cpu.usageTrend, false)}</span>
                          </div>
                        </div>
                        
                        <div className="flex items-center justify-between">
                          <div className="flex items-center gap-1.5">
                            <Thermometer size={14} className="text-cyber-orange" />
                            <span className="text-sm">CPU Temp</span>
                          </div>
                          <div className={`flex items-center gap-1 ${getStatusColor(analysis.trends.cpu.temperatureTrend, false)}`}>
                            {getTrendIcon(analysis.trends.cpu.temperatureTrend)}
                            <span className="text-xs">{getTrendText(analysis.trends.cpu.temperatureTrend, false)}</span>
                          </div>
                        </div>
                        
                        {analysis.trends.gpu && (
                          <>
                            <div className="flex items-center justify-between">
                              <div className="flex items-center gap-1.5">
                                <Cpu size={14} className="text-cyber-pink" />
                                <span className="text-sm">GPU Usage</span>
                              </div>
                              <div className={`flex items-center gap-1 ${getStatusColor(analysis.trends.gpu.usageTrend, false)}`}>
                                {getTrendIcon(analysis.trends.gpu.usageTrend)}
                                <span className="text-xs">{getTrendText(analysis.trends.gpu.usageTrend, false)}</span>
                              </div>
                            </div>
                            
                            <div className="flex items-center justify-between">
                              <div className="flex items-center gap-1.5">
                                <Thermometer size={14} className="text-cyber-orange" />
                                <span className="text-sm">GPU Temp</span>
                              </div>
                              <div className={`flex items-center gap-1 ${getStatusColor(analysis.trends.gpu.temperatureTrend, false)}`}>
                                {getTrendIcon(analysis.trends.gpu.temperatureTrend)}
                                <span className="text-xs">{getTrendText(analysis.trends.gpu.temperatureTrend, false)}</span>
                              </div>
                            </div>
                          </>
                        )}
                        
                        <div className="flex items-center justify-between">
                          <div className="flex items-center gap-1.5">
                            <MemoryIcon size={14} className="text-cyber-blue" />
                            <span className="text-sm">Memory</span>
                          </div>
                          <div className={`flex items-center gap-1 ${getStatusColor(analysis.trends.memory.usageTrend, false)}`}>
                            {getTrendIcon(analysis.trends.memory.usageTrend)}
                            <span className="text-xs">{getTrendText(analysis.trends.memory.usageTrend, false)}</span>
                          </div>
                        </div>
                        
                        <div className="flex items-center justify-between">
                          <div className="flex items-center gap-1.5">
                            <ChartBar size={14} className="text-cyber-green" />
                            <span className="text-sm">Overall Score</span>
                          </div>
                          <div className={`flex items-center gap-1 ${getStatusColor(analysis.trends.performanceScoreTrend, true)}`}>
                            {getTrendIcon(analysis.trends.performanceScoreTrend)}
                            <span className="text-xs">{getTrendText(analysis.trends.performanceScoreTrend, true)}</span>
                          </div>
                        </div>
                      </div>
                    </div>
                    
                    {/* Anomalies */}
                    {analysis.anomalies.length > 0 && (
                      <div className="bg-cyber-darkblue/50 border border-cyber-orange/20 rounded-md p-3 mb-4">
                        <h4 className="text-xs font-tech mb-2 text-cyber-orange">DETECTED ANOMALIES</h4>
                        
                        <div className="space-y-2 max-h-[120px] overflow-y-auto custom-scrollbar">
                          {analysis.anomalies.slice(0, 5).map((anomaly, index) => (
                            <div key={index} className="text-xs border-l-2 border-cyber-orange/50 pl-2">
                              <div className="flex items-center justify-between">
                                <span className="text-cyber-orange">{anomaly.component} {anomaly.metric}</span>
                                <Badge 
                                  variant="outline" 
                                  className={`
                                    ${anomaly.severity === 'high' ? 'border-red-500 text-red-500' : 
                                      anomaly.severity === 'medium' ? 'border-amber-500 text-amber-500' : 
                                      'border-blue-500 text-blue-500'}
                                  `}
                                >
                                  {anomaly.severity}
                                </Badge>
                              </div>
                              <div className="text-gray-400">
                                Value: {anomaly.metric.includes('temperature') ? `${anomaly.value}°C` : `${anomaly.value}%`}
                                {" "}(expected: {anomaly.metric.includes('temperature') ? `${anomaly.expected.toFixed(1)}°C` : `${anomaly.expected.toFixed(1)}%`})
                              </div>
                            </div>
                          ))}
                          
                          {analysis.anomalies.length > 5 && (
                            <div className="text-xs text-gray-400 italic text-center">
                              + {analysis.anomalies.length - 5} more anomalies
                            </div>
                          )}
                        </div>
                      </div>
                    )}
                    
                    {/* Recommendations */}
                    {analysis.recommendations.length > 0 && (
                      <div className="bg-cyber-darkblue/50 border border-cyber-green/20 rounded-md p-3">
                        <h4 className="text-xs font-tech mb-2 text-cyber-green">RECOMMENDATIONS</h4>
                        
                        <ul className="space-y-1 text-xs text-gray-300 list-disc list-inside">
                          {analysis.recommendations.map((rec, index) => (
                            <li key={index}>{rec}</li>
                          ))}
                        </ul>
                      </div>
                    )}
                  </>
                )}
                
                {!analysis && (
                  <div className="flex items-center justify-center h-64 text-gray-400">
                    No analysis data available
                  </div>
                )}
              </CardContent>
            </Card>
          </div>
        </div>
      )}
    </div>
  );
};
