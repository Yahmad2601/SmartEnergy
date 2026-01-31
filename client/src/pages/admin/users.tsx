import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
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
import { Users, MoreVertical, UserCheck, Building2, Search, Filter, ArrowUpDown } from "lucide-react";
import { Label } from "@/components/ui/label";
import type { Block, Line } from "@shared/schema";

interface User {
  id: string;
  email: string;
  role: "admin" | "student";
  blockId: string | null;
  lineId: string | null;
  createdAt: string;
}

export default function UsersPage() {
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [isAssignDialogOpen, setIsAssignDialogOpen] = useState(false);
  const [selectedUser, setSelectedUser] = useState<User | null>(null);
  const [selectedBlockId, setSelectedBlockId] = useState<string>("");
  const [selectedLineId, setSelectedLineId] = useState<string>("");

  // Filters State
  const [searchTerm, setSearchTerm] = useState("");
  const [roleFilter, setRoleFilter] = useState<"all" | "admin" | "student">("all");
  const [blockFilter, setBlockFilter] = useState<string>("all");
  const [lineFilter, setLineFilter] = useState<string>("all");
  const [dateSort, setDateSort] = useState<"newest" | "oldest">("newest");

  // Fetch users
  const { data: users = [], isLoading: usersLoading } = useQuery<User[]>({
    queryKey: ["/api/users"],
  });

  // Fetch blocks
  const { data: blocks = [] } = useQuery<Block[]>({
    queryKey: ["/api/blocks"],
  });

  // Fetch lines
  const { data: lines = [] } = useQuery<Line[]>({
    queryKey: ["/api/lines"],
  });

  // Assign user mutation
  const assignUserMutation = useMutation({
    mutationFn: async (data: { userId: string; blockId: string; lineId: string }) => {
      const res = await apiRequest("POST", `/api/users/${data.userId}/assign`, {
        blockId: data.blockId || null,
        lineId: data.lineId || null,
      });
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/users"] });
      setIsAssignDialogOpen(false);
      setSelectedUser(null);
      setSelectedBlockId("");
      setSelectedLineId("");
      toast({ title: "User assigned successfully" });
    },
    onError: (error: Error) => {
      toast({ title: "Error", description: error.message, variant: "destructive" });
    },
  });

  const handleAssignClick = (user: User) => {
    setSelectedUser(user);
    setSelectedBlockId(user.blockId || "");
    setSelectedLineId(user.lineId || "");
    setIsAssignDialogOpen(true);
  };

  const handleAssign = () => {
    if (!selectedUser) return;
    assignUserMutation.mutate({
      userId: selectedUser.id,
      blockId: selectedBlockId,
      lineId: selectedLineId,
    });
  };

  // Filter Logic
  const filteredUsers = users
    .filter((user) => {
      const matchesSearch = user.email.toLowerCase().includes(searchTerm.toLowerCase());
      const matchesRole = roleFilter === "all" || user.role === roleFilter;
      const matchesBlock = blockFilter === "all" || user.blockId === blockFilter;
      // Only verify line if block is selected/specific, as lines are block-dependent
      const matchesLine = lineFilter === "all" || user.lineId === lineFilter;

      return matchesSearch && matchesRole && matchesBlock && matchesLine;
    })
    .sort((a, b) => {
      const dateA = new Date(a.createdAt).getTime();
      const dateB = new Date(b.createdAt).getTime();
      return dateSort === "newest" ? dateB - dateA : dateA - dateB;
    });

  const availableLinesForFilter = blockFilter !== "all" 
    ? lines.filter(l => l.blockId === blockFilter) 
    : [];

  const filteredLines = selectedBlockId
    ? lines.filter((line) => line.blockId === selectedBlockId)
    : [];

  const students = users.filter((u) => u.role === "student");
  const admins = users.filter((u) => u.role === "admin");

  if (usersLoading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
      </div>
    );
  }

  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-4xl font-bold tracking-tight">Users</h1>
        <p className="text-muted-foreground mt-2">
          Manage student accounts and block assignments
        </p>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <Card className="relative overflow-hidden border-none shadow-md bg-gradient-to-br from-white to-slate-50 dark:from-slate-950 dark:to-slate-900 ring-1 ring-slate-200 dark:ring-slate-800">
           <div className="absolute right-0 top-0 h-24 w-24 translate-x-8 translate-y--8 rounded-full bg-blue-500/10 blur-2xl" />
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">Total Students</CardTitle>
            <div className="rounded-md bg-blue-500/10 p-2 text-blue-500">
              <Users className="h-4 w-4" />
            </div>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold font-mono text-slate-900 dark:text-slate-50">{students.length}</div>
          </CardContent>
        </Card>

        <Card className="relative overflow-hidden border-none shadow-md bg-gradient-to-br from-white to-slate-50 dark:from-slate-950 dark:to-slate-900 ring-1 ring-slate-200 dark:ring-slate-800">
          <div className="absolute right-0 top-0 h-24 w-24 translate-x-8 translate-y--8 rounded-full bg-emerald-500/10 blur-2xl" />
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">Assigned Students</CardTitle>
             <div className="rounded-md bg-emerald-500/10 p-2 text-emerald-500">
               <UserCheck className="h-4 w-4" />
             </div>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold font-mono text-slate-900 dark:text-slate-50">
              {students.filter((s) => s.lineId).length}
            </div>
          </CardContent>
        </Card>

        <Card className="relative overflow-hidden border-none shadow-md bg-gradient-to-br from-white to-slate-50 dark:from-slate-950 dark:to-slate-900 ring-1 ring-slate-200 dark:ring-slate-800">
          <div className="absolute right-0 top-0 h-24 w-24 translate-x-8 translate-y--8 rounded-full bg-violet-500/10 blur-2xl" />
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">Admins</CardTitle>
             <div className="rounded-md bg-violet-500/10 p-2 text-violet-500">
              <Building2 className="h-4 w-4" />
             </div>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold font-mono text-slate-900 dark:text-slate-50">{admins.length}</div>
          </CardContent>
        </Card>
      </div>

      {/* Filters */}
      <Card>
        <CardContent className="p-4 space-y-4 md:space-y-0 md:flex md:items-center md:gap-4">
          <div className="relative flex-1">
            <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="Search by email..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-8"
            />
          </div>
          
          <div className="flex flex-col gap-2 sm:flex-row sm:items-center">
            <Select value={roleFilter} onValueChange={(v: any) => setRoleFilter(v)}>
              <SelectTrigger className="w-full sm:w-[150px]">
                <SelectValue placeholder="Role" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Roles</SelectItem>
                <SelectItem value="admin">Admin</SelectItem>
                <SelectItem value="student">Student</SelectItem>
              </SelectContent>
            </Select>

            <Select 
              value={blockFilter} 
              onValueChange={(v) => { 
                setBlockFilter(v);
                setLineFilter("all"); // Reset line when block changes
              }}
            >
              <SelectTrigger className="w-full sm:w-[150px]">
                <SelectValue placeholder="Block" />
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

            <Select 
              value={lineFilter} 
              onValueChange={setLineFilter}
              disabled={blockFilter === "all"}
            >
              <SelectTrigger className="w-full sm:w-[150px]">
                <SelectValue placeholder="Line" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Lines</SelectItem>
                {availableLinesForFilter.map((line) => (
                  <SelectItem key={line.id} value={line.id}>
                    Line {line.lineNumber}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>

            <Select value={dateSort} onValueChange={(v: any) => setDateSort(v)}>
              <SelectTrigger className="w-full sm:w-[150px]">
                <SelectValue placeholder="Sort" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="newest">Newest First</SelectItem>
                <SelectItem value="oldest">Oldest First</SelectItem>
              </SelectContent>
            </Select>

            <Button 
              variant="outline" 
              size="icon" 
              onClick={() => {
                setSearchTerm("");
                setRoleFilter("all");
                setBlockFilter("all");
                setLineFilter("all");
                setDateSort("newest");
              }}
              title="Reset Filters"
            >
              <Filter className="h-4 w-4" />
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Users Table */}
      <Card>
        <CardHeader>
          <CardTitle className="text-lg flex items-center gap-2">
            <Users className="h-5 w-5" />
            User List ({filteredUsers.length})
          </CardTitle>
        </CardHeader>
        <CardContent>
          {filteredUsers.length > 0 ? (
            <>
              {/* Desktop View */}
              <div className="hidden md:block">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Email</TableHead>
                      <TableHead>Role</TableHead>
                      <TableHead>Block</TableHead>
                      <TableHead>Line</TableHead>
                      <TableHead>Joined</TableHead>
                      <TableHead className="text-right">Actions</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {filteredUsers.map((user) => {
                      const block = blocks.find((b) => b.id === user.blockId);
                      const line = lines.find((l) => l.id === user.lineId);

                      return (
                        <TableRow key={user.id}>
                          <TableCell className="font-medium">{user.email}</TableCell>
                          <TableCell>
                            <Badge variant={user.role === "admin" ? "default" : "secondary"}>
                              {user.role}
                            </Badge>
                          </TableCell>
                          <TableCell>{block?.name || "—"}</TableCell>
                          <TableCell>{line ? `Line ${line.lineNumber}` : "—"}</TableCell>
                          <TableCell className="text-muted-foreground">
                            {new Date(user.createdAt).toLocaleDateString()}
                          </TableCell>
                          <TableCell className="text-right">
                            {user.role === "student" && (
                              <DropdownMenu>
                                <DropdownMenuTrigger asChild>
                                  <Button variant="ghost" size="icon">
                                    <MoreVertical className="h-4 w-4" />
                                  </Button>
                                </DropdownMenuTrigger>
                                <DropdownMenuContent align="end">
                                  <DropdownMenuItem onClick={() => handleAssignClick(user)}>
                                    <Building2 className="h-4 w-4 mr-2" />
                                    Assign to Block/Line
                                  </DropdownMenuItem>
                                </DropdownMenuContent>
                              </DropdownMenu>
                            )}
                          </TableCell>
                        </TableRow>
                      );
                    })}
                  </TableBody>
                </Table>
              </div>

              {/* Mobile View */}
              <div className="grid grid-cols-1 gap-4 md:hidden">
                {filteredUsers.map((user) => {
                  const block = blocks.find((b) => b.id === user.blockId);
                  const line = lines.find((l) => l.id === user.lineId);

                  return (
                    <div key={user.id} className="flex flex-col space-y-3 p-4 border rounded-lg bg-card text-card-foreground shadow-sm">
                      <div className="flex items-center justify-between">
                        <div className="font-semibold truncate pr-4">{user.email}</div>
                        <Badge variant={user.role === "admin" ? "default" : "secondary"}>
                          {user.role}
                        </Badge>
                      </div>
                      
                      <div className="grid grid-cols-2 gap-2 text-sm border-t pt-3 mt-1">
                        <div className="flex flex-col gap-1">
                          <span className="text-[10px] uppercase text-muted-foreground font-bold tracking-wider">Block</span>
                          <span className="font-medium">{block?.name || "—"}</span>
                        </div>
                        <div className="flex flex-col gap-1">
                          <span className="text-[10px] uppercase text-muted-foreground font-bold tracking-wider">Line</span>
                          <span className="font-medium">{line ? `Line ${line.lineNumber}` : "—"}</span>
                        </div>
                        <div className="flex flex-col gap-1 col-span-2 mt-2">
                          <span className="text-[10px] uppercase text-muted-foreground font-bold tracking-wider">Joined</span>
                          <span className="font-medium">{new Date(user.createdAt).toLocaleDateString()}</span>
                        </div>
                      </div>

                      {user.role === "student" && (
                         <Button variant="outline" size="sm" className="w-full mt-2" onClick={() => handleAssignClick(user)}>
                             <Building2 className="h-4 w-4 mr-2" />
                             Manage Assignment
                         </Button>
                      )}
                    </div>
                  );
                })}
              </div>
            </>
          ) : (
            <div className="flex flex-col items-center justify-center py-12">
              <Users className="h-12 w-12 text-muted-foreground/30 mb-4" />
              <p className="text-sm text-muted-foreground">No users registered yet</p>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Assign Dialog */}
      <Dialog open={isAssignDialogOpen} onOpenChange={setIsAssignDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Assign User to Block/Line</DialogTitle>
            <DialogDescription>
              Assign {selectedUser?.email} to a specific block and power line.
            </DialogDescription>
          </DialogHeader>
          <div className="grid gap-4 py-4">
            <div className="grid gap-2">
              <Label>Block</Label>
              <Select
                value={selectedBlockId}
                onValueChange={(value) => {
                  setSelectedBlockId(value);
                  setSelectedLineId("");
                }}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Select a block" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="">None</SelectItem>
                  {blocks.map((block) => (
                    <SelectItem key={block.id} value={block.id}>
                      {block.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="grid gap-2">
              <Label>Line</Label>
              <Select
                value={selectedLineId}
                onValueChange={setSelectedLineId}
                disabled={!selectedBlockId}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Select a line" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="">None</SelectItem>
                  {filteredLines.map((line) => (
                    <SelectItem key={line.id} value={line.id}>
                      Line {line.lineNumber} ({line.remainingKwh} kWh remaining)
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setIsAssignDialogOpen(false)}>
              Cancel
            </Button>
            <Button onClick={handleAssign} disabled={assignUserMutation.isPending}>
              {assignUserMutation.isPending ? "Assigning..." : "Assign"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
