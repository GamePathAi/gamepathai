
import React, { useState, useEffect } from "react";
import { Helmet } from "react-helmet-async";
import Layout from "@/components/Layout";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import HardwareMonitor from "@/components/hardware/HardwareMonitor";
import { useHardwareMonitoring } from "@/hooks/useHardwareMonitoring";
import { Cpu, Thermometer, Activity, ChartBar, RefreshCw, Download, Settings } from "lucide-react";
import { MemoryIcon } from "lucide-react";
import { Select, SelectTrigger, SelectValue, SelectContent, SelectItem } from "@/components/ui/select";
import { LineChartComponent } from "@/components/charts/LineChartComponent";
import { hardwareMonitoringService } from "@/services/hardware/hardwareMonitoringService";
import { toast } from "sonner";

// Mock game data
const availableGames = [
  { id: "cyberpunk2077", name: "Cyberpunk 2077" },
  { id: "valorant", name: "Valorant" },
  { id: "fortnite", name: "Fortnite" },
  { id: "csgo2", name: "CS2" },
  { id: "gta5", name: "Grand Theft Auto V" }
];

const HardwareMonitoring: React.FC = () => {
  const [activeTab, setActiveTab] = useState("realtime");
  const [selectedGame, setSelectedGame] = useState<string | null>(null);
  const [isReportGenerating, setIsReportGenerating] = useState(false);

  // For advanced tracking
  const {
    data,
    isMonitoring,
    startMonitoring,
    stopMonitoring,
    analysis,
    performanceScore,
    historicalAnalysis,
    generatePerformanceReport
  } = useHardwareMonitoring({
    enableAnalysis: true,
    recordHistory: true,
    gameContext: selectedGame || undefined
  });

  useEffect(() => {
    // Start monitoring when the page loads
    if (!isMonitoring) {
      startMonitoring();
    }

    return () => {
      // Clean up when the page is left
      if (isMonitoring) {
        stopMonitoring();
      }
    };
  }, []);

  const handleGenerateReport = () => {
    if (!data) return;
    
    setIsReportGenerating(true);
    const report = generatePerformanceReport();
    
    setTimeout(() => {
      // In a real app, we'd create a downloadable file
      console.log("Generated report:", report);
      setIsReportGenerating(false);
      
      toast.success("Report generated", {
        description: "Performance report is ready for download"
      });
      
      // Create a blob and trigger a download
      const blob = new Blob([report], { type: "text/plain" });
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = `performance-report-${new Date().toISOString().slice(0, 10)}.txt`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
    }, 1000);
  };

  return (
    <Layout>
      <Helmet>
        <title>Hardware Monitoring | GamePath AI</title>
      </Helmet>

      <div className="flex flex-col gap-6">
        {/* Header with controls */}
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-tech neon-blue">Hardware Monitoring</h1>
            <p className="text-sm text-gray-400">
              Comprehensive monitoring for your system's hardware performance
            </p>
          </div>

          <div className="flex items-center gap-3">
            <Select
              value={selectedGame || ""}
              onValueChange={value => setSelectedGame(value === "" ? null : value)}
            >
              <SelectTrigger className="w-[180px] bg-cyber-darkblue border-cyber-blue/30">
                <SelectValue placeholder="Select game context" />
              </SelectTrigger>
              <SelectContent className="bg-cyber-darkblue border-cyber-blue/30">
                <SelectItem value="">No game context</SelectItem>
                {availableGames.map(game => (
                  <SelectItem key={game.id} value={game.id}>
                    {game.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>

            <Button
              variant="outline"
              className={isMonitoring ? "bg-red-900/20 border-red-500/30 text-red-500" : "bg-green-900/20 border-green-500/30 text-green-500"}
              onClick={() => (isMonitoring ? stopMonitoring() : startMonitoring())}
            >
              {isMonitoring ? "Stop Monitoring" : "Start Monitoring"}
            </Button>

            <Button
              variant="outline"
              className="bg-cyber-darkblue border-cyber-purple/30 text-cyber-purple"
              disabled={isReportGenerating || !data}
              onClick={handleGenerateReport}
            >
              {isReportGenerating ? (
                <>
                  <RefreshCw className="h-4 w-4 mr-2 animate-spin" />
                  Generating...
                </>
              ) : (
                <>
                  <Download className="h-4 w-4 mr-2" />
                  Export Report
                </>
              )}
            </Button>
          </div>
        </div>

        {/* Main content tabs */}
        <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
          <TabsList className="bg-cyber-darkblue border border-cyber-blue/20 mb-6">
            <TabsTrigger
              value="realtime"
              className="font-tech data-[state=active]:bg-cyber-blue/20 data-[state=active]:text-cyber-blue"
            >
              <Activity size={16} className="mr-2" />
              Real-Time Monitoring
            </TabsTrigger>
            <TabsTrigger
              value="historical"
              className="font-tech data-[state=active]:bg-cyber-purple/20 data-[state=active]:text-cyber-purple"
            >
              <ChartBar size={16} className="mr-2" />
              Historical Analysis
            </TabsTrigger>
            <TabsTrigger
              value="advanced"
              className="font-tech data-[state=active]:bg-cyber-green/20 data-[state=active]:text-cyber-green"
            >
              <Settings size={16} className="mr-2" />
              Advanced Settings
            </TabsTrigger>
          </TabsList>

          {/* Real-time monitoring tab */}
          <TabsContent value="realtime" className="mt-0">
            <HardwareMonitor 
              showControls={false}
              autoStart={true}
              showAnalysis={true}
              className="mb-4"
            />
          </TabsContent>

          {/* Historical analysis tab */}
          <TabsContent value="historical" className="mt-0">
            <HardwareMonitor 
              showControls={false}
              autoStart={true}
              showAnalysis={false}
              showHistory={true}
              gameContext={selectedGame || undefined}
              className="mb-4"
            />
          </TabsContent>

          {/* Advanced settings tab */}
          <TabsContent value="advanced" className="mt-0">
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
              {/* Monitoring settings */}
              <Card className="cyber-panel col-span-1">
                <CardHeader className="pb-2">
                  <CardTitle className="text-lg font-tech">Monitoring Settings</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    <div>
                      <label className="text-sm text-gray-400 block mb-2">Update Frequency</label>
                      <Select defaultValue="2000">
                        <SelectTrigger className="w-full bg-cyber-darkblue border-cyber-blue/30">
                          <SelectValue placeholder="Select frequency" />
                        </SelectTrigger>
                        <SelectContent className="bg-cyber-darkblue border-cyber-blue/30">
                          <SelectItem value="1000">1 second</SelectItem>
                          <SelectItem value="2000">2 seconds</SelectItem>
                          <SelectItem value="5000">5 seconds</SelectItem>
                          <SelectItem value="10000">10 seconds</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>

                    <div>
                      <label className="text-sm text-gray-400 block mb-2">Data Collection</label>
                      <div className="flex gap-2">
                        <Button 
                          variant="outline" 
                          size="sm" 
                          className="bg-cyber-darkblue/50 border-cyber-blue/30 text-cyber-blue w-1/2"
                        >
                          Record Session
                        </Button>
                        <Button 
                          variant="outline" 
                          size="sm" 
                          className="bg-cyber-darkblue/50 border-cyber-red/30 text-cyber-red w-1/2"
                        >
                          Clear Data
                        </Button>
                      </div>
                    </div>

                    <div>
                      <label className="text-sm text-gray-400 block mb-2">Alert Thresholds</label>
                      <div className="space-y-3">
                        <div>
                          <div className="flex justify-between text-xs mb-1">
                            <div className="flex items-center">
                              <Cpu size={12} className="mr-1" /> CPU Temperature
                            </div>
                            <div>85°C</div>
                          </div>
                          <input
                            type="range"
                            min="60"
                            max="100"
                            defaultValue="85"
                            className="w-full"
                          />
                        </div>
                        <div>
                          <div className="flex justify-between text-xs mb-1">
                            <div className="flex items-center">
                              <Thermometer size={12} className="mr-1" /> GPU Temperature
                            </div>
                            <div>90°C</div>
                          </div>
                          <input
                            type="range"
                            min="60"
                            max="105"
                            defaultValue="90"
                            className="w-full"
                          />
                        </div>
                        <div>
                          <div className="flex justify-between text-xs mb-1">
                            <div className="flex items-center">
                              <MemoryIcon size={12} className="mr-1" /> Memory Usage
                            </div>
                            <div>90%</div>
                          </div>
                          <input
                            type="range"
                            min="50"
                            max="95"
                            defaultValue="90"
                            className="w-full"
                          />
                        </div>
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>

              {/* Cloud settings */}
              <Card className="cyber-panel col-span-1">
                <CardHeader className="pb-2">
                  <CardTitle className="text-lg font-tech">Cloud Settings</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    <div className="flex items-center justify-between bg-cyber-darkblue/50 border border-cyber-blue/20 rounded-md p-3">
                      <span>Cloud Backup</span>
                      <div className="w-12 h-6 bg-cyber-darkblue border border-cyber-blue/30 rounded-full p-1">
                        <div className="w-4 h-4 bg-cyber-blue rounded-full ml-auto"></div>
                      </div>
                    </div>

                    <div className="flex items-center justify-between bg-cyber-darkblue/50 border border-cyber-blue/20 rounded-md p-3">
                      <span>Anonymous Data Collection</span>
                      <div className="w-12 h-6 bg-cyber-darkblue border border-cyber-blue/30 rounded-full p-1">
                        <div className="w-4 h-4 bg-cyber-blue rounded-full"></div>
                      </div>
                    </div>

                    <div className="flex items-center justify-between bg-cyber-darkblue/50 border border-cyber-blue/20 rounded-md p-3">
                      <span>Community Benchmarks</span>
                      <div className="w-12 h-6 bg-cyber-darkblue border border-cyber-blue/30 rounded-full p-1">
                        <div className="w-4 h-4 bg-cyber-blue rounded-full"></div>
                      </div>
                    </div>

                    <div>
                      <label className="text-sm text-gray-400 block mb-2">Data Retention</label>
                      <Select defaultValue="30">
                        <SelectTrigger className="w-full bg-cyber-darkblue border-cyber-blue/30">
                          <SelectValue placeholder="Select retention period" />
                        </SelectTrigger>
                        <SelectContent className="bg-cyber-darkblue border-cyber-blue/30">
                          <SelectItem value="7">7 days</SelectItem>
                          <SelectItem value="30">30 days</SelectItem>
                          <SelectItem value="90">90 days</SelectItem>
                          <SelectItem value="365">1 year</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                  </div>
                </CardContent>
              </Card>

              {/* Machine learning */}
              <Card className="cyber-panel col-span-1">
                <CardHeader className="pb-2">
                  <CardTitle className="text-lg font-tech">ML Features</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    <div className="flex items-center justify-between bg-cyber-darkblue/50 border border-cyber-blue/20 rounded-md p-3">
                      <span>Predictive Analysis</span>
                      <div className="w-12 h-6 bg-cyber-darkblue border border-cyber-blue/30 rounded-full p-1">
                        <div className="w-4 h-4 bg-cyber-blue rounded-full ml-auto"></div>
                      </div>
                    </div>

                    <div className="flex items-center justify-between bg-cyber-darkblue/50 border border-cyber-blue/20 rounded-md p-3">
                      <span>Auto Recommendations</span>
                      <div className="w-12 h-6 bg-cyber-darkblue border border-cyber-blue/30 rounded-full p-1">
                        <div className="w-4 h-4 bg-cyber-blue rounded-full ml-auto"></div>
                      </div>
                    </div>

                    <div className="flex items-center justify-between bg-cyber-darkblue/50 border border-cyber-blue/20 rounded-md p-3">
                      <span>Anomaly Detection</span>
                      <div className="w-12 h-6 bg-cyber-darkblue border border-cyber-blue/30 rounded-full p-1">
                        <div className="w-4 h-4 bg-cyber-blue rounded-full ml-auto"></div>
                      </div>
                    </div>

                    <div>
                      <Button 
                        variant="outline" 
                        className="bg-cyber-darkblue/50 border-cyber-purple/30 text-cyber-purple w-full"
                      >
                        Train New ML Model
                      </Button>
                      <p className="text-xs text-gray-400 mt-2">
                        Last trained: 3 days ago
                      </p>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </div>
          </TabsContent>
        </Tabs>
      </div>
    </Layout>
  );
};

export default HardwareMonitoring;
