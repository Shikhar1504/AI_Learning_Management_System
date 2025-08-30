/**
 * Centralized User Statistics Service
 * Manages all user statistics with proper, coherent logic
 * Handles: streak, studyTime, completedCourses, progress, goals, XP, levels
 */

import { db } from "@/configs/db";
import { STUDY_MATERIAL_TABLE, USER_TABLE } from "@/configs/schema";
import { eq } from "drizzle-orm";

/**
 * Comprehensive User Statistics Service
 */
export class UserStatsService {
  /**
   * Get default user statistics for non-existent users
   * @param {string} userEmail - User email address
   * @returns {Object} Default user statistics
   */
  static getDefaultUserStats(userEmail) {
    return {
      id: null,
      name: userEmail.split("@")[0], // Extract name from email
      email: userEmail,
      isMember: false,
      streak: 0,
      streakInfo: {
        current: 0,
        status: "none",
        daysUntilLoss: 0,
        lastStudyDate: null,
      },
      studyTime: 0,
      studyTimeFormatted: "0 minutes",
      lastStudyDate: null,
      courseCount: 0,
      completedCourses: 0,
      completedCoursesWithProgress: 0,
      coursesInProgress: 0,
      coursesGenerated: 0,
      dailyCoursesCreated: 0,
      dailyCoursesRemaining: 10,
      canCreateCourse: true,
      progress: 0,
      progressBreakdown: {
        courses: { value: 0, description: "0 courses created, 0 completed" },
        studyTime: { value: 0, description: "0 hours of study time" },
        streak: { value: 0, description: "0 day learning streak" },
        experience: { value: 0, description: "0 experience points earned" },
      },
      currentGoal: null,
      goalProgress: null,
      lastLevelUpdate: null,
      preferences: {},
    };
  }

  /**
   * Get complete user statistics with all calculated values
   * @param {string} userEmail - User email address
   * @returns {Promise<Object>} Complete user statistics
   */
  static async getUserStats(userEmail) {
    try {
      // Get user data and course data in parallel
      const [userData, userCourses] = await Promise.all([
        db
          .select()
          .from(USER_TABLE)
          .where(eq(USER_TABLE.email, userEmail))
          .limit(1),
        db
          .select()
          .from(STUDY_MATERIAL_TABLE)
          .where(eq(STUDY_MATERIAL_TABLE.createdBy, userEmail)),
      ]);

      const user = userData[0];
      if (!user) {
        // Return default stats for non-existent users instead of throwing error
        console.log(`User ${userEmail} not found, returning default stats`);
        return this.getDefaultUserStats(userEmail);
      }

      // Calculate course statistics
      const courseStats = this.calculateCourseStats(userCourses);

      // Calculate study streak information
      const streakInfo = this.calculateStreakInfo(user);

      // Calculate completed courses with 100% progress
      const completedCoursesWithProgress =
        await this.calculateCompletedCoursesWithProgress(
          userEmail,
          userCourses
        );

      // Calculate overall progress
      const overallProgress = this.calculateOverallProgress(user, courseStats);

      return {
        // Basic user info
        id: user.id,
        name: user.name,
        email: user.email,
        isMember: user.isMember || false,

        // Streak information
        streak: user.streak || 0,
        streakInfo,

        // Study time information
        studyTime: user.studyTime || 0,
        studyTimeFormatted: this.formatStudyTime(user.studyTime || 0),
        lastStudyDate: user.lastStudyDate,

        // Course information
        courseCount: courseStats.total,
        completedCourses: user.completedCourses || 0, // Legacy field
        completedCoursesWithProgress: completedCoursesWithProgress, // New field based on 100% progress
        coursesInProgress: courseStats.inProgress,
        coursesGenerated: courseStats.generated,

        // Daily course limit information (with fallbacks for missing columns)
        dailyCoursesCreated: user.dailyCoursesCreated ?? 0,
        dailyCoursesRemaining: this.calculateDailyCoursesRemaining(user),
        lastCourseDate: user.lastCourseDate ?? null,
        canCreateCourse: this.canCreateCourse(user),

        // Progress information
        progress: overallProgress,
        progressBreakdown: this.getProgressBreakdown(user, courseStats),

        // Goal information
        currentGoal: user.currentGoal || null,
        goalProgress: this.calculateGoalProgress(user, courseStats),

        // Metadata
        lastLevelUpdate: user.lastLevelUpdate,
        preferences: user.preferences || {},
      };
    } catch (error) {
      console.error("Error getting user stats:", error);
      throw new Error("Failed to retrieve user statistics");
    }
  }

