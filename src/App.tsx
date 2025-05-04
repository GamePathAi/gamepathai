
import { useState } from "react";
import { BrowserRouter as Router, Routes, Route } from "react-router-dom";
import Dashboard from "./pages/Dashboard";
import Performance from "./pages/Performance";
import SystemOptimization from "./pages/SystemOptimization";
import HardwareMonitoring from "./pages/HardwareMonitoring";
import { ThemeProvider } from "./providers/ThemeProvider";
import { PermissionsProvider } from "./contexts/PermissionsContext";
import { TooltipProvider } from "@/components/ui/tooltip";
import { Toaster } from "sonner";
import { I18nextProvider } from "react-i18next";
import i18n from "./lib/i18n";

function App() {
  return (
    <ThemeProvider>
      <PermissionsProvider>
        <TooltipProvider>
          <I18nextProvider i18n={i18n}>
            <Router>
              <Routes>
                <Route path="/" element={<Dashboard />} />
                <Route path="/performance" element={<Performance />} />
                <Route path="/system" element={<SystemOptimization />} />
                <Route path="/hardware" element={<HardwareMonitoring />} />
              </Routes>
            </Router>
            <Toaster position="top-right" theme="dark" />
          </I18nextProvider>
        </TooltipProvider>
      </PermissionsProvider>
    </ThemeProvider>
  );
}

export default App;
