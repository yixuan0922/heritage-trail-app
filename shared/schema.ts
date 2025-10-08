import { sql } from "drizzle-orm";
import { pgTable, text, varchar, timestamp, real, integer, boolean, jsonb } from "drizzle-orm/pg-core";
import { relations } from "drizzle-orm";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod";

export const users = pgTable("users", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  username: text("username").notNull().unique(),
  password: text("password").notNull(),
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

export const trails = pgTable("trails", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  name: text("name").notNull(),
  description: text("description").notNull(),
  neighborhood: text("neighborhood").notNull(),
  totalWaypoints: integer("total_waypoints").notNull().default(0),
  estimatedDuration: integer("estimated_duration_minutes").notNull(),
  difficulty: text("difficulty").notNull().default("easy"),
  heroImage: text("hero_image"),
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().notNull(),
});

export const waypoints = pgTable("waypoints", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  trailId: varchar("trail_id").notNull().references(() => trails.id, { onDelete: "cascade" }),
  name: text("name").notNull(),
  description: text("description").notNull(),
  latitude: real("latitude").notNull(),
  longitude: real("longitude").notNull(),
  orderIndex: integer("order_index").notNull(),
  category: text("category").notNull(),
  heroImage: text("hero_image"),
  historicalImage: text("historical_image"),
  modernImage: text("modern_image"),
  nlbResources: jsonb("nlb_resources").default(sql`'[]'::jsonb`),
  audioClip: text("audio_clip"),
  isActive: boolean("is_active").default(true).notNull(),
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().notNull(),
});

export const userProgress = pgTable("user_progress", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  userId: varchar("user_id").notNull().references(() => users.id, { onDelete: "cascade" }),
  trailId: varchar("trail_id").notNull().references(() => trails.id, { onDelete: "cascade" }),
  completedWaypoints: jsonb("completed_waypoints").default(sql`'[]'::jsonb`),
  currentWaypointId: varchar("current_waypoint_id").references(() => waypoints.id),
  startedAt: timestamp("started_at").defaultNow().notNull(),
  completedAt: timestamp("completed_at"),
  lastVisitedAt: timestamp("last_visited_at").defaultNow().notNull(),
});

export const visitorPhotos = pgTable("visitor_photos", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  waypointId: varchar("waypoint_id").notNull().references(() => waypoints.id, { onDelete: "cascade" }),
  userId: varchar("user_id").references(() => users.id, { onDelete: "cascade" }),
  username: text("username").notNull(),
  imageUrl: text("image_url").notNull(),
  caption: text("caption"),
  isApproved: boolean("is_approved").default(false).notNull(),
  likes: integer("likes").default(0).notNull(),
  uploadedAt: timestamp("uploaded_at").defaultNow().notNull(),
});

// Relations
export const trailsRelations = relations(trails, ({ many }) => ({
  waypoints: many(waypoints),
  userProgress: many(userProgress),
}));

export const waypointsRelations = relations(waypoints, ({ one, many }) => ({
  trail: one(trails, {
    fields: [waypoints.trailId],
    references: [trails.id],
  }),
  visitorPhotos: many(visitorPhotos),
}));

export const userProgressRelations = relations(userProgress, ({ one }) => ({
  user: one(users, {
    fields: [userProgress.userId],
    references: [users.id],
  }),
  trail: one(trails, {
    fields: [userProgress.trailId],
    references: [trails.id],
  }),
  currentWaypoint: one(waypoints, {
    fields: [userProgress.currentWaypointId],
    references: [waypoints.id],
  }),
}));

export const visitorPhotosRelations = relations(visitorPhotos, ({ one }) => ({
  waypoint: one(waypoints, {
    fields: [visitorPhotos.waypointId],
    references: [waypoints.id],
  }),
  user: one(users, {
    fields: [visitorPhotos.userId],
    references: [users.id],
  }),
}));

// Insert schemas
export const insertUserSchema = createInsertSchema(users).omit({
  id: true,
  createdAt: true,
});

export const insertTrailSchema = createInsertSchema(trails).omit({
  id: true,
  createdAt: true,
  updatedAt: true,
});

export const insertWaypointSchema = createInsertSchema(waypoints).omit({
  id: true,
  createdAt: true,
  updatedAt: true,
});

export const insertUserProgressSchema = createInsertSchema(userProgress).omit({
  id: true,
  startedAt: true,
  lastVisitedAt: true,
});

export const insertVisitorPhotoSchema = createInsertSchema(visitorPhotos).omit({
  id: true,
  uploadedAt: true,
});

// Types
export type User = typeof users.$inferSelect;
export type InsertUser = z.infer<typeof insertUserSchema>;

export type Trail = typeof trails.$inferSelect;
export type InsertTrail = z.infer<typeof insertTrailSchema>;

export type Waypoint = typeof waypoints.$inferSelect;
export type InsertWaypoint = z.infer<typeof insertWaypointSchema>;

export type UserProgress = typeof userProgress.$inferSelect;
export type InsertUserProgress = z.infer<typeof insertUserProgressSchema>;

export type VisitorPhoto = typeof visitorPhotos.$inferSelect;
export type InsertVisitorPhoto = z.infer<typeof insertVisitorPhotoSchema>;