  /**
   * Update user statistics after an activity
   * @param {string} userEmail - User email address
   * @param {Object} activity - Activity data or direct updates
   * @returns {Promise<Object>} Update result
   */
  static async updateUserStats(userEmail, activity) {
    try {
      const user = await db
        .select()
        .from(USER_TABLE)
        .where(eq(USER_TABLE.email, userEmail))
        .limit(1);

      if (!user[0]) {
        // For update operations, we should not create users automatically
        // Let the caller handle user creation if needed
        throw new Error(
          "User not found - please ensure user exists before updating stats"
        );
      }

      const currentUser = user[0];

      // Determine if this is an activity or direct updates
      const isActivity = this.isActivity(activity);

      let updates = {};

      if (isActivity) {
        // Process activity
        const activityUpdates = this.processActivity(currentUser, activity);
        updates = activityUpdates.updates;
      } else {
        // Direct updates to user stats
        updates = this.processDirectUpdates(currentUser, activity);
      }

      // Apply updates to database - ensure all numeric values are integers
      if (Object.keys(updates).length > 0) {
        // Sanitize updates to ensure integer values for integer fields
        const sanitizedUpdates = {};
        for (const [key, value] of Object.entries(updates)) {
          // For known integer fields, ensure they are integers
          const integerFields = [
            "streak",
            "studyTime",
            "completedCourses",
            "progress",
            "experiencePoints",
            "learnerLevel",
            "levelProgress",
            "dailyCoursesCreated",
          ];
          if (integerFields.includes(key)) {
            sanitizedUpdates[key] = Math.round(Number(value)) || 0;
          } else {
            sanitizedUpdates[key] = value;
          }
        }

        await db
          .update(USER_TABLE)
          .set(sanitizedUpdates)
          .where(eq(USER_TABLE.email, userEmail));
      }

      // Get updated stats
      const updatedStats = await this.getUserStats(userEmail);

      return {
        success: true,
        updatedStats,
      };
    } catch (error) {
      console.error("Error updating user stats:", error);
      throw new Error("Failed to update user statistics");
    }
  }

  /**
   * Calculate course statistics from user's courses
   * @param {Array} courses - User's courses
   * @returns {Object} Course statistics
   */
  static calculateCourseStats(courses) {
    const stats = {
      total: Math.round(courses.length),
      generated: 0,
      inProgress: 0,
      completed: 0,
    };

    courses.forEach((course) => {
      switch (course.status?.toLowerCase()) {
        case "ready":
        case "published":
          stats.generated++;
          break;
        case "generating":
        case "in-progress":
          stats.inProgress++;
          break;
        case "completed":
          stats.completed++;
          break;
        default:
          stats.generated++; // Default to generated
      }
    });

    // Ensure all values are integers
    stats.generated = Math.round(stats.generated);
    stats.inProgress = Math.round(stats.inProgress);
    stats.completed = Math.round(stats.completed);

    return stats;
  }

