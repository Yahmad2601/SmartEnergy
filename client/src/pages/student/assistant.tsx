import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { ScrollArea } from "@/components/ui/scroll-area";
import {
  MessageSquare,
  Send,
  Zap,
  Lightbulb,
  Calculator,
  TrendingDown,
  Bot,
  User,
  Battery,
  Clock,
} from "lucide-react";
import type { Line, Block } from "@shared/schema";

interface Message {
  id: string;
  role: "user" | "assistant";
  content: string;
  timestamp: Date;
}

interface Prediction {
  lineId: string;
  remainingKwh: string;
  avgDailyUsage: string;
  predictedDaysLeft: number;
  recommendedDailyUsage: string;
  tips: string[];
}

// Common appliances with power ratings
const commonAppliances = [
  { name: "LED Bulb", power: 10 },
  { name: "Ceiling Fan", power: 75 },
  { name: "Laptop", power: 65 },
  { name: "Phone Charger", power: 5 },
  { name: "Electric Iron", power: 1000 },
  { name: "Electric Kettle", power: 1500 },
  { name: "Air Conditioner", power: 1500 },
  { name: "Refrigerator", power: 150 },
  { name: "TV", power: 100 },
  { name: "Microwave", power: 1200 },
];

export default function AssistantPage() {
  const [messages, setMessages] = useState<Message[]>([
    {
      id: "welcome",
      role: "assistant",
      content:
        "👋 Hello! I'm your Energy Assistant. I can help you with:\n\n• Checking your balance and predictions\n• Calculating appliance usage impact\n• Providing energy-saving tips\n\nWhat would you like to know?",
      timestamp: new Date(),
    },
  ]);
  const [inputValue, setInputValue] = useState("");
  const [selectedAppliance, setSelectedAppliance] = useState<string | null>(null);
  const [usageHours, setUsageHours] = useState("1");

  // Fetch user's line info
  const { data: lineInfo } = useQuery<{ line: Line | null; block: Block | null }>({
    queryKey: ["/api/my-line"],
  });

  // Fetch predictions
  const { data: prediction, refetch: refetchPrediction } = useQuery<Prediction>({
    queryKey: ["/api/predictions", lineInfo?.line?.id],
    enabled: !!lineInfo?.line?.id,
  });

  const addMessage = (role: "user" | "assistant", content: string) => {
    const newMessage: Message = {
      id: Date.now().toString(),
      role,
      content,
      timestamp: new Date(),
    };
    setMessages((prev) => [...prev, newMessage]);
    return newMessage;
  };

  const handleBalanceInquiry = () => {
    addMessage("user", "What's my current balance?");
    
    if (!lineInfo?.line) {
      addMessage(
        "assistant",
        "❌ You're not assigned to a power line yet. Please contact your administrator to get assigned."
      );
      return;
    }

    const remaining = parseFloat(lineInfo.line.remainingKwh || "0");
    const daysLeft = prediction?.predictedDaysLeft || 0;
    const recommended = prediction?.recommendedDailyUsage || "0";

    let response = `⚡ **Your Current Balance**\n\n`;
    response += `• Remaining: **${remaining.toFixed(2)} kWh**\n`;
    response += `• Location: ${lineInfo.block?.name} - Line ${lineInfo.line.lineNumber}\n`;
    response += `• Status: ${lineInfo.line.status}\n\n`;

    if (prediction) {
      response += `📊 **Predictions**\n`;
      response += `• Estimated days left: **${daysLeft} days**\n`;
      response += `• Avg. daily usage: ${prediction.avgDailyUsage} kWh\n`;
      response += `• Recommended daily: ${recommended} kWh (to last 30 days)`;
    }

    addMessage("assistant", response);
  };

  const handleApplianceSimulation = () => {
    if (!selectedAppliance || !usageHours) {
      addMessage("user", "How much energy would an appliance use?");
      addMessage(
        "assistant",
        "Please select an appliance and enter the hours of usage, then click 'Calculate' to see the impact."
      );
      return;
    }

    const appliance = commonAppliances.find((a) => a.name === selectedAppliance);
    if (!appliance) return;

    const hours = parseFloat(usageHours);
    const energyUsed = (appliance.power * hours) / 1000; // Convert W to kWh
    const remaining = parseFloat(lineInfo?.line?.remainingKwh || "0");
    const remainingAfter = remaining - energyUsed;
    const percentUsed = remaining > 0 ? (energyUsed / remaining) * 100 : 0;

    addMessage("user", `Calculate ${appliance.name} usage for ${hours} hour(s)`);

    let response = `🔌 **Appliance Usage Simulation**\n\n`;
    response += `**${appliance.name}** (${appliance.power}W) for ${hours} hour(s):\n\n`;
    response += `• Energy consumed: **${energyUsed.toFixed(3)} kWh**\n`;
    response += `• Your current balance: ${remaining.toFixed(2)} kWh\n`;
    response += `• Balance after use: **${Math.max(0, remainingAfter).toFixed(2)} kWh**\n`;
    response += `• Percentage of quota: ${percentUsed.toFixed(1)}%\n\n`;

    if (remainingAfter <= 0) {
      response += `⚠️ **Warning**: This usage would exceed your remaining balance!`;
    } else if (percentUsed > 10) {
      response += `💡 **Tip**: Consider reducing usage time to conserve energy.`;
    } else {
      response += `✅ This usage is within safe limits.`;
    }

    addMessage("assistant", response);
    setSelectedAppliance(null);
    setUsageHours("1");
  };

  const handleTips = () => {
    addMessage("user", "Give me energy-saving tips");

    let response = `💡 **Energy-Saving Tips**\n\n`;

    if (prediction?.tips && prediction.tips.length > 0) {
      response += `**Based on your usage:**\n`;
      prediction.tips.forEach((tip) => {
        response += `${tip}\n`;
      });
    }

    response += `\n**General Tips:**\n`;
    response += `• 🔌 Unplug chargers when not in use\n`;
    response += `• 💡 Use natural light during daytime\n`;
    response += `• ❄️ Set AC to 24-25°C for efficiency\n`;
    response += `• 🚿 Use cold water when possible\n`;
    response += `• 📺 Turn off devices, don't leave on standby\n`;
    response += `• 💻 Use laptop on power-saving mode`;

    addMessage("assistant", response);
  };

  const handleSendMessage = () => {
    if (!inputValue.trim()) return;

    const message = inputValue.toLowerCase();
    addMessage("user", inputValue);
    setInputValue("");

    // Simple intent detection
    if (message.includes("balance") || message.includes("remaining") || message.includes("quota")) {
      setTimeout(() => handleBalanceInquiry(), 500);
    } else if (message.includes("tip") || message.includes("save") || message.includes("advice")) {
      setTimeout(() => handleTips(), 500);
    } else if (message.includes("predict") || message.includes("days left") || message.includes("last")) {
      setTimeout(() => {
        if (!lineInfo?.line) {
          addMessage("assistant", "❌ You're not assigned to a power line yet.");
          return;
        }
        const daysLeft = prediction?.predictedDaysLeft || 0;
        const recommended = prediction?.recommendedDailyUsage || "0";
        addMessage(
          "assistant",
          `📊 Based on your current usage pattern:\n\n• Your energy will last approximately **${daysLeft} days**\n• To make it last 30 days, use no more than **${recommended} kWh per day**`
        );
      }, 500);
    } else if (message.includes("appliance") || message.includes("calculate") || message.includes("use")) {
      setTimeout(() => {
        addMessage(
          "assistant",
          "🔌 To calculate appliance usage:\n\n1. Select an appliance from the quick actions below\n2. Enter the hours you plan to use it\n3. Click 'Calculate Impact'\n\nI'll show you how much energy it will consume!"
        );
      }, 500);
    } else {
      setTimeout(() => {
        addMessage(
          "assistant",
          "I understand you're asking about: \"" + inputValue + "\"\n\nI can help you with:\n• **Balance inquiry** - Check your remaining kWh\n• **Energy predictions** - See how long your quota will last\n• **Appliance simulation** - Calculate usage impact\n• **Energy tips** - Get personalized advice\n\nTry asking about any of these topics!"
        );
      }, 500);
    }
  };

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-4xl font-bold tracking-tight">AI Assistant</h1>
        <p className="text-muted-foreground mt-2">
          Get energy insights and personalized recommendations
        </p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Chat Area */}
        <Card className="lg:col-span-2">
          <CardHeader className="border-b">
            <CardTitle className="text-lg flex items-center gap-2">
              <Bot className="h-5 w-5 text-primary" />
              Energy Assistant
            </CardTitle>
          </CardHeader>
          <CardContent className="p-0">
            <ScrollArea className="h-[500px] p-4">
              <div className="space-y-4">
                {messages.map((message) => (
                  <div
                    key={message.id}
                    className={`flex gap-3 ${
                      message.role === "user" ? "justify-end" : "justify-start"
                    }`}
                  >
                    {message.role === "assistant" && (
                      <div className="w-8 h-8 rounded-full bg-primary/10 flex items-center justify-center flex-shrink-0">
                        <Bot className="h-4 w-4 text-primary" />
                      </div>
                    )}
                    <div
                      className={`max-w-[80%] rounded-lg p-3 ${
                        message.role === "user"
                          ? "bg-primary text-primary-foreground"
                          : "bg-muted"
                      }`}
                    >
                      <p className="text-sm whitespace-pre-line">{message.content}</p>
                      <p className="text-xs opacity-70 mt-1">
                        {message.timestamp.toLocaleTimeString([], {
                          hour: "2-digit",
                          minute: "2-digit",
                        })}
                      </p>
                    </div>
                    {message.role === "user" && (
                      <div className="w-8 h-8 rounded-full bg-primary flex items-center justify-center flex-shrink-0">
                        <User className="h-4 w-4 text-primary-foreground" />
                      </div>
                    )}
                  </div>
                ))}
              </div>
            </ScrollArea>
            <div className="p-4 border-t">
              <div className="flex gap-2">
                <Input
                  placeholder="Ask about your energy usage..."
                  value={inputValue}
                  onChange={(e) => setInputValue(e.target.value)}
                  onKeyPress={(e) => e.key === "Enter" && handleSendMessage()}
                />
                <Button onClick={handleSendMessage}>
                  <Send className="h-4 w-4" />
                </Button>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Quick Actions */}
        <div className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle className="text-lg">Quick Actions</CardTitle>
            </CardHeader>
            <CardContent className="space-y-2">
              <Button
                variant="outline"
                className="w-full justify-start"
                onClick={handleBalanceInquiry}
              >
                <Battery className="h-4 w-4 mr-2" />
                Check Balance
              </Button>
              <Button variant="outline" className="w-full justify-start" onClick={handleTips}>
                <Lightbulb className="h-4 w-4 mr-2" />
                Get Energy Tips
              </Button>
              <Button
                variant="outline"
                className="w-full justify-start"
                onClick={() => {
                  addMessage("user", "How long will my energy last?");
                  if (prediction) {
                    addMessage(
                      "assistant",
                      `📊 At your current usage rate, your energy will last approximately **${prediction.predictedDaysLeft} days**.\n\nTo stretch it to 30 days, try to use no more than **${prediction.recommendedDailyUsage} kWh per day**.`
                    );
                  } else {
                    addMessage("assistant", "I don't have enough data to make a prediction yet. Keep using your energy and check back soon!");
                  }
                }}
              >
                <Clock className="h-4 w-4 mr-2" />
                Days Remaining
              </Button>
            </CardContent>
          </Card>

          {/* Appliance Calculator */}
          <Card>
            <CardHeader>
              <CardTitle className="text-lg flex items-center gap-2">
                <Calculator className="h-5 w-5" />
                Appliance Calculator
              </CardTitle>
              <CardDescription>Simulate energy usage</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <label className="text-sm font-medium">Select Appliance</label>
                <div className="grid grid-cols-2 gap-2">
                  {commonAppliances.slice(0, 6).map((appliance) => (
                    <Button
                      key={appliance.name}
                      variant={selectedAppliance === appliance.name ? "default" : "outline"}
                      size="sm"
                      className="h-auto py-2 text-xs"
                      onClick={() => setSelectedAppliance(appliance.name)}
                    >
                      {appliance.name}
                      <Badge variant="secondary" className="ml-1">
                        {appliance.power}W
                      </Badge>
                    </Button>
                  ))}
                </div>
              </div>
              <div className="space-y-2">
                <label className="text-sm font-medium">Hours of Use</label>
                <Input
                  type="number"
                  min="0.5"
                  step="0.5"
                  value={usageHours}
                  onChange={(e) => setUsageHours(e.target.value)}
                />
              </div>
              <Button className="w-full" onClick={handleApplianceSimulation}>
                <Calculator className="h-4 w-4 mr-2" />
                Calculate Impact
              </Button>
            </CardContent>
          </Card>

          {/* Current Status */}
          {lineInfo?.line && (
            <Card>
              <CardHeader>
                <CardTitle className="text-lg">Your Status</CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                <div className="flex justify-between items-center">
                  <span className="text-sm text-muted-foreground">Balance</span>
                  <span className="font-mono font-bold">
                    {parseFloat(lineInfo.line.remainingKwh || "0").toFixed(2)} kWh
                  </span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-sm text-muted-foreground">Status</span>
                  <Badge
                    variant={
                      lineInfo.line.status === "active"
                        ? "default"
                        : lineInfo.line.status === "idle"
                        ? "secondary"
                        : "destructive"
                    }
                  >
                    {lineInfo.line.status}
                  </Badge>
                </div>
                {prediction && (
                  <div className="flex justify-between items-center">
                    <span className="text-sm text-muted-foreground">Days Left</span>
                    <span className="font-mono font-bold">{prediction.predictedDaysLeft}</span>
                  </div>
                )}
              </CardContent>
            </Card>
          )}
        </div>
      </div>
    </div>
  );
}
