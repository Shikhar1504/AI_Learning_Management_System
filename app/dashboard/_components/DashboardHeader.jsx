"use client";
import { Button } from "@/components/ui/button";
import { UserButton, useUser } from "@clerk/nextjs";
import { 
  GraduationCap, 
  ArrowLeft, 
  Plus, 
  Menu,
  X,
  Shield,
  LayoutDashboard,
  UserCircle,
  Zap
} from "lucide-react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { useState, useEffect } from "react";

function DashboardHeader() {
  const path = usePathname();
  const { user } = useUser();
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const [userStats, setUserStats] = useState({
    isMember: false,
    dailyCoursesRemaining: 10,
    dailyCoursesCreated: 0,
    canCreateCourse: true
  });
  
  // Fetch user data for credits display
  useEffect(() => {
    const fetchUserData = async () => {
      if (!user?.primaryEmailAddress?.emailAddress) return;
      
      try {
        const response = await fetch(`/api/users/${user.primaryEmailAddress.emailAddress}/stats`);
        if (response.ok) {
          const data = await response.json();
          setUserStats({
            isMember: data.isMember || false,
            dailyCoursesRemaining: data.dailyCoursesRemaining || 10,
            dailyCoursesCreated: data.dailyCoursesCreated || 0,
            canCreateCourse: data.canCreateCourse || true
          });
        }
      } catch (error) {
        console.error("Failed to fetch user data:", error);
      }
    };
    
    fetchUserData();
  }, [user?.primaryEmailAddress?.emailAddress]);
  
  const getPageTitle = () => {
    if (path.includes("profile")) return "Profile Settings";
    if (path.includes("upgrade")) return "Upgrade Plan";
    if (path.includes("/course/")) return "Course Details";
    if (path.includes("/create")) return "Create AI Course";
    return "Dashboard";
  };

  return (
    <header className="sticky top-0 z-50 glass-card border-b border-white/10 backdrop-blur-xl">
      <div className="flex items-center justify-between p-4 lg:px-6">
        {/* Mobile Menu Button & Logo */}
        <div className="flex items-center gap-4">
          <Button
            variant="ghost"
            size="sm"
            className="md:hidden p-2 hover:bg-white/10"
            onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
          >
            {isMobileMenuOpen ? (
              <X className="h-5 w-5 text-foreground" />
            ) : (
              <Menu className="h-5 w-5 text-foreground" />
            )}
          </Button>
          
          {/* Mobile Logo */}
          <Link href="/dashboard" className="md:hidden">
            <div className="flex items-center gap-2">
              <div className="p-1.5 rounded-lg bg-gradient-to-br from-purple-500 to-blue-600">
                <GraduationCap className="h-5 w-5 text-white" />
              </div>
              <span className="font-bold text-gradient-primary text-lg font-display">
                LearnForge
              </span>
            </div>
          </Link>
        </div>

        {/* Desktop Navigation & Page Title */}
        <div className="hidden md:flex items-center gap-4 flex-1 max-w-2xl mx-8">
          {path !== "/dashboard" && (
            <>
              <Link href="/dashboard">
                <Button 
                  variant="ghost" 
                  size="sm" 
                  className="text-muted-foreground hover:text-foreground hover:bg-white/10 transition-all"
                >
                  <ArrowLeft className="h-4 w-4 mr-2" /> 
                  Back
                </Button>
              </Link>
              <div className="h-6 w-px bg-white/20" />
            </>
          )}
          
          <div className="flex-1">
            <h1 className="text-xl font-semibold text-foreground font-display">
              {getPageTitle()}
            </h1>
            <p className="text-sm text-muted-foreground mt-0.5">
              {path === "/dashboard" 
                ? "Manage your AI learning journey" 
                : "Continue creating and learning"
              }
            </p>
          </div>
        </div>

        {/* Right Side Actions */}
        <div className="flex items-center gap-3">
          {/* Create Course Button */}
          <Link href="/create">
            <Button className="btn-primary h-9 px-4 text-sm font-semibold hidden sm:flex">
              <Plus className="h-4 w-4 mr-2" /> 
              Create AI Course
            </Button>
          </Link>
          
          {/* Mobile Create Button */}
          <Link href="/create" className="sm:hidden">
            <Button size="sm" className="btn-primary p-2">
              <Plus className="h-4 w-4" />
            </Button>
          </Link>
          
          {/* User Profile */}
          <div className="ml-2">
            <UserButton 
              afterSignOutUrl="/"
              appearance={{
                elements: {
                  avatarBox: "h-9 w-9 rounded-xl border-2 border-purple-400/50 hover:border-purple-400 transition-all shadow-lg",
                  userButtonPopoverCard: "glass-card border border-white/20",
                  userButtonPopoverActionButton: "hover:bg-white/10"
                }
              }}
            />
          </div>
        </div>
      </div>
      
      {/* Mobile Menu Overlay */}
      {isMobileMenuOpen && (
        <div className="md:hidden glass-card border-t border-white/10 p-4">
          <div className="space-y-3">
            <Link href="/create" onClick={() => setIsMobileMenuOpen(false)}>
              <div className="flex items-center gap-3 p-3 rounded-xl hover:bg-white/10 transition-all">
                <Plus className="h-4 w-4" />
                <span className="text-sm font-medium">Create AI Course</span>
              </div>
            </Link>
            <Link href="/dashboard" onClick={() => setIsMobileMenuOpen(false)}>
              <div className="flex items-center gap-3 p-3 rounded-xl hover:bg-white/10 transition-all">
                <LayoutDashboard className="h-4 w-4" />
                <span className="text-sm font-medium">Dashboard</span>
              </div>
            </Link>
            <Link href="/dashboard/profile" onClick={() => setIsMobileMenuOpen(false)}>
              <div className="flex items-center gap-3 p-3 rounded-xl hover:bg-white/10 transition-all">
                <UserCircle className="h-4 w-4" />
                <span className="text-sm font-medium">Profile</span>
              </div>
            </Link>
            <Link href="/dashboard/upgrade" onClick={() => setIsMobileMenuOpen(false)}>
              <div className="flex items-center gap-3 p-3 rounded-xl hover:bg-white/10 transition-all">
                <Shield className="h-4 w-4" />
                <span className="text-sm font-medium">Upgrade</span>
              </div>
            </Link>
            
            {/* Credits Section */}
            <div className="border-t border-white/10 pt-3 mt-3">
              <div className="flex items-center gap-3 p-3 rounded-xl bg-white/5">
                <div className="p-2 rounded-lg bg-gradient-to-r from-purple-500/20 to-blue-500/20">
                  <Zap className="h-4 w-4 text-purple-400" />
                </div>
                <div className="flex-1">
                  <div className="text-sm font-semibold text-foreground">
                    {userStats.isMember ? "Unlimited Access" : "Daily Credits"}
                  </div>
                  <div className="text-xs text-muted-foreground">
                    {userStats.isMember ? "Premium Member" : `${userStats.dailyCoursesRemaining} remaining today`}
                  </div>
                </div>
                <div className="text-sm font-semibold text-foreground">
                  {userStats.dailyCoursesCreated}/{userStats.isMember ? "∞" : "10"}
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
    </header>
  );
}

export default DashboardHeader;
