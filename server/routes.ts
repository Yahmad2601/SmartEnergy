import type { Express } from "express";
import { createServer, type Server } from "http";
import bcrypt from "bcryptjs";
import jwt from "jsonwebtoken";
import { eq, sql, and, desc, gte } from "drizzle-orm";
import { db } from "./db";
import { 
  users, 
  blocks, 
  lines, 
  energyLogs, 
  devices, 
  controlQueue, 
  alerts, 
  payments,
  aiPredictions 
} from "../shared/schema";
import {
  authenticateToken,
  requireRole,
  generateToken,
  type AuthRequest,
} from "./middleware/auth";
import { 
  loginSchema, 
  registerSchema, 
  deviceDataSchema, 
  deviceHeartbeatSchema,
  deviceControlQuerySchema,
  adminControlSchema
} from "../shared/schema";

export async function registerRoutes(app: Express): Promise<Server> {
  // Auth Routes
  app.post("/api/auth/register", async (req, res) => {
    try {
      const validatedData = registerSchema.parse(req.body);

      // Check if user already exists
      const existingUser = await db
        .select()
        .from(users)
        .where(eq(users.email, validatedData.email))
        .limit(1);

      if (existingUser.length > 0) {
        return res.status(400).json({ message: "User already exists" });
      }

      // Hash password
      const passwordHash = await bcrypt.hash(validatedData.password, 10);

      // Create user
      const [newUser] = await db
        .insert(users)
        .values({
          email: validatedData.email,
          passwordHash,
          role: validatedData.role,
        })
        .returning();

      // Generate token
      const token = generateToken(newUser.id);

      // Set cookie
      res.cookie("token", token, {
        httpOnly: true,
        secure: process.env.NODE_ENV === "production",
        sameSite: "lax",
        maxAge: 7 * 24 * 60 * 60 * 1000, // 7 days
      });

      // Return user without password
      const { passwordHash: _, ...userWithoutPassword } = newUser;
      res.json({ user: userWithoutPassword });
    } catch (error: any) {
      res.status(400).json({ message: error.message || "Registration failed" });
    }
  });

  app.post("/api/auth/login", async (req, res) => {
    try {
      const validatedData = loginSchema.parse(req.body);

      // Find user
      const [user] = await db
        .select()
        .from(users)
        .where(eq(users.email, validatedData.email))
        .limit(1);

      if (!user) {
        return res.status(401).json({ message: "Invalid credentials" });
      }

      // Verify password
      const isValidPassword = await bcrypt.compare(
        validatedData.password,
        user.passwordHash
      );

      if (!isValidPassword) {
        return res.status(401).json({ message: "Invalid credentials" });
      }

      // Generate token
      const token = generateToken(user.id);

      // Set cookie
      res.cookie("token", token, {
        httpOnly: true,
        secure: process.env.NODE_ENV === "production",
        sameSite: "lax",
        maxAge: 7 * 24 * 60 * 60 * 1000, // 7 days
      });

      // Return user without password
      const { passwordHash: _, ...userWithoutPassword } = user;
      res.json({ user: userWithoutPassword });
    } catch (error: any) {
      res.status(400).json({ message: error.message || "Login failed" });
    }
  });

  app.post("/api/auth/logout", (req, res) => {
    res.clearCookie("token");
    res.json({ message: "Logged out successfully" });
  });

  app.get("/api/auth/session", async (req: AuthRequest, res) => {
    try {
      const token = req.cookies?.token;
      if (!token) {
        return res.json({ user: null });
      }

      const decoded = jwt.verify(
        token,
        process.env.SESSION_SECRET || "your-secret-key-change-in-production"
      ) as { userId: string };

      const [user] = await db
        .select()
        .from(users)
        .where(eq(users.id, decoded.userId))
        .limit(1);

      if (!user) {
        res.clearCookie("token");
        return res.json({ user: null });
      }

      const { passwordHash: _, ...userWithoutPassword } = user;
      res.json({ user: userWithoutPassword });
    } catch (error) {
      console.error("Session error:", error);
      res.clearCookie("token");
      res.json({ user: null });
    }
  });

  // Block Routes (Admin only)
  app.get("/api/blocks", authenticateToken, async (req: AuthRequest, res) => {
    try {
      const allBlocks = await db.select().from(blocks);
      res.json(allBlocks);
    } catch (error: any) {
      res
        .status(500)
        .json({ message: error.message || "Failed to fetch blocks" });
    }
  });

  app.post(
    "/api/blocks",
    authenticateToken,
    requireRole("admin"),
    async (req: AuthRequest, res) => {
      try {
        const [newBlock] = await db.insert(blocks).values(req.body).returning();
        res.json(newBlock);
      } catch (error: any) {
        res
          .status(400)
          .json({ message: error.message || "Failed to create block" });
      }
    }
  );

  // Line Routes
  app.get("/api/lines", authenticateToken, async (req: AuthRequest, res) => {
    try {
      const { blockId } = req.query;

      let allLines;
      if (blockId) {
        allLines = await db.select().from(lines).where(eq(lines.blockId, blockId as string));
      } else {
        allLines = await db.select().from(lines);
      }

      res.json(allLines);
    } catch (error: any) {
      res
        .status(500)
        .json({ message: error.message || "Failed to fetch lines" });
    }
  });

  app.post(
    "/api/lines",
    authenticateToken,
    requireRole("admin"),
    async (req: AuthRequest, res) => {
      try {
        const [newLine] = await db.insert(lines).values(req.body).returning();
        res.json(newLine);
      } catch (error: any) {
        res
          .status(400)
          .json({ message: error.message || "Failed to create line" });
      }
    }
  );

  // User Routes (Admin only)
  app.get(
    "/api/users",
    authenticateToken,
    requireRole("admin"),
    async (req: AuthRequest, res) => {
      try {
        const allUsers = await db
          .select({
            id: users.id,
            email: users.email,
            role: users.role,
            blockId: users.blockId,
            lineId: users.lineId,
            createdAt: users.createdAt,
          })
          .from(users);
        res.json(allUsers);
      } catch (error: any) {
        res
          .status(500)
          .json({ message: error.message || "Failed to fetch users" });
      }
    }
  );

  // =======================================================
  // ESP32 DEVICE API ENDPOINTS
  // =======================================================

  // POST /api/device/data - Receive sensor readings from ESP32
  app.post("/api/device/data", async (req, res) => {
    try {
      const validatedData = deviceDataSchema.parse(req.body);
      
      // Verify device token
      const [device] = await db
        .select()
        .from(devices)
        .where(and(
          eq(devices.deviceToken, validatedData.device_token),
          eq(devices.blockId, validatedData.block_id)
        ))
        .limit(1);

      if (!device) {
        return res.status(401).json({ status: "error", message: "Invalid device token" });
      }

      // Update device last seen
      await db.update(devices)
        .set({ lastSeen: new Date(), status: "online" })
        .where(eq(devices.id, device.id));

      const energyToDeduct = validatedData.energy || 0;

      // Log the energy data
      await db.insert(energyLogs).values({
        lineId: validatedData.line_id,
        powerW: String(validatedData.power),
        voltageV: String(validatedData.voltage),
        currentA: String(validatedData.current),
        energyKwh: String(energyToDeduct),
      });

      // Update line's remaining quota and status
      const [updatedLine] = await db
        .update(lines)
        .set({
          remainingKwh: sql`GREATEST(${lines.remainingKwh} - ${energyToDeduct}, 0)`,
          status: sql`CASE WHEN ${lines.remainingKwh} - ${energyToDeduct} > 0 THEN 'active' ELSE 'disconnected' END`,
          lastUpdate: new Date(),
        })
        .where(eq(lines.id, validatedData.line_id))
        .returning();

      if (!updatedLine) {
        return res.status(404).json({ status: "error", message: "Line not found" });
      }

      // Check for alerts (low balance, overload)
      const remainingKwh = parseFloat(updatedLine.remainingKwh || "0");
      const currentQuotaKwh = parseFloat(updatedLine.currentQuotaKwh || "0");
      
      if (remainingKwh > 0 && remainingKwh <= currentQuotaKwh * 0.2) {
        await db.insert(alerts).values({
          lineId: validatedData.line_id,
          type: "low_balance",
          message: `Low balance warning: ${remainingKwh.toFixed(2)} kWh remaining (${((remainingKwh / currentQuotaKwh) * 100).toFixed(1)}%)`,
        });
      }

      res.json({
        status: "success",
        message: "Data received and logged",
        data: {
          remainingKwh: updatedLine.remainingKwh,
          status: updatedLine.status,
        }
      });
    } catch (error: any) {
      console.error("Device data error:", error);
      res.status(400).json({ status: "error", message: error.message || "Failed to process data" });
    }
  });

  // GET /api/device/control - ESP32 polls for control commands
  app.get("/api/device/control", async (req, res) => {
    try {
      const { block_id, line_id, device_token } = req.query;
      
      const validatedData = deviceControlQuerySchema.parse({
        block_id: block_id as string,
        line_id: line_id as string,
        device_token: device_token as string,
      });

      // Verify device
      const [device] = await db
        .select()
        .from(devices)
        .where(and(
          eq(devices.deviceToken, validatedData.device_token),
          eq(devices.blockId, validatedData.block_id)
        ))
        .limit(1);

      if (!device) {
        return res.status(401).json({ status: "error", message: "Invalid device" });
      }

      // Fetch line status and thresholds
      const [line] = await db
        .select()
        .from(lines)
        .where(eq(lines.id, validatedData.line_id))
        .limit(1);

      if (!line) {
        return res.status(404).json({ status: "error", message: "Line not found" });
      }

      // Check for pending commands
      const [pendingCommand] = await db
        .select()
        .from(controlQueue)
        .where(and(
          eq(controlQueue.lineId, validatedData.line_id),
          eq(controlQueue.status, "pending")
        ))
        .orderBy(desc(controlQueue.createdAt))
        .limit(1);

      let action = "none";
      if (pendingCommand) {
        action = pendingCommand.command;
        // Mark command as executed
        await db.update(controlQueue)
          .set({ status: "executed", executedAt: new Date() })
          .where(eq(controlQueue.id, pendingCommand.id));
      } else if (line.status === "disconnected") {
        action = "disconnect";
      }

      const thresholds = line.thresholds as { maxCurrent?: number; maxPower?: number; idleLimitHours?: number } || {};

      res.json({
        action,
        thresholds: {
          max_current: thresholds.maxCurrent || 30,
          max_power: thresholds.maxPower || 5000,
          idle_limit_hours: thresholds.idleLimitHours || 24,
        },
        message: action === "none" ? "No action required" : `Action to execute: ${action}`,
      });
    } catch (error: any) {
      console.error("Device control error:", error);
      res.status(400).json({ status: "error", message: error.message || "Failed to get control" });
    }
  });

  // POST /api/device/heartbeat - ESP32 heartbeat
  app.post("/api/device/heartbeat", async (req, res) => {
    try {
      const validatedData = deviceHeartbeatSchema.parse(req.body);

      // Verify and update device
      const [device] = await db
        .update(devices)
        .set({ lastSeen: new Date(), status: "online" })
        .where(and(
          eq(devices.deviceToken, validatedData.device_token),
          eq(devices.blockId, validatedData.block_id)
        ))
        .returning();

      if (!device) {
        return res.status(401).json({ status: "error", message: "Invalid device" });
      }

      res.json({
        status: "success",
        timestamp: new Date().toISOString(),
        message: "Heartbeat acknowledged",
      });
    } catch (error: any) {
      console.error("Heartbeat error:", error);
      res.status(400).json({ status: "error", message: error.message || "Heartbeat failed" });
    }
  });

  // POST /api/admin/control - Admin sends commands to devices
  app.post(
    "/api/admin/control",
    authenticateToken,
    requireRole("admin"),
    async (req: AuthRequest, res) => {
      try {
        const validatedData = adminControlSchema.parse(req.body);

        // Insert command into control queue
        const [command] = await db
          .insert(controlQueue)
          .values({
            lineId: validatedData.line_id,
            command: validatedData.command,
          })
          .returning();

        // Update line status if disconnect/reconnect
        if (validatedData.command === "disconnect") {
          await db.update(lines)
            .set({ status: "disconnected" })
            .where(eq(lines.id, validatedData.line_id));
        } else if (validatedData.command === "reconnect") {
          await db.update(lines)
            .set({ status: "active" })
            .where(eq(lines.id, validatedData.line_id));
        }

        res.json({
          status: "success",
          message: "Command registered and sent to device",
          commandId: command.id,
        });
      } catch (error: any) {
        console.error("Admin control error:", error);
        res.status(400).json({ status: "error", message: error.message || "Failed to send command" });
      }
    }
  );

  // =======================================================
  // DEVICE MANAGEMENT (Admin)
  // =======================================================
  
  app.get(
    "/api/devices",
    authenticateToken,
    requireRole("admin"),
    async (req: AuthRequest, res) => {
      try {
        const allDevices = await db.select().from(devices);
        res.json(allDevices);
      } catch (error: any) {
        res.status(500).json({ message: error.message || "Failed to fetch devices" });
      }
    }
  );

  app.post(
    "/api/devices",
    authenticateToken,
    requireRole("admin"),
    async (req: AuthRequest, res) => {
      try {
        // Generate a unique device token
        const deviceToken = `dev_${Date.now()}_${Math.random().toString(36).substring(2, 15)}`;
        
        const [newDevice] = await db
          .insert(devices)
          .values({
            ...req.body,
            deviceToken,
          })
          .returning();
        
        res.json(newDevice);
      } catch (error: any) {
        res.status(400).json({ message: error.message || "Failed to create device" });
      }
    }
  );

  // =======================================================
  // ALERTS MANAGEMENT
  // =======================================================

  app.get("/api/alerts", authenticateToken, async (req: AuthRequest, res) => {
    try {
      const { lineId, limit = 50 } = req.query;
      
      let allAlerts;
      if (lineId) {
        allAlerts = await db.select().from(alerts).where(eq(alerts.lineId, lineId as string)).orderBy(desc(alerts.createdAt)).limit(Number(limit));
      } else {
        allAlerts = await db.select().from(alerts).orderBy(desc(alerts.createdAt)).limit(Number(limit));
      }
      
      res.json(allAlerts);
    } catch (error: any) {
      res.status(500).json({ message: error.message || "Failed to fetch alerts" });
    }
  });

  // =======================================================
  // ENERGY LOGS & ANALYTICS
  // =======================================================

  app.get("/api/energy-logs", authenticateToken, async (req: AuthRequest, res) => {
    try {
      const { lineId, limit = 100 } = req.query;
      
      let logs;
      if (lineId) {
        logs = await db.select().from(energyLogs).where(eq(energyLogs.lineId, lineId as string)).orderBy(desc(energyLogs.timestamp)).limit(Number(limit));
      } else {
        logs = await db.select().from(energyLogs).orderBy(desc(energyLogs.timestamp)).limit(Number(limit));
      }
      
      res.json(logs);
    } catch (error: any) {
      res.status(500).json({ message: error.message || "Failed to fetch energy logs" });
    }
  });

  // Dashboard stats endpoint
  app.get(
    "/api/stats/dashboard",
    authenticateToken,
    async (req: AuthRequest, res) => {
      try {
        const [blocksCount] = await db.select({ count: sql<number>`count(*)::int` }).from(blocks);
        const [linesCount] = await db.select({ count: sql<number>`count(*)::int` }).from(lines);
        const [activeLinesCount] = await db
          .select({ count: sql<number>`count(*)::int` })
          .from(lines)
          .where(eq(lines.status, "active"));
        const [usersCount] = await db
          .select({ count: sql<number>`count(*)::int` })
          .from(users)
          .where(eq(users.role, "student"));
        const [alertsCount] = await db
          .select({ count: sql<number>`count(*)::int` })
          .from(alerts)
          .where(gte(alerts.createdAt, sql`NOW() - INTERVAL '24 hours'`));

        res.json({
          totalBlocks: blocksCount?.count || 0,
          totalLines: linesCount?.count || 0,
          activeLines: activeLinesCount?.count || 0,
          totalUsers: usersCount?.count || 0,
          activeAlerts: alertsCount?.count || 0,
        });
      } catch (error: any) {
        res.status(500).json({ message: error.message || "Failed to fetch stats" });
      }
    }
  );

  // =======================================================
  // PAYMENTS (Student)
  // =======================================================

  app.get("/api/payments", authenticateToken, async (req: AuthRequest, res) => {
    try {
      const user = req.user!;
      let query;
      
      if (user.role === "admin") {
        query = db.select().from(payments).orderBy(desc(payments.timestamp));
      } else {
        query = db.select().from(payments).where(eq(payments.userId, user.id)).orderBy(desc(payments.timestamp));
      }
      
      const allPayments = await query;
      res.json(allPayments);
    } catch (error: any) {
      res.status(500).json({ message: error.message || "Failed to fetch payments" });
    }
  });

  // Initialize payment (Paystack/Flutterwave integration point)
  app.post("/api/payments/initialize", authenticateToken, async (req: AuthRequest, res) => {
    try {
      const { amount, units } = req.body;
      const user = req.user!;

      if (!user.lineId) {
        return res.status(400).json({ message: "User not assigned to a line" });
      }

      // Generate payment reference
      const reference = `PAY_${Date.now()}_${Math.random().toString(36).substring(2, 9)}`;

      // Create pending payment record
      const [payment] = await db
        .insert(payments)
        .values({
          userId: user.id,
          amount: String(amount),
          unitsAddedKwh: String(units),
          status: "pending",
          reference,
        })
        .returning();

      // In production, integrate with Paystack/Flutterwave here
      // For now, return the reference for manual verification
      res.json({
        status: "success",
        reference,
        paymentId: payment.id,
        message: "Payment initialized. Complete payment via gateway.",
      });
    } catch (error: any) {
      res.status(400).json({ message: error.message || "Failed to initialize payment" });
    }
  });

  // Verify and complete payment
  app.post("/api/payments/verify", authenticateToken, async (req: AuthRequest, res) => {
    try {
      const { reference } = req.body;
      const user = req.user!;

      // Find the payment
      const [payment] = await db
        .select()
        .from(payments)
        .where(eq(payments.reference, reference))
        .limit(1);

      if (!payment) {
        return res.status(404).json({ message: "Payment not found" });
      }

      if (payment.status !== "pending") {
        return res.status(400).json({ message: "Payment already processed" });
      }

      // In production, verify with Paystack/Flutterwave here
      // For now, mark as completed and add units

      // Update payment status
      await db.update(payments)
        .set({ status: "completed" })
        .where(eq(payments.id, payment.id));

      // Add units to user's line
      if (user.lineId) {
        await db.update(lines)
          .set({
            remainingKwh: sql`${lines.remainingKwh} + ${parseFloat(payment.unitsAddedKwh)}`,
            status: "active",
          })
          .where(eq(lines.id, user.lineId));

        // Create top-up confirmation alert
        await db.insert(alerts).values({
          lineId: user.lineId,
          type: "top_up_confirmation",
          message: `Top-up successful: ${payment.unitsAddedKwh} kWh added`,
        });
      }

      res.json({
        status: "success",
        message: "Payment verified and units added",
        unitsAdded: payment.unitsAddedKwh,
      });
    } catch (error: any) {
      res.status(400).json({ message: error.message || "Failed to verify payment" });
    }
  });

  // =======================================================
  // AI PREDICTIONS
  // =======================================================

  app.get("/api/predictions/:lineId", authenticateToken, async (req: AuthRequest, res) => {
    try {
      const { lineId } = req.params;

      // Get line info
      const [line] = await db
        .select()
        .from(lines)
        .where(eq(lines.id, lineId))
        .limit(1);

      if (!line) {
        return res.status(404).json({ message: "Line not found" });
      }

      // Get recent energy logs for the line (last 7 days)
      const recentLogs = await db
        .select()
        .from(energyLogs)
        .where(and(
          eq(energyLogs.lineId, lineId),
          gte(energyLogs.timestamp, sql`NOW() - INTERVAL '7 days'`)
        ))
        .orderBy(desc(energyLogs.timestamp));

      // Calculate average daily usage
      const totalEnergy = recentLogs.reduce((sum, log) => sum + parseFloat(log.energyKwh), 0);
      const daysOfData = Math.max(1, Math.ceil(recentLogs.length > 0 ? 
        (Date.now() - new Date(recentLogs[recentLogs.length - 1].timestamp).getTime()) / (1000 * 60 * 60 * 24) : 1));
      
      const avgDailyUsage = totalEnergy / daysOfData;
      const remainingKwh = parseFloat(line.remainingKwh || "0");
      
      // Predict days left
      const predictedDaysLeft = avgDailyUsage > 0 ? Math.floor(remainingKwh / avgDailyUsage) : 999;
      
      // Calculate recommended daily usage to last 30 days
      const recommendedDailyUsage = remainingKwh / 30;

      // Save prediction
      const [prediction] = await db
        .insert(aiPredictions)
        .values({
          lineId,
          predictedDaysLeft,
          recommendedDailyUsageKwh: String(recommendedDailyUsage.toFixed(2)),
        })
        .returning();

      res.json({
        lineId,
        remainingKwh,
        avgDailyUsage: avgDailyUsage.toFixed(2),
        predictedDaysLeft,
        recommendedDailyUsage: recommendedDailyUsage.toFixed(2),
        prediction,
        tips: generateEnergyTips(avgDailyUsage, remainingKwh, predictedDaysLeft),
      });
    } catch (error: any) {
      res.status(500).json({ message: error.message || "Failed to generate prediction" });
    }
  });

  // Helper function to generate energy tips
  function generateEnergyTips(avgUsage: number, remaining: number, daysLeft: number): string[] {
    const tips: string[] = [];
    
    if (daysLeft < 7) {
      tips.push("⚠️ Critical: Consider topping up soon to avoid disconnection.");
    }
    
    if (avgUsage > 5) {
      tips.push("💡 Your usage is above average. Try turning off unused appliances.");
    }
    
    if (daysLeft < 14 && daysLeft >= 7) {
      tips.push("📊 Plan your top-up within the next week to maintain service.");
    }
    
    tips.push("🔌 Unplug devices when not in use to save energy.");
    tips.push("💡 Use LED bulbs instead of incandescent bulbs.");
    tips.push("❄️ Set AC temperature to 24-25°C for optimal efficiency.");
    
    return tips.slice(0, 4);
  }

  // =======================================================
  // LINE MANAGEMENT UPDATES
  // =======================================================

  // Update line quota
  app.patch(
    "/api/lines/:id",
    authenticateToken,
    requireRole("admin"),
    async (req: AuthRequest, res) => {
      try {
        const { id } = req.params;
        const updates = req.body;

        const [updatedLine] = await db
          .update(lines)
          .set(updates)
          .where(eq(lines.id, id))
          .returning();

        if (!updatedLine) {
          return res.status(404).json({ message: "Line not found" });
        }

        res.json(updatedLine);
      } catch (error: any) {
        res.status(400).json({ message: error.message || "Failed to update line" });
      }
    }
  );

  // Delete line
  app.delete(
    "/api/lines/:id",
    authenticateToken,
    requireRole("admin"),
    async (req: AuthRequest, res) => {
      try {
        const { id } = req.params;

        await db.delete(lines).where(eq(lines.id, id));

        res.json({ message: "Line deleted successfully" });
      } catch (error: any) {
        res.status(400).json({ message: error.message || "Failed to delete line" });
      }
    }
  );

  // Delete block
  app.delete(
    "/api/blocks/:id",
    authenticateToken,
    requireRole("admin"),
    async (req: AuthRequest, res) => {
      try {
        const { id } = req.params;

        // Delete all lines in the block first
        await db.delete(lines).where(eq(lines.blockId, id));
        await db.delete(blocks).where(eq(blocks.id, id));

        res.json({ message: "Block deleted successfully" });
      } catch (error: any) {
        res.status(400).json({ message: error.message || "Failed to delete block" });
      }
    }
  );

  // Get user's line info (for students)
  app.get("/api/my-line", authenticateToken, async (req: AuthRequest, res) => {
    try {
      const user = req.user!;

      if (!user.lineId) {
        return res.json({ line: null, block: null });
      }

      const [line] = await db
        .select()
        .from(lines)
        .where(eq(lines.id, user.lineId))
        .limit(1);

      if (!line) {
        return res.json({ line: null, block: null });
      }

      const [block] = await db
        .select()
        .from(blocks)
        .where(eq(blocks.id, line.blockId))
        .limit(1);

      res.json({ line, block });
    } catch (error: any) {
      res.status(500).json({ message: error.message || "Failed to fetch line info" });
    }
  });

  // Assign user to line (admin only)
  app.post(
    "/api/users/:userId/assign",
    authenticateToken,
    requireRole("admin"),
    async (req: AuthRequest, res) => {
      try {
        const { userId } = req.params;
        const { blockId, lineId } = req.body;

        const [updatedUser] = await db
          .update(users)
          .set({ blockId, lineId })
          .where(eq(users.id, userId))
          .returning({
            id: users.id,
            email: users.email,
            role: users.role,
            blockId: users.blockId,
            lineId: users.lineId,
          });

        if (!updatedUser) {
          return res.status(404).json({ message: "User not found" });
        }

        res.json(updatedUser);
      } catch (error: any) {
        res.status(400).json({ message: error.message || "Failed to assign user" });
      }
    }
  );

  const httpServer = createServer(app);

  return httpServer;
}
