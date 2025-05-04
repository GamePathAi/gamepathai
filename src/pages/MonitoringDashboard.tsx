
import React, { useState } from "react";
import Layout from "@/components/Layout";
import HardwareMonitor from "@/components/hardware/HardwareMonitor";
import AwsIntegrationStatus from "@/components/aws-integration/AwsIntegrationStatus";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { usePermissions } from "@/contexts/PermissionsContext";
import PermissionGate from "@/components/permissions/PermissionGate";
import { Button } from "@/components/ui/button";
import { useTranslation } from "react-i18next";
import { Helmet } from "react-helmet-async";
import { toast } from "sonner";
import { 
  Activity, 
  Cpu, 
  Network, 
  Server, 
  HardDrive,
  RefreshCw
} from "lucide-react";

const MonitoringDashboard: React.FC = () => {
  const { t } = useTranslation();
  const { requestPermission } = usePermissions();
  const [selectedTab, setSelectedTab] = useState("hardware");
  const [isRefreshing, setIsRefreshing] = useState(false);
  
  const handleRefresh = async () => {
    setIsRefreshing(true);
    
    // Simulate refresh delay
    await new Promise(resolve => setTimeout(resolve, 1500));
    
    toast.success(t("monitoring.refreshSuccess"), {
      description: t("monitoring.dataUpdated")
    });
    
    setIsRefreshing(false);
  };
  
  const handleRequestAllPermissions = async () => {
    try {
      await requestPermission("hardware_monitoring");
      await requestPermission("network_tools");
      await requestPermission("system_optimization");
      
      toast.success(t("permissions.granted"), {
        description: t("monitoring.allPermissionsGranted")
      });
    } catch (error) {
      console.error("Error requesting permissions:", error);
      toast.error(t("permissions.error"), {
        description: t("permissions.tryAgain")
      });
    }
  };
  
  return (
    <Layout>
      <Helmet>
        <title>GamePath AI - {t("monitoring.title")}</title>
      </Helmet>
      
      <div className="container mx-auto px-4 py-6">
        <div className="flex justify-between items-center mb-6">
          <div>
            <h1 className="text-2xl font-bold text-white">{t("monitoring.title")}</h1>
            <p className="text-gray-400 mt-1">{t("monitoring.description")}</p>
          </div>
          
          <div className="flex items-center gap-2">
            <Button
              variant="outline"
              size="sm"
              onClick={handleRequestAllPermissions}
              className="border-cyber-blue/40 text-cyber-blue"
            >
              {t("monitoring.requestAllPermissions")}
            </Button>
            
            <Button
              variant="default"
              size="sm"
              onClick={handleRefresh}
              disabled={isRefreshing}
              className="bg-cyber-blue hover:bg-cyber-blue/80"
            >
              <RefreshCw className={`h-4 w-4 mr-1 ${isRefreshing ? "animate-spin" : ""}`} />
              {t("monitoring.refresh")}
            </Button>
          </div>
        </div>
        
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-6">
          <div className="col-span-2">
            <AwsIntegrationStatus />
          </div>
          <div className="bg-cyber-darkblue border border-cyber-blue/30 rounded-lg p-4">
            <h2 className="text-lg font-tech mb-4 flex items-center gap-2">
              <Activity size={20} className="text-cyber-blue" />
              {t("monitoring.systemStatus")}
            </h2>
            
            <div className="space-y-4">
              <div className="flex justify-between items-center">
                <span className="text-gray-300">{t("hardware.cpu")}</span>
                <span className="text-cyber-green">OK</span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-gray-300">{t("hardware.gpu")}</span>
                <span className="text-cyber-green">OK</span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-gray-300">{t("hardware.ram")}</span>
                <span className="text-cyber-yellow">WARNING</span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-gray-300">{t("network.connection")}</span>
                <span className="text-cyber-green">OK</span>
              </div>
            </div>
          </div>
        </div>
        
        <Tabs defaultValue="hardware" value={selectedTab} onValueChange={setSelectedTab} className="w-full">
          <TabsList className="grid grid-cols-4 bg-cyber-darkblue/70">
            <TabsTrigger value="hardware" className="data-[state=active]:bg-cyber-blue">
              <Cpu className="h-4 w-4 mr-2" /> {t("monitoring.hardware")}
            </TabsTrigger>
            <TabsTrigger value="network" className="data-[state=active]:bg-cyber-blue">
              <Network className="h-4 w-4 mr-2" /> {t("monitoring.network")}
            </TabsTrigger>
            <TabsTrigger value="storage" className="data-[state=active]:bg-cyber-blue">
              <HardDrive className="h-4 w-4 mr-2" /> {t("monitoring.storage")}
            </TabsTrigger>
            <TabsTrigger value="processes" className="data-[state=active]:bg-cyber-blue">
              <Server className="h-4 w-4 mr-2" /> {t("monitoring.processes")}
            </TabsTrigger>
          </TabsList>
          
          <div className="mt-6">
            <TabsContent value="hardware">
              <HardwareMonitor autoStart={selectedTab === "hardware"} />
            </TabsContent>
            
            <TabsContent value="network">
              <PermissionGate permissionType="network_tools">
                <div className="bg-cyber-darkblue/70 border border-cyber-blue/30 rounded-lg p-6">
                  <h3 className="text-xl font-medium text-white mb-4">{t("network.title")}</h3>
                  
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    {/* Network components will be implemented in next phase */}
                    <div className="bg-cyber-darkblue/40 border border-cyber-blue/20 rounded-lg p-4">
                      <h4 className="text-lg font-medium text-white mb-2">{t("network.ping")}</h4>
                      <div className="flex justify-between items-center">
                        <span className="text-gray-400">{t("network.current")}</span>
                        <span className="text-cyber-green text-xl font-bold">32ms</span>
                      </div>
                      <div className="h-20 mt-4 bg-cyber-darkblue/50 rounded flex items-end">
                        {/* Placeholder for ping graph */}
                        <div className="flex-1 flex items-end justify-around">
                          {[30, 28, 35, 32, 29, 32, 31].map((value, index) => (
                            <div
                              key={index}
                              className="w-2 bg-cyber-blue"
                              style={{ height: `${value}%` }}
                            ></div>
                          ))}
                        </div>
                      </div>
                    </div>
                    
                    <div className="bg-cyber-darkblue/40 border border-cyber-blue/20 rounded-lg p-4">
                      <h4 className="text-lg font-medium text-white mb-2">{t("network.jitter")}</h4>
                      <div className="flex justify-between items-center">
                        <span className="text-gray-400">{t("network.current")}</span>
                        <span className="text-cyber-green text-xl font-bold">4.2ms</span>
                      </div>
                      <div className="h-20 mt-4 bg-cyber-darkblue/50 rounded flex items-end">
                        {/* Placeholder for jitter graph */}
                        <div className="flex-1 flex items-end justify-around">
                          {[10, 8, 15, 12, 9, 18, 11].map((value, index) => (
                            <div
                              key={index}
                              className="w-2 bg-cyber-blue"
                              style={{ height: `${value}%` }}
                            ></div>
                          ))}
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              </PermissionGate>
            </TabsContent>
            
            <TabsContent value="storage">
              <PermissionGate permissionType="file_access">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  {/* Storage components will be implemented in next phase */}
                  <div className="bg-cyber-darkblue/70 border border-cyber-blue/30 rounded-lg p-6">
                    <h3 className="text-xl font-medium text-white mb-4">{t("storage.drives")}</h3>
                    <p className="text-gray-400">
                      {t("monitoring.comingSoon")}
                    </p>
                  </div>
                  
                  <div className="bg-cyber-darkblue/70 border border-cyber-blue/30 rounded-lg p-6">
                    <h3 className="text-xl font-medium text-white mb-4">{t("storage.usage")}</h3>
                    <p className="text-gray-400">
                      {t("monitoring.comingSoon")}
                    </p>
                  </div>
                </div>
              </PermissionGate>
            </TabsContent>
            
            <TabsContent value="processes">
              <PermissionGate permissionType="system_optimization">
                <div className="bg-cyber-darkblue/70 border border-cyber-blue/30 rounded-lg p-6">
                  <h3 className="text-xl font-medium text-white mb-4">{t("processes.running")}</h3>
                  <p className="text-gray-400">
                    {t("monitoring.comingSoon")}
                  </p>
                </div>
              </PermissionGate>
            </TabsContent>
          </div>
        </Tabs>
      </div>
    </Layout>
  );
};

export default MonitoringDashboard;
