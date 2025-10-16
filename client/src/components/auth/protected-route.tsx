import { useQuery } from "@tanstack/react-query";
import { useLocation } from "wouter";
import { useEffect } from "react";
import { Loader2 } from "lucide-react";

interface ProtectedRouteProps {
  children: React.ReactNode;
  requiredRole?: "admin" | "student";
}

export function ProtectedRoute({ children, requiredRole }: ProtectedRouteProps) {
  const [, setLocation] = useLocation();

  const { data: session, isLoading } = useQuery({
    queryKey: ["/api/auth/session"],
  });

  useEffect(() => {
    if (!isLoading) {
      if (!session?.user) {
        setLocation("/");
      } else if (requiredRole && session.user.role !== requiredRole) {
        // Redirect to appropriate dashboard based on role
        if (session.user.role === "admin") {
          setLocation("/admin");
        } else {
          setLocation("/student");
        }
      }
    }
  }, [session, isLoading, requiredRole, setLocation]);

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  if (!session?.user) {
    return null;
  }

  if (requiredRole && session.user.role !== requiredRole) {
    return null;
  }

  return <>{children}</>;
}