  /**
   * Calculate courses with 100% progress efficiently using database queries
   * @param {string} userEmail - User email address
   * @param {Array} courses - User's courses
   * @returns {Promise<number>} Number of completed courses (100% progress)
   */
  static async calculateCompletedCoursesWithProgress(userEmail, courses) {
    try {
      if (!courses || courses.length === 0) return 0;

      // Import the required tables here to avoid circular imports
      const { CHAPTER_NOTES_TABLE, STUDY_TYPE_CONTENT_TABLE } = await import(
        "@/configs/schema"
      );
      const { eq, and, count } = await import("drizzle-orm");

      // Filter only Ready courses (generating courses can't have progress)
      const readyCourses = courses.filter(
        (course) =>
          course.status?.toLowerCase() === "ready" ||
          course.status?.toLowerCase() === "published"
      );

      if (readyCourses.length === 0) return 0;

      let completedCount = 0;

      // Check progress for each course
      for (const course of readyCourses) {
        try {
          const totalChapters = course.courseLayout?.chapters?.length || 3;

          // Get completed chapters count for this course
          const completedChaptersResult = await db
            .select({ count: count() })
            .from(CHAPTER_NOTES_TABLE)
            .where(eq(CHAPTER_NOTES_TABLE.courseId, course.courseId))
            .catch(() => [{ count: 0 }]); // Fallback on error

          const completedChapters = completedChaptersResult[0]?.count || 0;

          // Get study materials count
          const studyMaterialsResult = await db
            .select({
              type: STUDY_TYPE_CONTENT_TABLE.type,
              count: count(),
            })
            .from(STUDY_TYPE_CONTENT_TABLE)
            .where(
              and(
                eq(STUDY_TYPE_CONTENT_TABLE.courseId, course.courseId),
                eq(STUDY_TYPE_CONTENT_TABLE.status, "Ready")
              )
            )
            .groupBy(STUDY_TYPE_CONTENT_TABLE.type)
            .catch(() => []); // Fallback on error

          // Calculate progress using the same logic as analytics API
          const chapterProgress =
            totalChapters > 0 ? (completedChapters / totalChapters) * 40 : 0;

          // Check if flashcards and quiz exist
          const hasFlashcards = studyMaterialsResult.some(
            (item) => item.type.toLowerCase() === "flashcard"
          );
          const hasQuiz = studyMaterialsResult.some(
            (item) => item.type.toLowerCase() === "quiz"
          );

          const flashcardProgress = hasFlashcards ? 30 : 0;
          const quizProgress = hasQuiz ? 30 : 0;

          const totalProgress = Math.round(
            chapterProgress + flashcardProgress + quizProgress
          );
          const progressPercentage = Math.min(totalProgress, 100);

          // If progress is 100%, count as completed
          if (progressPercentage >= 100) {
            completedCount++;
          }
        } catch (error) {
          console.warn(
            `Failed to calculate progress for course ${course.courseId}:`,
            error.message
          );
          // Continue with next course on error
        }
      }

      return Math.round(completedCount);
    } catch (error) {
      console.error(
        "Error calculating completed courses with progress:",
        error
      );
      return 0; // Fallback to 0 on error
    }
  }

  /**
   * Calculate streak information
   * @param {Object} user - User data
   * @returns {Object} Streak information
   */
  static calculateStreakInfo(user) {
    const streak = Math.round(user.streak || 0);
    const lastStudyDate = user.lastStudyDate;
    const today = new Date();

    let status = "active";
    let daysUntilLoss = 0;

    if (lastStudyDate) {
      const daysSinceLastStudy = Math.floor(
        (today - new Date(lastStudyDate)) / (1000 * 60 * 60 * 24)
      );

      if (daysSinceLastStudy > 1) {
        status = "lost";
      } else if (daysSinceLastStudy === 1) {
        status = "at-risk";
        daysUntilLoss = 1;
      } else {
        status = "active";
        daysUntilLoss = 2;
      }
    } else if (streak === 0) {
      status = "none";
    }

    return {
      current: Math.round(streak),
      status,
      daysUntilLoss: Math.round(daysUntilLoss),
      lastStudyDate: lastStudyDate,
    };
  }

  /**
   * Calculate overall progress based on multiple factors
   * @param {Object} user - User data
   * @param {Object} courseStats - Course statistics
   * @returns {number} Overall progress percentage (0-100)
   */
  static calculateOverallProgress(user, courseStats) {
    const weights = {
      courses: 0.5, // 50% - Course creation and completion
      studyTime: 0.3, // 30% - Study time commitment
      streak: 0.2, // 20% - Consistency (streak)
    };

    // Course progress (0-100)
    const courseProgress = Math.min(
      100,
      courseStats.total * 10 + user.completedCourses * 20
    );

    // Study time progress (0-100, capped at 100 hours = 100%)
    const studyTimeProgress = Math.min(100, user.studyTime || 0);

    // Streak progress (0-100, capped at 30 days = 100%)
    const streakProgress = Math.min(100, Math.round((user.streak || 0) * 3.33));

    // Calculate weighted average
    const overallProgress = Math.round(
      courseProgress * weights.courses +
        studyTimeProgress * weights.studyTime +
        streakProgress * weights.streak
    );

    return Math.round(Math.min(100, Math.max(0, overallProgress)));
  }

