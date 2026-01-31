import { useQuery, useMutation } from "@tanstack/react-query";
import { useLocation } from "wouter";
import { SidebarProvider, SidebarTrigger } from "@/components/ui/sidebar";
import { AdminSidebar } from "./admin-sidebar";
import { StudentSidebar } from "./student-sidebar";
import { ThemeToggle } from "@/components/theme-toggle";
import { useToast } from "@/hooks/use-toast";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { Bell } from "lucide-react";
import { Button } from "@/components/ui/button";

interface DashboardLayoutProps {
  children: React.ReactNode;
  role: "admin" | "student";
}

export function DashboardLayout({ children, role }: DashboardLayoutProps) {
  const [, setLocation] = useLocation();
  const { toast } = useToast();

  const { data: session } = useQuery({
    queryKey: ["/api/auth/session"],
  });

  const logoutMutation = useMutation({
    mutationFn: async () => {
      await apiRequest("POST", "/api/auth/logout", {});
    },
    onSuccess: () => {
      queryClient.clear();
      toast({
        title: "Logged out",
        description: "You have been logged out successfully",
      });
      setLocation("/");
    },
  });

  const sidebarStyle = {
    "--sidebar-width": "16rem",
    "--sidebar-width-icon": "3rem",
  } as React.CSSProperties;

  return (
    <SidebarProvider style={sidebarStyle}>
      <div className="flex h-screen w-full">
        {role === "admin" ? (
          <AdminSidebar
            userEmail={session?.user?.email}
            onLogout={logoutMutation.mutate}
          />
        ) : (
          <StudentSidebar
            userEmail={session?.user?.email}
            onLogout={logoutMutation.mutate}
          />
        )}
        
        <div className="flex flex-col flex-1 overflow-hidden">
          <header className="flex items-center justify-between px-4 md:px-6 py-3 border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60 sticky top-0 z-10 transition-all duration-200">
            <SidebarTrigger data-testid="button-sidebar-toggle" />
            <div className="flex items-center gap-2">
              <Button variant="ghost" size="icon" data-testid="button-notifications" className="rounded-full hover:bg-muted">
                <Bell className="h-5 w-5" />
              </Button>
              <ThemeToggle />
            </div>
          </header>
          
          <main className="flex-1 overflow-auto bg-muted/10">
            <div className="max-w-7xl mx-auto px-4 md:px-8 py-6 fade-in animate-in slide-in-from-bottom-4 duration-500">
              {children}
            </div>
          </main>
        </div>
      </div>
    </SidebarProvider>
  );
}
