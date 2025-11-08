import { sql } from "drizzle-orm";
import { pgTable, text, varchar, timestamp, real, integer, boolean, jsonb } from "drizzle-orm/pg-core";
import { relations } from "drizzle-orm";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod";

export const users = pgTable("users", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  username: text("username").notNull().unique(),
  password: text("password").notNull(),
  email: text("email").unique(),
  role: text("role").notNull().default("user"), // 'user' or 'admin'
  currentLatitude: real("current_latitude"),
  currentLongitude: real("current_longitude"),
  currentCampaignId: varchar("current_campaign_id"),
  lastLocationUpdate: timestamp("last_location_update"),
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

// Game Mode Tables
export const campaigns = pgTable("campaigns", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  name: text("name").notNull(),
  description: text("description").notNull(),
  createdBy: varchar("created_by").notNull().references(() => users.id, { onDelete: "cascade" }),
  isActive: boolean("is_active").default(true).notNull(),
  difficulty: text("difficulty").notNull().default("medium"), // easy, medium, hard
  estimatedDuration: integer("estimated_duration_minutes"),
  heroImage: text("hero_image"),
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().notNull(),
});

export const routes = pgTable("routes", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  campaignId: varchar("campaign_id").notNull().references(() => campaigns.id, { onDelete: "cascade" }),
  name: text("name").notNull(),
  description: text("description"),
  startingHint: text("starting_hint"), // Hint from starting point to first marker
  orderIndex: integer("order_index").notNull(), // Order of routes within a campaign
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().notNull(),
});

// Campaign-specific markers that are deleted when campaign is deleted
export const campaignMarkers = pgTable("campaign_markers", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  campaignId: varchar("campaign_id").notNull().references(() => campaigns.id, { onDelete: "cascade" }),
  name: text("name").notNull(),
  description: text("description").notNull(),
  latitude: real("latitude").notNull(),
  longitude: real("longitude").notNull(),
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

export const routeMarkers = pgTable("route_markers", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  routeId: varchar("route_id").notNull().references(() => routes.id, { onDelete: "cascade" }),
  waypointId: varchar("waypoint_id").references(() => waypoints.id, { onDelete: "cascade" }), // Optional: for general waypoints
  campaignMarkerId: varchar("campaign_marker_id").references(() => campaignMarkers.id, { onDelete: "cascade" }), // Optional: for campaign-specific markers
  orderIndex: integer("order_index").notNull(), // Sequence within the route
  hintToNext: text("hint_to_next"), // Hint given after completing this marker's questions
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

export const questions = pgTable("questions", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  routeMarkerId: varchar("route_marker_id").notNull().references(() => routeMarkers.id, { onDelete: "cascade" }),
  questionText: text("question_text").notNull(),
  questionType: text("question_type").notNull().default("multiple_choice"), // multiple_choice, true_false, text_input
  options: jsonb("options").default(sql`'[]'::jsonb`), // Array of answer options for multiple choice
  correctAnswer: text("correct_answer").notNull(),
  orderIndex: integer("order_index").notNull(), // Order of questions at this marker
  points: integer("points").default(10).notNull(),
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().notNull(),
});

export const campaignProgress = pgTable("campaign_progress", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  userId: varchar("user_id").notNull().references(() => users.id, { onDelete: "cascade" }),
  campaignId: varchar("campaign_id").notNull().references(() => campaigns.id, { onDelete: "cascade" }),
  currentRouteId: varchar("current_route_id").references(() => routes.id),
  currentMarkerIndex: integer("current_marker_index").default(0).notNull(),
  completedRoutes: jsonb("completed_routes").default(sql`'[]'::jsonb`), // Array of route IDs
  completedMarkerIds: jsonb("completed_marker_ids").default(sql`'[]'::jsonb`), // Array of completed marker IDs
  totalScore: integer("total_score").default(0).notNull(),
  isCompleted: boolean("is_completed").default(false).notNull(),
  verificationCode: varchar("verification_code", { length: 8 }).unique(), // Short code for easy verification
  pointsCollected: boolean("points_collected").default(false).notNull(),
  collectedBy: varchar("collected_by").references(() => users.id), // Admin who verified collection
  collectedAt: timestamp("collected_at"),
  startedAt: timestamp("started_at").defaultNow().notNull(),
  completedAt: timestamp("completed_at"),
  lastActivityAt: timestamp("last_activity_at").defaultNow().notNull(),
});

