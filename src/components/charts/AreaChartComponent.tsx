
import React from "react";
import { Area, AreaChart, ResponsiveContainer, XAxis, YAxis, Tooltip } from "recharts";

interface AreaChartComponentProps {
  data: any[];
  dataKey: string;
  height?: number;
  width?: string;
  xAxisDataKey?: string;
  xAxisKey?: string; // Add alias for compatibility
  yAxisDomain?: [number, number];
  color?: string;
  gradientId?: string;
  tooltipFormatter?: (value: any, name?: string) => [string, string];
  tooltipLabelFormatter?: (label: string) => string;
  xAxisHide?: boolean;
  yAxisHide?: boolean;
}

export const AreaChartComponent: React.FC<AreaChartComponentProps> = ({
  data,
  dataKey,
  height = 64,
  width = "100%",
  xAxisDataKey = "name",
  xAxisKey, // Add support for the alias
  yAxisDomain = [0, 100],
  color = "#8b5cf6",
  gradientId = "colorGradient",
  tooltipFormatter = (value) => [`${value}%`, 'Value'],
  tooltipLabelFormatter,
  xAxisHide = false,
  yAxisHide = false,
}) => {
  // Use xAxisKey as a fallback if provided
  const effectiveXAxisKey = xAxisDataKey || xAxisKey || "name";
  
  // Enforce maximum height to prevent excessive growth
  const effectiveHeight = Math.min(height, 180);

  return (
    <div className="h-full w-full" style={{ maxHeight: `${effectiveHeight}px` }}>
      <ResponsiveContainer width={width} height={effectiveHeight}>
        <AreaChart
          data={data}
          margin={{
            top: 5,
            right: 10,
            left: 0,
            bottom: 5,
          }}
        >
          <XAxis 
            dataKey={effectiveXAxisKey}
            stroke="#6b7280" 
            hide={xAxisHide}
            tick={{ fill: "#6b7280", fontSize: 10 }}
            axisLine={{ stroke: "#374151" }}
            tickLine={{ stroke: "#374151" }}
          />
          <YAxis 
            hide={yAxisHide}
            domain={yAxisDomain}
            stroke="#6b7280"
            tick={{ fill: "#6b7280", fontSize: 10 }}
          />
          <Tooltip 
            contentStyle={{ 
              backgroundColor: "#111827", 
              borderColor: color, 
              borderRadius: "0.375rem",
              color: "#e5e7eb"
            }}
            itemStyle={{ color: "#e5e7eb" }}
            formatter={tooltipFormatter}
            labelFormatter={tooltipLabelFormatter}
            labelStyle={{ color: "#9ca3af" }}
          />
          <defs>
            <linearGradient id={gradientId} x1="0" y1="0" x2="0" y2="1">
              <stop offset="5%" stopColor={color} stopOpacity={0.8}/>
              <stop offset="95%" stopColor={color} stopOpacity={0.2}/>
            </linearGradient>
          </defs>
          <Area 
            type="monotone" 
            dataKey={dataKey} 
            stroke={color} 
            strokeWidth={2}
            fill={`url(#${gradientId})`} 
          />
        </AreaChart>
      </ResponsiveContainer>
    </div>
  );
};
