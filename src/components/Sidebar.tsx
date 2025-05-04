
import React, { useState } from "react";
import { NavLink } from "react-router-dom";
import { cn } from "@/lib/utils";
import GamePathLogo from "./GamePathLogo";
import { useTranslation } from "react-i18next";
import {
  Home,
  Network,
  Settings,
  LayoutDashboard,
  Cpu,
  Activity,
  Server,
  Gamepad2,
  Zap,
  Shield,
  CreditCard,
  Wrench,
  LogOut,
  ChevronRight,
  ChevronDown,
  Monitor
} from "lucide-react";

const Sidebar = () => {
  const { t } = useTranslation();
  const [openMenus, setOpenMenus] = useState<Record<string, boolean>>({
    optimizations: false
  });

  const toggleMenu = (menu: string) => {
    setOpenMenus((prev) => ({ ...prev, [menu]: !prev[menu] }));
  };

  const isSubmenuActive = (paths: string[]) => {
    return paths.some(path => window.location.pathname === path);
  };

  return (
    <div className="w-64 h-screen bg-cyber-darkblue border-r border-cyber-blue/30 flex flex-col">
      <div className="p-4 border-b border-cyber-blue/30">
        <GamePathLogo className="h-8 w-auto" />
      </div>

      <nav className="flex-1 p-4 overflow-y-auto text-white text-sm">
        <ul className="space-y-1">
          {/* Dashboard */}
          <li>
            <NavLink
              to="/dashboard"
              className={({ isActive }) =>
                cn(
                  "flex items-center px-3 py-2 rounded-md transition-colors",
                  isActive
                    ? "bg-cyber-blue/20 text-cyber-blue"
                    : "hover:bg-cyber-blue/10"
                )
              }
            >
              <LayoutDashboard size={18} className="mr-2" />
              {t("navigation.dashboard")}
            </NavLink>
          </li>

          {/* Network Metrics */}
          <li>
            <NavLink
              to="/network-metrics"
              className={({ isActive }) =>
                cn(
                  "flex items-center px-3 py-2 rounded-md transition-colors",
                  isActive
                    ? "bg-cyber-blue/20 text-cyber-blue"
                    : "hover:bg-cyber-blue/10"
                )
              }
            >
              <Network size={18} className="mr-2" />
              {t("navigation.networkMetrics")}
            </NavLink>
          </li>

          {/* Monitoring Dashboard */}
          <li>
            <NavLink
              to="/monitoring-dashboard"
              className={({ isActive }) =>
                cn(
                  "flex items-center px-3 py-2 rounded-md transition-colors",
                  isActive
                    ? "bg-cyber-blue/20 text-cyber-blue"
                    : "hover:bg-cyber-blue/10"
                )
              }
            >
              <Monitor size={18} className="mr-2" />
              {t("monitoring.title")}
            </NavLink>
          </li>

          {/* Performance */}
          <li>
            <NavLink
              to="/performance"
              className={({ isActive }) =>
                cn(
                  "flex items-center px-3 py-2 rounded-md transition-colors",
                  isActive
                    ? "bg-cyber-blue/20 text-cyber-blue"
                    : "hover:bg-cyber-blue/10"
                )
              }
            >
              <Activity size={18} className="mr-2" />
              {t("navigation.performance")}
            </NavLink>
          </li>

          {/* Optimizations Dropdown */}
          <li>
            <button
              onClick={() => toggleMenu("optimizations")}
              className={cn(
                "flex items-center w-full px-3 py-2 rounded-md transition-colors",
                isSubmenuActive(["/system-optimization", "/route-optimizer", "/advanced-optimizer", "/power-manager"]) 
                  ? "bg-cyber-blue/20 text-cyber-blue"
                  : "hover:bg-cyber-blue/10"
              )}
            >
              <Zap size={18} className="mr-2" />
              <span className="flex-1 text-left">{t("navigation.optimizations")}</span>
              {openMenus.optimizations ? 
                <ChevronDown size={16} /> : 
                <ChevronRight size={16} />
              }
            </button>

            {openMenus.optimizations && (
              <ul className="pl-6 mt-1 space-y-1">
                <li>
                  <NavLink
                    to="/system-optimization"
                    className={({ isActive }) =>
                      cn(
                        "flex items-center px-3 py-2 rounded-md transition-colors",
                        isActive
                          ? "bg-cyber-blue/20 text-cyber-blue"
                          : "hover:bg-cyber-blue/10"
                      )
                    }
                  >
                    <Cpu size={16} className="mr-2" />
                    {t("navigation.systemOptimization")}
                  </NavLink>
                </li>
                <li>
                  <NavLink
                    to="/route-optimizer"
                    className={({ isActive }) =>
                      cn(
                        "flex items-center px-3 py-2 rounded-md transition-colors",
                        isActive
                          ? "bg-cyber-blue/20 text-cyber-blue"
                          : "hover:bg-cyber-blue/10"
                      )
                    }
                  >
                    <Server size={16} className="mr-2" />
                    {t("navigation.routeOptimizer")}
                  </NavLink>
                </li>
                <li>
                  <NavLink
                    to="/advanced-optimizer"
                    className={({ isActive }) =>
                      cn(
                        "flex items-center px-3 py-2 rounded-md transition-colors",
                        isActive
                          ? "bg-cyber-blue/20 text-cyber-blue"
                          : "hover:bg-cyber-blue/10"
                      )
                    }
                  >
                    <Wrench size={16} className="mr-2" />
                    {t("navigation.advancedOptimizer")}
                  </NavLink>
                </li>
                <li>
                  <NavLink
                    to="/power-manager"
                    className={({ isActive }) =>
                      cn(
                        "flex items-center px-3 py-2 rounded-md transition-colors",
                        isActive
                          ? "bg-cyber-blue/20 text-cyber-blue"
                          : "hover:bg-cyber-blue/10"
                      )
                    }
                  >
                    <Zap size={16} className="mr-2" />
                    {t("navigation.powerManager")}
                  </NavLink>
                </li>
              </ul>
            )}
          </li>
          
          {/* Games */}
          <li>
            <NavLink
              to="/games"
              className={({ isActive }) =>
                cn(
                  "flex items-center px-3 py-2 rounded-md transition-colors",
                  isActive
                    ? "bg-cyber-blue/20 text-cyber-blue"
                    : "hover:bg-cyber-blue/10"
                )
              }
            >
              <Gamepad2 size={18} className="mr-2" />
              {t("navigation.games")}
            </NavLink>
          </li>

          {/* VPN Integration */}
          <li>
            <NavLink
              to="/vpn-integration"
              className={({ isActive }) =>
                cn(
                  "flex items-center px-3 py-2 rounded-md transition-colors",
                  isActive
                    ? "bg-cyber-blue/20 text-cyber-blue"
                    : "hover:bg-cyber-blue/10"
                )
              }
            >
              <Shield size={18} className="mr-2" />
              {t("navigation.vpnIntegration")}
            </NavLink>
          </li>
        </ul>

        <div className="mt-8 border-t border-cyber-blue/30 pt-4">
          <ul className="space-y-1">
            {/* Subscription */}
            <li>
              <NavLink
                to="/subscription"
                className={({ isActive }) =>
                  cn(
                    "flex items-center px-3 py-2 rounded-md transition-colors",
                    isActive
                      ? "bg-cyber-blue/20 text-cyber-blue"
                      : "hover:bg-cyber-blue/10"
                  )
                }
              >
                <CreditCard size={18} className="mr-2" />
                {t("navigation.subscription")}
              </NavLink>
            </li>

            {/* Settings */}
            <li>
              <NavLink
                to="/settings"
                className={({ isActive }) =>
                  cn(
                    "flex items-center px-3 py-2 rounded-md transition-colors",
                    isActive
                      ? "bg-cyber-blue/20 text-cyber-blue"
                      : "hover:bg-cyber-blue/10"
                  )
                }
              >
                <Settings size={18} className="mr-2" />
                {t("navigation.settings")}
              </NavLink>
            </li>

            {/* Logout */}
            <li>
              <NavLink
                to="/login"
                className="flex items-center px-3 py-2 rounded-md transition-colors hover:bg-cyber-red/20 text-cyber-red"
              >
                <LogOut size={18} className="mr-2" />
                {t("navigation.logout")}
              </NavLink>
            </li>
          </ul>
        </div>
      </nav>
    </div>
  );
};

export default Sidebar;