export const questionAttempts = pgTable("question_attempts", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  userId: varchar("user_id").notNull().references(() => users.id, { onDelete: "cascade" }),
  questionId: varchar("question_id").notNull().references(() => questions.id, { onDelete: "cascade" }),
  campaignProgressId: varchar("campaign_progress_id").notNull().references(() => campaignProgress.id, { onDelete: "cascade" }),
  userAnswer: text("user_answer").notNull(),
  isCorrect: boolean("is_correct").notNull(),
  pointsEarned: integer("points_earned").default(0).notNull(),
  attemptedAt: timestamp("attempted_at").defaultNow().notNull(),
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

export const campaignsRelations = relations(campaigns, ({ one, many }) => ({
  creator: one(users, {
    fields: [campaigns.createdBy],
    references: [users.id],
  }),
  routes: many(routes),
  campaignMarkers: many(campaignMarkers),
  campaignProgress: many(campaignProgress),
}));

export const routesRelations = relations(routes, ({ one, many }) => ({
  campaign: one(campaigns, {
    fields: [routes.campaignId],
    references: [campaigns.id],
  }),
  routeMarkers: many(routeMarkers),
}));

export const campaignMarkersRelations = relations(campaignMarkers, ({ one, many }) => ({
  campaign: one(campaigns, {
    fields: [campaignMarkers.campaignId],
    references: [campaigns.id],
  }),
  routeMarkers: many(routeMarkers),
}));

export const routeMarkersRelations = relations(routeMarkers, ({ one, many }) => ({
  route: one(routes, {
    fields: [routeMarkers.routeId],
    references: [routes.id],
  }),
  waypoint: one(waypoints, {
    fields: [routeMarkers.waypointId],
    references: [waypoints.id],
  }),
  campaignMarker: one(campaignMarkers, {
    fields: [routeMarkers.campaignMarkerId],
    references: [campaignMarkers.id],
  }),
  questions: many(questions),
}));

export const questionsRelations = relations(questions, ({ one, many }) => ({
  routeMarker: one(routeMarkers, {
    fields: [questions.routeMarkerId],
    references: [routeMarkers.id],
  }),
  attempts: many(questionAttempts),
}));

export const campaignProgressRelations = relations(campaignProgress, ({ one, many }) => ({
  user: one(users, {
    fields: [campaignProgress.userId],
    references: [users.id],
  }),
  campaign: one(campaigns, {
    fields: [campaignProgress.campaignId],
    references: [campaigns.id],
  }),
  currentRoute: one(routes, {
    fields: [campaignProgress.currentRouteId],
    references: [routes.id],
  }),
  questionAttempts: many(questionAttempts),
}));

export const questionAttemptsRelations = relations(questionAttempts, ({ one }) => ({
  user: one(users, {
    fields: [questionAttempts.userId],
    references: [users.id],
  }),
  question: one(questions, {
    fields: [questionAttempts.questionId],
    references: [questions.id],
  }),
  campaignProgress: one(campaignProgress, {
    fields: [questionAttempts.campaignProgressId],
    references: [campaignProgress.id],
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

export const insertCampaignSchema = createInsertSchema(campaigns).omit({
  id: true,
  createdAt: true,
  updatedAt: true,
});

export const insertRouteSchema = createInsertSchema(routes).omit({
  id: true,
  createdAt: true,
  updatedAt: true,
});

export const insertCampaignMarkerSchema = createInsertSchema(campaignMarkers).omit({
  id: true,
  createdAt: true,
  updatedAt: true,
});

export const insertRouteMarkerSchema = createInsertSchema(routeMarkers).omit({
  id: true,
  createdAt: true,
});

export const insertQuestionSchema = createInsertSchema(questions).omit({
  id: true,
  createdAt: true,
  updatedAt: true,
});

export const insertCampaignProgressSchema = createInsertSchema(campaignProgress).omit({
  id: true,
  startedAt: true,
  lastActivityAt: true,
});

export const insertQuestionAttemptSchema = createInsertSchema(questionAttempts).omit({
  id: true,
  attemptedAt: true,
}).extend({
  isCorrect: z.boolean().optional(),
  pointsEarned: z.number().optional(),
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

export type Campaign = typeof campaigns.$inferSelect;
export type InsertCampaign = z.infer<typeof insertCampaignSchema>;

export type Route = typeof routes.$inferSelect;
export type InsertRoute = z.infer<typeof insertRouteSchema>;

export type CampaignMarker = typeof campaignMarkers.$inferSelect;
export type InsertCampaignMarker = z.infer<typeof insertCampaignMarkerSchema>;

export type RouteMarker = typeof routeMarkers.$inferSelect;
export type InsertRouteMarker = z.infer<typeof insertRouteMarkerSchema>;

export type Question = typeof questions.$inferSelect;
export type InsertQuestion = z.infer<typeof insertQuestionSchema>;

export type CampaignProgress = typeof campaignProgress.$inferSelect;
export type InsertCampaignProgress = z.infer<typeof insertCampaignProgressSchema>;

export type QuestionAttempt = typeof questionAttempts.$inferSelect;
export type InsertQuestionAttempt = z.infer<typeof insertQuestionAttemptSchema>;
