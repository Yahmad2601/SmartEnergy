import { useQuery } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Bell, AlertTriangle, Battery, Power, CreditCard, Zap } from "lucide-react";
import type { Alert, Block, Line } from "@shared/schema";

const alertTypeConfig = {
  low_balance: {
    label: "Low Balance",
    icon: Battery,
    color: "text-yellow-500",
    bgColor: "bg-yellow-500/10",
    variant: "secondary" as const,
  },
  idle_line: {
    label: "Idle Line",
    icon: Zap,
    color: "text-blue-500",
    bgColor: "bg-blue-500/10",
    variant: "outline" as const,
  },
  overload: {
    label: "Overload",
    icon: AlertTriangle,
    color: "text-red-500",
    bgColor: "bg-red-500/10",
    variant: "destructive" as const,
  },
  disconnection: {
    label: "Disconnection",
    icon: Power,
    color: "text-red-500",
    bgColor: "bg-red-500/10",
    variant: "destructive" as const,
  },
  top_up_confirmation: {
    label: "Top-Up",
    icon: CreditCard,
    color: "text-green-500",
    bgColor: "bg-green-500/10",
    variant: "default" as const,
  },
};

export default function AlertsPage() {
  // Fetch alerts
  const { data: alerts = [], isLoading: alertsLoading } = useQuery<Alert[]>({
    queryKey: ["/api/alerts"],
  });

  // Fetch blocks and lines for reference
  const { data: blocks = [] } = useQuery<Block[]>({
    queryKey: ["/api/blocks"],
  });

  const { data: lines = [] } = useQuery<Line[]>({
    queryKey: ["/api/lines"],
  });

  // Count alerts by type
  const alertCounts = {
    low_balance: alerts.filter((a) => a.type === "low_balance").length,
    overload: alerts.filter((a) => a.type === "overload").length,
    disconnection: alerts.filter((a) => a.type === "disconnection").length,
    idle_line: alerts.filter((a) => a.type === "idle_line").length,
    top_up_confirmation: alerts.filter((a) => a.type === "top_up_confirmation").length,
  };

  const getLineInfo = (lineId: string) => {
    const line = lines.find((l) => l.id === lineId);
    if (!line) return { blockName: "Unknown", lineNumber: "?" };
    const block = blocks.find((b) => b.id === line.blockId);
    return {
      blockName: block?.name || "Unknown",
      lineNumber: line.lineNumber,
    };
  };

  if (alertsLoading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
      </div>
    );
  }

  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-4xl font-bold tracking-tight">Alerts</h1>
        <p className="text-muted-foreground mt-2">
          Monitor system alerts and notifications
        </p>
      </div>

      {/* Alert Type Summary */}
      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-4">
        {Object.entries(alertTypeConfig).map(([type, config]) => {
          const Icon = config.icon;
          const count = alertCounts[type as keyof typeof alertCounts] || 0;

          return (
            <Card key={type} className={count > 0 ? config.bgColor : ""}>
              <CardContent className="pt-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm text-muted-foreground">{config.label}</p>
                    <p className="text-2xl font-bold font-mono">{count}</p>
                  </div>
                  <Icon className={`h-8 w-8 ${count > 0 ? config.color : "text-muted-foreground/30"}`} />
                </div>
              </CardContent>
            </Card>
          );
        })}
      </div>

      {/* Recent Alerts Table */}
      <Card>
        <CardHeader>
          <CardTitle className="text-lg flex items-center gap-2">
            <Bell className="h-5 w-5" />
            Recent Alerts
          </CardTitle>
        </CardHeader>
        <CardContent>
          {alerts.length > 0 ? (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Type</TableHead>
                  <TableHead>Location</TableHead>
                  <TableHead>Message</TableHead>
                  <TableHead>Time</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {alerts.map((alert) => {
                  const config = alertTypeConfig[alert.type as keyof typeof alertTypeConfig];
                  const Icon = config?.icon || AlertTriangle;
                  const { blockName, lineNumber } = getLineInfo(alert.lineId);

                  return (
                    <TableRow key={alert.id}>
                      <TableCell>
                        <div className="flex items-center gap-2">
                          <div className={`p-2 rounded-lg ${config?.bgColor || "bg-muted"}`}>
                            <Icon className={`h-4 w-4 ${config?.color || "text-muted-foreground"}`} />
                          </div>
                          <Badge variant={config?.variant || "outline"}>
                            {config?.label || alert.type}
                          </Badge>
                        </div>
                      </TableCell>
                      <TableCell>
                        <div>
                          <p className="font-medium">{blockName}</p>
                          <p className="text-sm text-muted-foreground">Line {lineNumber}</p>
                        </div>
                      </TableCell>
                      <TableCell className="max-w-md">
                        <p className="truncate">{alert.message}</p>
                      </TableCell>
                      <TableCell className="text-muted-foreground">
                        {new Date(alert.createdAt).toLocaleString()}
                      </TableCell>
                    </TableRow>
                  );
                })}
              </TableBody>
            </Table>
          ) : (
            <div className="flex flex-col items-center justify-center py-12">
              <Bell className="h-12 w-12 text-muted-foreground/30 mb-4" />
              <p className="text-sm text-muted-foreground">No alerts yet</p>
              <p className="text-xs text-muted-foreground mt-1">
                Alerts will appear here when triggered
              </p>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
