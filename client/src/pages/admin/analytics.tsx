import { useQuery } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { BarChart3, Zap, TrendingUp, TrendingDown, Activity } from "lucide-react";
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  BarChart,
  Bar,
  Legend,
  PieChart,
  Pie,
  Cell,
} from "recharts";
import { useState } from "react";
import type { Block, Line as LineType, EnergyLog } from "@shared/schema";

const COLORS = ["#10b981", "#f59e0b", "#ef4444", "#6366f1", "#8b5cf6"];

export default function AnalyticsPage() {
  const [selectedBlockId, setSelectedBlockId] = useState<string>("all");

  // Fetch data
  const { data: blocks = [] } = useQuery<Block[]>({
    queryKey: ["/api/blocks"],
  });

  const { data: lines = [] } = useQuery<LineType[]>({
    queryKey: ["/api/lines"],
  });

  const { data: energyLogs = [] } = useQuery<EnergyLog[]>({
    queryKey: ["/api/energy-logs"],
  });

  const { data: stats } = useQuery<{
    totalBlocks: number;
    totalLines: number;
    activeLines: number;
    totalUsers: number;
    activeAlerts: number;
  }>({
    queryKey: ["/api/stats/dashboard"],
  });

  // Filter lines by selected block
  const filteredLines = selectedBlockId === "all" 
    ? lines 
    : lines.filter((line) => line.blockId === selectedBlockId);

  // Calculate total energy consumption
  const totalConsumption = energyLogs.reduce(
    (sum, log) => sum + parseFloat(log.energyKwh),
    0
  );

  // Calculate status distribution
  const statusDistribution = [
    { name: "Active", value: lines.filter((l) => l.status === "active").length },
    { name: "Idle", value: lines.filter((l) => l.status === "idle").length },
    { name: "Disconnected", value: lines.filter((l) => l.status === "disconnected").length },
  ].filter((item) => item.value > 0);

  // Calculate quota usage per block
  const blockUsageData = blocks.map((block) => {
    const blockLines = lines.filter((l) => l.blockId === block.id);
    const totalQuota = blockLines.reduce(
      (sum, line) => sum + parseFloat(line.currentQuotaKwh || "0"),
      0
    );
    const totalRemaining = blockLines.reduce(
      (sum, line) => sum + parseFloat(line.remainingKwh || "0"),
      0
    );
    const used = totalQuota - totalRemaining;

    return {
      name: block.name,
      used: parseFloat(used.toFixed(2)),
      remaining: parseFloat(totalRemaining.toFixed(2)),
      total: parseFloat(totalQuota.toFixed(2)),
    };
  });

  // Generate time-series data from energy logs (last 7 days)
  const timeSeriesData = (() => {
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
        date: date.toLocaleDateString("en-US", { weekday: "short", month: "short", day: "numeric" }),
        consumption: parseFloat(consumption.toFixed(2)),
      });
    }

    return data;
  })();

  // Calculate average daily consumption
  const avgDailyConsumption = timeSeriesData.length > 0
    ? timeSeriesData.reduce((sum, d) => sum + d.consumption, 0) / timeSeriesData.length
    : 0;

  return (
    <div className="space-y-8">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-4xl font-bold tracking-tight">Analytics</h1>
          <p className="text-muted-foreground mt-2">
            Energy consumption insights and trends
          </p>
        </div>
        <Select value={selectedBlockId} onValueChange={setSelectedBlockId}>
          <SelectTrigger className="w-48">
            <SelectValue placeholder="Filter by block" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Blocks</SelectItem>
            {blocks.map((block) => (
              <SelectItem key={block.id} value={block.id}>
                {block.name}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      {/* Key Metrics */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Consumption</CardTitle>
            <Zap className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold font-mono">{totalConsumption.toFixed(2)} kWh</div>
            <p className="text-xs text-muted-foreground mt-1">All time</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Avg. Daily Usage</CardTitle>
            <Activity className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold font-mono">{avgDailyConsumption.toFixed(2)} kWh</div>
            <p className="text-xs text-muted-foreground mt-1">Last 7 days</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Active Lines</CardTitle>
            <TrendingUp className="h-4 w-4 text-green-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold font-mono">{stats?.activeLines || 0}</div>
            <p className="text-xs text-muted-foreground mt-1">
              of {stats?.totalLines || 0} total
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Active Alerts</CardTitle>
            <TrendingDown className="h-4 w-4 text-red-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold font-mono">{stats?.activeAlerts || 0}</div>
            <p className="text-xs text-muted-foreground mt-1">Last 24 hours</p>
          </CardContent>
        </Card>
      </div>

      {/* Charts Row */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Consumption Trend */}
        <Card className="lg:col-span-2">
          <CardHeader>
            <CardTitle className="text-lg flex items-center gap-2">
              <BarChart3 className="h-5 w-5" />
              Consumption Trend (Last 7 Days)
            </CardTitle>
          </CardHeader>
          <CardContent>
            {timeSeriesData.some((d) => d.consumption > 0) ? (
              <div className="h-80">
                <ResponsiveContainer width="100%" height="100%">
                  <LineChart data={timeSeriesData}>
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
              <div className="h-80 flex items-center justify-center">
                <p className="text-muted-foreground">No consumption data available</p>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Block Usage */}
        <Card>
          <CardHeader>
            <CardTitle className="text-lg">Usage by Block</CardTitle>
          </CardHeader>
          <CardContent>
            {blockUsageData.length > 0 ? (
              <div className="h-80">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={blockUsageData} layout="vertical">
                    <CartesianGrid strokeDasharray="3 3" className="stroke-muted" />
                    <XAxis 
                      type="number" 
                      unit=" kWh"
                      tick={{ fill: "hsl(var(--muted-foreground))" }}
                    />
                    <YAxis 
                      dataKey="name" 
                      type="category" 
                      width={80}
                      tick={{ fill: "hsl(var(--muted-foreground))" }}
                    />
                    <Tooltip
                      contentStyle={{
                        backgroundColor: "hsl(var(--card))",
                        borderColor: "hsl(var(--border))",
                        borderRadius: "8px",
                      }}
                    />
                    <Legend />
                    <Bar dataKey="used" stackId="a" fill="#ef4444" name="Used" />
                    <Bar dataKey="remaining" stackId="a" fill="#10b981" name="Remaining" />
                  </BarChart>
                </ResponsiveContainer>
              </div>
            ) : (
              <div className="h-80 flex items-center justify-center">
                <p className="text-muted-foreground">No blocks created yet</p>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Status Distribution */}
        <Card>
          <CardHeader>
            <CardTitle className="text-lg">Line Status Distribution</CardTitle>
          </CardHeader>
          <CardContent>
            {statusDistribution.length > 0 ? (
              <div className="h-80 flex items-center justify-center">
                <ResponsiveContainer width="100%" height="100%">
                  <PieChart>
                    <Pie
                      data={statusDistribution}
                      cx="50%"
                      cy="50%"
                      innerRadius={60}
                      outerRadius={100}
                      paddingAngle={5}
                      dataKey="value"
                      label={({ name, value }) => `${name}: ${value}`}
                    >
                      {statusDistribution.map((_, index) => (
                        <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                      ))}
                    </Pie>
                    <Tooltip />
                  </PieChart>
                </ResponsiveContainer>
              </div>
            ) : (
              <div className="h-80 flex items-center justify-center">
                <p className="text-muted-foreground">No lines created yet</p>
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Lines Overview Table */}
      <Card>
        <CardHeader>
          <CardTitle className="text-lg">Lines Overview</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {filteredLines.map((line) => {
              const block = blocks.find((b) => b.id === line.blockId);
              const quota = parseFloat(line.currentQuotaKwh || "0");
              const remaining = parseFloat(line.remainingKwh || "0");
              const usagePercent = quota > 0 ? ((quota - remaining) / quota) * 100 : 0;

              return (
                <div
                  key={line.id}
                  className="p-4 rounded-lg border bg-card"
                >
                  <div className="flex items-center justify-between mb-3">
                    <div>
                      <p className="font-medium">{block?.name} - Line {line.lineNumber}</p>
                      <Badge
                        variant={
                          line.status === "active"
                            ? "default"
                            : line.status === "idle"
                            ? "secondary"
                            : "destructive"
                        }
                        className="mt-1"
                      >
                        {line.status}
                      </Badge>
                    </div>
                    <div className="text-right">
                      <p className="text-2xl font-bold font-mono">{remaining.toFixed(1)}</p>
                      <p className="text-xs text-muted-foreground">kWh left</p>
                    </div>
                  </div>
                  <div className="space-y-1">
                    <div className="flex justify-between text-xs text-muted-foreground">
                      <span>Usage</span>
                      <span>{usagePercent.toFixed(0)}%</span>
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
            {filteredLines.length === 0 && (
              <div className="col-span-full text-center py-8 text-muted-foreground">
                No lines to display
              </div>
            )}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
