"use client";
import { SignIn, useAuth } from "@clerk/nextjs";
import { GraduationCap, Sparkles, BookOpen, Brain } from "lucide-react";
import { useEffect } from "react";
import { useRouter } from "next/navigation";

export default function Page() {
  const { isSignedIn } = useAuth();
  const router = useRouter();

  // Redirect signed-in users to the dashboard
  useEffect(() => {
    if (isSignedIn) {
      router.push("/dashboard");
    }
  }, [isSignedIn, router]);

  return (
    <div className="min-h-screen flex items-center justify-center relative overflow-hidden px-4 py-8 sm:p-6 sm:py-12">
      {/* Background Elements */}
      <div className="absolute inset-0 -z-10">
        <div className="absolute top-0 left-0 w-48 h-48 sm:w-64 sm:h-64 lg:w-96 lg:h-96 bg-purple-600/10 rounded-full blur-3xl animate-pulse" />
        <div className="absolute top-1/2 right-0 w-48 h-48 sm:w-64 sm:h-64 lg:w-96 lg:h-96 bg-blue-600/10 rounded-full blur-3xl animate-pulse delay-1000" />
        <div className="absolute bottom-0 left-1/3 w-48 h-48 sm:w-64 sm:h-64 lg:w-96 lg:h-96 bg-pink-600/5 rounded-full blur-3xl animate-pulse delay-2000" />
      </div>

      {/* Main Container */}
      <div className="flex flex-col lg:flex-row max-w-7xl w-full mx-auto gap-10 lg:gap-16 xl:gap-20 items-center justify-center">
        {/* Left Side - Branding */}
        <div className="flex-1 text-center lg:text-left space-y-6 lg:space-y-8 fade-in order-2 lg:order-1">
          {/* Logo */}
          <div className="flex items-center justify-center lg:justify-start gap-3">
            <div className="p-2 sm:p-3 rounded-2xl bg-gradient-to-br from-purple-500/20 to-blue-500/20">
              <GraduationCap className="h-8 w-8 sm:h-10 sm:w-10 text-purple-400" />
            </div>
            <div>
              <h1 className="text-2xl sm:text-3xl font-bold text-gradient-primary font-display">
                LearnForge
              </h1>
              <p className="text-xs sm:text-sm text-muted-foreground font-medium">
                AI Learning Platform
              </p>
            </div>
          </div>

          {/* Hero Content */}
          <div className="space-y-4 lg:space-y-6">
            <div>
              <h2 className="text-2xl sm:text-3xl lg:text-4xl xl:text-5xl font-bold text-foreground mb-3 lg:mb-4 font-display leading-tight">
                Transform Your Learning Journey
              </h2>
              <p className="text-sm sm:text-base lg:text-lg text-muted-foreground max-w-xs sm:max-w-md lg:max-w-lg mx-auto lg:mx-0 leading-relaxed">
                Join thousands of professionals using AI-powered courses to accelerate their career growth and master new skills.
              </p>
            </div>

            {/* Features */}
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 lg:gap-6 pt-6 lg:pt-8">
              <div className="text-center lg:text-left">
                <div className="w-10 h-10 sm:w-12 sm:h-12 rounded-xl bg-gradient-to-br from-purple-500/20 to-blue-500/20 flex items-center justify-center mx-auto lg:mx-0 mb-3">
                  <Brain className="h-5 w-5 sm:h-6 sm:w-6 text-purple-400" />
                </div>
                <h3 className="text-sm sm:text-base font-semibold text-foreground mb-1">AI-Powered</h3>
                <p className="text-xs sm:text-sm text-muted-foreground">Smart content generation</p>
              </div>
              
              <div className="text-center lg:text-left">
                <div className="w-10 h-10 sm:w-12 sm:h-12 rounded-xl bg-gradient-to-br from-blue-500/20 to-cyan-500/20 flex items-center justify-center mx-auto lg:mx-0 mb-3">
                  <BookOpen className="h-5 w-5 sm:h-6 sm:w-6 text-blue-400" />
                </div>
                <h3 className="text-sm sm:text-base font-semibold text-foreground mb-1">Interactive</h3>
                <p className="text-xs sm:text-sm text-muted-foreground">Engaging study materials</p>
              </div>
              
              <div className="text-center lg:text-left">
                <div className="w-10 h-10 sm:w-12 sm:h-12 rounded-xl bg-gradient-to-br from-green-500/20 to-emerald-500/20 flex items-center justify-center mx-auto lg:mx-0 mb-3">
                  <Sparkles className="h-5 w-5 sm:h-6 sm:w-6 text-green-400" />
                </div>
                <h3 className="text-sm sm:text-base font-semibold text-foreground mb-1">Personalized</h3>
                <p className="text-xs sm:text-sm text-muted-foreground">Tailored learning paths</p>
              </div>
            </div>
          </div>
        </div>

        {/* Right Side - Auth Form */}
        <div className="w-full max-w-[350px] sm:max-w-[380px] md:max-w-[420px] lg:flex-shrink-0 scale-in order-1 lg:order-2 mx-auto" style={{ animationDelay: '300ms' }}>
          <div className="bg-white/5 backdrop-blur-md border border-white/10 rounded-2xl shadow-xl p-6 sm:p-7 w-full mx-auto flex flex-col items-center">
            <div className="text-center w-full mb-6">
              <h3 className="text-xl sm:text-2xl font-bold text-white mb-2">
                Welcome Back
              </h3>
              <p className="text-sm text-white/80">
                Sign in to continue your learning journey
              </p>
            </div>

            <SignIn
              appearance={{
                variables: {
                  colorPrimary: "hsl(262 83% 58%)", // Purple primary
                  colorBackground: "transparent",
                  fontFamily: "Inter, system-ui, sans-serif",
                  borderRadius: "0.75rem",
                },
                elements: {
                  card: "shadow-none border-0 bg-transparent p-0",
                  header: "hidden",
                  socialButtonsBlockButton: "bg-white/5 border border-white/10 hover:bg-white/10 transition-all duration-300 text-white font-medium h-10 px-4 rounded-lg w-full flex items-center justify-center text-sm",
                  socialButtonsIconButton: "mr-2",
                  socialButtons: "w-full grid gap-3 mb-4",
                  formButtonPrimary: "bg-gradient-to-r from-purple-600 to-blue-600 hover:from-purple-700 hover:to-blue-700 text-white font-semibold h-11 rounded-xl shadow-lg hover:shadow-xl transition-all duration-300 transform hover:-translate-y-0.5",
                  formFieldInput: "bg-white/5 border border-white/20 focus:border-purple-500 focus:ring-purple-500 rounded-xl text-white placeholder:text-white/50 h-11",
                  formFieldLabel: "text-white font-medium",
                  footerActionLink: "text-purple-400 hover:text-purple-300 transition-colors font-medium",
                  dividerLine: "bg-white/20",
                  dividerText: "text-white/70",
                  formFieldInputShowPasswordButton: "text-muted-foreground hover:text-foreground",
                  formFieldAction: "text-purple-400 hover:text-purple-300",
                  identityPreviewEditButton: "text-purple-400 hover:text-purple-300",
                  formFieldSuccessText: "text-green-400",
                  formFieldErrorText: "text-red-400",
                  alertClerkError: "bg-red-500/10 border border-red-500/20 text-red-400",
                  footer: "text-white mt-4",
                  footerAction: "hidden",
                  footerActionText: "text-white",
                  poweredByClerk: "text-white",
                  poweredByClerkText: "text-white/70",
                  developmentModeWarning: "text-amber-700 bg-amber-500/10 border border-amber-500/20 rounded-lg p-2 mt-4",
                  developmentModeWarningText: "text-amber-700 text-xs",
                },
              }}
              
              signUpUrl="/sign-up"
            />
            
            {/* Custom Sign Up Link */}
            <div className="mt-6 text-center border-t border-white/10 pt-6">
              <p className="text-sm text-white/70">
                Don't have an account?{' '}
                <a href="/sign-up" className="text-purple-400 hover:text-purple-300 transition-colors font-medium">
                  Sign up
                </a>
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}