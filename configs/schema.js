import {
  boolean,
  integer,
  json,
  pgTable,
  serial,
  text,
  varchar,
  timestamp,
} from "drizzle-orm/pg-core";

export const USER_TABLE = pgTable("users", {
  id: varchar("id", { length: 256 }).primaryKey(),
  name: varchar().notNull(),
  email: varchar().notNull(),
  isMember: boolean().default(false),
  customerId: varchar(),
  // User stats fields
  streak: integer().default(0),
  studyTime: integer().default(0), // in hours
  completedCourses: integer().default(0),
  progress: integer().default(0), // overall progress percentage
  lastStudyDate: timestamp(),
  currentGoal: json(), // { title: string, progress: number }
  preferences: json(), // user learning preferences
  // Daily course limit tracking
  dailyCoursesCreated: integer().default(0), // courses created today
  lastCourseDate: timestamp(), // last course creation date
  // Learner level system fields (deprecated but kept for compatibility)
  experiencePoints: integer().default(0), // total XP earned
  learnerLevel: integer().default(1), // 1 = New, 2 = Intermediate, 3 = Advanced
  levelProgress: integer().default(0), // progress towards next level (0-100)
  lastLevelUpdate: timestamp(), // when level was last calculated
});

export const STUDY_MATERIAL_TABLE = pgTable("studyMaterial", {
  id: varchar("id", { length: 256 }).primaryKey(),
  courseId: varchar().notNull(),
  courseType: varchar().notNull(),
  topic: varchar().notNull(),
  difficultyLevel: varchar().default("Easy"),
  courseLayout: json(),
  createdBy: varchar().notNull(),
  status: varchar().default("Generating"),
});

export const CHAPTER_NOTES_TABLE = pgTable("chapterNotes", {
  id: varchar("id", { length: 256 }).primaryKey(),
  courseId: varchar().notNull(),
  chapterId: integer().notNull(),
  notes: text(),
});

export const STUDY_TYPE_CONTENT_TABLE = pgTable("studyTypeContent", {
  id: varchar("id", { length: 256 }).primaryKey(),
  courseId: varchar().notNull(),
  content: json(),
  type: varchar().notNull(),
  status: varchar().default("Generating"),
});

export const PAYMENT_RECORD_TABLE = pgTable("paymentRecord", {
  id: varchar("id", { length: 256 }).primaryKey(),
  customerId: varchar(),
  sessionId: varchar(),
});
