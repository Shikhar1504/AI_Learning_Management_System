"use client";
import React, { useState, useEffect } from 'react';
import { useUser } from '@clerk/nextjs';
import { 
  TrendingUp, 
  BookOpen, 
  Clock, 
  Target, 
  Flame, 
  CheckCircle,
  AlertCircle,
  Plus
} from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Progress } from '@/components/ui/progress';
import { Badge } from '@/components/ui/badge';
import { cn } from '@/lib/utils';

/**
 * Simplified Progress Dashboard - Focus on AI LMS essentials
 */
const ProgressDashboard = ({ className = "" }) => {
  const { user } = useUser();
  const [stats, setStats] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  // Fetch user statistics
  useEffect(() => {
    const fetchStats = async () => {
      if (!user?.primaryEmailAddress?.emailAddress) return;

      try {
        setLoading(true);
        setError(null);
        
        const response = await fetch(`/api/users/${user.primaryEmailAddress.emailAddress}/stats`);
        if (!response.ok) {
          throw new Error('Failed to fetch user statistics');
        }
        
        const data = await response.json();
        setStats(data);
      } catch (err) {
        console.error('Error fetching stats:', err);
        setError(err.message);
      } finally {
        setLoading(false);
      }
    };

    fetchStats();
  }, [user?.primaryEmailAddress?.emailAddress]);

  if (loading) {
    return (
      <div className={cn("space-y-4", className)}>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          {[...Array(3)].map((_, i) => (
            <Card key={i} className="animate-pulse">
              <CardHeader className="pb-2">
                <div className="h-4 bg-gray-300 rounded w-3/4"></div>
              </CardHeader>
              <CardContent>
                <div className="h-8 bg-gray-300 rounded w-1/2 mb-2"></div>
                <div className="h-3 bg-gray-300 rounded w-full"></div>
              </CardContent>
            </Card>
          ))}
        </div>
      </div>
    );
  }

  if (error || !stats) {
    return (
      <div className={cn("space-y-4", className)}>
        <Card className="border-red-200 bg-red-50 dark:bg-red-950 dark:border-red-800">
          <CardContent className="pt-6">
            <div className="flex items-center gap-2 text-red-600 dark:text-red-400">
              <AlertCircle className="h-5 w-5" />
              <span>Unable to load statistics. Please try again later.</span>
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  const getStreakStatus = () => {
    const { streakInfo } = stats;
    switch (streakInfo?.status) {
      case 'active':
        return { color: 'text-green-600', bg: 'bg-green-100', message: 'Keep it up!' };
      case 'at-risk':
        return { color: 'text-yellow-600', bg: 'bg-yellow-100', message: 'Study today!' };
      case 'lost':
        return { color: 'text-red-600', bg: 'bg-red-100', message: 'Restart streak' };
      default:
        return { color: 'text-gray-600', bg: 'bg-gray-100', message: 'Start learning' };
    }
  };

  const streakStatus = getStreakStatus();

  return (
    <div className={cn("space-y-6", className)}>
      {/* Essential Statistics */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        {/* AI Courses */}
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium flex items-center gap-2">
              <BookOpen className="h-4 w-4 text-blue-500" />
              AI Courses
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.courseCount}</div>
            <p className="text-xs text-muted-foreground mt-1">
              {stats.completedCourses} completed
            </p>
          </CardContent>
        </Card>

        {/* Learning Streak */}
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium flex items-center gap-2">
              <Flame className="h-4 w-4 text-orange-500" />
              Learning Streak
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.streak} days</div>
            <div className={cn(
              "text-xs px-2 py-1 rounded-full mt-2 inline-block",
              stats.streakInfo?.status === 'active' ? 'bg-green-100 text-green-600' :
              stats.streakInfo?.status === 'at-risk' ? 'bg-yellow-100 text-yellow-600' :
              'bg-gray-100 text-gray-600'
            )}>
              {stats.streakInfo?.status === 'active' ? 'Keep it up!' :
               stats.streakInfo?.status === 'at-risk' ? 'Study today!' :
               'Start learning'}
            </div>
          </CardContent>
        </Card>

        {/* Overall Progress */}
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium flex items-center gap-2">
              <CheckCircle className="h-4 w-4 text-green-500" />
              Completed Courses
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.completedCoursesWithProgress || 0}</div>
            <p className="text-xs text-muted-foreground mt-1">
              {stats.completedCoursesWithProgress === 1 ? '1 course' : `${stats.completedCoursesWithProgress || 0} courses`} at 100%
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Current Goal - Only if exists */}
      {stats.goalProgress && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Target className="h-5 w-5" />
              Current Goal
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <h4 className="font-medium">{stats.goalProgress.title || 'Learning Goal'}</h4>
                {stats.goalProgress.isCompleted && (
                  <Badge variant="success" className="flex items-center gap-1">
                    <CheckCircle className="h-3 w-3" />
                    Completed
                  </Badge>
                )}
              </div>
              <div className="space-y-2">
                <div className="flex items-center justify-between text-sm">
                  <span>Progress</span>
                  <span>{stats.goalProgress.currentProgress}/{stats.goalProgress.target}</span>
                </div>
                <Progress value={stats.goalProgress.progressPercentage} />
              </div>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
};

/**
 * Compact Progress Dashboard - Simplified version for smaller spaces
 */
export const CompactProgressDashboard = ({ className = "" }) => {
  const { user } = useUser();
  const [stats, setStats] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchStats = async () => {
      if (!user?.primaryEmailAddress?.emailAddress) return;

      try {
        const response = await fetch(`/api/users/${user.primaryEmailAddress.emailAddress}/stats`);
        if (response.ok) {
          const data = await response.json();
          setStats(data);
        }
      } catch (err) {
        console.error('Error fetching compact stats:', err);
      } finally {
        setLoading(false);
      }
    };

    fetchStats();
  }, [user?.primaryEmailAddress?.emailAddress]);

  if (loading || !stats) {
    return (
      <div className={cn("animate-pulse space-y-2", className)}>
        <div className="h-4 bg-gray-300 rounded w-3/4"></div>
        <div className="h-2 bg-gray-300 rounded w-full"></div>
      </div>
    );
  }

  return (
    <div className={cn("space-y-3", className)}>
      <div className="flex items-center justify-between">
        <div className="text-lg font-semibold">
          Learning Progress
        </div>
        <Badge variant="outline">{stats.progress}% complete</Badge>
      </div>
      
      <div className="grid grid-cols-2 gap-2 text-xs">
        <div className="text-center">
          <div className="font-medium">{stats.courseCount}</div>
          <div className="text-muted-foreground">AI courses</div>
        </div>
        <div className="text-center">
          <div className="font-medium">{stats.streak}</div>
          <div className="text-muted-foreground">day streak</div>
        </div>
      </div>
    </div>
  );
};

export default ProgressDashboard;