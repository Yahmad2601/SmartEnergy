import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
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
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { useToast } from "@/hooks/use-toast";
import { apiRequest } from "@/lib/queryClient";
import { Building2, Plus, MoreVertical, Zap, Power, PowerOff, Trash2, Settings } from "lucide-react";
import type { Block, Line } from "@shared/schema";

export default function BlocksPage() {
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [isBlockDialogOpen, setIsBlockDialogOpen] = useState(false);
  const [isLineDialogOpen, setIsLineDialogOpen] = useState(false);
  const [selectedBlockId, setSelectedBlockId] = useState<string | null>(null);
  const [newBlockName, setNewBlockName] = useState("");
  const [newBlockQuota, setNewBlockQuota] = useState("");
  const [newLineNumber, setNewLineNumber] = useState("");
  const [newLineQuota, setNewLineQuota] = useState("");

  // Fetch blocks
  const { data: blocks = [], isLoading: blocksLoading } = useQuery<Block[]>({
    queryKey: ["/api/blocks"],
  });

  // Fetch lines
  const { data: lines = [], isLoading: linesLoading } = useQuery<Line[]>({
    queryKey: ["/api/lines"],
  });

  // Create block mutation
  const createBlockMutation = useMutation({
    mutationFn: async (data: { name: string; totalQuotaKwh: string }) => {
      const res = await apiRequest("POST", "/api/blocks", data);
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/blocks"] });
      setIsBlockDialogOpen(false);
      setNewBlockName("");
      setNewBlockQuota("");
      toast({ title: "Block created successfully" });
    },
    onError: (error: Error) => {
      toast({ title: "Error", description: error.message, variant: "destructive" });
    },
  });

  // Create line mutation
  const createLineMutation = useMutation({
    mutationFn: async (data: { blockId: string; lineNumber: number; currentQuotaKwh: string; remainingKwh: string }) => {
      const res = await apiRequest("POST", "/api/lines", data);
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/lines"] });
      setIsLineDialogOpen(false);
      setSelectedBlockId(null);
      setNewLineNumber("");
      setNewLineQuota("");
      toast({ title: "Line created successfully" });
    },
    onError: (error: Error) => {
      toast({ title: "Error", description: error.message, variant: "destructive" });
    },
  });

  // Delete block mutation
  const deleteBlockMutation = useMutation({
    mutationFn: async (blockId: string) => {
      const res = await apiRequest("DELETE", `/api/blocks/${blockId}`);
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/blocks"] });
      queryClient.invalidateQueries({ queryKey: ["/api/lines"] });
      toast({ title: "Block deleted successfully" });
    },
    onError: (error: Error) => {
      toast({ title: "Error", description: error.message, variant: "destructive" });
    },
  });

  // Delete line mutation
  const deleteLineMutation = useMutation({
    mutationFn: async (lineId: string) => {
      const res = await apiRequest("DELETE", `/api/lines/${lineId}`);
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/lines"] });
      toast({ title: "Line deleted successfully" });
    },
    onError: (error: Error) => {
      toast({ title: "Error", description: error.message, variant: "destructive" });
    },
  });

  // Control line mutation (disconnect/reconnect)
  const controlLineMutation = useMutation({
    mutationFn: async (data: { line_id: string; command: "disconnect" | "reconnect" }) => {
      const res = await apiRequest("POST", "/api/admin/control", data);
      return res.json();
    },
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: ["/api/lines"] });
      toast({ title: `Line ${variables.command === "disconnect" ? "disconnected" : "reconnected"} successfully` });
    },
    onError: (error: Error) => {
      toast({ title: "Error", description: error.message, variant: "destructive" });
    },
  });

  const handleCreateBlock = () => {
    if (!newBlockName || !newBlockQuota) return;
    createBlockMutation.mutate({ name: newBlockName, totalQuotaKwh: newBlockQuota });
  };

  const handleCreateLine = () => {
    if (!selectedBlockId || !newLineNumber || !newLineQuota) return;
    createLineMutation.mutate({
      blockId: selectedBlockId,
      lineNumber: parseInt(newLineNumber),
      currentQuotaKwh: newLineQuota,
      remainingKwh: newLineQuota,
    });
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case "active":
        return "bg-green-500";
      case "idle":
        return "bg-yellow-500";
      case "disconnected":
        return "bg-red-500";
      default:
        return "bg-gray-500";
    }
  };

  const getStatusBadgeVariant = (status: string) => {
    switch (status) {
      case "active":
        return "default";
      case "idle":
        return "secondary";
      case "disconnected":
        return "destructive";
      default:
        return "outline";
    }
  };

  if (blocksLoading || linesLoading) {
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
          <h1 className="text-4xl font-bold tracking-tight">Blocks & Lines</h1>
          <p className="text-muted-foreground mt-2">
            Manage energy blocks and power lines
          </p>
        </div>
        <div className="flex gap-2">
          <Dialog open={isBlockDialogOpen} onOpenChange={setIsBlockDialogOpen}>
            <DialogTrigger asChild>
              <Button>
                <Plus className="h-4 w-4 mr-2" />
                Add Block
              </Button>
            </DialogTrigger>
            <DialogContent>
              <DialogHeader>
                <DialogTitle>Create New Block</DialogTitle>
                <DialogDescription>
                  Add a new building or block to the energy management system.
                </DialogDescription>
              </DialogHeader>
              <div className="grid gap-4 py-4">
                <div className="grid gap-2">
                  <Label htmlFor="blockName">Block Name</Label>
                  <Input
                    id="blockName"
                    placeholder="e.g., Block A"
                    value={newBlockName}
                    onChange={(e) => setNewBlockName(e.target.value)}
                  />
                </div>
                <div className="grid gap-2">
                  <Label htmlFor="blockQuota">Total Quota (kWh)</Label>
                  <Input
                    id="blockQuota"
                    type="number"
                    placeholder="e.g., 1000"
                    value={newBlockQuota}
                    onChange={(e) => setNewBlockQuota(e.target.value)}
                  />
                </div>
              </div>
              <DialogFooter>
                <Button variant="outline" onClick={() => setIsBlockDialogOpen(false)}>
                  Cancel
                </Button>
                <Button onClick={handleCreateBlock} disabled={createBlockMutation.isPending}>
                  {createBlockMutation.isPending ? "Creating..." : "Create Block"}
                </Button>
              </DialogFooter>
            </DialogContent>
          </Dialog>

          <Dialog open={isLineDialogOpen} onOpenChange={setIsLineDialogOpen}>
            <DialogTrigger asChild>
              <Button variant="outline">
                <Plus className="h-4 w-4 mr-2" />
                Add Line
              </Button>
            </DialogTrigger>
            <DialogContent>
              <DialogHeader>
                <DialogTitle>Create New Line</DialogTitle>
                <DialogDescription>
                  Add a new power line to an existing block.
                </DialogDescription>
              </DialogHeader>
              <div className="grid gap-4 py-4">
                <div className="grid gap-2">
                  <Label htmlFor="lineBlock">Block</Label>
                  <Select value={selectedBlockId || ""} onValueChange={setSelectedBlockId}>
                    <SelectTrigger>
                      <SelectValue placeholder="Select a block" />
                    </SelectTrigger>
                    <SelectContent>
                      {blocks.map((block) => (
                        <SelectItem key={block.id} value={block.id}>
                          {block.name}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div className="grid gap-2">
                  <Label htmlFor="lineNumber">Line Number</Label>
                  <Input
                    id="lineNumber"
                    type="number"
                    placeholder="e.g., 1"
                    value={newLineNumber}
                    onChange={(e) => setNewLineNumber(e.target.value)}
                  />
                </div>
                <div className="grid gap-2">
                  <Label htmlFor="lineQuota">Initial Quota (kWh)</Label>
                  <Input
                    id="lineQuota"
                    type="number"
                    placeholder="e.g., 100"
                    value={newLineQuota}
                    onChange={(e) => setNewLineQuota(e.target.value)}
                  />
                </div>
              </div>
              <DialogFooter>
                <Button variant="outline" onClick={() => setIsLineDialogOpen(false)}>
                  Cancel
                </Button>
                <Button onClick={handleCreateLine} disabled={createLineMutation.isPending}>
                  {createLineMutation.isPending ? "Creating..." : "Create Line"}
                </Button>
              </DialogFooter>
            </DialogContent>
          </Dialog>
        </div>
      </div>

      {/* Blocks Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {blocks.map((block) => {
          const blockLines = lines.filter((line) => line.blockId === block.id);
          const activeLines = blockLines.filter((line) => line.status === "active").length;

          return (
            <Card key={block.id}>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-lg font-semibold flex items-center gap-2">
                  <Building2 className="h-5 w-5" />
                  {block.name}
                </CardTitle>
                <DropdownMenu>
                  <DropdownMenuTrigger asChild>
                    <Button variant="ghost" size="icon">
                      <MoreVertical className="h-4 w-4" />
                    </Button>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent align="end">
                    <DropdownMenuItem
                      className="text-destructive"
                      onClick={() => deleteBlockMutation.mutate(block.id)}
                    >
                      <Trash2 className="h-4 w-4 mr-2" />
                      Delete Block
                    </DropdownMenuItem>
                  </DropdownMenuContent>
                </DropdownMenu>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  <div className="flex justify-between items-center text-sm">
                    <span className="text-muted-foreground">Total Quota</span>
                    <span className="font-mono font-medium">{block.totalQuotaKwh} kWh</span>
                  </div>
                  <div className="flex justify-between items-center text-sm">
                    <span className="text-muted-foreground">Lines</span>
                    <span className="font-mono font-medium">
                      {activeLines}/{blockLines.length} active
                    </span>
                  </div>
                </div>
              </CardContent>
            </Card>
          );
        })}
        {blocks.length === 0 && (
          <Card className="col-span-full">
            <CardContent className="flex flex-col items-center justify-center py-12">
              <Building2 className="h-12 w-12 text-muted-foreground/30 mb-4" />
              <p className="text-sm text-muted-foreground">No blocks created yet</p>
              <p className="text-xs text-muted-foreground mt-1">
                Click "Add Block" to get started
              </p>
            </CardContent>
          </Card>
        )}
      </div>

      {/* Lines Table */}
      <Card>
        <CardHeader>
          <CardTitle className="text-lg flex items-center gap-2">
            <Zap className="h-5 w-5" />
            All Lines
          </CardTitle>
        </CardHeader>
        <CardContent>
          {lines.length > 0 ? (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Status</TableHead>
                  <TableHead>Block</TableHead>
                  <TableHead>Line #</TableHead>
                  <TableHead>Quota</TableHead>
                  <TableHead>Remaining</TableHead>
                  <TableHead>Usage %</TableHead>
                  <TableHead className="text-right">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {lines.map((line) => {
                  const block = blocks.find((b) => b.id === line.blockId);
                  const quota = parseFloat(line.currentQuotaKwh || "0");
                  const remaining = parseFloat(line.remainingKwh || "0");
                  const usagePercent = quota > 0 ? ((quota - remaining) / quota) * 100 : 0;

                  return (
                    <TableRow key={line.id}>
                      <TableCell>
                        <div className="flex items-center gap-2">
                          <div className={`w-2 h-2 rounded-full ${getStatusColor(line.status)}`} />
                          <Badge variant={getStatusBadgeVariant(line.status)}>
                            {line.status}
                          </Badge>
                        </div>
                      </TableCell>
                      <TableCell className="font-medium">{block?.name || "Unknown"}</TableCell>
                      <TableCell>Line {line.lineNumber}</TableCell>
                      <TableCell className="font-mono">{line.currentQuotaKwh} kWh</TableCell>
                      <TableCell className="font-mono">{remaining.toFixed(2)} kWh</TableCell>
                      <TableCell>
                        <div className="flex items-center gap-2">
                          <div className="w-16 bg-secondary rounded-full h-2 overflow-hidden">
                            <div
                              className={`h-full transition-all ${
                                usagePercent > 80 ? "bg-red-500" : usagePercent > 50 ? "bg-yellow-500" : "bg-green-500"
                              }`}
                              style={{ width: `${Math.min(usagePercent, 100)}%` }}
                            />
                          </div>
                          <span className="text-xs text-muted-foreground w-12">
                            {usagePercent.toFixed(0)}%
                          </span>
                        </div>
                      </TableCell>
                      <TableCell className="text-right">
                        <DropdownMenu>
                          <DropdownMenuTrigger asChild>
                            <Button variant="ghost" size="icon">
                              <MoreVertical className="h-4 w-4" />
                            </Button>
                          </DropdownMenuTrigger>
                          <DropdownMenuContent align="end">
                            {line.status === "active" ? (
                              <DropdownMenuItem
                                onClick={() =>
                                  controlLineMutation.mutate({ line_id: line.id, command: "disconnect" })
                                }
                              >
                                <PowerOff className="h-4 w-4 mr-2" />
                                Disconnect
                              </DropdownMenuItem>
                            ) : (
                              <DropdownMenuItem
                                onClick={() =>
                                  controlLineMutation.mutate({ line_id: line.id, command: "reconnect" })
                                }
                              >
                                <Power className="h-4 w-4 mr-2" />
                                Reconnect
                              </DropdownMenuItem>
                            )}
                            <DropdownMenuItem
                              className="text-destructive"
                              onClick={() => deleteLineMutation.mutate(line.id)}
                            >
                              <Trash2 className="h-4 w-4 mr-2" />
                              Delete Line
                            </DropdownMenuItem>
                          </DropdownMenuContent>
                        </DropdownMenu>
                      </TableCell>
                    </TableRow>
                  );
                })}
              </TableBody>
            </Table>
          ) : (
            <div className="flex flex-col items-center justify-center py-12">
              <Zap className="h-12 w-12 text-muted-foreground/30 mb-4" />
              <p className="text-sm text-muted-foreground">No lines created yet</p>
              <p className="text-xs text-muted-foreground mt-1">
                Create a block first, then add lines
              </p>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
