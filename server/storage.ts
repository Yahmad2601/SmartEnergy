import { eq } from "drizzle-orm";
import { db } from "./db";
import { 
  users, 
  blocks, 
  lines, 
  energyLogs,
  payments,
  alerts,
  aiPredictions,
  type User,
  type Block,
  type Line,
  type InsertUser,
  type InsertBlock,
  type InsertLine
} from "@shared/schema";

export interface IStorage {
  // User operations
  getUser(id: string): Promise<User | undefined>;
  getUserByEmail(email: string): Promise<User | undefined>;
  createUser(user: InsertUser): Promise<User>;
  
  // Block operations
  getAllBlocks(): Promise<Block[]>;
  getBlock(id: string): Promise<Block | undefined>;
  createBlock(block: InsertBlock): Promise<Block>;
  
  // Line operations
  getLinesByBlock(blockId: string): Promise<Line[]>;
  getLine(id: string): Promise<Line | undefined>;
  createLine(line: InsertLine): Promise<Line>;
}

export class DatabaseStorage implements IStorage {
  // User operations
  async getUser(id: string): Promise<User | undefined> {
    const [user] = await db.select().from(users).where(eq(users.id, id)).limit(1);
    return user;
  }

  async getUserByEmail(email: string): Promise<User | undefined> {
    const [user] = await db.select().from(users).where(eq(users.email, email)).limit(1);
    return user;
  }

  async createUser(insertUser: InsertUser): Promise<User> {
    const [user] = await db.insert(users).values(insertUser).returning();
    return user;
  }

  // Block operations
  async getAllBlocks(): Promise<Block[]> {
    return await db.select().from(blocks);
  }

  async getBlock(id: string): Promise<Block | undefined> {
    const [block] = await db.select().from(blocks).where(eq(blocks.id, id)).limit(1);
    return block;
  }

  async createBlock(insertBlock: InsertBlock): Promise<Block> {
    const [block] = await db.insert(blocks).values(insertBlock).returning();
    return block;
  }

  // Line operations
  async getLinesByBlock(blockId: string): Promise<Line[]> {
    return await db.select().from(lines).where(eq(lines.blockId, blockId));
  }

  async getLine(id: string): Promise<Line | undefined> {
    const [line] = await db.select().from(lines).where(eq(lines.id, id)).limit(1);
    return line;
  }

  async createLine(insertLine: InsertLine): Promise<Line> {
    const [line] = await db.insert(lines).values(insertLine).returning();
    return line;
  }
}

export const storage = new DatabaseStorage();
