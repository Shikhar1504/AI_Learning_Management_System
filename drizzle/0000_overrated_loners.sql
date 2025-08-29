CREATE TABLE "chapterNotes" (
	"id" serial PRIMARY KEY NOT NULL,
	"courseId" varchar NOT NULL,
	"chapterId" integer NOT NULL,
	"notes" text
);
--> statement-breakpoint
CREATE TABLE "paymentRecord" (
	"id" serial PRIMARY KEY NOT NULL,
	"customerId" varchar,
	"sessionId" varchar
);
--> statement-breakpoint
CREATE TABLE "studyMaterial" (
	"id" serial PRIMARY KEY NOT NULL,
	"courseId" varchar NOT NULL,
	"courseType" varchar NOT NULL,
	"topic" varchar NOT NULL,
	"difficultyLevel" varchar DEFAULT 'Easy',
	"courseLayout" json,
	"createdBy" varchar NOT NULL,
	"status" varchar DEFAULT 'Generating'
);
--> statement-breakpoint
CREATE TABLE "studyTypeContent" (
	"id" serial PRIMARY KEY NOT NULL,
	"courseId" varchar NOT NULL,
	"content" json,
	"type" varchar NOT NULL,
	"status" varchar DEFAULT 'Generating'
);
--> statement-breakpoint
CREATE TABLE "users" (
	"id" serial PRIMARY KEY NOT NULL,
	"name" varchar NOT NULL,
	"email" varchar NOT NULL,
	"isMember" boolean DEFAULT false,
	"customerId" varchar,
	"streak" integer DEFAULT 0,
	"studyTime" integer DEFAULT 0,
	"completedCourses" integer DEFAULT 0,
	"progress" integer DEFAULT 0,
	"lastStudyDate" timestamp,
	"currentGoal" json,
	"preferences" json
);
