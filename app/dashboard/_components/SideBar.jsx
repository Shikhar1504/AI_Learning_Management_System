"use client";
import { CourseCountContext } from "@/app/_context/CourseCountContext";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import { 
  LayoutDashboard, 
  Shield, 
  UserCircle, 
  Plus,
  GraduationCap,
  Zap,
  TrendingUp,
  Menu,
  X
} from "lucide-react";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { useContext, useState, useEffect } from "react";
import { useUser } from "@clerk/nextjs";

function SideBar() {
  const MenuList = [
    {
      name: "Dashboard",
      icon: LayoutDashboard,
      path: "/dashboard",
      gradient: "from-blue-500 to-cyan-500"
    },
    {
      name: "Profile",
      icon: UserCircle,
      path: "/dashboard/profile",
      gradient: "from-green-500 to-teal-500"
    },
    {
      name: "Upgrade",
      icon: Shield,
      path: "/dashboard/upgrade",
      gradient: "from-purple-500 to-pink-500"
    },
  ];
  const { totalCourse, setTotalCourse } = useContext(CourseCountContext);
  const { user } = useUser();
  const path = usePathname();
  const router = useRouter();
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const [userStats, setUserStats] = useState({
    isMember: false,
    dailyCoursesRemaining: 10,
    dailyCoursesCreated: 0,
    canCreateCourse: true
  });

  // Fetch user data
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

  const maxDailyCourses = userStats.isMember ? 999 : 10;
  const progressPercentage = ((userStats.dailyCoursesCreated || 0) / maxDailyCourses) * 100;

  // Handle mobile menu close on route change
  useEffect(() => {
    setIsMobileMenuOpen(false);
  }, [path]);

  // Handle escape key for mobile menu
  useEffect(() => {
    const handleEscape = (e) => {
      if (e.key === 'Escape') setIsMobileMenuOpen(false);
    };
    if (isMobileMenuOpen) {
      document.addEventListener('keydown', handleEscape);
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = 'unset';
    }
    return () => {
      document.removeEventListener('keydown', handleEscape);
      document.body.style.overflow = 'unset';
    };
  }, [isMobileMenuOpen]);

  // Mobile Menu Button Component
  const MobileMenuButton = () => (
    <button
      className="lg:hidden fixed top-4 left-4 z-50 p-2 rounded-lg bg-white/10 backdrop-blur-sm border border-white/20 shadow-lg hover:bg-white/20 transition-colors"
      onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
      aria-label="Toggle mobile menu"
    >
      {isMobileMenuOpen ? (
        <X className="h-6 w-6 text-foreground" />
      ) : (
        <Menu className="h-6 w-6 text-foreground" />
      )}
    </button>
  );

  // Sidebar Content Component
  const SidebarContent = () => (
    <div className="h-full flex flex-col relative">
      {/* Brand Section */}
      <div className="mb-6">
        <div className="flex items-center gap-3 px-2 mb-3">
          <div className="p-2 rounded-xl bg-gradient-to-br from-purple-500 to-blue-600 shadow-lg">
            <GraduationCap className="h-6 w-6 text-white" />
          </div>
          <div className="flex-1">
            <h1 className="text-xl font-bold text-gradient-primary font-display">LearnForge</h1>
            <p className="text-xs text-muted-foreground font-medium">AI Learning Platform</p>
          </div>
        </div>
      </div>

      {/* Create Course Button */}
      <div className="mb-6">
        <Button
          className="w-full btn-primary h-12 text-base font-semibold shadow-xl active:scale-95 transition-transform"
          onClick={() => {
            if (!userStats.canCreateCourse) {
              router.push("/dashboard/upgrade");
            } else {
              router.push("/create");
            }
            setIsMobileMenuOpen(false);
          }}
        >
          <Plus className="h-5 w-5 mr-2" /> 
          Create AI Course
        </Button>
      </div>

      {/* Navigation Menu */}
      <nav className="flex-1 space-y-2">
        <h3 className="text-xs font-semibold text-muted-foreground uppercase tracking-wider px-3 mb-4">
          Navigation
        </h3>
        {MenuList.map((menu, index) => {
          const isActive = path === menu.path;
          return (
            <Link href={menu.path} key={index}>
              <div
                className={`group relative flex items-center gap-3 p-3 rounded-xl transition-all duration-300 hover:bg-white/10 active:scale-95 ${
                  isActive 
                    ? "bg-white/10 border border-white/20 shadow-lg" 
                    : "hover:border hover:border-white/10"
                }`}
              >
                <div className={`p-2 rounded-lg transition-all duration-300 ${
                  isActive 
                    ? `bg-gradient-to-r ${menu.gradient} shadow-lg`
                    : "bg-white/5 group-hover:bg-white/10"
                }`}>
                  <menu.icon className={`h-4 w-4 transition-colors ${
                    isActive ? "text-white" : "text-muted-foreground group-hover:text-foreground"
                  }`} />
                </div>
                <span className={`text-sm font-medium transition-colors ${
                  isActive ? "text-foreground" : "text-muted-foreground group-hover:text-foreground"
                }`}>
                  {menu.name}
                </span>
                {isActive && (
                  <div className="absolute right-3 w-2 h-2 rounded-full bg-gradient-to-r from-purple-400 to-blue-400 animate-pulse" />
                )}
              </div>
            </Link>
          );
        })}
      </nav>

      {/* Course Limit Progress */}
      <div className="mt-auto">
        <div className="modern-card p-4 border border-white/10">
          <div className="flex items-center gap-3 mb-4">
            <div className="p-2 rounded-lg bg-gradient-to-r from-purple-500/20 to-blue-500/20">
              <Zap className="h-4 w-4 text-purple-400" />
            </div>
            <div>
              <h3 className="text-sm font-semibold text-foreground">
                {userStats.isMember ? "Unlimited Access" : "Daily Course Credits"}
              </h3>
              <p className="text-xs text-muted-foreground">
                {userStats.isMember ? "Premium Member" : "Resets every 24 hours"}
              </p>
            </div>
          </div>
          
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <span className="text-sm text-muted-foreground">Used Today</span>
              <span className="text-sm font-semibold text-foreground">
                {userStats.dailyCoursesCreated}/{userStats.isMember ? "∞" : maxDailyCourses}
              </span>
            </div>
            
            {!userStats.isMember && (
              <>
                <div className="relative">
                  <div className="w-full bg-white/5 rounded-full h-2">
                    <div 
                      className={`h-full rounded-full transition-all duration-500 ${
                        progressPercentage > 80 
                          ? "bg-gradient-to-r from-red-500 to-orange-500" 
                          : "bg-gradient-to-r from-purple-500 to-blue-500"
                      }`}
                      style={{ width: `${Math.min(progressPercentage, 100)}%` }}
                    />
                  </div>
                </div>
                
                <div className="flex items-center justify-between text-xs">
                  <span className="text-muted-foreground">{userStats.dailyCoursesRemaining} remaining today</span>
                  <span className={`font-medium ${
                    progressPercentage > 80 ? "text-red-400" : "text-muted-foreground"
                  }`}>
                    {Math.min(progressPercentage, 100).toFixed(0)}%
                  </span>
                </div>
              </>
            )}
            
            {userStats.isMember && (
              <div className="text-center py-2">
                <span className="text-xs text-green-400 font-medium">✨ Unlimited Daily Course Creation</span>
              </div>
            )}
          </div>

          {!userStats.isMember && (
            <Link href="/dashboard/upgrade">
              <Button 
                className="w-full mt-4 btn-accent h-10 text-sm font-semibold active:scale-95 transition-transform"
                onClick={() => setIsMobileMenuOpen(false)}
              >
                <TrendingUp className="h-4 w-4 mr-2" />
                Upgrade Plan
              </Button>
            </Link>
          )}
        </div>
      </div>
    </div>
  );

  return (
    <>
      {/* Mobile Menu Button */}
      <MobileMenuButton />
      
      {/* Desktop Sidebar */}
      <div className="hidden lg:flex h-screen glass-card border-r border-white/10 p-6 flex-col relative w-80">
        <SidebarContent />
      </div>

      {/* Mobile Sidebar Overlay */}
      {isMobileMenuOpen && (
        <div 
          className="lg:hidden fixed inset-0 z-40 bg-black/50 backdrop-blur-sm"
          onClick={() => setIsMobileMenuOpen(false)}
        />
      )}

      {/* Mobile Sidebar */}
      <div className={`lg:hidden fixed top-0 left-0 h-full w-80 max-w-[85vw] z-40 glass-card border-r border-white/10 p-6 transform transition-transform duration-300 ease-in-out ${
        isMobileMenuOpen ? 'translate-x-0' : '-translate-x-full'
      }`}>
        <SidebarContent />
      </div>
    </>
  );
}

export default SideBar;
