import { useState } from "react";
import { useMutation } from "@tanstack/react-query";
import { useLocation } from "wouter";
import { LoginForm } from "@/components/auth/login-form";
import { RegisterForm } from "@/components/auth/register-form";
import { useToast } from "@/hooks/use-toast";
// Import the queryClient from your lib
import { apiRequest, queryClient } from "@/lib/queryClient";
import type { LoginInput, RegisterInput } from "@shared/schema";

type AuthMode = "login" | "register";

export default function AuthPage() {
  const [mode, setMode] = useState<AuthMode>("login");
  const [, setLocation] = useLocation();
  const { toast } = useToast();

  const loginMutation = useMutation({
    mutationFn: async (data: LoginInput) => {
      const response = await apiRequest("POST", "/api/auth/login", data);
      return response.json();
    },
    onSuccess: (data) => {
      toast({
        title: "Success",
        description: "Logged in successfully",
      });

      // THIS IS THE FIX: Invalidate the session query cache
      queryClient.invalidateQueries({ queryKey: ["/api/auth/session"] });

      // Redirect based on role
      if (data?.user?.role === "admin") {
        setLocation("/admin");
      } else {
        setLocation("/student");
      }
    },
    onError: (error: Error) => {
      toast({
        title: "Error",
        description: error.message || "Failed to login",
        variant: "destructive",
      });
    },
  });

  const registerMutation = useMutation({
    mutationFn: async (data: RegisterInput) => {
      const response = await apiRequest("POST", "/api/auth/register", data);
      return response.json();
    },
    onSuccess: (data) => {
      toast({
        title: "Success",
        description: "Account created successfully",
      });

      // THIS IS THE FIX: Invalidate the session query cache
      queryClient.invalidateQueries({ queryKey: ["/api/auth/session"] });

      // Redirect based on role
      if (data?.user?.role === "admin") {
        setLocation("/admin");
      } else {
        setLocation("/student");
      }
    },
    onError: (error: Error) => {
      toast({
        title: "Error",
        description: error.message || "Failed to create account",
        variant: "destructive",
      });
    },
  });

  if (mode === "login") {
    return (
      <LoginForm
        onSubmit={loginMutation.mutateAsync}
        onSwitchToRegister={() => setMode("register")}
        isLoading={loginMutation.isPending}
      />
    );
  }

  return (
    <RegisterForm
      onSubmit={registerMutation.mutateAsync}
      onSwitchToLogin={() => setMode("login")}
      isLoading={registerMutation.isPending}
    />
  );
}
