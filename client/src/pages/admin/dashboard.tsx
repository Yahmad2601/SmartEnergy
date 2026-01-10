import { useQuery } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Zap, Users, Building2, AlertTriangle, Activity, TrendingUp } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
} from "recharts";
import type { Alert, EnergyLog, Line as LineType, Block } from "@shared/schema";

export default function AdminDashboard() {
  // Fetch dashboard stats
  const { data: stats } = useQuery<{
    totalBlocks: number;
    totalLines: number;
    activeLines: number;
    totalUsers: number;
    activeAlerts: number;
  }>({
    queryKey: ["/api/stats/dashboard"],
  });

  // Fetch recent alerts
  const { data: alerts = [] } = useQuery<Alert[]>({
    queryKey: ["/api/alerts"],
  });

  // Fetch energy logs
  const { data: energyLogs = [] } = useQuery<EnergyLog[]>({
    queryKey: ["/api/energy-logs"],
  });

  // Fetch blocks and lines
  const { data: blocks = [] } = useQuery<Block[]>({
    queryKey: ["/api/blocks"],
  });

  const { data: lines = [] } = useQuery<LineType[]>({
    queryKey: ["/api/lines"],
  });

  // Generate chart data from energy logs (last 7 days)
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
        consumption: parseFloat(consumption.toFixed(2)),
      });
    }

    return data;
  })();

  // Get recent activity
  const recentAlerts = alerts.slice(0, 5);

  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-4xl font-bold tracking-tight">Admin Dashboard</h1>
        <p className="text-muted-foreground mt-2">
          Monitor and manage energy consumption across all blocks
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between gap-2 space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Blocks</CardTitle>
            <Building2 className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold font-mono" data-testid="text-total-blocks">
              {stats?.totalBlocks || 0}
            </div>
            <p className="text-xs text-muted-foreground mt-1">
              Across campus
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between gap-2 space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Active Lines</CardTitle>
            <Zap className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold font-mono" data-testid="text-active-lines">
              {stats?.activeLines || 0}
            </div>
            <p className="text-xs text-muted-foreground mt-1">
              of {stats?.totalLines || 0} total lines
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between gap-2 space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Users</CardTitle>
            <Users className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold font-mono" data-testid="text-total-users">
              {stats?.totalUsers || 0}
            </div>
            <p className="text-xs text-muted-foreground mt-1">
              Registered students
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between gap-2 space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Active Alerts</CardTitle>
            <AlertTriangle className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold font-mono" data-testid="text-active-alerts">
              {stats?.activeAlerts || 0}
            </div>
            <p className="text-xs text-muted-foreground mt-1">
              Last 24 hours
            </p>
          </CardContent>
        </Card>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Energy Consumption Chart */}
        <Card>
          <CardHeader>
            <CardTitle className="text-lg flex items-center gap-2">
              <TrendingUp className="h-5 w-5" />
              Energy Consumption (7 Days)
            </CardTitle>
          </CardHeader>
          <CardContent>
            {chartData.some((d) => d.consumption > 0) ? (
              <div className="h-64">
                <ResponsiveContainer width="100%" height="100%">
                  <LineChart data={chartData}>
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
                    <Line
                      type="monotone"
                      dataKey="consumption"
                      stroke="hsl(var(--primary))"
                      strokeWidth={2}
                      dot={{ fill: "hsl(var(--primary))" }}
                    />
                  </LineChart>
                </ResponsiveContainer>
              </div>
            ) : (
              <div className="h-64 flex items-center justify-center">
                <div className="text-center">
                  <Activity className="h-12 w-12 text-muted-foreground/30 mx-auto mb-4" />
                  <p className="text-sm text-muted-foreground">No consumption data yet</p>
                </div>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Recent Alerts */}
        <Card>
          <CardHeader>
            <CardTitle className="text-lg flex items-center gap-2">
              <AlertTriangle className="h-5 w-5" />
              Recent Alerts
            </CardTitle>
          </CardHeader>
          <CardContent>
            {recentAlerts.length > 0 ? (
              <div className="space-y-4">
                {recentAlerts.map((alert) => {
                  const line = lines.find((l) => l.id === alert.lineId);
                  const block = blocks.find((b) => b.id === line?.blockId);

                  return (
                    <div
                      key={alert.id}
                      className="flex items-start gap-3 p-3 rounded-lg bg-muted/50"
                    >
                      <div
                        className={`p-2 rounded-lg ${
                          alert.type === "low_balance"
                            ? "bg-yellow-500/10"
                            : alert.type === "overload" || alert.type === "disconnection"
                            ? "bg-red-500/10"
                            : "bg-green-500/10"
                        }`}
                      >
                        <AlertTriangle
                          className={`h-4 w-4 ${
                            alert.type === "low_balance"
                              ? "text-yellow-500"
                              : alert.type === "overload" || alert.type === "disconnection"
                              ? "text-red-500"
                              : "text-green-500"
                          }`}
                        />
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2">
                          <Badge variant="outline" className="text-xs">
                            {alert.type.replace("_", " ")}
                          </Badge>
                          <span className="text-xs text-muted-foreground">
                            {block?.name} - Line {line?.lineNumber}
                          </span>
                        </div>
                        <p className="text-sm mt-1 truncate">{alert.message}</p>
                        <p className="text-xs text-muted-foreground mt-1">
                          {new Date(alert.createdAt).toLocaleString()}
                        </p>
                      </div>
                    </div>
                  );
                })}
              </div>
            ) : (
              <div className="flex flex-col items-center justify-center py-12">
                <AlertTriangle className="h-12 w-12 text-muted-foreground/30 mb-4" />
                <p className="text-sm text-muted-foreground">No alerts yet</p>
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Lines Overview */}
      <Card>
        <CardHeader>
          <CardTitle className="text-lg">Lines Overview</CardTitle>
        </CardHeader>
        <CardContent>
          {lines.length > 0 ? (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
              {lines.slice(0, 8).map((line) => {
                const block = blocks.find((b) => b.id === line.blockId);
                const remaining = parseFloat(line.remainingKwh || "0");
                const quota = parseFloat(line.currentQuotaKwh || "0");
                const usagePercent = quota > 0 ? ((quota - remaining) / quota) * 100 : 0;

                return (
                  <div
                    key={line.id}
                    className="p-4 rounded-lg border bg-card"
                  >
                    <div className="flex items-center justify-between mb-2">
                      <span className="font-medium text-sm">
                        {block?.name} - L{line.lineNumber}
                      </span>
                      <Badge
                        variant={
                          line.status === "active"
                            ? "default"
                            : line.status === "idle"
                            ? "secondary"
                            : "destructive"
                        }
                      >
                        {line.status}
                      </Badge>
                    </div>
                    <div className="space-y-1">
                      <div className="flex justify-between text-xs">
                        <span className="text-muted-foreground">Remaining</span>
                        <span className="font-mono">{remaining.toFixed(1)} kWh</span>
                      </div>
                      <div className="w-full bg-secondary rounded-full h-2 overflow-hidden">
                        <div
                          className={`h-full transition-all ${
                            usagePercent > 80
                              ? "bg-red-500"
                              : usagePercent > 50
                              ? "bg-yellow-500"
                              : "bg-green-500"
                          }`}
                          style={{ width: `${Math.min(usagePercent, 100)}%` }}
                        />
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          ) : (
            <div className="flex flex-col items-center justify-center py-12">
              <Zap className="h-12 w-12 text-muted-foreground/30 mb-4" />
              <p className="text-sm text-muted-foreground">No lines created yet</p>
              <p className="text-xs text-muted-foreground mt-1">
                Go to Blocks & Lines to add some
              </p>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
