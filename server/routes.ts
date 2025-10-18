import type { Express } from "express";
import { createServer, type Server } from "http";
import bcrypt from "bcryptjs";
import jwt from "jsonwebtoken";
import { eq, sql } from "drizzle-orm"; // <-- ADDED 'sql'
import { db } from "./db";
import { users, blocks, lines, energyLogs } from "@shared/schema"; // <-- ADDED 'energyLogs'
import {
  authenticateToken,
  requireRole,
  generateToken,
  type AuthRequest,
} from "./middleware/auth";
import { loginSchema, registerSchema } from "@shared/schema";

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

      let query = db.select().from(lines);

      if (blockId) {
        query = query.where(eq(lines.blockId, blockId as string));
      }

      const allLines = await query;
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
  // NEW ESP32 IOT ENDPOINT
  // =======================================================
  app.post("/api/iot/log", async (req, res) => {
    try {
      // In a real-world app, you'd also send a unique secret or API key.
      // For now, we trust the lineId.
      const { lineId, powerW, voltageV, currentA, energyKwh } = req.body;

      if (!lineId) {
        return res.status(400).json({ message: "lineId is required" });
      }

      const energyToDeduct = parseFloat(energyKwh) || 0;

      // 1. Log the energy data to the energy_logs table
      await db.insert(energyLogs).values({
        lineId: lineId,
        powerW: String(powerW),
        voltageV: String(voltageV),
        currentA: String(currentA),
        energyKwh: String(energyToDeduct),
      });

      // 2. Atomically update the line's remaining quota and status
      const [updatedLine] = await db
        .update(lines)
        .set({
          remainingKwh: sql`${lines.remainingKwh} - ${energyToDeduct}`,
          // Set status to 'disconnected' if quota will be 0 or less
          status: sql`CASE WHEN ${lines.remainingKwh} - ${energyToDeduct} > 0 THEN 'active' ELSE 'disconnected' END`,
        })
        .where(eq(lines.id, lineId))
        .returning({
          remainingKwh: lines.remainingKwh,
          status: lines.status,
        });

      if (!updatedLine) {
        return res.status(404).json({ message: "Line not found" });
      }

      // 3. Return the new authoritative state to the ESP32
      res.json({
        remainingKwh: updatedLine.remainingKwh, // This is a string, e.g., "12.34"
        status: updatedLine.status, // "active" or "disconnected"
      });
    } catch (error: any) {
      console.error("IoT Log Error:", error);
      res.status(500).json({ message: error.message || "Failed to log data" });
    }
  });

  const httpServer = createServer(app);

  return httpServer;
}
