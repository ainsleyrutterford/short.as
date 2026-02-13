"use client";

import { CartesianGrid, Line, LineChart, XAxis, YAxis } from "recharts";

import { Card, CardContent } from "@/components/ui/card";
import { ChartContainer, ChartTooltip, ChartTooltipContent, type ChartConfig } from "@/components/ui/chart";
import { format } from "date-fns";

export const ChartLine = ({
  chartData,
  chartConfig,
  period = "day",
}: {
  chartData: { x: string; y: number }[];
  chartConfig: ChartConfig;
  period?: "hour" | "day" | "week";
}) => {
  const tickFormat = period === "hour" ? "HH:mm, MMM d" : "MMM d, yyyy";
  const labelFormat = period === "hour" ? "HH:mm, EEE MMM d, yyyy" : "EEE MMM d, yyyy";

  return (
    <Card>
      <CardContent className="p-4 sm:p-5">
        <ChartContainer config={chartConfig}>
          <LineChart accessibilityLayer data={chartData} margin={{ left: 12, right: 12 }}>
            <CartesianGrid vertical={false} syncWithTicks />
            <YAxis tickCount={5} interval={0} hide />
            <XAxis
              dataKey="x"
              // tickLine={false}
              axisLine={false}
              minTickGap={60}
              tickMargin={8}
              tickFormatter={(value: string) => format(value, tickFormat)}
            />
            <ChartTooltip
              cursor={true}
              content={
                <ChartTooltipContent labelFormatter={(value) => (value ? format(value.toString(), labelFormat) : "")} />
              }
              isAnimationActive={false}
            />
            <Line dataKey="y" stroke="var(--color-y)" strokeWidth={2} dot={false} />
          </LineChart>
        </ChartContainer>
      </CardContent>
    </Card>
  );
};
