import {
  boolean,
  integer,
  json,
  pgTable,
  serial,
  text,
  varchar,
  timestamp,
  index,
  unique,
} from "drizzle-orm/pg-core";

export const USER_TABLE = pgTable("users", {
  id: varchar("id", { length: 256 }).primaryKey(),
  name: varchar().notNull(),
  email: varchar().notNull().unique(),
  isMember: boolean().default(false),
  customerId: varchar(),
  // User stats fields
  streak: integer().default(0),
  studyTime: integer().default(0), // in hours
  completedCourses: integer().default(0),
  progress: integer().default(0), // overall progress percentage
  lastStudyDate: timestamp(),
  // Daily course limit tracking
  dailyCoursesCreated: integer().default(0), // courses created today
  lastCourseDate: timestamp(), // last course creation date

  // Quiz optimization fields
  quizTotalAttempts: integer().default(0),
  quizBestScore: integer().default(0),
  quizAverageScore: integer().default(0),
  quizLastScore: integer().default(0),
  quizTotalPercentageSum: integer().default(0),
}, (table) => {
  return {
    emailIdx: index("email_idx").on(table.email),
  };
});

export const STUDY_MATERIAL_TABLE = pgTable("studyMaterial", {
  id: varchar("id", { length: 256 }).primaryKey(),
  courseId: varchar().notNull(),
  courseType: varchar().notNull(),
  topic: varchar().notNull(),
  difficultyLevel: varchar().default("Easy"),
  courseLayout: json(),
  createdBy: varchar().notNull(),
  status: varchar().default("generating"),
  createdAt: timestamp().defaultNow(),
  // NEW FIELDS
  totalTopics: integer().default(0),
  completedTopics: integer().default(0),
  progressPercentage: integer().default(0),
}, (table) => {
  return {
    courseIdIdx: index("course_id_idx").on(table.courseId),
    createdByIdx: index("created_by_idx").on(table.createdBy),
  };
});

export const STUDY_TYPE_CONTENT_TABLE = pgTable("studyTypeContent", {
  id: varchar("id", { length: 256 }).primaryKey(),
  courseId: varchar().notNull(),
  content: json(),
  type: varchar().notNull(),
  status: varchar().default("generating"), // Standardized default
  retryCount: integer().default(0),
  error: text(),
}, (table) => {
  return {
    courseTypeUnique: unique("course_type_unique").on(table.courseId, table.type),
  };
});

export const TOPIC_TABLE = pgTable("topics", {
  id: varchar("id", { length: 256 }).primaryKey(),
  courseId: varchar().notNull(),
  chapterIndex: integer().notNull(),
  topicIndex: integer().notNull(),
  chapterTitle: varchar().notNull(),
  topicTitle: varchar().notNull(),
  notesContent: text(),
  status: varchar().default("pending"), // pending | generating | completed | failed
  error: text(),
  createdAt: timestamp().defaultNow(),
  updatedAt: timestamp().defaultNow(),
}, (table) => {
  return {
    topicCourseIdIdx: index("topic_course_id_idx").on(table.courseId),
  };
});

export const PAYMENT_RECORD_TABLE = pgTable("paymentRecord", {
  id: varchar("id", { length: 256 }).primaryKey(),
  customerId: varchar(),
  sessionId: varchar(),
});

export const QUIZ_ATTEMPT_TABLE = pgTable("quizAttempt", {
  id: varchar("id", { length: 256 }).primaryKey(),
  userId: varchar().notNull(),
  courseId: varchar(), // null for mixed quiz
  score: integer().notNull(),
  totalQuestions: integer().notNull(),
  percentage: integer().notNull(),
  timeTaken: integer(), // seconds
  createdAt: timestamp().defaultNow(),
}, (table) => {
  return {
    userIdx: index("quiz_attempt_user_idx").on(table.userId),
  };
});
