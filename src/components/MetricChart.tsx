
import React from "react";
import { LineChart, Line, ResponsiveContainer, XAxis, YAxis, Tooltip, CartesianGrid } from "recharts";

interface MetricChartProps {
  data: Array<{ time: string; value: number }>;
  dataKey?: string;
  color?: string;
  height?: number;
  strokeWidth?: number;
  showAxis?: boolean;
  metricType?: "ping" | "packet-loss" | "fps" | "cpu" | "gpu" | "jitter" | "temperature";
  showGlow?: boolean;
}

const MetricChart: React.FC<MetricChartProps> = ({
  data,
  dataKey = "value",
  color,
  height = 200,
  strokeWidth = 2,
  showAxis = true,
  metricType,
  showGlow = true
}) => {
  // Enforce maximum height to prevent excessive growth
  const effectiveHeight = Math.min(height, 240);
  
  const getColor = () => {
    if (color) return color;
    
    switch(metricType) {
      case "ping": return "#33C3F0";
      case "packet-loss": return "#F43F5E";
      case "fps": return "#10B981";
      case "cpu": return "#8B5CF6";
      case "gpu": return "#D946EF";
      case "jitter": return "#F97316";
      case "temperature": return "#F43F5E";
      default: return "#33C3F0";
    }
  };
  
  const chartColor = getColor();

  const filterId = `glow-${metricType || 'default'}-${Math.random().toString(36).substring(2, 9)}`;

  const enhancedData = data?.length >= 2 ? data : generatePlaceholderData(metricType);
  
  const metricLabel = getMetricLabel(metricType);

  return (
    <div className="w-full h-full relative flex-grow chart-container" style={{
      maxHeight: `${effectiveHeight}px`,
      minHeight: "120px",
      overflow: "hidden"
    }}>
      {showGlow && (
        <svg width="0" height="0" style={{ position: 'absolute' }}>
          <defs>
            <filter id={filterId} x="-50%" y="-50%" width="200%" height="200%">
              <feGaussianBlur stdDeviation="3" result="blur" />
              <feFlood floodColor={chartColor} floodOpacity="0.5" result="color" />
              <feComposite in="color" in2="blur" operator="in" result="glow" />
              <feMerge>
                <feMergeNode in="glow" />
                <feMergeNode in="SourceGraphic" />
              </feMerge>
            </filter>
          </defs>
        </svg>
      )}

      <ResponsiveContainer width="100%" height="100%">
        <LineChart 
          data={enhancedData} 
          margin={{ top: 5, right: 10, left: showAxis ? 10 : 0, bottom: 5 }}
          data-metric={metricType}
        >
          {showAxis && (
            <CartesianGrid 
              strokeDasharray="3 3"
              vertical={true}
              stroke="rgba(255,255,255,0.1)" 
            />
          )}
          {showAxis && <XAxis 
            dataKey="time" 
            stroke="rgba(255,255,255,0.5)"
            tick={{fill: "rgba(255,255,255,0.7)", fontSize: 10}}
            tickLine={{stroke: "rgba(255,255,255,0.3)"}}
            axisLine={{stroke: "rgba(255,255,255,0.3)"}}
            interval="preserveStartEnd"
            minTickGap={15}
          />}
          {showAxis && <YAxis 
            stroke="rgba(255,255,255,0.5)"
            tick={{fill: "rgba(255,255,255,0.7)", fontSize: 10}}
            tickLine={{stroke: "rgba(255,255,255,0.3)"}}
            axisLine={{stroke: "rgba(255,255,255,0.3)"}}
            width={30}
            tickCount={5}
          />}
          <Tooltip 
            contentStyle={{ 
              backgroundColor: '#121223', 
              borderColor: chartColor,
              fontFamily: 'Share Tech Mono, monospace',
              fontSize: '12px',
              boxShadow: `0 0 15px ${chartColor}60`,
              padding: '8px'
            }}
            formatter={(value) => [`${value}`, metricLabel]}
            labelFormatter={(label) => `Time: ${label}`}
            animationDuration={300}
          />
          <Line
            type="monotone"
            dataKey={dataKey}
            stroke={chartColor}
            strokeWidth={strokeWidth}
            dot={{ fill: chartColor, r: 2 }}
            activeDot={{ r: 5, fill: chartColor, stroke: '#FFFFFF' }}
            isAnimationActive={true}
            animationDuration={1500}
            filter={showGlow ? `url(#${filterId})` : undefined}
            style={{ filter: showGlow ? `drop-shadow(0 0 3px ${chartColor})` : 'none' }}
            connectNulls={true}
          />
        </LineChart>
      </ResponsiveContainer>

      {showGlow && (
        <div 
          className="absolute top-0 left-0 w-full h-full opacity-30 animate-pulse-slow pointer-events-none" 
          style={{
            background: `radial-gradient(circle, ${chartColor}30 0%, transparent 70%)`,
            mixBlendMode: 'screen'
          }}
        />
      )}
    </div>
  );
};

const generatePlaceholderData = (metricType?: string) => {
  let baseValue = 50;
  let variance = 20;
  
  switch(metricType) {
    case "ping": 
      baseValue = 30; 
      variance = 15;
      break;
    case "packet-loss": 
      baseValue = 1; 
      variance = 1;
      break;
    case "fps": 
      baseValue = 120; 
      variance = 30;
      break;
    case "cpu": 
      baseValue = 40; 
      variance = 20;
      break;
    case "gpu": 
      baseValue = 60; 
      variance = 20;
      break;
    case "jitter": 
      baseValue = 3; 
      variance = 2;
      break;
  }
  
  const timeLabels = ["30m ago", "25m ago", "20m ago", "15m ago", "10m ago", "5m ago", "Now"];
  
  return Array.from({length: timeLabels.length}, (_, i) => ({
    time: timeLabels[i],
    value: Math.max(1, Math.floor(baseValue + (Math.random() * variance * 2) - variance))
  }));
};

const getMetricLabel = (metricType?: string) => {
  switch(metricType) {
    case "ping": return "Ping (ms)";
    case "packet-loss": return "Packet Loss (%)";
    case "fps": return "FPS";
    case "cpu": return "CPU Usage (%)";
    case "gpu": return "GPU Usage (%)";
    case "jitter": return "Jitter (ms)";
    case "temperature": return "Temperature (°C)";
    default: return "Value";
  }
};

export default MetricChart;
