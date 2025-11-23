import {
  users,
  cars,
  searches,
  searchResults,
  userPreferences,
  type User,
  type InsertUser,
  type Car,
  type InsertCar,
  type Search,
  type InsertSearch,
  type SearchResult,
  type UserPreferences,
  type InsertUserPreferences,
} from "@shared/schema";
import { db } from "./db";
import { eq, and, sql, desc, inArray } from "drizzle-orm";

export interface IStorage {
  getUser(id: number): Promise<User | undefined>;
  getUserByUsername(username: string): Promise<User | undefined>;
  getUserByEmail(email: string): Promise<User | undefined>;
  createUser(insertUser: InsertUser): Promise<User>;
  
  createCar(insertCar: InsertCar): Promise<Car>;
  getCarById(id: number): Promise<Car | undefined>;
  findSimilarCars(embedding: number[], limit: number): Promise<Car[]>;
  findCarsByLocation(location: string, limit: number): Promise<Car[]>;
  updateCarActive(id: number, isActive: boolean): Promise<void>;
  
  createSearch(insertSearch: InsertSearch): Promise<Search>;
  getUserSearches(userId: number, limit?: number): Promise<Search[]>;
  createSearchResult(searchId: number, carId: number, matchScore: number, rank: number): Promise<SearchResult>;
  getSearchResults(searchId: number): Promise<(SearchResult & { car: Car })[]>;
  
  getUserPreferences(userId: number): Promise<UserPreferences | undefined>;
  upsertUserPreferences(prefs: InsertUserPreferences): Promise<UserPreferences>;
  updateUserPreferencesEmbedding(userId: number, embedding: number[]): Promise<void>;
}

export class DatabaseStorage implements IStorage {
  async getUser(id: number): Promise<User | undefined> {
    const [user] = await db.select().from(users).where(eq(users.id, id));
    return user || undefined;
  }

  async getUserByUsername(username: string): Promise<User | undefined> {
    const [user] = await db.select().from(users).where(eq(users.username, username));
    return user || undefined;
  }

  async getUserByEmail(email: string): Promise<User | undefined> {
    const [user] = await db.select().from(users).where(eq(users.email, email));
    return user || undefined;
  }

  async createUser(insertUser: InsertUser): Promise<User> {
    const [user] = await db.insert(users).values(insertUser).returning();
    return user;
  }

  async createCar(insertCar: InsertCar): Promise<Car> {
    const carData = {
      ...insertCar,
      specs: insertCar.specs ? insertCar.specs : undefined,
    };
    const [car] = await db.insert(cars).values([carData as any]).returning();
    return car;
  }

  async getCarById(id: number): Promise<Car | undefined> {
    const [car] = await db.select().from(cars).where(eq(cars.id, id));
    return car || undefined;
  }

  async findSimilarCars(embedding: number[], limit: number = 10): Promise<Car[]> {
    const embeddingStr = `[${embedding.join(",")}]`;
    const result = await db.execute(sql`
      SELECT *
      FROM ${cars}
      WHERE is_active = true AND embedding IS NOT NULL
      ORDER BY embedding <-> ${embeddingStr}::vector
      LIMIT ${limit}
    `);
    return result.rows as Car[];
  }

  async findCarsByLocation(location: string, limit: number = 10): Promise<Car[]> {
    return await db
      .select()
      .from(cars)
      .where(and(eq(cars.isActive, true), sql`${cars.location} ILIKE ${`%${location}%`}`))
      .limit(limit);
  }

  async updateCarActive(id: number, isActive: boolean): Promise<void> {
    await db.update(cars).set({ isActive }).where(eq(cars.id, id));
  }

  async createSearch(insertSearch: InsertSearch): Promise<Search> {
    const searchData = {
      ...insertSearch,
      filters: insertSearch.filters ? insertSearch.filters : undefined,
    };
    const [search] = await db.insert(searches).values([searchData as any]).returning();
    return search;
  }

  async getUserSearches(userId: number, limit: number = 20): Promise<Search[]> {
    return await db
      .select()
      .from(searches)
      .where(eq(searches.userId, userId))
      .orderBy(desc(searches.createdAt))
      .limit(limit);
  }

  async createSearchResult(
    searchId: number,
    carId: number,
    matchScore: number,
    rank: number
  ): Promise<SearchResult> {
    const [result] = await db
      .insert(searchResults)
      .values({ searchId, carId, matchScore, rank })
      .returning();
    return result;
  }

  async getSearchResults(searchId: number): Promise<(SearchResult & { car: Car })[]> {
    const results = await db
      .select()
      .from(searchResults)
      .innerJoin(cars, eq(searchResults.carId, cars.id))
      .where(eq(searchResults.searchId, searchId))
      .orderBy(searchResults.rank);

    return results.map((row) => ({
      ...row.search_results,
      car: row.cars,
    }));
  }

  async getUserPreferences(userId: number): Promise<UserPreferences | undefined> {
    const [prefs] = await db
      .select()
      .from(userPreferences)
      .where(eq(userPreferences.userId, userId));
    return prefs || undefined;
  }

  async upsertUserPreferences(prefs: InsertUserPreferences): Promise<UserPreferences> {
    const existing = await this.getUserPreferences(prefs.userId);
    
    if (existing) {
      const [updated] = await db
        .update(userPreferences)
        .set({ ...prefs, updatedAt: new Date() })
        .where(eq(userPreferences.userId, prefs.userId))
        .returning();
      return updated;
    } else {
      const [created] = await db.insert(userPreferences).values(prefs).returning();
      return created;
    }
  }

  async updateUserPreferencesEmbedding(userId: number, embedding: number[]): Promise<void> {
    const embeddingStr = `[${embedding.join(",")}]`;
    await db.execute(sql`
      UPDATE ${userPreferences}
      SET embedding = ${embeddingStr}::vector, updated_at = NOW()
      WHERE user_id = ${userId}
    `);
  }
}

export const storage = new DatabaseStorage();