  /**
   * Get detailed progress breakdown
   * @param {Object} user - User data
   * @param {Object} courseStats - Course statistics
   * @returns {Object} Progress breakdown
   */
  static getProgressBreakdown(user, courseStats) {
    return {
      courses: {
        value: Math.round(
          Math.min(100, courseStats.total * 10 + user.completedCourses * 20)
        ),
        description: `${courseStats.total} courses created, ${user.completedCourses} completed`,
      },
      studyTime: {
        value: Math.round(Math.min(100, user.studyTime || 0)),
        description: `${user.studyTime || 0} hours of study time`,
      },
      streak: {
        value: Math.round(Math.min(100, Math.round((user.streak || 0) * 3.33))),
        description: `${user.streak || 0} day learning streak`,
      },
      experience: {
        value: Math.round(user.experiencePoints || 0),
        description: `${user.experiencePoints || 0} experience points earned`,
      },
    };
  }

  /**
   * Calculate goal progress
   * @param {Object} user - User data
   * @param {Object} courseStats - Course statistics
   * @returns {Object|null} Goal progress
   */
  static calculateGoalProgress(user, courseStats) {
    if (!user.currentGoal) return null;

    const goal = user.currentGoal;
    let currentProgress = 0;

    // Calculate progress based on goal type
    switch (goal.type) {
      case "courses":
        currentProgress = courseStats.total;
        break;
      case "study_time":
        currentProgress = user.studyTime || 0;
        break;
      case "streak":
        currentProgress = user.streak || 0;
        break;
      case "experience":
        currentProgress = user.experiencePoints || 0;
        break;
      default:
        currentProgress = goal.progress || 0;
    }

    const progressPercentage = goal.target
      ? Math.min(100, Math.round((currentProgress / goal.target) * 100))
      : 0;

    return {
      ...goal,
      currentProgress: Math.round(currentProgress),
      progressPercentage: Math.round(progressPercentage),
      isCompleted: currentProgress >= (goal.target || 0),
    };
  }

  /**
   * Format study time for display
   * @param {number} hours - Hours of study time
   * @returns {string} Formatted study time
   */
  static formatStudyTime(hours) {
    // Ensure hours is a number
    const numericHours = Number(hours) || 0;

    if (numericHours < 1) {
      return `${Math.round(numericHours * 60)} minutes`;
    } else if (numericHours < 24) {
      return `${Math.round(numericHours * 10) / 10} hours`;
    } else {
      const days = Math.floor(numericHours / 24);
      const remainingHours = Math.round(numericHours % 24);
      return `${days}d ${remainingHours}h`;
    }
  }

  /**
   * Process activity and return updates
   * @param {Object} user - Current user data
   * @param {Object} activity - Activity data
   * @returns {Object} Updates
   */
  static processActivity(user, activity) {
    const updates = {};

    // Update streak if daily activity
    if (activity.dailyActivity) {
      const streakUpdate = this.updateStreak(user);
      Object.assign(updates, streakUpdate);
    }

    // Update study time
    if (activity.studyTimeHours) {
      updates.studyTime = Math.round(
        (user.studyTime || 0) + activity.studyTimeHours
      );
    }

    // Update completed courses
    if (activity.courseCompleted) {
      updates.completedCourses = (user.completedCourses || 0) + 1;
    }

    // Update last study date if applicable
    if (activity.dailyActivity || activity.studyTimeHours) {
      updates.lastStudyDate = new Date();
    }

    return { updates };
  }

