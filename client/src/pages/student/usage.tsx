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
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Zap, TrendingUp, TrendingDown, Calendar, Activity } from "lucide-react";
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  AreaChart,
  Area,
} from "recharts";
import { useState } from "react";
import type { EnergyLog, Line as LineType, Block } from "@shared/schema";

export default function UsagePage() {
  const [timeRange, setTimeRange] = useState<"7d" | "30d" | "all">("7d");

  // Fetch user's line info
  const { data: lineInfo } = useQuery<{ line: LineType | null; block: Block | null }>({
    queryKey: ["/api/my-line"],
  });

  // Fetch energy logs (filtered by line on backend)
  const { data: energyLogs = [], isLoading } = useQuery<EnergyLog[]>({
    queryKey: ["/api/energy-logs", lineInfo?.line?.id],
    enabled: !!lineInfo?.line?.id,
  });

  // Filter logs by time range
  const filteredLogs = (() => {
    if (timeRange === "all") return energyLogs;
    
    const now = new Date();
    const days = timeRange === "7d" ? 7 : 30;
    const cutoff = new Date(now.getTime() - days * 24 * 60 * 60 * 1000);
    
    return energyLogs.filter((log) => new Date(log.timestamp) >= cutoff);
  })();

  // Calculate statistics
  const totalConsumption = filteredLogs.reduce(
    (sum, log) => sum + parseFloat(log.energyKwh),
    0
  );

  const avgPower = filteredLogs.length > 0
    ? filteredLogs.reduce((sum, log) => sum + parseFloat(log.powerW), 0) / filteredLogs.length
    : 0;

  const maxPower = filteredLogs.length > 0
    ? Math.max(...filteredLogs.map((log) => parseFloat(log.powerW)))
    : 0;

  // Generate daily aggregated data for chart
  const dailyData = (() => {
    const days = timeRange === "7d" ? 7 : timeRange === "30d" ? 30 : 30;
    const data: { date: string; consumption: number; avgPower: number }[] = [];
    const now = new Date();

    for (let i = days - 1; i >= 0; i--) {
      const date = new Date(now);
      date.setDate(date.getDate() - i);
      const dateStr = date.toISOString().split("T")[0];

      const dayLogs = filteredLogs.filter((log) => {
        const logDate = new Date(log.timestamp).toISOString().split("T")[0];
        return logDate === dateStr;
      });

      const consumption = dayLogs.reduce(
        (sum, log) => sum + parseFloat(log.energyKwh),
        0
      );

      const avgP = dayLogs.length > 0
        ? dayLogs.reduce((sum, log) => sum + parseFloat(log.powerW), 0) / dayLogs.length
        : 0;

      data.push({
        date: date.toLocaleDateString("en-US", { weekday: "short", month: "short", day: "numeric" }),
        consumption: parseFloat(consumption.toFixed(3)),
        avgPower: parseFloat(avgP.toFixed(0)),
      });
    }

    return data;
  })();

  if (!lineInfo?.line) {
    return (
      <div className="space-y-8">
        <div>
          <h1 className="text-4xl font-bold tracking-tight">Usage History</h1>
          <p className="text-muted-foreground mt-2">
            Track your energy consumption over time
          </p>
        </div>

        <Card>
          <CardContent className="flex flex-col items-center justify-center py-12">
            <Zap className="h-12 w-12 text-muted-foreground/30 mb-4" />
            <p className="text-sm text-muted-foreground">Not assigned to a line</p>
            <p className="text-xs text-muted-foreground mt-1">
              Contact your administrator to get assigned
            </p>
          </CardContent>
        </Card>
      </div>
    );
  }

  if (isLoading) {
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
          <h1 className="text-4xl font-bold tracking-tight">Usage History</h1>
          <p className="text-muted-foreground mt-2">
            Track your energy consumption over time
          </p>
        </div>
        <Select value={timeRange} onValueChange={(v) => setTimeRange(v as typeof timeRange)}>
          <SelectTrigger className="w-40">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="7d">Last 7 days</SelectItem>
            <SelectItem value="30d">Last 30 days</SelectItem>
            <SelectItem value="all">All time</SelectItem>
          </SelectContent>
        </Select>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Consumption</CardTitle>
            <Zap className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold font-mono">{totalConsumption.toFixed(3)} kWh</div>
            <p className="text-xs text-muted-foreground mt-1">
              {timeRange === "7d" ? "Last 7 days" : timeRange === "30d" ? "Last 30 days" : "All time"}
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Average Power</CardTitle>
            <Activity className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold font-mono">{avgPower.toFixed(0)} W</div>
            <p className="text-xs text-muted-foreground mt-1">Average draw</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Peak Power</CardTitle>
            <TrendingUp className="h-4 w-4 text-red-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold font-mono">{maxPower.toFixed(0)} W</div>
            <p className="text-xs text-muted-foreground mt-1">Maximum recorded</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Readings</CardTitle>
            <Calendar className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold font-mono">{filteredLogs.length}</div>
            <p className="text-xs text-muted-foreground mt-1">Data points</p>
          </CardContent>
        </Card>
      </div>

      {/* Consumption Chart */}
      <Card>
        <CardHeader>
          <CardTitle className="text-lg">Daily Consumption</CardTitle>
        </CardHeader>
        <CardContent>
          {dailyData.some((d) => d.consumption > 0) ? (
            <div className="h-80">
              <ResponsiveContainer width="100%" height="100%">
                <AreaChart data={dailyData}>
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
            <div className="h-80 flex items-center justify-center">
              <p className="text-muted-foreground">No consumption data for this period</p>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Power Usage Chart */}
      <Card>
        <CardHeader>
          <CardTitle className="text-lg">Average Daily Power</CardTitle>
        </CardHeader>
        <CardContent>
          {dailyData.some((d) => d.avgPower > 0) ? (
            <div className="h-64">
              <ResponsiveContainer width="100%" height="100%">
                <LineChart data={dailyData}>
                  <CartesianGrid strokeDasharray="3 3" className="stroke-muted" />
                  <XAxis
                    dataKey="date"
                    className="text-xs"
                    tick={{ fill: "hsl(var(--muted-foreground))" }}
                  />
                  <YAxis
                    className="text-xs"
                    tick={{ fill: "hsl(var(--muted-foreground))" }}
                    unit=" W"
                  />
                  <Tooltip
                    contentStyle={{
                      backgroundColor: "hsl(var(--card))",
                      borderColor: "hsl(var(--border))",
                      borderRadius: "8px",
                    }}
                  />
                  <Line
                    type="monotone"
                    dataKey="avgPower"
                    stroke="#f59e0b"
                    strokeWidth={2}
                    dot={{ fill: "#f59e0b" }}
                  />
                </LineChart>
              </ResponsiveContainer>
            </div>
          ) : (
            <div className="h-64 flex items-center justify-center">
              <p className="text-muted-foreground">No power data for this period</p>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Recent Readings Table */}
      <Card>
        <CardHeader>
          <CardTitle className="text-lg">Recent Readings</CardTitle>
        </CardHeader>
        <CardContent>
          {filteredLogs.length > 0 ? (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Time</TableHead>
                  <TableHead>Power (W)</TableHead>
                  <TableHead>Voltage (V)</TableHead>
                  <TableHead>Current (A)</TableHead>
                  <TableHead>Energy (kWh)</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredLogs.slice(0, 20).map((log) => (
                  <TableRow key={log.id}>
                    <TableCell className="text-muted-foreground">
                      {new Date(log.timestamp).toLocaleString()}
                    </TableCell>
                    <TableCell className="font-mono">{parseFloat(log.powerW).toFixed(1)}</TableCell>
                    <TableCell className="font-mono">{parseFloat(log.voltageV).toFixed(1)}</TableCell>
                    <TableCell className="font-mono">{parseFloat(log.currentA).toFixed(2)}</TableCell>
                    <TableCell className="font-mono">{parseFloat(log.energyKwh).toFixed(4)}</TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          ) : (
            <div className="flex flex-col items-center justify-center py-12">
              <Activity className="h-12 w-12 text-muted-foreground/30 mb-4" />
              <p className="text-sm text-muted-foreground">No readings yet</p>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
