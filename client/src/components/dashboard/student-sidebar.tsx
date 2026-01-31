import { Home, Zap, CreditCard, MessageSquare, Settings } from "lucide-react";
import { Link, useLocation } from "wouter";
import {
  Sidebar,
  SidebarContent,
  SidebarGroup,
  SidebarGroupContent,
  SidebarGroupLabel,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
  SidebarHeader,
  SidebarFooter,
  useSidebar,
} from "@/components/ui/sidebar";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";

interface StudentSidebarProps {
  userEmail?: string;
  onLogout: () => void;
}

const menuItems = [
  {
    title: "Dashboard",
    url: "/student",
    icon: Home,
  },
  {
    title: "Usage",
    url: "/student/usage",
    icon: Zap,
  },
  {
    title: "Top Up",
    url: "/student/topup",
    icon: CreditCard,
  },
  {
    title: "AI Assistant",
    url: "/student/assistant",
    icon: MessageSquare,
  },
  {
    title: "Settings",
    url: "/student/settings",
    icon: Settings,
  },
];

export function StudentSidebar({ userEmail, onLogout }: StudentSidebarProps) {
  const [location] = useLocation();
  const { setOpenMobile, isMobile } = useSidebar();

  return (
    <Sidebar>
      <SidebarHeader className="p-4 border-b bg-sidebar/50 backdrop-blur-sm">
        <div className="flex items-center gap-3 px-1">
          <div className="flex items-center justify-center w-10 h-10 rounded-xl bg-gradient-to-br from-primary via-primary/90 to-primary/70 text-primary-foreground shadow-md">
            <Zap className="h-5 w-5" />
          </div>
          <div className="flex flex-col">
            <span className="text-sm font-bold tracking-tight text-sidebar-foreground">Energy Platform</span>
            <span className="text-[10px] font-medium text-muted-foreground uppercase tracking-wider">Student Portal</span>
          </div>
        </div>
      </SidebarHeader>
      
      <SidebarContent className="px-2 py-4">
        <SidebarGroup>
          <SidebarGroupLabel className="px-2 text-xs font-semibold text-muted-foreground/70 uppercase tracking-wider mb-2">Navigation</SidebarGroupLabel>
          <SidebarGroupContent>
            <SidebarMenu className="gap-1">
              {menuItems.map((item) => (
                <SidebarMenuItem key={item.title}>
                  <SidebarMenuButton
                    asChild
                    isActive={location === item.url}
                    data-testid={`link-${item.title.toLowerCase().replace(/\s+/g, '-')}`}
                  >
                    <Link href={item.url} onClick={() => isMobile && setOpenMobile(false)}>
                      <item.icon className="h-4 w-4" />
                      <span>{item.title}</span>
                    </Link>
                  </SidebarMenuButton>
                </SidebarMenuItem>
              ))}
            </SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>
      </SidebarContent>

      <SidebarFooter className="p-4 border-t">
        <div className="flex items-center justify-between gap-2">
          <div className="flex items-center gap-2 min-w-0">
            <Avatar className="h-8 w-8">
              <AvatarFallback className="bg-accent text-accent-foreground">
                {userEmail?.charAt(0).toUpperCase() || "S"}
              </AvatarFallback>
            </Avatar>
            <div className="flex-1 min-w-0">
              <p className="text-sm font-medium truncate">{userEmail || "Student"}</p>
              <p className="text-xs text-muted-foreground">Student</p>
            </div>
          </div>
          <Button
            variant="ghost"
            size="sm"
            onClick={onLogout}
            data-testid="button-logout"
          >
            Logout
          </Button>
        </div>
      </SidebarFooter>
    </Sidebar>
  );
}