  /**
   * Process direct updates
   * @param {Object} user - Current user data
   * @param {Object} updates - Direct updates
   * @returns {Object} Processed updates
   */
  static processDirectUpdates(user, updates) {
    const processedUpdates = {};

    // Allow direct updates to specific fields
    const allowedFields = [
      "streak",
      "studyTime",
      "completedCourses",
      "progress",
      "currentGoal",
      "preferences",
      "lastStudyDate",
    ];

    allowedFields.forEach((field) => {
      if (updates[field] !== undefined) {
        // Ensure numeric fields are properly converted to integers
        if (
          ["streak", "studyTime", "completedCourses", "progress"].includes(
            field
          )
        ) {
          processedUpdates[field] = Math.round(Number(updates[field])) || 0;
        } else {
          processedUpdates[field] = updates[field];
        }
      }
    });

    return processedUpdates;
  }

  /**
   * Update streak based on activity
   * @param {Object} user - Current user data
   * @returns {Object} Streak updates
   */
  static updateStreak(user) {
    const today = new Date();
    const lastStudyDate = user.lastStudyDate
      ? new Date(user.lastStudyDate)
      : null;

    if (!lastStudyDate) {
      // First time studying
      return {
        streak: 1,
        lastStudyDate: today,
      };
    }

    const daysSinceLastStudy = Math.floor(
      (today - lastStudyDate) / (1000 * 60 * 60 * 24)
    );

    if (daysSinceLastStudy === 0) {
      // Already studied today, no change
      return {};
    } else if (daysSinceLastStudy === 1) {
      // Consecutive day, increment streak
      return {
        streak: Math.round((user.streak || 0) + 1),
        lastStudyDate: today,
      };
    } else {
      // Streak broken, restart
      return {
        streak: 1,
        lastStudyDate: today,
      };
    }
  }

  /**
   * Update user level based on XP (simplified version)
   * @param {Object} user - Current user data
   * @param {number} xpGained - XP gained from activity
   * @returns {Object} Level updates
   */
  static updateLevel(user, xpGained) {
    const newTotalXP = Math.round((user.experiencePoints || 0) + xpGained);

    // Simple level calculation: 1 level per 100 XP
    const newLevel = Math.floor(newTotalXP / 100) + 1;
    const currentLevel = user.learnerLevel || 1;

    const levelChanged = newLevel !== currentLevel;

    // Calculate progress to next level (0-100)
    const levelProgress = Math.round(newTotalXP % 100);

    return {
      updates: {
        experiencePoints: newTotalXP,
        learnerLevel: newLevel,
        levelProgress: levelProgress,
        lastLevelUpdate: new Date(),
      },
      levelChanged,
    };
  }

  /**
   * Check if the input is an activity or direct updates
   * @param {Object} data - Input data
   * @returns {boolean} True if it's an activity
   */
  static isActivity(data) {
    const activityFields = [
      "courseCreated",
      "courseCompleted",
      "chaptersCompleted",
      "quizzesCompleted",
      "flashcardSessions",
      "studyTimeHours",
      "dailyStreak",
      "weeklyStreak",
      "firstLogin",
      "profileCompleted",
      "goalAchieved",
      "dailyActivity",
    ];

    return activityFields.some((field) => data[field] !== undefined);
  }

  /**
   * Calculate remaining daily courses for user
   * @param {Object} user - User data
   * @returns {number} Remaining courses for today
   */
  static calculateDailyCoursesRemaining(user) {
    const maxDailyCourses = user.isMember ? 999 : 10; // Free: 10, Premium: unlimited
    const todayCoursesUsed = this.getTodayCoursesUsed(user);
    return Math.round(Math.max(0, maxDailyCourses - todayCoursesUsed));
  }

  /**
   * Check if user can create a course today
   * @param {Object} user - User data
   * @returns {boolean} Whether user can create a course
   */
  static canCreateCourse(user) {
    // If columns don't exist yet, allow course creation for backward compatibility
    if (
      user.dailyCoursesCreated === undefined ||
      user.lastCourseDate === undefined
    ) {
      return true;
    }
    return this.calculateDailyCoursesRemaining(user) > 0;
  }

