import { pgTable, text, serial, integer, timestamp, jsonb, vector, boolean, real } from "drizzle-orm/pg-core";
import { relations } from "drizzle-orm";
import { createInsertSchema, createSelectSchema } from "drizzle-zod";
import { z } from "zod";

export const users = pgTable("users", {
  id: serial("id").primaryKey(),
  username: text("username").unique().notNull(),
  email: text("email").unique().notNull(),
  password: text("password").notNull(),
  postalCode: text("postal_code"),
  location: text("location"),
  initialPreferences: jsonb("initial_preferences").$type<{
    carTypes?: string[];
    brands?: string[];
    priceRange?: { min?: number; max?: number };
    fuelType?: string;
  }>(),
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

export const usersRelations = relations(users, ({ many }) => ({
  searches: many(searches),
  preferences: many(userPreferences),
}));

export const cars = pgTable("cars", {
  id: serial("id").primaryKey(),
  sourceUrl: text("source_url").notNull(),
  source: text("source").notNull(),
  brand: text("brand").notNull(),
  model: text("model").notNull(),
  year: integer("year").notNull(),
  price: text("price").notNull(),
  priceNumeric: integer("price_numeric"),
  mileage: text("mileage"),
  mileageNumeric: integer("mileage_numeric"),
  location: text("location"),
  dealership: text("dealership"),
  type: text("type"),
  fuelType: text("fuel_type"),
  transmission: text("transmission"),
  exteriorColor: text("exterior_color"),
  interiorColor: text("interior_color"),
  specs: jsonb("specs").$type<{
    acceleration?: string;
    topSpeed?: string;
    power?: string;
    engineSize?: string;
    mpg?: string;
  }>(),
  features: text("features").array(),
  description: text("description"),
  images: text("images").array(),
  embedding: vector("embedding", { dimensions: 1536 }),
  scrapedAt: timestamp("scraped_at").defaultNow().notNull(),
  isActive: boolean("is_active").default(true).notNull(),
});

export const carsRelations = relations(cars, ({ many }) => ({
  searchResults: many(searchResults),
}));

export const searches = pgTable("searches", {
  id: serial("id").primaryKey(),
  userId: integer("user_id").references(() => users.id),
  query: text("query").notNull(),
  embedding: vector("embedding", { dimensions: 1536 }),
  filters: jsonb("filters").$type<{
    maxPrice?: number;
    minPrice?: number;
    brand?: string;
    type?: string;
    year?: number;
    fuelType?: string;
  }>(),
  resultsCount: integer("results_count").default(0),
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

export const searchesRelations = relations(searches, ({ one, many }) => ({
  user: one(users, {
    fields: [searches.userId],
    references: [users.id],
  }),
  results: many(searchResults),
}));

export const searchResults = pgTable("search_results", {
  id: serial("id").primaryKey(),
  searchId: integer("search_id").references(() => searches.id).notNull(),
  carId: integer("car_id").references(() => cars.id).notNull(),
  matchScore: real("match_score").notNull(),
  rank: integer("rank").notNull(),
});

export const searchResultsRelations = relations(searchResults, ({ one }) => ({
  search: one(searches, {
    fields: [searchResults.searchId],
    references: [searches.id],
  }),
  car: one(cars, {
    fields: [searchResults.carId],
    references: [cars.id],
  }),
}));

export const userPreferences = pgTable("user_preferences", {
  id: serial("id").primaryKey(),
  userId: integer("user_id").references(() => users.id).notNull(),
  preferredBrands: text("preferred_brands").array(),
  preferredTypes: text("preferred_types").array(),
  priceRangeMin: integer("price_range_min"),
  priceRangeMax: integer("price_range_max"),
  preferredFeatures: text("preferred_features").array(),
  embedding: vector("embedding", { dimensions: 1536 }),
  updatedAt: timestamp("updated_at").defaultNow().notNull(),
});

export const userPreferencesRelations = relations(userPreferences, ({ one }) => ({
  user: one(users, {
    fields: [userPreferences.userId],
    references: [users.id],
  }),
}));

export const insertUserSchema = createInsertSchema(users).omit({ id: true, createdAt: true });
export const selectUserSchema = createSelectSchema(users);
export const insertCarSchema = createInsertSchema(cars).omit({ id: true, scrapedAt: true });
export const selectCarSchema = createSelectSchema(cars);
export const insertSearchSchema = createInsertSchema(searches).omit({ id: true, createdAt: true, resultsCount: true });
export const selectSearchSchema = createSelectSchema(searches);
export const insertUserPreferencesSchema = createInsertSchema(userPreferences).omit({ id: true, updatedAt: true });
export const selectUserPreferencesSchema = createSelectSchema(userPreferences);

export type User = typeof users.$inferSelect;
export type InsertUser = z.infer<typeof insertUserSchema>;
export type Car = typeof cars.$inferSelect;
export type InsertCar = z.infer<typeof insertCarSchema>;
export type Search = typeof searches.$inferSelect;
export type InsertSearch = z.infer<typeof insertSearchSchema>;
export type SearchResult = typeof searchResults.$inferSelect;
export type UserPreferences = typeof userPreferences.$inferSelect;
export type InsertUserPreferences = z.infer<typeof insertUserPreferencesSchema>;
