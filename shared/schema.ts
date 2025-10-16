import { sql } from "drizzle-orm";
import { pgTable, text, varchar, timestamp, integer, decimal, pgEnum } from "drizzle-orm/pg-core";
import { createInsertSchema, createSelectSchema } from "drizzle-zod";
import { z } from "zod";

// Enums
export const roleEnum = pgEnum("role", ["admin", "student"]);
export const lineStatusEnum = pgEnum("line_status", ["active", "idle", "disconnected"]);
export const paymentStatusEnum = pgEnum("payment_status", ["pending", "completed", "failed"]);
export const alertTypeEnum = pgEnum("alert_type", ["low_balance", "idle_line", "overload", "disconnection", "top_up_confirmation"]);

// Users table
export const users = pgTable("users", {
  id: varchar("id", { length: 255 }).primaryKey().default(sql`gen_random_uuid()`),
  email: text("email").notNull().unique(),
  passwordHash: text("password_hash").notNull(),
  role: roleEnum("role").notNull().default("student"),
  blockId: varchar("block_id", { length: 255 }).references(() => blocks.id),
  lineId: varchar("line_id", { length: 255 }).references(() => lines.id),
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

// Blocks table
export const blocks = pgTable("blocks", {
  id: varchar("id", { length: 255 }).primaryKey().default(sql`gen_random_uuid()`),
  name: text("name").notNull().unique(),
  totalQuotaKwh: decimal("total_quota_kwh", { precision: 10, scale: 2 }).notNull().default("0"),
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

// Lines table
export const lines = pgTable("lines", {
  id: varchar("id", { length: 255 }).primaryKey().default(sql`gen_random_uuid()`),
  blockId: varchar("block_id", { length: 255 }).references(() => blocks.id).notNull(),
  lineNumber: integer("line_number").notNull(),
  currentQuotaKwh: decimal("current_quota_kwh", { precision: 10, scale: 2 }).notNull().default("0"),
  remainingKwh: decimal("remaining_kwh", { precision: 10, scale: 2 }).notNull().default("0"),
  status: lineStatusEnum("status").notNull().default("active"),
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

// Energy logs table
export const energyLogs = pgTable("energy_logs", {
  id: varchar("id", { length: 255 }).primaryKey().default(sql`gen_random_uuid()`),
  lineId: varchar("line_id", { length: 255 }).references(() => lines.id).notNull(),
  timestamp: timestamp("timestamp").defaultNow().notNull(),
  powerW: decimal("power_w", { precision: 10, scale: 2 }).notNull(),
  voltageV: decimal("voltage_v", { precision: 10, scale: 2 }).notNull(),
  currentA: decimal("current_a", { precision: 10, scale: 2 }).notNull(),
  energyKwh: decimal("energy_kwh", { precision: 10, scale: 4 }).notNull(),
});

// Payments table
export const payments = pgTable("payments", {
  id: varchar("id", { length: 255 }).primaryKey().default(sql`gen_random_uuid()`),
  userId: varchar("user_id", { length: 255 }).references(() => users.id).notNull(),
  amount: decimal("amount", { precision: 10, scale: 2 }).notNull(),
  unitsAddedKwh: decimal("units_added_kwh", { precision: 10, scale: 2 }).notNull(),
  status: paymentStatusEnum("status").notNull().default("pending"),
  reference: text("reference").notNull().unique(),
  timestamp: timestamp("timestamp").defaultNow().notNull(),
});

// Alerts table
export const alerts = pgTable("alerts", {
  id: varchar("id", { length: 255 }).primaryKey().default(sql`gen_random_uuid()`),
  lineId: varchar("line_id", { length: 255 }).references(() => lines.id).notNull(),
  type: alertTypeEnum("type").notNull(),
  message: text("message").notNull(),
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

// AI Predictions table
export const aiPredictions = pgTable("ai_predictions", {
  id: varchar("id", { length: 255 }).primaryKey().default(sql`gen_random_uuid()`),
  lineId: varchar("line_id", { length: 255 }).references(() => lines.id).notNull(),
  predictedDaysLeft: integer("predicted_days_left").notNull(),
  recommendedDailyUsageKwh: decimal("recommended_daily_usage_kwh", { precision: 10, scale: 2 }).notNull(),
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

// Insert schemas
export const insertUserSchema = createInsertSchema(users, {
  email: z.string().email("Invalid email address"),
  passwordHash: z.string().min(8, "Password must be at least 8 characters"),
}).omit({ id: true, createdAt: true });

export const insertBlockSchema = createInsertSchema(blocks, {
  name: z.string().min(1, "Block name is required"),
  totalQuotaKwh: z.string().regex(/^\d+\.?\d*$/, "Must be a valid number"),
}).omit({ id: true, createdAt: true });

export const insertLineSchema = createInsertSchema(lines, {
  lineNumber: z.number().int().positive("Line number must be positive"),
  currentQuotaKwh: z.string().regex(/^\d+\.?\d*$/, "Must be a valid number"),
  remainingKwh: z.string().regex(/^\d+\.?\d*$/, "Must be a valid number"),
}).omit({ id: true, createdAt: true });

export const insertEnergyLogSchema = createInsertSchema(energyLogs, {
  powerW: z.string().regex(/^\d+\.?\d*$/, "Must be a valid number"),
  voltageV: z.string().regex(/^\d+\.?\d*$/, "Must be a valid number"),
  currentA: z.string().regex(/^\d+\.?\d*$/, "Must be a valid number"),
  energyKwh: z.string().regex(/^\d+\.?\d*$/, "Must be a valid number"),
}).omit({ id: true, timestamp: true });

export const insertPaymentSchema = createInsertSchema(payments, {
  amount: z.string().regex(/^\d+\.?\d*$/, "Must be a valid number"),
  unitsAddedKwh: z.string().regex(/^\d+\.?\d*$/, "Must be a valid number"),
}).omit({ id: true, timestamp: true });

export const insertAlertSchema = createInsertSchema(alerts).omit({ id: true, createdAt: true });

export const insertAiPredictionSchema = createInsertSchema(aiPredictions, {
  predictedDaysLeft: z.number().int().nonnegative(),
  recommendedDailyUsageKwh: z.string().regex(/^\d+\.?\d*$/, "Must be a valid number"),
}).omit({ id: true, createdAt: true });

// Login/Register schemas
export const loginSchema = z.object({
  email: z.string().email("Invalid email address"),
  password: z.string().min(1, "Password is required"),
});

export const registerSchema = z.object({
  email: z.string().email("Invalid email address"),
  password: z.string().min(8, "Password must be at least 8 characters"),
  confirmPassword: z.string().min(1, "Please confirm your password"),
  role: z.enum(["admin", "student"]).default("student"),
}).refine((data) => data.password === data.confirmPassword, {
  message: "Passwords do not match",
  path: ["confirmPassword"],
});

// Select types
export type User = typeof users.$inferSelect;
export type Block = typeof blocks.$inferSelect;
export type Line = typeof lines.$inferSelect;
export type EnergyLog = typeof energyLogs.$inferSelect;
export type Payment = typeof payments.$inferSelect;
export type Alert = typeof alerts.$inferSelect;
export type AiPrediction = typeof aiPredictions.$inferSelect;

// Insert types
export type InsertUser = z.infer<typeof insertUserSchema>;
export type InsertBlock = z.infer<typeof insertBlockSchema>;
export type InsertLine = z.infer<typeof insertLineSchema>;
export type InsertEnergyLog = z.infer<typeof insertEnergyLogSchema>;
export type InsertPayment = z.infer<typeof insertPaymentSchema>;
export type InsertAlert = z.infer<typeof insertAlertSchema>;
export type InsertAiPrediction = z.infer<typeof insertAiPredictionSchema>;
export type LoginInput = z.infer<typeof loginSchema>;
export type RegisterInput = z.infer<typeof registerSchema>;