  /**
   * Get number of courses created today
   * @param {Object} user - User data
   * @returns {number} Courses created today
   */
  static getTodayCoursesUsed(user) {
    // If columns don't exist yet, return 0 for backward compatibility
    if (
      user.dailyCoursesCreated === undefined ||
      user.lastCourseDate === undefined
    ) {
      return 0;
    }

    const today = new Date();
    const lastCourseDate = user.lastCourseDate
      ? new Date(user.lastCourseDate)
      : null;

    // Check if we need to reset daily credits (new day)
    if (this.shouldResetDailyCredits(lastCourseDate)) {
      return 0; // Reset to 0 for new day
    }

    // Check if last course was created today
    if (lastCourseDate && this.isSameDay(today, lastCourseDate)) {
      return Math.round(user.dailyCoursesCreated || 0);
    }

    // If not today, reset count
    return 0;
  }

  /**
   * Check if two dates are on the same day
   * @param {Date} date1 - First date
   * @param {Date} date2 - Second date
   * @returns {boolean} Whether dates are on same day
   */
  static isSameDay(date1, date2) {
    return (
      date1.getFullYear() === date2.getFullYear() &&
      date1.getMonth() === date2.getMonth() &&
      date1.getDate() === date2.getDate()
    );
  }

  /**
   * Check if we need to reset daily credits (if it's a new day)
   * @param {Date} lastCourseDate - Last course creation date
   * @returns {boolean} True if credits should be reset
   */
  static shouldResetDailyCredits(lastCourseDate) {
    if (!lastCourseDate) return false;

    const today = new Date();
    const lastDate = new Date(lastCourseDate);

    // If last course was not created today, reset credits
    return !this.isSameDay(today, lastDate);
  }

  /**
   * Update daily course count when a course is created
   * @param {string} userEmail - User email address
   * @returns {Promise<Object>} Update result
   */
  static async incrementDailyCourseCount(userEmail) {
    try {
      const user = await db
        .select()
        .from(USER_TABLE)
        .where(eq(USER_TABLE.email, userEmail))
        .limit(1);

      if (!user[0]) {
        throw new Error(
          "User not found - please ensure user exists before updating daily course count"
        );
      }

      const currentUser = user[0];

      // Check if new columns exist, if not, allow course creation for backward compatibility
      if (
        currentUser.dailyCoursesCreated === undefined ||
        currentUser.lastCourseDate === undefined
      ) {
        console.log(
          "Daily course tracking columns not found, allowing course creation"
        );
        return {
          success: true,
          dailyCoursesCreated: 0,
          dailyCoursesRemaining: 10,
          canCreateMore: true,
          message: "Course tracking pending database migration",
        };
      }

      const today = new Date();
      const lastCourseDate = currentUser.lastCourseDate
        ? new Date(currentUser.lastCourseDate)
        : null;

      let dailyCount = 1;

      // Check if we need to reset daily credits (new day)
      if (this.shouldResetDailyCredits(lastCourseDate)) {
        // New day detected - reset to 1 (first course of the day)
        dailyCount = 1;
        console.log("🔄 Daily credits reset - new day detected");
      } else if (lastCourseDate && this.isSameDay(today, lastCourseDate)) {
        // Same day - increment count
        dailyCount = Math.round((currentUser.dailyCoursesCreated || 0) + 1);
      }

      // Check if user can create course
      const maxDailyCourses = currentUser.isMember ? 999 : 10;
      if (dailyCount > maxDailyCourses) {
        throw new Error(
          `Daily course limit reached. Free users can create ${maxDailyCourses} courses per day.`
        );
      }

      // Update database
      await db
        .update(USER_TABLE)
        .set({
          dailyCoursesCreated: Math.round(dailyCount),
          lastCourseDate: today,
        })
        .where(eq(USER_TABLE.email, userEmail));

      return {
        success: true,
        dailyCoursesCreated: Math.round(dailyCount),
        dailyCoursesRemaining: Math.round(maxDailyCourses - dailyCount),
        canCreateMore: dailyCount < maxDailyCourses,
      };
    } catch (error) {
      console.error("Error incrementing daily course count:", error);
      throw error;
    }
  }
}

export default UserStatsService;
