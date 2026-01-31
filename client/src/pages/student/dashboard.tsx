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
        <Card className="lg:col-span-2 relative overflow-hidden border-none shadow-md bg-gradient-to-br from-white to-slate-50 dark:from-slate-950 dark:to-slate-900 ring-1 ring-slate-200 dark:ring-slate-800">
          <div className="absolute right-0 top-0 h-32 w-32 translate-x-8 translate-y--8 rounded-full bg-emerald-500/10 blur-2xl" />
          <CardHeader>
            <div className="flex items-center gap-3">
              <div className="rounded-md bg-emerald-500/10 p-2 text-emerald-500">
                <Zap className="h-5 w-5" />
              </div>
              <CardTitle className="text-lg text-slate-900 dark:text-slate-50">Energy Quota</CardTitle>
            </div>
          </CardHeader>
          <CardContent className="space-y-4 relative">
            {line ? (
              <>
                <div className="space-y-3">
                  <div className="flex items-center justify-between">
                    <span className="text-sm font-medium text-slate-500 dark:text-slate-400">Remaining</span>
                    <Badge variant="outline" className="font-mono text-base px-3 py-1 bg-emerald-50 text-emerald-700 dark:bg-emerald-950/30 dark:text-emerald-400 border-emerald-200 dark:border-emerald-800" data-testid="text-remaining-quota">
                      {remainingKwh.toFixed(2)} kWh
                    </Badge>
                  </div>
                  <Progress value={progressPercent} className="h-4 bg-slate-100 dark:bg-slate-800 [&>div]:bg-gradient-to-r [&>div]:from-emerald-500 [&>div]:to-emerald-400/80" />
                  <div className="flex items-center justify-between text-xs font-medium text-slate-500 dark:text-slate-400">
                    <span>{usedKwh.toFixed(2)} kWh used</span>
                    <span>{currentQuotaKwh.toFixed(2)} kWh total</span>
                  </div>
                </div>

                <div className="pt-6 mt-2 border-t border-slate-100 dark:border-slate-800 grid grid-cols-2 gap-6">
                  <div className="space-y-1">
                    <p className="text-xs text-muted-foreground flex items-center gap-1.5 uppercase tracking-wider font-semibold">
                      <Calendar className="h-3.5 w-3.5" />
                      Days Remaining
                    </p>
                    <p className="text-3xl font-bold font-mono text-slate-900 dark:text-slate-50" data-testid="text-days-remaining">
                      {prediction?.predictedDaysLeft ?? "--"}
                    </p>
                  </div>
                  <div className="space-y-1">
                    <p className="text-xs text-muted-foreground flex items-center gap-1.5 uppercase tracking-wider font-semibold">
                      <TrendingDown className="h-3.5 w-3.5" />
                      Daily Average
                    </p>
                    <p className="text-3xl font-bold font-mono text-slate-900 dark:text-slate-50" data-testid="text-daily-average">
                      {prediction?.avgDailyUsage ?? "--"} <span className="text-sm font-normal text-muted-foreground">kWh</span>
                    </p>
                  </div>
                </div>
              </>
            ) : (
              <div className="flex flex-col items-center justify-center py-8">
                <div className="rounded-full bg-slate-100 dark:bg-slate-800 p-4 mb-4">
                  <Zap className="h-8 w-8 text-muted-foreground/50" />
                </div>
                <p className="text-sm font-medium text-slate-900 dark:text-slate-50">Not assigned to a line</p>
                <p className="text-xs text-muted-foreground mt-1 text-center max-w-[200px]">
                  Contact your administrator to get assigned to an energy line.
                </p>
              </div>
            )}
          </CardContent>
        </Card>

        <Card className="relative overflow-hidden border-none shadow-md bg-gradient-to-br from-white to-slate-50 dark:from-slate-950 dark:to-slate-900 ring-1 ring-slate-200 dark:ring-slate-800">
          <div className="absolute right-0 top-0 h-24 w-24 translate-x-8 translate-y--8 rounded-full bg-blue-500/10 blur-2xl" />
          <CardHeader>
            <div className="flex items-center gap-3">
              <div className="rounded-md bg-blue-500/10 p-2 text-blue-500">
                <Activity className="h-5 w-5" />
              </div>
              <CardTitle className="text-lg text-slate-900 dark:text-slate-50">Current Status</CardTitle>
            </div>
          </CardHeader>
          <CardContent className="space-y-6">
            <div className="flex items-center gap-4 p-3 bg-slate-100/50 dark:bg-slate-800/50 rounded-lg border border-slate-100 dark:border-slate-800">
              <div 
                className={`w-4 h-4 rounded-full ring-4 ring-white dark:ring-slate-900 shadow-sm ${getStatusColor(line?.status)}`} 
                data-testid="status-indicator" 
              />
              <span className="text-base font-medium capitalize text-slate-900 dark:text-slate-50">
                {line?.status || "Not Assigned"}
              </span>
            </div>
            
            <div className="border-t border-slate-100 dark:border-slate-800 pt-4 space-y-4">
              <div className="flex justify-between items-center group">
                <span className="text-sm text-muted-foreground group-hover:text-slate-600 dark:group-hover:text-slate-300 transition-colors">Block</span>
                <span className="text-sm font-semibold text-slate-900 dark:text-slate-50" data-testid="text-block">
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
