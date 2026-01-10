import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { useToast } from "@/hooks/use-toast";
import { apiRequest } from "@/lib/queryClient";
import { CreditCard, Zap, History, Check, Clock, X, Wallet } from "lucide-react";
import type { Payment, Line, Block } from "@shared/schema";

// Pricing configuration (in your local currency)
const PRICE_PER_KWH = 50; // e.g., ₦50 per kWh

const quickTopUpOptions = [
  { units: 10, label: "10 kWh" },
  { units: 25, label: "25 kWh" },
  { units: 50, label: "50 kWh" },
  { units: 100, label: "100 kWh" },
];

export default function TopUpPage() {
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [customUnits, setCustomUnits] = useState("");
  const [isProcessing, setIsProcessing] = useState(false);

  // Fetch user's line info
  const { data: lineInfo } = useQuery<{ line: Line | null; block: Block | null }>({
    queryKey: ["/api/my-line"],
  });

  // Fetch payment history
  const { data: payments = [] } = useQuery<Payment[]>({
    queryKey: ["/api/payments"],
  });

  // Initialize payment mutation
  const initPaymentMutation = useMutation({
    mutationFn: async (data: { amount: number; units: number }) => {
      const res = await apiRequest("POST", "/api/payments/initialize", data);
      return res.json();
    },
    onSuccess: (data) => {
      // In production, redirect to payment gateway here
      toast({
        title: "Payment Initialized",
        description: `Reference: ${data.reference}. Simulating payment...`,
      });
      // For demo purposes, automatically verify the payment
      setTimeout(() => {
        verifyPaymentMutation.mutate({ reference: data.reference });
      }, 2000);
    },
    onError: (error: Error) => {
      toast({ title: "Error", description: error.message, variant: "destructive" });
      setIsProcessing(false);
    },
  });

  // Verify payment mutation
  const verifyPaymentMutation = useMutation({
    mutationFn: async (data: { reference: string }) => {
      const res = await apiRequest("POST", "/api/payments/verify", data);
      return res.json();
    },
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ["/api/payments"] });
      queryClient.invalidateQueries({ queryKey: ["/api/my-line"] });
      toast({
        title: "Top-Up Successful!",
        description: `${data.unitsAdded} kWh has been added to your account.`,
      });
      setIsProcessing(false);
      setCustomUnits("");
    },
    onError: (error: Error) => {
      toast({ title: "Verification Failed", description: error.message, variant: "destructive" });
      setIsProcessing(false);
    },
  });

  const handleTopUp = (units: number) => {
    if (!lineInfo?.line) {
      toast({
        title: "Error",
        description: "You must be assigned to a line first",
        variant: "destructive",
      });
      return;
    }

    setIsProcessing(true);
    const amount = units * PRICE_PER_KWH;
    initPaymentMutation.mutate({ amount, units });
  };

  const handleCustomTopUp = () => {
    const units = parseFloat(customUnits);
    if (isNaN(units) || units <= 0) {
      toast({
        title: "Invalid Amount",
        description: "Please enter a valid number of units",
        variant: "destructive",
      });
      return;
    }
    handleTopUp(units);
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case "completed":
        return (
          <Badge variant="default" className="bg-green-500">
            <Check className="h-3 w-3 mr-1" />
            Completed
          </Badge>
        );
      case "pending":
        return (
          <Badge variant="secondary">
            <Clock className="h-3 w-3 mr-1" />
            Pending
          </Badge>
        );
      case "failed":
        return (
          <Badge variant="destructive">
            <X className="h-3 w-3 mr-1" />
            Failed
          </Badge>
        );
      default:
        return <Badge variant="outline">{status}</Badge>;
    }
  };

  if (!lineInfo?.line) {
    return (
      <div className="space-y-8">
        <div>
          <h1 className="text-4xl font-bold tracking-tight">Top Up</h1>
          <p className="text-muted-foreground mt-2">Add energy units to your account</p>
        </div>

        <Card>
          <CardContent className="flex flex-col items-center justify-center py-12">
            <CreditCard className="h-12 w-12 text-muted-foreground/30 mb-4" />
            <p className="text-sm text-muted-foreground">Not assigned to a line</p>
            <p className="text-xs text-muted-foreground mt-1">
              Contact your administrator to get assigned
            </p>
          </CardContent>
        </Card>
      </div>
    );
  }

  const remainingKwh = parseFloat(lineInfo.line.remainingKwh || "0");

  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-4xl font-bold tracking-tight">Top Up</h1>
        <p className="text-muted-foreground mt-2">Add energy units to your account</p>
      </div>

      {/* Current Balance Card */}
      <Card className="bg-gradient-to-br from-primary/10 to-primary/5 border-primary/20">
        <CardHeader>
          <CardTitle className="text-lg flex items-center gap-2">
            <Wallet className="h-5 w-5" />
            Current Balance
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex items-baseline gap-2">
            <span className="text-5xl font-bold font-mono">{remainingKwh.toFixed(2)}</span>
            <span className="text-xl text-muted-foreground">kWh</span>
          </div>
          <p className="text-sm text-muted-foreground mt-2">
            {lineInfo.block?.name} - Line {lineInfo.line.lineNumber}
          </p>
        </CardContent>
      </Card>

      {/* Quick Top Up Options */}
      <Card>
        <CardHeader>
          <CardTitle className="text-lg">Quick Top Up</CardTitle>
          <CardDescription>Select a preset amount to top up</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            {quickTopUpOptions.map((option) => (
              <Button
                key={option.units}
                variant="outline"
                className="h-auto py-6 flex flex-col gap-2"
                onClick={() => handleTopUp(option.units)}
                disabled={isProcessing}
              >
                <Zap className="h-6 w-6 text-primary" />
                <span className="text-lg font-bold">{option.label}</span>
                <span className="text-sm text-muted-foreground">
                  ₦{(option.units * PRICE_PER_KWH).toLocaleString()}
                </span>
              </Button>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* Custom Amount */}
      <Card>
        <CardHeader>
          <CardTitle className="text-lg">Custom Amount</CardTitle>
          <CardDescription>Enter a specific amount of units</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="flex flex-col sm:flex-row gap-4">
            <div className="flex-1 space-y-2">
              <Label htmlFor="customUnits">Units (kWh)</Label>
              <Input
                id="customUnits"
                type="number"
                placeholder="Enter amount"
                value={customUnits}
                onChange={(e) => setCustomUnits(e.target.value)}
                min="1"
              />
            </div>
            <div className="flex-1 space-y-2">
              <Label>Amount to Pay</Label>
              <div className="h-10 px-3 flex items-center rounded-md border bg-muted">
                <span className="font-mono">
                  ₦{customUnits ? (parseFloat(customUnits) * PRICE_PER_KWH).toLocaleString() : "0"}
                </span>
              </div>
            </div>
            <div className="flex items-end">
              <Button
                onClick={handleCustomTopUp}
                disabled={isProcessing || !customUnits}
                className="w-full sm:w-auto"
              >
                <CreditCard className="h-4 w-4 mr-2" />
                {isProcessing ? "Processing..." : "Pay Now"}
              </Button>
            </div>
          </div>
          <p className="text-xs text-muted-foreground mt-4">
            Rate: ₦{PRICE_PER_KWH} per kWh
          </p>
        </CardContent>
      </Card>

      {/* Payment History */}
      <Card>
        <CardHeader>
          <CardTitle className="text-lg flex items-center gap-2">
            <History className="h-5 w-5" />
            Payment History
          </CardTitle>
        </CardHeader>
        <CardContent>
          {payments.length > 0 ? (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Date</TableHead>
                  <TableHead>Amount</TableHead>
                  <TableHead>Units</TableHead>
                  <TableHead>Reference</TableHead>
                  <TableHead>Status</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {payments.map((payment) => (
                  <TableRow key={payment.id}>
                    <TableCell className="text-muted-foreground">
                      {new Date(payment.timestamp).toLocaleDateString()}
                    </TableCell>
                    <TableCell className="font-mono">
                      ₦{parseFloat(payment.amount).toLocaleString()}
                    </TableCell>
                    <TableCell className="font-mono">{payment.unitsAddedKwh} kWh</TableCell>
                    <TableCell className="font-mono text-xs">{payment.reference}</TableCell>
                    <TableCell>{getStatusBadge(payment.status)}</TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          ) : (
            <div className="flex flex-col items-center justify-center py-12">
              <History className="h-12 w-12 text-muted-foreground/30 mb-4" />
              <p className="text-sm text-muted-foreground">No payment history</p>
              <p className="text-xs text-muted-foreground mt-1">
                Your transactions will appear here
              </p>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Payment Info */}
      <Card>
        <CardHeader>
          <CardTitle className="text-lg">Payment Information</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex items-start gap-3">
            <div className="p-2 rounded-lg bg-primary/10">
              <CreditCard className="h-4 w-4 text-primary" />
            </div>
            <div>
              <p className="font-medium">Secure Payment</p>
              <p className="text-sm text-muted-foreground">
                All payments are processed securely via Paystack
              </p>
            </div>
          </div>
          <div className="flex items-start gap-3">
            <div className="p-2 rounded-lg bg-green-500/10">
              <Zap className="h-4 w-4 text-green-500" />
            </div>
            <div>
              <p className="font-medium">Instant Credit</p>
              <p className="text-sm text-muted-foreground">
                Units are credited immediately after payment confirmation
              </p>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
