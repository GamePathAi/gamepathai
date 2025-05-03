
import React from "react";
import Layout from "@/components/Layout";
import { Helmet } from "react-helmet-async";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge"; // Add this import for Badge
import { AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, BarChart, Bar } from "recharts";
import { Download, RefreshCw, Clock, Settings, Bell, CloudLightning } from "lucide-react";
import { useAdvancedMetrics } from "@/hooks/useAdvancedMetrics";
import { cloudwatchClient } from "@/services/monitoring/cloudwatchClient";
import { ALERT_THRESHOLDS } from "@/services/monitoring/alarmsService";

const MonitoringDashboard = () => {
  const { 
    ping, 
    jitter, 
    fps, 
    system, 
    isOfflineMode, 
    monitoringEnabled, 
    setMonitoringEnabled,
    refetch
  } = useAdvancedMetrics();
  
  const isCloudwatchAvailable = cloudwatchClient.isAvailable();
  
  return (
    <Layout>
      <Helmet>
        <title>Monitoring Dashboard | GamePath AI</title>
      </Helmet>
      
      <div className="container mx-auto px-4 py-6">
        <div className="flex items-center justify-between mb-6">
          <div>
            <h1 className="text-2xl font-cyber font-bold text-white">Monitoring Dashboard</h1>
            <p className="text-gray-400">Advanced metrics and performance monitoring</p>
          </div>
          
          <div className="flex items-center gap-2">
            <Button 
              variant="outline" 
              size="sm"
              onClick={() => refetch()}
            >
              <RefreshCw size={16} className="mr-2" />
              Refresh Data
            </Button>
            
            <Button 
              variant={monitoringEnabled ? "default" : "outline"}
              size="sm"
              className={monitoringEnabled ? "bg-cyber-green hover:bg-cyber-green/90" : ""}
              onClick={() => setMonitoringEnabled(!monitoringEnabled)}
            >
              {monitoringEnabled ? "Monitoring Active" : "Monitoring Disabled"}
            </Button>
          </div>
        </div>
        
        {isOfflineMode && (
          <Card className="bg-amber-900/20 border border-amber-500/30 mb-6">
            <CardContent className="py-4">
              <div className="flex items-center gap-2">
                <CloudLightning size={18} className="text-amber-500" />
                <p className="text-amber-300">
                  You are currently in offline mode. Some advanced monitoring features are limited.
                </p>
              </div>
            </CardContent>
          </Card>
        )}
        
        {!isCloudwatchAvailable && (
          <Card className="bg-blue-900/20 border border-blue-500/30 mb-6">
            <CardContent className="py-4">
              <div className="flex items-center gap-2">
                <Bell size={18} className="text-blue-400" />
                <p className="text-blue-300">
                  CloudWatch integration is not available. Your metrics are being monitored locally only.
                </p>
              </div>
            </CardContent>
          </Card>
        )}
        
        <Tabs defaultValue="overview" className="space-y-4">
          <TabsList>
            <TabsTrigger value="overview">Overview</TabsTrigger>
            <TabsTrigger value="network">Network Metrics</TabsTrigger>
            <TabsTrigger value="system">System Metrics</TabsTrigger>
            <TabsTrigger value="alerts">Alerts & Thresholds</TabsTrigger>
          </TabsList>
          
          <TabsContent value="overview" className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
              <MetricCard 
                title="Current Ping" 
                value={ping?.current || 0} 
                unit="ms"
                trend={ping?.trend || "stable"}
              />
              <MetricCard 
                title="Connection Jitter" 
                value={jitter?.current || 0} 
                unit="ms"
                trend={jitter?.trend || "stable"}
              />
              <MetricCard 
                title="Current FPS" 
                value={fps?.current || 0} 
                unit="fps"
                trend={fps?.trend || "stable"}
              />
              <MetricCard 
                title="CPU Usage" 
                value={system?.cpu.usage || 0} 
                unit="%"
                trend={system?.cpu.trend || "stable"}
              />
            </div>
            
            <Card className="bg-cyber-darkblue border border-cyber-blue/30">
              <CardHeader>
                <CardTitle>Recent Performance</CardTitle>
                <CardDescription>Key metrics over time</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="h-[300px]">
                  <ResponsiveContainer width="100%" height="100%">
                    <AreaChart
                      data={ping?.history || []}
                      margin={{ top: 10, right: 30, left: 0, bottom: 0 }}
                    >
                      <CartesianGrid strokeDasharray="3 3" stroke="#334155" />
                      <XAxis dataKey="time" stroke="#94a3b8" />
                      <YAxis stroke="#94a3b8" />
                      <Tooltip contentStyle={{ backgroundColor: "#0f172a", borderColor: "#334155" }} />
                      <Area type="monotone" dataKey="value" stroke="#3b82f6" fill="#3b82f6" fillOpacity={0.2} />
                    </AreaChart>
                  </ResponsiveContainer>
                </div>
              </CardContent>
            </Card>
          </TabsContent>
          
          <TabsContent value="network" className="space-y-4">
            {/* Network metrics visualization */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <Card className="bg-cyber-darkblue border border-cyber-blue/30">
                <CardHeader>
                  <CardTitle>Ping Over Time</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="h-[300px]">
                    <ResponsiveContainer width="100%" height="100%">
                      <AreaChart
                        data={ping?.history || []}
                        margin={{ top: 10, right: 30, left: 0, bottom: 0 }}
                      >
                        <CartesianGrid strokeDasharray="3 3" stroke="#334155" />
                        <XAxis dataKey="time" stroke="#94a3b8" />
                        <YAxis stroke="#94a3b8" />
                        <Tooltip contentStyle={{ backgroundColor: "#0f172a", borderColor: "#334155" }} />
                        <Area type="monotone" dataKey="value" stroke="#3b82f6" fill="#3b82f6" fillOpacity={0.2} />
                      </AreaChart>
                    </ResponsiveContainer>
                  </div>
                </CardContent>
              </Card>
              
              <Card className="bg-cyber-darkblue border border-cyber-blue/30">
                <CardHeader>
                  <CardTitle>Jitter Over Time</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="h-[300px]">
                    <ResponsiveContainer width="100%" height="100%">
                      <AreaChart
                        data={jitter?.history || []}
                        margin={{ top: 10, right: 30, left: 0, bottom: 0 }}
                      >
                        <CartesianGrid strokeDasharray="3 3" stroke="#334155" />
                        <XAxis dataKey="time" stroke="#94a3b8" />
                        <YAxis stroke="#94a3b8" />
                        <Tooltip contentStyle={{ backgroundColor: "#0f172a", borderColor: "#334155" }} />
                        <Area type="monotone" dataKey="value" stroke="#f97316" fill="#f97316" fillOpacity={0.2} />
                      </AreaChart>
                    </ResponsiveContainer>
                  </div>
                </CardContent>
              </Card>
            </div>
            
            <Card className="bg-cyber-darkblue border border-cyber-blue/30">
              <CardHeader>
                <CardTitle>Network Stability Analysis</CardTitle>
                <CardDescription>Ping and jitter variance over time</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="h-[300px]">
                  <ResponsiveContainer width="100%" height="100%">
                    <BarChart
                      data={[
                        { name: "Min", ping: ping?.min || 0, jitter: jitter?.min || 0 },
                        { name: "Avg", ping: ping?.average || 0, jitter: jitter?.average || 0 },
                        { name: "Max", ping: ping?.max || 0, jitter: jitter?.max || 0 },
                        { name: "Current", ping: ping?.current || 0, jitter: jitter?.current || 0 }
                      ]}
                      margin={{ top: 20, right: 30, left: 20, bottom: 5 }}
                    >
                      <CartesianGrid strokeDasharray="3 3" stroke="#334155" />
                      <XAxis dataKey="name" stroke="#94a3b8" />
                      <YAxis stroke="#94a3b8" />
                      <Tooltip contentStyle={{ backgroundColor: "#0f172a", borderColor: "#334155" }} />
                      <Bar dataKey="ping" name="Ping (ms)" fill="#3b82f6" />
                      <Bar dataKey="jitter" name="Jitter (ms)" fill="#f97316" />
                    </BarChart>
                  </ResponsiveContainer>
                </div>
              </CardContent>
            </Card>
          </TabsContent>
          
          <TabsContent value="system" className="space-y-4">
            {/* System metrics visualization */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <Card className="bg-cyber-darkblue border border-cyber-blue/30">
                <CardHeader>
                  <CardTitle>CPU Usage Over Time</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="h-[300px]">
                    <ResponsiveContainer width="100%" height="100%">
                      <AreaChart
                        data={system?.cpu.history || []}
                        margin={{ top: 10, right: 30, left: 0, bottom: 0 }}
                      >
                        <CartesianGrid strokeDasharray="3 3" stroke="#334155" />
                        <XAxis dataKey="time" stroke="#94a3b8" />
                        <YAxis stroke="#94a3b8" />
                        <Tooltip contentStyle={{ backgroundColor: "#0f172a", borderColor: "#334155" }} />
                        <Area type="monotone" dataKey="value" stroke="#8b5cf6" fill="#8b5cf6" fillOpacity={0.2} />
                      </AreaChart>
                    </ResponsiveContainer>
                  </div>
                </CardContent>
              </Card>
              
              <Card className="bg-cyber-darkblue border border-cyber-blue/30">
                <CardHeader>
                  <CardTitle>GPU Usage Over Time</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="h-[300px]">
                    <ResponsiveContainer width="100%" height="100%">
                      <AreaChart
                        data={system?.gpu.history || []}
                        margin={{ top: 10, right: 30, left: 0, bottom: 0 }}
                      >
                        <CartesianGrid strokeDasharray="3 3" stroke="#334155" />
                        <XAxis dataKey="time" stroke="#94a3b8" />
                        <YAxis stroke="#94a3b8" />
                        <Tooltip contentStyle={{ backgroundColor: "#0f172a", borderColor: "#334155" }} />
                        <Area type="monotone" dataKey="value" stroke="#d946ef" fill="#d946ef" fillOpacity={0.2} />
                      </AreaChart>
                    </ResponsiveContainer>
                  </div>
                </CardContent>
              </Card>
            </div>
          </TabsContent>
          
          <TabsContent value="alerts" className="space-y-4">
            {/* Alert thresholds and settings */}
            <Card className="bg-cyber-darkblue border border-cyber-blue/30">
              <CardHeader>
                <div className="flex items-center justify-between">
                  <CardTitle>Alert Thresholds</CardTitle>
                  <Button variant="outline" size="sm">
                    <Settings size={16} className="mr-2" />
                    Configure
                  </Button>
                </div>
                <CardDescription>Current alert threshold configuration</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    <AlertThresholdCard 
                      title="Ping" 
                      warningThreshold={`${ALERT_THRESHOLDS.ping.warning} ms`} 
                      criticalThreshold={`${ALERT_THRESHOLDS.ping.critical} ms`} 
                      currentValue={`${ping?.current || 0} ms`}
                    />
                    <AlertThresholdCard 
                      title="Jitter" 
                      warningThreshold={`${ALERT_THRESHOLDS.jitter.warning} ms`} 
                      criticalThreshold={`${ALERT_THRESHOLDS.jitter.critical} ms`} 
                      currentValue={`${jitter?.current || 0} ms`}
                    />
                    <AlertThresholdCard 
                      title="FPS" 
                      warningThreshold={`${ALERT_THRESHOLDS.fps.warning} fps`} 
                      criticalThreshold={`${ALERT_THRESHOLDS.fps.critical} fps`} 
                      currentValue={`${fps?.current || 0} fps`}
                      isLowerBad={true}
                    />
                  </div>
                  
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <AlertThresholdCard 
                      title="CPU Usage" 
                      warningThreshold={`${ALERT_THRESHOLDS.cpu.warning}%`} 
                      criticalThreshold={`${ALERT_THRESHOLDS.cpu.critical}%`} 
                      currentValue={`${system?.cpu.usage.toFixed(1) || 0}%`}
                    />
                    <AlertThresholdCard 
                      title="GPU Usage" 
                      warningThreshold={`${ALERT_THRESHOLDS.gpu.warning}%`} 
                      criticalThreshold={`${ALERT_THRESHOLDS.gpu.critical}%`} 
                      currentValue={`${system?.gpu.usage.toFixed(1) || 0}%`}
                    />
                  </div>
                </div>
              </CardContent>
            </Card>
            
            <Card className="bg-cyber-darkblue border border-cyber-blue/30">
              <CardHeader>
                <CardTitle>Recent Alerts</CardTitle>
                <CardDescription>Alert history from the last 24 hours</CardDescription>
              </CardHeader>
              <CardContent className="p-0">
                <div className="border-t border-border/30">
                  <div className="p-4 border-b border-border/30 flex items-center justify-between">
                    <div className="flex items-center">
                      <Badge className="bg-amber-500/20 text-amber-500 mr-3">Warning</Badge>
                      <div>
                        <p className="font-medium">High ping detected: 128ms</p>
                        <p className="text-sm text-gray-400">Your ping is higher than recommended</p>
                      </div>
                    </div>
                    <div className="flex items-center text-gray-400 text-sm">
                      <Clock size={14} className="mr-1" />
                      <span>2 hours ago</span>
                    </div>
                  </div>
                  
                  <div className="p-4 border-b border-border/30 flex items-center justify-between">
                    <div className="flex items-center">
                      <Badge className="bg-red-500/20 text-red-500 mr-3">Critical</Badge>
                      <div>
                        <p className="font-medium">CPU Usage: 92%</p>
                        <p className="text-sm text-gray-400">CPU under heavy load</p>
                      </div>
                    </div>
                    <div className="flex items-center text-gray-400 text-sm">
                      <Clock size={14} className="mr-1" />
                      <span>4 hours ago</span>
                    </div>
                  </div>
                  
                  <div className="p-4 border-b border-border/30 flex items-center justify-between">
                    <div className="flex items-center">
                      <Badge className="bg-amber-500/20 text-amber-500 mr-3">Warning</Badge>
                      <div>
                        <p className="font-medium">FPS Drop: 28 FPS</p>
                        <p className="text-sm text-gray-400">Your game is running below recommended FPS</p>
                      </div>
                    </div>
                    <div className="flex items-center text-gray-400 text-sm">
                      <Clock size={14} className="mr-1" />
                      <span>6 hours ago</span>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
        
        <div className="mt-6 flex justify-end">
          <Button variant="outline" size="sm">
            <Download size={16} className="mr-2" />
            Export Monitoring Data
          </Button>
        </div>
      </div>
    </Layout>
  );
};

// Helper component for metric cards
const MetricCard = ({ title, value, unit, trend }: { 
  title: string, 
  value: number, 
  unit: string,
  trend: "up" | "down" | "stable"
}) => {
  return (
    <Card className="bg-cyber-darkblue border border-cyber-blue/30">
      <CardContent className="p-4">
        <div className="text-sm text-gray-400">{title}</div>
        <div className="text-2xl font-bold mt-1 flex items-center">
          {value} <span className="text-sm ml-1">{unit}</span>
          
          {trend === "up" && (
            <span className="text-red-400 text-sm ml-2">↑</span>
          )}
          {trend === "down" && (
            <span className="text-green-400 text-sm ml-2">↓</span>
          )}
        </div>
      </CardContent>
    </Card>
  );
};

// Helper component for alert threshold cards
const AlertThresholdCard = ({ 
  title, 
  warningThreshold, 
  criticalThreshold,
  currentValue,
  isLowerBad = false // For metrics like FPS where lower is bad
}: { 
  title: string,
  warningThreshold: string,
  criticalThreshold: string,
  currentValue: string,
  isLowerBad?: boolean
}) => {
  // Extract numeric value to determine status
  const numericValue = parseFloat(currentValue.split(' ')[0]);
  const warningValue = parseFloat(warningThreshold.split(' ')[0]);
  const criticalValue = parseFloat(criticalThreshold.split(' ')[0]);
  
  let status: "normal" | "warning" | "critical" = "normal";
  
  if (isLowerBad) {
    // For metrics like FPS where lower values are bad
    if (numericValue <= criticalValue) {
      status = "critical";
    } else if (numericValue <= warningValue) {
      status = "warning";
    }
  } else {
    // For metrics like ping where higher values are bad
    if (numericValue >= criticalValue) {
      status = "critical";
    } else if (numericValue >= warningValue) {
      status = "warning";
    }
  }

  return (
    <Card className={`
      border 
      ${status === "normal" ? "border-cyber-blue/30" : ""}
      ${status === "warning" ? "border-amber-500/50 bg-amber-900/10" : ""}
      ${status === "critical" ? "border-red-500/50 bg-red-900/10" : ""}
    `}>
      <CardContent className="p-3">
        <div className="text-sm font-medium mb-2">{title}</div>
        
        <div className="grid grid-cols-2 gap-2 text-sm">
          <div>
            <div className="text-gray-400">Warning</div>
            <div className="font-mono">{warningThreshold}</div>
          </div>
          <div>
            <div className="text-gray-400">Critical</div>
            <div className="font-mono">{criticalThreshold}</div>
          </div>
        </div>
        
        <div className="mt-3 pt-3 border-t border-border/30">
          <div className="text-gray-400 text-xs">Current Value</div>
          <div className={`
            font-bold text-lg
            ${status === "normal" ? "text-green-400" : ""}
            ${status === "warning" ? "text-amber-400" : ""}
            ${status === "critical" ? "text-red-400" : ""}
          `}>
            {currentValue}
          </div>
        </div>
      </CardContent>
    </Card>
  );
};

export default MonitoringDashboard;
