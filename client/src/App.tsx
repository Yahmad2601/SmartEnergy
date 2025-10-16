import { Switch, Route } from "wouter";
import { QueryClientProvider } from "@tanstack/react-query";
import { queryClient } from "./lib/queryClient";
import { Toaster } from "@/components/ui/toaster";
import { TooltipProvider } from "@/components/ui/tooltip";
import { ThemeProvider } from "@/components/theme-provider";
import { PublicRoute } from "@/components/auth/public-route";
import { ProtectedRoute } from "@/components/auth/protected-route";
import { DashboardLayout } from "@/components/dashboard/dashboard-layout";
import AuthPage from "@/pages/auth";
import AdminDashboard from "@/pages/admin/dashboard";
import StudentDashboard from "@/pages/student/dashboard";
import NotFound from "@/pages/not-found";

function Router() {
  return (
    <Switch>
      {/* Public routes */}
      <Route path="/">
        <PublicRoute>
          <AuthPage />
        </PublicRoute>
      </Route>

      {/* Admin routes */}
      <Route path="/admin">
        <ProtectedRoute requiredRole="admin">
          <DashboardLayout role="admin">
            <AdminDashboard />
          </DashboardLayout>
        </ProtectedRoute>
      </Route>

      <Route path="/admin/blocks">
        <ProtectedRoute requiredRole="admin">
          <DashboardLayout role="admin">
            <div className="text-2xl font-bold">Blocks & Lines (Coming Soon)</div>
          </DashboardLayout>
        </ProtectedRoute>
      </Route>

      <Route path="/admin/users">
        <ProtectedRoute requiredRole="admin">
          <DashboardLayout role="admin">
            <div className="text-2xl font-bold">Users (Coming Soon)</div>
          </DashboardLayout>
        </ProtectedRoute>
      </Route>

      <Route path="/admin/analytics">
        <ProtectedRoute requiredRole="admin">
          <DashboardLayout role="admin">
            <div className="text-2xl font-bold">Analytics (Coming Soon)</div>
          </DashboardLayout>
        </ProtectedRoute>
      </Route>

      <Route path="/admin/alerts">
        <ProtectedRoute requiredRole="admin">
          <DashboardLayout role="admin">
            <div className="text-2xl font-bold">Alerts (Coming Soon)</div>
          </DashboardLayout>
        </ProtectedRoute>
      </Route>

      <Route path="/admin/settings">
        <ProtectedRoute requiredRole="admin">
          <DashboardLayout role="admin">
            <div className="text-2xl font-bold">Settings (Coming Soon)</div>
          </DashboardLayout>
        </ProtectedRoute>
      </Route>

      {/* Student routes */}
      <Route path="/student">
        <ProtectedRoute requiredRole="student">
          <DashboardLayout role="student">
            <StudentDashboard />
          </DashboardLayout>
        </ProtectedRoute>
      </Route>

      <Route path="/student/usage">
        <ProtectedRoute requiredRole="student">
          <DashboardLayout role="student">
            <div className="text-2xl font-bold">Usage (Coming Soon)</div>
          </DashboardLayout>
        </ProtectedRoute>
      </Route>

      <Route path="/student/topup">
        <ProtectedRoute requiredRole="student">
          <DashboardLayout role="student">
            <div className="text-2xl font-bold">Top Up (Coming Soon)</div>
          </DashboardLayout>
        </ProtectedRoute>
      </Route>

      <Route path="/student/assistant">
        <ProtectedRoute requiredRole="student">
          <DashboardLayout role="student">
            <div className="text-2xl font-bold">AI Assistant (Coming Soon)</div>
          </DashboardLayout>
        </ProtectedRoute>
      </Route>

      <Route path="/student/settings">
        <ProtectedRoute requiredRole="student">
          <DashboardLayout role="student">
            <div className="text-2xl font-bold">Settings (Coming Soon)</div>
          </DashboardLayout>
        </ProtectedRoute>
      </Route>

      {/* Fallback to 404 */}
      <Route component={NotFound} />
    </Switch>
  );
}

export default function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <ThemeProvider defaultTheme="dark" storageKey="energy-platform-theme">
        <TooltipProvider>
          <Toaster />
          <Router />
        </TooltipProvider>
      </ThemeProvider>
    </QueryClientProvider>
  );
}
