import bcrypt from "bcryptjs";
import { storage } from "../storage";
import type { InsertUser } from "@shared/schema";

export async function hashPassword(password: string): Promise<string> {
  return bcrypt.hash(password, 10);
}

export async function comparePassword(password: string, hash: string): Promise<boolean> {
  return bcrypt.compare(password, hash);
}

export async function signup(userData: {
  username: string;
  email: string;
  password: string;
  postalCode?: string;
  location?: string;
  initialPreferences?: any;
}) {
  const existingUser = await storage.getUserByEmail(userData.email);
  if (existingUser) {
    throw new Error("User with this email already exists");
  }

  const existingUsername = await storage.getUserByUsername(userData.username);
  if (existingUsername) {
    throw new Error("Username already taken");
  }

  const hashedPassword = await hashPassword(userData.password);
  
  const user = await storage.createUser({
    username: userData.username,
    email: userData.email,
    password: hashedPassword,
    postalCode: userData.postalCode,
    location: userData.location,
    initialPreferences: userData.initialPreferences,
  });

  const { password, ...userWithoutPassword } = user;
  return userWithoutPassword;
}

export async function login(email: string, password: string) {
  const user = await storage.getUserByEmail(email);
  
  if (!user) {
    throw new Error("Invalid email or password");
  }

  const isValid = await comparePassword(password, user.password);
  
  if (!isValid) {
    throw new Error("Invalid email or password");
  }

  const { password: _, ...userWithoutPassword } = user;
  return userWithoutPassword;
}
