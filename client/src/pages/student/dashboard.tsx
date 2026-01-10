import { useQuery } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Zap, TrendingDown, Calendar, DollarSign, Activity } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { Button } from "@/components/ui/button";
import { Link } from "wouter";
import {
  AreaChart,
  Area,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
} from "recharts";
import type { Line, Block, EnergyLog } from "@shared/schema";

interface Prediction {
  lineId: string;
  remainingKwh: string;
  avgDailyUsage: string;
  predictedDaysLeft: number;
  recommendedDailyUsage: string;
  tips: string[];
}

export default function StudentDashboard() {
  // Fetch user's line info
  const { data: lineInfo, isLoading: lineLoading } = useQuery<{ 
    line: Line | null; 
    block: Block | null 
  }>({
    queryKey: ["/api/my-line"],
  });

  // Fetch predictions
  const { data: prediction } = useQuery<Prediction>({
    queryKey: ["/api/predictions", lineInfo?.line?.id],
    enabled: !!lineInfo?.line?.id,
  });

  // Fetch energy logs
  const { data: energyLogs = [] } = useQuery<EnergyLog[]>({
    queryKey: ["/api/energy-logs", lineInfo?.line?.id],
    enabled: !!lineInfo?.line?.id,
  });

  // Generate chart data
  const chartData = (() => {
    const days = 7;
    const data: { date: string; consumption: number }[] = [];
    const now = new Date();

    for (let i = days - 1; i >= 0; i--) {
      const date = new Date(now);
      date.setDate(date.getDate() - i);
      const dateStr = date.toISOString().split("T")[0];

      const dayLogs = energyLogs.filter((log) => {
        const logDate = new Date(log.timestamp).toISOString().split("T")[0];
        return logDate === dateStr;
      });

      const consumption = dayLogs.reduce(
        (sum, log) => sum + parseFloat(log.energyKwh),
        0
      );

      data.push({
        date: date.toLocaleDateString("en-US", { weekday: "short" }),
        consumption: parseFloat(consumption.toFixed(3)),
      });
    }

    return data;
  })();

  const line = lineInfo?.line;
  const block = lineInfo?.block;

  const remainingKwh = parseFloat(line?.remainingKwh || "0");
  const currentQuotaKwh = parseFloat(line?.currentQuotaKwh || "0");
  const usedKwh = currentQuotaKwh - remainingKwh;
  const progressPercent = currentQuotaKwh > 0 ? (remainingKwh / currentQuotaKwh) * 100 : 0;

  const getStatusColor = (status?: string) => {
    switch (status) {
      case "active":
        return "bg-green-500";
      case "idle":
        return "bg-yellow-500";
      case "disconnected":
        return "bg-red-500";
      default:
        return "bg-muted-foreground";
    }
  };

  if (lineLoading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
      </div>
    );
  }

  return (
    <div className="space-y-8">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-4xl font-bold tracking-tight">Dashboard</h1>
          <p className="text-muted-foreground mt-2">
            Monitor your energy consumption and quota
          </p>
        </div>
        <Link href="/student/topup">
          <Button size="lg" data-testid="button-top-up">
            <DollarSign className="h-4 w-4 mr-2" />
            Top Up
          </Button>
        </Link>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        <Card className="lg:col-span-2">
          <CardHeader>
            <CardTitle className="text-lg">Energy Quota</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            {line ? (
              <>
                <div className="space-y-2">
                  <div className="flex items-center justify-between">
                    <span className="text-sm text-muted-foreground">Remaining</span>
                    <Badge variant="outline" className="font-mono" data-testid="text-remaining-quota">
                      {remainingKwh.toFixed(2)} kWh
                    </Badge>
                  </div>
                  <Progress value={progressPercent} className="h-3" />
                  <div className="flex items-center justify-between text-xs text-muted-foreground">
                    <span>{usedKwh.toFixed(2)} kWh used</span>
                    <span>{currentQuotaKwh.toFixed(2)} kWh total</span>
                  </div>
                </div>

                <div className="pt-4 border-t grid grid-cols-2 gap-4">
                  <div className="space-y-1">
                    <p className="text-xs text-muted-foreground flex items-center gap-1">
                      <Calendar className="h-3 w-3" />
                      Days Remaining
                    </p>
                    <p className="text-2xl font-bold font-mono" data-testid="text-days-remaining">
                      {prediction?.predictedDaysLeft ?? "--"}
                    </p>
                  </div>
                  <div className="space-y-1">
                    <p className="text-xs text-muted-foreground flex items-center gap-1">
                      <TrendingDown className="h-3 w-3" />
                      Daily Average
                    </p>
                    <p className="text-2xl font-bold font-mono" data-testid="text-daily-average">
                      {prediction?.avgDailyUsage ?? "--"} kWh
                    </p>
                  </div>
                </div>
              </>
            ) : (
              <div className="flex flex-col items-center justify-center py-8">
                <Zap className="h-12 w-12 text-muted-foreground/30 mb-4" />
                <p className="text-sm text-muted-foreground">Not assigned to a line</p>
                <p className="text-xs text-muted-foreground mt-1">
                  Contact your administrator
                </p>
              </div>
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="text-lg">Current Status</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex items-center gap-3">
              <div 
                className={`w-3 h-3 rounded-full ${getStatusColor(line?.status)}`} 
                data-testid="status-indicator" 
              />
              <span className="text-sm font-medium capitalize">
                {line?.status || "Not Assigned"}
              </span>
            </div>
            
            <div className="pt-4 border-t space-y-2">
              <div className="flex justify-between items-center">
                <span className="text-sm text-muted-foreground">Block</span>
                <span className="text-sm font-medium" data-testid="text-block">
                  {block?.name || "--"}
                </span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-sm text-muted-foreground">Line</span>
                <span className="text-sm font-medium" data-testid="text-line">
                  {line ? `Line ${line.lineNumber}` : "--"}
                </span>
              </div>
            </div>

            {prediction && prediction.tips.length > 0 && (
              <div className="pt-4 border-t">
                <p className="text-xs text-muted-foreground mb-2">Quick Tip</p>
                <p className="text-sm">{prediction.tips[0]}</p>
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="text-lg">Usage History (7 Days)</CardTitle>
        </CardHeader>
        <CardContent>
          {chartData.some((d) => d.consumption > 0) ? (
            <div className="h-64">
              <ResponsiveContainer width="100%" height="100%">
                <AreaChart data={chartData}>
                  <defs>
                    <linearGradient id="colorConsumption" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="hsl(var(--primary))" stopOpacity={0.3} />
                      <stop offset="95%" stopColor="hsl(var(--primary))" stopOpacity={0} />
                    </linearGradient>
                  </defs>
                  <CartesianGrid strokeDasharray="3 3" className="stroke-muted" />
                  <XAxis
                    dataKey="date"
                    className="text-xs"
                    tick={{ fill: "hsl(var(--muted-foreground))" }}
                  />
                  <YAxis
                    className="text-xs"
                    tick={{ fill: "hsl(var(--muted-foreground))" }}
                    unit=" kWh"
                  />
                  <Tooltip
                    contentStyle={{
                      backgroundColor: "hsl(var(--card))",
                      borderColor: "hsl(var(--border))",
                      borderRadius: "8px",
                    }}
                    labelStyle={{ color: "hsl(var(--foreground))" }}
                  />
                  <Area
                    type="monotone"
                    dataKey="consumption"
                    stroke="hsl(var(--primary))"
                    fillOpacity={1}
                    fill="url(#colorConsumption)"
                  />
                </AreaChart>
              </ResponsiveContainer>
            </div>
          ) : (
            <div className="flex flex-col items-center justify-center py-12">
              <Activity className="h-12 w-12 text-muted-foreground/30 mb-4" />
              <p className="text-sm text-muted-foreground">No usage data yet</p>
              <p className="text-xs text-muted-foreground mt-1">
                {line 
                  ? "Data will appear as you use energy" 
                  : "Data will appear once you're assigned to a block"}
              </p>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
