
import React from "react";
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  Legend
} from "recharts";

interface LineConfig {
  dataKey: string;
  color: string;
  name?: string;
  strokeWidth?: number;
  yAxisId?: "left" | "right";
  dot?: boolean | object;
}

interface LineChartComponentProps {
  data: any[];
  lineKeys: LineConfig[];
  xAxisDataKey: string;
  height?: number;
  showGrid?: boolean;
  showLegend?: boolean;
  tooltipFormatter?: (value: any, name?: string) => [string, string];
  yAxisDomain?: [number, number];
  dot?: boolean | object;
  useRightYAxis?: boolean;
  rightYAxisDomain?: [number, number];
}

export const LineChartComponent: React.FC<LineChartComponentProps> = ({
  data,
  lineKeys,
  xAxisDataKey,
  height = 300,
  showGrid = false,
  showLegend = false,
  tooltipFormatter,
  yAxisDomain,
  dot = false,
  useRightYAxis = false,
  rightYAxisDomain
}) => {
  return (
    <ResponsiveContainer width="100%" height={height}>
      <LineChart data={data} margin={{ top: 10, right: useRightYAxis ? 30 : 10, left: 0, bottom: 10 }}>
        {showGrid && <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.1)" />}
        <XAxis 
          dataKey={xAxisDataKey} 
          stroke="rgba(255,255,255,0.5)" 
          fontSize={10}
          tick={{ fill: "rgba(255,255,255,0.7)" }}
        />
        <YAxis 
          stroke="rgba(255,255,255,0.5)" 
          fontSize={10}
          tick={{ fill: "rgba(255,255,255,0.7)" }}
          domain={yAxisDomain}
          yAxisId="left"
        />
        
        {useRightYAxis && (
          <YAxis 
            orientation="right" 
            stroke="rgba(255,255,255,0.5)" 
            fontSize={10}
            tick={{ fill: "rgba(255,255,255,0.7)" }}
            domain={rightYAxisDomain}
            yAxisId="right"
          />
        )}
        
        <Tooltip 
          contentStyle={{ 
            backgroundColor: '#121223', 
            borderColor: 'rgba(51, 195, 240, 0.3)',
            fontFamily: 'Share Tech Mono, monospace',
            fontSize: '12px',
            boxShadow: '0 0 10px rgba(51, 195, 240, 0.2)'
          }}
          formatter={tooltipFormatter}
        />
        
        {showLegend && <Legend wrapperStyle={{ fontSize: "10px" }} />}
        
        {lineKeys.map((lineConfig, index) => (
          <Line 
            key={index}
            type="monotone" 
            dataKey={lineConfig.dataKey} 
            stroke={lineConfig.color} 
            name={lineConfig.name || lineConfig.dataKey} 
            strokeWidth={lineConfig.strokeWidth || 2}
            dot={lineConfig.dot !== undefined ? lineConfig.dot : dot}
            yAxisId={lineConfig.yAxisId || "left"}
          />
        ))}
      </LineChart>
    </ResponsiveContainer>
  );
};
