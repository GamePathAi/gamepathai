
import React, { useState, useEffect } from "react";
import { Helmet } from "react-helmet-async";
import Layout from "@/components/Layout";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import HardwareMonitor from "@/components/hardware/HardwareMonitor";
import { useHardwareMonitoring } from "@/hooks/useHardwareMonitoring";
import { Cpu, Thermometer, Activity, ChartBar, RefreshCw, Download, Settings, Brain } from "lucide-react";
import { HardDrive as MemoryIcon } from "lucide-react";
import { Select, SelectTrigger, SelectValue, SelectContent, SelectItem } from "@/components/ui/select";
import { LineChartComponent } from "@/components/charts/LineChartComponent";
import { hardwareMonitoringService } from "@/services/hardware/hardwareMonitoringService";
import { toast } from "sonner";
import DMISStatus from "@/components/dmis/DMISStatus";
import { useDMIS } from "@/hooks/useDMIS";

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
  const [dmisEnabled, setDmisEnabled] = useState(false);

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

  // Initialize DMIS system
  const {
    status: dmisStatus,
    isInitializing: dmisInitializing,
    generateOptimizedSettings,
    analyzeBottlenecks
  } = useDMIS({ autoInitialize: dmisEnabled });

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

  const handleDmisAnalysis = async () => {
    if (!data || !dmisStatus.initialized || !selectedGame) {
      toast.error("Cannot perform DMIS analysis", {
        description: "Please select a game and ensure DMIS is initialized"
      });
      return;
    }

    try {
      toast.info("Running DMIS analysis", {
        description: "Analyzing hardware and generating optimized settings..."
      });

      // Run bottleneck analysis
      const bottleneckAnalysis = await analyzeBottlenecks(data, selectedGame);

      // Get optimized settings
      const optimizedSettings = await generateOptimizedSettings(selectedGame, data);

      // Display results
      toast.success("DMIS analysis complete", {
        description: `Identified ${Object.keys(bottleneckAnalysis.bottlenecks).length} potential bottlenecks`
      });

      // Show the most significant bottleneck
      const sortedBottlenecks = Object.entries(bottleneckAnalysis.bottlenecks)
        .sort((a, b) => b[1] - a[1]);
      
      if (sortedBottlenecks.length > 0 && sortedBottlenecks[0][1] > 0.5) {
        const [component, probability] = sortedBottlenecks[0];
        toast.info(`Primary bottleneck: ${component.toUpperCase()}`, {
          description: `${Math.round(probability * 100)}% probability - ${bottleneckAnalysis.explanations[0] || "Limiting your performance"}`
        });
      }
      
      console.log("DMIS Bottleneck Analysis:", bottleneckAnalysis);
      console.log("DMIS Optimized Settings:", optimizedSettings);
    } catch (err) {
      console.error("DMIS analysis failed:", err);
      toast.error("DMIS analysis failed", {
        description: err instanceof Error ? err.message : "An unknown error occurred"
      });
    }
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

            {dmisStatus.initialized && (
              <Button
                variant="outline"
                className="bg-cyber-darkblue border-cyber-purple/30 text-cyber-purple"
                onClick={handleDmisAnalysis}
                disabled={!data || !selectedGame}
              >
                <Brain className="h-4 w-4 mr-2" />
                DMIS Analysis
              </Button>
            )}
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
            <TabsTrigger
              value="dmis"
              className="font-tech data-[state=active]:bg-cyber-purple/20 data-[state=active]:text-cyber-purple"
            >
              <Brain size={16} className="mr-2" />
              Meta-Intelligence
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
                      <span>Meta-Intelligence System</span>
                      <div 
                        className="w-12 h-6 bg-cyber-darkblue border border-cyber-blue/30 rounded-full p-1 cursor-pointer"
                        onClick={() => setDmisEnabled(!dmisEnabled)}
                      >
                        <div className={`w-4 h-4 rounded-full transition-all ${dmisEnabled ? "bg-cyber-purple ml-auto" : "bg-gray-500"}`}></div>
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

          {/* DMIS tab */}
          <TabsContent value="dmis" className="mt-0">
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              {/* DMIS Status */}
              <div className="col-span-1">
                <DMISStatus showControls={true} />
              </div>

              {/* DMIS Information */}
              <Card className="cyber-panel col-span-1">
                <CardHeader className="pb-2">
                  <CardTitle className="text-lg font-tech">
                    <Brain className="h-5 w-5 mr-2 inline-block text-cyber-purple" />
                    About Meta-Intelligence System
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    <p className="text-sm text-gray-300">
                      The Distributed Meta-Intelligence System (DMIS) is a revolutionary approach to game optimization. 
                      Unlike traditional systems, DMIS leverages federated learning across a network of devices to 
                      create ever-improving optimization models specific to your hardware and games.
                    </p>

                    <div className="bg-cyber-darkblue/50 border border-cyber-purple/20 rounded p-3 space-y-2">
                      <h3 className="text-sm font-semibold text-cyber-purple">Key Features:</h3>
                      <ul className="space-y-1 text-sm text-gray-300">
                        <li className="flex items-start">
                          <div className="w-1 h-1 mt-1.5 rounded-full bg-cyber-purple mr-2"></div>
                          <span>Federated Learning: Distributed model training while preserving privacy</span>
                        </li>
                        <li className="flex items-start">
                          <div className="w-1 h-1 mt-1.5 rounded-full bg-cyber-purple mr-2"></div>
                          <span>Neural Prediction Engine: Multi-dimensional analysis of hardware and settings</span>
                        </li>
                        <li className="flex items-start">
                          <div className="w-1 h-1 mt-1.5 rounded-full bg-cyber-purple mr-2"></div>
                          <span>Community Knowledge Bank: Shared optimization strategies from similar systems</span>
                        </li>
                        <li className="flex items-start">
                          <div className="w-1 h-1 mt-1.5 rounded-full bg-cyber-purple mr-2"></div>
                          <span>Self-Evolution: System gets smarter with each analysis, without intervention</span>
                        </li>
                      </ul>
                    </div>

                    <div className="bg-cyber-darkblue/50 border border-cyber-blue/20 rounded p-3">
                      <h3 className="text-sm font-semibold text-cyber-blue mb-2">System Intelligence Score</h3>
                      <p className="text-xs text-gray-400 mb-3">
                        This measures how effectively the system is learning and optimizing. Scores improve with
                        more usage and feedback from your specific hardware and games.
                      </p>
                      <div className="flex justify-between text-xs mb-1">
                        <span>Initial</span>
                        <span>Advanced</span>
                        <span>Expert</span>
                      </div>
                      <div className="h-2 bg-cyber-darkblue/80 rounded overflow-hidden">
                        <div 
                          className="h-full bg-gradient-to-r from-cyber-blue to-cyber-purple"
                          style={{ width: `${dmisStatus.overallScore * 100}%` }}
                        ></div>
                      </div>
                      <div className="mt-2 text-xs text-center text-cyber-blue">
                        {Math.round(dmisStatus.overallScore * 100)}% Intelligence Score
                      </div>
                    </div>

                    <p className="text-xs text-gray-400">
                      Enable the Meta-Intelligence System in the Advanced Settings tab to start
                      benefitting from distributed learning for game optimization. The system improves
                      with usage and contributes anonymously to the community knowledge bank.
                    </p>

                    <div className="flex justify-end">
                      <Button
                        variant="outline"
                        size="sm"
                        className="border-cyber-purple/30 text-cyber-purple hover:bg-cyber-purple/10"
                        onClick={() => setActiveTab("advanced")}
                      >
                        <Settings className="h-3 w-3 mr-1" />
                        Configure Settings
                      </Button>
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
