import { useQuery } from "@tanstack/react-query";
import { useLocation } from "wouter";
import { useEffect } from "react";
import { Loader2 } from "lucide-react";

interface PublicRouteProps {
  children: React.ReactNode;
}

export function PublicRoute({ children }: PublicRouteProps) {
  const [, setLocation] = useLocation();

  const { data: session, isLoading } = useQuery({
    queryKey: ["/api/auth/session"],
  });

  useEffect(() => {
    if (!isLoading && session?.user) {
      // Redirect to appropriate dashboard based on role
      if (session.user.role === "admin") {
        setLocation("/admin");
      } else {
        setLocation("/student");
      }
    }
  }, [session, isLoading, setLocation]);

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-background">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  if (session?.user) {
    return null;
  }

  return <>{children}</>;
}
