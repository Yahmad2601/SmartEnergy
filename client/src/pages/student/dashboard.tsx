import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Zap, TrendingDown, Calendar, DollarSign } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { Button } from "@/components/ui/button";

export default function StudentDashboard() {
  return (
    <div className="space-y-8">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-4xl font-bold tracking-tight">Dashboard</h1>
          <p className="text-muted-foreground mt-2">
            Monitor your energy consumption and quota
          </p>
        </div>
        <Button size="lg" data-testid="button-top-up">
          <DollarSign className="h-4 w-4 mr-2" />
          Top Up
        </Button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        <Card className="lg:col-span-2">
          <CardHeader>
            <CardTitle className="text-lg">Energy Quota</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <span className="text-sm text-muted-foreground">Remaining</span>
                <Badge variant="outline" className="font-mono" data-testid="text-remaining-quota">
                  0 kWh
                </Badge>
              </div>
              <Progress value={0} className="h-3" />
              <div className="flex items-center justify-between text-xs text-muted-foreground">
                <span>0 kWh used</span>
                <span>0 kWh total</span>
              </div>
            </div>

            <div className="pt-4 border-t grid grid-cols-2 gap-4">
              <div className="space-y-1">
                <p className="text-xs text-muted-foreground flex items-center gap-1">
                  <Calendar className="h-3 w-3" />
                  Days Remaining
                </p>
                <p className="text-2xl font-bold font-mono" data-testid="text-days-remaining">--</p>
              </div>
              <div className="space-y-1">
                <p className="text-xs text-muted-foreground flex items-center gap-1">
                  <TrendingDown className="h-3 w-3" />
                  Daily Average
                </p>
                <p className="text-2xl font-bold font-mono" data-testid="text-daily-average">-- kWh</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="text-lg">Current Status</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex items-center gap-3">
              <div className="w-3 h-3 rounded-full bg-muted-foreground" data-testid="status-indicator" />
              <span className="text-sm text-muted-foreground">Not Assigned</span>
            </div>
            
            <div className="pt-4 border-t space-y-2">
              <div className="flex justify-between items-center">
                <span className="text-sm text-muted-foreground">Block</span>
                <span className="text-sm font-medium" data-testid="text-block">--</span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-sm text-muted-foreground">Line</span>
                <span className="text-sm font-medium" data-testid="text-line">--</span>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="text-lg">Usage History</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex flex-col items-center justify-center py-12">
            <Zap className="h-12 w-12 text-muted-foreground/30 mb-4" />
            <p className="text-sm text-muted-foreground">No usage data yet</p>
            <p className="text-xs text-muted-foreground mt-1">
              Data will appear once you're assigned to a block
            </p>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
