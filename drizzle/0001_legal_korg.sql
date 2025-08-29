ALTER TABLE "chapterNotes" ALTER COLUMN "id" SET DATA TYPE varchar(256);--> statement-breakpoint
ALTER TABLE "paymentRecord" ALTER COLUMN "id" SET DATA TYPE varchar(256);--> statement-breakpoint
ALTER TABLE "studyMaterial" ALTER COLUMN "id" SET DATA TYPE varchar(256);--> statement-breakpoint
ALTER TABLE "studyTypeContent" ALTER COLUMN "id" SET DATA TYPE varchar(256);--> statement-breakpoint
ALTER TABLE "users" ALTER COLUMN "id" SET DATA TYPE varchar(256);--> statement-breakpoint
ALTER TABLE "users" ADD COLUMN "dailyCoursesCreated" integer DEFAULT 0;--> statement-breakpoint
ALTER TABLE "users" ADD COLUMN "lastCourseDate" timestamp;--> statement-breakpoint
ALTER TABLE "users" ADD COLUMN "experiencePoints" integer DEFAULT 0;--> statement-breakpoint
ALTER TABLE "users" ADD COLUMN "learnerLevel" integer DEFAULT 1;--> statement-breakpoint
ALTER TABLE "users" ADD COLUMN "levelProgress" integer DEFAULT 0;--> statement-breakpoint
ALTER TABLE "users" ADD COLUMN "lastLevelUpdate" timestamp;