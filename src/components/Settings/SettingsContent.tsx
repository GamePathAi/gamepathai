
import React, { useState } from "react";
import { useNavigate } from "react-router-dom";
import { toast } from "sonner";
import { 
  Settings, 
  Cpu, 
  Network, 
  Monitor, 
  Video, 
  LayoutDashboard, 
  ShieldCheck, 
  CreditCard, 
  Code,
  Key
} from "lucide-react";
import SettingsTabs, { SettingsTab } from "./SettingsTabs";
import SettingsHeader from "./SettingsHeader";
import SettingsActions from "./SettingsActions";
import ResetDialog from "./ResetDialog";
import { importSettingsFile, exportSettingsFile } from "./utils/settingsHelpers";

// Import all tab content components
import GeneralSettings from "./Tabs/GeneralSettings";
import PerformanceSettings from "./Tabs/PerformanceSettings";
import ConnectionSettings from "./Tabs/ConnectionSettings";
import InterfaceSettings from "./Tabs/InterfaceSettings";
import SecuritySettings from "./Tabs/SecuritySettings";
import AdvancedSettings from "./Tabs/AdvancedSettings";
import InGameOverlaySettings from "./Tabs/InGameOverlaySettings";
import ScreenRecordingSettings from "./Tabs/ScreenRecordingSettings";
import SubscriptionSettings from "./Tabs/SubscriptionSettings";
import PermissionsSettings from "./Tabs/PermissionsSettings";

interface SettingsChangeProps {
  onChange: () => void;
}

const SettingsContent: React.FC = () => {
  // Define tabs configuration
  const settingsTabs: SettingsTab[] = [
    { id: "general", label: "General", icon: Settings },
    { id: "performance", label: "Performance", icon: Cpu },
    { id: "connection", label: "Connection", icon: Network },
    { id: "overlay", label: "In-Game Overlay", icon: Monitor },
    { id: "recording", label: "Screen Recording", icon: Video },
    { id: "interface", label: "Interface", icon: LayoutDashboard },
    { id: "permissions", label: "Permissions", icon: Key },
    { id: "security", label: "Security", icon: ShieldCheck },
    { id: "subscription", label: "Subscription", icon: CreditCard },
    { id: "advanced", label: "Advanced", icon: Code }
  ];

  const [activeTab, setActiveTab] = useState("general");
  const [resetDialogOpen, setResetDialogOpen] = useState(false);
  const [hasChanges, setHasChanges] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const navigate = useNavigate();

  const handleSaveChanges = () => {
    setIsSaving(true);
    
    // Simulate saving process
    setTimeout(() => {
      toast.success("Settings saved successfully", {
        description: "Your preferences have been updated."
      });
      setHasChanges(false);
      setIsSaving(false);
    }, 1000);
  };

  const handleResetToDefault = () => {
    setResetDialogOpen(true);
  };

  const confirmReset = () => {
    toast.success("Settings reset to defaults", {
      description: "All settings have been restored to default values."
    });
    setHasChanges(false);
    setResetDialogOpen(false);
  };

  const handleSettingChange = () => {
    setHasChanges(true);
  };
  
  const handleImportSettings = () => {
    importSettingsFile(() => {
      toast.success("Settings imported successfully", {
        description: "Imported settings have been applied"
      });
      setHasChanges(true);
    });
  };
  
  const handleExportSettings = () => {
    exportSettingsFile(() => {
      toast.success("Settings exported successfully", {
        description: "Your settings have been saved to gamepath-settings.json"
      });
    });
  };

  const handleNavigateToAdvanced = () => {
    navigate("/advanced-settings");
  };

  const renderActiveTabContent = () => {
    const settingsChangeProps: SettingsChangeProps = {
      onChange: handleSettingChange
    };

    switch (activeTab) {
      case "general":
        return <GeneralSettings {...settingsChangeProps} />;
      case "performance":
        return <PerformanceSettings {...settingsChangeProps} />;
      case "connection":
        return <ConnectionSettings {...settingsChangeProps} />;
      case "overlay":
        return <InGameOverlaySettings {...settingsChangeProps} />;
      case "recording":
        return <ScreenRecordingSettings {...settingsChangeProps} />;
      case "interface":
        return <InterfaceSettings {...settingsChangeProps} />;
      case "permissions":
        return <PermissionsSettings {...settingsChangeProps} />;
      case "security":
        return <SecuritySettings {...settingsChangeProps} />;
      case "subscription":
        return <SubscriptionSettings {...settingsChangeProps} />;
      case "advanced":
        return <AdvancedSettings {...settingsChangeProps} />;
      default:
        return <GeneralSettings {...settingsChangeProps} />;
    }
  };

  return (
    <div className="w-full max-w-7xl mx-auto px-4 py-3">
      <div className="flex flex-col md:flex-row md:items-center justify-between mb-2 gap-2">
        <SettingsHeader 
          title="Settings"
          description="Customize your GamePath AI experience"
        />
        
        <SettingsActions
          onImport={handleImportSettings}
          onExport={handleExportSettings}
          onReset={handleResetToDefault}
          onSave={handleSaveChanges}
          hasChanges={hasChanges}
          isSaving={isSaving}
        />
      </div>

      <div className="bg-cyber-darkblue border border-cyber-blue/30 rounded-lg shadow-lg">
        <SettingsTabs 
          tabs={settingsTabs}
          activeTab={activeTab} 
          setActiveTab={setActiveTab} 
        />
        
        <div className="p-3">
          {renderActiveTabContent()}
        </div>
      </div>
      
      <ResetDialog
        open={resetDialogOpen}
        onOpenChange={setResetDialogOpen}
        onConfirm={confirmReset}
      />
    </div>
  );
};

export default SettingsContent;
